import React, { useState } from 'react';
import { 
  Database, 
  Send, 
  CheckCircle, 
  AlertTriangle, 
  Layers, 
  Clock, 
  Shuffle, 
  Code,
  Copy,
  Check
} from 'lucide-react';

interface MockSandboxManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEndpoint: (url: string, method: 'GET' | 'POST', body?: string) => void;
}

export const MockSandboxManager: React.FC<MockSandboxManagerProps> = ({
  isOpen,
  onClose,
  onSelectEndpoint,
}) => {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [testResult, setTestResult] = useState<any | null>(null);
  const [loadingEp, setLoadingEp] = useState<string | null>(null);

  if (!isOpen) return null;

  const sandboxApis = [
    {
      name: 'E-Commerce Product Catalog',
      method: 'GET' as const,
      url: '/api/sandbox/products',
      params: '?category=electronics&limit=10&page=1',
      desc: 'Simulates a high-throughput read-heavy catalog with realistic query pagination, filters, and 15-40ms server processing delays.',
      sampleBody: '',
    },
    {
      name: 'User Authentication & JWT Issuance',
      method: 'POST' as const,
      url: '/api/sandbox/auth/login',
      params: '',
      desc: 'Simulates user login verification with cryptographic JWT generation, expiry attributes, and variable cryptographic hash delays.',
      sampleBody: '{\n  "username": "alex_pro",\n  "password": "superSecretPassword123"\n}',
    },
    {
      name: 'Order Placement & Checkout Processing',
      method: 'POST' as const,
      url: '/api/sandbox/orders',
      params: '',
      desc: 'Simulates order creation with inventory reservations, transaction processing, and occasional contention under high bursts.',
      sampleBody: '{\n  "sku": "SKU-1024-X",\n  "quantity": 2,\n  "shippingCity": "San Francisco"\n}',
    },
    {
      name: 'Chaos & Flaky Microservice Resiliency',
      method: 'GET' as const,
      url: '/api/sandbox/flaky',
      params: '?errorRate=20&jitterMaxMs=300',
      desc: 'Simulates unstable downstream microservices with random 500 internal errors, 503 unavailable queues, 429 rate limits, and latency spikes.',
      sampleBody: '',
    },
    {
      name: 'Echo & Header Reflection Inspector',
      method: 'POST' as const,
      url: '/api/sandbox/echo',
      params: '',
      desc: 'Returns full mirror of incoming headers, IP, payload body, and timestamps for testing proxy rules and custom headers.',
      sampleBody: '{\n  "testId": "echo_probe_01",\n  "active": true\n}',
    },
  ];

  const handleQuickProbe = async (api: typeof sandboxApis[0]) => {
    setLoadingEp(api.url);
    setTestResult(null);
    try {
      const fullUrl = `${api.url}${api.params}`;
      const start = performance.now();
      const options: RequestInit = {
        method: api.method,
        headers: { 'Content-Type': 'application/json' },
      };
      if (api.method === 'POST' && api.sampleBody) {
        options.body = api.sampleBody;
      }
      const res = await fetch(fullUrl, options);
      const data = await res.json();
      const latency = Math.round(performance.now() - start);

      setTestResult({
        endpoint: fullUrl,
        statusCode: res.status,
        latencyMs: latency,
        data,
      });
    } catch (err: any) {
      setTestResult({
        endpoint: api.url,
        statusCode: 0,
        latencyMs: 0,
        error: err.message,
      });
    } finally {
      setLoadingEp(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">Built-in Target Sandbox APIs</h2>
              <p className="text-xs text-slate-400">Zero-configuration local microservices ready for stress testing</p>
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

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          <div className="grid grid-cols-1 gap-3">
            {sandboxApis.map((api, idx) => (
              <div key={idx} className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      api.method === 'GET' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {api.method}
                    </span>
                    <span className="text-xs font-bold text-slate-100">{api.name}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickProbe(api)}
                      disabled={loadingEp === api.url}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer transition-colors"
                    >
                      {loadingEp === api.url ? 'Probing...' : 'Quick Probe ⚡'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectEndpoint(`${api.url}${api.params}`, api.method, api.sampleBody);
                        onClose();
                      }}
                      className="px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold cursor-pointer shadow-sm transition-colors"
                    >
                      Load into Generator →
                    </button>
                  </div>
                </div>

                <div className="font-mono text-xs text-cyan-300 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800/80">
                  {api.url}{api.params}
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">{api.desc}</p>
              </div>
            ))}
          </div>

          {/* Live Probe Result Box */}
          {testResult && (
            <div className="p-4 bg-slate-950 border border-indigo-500/30 rounded-xl space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-300">
                  Probe Result: {testResult.endpoint}
                </span>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    testResult.statusCode >= 200 && testResult.statusCode < 300 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    HTTP {testResult.statusCode}
                  </span>
                  <span className="text-xs font-mono text-amber-300 font-medium">
                    {testResult.latencyMs} ms
                  </span>
                </div>
              </div>
              <pre className="bg-slate-900 p-2.5 rounded text-[11px] font-mono text-cyan-200 overflow-x-auto max-h-40">
                {JSON.stringify(testResult.data || testResult.error, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
