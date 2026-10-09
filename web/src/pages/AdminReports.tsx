import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError, DataResponse, saveBlob } from "../api/client";
import type { Report, ReportType } from "../api/types";
import { Dialog } from "../components/Dialog";
import { useToast } from "../components/Toasts";
import { addDays, formatDate, todayInput, toIsoDate } from "../lib/format";
import { useTitle } from "../lib/useTitle";

const TYPE_LABELS: Record<ReportType, string> = {
  OCCUPANCY: "Occupancy",
  REVENUE: "Revenue",
  CUSTOMER_SATISFACTION: "Customer satisfaction",
};

const humanize = (key: string) =>
  key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (first) => first.toUpperCase());

/** Flattens { a: 1, b: { c: 2 } } into [["A", 1], ["B: c", 2]]. */
function flatten(data: Record<string, unknown>, prefix = ""): [string, unknown][] {
  return Object.entries(data).flatMap(([key, value]) =>
    value && typeof value === "object" && !Array.isArray(value)
      ? flatten(value as Record<string, unknown>, `${prefix}${humanize(key)}: `)
      : [[`${prefix}${humanize(key)}`, value] as [string, unknown]],
  );
}

/** The figures to plot: one series per report type. */
function chartData(report: Report): { label: string; value: number }[] {
  const data = report.data as Record<string, any>;
  const entries = (object: Record<string, unknown> | undefined, suffix = "") =>
    Object.entries(object ?? {})
      .filter(([, value]) => typeof value === "number")
      .map(([label, value]) => ({ label: `${humanize(label)}${suffix}`, value: value as number }));
  switch (report.type) {
    case "OCCUPANCY":
      return [
        { label: "Occupied", value: Number(data.occupiedRooms ?? 0) },
        {
          label: "Available",
          value: Number(data.totalRooms ?? 0) - Number(data.occupiedRooms ?? 0),
        },
      ];
    case "REVENUE":
      return entries(data.revenueByRoomType);
    case "CUSTOMER_SATISFACTION":
      return entries(data.ratingDistribution, " stars").sort((a, b) =>
        b.label.localeCompare(a.label),
      );
    default:
      return entries(data);
  }
}

