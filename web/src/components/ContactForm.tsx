import { FormEvent, useId, useState } from "react";
import { api, ApiError } from "../api/client";
import { useAuth } from "../lib/auth";
import { useT } from "../lib/preferences";
import { Field } from "./Field";

type Fields = "name" | "email" | "subject" | "content";

/**
 * Guests post to /api/public/messages, logged-in users to /api/messages (their name and
 * e-mail come from the account). Admins see the messages under Messages.
 */
export function ContactForm({ headingLevel = 2 }: { headingLevel?: 1 | 2 }) {
  const { user } = useAuth();
  const t = useT();
  const headingId = useId();
  const contentId = useId();
  const [values, setValues] = useState<Record<Fields, string>>({
    name: "",
    email: "",
    subject: "",
    content: "",
  });
  const [errors, setErrors] = useState<Partial<Record<Fields, string>>>({});
  const [serverError, setServerError] = useState<string>();
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const set = (field: Fields) => (value: string) =>
    setValues((current) => ({ ...current, [field]: value }));

  const validate = () => {
    const result: Partial<Record<Fields, string>> = {};
    const required = (field: Fields, label: string) => {
      if (!values[field].trim())
        result[field] = t("contact.required", { field: label });
    };
    if (!user) {
      required("name", t("contact.name"));
      required("email", t("contact.email"));
      if (
        values.email.trim() &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())
      )
        result.email = t("contact.invalidEmail");
    }
    required("subject", t("contact.subject"));
    required("content", t("contact.message"));
    return result;
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const fieldErrors = validate();
    setErrors(fieldErrors);
    setServerError(undefined);
    setSent(false);
    if (Object.keys(fieldErrors).length > 0) return;

    setSubmitting(true);
    try {
      const body = {
        subject: values.subject.trim(),
        content: values.content.trim(),
      };
      if (user) await api("/messages", { method: "POST", body });
      else
        await api("/public/messages", {
          method: "POST",
          body: { ...body, name: values.name.trim(), email: values.email.trim() },
        });
      setValues({ name: "", email: "", subject: "", content: "" });
      setSent(true);
    } catch (error) {
      if (error instanceof ApiError && error.details) {
        setErrors(error.details as Partial<Record<Fields, string>>);
      }
      setServerError((error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const Heading = headingLevel === 1 ? "h1" : "h2";

  return (
    <section aria-labelledby={headingId} className="contact-form">
      <Heading id={headingId}>{t("contact.title")}</Heading>
      {sent && (
        <p className="alert alert-success" role="status">
          {t("contact.sent")}
        </p>
      )}
      {serverError && (
        <p className="alert alert-error" role="alert">
          {serverError}
        </p>
      )}
      <form className="form" noValidate onSubmit={onSubmit}>
        {!user && (
          <>
            <Field
              label={t("contact.name")}
              name="name"
              autoComplete="name"
              value={values.name}
              onChange={(event) => set("name")(event.target.value)}
              error={errors.name}
            />
            <Field
              label={t("contact.email")}
              name="email"
              type="email"
              autoComplete="email"
              value={values.email}
              onChange={(event) => set("email")(event.target.value)}
              error={errors.email}
            />
          </>
        )}
        <Field
          label={t("contact.subject")}
          name="subject"
          value={values.subject}
          onChange={(event) => set("subject")(event.target.value)}
          error={errors.subject}
        />
        <div className="field">
          <label htmlFor={contentId}>{t("contact.message")}</label>
          <textarea
            id={contentId}
            name="content"
            rows={5}
            value={values.content}
            onChange={(event) => set("content")(event.target.value)}
            aria-invalid={errors.content ? true : undefined}
            aria-describedby={errors.content ? `${contentId}-error` : undefined}
          />
          {errors.content && (
            <p className="field-error" id={`${contentId}-error`}>
              {errors.content}
            </p>
          )}
        </div>
        <div className="form-actions">
          <button type="submit" className="button" disabled={submitting}>
            {submitting ? t("contact.sending") : t("contact.send")}
          </button>
        </div>
      </form>
    </section>
  );
}
