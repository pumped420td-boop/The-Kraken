import { Router } from "express";
import { store } from "../lib/store.js";
import { closeTrade } from "../lib/trader.js";

const router = Router();

router.post("/trades/:id/close", async (req, res) => {
  const trade = store.trades.find((t) => t.id === req.params["id"] && t.status === "open");
  if (!trade) {
    res.status(404).json({ error: "Trade not found or already closed" });
    return;
  }
  await closeTrade(trade, "manual");
  res.json(trade);
});

router.get("/trades", (req, res) => {
  const limit = parseInt(String(req.query["limit"] ?? "50"));
  const offset = parseInt(String(req.query["offset"] ?? "0"));
  const mode = String(req.query["mode"] ?? "all") as "paper" | "live" | "all";

  let trades = [...store.trades].reverse();
  if (mode === "paper") trades = trades.filter((t) => t.paperMode);
  else if (mode === "live") trades = trades.filter((t) => !t.paperMode);

  const total = trades.length;
  const openCount = trades.filter((t) => t.status === "open").length;
  const closedCount = trades.filter((t) => t.status !== "open").length;
  const paginated = trades.slice(offset, offset + limit);

  res.json({ trades: paginated, total, openCount, closedCount });
});

export default router;
