import { fetchOHLC } from "./kraken.js";
import { store } from "./store.js";
import { rsiStrategy } from "./strategies/rsi.js";
import { macdStrategy } from "./strategies/macd.js";
import { bollingerStrategy } from "./strategies/bollinger.js";
import { emaStrategy } from "./strategies/ema.js";
import { vwapStrategy } from "./strategies/vwap.js";
import { momentumStrategy } from "./strategies/momentum.js";
import { mlStrategy } from "./strategies/ml.js";
import type { StrategySignal } from "./strategies/base.js";
import type { Coin } from "./coins.js";

const ALL_STRATEGIES = [
  rsiStrategy,
  macdStrategy,
  bollingerStrategy,
  emaStrategy,
  vwapStrategy,
  momentumStrategy,
  mlStrategy,
];

export interface VoteResult {
  symbol: string;
  name: string;
  price: number;
  buyScore: number;
  sellScore: number;
  holdScore: number;
  totalWeightedVotes: number;
  decision: "buy" | "sell" | "hold";
  confidence: number;
  votes: (StrategySignal & { weight: number })[];
}

export async function analyzeCoins(coins: Coin[]): Promise<VoteResult[]> {
  const results: VoteResult[] = [];

  for (const coin of coins) {
    const cached = store.marketCache[coin.symbol];
    if (!cached) continue;

    const price = cached.price;
    const candles = await fetchOHLC(coin.krakenPair);
    if (candles.length < 10) continue;

    const votes: (StrategySignal & { weight: number })[] = [];
    let buyScore = 0;
    let sellScore = 0;
    let holdScore = 0;
    let totalWeight = 0;

    for (const strategy of ALL_STRATEGIES) {
      const stat = store.strategyStats.find((s) => s.id === strategy.id);
      const weight = stat?.weight ?? 1.0;

      let signal: StrategySignal;
      try {
        signal = strategy.analyze({ symbol: coin.symbol, candles, currentPrice: price });
      } catch {
        signal = { strategyId: strategy.id, strategyName: strategy.name, vote: "hold", confidence: 0.1 };
      }

      const weightedConfidence = signal.confidence * weight;
      if (signal.vote === "buy") buyScore += weightedConfidence;
      else if (signal.vote === "sell") sellScore += weightedConfidence;
      else holdScore += weightedConfidence;

      totalWeight += weight;
      votes.push({ ...signal, weight });

      // Update current signal in store
      if (stat) stat.currentSignal = signal.vote;
    }

    const maxScore = Math.max(buyScore, sellScore, holdScore);
    const decision = maxScore === buyScore ? "buy" : maxScore === sellScore ? "sell" : "hold";
    const confidence = totalWeight > 0 ? maxScore / totalWeight : 0;

    results.push({
      symbol: coin.symbol,
      name: coin.name,
      price,
      buyScore,
      sellScore,
      holdScore,
      totalWeightedVotes: totalWeight,
      decision,
      confidence,
      votes,
    });
  }

  return results;
}

export function countBuyVotes(votes: StrategySignal[]): number {
  return votes.filter((v) => v.vote === "buy").length;
}
