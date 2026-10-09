import bcrypt from "bcryptjs";
import { Prisma, User as DbUser } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { conflict, HttpError, notFound } from "../lib/http";
import { removeUpload } from "../lib/uploads";
import { signToken } from "../middleware/auth";
import { AuthRequest, AuthResponse, RegisterRequest, Role, User } from "../types";

export const toRole = (dbRole: string): Role => (dbRole === "ADMIN" ? "ROLE_ADMIN" : "ROLE_USER");

export const toUser = (user: DbUser): User => ({
  id: user.id,
  username: user.username,
  email: user.email,
  role: toRole(user.role),
  avatarUrl: user.avatarUrl,
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

  async getProfile(userId: string): Promise<User> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw notFound("User not found");
    return toUser(user);
  }

  async updateProfile(userId: string, input: { email?: string }): Promise<User> {
    await this.getProfile(userId);
    if (input.email) {
      const taken = await prisma.user.findFirst({ where: { email: input.email, NOT: { id: userId } } });
      if (taken) throw conflict("Email already exists");
    }
    return toUser(await prisma.user.update({ where: { id: userId }, data: input }));
  }

  async setAvatar(userId: string, avatarUrl: string): Promise<User> {
    const current = await this.getProfile(userId);
    const user = await prisma.user.update({ where: { id: userId }, data: { avatarUrl } });
    removeUpload(current.avatarUrl);
    return toUser(user);
  }

  async logout(): Promise<void> {
    // JWTs are stateless; a real application would add the token to a deny list.
  }
}

export const authService = new AuthService();
