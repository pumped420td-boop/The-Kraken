import type { Strategy, StrategyInput, StrategySignal } from "./base.js";

export const vwapStrategy: Strategy = {
  id: "vwap",
  name: "VWAP",
  analyze(input: StrategyInput): StrategySignal {
    const candles = input.candles;
    if (candles.length < 10) {
      return { strategyId: "vwap", strategyName: "VWAP", vote: "hold", confidence: 0.1 };
    }

    const recent = candles.slice(-24); // last 24 periods
    let totalPV = 0;
    let totalV = 0;
    for (const c of recent) {
      const typical = (c.high + c.low + c.close) / 3;
      totalPV += typical * c.volume;
      totalV += c.volume;
    }
    const vwap = totalV > 0 ? totalPV / totalV : input.currentPrice;
    const deviation = ((input.currentPrice - vwap) / vwap) * 100;

    let vote: "buy" | "sell" | "hold" = "hold";
    let confidence = 0.3;

    if (deviation < -3) {
      vote = "buy";
      confidence = Math.min(0.9, 0.6 + Math.abs(deviation) * 0.05);
    } else if (deviation < -1.5) {
      vote = "buy";
      confidence = 0.55;
    } else if (deviation > 3) {
      vote = "sell";
      confidence = Math.min(0.9, 0.6 + deviation * 0.05);
    } else if (deviation > 1.5) {
      vote = "sell";
      confidence = 0.55;
    }

    return { strategyId: "vwap", strategyName: "VWAP", vote, confidence };
  },
};
