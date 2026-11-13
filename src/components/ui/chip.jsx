import * as React from "react";
import { cn } from "@/lib/utils";

const Chip = React.forwardRef(({ active = false, className, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    aria-pressed={active}
    className={cn(
      "rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      active
        ? "border-primary bg-primary/10 text-primary"
        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
      className
    )}
    {...props}
  />
));
Chip.displayName = "Chip";

export { Chip };
