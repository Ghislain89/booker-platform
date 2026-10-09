import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError, DataResponse } from "../api/client";
import type { Branding } from "../api/types";
import { Dialog } from "../components/Dialog";
import { Field } from "../components/Field";
import { useToast } from "../components/Toasts";
import { useTitle } from "../lib/useTitle";

const PREVIEW_MESSAGE = "booker:branding-preview";

export function AdminBranding() {
  useTitle("Branding");
  const branding = useQuery({
    queryKey: ["private", "branding"],
    queryFn: () =>
      api<DataResponse<Branding>>("/branding").then((response) => response.data),
  });

  return (
    <>
      <h1>Branding</h1>
      {branding.isPending && <p role="status">Loading branding…</p>}
      {branding.isError && (
        <p className="alert alert-error" role="alert">
          {branding.error.message}
        </p>
      )}
      {branding.data && <BrandingForm initial={branding.data} />}
    </>
  );
}

const pick = ({ name, logoUrl, description, contact, map, theme }: Branding): Branding => ({
  name,
  logoUrl,
  description,
  contact: { ...contact },
  map: { ...map },
  theme: { ...theme },
});

function BrandingForm({ initial }: { initial: Branding }) {
  const queryClient = useQueryClient();
  const notify = useToast();
  const [values, setValues] = useState(() => pick(initial));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmReset, setConfirmReset] = useState(false);
  const preview = useRef<HTMLIFrameElement>(null);

  const sendPreview = useCallback(() => {
    preview.current?.contentWindow?.postMessage(
      { type: PREVIEW_MESSAGE, branding: values },
      window.location.origin,
    );
  }, [values]);

  useEffect(sendPreview, [sendPreview]);

  // The preview page announces itself once it listens for messages.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (
        event.origin === window.location.origin &&
        event.data?.type === "booker:preview-ready"
      )
        sendPreview();
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [sendPreview]);

  const saved = (data: Branding, message: string) => {
    queryClient.setQueryData(["private", "branding"], data);
    queryClient.setQueryData(["branding"], pick(data));
    setValues(pick(data));
    setErrors({});
    notify(message);
  };

  const save = useMutation({
    mutationFn: () =>
      api<DataResponse<Branding>>("/branding", { method: "PUT", body: values }),
    onSuccess: (response) => saved(response.data, "Branding saved."),
    onError: (error) => {
      if (error instanceof ApiError && error.details) setErrors(error.details);
      notify(`Could not save the branding: ${error.message}`);
    },
  });

  const reset = useMutation({
    mutationFn: () =>
      api<DataResponse<Branding>>("/branding/reset", { method: "POST" }),
    onSuccess: (response) => {
      setConfirmReset(false);
      saved(response.data, "Branding reset to the defaults.");
      if (preview.current) preview.current.src = "/?preview=1";
    },
    onError: (error) => notify(`Could not reset the branding: ${error.message}`),
  });

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const result: Record<string, string> = {};
    if (!values.name.trim()) result.name = "Enter the hotel name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.contact.email))
      result["contact.email"] = "Enter a valid e-mail address";
    if (Number.isNaN(values.map.latitude) || Math.abs(values.map.latitude) > 90)
      result["map.latitude"] = "Latitude must be between -90 and 90";
    if (Number.isNaN(values.map.longitude) || Math.abs(values.map.longitude) > 180)
      result["map.longitude"] = "Longitude must be between -180 and 180";
    setErrors(result);
    if (Object.keys(result).length === 0) save.mutate();
  };

  const set = <K extends keyof Branding>(key: K, value: Branding[K]) =>
    setValues((current) => ({ ...current, [key]: value }));

  return (
    <div className="branding-layout">
      <form className="form card card-body" noValidate onSubmit={onSubmit}>
        <fieldset>
          <legend>Hotel</legend>
          <Field
            label="Hotel name"
            value={values.name}
            onChange={(event) => set("name", event.target.value)}
            error={errors.name}
          />
          <div className="field">
            <label htmlFor="branding-description">Description</label>
            <textarea
              id="branding-description"
              rows={3}
              value={values.description}
              onChange={(event) => set("description", event.target.value)}
            />
          </div>
          <Field
            label="Logo URL"
            value={values.logoUrl}
            onChange={(event) => set("logoUrl", event.target.value)}
            error={errors.logoUrl}
          />
        </fieldset>
        <fieldset>
          <legend>Colours</legend>
          <div className="form-row">
            <Field
              label="Primary colour"
              type="color"
              value={values.theme.primaryColor}
              onChange={(event) =>
                set("theme", { ...values.theme, primaryColor: event.target.value })
              }
              error={errors["theme.primaryColor"]}
            />
            <Field
              label="Secondary colour"
              type="color"
              value={values.theme.secondaryColor}
              onChange={(event) =>
                set("theme", { ...values.theme, secondaryColor: event.target.value })
              }
              error={errors["theme.secondaryColor"]}
            />
          </div>
        </fieldset>
        <fieldset>
          <legend>Contact</legend>
          <Field
            label="Contact name"
            value={values.contact.name}
            onChange={(event) =>
              set("contact", { ...values.contact, name: event.target.value })
            }
          />
          <Field
            label="Address"
            value={values.contact.address}
            onChange={(event) =>
              set("contact", { ...values.contact, address: event.target.value })
            }
          />
          <div className="form-row">
            <Field
              label="Phone"
              type="tel"
              value={values.contact.phone}
              onChange={(event) =>
                set("contact", { ...values.contact, phone: event.target.value })
              }
            />
            <Field
              label="Contact e-mail"
              type="email"
              value={values.contact.email}
              onChange={(event) =>
                set("contact", { ...values.contact, email: event.target.value })
              }
              error={errors["contact.email"]}
            />
          </div>
          <div className="form-row">
            <Field
              label="Latitude"
              type="number"
              step="any"
              value={String(values.map.latitude)}
              onChange={(event) =>
                set("map", { ...values.map, latitude: event.target.valueAsNumber })
              }
              error={errors["map.latitude"]}
            />
            <Field
              label="Longitude"
              type="number"
              step="any"
              value={String(values.map.longitude)}
              onChange={(event) =>
                set("map", { ...values.map, longitude: event.target.valueAsNumber })
              }
              error={errors["map.longitude"]}
            />
          </div>
        </fieldset>
        <div className="form-actions">
          <button type="submit" className="button" disabled={save.isPending}>
            Save branding
          </button>
          <button
            type="button"
            className="button button-secondary"
            onClick={() => setConfirmReset(true)}
          >
            Reset to defaults
          </button>
        </div>
      </form>

      <section className="branding-preview" aria-labelledby="preview-heading">
        <h2 id="preview-heading">Preview</h2>
        <p className="hint">Unsaved changes are shown here straight away.</p>
        <iframe
          ref={preview}
          src="/?preview=1"
          title="Preview of the home page"
          onLoad={sendPreview}
        />
      </section>

      <Dialog
        open={confirmReset}
        title="Reset branding"
        onClose={() => setConfirmReset(false)}
      >
        <p>Reset the name, colours and contact details to the defaults?</p>
        <div className="form-actions">
          <button
            type="button"
            className="button button-danger"
            disabled={reset.isPending}
            onClick={() => reset.mutate()}
          >
            Reset
          </button>
          <button
            type="button"
            className="button button-secondary"
            onClick={() => setConfirmReset(false)}
          >
            Cancel
          </button>
        </div>
      </Dialog>
    </div>
  );
}
