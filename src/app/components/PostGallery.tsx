import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { signPostImageUrls } from "@/lib/postImages";

export function usePostImageUrls(paths: string[]) {
  return useQuery({
    queryKey: ["post-image-urls", paths.join("|")],
    queryFn: () => signPostImageUrls(paths),
    enabled: paths.length > 0,
    staleTime: 30 * 60 * 1000,
  });
}

export function PostGallery({ paths }: { paths: string[] }) {
  const { data: urls = [] } = usePostImageUrls(paths);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (paths.length === 0) return null;

  const count = paths.length;
  const gridClass =
    count === 1
      ? "grid-cols-1"
      : count === 2
        ? "grid-cols-2"
        : "grid-cols-3";

  return (
    <>
      <div className={`grid ${gridClass} gap-2`}>
        {paths.map((p, i) => (
          <button
            key={p}
            type="button"
            onClick={() => setOpenIndex(i)}
            className="relative aspect-square overflow-hidden rounded-xl border border-border bg-secondary focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label={`Open photo ${i + 1} of ${count}`}
          >
            {urls[i] ? (
              <img
                src={urls[i]}
                alt={`Post photo ${i + 1}`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="h-full w-full animate-pulse bg-muted" />
            )}
          </button>
        ))}
      </div>

      {openIndex !== null && (
        <Lightbox
          urls={urls}
          index={openIndex}
          onIndexChange={setOpenIndex}
          onClose={() => setOpenIndex(null)}
        />
      )}
    </>
  );
}

function Lightbox({
  urls,
  index,
  onIndexChange,
  onClose,
}: {
  urls: string[];
  index: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
}) {
  const count = urls.length;
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && count > 1)
        onIndexChange((index + 1) % count);
      if (e.key === "ArrowLeft" && count > 1)
        onIndexChange((index - 1 + count) % count);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [index, count, onClose, onIndexChange]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Photo preview"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label="Close preview"
        className="absolute top-4 right-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
      >
        <X className="h-5 w-5" />
      </button>

      {count > 1 && (
        <button
          type="button"
          aria-label="Previous photo"
          onClick={(e) => {
            e.stopPropagation();
            onIndexChange((index - 1 + count) % count);
          }}
          className="absolute left-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      <img
        src={urls[index]}
        alt={`Photo ${index + 1} of ${count}`}
        className="max-h-full max-w-full rounded-lg object-contain"
        onClick={(e) => e.stopPropagation()}
      />

      {count > 1 && (
        <>
          <button
            type="button"
            aria-label="Next photo"
            onClick={(e) => {
              e.stopPropagation();
              onIndexChange((index + 1) % count);
            }}
            className="absolute right-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          <span className="absolute bottom-5 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
            {index + 1} / {count}
          </span>
        </>
      )}
    </div>
  );
}
