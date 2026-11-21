# Location and verification API

Run `npm run start:server` alongside `npm run dev`. Vite forwards `/api` to port 5174. The server uses Node's built-in fetch and never sends server credentials to the browser.

Copy `.env.example` to `.env` and supply LocationIQ and reCAPTCHA credentials. Production requires exact `ALLOWED_ORIGINS`, HTTPS termination, and the appropriate `RECAPTCHA_ALLOWED_HOSTNAMES`. Never prefix server credentials with `VITE_`.

Endpoints: `GET /api/geocode?q=...`, `GET /api/route-distance?fromLat=...&fromLon=...&toLat=...&toLon=...`, and `POST /api/verify-recaptcha` with a JSON `token`. Invalid inputs return 400; oversized bodies 413; throttled calls 429; missing configuration 503; provider failures 502. Responses contain recovery text and a request ID where relevant.

The proxy restricts browser origins, caps JSON at 8 KiB, times out provider requests at eight seconds, limits API requests to 60/minute/IP and verification attempts to 10/minute/IP, coalesces identical provider requests, and bounds each successful-result cache to 500 entries with a ten-minute TTL.

CORS does not authenticate clients. For multiple API instances, replace the default in-memory rate-limit store with a shared store or enforce limits at the gateway. Configure `TRUST_PROXY_HOPS` only for the actual trusted reverse-proxy topology. Do not blindly trust forwarded IP headers.

`GET /healthz` reports process health. `GET /readyz` checks whether the two required server secrets exist; it does not make live provider calls or validate credentials. Logs contain request ID, method, path, status, and duration, without query strings, tokens, passwords, or provider URLs. Send stdout/stderr to your hosting platform's logging system.

Browser-side classic reCAPTCHA is a UI gate. It does not prevent someone from calling Firebase Authentication directly. Enforce abuse controls through Firebase-supported protections and provider configuration; the proxy is not an authentication gateway.

See `OPERATIONS.md` for staging, monitoring, release, and rollback steps.
