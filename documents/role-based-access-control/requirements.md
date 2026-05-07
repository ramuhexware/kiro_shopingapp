# Requirements Document

## Introduction

This feature adds Role-Based Access Control (RBAC) to the Shop Inventory Management System. Currently the application has no authentication or authorization — all API endpoints and UI actions are accessible to anyone. This feature introduces two roles (ADMIN and USER), a login mechanism, and enforces role-specific permissions across both the Spring Boot backend and the Angular frontend.

**ADMIN** users manage the product catalog and inventory (create/edit products, purchase stock). **USER** users browse products, make purchases (checkout/sell), and view their own order history. Both roles are authenticated via username and password using JWT tokens.

## Glossary

- **Auth_Service**: The backend Spring Security component responsible for authenticating users and issuing JWT tokens.
- **Token_Store**: The Angular service responsible for storing, retrieving, and clearing the JWT token in browser localStorage.
- **Auth_Guard**: The Angular route guard that prevents navigation to protected routes when the user is not authenticated or lacks the required role.
- **Role_Directive**: The Angular structural directive that shows or hides UI elements based on the current user's role.
- **ADMIN**: A role that grants full access to product management, inventory management, and all USER capabilities.
- **USER**: A role that grants access to product browsing, checkout (sales), and the user's own order history.
- **JWT**: JSON Web Token — a signed, self-contained token carrying the user's identity and role claims.
- **Current_User**: The authenticated principal extracted from the JWT, containing username, role, and user ID.
- **Order_History**: The list of past sales transactions associated with a specific USER.
- **Auth_Interceptor**: The Angular HTTP interceptor that attaches the JWT Bearer token to outgoing API requests.
- **Login_Page**: The Angular component that presents the username/password form and initiates authentication.
- **User_Entity**: The JPA entity representing a registered user with a username, hashed password, and assigned role.

---

## Requirements

### Requirement 1: User Authentication

**User Story:** As a shop employee, I want to log in with a username and password, so that the system can identify who I am and what I am allowed to do.

#### Acceptance Criteria

1. THE Auth_Service SHALL store user credentials with passwords hashed using BCrypt.
2. WHEN a login request is submitted with a valid username and password, THE Auth_Service SHALL return a signed JWT containing the user's ID, username, and role, with an expiry of 8 hours.
3. IF a login request is submitted with an invalid username or password, THEN THE Auth_Service SHALL return HTTP 401 with an error message and SHALL NOT return a token.
4. WHEN a JWT is received by the backend, THE Auth_Service SHALL validate the token's signature and expiry before granting access to any protected endpoint.
5. IF a request arrives at a protected endpoint without a valid JWT, THEN THE Auth_Service SHALL return HTTP 401.
6. THE Auth_Service SHALL expose a public endpoint `POST /api/auth/login` that does not require authentication.
7. THE Token_Store SHALL persist the JWT in browser localStorage so that the session survives page refresh.
8. WHEN the user logs out, THE Token_Store SHALL remove the JWT from localStorage and THE Login_Page SHALL be displayed.

---

### Requirement 2: Role-Based Backend Authorization

**User Story:** As a system administrator, I want the backend API to enforce role permissions, so that users cannot perform actions beyond their assigned role.

#### Acceptance Criteria

1. WHEN a request to `POST /api/products`, `PUT /api/products/{id}`, or `POST /api/products/{id}/toggle-active` is received without the ADMIN role, THE Auth_Service SHALL return HTTP 403.
2. WHEN a request to `POST /api/stock/purchase` is received without the ADMIN role, THE Auth_Service SHALL return HTTP 403.
3. WHEN a request to `GET /api/products` or `GET /api/products/{id}` is received with any valid JWT (ADMIN or USER role), THE Auth_Service SHALL allow the request.
4. WHEN a request to `POST /api/sales` is received without a valid JWT, THE Auth_Service SHALL return HTTP 401.
5. WHEN a request to `GET /api/sales/{id}` is received by a USER, THE Auth_Service SHALL allow the request only if the sale belongs to that user, and SHALL return HTTP 403 otherwise.
6. WHEN a request to `GET /api/sales/{id}` is received by an ADMIN, THE Auth_Service SHALL allow the request regardless of which user created the sale.
7. THE Auth_Service SHALL associate each new sale with the authenticated user who created it.

---

### Requirement 3: Order History for USER Role

**User Story:** As a USER, I want to view my past sales transactions, so that I can review what I have purchased.

