// Trainer flags (bug mode & chaos mode), see docs/frontend-spec.md §7 and /__trainer.
// Loaded once before the app renders: runtime flags plus the `x-booker-flags` request header,
// so `extraHTTPHeaders` in a Playwright project switches them on for one test run.

export type UiFlag =
  | "stale-list"
  | "bug-a11y"
  | "bug-visual"
  | "bug-price"
  | "bug-auth"
  | "popup-cookie";

let enabled = new Set<string>();

export async function loadFlags() {
  try {
    const response = await fetch("/api/public/flags");
    const json = await response.json();
    enabled = new Set<string>(json?.data?.enabled ?? []);
  } catch {
    enabled = new Set();
  }
  // CSS hooks, e.g. [data-flags~="bug-visual"].
  if (enabled.size > 0)
    document.documentElement.dataset.flags = [...enabled].join(" ");
}

export const hasFlag = (flag: UiFlag) => enabled.has(flag);
