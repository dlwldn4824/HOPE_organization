import crypto from 'node:crypto';

const now = () => new Date().toISOString();

const users = new Map();
const sessions = new Map();

const defaultUser = {
  uid: 'user-001',
  username: 'demo',
  email: 'demo@hope.local',
  password: 'hope1234',
  nickname: '지우',
  level: 1,
  exp: 0,
  maxExp: 100,
  star: 0,
  gender: 'female',
  createdAt: now(),
};

users.set(defaultUser.uid, defaultUser);

const state = {
  learningResults: [],
  claimedMissionIdsByUserId: new Map(),
  settingsByUserId: new Map(),
  readNotificationIdsByUserId: new Map(),
  walletByUserId: new Map(),
  eventClaimsByUserId: new Map(),
  claimedAttendanceDaysByUserId: new Map(),
  chargeLogByUserId: new Map(),
};

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

function createToken(uid) {
  const token = crypto.randomBytes(24).toString('hex');
  sessions.set(token, { uid, createdAt: now() });
  return token;
}

export function getDefaultUser() {
  return users.get(defaultUser.uid);
}

export function signup(payload) {
  const email = String(payload.email ?? '').trim().toLowerCase();
  const username = String(payload.username ?? '').trim();
  const password = String(payload.password ?? '');
  const nickname = String(payload.childNickname ?? payload.nickname ?? '').trim();
  const gender = payload.childGender || payload.gender || undefined;

  if (!email || !username || !password || !nickname) {
    return { ok: false, status: 400, message: 'username, email, password, childNickname are required' };
  }

  const exists = [...users.values()].some((user) => user.email === email || user.username === username);
  if (exists) return { ok: false, status: 409, message: 'User already exists' };

  const uid = `user-${crypto.randomUUID()}`;
  const user = {
    uid,
    username,
    email,
    password,
    nickname,
    level: 1,
    exp: 0,
    maxExp: 100,
    star: 0,
    gender,
    createdAt: now(),
  };

  users.set(uid, user);
  return { ok: true, token: createToken(uid), user: publicUser(user) };
}

export function login(payload) {
  const identifier = String(payload.identifier ?? '').trim().toLowerCase();
  const password = String(payload.password ?? '');
  const user = [...users.values()].find(
    (candidate) =>
      (candidate.email === identifier || candidate.username.toLowerCase() === identifier) &&
      candidate.password === password,
  );

  if (!user) return { ok: false, status: 401, message: 'Invalid identifier or password' };
  return { ok: true, token: createToken(user.uid), user: publicUser(user) };
}

export function getUserByToken(token) {
  const session = sessions.get(token);
  if (!session) return null;
  return users.get(session.uid) ?? null;
}

export function updateProfile(user, payload) {
  const nickname = payload.nickname === undefined ? user.nickname : String(payload.nickname).trim();
  const gender = payload.gender === undefined ? user.gender : payload.gender;

  if (!nickname) return { ok: false, status: 400, message: 'nickname cannot be empty' };

  Object.assign(user, { nickname, gender, updatedAt: now() });
  return { ok: true, user: publicUser(user) };
}

export function saveLearningResult(user, payload) {
  const accuracy = clampNumber(Number(payload.accuracy ?? 0), 0, 100);
  const earnedStars = clampNumber(Number(payload.earnedStars ?? starsForAccuracy(accuracy)), 1, 5);
  const result = {
    id: crypto.randomUUID(),
    userId: user.uid,
    gameId: String(payload.gameId ?? 'speech'),
    targetWord: String(payload.targetWord ?? ''),
    accuracy,
    earnedStars,
    durationSeconds: Math.max(0, Number(payload.durationSeconds ?? 0)),
    analysis: payload.analysis ?? null,
    createdAt: now(),
  };

  state.learningResults.push(result);
  user.exp += earnedStars * 8;
  user.star += earnedStars * 10;

  while (user.exp >= user.maxExp) {
    user.exp -= user.maxExp;
    user.level += 1;
    user.maxExp += 50;
  }

  return result;
}

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
      learningGame('pitch', 1, '피치 맞추기', '공을 움직여 피치를 맞춰요.', '목소리 높낮이', bestRecord(results, 'pitch'), '/assets/pitch-game-preview.png'),
      learningGame('monster', 2, '몬스터 대결', '정확한 발음으로 몬스터를 물리쳐요.', '발음 정확도', bestRecord(results, 'monster'), '/assets/monster-game-preview.png'),
      learningGame('matching', 3, '발음 카드 짝맞추기', '카드를 뒤집어 발음을 연결해요.', '발음 인식', bestRecord(results, 'matching'), '/assets/matching-game-preview.png'),
    ],
  };
}

