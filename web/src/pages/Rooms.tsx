import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import type { PageMeta, Room, RoomType } from "../api/types";
import { RoomCard } from "../components/RoomCard";
import {
  addDays,
  formatPrice,
  isValidDateInput,
  plural,
  ROOM_TYPE_LABELS,
  todayInput,
} from "../lib/format";
import { useTitle } from "../lib/useTitle";

const MAX_PRICE = 500;
const SORTS = [
  { value: "number", label: "Room number" },
  { value: "price", label: "Price: low to high" },
  { value: "-price", label: "Price: high to low" },
  { value: "-capacity", label: "Most guests" },
];

export function Rooms() {
  useTitle("Rooms");
  const [urlParams, setUrlParams] = useSearchParams();
  // React Router applies URL changes in a transition; keep an urgent copy so
  // controlled inputs reflect the change immediately.
  const [pending, setPending] = useState<URLSearchParams | null>(null);
  useEffect(() => setPending(null), [urlParams]);
  const params = pending ?? urlParams;
  const setParams = (next: URLSearchParams) => {
    setPending(next);
    setUrlParams(next, { replace: true });
  };

  const types = (params.get("type") ?? "")
    .split(",")
    .filter(Boolean) as RoomType[];
  const maxPrice = Number(params.get("maxPrice")) || MAX_PRICE;
  const guests = params.get("guests") ?? "";
  const checkIn = params.get("checkIn") ?? "";
  const checkOut = params.get("checkOut") ?? "";
  const sort = params.get("sort") ?? "number";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const datesValid =
    isValidDateInput(checkIn) &&
    isValidDateInput(checkOut) &&
    checkOut > checkIn;
  const datesError =
    checkIn && checkOut && !datesValid
      ? "Check-out must be after check-in"
      : undefined;

  const update = (
    changes: Record<string, string | undefined>,
    resetPage = true,
  ) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    if (resetPage) next.delete("page");
    setParams(next);
  };

  const toggleType = (type: RoomType, checked: boolean) => {
    const next = checked
      ? [...types, type]
      : types.filter((item) => item !== type);
    update({ type: next.join(",") });
  };

  const query = {
    type: types.join(",") || undefined,
    maxPrice: maxPrice < MAX_PRICE ? maxPrice : undefined,
    capacity: guests || undefined,
    checkIn: datesValid ? checkIn : undefined,
    checkOut: datesValid ? checkOut : undefined,
    sort: sort !== "number" ? sort : undefined,
    page,
    pageSize: 6,
  };

  const rooms = useQuery({
    queryKey: ["rooms", "search", query],
    queryFn: () =>
      api<{ data: Room[]; meta: PageMeta }>("/public/rooms", { query }),
    placeholderData: keepPreviousData,
  });

  const meta = rooms.data?.meta;

  return (
    <>
      <h1>Rooms</h1>
      <div className="rooms-layout">
        <form
          className="filters card"
          aria-label="Filters"
          onSubmit={(event) => event.preventDefault()}
        >
          <fieldset>
            <legend>Room type</legend>
            {(Object.keys(ROOM_TYPE_LABELS) as RoomType[]).map((type) => (
              <div className="checkbox" key={type}>
                <input
                  id={`type-${type}`}
                  type="checkbox"
                  checked={types.includes(type)}
                  onChange={(event) => toggleType(type, event.target.checked)}
                />
                <label htmlFor={`type-${type}`}>{ROOM_TYPE_LABELS[type]}</label>
              </div>
            ))}
          </fieldset>

          <div className="field">
            <label htmlFor="max-price">Maximum price per night</label>
            <input
              id="max-price"
              type="range"
              min={50}
              max={MAX_PRICE}
              step={10}
              value={maxPrice}
              aria-valuetext={
                maxPrice < MAX_PRICE ? formatPrice(maxPrice) : "Any price"
              }
              onChange={(event) =>
                update({
                  maxPrice:
                    event.target.value === String(MAX_PRICE)
                      ? undefined
                      : event.target.value,
                })
              }
            />
            <output htmlFor="max-price">
              {maxPrice < MAX_PRICE ? formatPrice(maxPrice) : "Any price"}
            </output>
          </div>

          <div className="field">
            <label htmlFor="guests">Guests</label>
            <select
              id="guests"
              value={guests}
              onChange={(event) => update({ guests: event.target.value })}
            >
              <option value="">Any</option>
              {[1, 2, 3, 4, 5, 6].map((count) => (
                <option key={count} value={count}>
                  {plural(count, "guest")}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="filter-check-in">Check-in date</label>
            <input
              id="filter-check-in"
              type="date"
              min={todayInput()}
              value={checkIn}
              onChange={(event) => {
                const value = event.target.value;
                update({
                  checkIn: value,
                  checkOut:
                    value && (!checkOut || checkOut <= value)
                      ? addDays(value, 1)
                      : checkOut,
                });
              }}
            />
          </div>
          <div className="field">
            <label htmlFor="filter-check-out">Check-out date</label>
            <input
              id="filter-check-out"
              type="date"
              min={checkIn ? addDays(checkIn, 1) : todayInput()}
              value={checkOut}
              aria-invalid={datesError ? true : undefined}
              aria-describedby={datesError ? "filter-dates-error" : undefined}
              onChange={(event) => update({ checkOut: event.target.value })}
            />
            {datesError && (
              <p className="field-error" id="filter-dates-error">
                {datesError}
              </p>
            )}
          </div>

          <div className="field">
            <label htmlFor="sort">Sort by</label>
            <select
              id="sort"
              value={sort}
              onChange={(event) =>
                update({
                  sort:
                    event.target.value === "number"
                      ? undefined
                      : event.target.value,
                })
              }
            >
              {SORTS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="button button-secondary"
            onClick={() => setParams(new URLSearchParams())}
          >
            Clear filters
          </button>
        </form>

        <section aria-label="Results" className="results">
          <p role="status" className="result-count">
            {rooms.isPending
              ? "Loading rooms…"
              : meta
                ? `${plural(meta.total, "room")} found`
                : ""}
          </p>
          {rooms.isError && (
            <p className="alert alert-error" role="alert">
              {rooms.error.message}
            </p>
          )}
          {rooms.data && rooms.data.data.length === 0 && (
            <p className="empty">No rooms match your filters.</p>
          )}
          {rooms.data && rooms.data.data.length > 0 && (
            <div className="room-grid" aria-busy={rooms.isFetching}>
              {rooms.data.data.map((room) => (
                <RoomCard key={room.id} room={room} />
              ))}
            </div>
          )}
          {meta && meta.totalPages > 1 && (
            <nav aria-label="Pagination" className="pagination">
              <button
                type="button"
                className="button button-secondary"
                disabled={page <= 1}
                onClick={() => update({ page: String(page - 1) }, false)}
              >
                Previous page
              </button>
              <span>
                Page {meta.page} of {meta.totalPages}
              </span>
              <button
                type="button"
                className="button button-secondary"
                disabled={page >= meta.totalPages}
                onClick={() => update({ page: String(page + 1) }, false)}
              >
                Next page
              </button>
            </nav>
          )}
        </section>
      </div>
    </>
  );
}
