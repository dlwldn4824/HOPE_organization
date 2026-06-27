export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'HOPE Backend API',
    version: '0.1.0',
    description:
      'HOPE 발음 학습 앱이 사용하는 API입니다. 지금은 데이터를 서버 메모리에만 저장해서 서버를 재시작하면 사라지고, 로그인하면 받는 토큰으로 사용자를 구분합니다.',
  },
  servers: [
    {
      url: 'http://localhost:4000',
      description: '로컬 백엔드 서버',
    },
  ],
  tags: [
    { name: 'System', description: '서버 상태 및 API 문서' },
    { name: 'Auth', description: '회원가입, 로그인, 현재 사용자 정보' },
    { name: 'Home', description: '홈 대시보드 데이터' },
    { name: 'Learning', description: '학습 페이지 데이터 및 게임 결과 제출' },
    { name: 'Speech', description: '외부 발음 분석 API로의 WAV 업로드 프록시' },
    { name: 'Records', description: '학습 기록 및 진행 현황' },
    { name: 'Rewards', description: '리워드 상점, 출석, 미션 보상' },
    { name: 'MyPage', description: '프로필 및 마이페이지 데이터' },
    { name: 'Settings', description: '알림, 학습, 보호자, 개인정보 설정' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'session-token',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          ok: { type: 'boolean', example: false },
          error: { type: 'string', example: '인증이 필요합니다' },
        },
      },
      UserProfile: {
        type: 'object',
        properties: {
          uid: { type: 'string', example: 'user-001' },
          nickname: { type: 'string', example: '지우' },
          level: { type: 'integer', example: 12 },
          exp: { type: 'integer', example: 320 },
          maxExp: { type: 'integer', example: 500 },
          star: { type: 'integer', example: 1250 },
          gender: { type: 'string', enum: ['male', 'female'], example: 'female' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['identifier', 'password'],
        properties: {
          identifier: { type: 'string', example: 'demo' },
          password: { type: 'string', example: 'hope1234' },
          keepLoggedIn: { type: 'boolean', example: true },
        },
      },
      SignupRequest: {
        type: 'object',
        required: ['username', 'email', 'password', 'childNickname'],
        properties: {
          username: { type: 'string', example: 'parent01' },
          email: { type: 'string', format: 'email', example: 'parent@example.com' },
          password: { type: 'string', example: 'hope1234' },
          childNickname: { type: 'string', example: '하윤' },
          childBirthDate: { type: 'string', example: '2019-05-12' },
          childGender: { type: 'string', enum: ['male', 'female'], example: 'female' },
          agreeTerms: { type: 'boolean', example: true },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          ok: { type: 'boolean', example: true },
          token: { type: 'string', example: '741aa4708c8bdec7981cb3b9b421528caa2dec0f83c922ae' },
          user: { $ref: '#/components/schemas/UserProfile' },
        },
      },
      UserInfo: {
        allOf: [
          { $ref: '#/components/schemas/UserProfile' },
          {
            type: 'object',
            properties: {
              notifications: { type: 'integer', example: 3 },
            },
          },
        ],
      },
      HomeData: {
        type: 'object',
        properties: {
          user: { $ref: '#/components/schemas/UserProfile' },
          userInfo: { $ref: '#/components/schemas/UserInfo' },
          mission: {
            type: 'object',
            properties: {
              phoneme: { type: 'string', example: '/s/' },
              description: { type: 'string', example: '오늘은 /s/ 소리를 또렷하게 발음해 볼까요?' },
              completed: { type: 'integer', example: 3 },
              total: { type: 'integer', example: 5 },
            },
          },
          averagePcc: { type: 'integer', example: 72 },
          gemCount: { type: 'integer', example: 35 },
        },
      },
      LearningResultRequest: {
        type: 'object',
        required: ['gameId', 'accuracy'],
        properties: {
          gameId: { type: 'string', example: 'pitch' },
          accuracy: { type: 'number', example: 88 },
          earnedStars: { type: 'integer', example: 3 },
          durationSeconds: { type: 'integer', example: 120 },
        },
      },
      SpeechAnalyzeResponse: {
        description:
          'https://go-neung.activejang.com/v1/utterance/analyze 가 반환하는 응답입니다. 정확한 형식은 발음 분석 서비스가 결정합니다.',
        oneOf: [
          { type: 'object', additionalProperties: true },
          { type: 'string' },
        ],
      },
      Settings: {
        type: 'object',
        properties: {
          notifications: {
            type: 'object',
            properties: {
              studyNotification: { type: 'boolean', example: true },
              attendanceNotification: { type: 'boolean', example: true },
              rewardNotification: { type: 'boolean', example: false },
              parentReportNotification: { type: 'boolean', example: true },
            },
          },
          learning: {
            type: 'object',
            properties: {
              dailyGoalMinutes: { type: 'integer', example: 15 },
              difficulty: { type: 'string', enum: ['easy', 'normal', 'hard'], example: 'normal' },
              autoPhonemeRecommendation: { type: 'boolean', example: true },
            },
          },
          parent: {
            type: 'object',
            properties: {
              parentEmail: { type: 'string', example: 'parent@example.com' },
              weeklyReportEnabled: { type: 'boolean', example: true },
            },
          },
          privacy: {
            type: 'object',
            properties: {
              voiceDataStorage: { type: 'boolean', example: true },
            },
          },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['System'],
        summary: '서버 상태 확인',
        responses: {
          200: {
            description: '서버가 정상 동작 중입니다',
          },
        },
      },
    },
    '/openapi.json': {
      get: {
        tags: ['System'],
        summary: 'API 명세(OpenAPI 문서) 가져오기',
        responses: {
          200: {
            description: 'OpenAPI 문서(JSON)',
          },
        },
      },
    },
    '/': {
      get: {
        tags: ['System'],
        summary: 'Swagger 문서 페이지로 이동',
        responses: {
          302: { description: '/docs 로 이동합니다' },
        },
      },
    },
    '/api/auth/signup': {
      post: {
        tags: ['Auth'],
        summary: '회원가입',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SignupRequest' },
            },
          },
        },
        responses: {
          201: {
            description: '계정이 생성되었습니다',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } },
          },
          409: { description: '이미 가입된 사용자입니다' },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: '로그인하고 로그인 토큰 받기',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
            },
          },
        },
        responses: {
          200: {
            description: '로그인 성공',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } },
          },
          401: { description: '아이디 또는 비밀번호가 올바르지 않습니다' },
        },
      },
    },
    '/api/me': {
      get: {
        tags: ['Auth'],
        summary: '현재 로그인한 사용자 정보 조회',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: '현재 사용자 정보' },
          401: { description: '로그인이 필요합니다' },
        },
      },
      patch: {
        tags: ['Auth'],
        summary: '현재 로그인한 사용자 정보 수정',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  nickname: { type: 'string', example: '지우' },
                  gender: { type: 'string', enum: ['male', 'female'], example: 'female' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: '프로필이 수정되었습니다' },
          401: { description: '로그인이 필요합니다' },
        },
      },
    },
    '/api/home': {
      get: {
        tags: ['Home'],
        summary: '홈 화면 데이터 조회',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: '홈 화면 데이터', content: { 'application/json': { schema: { $ref: '#/components/schemas/HomeData' } } } },
          401: { description: '로그인이 필요합니다' },
        },
      },
    },
    '/api/learning': {
      get: {
        tags: ['Learning'],
        summary: '학습 페이지 데이터 조회',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: '학습 현황과 게임 목록' },
          401: { description: '로그인이 필요합니다' },
        },
      },
    },
    '/api/learning/results': {
      post: {
        tags: ['Learning'],
        summary: '학습(게임) 결과 저장',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LearningResultRequest' },
            },
          },
        },
        responses: {
          201: { description: '학습 결과가 저장되었습니다' },
          401: { description: '로그인이 필요합니다' },
        },
      },
    },
    '/api/speech/analyze': {
      post: {
        tags: ['Speech'],
        summary: '녹음한 발음을 분석 서비스로 분석',
        description:
          '외부 발음 분석 API와 동일한 형식(multipart/form-data)으로 데이터를 받아 https://go-neung.activejang.com/v1/utterance/analyze 로 그대로 전달합니다.',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['audio', 'target_word'],
                properties: {
                  audio: {
                    type: 'string',
                    format: 'binary',
                    description: '16kHz 모노 WAV 파일, 최대 5초',
                  },
                  target_word: {
                    type: 'string',
                    example: '사과',
                  },
                  target_phonemes: {
                    type: 'string',
                    description:
                      '발음 기호(IPA) 배열입니다. 비워두면 target_word를 분석 서비스가 자동으로 변환합니다.',
                    example: '["s","a","g","w","a"]',
                  },
                  user_id: {
                    type: 'string',
                    nullable: true,
                    example: 'user-001',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: '분석 서비스가 돌려준 결과',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SpeechAnalyzeResponse' },
              },
            },
          },
          415: { description: '요청 형식이 multipart/form-data여야 합니다' },
          422: { description: '분석 서비스에서 입력값 오류를 반환했습니다' },
        },
      },
    },
    '/api/records': {
      get: {
        tags: ['Records'],
        summary: '학습 기록 데이터 조회',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: '학습 기록' },
          401: { description: '로그인이 필요합니다' },
        },
      },
    },
    '/api/rewards': {
      get: {
        tags: ['Rewards'],
        summary: '보상, 상점, 출석, 미션 정보 조회',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: '보상 관련 데이터' },
          401: { description: '로그인이 필요합니다' },
        },
      },
    },
    '/api/rewards/missions/{missionId}/claim': {
      post: {
        tags: ['Rewards'],
        summary: '미션 보상 받기',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'missionId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            example: 'daily-study',
          },
        ],
        responses: {
          200: { description: '미션 보상을 받았습니다' },
          400: { description: '아직 받을 수 없는 미션입니다' },
          404: { description: '미션을 찾을 수 없습니다' },
          401: { description: '로그인이 필요합니다' },
        },
      },
    },
    '/api/mypage': {
      get: {
        tags: ['MyPage'],
        summary: '마이페이지 프로필과 통계 조회',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: '마이페이지 데이터' },
          401: { description: '로그인이 필요합니다' },
        },
      },
    },
    '/api/settings': {
      get: {
        tags: ['Settings'],
        summary: '설정 조회',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: '설정 값', content: { 'application/json': { schema: { $ref: '#/components/schemas/Settings' } } } },
          401: { description: '로그인이 필요합니다' },
        },
      },
      patch: {
        tags: ['Settings'],
        summary: '설정 변경',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Settings' },
            },
          },
        },
        responses: {
          200: { description: '설정이 변경되었습니다' },
          401: { description: '로그인이 필요합니다' },
        },
      },
    },
  },
};

export function swaggerHtml() {
  return `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>HOPE Backend Swagger</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
    <style>
      body { margin: 0; background: #f7f7f7; }
      .swagger-ui .topbar { display: none; }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: '/openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        persistAuthorization: true
      });
    </script>
  </body>
</html>`;
}
