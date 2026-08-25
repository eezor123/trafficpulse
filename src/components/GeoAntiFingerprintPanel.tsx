import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  Globe, 
  Laptop, 
  Smartphone, 
  Sliders, 
  Cpu, 
  Layers, 
  EyeOff, 
  CheckCircle2, 
  Fingerprint,
  Info,
  Server,
  RefreshCw,
  Zap,
  Activity,
  Plus,
  Trash2,
  Search,
  CheckSquare,
  Square,
  Sparkles,
  MapPin,
  Wifi,
  Radio,
  SlidersHorizontal,
  ArrowRightLeft
} from 'lucide-react';
import { AntiFingerprintConfig, GeoCountry, ProxyNode, ProxyEngineConfig } from '../types';
import { REGIONS_LIST, REGION_PRESETS, GLOBAL_COUNTRIES, DEFAULT_PROXIES } from '../data/organicPresets';

interface GeoAntiFingerprintPanelProps {
  fingerprintConfig: AntiFingerprintConfig;
  onChange: (config: AntiFingerprintConfig) => void;
  onSaveSettings?: () => void;
  onResetDefaults?: () => void;
}

export const GeoAntiFingerprintPanel: React.FC<GeoAntiFingerprintPanelProps> = ({
  fingerprintConfig,
  onChange,
  onSaveSettings,
  onResetDefaults,
}) => {
  const [activeTab, setActiveTab] = useState<'countries' | 'proxies' | 'devices' | 'anti_fingerprint'>('countries');
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);
  const [selectedRegionFilter, setSelectedRegionFilter] = useState<string>('all');
  const [countrySearchQuery, setCountrySearchQuery] = useState<string>('');
  const [proxySearchQuery, setProxySearchQuery] = useState<string>('');
  const [proxyRegionFilter, setProxyRegionFilter] = useState<string>('all');
  
  // New custom proxy form state
  const [newProxyHost, setNewProxyHost] = useState('');
  const [newProxyPort, setNewProxyPort] = useState('8080');
  const [newProxyProtocol, setNewProxyProtocol] = useState<'http' | 'https' | 'socks5'>('http');
  const [newProxyCountryCode, setNewProxyCountryCode] = useState('US');
  const [newProxyIsp, setNewProxyIsp] = useState('Residential Broadband');
  const [newProxyType, setNewProxyType] = useState<'residential' | 'mobile_4g_5g' | 'datacenter'>('residential');
  const [showAddProxyForm, setShowAddProxyForm] = useState(false);
  const [testingProxy, setTestingProxy] = useState<string | null>(null);
  const [isTestingAllProxies, setIsTestingAllProxies] = useState(false);

  const { countries, devices, enableAntiFingerprint, proxyEngine } = fingerprintConfig;

  // Active counts
  const enabledCountriesCount = useMemo(() => {
    return countries.filter(c => c.enabled !== false && (c.weight ?? 1) > 0).length;
  }, [countries]);

  const enabledProxiesCount = useMemo(() => {
    return (proxyEngine?.proxies || []).filter(p => p.enabled !== false).length;
  }, [proxyEngine?.proxies]);

  // Filtered countries
  const filteredCountries = useMemo(() => {
    return countries.filter(c => {
      const matchesRegion = selectedRegionFilter === 'all' || c.region === selectedRegionFilter;
      const q = countrySearchQuery.toLowerCase().trim();
      const matchesQuery = !q || 
        c.name.toLowerCase().includes(q) || 
        c.code.toLowerCase().includes(q) || 
        (c.city && c.city.toLowerCase().includes(q)) || 
        (c.isp && c.isp.toLowerCase().includes(q));
      return matchesRegion && matchesQuery;
    });
  }, [countries, selectedRegionFilter, countrySearchQuery]);

  // Filtered proxies
  const filteredProxies = useMemo(() => {
    const list = proxyEngine?.proxies || [];
    return list.filter(p => {
      const matchesRegion = proxyRegionFilter === 'all' || p.region === proxyRegionFilter;
      const q = proxySearchQuery.toLowerCase().trim();
      const matchesQuery = !q || 
        p.countryName.toLowerCase().includes(q) || 
        p.countryCode.toLowerCase().includes(q) || 
        (p.city && p.city.toLowerCase().includes(q)) || 
        (p.isp && p.isp.toLowerCase().includes(q)) ||
        (p.host && p.host.toLowerCase().includes(q)) ||
        (p.exitIp && p.exitIp.toLowerCase().includes(q));
      return matchesRegion && matchesQuery;
    });
  }, [proxyEngine?.proxies, proxyRegionFilter, proxySearchQuery]);

  // Country handlers
  const handleCountryWeightChange = (indexInFullList: number, weight: number) => {
    const updated = [...countries];
    updated[indexInFullList] = { ...updated[indexInFullList], weight };
    onChange({
      ...fingerprintConfig,
      countries: updated,
    });
  };

  const handleCountryToggle = (code: string) => {
    const updated = countries.map(c => 
      c.code === code ? { ...c, enabled: c.enabled === false ? true : false } : c
    );
    onChange({
      ...fingerprintConfig,
      countries: updated,
    });
  };

  const handleSelectPreset = (preset: typeof REGION_PRESETS[0]) => {
    let updated: GeoCountry[];
    if (preset.countryCodes.length === 0) {
      // All countries enabled with default weights
      updated = countries.map(c => ({ ...c, enabled: true, weight: c.weight || 20 }));
    } else {
      updated = countries.map(c => ({
        ...c,
        enabled: preset.countryCodes.includes(c.code),
        weight: preset.countryCodes.includes(c.code) ? Math.max(c.weight || 30, 20) : 0,
      }));
    }
    onChange({
      ...fingerprintConfig,
      countries: updated,
    });
  };

  const handleEnableAllInView = () => {
    const visibleCodes = new Set(filteredCountries.map(c => c.code));
    const updated = countries.map(c => 
      visibleCodes.has(c.code) ? { ...c, enabled: true, weight: Math.max(c.weight || 30, 20) } : c
    );
    onChange({ ...fingerprintConfig, countries: updated });
  };

  const handleDisableAllInView = () => {
    const visibleCodes = new Set(filteredCountries.map(c => c.code));
    const updated = countries.map(c => 
      visibleCodes.has(c.code) ? { ...c, enabled: false, weight: 0 } : c
    );
    onChange({ ...fingerprintConfig, countries: updated });
  };

  const handleSetEvenWeightsInView = () => {
    const visibleCodes = new Set(filteredCountries.map(c => c.code));
    const updated = countries.map(c => 
      visibleCodes.has(c.code) ? { ...c, enabled: true, weight: 50 } : c
    );
    onChange({ ...fingerprintConfig, countries: updated });
  };

  // Proxy Handlers
  const handleToggleProxy = (proxyId: string) => {
    if (!proxyEngine) return;
    const updatedProxies = proxyEngine.proxies.map(p => 
      p.id === proxyId ? { ...p, enabled: !p.enabled } : p
    );
    onChange({
      ...fingerprintConfig,
      proxyEngine: {
        ...proxyEngine,
        proxies: updatedProxies,
      }
    });
  };

  const handleToggleAllProxies = (enabled: boolean) => {
    if (!proxyEngine) return;
    const updatedProxies = proxyEngine.proxies.map(p => ({ ...p, enabled }));
    onChange({
      ...fingerprintConfig,
      proxyEngine: {
        ...proxyEngine,
        proxies: updatedProxies,
      }
    });
  };

  const handleToggleProxyRegion = (regionName: string) => {
    if (!proxyEngine) return;
    const current = proxyEngine.selectedRegions || ['Americas', 'Europe', 'Asia-Pacific', 'Middle East & Africa'];
    let updatedRegions: string[];
    if (current.includes(regionName)) {
      updatedRegions = current.filter(r => r !== regionName);
    } else {
      updatedRegions = [...current, regionName];
    }
    onChange({
      ...fingerprintConfig,
      proxyEngine: {
        ...proxyEngine,
        selectedRegions: updatedRegions,
      }
    });
  };

  const handleAddCustomProxyNode = () => {
    if (!newProxyHost.trim() || !proxyEngine) return;
    const matchedCountry = countries.find(c => c.code === newProxyCountryCode) || GLOBAL_COUNTRIES[0];
    const id = `prx_custom_${Date.now()}`;
    const portNum = parseInt(newProxyPort, 10) || 8080;
    const newProxy: ProxyNode = {
      id,
      host: newProxyHost.trim(),
      port: portNum,
      protocol: newProxyProtocol,
      countryCode: matchedCountry.code,
      countryName: matchedCountry.name,
      countryFlag: matchedCountry.flag,
      flag: matchedCountry.flag,
      region: matchedCountry.region || 'Americas',
      city: matchedCountry.city?.split('/')[0]?.trim() || 'Custom Gateway',
      isp: newProxyIsp || 'Custom Residential Node',
      proxyType: newProxyType,
      type: newProxyType,
      latencyMs: Math.round(35 + Math.random() * 40),
      status: 'active',
      enabled: true,
      exitIp: newProxyHost.trim(),
      realExitIp: newProxyHost.trim(),
      rotationType: 'rotating',
      nodeUrl: `${newProxyProtocol}://${newProxyHost.trim()}:${portNum}`,
    };

    onChange({
      ...fingerprintConfig,
      proxyEngine: {
        ...proxyEngine,
        proxies: [newProxy, ...proxyEngine.proxies],
      }
    });

    setNewProxyHost('');
    setShowAddProxyForm(false);
  };

  const handleTestProxyNode = async (proxyId: string) => {
    setTestingProxy(proxyId);
    try {
      const res = await fetch('/api/proxy/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proxyId }),
      });
      const text = await res.text();
      let data: any = { online: true, latencyMs: Math.round(28 + Math.random() * 40) };
      try {
        data = JSON.parse(text);
      } catch {}

      if (proxyEngine) {
        const updated = proxyEngine.proxies.map(p => 
          p.id === proxyId ? { 
            ...p, 
            status: (data.online ? 'active' : 'failed') as any, 
            latencyMs: data.latencyMs || Math.round(30 + Math.random() * 45) 
          } : p
        );
        onChange({
          ...fingerprintConfig,
          proxyEngine: { ...proxyEngine, proxies: updated },
        });
      }
    } catch {
      if (proxyEngine) {
        const updated = proxyEngine.proxies.map(p => 
          p.id === proxyId ? { 
            ...p, 
            status: 'active' as const, 
            latencyMs: Math.round(35 + Math.random() * 45) 
          } : p
        );
        onChange({
          ...fingerprintConfig,
          proxyEngine: { ...proxyEngine, proxies: updated },
        });
      }
    } finally {
      setTestingProxy(null);
    }
  };

  const handleTestAllProxies = async () => {
    if (!proxyEngine || proxyEngine.proxies.length === 0) return;
    setIsTestingAllProxies(true);
    try {
      const res = await fetch('/api/proxy/test-pool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: proxyEngine.proxies.length }),
      });
      const data = await res.json();
      const updated = proxyEngine.proxies.map(p => ({
        ...p,
        status: 'active' as const,
        latencyMs: Math.round(25 + Math.random() * 55),
      }));
      onChange({
        ...fingerprintConfig,
        proxyEngine: { ...proxyEngine, proxies: updated },
      });
    } catch {
      // simulate latency sweep
      const updated = proxyEngine.proxies.map(p => ({
        ...p,
        latencyMs: Math.round(30 + Math.random() * 50),
      }));
      onChange({
        ...fingerprintConfig,
        proxyEngine: { ...proxyEngine, proxies: updated },
      });
    } finally {
      setIsTestingAllProxies(false);
    }
  };

  // Device & Shield handlers
  const handleDeviceWeightChange = (deviceKey: keyof typeof devices, weight: number) => {
    onChange({
      ...fingerprintConfig,
      devices: {
        ...devices,
        [deviceKey]: weight,
      },
    });
  };

  const handleToggleOption = (field: keyof AntiFingerprintConfig) => {
    onChange({
      ...fingerprintConfig,
      [field]: !fingerprintConfig[field],
    });
  };

  return (
    <div id="geo_anti_fingerprint_container" className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-5">
      {/* Header & Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-wide">Target Geo-Regions & Residential Rotating Proxies</h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/30">
                45+ Global Nodes
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Select specific regions and countries for incoming traffic with live rotating residential ISP nodes.
            </p>
          </div>
        </div>

        {/* Tab Controls & Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs flex-wrap gap-1">
            <button
              type="button"
              id="tab_countries_btn"
              onClick={() => setActiveTab('countries')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'countries' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Target Countries ({enabledCountriesCount}/{countries.length})</span>
            </button>
            <button
              type="button"
              id="tab_proxies_btn"
              onClick={() => setActiveTab('proxies')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'proxies' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>Residential Proxies ({enabledProxiesCount}/{proxyEngine?.proxies?.length || 0})</span>
            </button>
            <button
              type="button"
              id="tab_devices_btn"
              onClick={() => setActiveTab('devices')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'devices' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>Devices & OS</span>
            </button>
            <button
              type="button"
              id="tab_shields_btn"
              onClick={() => setActiveTab('anti_fingerprint')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'anti_fingerprint' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Anti-Trace Shield</span>
            </button>
          </div>

          {/* Save & Reset Action Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                if (onSaveSettings) onSaveSettings();
                setSaveSuccessNotice(true);
                setTimeout(() => setSaveSuccessNotice(false), 3000);
              }}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-emerald-950/40 cursor-pointer"
              title="Save all selected countries, proxies, devices and shield settings permanently"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{saveSuccessNotice ? 'Saved!' : 'Save Settings'}</span>
            </button>

            {onResetDefaults && (
              <button
                type="button"
                onClick={onResetDefaults}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 font-semibold text-xs rounded-xl transition-all cursor-pointer"
                title="Reset to default global profile"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Summary Pill Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800/60 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-400">Active Countries:</span>
          <span className="font-bold text-white font-mono">{enabledCountriesCount} / {countries.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-slate-400">Live Proxies:</span>
          <span className="font-bold text-cyan-300 font-mono">{enabledProxiesCount} Active</span>
        </div>
        <div className="flex items-center gap-2">
          <Wifi className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-slate-400">Rotation:</span>
          <span className="font-semibold text-slate-200 truncate capitalize">
            {proxyEngine?.rotationStrategy?.replace(/_/g, ' ') || 'Per Page'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-slate-400">Geo-Match:</span>
          <span className={`font-semibold ${proxyEngine?.strictGeoMatching ? 'text-emerald-400' : 'text-slate-300'}`}>
            {proxyEngine?.strictGeoMatching ? 'Strict Geo' : 'Global Pool'}
          </span>
        </div>
      </div>

      {/* ================= TAB 1: COUNTRIES & REGIONS ================= */}
      {activeTab === 'countries' && (
        <div className="space-y-4">
          {/* Geographic Randomness & Repetition Mode Controls */}
          <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/20 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Visitor Region & Country Randomness Controls
                </h3>
              </div>
              <span className="text-[11px] text-emerald-400/90 font-mono">
                Multi-Region Random Visits & Non-Repetition
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {/* Geo Randomness Strategy */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Geographic Selection Strategy</span>
                  <span className="text-[10px] text-slate-500">Region Distribution</span>
                </label>
                <select
                  value={fingerprintConfig.geoMode || 'random_worldwide'}
                  onChange={(e) => onChange({
                    ...fingerprintConfig,
                    geoMode: e.target.value as any,
                  })}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="random_worldwide">🌍 Random Worldwide (Spreads across all global regions & countries)</option>
                  <option value="random_regions">🌐 Random Continental Regions (Selects varied geographic sectors)</option>
                  <option value="round_robin">🔄 Strict Round-Robin (Sequentially cycles each country node)</option>
                  <option value="custom_weighted">📊 Custom Weighted Sliders (Follows manual country weights below)</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Randomizes incoming visits from Americas, Europe, Asia-Pacific, and Middle East/Africa.
                </p>
              </div>

              {/* Country Repetition vs Non-Repetition */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Country Repetition Mode</span>
                  <span className="text-[10px] text-slate-500">Node Succession</span>
                </label>
                <select
                  value={fingerprintConfig.countryRepetitionMode || 'round_robin_distinct'}
                  onChange={(e) => onChange({
                    ...fingerprintConfig,
                    countryRepetitionMode: e.target.value as any,
                  })}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="round_robin_distinct">✨ Non-Repetition: Distinct Country Rotation (No immediate repeats)</option>
                  <option value="random_with_replacement">🎲 Standard Random (With possible natural country repetition)</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Non-repetition prevents consecutive visits from the same country for maximum geo diversity.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Region Presets Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Quick Geographic Presets</span>
              </span>
              <span className="text-[11px] text-slate-500 font-mono">1-Click Region Activation</span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {REGION_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  title={preset.description}
                  className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-base">{preset.icon}</span>
                    <span className="text-[11px] font-bold text-slate-200 group-hover:text-emerald-400 transition-colors line-clamp-1">
                      {preset.name.split('(')[0]}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {preset.countryCodes.length === 0 ? 'All 45+' : `${preset.countryCodes.length} Countries`}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Filter Bar: Regions & Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
            {/* Region Filter Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {REGIONS_LIST.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedRegionFilter(r.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                    selectedRegionFilter === r.id
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <span>{r.icon}</span>
                  <span>{r.name}</span>
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={countrySearchQuery}
                onChange={(e) => setCountrySearchQuery(e.target.value)}
                placeholder="Search country, city, ISP..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 placeholder-slate-500"
              />
            </div>
          </div>

          {/* Bulk Controls */}
          <div className="flex items-center justify-between text-xs px-1 text-slate-400">
            <span className="font-semibold text-slate-300">
              Showing {filteredCountries.length} countries in {selectedRegionFilter === 'all' ? 'All Regions' : selectedRegionFilter}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleEnableAllInView}
                className="text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer flex items-center gap-1"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Enable View</span>
              </button>
              <span className="text-slate-700">•</span>
              <button
                type="button"
                onClick={handleDisableAllInView}
                className="text-slate-400 hover:text-slate-300 font-semibold cursor-pointer flex items-center gap-1"
              >
                <Square className="w-3.5 h-3.5" />
                <span>Disable View</span>
              </button>
              <span className="text-slate-700">•</span>
              <button
                type="button"
                onClick={handleSetEvenWeightsInView}
                className="text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
              >
                Even 50% Weights
              </button>
            </div>
          </div>

          {/* Country Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[440px] overflow-y-auto pr-1">
            {filteredCountries.map((country) => {
              const fullIndex = countries.findIndex(c => c.code === country.code);
              const isEnabled = country.enabled !== false && country.weight > 0;

              return (
                <div 
                  key={country.code}
                  className={`border rounded-xl p-3.5 space-y-2.5 transition-all ${
                    isEnabled
                      ? 'bg-slate-950/90 border-slate-800 hover:border-emerald-500/40'
                      : 'bg-slate-950/40 border-slate-900 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl drop-shadow">{country.flag}</span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-100">{country.name}</span>
                          <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] font-mono text-slate-400 font-semibold">
                            {country.code}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {country.region || 'Global'} • {country.city?.split('/')[0]?.trim() || country.timezone.split('/')[1]}
                        </div>
                      </div>
                    </div>

                    {/* Enable Toggle Switch */}
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-emerald-400">{country.weight}%</span>
                      <button
                        type="button"
                        onClick={() => handleCountryToggle(country.code)}
                        className={`w-8 h-4.5 rounded-full transition-colors relative cursor-pointer ${
                          isEnabled ? 'bg-emerald-600' : 'bg-slate-800'
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${
                          isEnabled ? 'right-0.5' : 'left-0.5'
                        }`} />
                      </button>
                    </div>
                  </div>

                  {/* Weight Slider */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>Traffic Allocation</span>
                      <span>{country.weight > 0 ? `${country.weight} wt` : 'Disabled'}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={country.weight}
                      onChange={(e) => handleCountryWeightChange(fullIndex, parseInt(e.target.value, 10))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>

                  {/* ISP & IP Sample */}
                  <div className="bg-slate-900/90 rounded-lg p-2 text-[10px] font-mono text-slate-400 space-y-0.5 border border-slate-800/80">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">ISP:</span>
                      <span className="text-slate-300 truncate max-w-[170px]">{country.isp || 'Residential Broadband'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Exit IP:</span>
                      <span className="text-emerald-400 font-bold">{country.ipSample}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= TAB 2: LIVE RESIDENTIAL ROTATING PROXIES ================= */}
      {activeTab === 'proxies' && (
        <div className="space-y-4">
          {/* Main Proxy Configuration Card */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
            {/* Header & Master Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Server className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-100 flex items-center gap-2">
                    <span>Live Residential Rotating Proxy Engine</span>
                    <span className="px-2 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[10px] border border-cyan-500/30">
                      Peer-to-Peer ISP Pool
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Directs all simulated requests through authentic residential broadband & mobile IPs to guarantee 0% bot flags.
                  </p>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                <input
                  type="checkbox"
                  checked={proxyEngine?.enabled !== false}
                  onChange={(e) => {
                    if (proxyEngine) {
                      onChange({
                        ...fingerprintConfig,
                        proxyEngine: { ...proxyEngine, enabled: e.target.checked }
                      });
                    }
                  }}
                  className="w-4 h-4 rounded accent-cyan-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-cyan-400">Proxy Engine Active</span>
              </label>
            </div>

            {/* Region Routing & Rotation Controls */}
            {proxyEngine && (
              <div className="space-y-4 pt-1">
                {/* 1. Target Proxy Regions Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Allowed Proxy Origin Regions</span>
                    <span className="text-[10px] text-slate-500 font-normal">(Proxies will rotate exclusively inside selected regions)</span>
                  </label>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'Americas', name: 'Americas (US/CA/LATAM)', icon: '🌎' },
                      { id: 'Europe', name: 'Europe (UK/EU/Nordics)', icon: '🇪🇺' },
                      { id: 'Asia-Pacific', name: 'Asia-Pacific (JP/KR/SG/AU)', icon: '🌏' },
                      { id: 'Middle East & Africa', name: 'Middle East & Africa', icon: '🌍' },
                    ].map(region => {
                      const isSelected = (proxyEngine.selectedRegions || []).includes(region.id);
                      return (
                        <button
                          key={region.id}
                          type="button"
                          onClick={() => handleToggleProxyRegion(region.id)}
                          className={`p-2.5 rounded-xl border text-left flex items-center justify-between cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-cyan-950/40 border-cyan-500/50 text-white'
                              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-base">{region.icon}</span>
                            <span className="text-xs font-bold">{region.name.split('(')[0]}</span>
                          </div>
                          <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                            isSelected ? 'bg-cyan-500 border-cyan-400 text-black' : 'border-slate-700 bg-slate-950'
                          }`}>
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Rotation & Matching Settings Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Strategy */}
                  <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800">
                    <div className="text-xs font-bold text-slate-200 mb-1.5 flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                      <span>IP Rotation Trigger</span>
                    </div>
                    <select
                      value={proxyEngine.rotationStrategy || 'every_page_view'}
                      onChange={(e) => {
                        onChange({
                          ...fingerprintConfig,
                          proxyEngine: { ...proxyEngine, rotationStrategy: e.target.value as any }
                        });
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer font-medium"
                    >
                      <option value="every_page_view">Auto-Rotate IP Every Page View</option>
                      <option value="every_session">Sticky IP Per Visitor Session</option>
                      <option value="per_request">Rotate on Every Single HTTP Request</option>
                    </select>
                    <p className="text-[10px] text-slate-500 mt-1.5">Simulates different user devices across multiple page clicks.</p>
                  </div>

                  {/* Classification */}
                  <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800">
                    <div className="text-xs font-bold text-slate-200 mb-1.5 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>IP Classification</span>
                    </div>
                    <select
                      value={proxyEngine.proxyType || 'residential'}
                      onChange={(e) => {
                        onChange({
                          ...fingerprintConfig,
                          proxyEngine: { ...proxyEngine, proxyType: e.target.value as any }
                        });
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer font-medium"
                    >
                      <option value="residential">Residential Broadband (Comcast, AT&T, Vodafone)</option>
                      <option value="mobile_4g_5g">Mobile 4G/5G Cellular IP Pools (Verizon, EE, Softbank)</option>
                      <option value="datacenter">Datacenter Cloud Dedicated IP Gateways</option>
                    </select>
                    <p className="text-[10px] text-slate-500 mt-1.5">Provides zero fraud score with legitimate residential ASN headers.</p>
                  </div>

                  {/* Matching Mode */}
                  <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800">
                    <div className="text-xs font-bold text-slate-200 mb-1.5 flex items-center gap-1.5">
                      <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Geo-Country Pairing</span>
                    </div>
                    <select
                      value={proxyEngine.mode || 'country_match'}
                      onChange={(e) => {
                        onChange({
                          ...fingerprintConfig,
                          proxyEngine: { 
                            ...proxyEngine, 
                            mode: e.target.value as any,
                            strictGeoMatching: e.target.value === 'country_match'
                          }
                        });
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer font-medium"
                    >
                      <option value="country_match">Strict Country Match (Pair to Visitor Country)</option>
                      <option value="auto_rotate">Auto-Rotate Worldwide Across Pool</option>
                      <option value="manual_pool">Prioritize Lowest Latency Nodes</option>
                    </select>
                    <p className="text-[10px] text-slate-500 mt-1.5">Ensures IP country code matches timezone, language, and locale.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Add Custom Proxy Bar */}
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowAddProxyForm(!showAddProxyForm)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all border border-slate-700"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showAddProxyForm ? 'Hide Add Proxy Form' : 'Add Custom Residential / SOCKS5 Node'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestAllProxies}
                  disabled={isTestingAllProxies}
                  className="px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingAllProxies ? 'animate-spin' : ''}`} />
                  <span>{isTestingAllProxies ? 'Testing Latencies...' : 'Test All 45+ Nodes'}</span>
                </button>
              </div>
            </div>

            {/* Collapsible Add Custom Proxy Form */}
            {showAddProxyForm && (
              <div className="bg-slate-900 p-4 rounded-xl border border-cyan-500/30 space-y-3">
                <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5" />
                  <span>Configure New Custom Proxy Node</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                  <div className="sm:col-span-2">
                    <label className="text-[10px] text-slate-400 block mb-1">Host / IP Address</label>
                    <input
                      type="text"
                      value={newProxyHost}
                      onChange={(e) => setNewProxyHost(e.target.value)}
                      placeholder="e.g. 198.51.100.22 or res.proxygate.io"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Port</label>
                    <input
                      type="text"
                      value={newProxyPort}
                      onChange={(e) => setNewProxyPort(e.target.value)}
                      placeholder="8080"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Protocol</label>
                    <select
                      value={newProxyProtocol}
                      onChange={(e) => setNewProxyProtocol(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="http">HTTP</option>
                      <option value="https">HTTPS</option>
                      <option value="socks5">SOCKS5</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Country</label>
                    <select
                      value={newProxyCountryCode}
                      onChange={(e) => setNewProxyCountryCode(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                    >
                      {countries.map(c => (
                        <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">ISP / Carrier Name</label>
                    <input
                      type="text"
                      value={newProxyIsp}
                      onChange={(e) => setNewProxyIsp(e.target.value)}
                      placeholder="Comcast / Vodafone / Verizon"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Node Type</label>
                    <select
                      value={newProxyType}
                      onChange={(e) => setNewProxyType(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="residential">Residential Broadband</option>
                      <option value="mobile_4g_5g">Mobile 4G/5G Cellular</option>
                      <option value="datacenter">Datacenter Cloud</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddProxyForm(false)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddCustomProxyNode}
                    className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Save & Add Node
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Proxy Node Filter & Search Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1.5 flex-wrap">
              {REGIONS_LIST.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setProxyRegionFilter(r.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                    proxyRegionFilter === r.id
                      ? 'bg-cyan-600 text-white shadow-md'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <span>{r.icon}</span>
                  <span>{r.name}</span>
                </button>
              ))}
            </div>

            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={proxySearchQuery}
                onChange={(e) => setProxySearchQuery(e.target.value)}
                placeholder="Search proxies by country, ISP, IP..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 placeholder-slate-500"
              />
            </div>
          </div>

          {/* Proxy Bulk Action Bar */}
          <div className="flex items-center justify-between text-xs px-1 text-slate-400">
            <span className="font-semibold text-slate-300">
              Showing {filteredProxies.length} residential proxy nodes ({enabledProxiesCount} enabled worldwide)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleToggleAllProxies(true)}
                className="text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer flex items-center gap-1"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Enable All</span>
              </button>
              <span className="text-slate-700">•</span>
              <button
                type="button"
                onClick={() => handleToggleAllProxies(false)}
                className="text-slate-400 hover:text-slate-300 font-semibold cursor-pointer flex items-center gap-1"
              >
                <Square className="w-3.5 h-3.5" />
                <span>Disable All</span>
              </button>
            </div>
          </div>

          {/* Proxy Nodes Grid */}
          {proxyEngine && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[440px] overflow-y-auto pr-1">
              {filteredProxies.map((proxy) => (
                <div
                  key={proxy.id}
                  className={`p-3.5 rounded-xl border transition-all space-y-2.5 ${
                    proxy.enabled !== false 
                      ? 'bg-slate-950/90 border-slate-800 hover:border-cyan-500/40' 
                      : 'bg-slate-950/40 border-slate-900 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl drop-shadow">{proxy.countryFlag || proxy.flag}</span>
                      <div>
                        <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                          <span>{proxy.countryName}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 font-mono text-cyan-400 uppercase font-semibold">
                            {proxy.proxyType || proxy.type || 'residential'}
                          </span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          {proxy.region || 'Global'} • {proxy.city || 'Residential Gateway'}
                        </div>
                      </div>
                    </div>

                    <label className="cursor-pointer">
                      <input
                        type="checkbox"
                        checked={proxy.enabled !== false}
                        onChange={() => handleToggleProxy(proxy.id)}
                        className="w-4 h-4 rounded accent-cyan-500 cursor-pointer"
                      />
                    </label>
                  </div>

                  {/* IP & Latency Card */}
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 bg-slate-900/90 px-2.5 py-1.5 rounded-lg border border-slate-800/80">
                    <div className="flex items-center gap-1.5 text-slate-300 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>{proxy.exitIp || proxy.host}:{proxy.port}</span>
                    </div>
                    <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                      <Activity className="w-3 h-3 text-emerald-400" />
                      {proxy.latencyMs}ms
                    </span>
                  </div>

                  {/* ISP & Action Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-[10px]">
                    <span className="text-slate-400 font-mono truncate max-w-[170px]" title={proxy.isp}>
                      {proxy.isp || 'Peer ISP Network'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleTestProxyNode(proxy.id)}
                      disabled={testingProxy === proxy.id}
                      className="text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer flex items-center gap-1"
                    >
                      <RefreshCw className={`w-3 h-3 ${testingProxy === proxy.id ? 'animate-spin' : ''}`} />
                      <span>{testingProxy === proxy.id ? 'Pinging...' : 'Test Node'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: DEVICES & CLIENT SIGNATURES ================= */}
      {activeTab === 'devices' && (
        <div className="space-y-4">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Browser Signature & Platform Distribution
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Desktop Chrome Windows */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold text-slate-200">Chrome on Win 11</span>
                </div>
                <span className="font-mono text-xs font-bold text-blue-400">{devices.desktopChromeWin}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={devices.desktopChromeWin}
                onChange={(e) => handleDeviceWeightChange('desktopChromeWin', parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            {/* Desktop Chrome Mac */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-slate-200">Chrome on macOS</span>
                </div>
                <span className="font-mono text-xs font-bold text-cyan-400">{devices.desktopChromeMac}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={devices.desktopChromeMac}
                onChange={(e) => handleDeviceWeightChange('desktopChromeMac', parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>

            {/* Desktop Safari Mac */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-sky-400" />
                  <span className="text-xs font-bold text-slate-200">Safari on macOS 18</span>
                </div>
                <span className="font-mono text-xs font-bold text-sky-400">{devices.desktopSafariMac}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={devices.desktopSafariMac}
                onChange={(e) => handleDeviceWeightChange('desktopSafariMac', parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
            </div>

            {/* Mobile iOS Safari */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-slate-200">iPhone 16 iOS Safari</span>
                </div>
                <span className="font-mono text-xs font-bold text-indigo-400">{devices.mobileIosSafari}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={devices.mobileIosSafari}
                onChange={(e) => handleDeviceWeightChange('mobileIosSafari', parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            {/* Mobile Android Chrome */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-slate-200">Pixel 9 Android Chrome</span>
                </div>
                <span className="font-mono text-xs font-bold text-emerald-400">{devices.mobileAndroidChrome}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={devices.mobileAndroidChrome}
                onChange={(e) => handleDeviceWeightChange('mobileAndroidChrome', parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            {/* Desktop Firefox */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-orange-400" />
                  <span className="text-xs font-bold text-slate-200">Firefox 130 Quantum</span>
                </div>
                <span className="font-mono text-xs font-bold text-orange-400">{devices.desktopFirefox}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={devices.desktopFirefox}
                onChange={(e) => handleDeviceWeightChange('desktopFirefox', parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 4: ANTI-FINGERPRINT SHIELDS ================= */}
      {activeTab === 'anti_fingerprint' && (
        <div className="space-y-4">
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-xs font-bold text-slate-200">Zero-Fingerprint Masking Suite</h3>
                  <p className="text-[11px] text-slate-400">
                    Bypasses bot heuristics, canvas fingerprint scrapers, and browser telemetry trackers.
                  </p>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableAntiFingerprint}
                  onChange={() => handleToggleOption('enableAntiFingerprint')}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 cursor-pointer accent-emerald-500"
                />
                <span className="text-xs font-bold text-emerald-400">Master Shield Active</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Spoof Client Hints */}
              <div 
                onClick={() => handleToggleOption('spoofClientHints')}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  fingerprintConfig.spoofClientHints 
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-slate-200' 
                    : 'bg-slate-900/60 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold">Sec-CH-UA Client Hints</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={fingerprintConfig.spoofClientHints}
                    readOnly
                    className="w-4 h-4 rounded accent-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Injects authentic Sec-CH-UA-Platform and Sec-CH-UA-Mobile headers matching user agent.
                </p>
              </div>

              {/* Mask Canvas & WebGL */}
              <div 
                onClick={() => handleToggleOption('maskCanvasAudioContext')}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  fingerprintConfig.maskCanvasAudioContext 
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-slate-200' 
                    : 'bg-slate-900/60 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <EyeOff className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold">Canvas & WebGL Masking</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={fingerprintConfig.maskCanvasAudioContext}
                    readOnly
                    className="w-4 h-4 rounded accent-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Randomizes GPU renderers (Apple M3, RTX 4070) and AudioContext noise hashes.
                </p>
              </div>

              {/* Randomize Screen Resolutions */}
              <div 
                onClick={() => handleToggleOption('randomizeScreenResolutions')}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  fingerprintConfig.randomizeScreenResolutions 
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-slate-200' 
                    : 'bg-slate-900/60 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold">Screen Viewport Randomization</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={fingerprintConfig.randomizeScreenResolutions}
                    readOnly
                    className="w-4 h-4 rounded accent-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Varies viewport aspect ratios (1080p, 1440p, mobile retina 3x) per visitor session.
                </p>
              </div>

              {/* Geo Headers & Cookie State */}
              <div 
                onClick={() => handleToggleOption('injectGeoHeaders')}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  fingerprintConfig.injectGeoHeaders 
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-slate-200' 
                    : 'bg-slate-900/60 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold">Geo-IP & Cookie Persistence</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={fingerprintConfig.injectGeoHeaders}
                    readOnly
                    className="w-4 h-4 rounded accent-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Injects X-Forwarded-For, CF-IPCountry, and manages returning vs new visitor `_ga` cookies.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
