

import { describe, it, expect } from 'vitest';
import { calculateWeightedReturn, generateBacktestData } from '../utils/calculations';
import { GeneratedPortfolio, StockPosition } from '../types';

const mockPortfolio: GeneratedPortfolio = {
  name: "Test Fund",
  description: "Test",
  narrative: "Narrative",
  metrics: {
    projectedReturn: "10%",
    projectedVolatility: "Med",
    dividendYield: "1%",
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
      fiveYearChangePercent: 60
    } as StockPosition,
    {
      ticker: "B",
      weight: 50,
      oneYearChangePercent: 10,
      threeYearChangePercent: 20,
      fiveYearChangePercent: 40
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