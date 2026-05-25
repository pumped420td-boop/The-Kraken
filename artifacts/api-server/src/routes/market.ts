import { Router } from "express";
import { store } from "../lib/store.js";
import { COINS } from "../lib/coins.js";
import { updateTickerCache } from "../lib/kraken.js";

const router = Router();

// Single warmup promise — reused by all requests so we never double-fetch on startup
let warmupPromise: Promise<void> | null = null;

function ensureWarmup(): Promise<void> {
  if (!warmupPromise) {
    warmupPromise = updateTickerCache(COINS.map((c) => c.krakenPair))
      .catch(() => {})
      .finally(() => {
        // Allow re-warmup after 30 seconds (handled by stale check below)
        setTimeout(() => { warmupPromise = null; }, 30_000);
      });
  }
  return warmupPromise;
}

// Pre-warm cache immediately when server starts
ensureWarmup();

router.get("/market/ticker", async (_req, res) => {
  const now = Date.now();
  const hasAny = COINS.some((c) => store.marketCache[c.symbol]);

  if (!hasAny) {
    // First request ever — block until we have at least some data
    await ensureWarmup();
  } else {
    // Check staleness — refresh in background without blocking
    const stale = COINS.some((c) => {
      const cached = store.marketCache[c.symbol];
      return !cached || now - cached.lastUpdated > 15_000;
    });
    if (stale) ensureWarmup();
  }

  const tickers = COINS.map((coin) => {
    const cached = store.marketCache[coin.symbol];
    return {
      symbol: coin.symbol,
      krakenPair: coin.krakenPair,
      name: coin.name,
      price: cached?.price ?? 0,
      change24h: cached?.change24h ?? 0,
      volume24h: cached?.volume24h ?? 0,
      high24h: cached?.high24h ?? 0,
      low24h: cached?.low24h ?? 0,
      category: coin.category,
    };
  }).filter((t) => t.price > 0);

  res.json({ tickers, lastUpdated: new Date().toISOString() });
});

export default router;
