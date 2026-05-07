# Implementation Plan: Role-Based Access Control

## Overview

Build RBAC end-to-end: start with the Spring Security + JWT foundation, then add the `auth` domain (User entity, JwtUtil, AuthService, AuthController), extend the Sale domain to track ownership, seed user accounts, then move to the Angular side with TokenStore, AuthService, interceptors, guards, the login page, role directive, and finally the My Orders page. Each task is independently buildable and verifiable.

## Tasks

- [x] 1. Add Spring Security and JWT dependencies to pom.xml
  - Add `spring-boot-starter-security` to `backend/pom.xml`
  - Add `jjwt-api`, `jjwt-impl`, `jjwt-jackson` (version `0.12.x`) to `backend/pom.xml`
  - Add `jjwt-impl` and `jjwt-jackson` with `runtime` scope
  - Verify the project still compiles with `mvn compile`
  - _Requirements: 1.1, 1.2, 1.4_

- [x] 2. Create the `auth` domain — User entity, Role enum, and UserRepository
  - Create `backend/src/main/java/com/example/shop/auth/Role.java` — enum with `ADMIN`, `USER`
  - Create `backend/src/main/java/com/example/shop/auth/User.java` — JPA entity with `id`, `username` (unique, length 50), `passwordHash`, `role`; annotate with `@Table(name = "users")`
  - Create `backend/src/main/java/com/example/shop/auth/UserRepository.java` — `JpaRepository<User, Long>` with `Optional<User> findByUsername(String username)`
  - _Requirements: 1.1, 4.1, 4.2_

- [x] 3. Implement JwtUtil
  - Create `backend/src/main/java/com/example/shop/auth/JwtUtil.java`
  - Implement `String generateToken(User user)` — signs a JWT with `sub` (username), `userId`, `role` claims and 8-hour expiry using a secret key from `application.yml` (`app.jwt.secret`)
  - Implement `Claims parseToken(String token)` — validates signature and expiry; throws on invalid/expired token
  - Implement `String extractUsername(String token)`, `Long extractUserId(String token)`, `String extractRole(String token)` as convenience wrappers over `parseToken`
  - Add `app.jwt.secret` property to `backend/src/main/resources/application.yml`
  - [x] 3.1 Write property test for JWT round-trip (Property 1)
    - Use **jqwik** — add `net.jqwik:jqwik` test dependency to `pom.xml`
    - Create `JwtUtilTest` in `backend/src/test/java/com/example/shop/auth/`
    - `@Property(tries = 200)`: generate arbitrary `User` instances (random usernames, IDs, both roles); assert `parseToken(generateToken(user))` returns matching `sub`, `userId`, `role` claims
    - **Property 1: JWT round-trip preserves identity claims**
    - **Validates: Requirements 1.2, 1.4**
  - _Requirements: 1.2, 1.4_

- [x] 4. Implement AuthService and AuthController
  - Create `backend/src/main/java/com/example/shop/auth/AuthService.java`
    - Implement `UserDetailsService` for Spring Security integration
    - Implement `AuthResponse login(LoginRequest request)` — loads user by username, verifies BCrypt password via `PasswordEncoder.matches()`, calls `JwtUtil.generateToken()`, returns `AuthResponse { token, username, role }`
    - Throw `BadCredentialsException` for wrong password or unknown username
  - Create `backend/src/main/java/com/example/shop/auth/LoginRequest.java` — record/class with `username`, `password`
  - Create `backend/src/main/java/com/example/shop/auth/AuthResponse.java` — record/class with `token`, `username`, `role`
  - Create `backend/src/main/java/com/example/shop/auth/AuthController.java` — `@RestController`, `POST /api/auth/login`, delegates to `AuthService`, returns `AuthResponse`
  - [x] 4.1 Write unit tests for AuthService
    - Create `AuthServiceTest` in `backend/src/test/java/com/example/shop/auth/`
    - Test: correct credentials return `AuthResponse` with non-null token
    - Test: wrong password throws `BadCredentialsException`
    - Test: unknown username throws `BadCredentialsException`
  - [x] 4.2 Write property test for invalid credentials (Property 2)
    - In `AuthServiceTest`, add `@Property(tries = 200)`: generate arbitrary username/password pairs where the password does not match the stored BCrypt hash; assert `login()` always throws and never returns a token
    - **Property 2: Invalid credentials never produce a token**
    - **Validates: Requirements 1.3**
  - [x] 4.3 Write property test for BCrypt hashing (Property 3)
    - Create `PasswordEncoderTest` in `backend/src/test/java/com/example/shop/auth/`
    - `@Property(tries = 200)`: generate arbitrary plaintext strings; assert encoded value differs from plaintext and `BCryptPasswordEncoder.matches(plaintext, hash)` returns `true`
    - **Property 3: BCrypt password hashing is non-reversible and verifiable**
    - **Validates: Requirements 1.1, 4.4**
  - _Requirements: 1.1, 1.2, 1.3, 1.6_

