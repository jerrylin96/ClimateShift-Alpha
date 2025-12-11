
import React, { useState } from 'react';
import { X, AlertTriangle, Layers } from 'lucide-react';

interface RebalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (preferences: string) => void;
}

export const RebalanceModal: React.FC<RebalanceModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [preferences, setPreferences] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(preferences);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-fin-card border border-fin-border rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-fin-border bg-fin-bg/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-full text-blue-400">
               <Layers className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-white">Rebalance ETF</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-fin-border rounded-full text-fin-mute hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
             <label className="block text-sm font-medium text-fin-text mb-2">Market Context & Preferences</label>
             <textarea
                value={preferences}
                onChange={(e) => setPreferences(e.target.value)}
                placeholder="E.g., The market is becoming volatile, please increase the weight of defensive stabilizer stocks. Or: I want more exposure to circular economy companies."
                className="w-full h-32 bg-fin-bg border border-fin-border rounded-md p-3 text-fin-text text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none placeholder-fin-mute/50"
                autoFocus
             />
          </div>

          <div className="bg-fin-bg border border-fin-border rounded-md p-4 mb-6 flex items-start gap-3">
             <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
             <div className="text-xs text-fin-mute">
                <span className="text-fin-text font-semibold block mb-1">Safety Protocols Active</span>
                Requests to include excluded sectors (Fossil Fuels, Weapons, Tobacco, AI-Obsolete) or speculative assets (Pre-revenue) will be strictly rejected by the quantitative engine.
             </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-fin-mute hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-md text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/20 transition-all"
            >
              Execute Rebalance
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
