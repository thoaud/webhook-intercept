# Webhook Capture

A Cloudflare Worker that publicly captures inbound webhooks, indexes metadata in D1, stores raw bodies in R2, and serves a secret-gated inspector UI plus JSON API.

Capture URLs are unauthenticated — third-party webhooks cannot log in. Inspection (`/`, `/captures/:id`, `/api/*`) requires `INSPECT_TOKEN`.

## Local development

```bash
cp .dev.vars.example .dev.vars
# set INSPECT_TOKEN to a long random value

npm install
npx wrangler types
npx wrangler d1 migrations apply webhook-intercept --local
npx wrangler dev
```

Open `http://localhost:8787`, sign in with the inspect token, then:

```bash
curl -X POST http://localhost:8787/stripe/webhook \
  -H 'Content-Type: application/json' \
  -d '{"ok":true}'
```

The inspector polls every 2 seconds. `GET /login` and `/api/*` are reserved; every other method and path is captured.

## Tests

```bash
npm test
```

## Deploy

1. `npx wrangler login`
2. Apply migrations and set the inspect secret:

   ```bash
   npx wrangler d1 migrations apply webhook-intercept --remote
   npx wrangler secret put INSPECT_TOKEN
   ```

3. `npx wrangler deploy`

A daily cron at 03:00 UTC deletes captures older than 30 days (D1 rows and R2 objects).

## API

All of these require `Authorization: Bearer <INSPECT_TOKEN>` or the HttpOnly session cookie from `POST /login`.

| Method | Path | Notes |
|--------|------|--------|
| GET | `/api/captures` | Query: `limit`, `cursor`, `method`, `path` (prefix) |
| GET | `/api/captures/:id` | Metadata, headers, preview, parsed JSON |
| GET | `/api/captures/:id/body` | Original bytes from R2 |
| DELETE | `/api/captures/:id` | One capture |
| DELETE | `/api/captures` | Clear all |

Do not log or paste captured bodies — they often contain secrets.
