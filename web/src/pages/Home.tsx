import { useMemo } from "react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import type { PageMeta, Room } from "../api/types";
import { RoomCard } from "../components/RoomCard";
import { useBranding } from "../lib/queries";
import { TEST_MODE } from "../lib/testMode";
import { useTitle } from "../lib/useTitle";

const DEALS = [
  "Stay three nights, get breakfast for free",
  "Book 30 days ahead and save 10%",
  "Free parking with every Deluxe room",
  "Late check-out included on Sundays",
  "Suites with an ocean view from € 280",
];

/** Random on every visit, fixed in test mode: a classic candidate for masking in screenshots. */
function pickDeal() {
  if (TEST_MODE) return { text: DEALS[0], roomsLeft: 3 };
  return {
    text: DEALS[Math.floor(Math.random() * DEALS.length)],
    roomsLeft: 2 + Math.floor(Math.random() * 7),
  };
}

export function Home() {
  useTitle();
  const { data: branding } = useBranding();
  const deal = useMemo(pickDeal, []);
  const featured = useQuery({
    queryKey: ["rooms", "featured"],
    queryFn: () =>
      api<{ data: Room[]; meta: PageMeta }>("/public/rooms", {
        query: { featured: "true", pageSize: 3 },
      }),
  });

  return (
    <>
      <section className="hero">
        <h1>{branding?.name ?? "Booker Hotel"}</h1>
        <p className="lead">{branding?.description}</p>
        <Link to="/rooms" className="button button-large">
          Browse all rooms
        </Link>
      </section>

      <aside
        className="deal-of-the-day"
        data-testid="deal-of-the-day"
        aria-label="Deal of the day"
      >
        <strong>Deal of the day:</strong> {deal.text}. Only {deal.roomsLeft}{" "}
        rooms left at this price!
      </aside>

      <section aria-labelledby="featured-heading">
        <h2 id="featured-heading">Featured rooms</h2>
        {featured.isPending && <p role="status">Loading rooms…</p>}
        {featured.isError && <p role="alert">{featured.error.message}</p>}
        {featured.data && (
          <div className="room-grid">
            {featured.data.data.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        )}
      </section>

      {branding && (
        <section aria-labelledby="contact-heading" className="contact">
          <h2 id="contact-heading">Contact</h2>
          <address>
            {branding.contact.name}
            <br />
            {branding.contact.address}
            <br />
            Phone:{" "}
            <a href={`tel:${branding.contact.phone.replace(/\s/g, "")}`}>
              {branding.contact.phone}
            </a>
            <br />
            E-mail:{" "}
            <a href={`mailto:${branding.contact.email}`}>
              {branding.contact.email}
            </a>
          </address>
        </section>
      )}
    </>
  );
}
