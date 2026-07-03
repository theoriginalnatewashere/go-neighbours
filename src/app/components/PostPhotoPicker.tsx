import { useRef } from "react";
import { Camera, X } from "lucide-react";
import {
  MAX_IMAGES_PER_POST,
  ALLOWED_IMAGE_TYPES,
  validateImageFile,
} from "@/lib/postImages";

export type PhotoDraft = {
  file: File;
  previewUrl: string;
};

export function PostPhotoPicker({
  photos,
  onChange,
  onError,
}: {
  photos: PhotoDraft[];
  onChange: (next: PhotoDraft[]) => void;
  onError: (message: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const remaining = MAX_IMAGES_PER_POST - photos.length;

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const incoming = Array.from(files);
    if (incoming.length > remaining) {
      onError(
        `You can attach up to ${MAX_IMAGES_PER_POST} images per post.`,
      );
    }
    const accepted: PhotoDraft[] = [];
    for (const f of incoming.slice(0, remaining)) {
      const v = validateImageFile(f);
      if (!v.ok) {
        onError(v.reason);
        continue;
      }
      accepted.push({ file: f, previewUrl: URL.createObjectURL(f) });
    }
    if (accepted.length > 0) onChange([...photos, ...accepted]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const removeAt = (i: number) => {
    const target = photos[i];
    if (target) URL.revokeObjectURL(target.previewUrl);
    onChange(photos.filter((_, idx) => idx !== i));
  };

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="block text-xs font-semibold">Photos (optional)</span>
        <span className="text-[11px] text-muted-foreground">
          {photos.length}/{MAX_IMAGES_PER_POST} · JPG, PNG, WEBP · up to 1 MB
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {photos.map((p, i) => (
          <div
            key={p.previewUrl}
            className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-secondary"
          >
            <img
              src={p.previewUrl}
              alt={`Attachment ${i + 1}`}
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              aria-label={`Remove photo ${i + 1}`}
              onClick={() => removeAt(i)}
              className="absolute top-1.5 right-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-background/90 text-foreground shadow"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        {photos.length < MAX_IMAGES_PER_POST && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-border bg-card/60 text-xs text-muted-foreground hover:bg-secondary"
          >
            <Camera className="h-5 w-5" />
            Add photo
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_IMAGE_TYPES.join(",")}
        multiple
        capture="environment"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
