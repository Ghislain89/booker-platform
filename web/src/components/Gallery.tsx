import { useState } from "react";
import type { Room } from "../api/types";
import { roomPhotos } from "../lib/photos";
import { Dialog } from "./Dialog";

/** Room photos with a lightbox: a modal dialog with Previous/Next buttons and arrow keys. */
export function Gallery({ room }: { room: Room }) {
  const photos = roomPhotos(room);
  const [index, setIndex] = useState<number | null>(null);
  const alt = (i: number) =>
    `Photo ${i + 1} of ${photos.length} of room ${room.number}`;

  const go = (delta: number) =>
    setIndex((current) =>
      current === null
        ? current
        : (current + delta + photos.length) % photos.length,
    );

  return (
    <>
      <ul className="gallery" aria-label={`Photos of room ${room.number}`}>
        {photos.map((photo, i) => (
          <li key={photo}>
            <button
              type="button"
              className="gallery-thumb"
              onClick={() => setIndex(i)}
            >
              <img src={photo} alt={alt(i)} width={400} height={250} />
            </button>
          </li>
        ))}
      </ul>
      <Dialog
        open={index !== null}
        title={`Photos of room ${room.number}`}
        onClose={() => setIndex(null)}
      >
        {index !== null && (
          <div
            className="lightbox"
            onKeyDown={(event) => {
              if (event.key === "ArrowRight") go(1);
              if (event.key === "ArrowLeft") go(-1);
            }}
          >
            <img
              src={photos[index]}
              alt={alt(index)}
              width={800}
              height={500}
              data-testid="lightbox-image"
            />
            <div className="lightbox-controls">
              <button
                type="button"
                className="button button-secondary"
                onClick={() => go(-1)}
              >
                Previous
              </button>
              <span aria-live="polite">
                {index + 1} / {photos.length}
              </span>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => go(1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </Dialog>
    </>
  );
}
