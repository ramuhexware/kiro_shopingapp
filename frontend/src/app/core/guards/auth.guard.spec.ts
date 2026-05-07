import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';

import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Creates a minimal ActivatedRouteSnapshot with optional route data.
 */
function makeRoute(data: Record<string, unknown> = {}): ActivatedRouteSnapshot {
  const snapshot = new ActivatedRouteSnapshot();
  (snapshot as unknown as { data: Record<string, unknown> }).data = data;
  return snapshot;
}

/** Stub RouterStateSnapshot — the guard does not use it but the signature requires it. */
const stubState = {} as RouterStateSnapshot;

// ─── Test Suite ─────────────────────────────────────────────────────────────

describe('authGuard', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', [
      'isAuthenticated',
      'hasRole'
    ]);

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router);
  });

  /** Runs the guard inside Angular's injection context. */
  function runGuard(route: ActivatedRouteSnapshot): boolean | UrlTree {
    return TestBed.runInInjectionContext(() => authGuard(route, stubState)) as boolean | UrlTree;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Unauthenticated user
  // ═══════════════════════════════════════════════════════════════════════════

  describe('when the user is NOT authenticated', () => {
    beforeEach(() => {
      authService.isAuthenticated.and.returnValue(false);
    });

    it('should redirect to /login', () => {
      const result = runGuard(makeRoute());

      expect(result).toBeInstanceOf(UrlTree);
      const urlTree = result as UrlTree;
      expect(router.serializeUrl(urlTree)).toBe('/login');
    });

    it('should redirect to /login even when route has required roles', () => {
      const result = runGuard(makeRoute({ roles: ['ADMIN'] }));

      expect(result).toBeInstanceOf(UrlTree);
      const urlTree = result as UrlTree;
      expect(router.serializeUrl(urlTree)).toBe('/login');
    });

    it('should NOT call hasRole when the user is unauthenticated', () => {
      runGuard(makeRoute({ roles: ['ADMIN'] }));

      expect(authService.hasRole).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Authenticated user — no role requirement on route
  // ═══════════════════════════════════════════════════════════════════════════

  describe('when the user IS authenticated and the route has no role requirement', () => {
    beforeEach(() => {
      authService.isAuthenticated.and.returnValue(true);
    });

    it('should return true (allow navigation)', () => {
      const result = runGuard(makeRoute());

      expect(result).toBeTrue();
    });

    it('should return true when route.data is empty', () => {
      const result = runGuard(makeRoute({}));

      expect(result).toBeTrue();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Authenticated user — route requires a specific role
  // ═══════════════════════════════════════════════════════════════════════════

  describe('when the user IS authenticated and the route requires a role', () => {
    beforeEach(() => {
      authService.isAuthenticated.and.returnValue(true);
    });

    it('should return true when the user has the required role', () => {
      authService.hasRole.and.callFake((role: string) => role === 'ADMIN');

      const result = runGuard(makeRoute({ roles: ['ADMIN'] }));

      expect(result).toBeTrue();
    });

    it('should redirect to /login when the user does NOT have the required role', () => {
      authService.hasRole.and.returnValue(false);

      const result = runGuard(makeRoute({ roles: ['ADMIN'] }));

      expect(result).toBeInstanceOf(UrlTree);
      const urlTree = result as UrlTree;
      expect(router.serializeUrl(urlTree)).toBe('/login');
    });

    it('should return true when the user has at least one of multiple required roles', () => {
      // User has 'USER' role but not 'ADMIN'
      authService.hasRole.and.callFake((role: string) => role === 'USER');

      const result = runGuard(makeRoute({ roles: ['USER', 'ADMIN'] }));

      expect(result).toBeTrue();
    });

    it('should redirect to /login when the user has none of the required roles', () => {
      authService.hasRole.and.returnValue(false);

      const result = runGuard(makeRoute({ roles: ['USER', 'ADMIN'] }));

      expect(result).toBeInstanceOf(UrlTree);
      const urlTree = result as UrlTree;
      expect(router.serializeUrl(urlTree)).toBe('/login');
    });

    it('should return true when roles array is empty (no restriction)', () => {
      const result = runGuard(makeRoute({ roles: [] }));

      expect(result).toBeTrue();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Role-specific scenarios (Requirements 5.1, 7.1)
  // ═══════════════════════════════════════════════════════════════════════════

  describe('ADMIN user accessing ADMIN-only route', () => {
    it('should allow navigation', () => {
      authService.isAuthenticated.and.returnValue(true);
      authService.hasRole.and.callFake((role: string) => role === 'ADMIN');

      const result = runGuard(makeRoute({ roles: ['ADMIN'] }));

      expect(result).toBeTrue();
    });
  });

  describe('USER accessing USER-or-ADMIN route (e.g. /my-orders)', () => {
    it('should allow navigation', () => {
      authService.isAuthenticated.and.returnValue(true);
      authService.hasRole.and.callFake((role: string) => role === 'USER');

      const result = runGuard(makeRoute({ roles: ['USER', 'ADMIN'] }));

      expect(result).toBeTrue();
    });
  });

  describe('USER accessing ADMIN-only route', () => {
    it('should redirect to /login', () => {
      authService.isAuthenticated.and.returnValue(true);
      // USER does not have ADMIN role
      authService.hasRole.and.callFake((role: string) => role === 'USER');

      const result = runGuard(makeRoute({ roles: ['ADMIN'] }));

      expect(result).toBeInstanceOf(UrlTree);
      const urlTree = result as UrlTree;
      expect(router.serializeUrl(urlTree)).toBe('/login');
    });
  });
});
