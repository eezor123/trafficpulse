import React, { useState } from 'react';
import { 
  Globe, 
  Send, 
  Plus, 
  Trash2, 
  Code2, 
  Sparkles, 
  Layers, 
  ShieldCheck, 
  Users, 
  Sliders, 
  Server,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { EngineMode, HttpMethod, TrafficConfig } from '../types';
import { LoadProfileBuilder } from './LoadProfileBuilder';
import { PersonaConfigView } from './PersonaConfig';
import { ScenarioBuilder } from './ScenarioBuilder';
import { AssertionsConfig } from './AssertionsConfig';

interface ConfigPanelProps {
  config: TrafficConfig;
  onChange: (newConfig: TrafficConfig) => void;
  onOpenAiFuzzer: () => void;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({ config, onChange, onOpenAiFuzzer }) => {
  const [activeTab, setActiveTab] = useState<'request' | 'profile' | 'persona' | 'scenario' | 'assertions'>('request');

  const methods: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

  const quickEndpoints = [
    { label: '📦 Products Catalog', url: '/api/sandbox/products', method: 'GET' as HttpMethod, mode: 'built_in_sandbox' as EngineMode },
    { label: '🛒 Orders API', url: '/api/sandbox/orders', method: 'POST' as HttpMethod, mode: 'built_in_sandbox' as EngineMode },
    { label: '🔑 Auth Login', url: '/api/sandbox/auth/login', method: 'POST' as HttpMethod, mode: 'built_in_sandbox' as EngineMode },
    { label: '⚡ Flaky Microservice', url: '/api/sandbox/flaky', method: 'GET' as HttpMethod, mode: 'built_in_sandbox' as EngineMode },
  ];

  const templateVariables = [
    { label: '{{uuid}}', desc: 'Random v4 UUID' },
    { label: '{{timestamp}}', desc: 'Epoch milliseconds' },
    { label: '{{random_email}}', desc: 'Synthetic user email' },
    { label: '{{random_sku}}', desc: 'E-commerce item SKU' },
    { label: '{{random_int_1_100}}', desc: 'Random integer 1-100' },
    { label: '{{random_city}}', desc: 'City name' },
    { label: '{{random_search}}', desc: 'E-commerce search keywords' },
  ];

  const handleAddHeader = () => {
    onChange({
      ...config,
      headers: [...config.headers, { id: `h_${Date.now()}`, key: '', value: '', enabled: true }]
    });
  };

  const handleUpdateHeader = (index: number, field: 'key' | 'value' | 'enabled', val: any) => {
    const updated = [...config.headers];
    updated[index] = { ...updated[index], [field]: val };
    onChange({ ...config, headers: updated });
  };

  const handleRemoveHeader = (index: number) => {
    onChange({
      ...config,
      headers: config.headers.filter((_, i) => i !== index)
    });
  };

  const handleAddParam = () => {
    onChange({
      ...config,
      params: [...config.params, { id: `p_${Date.now()}`, key: '', value: '', enabled: true }]
    });
  };

  const handleUpdateParam = (index: number, field: 'key' | 'value' | 'enabled', val: any) => {
    const updated = [...config.params];
    updated[index] = { ...updated[index], [field]: val };
    onChange({ ...config, params: updated });
  };

  const handleRemoveParam = (index: number) => {
    onChange({
      ...config,
      params: config.params.filter((_, i) => i !== index)
    });
  };

  const insertVariableIntoBody = (varTag: string) => {
    onChange({
      ...config,
      bodyContent: (config.bodyContent || '') + varTag
    });
  };

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(config.bodyContent);
      onChange({
        ...config,
        bodyContent: JSON.stringify(parsed, null, 2)
      });
    } catch {
      // ignore
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Primary Target URL & Method Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-950/40">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Method Selector */}
          <div className="relative min-w-[110px]">
            <select
              value={config.method}
              onChange={(e) => onChange({ ...config, method: e.target.value as HttpMethod })}
              className="w-full bg-slate-900 border border-slate-700 text-xs font-bold font-mono text-cyan-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer appearance-none text-center"
            >
              {methods.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* URL Input */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Globe className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={config.targetUrl}
              onChange={(e) => onChange({ ...config, targetUrl: e.target.value })}
              placeholder="https://api.yourdomain.com/v1/resource or /api/sandbox/products"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
            />
          </div>

          {/* Engine Mode */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-xl p-1">
            <button
              type="button"
              onClick={() => onChange({ ...config, engineMode: 'built_in_sandbox' })}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                config.engineMode === 'built_in_sandbox'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Target Built-in Sandbox Mock Microservices"
            >
              Sandbox
            </button>
            <button
              type="button"
              onClick={() => onChange({ ...config, engineMode: 'server_proxy' })}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                config.engineMode === 'server_proxy'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Bypass CORS via Server-Side Proxy Dispatcher"
            >
              Server Proxy
            </button>
            <button
              type="button"
              onClick={() => onChange({ ...config, engineMode: 'client_direct' })}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                config.engineMode === 'client_direct'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Direct Client Fetch Dispatcher"
            >
              Direct
            </button>
          </div>
        </div>

        {/* Quick Endpoint Chips */}
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-800/60">
          <span className="text-[11px] font-medium text-slate-400">Quick Sandboxes:</span>
          {quickEndpoints.map((ep, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onChange({ ...config, targetUrl: ep.url, method: ep.method, engineMode: ep.mode })}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700 hover:border-slate-600 transition-all"
            >
              {ep.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 px-4 border-b border-slate-800 bg-slate-950/20 overflow-x-auto">
        <button
          onClick={() => setActiveTab('request')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'request'
              ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          Request Headers & Body
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'profile'
              ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          Load Profile & RPS
        </button>

        <button
          onClick={() => setActiveTab('persona')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'persona'
              ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Synthetic Personas & Geo
        </button>

        <button
          onClick={() => setActiveTab('scenario')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'scenario'
              ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Multi-Step Flow
          {config.isMultiStep && (
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('assertions')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'assertions'
              ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          SLA Assertions ({config.assertions.length})
        </button>
      </div>

      {/* Tab Contents */}
      <div className="p-4 sm:p-5">
        {/* 1. Request Tab */}
        {activeTab === 'request' && (
          <div className="space-y-5">
            {/* Headers Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  HTTP Request Headers ({config.headers.length})
                </label>
                <button
                  type="button"
                  onClick={handleAddHeader}
                  className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 cursor-pointer font-medium"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Header
                </button>
              </div>

              <div className="space-y-2">
                {config.headers.map((h, i) => (
                  <div key={h.id || i} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={h.enabled}
                      onChange={(e) => handleUpdateHeader(i, 'enabled', e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-cyan-500"
                    />
                    <input
                      type="text"
                      placeholder="Header Name (e.g. Authorization)"
                      value={h.key}
                      onChange={(e) => handleUpdateHeader(i, 'key', e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                    <input
                      type="text"
                      placeholder="Header Value (supports {{uuid}})"
                      value={h.value}
                      onChange={(e) => handleUpdateHeader(i, 'value', e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveHeader(i)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Query Params Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Query Parameters ({config.params.length})
                </label>
                <button
                  type="button"
                  onClick={handleAddParam}
                  className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 cursor-pointer font-medium"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Param
                </button>
              </div>

              <div className="space-y-2">
                {config.params.map((p, i) => (
                  <div key={p.id || i} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={p.enabled}
                      onChange={(e) => handleUpdateParam(i, 'enabled', e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-cyan-500"
                    />
                    <input
                      type="text"
                      placeholder="Key (e.g. limit)"
                      value={p.key}
                      onChange={(e) => handleUpdateParam(i, 'key', e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                    <input
                      type="text"
                      placeholder="Value (e.g. {{random_int_1_10}})"
                      value={p.value}
                      onChange={(e) => handleUpdateParam(i, 'value', e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveParam(i)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Request Body Section (for POST, PUT, PATCH, DELETE) */}
            {['POST', 'PUT', 'PATCH', 'DELETE'].includes(config.method) && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Request Payload Body (JSON)
                    </label>
                    <button
                      type="button"
                      onClick={handleFormatJson}
                      className="text-[11px] text-slate-400 hover:text-slate-200 underline cursor-pointer"
                    >
                      Format JSON
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenAiFuzzer}
                    className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> AI Fuzzing Payloads
                  </button>
                </div>

                <div className="relative">
                  <textarea
                    rows={6}
                    value={config.bodyContent}
                    onChange={(e) => onChange({ ...config, bodyContent: e.target.value, bodyType: 'json' })}
                    placeholder={`{\n  "sku": "{{random_sku}}",\n  "qty": {{random_int_1_10}},\n  "buyer": "{{random_email}}"\n}`}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-cyan-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 leading-relaxed"
                  />
                </div>

                {/* Variable Inserter Chips */}
                <div className="mt-2.5">
                  <span className="text-[11px] text-slate-400 block mb-1.5 font-medium">Click to inject dynamic faker variable:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {templateVariables.map((v, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => insertVariableIntoBody(v.label)}
                        className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700 hover:border-cyan-500/50 hover:bg-slate-750 transition-all cursor-pointer"
                        title={v.desc}
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. Load Profile Tab */}
        {activeTab === 'profile' && (
          <LoadProfileBuilder
            profile={config.loadProfile}
            onChange={(newProfile) => onChange({ ...config, loadProfile: newProfile })}
          />
        )}

        {/* 3. Persona Tab */}
        {activeTab === 'persona' && (
          <PersonaConfigView
            persona={config.persona}
            onChange={(newPersona) => onChange({ ...config, persona: newPersona })}
          />
        )}

        {/* 4. Scenario Flow Tab */}
        {activeTab === 'scenario' && (
          <ScenarioBuilder
            isMultiStep={config.isMultiStep}
            steps={config.steps}
            onChange={(isMultiStep, steps) => onChange({ ...config, isMultiStep, steps })}
          />
        )}

        {/* 5. SLA Assertions Tab */}
        {activeTab === 'assertions' && (
          <AssertionsConfig
            assertions={config.assertions}
            onChange={(newAssertions) => onChange({ ...config, assertions: newAssertions })}
          />
        )}
      </div>
    </div>
  );
};
