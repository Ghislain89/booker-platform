import { z } from "zod";

export type Error = z.infer<typeof Error>;
export const Error = z.object({
  success: z.boolean(),
  error: z.string(),
});

export type ValidationError = z.infer<typeof ValidationError>;
export const ValidationError = z.object({
  success: z.boolean(),
  error: z.string(),
  details: z.unknown(),
});

export type SuccessMessage = z.infer<typeof SuccessMessage>;
export const SuccessMessage = z.object({
  success: z.boolean(),
  message: z.string(),
});

export type User = z.infer<typeof User>;
export const User = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string(),
  role: z.union([z.literal("ROLE_USER"), z.literal("ROLE_ADMIN")]),
  avatarUrl: z.union([z.string(), z.null()]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type UserSummary = z.infer<typeof UserSummary>;
export const UserSummary = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string(),
});

export type UserResponse = z.infer<typeof UserResponse>;
export const UserResponse = z.object({
  success: z.boolean(),
  data: User,
});

export type Room = z.infer<typeof Room>;
export const Room = z.object({
  id: z.string(),
  number: z.string(),
  type: z.union([z.literal("STANDARD"), z.literal("DELUXE"), z.literal("SUITE")]),
  price: z.number(),
  capacity: z.number(),
  amenities: z.array(z.string()),
  status: z.union([z.literal("AVAILABLE"), z.literal("OCCUPIED"), z.literal("MAINTENANCE")]),
  featured: z.boolean(),
  imageUrl: z.union([z.string(), z.null()]),
  position: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type RoomResponse = z.infer<typeof RoomResponse>;
export const RoomResponse = z.object({
  success: z.boolean(),
  data: Room,
});

export type AuthResponse = z.infer<typeof AuthResponse>;
export const AuthResponse = z.object({
  success: z.boolean(),
  data: z.object({
    token: z.string(),
    user: User,
  }),
});

export type PublicRoom = z.infer<typeof PublicRoom>;
export const PublicRoom = z.intersection(
  Room,
  z.object({
    bookedPeriods: z.array(
      z.object({
        checkIn: z.string(),
        checkOut: z.string(),
      }),
    ),
  }),
);

export type PageMeta = z.infer<typeof PageMeta>;
export const PageMeta = z.object({
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
  totalPages: z.number(),
});

export type Extra = z.infer<typeof Extra>;
export const Extra = z.union([z.literal("BREAKFAST"), z.literal("PARKING"), z.literal("LATE_CHECKOUT")]);

export type RoomInput = z.infer<typeof RoomInput>;
export const RoomInput = z.object({
  number: z.string().optional(),
  type: z.union([z.literal("STANDARD"), z.literal("DELUXE"), z.literal("SUITE")]).optional(),
  price: z.number().optional(),
  capacity: z.number().optional(),
  amenities: z.array(z.string()).optional(),
  status: z.union([z.literal("AVAILABLE"), z.literal("OCCUPIED"), z.literal("MAINTENANCE")]).optional(),
  featured: z.boolean().optional(),
});

export type Booking = z.infer<typeof Booking>;
export const Booking = z.object({
  id: z.string(),
  userId: z.string(),
  roomId: z.string(),
  checkIn: z.string(),
  checkOut: z.string(),
  status: z.union([z.literal("PENDING"), z.literal("CONFIRMED"), z.literal("CANCELLED"), z.literal("COMPLETED")]),
  adults: z.number(),
  children: z.number(),
  extras: z.array(Extra),
  nights: z.number(),
  totalPrice: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  user: z.union([UserSummary, z.undefined()]).optional(),
  room: z.union([Room, z.undefined()]).optional(),
});

export type Message = z.infer<typeof Message>;
export const Message = z.object({
  id: z.string(),
  userId: z.union([z.string(), z.null()]),
  name: z.union([z.string(), z.null()]),
  email: z.union([z.string(), z.null()]),
  subject: z.string(),
  content: z.string(),
  status: z.union([z.literal("UNREAD"), z.literal("READ"), z.literal("ARCHIVED")]),
  createdAt: z.string(),
  updatedAt: z.string(),
  user: z.union([UserSummary, z.null(), z.undefined()]).optional(),
});

export type Report = z.infer<typeof Report>;
export const Report = z.object({
  id: z.string(),
  type: z.union([z.literal("OCCUPANCY"), z.literal("REVENUE"), z.literal("CUSTOMER_SATISFACTION")]),
  data: z.unknown(),
  period: z.object({
    start: z.string(),
    end: z.string(),
  }),
  generatedAt: z.string(),
});

export type BrandingContact = z.infer<typeof BrandingContact>;
export const BrandingContact = z.object({
  name: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
});

export type BrandingMap = z.infer<typeof BrandingMap>;
export const BrandingMap = z.object({
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export type BrandingTheme = z.infer<typeof BrandingTheme>;
export const BrandingTheme = z.object({
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
});

export type Branding = z.infer<typeof Branding>;
export const Branding = z.object({
  id: z.string(),
  name: z.string(),
  logoUrl: z.string(),
  description: z.string(),
  contact: BrandingContact,
  map: BrandingMap,
  theme: BrandingTheme,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type PublicBranding = z.infer<typeof PublicBranding>;
export const PublicBranding = z.object({
  name: z.string(),
  logoUrl: z.string(),
  description: z.string(),
  contact: BrandingContact,
  map: BrandingMap,
  theme: BrandingTheme,
});

export type BrandingInput = z.infer<typeof BrandingInput>;
export const BrandingInput = z.object({
  name: z.string().optional(),
  logoUrl: z.string().optional(),
  description: z.string().optional(),
  contact: BrandingContact.optional(),
  map: BrandingMap.optional(),
  theme: BrandingTheme.optional(),
});

export type Flags = z.infer<typeof Flags>;
export const Flags = z.object({
  success: z.boolean(),
  data: z.object({
    enabled: z.array(z.string()),
    available: z.array(z.string()),
  }),
});

export type RecordCounts = z.infer<typeof RecordCounts>;
export const RecordCounts = z.object({
  success: z.boolean(),
  data: z.object({
    users: z.number(),
    rooms: z.number(),
    bookings: z.number(),
    messages: z.number(),
  }),
});

export type get_Apipublicrooms = typeof get_Apipublicrooms;
export const get_Apipublicrooms = {
  method: z.literal("GET"),
  path: z.literal("/api/public/rooms"),
  requestFormat: z.literal("json"),
  parameters: z.object({
    query: z.object({
      type: z.array(z.union([z.literal("STANDARD"), z.literal("DELUXE"), z.literal("SUITE")])).optional(),
      minPrice: z.number().optional(),
      maxPrice: z.number().optional(),
      capacity: z.number().optional(),
      featured: z.boolean().optional(),
      checkIn: z.string().optional(),
      checkOut: z.string().optional(),
      sort: z
        .union([
          z.literal("number"),
          z.literal("price"),
          z.literal("-price"),
          z.literal("capacity"),
          z.literal("-capacity"),
        ])
        .optional(),
      page: z.number().optional(),
      pageSize: z.number().optional(),
    }),
  }),
  response: z.object({
    success: z.boolean(),
    data: z.array(Room),
    meta: PageMeta,
  }),
};

export type get_ApipublicroomsId = typeof get_ApipublicroomsId;
export const get_ApipublicroomsId = {
  method: z.literal("GET"),
  path: z.literal("/api/public/rooms/{id}"),
  requestFormat: z.literal("json"),
  parameters: z.object({
    path: z.object({
      id: z.string(),
    }),
  }),
  response: z.object({
    success: z.boolean(),
    data: PublicRoom,
  }),
};

export type get_Apipublicbranding = typeof get_Apipublicbranding;
export const get_Apipublicbranding = {
  method: z.literal("GET"),
  path: z.literal("/api/public/branding"),
  requestFormat: z.literal("json"),
  parameters: z.never(),
  response: z.object({
    success: z.boolean(),
    data: PublicBranding,
  }),
};

export type post_Apipublicmessages = typeof post_Apipublicmessages;
export const post_Apipublicmessages = {
  method: z.literal("POST"),
  path: z.literal("/api/public/messages"),
  requestFormat: z.literal("json"),
  parameters: z.object({
    body: z.object({
      name: z.string(),
      email: z.string(),
      subject: z.string(),
      content: z.string(),
    }),
  }),
  response: z.object({
    success: z.boolean(),
    data: Message,
  }),
};

export type get_Apipublicflags = typeof get_Apipublicflags;
export const get_Apipublicflags = {
  method: z.literal("GET"),
  path: z.literal("/api/public/flags"),
  requestFormat: z.literal("json"),
  parameters: z.never(),
  response: z.object({
    success: z.boolean(),
    data: z.object({
      enabled: z.array(z.string()),
    }),
  }),
};

export type get_Apievents = typeof get_Apievents;
export const get_Apievents = {
  method: z.literal("GET"),
  path: z.literal("/api/events"),
  requestFormat: z.literal("json"),
  parameters: z.object({
    query: z.object({
      token: z.string().optional(),
    }),
  }),
  response: z.unknown(),
};

export type post_Apiauthlogin = typeof post_Apiauthlogin;
export const post_Apiauthlogin = {
  method: z.literal("POST"),
  path: z.literal("/api/auth/login"),
  requestFormat: z.literal("json"),
  parameters: z.object({
    body: z.object({
      username: z.string(),
      password: z.string(),
    }),
  }),
  response: AuthResponse,
};

export type post_Apiauthregister = typeof post_Apiauthregister;
export const post_Apiauthregister = {
  method: z.literal("POST"),
  path: z.literal("/api/auth/register"),
  requestFormat: z.literal("json"),
  parameters: z.object({
    body: z.object({
      username: z.string(),
      email: z.string(),
      password: z.string(),
    }),
  }),
  response: AuthResponse,
};

export type post_Apiauthlogout = typeof post_Apiauthlogout;
export const post_Apiauthlogout = {
  method: z.literal("POST"),
  path: z.literal("/api/auth/logout"),
  requestFormat: z.literal("json"),
  parameters: z.never(),
  response: z.object({
    success: z.boolean(),
  }),
};

export type get_Apiauthme = typeof get_Apiauthme;
export const get_Apiauthme = {
  method: z.literal("GET"),
  path: z.literal("/api/auth/me"),
  requestFormat: z.literal("json"),
  parameters: z.never(),
  response: UserResponse,
};

export type put_Apiauthme = typeof put_Apiauthme;
export const put_Apiauthme = {
  method: z.literal("PUT"),
  path: z.literal("/api/auth/me"),
  requestFormat: z.literal("json"),
  parameters: z.object({
    body: z.object({
      email: z.string(),
    }),
  }),
  response: UserResponse,
};

export type post_Apiauthmeavatar = typeof post_Apiauthmeavatar;
export const post_Apiauthmeavatar = {
  method: z.literal("POST"),
  path: z.literal("/api/auth/me/avatar"),
  requestFormat: z.literal("form-data"),
  parameters: z.object({
    body: z.object({
      avatar: z.string(),
    }),
  }),
  response: UserResponse,
};

export type get_Apirooms = typeof get_Apirooms;
export const get_Apirooms = {
  method: z.literal("GET"),
  path: z.literal("/api/rooms"),
  requestFormat: z.literal("json"),
  parameters: z.never(),
  response: z.object({
    success: z.boolean(),
    data: z.array(Room),
  }),
};

export type post_Apirooms = typeof post_Apirooms;
export const post_Apirooms = {
  method: z.literal("POST"),
  path: z.literal("/api/rooms"),
  requestFormat: z.literal("json"),
  parameters: z.object({
    body: z.intersection(RoomInput, z.unknown()),
  }),
  response: z.object({
    success: z.boolean(),
    data: Room,
  }),
};

export type put_Apiroomsorder = typeof put_Apiroomsorder;
export const put_Apiroomsorder = {
  method: z.literal("PUT"),
  path: z.literal("/api/rooms/order"),
  requestFormat: z.literal("json"),
  parameters: z.object({
    body: z.object({
      roomIds: z.array(z.string()),
    }),
  }),
  response: z.object({
    success: z.boolean(),
    data: z.array(Room),
  }),
};

export type get_ApiroomsId = typeof get_ApiroomsId;
export const get_ApiroomsId = {
  method: z.literal("GET"),
  path: z.literal("/api/rooms/{id}"),
  requestFormat: z.literal("json"),
  parameters: z.object({
    path: z.object({
      id: z.string(),
    }),
  }),
  response: z.object({
    success: z.boolean(),
    data: Room,
  }),
};

export type put_ApiroomsId = typeof put_ApiroomsId;
export const put_ApiroomsId = {
  method: z.literal("PUT"),
  path: z.literal("/api/rooms/{id}"),
  requestFormat: z.literal("json"),
  parameters: z.object({
    path: z.object({
      id: z.string(),
    }),
    body: RoomInput,
  }),
  response: z.object({
    success: z.boolean(),
    data: Room,
  }),
};

export type delete_ApiroomsId = typeof delete_ApiroomsId;
export const delete_ApiroomsId = {
  method: z.literal("DELETE"),
  path: z.literal("/api/rooms/{id}"),
  requestFormat: z.literal("json"),
  parameters: z.object({
    path: z.object({
      id: z.string(),
    }),
  }),
  response: SuccessMessage,
};

export type post_ApiroomsIdimage = typeof post_ApiroomsIdimage;
export const post_ApiroomsIdimage = {
  method: z.literal("POST"),
  path: z.literal("/api/rooms/{id}/image"),
  requestFormat: z.literal("form-data"),
  parameters: z.object({
    path: z.object({
      id: z.string(),
    }),
    body: z.object({
      image: z.string(),
    }),
  }),
  response: RoomResponse,
};

export type delete_ApiroomsIdimage = typeof delete_ApiroomsIdimage;
export const delete_ApiroomsIdimage = {
  method: z.literal("DELETE"),
  path: z.literal("/api/rooms/{id}/image"),
  requestFormat: z.literal("json"),
  parameters: z.object({
    path: z.object({
      id: z.string(),
    }),
  }),
  response: RoomResponse,
};

export type get_Apibookings = typeof get_Apibookings;
export const get_Apibookings = {
  method: z.literal("GET"),
  path: z.literal("/api/bookings"),
  requestFormat: z.literal("json"),
  parameters: z.never(),
  response: z.object({
    success: z.boolean(),
    data: z.array(Booking),
  }),
};

export type post_Apibookings = typeof post_Apibookings;
export const post_Apibookings = {
  method: z.literal("POST"),
  path: z.literal("/api/bookings"),
  requestFormat: z.literal("json"),
  parameters: z.object({
    body: z.object({
      roomId: z.string(),
      checkIn: z.string(),
      checkOut: z.string(),
      adults: z.union([z.number(), z.undefined()]).optional(),
      children: z.union([z.number(), z.undefined()]).optional(),
      extras: z.union([z.array(Extra), z.undefined()]).optional(),
    }),
  }),
  response: z.object({
    success: z.boolean(),
    data: Booking,
  }),
};

export type get_ApibookingsmyBookings = typeof get_ApibookingsmyBookings;
export const get_ApibookingsmyBookings = {
  method: z.literal("GET"),
  path: z.literal("/api/bookings/my-bookings"),
  requestFormat: z.literal("json"),
  parameters: z.never(),
  response: z.object({
    success: z.boolean(),
    data: z.array(Booking),
  }),
};

export type get_ApibookingsId = typeof get_ApibookingsId;
export const get_ApibookingsId = {
  method: z.literal("GET"),
  path: z.literal("/api/bookings/{id}"),
  requestFormat: z.literal("json"),
  parameters: z.object({
    path: z.object({
      id: z.string(),
    }),
  }),
  response: z.object({
    success: z.boolean(),
    data: Booking,
  }),
};

export type put_ApibookingsId = typeof put_ApibookingsId;
export const put_ApibookingsId = {
  method: z.literal("PUT"),
  path: z.literal("/api/bookings/{id}"),
  requestFormat: z.literal("json"),
  parameters: z.object({
    path: z.object({
      id: z.string(),
    }),
    body: z.object({
      status: z.union([z.literal("PENDING"), z.literal("CONFIRMED"), z.literal("CANCELLED"), z.literal("COMPLETED")]),
    }),
  }),
  response: z.object({
    success: z.boolean(),
    data: Booking,
  }),
};

export type delete_ApibookingsId = typeof delete_ApibookingsId;
export const delete_ApibookingsId = {
  method: z.literal("DELETE"),
  path: z.literal("/api/bookings/{id}"),
  requestFormat: z.literal("json"),
  parameters: z.object({
    path: z.object({
      id: z.string(),
    }),
  }),
  response: SuccessMessage,
};

export type get_ApibookingsIdinvoice = typeof get_ApibookingsIdinvoice;
export const get_ApibookingsIdinvoice = {
  method: z.literal("GET"),
  path: z.literal("/api/bookings/{id}/invoice"),
  requestFormat: z.literal("json"),
  parameters: z.object({
    query: z.object({
      format: z.union([z.literal("pdf"), z.literal("csv")]).optional(),
    }),
    path: z.object({
      id: z.string(),
    }),
  }),
  response: z.unknown(),
};

export type get_Apimessages = typeof get_Apimessages;
export const get_Apimessages = {
  method: z.literal("GET"),
  path: z.literal("/api/messages"),
  requestFormat: z.literal("json"),
  parameters: z.never(),
  response: z.object({
    success: z.boolean(),
    data: z.array(Message),
  }),
};

export type post_Apimessages = typeof post_Apimessages;
export const post_Apimessages = {
  method: z.literal("POST"),
  path: z.literal("/api/messages"),
  requestFormat: z.literal("json"),
  parameters: z.object({
    body: z.object({
      subject: z.string(),
      content: z.string(),
    }),
  }),
  response: z.object({
    success: z.boolean(),
    data: Message,
  }),
};

export type get_ApimessagesmyMessages = typeof get_ApimessagesmyMessages;
export const get_ApimessagesmyMessages = {
  method: z.literal("GET"),
  path: z.literal("/api/messages/my-messages"),
  requestFormat: z.literal("json"),
  parameters: z.never(),
  response: z.object({
    success: z.boolean(),
    data: z.array(Message),
  }),
};

export type get_ApimessagesId = typeof get_ApimessagesId;
export const get_ApimessagesId = {
  method: z.literal("GET"),
  path: z.literal("/api/messages/{id}"),
  requestFormat: z.literal("json"),
  parameters: z.object({
    path: z.object({
      id: z.string(),
    }),
  }),
  response: z.object({
    success: z.boolean(),
    data: Message,
  }),
};

export type put_ApimessagesId = typeof put_ApimessagesId;
export const put_ApimessagesId = {
  method: z.literal("PUT"),
  path: z.literal("/api/messages/{id}"),
  requestFormat: z.literal("json"),
  parameters: z.object({
    path: z.object({
      id: z.string(),
    }),
    body: z.object({
      status: z.union([z.literal("UNREAD"), z.literal("READ"), z.literal("ARCHIVED")]),
    }),
  }),
  response: z.object({
    success: z.boolean(),
    data: Message,
  }),
};

export type delete_ApimessagesId = typeof delete_ApimessagesId;
export const delete_ApimessagesId = {
  method: z.literal("DELETE"),
  path: z.literal("/api/messages/{id}"),
  requestFormat: z.literal("json"),
  parameters: z.object({
    path: z.object({
      id: z.string(),
    }),
  }),
  response: SuccessMessage,
};

export type get_Apireports = typeof get_Apireports;
export const get_Apireports = {
  method: z.literal("GET"),
  path: z.literal("/api/reports"),
  requestFormat: z.literal("json"),
  parameters: z.never(),
  response: z.object({
    success: z.boolean(),
    data: z.array(Report),
  }),
};

export type post_Apireportsgenerate = typeof post_Apireportsgenerate;
export const post_Apireportsgenerate = {
  method: z.literal("POST"),
  path: z.literal("/api/reports/generate"),
  requestFormat: z.literal("json"),
  parameters: z.object({
    body: z.object({
      type: z.union([z.literal("OCCUPANCY"), z.literal("REVENUE"), z.literal("CUSTOMER_SATISFACTION")]),
      period: z.object({
        start: z.string(),
        end: z.string(),
      }),
    }),
  }),
  response: z.object({
    success: z.boolean(),
    data: Report,
  }),
};

export type get_ApireportsId = typeof get_ApireportsId;
export const get_ApireportsId = {
  method: z.literal("GET"),
  path: z.literal("/api/reports/{id}"),
  requestFormat: z.literal("json"),
  parameters: z.object({
    path: z.object({
      id: z.string(),
    }),
  }),
  response: z.object({
    success: z.boolean(),
    data: Report,
  }),
};

export type delete_ApireportsId = typeof delete_ApireportsId;
export const delete_ApireportsId = {
  method: z.literal("DELETE"),
  path: z.literal("/api/reports/{id}"),
  requestFormat: z.literal("json"),
  parameters: z.object({
    path: z.object({
      id: z.string(),
    }),
  }),
  response: SuccessMessage,
};

export type get_Apibranding = typeof get_Apibranding;
export const get_Apibranding = {
  method: z.literal("GET"),
  path: z.literal("/api/branding"),
  requestFormat: z.literal("json"),
  parameters: z.never(),
  response: z.object({
    success: z.boolean(),
    data: Branding,
  }),
};

export type put_Apibranding = typeof put_Apibranding;
export const put_Apibranding = {
  method: z.literal("PUT"),
  path: z.literal("/api/branding"),
  requestFormat: z.literal("json"),
  parameters: z.object({
    body: BrandingInput,
  }),
  response: z.object({
    success: z.boolean(),
    data: Branding,
  }),
};

export type post_Apibrandingreset = typeof post_Apibrandingreset;
export const post_Apibrandingreset = {
  method: z.literal("POST"),
  path: z.literal("/api/branding/reset"),
  requestFormat: z.literal("json"),
  parameters: z.never(),
  response: z.object({
    success: z.boolean(),
    data: Branding,
  }),
};

export type post_Apitestingreset = typeof post_Apitestingreset;
export const post_Apitestingreset = {
  method: z.literal("POST"),
  path: z.literal("/api/testing/reset"),
  requestFormat: z.literal("json"),
  parameters: z.never(),
  response: RecordCounts,
};

export type post_Apitestingseed = typeof post_Apitestingseed;
export const post_Apitestingseed = {
  method: z.literal("POST"),
  path: z.literal("/api/testing/seed"),
  requestFormat: z.literal("json"),
  parameters: z.object({
    body: z.object({
      namespace: z.string(),
      users: z
        .union([
          z.array(
            z.object({
              username: z.string(),
              password: z.union([z.string(), z.undefined()]).optional(),
              email: z.union([z.string(), z.undefined()]).optional(),
              role: z.union([z.literal("USER"), z.literal("ADMIN"), z.undefined()]).optional(),
            }),
          ),
          z.undefined(),
        ])
        .optional(),
      rooms: z
        .union([
          z.array(
            z.object({
              number: z.string(),
              type: z.union([z.literal("STANDARD"), z.literal("DELUXE"), z.literal("SUITE")]),
              price: z.number(),
              capacity: z.number(),
              amenities: z.union([z.array(z.string()), z.undefined()]).optional(),
              status: z
                .union([z.literal("AVAILABLE"), z.literal("OCCUPIED"), z.literal("MAINTENANCE"), z.undefined()])
                .optional(),
            }),
          ),
          z.undefined(),
        ])
        .optional(),
      bookings: z
        .union([
          z.array(
            z.object({
              user: z.string(),
              room: z.string(),
              checkIn: z.string(),
              checkOut: z.string(),
              status: z
                .union([
                  z.literal("PENDING"),
                  z.literal("CONFIRMED"),
                  z.literal("CANCELLED"),
                  z.literal("COMPLETED"),
                  z.undefined(),
                ])
                .optional(),
            }),
          ),
          z.undefined(),
        ])
        .optional(),
    }),
  }),
  response: z.object({
    success: z.boolean(),
    data: z.object({
      namespace: z.string(),
      users: z.array(
        z.object({
          token: z.string(),
          user: User,
          password: z.string(),
        }),
      ),
      rooms: z.array(Room),
      bookings: z.array(Booking),
    }),
  }),
};

export type delete_ApitestingnamespaceNamespace = typeof delete_ApitestingnamespaceNamespace;
export const delete_ApitestingnamespaceNamespace = {
  method: z.literal("DELETE"),
  path: z.literal("/api/testing/namespace/{namespace}"),
  requestFormat: z.literal("json"),
  parameters: z.object({
    path: z.object({
      namespace: z.string(),
    }),
  }),
  response: RecordCounts,
};

export type get_Apitestingflags = typeof get_Apitestingflags;
export const get_Apitestingflags = {
  method: z.literal("GET"),
  path: z.literal("/api/testing/flags"),
  requestFormat: z.literal("json"),
  parameters: z.never(),
  response: Flags,
};

export type put_Apitestingflags = typeof put_Apitestingflags;
export const put_Apitestingflags = {
  method: z.literal("PUT"),
  path: z.literal("/api/testing/flags"),
  requestFormat: z.literal("json"),
  parameters: z.object({
    body: z.object({
      flags: z.array(
        z.union([
          z.literal("slow-rooms"),
          z.literal("flaky-booking"),
          z.literal("stale-list"),
          z.literal("bug-a11y"),
          z.literal("bug-visual"),
          z.literal("bug-price"),
          z.literal("bug-auth"),
          z.literal("random-order"),
          z.literal("popup-cookie"),
        ]),
      ),
    }),
  }),
  response: Flags,
};

// <EndpointByMethod>
export const EndpointByMethod = {
  get: {
    "/api/public/rooms": get_Apipublicrooms,
    "/api/public/rooms/{id}": get_ApipublicroomsId,
    "/api/public/branding": get_Apipublicbranding,
    "/api/public/flags": get_Apipublicflags,
    "/api/events": get_Apievents,
    "/api/auth/me": get_Apiauthme,
    "/api/rooms": get_Apirooms,
    "/api/rooms/{id}": get_ApiroomsId,
    "/api/bookings": get_Apibookings,
    "/api/bookings/my-bookings": get_ApibookingsmyBookings,
    "/api/bookings/{id}": get_ApibookingsId,
    "/api/bookings/{id}/invoice": get_ApibookingsIdinvoice,
    "/api/messages": get_Apimessages,
    "/api/messages/my-messages": get_ApimessagesmyMessages,
    "/api/messages/{id}": get_ApimessagesId,
    "/api/reports": get_Apireports,
    "/api/reports/{id}": get_ApireportsId,
    "/api/branding": get_Apibranding,
    "/api/testing/flags": get_Apitestingflags,
  },
  post: {
    "/api/public/messages": post_Apipublicmessages,
    "/api/auth/login": post_Apiauthlogin,
    "/api/auth/register": post_Apiauthregister,
    "/api/auth/logout": post_Apiauthlogout,
    "/api/auth/me/avatar": post_Apiauthmeavatar,
    "/api/rooms": post_Apirooms,
    "/api/rooms/{id}/image": post_ApiroomsIdimage,
    "/api/bookings": post_Apibookings,
    "/api/messages": post_Apimessages,
    "/api/reports/generate": post_Apireportsgenerate,
    "/api/branding/reset": post_Apibrandingreset,
    "/api/testing/reset": post_Apitestingreset,
    "/api/testing/seed": post_Apitestingseed,
  },
  put: {
    "/api/auth/me": put_Apiauthme,
    "/api/rooms/order": put_Apiroomsorder,
    "/api/rooms/{id}": put_ApiroomsId,
    "/api/bookings/{id}": put_ApibookingsId,
    "/api/messages/{id}": put_ApimessagesId,
    "/api/branding": put_Apibranding,
    "/api/testing/flags": put_Apitestingflags,
  },
  delete: {
    "/api/rooms/{id}": delete_ApiroomsId,
    "/api/rooms/{id}/image": delete_ApiroomsIdimage,
    "/api/bookings/{id}": delete_ApibookingsId,
    "/api/messages/{id}": delete_ApimessagesId,
    "/api/reports/{id}": delete_ApireportsId,
    "/api/testing/namespace/{namespace}": delete_ApitestingnamespaceNamespace,
  },
};
export type EndpointByMethod = typeof EndpointByMethod;
// </EndpointByMethod>

// <EndpointByMethod.Shorthands>
export type GetEndpoints = EndpointByMethod["get"];
export type PostEndpoints = EndpointByMethod["post"];
export type PutEndpoints = EndpointByMethod["put"];
export type DeleteEndpoints = EndpointByMethod["delete"];
export type AllEndpoints = EndpointByMethod[keyof EndpointByMethod];
// </EndpointByMethod.Shorthands>

// <ApiClientTypes>
export type EndpointParameters = {
  body?: unknown;
  query?: Record<string, unknown>;
  header?: Record<string, unknown>;
  path?: Record<string, unknown>;
};

export type MutationMethod = "post" | "put" | "patch" | "delete";
export type Method = "get" | "head" | "options" | MutationMethod;

type RequestFormat = "json" | "form-data" | "form-url" | "binary" | "text";

export type DefaultEndpoint = {
  parameters?: EndpointParameters | undefined;
  response: unknown;
};

export type Endpoint<TConfig extends DefaultEndpoint = DefaultEndpoint> = {
  operationId: string;
  method: Method;
  path: string;
  requestFormat: RequestFormat;
  parameters?: TConfig["parameters"];
  meta: {
    alias: string;
    hasParameters: boolean;
    areParametersRequired: boolean;
  };
  response: TConfig["response"];
};

type Fetcher = (
  method: Method,
  url: string,
  parameters?: EndpointParameters | undefined,
) => Promise<Endpoint["response"]>;

type RequiredKeys<T> = {
  [P in keyof T]-?: undefined extends T[P] ? never : P;
}[keyof T];

type MaybeOptionalArg<T> = RequiredKeys<T> extends never ? [config?: T] : [config: T];

// </ApiClientTypes>

// <ApiClient>
export class ApiClient {
  baseUrl: string = "";

  constructor(public fetcher: Fetcher) {}

  setBaseUrl(baseUrl: string) {
    this.baseUrl = baseUrl;
    return this;
  }

  // <ApiClient.get>
  get<Path extends keyof GetEndpoints, TEndpoint extends GetEndpoints[Path]>(
    path: Path,
    ...params: MaybeOptionalArg<z.infer<TEndpoint["parameters"]>>
  ): Promise<z.infer<TEndpoint["response"]>> {
    return this.fetcher("get", this.baseUrl + path, params[0]) as Promise<z.infer<TEndpoint["response"]>>;
  }
  // </ApiClient.get>

  // <ApiClient.post>
  post<Path extends keyof PostEndpoints, TEndpoint extends PostEndpoints[Path]>(
    path: Path,
    ...params: MaybeOptionalArg<z.infer<TEndpoint["parameters"]>>
  ): Promise<z.infer<TEndpoint["response"]>> {
    return this.fetcher("post", this.baseUrl + path, params[0]) as Promise<z.infer<TEndpoint["response"]>>;
  }
  // </ApiClient.post>

  // <ApiClient.put>
  put<Path extends keyof PutEndpoints, TEndpoint extends PutEndpoints[Path]>(
    path: Path,
    ...params: MaybeOptionalArg<z.infer<TEndpoint["parameters"]>>
  ): Promise<z.infer<TEndpoint["response"]>> {
    return this.fetcher("put", this.baseUrl + path, params[0]) as Promise<z.infer<TEndpoint["response"]>>;
  }
  // </ApiClient.put>

  // <ApiClient.delete>
  delete<Path extends keyof DeleteEndpoints, TEndpoint extends DeleteEndpoints[Path]>(
    path: Path,
    ...params: MaybeOptionalArg<z.infer<TEndpoint["parameters"]>>
  ): Promise<z.infer<TEndpoint["response"]>> {
    return this.fetcher("delete", this.baseUrl + path, params[0]) as Promise<z.infer<TEndpoint["response"]>>;
  }
  // </ApiClient.delete>
}

export function createApiClient(fetcher: Fetcher, baseUrl?: string) {
  return new ApiClient(fetcher).setBaseUrl(baseUrl ?? "");
}

/**
 Example usage:
 const api = createApiClient((method, url, params) =>
   fetch(url, { method, body: JSON.stringify(params) }).then((res) => res.json()),
 );
 api.get("/users").then((users) => console.log(users));
 api.post("/users", { body: { name: "John" } }).then((user) => console.log(user));
 api.put("/users/:id", { path: { id: 1 }, body: { name: "John" } }).then((user) => console.log(user));
*/

// </ApiClient
