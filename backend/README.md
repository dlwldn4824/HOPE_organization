# HOPE Backend

Node built-in `http` module API server for the HOPE frontend.

## Run

```bash
cd backend
npm start
```

The server listens on `http://localhost:4000` by default.

## Swagger

Start the server and open:

```txt
http://localhost:4000/docs
```

Raw OpenAPI JSON is available at:

```txt
http://localhost:4000/openapi.json
```

Demo account:

```txt
identifier: demo
password: hope1234
```

## Main Endpoints

- `GET /health`
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/me`
- `PATCH /api/me`
- `GET /api/home`
- `GET /api/learning`
- `POST /api/learning/results`
- `POST /api/speech/analyze`
- `GET /api/records`
- `GET /api/rewards`
- `POST /api/rewards/missions/:missionId/claim`
- `GET /api/settings`
- `PATCH /api/settings`

## Speech Coach Integration

`POST /api/speech/analyze` accepts the same `multipart/form-data` request as:

```txt
https://go-neung.activejang.com/v1/utterance/analyze
```

Fields:

- `audio`: 16kHz mono WAV, up to 5 seconds
- `target_word`: target word to evaluate
- `target_phonemes`: optional IPA JSON array string
- `user_id`: optional user id

You can override the upstream API base URL:

```bash
SPEECH_COACH_API_BASE=https://go-neung.activejang.com npm start
```

Use the returned `token` from login/signup as:

```txt
Authorization: Bearer <token>
```
