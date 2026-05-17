import { supabase } from "./supabase.js";
import { v4 as uuidv4 } from "uuid";

const BUCKET = "product-images";

export async function uploadProductImage(file) {
  if (!file) return null;

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const filePath = `products/${uuidv4()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(filePath, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || "image/jpeg",
  });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}

export async function uploadManyProductImages(fileList, max = 4) {
  const files = Array.from(fileList || []).slice(0, max);
  const urls = [];
  for (const f of files) {
    const url = await uploadProductImage(f);
    urls.push(url);
  }
  return urls;
}
