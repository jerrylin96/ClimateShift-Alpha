
import React, { useMemo } from 'react';
import { Target, Shield, Zap, RefreshCw, Layers, Lock } from 'lucide-react';

interface ControlPanelProps {
  onGenerate: () => void;
  onRequestRebalance: () => void;
  onRefresh?: () => void;
  onClear?: () => void;
  isGenerating: boolean;
  loadingStatus?: string;
  isRefreshing?: boolean;
  hasPortfolio: boolean;
  headlines?: any[]; // Kept for prop compatibility but unused in UI
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ 
  onGenerate, 
  onRequestRebalance, 
  onRefresh,
  onClear,
  isGenerating,
  loadingStatus,
  isRefreshing, 
  hasPortfolio
}) => {
  
  const handleAction = () => {
    if (hasPortfolio) {
      onRequestRebalance();
    } else {
      onGenerate();
    }
  };

  // Determine width based on status string (approximate progress mapping)
  const progressWidth = useMemo(() => {
     if (!loadingStatus) return '0%';
     const lower = loadingStatus.toLowerCase();
     if (lower.includes("initializing")) return '15%';
     if (lower.includes("optimiz") || lower.includes("construct")) return '45%';
     if (lower.includes("fetching") || lower.includes("market") || lower.includes("connecting")) return '70%';
     if (lower.includes("news") || lower.includes("analyz") || lower.includes("repair")) return '90%';
     if (lower.includes("finaliz")) return '95%';
     return '10%';
  }, [loadingStatus]);

  return (
    <div className="bg-fin-card rounded-lg border border-fin-border p-6 shadow-lg h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Target className="h-5 w-5 text-fin-accent mr-2" />
          <h2 className="text-lg font-semibold text-white">Strategy Overview</h2>
        </div>
      </div>
      
      <div className="space-y-6 flex-grow">
        <div className="bg-fin-bg/50 rounded-md p-4 border border-fin-border">
          <h3 className="text-fin-accent font-mono text-sm uppercase tracking-wider mb-2">ClimateShift Alpha</h3>
          <p className="text-sm text-fin-mute leading-relaxed">
            A high-conviction equity strategy designed to outperform the S&P 500 while strictly eliminating fossil fuel exposure, predatory industries, and companies vulnerable to AI disruption.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-start">
            <Shield className="h-5 w-5 text-fin-accent mt-0.5 mr-3 shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-white">Defensive Core</h4>
              <p className="text-xs text-fin-mute mt-1">
                Anchored by low-volatility "Stabilizers"—tech and consumer giants with validated Net Zero pathways—to ensure liquidity and reduce beta.
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <Zap className="h-5 w-5 text-fin-accent mt-0.5 mr-3 shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-white">Growth Satellite</h4>
              <p className="text-xs text-fin-mute mt-1">
                Targeted exposure to high-growth renewable infrastructure and circular economy leaders with proven revenue models.
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <Lock className="h-5 w-5 text-fin-accent mt-0.5 mr-3 shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-white">Expense Ratio Guarantee</h4>
              <p className="text-xs text-fin-mute mt-1">
                The expense ratio is locked at 0.10% and will never exceed that amount.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-8 mt-auto">
        {/* Clear Button */}
        {hasPortfolio && onClear && !isGenerating && (
           <button
             onClick={onClear}
             className="w-full text-xs text-fin-mute hover:text-fin-danger py-2 mb-2 transition-colors flex items-center justify-center"
           >
             Clear Portfolio
           </button>
        )}

        {/* Refresh Button - Prominently placed above Rebalance */}
        {hasPortfolio && onRefresh && !isGenerating && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="w-full flex items-center justify-center py-3 rounded-md font-semibold text-fin-text text-sm border border-fin-border hover:bg-fin-border hover:text-white transition-all mb-3 shadow-sm group"
          >
            <RefreshCw className={`h-4 w-4 mr-2 text-fin-mute group-hover:text-fin-accent transition-colors ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing && loadingStatus ? loadingStatus : 'Refresh Real-Time Data'}
          </button>
        )}

        {/* Main Action Area */}
        {isGenerating ? (
          <div className="w-full py-2 flex flex-col items-center">
            {/* Progress Bar - Glowing, Stationary Pulse */}
            <div className="h-4 w-full bg-fin-bg rounded-full overflow-hidden mb-3 border border-fin-border relative">
               <div 
                 className="h-full bg-fin-accent transition-all duration-700 ease-out relative shadow-[0_0_15px_rgba(16,185,129,0.8)] animate-pulse" 
                 style={{ width: progressWidth }}
               >
               </div>
            </div>
            {/* Status Text - Italicized */}
            <p className="text-center text-xs text-fin-mute italic font-medium animate-pulse">
              {loadingStatus || "Processing..."}
            </p>
          </div>
        ) : (
          <button
            onClick={handleAction}
            disabled={isRefreshing}
            className={`w-full flex items-center justify-center py-4 rounded-md font-semibold text-white text-lg transition-all ${
               hasPortfolio
                ? 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/20 hover:scale-[1.02]'
                : 'bg-fin-accent hover:bg-emerald-600 shadow-lg shadow-emerald-900/20 hover:scale-[1.02]'
            }`}
          >
            {hasPortfolio ? (
              <>
                <Layers className="h-5 w-5 mr-2" />
                <span>Rebalance ETF</span>
              </>
            ) : (
              <>
                <Target className="h-5 w-5 mr-2" />
                <span>Construct ETF</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
