import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

export default function WeekendPicker({ weekends, selectedId, onSelect }) {
  return (
    <section aria-labelledby="weekend-picker-label">
      <div className="mb-3 flex items-center gap-2">
        <Calendar className="h-4 w-4 text-primary" aria-hidden="true" />
        <h2 id="weekend-picker-label" className="text-sm font-semibold text-slate-900">
          When do you want to go?
        </h2>
      </div>

      <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
        {weekends.map((weekend) => {
          const isActive = weekend.id === selectedId;
          return (
            <button
              key={weekend.id}
              type="button"
              onClick={() => onSelect(weekend.id)}
              aria-pressed={isActive}
              className={cn(
                "min-w-[140px] shrink-0 rounded-2xl border p-3 text-left transition-all",
                isActive
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-slate-200 bg-white hover:border-slate-300"
              )}
            >
              <span
                className={cn(
                  "block text-sm font-semibold",
                  isActive ? "text-primary" : "text-slate-900"
                )}
              >
                {weekend.label}
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {weekend.range}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
