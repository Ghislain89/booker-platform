import { Response } from "express";
import { AuthUser } from "../types";

// Server-Sent Events: GET /api/events pushes live updates to the web UI.
// Guests get events about their own bookings; admins get every event.

export type EventType = "booking.created" | "booking.updated" | "message.created";

interface Client {
  res: Response;
  user: AuthUser;
}

const clients = new Set<Client>();

const HEARTBEAT_MS = 25_000;

export function subscribe(res: Response, user: AuthUser) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.write(`event: ready\ndata: ${JSON.stringify({ username: user.username })}\n\n`);

  const client = { res, user };
  clients.add(client);
  const heartbeat = setInterval(() => res.write(": heartbeat\n\n"), HEARTBEAT_MS);
  res.on("close", () => {
    clearInterval(heartbeat);
    clients.delete(client);
  });
}

/** Sends an event to the given user (if any) and to all admins. */
export function publish(type: EventType, data: unknown, target: { userId?: string | null } = {}) {
  const payload = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of clients) {
    if (client.user.role === "ROLE_ADMIN" || (target.userId && client.user.userId === target.userId)) {
      client.res.write(payload);
    }
  }
}
