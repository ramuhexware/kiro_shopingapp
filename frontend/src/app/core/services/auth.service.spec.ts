import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { TokenStoreService } from './token-store.service';
import { AuthResponse } from '../models/auth.models';
import { environment } from '../../../environments/environment';

/**
 * Builds a minimal JWT string with the given payload claims.
 * The header and signature are stubs — only the payload is real base64url-encoded JSON.
 */
function buildJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const body = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${header}.${body}.stub-signature`;
}

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let tokenStore: TokenStoreService;
  let router: Router;

  // In-memory localStorage mock
  let localStorageMock: { [key: string]: string };

  beforeEach(() => {
    localStorageMock = {};

    spyOn(localStorage, 'setItem').and.callFake((key: string, value: string) => {
      localStorageMock[key] = value;
    });
    spyOn(localStorage, 'getItem').and.callFake((key: string): string | null => {
      return Object.prototype.hasOwnProperty.call(localStorageMock, key)
        ? localStorageMock[key]
        : null;
    });
    spyOn(localStorage, 'removeItem').and.callFake((key: string) => {
      delete localStorageMock[key];
    });

    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule
      ],
      providers: [AuthService, TokenStoreService]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    tokenStore = TestBed.inject(TokenStoreService);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ─── login() ────────────────────────────────────────────────────────────────

  describe('login()', () => {
    it('should POST to /api/auth/login with the provided credentials', () => {
      const jwt = buildJwt({ sub: 'admin', userId: 1, role: 'ADMIN' });
      const mockResponse: AuthResponse = { token: jwt, username: 'admin', role: 'ADMIN' };

      service.login('admin', 'admin123').subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ username: 'admin', password: 'admin123' });
      req.flush(mockResponse);
    });

    it('should store the token in TokenStore on successful login', () => {
      const jwt = buildJwt({ sub: 'admin', userId: 1, role: 'ADMIN' });
      const mockResponse: AuthResponse = { token: jwt, username: 'admin', role: 'ADMIN' };

      service.login('admin', 'admin123').subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush(mockResponse);

      expect(tokenStore.getToken()).toBe(jwt);
    });

    it('should emit the decoded user to currentUser$ on successful login', () => {
      const jwt = buildJwt({ sub: 'admin', userId: 1, role: 'ADMIN' });
      const mockResponse: AuthResponse = { token: jwt, username: 'admin', role: 'ADMIN' };

      service.login('admin', 'admin123').subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush(mockResponse);

      const emittedUser = service.currentUser$.getValue();
      expect(emittedUser).not.toBeNull();
      expect(emittedUser!.username).toBe('admin');
      expect(emittedUser!.userId).toBe(1);
      expect(emittedUser!.role).toBe('ADMIN');
    });

    it('should emit a USER-role user to currentUser$ when logging in as USER', () => {
      const jwt = buildJwt({ sub: 'user', userId: 2, role: 'USER' });
      const mockResponse: AuthResponse = { token: jwt, username: 'user', role: 'USER' };

      service.login('user', 'user123').subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush(mockResponse);

      const emittedUser = service.currentUser$.getValue();
      expect(emittedUser).not.toBeNull();
      expect(emittedUser!.role).toBe('USER');
    });
  });

  // ─── logout() ───────────────────────────────────────────────────────────────

  describe('logout()', () => {
    it('should clear the token from TokenStore', () => {
      const jwt = buildJwt({ sub: 'admin', userId: 1, role: 'ADMIN' });
      tokenStore.saveToken(jwt);

      service.logout();

      expect(tokenStore.getToken()).toBeNull();
    });

    it('should emit null to currentUser$', () => {
      const jwt = buildJwt({ sub: 'admin', userId: 1, role: 'ADMIN' });
      tokenStore.saveToken(jwt);
      service.currentUser$.next(service.getCurrentUser());

      service.logout();

      expect(service.currentUser$.getValue()).toBeNull();
    });

    it('should navigate to /login', () => {
      spyOn(router, 'navigate');

      service.logout();

      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  // ─── getCurrentUser() ────────────────────────────────────────────────────────

  describe('getCurrentUser()', () => {
    it('should return null when no token is stored', () => {
      expect(service.getCurrentUser()).toBeNull();
    });

    it('should decode the JWT payload and return a CurrentUser', () => {
      const jwt = buildJwt({ sub: 'admin', userId: 1, role: 'ADMIN' });
      tokenStore.saveToken(jwt);

      const user = service.getCurrentUser();

      expect(user).not.toBeNull();
      expect(user!.username).toBe('admin');
      expect(user!.userId).toBe(1);
      expect(user!.role).toBe('ADMIN');
    });

    it('should return null for a malformed token', () => {
      tokenStore.saveToken('not.a.valid.jwt.at.all');

      expect(service.getCurrentUser()).toBeNull();
    });
  });

  // ─── isAuthenticated() ───────────────────────────────────────────────────────

  describe('isAuthenticated()', () => {
    it('should return false when no token is stored', () => {
      expect(service.isAuthenticated()).toBeFalse();
    });

    it('should return true when a token is stored', () => {
      tokenStore.saveToken('some.jwt.token');

      expect(service.isAuthenticated()).toBeTrue();
    });
  });

  // ─── hasRole() ───────────────────────────────────────────────────────────────

  describe('hasRole()', () => {
    it('should return false when no user is authenticated', () => {
      expect(service.hasRole('ADMIN')).toBeFalse();
      expect(service.hasRole('USER')).toBeFalse();
    });

    it('should return true for ADMIN when the current user has ADMIN role', () => {
      const jwt = buildJwt({ sub: 'admin', userId: 1, role: 'ADMIN' });
      tokenStore.saveToken(jwt);

      expect(service.hasRole('ADMIN')).toBeTrue();
    });

    it('should return false for USER when the current user has ADMIN role', () => {
      const jwt = buildJwt({ sub: 'admin', userId: 1, role: 'ADMIN' });
      tokenStore.saveToken(jwt);

      expect(service.hasRole('USER')).toBeFalse();
    });

    it('should return true for USER when the current user has USER role', () => {
      const jwt = buildJwt({ sub: 'user', userId: 2, role: 'USER' });
      tokenStore.saveToken(jwt);

      expect(service.hasRole('USER')).toBeTrue();
    });

    it('should return false for ADMIN when the current user has USER role', () => {
      const jwt = buildJwt({ sub: 'user', userId: 2, role: 'USER' });
      tokenStore.saveToken(jwt);

      expect(service.hasRole('ADMIN')).toBeFalse();
    });
  });

  // ─── currentUser$ initialization ─────────────────────────────────────────────

  describe('currentUser$ initialization', () => {
    it('should initialize currentUser$ as null when no token is stored', () => {
      expect(service.currentUser$.getValue()).toBeNull();
    });

    it('should initialize currentUser$ from a stored token (supports page refresh)', () => {
      const jwt = buildJwt({ sub: 'admin', userId: 1, role: 'ADMIN' });
      localStorageMock['shop_auth_token'] = jwt;

      const freshService = new AuthService(
        TestBed.inject(HttpClient),
        tokenStore,
        router
      );

      const user = freshService.currentUser$.getValue();
      expect(user).not.toBeNull();
      expect(user!.username).toBe('admin');
      expect(user!.role).toBe('ADMIN');
    });
  });
});
