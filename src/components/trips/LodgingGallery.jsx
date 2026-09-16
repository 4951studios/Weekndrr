import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import SafeImage from "@/components/SafeImage";
import { cn } from "@/lib/utils";

export default function LodgingGallery({ photos = [], alt }) {
  const [index, setIndex] = useState(0);
  const slides = photos.length ? photos : [null];

  const go = (delta) =>
    setIndex((current) => (current + delta + slides.length) % slides.length);

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-200">
      <SafeImage
        key={index}
        src={slides[index]}
        alt={`${alt} — photo ${index + 1} of ${slides.length}`}
        className="h-full w-full object-cover"
      />

      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous photo"
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow backdrop-blur transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronLeft className="h-5 w-5 text-slate-700" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next photo"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow backdrop-blur transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronRight className="h-5 w-5 text-slate-700" aria-hidden="true" />
          </button>

          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
            {slides.map((_, dotIndex) => (
              <button
                key={dotIndex}
                type="button"
                onClick={() => setIndex(dotIndex)}
                aria-label={`Go to photo ${dotIndex + 1}`}
                aria-current={dotIndex === index}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  dotIndex === index ? "w-5 bg-white" : "w-1.5 bg-white/60"
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
