import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="px-6 py-24 text-center">
      <h1 className="text-2xl font-bold text-slate-900">Page not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        That page took a weekend off.
      </p>
      <Button asChild className="mt-6">
        <Link to="/">Back to Explore</Link>
      </Button>
    </div>
  );
}
