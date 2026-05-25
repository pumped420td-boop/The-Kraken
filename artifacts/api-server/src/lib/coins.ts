export interface Coin {
  symbol: string;
  krakenPair: string;
  name: string;
  category: "crypto" | "meme";
}

export const COINS: Coin[] = [
  // Top 20 Crypto
  { symbol: "BTC",    krakenPair: "XXBTZUSD",  name: "Bitcoin",          category: "crypto" },
  { symbol: "ETH",    krakenPair: "XETHZUSD",  name: "Ethereum",         category: "crypto" },
  { symbol: "SOL",    krakenPair: "SOLUSD",    name: "Solana",           category: "crypto" },
  { symbol: "XRP",    krakenPair: "XXRPZUSD",  name: "XRP",              category: "crypto" },
  { symbol: "ADA",    krakenPair: "ADAUSD",    name: "Cardano",          category: "crypto" },
  { symbol: "AVAX",   krakenPair: "AVAXUSD",   name: "Avalanche",        category: "crypto" },
  { symbol: "DOT",    krakenPair: "DOTUSD",    name: "Polkadot",         category: "crypto" },
  { symbol: "LINK",   krakenPair: "LINKUSD",   name: "Chainlink",        category: "crypto" },
  { symbol: "LTC",    krakenPair: "XLTCZUSD",  name: "Litecoin",         category: "crypto" },
  { symbol: "SUI",    krakenPair: "SUIUSD",    name: "Sui",              category: "crypto" },
  { symbol: "UNI",    krakenPair: "UNIUSD",    name: "Uniswap",          category: "crypto" },
  { symbol: "ATOM",   krakenPair: "ATOMUSD",   name: "Cosmos",           category: "crypto" },
  { symbol: "XLM",    krakenPair: "XXLMZUSD",  name: "Stellar",          category: "crypto" },
  { symbol: "ALGO",   krakenPair: "ALGOUSD",   name: "Algorand",         category: "crypto" },
  { symbol: "NEAR",   krakenPair: "NEARUSD",   name: "NEAR Protocol",    category: "crypto" },
  { symbol: "ICP",    krakenPair: "ICPUSD",    name: "Internet Computer",category: "crypto" },
  { symbol: "APT",    krakenPair: "APTUSD",    name: "Aptos",            category: "crypto" },
  { symbol: "ARB",    krakenPair: "ARBUSD",    name: "Arbitrum",         category: "crypto" },
  { symbol: "OP",     krakenPair: "OPUSD",     name: "Optimism",         category: "crypto" },
  { symbol: "INJ",    krakenPair: "INJUSD",    name: "Injective",        category: "crypto" },
  // Top 20 Meme / Alt coins
  { symbol: "DOGE",   krakenPair: "XDGUSD",    name: "Dogecoin",         category: "meme" },
  { symbol: "SHIB",   krakenPair: "SHIBUSD",   name: "Shiba Inu",        category: "meme" },
  { symbol: "PEPE",   krakenPair: "PEPEUSD",   name: "Pepe",             category: "meme" },
  { symbol: "FLOKI",  krakenPair: "FLOKIUSD",  name: "Floki",            category: "meme" },
  { symbol: "BONK",   krakenPair: "BONKUSD",   name: "Bonk",             category: "meme" },
  { symbol: "WIF",    krakenPair: "WIFUSD",    name: "Dogwifhat",        category: "meme" },
  { symbol: "MEME",   krakenPair: "MEMEUSD",   name: "Memecoin",         category: "meme" },
  { symbol: "TURBO",  krakenPair: "TURBOUSD",  name: "Turbo",            category: "meme" },
  { symbol: "NEIRO",  krakenPair: "NEIROUSD",  name: "Neiro",            category: "meme" },
  { symbol: "TRX",    krakenPair: "TRXUSD",    name: "TRON",             category: "meme" },
  { symbol: "TON",    krakenPair: "TONUSD",    name: "Toncoin",          category: "meme" },
  { symbol: "SEI",    krakenPair: "SEIUSD",    name: "Sei",              category: "meme" },
  { symbol: "HBAR",   krakenPair: "HBARUSD",   name: "Hedera",           category: "meme" },
  { symbol: "FET",    krakenPair: "FETUSD",    name: "Fetch.ai",         category: "meme" },
  { symbol: "RENDER", krakenPair: "RENDERUSD", name: "Render",           category: "meme" },
  { symbol: "GRT",    krakenPair: "GRTUSD",    name: "The Graph",        category: "meme" },
  { symbol: "SAND",   krakenPair: "SANDUSD",   name: "The Sandbox",      category: "meme" },
  { symbol: "MANA",   krakenPair: "MANAUSD",   name: "Decentraland",     category: "meme" },
  { symbol: "VET",    krakenPair: "VETUSD",    name: "VeChain",          category: "meme" },
  { symbol: "TIA",    krakenPair: "TIAUSD",    name: "Celestia",         category: "meme" },
];

export function getCoinBySymbol(symbol: string): Coin | undefined {
  return COINS.find((c) => c.symbol === symbol);
}

export function getCoinByPair(pair: string): Coin | undefined {
  return COINS.find((c) => c.krakenPair === pair);
}
