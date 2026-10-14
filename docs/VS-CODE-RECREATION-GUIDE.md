# Team Huntington Hub — VS Code Recreation and Handoff Guide

**Export date:** October 14, 2026  
**Base revision:** `fbfe8469b000006e998a3028640a2154fe2403a4` (`chris-updates`)  
**Application:** Team Huntington Hub / Ride With Huntington

This guide accompanies the source-code export. It is intended for a developer who needs to open, run, understand, and continue the site in Visual Studio Code without access to the original development environment.

## 1. What is included

The code export contains the complete application source and project configuration:

- React 19 and TypeScript user interface
- TanStack Start routes, SSR, and server functions
- Tailwind CSS 4 and shadcn/Radix UI components
- PostgreSQL schema migrations and row-level-security policies
- PostgREST data-access layer
- OpenID Connect sign-in implementation
- Cloudflare preview configuration
- Node/Azure production build support
- Pelotonia synchronization job
- Unit and database security tests
- VS Code settings, extension recommendations, and debugger profiles
- Architecture, configuration, deployment, Entra ID, data-export, and IT allowlist documentation

The export also contains the restored visual approval tracker on the fundraiser-management page: a connected progress line, completed-step checkmarks, current-stage emphasis, mobile timeline, and explanatory status message.

## 2. What is intentionally not included

The archive does **not** contain:

- Production passwords, API keys, JWT secrets, or OAuth client secrets
- `.env.local` or any other private environment file
- Production database contents or user records
- Uploaded production files
- `node_modules`, build output, caches, logs, or Git history

Those omissions are intentional. Recreating the software is possible from the archive, but recreating the live environment also requires separately provisioned database, identity-provider, email, and file-storage services. Existing production data must be exported separately by following `docs/DATA-EXPORT.md`.

## 3. Technology overview

| Area | Technology |
| --- | --- |
| UI | React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Radix UI |
| Routing and data | TanStack Router, TanStack Query, TanStack Start |
| Build/runtime | Vite 8, Nitro 3, Node.js or Cloudflare Workers |
| Validation/forms | zod, react-hook-form |
| Database | PostgreSQL 17 with row-level security |
| Data API | PostgREST; `supabase-js` is used only as a typed query builder |
| Authentication | OpenID Connect authorization-code flow with PKCE |
| Files | Cloudflare R2 adapter in the current preview; Azure Blob adapter is documented but not yet implemented |
| Email | React Email with Resend or local log output |
| Tests | Node's built-in test runner plus SQL security tests |

## 4. Recommended Windows setup

Use **WSL2 with Ubuntu** for the least friction. Several project scripts use Bash syntax, and the repository requires LF line endings.

1. Install WSL2 and Ubuntu from an elevated PowerShell window:

   ```powershell
   wsl --install -d Ubuntu
   ```

2. Install Visual Studio Code on Windows.
3. Install the **WSL** extension in VS Code.
4. In Ubuntu, install Git and basic tooling:

   ```sh
   sudo apt update
   sudo apt install -y git curl build-essential
   ```

5. Install Node.js **22.18 or newer**. Node 22 LTS is the recommended baseline. A version manager such as `nvm` makes this easier.
6. Extract the code archive inside the WSL filesystem, for example:

   ```sh
   mkdir -p ~/projects/team-huntington-hub
   cd ~/projects/team-huntington-hub
   unzip /mnt/c/Users/<your-name>/Downloads/Team-Huntington-Hub-VSCode-Export-2026-10-14.zip
   cd Team-Huntington-Hub
   code .
   ```

Working under `~/projects` is preferable to working directly under `/mnt/c` because file watching and package installation are faster.

### Native Windows alternative

Native Windows can work with Git Bash, but configure it before extracting or cloning:

```sh
git config --global core.autocrlf input
npm config set script-shell "C:\\Program Files\\Git\\bin\\bash.exe"
```

If `npm run lint` reports thousands of `Delete ␍` errors, files were converted to CRLF. Re-extract the archive in WSL2 or convert the checkout back to LF.

## 5. Open and validate the project in VS Code

1. Open the folder that contains `package.json`.
2. Install the workspace's recommended extensions when prompted. They are listed in `.vscode/extensions.json` and include ESLint, Prettier, EditorConfig, Tailwind CSS IntelliSense, GitHub Copilot, PostgreSQL, Mermaid preview, and Azure tooling.
3. Install exact dependency versions:

   ```sh
   npm ci
   ```

4. Run the software checks:

   ```sh
   npm run typecheck
   npm run lint
   npm test
   npm run build
   ```

At export time, typecheck passed, all **118 unit tests** passed, targeted lint/accessibility checks passed, and the Cloudflare production build passed.

5. For a Node/Azure build, run:

   ```sh
   npm run build:node
   node .output/server/index.mjs
   ```

## 6. Create local configuration

Copy the safe template:

```sh
cp .env.example .env.local
```

