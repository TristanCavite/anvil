"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { createClient } from "lib/supabase/browser";

type ChatItem = {
  reservationId: string;
  title: string;
  chatName: string;
};

type ChatNotification = {
  reservationId: string;
  chatName: string;
  title: string;
  body: string;
};

export default function FloatingChatButton() {
  const supabase = useMemo(() => createClient(), []);

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [notification, setNotification] = useState<ChatNotification | null>(
    null
  );

  const currentUserIdRef = useRef<string | null>(null);
  const notificationTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function loadChats(showLoading = true) {
      if (showLoading) setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        currentUserIdRef.current = null;
        setIsLoggedIn(false);
        setChats([]);
        if (showLoading) setLoading(false);
        return [];
      }

      currentUserIdRef.current = user.id;
      setIsLoggedIn(true);

      // CUSTOMER SIDE: current user is the buyer
      const { data: buyerReservations } = await supabase
        .from("reservations")
        .select(`
          id,
          status,
          buyer_id,
          listings (
            id,
            title,
            seller_business (
              id,
              business_name,
              owner_id
            )
          )
        `)
        .eq("buyer_id", user.id)
        .eq("status", "accepted");

      const buyerChats: ChatItem[] =
        buyerReservations?.map((reservation: any) => {
          const listing = Array.isArray(reservation.listings)
            ? reservation.listings[0]
            : reservation.listings;

          const business = Array.isArray(listing?.seller_business)
            ? listing.seller_business[0]
            : listing?.seller_business;

          return {
            reservationId: reservation.id,
            title: listing?.title ?? "Reservation",
            chatName: business?.business_name ?? "Seller",
          };
        }) ?? [];

      // SELLER SIDE: current user owns seller_business
      const { data: sellerBusinesses } = await supabase
        .from("seller_business")
        .select("id, business_name")
        .eq("owner_id", user.id);

      const sellerBusinessIds = sellerBusinesses?.map((b: any) => b.id) ?? [];

      let sellerChats: ChatItem[] = [];

      if (sellerBusinessIds.length > 0) {
        const { data: sellerListings } = await supabase
          .from("listings")
          .select("id, title, seller_business_id")
          .in("seller_business_id", sellerBusinessIds);

        const listingIds =
          sellerListings?.map((listing: any) => listing.id) ?? [];

        if (listingIds.length > 0) {
          const { data: sellerReservations } = await supabase
            .from("reservations")
            .select(`
              id,
              status,
              buyer_id,
              listing_id,
              profiles!buyer_id (
                display_name
              )
            `)
            .in("listing_id", listingIds)
            .eq("status", "accepted");

          sellerChats =
            sellerReservations?.map((reservation: any) => {
              const buyerProfile = Array.isArray(reservation.profiles)
                ? reservation.profiles[0]
                : reservation.profiles;

              const listing = sellerListings?.find(
                (item: any) => item.id === reservation.listing_id
              );

              return {
                reservationId: reservation.id,
                title: listing?.title ?? "Reservation",
                chatName: buyerProfile?.display_name ?? "Buyer",
              };
            }) ?? [];
        }
      }

      const combinedChats = [...buyerChats, ...sellerChats];

      const uniqueChats = combinedChats.filter(
        (chat, index, self) =>
          index ===
          self.findIndex((c) => c.reservationId === chat.reservationId)
      );

      setChats(uniqueChats);
      if (showLoading) setLoading(false);

      return uniqueChats;
    }

    loadChats();

    const channel = supabase
      .channel("floating-chat-refresh")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        async (payload) => {
          const newMessage = payload.new as {
            reservation_id?: string;
            sender_id?: string;
            body?: string;
          };

          const updatedChats = await loadChats(false);

          if (!newMessage.reservation_id) return;

          const isMyOwnMessage =
            newMessage.sender_id &&
            currentUserIdRef.current &&
            newMessage.sender_id === currentUserIdRef.current;

          if (isMyOwnMessage) return;

          const currentPath = window.location.pathname;
          const sameChatOpen = currentPath.includes(
            `/reservations/${newMessage.reservation_id}/chat`
          );

          if (sameChatOpen) return;

          const matchedChat = updatedChats.find(
            (chat) => chat.reservationId === newMessage.reservation_id
          );

          setNotification({
            reservationId: newMessage.reservation_id,
            chatName: matchedChat?.chatName ?? "New message",
            title: matchedChat?.title ?? "Reservation",
            body: newMessage.body ?? "Sent a message",
          });

          if (notificationTimerRef.current) {
            clearTimeout(notificationTimerRef.current);
          }

          notificationTimerRef.current = setTimeout(() => {
            setNotification(null);
          }, 5000);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reservations",
        },
        () => {
          loadChats(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);

      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
      }
    };
  }, [supabase]);

  if (loading || !isLoggedIn) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {notification && !open && (
        <Link
          href={`/reservations/${notification.reservationId}/chat`}
          onClick={() => setNotification(null)}
          className="mb-4 block w-80 rounded-3xl border border-gray-200 bg-white p-4 shadow-2xl transition hover:scale-[1.01]"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-600">
              <MessageCircle className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900">
                {notification.chatName}
              </p>

              <p className="text-xs text-gray-500">{notification.title}</p>

              <p className="mt-1 truncate text-sm text-gray-700">
                {notification.body}
              </p>
            </div>
          </div>
        </Link>
      )}

      {open && (
        <div className="mb-4 w-80 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h2 className="font-bold text-gray-900">Messages</h2>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="cursor-pointer rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto p-2">
            {chats.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400">
                No active chats yet.
              </div>
            ) : (
              chats.map((chat) => (
                <Link
                  key={chat.reservationId}
                  href={`/reservations/${chat.reservationId}/chat`}
                  onClick={() => setOpen(false)}
                  className="block rounded-2xl px-3 py-3 transition hover:bg-gray-50"
                >
                  <p className="text-sm font-semibold text-gray-900">
                    {chat.chatName}
                  </p>

                  <p className="text-xs text-gray-500">{chat.title}</p>
                </Link>
              ))
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          setOpen((prev) => !prev);
          setNotification(null);
        }}
        className="relative flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-sky-500 text-white shadow-xl transition hover:bg-sky-600"
        title="Open messages"
      >
        <MessageCircle className="h-6 w-6" />

        {notification && !open && (
          <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-red-500 ring-2 ring-white" />
        )}
      </button>
    </div>
  );
}