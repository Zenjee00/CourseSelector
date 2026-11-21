# Running and releasing CourseNFound

## Local development

Use Node 22 or 24. Run `npm ci`, copy `.env.example` to `.env`, then run `npm run dev` and `npm run start:server` in separate terminals. `npm run check` runs lint, UI unit tests, proxy integration tests, and the production build. `npm run test:firebase` runs Firebase rules and integration tests against the demo emulators; Java 21 and an initial emulator download are required.

The checked-in Firebase web configuration identifies the existing project and is public client configuration. Server secrets belong only in server environment variables. Firestore owner and email-verification rules remain the data access boundary. Never put privileged Firebase service-account credentials in the frontend.

## Staging and production

Use separate Firebase projects and server secrets for staging and production. Override the Firebase client configuration through the documented `VITE_FIREBASE_*` values. Restrict Firebase authorized domains and API key usage in the provider console. Configure production reCAPTCHA allowed domains and the proxy's exact frontend origins.

The Vercel configuration serves frontend files and SPA routes. It does not deploy the Express server. Deploy `server/index.js` to a Node host and route `/api` to that host, or set `VITE_GEO_PROXY_URL` to its HTTPS origin before building. `/api` is deliberately excluded from the SPA fallback. Set origin allowlists on the API deployment, then verify both location lookups and verification against staging.

The GitHub workflow builds and tests every PR and main-branch push, uploads an immutable frontend artifact labeled with the commit SHA, and checks production dependency advisories. A separate job verifies Firebase security rules with emulators. Dependabot proposes dependency and Actions updates. No production credentials or automatic production deployment have been configured by this change.

Release frontend and API from the same reviewed commit. Use the hosting provider's preview deployment for staging. Keep production promotion behind a protected environment or provider approval. Deploy Firestore rules only after the rules job passes and staging verifies existing records and account ownership. The repository currently has no automated production-promotion job.

## Monitoring

Configure an external uptime monitor for the API's `/healthz` and `/readyz`, and a static frontend route check. Configure alerts for sustained 5xx errors, latency, failed verification, and provider quota exhaustion. Review structured request IDs in host logs. Readiness verifies configuration presence only. It does not guarantee provider availability.

Use Firebase console metrics for authentication and database behavior. If adding client crash reporting, explicitly decide consent, retention, and redaction first; the current error boundary provides a recovery UI and a generic console event only. No external telemetry or uptime monitor is provisioned.

## Rollback

1. Retain the last successful frontend artifact, API release, environment configuration version, and Firestore rules revision.
2. Promote the previous frontend deployment in Vercel (or restore the previous artifact in your host).
3. Restore the API release from the same previous commit and verify `/healthz` and `/readyz`.
4. If rules changed in that release, restore the prior rules revision after checking compatibility; never replace rules with an allow-all fallback.
5. Smoke-test guest library search, a verified staging sign-in, assessment saving, and cross-account denial. Review error and latency metrics before closing the incident.

## Known limits

Account deletion checks recent authentication before deleting data, but deleting Firestore data and Firebase Auth across separate services is not atomic. For stronger guarantees, implement a privileged deletion job with retries and a completion record. Do not promise transaction-level rollback for the current client deletion flow.

Favorites are stored per account in this browser; they are not synchronized across devices. Existing unscoped legacy favorites are intentionally not assigned to an account on a shared device. Road distances are approximate, cached briefly by the API, and held only in memory by the results page. Tuition and salary figures are catalog estimates and should be confirmed with schools or employers.

The final audit reports no production advisories and no high or critical advisories across the full dependency tree. Thirteen moderate advisories remain in the development-only Firebase CLI dependency chain. The automated suggested fix would downgrade Firebase tooling across a major version, so it was not applied. Track upstream CLI updates through Dependabot and rerun emulator tests before accepting a tooling change.

The supplied reCAPTCHA site key does not authorize the localhost preview origin. Authentication UI and emulator integration are tested, but live provider sign-in requires a site key configured for the deployment domain. No live account was created or modified during visual testing.
