import { 
  TrafficConfig, 
  MetricSnapshot, 
  RequestMetricLog, 
  RunSummary, 
  SlaAssertion 
} from '../types';
import { 
  generateUserAgent, 
  generateRandomIp, 
  substituteTemplateVariables, 
  getRandomElement 
} from '../utils/faker';

// Percentile calculator utility
export function calculatePercentile(sortedValues: number[], percentile: number): number {
  if (sortedValues.length === 0) return 0;
  const index = Math.min(
    Math.floor((percentile / 100) * sortedValues.length),
    sortedValues.length - 1
  );
  return sortedValues[index];
}

export function getValueByJsonPath(obj: any, path: string): string {
  if (!obj || !path) return '';
  try {
    const parts = path.split('.');
    let curr = obj;
    for (const part of parts) {
      if (curr === undefined || curr === null) return '';
      curr = curr[part];
    }
    return typeof curr === 'object' ? JSON.stringify(curr) : String(curr);
  } catch {
    return '';
  }
}

export interface EngineCallbacks {
  onSnapshot: (snapshot: MetricSnapshot) => void;
  onLog: (log: RequestMetricLog) => void;
  onComplete: (summary: RunSummary) => void;
  onError: (error: string) => void;
}

export class TrafficGeneratorEngine {
  private config: TrafficConfig;
  private callbacks: EngineCallbacks;
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private abortController: AbortController | null = null;
  private timerHandle: any = null;
  private metricIntervalHandle: any = null;

  // Run Statistics
  private startTime: number = 0;
  private totalRequests: number = 0;
  private successfulRequests: number = 0;
  private failedRequests: number = 0;
  private totalBytesTransferred: number = 0;
  private latenciesBuffer: number[] = [];
  private allLatencies: number[] = [];
  private currentSecondStatusCodes: Record<number, number> = {};
  private allStatusCodes: Record<number, number> = {};
  private snapshots: MetricSnapshot[] = [];
  private sampleLogs: RequestMetricLog[] = [];
  private activeVus: number = 0;

  constructor(config: TrafficConfig, callbacks: EngineCallbacks) {
    this.config = config;
    this.callbacks = callbacks;
  }

  public async start() {
    this.isRunning = true;
    this.isPaused = false;
    this.abortController = new AbortController();
    this.startTime = Date.now();
    this.totalRequests = 0;
    this.successfulRequests = 0;
    this.failedRequests = 0;
    this.totalBytesTransferred = 0;
    this.latenciesBuffer = [];
    this.allLatencies = [];
    this.currentSecondStatusCodes = {};
    this.allStatusCodes = {};
    this.snapshots = [];
    this.sampleLogs = [];

    const durationMs = (this.config.loadProfile.durationSeconds || 20) * 1000;

    // Start 1-second interval metrics reporter
    let secondCounter = 0;
    this.metricIntervalHandle = setInterval(() => {
      if (!this.isRunning) return;
      secondCounter++;

      const sortedLatencies = [...this.latenciesBuffer].sort((a, b) => a - b);
      const count = sortedLatencies.length;
      const sum = sortedLatencies.reduce((a, b) => a + b, 0);

      const targetRps = this.computeTargetRps(secondCounter);
      const snapshot: MetricSnapshot = {
        timestamp: secondCounter,
        timeLabel: `${secondCounter}s`,
        currentRps: count,
        targetRps,
        activeVus: this.activeVus,
        avgLatencyMs: count > 0 ? sum / count : 0,
        p50Ms: calculatePercentile(sortedLatencies, 50),
        p90Ms: calculatePercentile(sortedLatencies, 90),
        p95Ms: calculatePercentile(sortedLatencies, 95),
        p99Ms: calculatePercentile(sortedLatencies, 99),
        minLatencyMs: count > 0 ? sortedLatencies[0] : 0,
        maxLatencyMs: count > 0 ? sortedLatencies[count - 1] : 0,
        status2xx: Object.entries(this.currentSecondStatusCodes)
          .filter(([code]) => parseInt(code, 10) >= 200 && parseInt(code, 10) < 300)
          .reduce((acc, [, val]) => acc + val, 0),
        status3xx: Object.entries(this.currentSecondStatusCodes)
          .filter(([code]) => parseInt(code, 10) >= 300 && parseInt(code, 10) < 400)
          .reduce((acc, [, val]) => acc + val, 0),
        status4xx: Object.entries(this.currentSecondStatusCodes)
          .filter(([code]) => parseInt(code, 10) >= 400 && parseInt(code, 10) < 500)
          .reduce((acc, [, val]) => acc + val, 0),
        status5xx: Object.entries(this.currentSecondStatusCodes)
          .filter(([code]) => parseInt(code, 10) >= 500)
          .reduce((acc, [, val]) => acc + val, 0),
        errors: this.currentSecondStatusCodes[0] || 0,
        bytesPerSec: count * 450, // estimated or actual
      };

      this.snapshots.push(snapshot);
      this.callbacks.onSnapshot(snapshot);

      // Reset per-second buffers
      this.latenciesBuffer = [];
      this.currentSecondStatusCodes = {};
    }, 1000);

    // Concurrency workers loop
    const maxVus = Math.min(this.config.loadProfile.concurrencyLimit || 20, 50);
    const workerPromises: Promise<void>[] = [];

    for (let vuIndex = 0; vuIndex < maxVus; vuIndex++) {
      workerPromises.push(this.runVirtualUser(vuIndex, durationMs));
    }

    // Wait until test completes or is aborted
    this.timerHandle = setTimeout(() => {
      this.stop();
    }, durationMs + 500);

    await Promise.all(workerPromises);
    this.finalizeSummary();
  }

