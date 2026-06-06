import { redirect } from "next/navigation";
import { createClient } from "lib/supabase/server";
import ChatClient from "./ChatClient";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ReservationChatPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { data: reservation, error } = await supabase
    .from("reservations")
    .select(`
      id,
      status,
      quantity,
      buyer_id,
      listings (
        id,
        title,
        seller_business (
          id,
          business_name,
          owner_id
        )
      ),
      profiles!buyer_id (
        display_name,
        avatar_url,
        bio,
        gender,
        phone
      )
    `)
    .eq("id", id)
    .single();

  if (error || !reservation) {
    redirect("/reservations");
  }

  const listing = Array.isArray(reservation.listings)
    ? reservation.listings[0]
    : reservation.listings;

  const business = Array.isArray(listing?.seller_business)
    ? listing.seller_business[0]
    : listing?.seller_business;

  const buyer = Array.isArray(reservation.profiles)
    ? reservation.profiles[0]
    : reservation.profiles;

  const isBuyer = reservation.buyer_id === user.id;
  const isSeller = business?.owner_id === user.id;

  if (!isBuyer && !isSeller) {
    redirect("/reservations");
  }

  if (reservation.status !== "accepted") {
    redirect(isSeller ? "/seller/reservations" : "/reservations");
  }

  const { data: sellerProfile } = business?.owner_id
    ? await supabase
        .from("profiles")
        .select("display_name, avatar_url, bio, gender, phone")
        .eq("id", business.owner_id)
        .single()
    : { data: null };

  const { data: messages } = await supabase
    .from("messages")
    .select("id, reservation_id, sender_id, body, removed_at, created_at")
    .eq("reservation_id", id)
    .is("removed_at", null)
    .order("created_at", { ascending: true });

  const buyerName = buyer?.display_name ?? "Buyer";
  const sellerName =
    sellerProfile?.display_name ?? business?.business_name ?? "Seller";

  const buyerAvatarUrl = buyer?.avatar_url ?? null;
  const sellerAvatarUrl = sellerProfile?.avatar_url ?? null;

  const chatName = isSeller ? buyerName : sellerName;
  const chatAvatarUrl = isSeller ? buyerAvatarUrl : sellerAvatarUrl;

  const chatProfile = isSeller
    ? {
        name: buyerName,
        avatarUrl: buyerAvatarUrl,
        phone: buyer?.phone ?? null,
        bio: buyer?.bio ?? null,
        gender: buyer?.gender ?? null,
      }
    : {
        name: sellerName,
        avatarUrl: sellerAvatarUrl,
        phone: sellerProfile?.phone ?? null,
        bio: sellerProfile?.bio ?? null,
        gender: sellerProfile?.gender ?? null,
      };

  return (
    <ChatClient
      reservationId={id}
      currentUserId={user.id}
      initialMessages={messages ?? []}
      buyerId={reservation.buyer_id}
      sellerId={business?.owner_id ?? ""}
      buyerName={buyerName}
      sellerName={sellerName}
      buyerAvatarUrl={buyerAvatarUrl}
      sellerAvatarUrl={sellerAvatarUrl}
      reservationQuantity={reservation.quantity ?? 1}
      buyerProfile={{
        name: buyerName,
        avatarUrl: buyerAvatarUrl,
        phone: buyer?.phone ?? null,
        bio: buyer?.bio ?? null,
        gender: buyer?.gender ?? null,
      }}
      sellerProfile={{
        name: sellerName,
        avatarUrl: sellerAvatarUrl,
        phone: sellerProfile?.phone ?? null,
        bio: sellerProfile?.bio ?? null,
        gender: sellerProfile?.gender ?? null,
      }}
      chatName={chatName}
      chatAvatarUrl={chatAvatarUrl}
      chatProfile={chatProfile}
      listingTitle={listing?.title ?? "Reservation"}
      backHref={isSeller ? "/seller/reservations" : "/reservations"}
    />
  );
}