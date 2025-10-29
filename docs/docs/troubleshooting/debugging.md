# Debugging

Tips and tools for debugging Code Explain across services.

## Enable Debug Logs

Set verbose logging to see internal details in dev:

```bash
# Backend
DEBUG=True
LOG_LEVEL=debug

# Docs
export DEBUG=1

# Frontend (Vite)
VITE_LOG_LEVEL=debug
```

## Inspect Requests

- Use browser DevTools Network panel to see CORS/headers
- Log backend requests with request ID and timing
- Add `X-Request-Id` middleware and propagate to logs

## Trace an API Call

1. Frontend emits request with request ID header
2. API Gateway logs: method, path, status, latency
3. API service logs handler timing and downstream calls
4. Queue/worker logs job enqueue/dequeue times
5. AI service logs model calls and durations

## Useful Scripts

```bash
# Tail backend logs
npm run logs:api

# Tail AI service logs
npm run logs:ai

# Tail docs site logs
cd docs && npm start
```

## Common Debug Scenarios

### CORS
- Check `Origin` header and `Access-Control-Allow-Origin`
- Ensure credentials mode matches server config

### Authentication
- Decode JWT to verify claims/expiry
- Verify `Authorization: Bearer <token>` header present

### Rate Limiting
- Inspect `X-RateLimit-*` headers
- Add client-side backoff and retries

### Performance Spikes
- Capture CPU/memory profiles
- Check Redis/DB latency
- Inspect N+1 patterns in code

## Recommended Tools

- Browser DevTools
- Postman/Insomnia
- curl/httpie
- pino/winston structured logs
- OpenTelemetry traces (if enabled)
- pgAdmin/psql for DB
- redis-cli for Redis


