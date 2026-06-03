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

export function recordPatternOutcome(symbol: string, pattern: string, success: boolean, profitPct: number): void {
  const key = `${symbol}:${pattern}`;
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
    const key = `${input.symbol}:${pattern}`;
    const record = patternHistory[key];

    if (!record || record.wins + record.losses < 3) {
      // Not enough data — use trend analysis as fallback
      const recentCloses = closes.slice(-5);
      const upCount = recentCloses.filter((v, i) => i > 0 && v > recentCloses[i - 1]).length;
      if (upCount >= 4) return { strategyId: "ml", strategyName: "ML Pattern", vote: "buy", confidence: 0.45 };
      if (upCount <= 1) return { strategyId: "ml", strategyName: "ML Pattern", vote: "sell", confidence: 0.45 };
      return { strategyId: "ml", strategyName: "ML Pattern", vote: "hold", confidence: 0.25 };
    }

    const total = record.wins + record.losses;
    const winRate = record.wins / total;
    const avgProfit = record.totalProfit / total;

    // Boost confidence using learning cycles
    const experienceBoost = Math.min(0.2, total * 0.01);

    if (winRate > 0.65 && avgProfit > 2) {
      return { strategyId: "ml", strategyName: "ML Pattern", vote: "buy", confidence: Math.min(0.95, 0.5 + winRate * 0.4 + experienceBoost) };
    } else if (winRate < 0.35 && avgProfit < -2) {
      return { strategyId: "ml", strategyName: "ML Pattern", vote: "sell", confidence: Math.min(0.95, 0.5 + (1 - winRate) * 0.4 + experienceBoost) };
    }

    return { strategyId: "ml", strategyName: "ML Pattern", vote: "hold", confidence: 0.3 };
  },
};

export { encodePattern };