- [x] 5. Implement JwtFilter and SecurityConfig
  - Create `backend/src/main/java/com/example/shop/auth/JwtFilter.java` — extends `OncePerRequestFilter`
    - Reads `Authorization: Bearer <token>` header
    - Calls `JwtUtil.parseToken()`; on success sets `UsernamePasswordAuthenticationToken` in `SecurityContextHolder`
    - Passes through silently on missing or invalid token (Spring Security handles 401 downstream)
  - Create `backend/src/main/java/com/example/shop/auth/SecurityConfig.java` — `@Configuration @EnableWebSecurity`
    - Disable CSRF
    - Set `SessionCreationPolicy.STATELESS`
    - Register `JwtFilter` before `UsernamePasswordAuthenticationFilter`
    - Configure `AuthenticationEntryPoint` to return JSON `ErrorResponse` (matching existing format) on 401
    - Configure `AccessDeniedHandler` to return JSON `ErrorResponse` on 403
    - Expose `BCryptPasswordEncoder` and `AuthenticationManager` beans
    - Define `SecurityFilterChain` with the full authorization matrix:
      - Public: `POST /api/auth/login`, `GET /h2-console/**`
      - ADMIN or USER: `GET /api/products`, `GET /api/products/{id}`, `POST /api/sales`, `GET /api/sales/{id}`, `GET /api/sales/my-orders`
      - ADMIN only: `POST /api/products`, `PUT /api/products/{id}`, `POST /api/products/{id}/toggle-active`, `POST /api/stock/purchase`, `GET /api/sales`
  - Extend `GlobalExceptionHandler` to handle `AccessDeniedException` (403) and `AuthenticationException` (401) using the existing `ErrorResponse` structure
  - _Requirements: 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 2.4_

- [x] 6. Checkpoint — verify backend security foundation
  - Ensure all backend tests pass with `mvn test`
  - Verify `POST /api/auth/login` is reachable without a token (public endpoint)
  - Verify `GET /api/products` returns 401 without a token (security is active)
  - Verify H2 console is still accessible
  - Ask the user if any questions arise before proceeding.

