# Foodie Backend API

Backend API for Foodie, built with NestJS, GraphQL, and Prisma.

Built with NestJS, GraphQL, and Prisma—includes JWT auth, RBAC, order management, and the bonus country-based access control (data scoped by region).

Primary purpose of this README: help contributors run the backend locally with minimum setup friction.

## Project Overview

Foodie backend powers a role-based food ordering platform.

- Authentication with access and refresh tokens
- Role-based authorization (ADMIN, MANAGER, MEMBER)
- Country-aware business rules for data access
- Order lifecycle support (create, add items, checkout, cancel)
- Payment method management

## Tech Stack

- Runtime: Node.js + TypeScript
- Framework: NestJS
- API layer: GraphQL (Apollo)
- ORM: Prisma
- Database: PostgreSQL
- Auth: Passport JWT + custom refresh-token rotation
- Validation: class-validator, class-transformer, Joi
- Testing: Jest (unit + e2e)
- Tooling: ESLint, Prettier

For detailed architecture, design decisions, and coding patterns, see [**docs/ARCHITECTURE.md**](docs/ARCHITECTURE.md).

## Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL 14+ (or any compatible managed Postgres)

## Run Locally

Clone the repository and navigate to the project directory:

```bash
git clone https://github.com/gitesh152/nestjs-foodie.git
cd nestjs-foodie
```

Use this as the fastest local bootstrap path (After setting up the environment file):

```bash
npm install
npx prisma migrate dev --name init
npx prisma generate
npm run seed
npm run start:dev
```

Then open `http://localhost:3000/graphql`.

### 1. Install dependencies

```bash
npm install
```

### 2. Create environment file

This project loads env files by NODE_ENV using the pattern below:

- development: `.env.development`
- test: `.env.test`
- production: `.env.production`

Start from [`.env.example`](.env.example) and copy it to the environment file you need. For local development, create `.env.development` in the project root:

```bash
NODE_ENV=development
PORT=3000

DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/foodie_db?schema=public"

ACCESS_TOKEN_SECRET="replace-with-a-strong-random-secret"
ACCESS_TOKEN_EXPIRY="15m"

REFRESH_TOKEN_SECRET="replace-with-a-different-strong-random-secret"
REFRESH_TOKEN_EXPIRY="7d"

SEED_PASSWORD="ChangeMe123!"
```

Notes:

- Do not commit real secrets in `.env.development`, `.env.test`, or `.env.production`.
- `SEED_PASSWORD` is required only when running seed data.
- Use SSL options in `DATABASE_URL` if your Postgres provider requires it.

### 3. Run database migrations

```bash
npx prisma migrate dev --name init
```

> **Note:** Some database providers (e.g., Render) don't allow creating shadow databases, which `prisma migrate dev` requires. If you encounter errors like `permission denied to terminate process`, use `npx prisma db push` instead. See [Database Provider Considerations](#database-provider-considerations) below.

### 4. Generate Prisma Client

```bash
npx prisma generate
```

### 5. Database Seeding

```bash
npm run seed
```

#### Seeded Users (When `npm run seed` Is Executed)

All users are created with the same password from `SEED_PASSWORD`.

- admin@foodie.com (ADMIN)
- india.manager@foodie.com (MANAGER)
- usa.manager@foodie.com (MANAGER)
- thanos@foodie.com (MEMBER)
- thor@foodie.com (MEMBER)
- travis@foodie.com (MEMBER)

### 6. Start the API in development mode

```bash
npm run start:dev
```

Server defaults to port `3000`.

GraphQL endpoint:

- `http://localhost:3000/graphql`

GraphiQL is enabled in development for interactive testing.

## Available Scripts

```bash
# Build
npm run build

# Start modes
npm run start
npm run start:dev
npm run start:debug
npm run start:prod

# Code quality
npm run lint
npm run format

# Tests
npm run test
npm run test:watch
npm run test:cov
npm run test:e2e
```

