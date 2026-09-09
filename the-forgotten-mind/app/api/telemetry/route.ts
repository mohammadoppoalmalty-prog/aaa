import { NextResponse } from 'next/server';

/**
 * Anonymous, cookie-free RUM — STANDARDS 9.7.
 *
 * Starts reporting in Phase 1 so there is a baseline to regress against for the
 * remaining phases. Three rules it holds to:
 *
 * — **Nothing identifying is accepted.** No id, no session, no IP is stored;
 *   the body is validated field by field and everything unrecognised is dropped
 *   rather than passed through.
 * — **`Do Not Track` is honoured**, and the client checks it too, so a
 *   respecting visitor costs nothing to serve.
 * — **It never fails the page.** A telemetry endpoint that 500s must not be
 *   something the visitor can feel, so every path returns 204.
 */

const METRICS = new Set(['LCP', 'INP', 'CLS', 'TTFB', 'FCP', 'frame', 'area']);
const TIERS = new Set(['ultra', 'high', 'medium', 'low', 'minimal']);

interface Sample {
  readonly metric: string;
  readonly value: number;
  readonly tier: string;
  readonly route: string;
  readonly connection: string;
}

function clean(raw: unknown): Sample | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const body = raw as Record<string, unknown>;

  const metric = typeof body.metric === 'string' ? body.metric : '';
  const value = typeof body.value === 'number' && Number.isFinite(body.value) ? body.value : NaN;
  if (!METRICS.has(metric) || Number.isNaN(value)) return null;

  return {
    metric,
    value: Math.round(value * 100) / 100,
    tier: typeof body.tier === 'string' && TIERS.has(body.tier) ? body.tier : 'unknown',
    /* The route, not the URL: a URL can carry a query string, and a query string
       can carry anything a visitor typed. */
    route: typeof body.route === 'string' ? body.route.split('?')[0]!.slice(0, 64) : 'unknown',
    connection: typeof body.connection === 'string' ? body.connection.slice(0, 12) : 'unknown',
  };
}

export async function POST(request: Request): Promise<Response> {
  if (request.headers.get('dnt') === '1') return new NextResponse(null, { status: 204 });

  try {
    const sample = clean(await request.json());
    if (sample) {
      /* Phase 1 logs; the Postgres sink and the /admin/insights view land with
         the backend in Phase 4. Writing it down now means the shape is fixed
         before there is data worth keeping. */
      // eslint-disable-next-line no-console -- this route *is* the sink until the Phase-4 backend exists
      console.info('[rum]', JSON.stringify(sample));
    }
  } catch {
    /* A malformed beacon is not an error worth surfacing to anyone. */
  }

  return new NextResponse(null, { status: 204 });
}
