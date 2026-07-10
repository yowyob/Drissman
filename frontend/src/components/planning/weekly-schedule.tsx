"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo } from "react";
import type React from "react";

export interface WeeklyEvent {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string;
}

const DAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function getWeekStart(offset: number) {
  const now = new Date();
  const day = (now.getDay() + 6) % 7; // Monday = 0
  const monday = new Date(now);
  monday.setDate(now.getDate() - day + offset * 7);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export function getWeekDatesForOffset(offset: number): string[] {
  const start = getWeekStart(offset);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d.toISOString().split("T")[0];
  });
}

function formatWeekRange(offset: number) {
  const start = getWeekStart(offset);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return `${start.toLocaleDateString("fr-FR")} - ${end.toLocaleDateString("fr-FR")}`;
}

interface WeeklyScheduleProps<T extends WeeklyEvent> {
  events: T[];
  weekOffset: number;
  setWeekOffset: React.Dispatch<React.SetStateAction<number>>;
  emptyLabel: string;
  renderEvent: (event: T) => React.ReactNode;
}

export function WeeklySchedule<T extends WeeklyEvent>({
  events,
  weekOffset,
  setWeekOffset,
  emptyLabel,
  renderEvent,
}: WeeklyScheduleProps<T>) {
  const weekDates = useMemo(() => getWeekDatesForOffset(weekOffset), [weekOffset]);

  const byDay = useMemo(() => {
    return weekDates.map((date) =>
      events
        .filter((event) => event.date === date)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    );
  }, [events, weekDates]);

  const totalWeekEvents = byDay.reduce((acc, list) => acc + list.length, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-mist/60 font-bold uppercase tracking-wider">{formatWeekRange(weekOffset)}</p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset((offset) => offset - 1)}
            className="p-2 rounded-xl bg-white/5 text-mist hover:text-snow transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setWeekOffset((offset) => offset + 1)}
            className="p-2 rounded-xl bg-white/5 text-mist hover:text-snow transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {totalWeekEvents === 0 ? (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-8 text-sm text-mist/50 text-center">
          {emptyLabel}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-7 gap-3">
          {weekDates.map((date, index) => (
            <div key={date} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] overflow-hidden">
              <div className="px-3 py-2 border-b border-white/[0.06]">
                <p className="text-xs font-black text-snow">{DAY_LABELS[index]}</p>
                <p className="text-[10px] text-mist/50">{new Date(`${date}T00:00:00`).toLocaleDateString("fr-FR")}</p>
              </div>
              <div className="p-2 space-y-2 min-h-[120px]">
                {byDay[index].length === 0 ? (
                  <div className="text-[10px] text-mist/30 px-1 py-3 text-center">Aucune seance</div>
                ) : (
                  byDay[index].map((event) => renderEvent(event))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
