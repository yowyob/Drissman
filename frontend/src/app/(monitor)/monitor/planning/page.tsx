"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle, MapPin } from "lucide-react";
import { PageTransition } from "@/components/ui/motion";
import { useAuth } from "@/hooks";
import { monitorService, type MonitorSessionViewDto } from "@/lib/monitor-service";
import { WeeklySchedule, getWeekDatesForOffset } from "@/components/planning/weekly-schedule";
import { toast } from "sonner";
import { cachedGet } from "@/lib/offline/offline-fetch";
import { enqueue } from "@/lib/offline/sync";
import { probeBackend } from "@/lib/offline/network";

export default function MonitorPlanningPage() {
  const { token, user } = useAuth();
  const [fromCache, setFromCache] = useState(false);
  const [sessions, setSessions] = useState<MonitorSessionViewDto[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadSessions = async () => {
    if (!token) return;
    setLoading(true);
    try {
      // Network First avec repli sur le dernier planning synchronise (24 h).
      const result = await cachedGet(user?.id ?? "anon", "monitor-sessions",
        () => monitorService.getMySessions(token));
      setSessions(result.data);
      setFromCache(result.fromCache);
    } catch (error: any) {
      toast.error(error.message || "Chargement planning impossible");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSessions();
  }, [token]);

  const weekDates = getWeekDatesForOffset(weekOffset);
  const weekSessions = useMemo(
    () => sessions.filter((s) => weekDates.includes(s.date) && s.status !== "CANCELLED"),
    [sessions, weekDates],
  );

  const markCompleted = async (id: string) => {
    if (!token) return;
    const session = sessions.find((s) => s.sessionId === id);
    const online = await probeBackend();
    if (!online) {
      // Hors ligne : validation locale, envoyee a la reconnexion (idempotente).
      await enqueue({
        type: "SESSION_COMPLETE",
        payload: { sessionId: id, baseStatus: session?.status },
        userId: user?.id ?? "anon",
        label: `Validation seance du ${session?.date ?? "?"}`,
      });
      setSessions((prev) => prev.map((s) => (s.sessionId === id ? { ...s, status: "COMPLETED" } : s)));
      toast.info("Seance validee localement — en attente de synchronisation");
      return;
    }
    try {
      await monitorService.completeSession(id, undefined, token);
      await loadSessions();
      toast.success("Seance validee");
    } catch (error: any) {
      toast.error(error.message || "Validation impossible");
    }
  };

  return (
    <PageTransition className="space-y-8">
      <div>
        <div>
          <h1 className="text-2xl font-black text-snow">Mon Planning</h1>
          <p className="text-sm text-mist mt-0.5">
            {weekSessions.length} seance(s) cette semaine
            {fromCache && <span className="ml-2 text-amber-400">· donnees du dernier acces (hors ligne)</span>}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-mist/60">Chargement...</div>
      ) : (
        <WeeklySchedule
          events={weekSessions.map((session) => ({ ...session, id: session.sessionId }))}
          weekOffset={weekOffset}
          setWeekOffset={setWeekOffset}
          emptyLabel="Aucune seance cette semaine"
          renderEvent={(s) => (
            <div key={s.id} className={`rounded-xl border p-2 ${s.status === "COMPLETED" ? "opacity-60 border-green-500/20 bg-green-500/[0.05]" : "border-white/[0.08] bg-white/[0.02]"}`}>
              <p className="text-[11px] font-black text-signal">{s.startTime} - {s.endTime}</p>
              <p className="text-[11px] font-bold text-snow truncate">{s.offerName}</p>
              <p className="text-[10px] text-mist/50 truncate">{s.studentName}</p>
              <p className="text-[10px] text-mist/50 flex items-center gap-1 truncate">
                <MapPin className="h-3 w-3" />
                {s.meetingPoint || "Lieu a definir"}
              </p>
              {s.status !== "COMPLETED" && (
                <button
                  onClick={() => void markCompleted(s.sessionId)}
                  className="mt-2 w-full flex items-center justify-center gap-1 text-[10px] font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded-lg hover:bg-green-500/20 transition-all"
                >
                  <CheckCircle className="h-3 w-3" /> Valider
                </button>
              )}
            </div>
          )}
        />
      )}
    </PageTransition>
  );
}
