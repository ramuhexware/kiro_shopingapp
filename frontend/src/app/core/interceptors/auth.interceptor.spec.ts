import { TestBed } from '@angular/core/testing';
import {
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
  HttpResponse
} from '@angular/common/http';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import * as fc from 'fast-check';

import { authInterceptor } from './auth.interceptor';
import { TokenStoreService } from '../services/token-store.service';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Creates a minimal HttpRequest for testing. */
function makeRequest(url: string): HttpRequest<unknown> {
  return new HttpRequest('GET', url);
}

/** A next handler that returns a successful 200 response. */
const successHandler: HttpHandlerFn = (req) =>
  of(new HttpResponse({ status: 200, url: req.url }));

/** A next handler that returns an HTTP error with the given status. */
function errorHandler(status: number): HttpHandlerFn {
  return () =>
    throwError(() => new HttpErrorResponse({ status, url: '/test' }));
}

// ─── Test Suite ─────────────────────────────────────────────────────────────

describe('authInterceptor', () => {
  let tokenStore: TokenStoreService;
  let router: Router;
  let snackBar: MatSnackBar;

  // In-memory localStorage mock
  let localStorageMock: { [key: string]: string };

  beforeEach(() => {
    localStorageMock = {};

    spyOn(localStorage, 'setItem').and.callFake((key: string, value: string) => {
      localStorageMock[key] = value;
    });
    spyOn(localStorage, 'getItem').and.callFake((key: string): string | null =>
      Object.prototype.hasOwnProperty.call(localStorageMock, key)
        ? localStorageMock[key]
        : null
    );
    spyOn(localStorage, 'removeItem').and.callFake((key: string) => {
      delete localStorageMock[key];
    });

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        TokenStoreService,
        {
          provide: MatSnackBar,
          useValue: { open: jasmine.createSpy('open') }
        }
      ]
    });

    tokenStore = TestBed.inject(TokenStoreService);
    router = TestBed.inject(Router);
    snackBar = TestBed.inject(MatSnackBar);
  });

  // ─── Helper: run interceptor inside Angular's injection context ─────────────

  function runInterceptor(
    req: HttpRequest<unknown>,
    next: HttpHandlerFn
  ) {
    return TestBed.runInInjectionContext(() => authInterceptor(req, next));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Property 7: Auth interceptor attaches token to every request
  // Validates: Requirements 6.6
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * **Property 7: Auth interceptor attaches token to every request**
   *
   * For any outgoing HTTP request when a valid token is present in TokenStore,
   * the cloned request produced by AuthInterceptor SHALL contain an
   * Authorization header with value `Bearer <token>`.
   *
   * **Validates: Requirements 6.6**
   */
  it('Property 7: attaches Authorization header to every request when token is present', (done) => {
    fc.assert(
      fc.property(
        fc.webUrl(),
        fc.string({ minLength: 1 }),
        (url, token) => {
          // Store the generated token
          localStorageMock['shop_auth_token'] = token;

          let capturedRequest: HttpRequest<unknown> | null = null;

          const capturingHandler: HttpHandlerFn = (req) => {
            capturedRequest = req as HttpRequest<unknown>;
            return of(new HttpResponse({ status: 200 }));
          };

          // Run the interceptor synchronously (of() is synchronous)
          TestBed.runInInjectionContext(() =>
            authInterceptor(makeRequest(url), capturingHandler)
          ).subscribe();

          // The cloned request must have the Authorization header
          expect(capturedRequest).not.toBeNull();
          const authHeader = (capturedRequest as unknown as HttpRequest<unknown>).headers.get('Authorization');
          expect(authHeader).toBe(`Bearer ${token}`);
        }
      ),
      { numRuns: 100 }
    );
    done();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Task 12.2 — Unit tests for AuthInterceptor
  // Validates: Requirements 6.6, 6.7
  // ═══════════════════════════════════════════════════════════════════════════

  describe('when a token is present', () => {
    beforeEach(() => {
      tokenStore.saveToken('test-jwt-token');
    });

    it('should attach Authorization: Bearer <token> header to the request', (done) => {
      let capturedRequest: HttpRequest<unknown> | null = null;

      const capturingHandler: HttpHandlerFn = (req) => {
        capturedRequest = req as HttpRequest<unknown>;
        return of(new HttpResponse({ status: 200 }));
      };

      runInterceptor(makeRequest('http://localhost:8080/api/products'), capturingHandler)
        .subscribe(() => {
          expect(capturedRequest).not.toBeNull();
          expect((capturedRequest as HttpRequest<unknown>).headers.get('Authorization'))
            .toBe('Bearer test-jwt-token');
          done();
        });
    });

    it('should not mutate the original request object', (done) => {
      const originalReq = makeRequest('http://localhost:8080/api/products');

      runInterceptor(originalReq, successHandler).subscribe(() => {
        // The original request should not have the Authorization header
        expect(originalReq.headers.has('Authorization')).toBeFalse();
        done();
      });
    });
  });

  describe('when no token is present', () => {
    it('should forward the request without an Authorization header', (done) => {
      let capturedRequest: HttpRequest<unknown> | null = null;

      const capturingHandler: HttpHandlerFn = (req) => {
        capturedRequest = req as HttpRequest<unknown>;
        return of(new HttpResponse({ status: 200 }));
      };

      runInterceptor(makeRequest('http://localhost:8080/api/products'), capturingHandler)
        .subscribe(() => {
          expect(capturedRequest).not.toBeNull();
          expect((capturedRequest as HttpRequest<unknown>).headers.has('Authorization'))
            .toBeFalse();
          done();
        });
    });
  });

  describe('on HTTP 401 response', () => {
    beforeEach(() => {
      tokenStore.saveToken('some-token');
    });

    it('should clear the stored token', (done) => {
      runInterceptor(makeRequest('http://localhost:8080/api/products'), errorHandler(401))
        .subscribe({
          error: () => {
            expect(tokenStore.getToken()).toBeNull();
            done();
          }
        });
    });

    it('should redirect to /login', (done) => {
      spyOn(router, 'navigate');

      runInterceptor(makeRequest('http://localhost:8080/api/products'), errorHandler(401))
        .subscribe({
          error: () => {
            expect(router.navigate).toHaveBeenCalledWith(['/login']);
            done();
          }
        });
    });

    it('should re-throw the error so callers can handle it', (done) => {
      runInterceptor(makeRequest('http://localhost:8080/api/products'), errorHandler(401))
        .subscribe({
          error: (err: HttpErrorResponse) => {
            expect(err.status).toBe(401);
            done();
          }
        });
    });
  });

  describe('on HTTP 403 response', () => {
    it('should show a permission-denied snackbar message', (done) => {
      runInterceptor(makeRequest('http://localhost:8080/api/products'), errorHandler(403))
        .subscribe({
          error: () => {
            expect(snackBar.open).toHaveBeenCalledWith(
              'You do not have permission to perform this action',
              'Close',
              jasmine.objectContaining({ duration: 5000 })
            );
            done();
          }
        });
    });

    it('should re-throw the error so callers can handle it', (done) => {
      runInterceptor(makeRequest('http://localhost:8080/api/products'), errorHandler(403))
        .subscribe({
          error: (err: HttpErrorResponse) => {
            expect(err.status).toBe(403);
            done();
          }
        });
    });

    it('should NOT clear the token on 403', (done) => {
      tokenStore.saveToken('some-token');

      runInterceptor(makeRequest('http://localhost:8080/api/products'), errorHandler(403))
        .subscribe({
          error: () => {
            expect(tokenStore.getToken()).toBe('some-token');
            done();
          }
        });
    });
  });

  describe('on other HTTP errors', () => {
    it('should not clear the token or navigate on 500', (done) => {
      tokenStore.saveToken('some-token');
      spyOn(router, 'navigate');

      runInterceptor(makeRequest('http://localhost:8080/api/products'), errorHandler(500))
        .subscribe({
          error: () => {
            expect(tokenStore.getToken()).toBe('some-token');
            expect(router.navigate).not.toHaveBeenCalled();
            done();
          }
        });
    });
  });
});
