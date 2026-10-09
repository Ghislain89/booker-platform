// Deterministic mode: `?test=1` (remembered in the `booker-test` cookie) or the cookie itself.
// Turns off animations and random content, and keeps toasts until they are dismissed.
// `?test=0` switches it off again.
const COOKIE = "booker-test";

function detect(): boolean {
  const param = new URLSearchParams(window.location.search).get("test");
  if (param === "1") document.cookie = `${COOKIE}=1; path=/; SameSite=Lax`;
  if (param === "0")
    document.cookie = `${COOKIE}=; path=/; max-age=0; SameSite=Lax`;
  if (param === "1" || param === "0") return param === "1";
  return document.cookie.split("; ").includes(`${COOKIE}=1`);
}

export const TEST_MODE = detect();
if (TEST_MODE) document.documentElement.dataset.testMode = "";
