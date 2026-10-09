import { FormEvent, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError, DataResponse } from "../api/client";
import type { Booking, Extra, PublicRoom } from "../api/types";
import { Field } from "../components/Field";
import { useToast } from "../components/Toasts";
import {
  addDays,
  EXTRA_LABELS,
  formatDate,
  formatPrice,
  isValidDateInput,
  plural,
  roomTypeLabel,
  toIsoDate,
  todayInput,
} from "../lib/format";
import {
  countNights,
  EXTRA_PRICES,
  EXTRAS,
  extraPrice,
  totalPrice,
} from "../lib/pricing";
import { useTitle } from "../lib/useTitle";
import { NotFound } from "./NotFound";
// Side-effect import: registers <booker-payment>. A type-only import would be dropped.
import "../components/payment";
import type { BookerPayment } from "../components/payment";
import { hasFlag } from "../lib/flags";

const describeError = (error: Error) =>
  error instanceof ApiError && error.details
    ? `${error.message}: ${Object.values(error.details).join(", ")}`
    : error.message;

const STEPS = ["Dates & guests", "Extras", "Review"] as const;

type DateErrors = {
  checkIn?: string;
  checkOut?: string;
  adults?: string;
  children?: string;
};

export function BookingWizard() {
  const { number = "" } = useParams();
  useTitle(`Book room ${number}`);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const notify = useToast();
  const queryClient = useQueryClient();
  const headingRef = useRef<HTMLHeadingElement>(null);

  const [step, setStep] = useState(0);
  const [checkIn, setCheckIn] = useState(() => {
    const value = searchParams.get("checkIn");
    return isValidDateInput(value) ? value : "";
  });
  const [checkOut, setCheckOut] = useState(() => {
    const value = searchParams.get("checkOut");
    return isValidDateInput(value) ? value : "";
  });
  const [adults, setAdults] = useState("1");
  const [children, setChildren] = useState("0");
  const [extras, setExtras] = useState<Extra[]>([]);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errors, setErrors] = useState<DateErrors>({});
  const payment = useRef<BookerPayment>(null);
  const [paymentError, setPaymentError] = useState<string>();
  const [paying, setPaying] = useState(false);

  const room = useQuery({
    queryKey: ["rooms", "detail", number],
    queryFn: () =>
      api<DataResponse<PublicRoom>>(
        `/public/rooms/${encodeURIComponent(number)}`,
      ).then((r) => r.data),
  });

  const booking = useMutation({
    mutationFn: (roomId: string) =>
      api<DataResponse<Booking>>("/bookings", {
        method: "POST",
        body: {
          roomId,
          checkIn: toIsoDate(checkIn),
          checkOut: toIsoDate(checkOut),
          adults: Number(adults),
          children: Number(children),
          extras,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["private", "my-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      notify("Booking received. We will confirm it soon.");
      navigate("/my/bookings");
    },
  });

  // Move focus to the step heading so screen readers announce the new step.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  if (room.isPending) return <p role="status">Loading room…</p>;
  if (room.isError) {
    if (room.error instanceof ApiError && room.error.status === 404)
      return <NotFound />;
    return (
      <p className="alert alert-error" role="alert">
        {room.error.message}
      </p>
    );
  }

  const data = room.data;
  if (data.status === "MAINTENANCE") {
    return (
      <div className="page-medium">
        <h1>Book room {data.number}</h1>
        <p className="alert alert-error" role="alert">
          Room not available
        </p>
        <p>
          This room is under maintenance.{" "}
          <Link to="/rooms">Choose another room</Link>
        </p>
      </div>
    );
  }
  const guests = Number(adults) + Number(children);
  const nights =
    isValidDateInput(checkIn) && isValidDateInput(checkOut)
      ? countNights(checkIn, checkOut)
      : 0;
  // Bug mode `bug-price`: an off-by-one in the number of nights.
  const total = totalPrice(
    data.price,
    hasFlag("bug-price") ? nights + 1 : nights,
    guests,
    extras,
  );

  const validateStepOne = () => {
    const result: DateErrors = {};
    if (!isValidDateInput(checkIn)) result.checkIn = "Choose a check-in date";
    else if (checkIn < todayInput())
      result.checkIn = "Check-in cannot be in the past";
    if (!isValidDateInput(checkOut))
      result.checkOut = "Choose a check-out date";
    else if (isValidDateInput(checkIn) && checkOut <= checkIn)
      result.checkOut = "Check-out must be after check-in";
    const adultCount = Number(adults);
    const childCount = Number(children);
    if (!Number.isInteger(adultCount) || adultCount < 1)
      result.adults = "At least 1 adult is required";
    if (!Number.isInteger(childCount) || childCount < 0)
      result.children = "Enter 0 or more children";
    if (
      !result.adults &&
      !result.children &&
      adultCount + childCount > data.capacity
    ) {
      result.adults = `This room fits at most ${plural(data.capacity, "guest")}`;
    }
    return result;
  };

  const next = async (event: FormEvent) => {
    event.preventDefault();
    if (step === 0) {
      const result = validateStepOne();
      setErrors(result);
      if (Object.keys(result).length > 0) return;
    }
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      return;
    }
    setPaymentError(undefined);
    setPaying(true);
    try {
      await payment.current?.pay();
    } catch (error) {
      setPaymentError((error as Error).message);
      return;
    } finally {
      setPaying(false);
    }
    booking.mutate(data.id);
  };

  const back = () => {
    booking.reset();
    setStep(step - 1);
  };

  const toggleExtra = (extra: Extra, checked: boolean) =>
    setExtras(
      checked
        ? EXTRAS.filter((item) => item === extra || extras.includes(item))
        : extras.filter((item) => item !== extra),
    );

  return (
    <div className="page-medium">
      <p>
        <Link to={`/rooms/${data.number}`}>← Room {data.number}</Link>
      </p>
      <h1>Book room {data.number}</h1>
      <p className="room-type">
        {roomTypeLabel(data.type)} · {formatPrice(data.price)} per night · up to{" "}
        {plural(data.capacity, "guest")}
      </p>

      <ol className="steps" aria-label="Progress">
        {STEPS.map((label, index) => (
          <li
            key={label}
            className={
              index === step ? "active" : index < step ? "done" : undefined
            }
            aria-current={index === step ? "step" : undefined}
          >
            <span className="step-number">{index + 1}</span> {label}
          </li>
        ))}
      </ol>

      <form className="card wizard" onSubmit={next} noValidate>
        <h2 ref={headingRef} tabIndex={-1}>
          Step {step + 1} of {STEPS.length}: {STEPS[step]}
        </h2>

        {step === 0 && (
          <div className="form">
            <div className="field-row">
              <Field
                label="Check-in date"
                type="date"
                min={todayInput()}
                value={checkIn}
                error={errors.checkIn}
                onChange={(event) => {
                  setCheckIn(event.target.value);
                  if (
                    isValidDateInput(event.target.value) &&
                    (!checkOut || checkOut <= event.target.value)
                  ) {
                    setCheckOut(addDays(event.target.value, 1));
                  }
                }}
              />
              <Field
                label="Check-out date"
                type="date"
                min={checkIn ? addDays(checkIn, 1) : todayInput()}
                value={checkOut}
                error={errors.checkOut}
                onChange={(event) => setCheckOut(event.target.value)}
              />
            </div>
            <div className="field-row">
              <Field
                label="Adults"
                type="number"
                min={1}
                max={data.capacity}
                value={adults}
                error={errors.adults}
                onChange={(event) => setAdults(event.target.value)}
              />
              <Field
                label="Children"
                type="number"
                min={0}
                max={data.capacity - 1}
                value={children}
                error={errors.children}
                onChange={(event) => setChildren(event.target.value)}
              />
            </div>
            {nights > 0 && (
              <p className="price-calculation">
                {plural(nights, "night")} × {formatPrice(data.price)} ={" "}
                {formatPrice(nights * data.price)}
              </p>
            )}
          </div>
        )}

        {step === 1 && (
          <fieldset className="extras">
            <legend>Make your stay even better</legend>
            {EXTRAS.map((extra) => (
              <div className="checkbox" key={extra}>
                <input
                  id={`extra-${extra}`}
                  type="checkbox"
                  checked={extras.includes(extra)}
                  aria-describedby={`extra-${extra}-price`}
                  onChange={(event) => toggleExtra(extra, event.target.checked)}
                />
                <label htmlFor={`extra-${extra}`}>{EXTRA_LABELS[extra]}</label>
                <span className="hint" id={`extra-${extra}-price`}>
                  {EXTRA_PRICES[extra].description}
                </span>
              </div>
            ))}
          </fieldset>
        )}

        {step === 2 && (
          <>
            <section aria-label="Booking summary" className="summary">
              <dl>
                <dt>Room</dt>
                <dd>
                  Room {data.number} ({roomTypeLabel(data.type)})
                </dd>
                <dt>Check-in</dt>
                <dd>{formatDate(checkIn)}</dd>
                <dt>Check-out</dt>
                <dd>{formatDate(checkOut)}</dd>
                <dt>Guests</dt>
                <dd>
                  {plural(Number(adults), "adult")},{" "}
                  {plural(Number(children), "child", "children")}
                </dd>
                <dt>Room price</dt>
                <dd>
                  {plural(nights, "night")} × {formatPrice(data.price)} ={" "}
                  {formatPrice(nights * data.price)}
                </dd>
                <dt>Extras</dt>
                <dd>
                  {extras.length === 0
                    ? "None"
                    : extras
                        .map(
                          (extra) =>
                            `${EXTRA_LABELS[extra]} (${formatPrice(extraPrice(extra, nights, guests))})`,
                        )
                        .join(", ")}
                </dd>
                <dt>Total</dt>
                <dd>
                  <strong data-testid="total-price">
                    {formatPrice(total)}
                  </strong>
                </dd>
              </dl>
            </section>
            <div className="checkbox">
              <input
                id="accept-terms"
                type="checkbox"
                checked={acceptTerms}
                onChange={(event) => setAcceptTerms(event.target.checked)}
              />
              <label htmlFor="accept-terms">
                I accept the terms and conditions
              </label>
              <a href="/terms" target="_blank" rel="noopener">
                Terms
                <span className="visually-hidden"> (opens in a new tab)</span>
              </a>
            </div>
            <booker-payment ref={payment} />
            {paymentError && (
              <p className="alert alert-error" role="alert">
                {paymentError}
              </p>
            )}
            {booking.isError && (
              <p className="alert alert-error" role="alert">
                {describeError(booking.error)}
              </p>
            )}
          </>
        )}

        <div className="wizard-actions">
          {step > 0 && (
            <button
              type="button"
              className="button button-secondary"
              onClick={back}
            >
              Back
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button type="submit" className="button">
              Next
            </button>
          ) : (
            <button
              type="submit"
              className="button"
              disabled={!acceptTerms || paying || booking.isPending}
            >
              {paying
                ? "Processing payment…"
                : booking.isPending
                  ? "Booking…"
                  : "Confirm booking"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
