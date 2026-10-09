import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./auth";
import { getToken } from "./token";
import { hasFlag } from "./flags";
import { STATUS_LABELS } from "./format";
import type { BookingStatus } from "../api/types";

// Live updates over Server-Sent Events (GET /api/events). Assignment 5b opens two browser
// contexts: the admin approves a booking and the guest's page updates without a reload.

export interface Notification {
  id: number;
  text: string;
  read: boolean;
  at: Date;
}

interface BookingEvent {
  id: string;
  status: BookingStatus;
  roomNumber?: string;
  username?: string;
  actor?: string;
}

interface MessageEvent {
  id: string;
  subject: string;
  from?: string | null;
}

interface EventsContextValue {
  connected: boolean;
  notifications: Notification[];
  unread: number;
  markAllRead: () => void;
  clear: () => void;
}

const EventsContext = createContext<EventsContextValue | null>(null);

let nextId = 1;

export function EventsProvider({ children }: { children: ReactNode }) {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const add = useCallback((text: string) => {
    setNotifications((current) => [
      { id: nextId++, text, read: false, at: new Date() },
      ...current,
    ]);
  }, []);

  useEffect(() => {
    setNotifications([]);
    const token = getToken();
    if (!user || !token || typeof EventSource === "undefined") return;

    const source = new EventSource(
      `/api/events?token=${encodeURIComponent(token)}`,
    );
    source.addEventListener("ready", () => setConnected(true));
    source.onerror = () => setConnected(false);

    const refreshBookings = () => {
      queryClient.invalidateQueries({ queryKey: ["private", "admin-bookings"] });
      // Chaos flag: the guest's list keeps showing stale data.
      if (!hasFlag("stale-list"))
        queryClient.invalidateQueries({ queryKey: ["private", "my-bookings"] });
    };

    source.addEventListener("booking.created", (event) => {
      const data: BookingEvent = JSON.parse((event as globalThis.MessageEvent).data);
      refreshBookings();
      if (isAdmin && data.actor !== user.username)
        add(`New booking for room ${data.roomNumber} by ${data.username}.`);
    });
    source.addEventListener("booking.updated", (event) => {
      const data: BookingEvent = JSON.parse((event as globalThis.MessageEvent).data);
      refreshBookings();
      if (data.actor === user.username) return;
      const status = STATUS_LABELS[data.status]?.toLowerCase() ?? data.status;
      add(
        data.username === user.username
          ? `Your booking for room ${data.roomNumber} is now ${status}.`
          : `Booking for room ${data.roomNumber} by ${data.username} is now ${status}.`,
      );
    });
    source.addEventListener("message.created", (event) => {
      const data: MessageEvent = JSON.parse((event as globalThis.MessageEvent).data);
      queryClient.invalidateQueries({ queryKey: ["private", "messages"] });
      if (isAdmin) add(`New message from ${data.from ?? "a guest"}: ${data.subject}`);
    });

    return () => {
      source.close();
      setConnected(false);
    };
  }, [user, isAdmin, queryClient, add]);

  const markAllRead = useCallback(
    () =>
      setNotifications((current) =>
        current.some((item) => !item.read)
          ? current.map((item) => ({ ...item, read: true }))
          : current,
      ),
    [],
  );
  const clear = useCallback(() => setNotifications([]), []);

  const value = useMemo(
    () => ({
      connected,
      notifications,
      unread: notifications.filter((item) => !item.read).length,
      markAllRead,
      clear,
    }),
    [connected, notifications, markAllRead, clear],
  );
  return (
    <EventsContext.Provider value={value}>{children}</EventsContext.Provider>
  );
}

export function useEvents() {
  const context = useContext(EventsContext);
  if (!context) throw new Error("useEvents must be used inside <EventsProvider>");
  return context;
}
