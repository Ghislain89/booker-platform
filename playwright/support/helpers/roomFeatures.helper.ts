const roomFeatures = [
  "WiFi",
  "TV",
  "Air Conditioning",
  "Mini Bar",
  "Safe",
  "Desk",
  "Balcony",
  "Ocean View",
  "Mountain View",
  "Kitchen",
  "Living Room",
  "Jacuzzi",
  "Gym Access",
  "Pool Access",
  "Restaurant Access",
  "Room Service",
  "Laundry Service",
  "Concierge Service",
  "Parking",
  "Elevator Access",
];

export function randomRoomFeaturesCount(count: number): string[] {
  const shuffled = [...roomFeatures].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}
