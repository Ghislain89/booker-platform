import { useEffect, useId, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, DataResponse } from "../api/client";
import type { Branding, Message, User } from "../api/types";
import { useAuth } from "../lib/auth";
import { useEvents } from "../lib/events";
import { hasFlag } from "../lib/flags";
import { useT } from "../lib/preferences";
import { useBranding } from "../lib/queries";
import { CookieConsent } from "./CookieConsent";
import { useToast } from "./Toasts";

export function useMe() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["private", "me"],
    queryFn: () =>
      api<DataResponse<User>>("/auth/me").then((response) => response.data),
    enabled: !!user,
  });
}

export function useAdminMessages(enabled = true) {
  return useQuery({
    queryKey: ["private", "messages", "all"],
    queryFn: () =>
      api<DataResponse<Message[]>>("/messages").then(
        (response) => response.data,
      ),
    enabled,
  });
}

const PREVIEW = new URLSearchParams(window.location.search).has("preview");

export function Layout() {
  const { user, isAdmin, logout } = useAuth();
  const { data: branding } = useBranding();
  const navigate = useNavigate();
  const location = useLocation();
  const notify = useToast();
  const t = useT();
  const queryClient = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const messages = useAdminMessages(isAdmin);
  const unreadMessages =
    messages.data?.filter((message) => message.status === "UNREAD").length ??
    0;

  useEffect(() => {
    if (!branding) return;
    const root = document.documentElement.style;
    root.setProperty("--primary", branding.theme.primaryColor);
    root.setProperty("--secondary", branding.theme.secondaryColor);
  }, [branding]);

  // Branding page preview: the admin page posts unsaved changes into this iframe.
  useEffect(() => {
    if (!PREVIEW) return;
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== "booker:branding-preview") return;
      queryClient.setQueryData<Branding>(["branding"], (current) =>
        current ? { ...current, ...event.data.branding } : current,
      );
    };
    window.addEventListener("message", onMessage);
    window.parent.postMessage(
      { type: "booker:preview-ready" },
      window.location.origin,
    );
    return () => window.removeEventListener("message", onMessage);
  }, [queryClient]);

  useEffect(() => setMenuOpen(false), [location.pathname]);

  const onLogout = () => {
    logout();
    notify("You have been logged out.");
    navigate("/");
  };

  const hotelName = branding?.name ?? "Booker Hotel";

  return (
    <>
      <a className="skip-link" href="#main">
        {t("skip")}
      </a>
      <header className={isAdmin ? "site-header site-header-admin" : "site-header"}>
        <div className="container header-inner">
          <Link to="/" className="brand">
            {hasFlag("bug-a11y") ? (
              // Bug mode: an image without alt text.
              <img src={branding?.logoUrl ?? "/logo.svg"} width={32} height={32} />
            ) : (
              <img
                src={branding?.logoUrl ?? "/logo.svg"}
                alt=""
                width={32}
                height={32}
              />
            )}
            <span>{hotelName}</span>
          </Link>
          <button
            type="button"
            className="menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="main-nav"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span aria-hidden="true" className="menu-icon" />
            {t("nav.menu")}
          </button>
          <nav
            aria-label="Main"
            id="main-nav"
            className={menuOpen ? "open" : undefined}
          >
            <ul className="nav-links">
              <li>
                <NavLink to="/rooms">{t("nav.rooms")}</NavLink>
              </li>
              {user && (
                <li>
                  <NavLink to="/my/bookings">{t("nav.myBookings")}</NavLink>
                </li>
              )}
              {isAdmin && (
                <>
                  <li>
                    <NavLink to="/admin/rooms">
                      {t("nav.roomManagement")}
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/admin/bookings">
                      {t("nav.bookingManagement")}
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/admin/messages">
                      {t("nav.messages")}
                      {unreadMessages > 0 && (
                        <span className="count-badge" data-testid="unread-count">
                          {unreadMessages}
                          <span className="visually-hidden"> unread</span>
                        </span>
                      )}
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/admin/reports">{t("nav.reports")}</NavLink>
                  </li>
                  <li>
                    <NavLink to="/admin/branding">{t("nav.branding")}</NavLink>
                  </li>
                </>
              )}
            </ul>
            <div className="nav-account">
              {user ? (
                <>
                  <span className="signed-in">
                    {t("nav.signedInAs")} <strong>{user.username}</strong>
                  </span>
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={onLogout}
                  >
                    {t("nav.logout")}
                  </button>
                </>
              ) : (
                <>
                  <NavLink to="/login">{t("nav.login")}</NavLink>
                  <NavLink to="/register" className="button">
                    {t("nav.register")}
                  </NavLink>
                </>
              )}
            </div>
          </nav>
          {user && (
            <div className="header-tools">
              <NotificationBell />
              <AccountMenu />
            </div>
          )}
        </div>
      </header>
      <main id="main" className="container" tabIndex={-1}>
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="container footer-inner">
          <p>
            © {hotelName} · {t("footer.tagline")} ·{" "}
            <Link to="/terms">{t("footer.terms")}</Link> ·{" "}
            <Link to="/contact">{t("nav.contact")}</Link>
          </p>
          <p>
            <a href="/api-docs">{t("footer.apiDocs")}</a>
          </p>
        </div>
      </footer>
      {hasFlag("popup-cookie") && !PREVIEW && <CookieConsent />}
    </>
  );
}

