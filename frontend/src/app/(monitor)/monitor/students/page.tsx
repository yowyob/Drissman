"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, TrendingUp, Users } from "lucide-react";
import { PageTransition } from "@/components/ui/motion";
import { useAuth } from "@/hooks";
import { monitorService, type MonitorStudentProgressDto } from "@/lib/monitor-service";
import { toast } from "sonner";

export default function MonitorStudentsPage() {
  const { token } = useAuth();
  const [students, setStudents] = useState<MonitorStudentProgressDto[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!token) return;
    void monitorService
      .getMyStudents(token)
      .then(setStudents)
      .catch((error: any) => toast.error(error.message || "Chargement des eleves impossible"));
  }, [token]);

  const filtered = useMemo(
    () => students.filter((s) => s.studentName.toLowerCase().includes(searchQuery.toLowerCase())),
    [students, searchQuery],
  );

  return (
    <PageTransition className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-snow">Mes Eleves</h1>
          <p className="text-sm text-mist mt-0.5">{students.length} eleve(s) assigne(s)</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mist/30" />
          <input
            type="text"
            placeholder="Chercher un eleve..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/[0.06] text-snow text-sm placeholder:text-mist/30 w-56"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white/[0.03] rounded-2xl border border-white/[0.06]">
          <Users className="h-16 w-16 text-mist/15 mb-4" />
          <h3 className="text-lg font-bold text-snow/60 mb-1">Aucun eleve assigne</h3>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((student) => {
            const progress = student.hoursPurchased > 0 ? Math.round((student.hoursConsumed / student.hoursPurchased) * 100) : 0;
            return (
              <div key={student.enrollmentId} className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-signal/20 to-blue-500/20 flex items-center justify-center text-signal font-bold text-xs shrink-0">
                    {student.studentName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-snow">{student.studentName}</h3>
                    <p className="text-xs text-mist/50">{student.offerName}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-signal transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
                      </div>
                      <span className="text-[10px] font-mono text-mist/40 shrink-0">{student.hoursConsumed}/{student.hoursPurchased}h</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 text-xs text-mist/40 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> {progress}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageTransition>
  );
}
