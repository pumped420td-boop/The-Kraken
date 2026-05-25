import { Router } from "express";
import { store } from "../lib/store.js";
import { startBot, stopBot, SCAN_INTERVAL_MS } from "../lib/trader.js";

const router = Router();

function buildStatus() {
  return {
    running: store.running,
    mode: store.settings.mode,
    activeTradeCount: store.getOpenTrades().length,
    activeTrades: store.getOpenTrades(),
    balance: store.getBalance(),
    allocatedBalance: store.getAllocatedAmount(),
    lastScanAt: store.lastScanAt,
    scanIntervalSeconds: SCAN_INTERVAL_MS / 1000,
  };
}

router.post("/bot/start", async (_req, res) => {
  await startBot();
  res.json(buildStatus());
});

router.post("/bot/stop", async (_req, res) => {
  await stopBot();
  res.json(buildStatus());
});

router.get("/bot/status", (_req, res) => {
  res.json(buildStatus());
});

export default router;
