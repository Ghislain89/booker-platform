import { FormEvent, useEffect, useId, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError, DataResponse } from "../api/client";
import type { User } from "../api/types";
import { Field } from "../components/Field";
import { Avatar, useMe } from "../components/Layout";
import { useToast } from "../components/Toasts";
import type { Language } from "../lib/i18n";
import { ColorScheme, usePreferences, useT } from "../lib/preferences";
import { useTitle } from "../lib/useTitle";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

export function Profile() {
  const t = useT();
  useTitle(t("profile.title"));
  const me = useMe();

  return (
    <>
      <h1>{t("profile.title")}</h1>
      {me.isPending && <p role="status">Loading your profile…</p>}
      {me.isError && (
        <p className="alert alert-error" role="alert">
          {me.error.message}
        </p>
      )}
      {me.data && (
        <div className="profile-grid">
          <AccountSection user={me.data} />
          <AvatarSection user={me.data} />
          <PreferencesSection />
        </div>
      )}
    </>
  );
}

function AccountSection({ user }: { user: User }) {
  const t = useT();
  const notify = useToast();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState(user.email);
  const [error, setError] = useState<string>();

  const save = useMutation({
    mutationFn: (value: string) =>
      api<DataResponse<User>>("/auth/me", {
        method: "PUT",
        body: { email: value },
      }),
    onSuccess: (response) => {
      queryClient.setQueryData(["private", "me"], response.data);
      notify(t("profile.emailSaved"));
    },
    onError: (failure) =>
      setError(
        failure instanceof ApiError && failure.details?.email
          ? failure.details.email
          : failure.message,
      ),
  });

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const value = email.trim();
    setError(undefined);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setError("Enter a valid e-mail address");
      return;
    }
    save.mutate(value);
  };

  return (
    <section className="card" aria-labelledby="account-heading">
      <div className="card-body">
        <h2 id="account-heading">{t("profile.account")}</h2>
        <dl className="facts">
          <dt>{t("profile.username")}</dt>
          <dd>{user.username}</dd>
        </dl>
        <form className="form" noValidate onSubmit={onSubmit}>
          <Field
            label={t("profile.email")}
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={error}
          />
          <div className="form-actions">
            <button type="submit" className="button" disabled={save.isPending}>
              {t("profile.saveEmail")}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

/** File upload with a client-side preview: practise `setInputFiles()` (assignment 5e). */
function AvatarSection({ user }: { user: User }) {
  const t = useT();
  const notify = useToast();
  const queryClient = useQueryClient();
  const inputId = useId();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!file) return setPreview(undefined);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const upload = useMutation({
    mutationFn: (image: File) => {
      const form = new FormData();
      form.append("avatar", image);
      return api<DataResponse<User>>("/auth/me/avatar", {
        method: "POST",
        form,
      });
    },
    onSuccess: (response) => {
      queryClient.setQueryData(["private", "me"], response.data);
      setFile(null);
      notify(t("profile.avatarSaved"));
    },
    onError: (failure) =>
      setError(
        failure instanceof ApiError && failure.details?.avatar
          ? failure.details.avatar
          : failure.message,
      ),
  });

  const onChoose = (chosen: File | undefined) => {
    setError(undefined);
    if (!chosen) return setFile(null);
    if (!chosen.type.startsWith("image/")) {
      setFile(null);
      return setError("Choose an image file");
    }
    if (chosen.size > MAX_AVATAR_BYTES) {
      setFile(null);
      return setError("The photo is larger than 2 MB");
    }
    setFile(chosen);
  };

  return (
    <section className="card" aria-labelledby="avatar-heading">
      <div className="card-body">
        <h2 id="avatar-heading">{t("profile.avatar")}</h2>
        <figure className="avatar-figure">
          {preview ? (
            <img
              src={preview}
              alt={t("profile.preview")}
              width={96}
              height={96}
              className="avatar avatar-large"
            />
          ) : user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={t("profile.current")}
              width={96}
              height={96}
              className="avatar avatar-large"
            />
          ) : (
            <Avatar name={user.username} size={96} />
          )}
        </figure>
        <form
          className="form"
          onSubmit={(event) => {
            event.preventDefault();
            if (file) upload.mutate(file);
            else setError("Choose a photo first");
          }}
        >
          <div className="field">
            <label htmlFor={inputId}>{t("profile.chooseAvatar")}</label>
            <input
              id={inputId}
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              onChange={(event) => onChoose(event.target.files?.[0])}
              aria-describedby={`${inputId}-hint${error ? ` ${inputId}-error` : ""}`}
              aria-invalid={error ? true : undefined}
            />
            <p className="hint" id={`${inputId}-hint`}>
              {t("profile.avatarHint")}
            </p>
            {error && (
              <p className="field-error" id={`${inputId}-error`}>
                {error}
              </p>
            )}
          </div>
          <div className="form-actions">
            <button
              type="submit"
              className="button"
              disabled={upload.isPending}
            >
              {t("profile.uploadAvatar")}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

function PreferencesSection() {
  const t = useT();
  const { language, colorScheme, update } = usePreferences();
  const schemes: { value: ColorScheme; label: string }[] = [
    { value: "light", label: t("profile.light") },
    { value: "dark", label: t("profile.dark") },
    { value: "system", label: t("profile.system") },
  ];

  return (
    <section className="card" aria-labelledby="preferences-heading">
      <div className="card-body form">
        <h2 id="preferences-heading">{t("profile.preferences")}</h2>
        <div className="field">
          <label htmlFor="language">{t("profile.language")}</label>
          <select
            id="language"
            value={language}
            onChange={(event) =>
              update({ language: event.target.value as Language })
            }
          >
            <option value="en">English</option>
            <option value="nl">Nederlands</option>
          </select>
        </div>
        <fieldset className="field radio-group">
          <legend>{t("profile.colorScheme")}</legend>
          {schemes.map((scheme) => (
            <div className="checkbox" key={scheme.value}>
              <input
                type="radio"
                id={`scheme-${scheme.value}`}
                name="color-scheme"
                value={scheme.value}
                checked={colorScheme === scheme.value}
                onChange={() => update({ colorScheme: scheme.value })}
              />
              <label htmlFor={`scheme-${scheme.value}`}>{scheme.label}</label>
            </div>
          ))}
        </fieldset>
      </div>
    </section>
  );
}
