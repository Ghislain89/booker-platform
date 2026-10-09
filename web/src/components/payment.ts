// <booker-payment>: a card form inside an open shadow root, like the payment widgets of
// real payment providers. Playwright locators pierce open shadow roots, so
// `page.getByLabel("Card number")` just works (assignment 5f). CSS and XPath selectors do not.
//
// Test cards: 4242 4242 4242 4242 is accepted, 4000 0000 0000 0002 is declined.

const DECLINED = "4000000000000002";

const template = `
  <style>
    :host { display: block; }
    fieldset { border: 1px solid var(--border, #ccc); border-radius: 8px; padding: 1rem; margin: 0; }
    legend { font-weight: 600; padding: 0 0.25rem; }
    .grid { display: grid; gap: 0.75rem; grid-template-columns: 1fr 1fr; }
    .full { grid-column: 1 / -1; }
    label { display: block; font-weight: 600; margin-bottom: 0.25rem; }
    input { width: 100%; box-sizing: border-box; font: inherit; padding: 0.5rem; border: 1px solid var(--border-strong, #767676);
      border-radius: 4px; background: var(--surface, #fff); color: var(--text, #1a1a1a); }
    input:focus-visible { outline: 3px solid var(--focus, #1a5fb4); outline-offset: 1px; }
    input[aria-invalid="true"] { border-color: var(--danger, #b3261e); }
    .error { color: var(--danger, #b3261e); margin: 0.25rem 0 0; font-size: 0.9rem; }
    .error:empty { display: none; }
    .hint { color: var(--muted, #555); font-size: 0.85rem; margin: 0.75rem 0 0; }
  </style>
  <fieldset>
    <legend>Payment details</legend>
    <div class="grid">
      <div class="full">
        <label for="name">Cardholder name</label>
        <input id="name" name="name" autocomplete="cc-name" aria-describedby="name-error" />
        <p class="error" id="name-error"></p>
      </div>
      <div class="full">
        <label for="number">Card number</label>
        <input id="number" name="number" inputmode="numeric" autocomplete="cc-number" placeholder="1234 5678 9012 3456"
          aria-describedby="number-error" />
        <p class="error" id="number-error"></p>
      </div>
      <div>
        <label for="expiry">Expiry date (MM/YY)</label>
        <input id="expiry" name="expiry" inputmode="numeric" autocomplete="cc-exp" placeholder="MM/YY"
          aria-describedby="expiry-error" />
        <p class="error" id="expiry-error"></p>
      </div>
      <div>
        <label for="cvc">CVC</label>
        <input id="cvc" name="cvc" inputmode="numeric" autocomplete="cc-csc" maxlength="4" aria-describedby="cvc-error" />
        <p class="error" id="cvc-error"></p>
      </div>
    </div>
    <p class="hint">This is a demo: no money is charged. Test card: 4242 4242 4242 4242.</p>
  </fieldset>
`;

type FieldName = "name" | "number" | "expiry" | "cvc";

/** Luhn checksum, used by every card number. */
export function luhn(digits: string) {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let digit = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return digits.length >= 12 && sum % 10 === 0;
}

export class PaymentError extends Error {}

export class BookerPayment extends HTMLElement {
  private root: ShadowRoot;

  constructor() {
    super();
    this.root = this.attachShadow({ mode: "open" });
    this.root.innerHTML = template;
    const number = this.input("number");
    number.addEventListener("input", () => {
      const digits = number.value.replace(/\D/g, "").slice(0, 19);
      number.value = digits.replace(/(\d{4})(?=\d)/g, "$1 ");
    });
    const expiry = this.input("expiry");
    expiry.addEventListener("input", (event) => {
      const digits = expiry.value.replace(/\D/g, "").slice(0, 4);
      const deleting = (event as InputEvent).inputType?.startsWith("delete");
      expiry.value =
        digits.length > 2 || (digits.length === 2 && !deleting)
          ? `${digits.slice(0, 2)}/${digits.slice(2)}`
          : digits;
    });
    for (const name of ["name", "number", "expiry", "cvc"] as FieldName[]) {
      this.input(name).addEventListener("input", () => {
        this.setError(name, "");
      });
    }
  }

  private input(name: FieldName) {
    return this.root.getElementById(name) as HTMLInputElement;
  }

  private setError(name: FieldName, message: string) {
    this.root.getElementById(`${name}-error`)!.textContent = message;
    const input = this.input(name);
    if (message) input.setAttribute("aria-invalid", "true");
    else input.removeAttribute("aria-invalid");
  }

  /** Validates the fields; returns the first invalid field, or null. */
  validate(now = new Date()): FieldName | null {
    const errors: Partial<Record<FieldName, string>> = {};
    const name = this.input("name").value.trim();
    const number = this.input("number").value.replace(/\s/g, "");
    const expiry = this.input("expiry").value.trim();
    const cvc = this.input("cvc").value.trim();

    if (!name) errors.name = "Enter the name on the card";
    if (!number) errors.number = "Enter the card number";
    else if (!/^\d+$/.test(number) || !luhn(number))
      errors.number = "This card number is not valid";

    const match = /^(\d{2})\/(\d{2})$/.exec(expiry);
    if (!expiry) errors.expiry = "Enter the expiry date";
    else if (!match || Number(match[1]) < 1 || Number(match[1]) > 12)
      errors.expiry = "Use the format MM/YY";
    else {
      // A card is valid until the end of its expiry month.
      const endOfMonth = new Date(2000 + Number(match[2]), Number(match[1]), 1);
      if (endOfMonth <= now) errors.expiry = "This card has expired";
    }

    if (!/^\d{3,4}$/.test(cvc)) errors.cvc = "Enter the 3 or 4 digit CVC";

    let first: FieldName | null = null;
    for (const field of ["name", "number", "expiry", "cvc"] as FieldName[]) {
      this.setError(field, errors[field] ?? "");
      if (errors[field] && !first) first = field;
    }
    return first;
  }

  /** Validates and "charges" the card. Throws a PaymentError when the card is invalid or declined; the page shows the message. */
  async pay(): Promise<void> {
    const invalid = this.validate();
    if (invalid) {
      this.input(invalid).focus();
      throw new PaymentError("Check your payment details");
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
    if (this.input("number").value.replace(/\s/g, "") === DECLINED) {
      throw new PaymentError("Payment declined. Please use another card.");
    }
  }
}

if (!customElements.get("booker-payment"))
  customElements.define("booker-payment", BookerPayment);

declare module "react" {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "booker-payment": React.DetailedHTMLProps<
        React.HTMLAttributes<BookerPayment>,
        BookerPayment
      >;
    }
  }
}
