
export interface StockPosition {
  ticker: string;
  name: string;
  weight: number;
  sector: string;
  reason: string;
  esgScore: string; // "A", "AA", "AAA", etc.
  type: 'Core' | 'Growth' | 'Stabilizer'; // Core ESG, High Growth Green, or Neutral Stabilizer

  // Real-time fetched data
  currentPrice?: number;
  dayChangePercent?: number;
  oneYearChangePercent?: number;   // New anchor
  threeYearChangePercent?: number; // New anchor
  fiveYearChangePercent?: number;
  dividendYieldPercent?: number;   // TTM dividend yield
}

export interface PortfolioMetrics {
  projectedReturn: string;
  projectedVolatility: string;
  dividendYield: string;
  carbonFootprintReduction: string;
  sharpeRatio: string;
  benchmark1YearReturn?: number; // Real fetched S&P 500 1Y return
  benchmark3YearReturn?: number; // Real fetched S&P 500 3Y return
  benchmark5YearReturn?: number; // Real fetched S&P 500 5Y return
  // Flags to indicate if metrics are calculated from real data
  isCalculated?: {
    projectedReturn: boolean;
    dividendYield: boolean;
    sharpeRatio: boolean;
    carbonFootprintReduction: boolean;
  };
}

export interface NewsHeadline {
  title: string;
  source: string;
  url: string;
}

export interface GeneratedPortfolio {
  name: string;
  description: string;
  positions: StockPosition[];
  metrics: PortfolioMetrics;
  narrative: string;
  headlines?: NewsHeadline[]; // News chyron items
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface StockPerformance {
  oneWeek?: number;
  oneMonth?: number;
  threeMonth?: number;
  oneYear?: number;
  fiveYear?: number;
}

export interface StockAnalysisResult {
  content: string;
  groundingChunks?: GroundingChunk[];
  performance?: StockPerformance;
  price?: number;
  marketCap?: string;
  peRatio?: number;
  dividendYield?: number;
}
