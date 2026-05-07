# Project Structure

## Repository Layout

```
/
├── backend/          # Spring Boot backend application
└── frontend/         # Angular frontend application
```

## Backend Structure

```
backend/
├── src/main/java/com/example/shop/
│   ├── common/                    # Shared components
│   │   ├── dto/                   # Data Transfer Objects
│   │   ├── error/                 # Exception handling
│   │   └── mapper/                # MapStruct mappers
│   ├── config/                    # Configuration classes
│   ├── inventory/                 # Inventory/purchase domain
│   ├── product/                   # Product domain
│   ├── sale/                      # Sales/POS domain
│   └── ShopInventoryApplication.java
├── src/main/resources/
│   └── application.yml            # Application configuration
├── src/test/java/                 # Unit and integration tests
└── pom.xml                        # Maven configuration
```

### Backend Architecture Patterns

**Domain-Driven Structure**: Code organized by business domain (product, sale, inventory)

**Layered Architecture**:
- **Controller Layer**: REST endpoints, request/response handling
- **Service Layer**: Business logic, transaction management
- **Repository Layer**: Data access (Spring Data JPA)
- **Entity Layer**: JPA entities with database mappings

**Each domain module contains**:
- `*Controller.java` - REST API endpoints
- `*Service.java` - Business logic
- `*Repository.java` - Data access interface
- `*.java` - Entity classes

**Common package**:
- `dto/` - Request/response DTOs shared across domains
- `error/` - Custom exceptions and global exception handler
- `mapper/` - MapStruct interfaces for entity-DTO conversion

## Frontend Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── core/                  # Singleton services, interceptors
│   │   │   ├── interceptors/      # HTTP interceptors
│   │   │   └── services/          # Core services (API)
│   │   ├── shared/                # Shared utilities, services
│   │   │   └── services/          # Shared services (cart)
│   │   ├── products/              # Product feature module
│   │   │   └── pages/             # Product pages/components
│   │   ├── sales/                 # Sales feature module
│   │   │   └── pages/             # Sales pages/components
│   │   ├── app.component.ts       # Root component
│   │   └── app.routes.ts          # Route configuration
│   ├── environments/              # Environment configs
│   ├── index.html                 # HTML entry point
│   ├── main.ts                    # Application bootstrap
│   ├── styles.scss                # Global styles
│   └── theme.scss                 # Material theme
├── angular.json                   # Angular CLI configuration
├── package.json                   # NPM dependencies
└── tsconfig.json                  # TypeScript configuration
```

### Frontend Architecture Patterns

**Feature-Based Structure**: Code organized by feature (products, sales)

**Module Organization**:
- **core/**: Singleton services, app-wide interceptors (loaded once)
- **shared/**: Reusable services, components, utilities
- **Feature modules**: Self-contained feature areas with pages/components

**Service Patterns**:
- `ApiService`: Centralized HTTP client for backend communication
- `CartService`: State management using RxJS BehaviorSubject
- `ErrorInterceptor`: Global HTTP error handling with Material snackbar

**Routing**: Standalone components with route configuration in `app.routes.ts`

## Naming Conventions

### Backend (Java)

- **Classes**: PascalCase (`ProductService`, `SaleController`)
- **Methods**: camelCase (`createProduct`, `getProductById`)
- **Constants**: UPPER_SNAKE_CASE (`STORAGE_KEY`)
- **Packages**: lowercase (`com.example.shop.product`)
- **REST Endpoints**: kebab-case (`/api/products/{id}/toggle-active`)

### Frontend (TypeScript)

- **Classes/Interfaces**: PascalCase (`ProductDTO`, `CartService`)
- **Methods/Variables**: camelCase (`getProducts`, `currentCart`)
- **Constants**: UPPER_SNAKE_CASE (`STORAGE_KEY`)
- **Files**: kebab-case (`product-list.component.ts`, `api.service.ts`)
- **Component Selectors**: kebab-case with prefix (`app-product-list`)

## Code Style Conventions

### Backend

- Use `@RequiredArgsConstructor` for constructor injection
- Use `@Slf4j` for logging
- Use `@Transactional` for service methods that modify data
- Use `@Transactional(readOnly = true)` for read-only queries
- Validate inputs with Jakarta Validation annotations (`@Valid`, `@NotNull`)
- Throw domain-specific exceptions (`ResourceNotFoundException`, `InsufficientStockException`)
- Use `Optional<T>` for nullable repository returns
- Use `BigDecimal` for monetary values
- Use `Instant` for timestamps
- Include Javadoc comments for public service methods

### Frontend

- Use `Injectable({ providedIn: 'root' })` for singleton services
- Use RxJS `Observable` for async operations
- Use Angular Material components for UI
- Use `BehaviorSubject` for state management
- Handle errors with interceptors
- Use TypeScript interfaces for type safety
- Use `environment` files for configuration
- Store temporary state in `localStorage` when appropriate

## Database Schema

- **products**: Product catalog with stock tracking
- **purchases**: Stock purchase history
- **sales**: Sales transactions
- **sale_items**: Line items for each sale

**Key Relationships**:
- Sale → SaleItems (one-to-many)
- SaleItem → Product (many-to-one via productId)
- Purchase → Product (many-to-one)

**Optimistic Locking**: `@Version` field on Product entity prevents concurrent update conflicts
