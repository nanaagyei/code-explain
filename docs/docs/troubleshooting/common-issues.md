# Common Issues

This page lists frequent issues when running or deploying Code Explain and how to fix them.

## Docs site fails to start (Docusaurus)

**Symptoms**
- Error: Invalid sidebar file at `sidebars.ts`
- Missing document IDs listed in terminal

**Fix**
- Ensure each ID in `docs/sidebars.ts` exists in `docs/docs/*`
- Or trim the sidebar to only existing IDs
- Run again: `cd docs && npm install && npm start`

## CORS errors in frontend

**Symptoms**
- Browser console shows `CORS policy`/`Blocked by CORS`

**Fix**
- Add the frontend origin to backend `CORS_ORIGINS` in `.env`
- Restart backend service

## 401 Unauthorized from API

**Symptoms**
- Frontend/API calls return 401

**Fix**
- Verify `VITE_API_BASE_URL` points to the correct API
- Ensure valid access token/API key is sent
- Check token expiration and refresh logic

## Database connection errors

**Symptoms**
- Connection refused / authentication failed

**Fix**
- Check `DATABASE_URL` credentials and host/port
- Ensure Postgres is running and reachable
- Apply migrations before starting the app

## Redis not reachable

**Symptoms**
- Cache/queue errors referencing Redis

**Fix**
- Confirm `REDIS_URL` is correct
- Start Redis (`docker compose up -d redis`)
- Verify firewall/port access

## Rate limit (429) responses

**Symptoms**
- API returns 429 Too Many Requests

**Fix**
- Lower request frequency or batch requests
- Increase plan/limits, or adjust `RATE_LIMIT_PER_MINUTE` for local

## Large file upload rejected

**Symptoms**
- Upload fails with payload too large

**Fix**
- Increase `MAX_FILE_SIZE_MB` (backend) and reverse proxy body size limits

## Frontend cannot reach API

**Symptoms**
- Network errors `ECONNREFUSED` or `ERR_CONNECTION_TIMED_OUT`

**Fix**
- Verify backend is running and accessible
- Correct `VITE_API_BASE_URL`
- Handle HTTPS vs HTTP mismatch

## OpenAI/LLM errors

**Symptoms**
- 401/429/5xx from LLM provider

**Fix**
- Set valid `OPENAI_API_KEY`
- Respect provider rate limits
- Retry with backoff and log request IDs

## Windows path issues

**Symptoms**
- Scripts failing on Windows path separators

**Fix**
- Use cross-platform scripts (Node/TS instead of bash when possible)
- Run via Git Bash or WSL if needed


