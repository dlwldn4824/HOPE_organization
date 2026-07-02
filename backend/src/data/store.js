import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { db } from '../db/index.js';

const TOKEN_TTL_HOURS = Number(process.env.HOPE_TOKEN_TTL_HOURS || 24);

const now = () => new Date().toISOString();
const tokenExpiry = () => new Date(Date.now() + TOKEN_TTL_HOURS * 3600 * 1000).toISOString();

// --- statements (prepared once) ---
const stmts = {
  userByUid: db.prepare('SELECT * FROM users WHERE uid = ?'),
  userByEmail: db.prepare('SELECT * FROM users WHERE email = ?'),
  userByUsername: db.prepare('SELECT * FROM users WHERE LOWER(username) = LOWER(?)'),
  userByIdentifier: db.prepare(
    'SELECT * FROM users WHERE email = ? OR LOWER(username) = LOWER(?)',
  ),
  insertUser: db.prepare(`
    INSERT INTO users (uid, username, email, password_hash, nickname, gender)
    VALUES (?, ?, ?, ?, ?, ?)
  `),
  updateUserStats: db.prepare(`
    UPDATE users SET level = ?, exp = ?, max_exp = ?, star = ?, updated_at = ? WHERE uid = ?
  `),
  updateUserProfile: db.prepare(`
    UPDATE users SET nickname = ?, gender = ?, updated_at = ? WHERE uid = ?
  `),

  insertSession: db.prepare(
    'INSERT INTO sessions (token, uid, expires_at) VALUES (?, ?, ?)',
  ),
  sessionByToken: db.prepare('SELECT * FROM sessions WHERE token = ?'),
  deleteExpiredSessions: db.prepare("DELETE FROM sessions WHERE expires_at < datetime('now')"),

  insertResult: db.prepare(`
    INSERT INTO learning_results
      (id, uid, game_id, target_word, accuracy, earned_stars, duration_seconds, analysis_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
  resultsByUser: db.prepare(
    'SELECT * FROM learning_results WHERE uid = ? ORDER BY created_at ASC',
  ),

  walletByUser: db.prepare('SELECT * FROM wallets WHERE uid = ?'),
  insertWallet: db.prepare('INSERT INTO wallets (uid) VALUES (?)'),
  addWalletDelta: db.prepare(`
    UPDATE wallets
    SET spent_coins = spent_coins + ?,
        spent_gems  = spent_gems  + ?,
        bonus_coins = bonus_coins + ?,
        bonus_gems  = bonus_gems  + ?
    WHERE uid = ?
  `),

  settingsByUser: db.prepare('SELECT payload_json FROM settings WHERE uid = ?'),
  upsertSettings: db.prepare(`
    INSERT INTO settings (uid, payload_json) VALUES (?, ?)
    ON CONFLICT(uid) DO UPDATE SET payload_json = excluded.payload_json
  `),

  purchasedByUser: db.prepare('SELECT item_id FROM shop_purchases WHERE uid = ?'),
  insertPurchase: db.prepare(
    'INSERT OR IGNORE INTO shop_purchases (uid, item_id) VALUES (?, ?)',
  ),

  claimedMissionsByUser: db.prepare('SELECT mission_id FROM claimed_missions WHERE uid = ?'),
  insertClaimedMission: db.prepare(
    'INSERT OR IGNORE INTO claimed_missions (uid, mission_id) VALUES (?, ?)',
  ),

  readNotifsByUser: db.prepare('SELECT notification_id FROM read_notifications WHERE uid = ?'),
  insertReadNotif: db.prepare(
    'INSERT OR IGNORE INTO read_notifications (uid, notification_id) VALUES (?, ?)',
  ),

  eventClaimsByUser: db.prepare('SELECT event_id FROM event_claims WHERE uid = ?'),
  insertEventClaim: db.prepare(
    'INSERT OR IGNORE INTO event_claims (uid, event_id) VALUES (?, ?)',
  ),

  attendanceByUser: db.prepare('SELECT day FROM attendance_claims WHERE uid = ?'),
  insertAttendance: db.prepare(
    'INSERT OR IGNORE INTO attendance_claims (uid, day) VALUES (?, ?)',
  ),

  chargeLog: db.prepare('SELECT count FROM charge_log WHERE uid = ? AND log_date = ?'),
  upsertChargeLog: db.prepare(`
    INSERT INTO charge_log (uid, log_date, count) VALUES (?, ?, ?)
    ON CONFLICT(uid, log_date) DO UPDATE SET count = excluded.count
  `),
};

// Cleanup expired sessions on boot.
stmts.deleteExpiredSessions.run();

// --- catalogs (in-memory config) ---
const EVENT_CATALOG = [
  {
    id: 'spring-2026',
    title: '봄맞이 한정 아이템',
    description: '이벤트에 참여하고 한정판 아이템과 코인을 받아보세요!',
    status: 'active',
    startsAt: '2026-03-01T00:00:00.000Z',
    endsAt: '2026-06-30T23:59:59.000Z',
    ctaLabel: '보상 받기',
    rewards: [
      { id: 'spring-coins', label: '200 코인', type: 'coin', amount: 200 },
      { id: 'spring-hoodie', label: '후드티(옐로우)', type: 'shop_item', shopItemId: '2' },
    ],
  },
  {
    id: 'welcome-bonus',
    title: '신규 가입 환영 이벤트',
    description: 'HOPE에 오신 것을 환영해요! 환영 코인을 받아가세요.',
    status: 'active',
    startsAt: '2026-01-01T00:00:00.000Z',
    endsAt: '2026-12-31T23:59:59.000Z',
    ctaLabel: '환영 보상 받기',
    rewards: [{ id: 'welcome-coins', label: '100 코인', type: 'coin', amount: 100 }],
  },
];

const CHARGE_PACKAGES = {
  coin: [
    { id: 'coin-100', amount: 100, priceLabel: '무료 (데모)' },
    { id: 'coin-500', amount: 500, priceLabel: '무료 (데모)' },
    { id: 'coin-1000', amount: 1000, priceLabel: '무료 (데모)' },
  ],
  gem: [
    { id: 'gem-5', amount: 5, priceLabel: '무료 (데모)' },
    { id: 'gem-10', amount: 10, priceLabel: '무료 (데모)' },
    { id: 'gem-30', amount: 30, priceLabel: '무료 (데모)' },
  ],
};

const missionRewardCoins = { 'daily-study': 50, 'accuracy-80': 100, 'play-games': 80 };
const missionRewardGems = { 'streak-7': 3 };

// --- row → user mapping ---
function rowToUser(row) {
  if (!row) return null;
  return {
    uid: row.uid,
    username: row.username,
    email: row.email,
    nickname: row.nickname,
    level: row.level,
    exp: row.exp,
    maxExp: row.max_exp,
    star: row.star,
    gender: row.gender,
    createdAt: row.created_at,
  };
}

function publicUser(user) {
  return {
    uid: user.uid,
    nickname: user.nickname,
    level: user.level,
    exp: user.exp,
    maxExp: user.maxExp,
    star: user.star,
    gender: user.gender,
  };
}

function userInfo(user) {
  return {
    ...publicUser(user),
    notifications: getNotifications(user).unreadCount,
  };
}

// --- auth ---
function createToken(uid) {
  const token = crypto.randomBytes(24).toString('hex');
  stmts.insertSession.run(token, uid, tokenExpiry());
  return token;
}

export function signup(payload) {
  const email = String(payload.email ?? '').trim().toLowerCase();
  const username = String(payload.username ?? '').trim();
  const password = String(payload.password ?? '');
  const nickname = String(payload.childNickname ?? payload.nickname ?? '').trim();
  const gender = payload.childGender || payload.gender || null;

  if (!email || !username || !password || !nickname) {
    return { ok: false, status: 400, message: 'username, email, password, childNickname are required' };
  }

  const exists =
    stmts.userByEmail.get(email) || stmts.userByUsername.get(username);
  if (exists) return { ok: false, status: 409, message: 'User already exists' };

  const uid = `user-${crypto.randomUUID()}`;
  const passwordHash = bcrypt.hashSync(password, 10);
  stmts.insertUser.run(uid, username, email, passwordHash, nickname, gender);

  const user = rowToUser(stmts.userByUid.get(uid));
  return { ok: true, token: createToken(uid), user: publicUser(user) };
}

export function login(payload) {
  const identifier = String(payload.identifier ?? '').trim().toLowerCase();
  const password = String(payload.password ?? '');
  const row = stmts.userByIdentifier.get(identifier, identifier);
  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    return { ok: false, status: 401, message: 'Invalid identifier or password' };
  }
  const user = rowToUser(row);
  return { ok: true, token: createToken(user.uid), user: publicUser(user) };
}

export function getUserByToken(token) {
  if (!token) return null;
  const session = stmts.sessionByToken.get(token);
  if (!session) return null;
  if (new Date(session.expires_at).getTime() < Date.now()) return null;
  return rowToUser(stmts.userByUid.get(session.uid));
}

export function updateProfile(user, payload) {
  const nickname = payload.nickname === undefined ? user.nickname : String(payload.nickname).trim();
  const gender = payload.gender === undefined ? user.gender : payload.gender;
  if (!nickname) return { ok: false, status: 400, message: 'nickname cannot be empty' };

  stmts.updateUserProfile.run(nickname, gender, now(), user.uid);
  const updated = rowToUser(stmts.userByUid.get(user.uid));
  return { ok: true, user: publicUser(updated) };
}

// --- learning results & level-up ---
export function saveLearningResult(user, payload) {
  const accuracy = clampNumber(Number(payload.accuracy ?? 0), 0, 100);
  const earnedStars = clampNumber(Number(payload.earnedStars ?? starsForAccuracy(accuracy)), 1, 5);
  const id = crypto.randomUUID();
  const result = {
    id,
    userId: user.uid,
    gameId: String(payload.gameId ?? 'speech'),
    targetWord: String(payload.targetWord ?? ''),
    accuracy,
    earnedStars,
    durationSeconds: Math.max(0, Number(payload.durationSeconds ?? 0)),
    analysis: payload.analysis ?? null,
    createdAt: now(),
  };

  stmts.insertResult.run(
    result.id,
    user.uid,
    result.gameId,
    result.targetWord,
    accuracy,
    earnedStars,
    result.durationSeconds,
    JSON.stringify(result.analysis),
    result.createdAt,
  );

  let { exp, level, maxExp, star } = user;
  exp += earnedStars * 8;
  star += earnedStars * 10;
  while (exp >= maxExp) {
    exp -= maxExp;
    level += 1;
    maxExp += 50;
  }
  stmts.updateUserStats.run(level, exp, maxExp, star, now(), user.uid);
  Object.assign(user, { exp, level, maxExp, star });

  return result;
}

function getResults(user) {
  return stmts.resultsByUser.all(user.uid).map((row) => ({
    id: row.id,
    userId: row.uid,
    gameId: row.game_id,
    targetWord: row.target_word,
    accuracy: row.accuracy,
    earnedStars: row.earned_stars,
    durationSeconds: row.duration_seconds,
    analysis: row.analysis_json ? safeJsonParse(row.analysis_json) : null,
    createdAt: row.created_at,
  }));
}

// --- aggregated views ---
export function getHomeData(user) {
  const results = getResults(user);
  const pccHistory = results.slice(-5).map((result, index) => ({
    date: formatShortDate(result.createdAt) || `최근 ${index + 1}`,
    pcc: result.accuracy,
  }));
  const pccValues = pccHistory.map((item) => item.pcc);
  const todayCount = countToday(results);

  return {
    user: publicUser(user),
    userInfo: userInfo(user),
    mission: {
      phoneme: '/s/',
      description: '오늘 첫 발음 연습을 시작해보세요.',
      completed: Math.min(todayCount, 5),
      total: 5,
    },
    pccHistory,
    pccValues,
    averagePcc: average(pccValues),
    recommendations: buildRecommendations(results),
    badges: buildBadges(results),
    gemCount: getRewards(user).balance.gems,
  };
}

export function getLearningData(user) {
  const results = getResults(user);
  const todayCount = countToday(results);
  const totalStars = results.reduce((sum, result) => sum + result.earnedStars, 0);

  return {
    userInfo: userInfo(user),
    status: {
      studyDays: uniqueStudyDays(results),
      completedGames: results.length,
      earnedStars: totalStars,
      dailyProgress: Math.min(100, todayCount * 20),
      daysUntilGoal: todayCount >= 5 ? 0 : 1,
    },
    games: [
      learningGame('pitch', 1, '발음 따라하기', 'AI 발음을 듣고 따라하며 유사도를 맞춰요.', '발음 유사도', bestRecord(results, 'pitch'), '/assets/pitch-game-preview.png'),
      learningGame('monster', 2, '몬스터 대결', '정확한 발음으로 몬스터를 물리쳐요.', '발음 정확도', bestRecord(results, 'monster'), '/assets/monster-game-preview.png'),
      learningGame('whack', 3, '발음 두더지 잡기', '나온 단어를 말하면 발음 정확도에 따라 점수를 받아요.', '음운 변별', bestRecord(results, 'whack'), '/assets/whack-game-preview.png'),
    ],
  };
}

const PITCH_POOL = [
  { targetWord: '사과', targetPhonemes: '["s","a","g","w","a"]', emoji: '🍎', hint: 'AI 발음을 듣고 똑같이 따라해 보세요' },
  { targetWord: '바나나', targetPhonemes: '["b","a","n","a","n","a"]', emoji: '🍌', hint: '음절 길이와 억양을 맞춰보세요' },
  { targetWord: '기린', targetPhonemes: '["g","i","r","i","n"]', emoji: '🦒' },
  { targetWord: '고양이', targetPhonemes: '["g","o","j","a","ng","i"]', emoji: '🐱' },
  { targetWord: '토끼', targetPhonemes: '["t","o","kk","i"]', emoji: '🐰' },
  { targetWord: '강아지', targetPhonemes: '["g","a","ng","a","j","i"]', emoji: '🐶' },
  { targetWord: '라디오', targetPhonemes: '["r","a","d","i","o"]', emoji: '📻' },
];

const MONSTER_POOL = [
  { targetWord: '사과', targetPhonemes: '["s","a","g","w","a"]' },
  { targetWord: '사자', targetPhonemes: '["s","a","j","a"]' },
  { targetWord: '나무', targetPhonemes: '["n","a","m","u"]' },
  { targetWord: '고양이', targetPhonemes: '["g","o","j","a","ng","i"]' },
  { targetWord: '바나나', targetPhonemes: '["b","a","n","a","n","a"]' },
  { targetWord: '라디오', targetPhonemes: '["r","a","d","i","o"]' },
  { targetWord: '강아지', targetPhonemes: '["g","a","ng","a","j","i"]' },
  { targetWord: '코끼리', targetPhonemes: '["k","o","kk","i","r","i"]' },
  { targetWord: '토끼', targetPhonemes: '["t","o","kk","i"]' },
  { targetWord: '거북이', targetPhonemes: '["g","ʌ","b","u","g","i"]' },
];

const WHACK_POOL = [
  {
    targetWord: '사과',
    targetPhonemes: '["s","a","g","w","a"]',
    emoji: '🍎',
    distractors: [],
    passThreshold: 65,
    whackSeconds: 60,
  },
  {
    targetWord: '바나나',
    targetPhonemes: '["b","a","n","a","n","a"]',
    emoji: '🍌',
    distractors: [],
    passThreshold: 65,
    whackSeconds: 60,
  },
  {
    targetWord: '기린',
    targetPhonemes: '["g","i","r","i","n"]',
    emoji: '🦒',
    distractors: [],
    passThreshold: 65,
    whackSeconds: 60,
  },
  {
    targetWord: '사자',
    targetPhonemes: '["s","a","j","a"]',
    emoji: '🦁',
    distractors: [],
    passThreshold: 65,
    whackSeconds: 60,
  },
  {
    targetWord: '나무',
    targetPhonemes: '["n","a","m","u"]',
    emoji: '🌳',
    distractors: [],
    passThreshold: 65,
    whackSeconds: 60,
  },
  {
    targetWord: '고양이',
    targetPhonemes: '["g","o","j","a","ng","i"]',
    emoji: '🐱',
    distractors: [],
    passThreshold: 65,
    whackSeconds: 60,
  },
  {
    targetWord: '토끼',
    targetPhonemes: '["t","o","kk","i"]',
    emoji: '🐰',
    distractors: [],
    passThreshold: 65,
    whackSeconds: 60,
  },
  {
    targetWord: '강아지',
    targetPhonemes: '["g","a","ng","a","j","i"]',
    emoji: '🐶',
    distractors: [],
    passThreshold: 65,
    whackSeconds: 60,
  },
  {
    targetWord: '코끼리',
    targetPhonemes: '["k","o","kk","i","r","i"]',
    emoji: '🐘',
    distractors: [],
    passThreshold: 65,
    whackSeconds: 60,
  },
  {
    targetWord: '라디오',
    targetPhonemes: '["r","a","d","i","o"]',
    emoji: '📻',
    distractors: [],
    passThreshold: 65,
    whackSeconds: 60,
  },
  {
    targetWord: '거북이',
    targetPhonemes: '["g","ʌ","b","u","g","i"]',
    emoji: '🐢',
    distractors: [],
    passThreshold: 65,
    whackSeconds: 60,
  },
  {
    targetWord: '자전거',
    targetPhonemes: '["j","a","j","ʌ","n","g","ʌ"]',
    emoji: '🚲',
    distractors: [],
    passThreshold: 65,
    whackSeconds: 60,
  },
];

const MATCHING_POOL = [
  { id: 'step1', word: '사과', emoji: '🍎', targetPhonemes: '["s","a","g","w","a"]' },
  { id: 'step2', word: '바나나', emoji: '🍌', targetPhonemes: '["b","a","n","a","n","a"]' },
  { id: 'step3', word: '자전거', emoji: '🚲', targetPhonemes: '["j","a","j","ʌ","n","g","ʌ"]' },
  { id: 'step4', word: '나는 사과를 좋아해요', emoji: '💬', targetPhonemes: '["n","a","n","ɯ","n","s","a","g","w","a","r","ɯ","l","j","o","a","h","a","e","j","o"]' },
  { id: 'step5', word: '오늘 날씨가 정말 좋아요', emoji: '🌤️', targetPhonemes: '["o","n","ɯ","l","n","a","l","ss","i","g","a","j","ʌ","ng","m","a","l","j","o","a","j","o"]' },
];

function shuffle(items) {
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function getGameSession(gameId) {
  if (gameId === 'pitch') {
    return { gameId: 'pitch', rounds: shuffle(PITCH_POOL).slice(0, 5) };
  }
  if (gameId === 'monster') {
    return {
      gameId: 'monster',
      monsterMaxHp: 100,
      playerMaxHp: 100,
      rounds: shuffle(MONSTER_POOL).slice(0, 4),
    };
  }
  if (gameId === 'matching') {
    return { gameId: 'matching', pairs: MATCHING_POOL };
  }
  if (gameId === 'whack') {
    return { gameId: 'whack', rounds: WHACK_POOL };
  }
  return null;
}

export function getRecordData(user) {
  const results = getResults(user);
  const accuracies = results.map((result) => result.accuracy);
  const totalSeconds = results.reduce((sum, result) => sum + result.durationSeconds, 0);
  const weeklySeconds = results.slice(-7).reduce((sum, result) => sum + result.durationSeconds, 0);
  const averageAccuracy = average(accuracies);

  return {
    userInfo: userInfo(user),
    nickname: user.nickname,
    summary: {
      totalStudyDays: uniqueStudyDays(results),
      streakDays: uniqueStudyDays(results.slice(-7)),
      totalStudyTime: formatDuration(totalSeconds),
      weeklyStudyTime: formatDuration(weeklySeconds),
      completedMissions: results.length,
      missionRate: results.length ? Math.min(100, Math.round((getClaimedMissionIds(user).size / 4) * 100)) : 0,
    },
    accuracyData: buildAccuracyData(results),
    soundStatuses: buildSoundStatuses(results),
    weeklySummary: {
      period: '이번 주',
      gameCount: results.length,
      attemptCount: results.length,
      correctCount: results.filter((result) => result.accuracy >= 80).length,
      missionCount: getClaimableMissions(user).length,
    },
    activities: buildActivities(results),
    improvementMessage: results.length
      ? `평균 발음 정확도 ${averageAccuracy}%를 기록했어요.`
      : '아직 학습 기록이 없습니다. 첫 녹음을 시작해보세요.',
    recentResults: results.slice(-10).reverse(),
  };
}

export function getMyPageData(user) {
  const results = getResults(user);
  const accuracies = results.map((result) => result.accuracy);

  return {
    userInfo: userInfo(user),
    profile: {
      nickname: user.nickname,
      level: user.level,
      exp: user.exp,
      maxExp: user.maxExp,
      gender: user.gender,
    },
    statistics: {
      totalStudyTime: formatDuration(results.reduce((sum, result) => sum + result.durationSeconds, 0)),
      practicedWords: `${results.length}개`,
      averageAccuracy: `${average(accuracies)}%`,
      completedMissions: `${getClaimedMissionIds(user).size}개`,
    },
    accountSettings: [
      { key: 'email', label: '이메일 변경' },
      { key: 'password', label: '비밀번호 변경' },
      { key: 'notifications', label: '알림 설정' },
      { key: 'language', label: '언어 설정' },
    ],
    etcSettings: [
      { key: 'guide', label: '이용 가이드' },
      { key: 'support', label: '고객센터' },
      { key: 'privacy', label: '개인정보 처리방침' },
      { key: 'logout', label: '로그아웃' },
    ],
  };
}

// --- wallet (SQL-backed) ---
function ensureWallet(uid) {
  let row = stmts.walletByUser.get(uid);
  if (!row) {
    stmts.insertWallet.run(uid);
    row = stmts.walletByUser.get(uid);
  }
  return row;
}

function readWallet(uid) {
  const row = ensureWallet(uid);
  return {
    spentCoins: row.spent_coins,
    spentGems: row.spent_gems,
    bonusCoins: row.bonus_coins,
    bonusGems: row.bonus_gems,
  };
}

function addWallet(uid, delta) {
  ensureWallet(uid);
  stmts.addWalletDelta.run(
    delta.spentCoins ?? 0,
    delta.spentGems ?? 0,
    delta.bonusCoins ?? 0,
    delta.bonusGems ?? 0,
    uid,
  );
}

function getPurchasedItemIds(uid) {
  return new Set(stmts.purchasedByUser.all(uid).map((row) => row.item_id));
}

export function getRewards(user) {
  const results = getResults(user);
  const claimed = getClaimedMissionIds(user);
  const claimedCoins = [...claimed].reduce((sum, id) => sum + (missionRewardCoins[id] ?? 0), 0);
  const claimedGems = [...claimed].reduce((sum, id) => sum + (missionRewardGems[id] ?? 0), 0);
  const wallet = readWallet(user.uid);
  const purchased = getPurchasedItemIds(user.uid);

  return {
    userInfo: userInfo(user),
    balance: {
      coins: user.star + claimedCoins - wallet.spentCoins + wallet.bonusCoins,
      gems: claimedGems - wallet.spentGems + wallet.bonusGems,
    },
    shopItems: getShopCatalog().map((item) => ({
      ...item,
      purchased: purchased.has(item.id),
    })),
    attendance: buildAttendance(results, user),
    missions: buildMissionStates(results, claimed),
  };
}

export function purchaseShopItem(user, itemId) {
  const item = getShopCatalog().find((shopItem) => shopItem.id === itemId);
  if (!item) return { ok: false, status: 404, message: '상품을 찾을 수 없습니다.' };

  const purchased = getPurchasedItemIds(user.uid);
  if (purchased.has(itemId)) {
    return { ok: false, status: 400, message: '이미 보유한 아이템이에요.' };
  }

  const balance = getRewards(user).balance;
  if (item.currency === 'coin' && balance.coins < item.price) {
    return { ok: false, status: 400, message: '코인이 부족해요.' };
  }
  if (item.currency === 'gem' && balance.gems < item.price) {
    return { ok: false, status: 400, message: '보석이 부족해요.' };
  }

  if (item.currency === 'coin') {
    addWallet(user.uid, { spentCoins: item.price });
  } else {
    addWallet(user.uid, { spentGems: item.price });
  }
  stmts.insertPurchase.run(user.uid, itemId);
  if (item.id === '4') addWallet(user.uid, { bonusGems: 10 });

  return {
    ok: true,
    message: `${item.name}을(를) 구매했어요!`,
    balance: getRewards(user).balance,
    item: { ...item, purchased: true },
  };
}

function getShopCatalog() {
  return [
    { id: '1', name: '버니 헤어밴드', price: 500, currency: 'coin', isNew: true, category: 'recommended', imageSrc: '/assets/보상상점/shop-bunny-hairband.png', imageFallbackSrc: '/assets/보상상점/shop-bunny-hairband.png' },
    { id: '2', name: '후드티(옐로우)', price: 800, currency: 'coin', isNew: true, category: 'recommended', imageSrc: '/assets/보상상점/shop-hoodie-yellow.png', imageFallbackSrc: '/assets/보상상점/shop-hoodie-yellow.png' },
    { id: '3', name: '리온 백팩', price: 1000, currency: 'coin', category: 'item', imageSrc: '/assets/보상상점/shop-leon-backpack.png', imageFallbackSrc: '/assets/보상상점/shop-leon-backpack.png' },
    { id: '4', name: '보석 10개', price: 10, currency: 'gem', category: 'item', imageSrc: '/assets/보상상점/shop-gems-10.png', imageFallbackSrc: '/assets/보상상점/shop-gems-10.png' },
    { id: '5', name: '피오 헤드폰', price: 700, currency: 'coin', category: 'decoration', imageSrc: '/assets/보상상점/shop-piyo-headphone.png', imageFallbackSrc: '/assets/보상상점/shop-piyo-headphone.png' },
    { id: '6', name: '컬러 팔레트', price: 600, currency: 'coin', category: 'decoration', imageSrc: '/assets/보상상점/shop-color-palette.png', imageFallbackSrc: '/assets/보상상점/shop-color-palette.png' },
    { id: '7', name: '네임 플레이트', price: 400, currency: 'coin', category: 'other', imageSrc: '/assets/보상상점/shop-name-plate.png', imageFallbackSrc: '/assets/보상상점/shop-name-plate.png' },
    { id: '8', name: '별 마이크', price: 900, currency: 'coin', category: 'avatar', imageSrc: '/assets/보상상점/shop-star-mic.png', imageFallbackSrc: '/assets/보상상점/shop-star-mic.png' },
    { id: '9', name: '말풍선(블루)', price: 300, currency: 'coin', category: 'decoration', imageSrc: '/assets/보상상점/shop-speech-bubble-blue.png', imageFallbackSrc: '/assets/보상상점/shop-speech-bubble-blue.png' },
    { id: '10', name: '랜덤 박스', price: 1200, currency: 'coin', category: 'item', imageSrc: '/assets/보상상점/shop-random-box.png', imageFallbackSrc: '/assets/보상상점/shop-random-box.png' },
  ];
}

// --- missions ---
function getClaimedMissionIds(user) {
  return new Set(stmts.claimedMissionsByUser.all(user.uid).map((row) => row.mission_id));
}

export function claimMission(user, missionId) {
  const mission = getRewards(user).missions.find((item) => item.id === missionId);
  if (!mission) return { ok: false, status: 404, message: 'Mission not found' };
  if (!mission.claimable) return { ok: false, status: 400, message: 'Mission is not claimable' };

  stmts.insertClaimedMission.run(user.uid, missionId);
  return { ok: true, balance: getRewards(user).balance, mission: { ...mission, claimable: false, actionLabel: '완료' } };
}

function getClaimableMissions(user) {
  return buildMissionStates(getResults(user), getClaimedMissionIds(user)).filter((m) => m.claimable);
}

// --- events ---
function getEventClaimIds(uid) {
  return new Set(stmts.eventClaimsByUser.all(uid).map((row) => row.event_id));
}

export function getEvents(user) {
  const claims = getEventClaimIds(user.uid);
  const events = EVENT_CATALOG.map((event) => ({
    ...event,
    claimed: claims.has(event.id),
    claimable: event.status === 'active' && !claims.has(event.id),
  }));

  return {
    userInfo: userInfo(user),
    events,
    activeEvent: events.find((event) => event.status === 'active' && !event.claimed) ?? events.find((e) => e.status === 'active') ?? null,
  };
}

export function claimEventReward(user, eventId) {
  const event = EVENT_CATALOG.find((item) => item.id === eventId);
  if (!event) return { ok: false, status: 404, message: '이벤트를 찾을 수 없습니다.' };
  if (event.status !== 'active') return { ok: false, status: 400, message: '진행 중인 이벤트가 아닙니다.' };

  const claims = getEventClaimIds(user.uid);
  if (claims.has(eventId)) return { ok: false, status: 400, message: '이미 보상을 받았어요.' };

  let bonusCoins = 0;
  let bonusGems = 0;
  for (const reward of event.rewards) {
    if (reward.type === 'coin') bonusCoins += reward.amount;
    if (reward.type === 'gem') bonusGems += reward.amount;
    if (reward.type === 'shop_item' && reward.shopItemId) stmts.insertPurchase.run(user.uid, reward.shopItemId);
  }
  if (bonusCoins || bonusGems) addWallet(user.uid, { bonusCoins, bonusGems });
  stmts.insertEventClaim.run(user.uid, eventId);

  return {
    ok: true,
    message: `${event.title} 보상을 받았어요!`,
    balance: getRewards(user).balance,
    event: { ...event, claimed: true, claimable: false },
  };
}

// --- charge ---
export function getChargePackages() {
  return CHARGE_PACKAGES;
}

export function chargeWallet(user, payload) {
  const currency = payload.currency === 'gem' ? 'gem' : 'coin';
  const packageId = String(payload.packageId ?? '');
  const packages = CHARGE_PACKAGES[currency];
  const pack = packages.find((item) => item.id === packageId);
  if (!pack) return { ok: false, status: 404, message: '충전 패키지를 찾을 수 없습니다.' };

  const today = new Date().toISOString().slice(0, 10);
  const row = stmts.chargeLog.get(user.uid, today);
  const currentCount = row?.count ?? 0;
  if (currentCount >= 3) {
    return { ok: false, status: 400, message: '오늘은 더 이상 충전할 수 없어요. (하루 3회)' };
  }

  if (currency === 'coin') addWallet(user.uid, { bonusCoins: pack.amount });
  else addWallet(user.uid, { bonusGems: pack.amount });
  stmts.upsertChargeLog.run(user.uid, today, currentCount + 1);

  return {
    ok: true,
    message: `${pack.amount}${currency === 'coin' ? ' 코인' : ' 보석'}이 충전되었어요!`,
    balance: getRewards(user).balance,
    charged: { currency, amount: pack.amount },
  };
}

// --- attendance ---
function getClaimedAttendanceDays(uid) {
  return new Set(stmts.attendanceByUser.all(uid).map((row) => row.day));
}

export function claimAttendanceReward(user, day) {
  const dayNum = Number(day);
  if (!Number.isInteger(dayNum) || dayNum < 1 || dayNum > 7) {
    return { ok: false, status: 400, message: '유효하지 않은 출석 일차입니다.' };
  }

  const results = getResults(user);
  const attendance = buildAttendance(results, user);
  const target = attendance.find((item) => item.day === dayNum);
  if (!target) return { ok: false, status: 404, message: '출석 보상을 찾을 수 없습니다.' };
  if (target.isClaimed) return { ok: false, status: 400, message: '이미 받은 보상이에요.' };
  if (!target.claimable) {
    return { ok: false, status: 400, message: '아직 보상을 받을 수 없어요. 오늘 학습 후 다시 시도해주세요.' };
  }

  if (target.rewardType === 'coin') addWallet(user.uid, { bonusCoins: target.rewardAmount });
  else addWallet(user.uid, { bonusGems: target.rewardAmount });
  stmts.insertAttendance.run(user.uid, dayNum);

  return {
    ok: true,
    message: `${target.reward}을(를) 받았어요!`,
    balance: getRewards(user).balance,
    attendance: buildAttendance(results, user),
  };
}

// --- settings ---
export function getSettings(user) {
  const row = stmts.settingsByUser.get(user.uid);
  if (row) return safeJsonParse(row.payload_json) ?? defaultSettings();
  const initial = defaultSettings();
  stmts.upsertSettings.run(user.uid, JSON.stringify(initial));
  return initial;
}

export function updateSettings(user, payload) {
  const settings = getSettings(user);
  for (const section of ['notifications', 'learning', 'parent', 'privacy']) {
    if (payload[section] && typeof payload[section] === 'object') {
      settings[section] = { ...settings[section], ...payload[section] };
    }
  }
  stmts.upsertSettings.run(user.uid, JSON.stringify(settings));
  return settings;
}

// --- notifications ---
function getReadNotificationIds(uid) {
  return new Set(stmts.readNotifsByUser.all(uid).map((row) => row.notification_id));
}

export function getNotifications(user) {
  const settings = getSettings(user);
  const prefs = settings.notifications;
  const readSet = getReadNotificationIds(user.uid);
  const items = buildNotificationItems(user).filter((item) => {
    if (item.type === 'study' && !prefs.studyNotification) return false;
    if (item.type === 'reward' && !prefs.rewardNotification) return false;
    if (item.type === 'attendance' && !prefs.attendanceNotification) return false;
    if (item.type === 'report' && !prefs.parentReportNotification) return false;
    return true;
  });

  const withReadState = items.map((item) => ({ ...item, read: readSet.has(item.id) }));
  return {
    items: withReadState,
    unreadCount: withReadState.filter((item) => !item.read).length,
  };
}

export function markNotificationRead(user, notificationId) {
  stmts.insertReadNotif.run(user.uid, notificationId);
  return getNotifications(user);
}

export function markAllNotificationsRead(user) {
  const items = buildNotificationItems(user);
  const insertMany = db.transaction((rows) => {
    for (const item of rows) stmts.insertReadNotif.run(user.uid, item.id);
  });
  insertMany(items);
  return getNotifications(user);
}

function buildNotificationItems(user) {
  const results = getResults(user);
  const items = [];
  const today = new Date().toISOString();

  getClaimableMissions(user).forEach((mission) => {
    items.push({
      id: `mission-${mission.id}`,
      type: 'reward',
      title: '보상 미션 완료!',
      message: `${mission.title} 보상(${mission.rewardLabel})을 받을 수 있어요.`,
      path: '/rewards',
      createdAt: today,
    });
  });

  if (countToday(results) === 0) {
    items.push({
      id: 'study-today',
      type: 'study',
      title: '오늘의 학습',
      message: '버니와 함께 발음 연습을 시작해보세요!',
      path: '/learning',
      createdAt: today,
    });
  }

  const attendance = buildAttendance(results, user);
  const claimableDay = attendance.find((day) => day.claimable);
  if (claimableDay) {
    items.push({
      id: `attendance-claim-${claimableDay.day}`,
      type: 'attendance',
      title: '출석 보상 수령 가능',
      message: `${claimableDay.label} 출석 보상(${claimableDay.reward})을 받을 수 있어요.`,
      path: '/rewards',
      createdAt: today,
    });
  }

  const activeDay = attendance.find((day) => day.isActive && !day.isCompleted);
  if (activeDay) {
    items.push({
      id: `attendance-day-${activeDay.day}`,
      type: 'attendance',
      title: '출석 보상 준비 완료',
      message: `${activeDay.label} 출석 보상(${activeDay.reward})을 확인해보세요.`,
      path: '/rewards',
      createdAt: today,
    });
  }

  const latest = results.at(-1);
  if (latest && latest.accuracy >= 80) {
    items.push({
      id: `record-${latest.id}`,
      type: 'study',
      title: '학습 기록 업데이트',
      message: `${latest.targetWord || '연습'}에서 ${latest.accuracy}%를 기록했어요!`,
      path: '/history',
      createdAt: latest.createdAt,
    });
  }

  const settings = getSettings(user);
  if (settings.parent.weeklyReportEnabled) {
    items.push({
      id: 'parent-weekly-report',
      type: 'report',
      title: '보호자 리포트',
      message: '이번 주 학습 리포트가 준비되었어요.',
      path: '/history',
      createdAt: today,
    });
  }

  return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// --- mission/attendance helpers (pure) ---
function buildMissionStates(results, claimed) {
  const todayCount = countToday(results);
  const highAccuracyCount = results.filter((result) => result.accuracy >= 80).length;
  return [
    mission('daily-study', '오늘 학습하기 1회 완료', todayCount, 1, '50 코인', claimed),
    mission('accuracy-80', '정확도 80% 이상 달성', highAccuracyCount, 1, '100 코인', claimed),
    mission('play-games', '게임 플레이 3회 완료', results.length, 3, '80 코인', claimed),
    mission('streak-7', '연속 출석 7일 달성', uniqueStudyDays(results), 7, '보석 3', claimed),
  ];
}

function mission(id, title, current, total, rewardLabel, claimed) {
  const completed = current >= total;
  const alreadyClaimed = claimed.has(id);
  return {
    id,
    title,
    current: Math.min(current, total),
    total,
    rewardLabel,
    action: completed && !alreadyClaimed ? 'claim' : 'navigate',
    actionLabel: alreadyClaimed ? '완료' : completed ? '받기' : '이동',
    claimable: completed && !alreadyClaimed,
  };
}

function buildAttendance(results, user) {
  const completedDays = Math.min(uniqueStudyDays(results), 7);
  const claimed = getClaimedAttendanceDays(user.uid);
  const studiedToday = countToday(results) > 0;
  const firstUnclaimed = Array.from({ length: completedDays }, (_, index) => index + 1).find(
    (day) => !claimed.has(day),
  );

  return Array.from({ length: 7 }, (_, index) => {
    const day = index + 1;
    const { reward, rewardType, rewardAmount } = getAttendanceReward(day);
    const isClaimed = claimed.has(day);
    const isCompleted = day <= completedDays;
    return {
      day,
      label: `${day}일차`,
      reward,
      rewardType,
      rewardAmount,
      isActive: day === completedDays + 1,
      isCompleted,
      isClaimed,
      claimable: isCompleted && !isClaimed && studiedToday && day === firstUnclaimed,
    };
  });
}

function getAttendanceReward(day) {
  if (day === 7) return { reward: '200 코인', rewardType: 'coin', rewardAmount: 200 };
  if (day % 3 === 0) return { reward: '보석 1', rewardType: 'gem', rewardAmount: 1 };
  return { reward: '50 코인', rewardType: 'coin', rewardAmount: 50 };
}

function learningGame(id, number, name, description, practiceElement, record, imageSrc) {
  return {
    id, number, name, description,
    imageLabel: `${name} 이미지`,
    imageSrc,
    imageFallbackSrc: imageSrc,
    practiceElement,
    bestRecord: record,
    path: `/learning/${id}`,
  };
}

function bestRecord(results, gameId) {
  const values = results.filter((result) => result.gameId === gameId).map((result) => result.accuracy);
  if (!values.length) return '기록 없음';
  return `${Math.max(...values)}%`;
}

function buildAccuracyData(results) {
  return results.slice(-5).map((result, index) => ({
    label: result.targetWord || `${index + 1}회차`,
    value: result.accuracy,
  }));
}

function buildSoundStatuses(results) {
  const latest = results.at(-1);
  if (!latest) return [];
  return [{
    sound: latest.targetWord || '최근 단어',
    accuracy: latest.accuracy,
    message: latest.accuracy >= 80 ? '잘하고 있어요' : '조금 더 연습해요',
    color: latest.accuracy >= 80 ? 'green' : 'orange',
  }];
}

function buildActivities(results) {
  return results.slice(-5).reverse().map((result) => ({
    id: result.id,
    title: `${result.targetWord || '단어'} 발음 연습을 완료했어요.`,
    accuracy: result.accuracy,
    time: formatActivityTime(result.createdAt),
  }));
}

function buildRecommendations(results) {
  const latest = results.at(-1);
  if (!latest) {
    return [
      { phoneme: '/ㅅ/', description: '첫 연습으로 짧은 단어를 천천히 말해보세요.' },
      { phoneme: '/ㄴ/', description: '혀끝 위치를 느끼며 또렷하게 발음해보세요.' },
    ];
  }
  if (latest.accuracy >= 80) {
    return [{ phoneme: latest.targetWord || '최근 단어', description: '좋아요. 같은 단어를 조금 더 자연스럽게 말해보세요.' }];
  }
  return [{ phoneme: latest.targetWord || '최근 단어', description: '방금 연습한 단어를 한 번 더 천천히 말해보세요.' }];
}

function buildBadges(results) {
  const badges = [];
  if (results.length >= 1) badges.push({ name: '첫 분석 완료', date: todayLabel(), title: '첫 분석 완료', acquiredAt: todayLabel(), icon: '/assets/badges/first-analysis-complete.png' });
  if (results.length >= 3) badges.push({ name: '세 번 연습', date: todayLabel(), title: '세 번 연습', acquiredAt: todayLabel(), icon: '/assets/badges/three-practice.png' });
  if (results.some((result) => result.accuracy >= 90)) badges.push({ name: '정확도 90+', date: todayLabel(), title: '정확도 90+', acquiredAt: todayLabel() });
  return badges;
}

function defaultSettings() {
  return {
    notifications: {
      studyNotification: true,
      attendanceNotification: true,
      rewardNotification: true,
      parentReportNotification: true,
    },
    learning: {
      dailyGoalMinutes: 15,
      difficulty: 'normal',
      autoPhonemeRecommendation: true,
    },
    parent: {
      parentEmail: 'parent@example.com',
      weeklyReportEnabled: true,
    },
    privacy: {
      voiceDataStorage: true,
    },
  };
}

function average(values) {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function starsForAccuracy(accuracy) {
  if (accuracy >= 90) return 5;
  if (accuracy >= 80) return 4;
  if (accuracy >= 65) return 3;
  if (accuracy >= 45) return 2;
  return 1;
}

function clampNumber(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.round(value)));
}

function uniqueStudyDays(results) {
  return new Set(results.map((result) => result.createdAt.slice(0, 10))).size;
}

function countToday(results) {
  const today = new Date().toISOString().slice(0, 10);
  return results.filter((result) => result.createdAt.startsWith(today)).length;
}

function formatShortDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function formatActivityTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '방금 전';
  return `오늘 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}시간 ${minutes}분`;
}

function todayLabel() {
  const date = new Date();
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}

function safeJsonParse(value) {
  if (typeof value !== 'string') return null;
  try { return JSON.parse(value); } catch { return null; }
}
