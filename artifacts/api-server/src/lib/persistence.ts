import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { store } from "./store.js";
import { getPatternHistory, setPatternHistory } from "./strategies/ml.js";
import { logger } from "./logger.js";

const DATA_DIR = join(process.cwd(), "data");
const STATE_FILE = join(DATA_DIR, "ml-state.json");
const STATE_VERSION = 1;

interface PersistedStratStat {
  id: string;
  weight: number;
  totalSignals: number;
  successfulSignals: number;
  profitContribution: number;
}

interface MlState {
  version: number;
  savedAt: string;
  learningCycles: number;
  strategyStats: PersistedStratStat[];
  patternHistory: Record<string, { wins: number; losses: number; totalProfit: number }>;
}

export function saveMlState(): void {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    const state: MlState = {
      version: STATE_VERSION,
      savedAt: new Date().toISOString(),
      learningCycles: store.learningCycles,
      strategyStats: store.strategyStats.map((s) => ({
        id: s.id,
        weight: s.weight,
        totalSignals: s.totalSignals,
        successfulSignals: s.successfulSignals,
        profitContribution: s.profitContribution,
      })),
      patternHistory: getPatternHistory(),
    };
    writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf8");
  } catch (err) {
    logger.warn({ err }, "Failed to save ML state");
  }
}

export function loadMlState(): void {
  try {
    if (!existsSync(STATE_FILE)) {
      logger.info("No saved ML state found — starting fresh");
      return;
    }
    const raw = readFileSync(STATE_FILE, "utf8");
    const state = JSON.parse(raw) as MlState;
    if (state.version !== STATE_VERSION) {
      logger.warn({ version: state.version }, "ML state version mismatch — skipping load");
      return;
    }

    for (const saved of state.strategyStats) {
      const stat = store.strategyStats.find((s) => s.id === saved.id);
      if (stat) {
        stat.weight = saved.weight;
        stat.totalSignals = saved.totalSignals;
        stat.successfulSignals = saved.successfulSignals;
        stat.profitContribution = saved.profitContribution;
      }
    }
    store.learningCycles = state.learningCycles;
    setPatternHistory(state.patternHistory);

    const patternCount = Object.keys(state.patternHistory).length;
    logger.info(
      { cycles: state.learningCycles, patterns: patternCount, savedAt: state.savedAt },
      "ML state restored"
    );
  } catch (err) {
    logger.warn({ err }, "Failed to load ML state — starting fresh");
  }
}
