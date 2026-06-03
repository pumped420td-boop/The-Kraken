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

export function recordPatternOutcome(_symbol: string, pattern: string, success: boolean, profitPct: number): void {
  // Key on just the candle pattern (not symbol) so all 40 coins share learning data.
  // A coin appearing in a UUDDUD shape carries the same signal regardless of which coin it is.
  const key = pattern;
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
    // Global key — all 40 coins share pattern knowledge so data accumulates fast
    const record = patternHistory[pattern];

    if (!record || record.wins + record.losses < 2) {
      // Not enough data yet — active fallback using recent price trend
      const recentCloses = closes.slice(-5);
      const upCount = recentCloses.filter((v, i) => i > 0 && v > recentCloses[i - 1]).length;
      if (upCount >= 3) return { strategyId: "ml", strategyName: "ML Pattern", vote: "buy", confidence: 0.45 };
      if (upCount <= 1) return { strategyId: "ml", strategyName: "ML Pattern", vote: "sell", confidence: 0.40 };
      return { strategyId: "ml", strategyName: "ML Pattern", vote: "hold", confidence: 0.25 };
    }

    const total = record.wins + record.losses;
    const winRate = record.wins / total;
    const avgProfit = record.totalProfit / total;

    // Confidence scales with sample size (more data = more conviction)
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
