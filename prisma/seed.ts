import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash('password123', 10);
  const admin = await prisma.user.create({
    data: {
      username: "admin",
      email: "admin@example.com",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  // Create regular user
  const userPassword = await bcrypt.hash("password123", 10);
  const user = await prisma.user.create({
    data: {
      username: "user",
      email: "user@example.com",
      password: userPassword,
      role: "USER",
    },
  });

  // Create sample rooms
  const rooms = await Promise.all([
    prisma.room.create({
      data: {
        number: '101',
        type: 'STANDARD',
        price: 100,
        capacity: 2,
        amenities: 'WiFi, TV, Mini Bar',
        status: 'AVAILABLE',
      },
    }),
    prisma.room.create({
      data: {
        number: '102',
        type: 'DELUXE',
        price: 200,
        capacity: 3,
        amenities: 'WiFi, TV, Mini Bar, Ocean View',
        status: 'AVAILABLE',
      },
    }),
    prisma.room.create({
      data: {
        number: '201',
        type: 'SUITE',
        price: 300,
        capacity: 4,
        amenities: 'WiFi, TV, Mini Bar, Ocean View, Jacuzzi',
        status: 'AVAILABLE',
      },
    }),
  ]);

  // Create sample bookings
  const bookings = await Promise.all([
    prisma.booking.create({
      data: {
        userId: user.id,
        roomId: rooms[0].id,
        checkIn: new Date('2024-04-01'),
        checkOut: new Date('2024-04-05'),
        status: 'CONFIRMED',
      },
    }),
    prisma.booking.create({
      data: {
        userId: user.id,
        roomId: rooms[1].id,
        checkIn: new Date('2024-05-01'),
        checkOut: new Date('2024-05-03'),
        status: 'PENDING',
      },
    }),
    prisma.booking.create({
      data: {
        userId: admin.id,
        roomId: rooms[2].id,
        checkIn: new Date('2024-06-01'),
        checkOut: new Date('2024-06-07'),
        status: 'CONFIRMED',
      },
    }),
  ]);

  // Update room statuses based on bookings
  await Promise.all([
    prisma.room.update({
      where: { id: rooms[0].id },
      data: { status: 'OCCUPIED' },
    }),
    prisma.room.update({
      where: { id: rooms[2].id },
      data: { status: 'OCCUPIED' },
    }),
  ]);

  console.log({
    admin,
    user,
    rooms,
    bookings,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 