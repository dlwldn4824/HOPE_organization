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
    notifications: getClaimableMissions(user).length,
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

  return {
    userInfo: userInfo(user),
    balance: {
      coins: user.star + claimedCoins,
      gems: claimedGems,
    },
    shopItems: [
      { id: '1', name: '버니 헤어밴드', price: 500, currency: 'coin', isNew: true, category: 'recommended', imageSrc: '/assets/보상상점/shop-bunny-hairband.png' },
      { id: '2', name: '노랑 후드티', price: 800, currency: 'coin', isNew: true, category: 'recommended', imageSrc: '/assets/보상상점/shop-hoodie-yellow.png' },
      { id: '3', name: '리온 백팩', price: 1000, currency: 'coin', category: 'item', imageSrc: '/assets/보상상점/shop-leon-backpack.png' },
      { id: '4', name: '보석 10개', price: 10, currency: 'gem', category: 'item', imageSrc: '/assets/보상상점/shop-gems-10.png' },
      { id: '5', name: '피요 헤드셋', price: 700, currency: 'coin', category: 'decoration', imageSrc: '/assets/보상상점/shop-piyo-headphone.png' },
    ],
    attendance: buildAttendance(results),
    missions: buildMissionStates(results, claimed),
  };
}

export function claimMission(user, missionId) {
  const mission = getRewards(user).missions.find((item) => item.id === missionId);
  if (!mission) return { ok: false, status: 404, message: 'Mission not found' };
  if (!mission.claimable) return { ok: false, status: 400, message: 'Mission is not claimable' };

  getClaimedMissions(user).add(missionId);
  return { ok: true, balance: getRewards(user).balance, mission: { ...mission, claimable: false, actionLabel: '완료' } };
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

function buildAttendance(results) {
  const completedDays = Math.min(uniqueStudyDays(results), 7);
  return Array.from({ length: 7 }, (_, index) => {
    const day = index + 1;
    return {
      day,
      label: `${day}일차`,
      reward: day === 7 ? '200 코인' : day % 3 === 0 ? '보석 1' : '50 코인',
      isActive: day === completedDays + 1,
      isCompleted: day <= completedDays,
    };
  });
}

function defaultSettings() {
  return {
    notifications: {
      studyNotification: true,
      attendanceNotification: true,
      rewardNotification: false,
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
