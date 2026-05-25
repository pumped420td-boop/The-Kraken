import type { Strategy, StrategyInput, StrategySignal } from "./base.js";
import { ema } from "./base.js";

export const macdStrategy: Strategy = {
  id: "macd",
  name: "MACD",
  analyze(input: StrategyInput): StrategySignal {
    const closes = input.candles.map((c) => c.close);
    if (closes.length < 35) {
      return { strategyId: "macd", strategyName: "MACD", vote: "hold", confidence: 0.1 };
    }
    const ema12 = ema(closes, 12);
    const ema26 = ema(closes, 26);

    const minLen = Math.min(ema12.length, ema26.length);
    const macdLine: number[] = [];
    for (let i = 0; i < minLen; i++) {
      macdLine.push(ema12[ema12.length - minLen + i] - ema26[ema26.length - minLen + i]);
    }

    const signal = ema(macdLine, 9);
    if (signal.length < 2) {
      return { strategyId: "macd", strategyName: "MACD", vote: "hold", confidence: 0.2 };
    }

    const currentMACD = macdLine[macdLine.length - 1];
    const prevMACD = macdLine[macdLine.length - 2];
    const currentSignal = signal[signal.length - 1];
    const prevSignal = signal[signal.length - 2];

    const histogram = currentMACD - currentSignal;
    const prevHistogram = prevMACD - prevSignal;

    let vote: "buy" | "sell" | "hold" = "hold";
    let confidence = 0.3;

    if (prevHistogram < 0 && histogram > 0) {
      vote = "buy";
      confidence = 0.85;
    } else if (histogram > 0 && histogram > prevHistogram) {
      vote = "buy";
      confidence = 0.6;
    } else if (prevHistogram > 0 && histogram < 0) {
      vote = "sell";
      confidence = 0.85;
    } else if (histogram < 0 && histogram < prevHistogram) {
      vote = "sell";
      confidence = 0.6;
    }

    return { strategyId: "macd", strategyName: "MACD", vote, confidence };
  },
};
