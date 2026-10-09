import { faker } from "@faker-js/faker";

const toIsoDate = (date: Date) => `${date.toISOString().slice(0, 10)}T00:00:00.000Z`;

/*
@param roomId: string
@param checkInString?: string  // Example: 2030-03-01. Defaults to a random date 30-365 days from today.
@param checkOutString?: string // Example: 2030-03-05. Defaults to 1-7 nights after check-in.

The API rejects check-in dates in the past, so always use future dates.
*/
export async function createRandomBooking(
  roomId: string,
  checkInString?: string,
  checkOutString?: string,
) {
  const checkIn = checkInString
    ? new Date(`${checkInString}T00:00:00.000Z`)
    : faker.date.soon({ days: 335, refDate: new Date(Date.now() + 30 * 86_400_000) });
  const checkOut = checkOutString
    ? new Date(`${checkOutString}T00:00:00.000Z`)
    : new Date(checkIn.getTime() + faker.number.int({ min: 1, max: 7 }) * 86_400_000);

  return {
    roomId,
    checkIn: toIsoDate(checkIn),
    checkOut: toIsoDate(checkOut),
  };
}
