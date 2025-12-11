import React from 'react';
import { Globe, ExternalLink } from 'lucide-react';
import { NewsHeadline } from '../types';

interface NewsTickerProps {
  headlines: NewsHeadline[];
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const NewsTicker: React.FC<NewsTickerProps> = ({ headlines, onRefresh, isRefreshing }) => {
  // Use headlines if available, but component structure renders even if empty to show the container
  const items = headlines || [];
  
  if (items.length === 0) return null;

  return (
    <div className="bg-fin-card border border-fin-border rounded-lg overflow-hidden relative h-12 flex items-center shadow-lg animate-fade-in group/ticker">
      {/* Refresh Button / Icon */}
      <button 
        onClick={onRefresh}
        disabled={isRefreshing}
        className="absolute left-0 top-0 bottom-0 z-20 px-3 bg-fin-card border-r border-fin-border hover:bg-fin-border transition-colors flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
        title="Refresh Market News"
      >
        <Globe className={`w-4 h-4 text-fin-accent ${isRefreshing ? 'animate-spin' : ''}`} />
      </button>

      {/* Scroller Container */}
      <div className="flex-1 overflow-hidden relative h-full ml-10">
         <div className="flex w-max animate-infinite-scroll hover:[animation-play-state:paused]">
            {/* First Copy */}
            <div className="flex items-center gap-8 px-4">
               {items.map((item, idx) => (
                 <NewsItem key={`1-${idx}-${item.url}`} item={item} />
               ))}
            </div>
            {/* Second Copy for Seamless Loop */}
            <div className="flex items-center gap-8 px-4">
               {items.map((item, idx) => (
                 <NewsItem key={`2-${idx}-${item.url}`} item={item} />
               ))}
            </div>
         </div>
      </div>
      
      {/* Right Fade Overlay */}
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-fin-card to-transparent z-10 pointer-events-none"></div>
    </div>
  );
};

const NewsItem: React.FC<{ item: NewsHeadline }> = ({ item }) => (
  <div className="flex items-center group/item">
    <a 
      href={item.url} 
      target="_blank" 
      rel="noopener noreferrer"
      className="flex items-center gap-2 transition-opacity"
    >
      <span className="text-xs font-mono font-bold text-white group-hover/item:text-fin-accent transition-colors whitespace-nowrap">
        {item.title}
      </span>
      <span className="text-[10px] text-fin-mute uppercase tracking-wider bg-fin-bg px-1.5 py-0.5 rounded border border-fin-border group-hover/item:border-fin-accent/50 whitespace-nowrap">
        {item.source}
      </span>
      <ExternalLink className="w-3 h-3 text-fin-mute opacity-0 group-hover/item:opacity-100 transition-opacity" />
    </a>
  </div>
);