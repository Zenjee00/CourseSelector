Key Features of Academira (CourseSelector)

- Secure Authentication & Onboarding:   Engineered a secure web platform featuring multi-provider authentication (Google OAuth via Firebase & Email/Password), protected routes, mandatory email verification, theme persistence, and responsive UI components (toasts, skeletons, modals).
- Automated Career Assessment Engine:   Developed an automated 30-question career assessment scoring across 9 domains with custom tie-breaker logic to eliminate duplicate course recommendations, ensuring accurate program matches and history logs.
- Proximity & University Location Engine:   Integrated LocationIQ APIs and browser location detection to geocode educational institutions, sort nearby schools, and calculate real-time driving distances alongside estimated travel times.



Automated Testing & Quality Assurance

Implemented a robust, dual-layered testing pipeline using   Vitest   and   Playwright   to maintain high code quality and prevent regressions in production:

- Unit & Integration Testing (Vitest):   Achieved 100% test suite reliability across 34 test cases covering critical modules such as assessment scoring logic, offline state resilience, React navigation flows, and UI component state transitions.
- End-to-End (E2E) Automation (Playwright):   Automated E2E test scenarios validating real-world user flows—including Firebase Google OAuth authentication, mobile layout viewport responsiveness, registration route protection, and network reconnection handling.
