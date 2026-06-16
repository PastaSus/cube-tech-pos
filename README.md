# Cube POS

A web-based Point of Sale system with inventory management. Built with React, Node.js/Express, and MySQL (TiDB Cloud).

## Prerequisites

- Node.js 18+
- pnpm
- TiDB Cloud (or MySQL) database

## Setup

1. Clone the repo and install dependencies:

```bash
pnpm install
```

2. Create `.env` in the project root:

```
DB_HOST=your-tidb-host
DB_PORT=4000
DB_USER=your-user
DB_PASSWORD=your-password
DB_NAME=cube_pos
DB_SSL=true
PORT=5000
```

3. Run the database schema against your TiDB Cloud instance:

```bash
mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASSWORD < database.sql
```

## Running

Start the backend (port 5000):

```bash
node server/index.js
```

Start the frontend (port 5173):

```bash
pnpm run dev
```

Open http://localhost:5173

## Features

- **Dashboard** — Total products, inventory count, sales stats, recent sales
- **Products** — CRUD with add/edit/delete modals and stock indicators
- **POS** — Product grid, cart sidebar with quantity controls, checkout with inventory deduction
- **Sales History** — Transaction log with receipt detail view

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/products | List all products |
| POST | /api/products | Create a product |
| PUT | /api/products/:id | Update a product |
| DELETE | /api/products/:id | Delete a product |
| POST | /api/sales | Complete a sale |
| GET | /api/sales | List all sales |
| GET | /api/sales/:id | Get sale details |
| GET | /api/dashboard | Get aggregate stats |

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS 4, React Router, Axios
- **Backend:** Node.js, Express 5, mysql2
- **Database:** MySQL (TiDB Cloud)
