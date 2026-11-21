# CourseNFound

CourseNFound helps students explore their interests, compare degree programs, and find nearby universities. The React/Vite app and Node API live in `Course_Selector/`.

The interest assessment has 30 questions across nine fields, with tie-breaker questions when needed. Students can browse the career library, compare programs, inspect school and tuition information, and save assessment history after verifying their account. Favorites are stored per account in the current browser. Salary and tuition figures are estimates.

Swipe Match and Day in a Life are planned modes and are labeled coming soon.

## Development

Use Node 22 or 24. From `Course_Selector/`:

```sh
npm ci
cp .env.example .env
npm run dev
```

Supply server credentials in `.env`, then run `npm run start:server` in a second terminal. Vite forwards `/api` to the local API. To verify changes, run `npm run check`; for Firebase emulator tests, run `npm run test:firebase` with Java 21 installed.

See [API setup](Course_Selector/README_PROXY.md) and [operations](Course_Selector/OPERATIONS.md) for staging, production configuration, health checks, logging, deployment boundaries, and rollback.

GitHub Actions runs lint, UI tests, API tests, production builds, production dependency audits, and Firebase rules checks. Production hosting, uptime alerts, and deployment promotion must be configured separately.
