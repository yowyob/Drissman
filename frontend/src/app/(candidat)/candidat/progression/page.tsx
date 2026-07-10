"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle, Clock, Target } from "lucide-react";
import { PageTransition } from "@/components/ui/motion";
import { useAuth } from "@/hooks";
import { enrollmentService, type EnrollmentDto } from "@/lib/enrollment-service";
import { toast } from "sonner";

export default function CandidatProgressionPage() {
  const { token } = useAuth();
  const [enrollments, setEnrollments] = useState<EnrollmentDto[]>([]);

  useEffect(() => {
    if (!token) return;
    void enrollmentService
      .getMyEnrollments(token)
      .then(setEnrollments)
      .catch((error: any) => toast.error(error.message || "Chargement progression impossible"));
  }, [token]);

  const active = useMemo(() => enrollments.find((e) => e.status === "ACTIVE" || e.status === "PENDING"), [enrollments]);
  const hoursCompleted = active?.hoursConsumed ?? 0;
  const hoursRequired = active?.hours ?? 0;
  const globalProgress = hoursRequired > 0 ? Math.round((hoursCompleted / hoursRequired) * 100) : 0;

  return (
    <PageTransition className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-snow">Ma Progression</h1>
        <p className="text-sm text-mist mt-0.5">Synchronisee avec vos seances validees</p>
      </div>

      <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-snow">Progression globale</h2>
          <span className="text-2xl font-black text-signal">{globalProgress}%</span>
        </div>
        <div className="h-3 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-signal to-amber-400 rounded-full transition-all" style={{ width: `${Math.min(globalProgress, 100)}%` }} />
        </div>
        <p className="text-xs text-mist/40 mt-3">{hoursCompleted} heures sur {hoursRequired} heures requises</p>
      </div>

      {!active ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Target className="h-16 w-16 text-mist/15 mb-4" />
          <h3 className="text-lg font-bold text-snow/60 mb-1">Aucune inscription active</h3>
        </div>
      ) : (
        <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-snow">{active.offerName}</h3>
              <p className="text-xs text-mist/50">Permis {active.permitType}</p>
            </div>
            {globalProgress >= 100 ? (
              <span className="flex items-center gap-1 text-[10px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-lg"><CheckCircle className="h-3 w-3" /> Complete</span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-bold text-signal bg-signal/10 px-2 py-0.5 rounded-lg"><Clock className="h-3 w-3" /> En cours</span>
            )}
          </div>
        </div>
      )}
    </PageTransition>
  );
}
