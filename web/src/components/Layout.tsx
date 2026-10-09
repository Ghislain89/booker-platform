import { useEffect } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router";
import { useAuth } from "../lib/auth";
import { useBranding } from "../lib/queries";
import { useToast } from "./Toasts";

export function Layout() {
  const { user, isAdmin, logout } = useAuth();
  const { data: branding } = useBranding();
  const navigate = useNavigate();
  const notify = useToast();

  useEffect(() => {
    if (!branding) return;
    const root = document.documentElement.style;
    root.setProperty("--primary", branding.theme.primaryColor);
    root.setProperty("--secondary", branding.theme.secondaryColor);
  }, [branding]);

  const onLogout = () => {
    logout();
    notify("You have been logged out.");
    navigate("/");
  };

  const hotelName = branding?.name ?? "Booker Hotel";

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <div className="container header-inner">
          <Link to="/" className="brand">
            <img
              src={branding?.logoUrl ?? "/logo.svg"}
              alt=""
              width={32}
              height={32}
            />
            <span>{hotelName}</span>
          </Link>
          <nav aria-label="Main">
            <ul className="nav-links">
              <li>
                <NavLink to="/rooms">Rooms</NavLink>
              </li>
              {user && (
                <li>
                  <NavLink to="/my/bookings">My bookings</NavLink>
                </li>
              )}
              {isAdmin && (
                <>
                  <li>
                    <NavLink to="/admin/rooms">Room management</NavLink>
                  </li>
                  <li>
                    <NavLink to="/admin/bookings">Booking management</NavLink>
                  </li>
                </>
              )}
            </ul>
            <div className="nav-account">
              {user ? (
                <>
                  <span className="signed-in">
                    Signed in as <strong>{user.username}</strong>
                  </span>
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={onLogout}
                  >
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <NavLink to="/login">Log in</NavLink>
                  <NavLink to="/register" className="button">
                    Register
                  </NavLink>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>
      <main id="main" className="container" tabIndex={-1}>
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="container footer-inner">
          <p>
            © {hotelName} · A test object for Playwright trainings ·{" "}
            <Link to="/terms">Terms and conditions</Link>
          </p>
          <p>
            <a href="/api-docs">API documentation</a>
          </p>
        </div>
      </footer>
    </>
  );
}
