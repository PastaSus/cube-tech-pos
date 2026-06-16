---
title: 'cube-tech-pos'
type: 'feature'
created: '2026-06-16'
status: 'draft'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Build a complete web-based Point of Sale system with inventory management for a job application submission. The system must demonstrate full-stack capabilities with React frontend, Node.js/Express backend, and MySQL database.

**Approach:** Implement a 4-feature POS system: (1) Product CRUD for inventory, (2) Sales interface with cart management, (3) Transaction processing with inventory deduction, (4) Dashboard with aggregated stats. Use TiDB Cloud for MySQL hosting.

## Boundaries & Constraints

**Always:**
- Use React + Tailwind CSS for frontend
- Use Node.js + Express for backend REST API
- Use MySQL (TiDB Cloud — not local) for database
- Store TiDB credentials in .env (gitignored)
- Mobile-responsive UI
- Unique receipt numbers per transaction
- Automatic inventory deduction on sale completion

**Ask First:**
- Authentication/authorization (not in requirements — confirm if needed)
- Payment gateway integration (cash-only assumed)
- Deployment strategy (local + GitHub submission)

**Never:**
- Skip inventory deduction on sales
- Allow negative stock quantities
- Store passwords in plaintext (if auth added)

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Add product | Valid product data | Product created with timestamps | Reject invalid data, show validation errors |
| Edit product | Existing product ID + changes | Product updated, `updated_at` refreshed | 404 if product not found |
| Delete product | Existing product ID | Product removed | 404 if not found; prevent if linked to sales |
| Add to cart | Product in stock | Cart item added with qty=1 | Reject if out of stock |
| Update cart qty | Valid quantity > 0 | Cart recalculates total | Reject qty > stock |
| Complete sale | Non-empty cart | Receipt generated, inventory deducted, transaction saved | Rollback on any failure |
| View dashboard | Any | Aggregated stats returned | Handle empty database gracefully |

</frozen-after-approval>

## Code Map

- `src/` -- React frontend (Vite + TypeScript)
- `server/` -- Express backend
- `server/routes/` -- API route handlers
- `server/db/` -- Database connection and queries (TiDB Cloud via env vars)
- `database.sql` -- Schema + seed data for TiDB Cloud
- `.env` -- DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME (gitignored)
- `README.md` -- Installation and setup guide

## Tasks & Acceptance

**Execution:**
- [ ] Install dependencies: Tailwind CSS, React Router, axios, mysql2
- [ ] Configure Tailwind CSS in the project
- [ ] `server/` -- Initialize Express server with CORS, JSON parsing
- [ ] `server/db/connection.js` -- MySQL connection pool using mysql2/promise, connecting to TiDB Cloud (host, port, user, password, database via env vars)
- [ ] `database.sql` -- Create Products, Sales, SalesDetails tables with constraints
- [ ] `server/routes/products.js` -- CRUD endpoints: GET /api/products, POST, PUT /:id, DELETE /:id
- [ ] `server/routes/sales.js` -- POST /api/sales (complete transaction), GET /api/sales (list), GET /api/sales/:id (details)
- [ ] `server/routes/dashboard.js` -- GET /api/dashboard (stats + recent sales)
- [ ] `src/App.tsx` -- React Router setup with 4 routes: /, /products, /pos, /sales
- [ ] `src/components/Layout.tsx` -- Sidebar/nav layout with responsive mobile menu
- [ ] `src/pages/Dashboard.tsx` -- Display total products, inventory, sales count, recent sales table
- [ ] `src/pages/Products.tsx` -- Product table with add/edit/delete modals
- [ ] `src/pages/POS.tsx` -- Product grid, cart sidebar, checkout flow
- [ ] `src/pages/Sales.tsx` -- Sales history table with receipt detail view
- [ ] `src/api/` -- Axios/fetch wrapper for all API calls
- [ ] `README.md` -- Installation guide: prerequisites, setup steps, env vars, database setup, running the app
- [ ] Git setup: init repo, .gitignore (node_modules, .env), initial commit

**Acceptance Criteria:**
- Given a clean database, when user adds a product, then product appears in list with created_at timestamp
- Given products exist, when user views POS, then all products with stock > 0 are displayed
- Given cart has items, when user clicks checkout, then sale is recorded, receipt number generated, inventory decremented
- Given sales exist, when user views dashboard, then totals and recent 5 sales are displayed
- Given mobile viewport, when user navigates, then layout adjusts responsively

## Verification

**Commands:**
- `npm run dev` -- Frontend starts without errors
- `node server/index.js` -- Backend starts on port 5000
- `curl http://localhost:5000/api/products` -- Returns product list (empty or populated)

**Manual checks:**
- Add/edit/delete products via UI
- Complete a sale and verify inventory decreased
- Check dashboard reflects new sale
- Test on mobile viewport (Chrome DevTools)

**TiDB Cloud checks:**
- Verify connection pool connects to TiDB Cloud successfully
- Run `database.sql` against TiDB Cloud and confirm tables created
- Confirm data persists across server restarts
