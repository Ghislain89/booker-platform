import { badRequest, FieldErrors } from "./http";

type Body = Record<string, unknown>;

export const asBody = (value: unknown): Body =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Body) : {};

export class Validator {
  readonly errors: FieldErrors = {};

  constructor(private readonly body: Body) {}

  private fail(field: string, message: string) {
    if (!this.errors[field]) this.errors[field] = message;
    return undefined;
  }

  string(field: string, opts: { required?: boolean; min?: number; max?: number; pattern?: RegExp; patternMessage?: string } = {}) {
    const { required = true, min = 1, max = 1000 } = opts;
    const value = this.body[field];
    if (value === undefined || value === null || value === "") {
      return required ? this.fail(field, `${field} is required`) : undefined;
    }
    if (typeof value !== "string") return this.fail(field, `${field} must be a string`);
    if (value.trim().length < min) return this.fail(field, `${field} must be at least ${min} characters`);
    if (value.length > max) return this.fail(field, `${field} must be at most ${max} characters`);
    if (opts.pattern && !opts.pattern.test(value)) {
      return this.fail(field, opts.patternMessage ?? `${field} has an invalid format`);
    }
    return value;
  }

  number(field: string, opts: { required?: boolean; min?: number; max?: number; integer?: boolean } = {}) {
    const { required = true } = opts;
    const value = this.body[field];
    if (value === undefined || value === null) {
      return required ? this.fail(field, `${field} is required`) : undefined;
    }
    if (typeof value !== "number" || !Number.isFinite(value)) return this.fail(field, `${field} must be a number`);
    if (opts.integer && !Number.isInteger(value)) return this.fail(field, `${field} must be an integer`);
    if (opts.min !== undefined && value < opts.min) return this.fail(field, `${field} must be at least ${opts.min}`);
    if (opts.max !== undefined && value > opts.max) return this.fail(field, `${field} must be at most ${opts.max}`);
    return value;
  }

  oneOf<T extends string>(field: string, values: readonly T[], opts: { required?: boolean } = {}) {
    const { required = true } = opts;
    const value = this.body[field];
    if (value === undefined || value === null || value === "") {
      return required ? this.fail(field, `${field} is required`) : undefined;
    }
    if (typeof value !== "string" || !values.includes(value as T)) {
      return this.fail(field, `${field} must be one of ${values.join(", ")}`);
    }
    return value as T;
  }

  boolean(field: string, opts: { required?: boolean } = {}) {
    const { required = false } = opts;
    const value = this.body[field];
    if (value === undefined || value === null) {
      return required ? this.fail(field, `${field} is required`) : undefined;
    }
    if (typeof value !== "boolean") return this.fail(field, `${field} must be a boolean`);
    return value;
  }

  stringArray(field: string, opts: { required?: boolean } = {}) {
    const { required = false } = opts;
    const value = this.body[field];
    if (value === undefined || value === null) {
      return required ? this.fail(field, `${field} is required`) : undefined;
    }
    if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
      return this.fail(field, `${field} must be an array of strings`);
    }
    return value as string[];
  }

  date(field: string, opts: { required?: boolean } = {}) {
    const { required = true } = opts;
    const value = this.body[field];
    if (value === undefined || value === null || value === "") {
      return required ? this.fail(field, `${field} is required`) : undefined;
    }
    const date = typeof value === "string" ? new Date(value) : undefined;
    if (!date || Number.isNaN(date.getTime())) {
      return this.fail(field, `${field} must be an ISO 8601 date`);
    }
    return date;
  }

  object(field: string, opts: { required?: boolean } = {}) {
    const { required = false } = opts;
    const value = this.body[field];
    if (value === undefined || value === null) {
      return required ? this.fail(field, `${field} is required`) : undefined;
    }
    if (typeof value !== "object" || Array.isArray(value)) return this.fail(field, `${field} must be an object`);
    return value as Body;
  }

  error(field: string, message: string) {
    this.fail(field, message);
  }

  assertValid() {
    if (Object.keys(this.errors).length > 0) throw badRequest(this.errors);
  }
}
