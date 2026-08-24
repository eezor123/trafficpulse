import React from 'react';
import { 
  X, 
  CheckCircle2, 
  Clock, 
  Users, 
  Layers, 
  Globe, 
  Search, 
  Share2, 
  ShieldCheck, 
  TrendingUp,
  Download,
  RotateCcw
} from 'lucide-react';
import { OrganicRunSummary } from '../types';

interface OrganicRunSummaryModalProps {
  summary: OrganicRunSummary | null;
  onClose: () => void;
  onRunAgain: () => void;
}

export const OrganicRunSummaryModal: React.FC<OrganicRunSummaryModalProps> = ({
  summary,
  onClose,
  onRunAgain,
}) => {
  if (!summary) return null;

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(summary, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `organic_traffic_report_${summary.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Organic Traffic Session Complete</h3>
              <p className="text-xs text-slate-400 font-mono">{summary.targetUrl}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 6 Key Performance Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
            <span className="text-[11px] text-slate-400 uppercase font-bold">Total Visitors</span>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
              {summary.totalVisitorsDispatched}
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
            <span className="text-[11px] text-slate-400 uppercase font-bold">Total Page Views</span>
            <div className="text-xl font-bold font-mono text-cyan-300 mt-1">
              {summary.totalPageViews}
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
            <span className="text-[11px] text-slate-400 uppercase font-bold">Avg Dwell Time</span>
            <div className="text-xl font-bold font-mono text-amber-300 mt-1">
              {summary.avgEngagementTimeSeconds}s
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
            <span className="text-[11px] text-slate-400 uppercase font-bold">Pages / Session</span>
            <div className="text-xl font-bold font-mono text-indigo-300 mt-1">
              {summary.avgPagesPerSession}
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
            <span className="text-[11px] text-slate-400 uppercase font-bold">Bounce Rate</span>
            <div className="text-xl font-bold font-mono text-rose-400 mt-1">
              {summary.bounceRatePct}%
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
            <span className="text-[11px] text-slate-400 uppercase font-bold">GA4 Beacons Sent</span>
            <div className="text-xl font-bold font-mono text-emerald-300 mt-1">
              {summary.ga4EventsDispatched}
            </div>
          </div>
        </div>

        {/* Traffic Sources & Countries Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Traffic Acquisition Sources
            </h4>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center py-1 border-b border-slate-900">
                <span className="text-emerald-400">Organic Search:</span>
                <span className="text-slate-200 font-bold">{summary.sourcesBreakdown.organic}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-900">
                <span className="text-cyan-400">Social Media:</span>
                <span className="text-slate-200 font-bold">{summary.sourcesBreakdown.social}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-900">
                <span className="text-purple-400">Direct Traffic:</span>
                <span className="text-slate-200 font-bold">{summary.sourcesBreakdown.direct}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-amber-400">Referral Links:</span>
                <span className="text-slate-200 font-bold">{summary.sourcesBreakdown.referral}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Top Country Distribution
            </h4>
            <div className="space-y-1.5 max-h-36 overflow-y-auto text-xs font-mono pr-1">
              {Object.entries(summary.countryDistribution).map(([code, count]) => (
                <div key={code} className="flex justify-between items-center py-1 border-b border-slate-900">
                  <span className="text-slate-300">{code}</span>
                  <span className="text-cyan-400 font-bold">{count} visits</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Landing Pages Table */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Most Visited Pages
          </h4>
          <div className="overflow-x-auto max-h-40 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-500 border-b border-slate-800 font-mono">
                <tr>
                  <th className="py-1.5 px-2">Path</th>
                  <th className="py-1.5 px-2">Title</th>
                  <th className="py-1.5 px-2 text-right">Views</th>
                  <th className="py-1.5 px-2 text-right">Avg Dwell</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900 font-mono">
                {summary.topLandingPages.map((page, idx) => (
                  <tr key={idx} className="text-slate-300">
                    <td className="py-1.5 px-2 text-cyan-300 font-semibold">{page.path}</td>
                    <td className="py-1.5 px-2 text-slate-400 font-sans truncate max-w-xs">{page.title}</td>
                    <td className="py-1.5 px-2 text-right text-emerald-400">{page.views}</td>
                    <td className="py-1.5 px-2 text-right text-amber-300">{page.avgTimeSec}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleExportJson}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all border border-slate-700"
          >
            <Download className="w-4 h-4" />
            <span>Export JSON Analytics</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onRunAgain();
              }}
              className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Run Campaign Again</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
