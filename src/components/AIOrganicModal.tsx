import React, { useState } from 'react';
import { 
  Sparkles, 
  X, 
  Search, 
  Compass, 
  Globe, 
  Clock, 
  ArrowRight, 
  Check, 
  Loader2,
  Sliders
} from 'lucide-react';
import { OrganicVisitorConfig } from '../types';

interface AIOrganicModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUrl: string;
  onApplyConfig: (generatedConfig: Partial<OrganicVisitorConfig>) => void;
}

export const AIOrganicModal: React.FC<AIOrganicModalProps> = ({
  isOpen,
  onClose,
  targetUrl,
  onApplyConfig,
}) => {
  const [prompt, setPrompt] = useState('');
  const [objective, setObjective] = useState<'seo' | 'viral_social' | 'ecommerce' | 'global'>('seo');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedResult, setGeneratedResult] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setGeneratedResult(null);

    try {
      const res = await fetch('/api/ai/generate-organic-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: targetUrl,
          description: prompt.trim() || `Optimize high-intent organic and social human traffic for ${targetUrl}`,
          objective,
        }),
      });

      const data = await res.json();
      if (data.campaign) {
        setGeneratedResult(data.campaign);
      } else {
        throw new Error(data.error || 'Failed to generate campaign');
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with AI campaign architect');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!generatedResult) return;

    onApplyConfig({
      name: generatedResult.name || 'AI Organic Campaign',
      organic: {
        sourceShares: generatedResult.sourceShares || { organicSearch: 50, socialMedia: 30, direct: 15, referral: 5 },
        searchEngines: generatedResult.searchEngines || { google: 80, bing: 15, duckduckgo: 5, yahoo: 0, baidu: 0, yandex: 0 },
        keywords: generatedResult.keywords || [],
        socialNetworks: generatedResult.socialNetworks || { twitter: 40, linkedin: 30, reddit: 20, facebook: 10, instagram: 0, youtube: 0, tiktok: 0, pinterest: 0 },
        customReferrers: [],
        utmConfig: {
          enabled: false,
          utmSource: 'ai_organic',
          utmMedium: 'organic',
          utmCampaign: 'traffic_boost',
          utmTerm: '',
          utmContent: '',
        },
      },
      behavior: {
        minDwellSeconds: generatedResult.behavior?.minDwellSeconds || 25,
        maxDwellSeconds: generatedResult.behavior?.maxDwellSeconds || 85,
        minPagesPerVisit: generatedResult.behavior?.minPagesPerVisit || 2,
        maxPagesPerVisit: generatedResult.behavior?.maxPagesPerVisit || 4,
        bounceRatePct: generatedResult.behavior?.bounceRatePct || 20,
        simulateScroll: true,
        scrollMinDepthPct: 45,
        scrollMaxDepthPct: 92,
        simulateMouseMovement: true,
        newVsReturningRatio: 75,
        realTimeSpeedMultiplier: 5,
        activeConcurrentVisitors: 8,
        sessionPacingJitter: 30,
      },
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">AI Organic Campaign & Keyword Architect</h3>
              <p className="text-xs text-slate-400">Powered by Gemini AI to construct realistic SEO keywords and human visitor paths</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Target Objective
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
              <button
                type="button"
                onClick={() => setObjective('seo')}
                className={`p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-left ${
                  objective === 'seo'
                    ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 shadow'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                High-Intent SEO
              </button>
              <button
                type="button"
                onClick={() => setObjective('viral_social')}
                className={`p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-left ${
                  objective === 'viral_social'
                    ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300 shadow'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Viral Social Wave
              </button>
              <button
                type="button"
                onClick={() => setObjective('ecommerce')}
                className={`p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-left ${
                  objective === 'ecommerce'
                    ? 'bg-purple-950/60 border-purple-500/50 text-purple-300 shadow'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                E-Commerce Cart
              </button>
              <button
                type="button"
                onClick={() => setObjective('global')}
                className={`p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-left ${
                  objective === 'global'
                    ? 'bg-amber-950/60 border-amber-500/50 text-amber-300 shadow'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Worldwide Geo
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Website Context or Keyword Focus
            </label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Modern developer observability platform, API performance monitoring, cloud reliability tools..."
              className="w-full mt-1.5 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-900/30 transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>AI Architecting Campaign & Keywords...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Campaign Profile</span>
              </>
            )}
          </button>
        </form>

        {/* Error message */}
        {error && (
          <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl text-xs text-rose-300">
            {error}
          </div>
        )}

        {/* Generated Result Preview */}
        {generatedResult && (
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                <span>Campaign Generated: {generatedResult.name}</span>
              </h4>
            </div>

            {/* Generated Keywords Preview */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase">
                Generated High-Intent Keywords ({generatedResult.keywords?.length || 0})
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                {generatedResult.keywords?.map((kw: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-200"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>

            {/* Traffic Sources & Behavior summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
              <div>Organic: <span className="text-emerald-400 font-bold">{generatedResult.sourceShares?.organicSearch}%</span></div>
              <div>Social: <span className="text-cyan-400 font-bold">{generatedResult.sourceShares?.socialMedia}%</span></div>
              <div>Dwell: <span className="text-amber-400 font-bold">{generatedResult.behavior?.minDwellSeconds}s-{generatedResult.behavior?.maxDwellSeconds}s</span></div>
              <div>Bounce: <span className="text-rose-400 font-bold">{generatedResult.behavior?.bounceRatePct}%</span></div>
            </div>

            <button
              type="button"
              onClick={handleApply}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Apply AI Campaign to Generator</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