/** Opens on hover (and on click or Enter for keyboard users): practise `locator.hover()`. */
function AccountMenu() {
  const { user } = useAuth();
  const t = useT();
  const me = useMe();
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <div
      ref={ref}
      className="account-menu"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onKeyDown={(event) => {
        if (event.key === "Escape") setOpen(false);
      }}
    >
      <button
        type="button"
        className="account-button"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        <Avatar url={me.data?.avatarUrl} name={user?.username ?? ""} />
        <span className="visually-hidden">{t("nav.account")}</span>
      </button>
      <ul id={menuId} className="account-links" hidden={!open}>
        <li>
          <Link to="/my/profile" onClick={() => setOpen(false)}>
            {t("nav.myProfile")}
          </Link>
        </li>
        <li>
          <Link to="/my/messages" onClick={() => setOpen(false)}>
            {t("nav.myMessages")}
          </Link>
        </li>
      </ul>
    </div>
  );
}

export function Avatar({
  url,
  name,
  size = 32,
}: {
  url?: string | null;
  name: string;
  size?: number;
}) {
  if (url)
    return (
      <img
        className="avatar"
        src={url}
        alt=""
        width={size}
        height={size}
        data-testid="avatar"
      />
    );
  return (
    <span
      className="avatar avatar-initial"
      aria-hidden="true"
      style={{ width: size, height: size }}
      data-testid="avatar"
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

function NotificationBell() {
  const { notifications, unread, markAllRead, clear } = useEvents();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) markAllRead();
  }, [open, notifications.length, markAllRead]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <div
      className="bell"
      ref={ref}
      onKeyDown={(event) => {
        if (event.key === "Escape") setOpen(false);
      }}
    >
      <button
        type="button"
        className="icon-button bell-button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm7-6V11a7 7 0 0 0-5.5-6.84V3a1.5 1.5 0 0 0-3 0v1.16A7 7 0 0 0 5 11v5l-2 2v1h18v-1Z"
          />
        </svg>
        <span className="visually-hidden">Notifications</span>
        {unread > 0 && (
          <span className="count-badge" data-testid="notification-count">
            {unread}
            <span className="visually-hidden"> unread</span>
          </span>
        )}
      </button>
      <div
        id={panelId}
        className="bell-panel"
        role="dialog"
        aria-label="Notification centre"
        hidden={!open}
      >
        {notifications.length === 0 ? (
          <p className="empty">No notifications yet.</p>
        ) : (
          <>
            <ul>
              {notifications.map((item) => (
                <li key={item.id} data-testid="notification">
                  {item.text}
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="button button-secondary button-small"
              onClick={clear}
            >
              Clear all
            </button>
          </>
        )}
      </div>
    </div>
  );
}
