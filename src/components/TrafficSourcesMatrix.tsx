import React, { useState } from 'react';
import { 
  Compass, 
  Search, 
  Share2, 
  Link, 
  Plus, 
  X, 
  Sparkles, 
  Sliders,
  TrendingUp,
  Tag,
  Check,
  CheckCircle2
} from 'lucide-react';
import { OrganicTrafficConfig } from '../types';

interface TrafficSourcesMatrixProps {
  organicConfig: OrganicTrafficConfig;
  onChange: (config: OrganicTrafficConfig) => void;
  onOpenAiKeywords: () => void;
  isAiGeneratingKeywords?: boolean;
  onSaveSettings?: () => void;
  onResetDefaults?: () => void;
}

export const TrafficSourcesMatrix: React.FC<TrafficSourcesMatrixProps> = ({
  organicConfig,
  onChange,
  onOpenAiKeywords,
  isAiGeneratingKeywords = false,
  onSaveSettings,
  onResetDefaults,
}) => {
  const [newKeyword, setNewKeyword] = useState('');
  const [activeTab, setActiveTab] = useState<'sources' | 'keywords' | 'social' | 'utm'>('sources');
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  const { sourceShares, searchEngines, keywords, socialNetworks, utmConfig } = organicConfig;

  const totalSourceShare = (sourceShares.organicSearch || 0) + 
                           (sourceShares.socialMedia || 0) + 
                           (sourceShares.direct || 0) + 
                           (sourceShares.referral || 0);

  const handleSourceShareChange = (field: keyof typeof sourceShares, value: number) => {
    onChange({
      ...organicConfig,
      sourceShares: {
        ...sourceShares,
        [field]: value,
      },
    });
  };

  const handleSearchEngineChange = (engine: keyof typeof searchEngines, value: number) => {
    onChange({
      ...organicConfig,
      searchEngines: {
        ...searchEngines,
        [engine]: value,
      },
    });
  };

  const handleSocialNetworkChange = (platform: keyof typeof socialNetworks, value: number) => {
    onChange({
      ...organicConfig,
      socialNetworks: {
        ...socialNetworks,
        [platform]: value,
      },
    });
  };

  const handleAddKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;
    const trimmed = newKeyword.trim();
    if (!keywords.includes(trimmed)) {
      onChange({
        ...organicConfig,
        keywords: [...keywords, trimmed],
      });
    }
    setNewKeyword('');
  };

  const handleRemoveKeyword = (indexToRemove: number) => {
    onChange({
      ...organicConfig,
      keywords: keywords.filter((_, idx) => idx !== indexToRemove),
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6">
      {/* Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wide">Traffic Referral & Attribution Matrix</h2>
            <p className="text-xs text-slate-400">
              Configure organic search queries, social networks, and campaign attribution channels.
            </p>
          </div>
        </div>

        {/* Tab Buttons & Save Action */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('sources')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeTab === 'sources' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sources Breakdown
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('keywords')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'keywords' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Search Keywords</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-indigo-300 font-mono">
                {keywords.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('social')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeTab === 'social' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Social Networks
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('utm')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeTab === 'utm' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              UTM Campaign
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                if (onSaveSettings) onSaveSettings();
                setSaveSuccessNotice(true);
                setTimeout(() => setSaveSuccessNotice(false), 3000);
              }}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-indigo-950/40 cursor-pointer"
              title="Save all traffic sources, referral weights, keywords, and UTM campaign parameters"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{saveSuccessNotice ? 'Saved!' : 'Save Settings'}</span>
            </button>

            {onResetDefaults && (
              <button
                type="button"
                onClick={onResetDefaults}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 font-semibold text-xs rounded-xl transition-all cursor-pointer"
                title="Reset to default traffic sources"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tab 1: Sources Breakdown */}
      {activeTab === 'sources' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Organic Search */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-slate-200">Organic Search</span>
                </div>
                <span className="text-sm font-mono font-bold text-emerald-400">{sourceShares.organicSearch}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={sourceShares.organicSearch}
                onChange={(e) => handleSourceShareChange('organicSearch', parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <p className="text-[11px] text-slate-500">Google, Bing, DuckDuckGo keyword queries</p>
            </div>

            {/* Social Media */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-slate-200">Social Media</span>
                </div>
                <span className="text-sm font-mono font-bold text-cyan-400">{sourceShares.socialMedia}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={sourceShares.socialMedia}
                onChange={(e) => handleSourceShareChange('socialMedia', parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <p className="text-[11px] text-slate-500">X (Twitter), LinkedIn, Reddit, Facebook</p>
            </div>

            {/* Direct Traffic */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold text-slate-200">Direct Traffic</span>
                </div>
                <span className="text-sm font-mono font-bold text-purple-400">{sourceShares.direct}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={sourceShares.direct}
                onChange={(e) => handleSourceShareChange('direct', parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <p className="text-[11px] text-slate-500">Direct URL typing & browser bookmarks</p>
            </div>

            {/* Referral / External */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Link className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-slate-200">Referral Links</span>
                </div>
                <span className="text-sm font-mono font-bold text-amber-400">{sourceShares.referral}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={sourceShares.referral}
                onChange={(e) => handleSourceShareChange('referral', parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <p className="text-[11px] text-slate-500">Tech blogs, news sites, external back-links</p>
            </div>
          </div>

          {/* Quick Preset for 100% Google Search Referrers */}
          <div className="bg-gradient-to-r from-emerald-950/40 via-indigo-950/30 to-slate-950 border border-emerald-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">100% Google Organic Search Mode</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Highest GA4 & AdSense Authenticity
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Route 100% of all landing pages, blog posts, and internal links through Google Search referrers.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onChange({
                  ...organicConfig,
                  sourceShares: {
                    organicSearch: 100,
                    socialMedia: 0,
                    direct: 0,
                    referral: 0,
                  },
                  searchEngines: {
                    google: 100,
                    bing: 0,
                    duckduckgo: 0,
                    yahoo: 0,
                    baidu: 0,
                    yandex: 0,
                  },
                  forceGoogleSearchOnAllLinks: true,
                  googleReferrerMode: 'country_localized',
                  autoGenerateKeywordFromPageTitle: true,
                });
              }}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-emerald-900/30 shrink-0"
            >
              <Check className="w-4 h-4" />
              <span>Apply 100% Google Search Preset</span>
            </button>
          </div>

          {/* Google Search Referrer Advanced Configuration */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <span>Google Search Referrer Customization for All Posts & Pages</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Controls how HTTP Referer headers and GA4 acquisition parameters are formatted for all pages and sub-links.
                </p>
              </div>

              <label className="flex items-center gap-2.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={organicConfig.forceGoogleSearchOnAllLinks ?? true}
                  onChange={(e) => onChange({
                    ...organicConfig,
                    forceGoogleSearchOnAllLinks: e.target.checked
                  })}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500 cursor-pointer accent-emerald-500"
                />
                <span className="text-xs font-semibold text-slate-200">Force Google Referrer on All Links</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Option 1: Country-Localized Google Domains */}
              <button
                type="button"
                onClick={() => onChange({
                  ...organicConfig,
                  googleReferrerMode: 'country_localized'
                })}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  (organicConfig.googleReferrerMode ?? 'country_localized') === 'country_localized'
                    ? 'bg-emerald-950/30 border-emerald-500/50 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-emerald-400">Country Localized Domains</span>
                  {(organicConfig.googleReferrerMode ?? 'country_localized') === 'country_localized' && (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Uses matching Google TLD per visitor country (e.g. <span className="font-mono text-emerald-300 text-[10px]">google.co.uk</span> for UK, <span className="font-mono text-emerald-300 text-[10px]">google.de</span> for DE).
                </p>
              </button>

              {/* Option 2: Standard Google.com */}
              <button
                type="button"
                onClick={() => onChange({
                  ...organicConfig,
                  googleReferrerMode: 'google_com'
                })}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  organicConfig.googleReferrerMode === 'google_com'
                    ? 'bg-indigo-950/30 border-indigo-500/50 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-indigo-400">Global Google.com</span>
                  {organicConfig.googleReferrerMode === 'google_com' && (
                    <Check className="w-3.5 h-3.5 text-indigo-400" />
                  )}
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Routes all traffic universally through <span className="font-mono text-indigo-300 text-[10px]">https://www.google.com/search?q=...</span>.
                </p>
              </button>

              {/* Option 3: Dynamic Context Queries */}
              <button
                type="button"
                onClick={() => onChange({
                  ...organicConfig,
                  googleReferrerMode: 'dynamic_query'
                })}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  organicConfig.googleReferrerMode === 'dynamic_query'
                    ? 'bg-cyan-950/30 border-cyan-500/50 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-cyan-400">Article Title & Slug Queries</span>
                  {organicConfig.googleReferrerMode === 'dynamic_query' && (
                    <Check className="w-3.5 h-3.5 text-cyan-400" />
                  )}
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Automatically extracts search queries from the specific post or page title visited.
                </p>
              </button>
            </div>

            {/* Referrer Header Preview Box */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Live Dispatched Referer Header Preview
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">100% Organic Google Attribution</span>
              </div>
              <div className="font-mono text-[11px] text-emerald-300 bg-slate-950 px-3 py-1.5 rounded border border-slate-800/80 break-all select-all">
                {(organicConfig.googleReferrerMode ?? 'country_localized') === 'country_localized'
                  ? 'Referer: https://www.google.co.uk/search?q=cloud+infrastructure+best+practices&oq=cloud+infrastructure&sourceid=chrome&ie=UTF-8'
                  : organicConfig.googleReferrerMode === 'dynamic_query'
                  ? 'Referer: https://www.google.com/search?q=how+to+scale+database+performance&oq=how+to+scale&sourceid=chrome&ie=UTF-8'
                  : 'Referer: https://www.google.com/search?q=website+performance+testing&oq=website+performance&sourceid=chrome&ie=UTF-8'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: High-Intent Search Keywords */}
      {activeTab === 'keywords' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Active Search Keyword Pool ({keywords.length} Queries)
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Simulated Google & Bing visitors will search these keywords before landing on your URL.
              </p>
            </div>

            <button
              type="button"
              onClick={onOpenAiKeywords}
              disabled={isAiGeneratingKeywords}
              className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow transition-all shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAiGeneratingKeywords ? 'Generating...' : 'AI Generate 15 SEO Keywords'}</span>
            </button>
          </div>

          {/* Add Custom Keyword Input */}
          <form onSubmit={handleAddKeyword} className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder="Type high-intent keyword (e.g. 'best site reliability testing software 2026')"
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={!newKeyword.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Keyword</span>
            </button>
          </form>

          {/* Keywords Chips Container */}
          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 max-h-60 overflow-y-auto">
            {keywords.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500">
                No keywords in pool. Add keywords above or click "AI Generate".
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {keywords.map((kw, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/40 text-slate-200 text-xs font-medium transition-all group"
                  >
                    <Search className="w-3 h-3 text-emerald-400" />
                    <span>{kw}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveKeyword(idx)}
                      className="text-slate-500 group-hover:text-rose-400 transition-colors p-0.5 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Social Media Networks */}
      {activeTab === 'social' && (
        <div className="space-y-4">
          <div className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Social Media Referral Distribution
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.entries(socialNetworks).map(([platform, weight]) => (
              <div key={platform} className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="capitalize font-bold text-slate-200">{platform}</span>
                  <span className="font-mono text-cyan-400 font-bold">{weight}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weight}
                  onChange={(e) => handleSocialNetworkChange(platform as any, parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: UTM Campaign Tagging */}
      {activeTab === 'utm' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Google Analytics UTM Campaign Parameter Tagging
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Automatically append custom campaign tracking parameters to visitor entry URLs.
              </p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={utmConfig.enabled}
                onChange={(e) => onChange({
                  ...organicConfig,
                  utmConfig: { ...utmConfig, enabled: e.target.checked }
                })}
                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-indigo-500 cursor-pointer accent-indigo-500"
              />
              <span className="text-xs font-semibold text-slate-300">Enable UTM Tagging</span>
            </label>
          </div>

          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 transition-opacity ${
            utmConfig.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'
          }`}>
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase">utm_source</label>
              <input
                type="text"
                value={utmConfig.utmSource}
                onChange={(e) => onChange({
                  ...organicConfig,
                  utmConfig: { ...utmConfig, utmSource: e.target.value }
                })}
                placeholder="google_organic / social_buzz"
                className="w-full mt-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase">utm_medium</label>
              <input
                type="text"
                value={utmConfig.utmMedium}
                onChange={(e) => onChange({
                  ...organicConfig,
                  utmConfig: { ...utmConfig, utmMedium: e.target.value }
                })}
                placeholder="organic / social / referral"
                className="w-full mt-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase">utm_campaign</label>
              <input
                type="text"
                value={utmConfig.utmCampaign}
                onChange={(e) => onChange({
                  ...organicConfig,
                  utmConfig: { ...utmConfig, utmCampaign: e.target.value }
                })}
                placeholder="launch_boost_2026"
                className="w-full mt-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none font-mono"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
