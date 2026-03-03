// app/dashboard/page.tsx
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "./logout-button";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  return (
    <main style={{ maxWidth: 720, margin: "60px auto", padding: 16 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>Dashboard</h1>

      <p style={{ marginTop: 6, opacity: 0.8 }}>
        If middleware + session cookies work, you should see your user below.
      </p>

      <div style={{ marginTop: 16 }}>
        <LogoutButton />
      </div>

      <h2 style={{ marginTop: 24, fontSize: 18, fontWeight: 700 }}>
        Current User (server)
      </h2>

      <pre
        style={{
          marginTop: 12,
          padding: 12,
          border: "1px solid #ddd",
          borderRadius: 10,
          overflowX: "auto",
        }}
      >
        {JSON.stringify(
          {
            user: data.user
              ? {
                  id: data.user.id,
                  email: data.user.email,
                  created_at: data.user.created_at,
                  last_sign_in_at: data.user.last_sign_in_at,
                }
              : null,
            error: error?.message ?? null,
          },
          null,
          2
        )}
      </pre>
    </main>
  );
}