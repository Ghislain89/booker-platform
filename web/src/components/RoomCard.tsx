import { Link } from "react-router";
import type { Room } from "../api/types";
import { formatPrice, plural, roomTypeLabel } from "../lib/format";

export function RoomCard({ room }: { room: Room }) {
  const headingId = `room-${room.id}-heading`;
  const inMaintenance = room.status === "MAINTENANCE";
  return (
    <article className="card room-card" aria-labelledby={headingId}>
      <div
        className={`room-visual room-visual-${room.type.toLowerCase()}`}
        aria-hidden="true"
      >
        <span>{room.number}</span>
      </div>
      <div className="card-body">
        <h3 id={headingId}>Room {room.number}</h3>
        <p className="room-type">{roomTypeLabel(room.type)}</p>
        <p className="room-price">
          <strong>{formatPrice(room.price)}</strong> / night
        </p>
        <p>Up to {plural(room.capacity, "guest")}</p>
        {room.amenities && room.amenities.length > 0 && (
          <ul className="amenities" aria-label="Amenities">
            {room.amenities.map((amenity) => (
              <li key={amenity}>{amenity}</li>
            ))}
          </ul>
        )}
        {inMaintenance && <p className="notice">Under maintenance</p>}
        <div className="card-actions">
          <Link
            to={`/rooms/${room.number}`}
            className="button button-secondary"
          >
            View details
            <span className="visually-hidden"> of room {room.number}</span>
          </Link>
          {!inMaintenance && (
            <Link to={`/book/${room.number}`} className="button">
              Book now
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