- [x] 7. Seed user accounts in DataInitializer
  - Modify `backend/src/main/java/com/example/shop/config/DataInitializer.java`
  - Inject `UserRepository` and `BCryptPasswordEncoder`
  - On startup, if `admin` user does not exist: create with `BCryptPasswordEncoder.encode("admin123")` and role `ADMIN`
  - On startup, if `user` user does not exist: create with `BCryptPasswordEncoder.encode("user123")` and role `USER`
  - Seed is idempotent — check existence before inserting
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 8. Associate sales with authenticated users
  - [x] 8.1 Add `userId` field to `Sale` entity
    - Modify `backend/src/main/java/com/example/shop/sale/Sale.java`
    - Add `@Column(name = "user_id") private Long userId;` — nullable for backward compatibility with existing records
    - _Requirements: 2.7_
  - [x] 8.2 Add `userId` to `SaleResponse` DTO
    - Modify `backend/src/main/java/com/example/shop/common/dto/SaleResponse.java`
    - Add `private Long userId;` field
    - _Requirements: 2.7, 3.2_
  - [x] 8.3 Update SaleService to accept and store userId
    - Modify `SaleService.createSale()` to accept a `Long userId` parameter and set it on the `Sale` entity before saving
    - Add `SaleResponse getSaleById(Long id, Long currentUserId, boolean isAdmin)` — for USER role, throw `AccessDeniedException` if `sale.userId != currentUserId`; ADMIN bypasses the check
    - Add `List<SaleResponse> getSalesByUser(Long userId)` — returns sales filtered by `userId`, ordered by `soldAt` descending; used for `my-orders`
    - Add `List<SaleResponse> getAllSales()` — returns all sales ordered by `soldAt` descending; ADMIN only
    - Update `SaleRepository` with `List<Sale> findByUserIdOrderBySoldAtDesc(Long userId)` and `List<Sale> findAllByOrderBySoldAtDesc()`
    - Update `mapToSaleResponse()` to include `userId`
    - _Requirements: 2.5, 2.6, 2.7, 3.2, 3.3_
  - [x] 8.4 Update SaleController to extract userId from SecurityContext
    - Modify `SaleController.createSale()` — inject `Authentication` from `SecurityContextHolder`, extract `userId` via `JwtUtil`, pass to `SaleService.createSale(request, userId)`
    - Modify `SaleController.getSale()` — extract current user's ID and role from `Authentication`, call updated `SaleService.getSaleById(id, currentUserId, isAdmin)`
    - Add `GET /api/sales/my-orders` endpoint — extract `userId` and role from `Authentication`; call `getSalesByUser(userId)` for USER, `getAllSales()` for ADMIN
    - Add `GET /api/sales` endpoint — ADMIN only (enforced by `SecurityConfig`); calls `getAllSales()`
    - _Requirements: 2.5, 2.6, 2.7, 3.1, 3.2, 3.3, 3.4_
  - [x] 8.5 Write property tests for sale ownership filtering (Properties 4 & 5)
    - Extend `SaleServiceTest` in `backend/src/test/java/com/example/shop/sale/`
    - `@Property(tries = 200)`: generate arbitrary lists of `Sale` objects with random `userId` values; assert `getSalesByUser(userId)` returns exactly the subset where `sale.userId == userId`
    - Test that `createSale` stores the passed `userId` on the persisted entity
    - **Property 4: Sale ownership is preserved end-to-end**
    - **Property 5: My-orders returns only the requesting user's sales**
    - **Validates: Requirements 2.7, 3.2**
  - [x] 8.6 Write unit tests for SaleService ownership checks
    - Test: USER calling `getSaleById` for their own sale succeeds
    - Test: USER calling `getSaleById` for another user's sale throws `AccessDeniedException`
    - Test: ADMIN calling `getSaleById` for any sale succeeds
    - _Requirements: 2.5, 2.6_

- [x] 9. Checkpoint — verify full backend
  - Ensure all backend tests pass with `mvn test`
  - Verify `POST /api/auth/login` with `admin`/`admin123` returns a JWT
  - Verify `POST /api/sales` with a valid USER token creates a sale with the correct `userId`
  - Verify `GET /api/sales/my-orders` returns only the authenticated user's sales
  - Ask the user if any questions arise before proceeding.

- [x] 10. Create Angular TokenStore service
  - Create `frontend/src/app/core/services/token-store.service.ts`
  - Implement `saveToken(token: string): void` — writes to `localStorage` under key `'shop_auth_token'`
  - Implement `getToken(): string | null` — reads from `localStorage`
  - Implement `clearToken(): void` — removes from `localStorage`
  - Export `TokenStoreService` as `providedIn: 'root'`
  - [x] 10.1 Write unit tests for TokenStore
    - Create `token-store.service.spec.ts`
    - Test `saveToken` / `getToken` / `clearToken` round-trip via a mocked `localStorage`
    - _Requirements: 1.7, 1.8_
  - _Requirements: 1.7, 1.8_

- [x] 11. Create Angular AuthService
  - Create `frontend/src/app/core/services/auth.service.ts`
  - Add interfaces `AuthResponse`, `CurrentUser`, `LoginRequest` to `frontend/src/app/core/models/auth.models.ts`
  - Implement `login(username: string, password: string): Observable<AuthResponse>` — calls `POST /api/auth/login`, on success calls `TokenStore.saveToken()` and emits to `currentUser$`
  - Implement `logout(): void` — calls `TokenStore.clearToken()`, emits `null` to `currentUser$`, navigates to `/login`
  - Implement `getCurrentUser(): CurrentUser | null` — decodes JWT payload from `TokenStore.getToken()` (use `atob` on the base64 payload segment)
  - Implement `isAuthenticated(): boolean` — returns `true` if `getToken()` is non-null
  - Implement `hasRole(role: string): boolean` — delegates to `getCurrentUser()?.role === role`
  - Expose `currentUser$: BehaviorSubject<CurrentUser | null>` — initialized from `getCurrentUser()` on service construction (supports page refresh)
  - [x] 11.1 Write unit tests for AuthService
    - Create `auth.service.spec.ts`
    - Test: `login()` stores token and emits to `currentUser$`
    - Test: `logout()` clears token and emits `null`
    - Test: `hasRole()` returns correct boolean for each role
    - _Requirements: 1.7, 1.8, 5.2, 5.5_
  - _Requirements: 1.7, 1.8, 5.2, 5.5_

