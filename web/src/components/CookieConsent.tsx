import { useEffect, useState } from "react";
import { Dialog } from "./Dialog";

const KEY = "booker.cookie-consent";

/**
 * Chaos flag `popup-cookie`: a consent dialog that appears after a random delay and
 * blocks the page. Handle it with `page.addLocatorHandler()` (assignment 10).
 */
export function CookieConsent() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(KEY)) return;
    const timer = setTimeout(
      () => setOpen(true),
      300 + Math.floor(Math.random() * 1200),
    );
    return () => clearTimeout(timer);
  }, []);

  const choose = (choice: "all" | "necessary") => {
    localStorage.setItem(KEY, choice);
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      title="We value your privacy"
      onClose={() => choose("necessary")}
    >
      <p>
        We use cookies to improve your stay on our website. You can accept all
        cookies or only the ones we need to make the site work.
      </p>
      <div className="form-actions">
        <button type="button" className="button" onClick={() => choose("all")}>
          Accept all
        </button>
        <button
          type="button"
          className="button button-secondary"
          onClick={() => choose("necessary")}
        >
          Only necessary
        </button>
      </div>
    </Dialog>
  );
}
