import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TRIP_TYPES = [
  { label: "City", value: "city" },
  { label: "Beach", value: "beach" },
  { label: "Nature", value: "nature" },
];

const LODGING_TYPES = [
  { label: "Hotel", value: "hotel" },
  { label: "Rental", value: "rental" },
];

const TRAVEL_TIMES = [
  { label: "Under 2h", value: 2 },
  { label: "Under 3h", value: 3 },
  { label: "Under 5h", value: 5 },
  { label: "Any", value: null },
];

function Chip({ active, children, ...props }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function toggleValue(list, value) {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

export default function FilterChips({
  open,
  onOpenChange,
  tripTypes,
  setTripTypes,
  lodgingTypes,
  setLodgingTypes,
  maxTravelTime,
  setMaxTravelTime,
  onClear,
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent aria-describedby="filters-description">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription id="filters-description">
            Narrow down the weekend that fits you.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 overflow-y-auto">
          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-slate-900">
              Trip type
            </legend>
            <div className="flex flex-wrap gap-2">
              {TRIP_TYPES.map((option) => (
                <Chip
                  key={option.value}
                  active={tripTypes.includes(option.value)}
                  onClick={() => setTripTypes(toggleValue(tripTypes, option.value))}
                >
                  {option.label}
                </Chip>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-slate-900">
              Lodging
            </legend>
            <div className="flex flex-wrap gap-2">
              {LODGING_TYPES.map((option) => (
                <Chip
                  key={option.value}
                  active={lodgingTypes.includes(option.value)}
                  onClick={() =>
                    setLodgingTypes(toggleValue(lodgingTypes, option.value))
                  }
                >
                  {option.label}
                </Chip>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-slate-900">
              Max travel time
            </legend>
            <div className="flex flex-wrap gap-2">
              {TRAVEL_TIMES.map((option) => (
                <Chip
                  key={option.label}
                  active={maxTravelTime === option.value}
                  onClick={() => setMaxTravelTime(option.value)}
                >
                  {option.label}
                </Chip>
              ))}
            </div>
          </fieldset>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClear}>
            Clear
          </Button>
          <Button className="flex-1" onClick={() => onOpenChange(false)}>
            Show results
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
