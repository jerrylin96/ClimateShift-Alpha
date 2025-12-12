import React, { useState } from 'react';
import { GeneratedPortfolio } from '../types';
import { ArrowUpRight, Leaf, Activity, BarChart3, AlertCircle, Info, Calculator, Sparkles } from 'lucide-react';
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
  isCalculated?: boolean;
  onClick: () => void;
}

interface SimulationResultsProps {
  portfolio: GeneratedPortfolio;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, icon: Icon, subtext, colorClass, isCalculated, onClick }) => (
  <div
    onClick={onClick}
    className="bg-fin-bg rounded-lg border border-fin-border p-4 flex flex-col justify-between cursor-pointer hover:bg-fin-border/30 transition-all group relative overflow-hidden min-h-[110px]"
  >
    <div className="absolute top-2 right-2 flex items-center gap-1">
      {isCalculated !== undefined && (
        <span
          className={`flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full ${
            isCalculated
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
          }`}
          title={isCalculated ? 'Calculated from real market data' : 'AI estimate'}
        >
          {isCalculated ? <Calculator className="w-2.5 h-2.5" /> : <Sparkles className="w-2.5 h-2.5" />}
          {isCalculated ? 'CALC' : 'EST'}
        </span>
      )}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <Info className="w-3 h-3 text-fin-mute" />
      </div>
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
  const isCalc = metrics.isCalculated;

  const auditDataDefinitions: Record<string, MetricAuditData> = {
    return: {
      label: "Projected Annual Return",
      value: metrics.projectedReturn,
      description: isCalc?.projectedReturn ? "Calculated from Real Market Data" : "AI Estimate",
      equation: isCalc?.projectedReturn
        ? `Projected_Return = [ Σ (w_i × R_1Y_i) / Σ w_valid ] - Expense_Ratio\n\nVariables:\n  w_i = Weight of holding i\n  R_1Y_i = Actual 1-year return of holding i\n  w_valid = Sum of weights with valid data (must be >50%)\n  Expense_Ratio = 0.10%`
        : `Net_Expected_Return = [ Σ (w_i × R_expected_i) ] - Expense_Ratio\n\nVariables:\n  w_i = Weight of holding i (See Portfolio Table)\n  R_expected_i = (Target_Price_Mean_12M / P_current) - 1\n  Expense_Ratio = 0.10% (Locked Cap)`,
      explanation: isCalc?.projectedReturn
        ? "This value is calculated by taking the weighted average of actual 1-year returns for each portfolio holding, then subtracting the 0.10% expense ratio. The calculation requires >50% of portfolio weight to have valid return data. Uses trailing 1-year performance as a forward-looking proxy."
        : "This is an AI-generated estimate. The model estimates 12-month forward return potential based on general market conditions. For accurate calculations, ensure real-time data fetch completes successfully.",
      sources: isCalc?.projectedReturn
        ? [
            { name: "Real-time data via Google Search (Gemini)" },
            { name: "Methodology: Weighted Average Returns", url: "https://www.investopedia.com/terms/w/weightedaverage.asp" }
          ]
        : [
            { name: "AI Estimate (Gemini 2.5 Flash)" },
            { name: "Note: Real calculation requires successful data fetch" }
          ]
    },
    carbon: {
      label: "Carbon Intensity Reduction",
      value: metrics.carbonFootprintReduction,
      description: "AI Estimate (ESG data not available)",
      equation: `Reduction_Score = 1 - ( WACI_portfolio / WACI_benchmark )\n\nWACI = Σ [ w_i × ( Carbon_Emissions_Scope1+2_i / Revenue_i ) ]\n\nParameters:\n  Unit: Tons CO2e / $1M Revenue\n  WACI_benchmark (SPY): ~95.4 tCO2e/$M (Est. 2024)\n  Scope: 1 (Direct) + 2 (Energy Indirect)`,
      explanation: "⚠️ This value is an AI estimate. Accurate WACI calculation requires licensed ESG data from providers like MSCI, Sustainalytics, or CDP - which are not freely available via web search. The displayed value is based on the AI's assessment of the portfolio's climate-focused composition relative to the S&P 500.",
      sources: [
        { name: "⚠️ AI Estimate - ESG data requires paid subscription" },
        { name: "TCFD Technical Supplement", url: "https://assets.bbhub.io/company/sites/60/2017/06/FIN0364-TCFD-Technical-Supplement-A4_FINAL_062817.pdf" },
        { name: "CDP Climate Change Database (Paid)", url: "https://www.cdp.net/en/data" },
        { name: "MSCI ESG Ratings (Paid)", url: "https://www.msci.com/our-solutions/esg-investing" }
      ]
    },
    sharpe: {
      label: "Sharpe Ratio",
      value: metrics.sharpeRatio,
      description: isCalc?.sharpeRatio ? "Calculated from Real Data" : "AI Estimate",
      equation: isCalc?.sharpeRatio
        ? `Sharpe = ( R_projected - R_f ) / σ_estimated\n\nVariables:\n  R_projected = Weighted 1Y return - 0.10% expense\n  R_f = 4.25% (US 10-Year Treasury proxy)\n  σ_estimated = StdDev(position returns) × 0.7\n  0.7 = Diversification factor`
        : `Sharpe = ( E[R_portfolio] - R_risk_free ) / σ_portfolio\n\nVariables:\n  E[R_p] = Projected Annual Return (see above)\n  R_f = US 10-Year Treasury Yield (~4.25%)\n  σ_p = √ [ w' · Σ · w ] (Portfolio Volatility)\n  Σ = Covariance Matrix (60-month historical)`,
      explanation: isCalc?.sharpeRatio
        ? "Calculated using the projected return (weighted 1Y returns minus expense ratio), a 4.25% risk-free rate, and estimated volatility. Volatility is approximated using the standard deviation of individual position returns, multiplied by 0.7 to account for diversification benefits. This is a simplified estimation - true Sharpe calculation requires daily return data."
        : "This is an AI-generated estimate. Accurate Sharpe ratio calculation requires historical daily returns to compute proper portfolio volatility, which is not available via web search.",
      sources: isCalc?.sharpeRatio
        ? [
            { name: "Risk-free rate: US 10-Year Treasury (~4.25%)" },
            { name: "Volatility: Simplified cross-sectional estimation" },
            { name: "Methodology: Sharpe Ratio", url: "https://www.investopedia.com/terms/s/sharperatio.asp" }
          ]
        : [
            { name: "AI Estimate (Gemini 2.5 Flash)" },
            { name: "Note: Accurate calculation requires daily return data" }
          ]
    },
    yield: {
      label: "Dividend Yield (TTM)",
      value: metrics.dividendYield,
      description: isCalc?.dividendYield ? "Calculated from Real Data" : "AI Estimate",
      equation: isCalc?.dividendYield
        ? `Portfolio_Yield = [ Σ (w_i × Y_i) / Σ w_valid ] × 100\n\nVariables:\n  w_i = Weight of holding i\n  Y_i = TTM dividend yield of holding i\n  w_valid = Sum of weights with valid data (must be >50%)`
        : `Portfolio_Yield = Σ [ w_i × ( Div_Annual_i / Price_i ) ]\n\nVariables:\n  Div_Annual_i = Trailing 12-Month Dividends per Share\n  Price_i = Real-time Market Price`,
      explanation: isCalc?.dividendYield
        ? "Calculated as the weighted average of trailing twelve-month (TTM) dividend yields for each portfolio holding. Requires >50% of portfolio weight to have valid yield data. Stocks that don't pay dividends are included with 0% yield."
        : "This is an AI-generated estimate of the portfolio's dividend yield based on general knowledge of the constituent holdings.",
      sources: isCalc?.dividendYield
        ? [
            { name: "Real-time data via Google Search (Gemini)" },
            { name: "Methodology: Weighted Average", url: "https://www.investopedia.com/terms/w/weightedaverage.asp" }
          ]
        : [
            { name: "AI Estimate (Gemini 2.5 Flash)" },
            { name: "Note: Real calculation requires successful data fetch" }
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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 flex-grow">
          <MetricCard
            label="Proj. Annual Return"
            value={metrics.projectedReturn}
            icon={ArrowUpRight}
            colorClass="text-fin-accent"
            subtext={metrics.isCalculated?.projectedReturn ? "Based on 1Y weighted returns" : "Targeting S&P 500 alpha"}
            isCalculated={metrics.isCalculated?.projectedReturn}
            onClick={() => setSelectedMetric(auditDataDefinitions.return)}
          />
          <MetricCard
            label="Carbon Reduction"
            value={metrics.carbonFootprintReduction}
            icon={Leaf}
            colorClass="text-green-400"
            subtext="vs. broad market benchmark"
            isCalculated={metrics.isCalculated?.carbonFootprintReduction}
            onClick={() => setSelectedMetric(auditDataDefinitions.carbon)}
          />
          <MetricCard
            label="Sharpe Ratio"
            value={metrics.sharpeRatio}
            icon={Activity}
            colorClass="text-blue-400"
            subtext={metrics.isCalculated?.sharpeRatio ? "Risk-adjusted return" : "Risk-adjusted return"}
            isCalculated={metrics.isCalculated?.sharpeRatio}
            onClick={() => setSelectedMetric(auditDataDefinitions.sharpe)}
          />
          <MetricCard
            label="Dividend Yield"
            value={metrics.dividendYield}
            icon={BarChart3}
            colorClass="text-purple-400"
            subtext={metrics.isCalculated?.dividendYield ? "Weighted avg TTM yield" : "Income generation"}
            isCalculated={metrics.isCalculated?.dividendYield}
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