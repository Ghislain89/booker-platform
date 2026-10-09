/*
@param roomId: string
@param checkInString: string // Example: 2025-03-01
@param checkOutString: string // Example: 2025-03-05 
*/

export async function createRandomBooking(
  roomId: string,
  checkInString: string,
  checkOutString: string,
) {
  return {
    roomId,
    checkIn: `${checkInString}T00:00:00.000Z`,
    checkOut: `${checkOutString}T00:00:00.000Z`,
  };
}
