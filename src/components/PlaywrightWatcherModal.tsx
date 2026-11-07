import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Play, 
  Square, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ShieldCheck, 
  Camera, 
  Terminal, 
  Copy, 
  Check, 
  RefreshCw, 
  Monitor, 
  Eye, 
  Sliders, 
  Sparkles,
  ExternalLink,
  Volume2,
  VolumeX,
  Cpu
} from 'lucide-react';

interface PlaywrightWatcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialUrl?: string;
}

interface WatcherResponse {
  success: boolean;
  url: string;
  platformDetected: string;
  watchDurationSeconds: number;
  actualWatchSeconds: number;
  videoStarted: boolean;
  initialTime?: number;
  finalTime?: number;
  consentDismissed: boolean;
  pageTitle: string;
  screenshotBase64?: string;
  error?: string;
  logs: string[];
}

export const PlaywrightWatcherModal: React.FC<PlaywrightWatcherModalProps> = ({
  isOpen,
  onClose,
  initialUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
}) => {
  const [url, setUrl] = useState(initialUrl);
  const [duration, setDuration] = useState<number>(30);
  const [isHeadless, setIsHeadless] = useState<boolean>(true);
  const [muteAudio, setMuteAudio] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [result, setResult] = useState<WatcherResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedCli, setCopiedCli] = useState<'node' | 'python' | null>(null);
  const [liveLogs, setLiveLogs] = useState<string[]>([]);
  const logContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (initialUrl) {
      setUrl(initialUrl);
    }
  }, [initialUrl]);

  // Timer counter when running
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isLoading) {
      setElapsedSeconds(0);
      timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isLoading]);

  // Scroll logs to bottom
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [liveLogs, result]);

  if (!isOpen) return null;

  const handleStartAutomation = async () => {
    if (!url.trim()) return;
    setIsLoading(true);
    setError(null);
    setResult(null);
    setLiveLogs([
      `[${new Date().toLocaleTimeString()}] [Playwright] Initializing real headless Chromium browser...`,
      `[${new Date().toLocaleTimeString()}] [Anti-Bot] Masking navigator.webdriver & configuring human fingerprints...`,
      `[${new Date().toLocaleTimeString()}] [Target] Connecting to ${url}...`,
    ]);

    try {
      const response = await fetch('/api/traffic/playwright-watch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url.trim(),
          duration,
          headless: isHeadless,
          muteAudio,
          captureScreenshot: true,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to complete browser video session');
      }

      setResult(data);
      if (data.logs && Array.isArray(data.logs)) {
        setLiveLogs(data.logs);
      }
    } catch (err: any) {
      setError(err.message || 'Automation execution failed');
      setLiveLogs((prev) => [...prev, `[ERROR] ${err.message || 'Execution error'}`]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (cmd: string, type: 'node' | 'python') => {
    navigator.clipboard.writeText(cmd);
    setCopiedCli(type);
    setTimeout(() => setCopiedCli(null), 2500);
  };

  const nodeCliCmd = `node scripts/watch_video.js --url "${url.trim()}" --duration ${duration}`;
  const pythonCliCmd = `python scripts/watch_video.py --url "${url.trim()}" --duration ${duration}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full p-6 shadow-2xl space-y-6 my-auto text-slate-100 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white tracking-tight">Playwright Autonomous Video Watcher</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                  REAL CHROMIUM BROWSER
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Headless execution • Anti-Bot Bypassing • Auto Consent Dismissal • Native Play Interaction
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-6 overflow-y-auto pr-1 flex-1">
          {/* Strict Requirements Badges */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5 flex items-start gap-2">
              <Monitor className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-bold text-slate-200">Real Rendering</p>
                <p className="text-[10px] text-slate-400">Headless Chromium instance</p>
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-bold text-slate-200">Anti-Bot Bypass</p>
                <p className="text-[10px] text-slate-400">Masks webdriver & fingerprints</p>
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5 flex items-start gap-2">
              <Sliders className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-bold text-slate-200">Consent Handled</p>
                <p className="text-[10px] text-slate-400">Auto-clicks "Accept All" banners</p>
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5 flex items-start gap-2">
              <Play className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-bold text-slate-200">Video Interaction</p>
                <p className="text-[10px] text-slate-400">Clicks play & skips video ads</p>
              </div>
            </div>
          </div>

          {/* Configuration Form */}
          <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Video Target URL
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-500 transition-colors"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Duration Slider / Presets */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex justify-between">
                  <span>Watch Duration</span>
                  <span className="text-cyan-400 font-mono font-bold">{duration} seconds</span>
                </label>
                <div className="flex gap-1.5">
                  {[15, 30, 45, 60].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setDuration(sec)}
                      disabled={isLoading}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        duration === sec
                          ? 'bg-cyan-600 border-cyan-400 text-white shadow-md'
                          : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>

              {/* Headless Toggle */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Browser Engine Mode
                </label>
                <button
                  type="button"
                  onClick={() => setIsHeadless(!isHeadless)}
                  disabled={isLoading}
                  className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    isHeadless
                      ? 'bg-slate-900 border-slate-700 text-slate-200'
                      : 'bg-indigo-600 border-indigo-400 text-white'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>{isHeadless ? 'Headless (Fast / Silent)' : 'Headed (Debug / Visible)'}</span>
                </button>
              </div>

              {/* Audio Toggle */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Audio Output
                </label>
                <button
                  type="button"
                  onClick={() => setMuteAudio(!muteAudio)}
                  disabled={isLoading}
                  className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    muteAudio
                      ? 'bg-slate-900 border-slate-700 text-slate-300'
                      : 'bg-emerald-600 border-emerald-400 text-white'
                  }`}
                >
                  {muteAudio ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  <span>{muteAudio ? 'Muted (Autoplay Safe)' : 'Unmuted Stream'}</span>
                </button>
              </div>
            </div>

            {/* Run Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleStartAutomation}
                disabled={isLoading || !url.trim()}
                className={`w-full py-3 rounded-xl font-bold text-sm tracking-wide flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer ${
                  isLoading
                    ? 'bg-amber-600 text-white cursor-wait'
                    : 'bg-gradient-to-r from-cyan-600 via-indigo-600 to-cyan-600 hover:from-cyan-500 hover:to-indigo-500 text-white'
                }`}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Executing Playwright Session ({elapsedSeconds}s / {duration}s)...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Launch Real Browser Video Watcher ({duration}s Session)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results Summary Box */}
          {result && (
            <div className="bg-slate-950 border border-emerald-500/40 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Session Completed Successfully</span>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  Dwell: {result.actualWatchSeconds}s / {result.watchDurationSeconds}s
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                  <p className="text-slate-400">Platform</p>
                  <p className="font-bold text-white mt-0.5">{result.platformDetected}</p>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                  <p className="text-slate-400">Consent Dismissed</p>
                  <p className="font-bold text-emerald-400 mt-0.5">
                    {result.consentDismissed ? 'Yes (Auto-clicked)' : 'No banner'}
                  </p>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                  <p className="text-slate-400">Video Started</p>
                  <p className="font-bold text-cyan-400 mt-0.5">
                    {result.videoStarted ? 'Confirmed Playing' : 'Probed'}
                  </p>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                  <p className="text-slate-400">Stream Timecode</p>
                  <p className="font-bold text-indigo-300 font-mono mt-0.5">
                    {result.initialTime?.toFixed(1) || 0}s → {result.finalTime?.toFixed(1) || 0}s
                  </p>
                </div>
              </div>

              {result.pageTitle && (
                <div className="text-xs text-slate-300 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-500 font-semibold mr-1.5">Page Title:</span>
                  <span className="text-white font-medium">{result.pageTitle}</span>
                </div>
              )}

              {/* Verification Screenshot */}
              {result.screenshotBase64 && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                    <Camera className="w-4 h-4 text-cyan-400" />
                    <span>Real Browser Render Verification (Chromium Snapshot)</span>
                  </div>
                  <div className="rounded-xl overflow-hidden border border-slate-800 bg-black aspect-video max-h-72 flex items-center justify-center">
                    <img
                      src={`data:image/jpeg;base64,${result.screenshotBase64}`}
                      alt="Browser render capture"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-rose-950/40 border border-rose-500/50 rounded-2xl p-4 flex items-start gap-3 text-rose-200 text-xs">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-rose-300">Execution Error</p>
                <p className="mt-1 font-mono">{error}</p>
              </div>
            </div>
          )}

          {/* Live Execution Terminal Logs */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-slate-200">Playwright Automation Console Logs</span>
              </div>
              {isLoading && (
                <span className="text-amber-400 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin" /> Live Streaming
                </span>
              )}
            </div>

            <div
              ref={logContainerRef}
              className="bg-black/80 rounded-xl p-3 font-mono text-[11px] leading-relaxed text-slate-300 h-40 overflow-y-auto border border-slate-800/80 space-y-1 select-text"
            >
              {liveLogs.length === 0 ? (
                <span className="text-slate-600">Waiting to launch browser session...</span>
              ) : (
                liveLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className={
                      log.includes('ERROR') || log.includes('Error')
                        ? 'text-rose-400 font-bold'
                        : log.includes('SUCCESS') || log.includes('successfully')
                        ? 'text-emerald-400 font-semibold'
                        : log.includes('warn') || log.includes('Waiting')
                        ? 'text-amber-300'
                        : 'text-slate-300'
                    }
                  >
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* CLI Commands Section for Developers */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                Developer CLI Commands (Stand-Alone Scripts)
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Terminal Executable</span>
            </div>

            {/* Node.js Command */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between gap-3">
              <div className="truncate flex-1 font-mono text-xs text-cyan-300">
                <span className="text-slate-500 mr-2">Node.js:</span>
                {nodeCliCmd}
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(nodeCliCmd, 'node')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
              >
                {copiedCli === 'node' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Python Command */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between gap-3">
              <div className="truncate flex-1 font-mono text-xs text-emerald-300">
                <span className="text-slate-500 mr-2">Python:</span>
                {pythonCliCmd}
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(pythonCliCmd, 'python')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
              >
                {copiedCli === 'python' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Playwright Engine: Chromium v130 (Headless Shell Ready)</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
