import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router";
import { api, ApiError } from "../api/client";
import { Field } from "../components/Field";
import { PasswordField } from "../components/PasswordField";
import { useToast } from "../components/Toasts";
import { useTitle } from "../lib/useTitle";

type Fields = "username" | "email" | "password" | "confirmPassword" | "terms";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_PATTERN = /^[A-Za-z0-9_.-]+$/;

export function Register() {
  useTitle("Register");
  const navigate = useNavigate();
  const notify = useToast();
  const [values, setValues] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<Fields, string>>>({});
  const [serverError, setServerError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  const set =
    (field: keyof typeof values) =>
    (event: React.ChangeEvent<HTMLInputElement>) =>
      setValues({ ...values, [field]: event.target.value });

  const validate = () => {
    const result: Partial<Record<Fields, string>> = {};
    if (values.username.trim().length < 3)
      result.username = "Username must be at least 3 characters";
    else if (!USERNAME_PATTERN.test(values.username.trim())) {
      result.username =
        "Username may only contain letters, digits, '.', '_' and '-'";
    }
    if (!EMAIL_PATTERN.test(values.email.trim()))
      result.email = "Enter a valid e-mail address";
    if (values.password.length < 8)
      result.password = "Password must be at least 8 characters";
    if (values.confirmPassword !== values.password)
      result.confirmPassword = "Passwords do not match";
    if (!terms) result.terms = "You must accept the terms and conditions";
    return result;
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const fieldErrors = validate();
    setErrors(fieldErrors);
    setServerError(undefined);
    if (Object.keys(fieldErrors).length > 0) return;

    setSubmitting(true);
    try {
      await api("/auth/register", {
        method: "POST",
        body: {
          username: values.username.trim(),
          email: values.email.trim(),
          password: values.password,
        },
      });
      notify("Account created. You can now log in.");
      navigate("/login");
    } catch (error) {
      if (error instanceof ApiError && error.details)
        setErrors(error.details as Partial<Record<Fields, string>>);
      setServerError((error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="page-narrow">
      <h1>Create an account</h1>
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
          value={values.username}
          onChange={set("username")}
          error={errors.username}
          required
        />
        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={set("email")}
          error={errors.email}
          required
        />
        <PasswordField
          label="Password"
          name="password"
          autoComplete="new-password"
          value={values.password}
          onChange={set("password")}
          error={errors.password}
          hint="At least 8 characters"
          required
        />
        <PasswordField
          label="Confirm password"
          name="confirmPassword"
          autoComplete="new-password"
          value={values.confirmPassword}
          onChange={set("confirmPassword")}
          error={errors.confirmPassword}
          required
        />
        <div className="checkbox">
          <input
            id="terms"
            type="checkbox"
            checked={terms}
            onChange={(event) => setTerms(event.target.checked)}
            aria-invalid={errors.terms ? true : undefined}
            aria-describedby={errors.terms ? "terms-error" : undefined}
          />
          <label htmlFor="terms">I accept the terms and conditions</label>
          <a href="/terms" target="_blank" rel="noopener">
            Terms<span className="visually-hidden"> (opens in a new tab)</span>
          </a>
        </div>
        {errors.terms && (
          <p className="field-error" id="terms-error">
            {errors.terms}
          </p>
        )}
        <button type="submit" className="button" disabled={submitting}>
          Register
        </button>
      </form>
      <p>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </section>
  );
}
