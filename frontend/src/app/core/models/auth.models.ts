/**
 * Interfaces for authentication-related data models.
 * Used by AuthService and the login flow.
 */

/**
 * Response returned by POST /api/auth/login on successful authentication.
 */
export interface AuthResponse {
  token: string;
  username: string;
  role: string;
}

/**
 * Represents the currently authenticated user, decoded from the JWT payload.
 */
export interface CurrentUser {
  userId: number;
  username: string;
  role: string;
}

/**
 * Request body for POST /api/auth/login.
 */
export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * Request body for POST /api/auth/register.
 */
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

/**
 * Request body for POST /api/auth/forgot-password.
 */
export interface ForgotPasswordRequest {
  email: string;
}

/**
 * Response from POST /api/auth/forgot-password.
 */
export interface ForgotPasswordResponse {
  resetToken: string;
  message: string;
}

/**
 * Request body for POST /api/auth/reset-password.
 */
export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

/**
 * Request body for POST /api/auth/change-password.
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
