import { supabase } from "./supabase.js";

export async function fetchProducts() {
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      id,
      name,
      description,
      price_rwf,
      subcategory,
      image_url,
      active,
      created_at,
      category,
      category_id,
      categories:category_id ( id, name )
    `
    )
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((p) => ({
    ...p,
    category_label: p.category || p.categories?.name || "Uncategorized",
  }));
}
