export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'HOPE Backend API',
    version: '0.1.0',
    description:
      'API for the HOPE speech learning frontend. Current implementation uses in-memory seed data and bearer-token sessions.',
  },
  servers: [
    {
      url: 'http://localhost:4000',
      description: 'Local backend server',
    },
  ],
  tags: [
    { name: 'System', description: 'Server status and API documentation' },
    { name: 'Auth', description: 'Signup, login, and current user' },
    { name: 'Home', description: 'Home dashboard data' },
    { name: 'Learning', description: 'Learning page data and game result submission' },
    { name: 'Speech', description: 'WAV upload proxy to the external speech-coach analysis API' },
    { name: 'Records', description: 'Learning history and progress records' },
    { name: 'Rewards', description: 'Reward shop, attendance, and mission rewards' },
    { name: 'MyPage', description: 'Profile and my page data' },
    { name: 'Settings', description: 'Notification, learning, parent, and privacy settings' },
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
          error: { type: 'string', example: 'Authentication required' },
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
          'Response returned by https://go-neung.activejang.com/v1/utterance/analyze. The exact shape is controlled by the speech-coach service.',
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
        summary: 'Check server health',
        responses: {
          200: {
            description: 'Server is healthy',
          },
        },
      },
    },
    '/openapi.json': {
      get: {
        tags: ['System'],
        summary: 'Get OpenAPI document',
        responses: {
          200: {
            description: 'OpenAPI JSON',
          },
        },
      },
    },
    '/': {
      get: {
        tags: ['System'],
        summary: 'Redirect to Swagger UI',
        responses: {
          302: { description: 'Redirects to /docs' },
        },
      },
    },
    '/api/auth/signup': {
      post: {
        tags: ['Auth'],
        summary: 'Create a new account',
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
            description: 'Account created',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } },
          },
          409: { description: 'User already exists' },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Log in and receive a bearer token',
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
            description: 'Login succeeded',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } },
          },
          401: { description: 'Invalid credentials' },
        },
      },
    },
    '/api/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get current user profile',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Current user profile' },
          401: { description: 'Authentication required' },
        },
      },
      patch: {
        tags: ['Auth'],
        summary: 'Update current user profile',
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
          200: { description: 'Profile updated' },
          401: { description: 'Authentication required' },
        },
      },
    },
    '/api/home': {
      get: {
        tags: ['Home'],
        summary: 'Get home dashboard data',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Home data', content: { 'application/json': { schema: { $ref: '#/components/schemas/HomeData' } } } },
          401: { description: 'Authentication required' },
        },
      },
    },
    '/api/learning': {
      get: {
        tags: ['Learning'],
        summary: 'Get learning page data',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Learning status and games' },
          401: { description: 'Authentication required' },
        },
      },
    },
    '/api/learning/results': {
      post: {
        tags: ['Learning'],
        summary: 'Submit a learning game result',
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
          201: { description: 'Learning result saved' },
          401: { description: 'Authentication required' },
        },
      },
    },
    '/api/speech/analyze': {
      post: {
        tags: ['Speech'],
        summary: 'Analyze a WAV utterance with the speech-coach API',
        description:
          'Receives the same multipart/form-data fields as the external speech-coach API and forwards them to https://go-neung.activejang.com/v1/utterance/analyze.',
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
                    description: '16kHz mono WAV, up to 5 seconds.',
                  },
                  target_word: {
                    type: 'string',
                    example: '사과',
                  },
                  target_phonemes: {
                    type: 'string',
                    description:
                      'IPA JSON array. Leave empty to let speech-coach convert target_word automatically.',
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
            description: 'Analysis result from speech-coach',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SpeechAnalyzeResponse' },
              },
            },
          },
          415: { description: 'Request must be multipart/form-data' },
          422: { description: 'Validation error returned by speech-coach' },
        },
      },
    },
    '/api/records': {
      get: {
        tags: ['Records'],
        summary: 'Get learning record data',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Learning records' },
          401: { description: 'Authentication required' },
        },
      },
    },
    '/api/rewards': {
      get: {
        tags: ['Rewards'],
        summary: 'Get rewards, shop, attendance, and missions',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Reward data' },
          401: { description: 'Authentication required' },
        },
      },
    },
    '/api/rewards/missions/{missionId}/claim': {
      post: {
        tags: ['Rewards'],
        summary: 'Claim a mission reward',
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
          200: { description: 'Mission reward claimed' },
          400: { description: 'Mission is not claimable' },
          404: { description: 'Mission not found' },
          401: { description: 'Authentication required' },
        },
      },
    },
    '/api/mypage': {
      get: {
        tags: ['MyPage'],
        summary: 'Get my page profile and statistics',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'My page data' },
          401: { description: 'Authentication required' },
        },
      },
    },
    '/api/settings': {
      get: {
        tags: ['Settings'],
        summary: 'Get user settings',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Settings', content: { 'application/json': { schema: { $ref: '#/components/schemas/Settings' } } } },
          401: { description: 'Authentication required' },
        },
      },
      patch: {
        tags: ['Settings'],
        summary: 'Update user settings',
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
          200: { description: 'Settings updated' },
          401: { description: 'Authentication required' },
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
