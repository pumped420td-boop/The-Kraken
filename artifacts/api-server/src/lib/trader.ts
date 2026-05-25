import { store } from "./store.js";
import { COINS } from "./coins.js";
import { analyzeCoins, countBuyVotes } from "./voting.js";
import { updateTickerCache, fetchUsdBalance, placeMarketBuy, placeMarketSell } from "./kraken.js";
import { encodePattern, recordPatternOutcome } from "./strategies/ml.js";
import { logger } from "./logger.js";
import type { StoredTrade } from "./store.js";

const SCAN_INTERVAL_MS = 30_000; // 30 seconds
let scanInterval: ReturnType<typeof setInterval> | null = null;

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

async function openTrade(
  symbol: string,
  krakenPair: string,
  name: string,
  price: number,
  winningStrategies: string[]
): Promise<void> {
  const openTrades = store.getOpenTrades();
  if (openTrades.length >= store.settings.maxConcurrentTrades) return;

  const available = store.getAvailableForTrade();
  const perTrade = available / (store.settings.maxConcurrentTrades - openTrades.length);
  if (perTrade < 10) {
    logger.warn({ symbol }, "Insufficient balance to open trade");
    return;
  }

  const quantity = perTrade / price;

  if (store.settings.mode === "live") {
    try {
      await placeMarketBuy(krakenPair, quantity.toFixed(8));
    } catch (err) {
      logger.error({ err, symbol }, "Failed to place live buy order");
      return;
    }
  }

  if (store.settings.mode === "paper") {
    store.paperBalance -= perTrade;
  }

  const trade: StoredTrade = {
    id: generateId(),
    symbol,
    krakenPair,
    name,
    entryPrice: price,
    currentPrice: price,
    quantity,
    investedUsd: perTrade,
    profitPercent: 0,
    profitUsd: 0,
    status: "open",
    strategy: "Voting Consensus",
    winningStrategies,
    openedAt: new Date().toISOString(),
    closedAt: null,
    paperMode: store.settings.mode === "paper",
    highestPrice: price,
    trailingActive: false,
  };

  store.trades.push(trade);
  logger.info({ symbol, price, perTrade, mode: store.settings.mode }, "Trade opened");
}

async function closeTrade(trade: StoredTrade, reason: "profit" | "stop" | "sell_signal"): Promise<void> {
  const price = store.marketCache[trade.symbol]?.price ?? trade.currentPrice;

  if (store.settings.mode === "live") {
    try {
      await placeMarketSell(trade.krakenPair, trade.quantity.toFixed(8));
    } catch (err) {
      logger.error({ err, symbol: trade.symbol }, "Failed to place live sell order");
      return;
    }
  }

  const exitValue = trade.quantity * price;
  const profitUsd = exitValue - trade.investedUsd;
  const profitPercent = (profitUsd / trade.investedUsd) * 100;

  trade.currentPrice = price;
  trade.profitUsd = profitUsd;
  trade.profitPercent = profitPercent;
  trade.status = reason === "stop" ? "stopped" : "closed";
  trade.closedAt = new Date().toISOString();

  if (store.settings.mode === "paper") {
    store.paperBalance += exitValue;
  }

  // Feed results into ML learning
  const candles = store.ohlcCache[trade.krakenPair]?.candles ?? [];
  if (candles.length >= 10) {
    const closes = candles.map((c) => c.close);
    const pattern = encodePattern(closes);
    const success = profitPercent > 0;
    recordPatternOutcome(trade.symbol, pattern, success, profitPercent);
  }

  // Update strategy weights based on which strategies voted for this trade
  for (const stratId of trade.winningStrategies) {
    store.updateStrategyWeight(stratId, profitPercent > 0, profitPercent);
  }

  logger.info(
    { symbol: trade.symbol, profitPercent: profitPercent.toFixed(2), reason, mode: store.settings.mode },
    "Trade closed"
  );
}

async function updateActiveTrades(): Promise<void> {
  const open = store.getOpenTrades();
  for (const trade of open) {
    const cached = store.marketCache[trade.symbol];
    if (!cached) continue;

    const price = cached.price;
    trade.currentPrice = price;
    trade.profitPercent = ((price - trade.entryPrice) / trade.entryPrice) * 100;
    trade.profitUsd = trade.quantity * price - trade.investedUsd;

    // Track highest price for trailing stop
    if (price > trade.highestPrice) {
      trade.highestPrice = price;
    }

    // Activate trailing stop once profit target is hit
    if (trade.profitPercent >= store.settings.profitTarget && !trade.trailingActive) {
      trade.trailingActive = true;
      logger.info({ symbol: trade.symbol, profit: trade.profitPercent }, "Trailing stop activated");
    }

    // Check trailing stop loss
    if (trade.trailingActive) {
      const trailingDropPct = ((trade.highestPrice - price) / trade.highestPrice) * 100;
      if (trailingDropPct >= store.settings.trailingStop) {
        await closeTrade(trade, "stop");
        continue;
      }
    }
  }
}

async function scan(): Promise<void> {
  if (!store.running) return;

  try {
    // Refresh market data
    const pairs = COINS.map((c) => c.krakenPair);
    await updateTickerCache(pairs);

    // Update live balance if needed
    if (store.settings.mode === "live" && store.apiKey && store.apiSecret) {
      try {
        store.liveBalance = await fetchUsdBalance();
      } catch {
        // ignore
      }
    }

    // Update open trade prices + check exits
    await updateActiveTrades();

    // Find new opportunities via voting
    const openTrades = store.getOpenTrades();
    if (openTrades.length < store.settings.maxConcurrentTrades) {
      const activeSymbols = new Set(openTrades.map((t) => t.symbol));
      const candidates = COINS.filter((c) => !activeSymbols.has(c.symbol));
      const voteResults = await analyzeCoins(candidates);

      const buySignals = voteResults
        .filter((r) => {
          const buyVotes = countBuyVotes(r.votes);
          return r.decision === "buy" && buyVotes >= store.settings.voteThreshold;
        })
        .sort((a, b) => b.confidence - a.confidence);

      for (const signal of buySignals) {
        if (store.getOpenTrades().length >= store.settings.maxConcurrentTrades) break;
        const winningStrategies = signal.votes
          .filter((v) => v.vote === "buy")
          .map((v) => v.strategyId);
        await openTrade(signal.symbol, COINS.find((c) => c.symbol === signal.symbol)!.krakenPair, signal.name, signal.price, winningStrategies);
      }
    }

    store.lastScanAt = new Date().toISOString();
  } catch (err) {
    logger.error({ err }, "Scan error");
  }
}

export async function startBot(): Promise<void> {
  if (store.running) return;
  store.running = true;
  logger.info({ mode: store.settings.mode }, "Bot started");

  // Initial market data load
  try {
    await updateTickerCache(COINS.map((c) => c.krakenPair));
  } catch {
    // ignore on startup
  }

  await scan();
  scanInterval = setInterval(scan, SCAN_INTERVAL_MS);
}

export async function stopBot(): Promise<void> {
  if (!store.running) return;
  store.running = false;
  if (scanInterval) {
    clearInterval(scanInterval);
    scanInterval = null;
  }
  logger.info("Bot stopped");
}

export { SCAN_INTERVAL_MS };
