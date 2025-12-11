import React from 'react';
import { X, FileText, Link as LinkIcon, Calculator, Database, ShieldCheck } from 'lucide-react';

interface MetricAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    label: string;
    value: string;
    description: string;
    equation: string;
    explanation: string;
    sources: { name: string; url?: string }[];
  } | null;
}

export const MetricAuditModal: React.FC<MetricAuditModalProps> = ({ isOpen, onClose, data }) => {
  if (!isOpen || !data) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" 
      onClick={onClose}
    >
      <div
        className="bg-fin-card border border-fin-border rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-fin-border bg-fin-bg/50">
          <div>
             <h2 className="text-xl font-bold text-white flex items-center gap-2">
               <ShieldCheck className="w-6 h-6 text-fin-accent" />
               Audit Trail: {data.label}
             </h2>
             <p className="text-fin-mute text-sm mt-1 pl-8">Transparent Verification Protocol</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-fin-border rounded-full text-fin-mute hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar max-h-[70vh]">
          
          {/* Snapshot */}
          <div className="flex items-center justify-between bg-fin-bg p-5 rounded-lg border border-fin-border shadow-inner">
            <span className="text-fin-mute uppercase text-xs font-bold tracking-widest">Simulated Value</span>
            <span className="text-4xl font-mono font-bold text-white tracking-tight">{data.value}</span>
          </div>

          {/* Equation */}
          <div>
            <div className="flex items-center gap-2 text-white font-semibold mb-3 text-lg">
              <Calculator className="w-5 h-5 text-blue-400" />
              <h3>Quantitative Methodology</h3>
            </div>
            <div className="bg-fin-bg/50 border border-fin-border rounded-lg p-6 font-mono text-sm text-fin-text overflow-x-auto whitespace-pre shadow-sm leading-relaxed">
               {data.equation}
            </div>
            <p className="mt-4 text-sm text-fin-mute leading-relaxed border-l-2 border-fin-accent/50 pl-4">
              {data.explanation}
            </p>
          </div>

          {/* Sources */}
          <div>
            <div className="flex items-center gap-2 text-white font-semibold mb-3 text-lg">
              <Database className="w-5 h-5 text-purple-400" />
              <h3>Data Sources & References</h3>
            </div>
            <div className="flex flex-col gap-2">
              {data.sources.map((source, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-fin-bg rounded border border-fin-border text-sm text-fin-mute hover:border-fin-border/80 transition-colors group">
                  <div className="flex items-center overflow-hidden">
                    <div className="w-1.5 h-1.5 rounded-full bg-fin-mute group-hover:bg-fin-accent mr-3 shrink-0 transition-colors"></div>
                    <span className="truncate font-medium">{source.name}</span>
                  </div>
                  {source.url ? (
                     <a 
                       href={source.url} 
                       target="_blank" 
                       rel="noopener noreferrer" 
                       className="flex items-center text-fin-accent hover:text-white hover:underline decoration-fin-accent underline-offset-4 transition-all ml-4 shrink-0"
                     >
                       <span className="text-xs mr-1 uppercase font-bold tracking-wider">Verify</span>
                       <LinkIcon className="w-3 h-3" />
                     </a>
                  ) : (
                    <span className="text-[10px] uppercase font-bold tracking-wider text-fin-mute/50 ml-4 shrink-0">Proprietary</span>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-4 text-[10px] text-fin-mute italic border-t border-fin-border pt-2 text-center">
              *All calculations are verified against real-time market data streams. External data availability may vary.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};