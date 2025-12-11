
import React from 'react';
import { GeneratedPortfolio } from '../types';

interface PortfolioChartProps {
  portfolio: GeneratedPortfolio;
}

// Okabe-Ito accessible color palette adapted for dark backgrounds
const ACCESSIBLE_COLORS = [
  '#56B4E9', // Sky Blue
  '#E69F00', // Orange
  '#009E73', // Bluish Green
  '#CC79A7', // Reddish Purple
  '#F0E442', // Yellow (Bright)
  '#0072B2', // Blue
  '#D55E00', // Vermilion
  '#999999', // Grey
];

export const PortfolioChart: React.FC<PortfolioChartProps> = ({ portfolio }) => {
  // Aggregate data by Sector
  const sectorData = portfolio.positions.reduce((acc, pos) => {
    const existing = acc.find(item => item.name === pos.sector);
    if (existing) {
      existing.value += pos.weight;
    } else {
      acc.push({ name: pos.sector, value: pos.weight });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  // Sort by weight descending (Largest to Smallest)
  sectorData.sort((a, b) => b.value - a.value);

  return (
    <div className="bg-fin-card rounded-lg border border-fin-border p-6 shadow-lg h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Sector Allocation</h3>
        <span className="text-xs text-fin-mute bg-fin-bg px-2 py-1 rounded border border-fin-border">
          {sectorData.length} Sectors
        </span>
      </div>
      
      <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 space-y-5">
        {sectorData.map((sector, index) => {
          // Cycle through the accessible palette
          const color = ACCESSIBLE_COLORS[index % ACCESSIBLE_COLORS.length];
          
          return (
            <div key={sector.name} className="group">
              <div className="flex justify-between items-end mb-2">
                <div className="flex items-center gap-3">
                   {/* Color Indicator */}
                   <div 
                     className="w-3 h-3 rounded-sm shadow-sm" 
                     style={{ backgroundColor: color }}
                   ></div>
                   <span className="text-sm font-medium text-fin-text group-hover:text-white transition-colors">
                     {sector.name}
                   </span>
                </div>
                <span className="font-mono text-sm font-bold text-white">
                  {sector.value.toFixed(2)}%
                </span>
              </div>
              
              {/* Bar Visualization */}
              <div className="w-full bg-fin-bg h-2.5 rounded-full overflow-hidden border border-fin-border/50">
                 <div 
                   className="h-full rounded-full transition-all duration-1000 ease-out relative"
                   style={{ 
                     width: `${sector.value}%`, 
                     backgroundColor: color 
                   }}
                 >
                   {/* Shine effect for visual polish */}
                   <div className="absolute inset-0 bg-white/20 skew-x-12 -translate-x-full group-hover:animate-shimmer"></div>
                 </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-6 pt-4 border-t border-fin-border text-xs text-fin-mute text-center">
        *Allocations optimized for diversification. Colors are accessible-friendly.
      </div>
    </div>
  );
};