## Suggested Local Development Flow

```bash
npm install
npx prisma migrate dev --name init
npx prisma generate
npm run seed
npm run start:dev
```

Then open `http://localhost:3000/graphql` and test queries/mutations.

## Code Testing (Jest)

### Environment Setup for Testing

E2e tests require a `.env.test` file in the project root. Create it from `.env.example`:

```bash
cp .env.example .env.test
```

Then update the values (keep `NODE_ENV=test`):

```bash
NODE_ENV=test
PORT=3000

DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/foodie_db?schema=public"

ACCESS_TOKEN_SECRET="replace-with-a-strong-random-secret"
ACCESS_TOKEN_EXPIRY="15m"

REFRESH_TOKEN_SECRET="replace-with-a-different-strong-random-secret"
REFRESH_TOKEN_EXPIRY="7d"

SEED_PASSWORD="ChangeMe123!"
```

The test file uses `dotenv` to load these variables before importing the app module.

### Test Coverage

Current automated test coverage is limited.

- Unit tests exist only for:
  - `src/auth/auth.service.spec.ts`
  - `src/user/user.service.spec.ts`
- E2E test file:
  - `test/app.e2e-spec.ts`
- No module-level unit tests yet for order, restaurant, or payment services.

### Test Commands

```bash
npm run test        # unit tests
npm run test:e2e   # end-to-end tests
npm run test:cov   # coverage report
```

---

## API Testing (Postman)

> **Note:** This is different from code testing (Jest). Postman is for manual/API-level testing.

Since Postman does not support native GraphQL API collection export, we use HTTP requests to test GraphQL queries and mutations.

For detailed instructions on testing with Postman, including example requests and authentication setup, see:
[**docs/POSTMAN_TESTING.md**](docs/POSTMAN_TESTING.md)

Key points:

- Use POST requests to `http://localhost:3000/graphql`
- In Postman, select `GraphQL` in the Body tab and paste the query into the GraphQL editor
- Add `Authorization: Bearer <token>` header for authenticated requests
- Reference: [Postman GraphQL HTTP Documentation](https://learning.postman.com/docs/sending-requests/graphql/graphql-http/#send-graphql-queries-in-the-http-request-body)

## Notes For Contributors

- Keep business rules inside services, not resolvers.
- Use guards/decorators for access control rather than inline role checks where possible.
- Validate new environment variables in config validation.
- Keep Prisma schema, migrations, and generated client in sync.

> **Production setup checklist:** [**docs/DEPLOYMENT.md**](docs/DEPLOYMENT.md)
>
> _Recommended before deploying to production._

## Database Provider Considerations

### Databases with Shadow DB Support (e.g., Neon)

Databases like **Neon** allow the `prisma migrate dev` command because they support creating shadow databases for migration validation.

```bash
# Development
npx prisma migrate dev --name init

# Production - apply missing migrations only
npx prisma migrate deploy
```

| Command                 | Use case                                |
| ----------------------- | --------------------------------------- |
| `prisma migrate dev`    | Creates migrations & applies to dev DB  |
| `prisma migrate deploy` | Applies only missing migrations in prod |

### Databases without Shadow DB Support (e.g., Render)

Cloud providers like **Render** don't give users SUPERUSER access, so `prisma migrate dev` fails because it tries to:

- Create a shadow database
- Terminate existing connections

**Error you'll see:**

```
Error: ERROR: permission denied to terminate process
DETAIL: Only roles with the SUPERUSER attribute may terminate processes...
```

**Solution - Use `db push` instead:**

```bash
npx prisma db push
```

| Command          | Use case                                 |
| ---------------- | ---------------------------------------- |
| `prisma db push` | Direct schema sync, no migration history |

> **Note:** `db push` does not create migration history. For production, you'll need to manage schema changes manually or use a different database provider.

### Best Practice

Use **separate databases** for development and production.
