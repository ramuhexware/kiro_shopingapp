import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TokenStoreService } from '../services/token-store.service';

/**
 * Functional HTTP interceptor that handles authentication concerns:
 * - Attaches the JWT Bearer token to every outgoing request when a token is present.
 * - On HTTP 401: clears the stored token and redirects to /login.
 * - On HTTP 403: shows a permission-denied snackbar message.
 *
 * Must be registered BEFORE errorInterceptor in the provider chain so that
 * auth errors are handled here and do not trigger duplicate snackbar messages
 * from the generic error handler.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenStore = inject(TokenStoreService);
  const router = inject(Router);
  const snackBar = inject(MatSnackBar);

  const token = tokenStore.getToken();

  // Clone the request and attach the Authorization header if a token is present
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        tokenStore.clearToken();
        router.navigate(['/login']);
      } else if (error.status === 403) {
        snackBar.open('You do not have permission to perform this action', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
      return throwError(() => error);
    })
  );
};
