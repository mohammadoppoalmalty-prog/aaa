'use client';

import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';

/**
 * Reports Core Web Vitals to `/api/telemetry`, segmented by quality tier and
 * connection — because a p75 that averages a gaming desktop with a mid-range
 * Android tells you nothing you can act on (STANDARDS 9.7).
 *
 * `sendBeacon` rather than `fetch`, so a report in flight when the page unloads
 * still arrives and never delays the navigation.
 */

interface Connection {
  readonly effectiveType?: string;
}

const send = (metric: Metric, tier: string): void => {
  if (typeof navigator === 'undefined') return;
  if (navigator.doNotTrack === '1') return;

  const body = JSON.stringify({
    metric: metric.name,
    value: metric.value,
    tier,
    route: window.location.pathname,
    connection: (navigator as Navigator & { connection?: Connection }).connection?.effectiveType ?? 'unknown',
  });

  try {
    if (typeof navigator.sendBeacon === 'function') {
      navigator.sendBeacon('/api/telemetry', new Blob([body], { type: 'application/json' }));
      return;
    }
    void fetch('/api/telemetry', { method: 'POST', body, keepalive: true });
  } catch {
    /* Telemetry is never worth an error a visitor can see. */
  }
};

let started = false;

export function startRum(tier: () => string): void {
  if (started || typeof window === 'undefined') return;
  started = true;

  const report = (metric: Metric) => send(metric, tier());
  onLCP(report);
  onINP(report);
  onCLS(report);
  onTTFB(report);
  onFCP(report);
}
