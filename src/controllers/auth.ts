import { AuthRequest, AuthResponse, RegisterRequest } from "../types";
import { authService } from "../services/auth";

class AuthController {
  login(credentials: AuthRequest): Promise<AuthResponse> {
    return authService.login(credentials);
  }

  register(userData: RegisterRequest): Promise<AuthResponse> {
    return authService.register(userData);
  }

  logout(): Promise<void> {
    return authService.logout();
  }
}

export const authController = new AuthController();
