import { z } from "zod";

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
  response: z.object({
    success: z.boolean().optional(),
    data: z
      .object({
        token: z.string().optional(),
        user: z
          .object({
            id: z.string().optional(),
            username: z.string().optional(),
            role: z.union([z.literal("ROLE_USER"), z.literal("ROLE_ADMIN")]).optional(),
          })
          .optional(),
      })
      .optional(),
  }),
};

export type post_Apiauthregister = typeof post_Apiauthregister;
export const post_Apiauthregister = {
  method: z.literal("POST"),
  path: z.literal("/api/auth/register"),
  requestFormat: z.literal("json"),
  parameters: z.object({
    body: z.object({
      username: z.string(),
      password: z.string(),
      email: z.string(),
    }),
  }),
  response: z.object({
    success: z.boolean().optional(),
    data: z
      .object({
        id: z.string().optional(),
        username: z.string().optional(),
        email: z.string().optional(),
        role: z.literal("ROLE_USER").optional(),
      })
      .optional(),
  }),
};

export type post_Apiauthlogout = typeof post_Apiauthlogout;
export const post_Apiauthlogout = {
  method: z.literal("POST"),
  path: z.literal("/api/auth/logout"),
  requestFormat: z.literal("json"),
  parameters: z.never(),
  response: z.object({
    success: z.boolean().optional(),
  }),
};

