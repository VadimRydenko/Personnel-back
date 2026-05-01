# Personnel-back (Node + Express)

Backend API skeleton tailored for consumption via TanStack Query (`react-query`).

## Setup

```bash
cp .env.example .env
npm i
```

## Run

```bash
npm run dev
```

Healthcheck:

- `GET /health`

Example REST resource (works great with `useQuery` / `useMutation`):

- `GET /api/employees?q=&page=1&pageSize=20`
- `GET /api/employees/:id`
- `POST /api/employees`
- `PUT /api/employees/:id`
- `PATCH /api/employees/:id`
- `DELETE /api/employees/:id` (returns **204**)

## CORS for frontend

Set `FRONTEND_ORIGIN` (default `http://localhost:5173`) to match your frontend dev server.

