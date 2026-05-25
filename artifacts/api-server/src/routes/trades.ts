import { Router } from "express";
import { store } from "../lib/store.js";

const router = Router();

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
