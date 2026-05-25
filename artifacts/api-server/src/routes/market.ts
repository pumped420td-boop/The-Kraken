import { Router } from "express";
import { store } from "../lib/store.js";
import { COINS } from "../lib/coins.js";
import { updateTickerCache } from "../lib/kraken.js";

const router = Router();

router.get("/market/ticker", async (req, res) => {
  // Refresh if cache is stale (>15s)
  const now = Date.now();
  const stale = COINS.some((c) => {
    const cached = store.marketCache[c.symbol];
    return !cached || now - cached.lastUpdated > 15_000;
  });

  if (stale) {
    try {
      await updateTickerCache(COINS.map((c) => c.krakenPair));
    } catch {
      // Return cached if refresh fails
    }
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

  res.json({
    tickers,
    lastUpdated: new Date().toISOString(),
  });
});

export default router;
