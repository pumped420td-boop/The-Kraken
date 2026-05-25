import type { Strategy, StrategyInput, StrategySignal } from "./base.js";

function computeRSI(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50;
  let gains = 0;
  let losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gains += diff;
    else losses += Math.abs(diff);
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

export const rsiStrategy: Strategy = {
  id: "rsi",
  name: "RSI",
  analyze(input: StrategyInput): StrategySignal {
    const closes = input.candles.map((c) => c.close);
    if (closes.length < 15) {
      return { strategyId: "rsi", strategyName: "RSI", vote: "hold", confidence: 0.1 };
    }
    const rsi = computeRSI(closes);
    let vote: "buy" | "sell" | "hold" = "hold";
    let confidence = 0.3;

    if (rsi < 25) { vote = "buy"; confidence = 0.9; }
    else if (rsi < 30) { vote = "buy"; confidence = 0.75; }
    else if (rsi < 40) { vote = "buy"; confidence = 0.5; }
    else if (rsi > 75) { vote = "sell"; confidence = 0.9; }
    else if (rsi > 70) { vote = "sell"; confidence = 0.75; }
    else if (rsi > 60) { vote = "sell"; confidence = 0.5; }

    return { strategyId: "rsi", strategyName: "RSI", vote, confidence };
  },
};
