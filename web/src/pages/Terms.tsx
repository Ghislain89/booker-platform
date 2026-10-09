import { useTitle } from "../lib/useTitle";

export function Terms() {
  useTitle("Terms and conditions");
  return (
    <section className="page-narrow prose">
      <h1>Terms and conditions</h1>
      <p>
        Booker Hotel is a demo application for test automation trainings. No
        real bookings, payments or e-mails are made.
      </p>
      <h2>Bookings</h2>
      <ul>
        <li>A booking is pending until the hotel confirms it.</li>
        <li>
          Check-in is from 15:00, check-out until 11:00 (14:00 with late
          check-out).
        </li>
        <li>
          You can cancel a booking free of charge until the day of arrival.
        </li>
      </ul>
      <h2>Privacy</h2>
      <p>
        All data is stored in a local SQLite database and removed when you run{" "}
        <code>npm run setup</code>.
      </p>
    </section>
  );
}
