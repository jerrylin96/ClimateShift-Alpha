import { GeneratedPortfolio } from '../types';

export interface BacktestDataPoint {
  dateObj: Date;
  dateLabel: string;
  year: number;
  monthIndex: number;
  decimalYear: number;
  sp500: number;
  fund: number;
}

// Constants for calculations
const RISK_FREE_RATE = 4.25; // US 10-Year Treasury Yield (as percentage)
const EXPENSE_RATIO = 0.10; // 10 basis points

export interface CalculatedMetrics {
  projectedReturn: string | null;
  dividendYield: string | null;
  sharpeRatio: string | null;
  annualizedVolatility: number | null;
}

/**
 * Calculates the weighted average dividend yield for the portfolio.
 * Returns null if valid weight coverage is < 50%.
 */
export const calculateDividendYield = (portfolio: GeneratedPortfolio): number | null => {
  let weightedSum = 0;
  let validWeight = 0;

  portfolio.positions.forEach(pos => {
    if (typeof pos.dividendYieldPercent === 'number') {
      weightedSum += (pos.weight / 100) * pos.dividendYieldPercent;
      validWeight += pos.weight;
    }
  });

  if (validWeight > 50) {
    // Normalize to account for missing data
    return (weightedSum / validWeight) * 100;
  }
  return null;
};

/**
 * Calculates the projected annual return based on weighted 1-year historical returns.
 * Uses 1Y return as a forward-looking proxy (with expense ratio deducted).
 * Returns null if valid weight coverage is < 50%.
 */
export const calculateProjectedReturn = (portfolio: GeneratedPortfolio): number | null => {
  const oneYearReturn = calculateWeightedReturn(portfolio, 'oneYearChangePercent');

  if (oneYearReturn !== null) {
    // Deduct expense ratio from gross return
    return oneYearReturn - EXPENSE_RATIO;
  }
  return null;
};

/**
 * Estimates portfolio volatility using the spread between annualized returns.
 * This is a simplified estimation - true volatility requires daily return data.
 * Uses the standard deviation of individual position returns as a proxy.
 */
