import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, DataResponse } from "../api/client";
import type { Booking, BookingStatus } from "../api/types";
import { StatusBadge } from "../components/StatusBadge";
import { useToast } from "../components/Toasts";
import { formatDate, formatPrice, STATUS_LABELS } from "../lib/format";
import { useTitle } from "../lib/useTitle";

export function AdminBookings() {
  useTitle("Booking management");
  const queryClient = useQueryClient();
  const notify = useToast();
  const [status, setStatus] = useState<BookingStatus | "">("PENDING");

  const bookings = useQuery({
    queryKey: ["private", "admin-bookings"],
    queryFn: () =>
      api<DataResponse<Booking[]>>("/bookings").then(
        (response) => response.data,
      ),
  });

  const update = useMutation({
    mutationFn: ({
      booking,
      status,
    }: {
      booking: Booking;
      status: BookingStatus;
    }) =>
      api<DataResponse<Booking>>(`/bookings/${booking.id}`, {
        method: "PUT",
        body: { status },
      }),
    onSuccess: (response) => {
      notify(
        `Booking for room ${response.data.room?.number ?? ""} ${response.data.status === "CONFIRMED" ? "approved" : "rejected"}.`,
      );
      queryClient.invalidateQueries({ queryKey: ["private"] });
    },
    onError: (error) =>
      notify(`Could not update the booking: ${error.message}`),
  });

  const visible = (bookings.data ?? []).filter(
    (booking) => !status || booking.status === status,
  );

  return (
    <>
      <h1>Booking management</h1>
      <div className="field search">
        <label htmlFor="status-filter">Status</label>
        <select
          id="status-filter"
          value={status}
          onChange={(event) =>
            setStatus(event.target.value as BookingStatus | "")
          }
        >
          <option value="">All</option>
          {(Object.keys(STATUS_LABELS) as BookingStatus[]).map((value) => (
            <option key={value} value={value}>
              {STATUS_LABELS[value]}
            </option>
          ))}
        </select>
      </div>
      {bookings.isPending && <p role="status">Loading bookings…</p>}
      {bookings.isError && (
        <p className="alert alert-error" role="alert">
          {bookings.error.message}
        </p>
      )}
      {bookings.data && visible.length === 0 && (
        <p className="empty">No bookings with this status.</p>
      )}
      {visible.length > 0 && (
        <div className="table-wrapper">
          <table>
            <caption className="visually-hidden">Bookings</caption>
            <thead>
              <tr>
                <th scope="col">Guest</th>
                <th scope="col">Room</th>
                <th scope="col">Check-in</th>
                <th scope="col">Check-out</th>
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
                  <td>{booking.user?.username}</td>
                  <td>Room {booking.room?.number}</td>
                  <td>{formatDate(booking.checkIn)}</td>
                  <td>{formatDate(booking.checkOut)}</td>
                  <td>{formatPrice(booking.totalPrice)}</td>
                  <td>
                    <StatusBadge status={booking.status} />
                  </td>
                  <td>
                    <div className="row-actions">
                      {booking.status === "PENDING" && (
                        <>
                          <button
                            type="button"
                            className="button button-small"
                            disabled={update.isPending}
                            onClick={() =>
                              update.mutate({ booking, status: "CONFIRMED" })
                            }
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className="button button-danger button-small"
                            disabled={update.isPending}
                            onClick={() =>
                              update.mutate({ booking, status: "CANCELLED" })
                            }
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
