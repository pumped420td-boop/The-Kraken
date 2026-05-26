import { Router } from "express";
import { store } from "../lib/store.js";

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

// Returns pre-computed votes from background cache — responds instantly, no event-loop block
router.get("/strategies/votes", (_req, res) => {
  const cached = store.votesCache;

  res.json({
    results: cached.map((r) => ({
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
    timestamp: store.votesCachedAt ?? new Date().toISOString(),
  });
});

export default router;
