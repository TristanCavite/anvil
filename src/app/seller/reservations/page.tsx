import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "lib/supabase/server";
import ReservationActions from "./ReservationActions";
import { MessageCircle } from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  pending_authorization: "bg-yellow-50 text-yellow-700",
  authorized: "bg-blue-50 text-blue-700",
  accepted: "bg-green-50 text-green-700",
  fulfilled: "bg-gray-100 text-gray-600",
  declined: "bg-red-50 text-red-600",
  cancelled: "bg-gray-100 text-gray-500",
  expired: "bg-orange-50 text-orange-600",
};

const STATUS_LABELS: Record<string, string> = {
  pending_authorization: "New request",
  authorized: "Waiting for you",
  accepted: "Accepted",
  fulfilled: "Fulfilled",
  declined: "Declined",
  cancelled: "Cancelled",
  expired: "Expired",
};

export default async function SellerReservationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: business } = await supabase
    .from("seller_business")
    .select("id, business_name")
    .eq("owner_id", user.id)
    .single();

  if (!business) redirect("/seller/onboarding");

  const { data: reservations } = await supabase
    .from("reservations")
    .select(
      `
      id, status, price_snapshot, currency, created_at,
      listings ( id, title ),
      profiles!buyer_id ( display_name, phone )
    `,
    )
    .in(
      "listing_id",
      // subquery: listings owned by this seller
      (
        await supabase
          .from("listings")
          .select("id")
          .eq("seller_business_id", business.id)
      ).data?.map((l) => l.id) ?? [],
    )
    .order("created_at", { ascending: false });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (reservations ?? []) as any[];

  const newRequests = rows.filter((r) => r.status === "pending_authorization");
  const actionable = rows.filter((r) =>
    ["pending_authorization", "authorized", "accepted"].includes(r.status),
  );
  const historical = rows.filter(
    (r) =>
      !["pending_authorization", "authorized", "accepted"].includes(r.status),
  );

  function formatDate(dt: string) {
    return new Date(dt).toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function ReservationRow({ r }: { r: any }) {
    const listing = Array.isArray(r.listings) ? r.listings[0] : r.listings;
    const buyer = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;

    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <Link
              href={`/listings/${listing?.id}`}
              className="text-sm font-semibold text-gray-900 hover:text-green-700"
            >
              {listing?.title ?? "—"}
            </Link>

            <p className="mt-1 text-xs text-gray-500">
              Buyer: {buyer?.display_name ?? "Unknown"}
              {buyer?.phone ? ` · ${buyer.phone}` : ""}
            </p>

            <p className="mt-1 text-xs text-gray-400">
              ₱{Number(r.price_snapshot).toLocaleString()} ·{" "}
              {formatDate(r.created_at)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
  <span
    className={`rounded-full px-3 py-1 text-xs font-semibold ${
      STATUS_STYLES[r.status] ?? "bg-gray-100 text-gray-600"
    }`}
  >
    {STATUS_LABELS[r.status] ?? r.status}
  </span>

  <ReservationActions reservationId={r.id} status={r.status} />

  {r.status === "accepted" && (
    <Link
      href={`/reservations/${r.id}/chat`}
      title="Chat with buyer"
      className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-green-600 text-white shadow-md shadow-green-600/20 transition hover:bg-green-700"
    >
      <MessageCircle className="h-4 w-4" />
    </Link>
  )}
</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-base font-semibold text-gray-900">
              Incoming Reservations
            </h1>
            {newRequests.length > 0 && (
              <span className="rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-yellow-800">
                {newRequests.length} new request
                {newRequests.length === 1 ? "" : "s"}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500">{business.business_name}</p>
        </div>
        <Link
          href="/seller/listings"
          className="text-sm text-gray-500 hover:text-gray-800"
        >
          ← My listings
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8">
        {newRequests.length > 0 && (
          <section className="rounded-2xl border border-yellow-200 bg-yellow-50 px-5 py-4 text-sm text-yellow-900 shadow-sm">
            <p className="font-semibold">
              You have {newRequests.length} new reservation request
              {newRequests.length === 1 ? "" : "s"} waiting for review.
            </p>
            <p className="mt-1 text-yellow-800">
              Review the buyer details below, then accept or decline each
              request before pickup.
            </p>
          </section>
        )}

        {/* Action required */}
        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Action required ({actionable.length})
          </h2>
          {actionable.length === 0 ? (
            <p className="text-sm text-gray-400 bg-white rounded-2xl border border-gray-200 px-5 py-6 text-center">
              No pending reservations right now.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {actionable.map((r) => (
                <ReservationRow key={r.id} r={r} />
              ))}
            </div>
          )}
        </section>

        {/* History */}
        {historical.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              History
            </h2>
            <div className="flex flex-col gap-3">
              {historical.map((r) => (
                <ReservationRow key={r.id} r={r} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
