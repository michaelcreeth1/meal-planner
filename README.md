# Family Meal Planner

A private family meal-planning PWA for turning adult dinners into kid-specific, low-pressure plates.

## Local Development

```sh
npm install
npm run dev
```

The app serves the frontend and backend together at `http://localhost:8787`.

## AI Backend

Meal generation goes through the backend only. The browser posts family constraints to `/api/generate-meals`; the server calls OpenAI with Structured Outputs, converts the response into the app's meal domain, validates child safety rules, and returns meal JSON to the PWA.

By default the app uses the mock generator so it works without a key:

```sh
AI_PROVIDER=mock
```

To use OpenAI on the backend:

```sh
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-5.5
OPENAI_REASONING_EFFORT=low
```

`OPENAI_API_KEY` belongs in `.env`, which is gitignored. For this private LAN/Tailscale deployment, the key stays on the Docker host and is never exposed to the PWA.

## Docker

```sh
cp .env.example .env
# edit .env and set AI_PROVIDER=openai plus OPENAI_API_KEY when ready
docker compose up -d --build
```

The compose service exposes the app on port `8787` and stores SQLite data in `./data`.
