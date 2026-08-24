import React from 'react';
import { ShieldCheck, Plus, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { SlaAssertion } from '../types';

interface AssertionsConfigProps {
  assertions: SlaAssertion[];
  onChange: (assertions: SlaAssertion[]) => void;
}

export const AssertionsConfig: React.FC<AssertionsConfigProps> = ({ assertions, onChange }) => {
  const metricOptions: { value: SlaAssertion['metric']; label: string; unit: string }[] = [
    { value: 'p95_latency', label: 'P95 Latency', unit: 'ms' },
    { value: 'p99_latency', label: 'P99 Latency', unit: 'ms' },
    { value: 'avg_latency', label: 'Average Latency', unit: 'ms' },
    { value: 'error_rate', label: 'Error Rate', unit: '%' },
    { value: 'success_rate', label: 'Success Rate', unit: '%' },
    { value: 'min_rps', label: 'Minimum Sustained RPS', unit: 'req/s' },
  ];

  const handleAddAssertion = () => {
    const newAss: SlaAssertion = {
      id: `a_${Date.now()}`,
      metric: 'p95_latency',
      operator: '<',
      threshold: 300,
      description: 'P95 latency should remain under 300ms',
    };
    onChange([...assertions, newAss]);
  };

  const handleUpdate = (index: number, field: keyof SlaAssertion, val: any) => {
    const updated = [...assertions];
    updated[index] = { ...updated[index], [field]: val };
    onChange(updated);
  };

  const handleRemove = (index: number) => {
    onChange(assertions.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
            SLA Quality Gates & Pass/Fail Assertions
          </label>
          <p className="text-[11px] text-slate-400">
            Define automated performance criteria. If any threshold is breached, the test is flagged.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddAssertion}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 text-xs font-medium cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Add Quality Gate
        </button>
      </div>

      <div className="space-y-2.5">
        {assertions.map((item, idx) => {
          const selectedMetric = metricOptions.find(m => m.value === item.metric) || metricOptions[0];
          return (
            <div key={item.id || idx} className="bg-slate-900/70 border border-slate-800 p-3 rounded-xl flex flex-col md:flex-row items-stretch md:items-center gap-3">
              <select
                value={item.metric}
                onChange={(e) => handleUpdate(idx, 'metric', e.target.value as SlaAssertion['metric'])}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-medium"
              >
                {metricOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>

              <select
                value={item.operator}
                onChange={(e) => handleUpdate(idx, 'operator', e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-cyan-300 font-mono font-bold"
              >
                <option value="<">&lt; (less than)</option>
                <option value="<=">&lt;= (less or equal)</option>
                <option value=">">&gt; (greater than)</option>
                <option value=">=">&gt;= (greater or equal)</option>
              </select>

              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={item.threshold}
                  onChange={(e) => handleUpdate(idx, 'threshold', parseFloat(e.target.value) || 0)}
                  className="w-24 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-cyan-300 font-bold"
                />
                <span className="text-xs text-slate-400 font-medium">{selectedMetric.unit}</span>
              </div>

              <input
                type="text"
                value={item.description}
                onChange={(e) => handleUpdate(idx, 'description', e.target.value)}
                placeholder="Description / SLA rationale"
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300"
              />

              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg cursor-pointer self-end md:self-center"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}

        {assertions.length === 0 && (
          <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl">
            <p className="text-xs text-slate-400">No SLA quality gates defined. Click &quot;Add Quality Gate&quot; to set thresholds.</p>
          </div>
        )}
      </div>
    </div>
  );
};
