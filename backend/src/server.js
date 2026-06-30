import http from 'node:http';
import { URL } from 'node:url';
import {
  chargeWallet,
  claimAttendanceReward,
  claimEventReward,
  claimMission,
  getChargePackages,
  getEvents,
  getGameSession,
  getHomeData,
  getLearningData,
  getMyPageData,
  getNotifications,
  getRecordData,
  getRewards,
  getSettings,
  getUserByToken,
  login,
  markAllNotificationsRead,
  markNotificationRead,
  purchaseShopItem,
  saveLearningResult,
  signup,
  updateProfile,
  updateSettings,
} from './data/store.js';
import { openApiDocument, swaggerHtml } from './openapi.js';
import { getBearerToken, HttpError, notFound, readJson, readRawBody, sendJson, sendRaw } from './utils/http.js';
import { logger, logRequest, newRequestId } from './utils/logger.js';
import {
  AttendanceClaimSchema,
  ChargeWalletSchema,
  LearningResultSchema,
  LoginSchema,
  SettingsSchema,
  SignupSchema,
  UpdateProfileSchema,
  validate,
} from './utils/validation.js';

const PORT = Number(process.env.PORT || 4000);
const SPEECH_COACH_API_BASE = process.env.SPEECH_COACH_API_BASE || 'https://go-neung.activejang.com';
const SPEECH_TIMEOUT_MS = Number(process.env.SPEECH_TIMEOUT_MS || 15_000);
const SPEECH_MAX_BODY_BYTES = Number(process.env.SPEECH_MAX_BODY_BYTES || 10 * 1024 * 1024);
const SPEECH_RETRIES = Number(process.env.SPEECH_RETRIES || 1);

function requireUser(req) {
  const token = getBearerToken(req);
  const user = token ? getUserByToken(token) : null;
  if (!user) throw new HttpError(401, 'Unauthorized');
  req.uid = user.uid;
  return user;
}

