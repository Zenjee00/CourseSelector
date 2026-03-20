LocationIQ proxy and local setup
================================

This project includes a minimal backend proxy to safely call LocationIQ (so your API key is kept off the client bundle).

How to use (local development):

1. Copy `.env.example` to `.env` in the project root and add your key:

   LOCATIONIQ_KEY=pk.your_real_token_here

2. Install runtime deps for the proxy (run in project root):

   npm install express node-fetch cors dotenv

3. Start the proxy:

   node server/index.js

   The proxy will run by default on `http://localhost:5174` and exposes `/api/geocode?q=SEARCH`.

4. In the frontend, call `/api/geocode?q=University+of+the+Philippines+Los+Banos` to get coords.

Security notes:
- Never commit `.env` containing `LOCATIONIQ_KEY` to the repo. Keep it local or use a secrets store in production.
- For production, host the proxy on a secure server and protect it with proper rate limits and auth where needed.
