export interface Room {
  id: string;
  name: string;
  type: string;
  imageUrl: string;
  description: string;
  price: number;
  features: string[];
  accessibility: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  roomId: string;
  userId: string;
  checkIn: string;
  checkOut: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  userId: string;
  subject: string;
  content: string;
  status: 'UNREAD' | 'READ' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
}

export interface Report {
  id: string;
  type: 'OCCUPANCY' | 'REVENUE' | 'CUSTOMER_SATISFACTION';
  data: Record<string, any>;
  generatedAt: string;
  period: {
    start: string;
    end: string;
  };
}

export interface Branding {
  id: string;
  name: string;
  logoUrl: string;
  description: string;
  contact: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
  map: {
    latitude: number;
    longitude: number;
  };
  theme: {
    primaryColor: string;
    secondaryColor: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'ROLE_USER' | 'ROLE_ADMIN';
  createdAt: string;
  updatedAt: string;
}

export interface AuthRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
} 