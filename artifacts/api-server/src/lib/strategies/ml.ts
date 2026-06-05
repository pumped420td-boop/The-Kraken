import type { Strategy, StrategyInput, StrategySignal } from "./base.js";
import { store } from "../store.js";

function encodePattern(closes: number[], periods = 8): string {
  const pattern: string[] = [];
  for (let i = closes.length - periods; i < closes.length - 1; i++) {
    pattern.push(closes[i + 1] > closes[i] ? "U" : closes[i + 1] < closes[i] ? "D" : "F");
  }
  return pattern.join("");
}

interface PatternRecord {
  wins: number;
  losses: number;
  totalProfit: number;
}

let patternHistory: Record<string, PatternRecord> = {};

export function getPatternHistory(): Record<string, PatternRecord> {
  return patternHistory;
}

export function setPatternHistory(data: Record<string, PatternRecord>): void {
  patternHistory = data;
}

/**
 * Record a trade outcome keyed by strategy-combo + candle pattern.
 * strategyCombo: sorted pipe-joined IDs of strategies that voted buy (e.g. "ema|rsi").
 * This lets ML learn "when RSI + EMA agree AND pattern is UUDDUD → what usually happens?"
 */
export function recordPatternOutcome(strategyCombo: string, pattern: string, success: boolean, profitPct: number): void {
  const key = strategyCombo ? `${strategyCombo}:${pattern}` : pattern;
  if (!patternHistory[key]) patternHistory[key] = { wins: 0, losses: 0, totalProfit: 0 };
  if (success) patternHistory[key].wins++;
  else patternHistory[key].losses++;
  patternHistory[key].totalProfit += profitPct;
}

export const mlStrategy: Strategy = {
  id: "ml",
  name: "ML Pattern",
  analyze(input: StrategyInput): StrategySignal {
    const closes = input.candles.map((c) => c.close);
    if (closes.length < 10) {
      return { strategyId: "ml", strategyName: "ML Pattern", vote: "hold", confidence: 0.1 };
    }

    const pattern = encodePattern(closes);
    const buyers = input.otherVotes ?? [];
    const sortedCombo = [...buyers].sort().join("|");

    // Look up the strategy-combo + pattern combination first (most specific),
    // then fall back to the bare pattern if no combo data exists yet.
    const comboKey = sortedCombo ? `${sortedCombo}:${pattern}` : pattern;
    const record = patternHistory[comboKey] ?? patternHistory[pattern];

    if (!record || record.wins + record.losses < 2) {
      // Not enough learned data — defer to consensus of the other strategies.
      // This avoids being stuck on "sell" just because candles are trending down.
      const buyCount = buyers.length;
      if (buyCount >= 4) return { strategyId: "ml", strategyName: "ML Pattern", vote: "buy", confidence: 0.50 };
      if (buyCount === 3) return { strategyId: "ml", strategyName: "ML Pattern", vote: "buy", confidence: 0.42 };
      if (buyCount <= 1) return { strategyId: "ml", strategyName: "ML Pattern", vote: "sell", confidence: 0.35 };
      return { strategyId: "ml", strategyName: "ML Pattern", vote: "hold", confidence: 0.25 };
    }

    const total = record.wins + record.losses;
    const winRate = record.wins / total;
    const avgProfit = record.totalProfit / total;

    // Confidence scales with sample size
    const experienceBoost = Math.min(0.25, total * 0.02);

    if (winRate > 0.6 && avgProfit > 1) {
      return { strategyId: "ml", strategyName: "ML Pattern", vote: "buy", confidence: Math.min(0.95, 0.5 + winRate * 0.4 + experienceBoost) };
    } else if (winRate < 0.4 && avgProfit < -1) {
      return { strategyId: "ml", strategyName: "ML Pattern", vote: "sell", confidence: Math.min(0.95, 0.5 + (1 - winRate) * 0.4 + experienceBoost) };
    }

    return { strategyId: "ml", strategyName: "ML Pattern", vote: "hold", confidence: 0.3 };
  },
};

export { encodePattern };
