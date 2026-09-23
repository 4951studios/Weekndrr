import { MapPinned } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

const PRESETS = [
  { label: "100 mi", value: 100 },
  { label: "250 mi", value: 250 },
  { label: "500 mi", value: 500 },
  { label: "1,000 mi", value: 1000 },
];

const SLIDER_MIN = 50;
const SLIDER_MAX = 2000;

export default function DistanceSlider({ value, onChange }) {
  const unlimited = value === null;
  const selectedValue = value ?? SLIDER_MAX;

  const update = (next) => {
    onChange(next);
  };

  const toggleUnlimited = () => {
    onChange(unlimited ? selectedValue : null);
  };

  return (
    <section aria-labelledby="distance-label">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MapPinned className="h-4 w-4 text-primary" aria-hidden="true" />
          <h2 id="distance-label" className="text-sm font-semibold text-slate-900">
            Max distance from your location
          </h2>
        </div>
        <span className="text-sm font-bold text-primary">
          {unlimited ? "Anywhere" : `${selectedValue.toLocaleString("en-US")} mi`}
        </span>
      </div>

      <Slider
        value={[selectedValue]}
        min={SLIDER_MIN}
        max={SLIDER_MAX}
        step={50}
        disabled={unlimited}
        onValueChange={([next]) => update(next)}
        aria-label="Maximum distance from your location in miles"
      />

      <div className="mt-4 flex gap-2">
        {PRESETS.map((preset) => {
          const isActive = !unlimited && value === preset.value;
          return (
            <button
              key={preset.value}
              type="button"
              onClick={() => update(preset.value)}
              aria-pressed={isActive}
              className={cn(
                "flex-1 rounded-xl border px-2 py-2 text-xs font-medium transition-colors",
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
          onClick={toggleUnlimited}
          aria-pressed={unlimited}
          className={cn(
            "flex-1 rounded-xl border px-2 py-2 text-xs font-medium transition-colors",
            unlimited
              ? "border-brand-navy bg-brand-navy text-white"
              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
          )}
        >
          Anywhere
        </button>
      </div>
    </section>
  );
}