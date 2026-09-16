import { useEffect, useRef, useState } from "react";
import { Check, DollarSign, Pencil } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

const PRESETS = [
  { label: "$300", value: 300 },
  { label: "$500", value: 500 },
  { label: "$750", value: 750 },
  { label: "$1000+", value: 1000 },
];

const SLIDER_MIN = 100;
const SLIDER_MAX = 1000;

export default function BudgetSlider({ value, onChange }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commit = () => {
    const parsed = Number.parseInt(draft.replace(/\D/g, ""), 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      onChange(Math.min(Math.max(parsed, 50), 100000));
    }
    setEditing(false);
  };

  const isCustom = !PRESETS.some((preset) => preset.value === value);
  const sliderMax = Math.max(SLIDER_MAX, value);

  return (
    <section aria-labelledby="budget-label">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-primary" aria-hidden="true" />
          <h2 id="budget-label" className="text-sm font-semibold text-slate-900">
            Max budget per person
          </h2>
        </div>

        {editing ? (
          <div className="flex items-center gap-1">
            <span className="text-lg font-bold text-primary">$</span>
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onBlur={commit}
              onKeyDown={(event) => {
                if (event.key === "Enter") commit();
                if (event.key === "Escape") {
                  setDraft(String(value));
                  setEditing(false);
                }
              }}
              aria-label="Enter your own maximum budget per person"
              className="w-24 rounded-lg border border-primary/40 bg-white px-2 py-1 text-right text-xl font-bold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={commit}
              aria-label="Apply budget"
              className="rounded-full p-1.5 text-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Check className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setDraft(String(value));
              setEditing(true);
            }}
            aria-label={`Budget is $${value}. Enter a custom amount`}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1 transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="text-2xl font-bold text-primary">
              ${value.toLocaleString("en-US")}
            </span>
            <Pencil className="h-3.5 w-3.5 text-primary/60" aria-hidden="true" />
          </button>
        )}
      </div>

      <Slider
        value={[Math.min(value, sliderMax)]}
        min={SLIDER_MIN}
        max={sliderMax}
        step={50}
        onValueChange={([next]) => onChange(next)}
        aria-label="Max budget per person"
      />

      <div className="mt-4 flex gap-2">
        {PRESETS.map((preset) => {
          const isActive = value === preset.value;
          return (
            <button
              key={preset.value}
              type="button"
              onClick={() => onChange(preset.value)}
              aria-pressed={isActive}
              className={cn(
                "flex-1 rounded-xl border px-2 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "border-brand-navy bg-brand-navy text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              )}
            >
              {preset.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => {
            setDraft(String(value));
            setEditing(true);
          }}
          aria-pressed={isCustom}
          className={cn(
            "flex-1 rounded-xl border px-2 py-2 text-sm font-medium transition-colors",
            isCustom
              ? "border-brand-navy bg-brand-navy text-white"
              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
          )}
        >
          Custom
        </button>
      </div>
    </section>
  );
}
