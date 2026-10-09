import { InputHTMLAttributes, ReactNode, useId } from "react";
import { hasFlag } from "../lib/flags";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: ReactNode;
}

/** Labelled input with hint and error text wired up through aria-describedby. */
export function Field({ label, error, hint, id, ...input }: FieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const describedBy =
    [hint && hintId, error && errorId].filter(Boolean).join(" ") || undefined;
  return (
    <div className="field">
      {hasFlag("bug-a11y") ? (
        // Bug mode: looks the same, but the input has no accessible name.
        <span className="label">{label}</span>
      ) : (
        <label htmlFor={inputId}>{label}</label>
      )}
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...input}
      />
      {hint && (
        <p className="hint" id={hintId}>
          {hint}
        </p>
      )}
      {error && (
        <p className="field-error" id={errorId}>
          {error}
        </p>
      )}
    </div>
  );
}
