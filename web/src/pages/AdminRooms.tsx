import { DragEvent, FormEvent, useId, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError, DataResponse } from "../api/client";
import type { Room, RoomInput, RoomStatus, RoomType } from "../api/types";
import { Dialog } from "../components/Dialog";
import { Field } from "../components/Field";
import { useToast } from "../components/Toasts";
import { formatPrice, ROOM_TYPE_LABELS, roomTypeLabel } from "../lib/format";
import { useTitle } from "../lib/useTitle";

const STATUS_LABELS: Record<RoomStatus, string> = {
  AVAILABLE: "Available",
  OCCUPIED: "Occupied",
  MAINTENANCE: "Maintenance",
};

type SortKey = "position" | "number" | "type" | "price" | "capacity" | "status";
const PAGE_SIZE = 10;

const emptyRoom: RoomInput = {
  number: "",
  type: "STANDARD",
  price: 100,
  capacity: 2,
  amenities: [],
  status: "AVAILABLE",
  featured: false,
};

export function AdminRooms() {
  useTitle("Room management");
  const queryClient = useQueryClient();
  const notify = useToast();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<{
    key: SortKey;
    direction: "ascending" | "descending";
  }>({ key: "number", direction: "ascending" });
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Room | "new" | null>(null);
  const [deleting, setDeleting] = useState<Room | null>(null);
  const [reordering, setReordering] = useState(false);

  const rooms = useQuery({
    queryKey: ["private", "admin-rooms"],
    queryFn: () =>
      api<DataResponse<Room[]>>("/rooms").then((response) => response.data),
  });

  const remove = useMutation({
    mutationFn: (room: Room) => api(`/rooms/${room.id}`, { method: "DELETE" }),
    onSuccess: (_, room) => {
      notify(`Room ${room.number} deleted.`);
      setDeleting(null);
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      return queryClient.invalidateQueries({
        queryKey: ["private", "admin-rooms"],
      });
    },
  });

  const term = search.trim().toLowerCase();
  const filtered = (rooms.data ?? []).filter(
    (room) =>
      !term ||
      [
        room.number,
        roomTypeLabel(room.type),
        room.status ? STATUS_LABELS[room.status] : "",
        ...(room.amenities ?? []),
      ].some((value) => value.toLowerCase().includes(term)),
  );
  const sorted = [...filtered].sort((a, b) => {
    const left = a[sort.key] ?? "";
    const right = b[sort.key] ?? "";
    const result =
      typeof left === "number" && typeof right === "number"
        ? left - right
        : String(left).localeCompare(String(right), "en", { numeric: true });
    return sort.direction === "ascending" ? result : -result;
  });
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = sorted.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const sortBy = (key: SortKey) => {
    setSort((current) => ({
      key,
      direction:
        current.key === key && current.direction === "ascending"
          ? "descending"
          : "ascending",
    }));
    setPage(1);
  };

  const header = (key: SortKey, label: string) => (
    <th scope="col" aria-sort={sort.key === key ? sort.direction : undefined}>
      <button type="button" className="sort-button" onClick={() => sortBy(key)}>
        {label}
        <span aria-hidden="true">
          {sort.key === key
            ? sort.direction === "ascending"
              ? " ▲"
              : " ▼"
            : ""}
        </span>
      </button>
    </th>
  );

  return (
    <>
      <div className="page-header">
        <h1>Room management</h1>
        <div className="row-actions">
          <button
            type="button"
            className="button button-secondary"
            onClick={() => setReordering(true)}
            disabled={!rooms.data}
          >
            Change order
          </button>
          <button
            type="button"
            className="button"
            onClick={() => setEditing("new")}
          >
            Add room
          </button>
        </div>
      </div>

      <div className="field search">
        <label htmlFor="room-search">Search</label>
        <input
          id="room-search"
          type="search"
          placeholder="Search rooms"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
      </div>

      {rooms.isPending && <p role="status">Loading rooms…</p>}
      {rooms.isError && (
        <p className="alert alert-error" role="alert">
          {rooms.error.message}
        </p>
      )}
      {rooms.data && (
        <>
          <p className="result-count" role="status">
            {filtered.length} of {rooms.data.length} rooms
          </p>
          <div className="table-wrapper">
            <table>
              <caption className="visually-hidden">Rooms</caption>
              <thead>
                <tr>
                  {header("position", "Order")}
                  {header("number", "Number")}
                  {header("type", "Type")}
                  {header("price", "Price")}
                  {header("capacity", "Capacity")}
                  {header("status", "Status")}
                  <th scope="col">Featured</th>
                  <th scope="col">
                    <span className="visually-hidden">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((room) => (
                  <tr key={room.id} data-testid="room-row">
                    <td data-label="Order">{room.position ?? ""}</td>
                    <td data-label="Number">{room.number}</td>
                    <td data-label="Type">{roomTypeLabel(room.type)}</td>
                    <td data-label="Price">{formatPrice(room.price)}</td>
                    <td data-label="Capacity">{room.capacity}</td>
                    <td data-label="Status">
                      {room.status ? STATUS_LABELS[room.status] : ""}
                    </td>
                    <td data-label="Featured">
                      {room.featured ? "Yes" : "No"}
                    </td>
                    <td className="actions-cell">
                      <div className="row-actions">
                        <button
                          type="button"
                          className="button button-secondary button-small"
                          aria-label={`Edit room ${room.number}`}
                          onClick={() => setEditing(room)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="button button-danger button-small"
                          aria-label={`Delete room ${room.number}`}
                          onClick={() => {
                            remove.reset();
                            setDeleting(room);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={8}>No rooms match your search.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <nav aria-label="Pagination" className="pagination">
              <button
                type="button"
                className="button button-secondary"
                disabled={currentPage <= 1}
                onClick={() => setPage(currentPage - 1)}
              >
                Previous page
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                className="button button-secondary"
                disabled={currentPage >= totalPages}
                onClick={() => setPage(currentPage + 1)}
              >
                Next page
              </button>
            </nav>
          )}
        </>
      )}

      <Dialog
        open={editing !== null}
        title={
          editing === "new" ? "Add room" : `Edit room ${editing?.number ?? ""}`
        }
        onClose={() => setEditing(null)}
      >
        {editing !== null && (
          <RoomForm
            room={editing === "new" ? null : editing}
            onDone={() => setEditing(null)}
          />
        )}
      </Dialog>

      <Dialog
        open={reordering}
        title="Change room order"
        onClose={() => setReordering(false)}
      >
        {reordering && rooms.data && (
          <RoomOrder rooms={rooms.data} onDone={() => setReordering(false)} />
        )}
      </Dialog>

      <Dialog
        open={deleting !== null}
        title={`Delete room ${deleting?.number ?? ""}?`}
        onClose={() => setDeleting(null)}
      >
        <p>This cannot be undone. Rooms with bookings cannot be deleted.</p>
        {remove.isError && (
          <p className="alert alert-error" role="alert">
            {remove.error.message}
          </p>
        )}
        <div className="dialog-actions">
          <button
            type="button"
            className="button button-secondary"
            onClick={() => setDeleting(null)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="button button-danger"
            disabled={remove.isPending}
            onClick={() => deleting && remove.mutate(deleting)}
          >
            Delete
          </button>
        </div>
      </Dialog>
    </>
  );
}

function RoomForm({ room, onDone }: { room: Room | null; onDone: () => void }) {
  const queryClient = useQueryClient();
  const notify = useToast();
  const initial = room
    ? {
        ...emptyRoom,
        ...room,
        amenities: room.amenities ?? [],
        status: room.status ?? "AVAILABLE",
        featured: !!room.featured,
      }
    : emptyRoom;
  const [values, setValues] = useState({
    number: initial.number,
    type: initial.type,
    price: String(initial.price),
    capacity: String(initial.capacity),
    amenities: initial.amenities.join(", "),
    status: initial.status,
    featured: initial.featured,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const save = useMutation({
    mutationFn: (input: RoomInput) =>
      room
        ? api<DataResponse<Room>>(`/rooms/${room.id}`, {
            method: "PUT",
            body: input,
          })
        : api<DataResponse<Room>>("/rooms", { method: "POST", body: input }),
    onSuccess: (response) => {
      notify(
        room
          ? `Room ${response.data.number} updated.`
          : `Room ${response.data.number} added.`,
      );
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["private", "admin-rooms"] });
      onDone();
    },
    onError: (error) => {
      if (error instanceof ApiError && error.details) setErrors(error.details);
    },
  });

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const result: Record<string, string> = {};
    if (!values.number.trim()) result.number = "Enter a room number";
    const price = Number(values.price);
    if (values.price === "" || !Number.isFinite(price) || price < 0)
      result.price = "Enter a price of 0 or more";
    const capacity = Number(values.capacity);
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 10)
      result.capacity = "Enter a capacity between 1 and 10";
    setErrors(result);
    if (Object.keys(result).length > 0) return;
    save.mutate({
      number: values.number.trim(),
      type: values.type,
      price,
      capacity,
      amenities: values.amenities
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      status: values.status,
      featured: values.featured,
    });
  };

  return (
    <form onSubmit={onSubmit} noValidate className="form">
      {save.isError && (
        <p className="alert alert-error" role="alert">
          {save.error.message}
        </p>
      )}
      <Field
        label="Room number"
        value={values.number}
        error={errors.number}
        onChange={(event) =>
          setValues({ ...values, number: event.target.value })
        }
        required
      />
      <div className="field">
        <label htmlFor="room-type">Room type</label>
        <select
          id="room-type"
          value={values.type}
          onChange={(event) =>
            setValues({ ...values, type: event.target.value as RoomType })
          }
        >
          {(Object.keys(ROOM_TYPE_LABELS) as RoomType[]).map((type) => (
            <option key={type} value={type}>
              {ROOM_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
      </div>
      <div className="field-row">
        <Field
          label="Price per night"
          type="number"
          min={0}
          value={values.price}
          error={errors.price}
          onChange={(event) =>
            setValues({ ...values, price: event.target.value })
          }
          required
        />
        <Field
          label="Capacity"
          type="number"
          min={1}
          max={10}
          value={values.capacity}
          error={errors.capacity}
          onChange={(event) =>
            setValues({ ...values, capacity: event.target.value })
          }
          required
        />
      </div>
      <Field
        label="Amenities"
        value={values.amenities}
        hint="Separate amenities with commas, for example: WiFi, TV"
        error={errors.amenities}
        onChange={(event) =>
          setValues({ ...values, amenities: event.target.value })
        }
      />
      <div className="field">
        <label htmlFor="room-status">Status</label>
        <select
          id="room-status"
          value={values.status}
          onChange={(event) =>
            setValues({ ...values, status: event.target.value as RoomStatus })
          }
        >
          {(Object.keys(STATUS_LABELS) as RoomStatus[]).map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </div>
      {room && <RoomPhoto room={room} />}
      <div className="checkbox">
        <input
          id="room-featured"
          type="checkbox"
          checked={values.featured}
          onChange={(event) =>
            setValues({ ...values, featured: event.target.checked })
          }
        />
        <label htmlFor="room-featured">Show on the home page</label>
      </div>
      <div className="dialog-actions">
        <button
          type="button"
          className="button button-secondary"
          onClick={onDone}
        >
          Cancel
        </button>
        <button type="submit" className="button" disabled={save.isPending}>
          Save room
        </button>
      </div>
    </form>
  );
}

const byPosition = (a: Room, b: Room) =>
  (a.position ?? 0) - (b.position ?? 0) ||
  a.number.localeCompare(b.number, "en", { numeric: true });

/**
 * Drag & drop with the HTML5 drag events (practise `locator.dragTo()`), plus the
 * arrow keys on the handle as the keyboard alternative.
 */
function RoomOrder({ rooms, onDone }: { rooms: Room[]; onDone: () => void }) {
  const queryClient = useQueryClient();
  const notify = useToast();
  const [order, setOrder] = useState(() => [...rooms].sort(byPosition));
  const [dragged, setDragged] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const move = (id: string, to: number) => {
    setOrder((current) => {
      const from = current.findIndex((room) => room.id === id);
      if (from === -1 || to < 0 || to >= current.length || from === to)
        return current;
      const next = [...current];
      const [room] = next.splice(from, 1);
      next.splice(to, 0, room);
      setAnnouncement(
        `Room ${room.number} moved to position ${to + 1} of ${next.length}.`,
      );
      return next;
    });
  };

  const save = useMutation({
    mutationFn: () =>
      api<DataResponse<Room[]>>("/rooms/order", {
        method: "PUT",
        body: { roomIds: order.map((room) => room.id) },
      }),
    onSuccess: () => {
      notify("Room order saved.");
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["private", "admin-rooms"] });
      onDone();
    },
  });

  const onDrop = (event: DragEvent, index: number) => {
    event.preventDefault();
    const id = dragged ?? event.dataTransfer.getData("text/plain");
    if (id) move(id, index);
    setDragged(null);
  };

  return (
    <>
      <p className="hint">
        Drag the rooms into the order you want, or focus a handle and use the
        arrow keys.
      </p>
      {save.isError && (
        <p className="alert alert-error" role="alert">
          {save.error.message}
        </p>
      )}
      <ol className="sortable" aria-label="Room order">
        {order.map((room, index) => (
          <li
            key={room.id}
            data-testid="sortable-room"
            className={dragged === room.id ? "dragging" : undefined}
            draggable
            onDragStart={(event) => {
              setDragged(room.id);
              event.dataTransfer.setData("text/plain", room.id);
              event.dataTransfer.effectAllowed = "move";
            }}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
            }}
            onDrop={(event) => onDrop(event, index)}
            onDragEnd={() => setDragged(null)}
          >
            <button
              type="button"
              className="drag-handle"
              aria-label={`Move room ${room.number}`}
              aria-describedby="sortable-hint"
              onKeyDown={(event) => {
                const delta =
                  event.key === "ArrowUp" ? -1 : event.key === "ArrowDown" ? 1 : 0;
                if (!delta) return;
                event.preventDefault();
                move(room.id, index + delta);
                // Keep focus on the handle of the moved room.
                requestAnimationFrame(() =>
                  (
                    document.querySelector(
                      `[aria-label="Move room ${room.number}"]`,
                    ) as HTMLElement | null
                  )?.focus(),
                );
              }}
            >
              <span aria-hidden="true">⠿</span>
            </button>
            <span>
              Room {room.number}{" "}
              <span className="meta">({roomTypeLabel(room.type)})</span>
            </span>
          </li>
        ))}
      </ol>
      <p id="sortable-hint" className="visually-hidden">
        Use the up and down arrow keys to move the room.
      </p>
      <p className="visually-hidden" aria-live="assertive">
        {announcement}
      </p>
      <div className="dialog-actions">
        <button type="button" className="button button-secondary" onClick={onDone}>
          Cancel
        </button>
        <button
          type="button"
          className="button"
          disabled={save.isPending}
          onClick={() => save.mutate()}
        >
          Save order
        </button>
      </div>
    </>
  );
}

/** Upload with `setInputFiles()`; the photo shows up on the room card and detail page. */
function RoomPhoto({ room }: { room: Room }) {
  const queryClient = useQueryClient();
  const notify = useToast();
  const inputId = useId();
  const [imageUrl, setImageUrl] = useState(room.imageUrl ?? null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string>();

  const refresh = (updated: Room) => {
    setImageUrl(updated.imageUrl ?? null);
    queryClient.invalidateQueries({ queryKey: ["rooms"] });
    queryClient.invalidateQueries({ queryKey: ["private", "admin-rooms"] });
  };

  const upload = useMutation({
    mutationFn: (image: File) => {
      const form = new FormData();
      form.append("image", image);
      return api<DataResponse<Room>>(`/rooms/${room.id}/image`, {
        method: "POST",
        form,
      });
    },
    onSuccess: (response) => {
      refresh(response.data);
      setFile(null);
      notify(`Photo of room ${room.number} uploaded.`);
    },
    onError: (failure) =>
      setError(
        failure instanceof ApiError && failure.details?.image
          ? failure.details.image
          : failure.message,
      ),
  });

  const removePhoto = useMutation({
    mutationFn: () =>
      api<DataResponse<Room>>(`/rooms/${room.id}/image`, { method: "DELETE" }),
    onSuccess: (response) => {
      refresh(response.data);
      notify(`Photo of room ${room.number} removed.`);
    },
    onError: (failure) => setError(failure.message),
  });

  return (
    <fieldset className="room-photo-field">
      <legend>Photo</legend>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={`Current photo of room ${room.number}`}
          width={200}
          height={125}
          className="room-photo-preview"
        />
      ) : (
        <p className="hint">No photo uploaded; guests see placeholder photos.</p>
      )}
      <div className="field">
        <label htmlFor={inputId}>Room photo</label>
        <input
          id={inputId}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
          onChange={(event) => {
            setError(undefined);
            setFile(event.target.files?.[0] ?? null);
          }}
        />
        {error && (
          <p className="field-error" id={`${inputId}-error`}>
            {error}
          </p>
        )}
      </div>
      <div className="row-actions">
        <button
          type="button"
          className="button button-secondary button-small"
          disabled={!file || upload.isPending}
          onClick={() => file && upload.mutate(file)}
        >
          Upload photo
        </button>
        {imageUrl && (
          <button
            type="button"
            className="button button-danger button-small"
            disabled={removePhoto.isPending}
            onClick={() => removePhoto.mutate()}
          >
            Remove photo
          </button>
        )}
      </div>
    </fieldset>
  );
}
