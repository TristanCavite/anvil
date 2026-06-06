"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Send, X, Phone, UserRound, Info, Smile } from "lucide-react";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { createClient } from "lib/supabase/browser";
import { increaseReservationQuantity } from "app/reservations/actions";

type ChatMessage = {
  id: string;
  reservation_id: string;
  sender_id: string;
  body: string;
  removed_at: string | null;
  created_at: string;
};

type ChatProfile = {
  name: string;
  avatarUrl: string | null;
  phone: string | null;
  bio: string | null;
  gender: string | null;
};

type ChatClientProps = {
  reservationId: string;
  currentUserId: string;
  initialMessages: ChatMessage[];
  buyerId: string;
  sellerId: string;
  buyerName: string;
  sellerName: string;
  buyerAvatarUrl: string | null;
  sellerAvatarUrl: string | null;
  reservationQuantity: number;
  buyerProfile: ChatProfile;
  sellerProfile: ChatProfile;
  chatName: string;
  chatAvatarUrl: string | null;
  chatProfile: ChatProfile;
  listingTitle: string;
  backHref: string;
};

export default function ChatClient({
  reservationId,
  currentUserId,
  initialMessages,
  buyerId,
  sellerId,
  buyerName,
  sellerName,
  buyerAvatarUrl,
  sellerAvatarUrl,
  reservationQuantity,
  buyerProfile,
  sellerProfile,
  chatName,
  chatAvatarUrl,
  chatProfile,
  listingTitle,
  backHref,
}: ChatClientProps) {
  const supabase = createClient();
  const router = useRouter();

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [body, setBody] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [openProfile, setOpenProfile] = useState<ChatProfile | null>(null);
  const [isPending, startTransition] = useTransition();
  const [quantityError, setQuantityError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  function getSenderInfo(senderId: string) {
    if (senderId === buyerId) {
      return {
        name: buyerName,
        avatarUrl: buyerAvatarUrl,
      };
    }

    if (senderId === sellerId) {
      return {
        name: sellerName,
        avatarUrl: sellerAvatarUrl,
      };
    }

    return {
      name: "User",
      avatarUrl: null,
    };
  }

  function getProfileBySender(senderId: string) {
    if (senderId === buyerId) return buyerProfile;
    if (senderId === sellerId) return sellerProfile;
    return null;
  }

  function handleEmojiClick(emojiData: EmojiClickData) {
    setBody((prev) => prev + emojiData.emoji);
    setEmojiOpen(false);
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const channel = supabase
      .channel(`reservation-chat-${reservationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `reservation_id=eq.${reservationId}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;

          if (newMessage.removed_at) return;

          setMessages((prev) => {
            const alreadyExists = prev.some((msg) => msg.id === newMessage.id);
            if (alreadyExists) return prev;
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [reservationId, supabase]);

  function sendMessage() {
    const cleanBody = body.trim();

    if (!cleanBody) return;

    startTransition(async () => {
      const { error } = await supabase.from("messages").insert({
        reservation_id: reservationId,
        sender_id: currentUserId,
        body: cleanBody,
      });

      if (error) {
        alert(error.message);
        return;
      }

      setBody("");
      setEmojiOpen(false);
    });
  }

  function handleIncreaseQuantity() {
    setQuantityError(null);

    startTransition(async () => {
      try {
        await increaseReservationQuantity(reservationId);
        router.refresh();
      } catch (error) {
        setQuantityError(
          error instanceof Error ? error.message : "Failed to update quantity."
        );
      }
    });
  }

  function ProfileAvatar({
    senderId,
    senderName,
    avatarUrl,
    isMine,
  }: {
    senderId: string;
    senderName: string;
    avatarUrl: string | null;
    isMine: boolean;
  }) {
    return (
      <button
        type="button"
        onClick={() => {
          const profile = getProfileBySender(senderId);
          if (profile) setOpenProfile(profile);
        }}
        className={`h-9 w-9 shrink-0 cursor-pointer overflow-hidden rounded-full bg-gray-200 transition hover:ring-2 hover:ring-green-400 ${
          isMine ? "order-last" : ""
        }`}
        title={`View ${senderName}'s profile`}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={senderName}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs font-bold text-gray-500">
            {senderName.charAt(0).toUpperCase()}
          </div>
        )}
      </button>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setOpenProfile(chatProfile)}
              className="h-12 w-12 shrink-0 cursor-pointer overflow-hidden rounded-full bg-green-100 transition hover:ring-2 hover:ring-green-400"
              title={`View ${chatName}'s profile`}
            >
              {chatAvatarUrl ? (
                <img
                  src={chatAvatarUrl}
                  alt={chatName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-base font-bold text-green-700">
                  {chatName.charAt(0).toUpperCase()}
                </div>
              )}
            </button>

            <div className="min-w-0">
              <h1 className="text-lg font-bold text-gray-900">Messages</h1>

              <p className="mt-0.5 truncate text-sm text-gray-500">
                {listingTitle} · {chatName} · {reservationQuantity} unit{reservationQuantity === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <Link
            href={backHref}
            className="shrink-0 text-sm font-medium text-gray-500 transition hover:text-gray-900"
          >
            ← Back
          </Link>
        </div>
      </header>

      <main className="mx-auto flex h-[calc(100vh-81px)] max-w-3xl flex-col px-4 py-5 sm:px-6">
        <div className="flex-1 overflow-y-auto rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center text-sm text-gray-400">
              No messages yet. Start the conversation.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {messages.map((msg) => {
                const isMine = msg.sender_id === currentUserId;
                const sender = getSenderInfo(msg.sender_id);

                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2 ${
                      isMine ? "justify-end" : "justify-start"
                    }`}
                  >
                    {!isMine && (
                      <ProfileAvatar
                        senderId={msg.sender_id}
                        senderName={sender.name}
                        avatarUrl={sender.avatarUrl}
                        isMine={false}
                      />
                    )}

                    <div
                      className={`max-w-[78%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                        isMine
                          ? "rounded-br-md bg-green-600 text-white"
                          : "rounded-bl-md bg-gray-100 text-gray-900"
                      }`}
                    >
                      <p
                        className={`mb-1 text-[11px] font-semibold ${
                          isMine ? "text-green-100" : "text-gray-500"
                        }`}
                      >
                        {sender.name}
                      </p>

                      <p className="whitespace-pre-wrap wrap-break-word">
                        {msg.body}
                      </p>

                      <p
                        className={`mt-1 text-[10px] ${
                          isMine ? "text-green-100" : "text-gray-400"
                        }`}
                      >
                        {new Date(msg.created_at).toLocaleTimeString("en-PH", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    {isMine && (
                      <ProfileAvatar
                        senderId={msg.sender_id}
                        senderName={sender.name}
                        avatarUrl={sender.avatarUrl}
                        isMine
                      />
                    )}
                  </div>
                );
              })}

              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {currentUserId === buyerId && (
          <div className="mt-3 rounded-3xl border border-emerald-100 bg-emerald-50 px-4 py-3 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-emerald-900">
                  Reserved units: {reservationQuantity}
                </p>
                <p className="mt-0.5 text-xs text-emerald-700">
                  Need one more? Add it here if stock is still available.
                </p>
              </div>

              <button
                type="button"
                onClick={handleIncreaseQuantity}
                disabled={isPending}
                className="inline-flex h-10 items-center justify-center rounded-2xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? "Updating…" : "Add 1 unit"}
              </button>
            </div>

            {quantityError && (
              <p className="mt-2 text-xs font-medium text-red-600">
                {quantityError}
              </p>
            )}
          </div>
        )}

        <div className="relative mt-3 flex items-end gap-2 rounded-3xl border border-gray-200 bg-white p-2 shadow-sm">
          {emojiOpen && (
            <div className="absolute bottom-16 left-3 z-50">
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                width={320}
                height={400}
              />
            </div>
          )}

          <button
            type="button"
            onClick={() => setEmojiOpen((prev) => !prev)}
            className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-2xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            title="Add emoji"
          >
            <Smile className="h-5 w-5" />
          </button>

          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Type your message..."
            rows={1}
            disabled={isPending}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            className="max-h-28 flex-1 resize-none rounded-2xl border-0 bg-transparent px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 disabled:opacity-60"
          />

          <button
            type="button"
            onClick={sendMessage}
            disabled={isPending || !body.trim()}
            className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-2xl bg-green-600 text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            title="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </main>

      {openProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="relative bg-linear-to-br from-gray-950 via-emerald-950 to-gray-950 px-6 py-10 text-center">
              <button
                type="button"
                onClick={() => setOpenProfile(null)}
                className="absolute right-4 top-4 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="mx-auto h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-green-100">
                {openProfile.avatarUrl ? (
                  <img
                    src={openProfile.avatarUrl}
                    alt={openProfile.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-green-700">
                    {openProfile.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <h2 className="mt-4 text-2xl font-bold text-white">
                {openProfile.name}
              </h2>
            </div>

            <div className="space-y-6 px-6 py-6">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Contact
                </h3>

                <div className="mt-3 space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-gray-300" />
                    <p className="text-gray-500">
                      {openProfile.phone ?? "Phone not provided"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  About
                </h3>

                <div className="mt-3 space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <Info className="mt-0.5 h-4 w-4 text-gray-300" />
                    <p className="text-gray-600">
                      {openProfile.bio ?? "No bio provided"}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <UserRound className="h-4 w-4 text-gray-300" />
                    <p className="text-gray-500">
                      {openProfile.gender ?? "Gender not specified"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}