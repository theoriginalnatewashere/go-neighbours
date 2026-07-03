import { supabase } from "@/integrations/supabase/client";

export const MAX_IMAGES_PER_POST = 3;
export const MAX_IMAGE_BYTES = 1 * 1024 * 1024; // 1 MB
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];
const ALLOWED_EXT = ["jpg", "jpeg", "png", "webp"];

export type ValidationResult =
  | { ok: true; file: File }
  | { ok: false; reason: string; file: File };

export function validateImageFile(file: File): ValidationResult {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const typeOk =
    ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase()) ||
    ALLOWED_EXT.includes(ext);
  if (!typeOk) {
    return { ok: false, file, reason: `${file.name}: only JPG, PNG or WEBP images are allowed.` };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, file, reason: `${file.name}: image is larger than 1 MB.` };
  }
  return { ok: true, file };
}

function randomId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function uploadPostImages(files: File[]): Promise<string[]> {
  if (files.length === 0) return [];
  if (files.length > MAX_IMAGES_PER_POST) {
    throw new Error(`You can attach up to ${MAX_IMAGES_PER_POST} images.`);
  }
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Not signed in");
  const userId = u.user.id;

  const paths: string[] = [];
  for (const file of files) {
    const v = validateImageFile(file);
    if (!v.ok) throw new Error(v.reason);
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${userId}/${randomId()}.${ext}`;
    const { error } = await supabase.storage
      .from("post-images")
      .upload(path, file, {
        contentType: file.type || "image/jpeg",
        upsert: false,
      });
    if (error) throw error;
    paths.push(path);
  }
  return paths;
}

export async function signPostImageUrls(
  paths: string[],
  expiresIn = 60 * 60,
): Promise<string[]> {
  if (paths.length === 0) return [];
  const { data, error } = await supabase.storage
    .from("post-images")
    .createSignedUrls(paths, expiresIn);
  if (error) throw error;
  // Preserve order of input paths.
  const byPath = new Map(
    (data ?? []).map((d) => [d.path ?? "", d.signedUrl ?? ""]),
  );
  return paths.map((p) => byPath.get(p) ?? "");
}

export async function deletePostImages(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  await supabase.storage.from("post-images").remove(paths);
}
