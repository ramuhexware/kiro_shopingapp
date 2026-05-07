# Technology Stack

## Backend

- **Framework**: Spring Boot 3.2.0
- **Language**: Java 17
- **Build Tool**: Maven
- **Database**: H2 (file-based, development mode)
- **ORM**: Spring Data JPA / Hibernate
- **Validation**: Jakarta Validation (Bean Validation)
- **Mapping**: MapStruct 1.5.5
- **Utilities**: Lombok (reduce boilerplate)

### Backend Dependencies

- `spring-boot-starter-web` - REST API
- `spring-boot-starter-data-jpa` - Database access
- `spring-boot-starter-validation` - Request validation
- `h2` - Embedded database
- `lombok` - Code generation
- `mapstruct` - DTO mapping

## Frontend

- **Framework**: Angular 17
- **Language**: TypeScript 5.2
- **Build Tool**: Angular CLI
- **UI Library**: Angular Material 17
- **Styling**: SCSS
- **HTTP Client**: Angular HttpClient
- **State Management**: RxJS BehaviorSubject

### Frontend Dependencies

- `@angular/core`, `@angular/common`, `@angular/router` - Core framework
- `@angular/material`, `@angular/cdk` - UI components
- `rxjs` - Reactive programming

## Common Commands

### Backend

```bash
# Navigate to backend directory
cd backend

# Build the project
mvn clean install

# Run the application
mvn spring-boot:run

# Run tests
mvn test

# Package as JAR
mvn package
```

**Backend runs on**: `http://localhost:8080`  
**H2 Console**: `http://localhost:8080/h2-console`

### Frontend

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint
```

**Frontend runs on**: ``

## API Configuration

- **Backend API Base URL**: `http://localhost:8080/api`
- **CORS**: Configured to allow `http://localhost:4200` and `http://localhost:3000`
- **Database File**: `./data/shopdb` (relative to backend directory)

## Development Setup

1. Start backend first: `cd backend && mvn spring-boot:run`
2. Start frontend: `cd frontend && npm start`
3. Access application at `http://localhost:4200`
