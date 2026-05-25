import type { Strategy, StrategyInput, StrategySignal } from "./base.js";

export const momentumStrategy: Strategy = {
  id: "momentum",
  name: "Momentum",
  analyze(input: StrategyInput): StrategySignal {
    const closes = input.candles.map((c) => c.close);
    if (closes.length < 14) {
      return { strategyId: "momentum", strategyName: "Momentum", vote: "hold", confidence: 0.1 };
    }

    const period = 10;
    const current = closes[closes.length - 1];
    const past = closes[closes.length - 1 - period];
    const roc = past > 0 ? ((current - past) / past) * 100 : 0;

    // Also check short-term acceleration
    const shortPast = closes[closes.length - 4];
    const shortRoc = shortPast > 0 ? ((current - shortPast) / shortPast) * 100 : 0;

    let vote: "buy" | "sell" | "hold" = "hold";
    let confidence = 0.3;

    if (roc > 8 && shortRoc > 2) {
      vote = "buy";
      confidence = Math.min(0.9, 0.6 + roc * 0.02);
    } else if (roc > 4) {
      vote = "buy";
      confidence = 0.55;
    } else if (roc < -8 && shortRoc < -2) {
      vote = "sell";
      confidence = Math.min(0.9, 0.6 + Math.abs(roc) * 0.02);
    } else if (roc < -4) {
      vote = "sell";
      confidence = 0.55;
    }

    return { strategyId: "momentum", strategyName: "Momentum", vote, confidence };
  },
};
