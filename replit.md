# Kraken Trading Bot

An automated crypto trading mobile app that connects to Kraken via API keys and executes trades using a 7-strategy weighted voting engine with continuous learning.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- Required env: none (paper mode works out of the box; live mode needs Kraken API keys entered in app)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 (artifacts/api-server)
- Mobile: Expo / React Native (artifacts/mobile)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — API contract source of truth
- `lib/api-client-react/src/generated/` — generated React Query hooks + Zod schemas
- `artifacts/api-server/src/lib/strategies/` — 7 trading strategy implementations
- `artifacts/api-server/src/lib/voting.ts` — weighted voting engine
- `artifacts/api-server/src/lib/trader.ts` — trade execution engine + main loop
- `artifacts/api-server/src/lib/store.ts` — in-memory state (trades, settings, cache)
- `artifacts/api-server/src/lib/kraken.ts` — Kraken REST API client (public + private)
- `artifacts/api-server/src/lib/coins.ts` — 40 coins (top 20 crypto + top 20 meme)
- `artifacts/mobile/app/(tabs)/` — 5 screens: Dashboard, Trades, Signals, Market, Settings
- `artifacts/mobile/contexts/BotContext.tsx` — global bot start/stop state

## Architecture decisions

- **In-memory store**: All state (trades, settings, market cache, strategy weights) lives in memory. No database — simple and fast for a bot. Data resets on server restart.
- **Voting system**: All 7 strategies compute simultaneously. Each vote is weighted by strategy's learned weight (0.2–2.5x). Trade opens when ≥N buy votes (configurable, default 4/7).
- **Learning algorithm**: After each closed trade, the strategies that voted for it get their weights adjusted based on win/loss outcome and profit percentage. ML Pattern strategy additionally tracks candle patterns.
- **Trailing stop**: Once profit target is hit (default 5%), bot trails with a configurable stop (default 2% from peak). This lets winners run past the 5% floor.
- **Paper vs Live**: Paper mode simulates trades against a $10K virtual balance using real Kraken prices. Live mode calls Kraken private API to place real market orders.

## Product

- **Dashboard**: Portfolio overview, bot on/off toggle, active trade cards with trailing stop status
- **Trades**: Full trade history with open/closed filter and P&L display
- **Signals**: Two views — Strategy weights/learning stats AND live voting breakdown per coin
- **Market**: Real-time prices for all 40 coins with crypto/meme filter and search
- **Settings**: API key management, paper/live mode toggle, allocation %, profit target, trailing stop, vote threshold

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- API keys are stored in memory only (in `store.ts`). They are cleared on server restart.
- Live mode requires API keys with `Trade` permission on Kraken.
- Kraken public API rate limit: avoid calling ticker for all 40 pairs in a single request — batched in chunks of 10 in `kraken.ts`.
- After any `lib/api-spec/openapi.yaml` change, always run codegen before using updated types.
- The server auto-restarts trade scanning every 30s when bot is running.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
