
import React from 'react';
import { TrendingUp } from 'lucide-react';
import { Logo } from './Logo';

export const Header: React.FC = () => {
  return (
    <header className="bg-fin-card border-b border-fin-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Logo className="h-9 w-9 text-fin-accent mr-3" />
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">ClimateShift <span className="text-fin-accent">Alpha</span></h1>
              <p className="text-xs text-fin-mute uppercase tracking-widest">Quantitative Sustainable Finance</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-fin-mute text-sm">
              <TrendingUp className="h-4 w-4 mr-2" />
              <span>S&P 500: Neutral</span>
            </div>
            <div className="h-4 w-px bg-fin-border"></div>
            <div className="text-xs text-fin-mute">v1.2.0-stable</div>
          </div>
        </div>
      </div>
    </header>
  );
};
