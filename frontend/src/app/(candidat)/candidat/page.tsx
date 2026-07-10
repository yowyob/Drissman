"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, CalendarDays, Clock, TrendingUp } from "lucide-react";
import { PageTransition } from "@/components/ui/motion";
import { useAuth } from "@/hooks";
import { enrollmentService, type CandidateSessionDto, type EnrollmentDto } from "@/lib/enrollment-service";
import { toast } from "sonner";

export default function CandidatDashboard() {
  const { user, token } = useAuth();
  const [enrollments, setEnrollments] = useState<EnrollmentDto[]>([]);
  const [sessions, setSessions] = useState<CandidateSessionDto[]>([]);

  const loadDashboardData = useCallback(async () => {
    if (!token) return;
    try {
      const [enrollmentsData, sessionsData] = await Promise.all([
        enrollmentService.getMyEnrollments(token),
        enrollmentService.getMySessions(token),
      ]);
      setEnrollments(enrollmentsData);
      setSessions(sessionsData);
    } catch {
      toast.error("Chargement impossible");
    }
  }, [token]);

  useEffect(() => {
    void loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void loadDashboardData();
    }, 15000);

    const onFocus = () => {
      void loadDashboardData();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void loadDashboardData();
      }
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [loadDashboardData]);

  const activeEnrollment = useMemo(
    () => enrollments.find((e) => e.status === "ACTIVE" || e.status === "PENDING"),
    [enrollments],
  );
  const upcomingSessions = useMemo(
    () =>
      sessions
        .filter((s) => s.status !== "COMPLETED" && s.status !== "CANCELLED")
        .sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`)),
    [sessions],
  );

  const nextSession = upcomingSessions[0];
  const now = new Date();
  const dayIndex = (now.getDay() + 6) % 7;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - dayIndex);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const sessionsThisWeek = sessions.filter((s) => {
    if (!["SCHEDULED", "CONFIRMED", "IN_PROGRESS"].includes(s.status)) return false;
    const date = new Date(`${s.date}T00:00:00`);
    return date >= weekStart && date <= weekEnd;
  }).length;
  const hoursCompleted = activeEnrollment?.hoursConsumed ?? 0;
  const hoursRequired = activeEnrollment?.hours ?? 0;
  const progress = hoursRequired > 0 ? Math.min(100, Math.round((hoursCompleted / hoursRequired) * 100)) : 0;

  return (
    <PageTransition className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-snow">Bienvenue, {user?.firstName}</h1>
        <p className="text-mist mt-1">Suivez votre parcours de formation.</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-2xl border border-blue-500/20 p-5">
          <Clock className="h-5 w-5 text-blue-400 opacity-60 mb-2" />
          <p className="text-2xl font-black text-snow">{hoursCompleted}/{hoursRequired}h</p>
          <p className="text-xs text-mist/60">Heures effectuees</p>
        </div>
        <div className="bg-gradient-to-br from-signal/10 to-amber-500/5 rounded-2xl border border-signal/20 p-5">
          <CalendarDays className="h-5 w-5 text-signal opacity-60 mb-2" />
          <p className="text-2xl font-black text-snow">{sessionsThisWeek}</p>
          <p className="text-xs text-mist/60">Seances cette semaine</p>
        </div>
        <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-2xl border border-green-500/20 p-5">
          <TrendingUp className="h-5 w-5 text-green-400 opacity-60 mb-2" />
          <p className="text-2xl font-black text-snow">{progress}%</p>
          <p className="text-xs text-mist/60">Progression globale</p>
        </div>
      </div>

      <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-6">
        <h2 className="text-lg font-black text-snow mb-4">Prochaine seance</h2>
        {nextSession ? (
          <div className="flex items-center gap-4 p-4 rounded-xl bg-signal/5 border border-signal/20">
            <div className="text-center min-w-[68px]">
              <p className="text-sm font-mono font-bold text-signal">{nextSession.startTime}</p>
              <p className="text-[10px] text-mist/40">{nextSession.date}</p>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-snow">{nextSession.offerName}</p>
              <p className="text-xs text-mist/50">{nextSession.monitorName} · {nextSession.meetingPoint || "Lieu a definir"}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-mist/50">Aucune seance programmee</p>
        )}
      </div>

      <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-6">
        <h2 className="text-lg font-black text-snow mb-4">Ma Formule</h2>
        {activeEnrollment ? (
          <div className="flex items-center gap-4">
            <div className="bg-blue-500/10 p-3 rounded-xl"><BookOpen className="h-6 w-6 text-blue-400" /></div>
            <div className="flex-1">
              <p className="text-sm font-bold text-snow">{activeEnrollment.offerName}</p>
              <p className="text-xs text-mist/60">Permis {activeEnrollment.permitType} · {activeEnrollment.hours}h</p>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${activeEnrollment.status === "ACTIVE" ? "bg-green-500/10 text-green-400" : "bg-signal/10 text-signal"}`}>
              {activeEnrollment.status}
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <p className="text-sm text-mist/50">Pas encore inscrit a une formule</p>
            <Link href="/candidat/catalogue" className="mt-3 flex items-center gap-1 text-xs font-bold text-signal bg-signal/10 px-4 py-2 rounded-xl hover:bg-signal/20 transition-all">
              Parcourir le catalogue <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
