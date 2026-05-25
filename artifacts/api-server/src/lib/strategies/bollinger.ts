import type { Strategy, StrategyInput, StrategySignal } from "./base.js";
import { sma, stddev } from "./base.js";

export const bollingerStrategy: Strategy = {
  id: "bollinger",
  name: "Bollinger Bands",
  analyze(input: StrategyInput): StrategySignal {
    const closes = input.candles.map((c) => c.close);
    if (closes.length < 20) {
      return { strategyId: "bollinger", strategyName: "Bollinger Bands", vote: "hold", confidence: 0.1 };
    }
    const period = 20;
    const slice = closes.slice(-period);
    const middleBands = sma(closes, period);
    const middle = middleBands[middleBands.length - 1];
    const sd = stddev(slice);
    const upper = middle + 2 * sd;
    const lower = middle - 2 * sd;
    const price = input.currentPrice;

    const bandwidth = (upper - lower) / middle;
    let vote: "buy" | "sell" | "hold" = "hold";
    let confidence = 0.3;

    const positionInBand = (price - lower) / (upper - lower);

    if (price <= lower) {
      vote = "buy";
      confidence = Math.min(0.95, 0.7 + bandwidth * 2);
    } else if (positionInBand < 0.2) {
      vote = "buy";
      confidence = 0.6;
    } else if (price >= upper) {
      vote = "sell";
      confidence = Math.min(0.95, 0.7 + bandwidth * 2);
    } else if (positionInBand > 0.8) {
      vote = "sell";
      confidence = 0.6;
    }

    return { strategyId: "bollinger", strategyName: "Bollinger Bands", vote, confidence };
  },
};
