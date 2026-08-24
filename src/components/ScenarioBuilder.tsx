import React from 'react';
import { 
  Layers, 
  Plus, 
  Trash2, 
  ArrowRight, 
  Clock, 
  Variable, 
  CheckCircle2, 
  HelpCircle,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { HttpMethod, ScenarioStep } from '../types';

interface ScenarioBuilderProps {
  isMultiStep: boolean;
  steps: ScenarioStep[];
  onChange: (isMultiStep: boolean, steps: ScenarioStep[]) => void;
}

export const ScenarioBuilder: React.FC<ScenarioBuilderProps> = ({ isMultiStep, steps, onChange }) => {
  const methods: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

  const handleToggleMultiStep = () => {
    if (!isMultiStep && steps.length === 0) {
      // populate 2 default realistic steps
      const defaultSteps: ScenarioStep[] = [
        {
          id: 'step_1',
          name: '1. User Auth & Token',
          method: 'POST',
          url: '/api/sandbox/auth/login',
          headers: [{ id: 'h1', key: 'Content-Type', value: 'application/json', enabled: true }],
          params: [],
          bodyType: 'json',
          bodyContent: '{"username":"{{random_name}}","password":"secretPass123"}',
          weight: 100,
          extractVariables: [{ varName: 'authToken', jsonPath: 'token' }],
          thinkTimeMs: 150
        },
        {
          id: 'step_2',
          name: '2. Search Catalog with Token',
          method: 'GET',
          url: '/api/sandbox/products',
          headers: [{ id: 'h2', key: 'Authorization', value: 'Bearer {{authToken}}', enabled: true }],
          params: [{ id: 'p1', key: 'category', value: 'electronics', enabled: true }],
          bodyType: 'none',
          bodyContent: '',
          weight: 100,
          thinkTimeMs: 250
        }
      ];
      onChange(true, defaultSteps);
    } else {
      onChange(!isMultiStep, steps);
    }
  };

  const handleAddStep = () => {
    const newStep: ScenarioStep = {
      id: `step_${Date.now()}`,
      name: `${steps.length + 1}. New Step Action`,
      method: 'GET',
      url: '/api/sandbox/products',
      headers: [{ id: `h_${Date.now()}`, key: 'Content-Type', value: 'application/json', enabled: true }],
      params: [],
      bodyType: 'none',
      bodyContent: '',
      weight: 100,
      thinkTimeMs: 200,
    };
    onChange(isMultiStep, [...steps, newStep]);
  };

  const handleUpdateStep = (index: number, updated: Partial<ScenarioStep>) => {
    const nextSteps = [...steps];
    nextSteps[index] = { ...nextSteps[index], ...updated };
    onChange(isMultiStep, nextSteps);
  };

  const handleRemoveStep = (index: number) => {
    onChange(isMultiStep, steps.filter((_, i) => i !== index));
  };

  const handleAddExtractVar = (stepIndex: number) => {
    const nextSteps = [...steps];
    const current = nextSteps[stepIndex].extractVariables || [];
    nextSteps[stepIndex].extractVariables = [
      ...current,
      { varName: 'sessionVar', jsonPath: 'data.id' }
    ];
    onChange(isMultiStep, nextSteps);
  };

  const handleUpdateExtractVar = (stepIndex: number, varIndex: number, field: 'varName' | 'jsonPath', value: string) => {
    const nextSteps = [...steps];
    const vars = [...(nextSteps[stepIndex].extractVariables || [])];
    vars[varIndex] = { ...vars[varIndex], [field]: value };
    nextSteps[stepIndex].extractVariables = vars;
    onChange(isMultiStep, nextSteps);
  };

  const handleRemoveExtractVar = (stepIndex: number, varIndex: number) => {
    const nextSteps = [...steps];
    nextSteps[stepIndex].extractVariables = (nextSteps[stepIndex].extractVariables || []).filter((_, i) => i !== varIndex);
    onChange(isMultiStep, nextSteps);
  };

  return (
    <div className="space-y-6">
      {/* Enable/Disable Multi-Step Toggle */}
      <div className="flex items-center justify-between p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-100">Multi-Step User Journey Sequence</span>
              {isMultiStep ? (
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Active
                </span>
              ) : (
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                  Single Endpoint
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Chain sequential requests (e.g. Login ➔ Extract Token ➔ Browse Catalog ➔ Submit Order) per virtual user.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggleMultiStep}
          className="text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
        >
          {isMultiStep ? (
            <ToggleRight className="w-8 h-8 text-cyan-400" />
          ) : (
            <ToggleLeft className="w-8 h-8 text-slate-600" />
          )}
        </button>
      </div>

      {isMultiStep && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Sequence Steps ({steps.length})
            </span>
            <button
              type="button"
              onClick={handleAddStep}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 text-xs font-medium cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Step
            </button>
          </div>

          {/* Sequence Steps List */}
          <div className="space-y-3">
            {steps.map((step, idx) => (
              <div key={step.id || idx} className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-cyan-400">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={step.name}
                      onChange={(e) => handleUpdateStep(idx, { name: e.target.value })}
                      placeholder="Step Name (e.g. Auth & Token)"
                      className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-100 focus:ring-1 focus:ring-cyan-500 flex-1 max-w-sm"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>Think Time:</span>
                      <input
                        type="number"
                        min="0"
                        step="50"
                        value={step.thinkTimeMs}
                        onChange={(e) => handleUpdateStep(idx, { thinkTimeMs: parseInt(e.target.value, 10) || 0 })}
                        className="w-16 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-cyan-300 font-mono text-center"
                      />
                      <span>ms</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveStep(idx)}
                      className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors cursor-pointer"
                      title="Remove Step"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Step URL & Method */}
                <div className="flex items-center gap-2">
                  <select
                    value={step.method}
                    onChange={(e) => handleUpdateStep(idx, { method: e.target.value as HttpMethod })}
                    className="bg-slate-950 border border-slate-700 text-xs font-bold font-mono text-cyan-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
                  >
                    {methods.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>

                  <input
                    type="text"
                    value={step.url}
                    onChange={(e) => handleUpdateStep(idx, { url: e.target.value })}
                    placeholder="/api/sandbox/products or https://..."
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>

                {/* Step Body (if POST/PUT/PATCH) */}
                {['POST', 'PUT', 'PATCH'].includes(step.method) && (
                  <div>
                    <label className="text-[11px] font-medium text-slate-400 block mb-1">Payload JSON (supports extracted variables):</label>
                    <textarea
                      rows={2}
                      value={step.bodyContent}
                      onChange={(e) => handleUpdateStep(idx, { bodyContent: e.target.value, bodyType: 'json' })}
                      placeholder={`{"token": "{{authToken}}", "item": "{{random_sku}}"}`}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono text-cyan-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>
                )}

                {/* Extract Response Variables Section */}
                <div className="pt-2 border-t border-slate-800/80">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-medium text-indigo-300 flex items-center gap-1">
                      <Variable className="w-3 h-3 text-indigo-400" />
                      Extract Variables from JSON Response
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAddExtractVar(idx)}
                      className="text-[10px] text-cyan-400 hover:text-cyan-300 cursor-pointer"
                    >
                      + Extract Variable
                    </button>
                  </div>

                  {(step.extractVariables || []).map((ev, vIdx) => (
                    <div key={vIdx} className="flex items-center gap-2 mt-1.5">
                      <input
                        type="text"
                        value={ev.varName}
                        onChange={(e) => handleUpdateExtractVar(idx, vIdx, 'varName', e.target.value)}
                        placeholder="Variable Name (e.g. authToken)"
                        className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[11px] text-cyan-300 font-mono flex-1"
                      />
                      <ArrowRight className="w-3 h-3 text-slate-500" />
                      <input
                        type="text"
                        value={ev.jsonPath}
                        onChange={(e) => handleUpdateExtractVar(idx, vIdx, 'jsonPath', e.target.value)}
                        placeholder="JSON Path (e.g. token or data.id)"
                        className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[11px] text-indigo-300 font-mono flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveExtractVar(idx, vIdx)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
