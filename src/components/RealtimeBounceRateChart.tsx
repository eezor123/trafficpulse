import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { 
  Activity, 
  TrendingDown, 
  TrendingUp, 
  ShieldCheck, 
  Info, 
  Clock, 
  RotateCcw,
  Zap,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { ActiveVisitorSession } from '../types';

export interface BounceRateDataPoint {
  timestamp: number;
  timeLabel: string;
  bounceRate: number;
  activeCount: number;
  singlePageSessions: number;
  multiPageSessions: number;
  totalVisitors: number;
  bouncedVisitors: number;
}

interface RealtimeBounceRateChartProps {
  status: 'idle' | 'running' | 'paused' | 'completed';
  activeVisitors: ActiveVisitorSession[];
  stats: {
    totalVisitorsDispatched: number;
    bouncedSessions: number;
    totalPageViews: number;
    activeCount: number;
  };
  className?: string;
}

export const RealtimeBounceRateChart: React.FC<RealtimeBounceRateChartProps> = ({
  status,
  activeVisitors,
  stats,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [containerWidth, setContainerWidth] = useState(600);
  const [history, setHistory] = useState<BounceRateDataPoint[]>(() => {
    // Initial baseline points
    const now = Date.now();
    const initialPoints: BounceRateDataPoint[] = [];
    for (let i = 10; i >= 0; i--) {
      const t = now - i * 3000;
      initialPoints.push({
        timestamp: t,
        timeLabel: new Date(t).toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' }),
        bounceRate: 0,
        activeCount: 0,
        singlePageSessions: 0,
        multiPageSessions: 0,
        totalVisitors: 0,
        bouncedVisitors: 0,
      });
    }
    return initialPoints;
  });

  const [hoveredPoint, setHoveredPoint] = useState<BounceRateDataPoint | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [timeWindow, setTimeWindow] = useState<'1m' | '3m' | '5m' | 'all'>('3m');

  // Measure container width responsively
  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    updateSize();

    const resizeObserver = new ResizeObserver(() => updateSize());
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Compute live current session bounce rate
  const currentMetrics = useMemo(() => {
    const total = stats.totalVisitorsDispatched;
    const bounced = stats.bouncedSessions;
    
    // Active visitors breakout
    const active = activeVisitors.length;
    const singlePageActive = activeVisitors.filter(v => (v.pagesVisited || 1) <= 1).length;
    const multiPageActive = activeVisitors.filter(v => (v.pagesVisited || 1) > 1).length;

    let computedRate = 0;
    if (total > 0) {
      computedRate = Math.min(100, Math.max(0, (bounced / total) * 100));
    } else if (active > 0) {
      computedRate = Math.min(100, Math.max(0, (singlePageActive / active) * 100));
    }

    const multiPageConversionRate = active > 0 
      ? Math.round((multiPageActive / active) * 100) 
      : (stats.totalPageViews > stats.totalVisitorsDispatched && stats.totalVisitorsDispatched > 0
          ? Math.min(100, Math.round(((stats.totalPageViews - stats.totalVisitorsDispatched) / stats.totalVisitorsDispatched) * 100))
          : 0);

    return {
      bounceRate: Number(computedRate.toFixed(1)),
      activeCount: active,
      singlePageActive,
      multiPageActive,
      multiPageConversionRate,
      totalVisitors: total,
      bouncedVisitors: bounced,
    };
  }, [stats.totalVisitorsDispatched, stats.bouncedSessions, stats.totalPageViews, activeVisitors]);

  // Periodic sampling interval to record live bounce rate trend
  useEffect(() => {
    const isRunning = status === 'running';
    const interval = setInterval(() => {
      const now = Date.now();
      const newPoint: BounceRateDataPoint = {
        timestamp: now,
        timeLabel: new Date(now).toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' }),
        bounceRate: currentMetrics.bounceRate,
        activeCount: currentMetrics.activeCount,
        singlePageSessions: currentMetrics.singlePageActive,
        multiPageSessions: currentMetrics.multiPageActive,
        totalVisitors: currentMetrics.totalVisitors,
        bouncedVisitors: currentMetrics.bouncedVisitors,
      };

      setHistory(prev => {
        const next = [...prev, newPoint];
        // Keep up to 120 points (e.g. last 4-6 minutes)
        if (next.length > 120) {
          return next.slice(next.length - 120);
        }
        return next;
      });
    }, isRunning ? 2000 : 4000);

    return () => clearInterval(interval);
  }, [status, currentMetrics]);

  // Filter history based on time window
  const filteredHistory = useMemo(() => {
    if (timeWindow === 'all') return history;
    const now = Date.now();
    const windowMs = timeWindow === '1m' ? 60000 : timeWindow === '3m' ? 180000 : 300000;
    const filtered = history.filter(p => now - p.timestamp <= windowMs);
    return filtered.length >= 2 ? filtered : history.slice(-15);
  }, [history, timeWindow]);

  // D3 Chart Rendering
  useEffect(() => {
    if (!svgRef.current || filteredHistory.length < 2) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = containerWidth;
    const height = 240;
    const margin = { top: 25, right: 35, bottom: 35, left: 45 };

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    if (innerWidth <= 10 || innerHeight <= 10) return;

    // Scales
    const minTime = d3.min(filteredHistory, (d: BounceRateDataPoint) => d.timestamp) || Date.now() - 60000;
    const maxTime = d3.max(filteredHistory, (d: BounceRateDataPoint) => d.timestamp) || Date.now();

    const xScale = d3.scaleTime()
      .domain([new Date(minTime), new Date(maxTime)])
      .range([margin.left, width - margin.right]);

    const yScale = d3.scaleLinear()
      .domain([0, 100])
      .range([height - margin.bottom, margin.top]);

    const defs = svg.append('defs');

    // Theme color based on current bounce rate
    const latestRate = currentMetrics.bounceRate;
    const isHealthy = latestRate <= 35;
    const isModerate = latestRate > 35 && latestRate <= 60;
    
    const strokeColor = isHealthy ? '#10b981' : isModerate ? '#f59e0b' : '#f43f5e';
    const gradientStart = isHealthy ? '#10b981' : isModerate ? '#f59e0b' : '#f43f5e';
    const gradientEnd = isHealthy ? '#064e3b' : isModerate ? '#78350f' : '#881337';

    // Area Gradient
    const areaGradient = defs.append('linearGradient')
      .attr('id', 'bounceRateAreaGradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    areaGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', gradientStart)
      .attr('stop-opacity', 0.38);

    areaGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', gradientEnd)
      .attr('stop-opacity', 0.0);

    // Glow Filter
    const filter = defs.append('filter')
      .attr('id', 'lineGlow')
      .attr('x', '-20%')
      .attr('y', '-20%')
      .attr('width', '140%')
      .attr('height', '140%');
    filter.append('feGaussianBlur')
      .attr('stdDeviation', 2.5)
      .attr('result', 'blur');
    filter.append('feMerge')
      .call(f => f.append('feMergeNode').attr('in', 'blur'))
      .call(f => f.append('feMergeNode').attr('in', 'SourceGraphic'));

    // Subtle Horizontal Grid Lines
    const gridTicks = [0, 25, 50, 75, 100];
    svg.append('g')
      .attr('class', 'grid')
      .selectAll('line')
      .data(gridTicks)
      .enter()
      .append('line')
      .attr('x1', margin.left)
      .attr('x2', width - margin.right)
      .attr('y1', d => yScale(d))
      .attr('y2', d => yScale(d))
      .attr('stroke', '#1e293b')
      .attr('stroke-dasharray', '3 3')
      .attr('stroke-width', 1);

    // Target Benchmark Guide Line (35% - Low Bounce Target)
    const benchmarkY = yScale(35);
    svg.append('line')
      .attr('x1', margin.left)
      .attr('x2', width - margin.right)
      .attr('y1', benchmarkY)
      .attr('y2', benchmarkY)
      .attr('stroke', '#059669')
      .attr('stroke-dasharray', '4 4')
      .attr('stroke-width', 1.2)
      .attr('opacity', 0.6);

    svg.append('text')
      .attr('x', width - margin.right - 4)
      .attr('y', benchmarkY - 5)
      .attr('text-anchor', 'end')
      .attr('fill', '#10b981')
      .attr('font-size', '9px')
      .attr('font-family', 'monospace')
      .attr('font-weight', 'bold')
      .text('Low Bounce Target (<35%)');

    // Y Axis
    const yAxis = d3.axisLeft(yScale)
      .tickValues([0, 25, 50, 75, 100])
      .tickFormat(d => `${d}%`);

    svg.append('g')
      .attr('transform', `translate(${margin.left}, 0)`)
      .call(yAxis)
      .call(g => g.select('.domain').attr('stroke', '#334155'))
      .call(g => g.selectAll('.tick line').remove())
      .call(g => g.selectAll('.tick text')
        .attr('fill', '#64748b')
        .attr('font-size', '10px')
        .attr('font-family', 'monospace'));

    // X Axis
    const xAxis = d3.axisBottom(xScale)
      .ticks(Math.max(3, Math.floor(innerWidth / 90)))
      .tickFormat(d => d3.timeFormat('%H:%M:%S')(d as Date));

    svg.append('g')
      .attr('transform', `translate(0, ${height - margin.bottom})`)
      .call(xAxis)
      .call(g => g.select('.domain').attr('stroke', '#334155'))
      .call(g => g.selectAll('.tick line').attr('stroke', '#334155'))
      .call(g => g.selectAll('.tick text')
        .attr('fill', '#64748b')
        .attr('font-size', '10px')
        .attr('font-family', 'monospace'));

    // Area Generator
    const areaGenerator = d3.area<BounceRateDataPoint>()
      .x(d => xScale(new Date(d.timestamp)))
      .y0(yScale(0))
      .y1(d => yScale(d.bounceRate))
      .curve(d3.curveMonotoneX);

    svg.append('path')
      .datum(filteredHistory)
      .attr('d', areaGenerator)
      .attr('fill', 'url(#bounceRateAreaGradient)');

    // Line Generator
    const lineGenerator = d3.line<BounceRateDataPoint>()
      .x(d => xScale(new Date(d.timestamp)))
      .y(d => yScale(d.bounceRate))
      .curve(d3.curveMonotoneX);

    svg.append('path')
      .datum(filteredHistory)
      .attr('d', lineGenerator)
      .attr('fill', 'none')
      .attr('stroke', strokeColor)
      .attr('stroke-width', 2.5)
      .attr('filter', 'url(#lineGlow)');

    // Latest Point Pulsing Marker
    const latestPoint = filteredHistory[filteredHistory.length - 1];
    if (latestPoint) {
      const cx = xScale(new Date(latestPoint.timestamp));
      const cy = yScale(latestPoint.bounceRate);

      // Pulse circle
      svg.append('circle')
        .attr('cx', cx)
        .attr('cy', cy)
        .attr('r', 8)
        .attr('fill', strokeColor)
        .attr('opacity', 0.25)
        .append('animate')
        .attr('attributeName', 'r')
        .attr('values', '4;10;4')
        .attr('dur', '2s')
        .attr('repeatCount', 'indefinite');

      svg.append('circle')
        .attr('cx', cx)
        .attr('cy', cy)
        .attr('r', 4.5)
        .attr('fill', strokeColor)
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 1.5);
    }

    // Interactive Hover Overlay
    const overlay = svg.append('rect')
      .attr('x', margin.left)
      .attr('y', margin.top)
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'transparent')
      .attr('cursor', 'crosshair');

    const focusGroup = svg.append('g').style('display', 'none');

    const verticalLine = focusGroup.append('line')
      .attr('stroke', '#94a3b8')
      .attr('stroke-dasharray', '2 2')
      .attr('y1', margin.top)
      .attr('y2', height - margin.bottom);

    const focusCircle = focusGroup.append('circle')
      .attr('r', 5)
      .attr('fill', strokeColor)
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2);

    const bisectDate = d3.bisector<BounceRateDataPoint, Date>(d => new Date(d.timestamp)).left;

    overlay
      .on('mouseenter', () => {
        focusGroup.style('display', null);
      })
      .on('mousemove', (event) => {
        const [mx] = d3.pointer(event);
        const x0 = xScale.invert(mx);
        const i = bisectDate(filteredHistory, x0, 1);
        const d0 = filteredHistory[i - 1];
        const d1 = filteredHistory[i];
        let d = d0;
        if (d1) {
          d = (x0.getTime() - d0.timestamp > d1.timestamp - x0.getTime()) ? d1 : d0;
        }

        if (d) {
          const cx = xScale(new Date(d.timestamp));
          const cy = yScale(d.bounceRate);

          verticalLine.attr('x1', cx).attr('x2', cx);
          focusCircle.attr('cx', cx).attr('cy', cy);

          setHoveredPoint(d);
          setTooltipPos({ x: cx, y: cy });
        }
      })
      .on('mouseleave', () => {
        focusGroup.style('display', 'none');
        setHoveredPoint(null);
        setTooltipPos(null);
      });

  }, [filteredHistory, containerWidth, currentMetrics]);

  const handleClearHistory = () => {
    const now = Date.now();
    setHistory([
      {
        timestamp: now,
        timeLabel: new Date(now).toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' }),
        bounceRate: currentMetrics.bounceRate,
        activeCount: currentMetrics.activeCount,
        singlePageSessions: currentMetrics.singlePageActive,
        multiPageSessions: currentMetrics.multiPageActive,
        totalVisitors: currentMetrics.totalVisitors,
        bouncedVisitors: currentMetrics.bouncedVisitors,
      }
    ]);
  };

  const isHealthy = currentMetrics.bounceRate <= 35;
  const isModerate = currentMetrics.bounceRate > 35 && currentMetrics.bounceRate <= 60;

  return (
    <div 
      ref={containerRef}
      className={`bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 ${className}`}
    >
      {/* Header & Metrics Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl border ${
            isHealthy 
              ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-400' 
              : isModerate 
                ? 'bg-amber-950/60 border-amber-500/30 text-amber-400'
                : 'bg-rose-950/60 border-rose-500/30 text-rose-400'
          }`}>
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Real-Time Bounce Rate Trend (D3.js)
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border ${
                isHealthy
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  : isModerate
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
              }`}>
                {isHealthy ? 'Optimal Engagement' : isModerate ? 'Standard' : 'High Bounce Warning'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Continuous live telemetry tracking single-page bounces vs. multi-page deep browsing sessions
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Time Window Selectors */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[10px] font-mono">
            {(['1m', '3m', '5m', 'all'] as const).map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setTimeWindow(w)}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                  timeWindow === w
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {w === 'all' ? 'All' : w}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleClearHistory}
            title="Reset telemetry trend history"
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Key Metric Gauges Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Live Bounce Rate */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 space-y-1">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>LIVE BOUNCE RATE</span>
            {isHealthy ? (
              <TrendingDown className="w-3 h-3 text-emerald-400" />
            ) : (
              <TrendingUp className="w-3 h-3 text-rose-400" />
            )}
          </div>
          <div className="text-xl font-bold font-mono text-white flex items-baseline gap-1">
            <span className={isHealthy ? 'text-emerald-400' : isModerate ? 'text-amber-400' : 'text-rose-400'}>
              {currentMetrics.bounceRate}%
            </span>
          </div>
          <p className="text-[9px] text-slate-500 font-mono">
            {stats.bouncedSessions} of {Math.max(1, stats.totalVisitorsDispatched)} visits
          </p>
        </div>

        {/* Multi-Page Conversion */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 space-y-1">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>ENGAGED SESSIONS</span>
            <CheckCircle2 className="w-3 h-3 text-cyan-400" />
          </div>
          <div className="text-xl font-bold font-mono text-cyan-400">
            {(100 - currentMetrics.bounceRate).toFixed(1)}%
          </div>
          <p className="text-[9px] text-slate-500 font-mono">
            {Math.max(0, stats.totalVisitorsDispatched - stats.bouncedSessions)} explored &gt;1 page
          </p>
        </div>

        {/* Active Concurrent Sessions */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 space-y-1">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>ACTIVE BROWSING</span>
            <Zap className="w-3 h-3 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-300">
            {activeVisitors.length}
          </div>
          <p className="text-[9px] text-slate-500 font-mono">
            {currentMetrics.singlePageActive} single • {currentMetrics.multiPageActive} multi-page
          </p>
        </div>

        {/* Target Benchmark Comparison */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 space-y-1">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>BENCHMARK TARGET</span>
            <ShieldCheck className="w-3 h-3 text-indigo-400" />
          </div>
          <div className="text-xl font-bold font-mono text-indigo-300">
            &lt; 35%
          </div>
          <p className="text-[9px] text-slate-500 font-mono">
            {currentMetrics.bounceRate <= 35 ? 'Target Met (Low)' : 'Above Target Benchmark'}
          </p>
        </div>
      </div>

      {/* D3.js SVG Chart Canvas */}
      <div className="relative w-full h-[240px] bg-slate-950/90 rounded-xl border border-slate-800/80 overflow-hidden">
        <svg
          ref={svgRef}
          width={containerWidth}
          height={240}
          className="w-full h-full block select-none"
        />

        {/* Floating Tooltip Card */}
        {hoveredPoint && tooltipPos && (
          <div 
            className="absolute pointer-events-none z-20 bg-slate-900/95 border border-slate-700 rounded-xl px-3 py-2 text-xs shadow-xl backdrop-blur-md transition-transform duration-75 space-y-1 font-mono"
            style={{
              left: Math.min(containerWidth - 180, Math.max(10, tooltipPos.x - 70)),
              top: Math.max(10, tooltipPos.y - 85),
            }}
          >
            <div className="flex items-center justify-between gap-3 text-slate-400 text-[10px] border-b border-slate-800 pb-1">
              <span>Time: {hoveredPoint.timeLabel}</span>
              <span className={`font-bold ${
                hoveredPoint.bounceRate <= 35 ? 'text-emerald-400' : hoveredPoint.bounceRate <= 60 ? 'text-amber-400' : 'text-rose-400'
              }`}>
                {hoveredPoint.bounceRate}%
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-2 text-[10px] text-slate-300">
              <span>Active Browsing:</span>
              <span className="text-right text-cyan-400">{hoveredPoint.activeCount}</span>
              <span>1-Page Sessions:</span>
              <span className="text-right text-rose-400">{hoveredPoint.singlePageSessions}</span>
              <span>Multi-Page:</span>
              <span className="text-right text-emerald-400">{hoveredPoint.multiPageSessions}</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500 font-mono pt-1">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>Calculated per Google Analytics 4 engagement criteria (&lt;10s single-page = bounce; multi-page/interaction = engaged).</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Target &lt;35%</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>35%-60%</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>&gt;60%</span>
          </span>
        </div>
      </div>
    </div>
  );
};
