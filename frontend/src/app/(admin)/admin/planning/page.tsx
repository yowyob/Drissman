"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Users } from "lucide-react";
import { toast } from "sonner";
import { useAuth, useLocalStorage } from "@/hooks";
import { adminSessionService, type AvailableOfferDto, type SessionEnrollmentOptionDto, type SessionDto } from "@/lib/admin-session-service";
import { adminMonitorService, type AdminMonitorDto } from "@/lib/admin-monitor-service";
import { adminModuleService, type AdminModuleDto } from "@/lib/admin-module-service";
import { WeeklySchedule } from "@/components/planning/weekly-schedule";

interface ModuleItem {
  id: string;
  name: string;
  lessons?: Array<{ id: string; name: string }>;
}
type ModuleLessonsMap = Record<string, Array<{ id: string; name: string }>>;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string | undefined | null): value is string {
  return Boolean(value && UUID_REGEX.test(value));
}

const emptyForm = {
  date: "",
  startTime: "09:00",
  endTime: "10:00",
  offerId: "",
  enrollmentId: "",
  monitorId: "",
  meetingPoint: "",
  moduleId: "",
  lessonId: "",
};

export default function PlanningPage() {
  const { token } = useAuth();
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [lessonsByModule, setLessonsByModule] = useLocalStorage<ModuleLessonsMap>("module_lessons_map", {});
  const [form, setForm] = useState(emptyForm);
  const [offers, setOffers] = useState<AvailableOfferDto[]>([]);
  const [enrollments, setEnrollments] = useState<SessionEnrollmentOptionDto[]>([]);
  const [monitors, setMonitors] = useState<AdminMonitorDto[]>([]);
  const [createdSessions, setCreatedSessions] = useState<SessionDto[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const selectedModule = useMemo(() => modules.find((m) => m.id === form.moduleId), [modules, form.moduleId]);
  const availableLessons = selectedModule?.lessons || [];

  useEffect(() => {
    // Normalize old local lessons IDs that were not UUID to avoid backend 400 on session creation.
    const normalized = Object.fromEntries(
      Object.entries(lessonsByModule).map(([moduleId, lessons]) => [
        moduleId,
        (lessons || []).map((lesson) => ({
          ...lesson,
          id: isUuid(lesson.id) ? lesson.id : crypto.randomUUID(),
        })),
      ]),
    );
    const changed = JSON.stringify(normalized) !== JSON.stringify(lessonsByModule);
    if (changed) {
      setLessonsByModule(normalized);
    }
  }, [lessonsByModule, setLessonsByModule]);

  useEffect(() => {
    if (!token) return;
    void adminModuleService
      .list(token)
      .then((data: AdminModuleDto[]) =>
        setModules(
          data.map((m) => ({
            id: m.id,
            name: m.name,
            lessons: lessonsByModule[m.id] || [],
          })),
        ),
      )
      .catch((error: unknown) => {
        console.error(error);
        toast.error("Impossible de charger les modules");
      });
  }, [token, lessonsByModule]);

  useEffect(() => {
    if (!token) return;
    void adminMonitorService
      .list(token)
      .then((data) => setMonitors(data.filter((m) => m.status === "ACTIVE")))
      .catch((error: any) => toast.error(error.message || "Impossible de charger les moniteurs"));
  }, [token]);

  useEffect(() => {
    if (!token || !form.date) {
      setOffers([]);
      return;
    }
    setLoadingOffers(true);
    void adminSessionService
      .availableOffers(form.date, token)
      .then((data) => setOffers(data))
      .catch((error: any) => toast.error(error.message || "Impossible de charger les offres disponibles"))
      .finally(() => setLoadingOffers(false));
  }, [token, form.date]);

  useEffect(() => {
    if (!token || !form.date || !form.offerId) {
      setEnrollments([]);
      return;
    }
    setLoadingEnrollments(true);
    void adminSessionService
      .availableEnrollments(form.offerId, form.date, token)
      .then((data) => setEnrollments(data))
      .catch((error: any) => toast.error(error.message || "Impossible de charger les eleves eligibles"))
      .finally(() => setLoadingEnrollments(false));
  }, [token, form.date, form.offerId]);

  const createSession = async () => {
    if (!token) return;
    if (!form.date) return toast.error("Date obligatoire");
    if (!form.offerId) return toast.error("Offre obligatoire");
    if (!form.monitorId) return toast.error("Moniteur obligatoire");
    if (!form.startTime || !form.endTime || form.startTime >= form.endTime) return toast.error("Plage horaire invalide");
    if (availableLessons.length > 0 && !form.lessonId) return toast.error("Lecon obligatoire");
    if (enrollments.length === 0) return toast.error("Aucun eleve eligible pour cette offre a cette date");

    setSubmitting(true);
    try {
      const results = await Promise.allSettled(
        enrollments.map((enrollment) =>
          adminSessionService.create(
            {
              enrollmentId: enrollment.enrollmentId,
              monitorId: form.monitorId,
              moduleId: isUuid(form.moduleId) ? form.moduleId : undefined,
              lessonId: isUuid(form.lessonId) ? form.lessonId : undefined,
              date: form.date,
              startTime: form.startTime,
              endTime: form.endTime,
              meetingPoint: form.meetingPoint,
            },
            token,
          ),
        ),
      );

      const successSessions = results
        .filter((r): r is PromiseFulfilledResult<SessionDto> => r.status === "fulfilled")
        .map((r) => r.value);
      const failedCount = results.length - successSessions.length;

      if (successSessions.length > 0) {
        setCreatedSessions((prev) => [...successSessions, ...prev]);
      }
      setForm((prev) => ({ ...emptyForm, date: prev.date, offerId: prev.offerId, monitorId: prev.monitorId, meetingPoint: prev.meetingPoint, moduleId: prev.moduleId, lessonId: prev.lessonId }));

      if (successSessions.length > 0 && failedCount === 0) {
        toast.success(`${successSessions.length} seance(s) programmee(s)`);
      } else if (successSessions.length > 0) {
        toast.warning(`${successSessions.length} seance(s) creee(s), ${failedCount} echec(s)`);
      } else {
        toast.error("Creation impossible pour les eleves selectionnes");
      }
    } catch (error: any) {
      toast.error(error.message || "Creation impossible");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-snow">Planning</h1>
        <p className="text-sm text-mist mt-0.5">Creation de seance liee a une offre disponible dans la periode selectionnee</p>
      </div>

      <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-6 space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-mist uppercase tracking-wider">Date *</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) =>
                setForm((p) => ({ ...p, date: e.target.value, offerId: "", enrollmentId: "" }))
              }
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-snow text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-mist uppercase tracking-wider">Offre disponible *</label>
            <select
              value={form.offerId}
              onChange={(e) => setForm((p) => ({ ...p, offerId: e.target.value, enrollmentId: "" }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-snow text-sm"
            >
              <option value="" className="bg-asphalt">
                {loadingOffers ? "Chargement..." : "Selectionner une offre"}
              </option>
              {offers.map((offer) => (
                <option key={offer.offerId} value={offer.offerId} className="bg-asphalt">
                  {offer.offerName} - Permis {offer.permitType}
                </option>
              ))}
            </select>
            {form.date && !loadingOffers && offers.length === 0 && (
              <p className="text-[10px] text-yellow-400/80">Aucune offre disponible sur cette periode/session.</p>
            )}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-mist uppercase tracking-wider">Eleves concernes</label>
            <div className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-snow text-sm">
              {form.offerId ? (loadingEnrollments ? "Chargement..." : `${enrollments.length} eleve(s) eligible(s)`) : "Selectionnez une offre"}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-mist uppercase tracking-wider">Moniteur *</label>
            <select
              value={form.monitorId}
              onChange={(e) => setForm((p) => ({ ...p, monitorId: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-snow text-sm"
            >
              <option value="" className="bg-asphalt">
                Selectionner un moniteur
              </option>
              {monitors.map((monitor) => (
                <option key={monitor.id} value={monitor.id} className="bg-asphalt">
                  {monitor.firstName} {monitor.lastName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-mist uppercase tracking-wider">Module</label>
            <select
              value={form.moduleId}
              onChange={(e) => setForm((p) => ({ ...p, moduleId: e.target.value, lessonId: "" }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-snow text-sm"
            >
              <option value="" className="bg-asphalt">Selectionner un module</option>
              {modules.map((module) => (
                <option key={module.id} value={module.id} className="bg-asphalt">{module.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-mist uppercase tracking-wider">Lecon</label>
            <select
              value={form.lessonId}
              onChange={(e) => setForm((p) => ({ ...p, lessonId: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-snow text-sm"
            >
              <option value="" className="bg-asphalt">{availableLessons.length > 0 ? "Selectionner une lecon" : "Aucune lecon"}</option>
              {availableLessons.map((lesson) => (
                <option key={lesson.id} value={lesson.id} className="bg-asphalt">{lesson.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          <input type="time" value={form.startTime} onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-snow text-sm" />
          <input type="time" value={form.endTime} onChange={(e) => setForm((p) => ({ ...p, endTime: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-snow text-sm" />
          <input type="text" value={form.meetingPoint} onChange={(e) => setForm((p) => ({ ...p, meetingPoint: e.target.value }))} placeholder="Lieu de rendez-vous" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-snow text-sm" />
        </div>

        <button
          onClick={() => void createSession()}
          disabled={submitting}
          className="flex items-center gap-2 bg-gradient-to-r from-signal to-amber-400 text-asphalt font-bold px-5 py-2.5 rounded-xl text-sm hover:opacity-90 transition-all shadow-lg shadow-signal/20 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> {submitting ? "Creation..." : "Programmer les seances"}
        </button>
      </div>

      <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-6">
        <h2 className="text-base font-black text-snow mb-3">Emploi du Temps Hebdomadaire</h2>
        <WeeklySchedule
          events={createdSessions.map((session) => ({ ...session, id: session.id }))}
          weekOffset={weekOffset}
          setWeekOffset={setWeekOffset}
          emptyLabel="Aucune creation sur cette semaine."
          renderEvent={(session) => (
            <div key={session.id} className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-2">
              <p className="text-[11px] font-black text-signal">{session.startTime} - {session.endTime}</p>
              <p className="text-[10px] text-mist/60 flex items-center gap-1">
                <Users className="h-3 w-3" /> {session.status}
              </p>
            </div>
          )}
        />
      </div>
    </div>
  );
}
