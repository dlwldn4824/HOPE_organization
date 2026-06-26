import http from 'node:http';
import { URL } from 'node:url';
import {
  claimMission,
  getDefaultUser,
  getHomeData,
  getLearningData,
  getMyPageData,
  getRecordData,
  getRewards,
  getSettings,
  getUserByToken,
  login,
  saveLearningResult,
  signup,
  updateProfile,
  updateSettings,
} from './data/store.js';
import { openApiDocument, swaggerHtml } from './openapi.js';
import { getBearerToken, HttpError, notFound, readJson, readRawBody, sendJson, sendRaw } from './utils/http.js';

const PORT = Number(process.env.PORT || 4000);
const SPEECH_COACH_API_BASE = process.env.SPEECH_COACH_API_BASE || 'https://go-neung.activejang.com';

function requireUser(req) {
  const token = getBearerToken(req);
  const user = token ? getUserByToken(token) : null;
  return user ?? getDefaultUser();
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
    return sendJson(res, 200, {
      ok: true,
      service: 'hope-backend',
      speechCoachApiBase: SPEECH_COACH_API_BASE,
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
    const result = signup(await readJson(req));
    if (!result.ok) throw new HttpError(result.status, result.message);
    return sendJson(res, 201, result);
  }

  if (method === 'POST' && path === '/api/auth/login') {
    const result = login(await readJson(req));
    if (!result.ok) throw new HttpError(result.status, result.message);
    return sendJson(res, 200, result);
  }

  if (method === 'GET' && path === '/api/me') {
    const user = requireUser(req);
    return sendJson(res, 200, { user: getMyPageData(user).profile });
  }

  if (method === 'PATCH' && path === '/api/me') {
    const user = requireUser(req);
    const result = updateProfile(user, await readJson(req));
    if (!result.ok) throw new HttpError(result.status, result.message);
    return sendJson(res, 200, result);
  }

  if (method === 'GET' && path === '/api/home') {
    return sendJson(res, 200, getHomeData(requireUser(req)));
  }

  if (method === 'GET' && path === '/api/learning') {
    return sendJson(res, 200, getLearningData(requireUser(req)));
  }

  if (method === 'POST' && path === '/api/learning/results') {
    const result = saveLearningResult(requireUser(req), await readJson(req));
    return sendJson(res, 201, { result });
  }

  if (method === 'POST' && path === '/api/speech/analyze') {
    const contentType = req.headers['content-type'];
    if (!contentType?.includes('multipart/form-data')) {
      throw new HttpError(415, 'Content-Type must be multipart/form-data');
    }

    const body = await readRawBody(req);
    const upstream = await fetch(`${SPEECH_COACH_API_BASE}/v1/utterance/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(body.length),
      },
      body,
    });
    const responseBody = Buffer.from(await upstream.arrayBuffer());
    const responseType = upstream.headers.get('content-type') || 'application/json; charset=utf-8';

    return sendRaw(res, upstream.status, responseBody, responseType);
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

  if (method === 'GET' && path === '/api/mypage') {
    return sendJson(res, 200, getMyPageData(requireUser(req)));
  }

  if (method === 'GET' && path === '/api/settings') {
    return sendJson(res, 200, getSettings(requireUser(req)));
  }

  if (method === 'PATCH' && path === '/api/settings') {
    const settings = updateSettings(requireUser(req), await readJson(req));
    return sendJson(res, 200, settings);
  }

  return notFound();
}

const server = http.createServer(async (req, res) => {
  try {
    await handleApi(req, res);
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    const message = error instanceof Error ? error.message : 'Internal server error';
    sendJson(res, status, { ok: false, error: message, details: error.details });
  }
});

server.listen(PORT, () => {
  console.log(`HOPE backend listening on http://localhost:${PORT}`);
});
