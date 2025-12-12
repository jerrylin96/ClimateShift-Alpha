
import { describe, it, expect } from 'vitest';
import {
  calculateWeightedReturn,
  generateBacktestData,
  calculateDividendYield,
  calculateProjectedReturn,
  estimateVolatility,
  calculateSharpeRatio,
  calculateAllMetrics
} from '../utils/calculations';
import { GeneratedPortfolio, StockPosition } from '../types';

const mockPortfolio: GeneratedPortfolio = {
  name: "Test Fund",
  description: "Test",
  narrative: "Narrative",
  metrics: {
    projectedReturn: "10%",
    projectedVolatility: "Med",
    dividendYield: "1%",
    carbonFootprintReduction: "10%",
    sharpeRatio: "1.0",
    benchmark1YearReturn: 10,
    benchmark3YearReturn: 30,
    benchmark5YearReturn: 50
  },
  positions: [
    {
      ticker: "A",
      weight: 50,
      oneYearChangePercent: 20,
      threeYearChangePercent: 40,
      fiveYearChangePercent: 60,
      dividendYieldPercent: 2.0
    } as StockPosition,
    {
      ticker: "B",
      weight: 50,
      oneYearChangePercent: 10,
      threeYearChangePercent: 20,
      fiveYearChangePercent: 40,
      dividendYieldPercent: 1.0
    } as StockPosition
  ]
};

describe('calculateWeightedReturn', () => {
  it('calculates weighted average correctly', () => {
    // A: 50% * 20 = 10
    // B: 50% * 10 = 5
    // Total = 15
    const result = calculateWeightedReturn(mockPortfolio, 'oneYearChangePercent');
    expect(result).toBeCloseTo(15);
  });

  it('handles missing data gracefully', () => {
    const partialPortfolio = {
      ...mockPortfolio,
      positions: [
        { ...mockPortfolio.positions[0], oneYearChangePercent: undefined },
        { ...mockPortfolio.positions[1], oneYearChangePercent: 10 }
      ]
    };
    // Only B has data (50% weight). validWeight = 50. 
    // Logic: if validWeight > 50, normalize. 
    // Sum = 50% * 10 = 5. ValidWeight = 50. Result = (5/50)*100 = 10.
    const result = calculateWeightedReturn(partialPortfolio as GeneratedPortfolio, 'oneYearChangePercent');
    expect(result).toBe(null); // Wait, implementation is > 50. So 50 is not > 50. It returns null.
  });
  
  it('returns null if data coverage is insufficient', () => {
    const emptyPortfolio = {
      ...mockPortfolio,
      positions: [
        { ...mockPortfolio.positions[0], oneYearChangePercent: undefined },
        { ...mockPortfolio.positions[1], oneYearChangePercent: undefined }
      ]
    };
    const result = calculateWeightedReturn(emptyPortfolio as GeneratedPortfolio, 'oneYearChangePercent');
    expect(result).toBeNull();
  });
});

describe('generateBacktestData', () => {
  it('generates 61 data points (5 years + current)', () => {
    const data = generateBacktestData(mockPortfolio);
    expect(data.length).toBe(61);
  });

  it('starts at 10,000 for both fund and benchmark', () => {
    const data = generateBacktestData(mockPortfolio);
    const start = data[0]; // 5 Years ago
    // Wait, the logic works backwards from Current Value. 
    // Start Value is assumed 10000 in logic: const startValue = 10000;
    // pVal_Start = startValue.
    // So the data point at m=0 should be 10000.
    expect(start.sp500).toBe(10000);
    expect(start.fund).toBe(10000);
  });

  it('ends at correct accumulated value', () => {
    const data = generateBacktestData(mockPortfolio);
    const end = data[data.length - 1];

    // Benchmark 5Y = 50%. End = 10000 * 1.5 = 15000.
    expect(end.sp500).toBeCloseTo(15000, -1); // approximate due to rounding

    // Fund 5Y: A(60%)*0.5 + B(40%)*0.5 -> Avg 50%.
    // Wait, mock A=60, B=40. Weight 50/50. Avg = 50%.
    // End = 10000 * 1.5 = 15000.
    expect(end.fund).toBeCloseTo(15000, -1);
  });
});

describe('calculateDividendYield', () => {
  it('calculates weighted average dividend yield correctly', () => {
    // A: 50% * 2.0 = 1.0
    // B: 50% * 1.0 = 0.5
    // Total = 1.5
    const result = calculateDividendYield(mockPortfolio);
    expect(result).toBeCloseTo(1.5);
  });

  it('returns null if data coverage is insufficient', () => {
    const noDividendPortfolio = {
      ...mockPortfolio,
      positions: [
        { ...mockPortfolio.positions[0], dividendYieldPercent: undefined },
        { ...mockPortfolio.positions[1], dividendYieldPercent: undefined }
      ]
    };
    const result = calculateDividendYield(noDividendPortfolio as GeneratedPortfolio);
    expect(result).toBeNull();
  });
});