#### Acceptance Criteria

1. THE Auth_Service SHALL expose `GET /api/sales/my-orders` accessible to authenticated users with the USER or ADMIN role.
2. WHEN `GET /api/sales/my-orders` is called by an authenticated USER, THE Auth_Service SHALL return only the sales created by that user, ordered by sale date descending.
3. WHEN `GET /api/sales/my-orders` is called by an ADMIN, THE Auth_Service SHALL return all sales ordered by sale date descending.
4. THE Auth_Service SHALL expose `GET /api/sales` accessible only to users with the ADMIN role, returning all sales.
5. IF `GET /api/sales/my-orders` is called without a valid JWT, THEN THE Auth_Service SHALL return HTTP 401.

---

### Requirement 4: Pre-Seeded User Accounts

**User Story:** As a developer, I want the application to start with pre-seeded user accounts for each role, so that the system can be tested immediately without a user registration flow.

#### Acceptance Criteria

1. WHEN the application starts, THE Auth_Service SHALL ensure at least one ADMIN user account exists with username `admin` and a known default password.
2. WHEN the application starts, THE Auth_Service SHALL ensure at least one USER account exists with username `user` and a known default password.
3. IF the seeded accounts already exist in the database, THEN THE Auth_Service SHALL NOT create duplicate accounts.
4. THE Auth_Service SHALL store all seeded passwords in BCrypt-hashed form and SHALL NOT store plaintext passwords.

---

### Requirement 5: Frontend Login Flow

**User Story:** As a shop employee, I want a login page to appear when I am not authenticated, so that I can enter my credentials and access the application.

#### Acceptance Criteria

1. WHEN an unauthenticated user navigates to any protected route, THE Auth_Guard SHALL redirect the user to `/login`.
2. WHEN the Login_Page form is submitted with valid credentials, THE Login_Page SHALL store the returned JWT via Token_Store and redirect the user to `/products`.
3. IF the Login_Page form is submitted with invalid credentials, THEN THE Login_Page SHALL display an error message and SHALL NOT navigate away from the login page.
4. THE Login_Page SHALL be accessible without authentication (not guarded).
5. WHEN the user clicks the logout button, THE Token_Store SHALL clear the JWT and THE Auth_Guard SHALL redirect the user to `/login`.
6. THE Login_Page SHALL display a username field, a password field, and a submit button.

---

### Requirement 6: Role-Based UI Visibility

**User Story:** As a USER, I want the interface to show only the actions I am allowed to perform, so that I am not confused by controls that would be rejected by the server.

#### Acceptance Criteria

1. WHILE the current user has the USER role, THE Role_Directive SHALL hide the "Add Product" button on the product list page.
2. WHILE the current user has the USER role, THE Role_Directive SHALL hide the "Edit", "Activate/Deactivate", and "Purchase Stock" action buttons for each product row.
3. WHILE the current user has the ADMIN role, THE Role_Directive SHALL display all product management controls.
4. WHILE the current user has the USER role, THE Role_Directive SHALL display the "Sell" navigation link and the "My Orders" navigation link.
5. WHILE the current user has the ADMIN role, THE Role_Directive SHALL display the "Sell" navigation link and hide the "My Orders" navigation link (ADMIN uses `GET /api/sales` instead).
6. THE Auth_Interceptor SHALL attach the `Authorization: Bearer <token>` header to every outgoing HTTP request when a JWT is present in Token_Store.
7. IF the backend returns HTTP 401 or HTTP 403, THEN THE Auth_Interceptor SHALL display a user-facing error message via the Angular Material snackbar.

---

### Requirement 7: My Orders Page (USER)

**User Story:** As a USER, I want a dedicated page to view my order history, so that I can see a list of my past sales with totals and dates.

#### Acceptance Criteria

1. THE Auth_Guard SHALL protect the `/my-orders` route and require the USER or ADMIN role.
2. WHEN the My_Orders_Page loads, THE My_Orders_Page SHALL call `GET /api/sales/my-orders` and display the returned sales in a table ordered by date descending.
3. THE My_Orders_Page SHALL display for each sale: the sale ID, the sale date, the total amount, and the number of items.
4. IF no orders exist for the current user, THEN THE My_Orders_Page SHALL display a message indicating no orders have been placed.
5. IF the `GET /api/sales/my-orders` request fails, THEN THE My_Orders_Page SHALL display an error message.
