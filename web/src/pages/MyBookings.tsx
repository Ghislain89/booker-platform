import { useState } from "react";
import { Link } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, DataResponse } from "../api/client";
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

  const today = toIsoDate(todayInput());
  const visible = (bookings.data ?? []).filter(
    (booking) => tabOf(booking, today) === tab,
  );
  const activeTab = TABS.find((item) => item.id === tab)!;

  return (
    <>
      <h1>My bookings</h1>
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
                        <td>
                          {booking.room ? (
                            <Link to={`/rooms/${booking.room.number}`}>
                              Room {booking.room.number} (
                              {roomTypeLabel(booking.room.type)})
                            </Link>
                          ) : (
                            "Unknown room"
                          )}
                        </td>
                        <td>{formatDate(booking.checkIn)}</td>
                        <td>{formatDate(booking.checkOut)}</td>
                        <td>{booking.adults + booking.children}</td>
                        <td>
                          {booking.extras.length
                            ? booking.extras
                                .map((extra) => EXTRA_LABELS[extra])
                                .join(", ")
                            : "None"}
                        </td>
                        <td>{plural(booking.nights, "night")}</td>
                        <td>{formatPrice(booking.totalPrice)}</td>
                        <td>
                          <StatusBadge status={booking.status} />
                        </td>
                        <td>
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
