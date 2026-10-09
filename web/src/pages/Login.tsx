import { FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { api, ApiError, DataResponse } from "../api/client";
import type { AuthResponse } from "../api/types";
import { Field } from "../components/Field";
import { PasswordField } from "../components/PasswordField";
import { useAuth } from "../lib/auth";
import { useTitle } from "../lib/useTitle";

const REMEMBER_KEY = "booker.username";

/** Only follow redirects within the app. */
export const safeRedirect = (value: string | null) =>
  value && value.startsWith("/") && !value.startsWith("//")
    ? value
    : "/my/bookings";

export function Login() {
  useTitle("Log in");
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const remembered = localStorage.getItem(REMEMBER_KEY);
  const [username, setUsername] = useState(remembered ?? "");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(!!remembered);
  const [errors, setErrors] = useState<{
    username?: string;
    password?: string;
  }>({});
  const [serverError, setServerError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const fieldErrors = {
      username: username.trim() ? undefined : "Enter your username",
      password: password ? undefined : "Enter your password",
    };
    setErrors(fieldErrors);
    setServerError(undefined);
    if (fieldErrors.username || fieldErrors.password) return;

    setSubmitting(true);
    try {
      const response = await api<DataResponse<AuthResponse>>("/auth/login", {
        method: "POST",
        body: { username: username.trim(), password },
      });
      if (remember) localStorage.setItem(REMEMBER_KEY, username.trim());
      else localStorage.removeItem(REMEMBER_KEY);
      login(response.data.token);
      navigate(safeRedirect(searchParams.get("redirect")), { replace: true });
    } catch (error) {
      setServerError(
        error instanceof ApiError && error.status === 401
          ? "Invalid username or password"
          : (error as Error).message,
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="page-narrow">
      <h1>Log in</h1>
      {serverError && (
        <p className="alert alert-error" role="alert">
          {serverError}
        </p>
      )}
      <form onSubmit={onSubmit} noValidate className="form">
        <Field
          label="Username"
          name="username"
          autoComplete="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          error={errors.username}
          required
        />
        <PasswordField
          label="Password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={errors.password}
          required
        />
        <div className="checkbox">
          <input
            id="remember"
            type="checkbox"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
          />
          <label htmlFor="remember">Remember me</label>
        </div>
        <button type="submit" className="button" disabled={submitting}>
          Log in
        </button>
      </form>
      <p>
        No account yet? <Link to="/register">Register</Link>
      </p>
    </section>
  );
}