export const estimateVolatility = (portfolio: GeneratedPortfolio): number | null => {
  const returns: number[] = [];
  let totalWeight = 0;

  portfolio.positions.forEach(pos => {
    if (typeof pos.oneYearChangePercent === 'number') {
      returns.push(pos.oneYearChangePercent);
      totalWeight += pos.weight;
    }
  });

  if (returns.length < 3 || totalWeight < 50) {
    return null; // Not enough data for meaningful volatility estimate
  }

  // Calculate mean
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;

  // Calculate standard deviation of returns as volatility proxy
  const squaredDiffs = returns.map(r => Math.pow(r - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / returns.length;
  const stdDev = Math.sqrt(variance);

  // Apply diversification benefit (typically 0.6-0.8x for a diversified portfolio)
  // This accounts for imperfect correlation between holdings
  const diversificationFactor = 0.7;

  return stdDev * diversificationFactor;
};

/**
 * Calculates the Sharpe Ratio: (Expected Return - Risk Free Rate) / Volatility
 * Returns null if we don't have enough data to estimate volatility.
 */
export const calculateSharpeRatio = (portfolio: GeneratedPortfolio): number | null => {
  const projectedReturn = calculateProjectedReturn(portfolio);
  const volatility = estimateVolatility(portfolio);

  if (projectedReturn === null || volatility === null || volatility === 0) {
    return null;
  }

  const excessReturn = projectedReturn - RISK_FREE_RATE;
  return excessReturn / volatility;
};

/**
 * Calculates all portfolio metrics from real data.
 * Returns calculated values where possible, null otherwise.
 */
export const calculateAllMetrics = (portfolio: GeneratedPortfolio): CalculatedMetrics => {
  const projectedReturnNum = calculateProjectedReturn(portfolio);
  const dividendYieldNum = calculateDividendYield(portfolio);
  const sharpeRatioNum = calculateSharpeRatio(portfolio);
  const volatility = estimateVolatility(portfolio);

  return {
    projectedReturn: projectedReturnNum !== null
      ? `${projectedReturnNum >= 0 ? '+' : ''}${projectedReturnNum.toFixed(1)}%`
      : null,
    dividendYield: dividendYieldNum !== null
      ? `${dividendYieldNum.toFixed(2)}%`
      : null,
    sharpeRatio: sharpeRatioNum !== null
      ? sharpeRatioNum.toFixed(2)
      : null,
    annualizedVolatility: volatility,
  };
};

/**
 * Calculates the weighted average return for a specific timeframe (1Y, 3Y, 5Y).
 * Returns null if valid weight coverage is < 50%.
 */
export const calculateWeightedReturn = (
  portfolio: GeneratedPortfolio, 
  key: 'oneYearChangePercent' | 'threeYearChangePercent' | 'fiveYearChangePercent'
): number | null => {
  let weightedSum = 0;
  let validWeight = 0;
  
  portfolio.positions.forEach(pos => {
    if (typeof pos[key] === 'number') {
      weightedSum += (pos.weight / 100) * (pos[key] as number);
      validWeight += pos.weight;
    }
  });

  // Normalize if we have >50% of data coverage
  if (validWeight > 50) {
    return (weightedSum / validWeight) * 100;
  }
  return null;
};

/**
 * Generates a 5-year monthly backtest simulation based on real historical anchors.
 * Uses piecewise exponential interpolation between 5Y, 3Y, 1Y, and Current points.
 */
export const generateBacktestData = (
  portfolio: GeneratedPortfolio,
  referenceDate: Date = new Date() // Allow injecting date for testing
): BacktestDataPoint[] => {
  const { benchmark1YearReturn, benchmark3YearReturn, benchmark5YearReturn } = portfolio.metrics;
  
  const fund1Y = calculateWeightedReturn(portfolio, 'oneYearChangePercent');
  const fund3Y = calculateWeightedReturn(portfolio, 'threeYearChangePercent');
  const fund5Y = calculateWeightedReturn(portfolio, 'fiveYearChangePercent');

  const hasEnoughData = typeof fund5Y === 'number' && typeof benchmark5YearReturn === 'number';

  if (!hasEnoughData) return [];

  const data: BacktestDataPoint[] = [];
  const startValue = 10000;

  // --- 1. Determine Value Anchors (working backwards from Current Value) ---
  // Value_Now = 10000 * (1 + 5Y_Return)
  
  // Portfolio Anchors
  const pVal_Start = startValue;
  const pVal_Now = startValue * (1 + fund5Y! / 100);
  const pVal_Minus1Y = (typeof fund1Y === 'number') ? pVal_Now / (1 + fund1Y! / 100) : null;
  const pVal_Minus3Y = (typeof fund3Y === 'number') ? pVal_Now / (1 + fund3Y! / 100) : null;

  // Benchmark Anchors
  const bVal_Start = startValue;
  const bVal_Now = startValue * (1 + benchmark5YearReturn! / 100);
  const bVal_Minus1Y = (typeof benchmark1YearReturn === 'number') ? bVal_Now / (1 + benchmark1YearReturn! / 100) : null;
  const bVal_Minus3Y = (typeof benchmark3YearReturn === 'number') ? bVal_Now / (1 + benchmark3YearReturn! / 100) : null;

  // --- 2. Construct Monthly Data Points (60 months) ---
  for (let m = 0; m <= 60; m++) {
      const date = new Date(referenceDate);
      date.setMonth(date.getMonth() - (60 - m)); // m=0 is 60 months ago

      let pVal = 0;
      let bVal = 0;

      if (m <= 24) {
           // Segment 1 (0-24): Start -> 3Y (or Now/1Y fallback)
           const targetP = pVal_Minus3Y || pVal_Now; 
           const targetB = bVal_Minus3Y || bVal_Now;
           
           if (pVal_Minus3Y) {
              pVal = pVal_Start * Math.pow(pVal_Minus3Y / pVal_Start, m / 24);
           } else {
              pVal = pVal_Start * Math.pow(pVal_Now / pVal_Start, m / 60); 
           }
           
           if (bVal_Minus3Y) {
              bVal = bVal_Start * Math.pow(bVal_Minus3Y / bVal_Start, m / 24);
           } else {
              bVal = bVal_Start * Math.pow(bVal_Now / bVal_Start, m / 60);
           }

      } else if (m <= 48) {
           // Segment 2 (24-48): 3Y -> 1Y
           const startP = pVal_Minus3Y || (pVal_Start * Math.pow(pVal_Now / pVal_Start, 24 / 60)); 
           const endP = pVal_Minus1Y || pVal_Now;
           const startB = bVal_Minus3Y || (bVal_Start * Math.pow(bVal_Now / bVal_Start, 24 / 60));
           const endB = bVal_Minus1Y || bVal_Now;
           
           const progress = m - 24;
           const duration = 24;
           
           pVal = startP * Math.pow(endP / startP, progress / duration);
           bVal = startB * Math.pow(endB / startB, progress / duration);

      } else {
           // Segment 3 (48-60): 1Y -> Now
           const startP = pVal_Minus1Y || pVal_Minus3Y || pVal_Start;
           const endP = pVal_Now;
           const startB = bVal_Minus1Y || bVal_Minus3Y || bVal_Start;
           const endB = bVal_Now;

           const progress = m - 48;
           const duration = 12;

           pVal = startP * Math.pow(endP / startP, progress / duration);
           bVal = startB * Math.pow(endB / startB, progress / duration);
      }

      data.push({
        dateObj: date,
        dateLabel: date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
        year: date.getFullYear(),
        monthIndex: m,
        decimalYear: date.getFullYear() + (date.getMonth() / 12),
        sp500: Math.round(bVal),
        fund: Math.round(pVal),
      });
  }

  return data;
};