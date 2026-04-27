import fs from 'fs';
import path from 'path';

const ENABLED = process.env.LATENCY_LOG === 'true' || process.env.LATENCY_LOG === '1';
const CSV_PATH = process.env.LATENCY_LOG_PATH || '/tmp/backend_latency.csv';

const HEADER =
  'session_id,shot_number,frame_captured_at,shot_detected_at,cv_published_at,broker_received_at,broker_emitted_at,backend_processing_ms\n';

let headerWritten = false;

function ensureHeader() {
  if (headerWritten) return;
  try {
    if (!fs.existsSync(CSV_PATH)) {
      fs.mkdirSync(path.dirname(CSV_PATH), { recursive: true });
      fs.writeFileSync(CSV_PATH, HEADER);
    }
    headerWritten = true;
  } catch (err) {
    console.warn('[LAT] Failed to initialize CSV:', err);
  }
}

export interface ShotLatencyRow {
  sessionId: string;
  shotNumber: number;
  frameCapturedAt: string;
  shotDetectedAt: string;
  cvPublishedAt: string;
  brokerReceivedAt: string;
  brokerEmittedAt: string;
}

export function isLatencyLoggingEnabled(): boolean {
  return ENABLED;
}

export function logLatencyStatus(): void {
  if (ENABLED) {
    console.log(`[LAT] backend latency logging ENABLED — writing to ${CSV_PATH}`);
  } else {
    console.log('[LAT] backend latency logging disabled (set LATENCY_LOG=true to enable)');
  }
}

export function logShotLatency(row: ShotLatencyRow): void {
  if (!ENABLED) return;
  ensureHeader();

  const processingMs =
    new Date(row.brokerEmittedAt).getTime() - new Date(row.brokerReceivedAt).getTime();

  const line = [
    row.sessionId,
    row.shotNumber,
    row.frameCapturedAt,
    row.shotDetectedAt,
    row.cvPublishedAt,
    row.brokerReceivedAt,
    row.brokerEmittedAt,
    processingMs,
  ].join(',') + '\n';

  try {
    fs.appendFileSync(CSV_PATH, line);
  } catch (err) {
    console.warn('[LAT] Failed to append CSV row:', err);
  }

  console.log(
    `[LAT] shot#${row.shotNumber} recv=${row.brokerReceivedAt} emit=${row.brokerEmittedAt} proc=${processingMs}ms`
  );
}
