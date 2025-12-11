import React, { useState, useMemo } from 'react';
import { X, ExternalLink, RefreshCw, TrendingUp, TrendingDown, Sparkles } from 'lucide-react';
import { AreaChart, Area, Tooltip, ResponsiveContainer, ReferenceLine, YAxis, XAxis, CartesianGrid } from 'recharts';
import { StockPosition, StockAnalysisResult } from '../types';

interface StockDetailModalProps {
  stock: StockPosition;
  analysis: StockAnalysisResult | null;
  loading: boolean;
  onClose: () => void;
}

const TIME_RANGES = ['1W', '1M', '3M', '1Y', '5Y'];

// Helper to calculate a past date string
const getPastDate = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
};

const getIsoDate = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d; // Return Date object for sorting
};

export const StockDetailModal: React.FC<StockDetailModalProps> = ({ stock, analysis, loading, onClose }) => {
  const [timeRange, setTimeRange] = useState('1M');
  const [showAnalysis, setShowAnalysis] = useState(false);
  
  // Resolve Current Price
  const currentPrice = useMemo(() => {
    if (analysis?.performance) {
       // If we have performance data, we likely extracted the price in the service or can infer it, 
       // but for now we rely on the prop passing or the enrichment phase.
       // The service `analyzeStock` currently parses "content" for text. 
       // We'll trust `stock.currentPrice` from the portfolio enrichment first for consistency, 
       // or try to find it in analysis content if that fails.
    }
    
    // 1. Try Portfolio fetched price (most reliable from the batch fetch)
    if (stock.currentPrice) return stock.currentPrice;

    // 2. Fallback to parsing analysis content
    if (analysis?.content) {
       const match = analysis.content.match(/\$([\d,]+\.\d{2})/);
       if (match) return parseFloat(match[1].replace(/,/g, ''));
    }

    return null;
  }, [analysis, stock.currentPrice]);


  // Resolve Performance Data for the selected range (for the percentage display)
  const performancePercent = useMemo(() => {
    if (!analysis?.performance) return null;
    
    switch (timeRange) {
      case '1W': return analysis.performance.oneWeek;
      case '1M': return analysis.performance.oneMonth;
      case '3M': return analysis.performance.threeMonth;
      case '1Y': return analysis.performance.oneYear;
      case '5Y': return analysis.performance.fiveYear;
      default: return null;
    }
  }, [timeRange, analysis]);

  // Generate REAL Data Points based on known history
  const chartData = useMemo(() => {
    if (!currentPrice || !analysis?.performance) return [];
    
    const points = [];
    const perf = analysis.performance;

    // Helper to add point if data exists
    const addPoint = (daysAgo: number, pctChange: number | undefined) => {
      if (typeof pctChange === 'number') {
        // Price_old = Price_now / (1 + pct/100)
        const price = currentPrice / (1 + (pctChange / 100));
        const dateObj = getIsoDate(daysAgo);
        points.push({
          dateObj: dateObj,
          date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: daysAgo > 360 ? '2-digit' : undefined }),
          fullDate: dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' }),
          price: price,
          isReal: true
        });
      }
    };

    // Always add "Now"
    const now = new Date();
    points.push({
      dateObj: now,
      date: 'Now',
      fullDate: now.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' }) + ' (Live)',
      price: currentPrice,
      isReal: true
    });

    // Add historical points
    addPoint(7, perf.oneWeek);
    addPoint(30, perf.oneMonth);
    addPoint(90, perf.threeMonth);
    addPoint(365, perf.oneYear);
    addPoint(365 * 5, perf.fiveYear);

    // Sort by date
    points.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

    // Filter based on selected Range
    const cutoffDate = new Date();
    switch (timeRange) {
      case '1W': cutoffDate.setDate(cutoffDate.getDate() - 8); break;
      case '1M': cutoffDate.setDate(cutoffDate.getDate() - 32); break;
      case '3M': cutoffDate.setDate(cutoffDate.getDate() - 95); break;
      case '1Y': cutoffDate.setDate(cutoffDate.getDate() - 370); break;
      case '5Y': cutoffDate.setDate(cutoffDate.getDate() - (365 * 5 + 10)); break;
    }

    const filtered = points.filter(p => p.dateObj >= cutoffDate);
    
    // Add index to create evenly spaced points regardless of time gap
    return filtered.map((p, i) => ({ ...p, index: i }));
  }, [currentPrice, analysis, timeRange]);

  const hasData = chartData.length > 1; // Need at least 2 points for a line
  const isPositive = (performancePercent || 0) >= 0;
  const color = isPositive ? '#10b981' : '#ef4444'; 

  if (!stock) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm transition-opacity duration-300" onClick={onClose}>
      <div 
        className="bg-fin-card border border-fin-border rounded-xl shadow-2xl w-full max-w-7xl h-[85vh] flex flex-col overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Section */}
        <div className="px-6 py-4 sm:px-8 sm:py-6 border-b border-fin-border bg-fin-card shrink-0 flex justify-between items-start">
          <div>
             <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1">
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{stock.ticker}</h2>
                <span className="text-fin-mute text-sm sm:text-lg">{stock.name}</span>
                 <span className={`text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded border ${
                    stock.type === 'Core' ? 'border-fin-accent text-fin-accent bg-fin-accent/10' :
                    stock.type === 'Growth' ? 'border-blue-400 text-blue-400 bg-blue-400/10' :
                    'border-purple-400 text-purple-400 bg-purple-400/10'
                 } uppercase tracking-wide`}>
                  {stock.type}
                </span>
             </div>
             
             <div className="flex flex-wrap items-baseline gap-2 sm:gap-4 mt-2">
               {currentPrice ? (
                 <>
                  <span className={`text-4xl sm:text-5xl font-mono font-bold text-white tracking-tighter ${loading && !analysis ? 'animate-pulse opacity-50' : ''}`}>
                    ${currentPrice.toFixed(2)}
                  </span>
                  {hasData && (
                    <div className={`flex items-center ${isPositive ? 'text-fin-accent' : 'text-fin-danger'} font-medium text-base sm:text-lg`}>
                      {isPositive ? <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 mr-1" /> : <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 mr-1" />}
                      <span className="font-mono">
                        {isPositive ? '+' : ''}{performancePercent?.toFixed(2)}%
                      </span>
                      <span className="text-fin-mute text-xs sm:text-sm ml-2 font-normal opacity-70">Past {timeRange}</span>
                    </div>
                  )}
                 </>
               ) : (
                  <span className="text-4xl sm:text-5xl font-mono font-bold text-fin-mute tracking-tighter">
                    ---
                  </span>
               )}
              </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-fin-border rounded-full text-fin-mute hover:text-white transition-colors"
          >
            <X className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>
        </div>

        {/* Main Chart Area */}
        <div className="flex-1 relative bg-fin-bg w-full min-h-0 group">
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={color} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis 
                  dataKey="index" 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  tickMargin={10} 
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => chartData[val]?.date || ''}
                />
                <YAxis 
                  domain={['auto', 'auto']} 
                  hide={false}
                  stroke="#94a3b8"
                  fontSize={11}
                  tickFormatter={(value) => `$${value.toFixed(0)}`}
                  width={50}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-fin-card border border-fin-border p-3 rounded shadow-xl">
                          <p className="text-xs text-fin-mute mb-1">{data.fullDate}</p>
                          <p className="text-lg font-mono font-bold text-white">
                            ${data.price.toFixed(2)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                  cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area 
                  type="linear" 
                  dataKey="price" 
                  stroke={color} 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorPrice)" 
                  animationDuration={1000}
                  dot={{ r: 4, fill: color, strokeWidth: 0 }}
                  activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center flex-col text-fin-mute/30">
               {loading && !analysis ? (
                 <div className="text-center">
                    <RefreshCw className="w-12 h-12 mb-4 animate-spin mx-auto text-fin-accent" />
                    <p className="text-lg font-medium text-fin-text">Fetching Live Data...</p>
                 </div>
               ) : (
                 <div className="text-center">
                    <TrendingUp className="w-16 h-16 mb-4 mx-auto" />
                    <p className="text-lg font-medium">Chart Data Unavailable</p>
                    <p className="text-sm">Real-time performance metrics could not be verified.</p>
                 </div>
               )}
            </div>
          )}

          {/* Analysis Slide-Up Panel */}
          {showAnalysis && (
            <div className="absolute inset-x-0 bottom-0 top-1/3 bg-fin-card/95 backdrop-blur-md border-t border-fin-border shadow-[0_-10px_40px_rgba(0,0,0,0.5)] transition-all animate-slide-up flex flex-col z-20">
              <div className="flex items-center justify-between p-4 border-b border-fin-border bg-fin-card/50">
                <div className="flex items-center gap-2 text-fin-accent">
                  <Sparkles className="w-4 h-4" />
                  <h3 className="font-semibold text-sm uppercase tracking-wider">AI Market Analysis</h3>
                </div>
                <button 
                  onClick={() => setShowAnalysis(false)}
                  className="text-xs text-fin-mute hover:text-white underline"
                >
                  Minimize
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                {analysis ? (
                  <div className="max-w-4xl mx-auto">
                     <div className="prose prose-invert prose-p:text-fin-text prose-headings:text-white max-w-none">
                        <div className="whitespace-pre-wrap font-sans leading-relaxed text-base sm:text-lg">
                          {analysis.content}
                        </div>
                      </div>

                      {/* Sources */}
                      {analysis.groundingChunks && analysis.groundingChunks.length > 0 && (
                        <div className="mt-8 pt-6 border-t border-fin-border">
                           <h4 className="text-xs font-semibold text-fin-mute uppercase mb-4">Verified Sources</h4>
                           <div className="flex flex-wrap gap-3">
                              {analysis.groundingChunks.map((chunk, idx) => (
                                chunk.web?.uri ? (
                                  <a 
                                    key={idx}
                                    href={chunk.web.uri} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center px-3 py-2 rounded-md bg-fin-bg border border-fin-border hover:border-fin-accent/50 hover:bg-fin-bg/80 transition-all group"
                                  >
                                    <ExternalLink className="w-3 h-3 text-fin-mute group-hover:text-fin-accent mr-2" />
                                    <span className="text-xs text-fin-mute group-hover:text-fin-text max-w-[200px] truncate">{chunk.web.title || chunk.web.uri}</span>
                                  </a>
                                ) : null
                              ))}
                           </div>
                        </div>
                      )}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-fin-mute opacity-50">
                    <RefreshCw className="w-8 h-8 mb-3 animate-spin" />
                    <p>Analyzing market data...</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="min-h-[5rem] bg-fin-card border-t border-fin-border shrink-0 flex flex-col sm:flex-row items-center justify-between px-4 sm:px-8 py-4 sm:py-0 gap-3 relative z-30">
           <div className="flex bg-fin-bg rounded-lg p-1 border border-fin-border overflow-x-auto max-w-full no-scrollbar w-full sm:w-auto">
              {TIME_RANGES.map((range) => {
                // Check if we have data for this range
                let rangeHasData = false;
                if (analysis?.performance) {
                  switch (range) {
                    case '1W': rangeHasData = typeof analysis.performance.oneWeek === 'number'; break;
                    case '1M': rangeHasData = typeof analysis.performance.oneMonth === 'number'; break;
                    case '3M': rangeHasData = typeof analysis.performance.threeMonth === 'number'; break;
                    case '1Y': rangeHasData = typeof analysis.performance.oneYear === 'number'; break;
                    case '5Y': rangeHasData = typeof analysis.performance.fiveYear === 'number'; break;
                  }
                }
                
                return (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    disabled={!rangeHasData}
                    className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-md transition-all whitespace-nowrap ${
                      timeRange === range 
                        ? 'bg-fin-border text-white shadow-sm' 
                        : 'text-fin-mute hover:text-fin-text hover:bg-fin-border/30'
                    } ${!rangeHasData ? 'opacity-30 cursor-not-allowed' : ''}`}
                    title={!rangeHasData ? "Data unavailable for this period" : ""}
                  >
                    {range}
                  </button>
                );
              })}
           </div>

           <button
             onClick={() => setShowAnalysis(!showAnalysis)}
             className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all ${
               showAnalysis 
                 ? 'bg-fin-accent text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                 : 'bg-fin-bg border border-fin-border text-fin-text hover:border-fin-accent hover:text-fin-accent'
             }`}
           >
             <Sparkles className="w-4 h-4" />
             <span>{showAnalysis ? 'Hide Insights' : 'AI Insights'}</span>
           </button>
        </div>
      </div>
    </div>
  );
};