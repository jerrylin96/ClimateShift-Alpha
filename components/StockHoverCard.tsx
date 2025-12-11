
import React, { useMemo } from 'react';
import { AreaChart, Area, ResponsiveContainer, YAxis, Tooltip, XAxis } from 'recharts';
import { StockPosition } from '../types';
import { AlertCircle } from 'lucide-react';

interface StockHoverCardProps {
  stock: StockPosition;
  position: { x: number; y: number };
}

export const StockHoverCard: React.FC<StockHoverCardProps> = ({ stock, position }) => {
  // STRICT CHECK: Do not show fake data.
  const hasData = typeof stock.currentPrice === 'number' && typeof stock.fiveYearChangePercent === 'number';

  const currentPrice = stock.currentPrice || 0;
  const fiveYearChange = stock.fiveYearChangePercent || 0;

  const chartData = useMemo(() => {
    if (!hasData) return [];
    
    // Calculate 5Y ago price
    // Start = End / (1 + pct)
    const startPrice = currentPrice / (1 + (fiveYearChange/100));
    const now = new Date();
    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(now.getFullYear() - 5);

    // We strictly plot the trend between the two known points.
    // No simulated noise.
    return [
      { 
        date: fiveYearsAgo.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }), 
        price: startPrice 
      },
      { 
        date: now.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) + ' (Live)', 
        price: currentPrice 
      }
    ];
  }, [currentPrice, fiveYearChange, hasData]);
  
  const is5YearPositive = fiveYearChange >= 0;
  const chartColor = is5YearPositive ? '#10b981' : '#ef4444';

  const dayChange = stock.dayChangePercent || 0;
  const isDayPositive = dayChange >= 0;

  // --- Smart Positioning Logic ---
  const CARD_WIDTH = 320; // matches w-80 (20rem)
  const CARD_EST_HEIGHT = 300; // approximate max height including content
  const SCREEN_MARGIN = 16; // Safety buffer from screen edges

  let left = position.x + 20; // Default: to right of cursor
  let top = position.y + 20;  // Default: below cursor

  if (typeof window !== 'undefined') {
    const { innerWidth, innerHeight } = window;
    
    // Horizontal Positioning
    if (innerWidth < 768) {
       // Mobile/Portrait: Center horizontally for best visibility
       // This prevents it from being cut off on the left or right edge
       left = (innerWidth - CARD_WIDTH) / 2;
    } else {
       // Desktop: Follow cursor but flip/clamp
       if (left + CARD_WIDTH > innerWidth - SCREEN_MARGIN) {
         // Flip to left of cursor
         left = position.x - CARD_WIDTH - 20;
       }
       
       // Clamp to ensure it doesn't go off-screen
       left = Math.max(SCREEN_MARGIN, Math.min(left, innerWidth - CARD_WIDTH - SCREEN_MARGIN));
    }
    
    // Final safety check for very small screens
    left = Math.max(4, left);

    // Vertical Positioning
    // Flip up if bottom overflows
    if (top + CARD_EST_HEIGHT > innerHeight - SCREEN_MARGIN) {
      top = position.y - CARD_EST_HEIGHT - 10;
    }
    // Clamp top to avoid going under header or off screen
    top = Math.max(SCREEN_MARGIN + 60, Math.min(top, innerHeight - CARD_EST_HEIGHT - SCREEN_MARGIN));
  }

  return (
    <div 
      className="fixed z-[60] w-80 bg-fin-card border border-fin-border rounded-xl shadow-2xl p-4 pointer-events-none animate-fade-in"
      style={{ left, top }}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="text-xl font-bold text-white font-mono">{stock.ticker}</h4>
          <span className="text-xs text-fin-mute">{stock.name}</span>
        </div>
        <div className="text-right">
           {hasData ? (
             <>
               <div className="flex items-center justify-end gap-2">
                 <span className="relative flex h-2 w-2">
                   <span className="relative inline-flex rounded-full h-2 w-2 bg-fin-accent"></span>
                 </span>
                 <span className="text-2xl font-mono font-bold text-white tracking-tight">
                   ${currentPrice.toFixed(2)}
                 </span>
               </div>
               
               <div className="flex flex-col text-right">
                 {/* Daily Change */}
                 <span className={`text-xs font-semibold ${isDayPositive ? 'text-fin-accent' : 'text-fin-danger'}`}>
                    {isDayPositive ? '+' : ''}{dayChange.toFixed(2)}% (Today)
                 </span>
                 {/* 5Y Trend */}
                 <span className={`text-[10px] ${is5YearPositive ? 'text-green-400/70' : 'text-red-400/70'}`}>
                    {is5YearPositive ? '▲' : '▼'} {Math.abs(fiveYearChange).toFixed(1)}% (5Y)
                 </span>
               </div>
             </>
           ) : (
             <div className="flex flex-col items-end">
                <span className="text-xl font-mono font-bold text-fin-mute tracking-tight">---</span>
                <span className="text-[10px] text-fin-mute/50">Data Unavailable</span>
             </div>
           )}
        </div>
      </div>

      <div className="h-28 w-full mb-3 bg-fin-bg/50 rounded-md overflow-hidden relative border border-fin-border/30 flex items-center justify-center">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <defs>
                <linearGradient id={`grad-${stock.ticker}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColor} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <YAxis domain={['auto', 'auto']} hide />
              <XAxis dataKey="date" hide />
              <Tooltip
                content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-fin-card border border-fin-border p-2 rounded shadow-xl text-xs">
                          <p className="text-fin-mute">{data.date}</p>
                          <p className="font-mono font-bold text-white">
                            ${data.price.toFixed(2)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
              />
              <Area 
                type="monotone" 
                dataKey="price" 
                stroke={chartColor} 
                strokeWidth={2}
                fill={`url(#grad-${stock.ticker})`} 
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-fin-mute/30 flex flex-col items-center gap-1">
             <AlertCircle className="w-5 h-5" />
             <span className="text-[10px] font-medium uppercase tracking-wider">Chart Unavailable</span>
          </div>
        )}
      </div>

      <div className="bg-fin-bg/30 rounded p-2 border border-fin-border/50">
        <span className="text-[10px] font-semibold text-fin-mute uppercase tracking-wider block mb-1">Inclusion Thesis</span>
        <p className="text-xs text-fin-text leading-snug italic line-clamp-3">
          "{stock.reason}"
        </p>
      </div>
    </div>
  );
};
