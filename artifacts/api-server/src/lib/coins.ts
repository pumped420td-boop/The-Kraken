export interface Coin {
  symbol: string;
  krakenPair: string;
  name: string;
  category: "crypto" | "meme";
}

export const COINS: Coin[] = [
  // Top 20 Crypto
  { symbol: "BTC", krakenPair: "XXBTZUSD", name: "Bitcoin", category: "crypto" },
  { symbol: "ETH", krakenPair: "XETHZUSD", name: "Ethereum", category: "crypto" },
  { symbol: "SOL", krakenPair: "SOLUSD", name: "Solana", category: "crypto" },
  { symbol: "XRP", krakenPair: "XXRPZUSD", name: "XRP", category: "crypto" },
  { symbol: "ADA", krakenPair: "ADAUSD", name: "Cardano", category: "crypto" },
  { symbol: "AVAX", krakenPair: "AVAXUSD", name: "Avalanche", category: "crypto" },
  { symbol: "DOT", krakenPair: "DOTUSD", name: "Polkadot", category: "crypto" },
  { symbol: "LINK", krakenPair: "LINKUSD", name: "Chainlink", category: "crypto" },
  { symbol: "MATIC", krakenPair: "MATICUSD", name: "Polygon", category: "crypto" },
  { symbol: "LTC", krakenPair: "XLTCZUSD", name: "Litecoin", category: "crypto" },
  { symbol: "UNI", krakenPair: "UNIUSD", name: "Uniswap", category: "crypto" },
  { symbol: "ATOM", krakenPair: "ATOMUSD", name: "Cosmos", category: "crypto" },
  { symbol: "XLM", krakenPair: "XXLMZUSD", name: "Stellar", category: "crypto" },
  { symbol: "ALGO", krakenPair: "ALGOUSD", name: "Algorand", category: "crypto" },
  { symbol: "FIL", krakenPair: "FILUSD", name: "Filecoin", category: "crypto" },
  { symbol: "NEAR", krakenPair: "NEARUSD", name: "NEAR Protocol", category: "crypto" },
  { symbol: "ICP", krakenPair: "ICPUSD", name: "Internet Computer", category: "crypto" },
  { symbol: "APT", krakenPair: "APTUSD", name: "Aptos", category: "crypto" },
  { symbol: "ARB", krakenPair: "ARBUSD", name: "Arbitrum", category: "crypto" },
  { symbol: "OP", krakenPair: "OPUSD", name: "Optimism", category: "crypto" },
  // Top 20 Meme Coins
  { symbol: "DOGE", krakenPair: "XDGUSD", name: "Dogecoin", category: "meme" },
  { symbol: "SHIB", krakenPair: "SHIBUSD", name: "Shiba Inu", category: "meme" },
  { symbol: "PEPE", krakenPair: "PEPEUSD", name: "Pepe", category: "meme" },
  { symbol: "FLOKI", krakenPair: "FLOKIUSD", name: "Floki", category: "meme" },
  { symbol: "BONK", krakenPair: "BONKUSD", name: "Bonk", category: "meme" },
  { symbol: "WIF", krakenPair: "WIFUSD", name: "Dogwifhat", category: "meme" },
  { symbol: "MEME", krakenPair: "MEMEUSD", name: "Memecoin", category: "meme" },
  { symbol: "TURBO", krakenPair: "TURBOUSD", name: "Turbo", category: "meme" },
  { symbol: "POPCAT", krakenPair: "POPCATUSD", name: "Popcat", category: "meme" },
  { symbol: "NEIRO", krakenPair: "NEIROUSD", name: "Neiro", category: "meme" },
  { symbol: "MOG", krakenPair: "MOGUSD", name: "MOG Coin", category: "meme" },
  { symbol: "BRETT", krakenPair: "BRETTUSD", name: "Brett", category: "meme" },
  { symbol: "DOGS", krakenPair: "DOGSUSD", name: "Dogs", category: "meme" },
  { symbol: "ACT", krakenPair: "ACTUSD", name: "Act I: AI Prophecy", category: "meme" },
  { symbol: "PNUT", krakenPair: "PNUTUSD", name: "Peanut the Squirrel", category: "meme" },
  { symbol: "GOAT", krakenPair: "GOATUSD", name: "Goatseus Maximus", category: "meme" },
  { symbol: "MOODENG", krakenPair: "MOODENUSD", name: "Moo Deng", category: "meme" },
  { symbol: "SPX", krakenPair: "SPXUSD", name: "SPX6900", category: "meme" },
  { symbol: "PONKE", krakenPair: "PONKEUSD", name: "Ponke", category: "meme" },
  { symbol: "COQ", krakenPair: "COQUSD", name: "Coq Inu", category: "meme" },
];

export function getCoinBySymbol(symbol: string): Coin | undefined {
  return COINS.find((c) => c.symbol === symbol);
}

export function getCoinByPair(pair: string): Coin | undefined {
  return COINS.find((c) => c.krakenPair === pair);
}