export type get_Apibookings = typeof get_Apibookings;
export const get_Apibookings = {
  method: z.literal("GET"),
  path: z.literal("/api/bookings"),
  requestFormat: z.literal("json"),
  parameters: z.never(),
  response: z.object({
    success: z.boolean().optional(),
    data: z
      .array(
        z.object({
          id: z.string().optional(),
          userId: z.string().optional(),
          roomId: z.string().optional(),
          checkIn: z.string().optional(),
          checkOut: z.string().optional(),
          status: z
            .union([z.literal("PENDING"), z.literal("CONFIRMED"), z.literal("CANCELLED"), z.literal("COMPLETED")])
            .optional(),
          totalPrice: z.number().optional(),
          createdAt: z.string().optional(),
          updatedAt: z.string().optional(),
        }),
      )
      .optional(),
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
    }),
  }),
  response: z.object({
    success: z.boolean().optional(),
    data: z
      .object({
        id: z.string().optional(),
        userId: z.string().optional(),
        roomId: z.string().optional(),
        checkIn: z.string().optional(),
        checkOut: z.string().optional(),
        status: z.literal("PENDING").optional(),
        totalPrice: z.number().optional(),
        createdAt: z.string().optional(),
        updatedAt: z.string().optional(),
      })
      .optional(),
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
    success: z.boolean().optional(),
    data: z
      .object({
        id: z.string().optional(),
        userId: z.string().optional(),
        roomId: z.string().optional(),
        checkIn: z.string().optional(),
        checkOut: z.string().optional(),
        status: z
          .union([z.literal("PENDING"), z.literal("CONFIRMED"), z.literal("CANCELLED"), z.literal("COMPLETED")])
          .optional(),
        totalPrice: z.number().optional(),
        createdAt: z.string().optional(),
        updatedAt: z.string().optional(),
      })
      .optional(),
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
    success: z.boolean().optional(),
    data: z
      .object({
        id: z.string().optional(),
        status: z
          .union([z.literal("PENDING"), z.literal("CONFIRMED"), z.literal("CANCELLED"), z.literal("COMPLETED")])
          .optional(),
        updatedAt: z.string().optional(),
      })
      .optional(),
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
  response: z.object({
    success: z.boolean().optional(),
    message: z.string().optional(),
  }),
};

export type get_Apibranding = typeof get_Apibranding;
export const get_Apibranding = {
  method: z.literal("GET"),
  path: z.literal("/api/branding"),
  requestFormat: z.literal("json"),
  parameters: z.never(),
  response: z.object({
    success: z.boolean().optional(),
    data: z
      .object({
        id: z.string().optional(),
        hotelName: z.string().optional(),
        logo: z.string().optional(),
        primaryColor: z.string().optional(),
        secondaryColor: z.string().optional(),
        fontFamily: z.string().optional(),
        createdAt: z.string().optional(),
        updatedAt: z.string().optional(),
      })
      .optional(),
  }),
};

export type put_Apibranding = typeof put_Apibranding;
export const put_Apibranding = {
  method: z.literal("PUT"),
  path: z.literal("/api/branding"),
  requestFormat: z.literal("json"),
  parameters: z.object({
    body: z.object({
      hotelName: z.string().optional(),
      logo: z.string().optional(),
      primaryColor: z.string().optional(),
      secondaryColor: z.string().optional(),
      fontFamily: z.string().optional(),
    }),
  }),
  response: z.object({
    success: z.boolean().optional(),
    data: z
      .object({
        id: z.string().optional(),
        hotelName: z.string().optional(),
        logo: z.string().optional(),
        primaryColor: z.string().optional(),
        secondaryColor: z.string().optional(),
        fontFamily: z.string().optional(),
        updatedAt: z.string().optional(),
      })
      .optional(),
  }),
};

export type post_Apibrandingreset = typeof post_Apibrandingreset;
export const post_Apibrandingreset = {
  method: z.literal("POST"),
  path: z.literal("/api/branding/reset"),
  requestFormat: z.literal("json"),
  parameters: z.never(),
  response: z.object({
    success: z.boolean().optional(),
    data: z
      .object({
        id: z.string().optional(),
        hotelName: z.string().optional(),
        logo: z.string().optional(),
        primaryColor: z.string().optional(),
        secondaryColor: z.string().optional(),
        fontFamily: z.string().optional(),
        updatedAt: z.string().optional(),
      })
      .optional(),
  }),
};

export type get_Apimessages = typeof get_Apimessages;
export const get_Apimessages = {
  method: z.literal("GET"),
  path: z.literal("/api/messages"),
  requestFormat: z.literal("json"),
  parameters: z.never(),
  response: z.object({
    success: z.boolean().optional(),
    data: z
      .array(
        z.object({
          id: z.string().optional(),
          userId: z.string().optional(),
          content: z.string().optional(),
          createdAt: z.string().optional(),
          updatedAt: z.string().optional(),
        }),
      )
      .optional(),
  }),
};

export type post_Apimessages = typeof post_Apimessages;
export const post_Apimessages = {
  method: z.literal("POST"),
  path: z.literal("/api/messages"),
  requestFormat: z.literal("json"),
  parameters: z.object({
    body: z.object({
      content: z.string(),
    }),
  }),
  response: z.object({
    success: z.boolean().optional(),
    data: z
      .object({
        id: z.string().optional(),
        userId: z.string().optional(),
        content: z.string().optional(),
        createdAt: z.string().optional(),
        updatedAt: z.string().optional(),
      })
      .optional(),
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
    success: z.boolean().optional(),
    data: z
      .object({
        id: z.string().optional(),
        userId: z.string().optional(),
        content: z.string().optional(),
        createdAt: z.string().optional(),
        updatedAt: z.string().optional(),
      })
      .optional(),
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
      content: z.string(),
    }),
  }),
  response: z.object({
    success: z.boolean().optional(),
    data: z
      .object({
        id: z.string().optional(),
        content: z.string().optional(),
        updatedAt: z.string().optional(),
      })
      .optional(),
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
  response: z.object({
    success: z.boolean().optional(),
    message: z.string().optional(),
  }),
};

export type get_Apireports = typeof get_Apireports;
export const get_Apireports = {
  method: z.literal("GET"),
  path: z.literal("/api/reports"),
  requestFormat: z.literal("json"),
  parameters: z.never(),
  response: z.object({
    success: z.boolean().optional(),
    data: z
      .array(
        z.object({
          id: z.string().optional(),
          title: z.string().optional(),
          content: z.string().optional(),
          type: z.union([z.literal("OCCUPANCY"), z.literal("REVENUE"), z.literal("MAINTENANCE")]).optional(),
          createdAt: z.string().optional(),
          updatedAt: z.string().optional(),
        }),
      )
      .optional(),
  }),
};

export type post_Apireports = typeof post_Apireports;
export const post_Apireports = {
  method: z.literal("POST"),
  path: z.literal("/api/reports"),
  requestFormat: z.literal("json"),
  parameters: z.object({
    body: z.object({
      title: z.string(),
      content: z.string(),
      type: z.union([z.literal("OCCUPANCY"), z.literal("REVENUE"), z.literal("MAINTENANCE")]),
    }),
  }),
  response: z.object({
    success: z.boolean().optional(),
    data: z
      .object({
        id: z.string().optional(),
        title: z.string().optional(),
        content: z.string().optional(),
        type: z.union([z.literal("OCCUPANCY"), z.literal("REVENUE"), z.literal("MAINTENANCE")]).optional(),
        createdAt: z.string().optional(),
        updatedAt: z.string().optional(),
      })
      .optional(),
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
    success: z.boolean().optional(),
    data: z
      .object({
        id: z.string().optional(),
        title: z.string().optional(),
        content: z.string().optional(),
        type: z.union([z.literal("OCCUPANCY"), z.literal("REVENUE"), z.literal("MAINTENANCE")]).optional(),
        createdAt: z.string().optional(),
        updatedAt: z.string().optional(),
      })
      .optional(),
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
  response: z.object({
    success: z.boolean().optional(),
    message: z.string().optional(),
  }),
};

export type get_Apirooms = typeof get_Apirooms;
export const get_Apirooms = {
  method: z.literal("GET"),
  path: z.literal("/api/rooms"),
  requestFormat: z.literal("json"),
  parameters: z.never(),
  response: z.object({
    success: z.boolean().optional(),
    data: z
      .array(
        z.object({
          id: z.string().optional(),
          number: z.string().optional(),
          type: z.union([z.literal("STANDARD"), z.literal("DELUXE"), z.literal("SUITE")]).optional(),
          price: z.number().optional(),
          capacity: z.number().optional(),
          amenities: z.array(z.string()).optional(),
          status: z.union([z.literal("AVAILABLE"), z.literal("OCCUPIED"), z.literal("MAINTENANCE")]).optional(),
        }),
      )
      .optional(),
  }),
};

export type post_Apirooms = typeof post_Apirooms;
export const post_Apirooms = {
  method: z.literal("POST"),
  path: z.literal("/api/rooms"),
  requestFormat: z.literal("json"),
  parameters: z.object({
    body: z.object({
      number: z.string(),
      type: z.union([z.literal("STANDARD"), z.literal("DELUXE"), z.literal("SUITE")]),
      price: z.number(),
      capacity: z.number(),
      amenities: z.union([z.array(z.string()), z.undefined()]).optional(),
    }),
  }),
  response: z.object({
    success: z.boolean().optional(),
    data: z
      .object({
        id: z.string().optional(),
        number: z.string().optional(),
        type: z.string().optional(),
        price: z.number().optional(),
        capacity: z.number().optional(),
        amenities: z.array(z.string()).optional(),
        status: z.string().optional(),
      })
      .optional(),
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
    success: z.boolean().optional(),
    data: z
      .object({
        id: z.string().optional(),
        number: z.string().optional(),
        type: z.union([z.literal("STANDARD"), z.literal("DELUXE"), z.literal("SUITE")]).optional(),
        price: z.number().optional(),
        capacity: z.number().optional(),
        amenities: z.array(z.string()).optional(),
        status: z.union([z.literal("AVAILABLE"), z.literal("OCCUPIED"), z.literal("MAINTENANCE")]).optional(),
      })
      .optional(),
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
    body: z.object({
      number: z.string().optional(),
      type: z.union([z.literal("STANDARD"), z.literal("DELUXE"), z.literal("SUITE")]).optional(),
      price: z.number().optional(),
      capacity: z.number().optional(),
      amenities: z.array(z.string()).optional(),
      status: z.union([z.literal("AVAILABLE"), z.literal("OCCUPIED"), z.literal("MAINTENANCE")]).optional(),
    }),
  }),
  response: z.object({
    success: z.boolean().optional(),
    data: z
      .object({
        id: z.string().optional(),
        number: z.string().optional(),
        type: z.string().optional(),
        price: z.number().optional(),
        capacity: z.number().optional(),
        amenities: z.array(z.string()).optional(),
        status: z.string().optional(),
      })
      .optional(),
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
  response: z.object({
    success: z.boolean().optional(),
    message: z.string().optional(),
  }),
};

// <EndpointByMethod>
export const EndpointByMethod = {
  post: {
    "/api/auth/login": post_Apiauthlogin,
    "/api/auth/register": post_Apiauthregister,
    "/api/auth/logout": post_Apiauthlogout,
    "/api/bookings": post_Apibookings,
    "/api/branding/reset": post_Apibrandingreset,
    "/api/messages": post_Apimessages,
    "/api/reports": post_Apireports,
    "/api/rooms": post_Apirooms,
  },
  get: {
    "/api/bookings": get_Apibookings,
    "/api/bookings/{id}": get_ApibookingsId,
    "/api/branding": get_Apibranding,
    "/api/messages": get_Apimessages,
    "/api/messages/{id}": get_ApimessagesId,
    "/api/reports": get_Apireports,
    "/api/reports/{id}": get_ApireportsId,
    "/api/rooms": get_Apirooms,
    "/api/rooms/{id}": get_ApiroomsId,
  },
  put: {
    "/api/bookings/{id}": put_ApibookingsId,
    "/api/branding": put_Apibranding,
    "/api/messages/{id}": put_ApimessagesId,
    "/api/rooms/{id}": put_ApiroomsId,
  },
  delete: {
    "/api/bookings/{id}": delete_ApibookingsId,
    "/api/messages/{id}": delete_ApimessagesId,
    "/api/reports/{id}": delete_ApireportsId,
    "/api/rooms/{id}": delete_ApiroomsId,
  },
};
export type EndpointByMethod = typeof EndpointByMethod;
// </EndpointByMethod>

// <EndpointByMethod.Shorthands>
export type PostEndpoints = EndpointByMethod["post"];
export type GetEndpoints = EndpointByMethod["get"];
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

  // <ApiClient.post>
  post<Path extends keyof PostEndpoints, TEndpoint extends PostEndpoints[Path]>(
    path: Path,
    ...params: MaybeOptionalArg<z.infer<TEndpoint["parameters"]>>
  ): Promise<z.infer<TEndpoint["response"]>> {
    return this.fetcher("post", this.baseUrl + path, params[0]) as Promise<z.infer<TEndpoint["response"]>>;
  }
  // </ApiClient.post>

  // <ApiClient.get>
  get<Path extends keyof GetEndpoints, TEndpoint extends GetEndpoints[Path]>(
    path: Path,
    ...params: MaybeOptionalArg<z.infer<TEndpoint["parameters"]>>
  ): Promise<z.infer<TEndpoint["response"]>> {
    return this.fetcher("get", this.baseUrl + path, params[0]) as Promise<z.infer<TEndpoint["response"]>>;
  }
  // </ApiClient.get>

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
