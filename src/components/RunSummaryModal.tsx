import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Download, 
  Clock, 
  Activity, 
  Zap, 
  ShieldCheck, 
  AlertTriangle,
  Loader2,
  TrendingUp
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { RunSummary } from '../types';

interface RunSummaryModalProps {
  summary: RunSummary | null;
  onClose: () => void;
  onRunAgain: () => void;
}

export const RunSummaryModal: React.FC<RunSummaryModalProps> = ({
  summary,
  onClose,
  onRunAgain,
}) => {
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(summary?.aiAnalysis || null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  useEffect(() => {
    if (summary && summary.allPassed) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch {
        // ignore
      }
    }
  }, [summary]);

  if (!summary) return null;

  const handleRequestAiDiagnostics = async () => {
    setIsLoadingAi(true);
    try {
      const res = await fetch('/api/ai/diagnose-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary }),
      });
      const data = await res.json();
      if (data.analysis) {
        setAiAnalysis(data.analysis);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingAi(false);
    }
  };

  const downloadJsonReport = () => {
    const blob = new Blob([JSON.stringify(summary, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trafficpulse-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header Banner */}
        <div className={`p-4 border-b border-slate-800 ${
          summary.allPassed ? 'bg-emerald-950/40' : 'bg-amber-950/40'
        } flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              summary.allPassed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
            }`}>
              {summary.allPassed ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-100">{summary.testName} Benchmark Summary</h2>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                  summary.allPassed ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {summary.allPassed ? 'SLA PASSED' : 'SLA BREACHED'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Duration: {(summary.totalDurationMs / 1000).toFixed(1)}s • Total Dispatched: {summary.totalRequests.toLocaleString()} requests
              </p>
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

        {/* Modal Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Key Metric Numbers Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">Average Rate</span>
              <span className="text-xl font-bold font-mono text-cyan-300">{summary.avgRps.toFixed(1)}</span>
              <span className="text-[10px] text-slate-400 block">Peak: {summary.peakRps.toFixed(1)} RPS</span>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">P95 Latency</span>
              <span className="text-xl font-bold font-mono text-amber-300">{Math.round(summary.p95LatencyMs)} ms</span>
              <span className="text-[10px] text-slate-400 block">Avg: {Math.round(summary.avgLatencyMs)} ms</span>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">Success Rate</span>
              <span className="text-xl font-bold font-mono text-emerald-300">
                {summary.totalRequests > 0 ? ((summary.successfulRequests / summary.totalRequests) * 100).toFixed(1) : 100}%
              </span>
              <span className="text-[10px] text-slate-400 block">Errors: {summary.failedRequests}</span>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">Total Data</span>
              <span className="text-xl font-bold font-mono text-purple-300">
                {(summary.totalBytesTransferred / (1024 * 1024)).toFixed(2)} MB
              </span>
              <span className="text-[10px] text-slate-400 block">Transferred</span>
            </div>
          </div>

          {/* Latency Percentiles Table */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              Detailed Latency Percentile Distribution
            </span>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs font-mono">
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block">Min</span>
                <span className="text-emerald-400 font-bold">{summary.minLatencyMs}ms</span>
              </div>
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block">P50 (Median)</span>
                <span className="text-cyan-400 font-bold">{Math.round(summary.p50LatencyMs)}ms</span>
              </div>
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block">P90</span>
                <span className="text-blue-400 font-bold">{Math.round(summary.p90LatencyMs)}ms</span>
              </div>
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block">P95</span>
                <span className="text-amber-400 font-bold">{Math.round(summary.p95LatencyMs)}ms</span>
              </div>
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block">P99</span>
                <span className="text-rose-400 font-bold">{Math.round(summary.p99LatencyMs)}ms</span>
              </div>
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block">Max</span>
                <span className="text-rose-300 font-bold">{summary.maxLatencyMs}ms</span>
              </div>
            </div>
          </div>

          {/* SLA Quality Gate Assertions Checklist */}
          {summary.assertionResults && summary.assertionResults.length > 0 && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                SLA Quality Gates Evaluation ({summary.assertionResults.filter(a => a.passed).length}/{summary.assertionResults.length} Passed)
              </span>
              <div className="space-y-1.5">
                {summary.assertionResults.map((ar, idx) => (
                  <div key={idx} className={`p-2.5 rounded-lg border flex items-center justify-between text-xs ${
                    ar.passed ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-300' : 'bg-rose-950/20 border-rose-500/20 text-rose-300'
                  }`}>
                    <div className="flex items-center gap-2">
                      {ar.passed ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}
                      <span>{ar.assertion.description}</span>
                    </div>
                    <span className="font-mono font-bold">
                      Actual: {ar.actualValue.toFixed(1)} (Threshold: {ar.assertion.operator} {ar.assertion.threshold})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gemini AI Performance Architect Diagnostics */}
          <div className="bg-slate-950 border border-cyan-500/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-slate-100">AI Deep Performance & Bottleneck Diagnosis</span>
              </div>
              {!aiAnalysis && (
                <button
                  type="button"
                  onClick={handleRequestAiDiagnostics}
                  disabled={isLoadingAi}
                  className="px-3 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold cursor-pointer shadow-sm transition-all flex items-center gap-1.5"
                >
                  {isLoadingAi ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  Run AI Diagnostics
                </button>
              )}
            </div>

            {aiAnalysis ? (
              <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-lg text-xs text-slate-200 leading-relaxed font-sans space-y-2 whitespace-pre-line">
                {aiAnalysis}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400">
                Click &quot;Run AI Diagnostics&quot; to have Gemini analyze your latency percentiles, status codes, and server responsiveness to suggest architectural optimizations.
              </p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <button
            type="button"
            onClick={downloadJsonReport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Export JSON Report
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onRunAgain();
              }}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold cursor-pointer shadow-md transition-all"
            >
              Rerun Test ⚡
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
