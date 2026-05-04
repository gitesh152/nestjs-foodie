# Architecture Overview

## System Design

Foodie backend follows a modular, layered architecture using NestJS.

Request Flow:

Client → GraphQL Resolver → Service → Prisma → PostgreSQL

---

## Module Structure

Each feature module follows the pattern:

- **Resolver** (API layer): GraphQL queries/mutations
- **Service** (business logic): core domain operations
- **DTOs** (validation): input/output schemas

**Modules:**

- Auth: signup, login, token refresh, logout, current user
- User: user profile access and lookup
- Restaurant: restaurant and menu item access
- Order: order creation, item management, checkout/cancel rules
- Payment: payment method creation and management

---

## Authentication Flow

1. User logs in via GraphQL mutation
2. Server returns:
   - Access Token (short-lived)
   - Refresh Token (long-lived)
3. Access token used for API requests
4. Refresh token rotates on renewal

---

## Authorization

- Role-based access (ADMIN, MANAGER, MEMBER)
- Implemented using:
  - JWT Guards
  - Role Guards
  - `@Roles()` decorator

### JWT Token & User Data Changes

**Design Decision: Stateless JWT Tokens**

JWT tokens are intentionally stateless—they do not validate against the database on each request. This means:

- **All user data** (role, country, etc.) is **embedded in the token at creation time**
- Changes to user data in the database do **NOT** automatically update existing tokens
- All guards and resolvers check data from the JWT payload, not the database

**Affected Fields:**

Any user property embedded in the JWT (e.g., `role`, `country`, `email`) will be stale if changed in the database.

**User Experience Impact:**

If a user's data is changed in the database (e.g., MEMBER → MANAGER, or country updated):

1. Their existing JWT token still contains the old data
2. Business logic and authorization will use the stale values
3. **User must obtain fresh tokens** via the refresh endpoint or login endpoint

**Examples:**

- Role changed: MEMBER → MANAGER = permission denied until fresh token
- Country changed: "US" → "UK" = old country used in operations until fresh token

**Why This Design:**

- Avoids extra database queries per request (true stateless auth)
- Improves performance by reducing database load
- Trade-off: Data changes require token refresh (acceptable for most use cases)

---

## Database Layer

- Prisma ORM for type-safe queries
- PostgreSQL as primary database
- Prisma service acts as a single access layer

---

## Key Design Decisions & Patterns

**Architecture:**

- Separation of concerns (Resolver vs Service)
- Modular domain boundaries
- Prisma service as the single persistence gateway

**Security & Validation:**

- Secure token handling with rotation
- Short-lived access tokens with rotating refresh tokens
- Centralized validation (DTO + config validation)
- Guards + role decorators for explicit authorization

**Implementation Patterns:**

- Feature modules with resolver/service separation
- GraphQL code-first schema generation
- Guard-based cross-cutting concerns (JWT + role guards)
- Decorator-driven authorization metadata (`@Roles(...)`)
- Transactional handling for sensitive auth flows
- Configuration via typed config namespaces and environment validation
- Idempotent seed logic for safe initialization
