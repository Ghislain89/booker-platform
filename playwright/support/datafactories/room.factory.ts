import { faker } from "@faker-js/faker";
import { randomRoomFeaturesCount } from "../helpers/roomFeatures.helper";

export async function createRandomRoom(number?: string, price?: number) {
  const roomType = ["STANDARD", "DELUXE", "SUITE"];
  const features = randomRoomFeaturesCount(6);

  const amenities = features.sort(() => 0.5 - Math.random()).slice(0, 3);

  return {
    number: number || faker.string.numeric(3),
    type: roomType[Math.floor(Math.random() * roomType.length)],
    capacity: faker.number.int({ min: 1, max: 4 }),
    price: price || faker.number.int({ min: 100, max: 500 }),
    amenities: amenities,
  };
}
