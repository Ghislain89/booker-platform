import { Link } from "react-router";
import type { Room } from "../api/types";
import type { MessageKey } from "../lib/i18n";
import { formatPrice } from "../lib/format";
import { roomPhotos } from "../lib/photos";
import { useT } from "../lib/preferences";

export function RoomCard({ room }: { room: Room }) {
  const t = useT();
  const headingId = `room-${room.id}-heading`;
  const inMaintenance = room.status === "MAINTENANCE";
  const typeKey = `type.${room.type}` as MessageKey;
  const typeLabel = ["STANDARD", "DELUXE", "SUITE"].includes(room.type)
    ? t(typeKey)
    : room.type;
  return (
    <article className="card room-card" aria-labelledby={headingId}>
      <div className="room-photo">
        <img src={roomPhotos(room)[0]} alt="" width={400} height={250} />
        <span className="room-photo-number" aria-hidden="true">
          {room.number}
        </span>
      </div>
      <div className="card-body">
        <h3 id={headingId}>{t("room.title", { number: room.number })}</h3>
        <p className="room-type">{typeLabel}</p>
        <p className="room-price">
          <strong>{formatPrice(room.price)}</strong> {t("room.perNight")}
        </p>
        <p>
          {t("room.upTo", {
            guests: `${room.capacity} ${t(room.capacity === 1 ? "room.guest" : "room.guests")}`,
          })}
        </p>
        {room.amenities && room.amenities.length > 0 && (
          <ul className="amenities" aria-label={t("room.amenities")}>
            {room.amenities.map((amenity) => (
              <li key={amenity}>{amenity}</li>
            ))}
          </ul>
        )}
        {inMaintenance && <p className="notice">{t("room.maintenance")}</p>}
        <div className="card-actions">
          <Link
            to={`/rooms/${room.number}`}
            className="button button-secondary"
          >
            {t("room.details")}
            <span className="visually-hidden">
              {t("room.detailsOf", { number: room.number })}
            </span>
          </Link>
          {!inMaintenance && (
            <Link to={`/book/${room.number}`} className="button">
              {t("room.bookNow")}
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
