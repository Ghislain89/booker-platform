# Cancel a booking

Test plan written by the Playwright planner agent (`npx playwright init-agents`), used for assignment 9.
The generated test is `playwright/tests/ui/assignment9.cancel-booking.spec.ts`.

## Setup

- Logged in as `user` (the `ui-user` project).
- The user has a confirmed booking in the future.

## Scenarios

### 1. User cancels an upcoming booking

1. Open **My bookings** (`/my/bookings`).
2. In the **Upcoming** tab, find the row of the booking. Its status is "Confirmed".
3. Click **Cancel booking** and accept the confirm dialog ("Cancel your booking for room … on …?").

Expected:

- A notification "Booking cancelled." is shown.
- The booking is no longer in the **Upcoming** tab.
- The **Cancelled** tab shows the booking with status "Cancelled".

### 2. User changes their mind

1. Open **My bookings** and click **Cancel booking**.
2. Dismiss the confirm dialog.

Expected: the booking is still in the **Upcoming** tab with status "Confirmed".
