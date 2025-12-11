
import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { GeneratedPortfolio } from '../types';
import { TrendingUp, AlertCircle, AlertTriangle } from 'lucide-react';
import { calculateWeightedReturn, generateBacktestData } from '../utils/calculations';

interface PerformanceComparisonProps {
  portfolio: GeneratedPortfolio;
}

export const PerformanceComparison: React.FC<PerformanceComparisonProps> = ({ portfolio }) => {
  const { benchmark5YearReturn } = portfolio.metrics;

  const fund5Y = calculateWeightedReturn(portfolio, 'fiveYearChangePercent');

  // Check if we have enough data (Must have at least 5Y and 1Y for a decent chart)
  const hasEnoughData = typeof fund5Y === 'number' && typeof benchmark5YearReturn === 'number';

  // Calculate Alpha (5 Year Total)
  const alpha = hasEnoughData ? (fund5Y! - benchmark5YearReturn!) : 0;

  const data = useMemo(() => generateBacktestData(portfolio), [portfolio]);

  return (
    <div className="bg-fin-card rounded-lg border border-fin-border p-6 shadow-lg">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
           <div className="flex items-center gap-2 mb-1">
             <TrendingUp className="w-5 h-5 text-fin-accent" />
             <h3 className="text-lg font-semibold text-white">Historical Backtest (5Y)</h3>
           </div>
           <p className="text-sm text-fin-mute">
             {hasEnoughData 
               ? "Simulated growth of $10,000 using real-time historical anchors (1Y, 3Y, 5Y)"
               : "Insufficient data to generate accurate backtest"}
           </p>
        </div>
        
        {hasEnoughData && (
          <div className="flex gap-6 mt-4 md:mt-0 bg-fin-bg p-3 rounded-lg border border-fin-border">
             <div className="text-right">
               <span className="block text-xs text-fin-mute uppercase">S&P 500</span>
               <span className="font-mono font-bold text-fin-text">
                 {benchmark5YearReturn! > 0 ? '+' : ''}{benchmark5YearReturn?.toFixed(1)}%
               </span>
             </div>
             <div className="w-px bg-fin-border"></div>
             <div className="text-right">
               <span className="block text-xs text-fin-mute uppercase">ClimateShift</span>
               <span className="font-mono font-bold text-fin-accent">
                 {fund5Y! > 0 ? '+' : ''}{fund5Y!.toFixed(1)}%
               </span>
             </div>
             <div className="w-px bg-fin-border"></div>
             <div className="text-right">
               <span className="block text-xs text-fin-mute uppercase">Alpha</span>
               <span className={`font-mono font-bold ${alpha >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                 {alpha > 0 ? '+' : ''}{alpha.toFixed(1)}%
               </span>
             </div>
          </div>
        )}
      </div>

      <div className="h-[350px] w-full flex items-center justify-center bg-fin-bg/20 rounded-lg">
        {hasEnoughData ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis 
                dataKey="year" 
                stroke="#94a3b8" 
                fontSize={12} 
                tickMargin={10} 
                // Only show ticks when year changes to avoid clutter
                ticks={data.filter((d, i) => i === 0 || d.dateObj.getMonth() === 0).map(d => d.year)}
                type="number"
                domain={['dataMin', 'dataMax']}
                tickFormatter={(tick) => tick.toString()}
              />
              <YAxis 
                stroke="#94a3b8" 
                fontSize={12} 
                tickFormatter={(value) => `$${value/1000}k`}
                domain={['auto', 'auto']}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
                itemStyle={{ fontFamily: 'monospace' }}
                labelStyle={{ marginBottom: '0.5rem', color: '#94a3b8' }}
                labelFormatter={(value, payload) => payload[0]?.payload.dateLabel}
                formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
              />
              <Legend verticalAlign="top" height={36} />
              <Line 
                type="monotone" 
                name="S&P 500 (Benchmark)" 
                dataKey="sp500" 
                stroke="#64748b" 
                strokeWidth={2} 
                dot={false}
                strokeDasharray="5 5"
              />
              <Line 
                type="monotone" 
                name="ClimateShift Alpha (Reconstructed)" 
                dataKey="fund" 
                stroke="#10b981" 
                strokeWidth={3} 
                dot={false}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center text-fin-mute opacity-50">
             <AlertTriangle className="w-12 h-12 mb-4" />
             <h4 className="text-lg font-medium">Data Unavailable</h4>
             <p className="max-w-sm text-center text-sm mt-2">
               Unable to verify 5-year historical returns for key portfolio constituents or benchmark. Simulation disabled to ensure accuracy.
             </p>
          </div>
        )}
      </div>
      
      {hasEnoughData && (
        <div className="mt-4 flex items-start gap-2 bg-fin-bg/30 p-3 rounded text-xs text-fin-mute">
           <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
           <p>
             **Methodology:** This backtest reconstructs the portfolio's 5-year performance by calculating the weighted average total returns of constituents at 1-year, 3-year, and 5-year intervals. It connects these real data anchors with monthly interpolation to reflect changing momentum periods, contrasting accurately against the S&P 500.
           </p>
        </div>
      )}
    </div>
  );
};
