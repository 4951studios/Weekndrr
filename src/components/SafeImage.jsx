import { useEffect, useState } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

/** Image with a neutral gradient fallback so a dead URL never shows a broken icon. */
export default function SafeImage({ src, alt, className, imgClassName, ...props }) {
  const [failed, setFailed] = useState(!src);

  useEffect(() => {
    setFailed(!src);
  }, [src]);

  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          "flex items-center justify-center bg-gradient-to-br from-slate-200 via-slate-300 to-slate-200",
          className
        )}
      >
        <ImageOff className="h-6 w-6 text-slate-400" aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={cn("h-full w-full object-cover", className, imgClassName)}
      {...props}
    />
  );
}