Do not commit `.env.local`. At minimum, a functional full-stack environment needs:

```dotenv
PUBLIC_ORIGIN=http://localhost:5173
HUB_REQUIRE_SIGN_IN=

AUTH_BASE_URL=https://your-oidc-provider.example.com
AUTH_CLIENT_ID=your-local-client-id
AUTH_CLIENT_SECRET=replace-me
AUTH_ORG_SLUG=your-organization
SESSION_SECRET=replace-with-at-least-32-random-characters

HUB_DB_URL=http://localhost:3001
HUB_DB_JWT_SECRET=replace-with-the-same-secret-used-by-postgrest

EMAIL_PROVIDER=log
EMAIL_FROM=Team Huntington Hub <hub@example.com>
EMAIL_REDIRECT_TO=test-inbox@example.com
```

Every variable is documented in `docs/CONFIGURATION.md`. Generate real secrets rather than using example values:

```sh
openssl rand -base64 48
```

## 7. Fastest way to inspect the UI

After `npm ci` and creating `.env.local`, start the development server:

```sh
npm run dev
```

Open `http://localhost:5173`.

The application is server-rendered and many pages request backend data. Pages that need the database, sign-in, or files will not be fully functional until those services are configured. Use the full-stack setup below for realistic development.

VS Code includes these debug profiles under **Run and Debug**:

- `Hub: dev server (server breakpoints)`
- `Hub: browser (Edge)`
- `Hub: browser (Chrome)`
- `Hub: full stack (dev server + Edge)`
- `Hub: production Node build (.output)`
- `Unit tests (node --test)`
- `Pelotonia sync (one small run)`

## 8. Full local database setup

You need PostgreSQL 17, the `psql` client, PostgREST, and a reverse proxy such as nginx. The app expects its database endpoint to expose `/rest/v1/*`, while PostgREST serves tables and RPCs at its root.

### 8.1 Start PostgreSQL

A local-only Docker example:

```sh
docker run -d \
  --name rwh-pg \
  -p 5432:5432 \
  -e POSTGRES_HOST_AUTH_METHOD=trust \
  postgres:17
```

Set the tooling variables:

```sh
export PGHOST=localhost
export PGPORT=5432
export PGDATABASE_TEST=rwh_dev
```

### 8.2 Build the schema from migrations

```sh
supabase/tests/local/reset.sh
```

The reset script creates the Supabase-compatible roles and `auth` objects expected by the inherited migrations, then applies every SQL migration in filename order.

**Warning:** `PGDATABASE_TEST` is dropped and recreated. Never point it at a database containing data you need.

### 8.3 Configure the PostgREST login

```sh
psql -h "$PGHOST" -p "$PGPORT" -U postgres -d rwh_dev -c \
  "ALTER ROLE authenticator WITH LOGIN PASSWORD 'local-only'; GRANT anon, authenticated, service_role TO authenticator;"
```

### 8.4 Start PostgREST

```sh
PGRST_DB_URI="postgres://authenticator:local-only@localhost:5432/rwh_dev" \
PGRST_DB_SCHEMAS=public \
PGRST_DB_ANON_ROLE=anon \
PGRST_JWT_SECRET=local-dev-jwt-secret-at-least-32-characters-long \
PGRST_SERVER_PORT=3000 \
postgrest
```

`PGRST_JWT_SECRET` and `HUB_DB_JWT_SECRET` must be identical.

### 8.5 Add the `/rest/v1` gateway

Use nginx or another reverse proxy on port 3001:

```nginx
server {
  listen 3001;

  location /rest/v1/ {
    proxy_pass http://127.0.0.1:3000/;
    proxy_set_header Host $host;
  }

  location / {
    return 404;
  }
}
```

Then set:

```dotenv
HUB_DB_URL=http://localhost:3001
HUB_DB_JWT_SECRET=local-dev-jwt-secret-at-least-32-characters-long
```

## 9. Sign-in setup

The application uses OpenID Connect. The current implementation is isolated in `src/server/session.server.ts` so the provider can be replaced without rewriting the app.

For local sign-in:

1. Create an OAuth/OIDC client at the chosen identity provider.
2. Add this redirect URI exactly:

   ```text
   http://localhost:5173/auth/callback
   ```

3. Put the client values in `.env.local`.
4. Ensure the provider's issuer and claims match the expectations documented in `docs/ARCHITECTURE.md` and `docs/ENTRA.md`.

The long-term target is Microsoft Entra ID. The required migration from the current Aspire Identity provider is documented in `docs/ENTRA.md` and does require a code change.

## 10. File uploads and email

### Files

The current production-preview adapter uses a Cloudflare R2 binding named `HUB_FILES`. A plain Node environment does not yet have a storage implementation. UI and database work can proceed without it, but uploads and downloads will fail until an adapter is added.

For Azure, implement the Blob Storage adapter described in `docs/DEPLOYMENT.md`, section **File storage on Azure**.

### Email

Use this locally:

