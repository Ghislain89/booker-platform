import { FormEvent, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { api, ApiError, DataResponse } from "../api/client";
import type { PublicRoom } from "../api/types";
import {
  addDays,
  formatDate,
  formatPrice,
  isValidDateInput,
  plural,
  roomTypeLabel,
  todayInput,
} from "../lib/format";
import { countNights } from "../lib/pricing";
import { useTitle } from "../lib/useTitle";
import { NotFound } from "./NotFound";

export function RoomDetail() {
  const { number = "" } = useParams();
  useTitle(`Room ${number}`);
  const navigate = useNavigate();
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");

  const room = useQuery({
    queryKey: ["rooms", "detail", number],
    queryFn: () =>
      api<DataResponse<PublicRoom>>(
        `/public/rooms/${encodeURIComponent(number)}`,
      ).then((r) => r.data),
  });

  if (room.isPending) return <p role="status">Loading room…</p>;
  if (room.isError) {
    if (room.error instanceof ApiError && room.error.status === 404)
      return <NotFound />;
    return (
      <p className="alert alert-error" role="alert">
        {room.error.message}
      </p>
    );
  }

  const data = room.data;
  const nights =
    isValidDateInput(checkIn) && isValidDateInput(checkOut)
      ? countNights(checkIn, checkOut)
      : 0;
  const inMaintenance = data.status === "MAINTENANCE";

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const query = nights > 0 ? `?checkIn=${checkIn}&checkOut=${checkOut}` : "";
    navigate(`/book/${data.number}${query}`);
  };

  return (
    <>
      <p>
        <Link to="/rooms">← All rooms</Link>
      </p>
      <div className="detail-layout">
        <section aria-labelledby="room-heading">
          <div
            className={`room-visual room-visual-large room-visual-${data.type.toLowerCase()}`}
            aria-hidden="true"
          >
            <span>{data.number}</span>
          </div>
          <h1 id="room-heading">Room {data.number}</h1>
          <p className="room-type">{roomTypeLabel(data.type)}</p>
          <dl className="facts">
            <dt>Price</dt>
            <dd>{formatPrice(data.price)} per night</dd>
            <dt>Guests</dt>
            <dd>Up to {plural(data.capacity, "guest")}</dd>
            <dt>Status</dt>
            <dd>{inMaintenance ? "Under maintenance" : "Open for bookings"}</dd>
          </dl>
          <h2>Amenities</h2>
          {data.amenities && data.amenities.length > 0 ? (
            <ul className="amenities" aria-label="Amenities">
              {data.amenities.map((amenity) => (
                <li key={amenity}>{amenity}</li>
              ))}
            </ul>
          ) : (
            <p>No amenities listed.</p>
          )}
          <h2>Booked dates</h2>
          {data.bookedPeriods.length > 0 ? (
            <ul aria-label="Booked dates">
              {data.bookedPeriods.map((period) => (
                <li key={period.checkIn}>
                  {formatDate(period.checkIn)} – {formatDate(period.checkOut)}
                </li>
              ))}
            </ul>
          ) : (
            <p>This room has no upcoming bookings.</p>
          )}
        </section>

        <aside
          className="card booking-panel"
          aria-labelledby="calculator-heading"
        >
          <h2 id="calculator-heading">Plan your stay</h2>
          {inMaintenance ? (
            <p>
              This room is under maintenance and cannot be booked right now.
            </p>
          ) : (
            <form onSubmit={onSubmit} className="form">
              <div className="field">
                <label htmlFor="detail-check-in">Check-in date</label>
                <input
                  id="detail-check-in"
                  type="date"
                  min={todayInput()}
                  value={checkIn}
                  onChange={(event) => {
                    setCheckIn(event.target.value);
                    if (
                      event.target.value &&
                      (!checkOut || checkOut <= event.target.value)
                    )
                      setCheckOut(addDays(event.target.value, 1));
                  }}
                />
              </div>
              <div className="field">
                <label htmlFor="detail-check-out">Check-out date</label>
                <input
                  id="detail-check-out"
                  type="date"
                  min={checkIn ? addDays(checkIn, 1) : todayInput()}
                  value={checkOut}
                  onChange={(event) => setCheckOut(event.target.value)}
                />
              </div>
              <p className="price-calculation" aria-live="polite">
                {nights > 0
                  ? `${plural(nights, "night")} × ${formatPrice(data.price)} = ${formatPrice(nights * data.price)}`
                  : "Choose your dates to see the price."}
              </p>
              <button type="submit" className="button">
                Book now
              </button>
            </form>
          )}
        </aside>
      </div>
    </>
  );
}
