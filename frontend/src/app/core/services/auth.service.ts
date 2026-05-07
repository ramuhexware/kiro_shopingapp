import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuthResponse,
  ChangePasswordRequest,
  CurrentUser,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest
} from '../models/auth.models';
import { TokenStoreService } from './token-store.service';

/**
 * Manages authentication state for the Angular application.
 *
 * Responsibilities:
 * - Calls POST /api/auth/login and stores the returned JWT via TokenStore
 * - Decodes the JWT payload to expose the current user's identity and role
 * - Exposes a reactive `currentUser$` BehaviorSubject for components and guards
 * - Handles logout by clearing the token and navigating to /login
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = environment.apiUrl;

  /**
   * Reactive stream of the currently authenticated user.
   * Initialized from the stored JWT on service construction so that
   * a page refresh restores the authenticated state.
   * Emits `null` when the user is not authenticated.
   */
  currentUser$: BehaviorSubject<CurrentUser | null>;

  constructor(
    private http: HttpClient,
    private tokenStore: TokenStoreService,
    private router: Router
  ) {
    // Restore user from stored token on construction (supports page refresh)
    this.currentUser$ = new BehaviorSubject<CurrentUser | null>(this.getCurrentUser());
  }

  /**
   * Authenticates the user against the backend.
   * On success, persists the JWT and emits the decoded user to `currentUser$`.
   *
   * @param username The user's login name.
   * @param password The user's plaintext password.
   * @returns Observable that emits the AuthResponse on success.
   */
  login(username: string, password: string): Observable<AuthResponse> {
    const request: LoginRequest = { username, password };
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, request).pipe(
      tap((response: AuthResponse) => {
        this.tokenStore.saveToken(response.token);
        this.currentUser$.next(this.getCurrentUser());
      })
    );
  }

  /**
   * Logs out the current user.
   * Clears the stored JWT, emits null to `currentUser$`, and navigates to /login.
   */
  logout(): void {
    this.tokenStore.clearToken();
    this.currentUser$.next(null);
    this.router.navigate(['/login']);
  }

  /**
   * Registers a new user account. On success, stores the JWT and logs the user in.
   */
  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, request).pipe(
      tap((response: AuthResponse) => {
        this.tokenStore.saveToken(response.token);
        this.currentUser$.next(this.getCurrentUser());
      })
    );
  }

  /**
   * Sends a forgot-password request. Returns the reset token (in production this would be emailed).
   */
  forgotPassword(email: string): Observable<ForgotPasswordResponse> {
    const request: ForgotPasswordRequest = { email };
    return this.http.post<ForgotPasswordResponse>(`${this.apiUrl}/auth/forgot-password`, request);
  }

  /**
   * Resets the user's password using a valid reset token.
   */
  resetPassword(token: string, newPassword: string): Observable<{ message: string }> {
    const request: ResetPasswordRequest = { token, newPassword };
    return this.http.post<{ message: string }>(`${this.apiUrl}/auth/reset-password`, request);
  }

  /**
   * Changes the password for the currently authenticated user.
   */
  changePassword(currentPassword: string, newPassword: string): Observable<{ message: string }> {
    const request: ChangePasswordRequest = { currentPassword, newPassword };
    return this.http.post<{ message: string }>(`${this.apiUrl}/auth/change-password`, request);
  }

  /**
   * Decodes the JWT payload from the stored token and returns the current user.
   * Uses `atob` to base64-decode the payload segment (second segment of the JWT).
   *
   * @returns The decoded `CurrentUser`, or `null` if no token is stored or decoding fails.
   */
  getCurrentUser(): CurrentUser | null {
    const token = this.tokenStore.getToken();
    if (!token) {
      return null;
    }

    try {
      const segments = token.split('.');
      if (segments.length !== 3) {
        return null;
      }

      // JWT payload is the second segment, base64url-encoded
      // Replace base64url chars with standard base64 chars before decoding
      const payloadBase64 = segments[1].replace(/-/g, '+').replace(/_/g, '/');
      const payloadJson = atob(payloadBase64);
      const payload = JSON.parse(payloadJson);

      return {
        userId: payload['userId'],
        username: payload['sub'],
        role: payload['role']
      };
    } catch {
      // Token is malformed — treat as unauthenticated
      return null;
    }
  }

  /**
   * Returns true if a JWT token is currently stored (user is authenticated).
   */
  isAuthenticated(): boolean {
    return this.tokenStore.getToken() !== null;
  }

  /**
   * Returns true if the current user has the specified role.
   *
   * @param role The role string to check (e.g. 'ADMIN' or 'USER').
   */
  hasRole(role: string): boolean {
    return this.getCurrentUser()?.role === role;
  }
}
