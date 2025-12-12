import React, { useState } from 'react';
import { GeneratedPortfolio } from '../types';
import { ArrowUpRight, Activity, BarChart3, AlertCircle, Info } from 'lucide-react';
import { MetricAuditModal } from './MetricAuditModal';

interface MetricAuditSource {
  name: string;
  url?: string;
}

interface MetricAuditData {
  label: string;
  value: string;
  description: string;
  equation: string;
  explanation: string;
  sources: MetricAuditSource[];
}

interface MetricCardProps {
  label: string;
  value: string;
  icon: React.FC<{ className?: string }>;
  colorClass: string;
  subtext?: string;
  onClick: () => void;
}

interface SimulationResultsProps {
  portfolio: GeneratedPortfolio;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, icon: Icon, subtext, colorClass, onClick }) => (
  <div 
    onClick={onClick}
    className="bg-fin-bg rounded-lg border border-fin-border p-4 flex flex-col justify-between cursor-pointer hover:bg-fin-border/30 transition-all group relative overflow-hidden min-h-[110px]"
  >
    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
       <Info className="w-3 h-3 text-fin-mute" />
    </div>
    <div className="flex justify-between items-start mb-2">
      <span className="text-fin-mute text-xs uppercase font-semibold tracking-wider group-hover:text-white transition-colors">{label}</span>
      <Icon className={`w-4 h-4 ${colorClass}`} />
    </div>
    <div className="text-2xl font-mono font-bold text-white mb-1 group-hover:scale-[1.02] origin-left transition-transform">{value}</div>
    {subtext && <div className="text-[10px] text-fin-mute opacity-80">{subtext}</div>}
  </div>
);

export const SimulationResults: React.FC<SimulationResultsProps> = ({ portfolio }) => {
  const { metrics, narrative } = portfolio;
  const [selectedMetric, setSelectedMetric] = useState<MetricAuditData | null>(null);

  // Define audit data for each metric with rigorous detail
  const auditDataDefinitions: Record<string, MetricAuditData> = {
    return: {
      label: "Projected Annual Return (Alpha)",
      value: metrics.projectedReturn,
      description: "Based on Analyst Consensus",
      equation: `Net_Expected_Return = [ Σ (w_i × R_expected_i) ] - Expense_Ratio\n\nVariables:\n  w_i = Weight of holding i (See Portfolio Table)\n  R_expected_i = (Target_Price_Mean_12M / P_current) - 1\n  Expense_Ratio = 0.10% (Locked Cap)`,
      explanation: "This calculation aggregates the 12-month forward return potential based on institutional analyst consensus price targets (FactSet/Refinitiv Mean). The model calculates the weighted average upside of every constituent stock relative to its real-time price, then subtracts the capped 10bps expense ratio. This assumes full realization of analyst targets.",
      sources: [
        { name: "Data: FactSet Consensus Estimates", url: "https://www.factset.com/data/consensus-estimates" },
        { name: "Methodology: CAPM & Alpha Generation", url: "https://www.investopedia.com/terms/c/capm.asp" },
        { name: "SEC EDGAR (10-K Filings for Fundamentals)", url: "https://www.sec.gov/edgar/search/" },
        { name: "Morningstar ETF Expense Benchmarks", url: "https://www.morningstar.com/etfs" }
      ]
    },
    sharpe: {
      label: "Sharpe Ratio (Ex-Ante)",
      value: metrics.sharpeRatio,
      description: "Risk-Adjusted Efficiency",
      equation: `Sharpe = ( E[R_portfolio] - R_risk_free ) / σ_portfolio\n\nVariables:\n  E[R_p] = Projected Annual Return (see above)\n  R_f = US 10-Year Treasury Yield (~4.25%)\n  σ_p = √ [ w' · Σ · w ] (Portfolio Volatility)\n  Σ = Covariance Matrix (60-month historical)`,
      explanation: "The Sharpe Ratio measures the excess return per unit of deviation (risk). We use the current US 10-Year Treasury Yield as the risk-free rate proxy. The portfolio volatility (denominator) is derived from the covariance matrix of the 5-year historical returns of the selected assets, accounting for the diversification benefit between uncorrelated sectors.",
      sources: [
        { name: "US Dept of Treasury (Daily Yield Curve)", url: "https://home.treasury.gov/resource-center/data-chart-center/interest-rates/TextView?type=daily_treasury_yield_curve" },
        { name: "Modern Portfolio Theory (Markowitz)", url: "https://www.investopedia.com/terms/m/modernportfoliotheory.asp" },
        { name: "CBOE Volatility Index (VIX) Methodology", url: "https://www.cboe.com/tradable_products/vix/" }
      ]
    },
    yield: {
      label: "Dividend Yield (TTM)",
      value: metrics.dividendYield,
      description: "Income Component",
      equation: `Portfolio_Yield = Σ [ w_i × ( Div_Annual_i / Price_i ) ]\n\nVariables:\n  Div_Annual_i = Trailing 12-Month Dividends per Share\n  Price_i = Real-time Market Price`,
      explanation: "The weighted average of the trailing twelve-month (TTM) dividend yields of all constituent holdings. This represents the raw income generation potential of the fund, independent of capital appreciation. We use TTM actuals rather than forward projections to remain conservative.",
      sources: [
        { name: "Nasdaq Dividend History Database", url: "https://www.nasdaq.com/market-activity/stocks/screener?exchange=nasdaq&letter=0&render=download" },
        { name: "SEC Filings (Dividend Declarations)", url: "https://www.sec.gov/edgar/search/" },
        { name: "Company Investor Relations Portals" }
      ]
    }
  };

  return (
    <>
      <div className="bg-fin-card rounded-lg border border-fin-border p-6 shadow-lg h-full flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Projected Performance</h3>
          <span className="text-xs bg-fin-accent/10 text-fin-accent px-2 py-1 rounded border border-fin-accent/20">
            Model: Gemini 2.5 Flash
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 flex-grow">
          <MetricCard
            label="Proj. Annual Return"
            value={metrics.projectedReturn}
            icon={ArrowUpRight}
            colorClass="text-fin-accent"
            subtext="Targeting S&P 500 alpha"
            onClick={() => setSelectedMetric(auditDataDefinitions.return)}
          />
          <MetricCard
            label="Sharpe Ratio"
            value={metrics.sharpeRatio}
            icon={Activity}
            colorClass="text-blue-400"
            subtext="Risk-adjusted return"
            onClick={() => setSelectedMetric(auditDataDefinitions.sharpe)}
          />
          <MetricCard
            label="Dividend Yield"
            value={metrics.dividendYield}
            icon={BarChart3}
            colorClass="text-purple-400"
            subtext="Income generation"
            onClick={() => setSelectedMetric(auditDataDefinitions.yield)}
          />
        </div>

        <div className="bg-fin-bg/50 border border-fin-border rounded-md p-4 mb-auto">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-5 h-5 text-fin-mute mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-white mb-1">Fund Narrative</h4>
              <p className="text-sm text-fin-mute leading-relaxed">
                {narrative}
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-4 text-[10px] text-fin-mute text-center italic pt-2 border-t border-fin-border/30">
          DISCLAIMER: This is a simulation for educational purposes only. Past performance does not guarantee future results.
          Not investment advice. Click any metric above to view the audit trail, calculation equations, and data sources.
        </div>
      </div>

      <MetricAuditModal 
        isOpen={!!selectedMetric}
        onClose={() => setSelectedMetric(null)}
        data={selectedMetric}
      />
    </>
  );
};