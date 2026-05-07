import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Functional route guard that protects routes requiring authentication
 * and optionally enforces role-based access control.
 *
 * Behavior:
 * - If the user is not authenticated, redirects to `/login`.
 * - If the route defines a `data.roles` array, checks that the current user
 *   has at least one of the required roles; redirects to `/login` if not.
 * - Returns `true` to allow navigation when all checks pass.
 *
 * Usage:
 * ```ts
 * { path: 'products', component: ProductListComponent, canActivate: [authGuard] }
 * { path: 'my-orders', component: MyOrdersComponent, canActivate: [authGuard],
 *   data: { roles: ['USER', 'ADMIN'] } }
 * ```
 *
 * Validates: Requirements 5.1, 7.1
 */
export const authGuard: CanActivateFn = (route, _state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check authentication first
  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  // Check role requirements if specified on the route
  const requiredRoles: string[] | undefined = route.data?.['roles'];
  if (requiredRoles && requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some(role => authService.hasRole(role));
    if (!hasRequiredRole) {
      return router.createUrlTree(['/login']);
    }
  }

  return true;
};
