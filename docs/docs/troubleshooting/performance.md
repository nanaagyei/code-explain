# Performance

Guidelines and patterns to keep Code Explain fast and reliable.

## Frontend

- Memoize expensive components (`React.memo`, `useMemo`, `useCallback`)
- Virtualize large lists (`react-window`, `react-virtualized`)
- Code-split routes and heavy components
- Cache API responses client-side where safe
- Avoid unnecessary re-renders (stable keys, prop equality)

## Backend

- Use connection pooling for Postgres
- Cache hot paths in Redis with appropriate TTLs
- Batch queries and avoid N+1 patterns
- Stream large responses
- Use async job queues for heavy work
- Add indexes for frequent queries; verify with EXPLAIN ANALYZE

## AI/Analysis

- Deduplicate requests with content hashing
- Cache analysis results keyed by content hash + options
- Use worker pools and concurrency limits
- Prefer incremental analysis on diffs

## Rate Limiting and Throttling

- Apply server-side rate limits per user/key
- Throttle client requests (debounce, backoff)
- Queue bursts and drain steadily

## Observability

- Track P50/P95/P99 latencies per endpoint
- Emit structured logs with request IDs
- Alert on saturation: CPU, memory, Redis/DB latency
- Profile regularly and regress-test

## Configuration Tips

- Tune `RATE_LIMIT_PER_MINUTE` and cache TTLs per env
- Right-size DB/Redis instances in production
- Use CDN for static assets

## Load Testing

- Test with realistic traffic patterns
- Use Artillery/K6 to validate performance budgets
- Validate auto-scaling thresholds

