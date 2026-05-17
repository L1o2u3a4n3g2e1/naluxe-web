import { supabase } from "./supabase.js";

export async function isAdmin() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return false;

  const { data, error } = await supabase
    .from("admins")
    .select("id")
    .eq("email", user.email)
    .single();

  if (error || !data) return false;
  return true;
}
