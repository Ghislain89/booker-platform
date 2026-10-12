import { AuthRequest, AuthResponse, RegisterRequest, User } from "../types";
import { authService } from "../services/auth";

class AuthController {
  login(credentials: AuthRequest): Promise<AuthResponse> {
    return authService.login(credentials);
  }

  register(userData: RegisterRequest): Promise<AuthResponse> {
    return authService.register(userData);
  }

  getProfile(userId: string): Promise<User> {
    return authService.getProfile(userId);
  }

  updateProfile(userId: string, input: { email?: string }): Promise<User> {
    return authService.updateProfile(userId, input);
  }

  setAvatar(userId: string, avatarUrl: string): Promise<User> {
    return authService.setAvatar(userId, avatarUrl);
  }

  logout(): Promise<void> {
    return authService.logout();
  }
}

export const authController = new AuthController();
