import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold",
  {
    variants: {
      variant: {
        coral: "bg-brand-coral text-white shadow",
        success: "bg-emerald-500 text-white shadow",
        danger: "bg-rose-500 text-white shadow",
        primary: "bg-primary text-primary-foreground shadow",
        soft: "bg-primary/10 text-primary",
        neutral: "bg-slate-100 text-slate-700",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
);

function Badge({ className, variant, ...props }) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
