# RedPath Sentinel

A defensive cybersecurity visualization tool that combines Nmap scan analysis, identity risk mapping, and attack path simulation to help understand how exposed services and IAM misconfigurations create security risk in a homelab or enterprise-style environment.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/redpath-sentinel run dev` — run the frontend (port 18299)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + React Flow (@xyflow/react)
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- XML parsing: fast-xml-parser

## Where things live

- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `lib/db/src/schema/` — DB schema (scans, hosts, identities, attackPaths)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/api-server/src/lib/weaknessRules.ts` — Port/service weakness rules + difficulty scoring
- `artifacts/api-server/src/lib/nmapParser.ts` — Nmap XML parser (fast-xml-parser)
- `artifacts/api-server/src/lib/attackPathEngine.ts` — Identity attack path simulation engine
- `artifacts/redpath-sentinel/src/` — React frontend

## Architecture decisions

- Data storage in PostgreSQL (Drizzle ORM) with JSONB columns for services arrays and identity group memberships
- Weakness rules and difficulty scoring are computed at query time, not stored — keeps the rule engine flexible
- Demo data seeded directly as `is_demo: true` hosts so the app works without an Nmap upload
- Attack paths are stored after simulation so users can review past simulations
- Graph data is assembled server-side from DB query results, with edge inference from user/host relationships

## Product

- **Dashboard**: Live summary cards (hosts, ports, risk services, identity risks, easy/medium/hard targets, attack paths)
- **Graph View**: Interactive React Flow graph of hosts, services, users, groups, weaknesses — click any node for details
- **Hosts**: Filterable list of all scanned hosts with weakness analysis, difficulty scoring, and remediation guidance
- **Identities**: IAM users and groups with privilege levels, MFA status, risk flags, and linked host access
- **Attack Path Simulator**: Select start identity + target host → generates simulated multi-step attack chain with defensive recommendations
- **Report Export**: Full scan summary with JSON/Markdown download

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After any OpenAPI spec change, always re-run: `pnpm --filter @workspace/api-spec run codegen`
- `@xyflow/react` must be installed in the redpath-sentinel artifact (not root) — it's a frontend-specific dep
- DB schema uses JSONB for arrays (services, groups, linkedHosts, riskFlags) — cast carefully in routes
- The weakness rule engine (`weaknessRules.ts`) is shared between the parser, hosts route, and report route

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
