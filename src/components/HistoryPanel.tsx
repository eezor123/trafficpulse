import React, { useState } from 'react';
import { 
  History, 
  Trash2, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp, 
  BarChart2 
} from 'lucide-react';
import { RunSummary } from '../types';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  history: RunSummary[];
  onSelectRun: (run: RunSummary) => void;
  onClearHistory: () => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  isOpen,
  onClose,
  history,
  onSelectRun,
  onClearHistory,
}) => {
  const [selectedRunA, setSelectedRunA] = useState<RunSummary | null>(null);
  const [selectedRunB, setSelectedRunB] = useState<RunSummary | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">Benchmark Run History & Regression Tracking</h2>
              <p className="text-xs text-slate-400">{history.length} benchmark runs recorded in this session</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-sm font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {history.length > 0 ? (
            <div className="space-y-3">
              {history.map((run) => (
                <div
                  key={run.id}
                  className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-100">{run.testName}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        run.allPassed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {run.allPassed ? 'PASSED' : 'BREACHED'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                      <span>{new Date(run.startTime).toLocaleTimeString()}</span>
                      <span>• {run.totalRequests.toLocaleString()} reqs</span>
                      <span>• Avg RPS: <strong className="text-cyan-300">{run.avgRps.toFixed(1)}</strong></span>
                      <span>• P95: <strong className="text-amber-300">{Math.round(run.p95LatencyMs)}ms</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectRun(run);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-xs font-semibold cursor-pointer transition-colors"
                    >
                      View Report →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center text-xs text-slate-500">
              No historical test runs recorded yet. Start a test to record telemetry.
            </div>
          )}
        </div>

        {/* Footer */}
        {history.length > 0 && (
          <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
            <button
              type="button"
              onClick={onClearHistory}
              className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 cursor-pointer font-medium"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear History
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
