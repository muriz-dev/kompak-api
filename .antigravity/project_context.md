# Project Context: Kompak API

## Tech Stack
- **Runtime**: Cloudflare Workers
- **Framework**: Hono (`hono`)
- **API Documentation**: `hono-openapi` and `@scalar/hono-api-reference` for OpenAPI specifications
- **Database**: Cloudflare D1 (`kompak-db`)
- **ORM**: Drizzle ORM (`drizzle-orm`, `drizzle-kit`) for SQLite
- **Key-Value Storage**: Cloudflare KV (bound as `KV`)
- **Validation**: Zod (`zod`, `@hono/standard-validator`)
- **Testing**: Vitest (`vitest`, `@cloudflare/vitest-pool-workers`)
- **ID Generation**: UUIDv7 (`uuidv7`)

## Project Structure
The project follows a **Modular Monolith** architectural pattern.
Domain logic is separated into specific modules under the `src/modules/` directory:
- `announcements`
- `attendances`
- `auth`
- `badges`
- `events`
- `leaderboards`
- `providers`
- `reward-redemptions`
- `rewards`
- `users`

Each module typically contains:
- `*.route.ts` - Hono routes definitions using `describeRoute` for OpenAPI doc generation.
- `*.controller.ts` - Request handling, orchestrating logic, and returning responses via `ApiResponse`.
- `*.service.ts` - Business logic and orchestrating repository calls.
- `*.repository.ts` - Database interaction layer.
- `*.schema.ts` - Zod validation schemas for requests and queries.

Other critical directories:
- `src/db/` - Contains database setup, migrations, and schema definitions (`schema.ts`).
- `src/middlewares/` - Contains shared middleware (e.g., `auth.ts`, `error-handler.ts`).
- `src/utils/` - Contains utilities like `api-response.ts` and `api-error.ts`.

## Architectural Rules & Best Practices
1. **Routing & OpenAPI**: Every route should be registered using `describeRoute` from `hono-openapi` providing `summary`, `description`, `tags`, and `responses`.
2. **Admin Routes**: Routes that use the `requireRole(['ADMIN'])` middleware MUST prepend `"Admin: "` to their `description` in `describeRoute`. Protect endpoints by applying `security: [{ bearerAuth: [] }]`.
3. **Database Interactions**: Always use Drizzle ORM. Database schemas are centrally located at `src/db/schema.ts`. Use SQLite core types (`text`, `integer`, `real`). Date/Time fields use `integer` with `{ mode: "timestamp_ms" }`.
4. **Validation**: Use Zod for schema validation. Apply them to routes using `@hono/standard-validator`'s `validator()` middleware (e.g., `validator("json", createEventSchema)`).
5. **IDs**: Always use `uuidv7()` for database primary keys.
6. **Authentication**: Use JWT-based auth via `requireAuth` and role-based access via `requireRole(['ADMIN'])` or `requireRole(['CITIZEN'])` in `src/middlewares/auth.ts`.
7. **Consistent Responses**: ALWAYS return JSON responses via the `ApiResponse` utility class (e.g., `return ApiResponse.ok(...)` or `return ApiResponse.created(...)`). NEVER use raw `c.json()`.
8. **Error Handling**: Throw `ApiError` instances for all expected application errors (e.g., `throw ApiError.notFound("...")`). The `errorHandler` middleware will catch and format these automatically.
9. **Cloudflare Bindings**: Bindings are defined in `wrangler.jsonc` (e.g., D1 `DB`, KV `KV`, environment variables).

## Common Commands
- **Run dev server**: `pnpm dev` or `npm run dev` (uses `wrangler dev`)
- **Deploy**: `npm run deploy`
- **Database Migrations**: `npm run db:generate`, `npm run db:push`, `npm run db:migrate`
- **Database Studio**: `npm run db:studio`
- **Generate CF Types**: `npm run cf-typegen`
- **Test**: `npm run test` or `npx vitest run`

## Application Flow
- The main entry point is `src/index.ts`.
- `dbMiddleware` injects the Drizzle DB instance into the Hono context so it can be accessed in controllers via `c.get('db')`, though repositories generally use `getDb(c.env.DB)`.
- All errors are caught and formatted consistently using the custom `errorHandler`.
