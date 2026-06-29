# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # devvit playtest — live dev with hot reload (requires login)
npm run build        # vite build — compile client + server
npm run type-check   # tsc --build — check all TypeScript projects
npm run lint         # eslint 'src/**/*.{ts,tsx}'
npm run deploy       # type-check + lint + devvit upload
npm run launch       # deploy + devvit publish
npm run prettier     # prettier --write .
devvit login         # authenticate with Reddit (one-time)
```

Run `npm run type-check` after any change — the strict TS config catches most runtime bugs early.

## Architecture

This is a **Devvit Web** app (not `@devvit/public-api`). Never use blocks or `Devvit.addCustomPostType`. All server-side Reddit/Redis access goes through `@devvit/web/server`.

### Project layout

```
src/
  types.ts              # All shared TypeScript types
  constants/
    config.ts           # Game constants (thresholds, multipliers, Redis prefix)
    mutations.ts        # 25 MutationDefinition objects + MUTATION_MAP
    events.ts           # 10 EnvironmentalEventDefinition objects + EVENT_MAP
  server/
    redis.ts            # All Redis read/write (uses `redis` from @devvit/web/server)
    gameLogic.ts        # Pure functions — no Redis, no side effects
    scheduler.ts        # runDailyJob() — the daily 00:00 UTC game loop
    routes/
      api.ts            # POST /api/game/* (state, vote, crisis-vote, onboarding, hint)
      menu.ts           # POST /internal/menu/* (moderator actions)
      triggers.ts       # POST /internal/triggers/* (scheduler + on-app-install)
      forms.ts          # Example form (unused by game)
    core/post.ts        # reddit.submitCustomPost helper
    index.ts            # Hono app wiring (app + internal routers)
  client/
    splash.tsx          # Inline post view (keep fast, no heavy deps)
    game.tsx            # Expanded post view — main game UI (React + Phaser)
    hooks/              # React hooks
    components/         # React components
    phaser/             # Phaser scenes
  shared/
    api.ts              # Shared response types
devvit.json             # App config: entrypoints, menu items, scheduler, permissions
tools/
  tsconfig.*.json       # Separate TS projects for types, client, server, shared, vite
```

### TypeScript project references

Four separate TS projects compile independently: `types` (src/types.ts + src/constants/), `server`, `client`, `shared`. The `server` project references `types`; `client` references `types` and `shared`. Run `tsc --build` (not `tsc`) to compile all in dependency order.

### Strict TypeScript rules in effect

`tools/tsconfig.base.json` enables `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`. Key implications:
- `redis.get()` returns `string | undefined`, not `null`
- `Record<K, V>` indexing returns `V | undefined` — always guard with `?? fallback` or `if (val)`
- Optional fields must be **omitted**, not set to `undefined` (`exactOptionalPropertyTypes`)
- `let` variables narrowed before closures must be captured as `const` to avoid TS18047

### Server layer

`import { redis, reddit, context } from '@devvit/web/server'` — these are request-scoped singletons.

- `context.subredditId` — `T5` branded string (`t5_...`), use as Redis namespace
- `context.userId` — `T2 | undefined`, `context.username` — `string | undefined`
- `redis.get/set/del` — direct Devvit Redis (see `@devvit/redis/types/redis.d.ts` for full API)
- `reddit.submitCustomPost({ title, subredditName?, entry? })` — creates a custom post
- `reddit.setUserFlair({ subredditName, username, text })` — sets user flair

All Redis keys follow: `creature:{subredditId}:{resource}` (see `src/server/redis.ts` key builders).

### Game flow

**Daily job** (`runDailyJob` in scheduler.ts, triggered at 00:00 UTC):
1. Resolve active crisis (chain day check, or expired crisis resolution)
2. Resolve previous day's vote → apply winning mutation
3. Check for new environmental event → Tier 1 applied directly, Tier 2/3 opens a crisis
4. Check generation complete (day ≥ 30) → record Hall of Fame, start new generation
5. Create new Reddit post + DailyVote entry for today's 3 mutation options

**Crisis types**: `time_pressure` (flee/fight vote, 8h window), `participation` (threshold within 24h), `faction` (flee vs fight factions with separate thresholds), `chain` (must pass % threshold on N consecutive days).

**Stage system**: Stages 1–4 are **day-based** — STAGE_THRESHOLDS maps stage → minimum day (0/10/20/30), not stat totals.

### Adding a new menu action

1. Add a route handler in `src/server/routes/menu.ts`
2. Add the menu item to `devvit.json` under `menu.items` with `"forUserType": "moderator"` and the correct `"endpoint"`

### Adding a new API endpoint

1. Add the route in `src/server/routes/api.ts`
2. No devvit.json change needed — API routes are not declared there

### Client ↔ Server communication

Client calls `POST /api/game/*` via fetch. Types for requests/responses are in `src/types.ts` (`ClientMessage`, `ServerMessage`, `GameStatePayload`). There is no WebSocket or tRPC — plain JSON over HTTP.

### Devvit-specific constraints

- Use `navigateTo` from `@devvit/web/client` instead of `window.location`
- Use `showToast`/`showForm` from `@devvit/web/client` instead of `window.alert`
- No geolocation, camera, microphone, or notifications APIs
- No inline `<script>` tags in HTML files — use separate `.ts` files
- The `splash.html` entrypoint is shown in the Reddit feed inline — keep it lightweight
- `game.html` is the expanded post view — Phaser and heavy deps belong here