describe('calculateProjectedReturn', () => {
  it('calculates projected return from 1Y returns minus expense ratio', () => {
    // 1Y weighted return = (50%*20 + 50%*10) = 15
    // Minus expense ratio (0.10%) = 15 - 0.10 = 14.9
    const result = calculateProjectedReturn(mockPortfolio);
    expect(result).toBeCloseTo(14.9);
  });

  it('returns null if 1Y data is insufficient', () => {
    const noReturnPortfolio = {
      ...mockPortfolio,
      positions: [
        { ...mockPortfolio.positions[0], oneYearChangePercent: undefined },
        { ...mockPortfolio.positions[1], oneYearChangePercent: undefined }
      ]
    };
    const result = calculateProjectedReturn(noReturnPortfolio as GeneratedPortfolio);
    expect(result).toBeNull();
  });
});

describe('estimateVolatility', () => {
  it('returns null if fewer than 3 positions have data', () => {
    // mockPortfolio only has 2 positions, so it should return null
    const result = estimateVolatility(mockPortfolio);
    expect(result).toBeNull();
  });

  it('estimates volatility from cross-sectional return dispersion', () => {
    const multiPositionPortfolio: GeneratedPortfolio = {
      ...mockPortfolio,
      positions: [
        { ticker: "A", weight: 30, oneYearChangePercent: 25, dividendYieldPercent: 1.5 } as StockPosition,
        { ticker: "B", weight: 30, oneYearChangePercent: 15, dividendYieldPercent: 2.0 } as StockPosition,
        { ticker: "C", weight: 40, oneYearChangePercent: 10, dividendYieldPercent: 1.0 } as StockPosition,
      ]
    };
    // Returns: [25, 15, 10]. Mean = 16.67
    // Variance = ((25-16.67)^2 + (15-16.67)^2 + (10-16.67)^2) / 3
    //          = (69.39 + 2.79 + 44.49) / 3 = 38.89
    // StdDev = 6.24
    // With diversification factor 0.7: 6.24 * 0.7 = 4.37
    const result = estimateVolatility(multiPositionPortfolio);
    expect(result).toBeCloseTo(4.37, 1);
  });
});

describe('calculateSharpeRatio', () => {
  it('returns null when volatility cannot be estimated', () => {
    // Our mock only has 2 positions, so volatility will be null
    const result = calculateSharpeRatio(mockPortfolio);
    expect(result).toBeNull();
  });

  it('calculates Sharpe ratio with enough positions', () => {
    const multiPositionPortfolio: GeneratedPortfolio = {
      ...mockPortfolio,
      positions: [
        { ticker: "A", weight: 30, oneYearChangePercent: 25, dividendYieldPercent: 1.5 } as StockPosition,
        { ticker: "B", weight: 30, oneYearChangePercent: 15, dividendYieldPercent: 2.0 } as StockPosition,
        { ticker: "C", weight: 40, oneYearChangePercent: 10, dividendYieldPercent: 1.0 } as StockPosition,
      ]
    };
    // 1Y return: (30*25 + 30*15 + 40*10)/100 = (750+450+400)/100 = 16
    // Projected return = 16 - 0.10 = 15.9
    // Returns: [25, 15, 10]. Mean = 16.67
    // Variance = ((25-16.67)^2 + (15-16.67)^2 + (10-16.67)^2) / 3
    //          = (69.39 + 2.79 + 44.49) / 3 = 38.89
    // StdDev = 6.24
    // Volatility = 6.24 * 0.7 = 4.37
    // Risk-free rate = 4.25%
    // Sharpe = (15.9 - 4.25) / 4.37 = 2.67
    const result = calculateSharpeRatio(multiPositionPortfolio);
    expect(result).not.toBeNull();
    expect(result).toBeCloseTo(2.67, 1);
  });
});

describe('calculateAllMetrics', () => {
  it('returns formatted metrics object', () => {
    const result = calculateAllMetrics(mockPortfolio);

    // Projected return should be formatted
    expect(result.projectedReturn).toBe('+14.9%');

    // Dividend yield should be formatted
    expect(result.dividendYield).toBe('1.50%');

    // Sharpe ratio should be null (not enough positions for volatility)
    expect(result.sharpeRatio).toBeNull();

    // Volatility should be null (only 2 positions)
    expect(result.annualizedVolatility).toBeNull();
  });
});
