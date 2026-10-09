import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, DataResponse } from "../api/client";
import { Dialog } from "../components/Dialog";
import { useToast } from "../components/Toasts";
import { useAuth } from "../lib/auth";
import { useTitle } from "../lib/useTitle";

// Trainer panel: switch bug mode and chaos mode flags and reset the data during a training.
// Uses the test-support API, so it only works when that is enabled (not in production).

const DESCRIPTIONS: Record<string, { group: "Chaos mode" | "Bug mode"; text: string }> = {
  "slow-rooms": { group: "Chaos mode", text: "Room lists respond after 1–3 seconds." },
  "flaky-booking": { group: "Chaos mode", text: "30% of new bookings fail with a 500 error." },
  "random-order": { group: "Chaos mode", text: "Room lists come back in a random order." },
  "popup-cookie": { group: "Chaos mode", text: "A cookie consent dialog pops up after a random delay." },
  "stale-list": { group: "Bug mode", text: "My bookings does not refresh after cancelling a booking." },
  "bug-a11y": { group: "Bug mode", text: "Form labels and the logo's alt text disappear; badges get low contrast." },
  "bug-visual": { group: "Bug mode", text: "The layout shifts 3 px and buttons change colour." },
  "bug-price": { group: "Bug mode", text: "The booking wizard charges one night too many." },
  "bug-auth": { group: "Bug mode", text: "Expired tokens are not handled: a 401 leaves a blank page." },
};

interface Flags {
  enabled: string[];
  available: string[];
}

export function Trainer() {
  useTitle("Trainer panel");
  const queryClient = useQueryClient();
  const notify = useToast();
  const { logout } = useAuth();
  const [selected, setSelected] = useState<string[] | null>(null);
  const [saved, setSaved] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const flags = useQuery({
    queryKey: ["trainer", "flags"],
    queryFn: () =>
      api<DataResponse<Flags>>("/testing/flags").then((response) => response.data),
  });
  const enabled = selected ?? flags.data?.enabled ?? [];

  const save = useMutation({
    mutationFn: () =>
      api<DataResponse<Flags>>("/testing/flags", {
        method: "PUT",
        body: { flags: enabled },
      }),
    onSuccess: (response) => {
      queryClient.setQueryData(["trainer", "flags"], response.data);
      setSelected(null);
      setSaved(true);
      notify("Flags saved.");
    },
    onError: (error) => notify(`Could not save the flags: ${error.message}`),
  });

  const reset = useMutation({
    mutationFn: () => api("/testing/reset", { method: "POST" }),
    onSuccess: () => {
      setConfirmReset(false);
      setSelected(null);
      setSaved(true);
      logout();
      queryClient.invalidateQueries();
      notify("The database has been reset and all flags are off.");
    },
    onError: (error) => notify(`Could not reset the database: ${error.message}`),
  });

  const toggle = (flag: string, on: boolean) => {
    setSaved(false);
    setSelected(on ? [...enabled, flag] : enabled.filter((item) => item !== flag));
  };

  const groups = ["Chaos mode", "Bug mode"] as const;

  return (
    <div className="page-medium">
      <h1>Trainer panel</h1>
      <p>
        Switch flags for everyone using this server. Tests can also switch them
        per request with the <code>x-booker-flags</code> header.
      </p>
      {flags.isPending && <p role="status">Loading flags…</p>}
      {flags.isError && (
        <p className="alert alert-error" role="alert">
          The test-support API is not available: {flags.error.message}. It is
          switched off when <code>NODE_ENV=production</code>; set{" "}
          <code>BOOKER_TEST_API=1</code> to enable it.
        </p>
      )}
      {flags.data && (
        <form
          className="form"
          onSubmit={(event) => {
            event.preventDefault();
            save.mutate();
          }}
        >
          {groups.map((group) => (
            <fieldset key={group} className="card card-body flag-group">
              <legend>{group}</legend>
              {flags.data.available
                .filter((flag) => (DESCRIPTIONS[flag]?.group ?? "Bug mode") === group)
                .map((flag) => (
                  <div className="checkbox flag" key={flag}>
                    <input
                      type="checkbox"
                      id={`flag-${flag}`}
                      checked={enabled.includes(flag)}
                      onChange={(event) => toggle(flag, event.target.checked)}
                      aria-describedby={`flag-${flag}-description`}
                    />
                    <label htmlFor={`flag-${flag}`}>
                      <code>{flag}</code>
                    </label>
                    <p className="hint" id={`flag-${flag}-description`}>
                      {DESCRIPTIONS[flag]?.text ?? ""}
                    </p>
                  </div>
                ))}
            </fieldset>
          ))}
          {saved && (
            <p className="alert alert-success" role="status">
              Saved. Flags that change the web UI apply after a page reload.{" "}
              <button
                type="button"
                className="button button-small button-secondary"
                onClick={() => window.location.reload()}
              >
                Reload now
              </button>
            </p>
          )}
          <div className="form-actions">
            <button type="submit" className="button" disabled={save.isPending}>
              Save flags
            </button>
            <button
              type="button"
              className="button button-danger"
              onClick={() => setConfirmReset(true)}
            >
              Reset database
            </button>
          </div>
        </form>
      )}
      <Dialog
        open={confirmReset}
        title="Reset database"
        onClose={() => setConfirmReset(false)}
      >
        <p>
          Delete all data, restore the seed data and switch all flags off? You
          will be logged out.
        </p>
        <div className="dialog-actions">
          <button
            type="button"
            className="button button-secondary"
            onClick={() => setConfirmReset(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="button button-danger"
            disabled={reset.isPending}
            onClick={() => reset.mutate()}
          >
            Reset
          </button>
        </div>
      </Dialog>
    </div>
  );
}
