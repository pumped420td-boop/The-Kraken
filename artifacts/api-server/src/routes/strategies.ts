import { Router } from "express";
import { store } from "../lib/store.js";
import { COINS } from "../lib/coins.js";
import { analyzeCoins } from "../lib/voting.js";

const router = Router();

router.get("/strategies", (_req, res) => {
  const strategies = store.strategyStats.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    weight: s.weight,
    winRate: s.totalSignals > 0 ? (s.successfulSignals / s.totalSignals) * 100 : 0,
    totalSignals: s.totalSignals,
    successfulSignals: s.successfulSignals,
    profitContribution: s.profitContribution,
    currentSignal: s.currentSignal,
  }));

  res.json({
    strategies,
    learningCycles: store.learningCycles,
    lastUpdated: store.lastScanAt ?? new Date().toISOString(),
  });
});

router.get("/strategies/votes", async (_req, res) => {
  try {
    const coins = COINS.filter((c) => store.marketCache[c.symbol]);
    const results = await analyzeCoins(coins.slice(0, 20)); // limit to 20 for performance

    res.json({
      results: results.map((r) => ({
        symbol: r.symbol,
        name: r.name,
        price: r.price,
        totalWeightedVotes: r.totalWeightedVotes,
        buyScore: r.buyScore,
        sellScore: r.sellScore,
        holdScore: r.holdScore,
        decision: r.decision,
        confidence: r.confidence,
        votes: r.votes,
      })),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to compute votes" });
  }
});

export default router;
