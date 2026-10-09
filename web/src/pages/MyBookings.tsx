import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, DataResponse, download } from "../api/client";
import type { Booking } from "../api/types";
import { StatusBadge } from "../components/StatusBadge";
import { useToast } from "../components/Toasts";
import {
  EXTRA_LABELS,
  formatDate,
  formatPrice,
  plural,
  roomTypeLabel,
  todayInput,
  toIsoDate,
} from "../lib/format";
import { useTitle } from "../lib/useTitle";
import { hasFlag } from "../lib/flags";

const TABS = [
  { id: "upcoming", label: "Upcoming", empty: "No upcoming bookings." },
  { id: "past", label: "Past", empty: "No past bookings." },
  { id: "cancelled", label: "Cancelled", empty: "No cancelled bookings." },
] as const;

type TabId = (typeof TABS)[number]["id"];

const tabOf = (booking: Booking, today: string): TabId => {
  if (booking.status === "CANCELLED") return "cancelled";
  if (booking.status === "COMPLETED" || booking.checkOut <= today)
    return "past";
  return "upcoming";
};

export function MyBookings() {
  useTitle("My bookings");
  const [tab, setTab] = useState<TabId>("upcoming");
  const queryClient = useQueryClient();
  const notify = useToast();

  const bookings = useQuery({
    queryKey: ["private", "my-bookings"],
    queryFn: () =>
      api<DataResponse<Booking[]>>("/bookings/my-bookings").then(
        (response) => response.data,
      ),
  });

  const cancel = useMutation({
    mutationFn: (id: string) => api(`/bookings/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      notify("Booking cancelled.");
      // Chaos flag: the list is not refreshed, so the row stays under "Upcoming".
      if (hasFlag("stale-list")) return;
      return queryClient.invalidateQueries({
        queryKey: ["private", "my-bookings"],
      });
    },
    onError: (error) =>
      notify(`Could not cancel the booking: ${error.message}`),
  });

  const onCancel = (booking: Booking) => {
    // A native dialog on purpose: Playwright dismisses it unless the test handles it.
    if (
      window.confirm(
        `Cancel your booking for room ${booking.room?.number ?? ""} on ${formatDate(booking.checkIn)}?`,
      )
    ) {
      cancel.mutate(booking.id);
    }
  };

  const onInvoice = async (booking: Booking, format: "pdf" | "csv") => {
    try {
      await download(`/bookings/${booking.id}/invoice?format=${format}`);
    } catch (error) {
      notify(`Could not download the invoice: ${(error as Error).message}`);
    }
  };

  const today = toIsoDate(todayInput());
  const visible = (bookings.data ?? []).filter(
    (booking) => tabOf(booking, today) === tab,
  );
  const activeTab = TABS.find((item) => item.id === tab)!;

  return (
    <>
      <h1>My bookings</h1>
      {bookings.data && <CheckInCountdowns bookings={bookings.data} />}
      {bookings.isPending && <p role="status">Loading bookings…</p>}
      {bookings.isError && (
        <p className="alert alert-error" role="alert">
          {bookings.error.message}
        </p>
      )}
      {bookings.data && bookings.data.length === 0 && (
        <div className="empty card">
          <p>No bookings yet</p>
          <Link to="/rooms" className="button">
            Browse rooms
          </Link>
        </div>
      )}
      {bookings.data && bookings.data.length > 0 && (
        <>
          <div role="tablist" aria-label="Bookings" className="tabs">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                id={`tab-${item.id}`}
                aria-selected={tab === item.id}
                aria-controls={`panel-${item.id}`}
                tabIndex={tab === item.id ? 0 : -1}
                className={tab === item.id ? "tab active" : "tab"}
                onClick={() => setTab(item.id)}
                onKeyDown={(event) => {
                  const index = TABS.findIndex(
                    (candidate) => candidate.id === tab,
                  );
                  const delta =
                    event.key === "ArrowRight"
                      ? 1
                      : event.key === "ArrowLeft"
                        ? -1
                        : 0;
                  if (!delta) return;
                  const nextTab =
                    TABS[(index + delta + TABS.length) % TABS.length];
                  setTab(nextTab.id);
                  document.getElementById(`tab-${nextTab.id}`)?.focus();
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div
            role="tabpanel"
            id={`panel-${tab}`}
            aria-labelledby={`tab-${tab}`}
            tabIndex={0}
          >
            {visible.length === 0 ? (
              <p className="empty">{activeTab.empty}</p>
            ) : (
              <div className="table-wrapper">
                <table>
                  <caption className="visually-hidden">
                    {activeTab.label} bookings
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Room</th>
                      <th scope="col">Check-in</th>
                      <th scope="col">Check-out</th>
                      <th scope="col">Guests</th>
                      <th scope="col">Extras</th>
                      <th scope="col">Nights</th>
                      <th scope="col">Total</th>
                      <th scope="col">Status</th>
                      <th scope="col">
                        <span className="visually-hidden">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((booking) => (
                      <tr key={booking.id} data-testid="booking-row">
                        <td data-label="Room">
                          {booking.room ? (
                            <Link to={`/rooms/${booking.room.number}`}>
                              Room {booking.room.number} (
                              {roomTypeLabel(booking.room.type)})
                            </Link>
                          ) : (
                            "Unknown room"
                          )}
                        </td>
                        <td data-label="Check-in">
                          {formatDate(booking.checkIn)}
                        </td>
                        <td data-label="Check-out">
                          {formatDate(booking.checkOut)}
                        </td>
                        <td data-label="Guests">
                          {booking.adults + booking.children}
                        </td>
                        <td data-label="Extras">
                          {booking.extras.length
                            ? booking.extras
                                .map((extra) => EXTRA_LABELS[extra])
                                .join(", ")
                            : "None"}
                        </td>
                        <td data-label="Nights">
                          {plural(booking.nights, "night")}
                        </td>
                        <td data-label="Total">
                          {formatPrice(booking.totalPrice)}
                        </td>
                        <td data-label="Status">
                          <StatusBadge status={booking.status} />
                        </td>
                        <td className="actions-cell">
                          <div className="row-actions">
                          {booking.status !== "CANCELLED" && (
                            <>
                              <button
                                type="button"
                                className="button button-secondary button-small"
                                aria-label={`Download PDF invoice for room ${booking.room?.number ?? ""}`}
                                onClick={() => onInvoice(booking, "pdf")}
                              >
                                PDF
                              </button>
                              <button
                                type="button"
                                className="button button-secondary button-small"
                                aria-label={`Download CSV invoice for room ${booking.room?.number ?? ""}`}
                                onClick={() => onInvoice(booking, "csv")}
                              >
                                CSV
                              </button>
                            </>
                          )}
                          {tab === "upcoming" && (
                            <button
                              type="button"
                              className="button button-danger button-small"
                              disabled={
                                cancel.isPending &&
                                cancel.variables === booking.id
                              }
                              onClick={() => onCancel(booking)}
                            >
                              Cancel booking
                            </button>
                          )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}

const CHECK_IN_HOUR = 15;

const localDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const pad = (value: number) => String(value).padStart(2, "0");

/**
 * Check-in opens at 15:00 local time on the day of arrival. Driven by Date.now() and a
 * one-second interval, so `page.clock` controls it completely (assignment 5c).
 */
function CheckInCountdowns({ bookings }: { bookings: Booking[] }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const today = localDate(new Date(now));
  const arriving = bookings.filter(
    (booking) =>
      (booking.status === "PENDING" || booking.status === "CONFIRMED") &&
      booking.checkIn.slice(0, 10) === today,
  );
  if (arriving.length === 0) return null;

  const opensAt = new Date(now);
  opensAt.setHours(CHECK_IN_HOUR, 0, 0, 0);
  const remaining = Math.max(0, Math.ceil((opensAt.getTime() - now) / 1000));
  const time = `${pad(Math.floor(remaining / 3600))}:${pad(Math.floor((remaining % 3600) / 60))}:${pad(remaining % 60)}`;

  return (
    <div className="check-in-countdowns">
      {arriving.map((booking) => (
        <p
          key={booking.id}
          className="notice check-in"
          data-testid="check-in-countdown"
        >
          {remaining > 0
            ? `Check-in for room ${booking.room?.number ?? ""} opens in ${time}`
            : `Check-in for room ${booking.room?.number ?? ""} is open`}
        </p>
      ))}
    </div>
  );
}
