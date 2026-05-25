import type { OHLCCandle } from "../store.js";

export type SignalType = "buy" | "sell" | "hold";

export interface StrategySignal {
  strategyId: string;
  strategyName: string;
  vote: SignalType;
  confidence: number; // 0-1
}

export interface StrategyInput {
  symbol: string;
  candles: OHLCCandle[];
  currentPrice: number;
}

export interface Strategy {
  id: string;
  name: string;
  analyze(input: StrategyInput): StrategySignal;
}

// ── Helpers ────────────────────────────────────────────────────────────────

export function ema(values: number[], period: number): number[] {
  if (values.length < period) return [];
  const k = 2 / (period + 1);
  const result: number[] = [];
  let prev = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  result.push(prev);
  for (let i = period; i < values.length; i++) {
    prev = values[i] * k + prev * (1 - k);
    result.push(prev);
  }
  return result;
}

export function sma(values: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = period - 1; i < values.length; i++) {
    const slice = values.slice(i - period + 1, i + 1);
    result.push(slice.reduce((a, b) => a + b, 0) / period);
  }
  return result;
}

export function stddev(values: number[]): number {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}
