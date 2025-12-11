import React, { useState, useRef } from 'react';
import { GeneratedPortfolio, StockPosition } from '../types';
import { ShieldCheck, TrendingUp, Anchor } from 'lucide-react';
import { StockHoverCard } from './StockHoverCard';

interface StockTableProps {
  portfolio: GeneratedPortfolio;
  onSelectStock: (stock: StockPosition) => void;
}

const TypeIcon = ({ type }: { type: StockPosition['type'] }) => {
  switch (type) {
    case 'Core':
      return <ShieldCheck className="w-4 h-4 text-fin-accent" />;
    case 'Growth':
      return <TrendingUp className="w-4 h-4 text-blue-400" />;
    case 'Stabilizer':
      return <Anchor className="w-4 h-4 text-purple-400" />;
  }
};

export const StockTable: React.FC<StockTableProps> = ({ portfolio, onSelectStock }) => {
  const [hoveredStock, setHoveredStock] = useState<StockPosition | null>(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isScrolling = useRef(false);

  // Desktop Hover Handlers
  const handleMouseEnter = (e: React.MouseEvent, stock: StockPosition) => {
    setHoverPos({ x: e.clientX, y: e.clientY });
    setHoveredStock(stock);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // Update position to follow cursor slightly
    if (hoveredStock) {
      setHoverPos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseLeave = () => {
    setHoveredStock(null);
  };

  // Mobile Long Press Handlers
  const handleTouchStart = (e: React.TouchEvent, stock: StockPosition) => {
    isScrolling.current = false;
    const touch = e.touches[0];
    const x = touch.clientX;
    const y = touch.clientY;

    longPressTimer.current = setTimeout(() => {
      if (!isScrolling.current) {
        setHoverPos({ x, y });
        setHoveredStock(stock);
      }
    }, 500); // 500ms delay for long press
  };

  const handleTouchMove = () => {
    // If user scrolls, cancel the long press
    isScrolling.current = true;
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setHoveredStock(null);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setHoveredStock(null);
  };

  return (
    <div className="bg-fin-card rounded-lg border border-fin-border shadow-lg overflow-hidden relative">
      <div className="p-6 border-b border-fin-border">
        <h3 className="text-lg font-semibold text-white">Portfolio Constituents</h3>
        <p className="text-sm text-fin-mute mt-1">
          Click row for details. Hover for 5-year trend (Long press on mobile).
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-fin-mute">
          <thead className="bg-fin-bg text-xs uppercase font-medium text-fin-mute border-b border-fin-border">
            <tr>
              <th className="px-6 py-4">Ticker</th>
              <th className="px-6 py-4">Company</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Sector</th>
              <th className="px-6 py-4 text-right">Weight</th>
              <th className="px-6 py-4 text-center">ESG</th>
              <th className="px-6 py-4">Reasoning</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-fin-border">
            {portfolio.positions.map((pos) => (
              <tr 
                key={pos.ticker} 
                onClick={() => onSelectStock(pos)}
                onMouseEnter={(e) => handleMouseEnter(e, pos)}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onTouchStart={(e) => handleTouchStart(e, pos)}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className="hover:bg-fin-border/50 transition-colors cursor-pointer group select-none"
              >
                <td className="px-6 py-4 font-mono text-fin-text font-bold group-hover:text-fin-accent transition-colors">{pos.ticker}</td>
                <td className="px-6 py-4 text-fin-text">{pos.name}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <TypeIcon type={pos.type} />
                    <span>{pos.type}</span>
                  </div>
                </td>
                <td className="px-6 py-4">{pos.sector}</td>
                <td className="px-6 py-4 text-right font-mono text-fin-text">{pos.weight.toFixed(2)}%</td>
                <td className="px-6 py-4 text-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    pos.esgScore.includes('AAA') || pos.esgScore.includes('AA')
                      ? 'bg-fin-accent/10 text-fin-accent'
                      : 'bg-blue-500/10 text-blue-400'
                  }`}>
                    {pos.esgScore}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs italic opacity-80 max-w-xs truncate" title={pos.reason}>
                  {pos.reason}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hoveredStock && (
        <StockHoverCard stock={hoveredStock} position={hoverPos} />
      )}
    </div>
  );
};