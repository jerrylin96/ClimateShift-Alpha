
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ControlPanel } from './components/ControlPanel';
import { PortfolioChart } from './components/PortfolioChart';
import { StockTable } from './components/StockTable';
import { SimulationResults } from './components/SimulationResults';
import { StockDetailModal } from './components/StockDetailModal';
import { RebalanceModal } from './components/RebalanceModal';
import { PerformanceComparison } from './components/PerformanceComparison';
import { NewsTicker } from './components/NewsTicker';
import { Logo } from './components/Logo';
import { ErrorBoundary } from './components/ErrorBoundary';
import { GeneratedPortfolio, StockPosition, StockAnalysisResult, NewsHeadline } from './types';
import { generateETFPortfolio, analyzeStock, refreshPortfolioPrices, fetchMarketHeadlines } from './services/geminiService';

const App: React.FC = () => {
  const [portfolio, setPortfolio] = useState<GeneratedPortfolio | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [marketHeadlines, setMarketHeadlines] = useState<NewsHeadline[]>([]);

  // Rebalance State
  const [isRebalanceModalOpen, setIsRebalanceModalOpen] = useState(false);

  // Stock Detail Modal State
  const [selectedStock, setSelectedStock] = useState<StockPosition | null>(null);
  const [stockAnalysis, setStockAnalysis] = useState<StockAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Initial Data Fetch & Load LocalStorage
  useEffect(() => {
    const loadHeadlines = async () => {
      const headlines = await fetchMarketHeadlines();
      setMarketHeadlines(headlines);
    };
    loadHeadlines();

    // Load saved portfolio
    const saved = localStorage.getItem('climateshift-portfolio');
    if (saved) {
      try {
        setPortfolio(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load saved portfolio', e);
      }
    }
  }, []);

  // Initial Construction
  const handleConstruct = async () => {
    setIsGenerating(true);
    setLoadingStatus("Initializing Engine...");
    setError(null);
    try {
      const result = await generateETFPortfolio(undefined, (status) => setLoadingStatus(status));
      setPortfolio(result);
      localStorage.setItem('climateshift-portfolio', JSON.stringify(result));
    } catch (err: any) {
      setError(err.message || 'Failed to generate portfolio. Please check your API key.');
    } finally {
      setIsGenerating(false);
      setLoadingStatus("");
    }
  };

  // Rebalancing
  const handleRebalanceRequest = () => {
    setIsRebalanceModalOpen(true);
  };

  const handleConfirmRebalance = async (preferences: string) => {
    setIsRebalanceModalOpen(false);
    setIsGenerating(true);
    setLoadingStatus("Processing Rebalance Request...");
    setError(null);
    try {
      // Pass user preferences to the service
      const result = await generateETFPortfolio(preferences, (status) => setLoadingStatus(status));
      setPortfolio(result);
      localStorage.setItem('climateshift-portfolio', JSON.stringify(result));
    } catch (err: any) {
      setError(err.message || 'Failed to rebalance portfolio. Please check your API key.');
    } finally {
      setIsGenerating(false);
      setLoadingStatus("");
    }
  };

  // Data Refresh
  const handleRefresh = async () => {
    if (!portfolio) return;
    setIsRefreshing(true);
    setLoadingStatus("Connecting to markets...");
    setError(null);
    try {
      // Pass the progress callback to show users what we are fixing
      const updatedPortfolio = await refreshPortfolioPrices(portfolio, (status) => setLoadingStatus(status));
      setPortfolio({ ...updatedPortfolio }); // Force react re-render
      localStorage.setItem('climateshift-portfolio', JSON.stringify(updatedPortfolio));
    } catch (err: any) {
      console.error(err);
      setError('Failed to refresh prices. Please try again.');
    } finally {
      setIsRefreshing(false);
      setLoadingStatus("");
    }
  };

  const handleClearPortfolio = () => {
    localStorage.removeItem('climateshift-portfolio');
    setPortfolio(null);
  };

  // Stock Detail Logic
  const handleSelectStock = async (stock: StockPosition) => {
    setSelectedStock(stock);
    setStockAnalysis(null);
    setIsAnalyzing(true);
    
    try {
      const result = await analyzeStock(stock.ticker);
      setStockAnalysis(result);
    } catch (err) {
      console.error("Failed to analyze stock", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedStock(null);
    setStockAnalysis(null);
  };

  return (
    <div className="min-h-screen bg-fin-bg text-fin-text font-sans pb-12">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Section: Controls and Chart/Intro */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
          
          {/* Left Column: Strategy & Controls */}
          <div className="lg:col-span-4 h-full">
            <ControlPanel
              onGenerate={handleConstruct}
              onRequestRebalance={handleRebalanceRequest}
              onRefresh={handleRefresh}
              onClear={handleClearPortfolio}
              isGenerating={isGenerating}
              loadingStatus={loadingStatus}
              isRefreshing={isRefreshing}
              hasPortfolio={!!portfolio}
            />
            {error && (
              <div className="mt-4 bg-fin-danger/10 border border-fin-danger text-fin-danger p-4 rounded-md text-sm">
                {error}
              </div>
            )}
          </div>

          {/* Right Column: News Ticker & Visualization */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* 1. News Ticker - Visually placed between Control Panel (Left) and Results (Below) in the grid flow */}
            <NewsTicker headlines={portfolio?.headlines || marketHeadlines} />

            {/* 2. Main Result Area */}
            <div className="flex-grow">
              {portfolio ? (
                <div className="h-full">
                   <ErrorBoundary>
                     <SimulationResults portfolio={portfolio} />
                   </ErrorBoundary>
                </div>
              ) : (
                <div className="bg-fin-card border border-fin-border rounded-lg p-12 h-full flex flex-col items-center justify-center text-center opacity-50 min-h-[400px]">
                  <div className="w-20 h-20 bg-fin-border/50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <Logo className="w-12 h-12 text-fin-accent" />
                  </div>
                  <h3 className="text-xl font-medium text-white mb-2">ClimateShift Alpha</h3>
                  <p className="text-fin-mute max-w-md">
                    Click "Construct ETF" to build a diversified, high-performance ESG portfolio optimized to compete with the S&P 500.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Section: Chart and Table */}
        {portfolio && (
          <div className="space-y-8 animate-fade-in-up">
            
            {/* 1. Historical Backtest */}
            <ErrorBoundary>
              <PerformanceComparison portfolio={portfolio} />
            </ErrorBoundary>

            {/* 2. Stock Table */}
            <ErrorBoundary>
              <StockTable 
                portfolio={portfolio} 
                onSelectStock={handleSelectStock}
              />
            </ErrorBoundary>

            {/* 3. Strategy & Allocation Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <ErrorBoundary>
                <PortfolioChart portfolio={portfolio} />
              </ErrorBoundary>
              
              {/* Additional analysis */}
               <div className="bg-fin-card rounded-lg border border-fin-border p-6 shadow-lg flex flex-col justify-center">
                  <h3 className="text-lg font-semibold text-white mb-4">Strategy Breakdown</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-fin-border pb-2">
                       <span className="text-fin-mute">Target Alpha Strategy</span>
                       <span className="text-fin-text font-medium">Core-Satellite</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-fin-border pb-2">
                       <span className="text-fin-mute">Rebalancing Frequency</span>
                       <span className="text-fin-text font-medium">Quarterly / On-Demand</span>
                    </div>
                     <div className="flex justify-between items-center border-b border-fin-border pb-2">
                       <span className="text-fin-mute">Benchmark</span>
                       <span className="text-fin-text font-medium">S&P 500</span>
                    </div>
                     <div className="flex justify-between items-center border-b border-fin-border pb-2">
                       <span className="text-fin-mute">Expense Ratio (Locked)</span>
                       <span className="text-fin-text font-medium">0.10%</span>
                    </div>
                  </div>
               </div>
            </div>

          </div>
        )}
      </main>

      {/* Stock Detail Modal */}
      {selectedStock && (
        <ErrorBoundary>
          <StockDetailModal 
            stock={selectedStock} 
            analysis={stockAnalysis} 
            loading={isAnalyzing} 
            onClose={handleCloseModal} 
          />
        </ErrorBoundary>
      )}

      {/* Rebalance Modal */}
      <ErrorBoundary>
        <RebalanceModal 
          isOpen={isRebalanceModalOpen}
          onClose={() => setIsRebalanceModalOpen(false)}
          onConfirm={handleConfirmRebalance}
        />
      </ErrorBoundary>
    </div>
  );
};

export default App;
