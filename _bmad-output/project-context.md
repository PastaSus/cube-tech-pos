---
project_name: 'cube-tech-pos'
user_name: 'Administrator'
date: '2026-06-18'
sections_completed:
  - 'technology_stack'
  - 'language_rules'
  - 'framework_rules'
  - 'testing_rules'
  - 'quality_rules'
  - 'workflow_rules'
  - 'anti_patterns'
status: 'complete'
rule_count: 28
optimized_for_llm: true
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

| Layer | Technology | Version |
|---|---|---|
| Frontend | React | 19.2.6 |
| Frontend | TypeScript | ~6.0.2 |
| Build | Vite | 8.0.12 |
| Styling | Tailwind CSS | 4.3.1 |
| Routing | React Router | 7.17.0 |
| HTTP Client | Axios | 1.18.0 |
| Backend | Express | 5.2.1 |
| DB Driver | mysql2 | 3.22.5 |
| Testing | Vitest | 4.1.9 |
| Testing | Supertest | 7.2.2 |
| Linting | ESLint | 10.3.0 |
| Package Manager | pnpm | latest |

## Critical Implementation Rules

### Language-Specific Rules

- **ESM only** — all files use ES modules (`import`/`export`). No `require()`. Package `"type": "module"` is set. Backend `.js` files use `import` with `dotenv` for env vars.
- **TypeScript strict mode** — `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch` are enforced. `verbatimModuleSyntax` is on (use `import type` for type-only imports).
- **No `any`** — `typescript-eslint` recommended config is active; avoid `any` types. Prefer `interface` over `type` for object shapes.
- **React JSX transform** — use `react-jsx` transform; do NOT import React just for JSX.
- **Server-side is plain JS** — backend in `server/` uses CommonJS-style but with ESM imports (`.js` extension). No TypeScript compilation for server code.

### Framework-Specific Rules

- **Express 5** — routes use `Router()` from `express`. Error handler is a 4-arg middleware. `app.use(express.json())` is already configured. CORS is configured dynamically.
- **API prefix `/api`** — all backend routes are mounted under `/api/*` on the server. In dev, Vite proxies `/api` to port 5000.
- **MySQL queries go through `mysql2/promise`** — always use the pool from `server/db/connection.js`. Use `pool.query()` with parameterized queries (never string interpolation).
- **Transactions for multi-step writes** — sales endpoint wraps `INSERT sale`, `INSERT sale_items`, `UPDATE stock` in a transaction with `pool.getConnection()` and explicit `BEGIN`/`COMMIT`/`ROLLBACK`.
- **Receipt number format** — `RCP-YYMMDD-######` (6 random digits). Generated server-side with `crypto.randomInt`.
- **React Router v7** — use `<Routes>`, `<Route>`, `<NavLink>` with `end` prop for root path matching. Layout wraps children via `<Layout>{children}</Layout>`.
- **Axios instance** — use the pre-configured `api` instance from `src/api/index.ts` with base URL `/api`. All API functions return `r.data` (axios unwrap pattern).
- **Tailwind CSS v4** — utility classes only. No custom CSS files (except `index.css` for Tailwind directives). `@tailwindcss/vite` plugin handles PostCSS setup.
- **No CSS-in-JS, no CSS modules** — all styling via Tailwind utility classes.

### Testing Rules

- **Vitest globals** — `globals: true` in config. Use `describe`, `it`, `expect` without imports.
- **Supertest for API tests** — import `app` from `server/index.js` (Express app exported as default). Do not start a server — supertest binds to the Express instance directly.
- **Setup file** — `tests/setup.js` auto-runs before tests. It connects to TiDB Cloud and applies `database.sql`. Tests assume a live database.
- **Integration test style** — tests hit real API endpoints through supertest. No mocking of database layer.
- **Test file location** — all tests go in `tests/` directory at project root.

### Code Quality & Style Rules

- **ESLint config** — `eslint.config.js` uses flat config with `typescript-eslint`, `react-hooks`, and `react-refresh` presets. `dist/` and `.agents/` are globally ignored. Run `pnpm run lint` before committing.
- **TypeScript project references** — `tsconfig.json` references `tsconfig.app.json` (for `src/`) and `tsconfig.node.json` (for `vite.config.ts`). Build with `tsc -b && vite build`.
- **Vite plugins** — React, Babel (with React Compiler preset), Tailwind CSS. Do not remove or reorder.
- **File naming** — React components: PascalCase (`Products.tsx`, `Layout.tsx`). API files: kebab-case (`index.ts`). Page components go in `src/pages/`.

### Development Workflow Rules

- **pnpm only** — do not use npm or yarn. Install with `pnpm install`.
- **Environment variables** — stored in `.env` at project root. Required: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SSL`. Optional: `PORT` (default 5000), `FRONTEND_ORIGIN` (default `http://localhost:5173`).
- **Database is TiDB Cloud** — not local MySQL. SSL must be `true` in env for TiDB. Schema lives in `database.sql` (products, sales, sale_items tables + seed data).
- **Backend entry** — `node server/index.js` starts on port 5000. `NODE_ENV=test` skips the listener for supertest.
- **Frontend dev server** — `pnpm run dev` starts Vite on port 5173 with proxy to port 5000.
- **Build** — `pnpm run build` runs `tsc -b` then `vite build`. Output goes to `dist/`.

### Critical Don't-Miss Rules

- **Never skip inventory deduction** — `POST /api/sales` must decrement `products.stock` atomically in the same transaction.
- **Never allow negative stock** — `CHECK (stock >= 0)` at DB level; API validation rejects negative stock on create/update.
- **Never store passwords in plaintext** — if adding auth, use bcrypt/argon2.
- **Product name uniqueness** — DB has `UNIQUE` constraint on `products.name`; API must handle duplicate key errors gracefully.
- **ID validation** — all `/:id` routes validate `Number(req.params.id)` is a positive integer. Return 400 for invalid, 404 for not found.
- **Don't modify `.gitignore` patterns** — `_bmad/`, `.opencode/`, `.github/`, `.agents/`, `design-artifacts/`, `.env` are intentionally gitignored.
- **Vite proxy configuration is not in a file** — the proxy `/api -> localhost:5000` is handled by Vite's built-in proxy via the `server.proxy` config. If adding a new backend route, ensure it's under `/api`.

---

## Usage Guidelines

**For AI Agents:**

- Read this file before implementing any code
- Follow ALL rules exactly as documented
- When in doubt, prefer the more restrictive option
- Update this file if new patterns emerge

**For Humans:**

- Keep this file lean and focused on agent needs
- Update when technology stack changes
- Review quarterly for outdated rules
- Remove rules that become obvious over time

Last Updated: 2026-06-18
