import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function GuestForm({ values, errors, onChange }) {
  const field = (name, label, props = {}) => (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        value={values[name]}
        onChange={(event) => onChange(name, event.target.value)}
        aria-invalid={Boolean(errors[name])}
        aria-describedby={errors[name] ? `${name}-error` : undefined}
        {...props}
      />
      {errors[name] && (
        <p id={`${name}-error`} className="text-xs font-medium text-rose-600">
          {errors[name]}
        </p>
      )}
    </div>
  );

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold text-slate-900">Guest details</h2>
      {field("name", "Full name", { autoComplete: "name", placeholder: "Alex Rivera" })}
      {field("email", "Email", {
        type: "email",
        autoComplete: "email",
        placeholder: "alex@example.com",
      })}
      {field("phone", "Phone", {
        type: "tel",
        autoComplete: "tel",
        placeholder: "(555) 123-4567",
      })}
    </section>
  );
}
