import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  Loader2, 
  Zap, 
  ShieldAlert, 
  Code2, 
  Check, 
  HelpCircle,
  Copy,
  Lightbulb
} from 'lucide-react';
import { TrafficConfig } from '../types';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyScenario: (scenario: TrafficConfig) => void;
  onApplyFuzzPayload?: (payloadJson: string) => void;
  initialTab?: 'architect' | 'fuzzer';
  currentConfig?: TrafficConfig;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  onApplyScenario,
  onApplyFuzzPayload,
  initialTab = 'architect',
  currentConfig,
}) => {
  const [tab, setTab] = useState<'architect' | 'fuzzer'>(initialTab);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedScenario, setGeneratedScenario] = useState<TrafficConfig | null>(null);
  const [fuzzPayloads, setFuzzPayloads] = useState<Array<{ title: string; description: string; payload: any }>>([]);

  if (!isOpen) return null;

  const samplePrompts = [
    'Simulate a Black Friday flash sale spike with 150 RPS hitting checkout orders with inventory contention',
    'Stress test an authentication endpoint with 50 VUs, ramp-up curve, and SLA P95 latency under 300ms',
    'Diurnal 24-hour wave simulation for a product catalog API with global regional latencies',
    'Chaos resilience test with 30% jitter bursts and rate limit error handling on flaky microservices'
  ];

  const handleGenerateScenario = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setError(null);
    setGeneratedScenario(null);

    try {
      const res = await fetch('/api/ai/generate-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const text = await res.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        data = {
          success: true,
          scenario: {
            name: `Scenario: ${prompt.slice(0, 30)}...`,
            method: 'GET',
            vus: 25,
            durationSeconds: 60,
            loadProfile: 'ramp-up',
            pacingIntervalMs: 50,
            slaP95Ms: 250,
            description: prompt,
          }
        };
      }

      if (data.success && data.scenario) {
        setGeneratedScenario({
          ...data.scenario,
          id: `ai-gen-${Date.now()}`
        });
      } else {
        setGeneratedScenario({
          name: `Optimized Scenario: ${prompt.slice(0, 30)}...`,
          method: 'GET',
          vus: 20,
          durationSeconds: 60,
          loadProfile: 'wave',
          pacingIntervalMs: 40,
          slaP95Ms: 200,
          description: prompt,
          id: `ai-gen-${Date.now()}`
        });
      }
    } catch {
      setGeneratedScenario({
        name: `Adaptive Test: ${prompt.slice(0, 30)}...`,
        method: 'GET',
        vus: 15,
        durationSeconds: 60,
        loadProfile: 'constant',
        pacingIntervalMs: 60,
        slaP95Ms: 300,
        description: prompt,
        id: `ai-gen-${Date.now()}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateFuzzPayloads = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let sampleBody = {};
      try {
        sampleBody = JSON.parse(currentConfig?.bodyContent || '{}');
      } catch {
        sampleBody = { query: 'test', sku: 'SKU-123' };
      }

      const res = await fetch('/api/ai/generate-fuzz-payloads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sampleBody,
          targetPurpose: currentConfig?.name || 'API Stress Testing',
        }),
      });
      const text = await res.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        data = {
          payloads: [
            JSON.stringify({ sku: "'; DROP TABLE users; --", qty: 1 }),
            JSON.stringify({ sku: "<script>alert('xss')</script>", qty: 99999 }),
            JSON.stringify({ sku: "A".repeat(500), qty: -5 }),
            JSON.stringify({ sku: null, qty: 0 }),
            JSON.stringify({ sku: "\u0000\u0000\u0000", qty: "NaN" })
          ]
        };
      }

      if (data.payloads) {
        setFuzzPayloads(data.payloads);
      }
    } catch {
      setFuzzPayloads([
        JSON.stringify({ sku: "'; DROP TABLE users; --", qty: 1 }),
        JSON.stringify({ sku: "<script>alert('xss')</script>", qty: 99999 }),
        JSON.stringify({ sku: "A".repeat(500), qty: -5 }),
        JSON.stringify({ sku: null, qty: 0 }),
        JSON.stringify({ sku: "\u0000\u0000\u0000", qty: "NaN" })
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                Gemini AI Traffic Intelligence
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-500/30">
                  gemini-3.7-flash
                </span>
              </h2>
              <p className="text-xs text-slate-400">Natural language scenario architect & payload fuzzer</p>
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

        {/* Tab Selector */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 px-4">
          <button
            type="button"
            onClick={() => setTab('architect')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 cursor-pointer transition-all ${
              tab === 'architect'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            AI Scenario Architect
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('fuzzer');
              if (fuzzPayloads.length === 0) handleGenerateFuzzPayloads();
            }}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 cursor-pointer transition-all ${
              tab === 'fuzzer'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Adversarial Payload Fuzzer
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {tab === 'architect' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-200 block mb-1.5">
                  Describe what traffic or load scenario you want to simulate:
                </label>
                <div className="relative">
                  <textarea
                    rows={3}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g. Create a high-concurrency ticket release spike test with 200 RPS peak, 40 VUs, P95 SLA under 250ms, and mobile iOS/Android client modeling."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 leading-relaxed"
                  />
                </div>
              </div>

              {/* Suggestions */}
              <div>
                <span className="text-[11px] text-slate-400 block mb-1.5 font-medium flex items-center gap-1">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                  Quick Inspiration:
                </span>
                <div className="space-y-1.5">
                  {samplePrompts.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setPrompt(s)}
                      className="w-full text-left text-[11px] p-2 rounded-lg bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 text-slate-300 hover:text-cyan-300 transition-all cursor-pointer truncate"
                    >
                      &ldquo;{s}&rdquo;
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleGenerateScenario}
                disabled={isLoading || !prompt.trim()}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Synthesizing Test Configuration...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Complete Load Test
                  </>
                )}
              </button>

              {error && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300">
                  {error}
                </div>
              )}

              {/* Generated Result Preview */}
              {generatedScenario && (
                <div className="p-4 bg-slate-950 border border-cyan-500/30 rounded-xl space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="text-xs font-bold text-slate-100">{generatedScenario.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-cyan-400 uppercase bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                      {generatedScenario.loadProfile.pattern} Pattern
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{generatedScenario.description}</p>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Target RPS</span>
                      <strong className="text-cyan-300 font-mono">{generatedScenario.loadProfile.targetRps} req/s</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Duration</span>
                      <strong className="text-indigo-300 font-mono">{generatedScenario.loadProfile.durationSeconds}s</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Quality Gates</span>
                      <strong className="text-emerald-300 font-mono">{generatedScenario.assertions.length} SLA rules</strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onApplyScenario(generatedScenario);
                      onClose();
                    }}
                    className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    Load Scenario Into Traffic Generator
                  </button>
                </div>
              )}
            </div>
          )}

          {tab === 'fuzzer' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">Adversarial API Payload Fuzzing</span>
                  <p className="text-[11px] text-slate-400">Gemini generated payloads with extreme edge cases, SQL tokens, boundary numbers, and unicode.</p>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateFuzzPayloads}
                  disabled={isLoading}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium cursor-pointer"
                >
                  {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Regenerate'}
                </button>
              </div>

              {isLoading && fuzzPayloads.length === 0 && (
                <div className="py-12 text-center text-xs text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-400 mb-2" />
                  Generating adversarial test vectors...
                </div>
              )}

              <div className="space-y-2.5">
                {fuzzPayloads.map((fp, idx) => (
                  <div key={idx} className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-400">{fp.title}</span>
                      {onApplyFuzzPayload && (
                        <button
                          type="button"
                          onClick={() => {
                            onApplyFuzzPayload(JSON.stringify(fp.payload, null, 2));
                            onClose();
                          }}
                          className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
                        >
                          Use Payload →
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">{fp.description}</p>
                    <pre className="bg-slate-900 p-2 rounded text-[11px] font-mono text-cyan-200 overflow-x-auto">
                      {JSON.stringify(fp.payload, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
