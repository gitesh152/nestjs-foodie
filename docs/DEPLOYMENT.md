# Deployment Checklist

Use this checklist when preparing Foodie backend for a non-local environment.

## Required Environment Variables

Create the environment file for the target NODE_ENV and provide values for:

- `DATABASE_URL`
- `ACCESS_TOKEN_SECRET`
- `ACCESS_TOKEN_EXPIRY`
- `REFRESH_TOKEN_SECRET`
- `REFRESH_TOKEN_EXPIRY`
- `SEED_PASSWORD` only if you intend to run the seed script

Keep secrets in your deployment platform or secret manager. Do not commit real values to the repository.

## Build and Database Steps

1. Install dependencies.
2. Run Prisma migrations against the target database.
3. Generate the Prisma client.
4. Run the seed script only for disposable or initial environments.
5. Start the compiled application.

## Recommended Production Flow

```bash
npm install
npx prisma migrate deploy
npx prisma generate
npm run build
npm run start:prod
```

## Notes

- Use `npx prisma migrate dev` only for local development.
- Confirm the GraphQL endpoint is reachable at `/graphql` before sharing the deployment.
- If you use a managed PostgreSQL provider, make sure SSL settings in `DATABASE_URL` match its requirements.
