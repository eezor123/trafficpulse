import { TrafficConfig } from '../types';

export const TRAFFIC_PRESETS: TrafficConfig[] = [
  {
    id: 'preset-built-in-sandbox',
    name: 'Built-in Sandbox Demo',
    description: 'Instant zero-configuration load test hitting local mock catalog and order endpoints with realistic variable delays and responses.',
    targetUrl: '/api/sandbox/products',
    method: 'GET',
    engineMode: 'built_in_sandbox',
    headers: [
      { id: 'h1', key: 'Accept', value: 'application/json', enabled: true },
      { id: 'h2', key: 'X-Client-Version', value: '2.4.0', enabled: true }
    ],
    params: [
      { id: 'p1', key: 'category', value: 'electronics', enabled: true },
      { id: 'p2', key: 'limit', value: '20', enabled: true },
      { id: 'p3', key: 'page', value: '{{random_int_1_10}}', enabled: true }
    ],
    bodyType: 'none',
    bodyContent: '',
    loadProfile: {
      pattern: 'ramp',
      durationSeconds: 20,
      targetRps: 50,
      initialRps: 5,
      peakRps: 80,
      rampUpSeconds: 5,
      rampDownSeconds: 3,
      spikeIntervalSeconds: 8,
      spikeDurationSeconds: 2,
      chaosJitterPct: 15,
      concurrencyLimit: 25,
      timeoutMs: 5000
    },
    persona: {
      devices: {
        desktopChrome: 50,
        desktopSafari: 20,
        mobileIos: 15,
        mobileAndroid: 10,
        botCrawler: 5
      },
      regions: [
        { region: 'US-East (N. Virginia)', weight: 45, simulatedLatencyMs: 20 },
        { region: 'EU-West (Frankfurt)', weight: 35, simulatedLatencyMs: 45 },
        { region: 'AP-Southeast (Singapore)', weight: 20, simulatedLatencyMs: 95 }
      ],
      enableKeepAlive: true,
      followRedirects: true,
      randomizeIp: true
    },
    isMultiStep: false,
    steps: [],
    assertions: [
      {
        id: 'a1',
        metric: 'p95_latency',
        operator: '<',
        threshold: 300,
        description: '95% of requests must complete in under 300ms'
      },
      {
        id: 'a2',
        metric: 'error_rate',
        operator: '<',
        threshold: 2,
        description: 'Error rate must remain below 2%'
      }
    ]
  },
  {
    id: 'preset-ecommerce-flash-sale',
    name: 'Black Friday / Flash Sale Spike',
    description: 'High-intensity spike test simulating sudden product drop traffic surges, peak saturation, and inventory contention.',
    targetUrl: '/api/sandbox/orders',
    method: 'POST',
    engineMode: 'built_in_sandbox',
    headers: [
      { id: 'h1', key: 'Content-Type', value: 'application/json', enabled: true },
      { id: 'h2', key: 'Authorization', value: 'Bearer {{uuid}}', enabled: true },
      { id: 'h3', key: 'X-Idempotency-Key', value: '{{uuid}}', enabled: true }
    ],
    params: [],
    bodyType: 'json',
    bodyContent: JSON.stringify(
      {
        orderId: 'ORD-{{uuid}}',
        sku: '{{random_sku}}',
        quantity: '{{random_int_1_5}}',
        buyerEmail: '{{random_email}}',
        shippingCity: '{{random_city}}',
        timestamp: '{{timestamp}}'
      },
      null,
      2
    ),
    loadProfile: {
      pattern: 'spike',
      durationSeconds: 30,
      targetRps: 20,
      initialRps: 5,
      peakRps: 150,
      rampUpSeconds: 4,
      rampDownSeconds: 4,
      spikeIntervalSeconds: 10,
      spikeDurationSeconds: 4,
      chaosJitterPct: 20,
      concurrencyLimit: 50,
      timeoutMs: 4000
    },
    persona: {
      devices: {
        desktopChrome: 30,
        desktopSafari: 15,
        mobileIos: 40,
        mobileAndroid: 15,
        botCrawler: 0
      },
      regions: [
        { region: 'US-East (N. Virginia)', weight: 60, simulatedLatencyMs: 15 },
        { region: 'US-West (Oregon)', weight: 40, simulatedLatencyMs: 35 }
      ],
      enableKeepAlive: true,
      followRedirects: true,
      randomizeIp: true
    },
    isMultiStep: false,
    steps: [],
    assertions: [
      {
        id: 'a1',
        metric: 'p99_latency',
        operator: '<',
        threshold: 600,
        description: 'P99 Latency under 600ms during peak spike'
      },
      {
        id: 'a2',
        metric: 'error_rate',
        operator: '<',
        threshold: 5,
        description: 'Failed requests under 5%'
      }
    ]
  },
  {
    id: 'preset-multistep-journey',
    name: 'Multi-Step User Checkout Journey',
    description: 'Realistic sequence: Step 1 Authenticate -> Step 2 Browse Catalog -> Step 3 Add Item to Cart -> Step 4 Submit Payment.',
    targetUrl: '/api/sandbox/auth/login',
    method: 'POST',
    engineMode: 'built_in_sandbox',
    headers: [{ id: 'h1', key: 'Content-Type', value: 'application/json', enabled: true }],
    params: [],
    bodyType: 'json',
    bodyContent: '{"username":"{{random_name}}","password":"secretPass123"}',
    loadProfile: {
      pattern: 'constant',
      durationSeconds: 25,
      targetRps: 20,
      initialRps: 10,
      peakRps: 30,
      rampUpSeconds: 3,
      rampDownSeconds: 2,
      spikeIntervalSeconds: 10,
      spikeDurationSeconds: 2,
      chaosJitterPct: 10,
      concurrencyLimit: 20,
      timeoutMs: 6000
    },
    persona: {
      devices: {
        desktopChrome: 45,
        desktopSafari: 20,
        mobileIos: 25,
        mobileAndroid: 10,
        botCrawler: 0
      },
      regions: [
        { region: 'US-East', weight: 50, simulatedLatencyMs: 25 },
        { region: 'EU-Central', weight: 50, simulatedLatencyMs: 40 }
      ],
      enableKeepAlive: true,
      followRedirects: true,
      randomizeIp: true
    },
    isMultiStep: true,
    steps: [
      {
        id: 's1',
        name: '1. User Auth & Token',
        method: 'POST',
        url: '/api/sandbox/auth/login',
        headers: [{ id: 'sh1', key: 'Content-Type', value: 'application/json', enabled: true }],
        params: [],
        bodyType: 'json',
        bodyContent: '{"user":"{{random_email}}","pass":"pass_{{random_int_1_100}}"}',
        weight: 100,
        extractVariables: [{ varName: 'authToken', jsonPath: 'token' }],
        thinkTimeMs: 150
      },
      {
        id: 's2',
        name: '2. Search Catalog',
        method: 'GET',
        url: '/api/sandbox/products',
        headers: [
          { id: 'sh2', key: 'Authorization', value: 'Bearer {{authToken}}', enabled: true }
        ],
        params: [
          { id: 'sp1', key: 'query', value: '{{random_search}}', enabled: true },
          { id: 'sp2', key: 'page', value: '1', enabled: true }
        ],
        bodyType: 'none',
        bodyContent: '',
        weight: 90,
        thinkTimeMs: 250
      },
      {
        id: 's3',
        name: '3. Create Order',
        method: 'POST',
        url: '/api/sandbox/orders',
        headers: [
          { id: 'sh3', key: 'Content-Type', value: 'application/json', enabled: true },
          { id: 'sh4', key: 'Authorization', value: 'Bearer {{authToken}}', enabled: true }
        ],
        params: [],
        bodyType: 'json',
        bodyContent: '{"item":"{{random_sku}}","quantity":1,"price":49.99}',
        weight: 60,
        thinkTimeMs: 300
      }
    ],
    assertions: [
      {
        id: 'a1',
        metric: 'success_rate',
        operator: '>=',
        threshold: 98,
        description: 'End-to-end journey success rate at least 98%'
      },
      {
        id: 'a2',
        metric: 'avg_latency',
        operator: '<',
        threshold: 250,
        description: 'Average step latency under 250ms'
      }
    ]
  },
  {
    id: 'preset-chaos-resilience',
    name: 'Chaos & Rate-Limit Stress Test',
    description: 'Pours fluctuating traffic onto a flaky / rate-limited backend to test circuit breakers, retry backoffs, and error degradation.',
    targetUrl: '/api/sandbox/flaky',
    method: 'GET',
    engineMode: 'built_in_sandbox',
    headers: [{ id: 'h1', key: 'X-Chaos-Mode', value: 'active', enabled: true }],
    params: [
      { id: 'p1', key: 'errorRate', value: '15', enabled: true },
      { id: 'p2', key: 'jitterMaxMs', value: '350', enabled: true }
    ],
    bodyType: 'none',
    bodyContent: '',
    loadProfile: {
      pattern: 'chaos',
      durationSeconds: 20,
      targetRps: 40,
      initialRps: 10,
      peakRps: 100,
      rampUpSeconds: 3,
      rampDownSeconds: 2,
      spikeIntervalSeconds: 6,
      spikeDurationSeconds: 2,
      chaosJitterPct: 40,
      concurrencyLimit: 30,
      timeoutMs: 3000
    },
    persona: {
      devices: {
        desktopChrome: 20,
        desktopSafari: 20,
        mobileIos: 20,
        mobileAndroid: 20,
        botCrawler: 20
      },
      regions: [
        { region: 'Global Mixed', weight: 100, simulatedLatencyMs: 60 }
      ],
      enableKeepAlive: true,
      followRedirects: true,
      randomizeIp: true
    },
    isMultiStep: false,
    steps: [],
    assertions: [
      {
        id: 'a1',
        metric: 'p90_latency',
        operator: '<',
        threshold: 800,
        description: 'P90 latency under 800ms despite chaos jitter'
      }
    ]
  },
  {
    id: 'preset-diurnal-wave',
    name: 'Diurnal 24h Cyclic Wave Simulation',
    description: 'Compresses a 24-hour day/night consumer traffic wave into a quick benchmark to test auto-scaling readiness.',
    targetUrl: '/api/sandbox/products',
    method: 'GET',
    engineMode: 'built_in_sandbox',
    headers: [{ id: 'h1', key: 'Cache-Control', value: 'no-cache', enabled: true }],
    params: [{ id: 'p1', key: 'limit', value: '10', enabled: true }],
    bodyType: 'none',
    bodyContent: '',
    loadProfile: {
      pattern: 'diurnal',
      durationSeconds: 30,
      targetRps: 30,
      initialRps: 5,
      peakRps: 70,
      rampUpSeconds: 5,
      rampDownSeconds: 5,
      spikeIntervalSeconds: 10,
      spikeDurationSeconds: 3,
      chaosJitterPct: 10,
      concurrencyLimit: 35,
      timeoutMs: 4000
    },
    persona: {
      devices: {
        desktopChrome: 40,
        desktopSafari: 20,
        mobileIos: 25,
        mobileAndroid: 15,
        botCrawler: 0
      },
      regions: [{ region: 'US & EU Core', weight: 100, simulatedLatencyMs: 30 }],
      enableKeepAlive: true,
      followRedirects: true,
      randomizeIp: true
    },
    isMultiStep: false,
    steps: [],
    assertions: [
      {
        id: 'a1',
        metric: 'error_rate',
        operator: '<',
        threshold: 1,
        description: 'Zero error tolerance on scaling curves'
      }
    ]
  }
];
