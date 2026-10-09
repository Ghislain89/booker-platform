import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/env";
import { AuthUser } from "../types";

export type AuthRequest = Request;

export const isAdmin = (user?: AuthUser) => user?.role === "ROLE_ADMIN";

export const signToken = (user: AuthUser) =>
  jwt.sign(user, JWT_SECRET, { expiresIn: "24h" });

export const verifyToken = (token: string): AuthUser => {
  const { userId, username, role } = jwt.verify(token, JWT_SECRET) as AuthUser;
  return { userId, username, role };
};

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Authentication required",
    });
  }

  try {
    req.user = verifyToken(token);
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      error: "Invalid token",
    });
  }
};

export const authorizeAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!isAdmin(req.user)) {
    return res.status(403).json({
      success: false,
      error: "Admin access required",
    });
  }
  next();
};
