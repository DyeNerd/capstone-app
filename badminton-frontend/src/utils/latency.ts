// E2E shot latency logger. Gated by REACT_APP_LATENCY_LOG=true so it
// compiles away to no-ops in normal production builds. Buffers rows in
// memory; user calls window.downloadLatencyCsv() to save a CSV.

const ENABLED = process.env.REACT_APP_LATENCY_LOG === 'true';
const MAX_ROWS = 10000;

export interface ShotLatencyRow {
  sessionId: string;
  shotNumber: number;
  frameCapturedAt?: string;
  shotDetectedAt?: string;
  cvPublishedAt?: string;
  brokerReceivedAt?: string;
  brokerEmittedAt?: string;
  socketReceivedAt: number; // Date.now() on socket handler entry
  paintedAt: number;        // Date.now() inside double rAF
}

const buffer: ShotLatencyRow[] = [];

function toMs(iso: string | undefined): number | null {
  if (!iso) return null;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : null;
}

function delta(a: number | null, b: number | null): number | '' {
  if (a == null || b == null) return '';
  return b - a;
}

function rowToCsv(r: ShotLatencyRow): string {
  const t0 = toMs(r.frameCapturedAt);
  const t1 = toMs(r.shotDetectedAt);
  const t2 = toMs(r.cvPublishedAt);
  const t3 = toMs(r.brokerReceivedAt);
  const t4 = toMs(r.brokerEmittedAt);
  const t5 = r.socketReceivedAt;
  const t6 = r.paintedAt;

  return [
    r.sessionId,
    r.shotNumber,
    r.frameCapturedAt ?? '',
    r.shotDetectedAt ?? '',
    r.cvPublishedAt ?? '',
    r.brokerReceivedAt ?? '',
    r.brokerEmittedAt ?? '',
    t5,
    t6,
    delta(t0, t1), // detect_ms
    delta(t1, t2), // publish_ms
    delta(t2, t3), // broker_transport_ms (CV -> backend)
    delta(t3, t4), // backend_processing_ms
    delta(t4, t5), // socket_transport_ms (backend -> browser)
    delta(t5, t6), // render_ms (socket received -> pixel painted)
    delta(t0, t6), // end_to_end_ms
  ].join(',');
}

const HEADER = [
  'session_id',
  'shot_number',
  'frame_captured_at',
  'shot_detected_at',
  'cv_published_at',
  'broker_received_at',
  'broker_emitted_at',
  'socket_received_at',
  'painted_at',
  'detect_ms',
  'publish_ms',
  'broker_transport_ms',
  'backend_processing_ms',
  'socket_transport_ms',
  'render_ms',
  'end_to_end_ms',
].join(',');

export function isLatencyLoggingEnabled(): boolean {
  return ENABLED;
}

export function logShotLatency(row: ShotLatencyRow): void {
  if (!ENABLED) return;
  if (buffer.length >= MAX_ROWS) buffer.shift();
  buffer.push(row);
  // Show one-line summary for live inspection
  const t0 = toMs(row.frameCapturedAt);
  const e2e = t0 != null ? row.paintedAt - t0 : '?';
  // eslint-disable-next-line no-console
  console.log(`[LAT] shot#${row.shotNumber} e2e=${e2e}ms`);
}

function buildCsv(): string {
  return HEADER + '\n' + buffer.map(rowToCsv).join('\n') + '\n';
}

export function downloadLatencyCsv(filename = 'frontend_latency.csv'): void {
  if (buffer.length === 0) {
    // eslint-disable-next-line no-console
    console.warn('[LAT] No rows buffered');
    return;
  }
  const blob = new Blob([buildCsv()], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Expose on window so testers can trigger the download from DevTools without
// shipping a UI. No-op when logging is disabled.
if (typeof window !== 'undefined') {
  if (ENABLED) {
    (window as unknown as { downloadLatencyCsv: typeof downloadLatencyCsv }).downloadLatencyCsv =
      downloadLatencyCsv;
    // eslint-disable-next-line no-console
    console.log('[LAT] frontend latency logging ENABLED — run window.downloadLatencyCsv() to save CSV');
  } else {
    // eslint-disable-next-line no-console
    console.log('[LAT] frontend latency logging disabled (set REACT_APP_LATENCY_LOG=true and rebuild to enable)');
  }
}
