"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock, MapPin, User } from "lucide-react";
import { PageTransition } from "@/components/ui/motion";
import { useAuth } from "@/hooks";
import { enrollmentService, type CandidateSessionDto } from "@/lib/enrollment-service";
import { WeeklySchedule, getWeekDatesForOffset } from "@/components/planning/weekly-schedule";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; class: string }> = {
  SCHEDULED: { label: "Planifie", class: "bg-blue-500/10 text-blue-400" },
  CONFIRMED: { label: "Confirme", class: "bg-signal/10 text-signal" },
  IN_PROGRESS: { label: "En cours", class: "bg-amber-500/10 text-amber-400" },
  COMPLETED: { label: "Termine", class: "bg-green-500/10 text-green-400" },
  CANCELLED: { label: "Annule", class: "bg-red-500/10 text-red-400" },
  NO_SHOW: { label: "Absence", class: "bg-red-500/10 text-red-400" },
};

export default function CandidatPlanningPage() {
  const { token } = useAuth();
  const [sessions, setSessions] = useState<CandidateSessionDto[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    if (!token) return;
    void enrollmentService
      .getMySessions(token)
      .then((data) =>
        setSessions(
          data.sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`)),
        ),
      )
      .catch((error: any) => toast.error(error.message || "Chargement planning impossible"));
  }, [token]);

  const upcoming = useMemo(
    () => sessions.filter((s) => s.status !== "COMPLETED" && s.status !== "CANCELLED"),
    [sessions],
  );
  const weekDates = getWeekDatesForOffset(weekOffset);
  const weekUpcoming = useMemo(() => upcoming.filter((s) => weekDates.includes(s.date)), [upcoming, weekDates]);
  const past = useMemo(() => sessions.filter((s) => s.status === "COMPLETED"), [sessions]);

  return (
    <PageTransition className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-snow">Mon Planning</h1>
        <p className="text-sm text-mist mt-0.5">{weekUpcoming.length} seance(s) cette semaine</p>
      </div>

      <div>
        <h2 className="text-sm font-bold text-signal mb-3 uppercase tracking-wider">Emploi du Temps</h2>
        <WeeklySchedule
          events={upcoming.map((session) => ({ ...session, id: session.sessionId }))}
          weekOffset={weekOffset}
          setWeekOffset={setWeekOffset}
          emptyLabel="Aucune seance programmee"
          renderEvent={(s) => {
            const st = statusConfig[s.status] || statusConfig.SCHEDULED;
            return (
              <div key={s.id} className="bg-white/[0.02] rounded-xl border border-white/[0.08] p-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-black text-signal">{s.startTime} - {s.endTime}</p>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${st.class}`}>{st.label}</span>
                </div>
                <p className="text-[11px] font-bold text-snow truncate">{s.offerName}</p>
                <p className="text-[10px] text-mist/50 flex items-center gap-1 truncate">
                  <User className="h-3 w-3" />
                  {s.monitorName}
                </p>
                <p className="text-[10px] text-mist/50 flex items-center gap-1 truncate">
                  <MapPin className="h-3 w-3" />
                  {s.meetingPoint || "Lieu a definir"}
                </p>
                <p className="text-[10px] text-mist/50 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {s.date}
                </p>
              </div>
            );
          }}
        />
      </div>

      <div>
        <h2 className="text-sm font-bold text-mist/40 mb-3 uppercase tracking-wider">Historique</h2>
        {past.length === 0 ? (
          <p className="text-xs text-mist/30">Vos seances terminees apparaitront ici</p>
        ) : (
          <div className="space-y-2">
            {past.map((s) => (
              <div key={s.sessionId} className="bg-white/[0.02] rounded-xl border border-white/[0.04] p-3 flex items-center gap-4 opacity-70">
                <span className="text-xs text-mist/40 font-mono min-w-[80px] text-center">{s.date}</span>
                <div className="flex-1"><p className="text-sm text-mist">{s.offerName} · {s.monitorName}</p></div>
                <span className="bg-green-500/10 text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-lg">Termine</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