- [x] 12. Create Angular AuthInterceptor
  - Create `frontend/src/app/core/interceptors/auth.interceptor.ts` as a functional `HttpInterceptorFn`
  - When `TokenStore.getToken()` is non-null, clone the request and add `Authorization: Bearer <token>` header
  - On HTTP 401 response: call `TokenStore.clearToken()` and `Router.navigate(['/login'])`
  - On HTTP 403 response: show `MatSnackBar` message "You do not have permission to perform this action"
  - Register `authInterceptor` **before** `errorInterceptor` in `app.config.ts` so auth errors are handled first and do not trigger duplicate snackbar messages from the generic error handler
  - [x] 12.1 Write property test for auth interceptor token attachment (Property 7)
    - Create `auth.interceptor.spec.ts`
    - Use **fast-check** — add `fast-check` as a dev dependency in `frontend/package.json`
    - `fc.assert(fc.property(...))`: generate arbitrary HTTP request URLs and non-empty token strings; assert every cloned request produced by the interceptor has `Authorization: Bearer <token>` header
    - **Property 7: Auth interceptor attaches token to every request**
    - **Validates: Requirements 6.6**
  - [x] 12.2 Write unit tests for AuthInterceptor
    - Test: `Authorization` header is attached when token is present
    - Test: redirect to `/login` on 401
    - Test: snackbar shown on 403
    - Test: no header attached when token is absent
    - _Requirements: 6.6, 6.7_
  - _Requirements: 6.6, 6.7_

- [x] 13. Create Angular AuthGuard
  - Create `frontend/src/app/core/guards/auth.guard.ts` as a functional `CanActivateFn`
  - Check `AuthService.isAuthenticated()` — redirect to `/login` if false
  - Optionally check `route.data['roles']` array — if present, verify `AuthService.hasRole()` matches; redirect to `/login` if not
  - [x] 13.1 Write unit tests for AuthGuard
    - Create `auth.guard.spec.ts`
    - Test: unauthenticated user is redirected to `/login`
    - Test: authenticated user with correct role passes through
    - Test: authenticated user with wrong role is redirected
    - _Requirements: 5.1, 7.1_
  - _Requirements: 5.1, 7.1_

- [x] 14. Create the Login page component
  - Create `frontend/src/app/auth/login/login.component.ts` as a standalone component at route `/login`
  - Reactive form with `username` (required) and `password` (required) fields using Angular Material `mat-form-field`
  - On submit: call `AuthService.login()`; on success navigate to `/products`; on 401 error display inline error message "Invalid username or password"
  - If already authenticated on load, redirect to `/products` immediately
  - Add `/login` route to `app.routes.ts` (not guarded)
  - [x] 14.1 Write unit tests for LoginComponent
    - Create `login.component.spec.ts`
    - Test: valid credentials navigate to `/products`
    - Test: invalid credentials show error message and stay on `/login`
    - Test: already-authenticated user is redirected to `/products`
    - _Requirements: 5.2, 5.3, 5.4, 5.6_
  - _Requirements: 5.2, 5.3, 5.4, 5.6_

- [x] 15. Apply AuthGuard to existing routes and update app routing
  - Modify `frontend/src/app/app.routes.ts`
  - Apply `authGuard` to `/products` and `/sell` routes
  - Add `/my-orders` route guarded by `authGuard` with `data: { roles: ['USER', 'ADMIN'] }`
  - Update the wildcard `**` redirect to `/products` (guard will redirect to `/login` if unauthenticated)
  - _Requirements: 5.1, 7.1_

