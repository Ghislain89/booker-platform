import { Request } from 'express';
import { AuthRequest, AuthResponse, RegisterRequest, User } from '../types';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

class AuthService {
  async login(credentials: AuthRequest): Promise<AuthResponse> {
    console.log('\n=== Login Attempt ===');
    console.log('Username:', credentials.username);
    
    const user = await prisma.user.findUnique({
      where: { username: credentials.username },
    });

    if (!user) {
      console.log("User not found");
      throw new Error("User not found");
    }

    const isValidPassword = await bcrypt.compare(
      credentials.password,
      user.password,
    );
    if (!isValidPassword) {
      console.log("Invalid password");
      throw new Error("Invalid password");
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: `ROLE_${user.role}` },
      JWT_SECRET,
      { expiresIn: "24h" },
    );

    console.log("Login successful");
    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: `ROLE_${user.role}` as User["role"],
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    console.log('\n=== Registration Attempt ===');
    console.log('Username:', userData.username);
    console.log('Email:', userData.email);

    const existingUser = await prisma.user.findUnique({
      where: { username: userData.username },
    });

    if (existingUser) {
      console.log("Username already exists:", existingUser.username);
      throw new Error("Username already exists");
    }

    console.log("No existing user found, proceeding with registration");

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const newUser = await prisma.user.create({
      data: {
        username: userData.username,
        email: userData.email,
        password: hashedPassword,
        role: "USER",
      },
    });

    console.log("User created successfully:", newUser.username);

    const token = jwt.sign(
      {
        userId: newUser.id,
        username: newUser.username,
        role: `ROLE_${newUser.role}`,
      },
      JWT_SECRET,
      { expiresIn: "24h" },
    );

    console.log("Token generated successfully");
    console.log("Registration completed successfully");

    return {
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: `ROLE_${newUser.role}` as User["role"],
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
      },
    };
  }

  async logout(req: Request): Promise<void> {
    // In a real application, you might want to invalidate the token
    // or implement a token blacklist
    return Promise.resolve();
  }
}

export const authService = new AuthService(); 