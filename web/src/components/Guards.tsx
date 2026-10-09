import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { useAuth } from "../lib/auth";
import { useTitle } from "../lib/useTitle";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }
  return children;
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuth();
  return <RequireAuth>{isAdmin ? children : <AccessDenied />}</RequireAuth>;
}

function AccessDenied() {
  useTitle("Access denied");
  return (
    <section className="page-narrow">
      <h1>Access denied</h1>
      <p>This page is only available to administrators.</p>
    </section>
  );
}
