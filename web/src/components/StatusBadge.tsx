import type { BookingStatus } from "../api/types";
import { STATUS_LABELS } from "../lib/format";

export function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span
      className={`badge badge-${status.toLowerCase()}`}
      data-testid="status-badge"
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
