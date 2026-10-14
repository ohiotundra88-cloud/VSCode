# Export manifest

- Product: Team Huntington Hub / Ride With Huntington
- Exported: 2026-10-14
- Base branch: chris-updates
- Base commit: fbfe8469b000006e998a3028640a2154fe2403a4
- Source state: base commit plus the working-tree files listed below
- Secrets included: no
- Production data included: no
- Dependencies/build output included: no

## Working-tree files overlaid on the base commit

- `docs/VS-CODE-RECREATION-GUIDE.md`
- `src/components/ApprovalTracker.tsx`
- `src/lib/fundraiser-requests.shared.ts`
- `src/lib/fundraising-pages.server.ts`
- `src/routes/my-fundraisers.$id.tsx`
- `tests/fundraiser-approval-presentation.test.ts`

## Recreate in VS Code

Start with `docs/VS-CODE-RECREATION-GUIDE.md`, then read `README.md` and the remaining files under `docs/`.

## Integrity and scope

This export intentionally excludes `.git`, `node_modules`, `.output`, caches, logs, `.env.local`, production secrets, production database contents, and uploaded production files.