function BarChart({ report }: { report: Report }) {
  const bars = chartData(report);
  if (bars.length === 0) return null;
  const max = Math.max(...bars.map((bar) => bar.value), 1);
  const width = 480;
  const rowHeight = 36;
  const labelWidth = 120;
  const description = bars.map((bar) => `${bar.label}: ${bar.value}`).join(", ");
  return (
    <svg
      className="chart"
      role="img"
      aria-label={`Bar chart of the ${TYPE_LABELS[report.type].toLowerCase()} report. ${description}`}
      viewBox={`0 0 ${width} ${bars.length * rowHeight}`}
      width="100%"
      data-testid="report-chart"
    >
      {bars.map((bar, index) => {
        const barWidth = ((width - labelWidth - 70) * bar.value) / max;
        const y = index * rowHeight;
        return (
          <g key={bar.label} data-testid="chart-bar">
            <text x={0} y={y + 22} className="chart-label">
              {bar.label}
            </text>
            <rect
              x={labelWidth}
              y={y + 6}
              width={Math.max(barWidth, 2)}
              height={rowHeight - 12}
              className="chart-bar"
              rx={3}
            />
            <text x={labelWidth + barWidth + 8} y={y + 22} className="chart-value">
              {bar.value.toLocaleString("en-US")}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

const csvCell = (value: unknown) => {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

function exportCsv(report: Report) {
  const rows = [
    ["Metric", "Value"],
    ["Report", TYPE_LABELS[report.type]],
    ["Period start", report.period.start.slice(0, 10)],
    ["Period end", report.period.end.slice(0, 10)],
    ...flatten(report.data),
  ];
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
  saveBlob(
    new Blob([csv], { type: "text/csv;charset=utf-8" }),
    `report-${report.type.toLowerCase().replace(/_/g, "-")}-${report.period.start.slice(0, 10)}.csv`,
  );
}

export function AdminReports() {
  useTitle("Reports");
  const queryClient = useQueryClient();
  const notify = useToast();
  const [type, setType] = useState<ReportType>("OCCUPANCY");
  const [start, setStart] = useState(() => addDays(todayInput(), -30));
  const [end, setEnd] = useState(todayInput);
  const [formError, setFormError] = useState<string>();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Report | null>(null);

  const reports = useQuery({
    queryKey: ["private", "reports"],
    queryFn: () =>
      api<DataResponse<Report[]>>("/reports").then((response) => response.data),
  });

  const generate = useMutation({
    mutationFn: () =>
      api<DataResponse<Report>>("/reports/generate", {
        method: "POST",
        body: { type, period: { start: toIsoDate(start), end: toIsoDate(end) } },
      }),
    onSuccess: (response) => {
      notify(`${TYPE_LABELS[response.data.type]} report generated.`);
      setSelectedId(response.data.id);
      return queryClient.invalidateQueries({ queryKey: ["private", "reports"] });
    },
    onError: (error) =>
      setFormError(
        error instanceof ApiError && error.details
          ? Object.values(error.details).join(". ")
          : error.message,
      ),
  });

  const remove = useMutation({
    mutationFn: (report: Report) => api(`/reports/${report.id}`, { method: "DELETE" }),
    onSuccess: (_, report) => {
      notify("Report deleted.");
      if (selectedId === report.id) setSelectedId(null);
      setToDelete(null);
      return queryClient.invalidateQueries({ queryKey: ["private", "reports"] });
    },
    onError: (error) => notify(`Could not delete the report: ${error.message}`),
  });

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setFormError(undefined);
    if (!start || !end) return setFormError("Choose a start and an end date");
    if (end < start) return setFormError("The end date must be after the start date");
    generate.mutate();
  };

  const selected = reports.data?.find((report) => report.id === selectedId);

  return (
    <>
      <h1>Reports</h1>
      <section className="card" aria-labelledby="generate-heading">
        <form className="card-body form form-inline" noValidate onSubmit={onSubmit}>
          <h2 id="generate-heading">Generate a report</h2>
          {formError && (
            <p className="alert alert-error" role="alert">
              {formError}
            </p>
          )}
          <div className="form-row">
            <div className="field">
              <label htmlFor="report-type">Report type</label>
              <select
                id="report-type"
                value={type}
                onChange={(event) => setType(event.target.value as ReportType)}
              >
                {(Object.keys(TYPE_LABELS) as ReportType[]).map((value) => (
                  <option key={value} value={value}>
                    {TYPE_LABELS[value]}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="report-start">Start date</label>
              <input
                id="report-start"
                type="date"
                value={start}
                onChange={(event) => setStart(event.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="report-end">End date</label>
              <input
                id="report-end"
                type="date"
                value={end}
                onChange={(event) => setEnd(event.target.value)}
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="button" disabled={generate.isPending}>
              {generate.isPending ? "Generating…" : "Generate report"}
            </button>
          </div>
        </form>
      </section>

      {selected && (
        <section className="card report" aria-labelledby="report-heading">
          <div className="card-body">
            <h2 id="report-heading">
              {TYPE_LABELS[selected.type]} report
            </h2>
            <p className="meta">
              {formatDate(selected.period.start)} – {formatDate(selected.period.end)}
            </p>
            <BarChart report={selected} />
            <dl className="facts">
              {flatten(selected.data).map(([label, value]) => (
                <div key={label} className="fact">
                  <dt>{label}</dt>
                  <dd>{String(value)}</dd>
                </div>
              ))}
            </dl>
            <div className="form-actions">
              <button
                type="button"
                className="button button-secondary"
                onClick={() => exportCsv(selected)}
              >
                Export CSV
              </button>
            </div>
          </div>
        </section>
      )}

      <section aria-labelledby="reports-heading">
        <h2 id="reports-heading">Generated reports</h2>
        {reports.isPending && <p role="status">Loading reports…</p>}
        {reports.isError && (
          <p className="alert alert-error" role="alert">
            {reports.error.message}
          </p>
        )}
        {reports.data && reports.data.length === 0 && (
          <p className="empty">No reports yet.</p>
        )}
        {reports.data && reports.data.length > 0 && (
          <div className="table-wrapper">
            <table>
              <caption className="visually-hidden">Generated reports</caption>
              <thead>
                <tr>
                  <th scope="col">Type</th>
                  <th scope="col">Period</th>
                  <th scope="col">Generated</th>
                  <th scope="col">
                    <span className="visually-hidden">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {reports.data.map((report) => (
                  <tr key={report.id} data-testid="report-row">
                    <td data-label="Type">{TYPE_LABELS[report.type]}</td>
                    <td data-label="Period">
                      {formatDate(report.period.start)} – {formatDate(report.period.end)}
                    </td>
                    <td data-label="Generated">{formatDate(report.generatedAt)}</td>
                    <td className="actions-cell">
                      <div className="row-actions">
                        <button
                          type="button"
                          className="button button-secondary button-small"
                          aria-pressed={selectedId === report.id}
                          onClick={() => setSelectedId(report.id)}
                        >
                          View
                        </button>
                        <button
                          type="button"
                          className="button button-danger button-small"
                          onClick={() => setToDelete(report)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Dialog
        open={toDelete !== null}
        title="Delete report"
        onClose={() => setToDelete(null)}
      >
        {toDelete && (
          <>
            <p>
              Delete the {TYPE_LABELS[toDelete.type].toLowerCase()} report for{" "}
              {formatDate(toDelete.period.start)} – {formatDate(toDelete.period.end)}?
            </p>
            <div className="form-actions">
              <button
                type="button"
                className="button button-danger"
                disabled={remove.isPending}
                onClick={() => remove.mutate(toDelete)}
              >
                Delete
              </button>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setToDelete(null)}
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </Dialog>
    </>
  );
}