```dotenv
EMAIL_PROVIDER=log
```

Messages will be logged rather than sent. For production, configure Resend or implement Huntington's selected provider. Keep `EMAIL_REDIRECT_TO` set in every non-production environment.

## 11. Important folders

```text
src/routes/                  Page and server routes
src/components/              Shared application components
src/components/ui/           shadcn/Radix primitives
src/lib/*.functions.ts       Browser-callable server functions
src/lib/*.server.ts          Server-only implementations
src/lib/*.shared.ts          Shared types, validation, and pure logic
src/server/                  Runtime, authentication, database, storage
src/integrations/supabase/   Typed PostgREST clients and generated DB types
supabase/migrations/         Database schema source of truth
supabase/tests/              Database security and registration tests
tests/                       Unit tests
jobs/pelotonia-sync/         Background Pelotonia synchronization
.vscode/                     Editor settings and debugger profiles
docs/                        Architecture and operating documentation
```

Do not manually edit `src/routeTree.gen.ts`; TanStack Router generates it.

## 12. Common development commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server with hot reload |
| `npm run typecheck` | TypeScript validation |
| `npm run lint` | ESLint, Prettier, and control-name accessibility check |
| `npm run format` | Format the entire repository |
| `npm test` | Unit tests |
| `npm run test:db` | Rebuild the throwaway test database and run SQL security tests |
| `npm run build` | Cloudflare Workers production build |
| `npm run build:node` | Node/Azure production build |
| `npm run check` | Typecheck, lint, tests, and Cloudflare build |

For schema changes:

1. Add a new timestamped SQL migration; never edit an already-applied migration.
2. Rebuild the local database and run `npm run test:db`.
3. Regenerate types:

   ```sh
   node scripts/gen-db-types.mjs
   npx prettier --write src/integrations/supabase/types.ts
   ```

## 13. Current limitations to understand before production use

- Fundraiser checkout uses a **demo payment provider**; no real money moves.
- Some Super User editable content and feature flags still use browser `localStorage` rather than the database.
- Node/Azure file storage requires the documented Azure Blob adapter.
- Microsoft Entra ID requires the documented authentication-provider replacement.
- The production email provider must be selected and configured.
- The nightly Pelotonia integration depends on public, undocumented upstream endpoints and must fail softly.
- Production data and uploads are separate from this source export.

## 14. Deployment choices

### Cloudflare preview model

```sh
npm ci
npm run build
npx wrangler deploy
```

This requires Cloudflare account bindings and secrets that are intentionally absent from the export. `wrangler.jsonc` documents the expected bindings.

### Node/Azure model

```sh
npm ci
npm run build:node
PORT=8080 HOST=0.0.0.0 node .output/server/index.mjs
```

The Node build is the recommended base for Azure App Service or Azure Container Apps. Follow `docs/DEPLOYMENT.md` for PostgreSQL, PostgREST, nginx, Key Vault, Entra ID, Blob Storage, email, and the nightly sync job.

## 15. Verification checklist for a successful recreation

- [ ] Project opens at the folder containing `package.json`.
- [ ] VS Code recommends the extensions from `.vscode/extensions.json`.
- [ ] `node --version` is 22.18 or newer.
- [ ] `npm ci` completes without modifying `package-lock.json`.
- [ ] `npm run typecheck` passes.
- [ ] `npm run lint` passes with LF line endings.
- [ ] `npm test` passes.
- [ ] `npm run build` or `npm run build:node` passes.
- [ ] `.env.local` exists locally but is not committed.
- [ ] `HUB_DB_JWT_SECRET` exactly matches PostgREST's `PGRST_JWT_SECRET`.
- [ ] `HUB_DB_URL` points to the `/rest/v1` gateway, not directly to PostgREST.
- [ ] The OIDC client includes `<PUBLIC_ORIGIN>/auth/callback` as a redirect URI.
- [ ] Non-production email is redirected or logged.
- [ ] Production secrets live in a secret manager, not in source control.

## 16. Documentation map

Read these bundled files for deeper detail:

1. `README.md` — feature list and quick start
2. `docs/ARCHITECTURE.md` — request flow, authentication, RLS, storage, email, sync, and approvals
3. `docs/CONFIGURATION.md` — every setting and secret
4. `docs/VISUAL-STUDIO.md` — editor and debugger setup
5. `docs/DEPLOYMENT.md` — Cloudflare preview and recommended Azure deployment
6. `docs/ENTRA.md` — Microsoft Entra ID migration
7. `docs/DATA-EXPORT.md` — production data and file migration
8. `docs/IT-ALLOWLIST.md` — corporate network allowlist requirements

## 17. Support boundary

The code archive is sufficient to recreate the application source, install dependencies, run the unit suite, build deployment artifacts, and stand up a fresh database from migrations. It does not grant access to the existing hosted environment or recreate production data, identity-provider registrations, email accounts, DNS, Cloudflare resources, Azure resources, or secret values.
