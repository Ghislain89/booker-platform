import { Request } from 'express';
import { AuthRequest, AuthResponse, RegisterRequest, User } from '../types';
import { authService } from '../services/auth';

class AuthController {
  async login(credentials: AuthRequest): Promise<AuthResponse> {
    console.log('\n=== Auth Controller: Login ===');
    console.log('Received credentials:', JSON.stringify(credentials, null, 2));
    const response = await authService.login(credentials);
    console.log('Service returned:', JSON.stringify(response, null, 2));
    return response;
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    console.log('\n=== Auth Controller: Register ===');
    console.log('Received user data:', JSON.stringify(userData, null, 2));
    const response = await authService.register(userData);
    console.log('Service returned:', JSON.stringify(response, null, 2));
    return response;
  }

  async logout(req: Request): Promise<void> {
    return authService.logout(req);
  }
}

export const authController = new AuthController(); 