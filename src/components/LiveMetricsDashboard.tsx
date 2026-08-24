import React from 'react';
import { 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  BarChart,
  Bar
} from 'recharts';
import { 
  Activity, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Users, 
  Zap, 
  ArrowUpRight, 
  Wifi, 
  Layers 
} from 'lucide-react';
import { MetricSnapshot, RequestMetricLog, TestStatus } from '../types';

interface LiveMetricsDashboardProps {
  status: TestStatus;
  snapshots: MetricSnapshot[];
  latestSnapshot: MetricSnapshot | null;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  elapsedSeconds: number;
  totalDurationSeconds: number;
}

export const LiveMetricsDashboard: React.FC<LiveMetricsDashboardProps> = ({
  status,
  snapshots,
  latestSnapshot,
  totalRequests,
  successfulRequests,
  failedRequests,
  elapsedSeconds,
  totalDurationSeconds,
}) => {
  const isRunning = status === 'running';
  const successRate = totalRequests > 0 ? ((successfulRequests / totalRequests) * 100).toFixed(1) : '100.0';

  // Compute overall status counts
  const total2xx = snapshots.reduce((acc, s) => acc + s.status2xx, 0);
  const total3xx = snapshots.reduce((acc, s) => acc + s.status3xx, 0);
  const total4xx = snapshots.reduce((acc, s) => acc + s.status4xx, 0);
  const total5xx = snapshots.reduce((acc, s) => acc + s.status5xx, 0);

  return (
    <div className="space-y-5">
      {/* Top Metric Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Real-time RPS */}
        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Current RPS</span>
            <Activity className={`w-3.5 h-3.5 ${isRunning ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`} />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black font-mono text-cyan-300">
              {latestSnapshot ? latestSnapshot.currentRps.toFixed(1) : '0.0'}
            </span>
            <span className="text-[10px] text-slate-400">/ {latestSnapshot ? latestSnapshot.targetRps : '0'} tgt</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span>Target: {latestSnapshot?.targetRps || 0} req/s</span>
          </div>
        </div>

        {/* P95 Latency */}
        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">P95 Latency</span>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black font-mono text-amber-300">
              {latestSnapshot ? Math.round(latestSnapshot.p95Ms) : 0}
            </span>
            <span className="text-[10px] text-slate-400">ms</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
            <span>P50: {latestSnapshot ? Math.round(latestSnapshot.p50Ms) : 0}ms</span>
            <span>P99: {latestSnapshot ? Math.round(latestSnapshot.p99Ms) : 0}ms</span>
          </div>
        </div>

        {/* Total Requests */}
        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Dispatched</span>
            <Zap className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black font-mono text-slate-100">
              {totalRequests.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400">reqs</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
            <span className="text-emerald-400 font-medium">✓ {successfulRequests}</span>
            <span className="text-rose-400 font-medium">✗ {failedRequests}</span>
          </div>
        </div>

        {/* Success Rate */}
        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Success Rate</span>
            <CheckCircle className={`w-3.5 h-3.5 ${parseFloat(successRate) > 95 ? 'text-emerald-400' : 'text-rose-400'}`} />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-xl sm:text-2xl font-black font-mono ${parseFloat(successRate) >= 98 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {successRate}%
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Errors: <strong className="text-rose-400">{failedRequests}</strong>
          </div>
        </div>

        {/* Active Concurrency (VUs) */}
        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Active Concurrency</span>
            <Users className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black font-mono text-blue-300">
              {latestSnapshot ? latestSnapshot.activeVus : 0}
            </span>
            <span className="text-[10px] text-slate-400">VUs</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Parallel worker threads
          </div>
        </div>

        {/* Throughput Bandwidth */}
        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Throughput</span>
            <Wifi className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black font-mono text-purple-300">
              {latestSnapshot ? (latestSnapshot.bytesPerSec / 1024).toFixed(1) : '0.0'}
            </span>
            <span className="text-[10px] text-slate-400">KB/s</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Transferred data rate
          </div>
        </div>
      </div>

      {/* Real-Time Live Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 1. RPS vs Target RPS Curve */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">Real-time RPS (Actual vs Target)</span>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1 text-cyan-300">
                <span className="w-2 h-2 rounded-full bg-cyan-400" /> Actual RPS
              </span>
              <span className="flex items-center gap-1 text-slate-400">
                <span className="w-2 h-2 rounded-full bg-slate-500" /> Target RPS
              </span>
            </div>
          </div>

          <div className="h-56 w-full">
            {snapshots.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={snapshots} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="actualRpsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="timeLabel" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px' }}
                    itemStyle={{ color: '#e2e8f0' }}
                  />
                  <Area type="monotone" dataKey="currentRps" name="Actual RPS" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#actualRpsGrad)" />
                  <Line type="stepAfter" dataKey="targetRps" name="Target RPS" stroke="#64748b" strokeDasharray="4 4" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Click &quot;Generate Traffic&quot; to begin real-time metrics telemetry.
              </div>
            )}
          </div>
        </div>

        {/* 2. Latency Percentiles Stream (P50, P90, P95, P99) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">Latency Percentiles (ms)</span>
            </div>
            <div className="flex items-center gap-2.5 text-[10px]">
              <span className="text-emerald-400">P50</span>
              <span className="text-cyan-400">P90</span>
              <span className="text-amber-400">P95</span>
              <span className="text-rose-400">P99</span>
            </div>
          </div>

          <div className="h-56 w-full">
            {snapshots.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={snapshots} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="timeLabel" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} unit="ms" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px' }}
                  />
                  <Line type="monotone" dataKey="p50Ms" name="P50" stroke="#10b981" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="p90Ms" name="P90" stroke="#06b6d4" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="p95Ms" name="P95" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="p99Ms" name="P99" stroke="#f43f5e" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Latency distribution will populate as requests resolve.
              </div>
            )}
          </div>
        </div>

        {/* 3. HTTP Status Codes Distribution */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">HTTP Status Code Distribution</span>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="text-emerald-400 font-mono">2xx: {total2xx}</span>
              <span className="text-blue-400 font-mono">3xx: {total3xx}</span>
              <span className="text-amber-400 font-mono">4xx: {total4xx}</span>
              <span className="text-rose-400 font-mono">5xx: {total5xx}</span>
            </div>
          </div>

          <div className="h-52 w-full">
            {snapshots.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={snapshots} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="timeLabel" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px' }}
                  />
                  <Bar dataKey="status2xx" name="2xx Success" stackId="a" fill="#10b981" />
                  <Bar dataKey="status3xx" name="3xx Redirect" stackId="a" fill="#3b82f6" />
                  <Bar dataKey="status4xx" name="4xx Client Error" stackId="a" fill="#f59e0b" />
                  <Bar dataKey="status5xx" name="5xx Server Error" stackId="a" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Awaiting request status code telemetry.
              </div>
            )}
          </div>
        </div>

        {/* 4. Active Virtual Users & Concurrency */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">Concurrent Virtual Users (VUs)</span>
            </div>
            <span className="text-xs font-mono text-indigo-300">
              Peak: {Math.max(...snapshots.map(s => s.activeVus), 0)} VUs
            </span>
          </div>

          <div className="h-52 w-full">
            {snapshots.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={snapshots} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="vusGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="timeLabel" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px' }}
                  />
                  <Area type="monotone" dataKey="activeVus" name="Virtual Users" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#vusGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Concurrency curves will display during test execution.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