export function getGameSession(gameId) {
  if (gameId === 'pitch') {
    return {
      gameId: 'pitch',
      rounds: [
        { targetWord: '아', targetHz: 196, targetPhonemes: '["a"]', hint: '낮은 "아" 소리를 길게 내보세요' },
        { targetWord: '우', targetHz: 220, targetPhonemes: '["u"]', hint: '조금 더 높은 "우" 소리를 내보세요' },
        { targetWord: '이', targetHz: 262, targetPhonemes: '["i"]', hint: '밝은 "이" 소리를 내보세요' },
        { targetWord: '오', targetHz: 294, targetPhonemes: '["o"]', hint: '둥근 "오" 소리를 내보세요' },
        { targetWord: '에', targetHz: 330, targetPhonemes: '["e"]', hint: '가장 높은 "에" 소리를 내보세요' },
      ],
    };
  }

  if (gameId === 'monster') {
    return {
      gameId: 'monster',
      monsterMaxHp: 100,
      playerMaxHp: 100,
      rounds: [
        { targetWord: '사과', targetPhonemes: '["s","a","g","w","a"]' },
        { targetWord: '사자', targetPhonemes: '["s","a","j","a"]' },
        { targetWord: '나무', targetPhonemes: '["n","a","m","u"]' },
        { targetWord: '고양이', targetPhonemes: '["g","o","j","a","ng","i"]' },
      ],
    };
  }

  if (gameId === 'matching') {
    return {
      gameId: 'matching',
      pairs: [
        { id: 'cat', word: '고양이', emoji: '🐱', targetPhonemes: '["g","o","j","a","ng","i"]' },
        { id: 'banana', word: '바나나', emoji: '🍌', targetPhonemes: '["b","a","n","a","n","a"]' },
        { id: 'apple', word: '사과', emoji: '🍎', targetPhonemes: '["s","a","g","w","a"]' },
        { id: 'radio', word: '라디오', emoji: '📻', targetPhonemes: '["r","a","d","i","o"]' },
        { id: 'tree', word: '나무', emoji: '🌳', targetPhonemes: '["n","a","m","u"]' },
        { id: 'lion', word: '사자', emoji: '🦁', targetPhonemes: '["s","a","j","a"]' },
      ],
    };
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
      missionRate: results.length ? Math.min(100, Math.round((getClaimedMissions(user).size / 4) * 100)) : 0,
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
      completedMissions: `${getClaimedMissions(user).size}개`,
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

export function getRewards(user) {
  const results = getResults(user);
  const claimed = getClaimedMissions(user);
  const claimedCoins = [...claimed].reduce((sum, id) => sum + (missionRewardCoins[id] ?? 0), 0);
  const claimedGems = [...claimed].reduce((sum, id) => sum + (missionRewardGems[id] ?? 0), 0);
  const wallet = getWallet(user);
  const purchased = getPurchasedItems(user);

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

  const purchased = getPurchasedItems(user);
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

  const wallet = getWallet(user);
  if (item.currency === 'coin') wallet.spentCoins += item.price;
  else wallet.spentGems += item.price;

  purchased.add(itemId);

  if (item.id === '4') {
    wallet.bonusGems += 10;
  }

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

function getWallet(user) {
  if (!state.walletByUserId.has(user.uid)) {
    state.walletByUserId.set(user.uid, { spentCoins: 0, spentGems: 0, bonusCoins: 0, bonusGems: 0 });
  }
  const wallet = state.walletByUserId.get(user.uid);
  if (wallet.bonusCoins === undefined) wallet.bonusCoins = 0;
  return wallet;
}

function getPurchasedItems(user) {
  const wallet = getWallet(user);
  if (!wallet.purchasedItemIds) {
    wallet.purchasedItemIds = new Set();
  }
  return wallet.purchasedItemIds;
}

export function claimMission(user, missionId) {
  const mission = getRewards(user).missions.find((item) => item.id === missionId);
  if (!mission) return { ok: false, status: 404, message: 'Mission not found' };
  if (!mission.claimable) return { ok: false, status: 400, message: 'Mission is not claimable' };

  getClaimedMissions(user).add(missionId);
  return { ok: true, balance: getRewards(user).balance, mission: { ...mission, claimable: false, actionLabel: '완료' } };
}

function getEventClaims(user) {
  if (!state.eventClaimsByUserId.has(user.uid)) {
    state.eventClaimsByUserId.set(user.uid, new Set());
  }
  return state.eventClaimsByUserId.get(user.uid);
}

function getClaimedAttendanceDays(user) {
  if (!state.claimedAttendanceDaysByUserId.has(user.uid)) {
    state.claimedAttendanceDaysByUserId.set(user.uid, new Set());
  }
  return state.claimedAttendanceDaysByUserId.get(user.uid);
}

function getChargeLog(user) {
  const today = new Date().toISOString().slice(0, 10);
  if (!state.chargeLogByUserId.has(user.uid)) {
    state.chargeLogByUserId.set(user.uid, { date: today, count: 0 });
  }
  const log = state.chargeLogByUserId.get(user.uid);
  if (log.date !== today) {
    log.date = today;
    log.count = 0;
  }
  return log;
}

export function getEvents(user) {
  const claims = getEventClaims(user);
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

  const claims = getEventClaims(user);
  if (claims.has(eventId)) return { ok: false, status: 400, message: '이미 보상을 받았어요.' };

  const wallet = getWallet(user);
  const purchased = getPurchasedItems(user);

  for (const reward of event.rewards) {
    if (reward.type === 'coin') wallet.bonusCoins += reward.amount;
    if (reward.type === 'gem') wallet.bonusGems += reward.amount;
    if (reward.type === 'shop_item' && reward.shopItemId) purchased.add(reward.shopItemId);
  }

  claims.add(eventId);

  return {
    ok: true,
    message: `${event.title} 보상을 받았어요!`,
    balance: getRewards(user).balance,
    event: { ...event, claimed: true, claimable: false },
  };
}

export function getChargePackages() {
  return CHARGE_PACKAGES;
}

export function chargeWallet(user, payload) {
  const currency = payload.currency === 'gem' ? 'gem' : 'coin';
  const packageId = String(payload.packageId ?? '');
  const packages = CHARGE_PACKAGES[currency];
  const pack = packages.find((item) => item.id === packageId);

  if (!pack) return { ok: false, status: 404, message: '충전 패키지를 찾을 수 없습니다.' };

  const log = getChargeLog(user);
  if (log.count >= 3) {
    return { ok: false, status: 400, message: '오늘은 더 이상 충전할 수 없어요. (하루 3회)' };
  }

  const wallet = getWallet(user);
  if (currency === 'coin') wallet.bonusCoins += pack.amount;
  else wallet.bonusGems += pack.amount;

  log.count += 1;

  return {
    ok: true,
    message: `${pack.amount}${currency === 'coin' ? ' 코인' : ' 보석'}이 충전되었어요!`,
    balance: getRewards(user).balance,
    charged: { currency, amount: pack.amount },
  };
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

  const wallet = getWallet(user);
  if (target.rewardType === 'coin') wallet.bonusCoins += target.rewardAmount;
  else wallet.bonusGems += target.rewardAmount;

  getClaimedAttendanceDays(user).add(dayNum);

  return {
    ok: true,
    message: `${target.reward}을(를) 받았어요!`,
    balance: getRewards(user).balance,
    attendance: buildAttendance(results, user),
  };
}

export function getSettings(user) {
  if (!state.settingsByUserId.has(user.uid)) {
    state.settingsByUserId.set(user.uid, defaultSettings());
  }
  return state.settingsByUserId.get(user.uid);
}

export function updateSettings(user, payload) {
  const settings = getSettings(user);

  for (const section of ['notifications', 'learning', 'parent', 'privacy']) {
    if (payload[section] && typeof payload[section] === 'object') {
      settings[section] = { ...settings[section], ...payload[section] };
    }
  }

  return settings;
}

export function getNotifications(user) {
  const settings = getSettings(user);
  const prefs = settings.notifications;
  const readSet = getReadNotificationIds(user);
  const items = buildNotificationItems(user).filter((item) => {
    if (item.type === 'study' && !prefs.studyNotification) return false;
    if (item.type === 'reward' && !prefs.rewardNotification) return false;
    if (item.type === 'attendance' && !prefs.attendanceNotification) return false;
    if (item.type === 'report' && !prefs.parentReportNotification) return false;
    return true;
  });

  const withReadState = items.map((item) => ({
    ...item,
    read: readSet.has(item.id),
  }));

  return {
    items: withReadState,
    unreadCount: withReadState.filter((item) => !item.read).length,
  };
}

export function markNotificationRead(user, notificationId) {
  getReadNotificationIds(user).add(notificationId);
  return getNotifications(user);
}

export function markAllNotificationsRead(user) {
  const readSet = getReadNotificationIds(user);
  buildNotificationItems(user).forEach((item) => readSet.add(item.id));
  return getNotifications(user);
}

function getReadNotificationIds(user) {
  if (!state.readNotificationIdsByUserId.has(user.uid)) {
    state.readNotificationIdsByUserId.set(user.uid, new Set());
  }
  return state.readNotificationIdsByUserId.get(user.uid);
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

const missionRewardCoins = {
  'daily-study': 50,
  'accuracy-80': 100,
  'play-games': 80,
};

const missionRewardGems = {
  'streak-7': 3,
};

function getResults(user) {
  return state.learningResults.filter((result) => result.userId === user.uid);
}

function getClaimedMissions(user) {
  if (!state.claimedMissionIdsByUserId.has(user.uid)) {
    state.claimedMissionIdsByUserId.set(user.uid, new Set());
  }
  return state.claimedMissionIdsByUserId.get(user.uid);
}

function getClaimableMissions(user) {
  return buildMissionStates(getResults(user), getClaimedMissions(user)).filter((mission) => mission.claimable);
}

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

function learningGame(id, number, name, description, practiceElement, record, imageSrc) {
  return {
    id,
    number,
    name,
    description,
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

  return [
    {
      sound: latest.targetWord || '최근 단어',
      accuracy: latest.accuracy,
      message: latest.accuracy >= 80 ? '잘하고 있어요' : '조금 더 연습해요',
      color: latest.accuracy >= 80 ? 'green' : 'orange',
    },
  ];
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
  if (results.length >= 1) badges.push({ name: '첫 분석 완료', date: todayLabel(), title: '첫 분석 완료', acquiredAt: todayLabel() });
  if (results.length >= 3) badges.push({ name: '세 번 연습', date: todayLabel(), title: '세 번 연습', acquiredAt: todayLabel() });
  if (results.some((result) => result.accuracy >= 90)) badges.push({ name: '정확도 90+', date: todayLabel(), title: '정확도 90+', acquiredAt: todayLabel() });
  return badges;
}

function getAttendanceReward(day) {
  if (day === 7) return { reward: '200 코인', rewardType: 'coin', rewardAmount: 200 };
  if (day % 3 === 0) return { reward: '보석 1', rewardType: 'gem', rewardAmount: 1 };
  return { reward: '50 코인', rewardType: 'coin', rewardAmount: 50 };
}

function buildAttendance(results, user) {
  const completedDays = Math.min(uniqueStudyDays(results), 7);
  const claimed = getClaimedAttendanceDays(user);
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
