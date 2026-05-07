import { Injectable } from '@angular/core';

/**
 * Thin wrapper around localStorage for JWT token persistence.
 * Isolating localStorage access here makes the token lifecycle
 * testable and swappable without touching consumers.
 */
@Injectable({
  providedIn: 'root'
})
export class TokenStoreService {
  private readonly STORAGE_KEY = 'shop_auth_token';

  /**
   * Persists the JWT token to localStorage.
   * @param token The JWT string to store.
   */
  saveToken(token: string): void {
    localStorage.setItem(this.STORAGE_KEY, token);
  }

  /**
   * Retrieves the JWT token from localStorage.
   * @returns The stored token string, or null if not present.
   */
  getToken(): string | null {
    return localStorage.getItem(this.STORAGE_KEY);
  }

  /**
   * Removes the JWT token from localStorage (e.g. on logout).
   */
  clearToken(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