- [x] 16. Create the HasRole structural directive
  - Create `frontend/src/app/shared/directives/has-role.directive.ts`
  - Structural directive with selector `[appHasRole]`; input accepts a single role string or array of role strings
  - Inject `AuthService`, subscribe to `currentUser$`
  - Call `ViewContainerRef.createEmbeddedView(templateRef)` when the current user's role matches; call `ViewContainerRef.clear()` otherwise
  - Export from `frontend/src/app/shared/shared.module.ts` (or export directly as standalone)
  - [x] 16.1 Write property test for HasRoleDirective (Property 6)
    - Create `has-role.directive.spec.ts`
    - Use **fast-check**: generate arbitrary role strings; assert directive renders the element if and only if the user's role matches the required role
    - **Property 6: Role directive correctly gates visibility**
    - **Validates: Requirements 6.1, 6.2, 6.3**
  - [x] 16.2 Write unit tests for HasRoleDirective
    - Test: element is rendered for matching role
    - Test: element is removed for non-matching role
    - Test: element updates reactively when `currentUser$` emits a new value
    - _Requirements: 6.1, 6.2, 6.3_
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 17. Apply role-gating to ProductListComponent and AppComponent
  - Modify `frontend/src/app/products/pages/product-list/product-list.component.ts`
    - Import and use `*appHasRole="'ADMIN'"` on the "Add Product" button
    - Use `*appHasRole="'ADMIN'"` on the Edit, Activate/Deactivate, and Purchase Stock action buttons in each product row
  - Modify `frontend/src/app/app.component.ts`
    - Inject `AuthService`
    - Add "My Orders" nav link visible only to USER role: `*appHasRole="'USER'"`
    - Add "Logout" button that calls `AuthService.logout()`
    - Keep "Sell" nav link visible to both roles (no directive needed)
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 18. Add `getMyOrders` and `getAllSales` to ApiService
  - Modify `frontend/src/app/core/services/api.service.ts`
  - Add `AuthResponse`, `LoginRequest` interfaces (or import from `auth.models.ts`)
  - Add `login(request: LoginRequest): Observable<AuthResponse>` method — `POST /api/auth/login`
  - Add `getMyOrders(): Observable<SaleResponse[]>` — `GET /api/sales/my-orders`
  - Add `getAllSales(): Observable<SaleResponse[]>` — `GET /api/sales`
  - Add `userId?: number` to the existing `SaleResponse` interface
  - _Requirements: 3.1, 3.2, 3.4_

- [x] 19. Create the My Orders page component
  - Create `frontend/src/app/sales/pages/my-orders/my-orders.component.ts` as a standalone component
  - On `ngOnInit`, call `ApiService.getMyOrders()` and store results
  - Display a `mat-table` with columns: Sale ID, Date (`soldAt` formatted), Total Amount (currency pipe), Item Count (`items.length`)
  - Sort by date descending (backend already returns in order)
  - Show empty-state message "No orders have been placed yet." when the list is empty
  - Show error-state message "Failed to load orders. Please try again." on API failure
  - [x] 19.1 Write unit tests for MyOrdersComponent
    - Create `my-orders.component.spec.ts`
    - Test: table renders correct rows from API response
    - Test: empty state message shown when response is empty array
    - Test: error message shown when API call fails
    - _Requirements: 7.2, 7.3, 7.4, 7.5_
  - _Requirements: 7.2, 7.3, 7.4, 7.5_

- [x] 20. Final checkpoint — end-to-end verification
  - Ensure all frontend tests pass with `npm test -- --run` (or equivalent single-run command)
  - Ensure all backend tests pass with `mvn test`
  - Verify the full auth flow compiles without TypeScript errors (`npm run build`)
  - Ask the user if any questions arise before considering the feature complete.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Backend tasks (1–9) must be completed before frontend tasks (10–20) since the frontend depends on working API endpoints
- Checkpoints (tasks 6, 9, 20) are verification gates — do not skip them
- Property tests use **jqwik** on the backend and **fast-check** on the frontend
- The `Sale.userId` column is nullable to preserve backward compatibility with existing sale records seeded before auth was introduced
- The `authInterceptor` must be registered before `errorInterceptor` in `app.config.ts` to prevent duplicate error snackbars on 401/403 responses
- The existing `errorInterceptor` should be updated to skip 401/403 errors (let `authInterceptor` handle them exclusively)
