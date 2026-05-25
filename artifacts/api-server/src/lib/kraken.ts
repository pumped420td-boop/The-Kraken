import { createHash, createHmac } from "node:crypto";
import { store } from "./store.js";
import type { OHLCCandle } from "./store.js";

const BASE_URL = "https://api.kraken.com";
const OHLC_TTL_MS = 60_000; // 1 minute cache for OHLC
const TICKER_TTL_MS = 10_000; // 10 second cache for ticker

function sign(path: string, nonce: string, data: string, secret: string): string {
  const sha256 = createHash("sha256").update(nonce + data).digest();
  const hmac = createHmac("sha512", Buffer.from(secret, "base64"))
    .update(Buffer.concat([Buffer.from(path), sha256]))
    .digest("base64");
  return hmac;
}

async function publicRequest<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE_URL}/0/public/${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString(), {
    headers: { "User-Agent": "KrakenTradingBot/1.0" },
  });
  if (!res.ok) throw new Error(`Kraken public request failed: ${res.status}`);
  const json = (await res.json()) as { error: string[]; result: T };
  if (json.error?.length) throw new Error(`Kraken error: ${json.error.join(", ")}`);
  return json.result;
}

async function privateRequest<T>(path: string, body: Record<string, string> = {}): Promise<T> {
  if (!store.apiKey || !store.apiSecret) throw new Error("API keys not configured");
  const nonce = Date.now().toString();
  const data = new URLSearchParams({ nonce, ...body }).toString();
  const apiPath = `/0/private/${path}`;
  const signature = sign(apiPath, nonce, data, store.apiSecret);

  const res = await fetch(`${BASE_URL}${apiPath}`, {
    method: "POST",
    headers: {
      "API-Key": store.apiKey,
      "API-Sign": signature,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "KrakenTradingBot/1.0",
    },
    body: data,
  });
  if (!res.ok) throw new Error(`Kraken private request failed: ${res.status}`);
  const json = (await res.json()) as { error: string[]; result: T };
  if (json.error?.length) throw new Error(`Kraken error: ${json.error.join(", ")}`);
  return json.result;
}

export interface KrakenTickerResult {
  [pair: string]: {
    a: [string, number, string];
    b: [string, number, string];
    c: [string, string];
    v: [string, string];
    p: [string, string];
    t: [number, number];
    l: [string, string];
    h: [string, string];
    o: string;
  };
}

export async function fetchTicker(pairs: string[]): Promise<KrakenTickerResult> {
  const pairStr = pairs.join(",");
  return publicRequest<KrakenTickerResult>("Ticker", { pair: pairStr });
}

export async function fetchOHLC(pair: string, interval = 60): Promise<OHLCCandle[]> {
  const cached = store.ohlcCache[pair];
  if (cached && Date.now() - cached.lastUpdated < OHLC_TTL_MS) {
    return cached.candles;
  }

  try {
    const result = await publicRequest<Record<string, unknown[][]>>("OHLC", {
      pair,
      interval: interval.toString(),
    });

    const key = Object.keys(result).find((k) => k !== "last");
    if (!key) return [];

    const candles: OHLCCandle[] = (result[key] as number[][]).map((row) => ({
      time: row[0] as number,
      open: parseFloat(String(row[1])),
      high: parseFloat(String(row[2])),
      low: parseFloat(String(row[3])),
      close: parseFloat(String(row[4])),
      vwap: parseFloat(String(row[5])),
      volume: parseFloat(String(row[6])),
    }));

    store.ohlcCache[pair] = { candles, lastUpdated: Date.now() };
    return candles;
  } catch {
    return store.ohlcCache[pair]?.candles ?? [];
  }
}

export async function fetchBalance(): Promise<Record<string, string>> {
  return privateRequest<Record<string, string>>("Balance");
}

export async function fetchUsdBalance(): Promise<number> {
  const balance = await fetchBalance();
  const usd = balance["ZUSD"] ?? balance["USD"] ?? "0";
  return parseFloat(usd);
}

export interface OrderResult {
  txid: string[];
  descr: { order: string };
}

export async function placeMarketBuy(pair: string, volume: string): Promise<OrderResult> {
  return privateRequest<OrderResult>("AddOrder", {
    pair,
    type: "buy",
    ordertype: "market",
    volume,
  });
}

export async function placeMarketSell(pair: string, volume: string): Promise<OrderResult> {
  return privateRequest<OrderResult>("AddOrder", {
    pair,
    type: "sell",
    ordertype: "market",
    volume,
  });
}

export async function updateTickerCache(pairs: string[]): Promise<void> {
  const chunks: string[][] = [];
  for (let i = 0; i < pairs.length; i += 10) {
    chunks.push(pairs.slice(i, i + 10));
  }

  for (const chunk of chunks) {
    try {
      const result = await fetchTicker(chunk);
      for (const [krakenKey, data] of Object.entries(result)) {
        const price = parseFloat(data.c[0]);
        const open = parseFloat(data.o);
        const change24h = open > 0 ? ((price - open) / open) * 100 : 0;

        // find matching coin by pair
        const { COINS } = await import("./coins.js");
        const coin = COINS.find(
          (c) =>
            c.krakenPair === krakenKey ||
            krakenKey.includes(c.symbol) ||
            c.krakenPair.replace("X", "").replace("Z", "") === krakenKey.replace("X", "").replace("Z", "")
        );
        const symbol = coin?.symbol ?? krakenKey.replace("USD", "").replace("ZUSD", "").replace("X", "");

        store.marketCache[symbol] = {
          price,
          change24h,
          volume24h: parseFloat(data.v[1]),
          high24h: parseFloat(data.h[1]),
          low24h: parseFloat(data.l[1]),
          lastUpdated: Date.now(),
        };
      }
    } catch {
      // Skip failed chunks
    }
    await new Promise((r) => setTimeout(r, 200)); // rate limit
  }
}
