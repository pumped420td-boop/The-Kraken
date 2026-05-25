import type { Strategy, StrategyInput, StrategySignal } from "./base.js";
import { ema } from "./base.js";

export const emaStrategy: Strategy = {
  id: "ema",
  name: "EMA Crossover",
  analyze(input: StrategyInput): StrategySignal {
    const closes = input.candles.map((c) => c.close);
    if (closes.length < 22) {
      return { strategyId: "ema", strategyName: "EMA Crossover", vote: "hold", confidence: 0.1 };
    }
    const shortEma = ema(closes, 9);
    const longEma = ema(closes, 21);

    const minLen = Math.min(shortEma.length, longEma.length);
    const currentShort = shortEma[shortEma.length - 1];
    const prevShort = shortEma[shortEma.length - 2];
    const currentLong = longEma[longEma.length - 1];
    const prevLong = longEma[longEma.length - 2];

    if (minLen < 2) {
      return { strategyId: "ema", strategyName: "EMA Crossover", vote: "hold", confidence: 0.2 };
    }

    const gap = ((currentShort - currentLong) / currentLong) * 100;
    let vote: "buy" | "sell" | "hold" = "hold";
    let confidence = 0.3;

    // Golden cross: short crosses above long
    if (prevShort <= prevLong && currentShort > currentLong) {
      vote = "buy";
      confidence = 0.9;
    } else if (currentShort > currentLong && gap > 0.5) {
      vote = "buy";
      confidence = Math.min(0.8, 0.5 + gap * 0.1);
    }
    // Death cross: short crosses below long
    else if (prevShort >= prevLong && currentShort < currentLong) {
      vote = "sell";
      confidence = 0.9;
    } else if (currentShort < currentLong && gap < -0.5) {
      vote = "sell";
      confidence = Math.min(0.8, 0.5 + Math.abs(gap) * 0.1);
    }

    return { strategyId: "ema", strategyName: "EMA Crossover", vote, confidence };
  },
};
