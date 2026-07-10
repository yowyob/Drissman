"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, CheckCircle, Clock, Users } from "lucide-react";
import { PageTransition } from "@/components/ui/motion";
import { useAuth } from "@/hooks";
import { monitorService, type MonitorSessionViewDto, type MonitorStudentProgressDto } from "@/lib/monitor-service";
import { toast } from "sonner";

export default function MonitorDashboard() {
  const { user, token } = useAuth();
  const [sessions, setSessions] = useState<MonitorSessionViewDto[]>([]);
  const [students, setStudents] = useState<MonitorStudentProgressDto[]>([]);

  const load = async () => {
    if (!token) return;
    try {
      const [sessionsData, studentsData] = await Promise.all([
        monitorService.getMySessions(token),
        monitorService.getMyStudents(token),
      ]);
      setSessions(sessionsData);
      setStudents(studentsData);
    } catch (error: any) {
      toast.error(error.message || "Impossible de charger l'espace moniteur");
    }
  };

  useEffect(() => {
    void load();
  }, [token]);

  const today = new Date().toISOString().split("T")[0];
  const todaySessions = useMemo(() => sessions.filter((s) => s.date === today && s.status !== "CANCELLED"), [sessions, today]);
  const todayHours = todaySessions.reduce((acc, s) => acc + (s.durationHours || 0), 0);

  const markCompleted = async (id: string) => {
    if (!token) return;
    try {
      await monitorService.completeSession(id, undefined, token);
      await load();
      toast.success("Seance validee");
    } catch (error: any) {
      toast.error(error.message || "Validation impossible");
    }
  };

  return (
    <PageTransition className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-snow">Bonjour, {user?.firstName}</h1>
        <p className="text-mist mt-1">Votre journee en un coup d'oeil.</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-signal/10 to-amber-500/5 rounded-2xl border border-signal/20 p-5">
          <CalendarDays className="h-5 w-5 text-signal opacity-60 mb-2" />
          <p className="text-2xl font-black text-snow">{todaySessions.length}</p>
          <p className="text-xs text-mist/60">Seances aujourd'hui</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-2xl border border-blue-500/20 p-5">
          <Users className="h-5 w-5 text-blue-400 opacity-60 mb-2" />
          <p className="text-2xl font-black text-snow">{students.length}</p>
          <p className="text-xs text-mist/60">Eleves assignes</p>
        </div>
        <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-2xl border border-green-500/20 p-5">
          <Clock className="h-5 w-5 text-green-400 opacity-60 mb-2" />
          <p className="text-2xl font-black text-snow">{todayHours}h</p>
          <p className="text-xs text-mist/60">Heures prevues aujourd'hui</p>
        </div>
      </div>

      <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-snow">Seances du jour</h2>
          <Link href="/monitor/planning" className="flex items-center gap-1 text-xs text-signal font-bold hover:underline">
            Voir planning <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {todaySessions.length === 0 ? (
          <p className="text-sm text-mist/50">Aucune seance aujourd'hui</p>
        ) : (
          <div className="space-y-3">
            {todaySessions.map((s) => (
              <div key={s.sessionId} className="flex items-center gap-4 p-3 rounded-xl border bg-white/[0.02] border-white/[0.04]">
                <div className="flex-1">
                  <p className="text-sm font-bold text-snow">{s.offerName}</p>
                  <p className="text-xs text-mist/50">{s.studentName} · {s.meetingPoint || "Lieu a definir"}</p>
                </div>
                <span className="text-xs font-mono text-mist bg-white/5 px-2.5 py-1 rounded-lg">{s.startTime} - {s.endTime}</span>
                {s.status !== "COMPLETED" ? (
                  <button onClick={() => void markCompleted(s.sessionId)} className="flex items-center gap-1 text-[10px] font-bold text-green-400 bg-green-500/10 px-2.5 py-1.5 rounded-lg hover:bg-green-500/20 transition-all">
                    <CheckCircle className="h-3 w-3" /> Valider
                  </button>
                ) : (
                  <span className="text-[10px] font-bold text-green-400/60 bg-green-500/5 px-2.5 py-1.5 rounded-lg">Validee</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