  public stop() {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.abortController) {
      this.abortController.abort();
    }
    if (this.metricIntervalHandle) {
      clearInterval(this.metricIntervalHandle);
      this.metricIntervalHandle = null;
    }
    if (this.timerHandle) {
      clearTimeout(this.timerHandle);
      this.timerHandle = null;
    }
    this.finalizeSummary();
  }

  private computeTargetRps(t: number): number {
    const p = this.config.loadProfile;
    const totalSec = p.durationSeconds || 20;

    if (p.pattern === 'constant') return p.targetRps;
    if (p.pattern === 'ramp') {
      if (t < p.rampUpSeconds) {
        return Math.round(p.initialRps + ((p.targetRps - p.initialRps) * (t / Math.max(1, p.rampUpSeconds))));
      } else if (t > totalSec - p.rampDownSeconds) {
        const rem = totalSec - t;
        return Math.round(p.initialRps + ((p.targetRps - p.initialRps) * (rem / Math.max(1, p.rampDownSeconds))));
      }
      return p.targetRps;
    }
    if (p.pattern === 'spike') {
      const cycle = t % Math.max(3, p.spikeIntervalSeconds || 10);
      if (cycle < p.spikeDurationSeconds) {
        return p.peakRps || p.targetRps * 2.5;
      }
      return p.targetRps;
    }
    if (p.pattern === 'diurnal') {
      const freq = (t / totalSec) * Math.PI * 3;
      const norm = (Math.sin(freq) + 1) / 2;
      return Math.round(p.initialRps + (p.peakRps - p.initialRps) * norm);
    }
    if (p.pattern === 'chaos') {
      const base = p.targetRps;
      const jitter = (Math.sin(t * 1.5) + Math.cos(t * 3.7)) * (p.chaosJitterPct / 100) * base;
      return Math.max(1, Math.round(base + jitter));
    }
    return p.targetRps;
  }

  private async runVirtualUser(vuIndex: number, maxDurationMs: number) {
    this.activeVus++;
    const sessionContext: Record<string, string> = {
      userId: `vu_${vuIndex + 1}_${Date.now()}`,
    };

    while (this.isRunning && Date.now() - this.startTime < maxDurationMs) {
      const elapsedSec = (Date.now() - this.startTime) / 1000;
      const currentTargetRps = this.computeTargetRps(elapsedSec);
      const concurrency = this.config.loadProfile.concurrencyLimit || 20;

      // Pacing interval per VU
      const targetDelayMs = Math.max(10, Math.round((1000 * concurrency) / Math.max(1, currentTargetRps)));

      if (this.config.isMultiStep && this.config.steps.length > 0) {
        // Multi-Step Scenario execution
        for (const step of this.config.steps) {
          if (!this.isRunning) break;
          await this.dispatchStep(step.name, step.method, step.url, step.headers, step.params, step.bodyContent, sessionContext, step.extractVariables);
          if (step.thinkTimeMs > 0) {
            await new Promise(r => setTimeout(r, step.thinkTimeMs));
          }
        }
      } else {
        // Single Request execution
        await this.dispatchStep(
          this.config.name,
          this.config.method,
          this.config.targetUrl,
          this.config.headers,
          this.config.params,
          this.config.bodyContent,
          sessionContext
        );
      }

      await new Promise(r => setTimeout(r, targetDelayMs));
    }

    this.activeVus = Math.max(0, this.activeVus - 1);
  }

  private async dispatchStep(
    stepName: string,
    method: string,
    rawUrl: string,
    headersList: any[],
    paramsList: any[],
    bodyTemplate: string,
    sessionContext: Record<string, string>,
    extractVariables?: Array<{ varName: string; jsonPath: string }>
  ) {
    if (!this.isRunning) return;

    const substitutedUrl = substituteTemplateVariables(rawUrl, sessionContext);
    const userAgent = generateUserAgent(this.config.persona.devices);
    const randomIp = this.config.persona.randomizeIp ? generateRandomIp() : '';

    const region = getRandomElement(this.config.persona.regions || [{ region: 'Global', weight: 100, simulatedLatencyMs: 20 }]);
    const simulatedLatencyMs = region ? region.simulatedLatencyMs : 0;

    // Build query params
    let urlWithParams = substitutedUrl;
    const enabledParams = (paramsList || []).filter(p => p.enabled && p.key);
    if (enabledParams.length > 0) {
      const qs = enabledParams
        .map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(substituteTemplateVariables(p.value, sessionContext))}`)
        .join('&');
      urlWithParams += (urlWithParams.includes('?') ? '&' : '?') + qs;
    }

    // Build headers
    const headersMap: Record<string, string> = {
      'User-Agent': userAgent,
    };
    if (randomIp) {
      headersMap['X-Forwarded-For'] = randomIp;
    }
    (headersList || []).filter(h => h.enabled && h.key).forEach(h => {
      headersMap[h.key] = substituteTemplateVariables(h.value, sessionContext);
    });

    const bodyContent = bodyTemplate ? substituteTemplateVariables(bodyTemplate, sessionContext) : undefined;
    const reqStart = performance.now();

    try {
      let statusCode = 200;
      let statusText = 'OK';
      let latencyMs = 0;
      let responseBytes = 0;
      let responseData: any = null;
      let success = true;

      if (this.config.engineMode === 'server_proxy' || this.config.engineMode === 'built_in_sandbox') {
        // Dispatch via Server-Side Proxy Dispatcher (Safe, CORS-free)
        const res = await fetch('/api/traffic/dispatch-single', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: urlWithParams,
            method,
            headers: headersMap,
            body: bodyContent,
            timeout: this.config.loadProfile.timeoutMs || 8000,
            simulatedRegionLatency: simulatedLatencyMs,
          }),
          signal: this.abortController?.signal,
        });
        const json = await res.json();
        statusCode = json.statusCode;
        statusText = json.statusText;
        latencyMs = json.latencyMs;
        responseBytes = json.bytes || 0;
        responseData = json.data;
        success = json.success;
      } else {
        // Direct Client Fetch Dispatch
        const fetchOptions: RequestInit = {
          method,
          headers: headersMap,
          signal: this.abortController?.signal,
        };
        if (bodyContent && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
          fetchOptions.body = bodyContent;
        }

        const res = await fetch(urlWithParams, fetchOptions);
        const text = await res.text();
        latencyMs = Math.round(performance.now() - reqStart + simulatedLatencyMs);
        statusCode = res.status;
        statusText = res.statusText;
        responseBytes = text.length;
        success = res.ok;
        try {
          responseData = JSON.parse(text);
        } catch {
          responseData = text;
        }
      }

      // Record Metrics
      this.totalRequests++;
      if (success) {
        this.successfulRequests++;
      } else {
        this.failedRequests++;
      }
      this.totalBytesTransferred += responseBytes;
      this.latenciesBuffer.push(latencyMs);
      this.allLatencies.push(latencyMs);
      this.currentSecondStatusCodes[statusCode] = (this.currentSecondStatusCodes[statusCode] || 0) + 1;
      this.allStatusCodes[statusCode] = (this.allStatusCodes[statusCode] || 0) + 1;

      // Extract variables into session context if defined
      if (extractVariables && extractVariables.length > 0 && responseData) {
        for (const ev of extractVariables) {
          const val = getValueByJsonPath(responseData, ev.jsonPath);
          if (val) {
            sessionContext[ev.varName] = val;
          }
        }
      }

      // Stream sample log
      const logEntry: RequestMetricLog = {
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: Date.now(),
        stepName,
        method: method as any,
        url: urlWithParams,
        statusCode,
        statusText,
        latencyMs,
        responseBytes,
        success,
        region: region ? region.region : 'Default',
        userAgent,
        requestHeaders: headersMap,
        responsePreview: typeof responseData === 'object' ? JSON.stringify(responseData).slice(0, 200) : String(responseData).slice(0, 200),
      };

      this.sampleLogs.unshift(logEntry);
      if (this.sampleLogs.length > 200) this.sampleLogs.pop();
      this.callbacks.onLog(logEntry);
    } catch (err: any) {
      if (err.name === 'AbortError') return;

      const latencyMs = Math.round(performance.now() - reqStart + simulatedLatencyMs);
      this.totalRequests++;
      this.failedRequests++;
      this.latenciesBuffer.push(latencyMs);
      this.allLatencies.push(latencyMs);
      this.currentSecondStatusCodes[0] = (this.currentSecondStatusCodes[0] || 0) + 1;
      this.allStatusCodes[0] = (this.allStatusCodes[0] || 0) + 1;

      const errorLog: RequestMetricLog = {
        id: `log_err_${Date.now()}`,
        timestamp: Date.now(),
        stepName,
        method: method as any,
        url: urlWithParams,
        statusCode: 0,
        statusText: 'Network Error',
        latencyMs,
        responseBytes: 0,
        success: false,
        error: err.message || 'Dispatch failed',
      };
      this.sampleLogs.unshift(errorLog);
      this.callbacks.onLog(errorLog);
    }
  }

  private finalizeSummary() {
    const sorted = [...this.allLatencies].sort((a, b) => a - b);
    const totalDurationMs = Date.now() - this.startTime;
    const avgRps = totalDurationMs > 0 ? (this.totalRequests / (totalDurationMs / 1000)) : 0;
    const peakRps = Math.max(...this.snapshots.map(s => s.currentRps), 0);
    const avgLatencyMs = sorted.length > 0 ? sorted.reduce((a, b) => a + b, 0) / sorted.length : 0;

    const p50 = calculatePercentile(sorted, 50);
    const p90 = calculatePercentile(sorted, 90);
    const p95 = calculatePercentile(sorted, 95);
    const p99 = calculatePercentile(sorted, 99);

    // Evaluate SLA assertions
    const assertionResults = (this.config.assertions || []).map(assertion => {
      let actualValue = 0;
      switch (assertion.metric) {
        case 'p90_latency':
          actualValue = p90;
          break;
        case 'p95_latency':
          actualValue = p95;
          break;
        case 'p99_latency':
          actualValue = p99;
          break;
        case 'avg_latency':
          actualValue = avgLatencyMs;
          break;
        case 'error_rate':
          actualValue = this.totalRequests > 0 ? (this.failedRequests / this.totalRequests) * 100 : 0;
          break;
        case 'success_rate':
          actualValue = this.totalRequests > 0 ? (this.successfulRequests / this.totalRequests) * 100 : 100;
          break;
        case 'min_rps':
          actualValue = avgRps;
          break;
      }

      let passed = false;
      if (assertion.operator === '<') passed = actualValue < assertion.threshold;
      else if (assertion.operator === '<=') passed = actualValue <= assertion.threshold;
      else if (assertion.operator === '>') passed = actualValue > assertion.threshold;
      else if (assertion.operator === '>=') passed = actualValue >= assertion.threshold;

      return {
        assertion,
        passed,
        actualValue,
      };
    });

    const allPassed = assertionResults.every(a => a.passed);

    const summary: RunSummary = {
      id: `run_${Date.now()}`,
      testName: this.config.name,
      startTime: this.startTime,
      endTime: Date.now(),
      totalDurationMs,
      totalRequests: this.totalRequests,
      successfulRequests: this.successfulRequests,
      failedRequests: this.failedRequests,
      avgRps,
      peakRps,
      avgLatencyMs,
      p50LatencyMs: p50,
      p90LatencyMs: p90,
      p95LatencyMs: p95,
      p99LatencyMs: p99,
      minLatencyMs: sorted.length > 0 ? sorted[0] : 0,
      maxLatencyMs: sorted.length > 0 ? sorted[sorted.length - 1] : 0,
      totalBytesTransferred: this.totalBytesTransferred,
      statusCodeCounts: this.allStatusCodes,
      assertionResults,
      allPassed,
      snapshots: this.snapshots,
      logsSample: this.sampleLogs.slice(0, 50),
    };

    this.callbacks.onComplete(summary);
  }
}
