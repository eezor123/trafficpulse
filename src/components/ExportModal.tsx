import React, { useState } from 'react';
import { 
  Code2, 
  Copy, 
  Check, 
  Download, 
  Terminal, 
  FileText 
} from 'lucide-react';
import { TrafficConfig } from '../types';
import { 
  generateK6Script, 
  generateLocustScript, 
  generateCurlScript, 
  generateAutocannonScript 
} from '../utils/codeGenerators';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: TrafficConfig;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, config }) => {
  const [activeTab, setActiveTab] = useState<'k6' | 'locust' | 'curl' | 'autocannon' | 'json'>('k6');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const getCode = () => {
    switch (activeTab) {
      case 'k6':
        return generateK6Script(config);
      case 'locust':
        return generateLocustScript(config);
      case 'curl':
        return generateCurlScript(config);
      case 'autocannon':
        return generateAutocannonScript(config);
      case 'json':
        return JSON.stringify(config, null, 2);
    }
  };

  const code = getCode();

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = activeTab === 'k6' ? 'js' : activeTab === 'locust' ? 'py' : activeTab === 'curl' ? 'sh' : activeTab === 'autocannon' ? 'js' : 'json';
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `traffic-pulse-${config.name.toLowerCase().replace(/\s+/g, '-')}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">Export Load Test & Automation Scripts</h2>
              <p className="text-xs text-slate-400">Translate current configuration to industry standard load testing suites</p>
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

        {/* Tab Buttons */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 px-4">
          <button
            onClick={() => setActiveTab('k6')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 cursor-pointer transition-all ${
              activeTab === 'k6' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            k6 (JavaScript)
          </button>
          <button
            onClick={() => setActiveTab('locust')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 cursor-pointer transition-all ${
              activeTab === 'locust' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Locust (Python)
          </button>
          <button
            onClick={() => setActiveTab('curl')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 cursor-pointer transition-all ${
              activeTab === 'curl' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            cURL (Bash Loop)
          </button>
          <button
            onClick={() => setActiveTab('autocannon')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 cursor-pointer transition-all ${
              activeTab === 'autocannon' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Autocannon (Node.js)
          </button>
          <button
            onClick={() => setActiveTab('json')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 cursor-pointer transition-all ${
              activeTab === 'json' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            JSON Config
          </button>
        </div>

        {/* Code Content */}
        <div className="p-4 overflow-hidden flex-1 flex flex-col bg-slate-950">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono text-slate-400">
              {activeTab.toUpperCase()} Executable Script
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy Code'}
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium cursor-pointer transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Download File
              </button>
            </div>
          </div>

          <pre className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs font-mono text-cyan-200 overflow-auto leading-relaxed">
            {code}
          </pre>
        </div>
      </div>
    </div>
  );
};
