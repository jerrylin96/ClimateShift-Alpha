
import React from 'react';
import { Globe, ExternalLink } from 'lucide-react';
import { NewsHeadline } from '../types';

interface NewsTickerProps {
  headlines: NewsHeadline[];
}

export const NewsTicker: React.FC<NewsTickerProps> = ({ headlines }) => {
  // STRICT RULE: If no headlines (initializing or error), hide the component entirely.
  // Do not show placeholders.
  if (!headlines || headlines.length === 0) {
    return null;
  }

  return (
    <div className="bg-fin-card border border-fin-border rounded-lg overflow-hidden relative h-12 flex items-center shadow-lg animate-fade-in">
      <div className="absolute left-0 top-0 bottom-0 bg-fin-card z-10 px-3 flex items-center border-r border-fin-border shadow-sm">
        <Globe className="w-4 h-4 text-fin-accent animate-pulse" />
      </div>
      <div className="flex whitespace-nowrap animate-marquee pause-animation items-center h-full">
         {/* Triplicate content to ensure smooth seamless loop for longer screens */}
         {[...headlines, ...headlines, ...headlines].map((item, idx) => (
           <div key={`${idx}-${item.url}`} className="flex items-center mx-8 group">
              <a 
                href={item.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:opacity-100 transition-opacity"
              >
                <span className="text-xs font-mono font-bold text-white group-hover:text-fin-accent transition-colors">
                  {item.title}
                </span>
                <span className="text-[10px] text-fin-mute uppercase tracking-wider bg-fin-bg px-1.5 py-0.5 rounded border border-fin-border group-hover:border-fin-accent/50">
                  {item.source}
                </span>
                <ExternalLink className="w-3 h-3 text-fin-mute opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
           </div>
         ))}
      </div>
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-fin-card to-transparent z-10 pointer-events-none"></div>
    </div>
  );
};