async function proxySpeechAnalyze(req, contentType) {
  const contentLength = Number(req.headers['content-length'] || 0);
  if (contentLength && contentLength > SPEECH_MAX_BODY_BYTES) {
    throw new HttpError(413, 'Audio payload too large');
  }
  const body = await readRawBody(req);
  if (body.length > SPEECH_MAX_BODY_BYTES) {
    throw new HttpError(413, 'Audio payload too large');
  }

  let lastError;
  for (let attempt = 0; attempt <= SPEECH_RETRIES; attempt += 1) {
    try {
      const upstream = await fetch(`${SPEECH_COACH_API_BASE}/v1/utterance/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': contentType,
          'Content-Length': String(body.length),
        },
        body,
        signal: AbortSignal.timeout(SPEECH_TIMEOUT_MS),
      });
      const responseBody = Buffer.from(await upstream.arrayBuffer());
      const responseType = upstream.headers.get('content-type') || 'application/json; charset=utf-8';
      return { status: upstream.status, body: responseBody, contentType: responseType };
    } catch (error) {
      lastError = error;
      const isLast = attempt === SPEECH_RETRIES;
      const isTimeout = error?.name === 'TimeoutError' || error?.name === 'AbortError';
      logger.warn(
        { attempt, error: error?.message, name: error?.name, isTimeout },
        'speech proxy attempt failed',
      );
      if (isLast) {
        if (isTimeout) throw new HttpError(504, 'Speech analysis timed out');
        throw new HttpError(502, 'Speech analysis service unavailable');
      }
    }
  }
  throw new HttpError(502, lastError?.message || 'Speech analysis failed');
}

async function checkSpeechUpstream() {
  try {
    const response = await fetch(`${SPEECH_COACH_API_BASE}/health`, {
      signal: AbortSignal.timeout(3_000),
    });
    if (!response.ok) return { ok: false, status: response.status };
    const body = await response.json().catch(() => null);
    return { ok: true, ...(body && typeof body === 'object' ? body : {}) };
  } catch (error) {
    return { ok: false, error: error?.name === 'TimeoutError' ? 'timeout' : 'unreachable' };
  }
}

async function handleApi(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const method = req.method || 'GET';
  const path = url.pathname;

  if (method === 'OPTIONS') {
    return sendJson(res, 200, { ok: true });
  }

  if (method === 'GET' && path === '/') {
    res.writeHead(302, { Location: '/docs' });
    return res.end();
  }

  if (method === 'GET' && path === '/health') {
    const upstream = await checkSpeechUpstream();
    return sendJson(res, 200, {
      ok: true,
      service: 'hope-backend',
      speechCoachApiBase: SPEECH_COACH_API_BASE,
      upstream,
    });
  }

  if (method === 'GET' && path === '/openapi.json') {
    return sendJson(res, 200, openApiDocument);
  }

  if (method === 'GET' && (path === '/docs' || path === '/docs/')) {
    const html = swaggerHtml();
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Length': Buffer.byteLength(html),
    });
    return res.end(html);
  }

  if (method === 'POST' && path === '/api/auth/signup') {
    const payload = validate(SignupSchema, await readJson(req));
    const result = signup(payload);
    if (!result.ok) throw new HttpError(result.status, result.message);
    return sendJson(res, 201, result);
  }

  if (method === 'POST' && path === '/api/auth/login') {
    const payload = validate(LoginSchema, await readJson(req));
    const result = login(payload);
    if (!result.ok) throw new HttpError(result.status, result.message);
    return sendJson(res, 200, result);
  }

  if (method === 'GET' && path === '/api/me') {
    const user = requireUser(req);
    return sendJson(res, 200, { user: getMyPageData(user).profile });
  }

  if (method === 'PATCH' && path === '/api/me') {
    const user = requireUser(req);
    const payload = validate(UpdateProfileSchema, await readJson(req));
    const result = updateProfile(user, payload);
    if (!result.ok) throw new HttpError(result.status, result.message);
    return sendJson(res, 200, result);
  }

  if (method === 'GET' && path === '/api/home') {
    return sendJson(res, 200, getHomeData(requireUser(req)));
  }

  if (method === 'GET' && path === '/api/notifications') {
    return sendJson(res, 200, getNotifications(requireUser(req)));
  }

  const notificationReadMatch = path.match(/^\/api\/notifications\/([^/]+)\/read$/);
  if (method === 'PATCH' && notificationReadMatch) {
    return sendJson(res, 200, markNotificationRead(requireUser(req), notificationReadMatch[1]));
  }

  if (method === 'POST' && path === '/api/notifications/read-all') {
    return sendJson(res, 200, markAllNotificationsRead(requireUser(req)));
  }

  if (method === 'GET' && path === '/api/learning') {
    return sendJson(res, 200, getLearningData(requireUser(req)));
  }

  const gameSessionMatch = path.match(/^\/api\/learning\/games\/([^/]+)\/session$/);
  if (method === 'GET' && gameSessionMatch) {
    const session = getGameSession(gameSessionMatch[1]);
    if (!session) throw new HttpError(404, 'Game session not found');
    return sendJson(res, 200, session);
  }

  if (method === 'POST' && path === '/api/learning/results') {
    const user = requireUser(req);
    const payload = validate(LearningResultSchema, await readJson(req));
    const result = saveLearningResult(user, payload);
    return sendJson(res, 201, { result });
  }

  if (method === 'POST' && path === '/api/speech/analyze') {
    const contentType = req.headers['content-type'];
    if (!contentType?.includes('multipart/form-data')) {
      throw new HttpError(415, 'Content-Type must be multipart/form-data');
    }
    const upstream = await proxySpeechAnalyze(req, contentType);
    return sendRaw(res, upstream.status, upstream.body, upstream.contentType);
  }

  if (method === 'GET' && path === '/api/records') {
    return sendJson(res, 200, getRecordData(requireUser(req)));
  }

  if (method === 'GET' && path === '/api/rewards') {
    return sendJson(res, 200, getRewards(requireUser(req)));
  }

  const missionClaimMatch = path.match(/^\/api\/rewards\/missions\/([^/]+)\/claim$/);
  if (method === 'POST' && missionClaimMatch) {
    const result = claimMission(requireUser(req), missionClaimMatch[1]);
    if (!result.ok) throw new HttpError(result.status, result.message);
    return sendJson(res, 200, result);
  }

  const shopPurchaseMatch = path.match(/^\/api\/rewards\/shop\/([^/]+)\/purchase$/);
  if (method === 'POST' && shopPurchaseMatch) {
    const result = purchaseShopItem(requireUser(req), shopPurchaseMatch[1]);
    if (!result.ok) throw new HttpError(result.status, result.message);
    return sendJson(res, 200, result);
  }

  if (method === 'POST' && path === '/api/rewards/wallet/charge') {
    const user = requireUser(req);
    const payload = validate(ChargeWalletSchema, await readJson(req));
    const result = chargeWallet(user, payload);
    if (!result.ok) throw new HttpError(result.status, result.message);
    return sendJson(res, 200, result);
  }

  if (method === 'GET' && path === '/api/rewards/wallet/packages') {
    return sendJson(res, 200, getChargePackages());
  }

  if (method === 'POST' && path === '/api/rewards/attendance/claim') {
    const user = requireUser(req);
    const { day } = validate(AttendanceClaimSchema, await readJson(req));
    const result = claimAttendanceReward(user, day);
    if (!result.ok) throw new HttpError(result.status, result.message);
    return sendJson(res, 200, result);
  }

  if (method === 'GET' && path === '/api/events') {
    return sendJson(res, 200, getEvents(requireUser(req)));
  }

  const eventClaimMatch = path.match(/^\/api\/events\/([^/]+)\/claim$/);
  if (method === 'POST' && eventClaimMatch) {
    const result = claimEventReward(requireUser(req), eventClaimMatch[1]);
    if (!result.ok) throw new HttpError(result.status, result.message);
    return sendJson(res, 200, result);
  }

  if (method === 'GET' && path === '/api/mypage') {
    return sendJson(res, 200, getMyPageData(requireUser(req)));
  }

  if (method === 'GET' && path === '/api/settings') {
    return sendJson(res, 200, getSettings(requireUser(req)));
  }

  if (method === 'PATCH' && path === '/api/settings') {
    const user = requireUser(req);
    const payload = validate(SettingsSchema, await readJson(req));
    return sendJson(res, 200, updateSettings(user, payload));
  }

  return notFound();
}

const server = http.createServer(async (req, res) => {
  const requestId = newRequestId();
  res.setHeader('x-request-id', requestId);
  const startedAt = Date.now();
  let caughtError;

  try {
    await handleApi(req, res);
  } catch (error) {
    caughtError = error;
    const status = error instanceof HttpError ? error.status : 500;
    const message = error instanceof Error ? error.message : 'Internal server error';
    if (!res.headersSent) {
      sendJson(res, status, { ok: false, error: message, details: error?.details, requestId });
    }
  } finally {
    const status = res.statusCode || 500;
    logRequest({
      requestId,
      method: req.method,
      path: req.url,
      status,
      durationMs: Date.now() - startedAt,
      uid: req.uid ?? null,
      error: caughtError && !(caughtError instanceof HttpError) ? caughtError : undefined,
    });
  }
});

server.listen(PORT, () => {
  logger.info({ port: PORT, speechCoachApiBase: SPEECH_COACH_API_BASE }, 'HOPE backend listening');
});
