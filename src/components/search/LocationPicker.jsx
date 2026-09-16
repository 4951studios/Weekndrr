import { useMemo, useState } from "react";
import { Check, LocateFixed, MapPin, Search } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const POPULAR_CITIES = [
  "Atlanta",
  "Austin",
  "Boston",
  "Chicago",
  "Dallas",
  "Denver",
  "Houston",
  "Las Vegas",
  "Los Angeles",
  "Miami",
  "Minneapolis",
  "Nashville",
  "New York",
  "Philadelphia",
  "Phoenix",
  "Portland",
  "San Diego",
  "San Francisco",
  "Seattle",
  "Washington, D.C.",
];

export default function LocationPicker({
  open,
  onOpenChange,
  value,
  onSelect,
  onDetect,
}) {
  const [query, setQuery] = useState("");

  const cities = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return POPULAR_CITIES;
    return POPULAR_CITIES.filter((city) => city.toLowerCase().includes(q));
  }, [query]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent aria-describedby="location-picker-description">
        <SheetHeader>
          <SheetTitle>Where are you leaving from?</SheetTitle>
          <SheetDescription id="location-picker-description">
            Pick your departure city to price flights and drives.
          </SheetDescription>
        </SheetHeader>

        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search cities"
            className="pl-9"
            aria-label="Search cities"
          />
        </div>

        <ul className="-mx-1 flex-1 overflow-y-auto">
          {onDetect && (
            <li>
              <button
                type="button"
                onClick={() => {
                  onDetect();
                  onOpenChange(false);
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-primary transition-colors hover:bg-primary/5"
              >
                <LocateFixed className="h-4 w-4 shrink-0" aria-hidden="true" />
                Use my current location
              </button>
            </li>
          )}
          {cities.map((city) => {
            const isActive = city === value;
            return (
              <li key={city}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(city);
                    onOpenChange(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition-colors hover:bg-slate-50",
                    isActive && "bg-primary/5 text-primary"
                  )}
                >
                  <MapPin className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                  <span className="flex-1 font-medium">{city}</span>
                  {isActive && <Check className="h-4 w-4" aria-hidden="true" />}
                </button>
              </li>
            );
          })}
          {cities.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">
              No cities match “{query}”.
            </li>
          )}
        </ul>
      </SheetContent>
    </Sheet>
  );
}
