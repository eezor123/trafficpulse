import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Pause, 
  Play, 
  Trash2, 
  ExternalLink, 
  ChevronRight, 
  ChevronDown, 
  Clock, 
  Globe, 
  Laptop, 
  FileText,
  CheckCircle2,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { RequestMetricLog } from '../types';

interface LiveRequestInspectorProps {
  logs: RequestMetricLog[];
  onClearLogs: () => void;
}

export const LiveRequestInspector: React.FC<LiveRequestInspectorProps> = ({ logs, onClearLogs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | '2xx' | '3xx' | '4xx' | '5xx' | 'error'>('all');
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Search filter
      const matchesSearch =
        !searchTerm ||
        log.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.method.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.stepName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.statusCode && log.statusCode.toString().includes(searchTerm));

      if (!matchesSearch) return false;

      // Status filter
      if (statusFilter === '2xx') return log.statusCode >= 200 && log.statusCode < 300;
      if (statusFilter === '3xx') return log.statusCode >= 300 && log.statusCode < 400;
      if (statusFilter === '4xx') return log.statusCode >= 400 && log.statusCode < 500;
      if (statusFilter === '5xx') return log.statusCode >= 500;
      if (statusFilter === 'error') return !log.success;

      return true;
    });
  }, [logs, searchTerm, statusFilter]);

  const selectedLog = useMemo(() => {
    return logs.find((l) => l.id === selectedLogId) || null;
  }, [logs, selectedLogId]);

  const getStatusBadge = (code: number, success: boolean) => {
    if (!success || code === 0) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
          ERR
        </span>
      );
    }
    if (code >= 200 && code < 300) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          {code}
        </span>
      );
    }
    if (code >= 300 && code < 400) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
          {code}
        </span>
      );
    }
    if (code >= 400 && code < 500) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
          {code}
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
        {code}
      </span>
    );
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Top Header & Filters Bar */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wide flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            Live Request Waterfall & Inspector
          </span>
          <span className="text-xs font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-lg border border-slate-700">
            {filteredLogs.length} events
          </span>
        </div>

        {/* Search & Status Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search url, method, status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 placeholder-slate-500"
            />
          </div>

          <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-0.5 text-[11px]">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2 py-1 rounded font-medium cursor-pointer ${statusFilter === 'all' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'}`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('2xx')}
              className={`px-2 py-1 rounded font-medium cursor-pointer ${statusFilter === '2xx' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400 hover:text-slate-200'}`}
            >
              2xx
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('4xx')}
              className={`px-2 py-1 rounded font-medium cursor-pointer ${statusFilter === '4xx' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-slate-200'}`}
            >
              4xx
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('5xx')}
              className={`px-2 py-1 rounded font-medium cursor-pointer ${statusFilter === '5xx' ? 'bg-rose-500/20 text-rose-300' : 'text-slate-400 hover:text-slate-200'}`}
            >
              5xx
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsPaused(!isPaused)}
            className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-800 border border-slate-700 rounded-lg cursor-pointer"
            title={isPaused ? 'Resume live autoscroll' : 'Pause live stream'}
          >
            {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={onClearLogs}
            className="p-1.5 text-slate-400 hover:text-rose-400 bg-slate-800 border border-slate-700 rounded-lg cursor-pointer"
            title="Clear Log Stream"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Split Body: Logs Table & Details Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[350px] max-h-[480px]">
        {/* Left Logs Stream */}
        <div className={`overflow-y-auto ${selectedLog ? 'lg:col-span-7' : 'lg:col-span-12'} border-r border-slate-800/80`}>
          {filteredLogs.length > 0 ? (
            <div className="divide-y divide-slate-800/60">
              {filteredLogs.slice(0, 100).map((log) => {
                const isSelected = selectedLogId === log.id;
                return (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLogId(isSelected ? null : log.id)}
                    className={`p-3 flex items-center justify-between gap-3 text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-950/30 border-l-2 border-cyan-400'
                        : 'hover:bg-slate-850/70'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {getStatusBadge(log.statusCode, log.success)}

                      <span className="font-bold font-mono text-[11px] text-cyan-300 uppercase">
                        {log.method}
                      </span>

                      <span className="font-mono text-slate-300 truncate max-w-xs md:max-w-md">
                        {log.url}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 text-slate-400 font-mono text-[11px]">
                      <span className="text-amber-300 font-medium">
                        {log.latencyMs}ms
                      </span>
                      <span className="hidden sm:inline text-slate-500">
                        {log.responseBytes > 0 ? `${(log.responseBytes / 1024).toFixed(1)} KB` : ''}
                      </span>
                      <ChevronRight className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-xs text-slate-500 p-6 text-center">
              <Clock className="w-8 h-8 text-slate-600 mb-2" />
              <span>No requests captured yet.</span>
              <span className="text-[11px] text-slate-600 mt-1">Start a load test to observe live request streams.</span>
            </div>
          )}
        </div>

        {/* Right Inspection Details Panel */}
        {selectedLog && (
          <div className="lg:col-span-5 p-4 overflow-y-auto bg-slate-950/50 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-200">Request Inspection</span>
                {getStatusBadge(selectedLog.statusCode, selectedLog.success)}
              </div>
              <button
                type="button"
                onClick={() => setSelectedLogId(null)}
                className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                Close ✕
              </button>
            </div>

            {/* Waterfall Timing Breakdown */}
            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
              <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                Latency Breakdown
              </span>
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Total Duration:</span>
                  <span className="text-amber-300 font-bold">{selectedLog.latencyMs} ms</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>TTFB (Server Processing):</span>
                  <span className="text-cyan-300 font-medium">~{Math.round(selectedLog.latencyMs * 0.75)} ms</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Network Transfer:</span>
                  <span className="text-slate-300 font-medium">~{Math.round(selectedLog.latencyMs * 0.25)} ms</span>
                </div>
              </div>
            </div>

            {/* Request Meta */}
            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl space-y-2 text-xs">
              <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block mb-1">
                Request Details
              </span>
              <div className="font-mono text-slate-300 break-all">
                <strong className="text-slate-400">URL: </strong>{selectedLog.url}
              </div>
              <div className="font-mono text-slate-300">
                <strong className="text-slate-400">Method: </strong>{selectedLog.method}
              </div>
              <div className="font-mono text-slate-300">
                <strong className="text-slate-400">Timestamp: </strong>{new Date(selectedLog.timestamp).toLocaleTimeString()}
              </div>
            </div>

            {/* Response Body Preview */}
            {selectedLog.responsePreview && (
              <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
                <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                  Response Body Preview
                </span>
                <pre className="bg-slate-950 p-2.5 rounded-lg text-[11px] font-mono text-cyan-200 overflow-x-auto max-h-40 leading-relaxed">
                  {selectedLog.responsePreview}
                </pre>
              </div>
            )}

            {/* Error Message */}
            {selectedLog.error && (
              <div className="bg-rose-950/30 border border-rose-500/30 p-3 rounded-xl text-xs text-rose-300 space-y-1">
                <span className="font-bold block">Error Diagnostic:</span>
                <p className="font-mono text-[11px]">{selectedLog.error}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
