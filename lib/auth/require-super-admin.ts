import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSuperAdminUser } from "@/lib/auth/super-admin";

export async function requireSuperAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/auth/login?next=/game-admin");
  }
  if (!isSuperAdminUser(user)) {
    redirect("/dashboard");
  }

  return { user, supabase };
}
