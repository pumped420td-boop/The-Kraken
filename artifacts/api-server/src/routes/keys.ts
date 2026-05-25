import { Router } from "express";
import { store } from "../lib/store.js";

const router = Router();

router.get("/keys/status", (_req, res) => {
  res.json({
    configured: !!(store.apiKey && store.apiSecret),
    paperMode: store.settings.mode === "paper",
  });
});

router.post("/keys", (req, res) => {
  const { apiKey, apiSecret } = req.body as { apiKey?: string; apiSecret?: string };
  if (!apiKey || !apiSecret) {
    res.status(400).json({ error: "apiKey and apiSecret are required" });
    return;
  }
  store.apiKey = apiKey.trim();
  store.apiSecret = apiSecret.trim();
  res.json({
    configured: true,
    paperMode: store.settings.mode === "paper",
  });
});

router.delete("/keys", (_req, res) => {
  store.apiKey = null;
  store.apiSecret = null;
  // Force paper mode when keys are removed
  store.settings.mode = "paper";
  res.json({
    configured: false,
    paperMode: true,
  });
});

export default router;
