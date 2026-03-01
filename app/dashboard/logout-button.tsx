"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();

    // Refresh server components + go back to login
    router.refresh();
    router.push("/auth/login");
  }

  return (
    <button
      onClick={logout}
      style={{
        padding: 10,
        borderRadius: 8,
        border: "1px solid #000",
        cursor: "pointer",
      }}
    >
      Log out
    </button>
  );
}