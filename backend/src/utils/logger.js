import pino from 'pino';
import crypto from 'node:crypto';

const isProd = process.env.NODE_ENV === 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL || (isProd ? 'info' : 'debug'),
  transport: isProd
    ? undefined
    : { target: 'pino/file', options: { destination: 1 } },
  base: { service: 'hope-backend' },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export function newRequestId() {
  return crypto.randomUUID();
}

export function logRequest({ requestId, method, path, status, durationMs, uid, error }) {
  const payload = { requestId, method, path, status, durationMs, uid };
  if (error) logger.error({ ...payload, err: error }, 'request failed');
  else if (status >= 500) logger.error(payload, 'request 5xx');
  else if (status >= 400) logger.warn(payload, 'request 4xx');
  else logger.info(payload, 'request');
}
