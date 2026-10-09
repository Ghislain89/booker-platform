import bcrypt from "bcryptjs";
import { Prisma, User as DbUser } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { conflict, HttpError } from "../lib/http";
import { signToken } from "../middleware/auth";
import { AuthRequest, AuthResponse, RegisterRequest, Role, User } from "../types";

export const toRole = (dbRole: string): Role => (dbRole === "ADMIN" ? "ROLE_ADMIN" : "ROLE_USER");

export const toUser = (user: DbUser): User => ({
  id: user.id,
  username: user.username,
  email: user.email,
  role: toRole(user.role),
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const issueToken = (user: DbUser): AuthResponse => ({
  token: signToken({ userId: user.id, username: user.username, role: toRole(user.role) }),
  user: toUser(user),
});

class AuthService {
  async login(credentials: AuthRequest): Promise<AuthResponse> {
    const user = await prisma.user.findUnique({
      where: { username: credentials.username },
    });
    const isValidPassword = user && (await bcrypt.compare(credentials.password, user.password));
    if (!user || !isValidPassword) {
      throw new HttpError(401, "Invalid credentials");
    }
    return issueToken(user);
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const existing = await prisma.user.findFirst({
      where: { OR: [{ username: userData.username }, { email: userData.email }] },
    });
    if (existing) {
      throw conflict(
        existing.username === userData.username ? "Username already exists" : "Email already exists",
      );
    }

    try {
      const newUser = await prisma.user.create({
        data: {
          username: userData.username,
          email: userData.email,
          password: await bcrypt.hash(userData.password, 10),
          role: "USER",
        },
      });
      return issueToken(newUser);
    } catch (error) {
      // Lost a race with a parallel registration of the same username or e-mail.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw conflict("Username already exists");
      }
      throw error;
    }
  }

  async logout(): Promise<void> {
    // JWTs are stateless; a real application would add the token to a deny list.
  }
}

export const authService = new AuthService();
