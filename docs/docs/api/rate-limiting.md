# Rate Limiting

Code Explain implements comprehensive rate limiting to ensure fair usage and system stability. This document covers rate limiting policies, implementation details, and best practices for handling limits.

## Overview

Rate limiting protects the API from abuse while ensuring reliable service for all users. Limits are applied per API key, user, and IP address across different time windows.

## Rate Limit Types

### Request Rate Limits

Control the number of API requests per time period:

| Plan | Requests/Hour | Requests/Day | Burst Limit |
|------|---------------|--------------|-------------|
| Free | 100 | 1,000 | 10/min |
| Pro | 1,000 | 10,000 | 50/min |
| Enterprise | 10,000 | 100,000 | 200/min |

### Analysis Rate Limits

Control concurrent and total analyses:

| Plan | Concurrent Analyses | Analyses/Hour | File Size Limit |
|------|-------------------|---------------|-----------------|
| Free | 1 | 50 | 1MB |
| Pro | 5 | 500 | 10MB |
| Enterprise | 20 | 2,000 | 100MB |

### Resource Rate Limits

Control resource-intensive operations:

| Resource | Free | Pro | Enterprise |
|----------|------|-----|------------|
| Documentation Generation | 10/hour | 100/hour | 1,000/hour |
| Architecture Diagrams | 5/hour | 50/hour | 500/hour |
| Bulk Operations | 1/hour | 10/hour | 100/hour |

## Rate Limit Headers

All API responses include rate limit information:

```http
HTTP/1.1 200 OK
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642248600
X-RateLimit-Retry-After: 3600
```

### Header Descriptions

- `X-RateLimit-Limit`: Maximum requests allowed in the current window
- `X-RateLimit-Remaining`: Requests remaining in the current window
- `X-RateLimit-Reset`: Unix timestamp when the rate limit resets
- `X-RateLimit-Retry-After`: Seconds to wait before retrying (only on 429 responses)

## Rate Limit Windows

### Sliding Window

Rate limits use a sliding window algorithm for smooth request distribution:

```
Window Size: 1 hour
Window Slide: Every minute
Example: 1000 requests/hour = ~16.67 requests/minute average
```

### Fixed Window

Some limits use fixed windows that reset at specific intervals:

```
Daily Limits: Reset at 00:00 UTC
Monthly Limits: Reset on the 1st of each month
```

## Rate Limit Scopes

### Per API Key

Primary rate limiting scope for authenticated requests:

```bash
# Each API key has independent limits
curl -H "Authorization: Bearer key1" https://api.codeexplain.com/v1/analyze
curl -H "Authorization: Bearer key2" https://api.codeexplain.com/v1/analyze
```

### Per User Account

Limits applied across all API keys for a user:

```javascript
// User has multiple API keys, but limits are shared
const userLimits = {
  totalRequests: 1000,  // Across all keys
  concurrentAnalyses: 5  // Across all keys
};
```

### Per IP Address

Protection against abuse and DDoS attacks:

```javascript
const ipLimits = {
  requestsPerHour: 10000,  // Per IP
  requestsPerDay: 100000  // Per IP
};
```

## Rate Limit Responses

### 429 Too Many Requests

When rate limits are exceeded:

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again later.",
    "details": {
      "limit_type": "requests_per_hour",
      "limit": 1000,
      "remaining": 0,
      "reset_time": "2024-01-15T11:00:00Z",
      "retry_after": 3600
    },
    "timestamp": "2024-01-15T10:00:00Z"
  }
}
```

### Rate Limit Exceeded Types

```javascript
const rateLimitTypes = {
  REQUESTS_PER_HOUR: 'requests_per_hour',
  REQUESTS_PER_DAY: 'requests_per_day',
  CONCURRENT_ANALYSES: 'concurrent_analyses',
  FILE_SIZE_LIMIT: 'file_size_limit',
  BURST_LIMIT: 'burst_limit'
};
```

## Handling Rate Limits

### Exponential Backoff

Implement exponential backoff for retry logic:

```javascript
async function makeRequestWithBackoff(url, options, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      if (response.status === 429) {
        const retryAfter = response.headers.get('X-RateLimit-Retry-After');
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        
        if (retryAfter) {
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        } else {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        continue;
      }
      
      return response;
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
    }
  }
}
```

### Request Queuing

Queue requests to stay within limits:

```javascript
class RateLimitedQueue {
  constructor(requestsPerSecond = 1) {
    this.queue = [];
    this.processing = false;
    this.interval = 1000 / requestsPerSecond;
  }
  
  async add(request) {
    return new Promise((resolve, reject) => {
      this.queue.push({ request, resolve, reject });
      this.process();
    });
  }
  
  async process() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      const { request, resolve, reject } = this.queue.shift();
      
      try {
        const result = await request();
        resolve(result);
      } catch (error) {
        reject(error);
      }
      
      await new Promise(resolve => setTimeout(resolve, this.interval));
    }
    
    this.processing = false;
  }
}
```

### Monitoring Rate Limits

Track rate limit usage in your application:

```javascript
class RateLimitMonitor {
  constructor() {
    this.usage = {
      requests: 0,
      analyses: 0,
      lastReset: Date.now()
    };
  }
  
  updateFromHeaders(headers) {
    this.usage.remaining = parseInt(headers.get('X-RateLimit-Remaining'));
    this.usage.limit = parseInt(headers.get('X-RateLimit-Limit'));
    this.usage.resetTime = parseInt(headers.get('X-RateLimit-Reset')) * 1000;
  }
  
  getUsagePercentage() {
    return ((this.usage.limit - this.usage.remaining) / this.usage.limit) * 100;
  }
  
  isNearLimit(threshold = 80) {
    return this.getUsagePercentage() >= threshold;
  }
}
```

## Rate Limit Bypass

### Priority Requests

Enterprise plans can use priority headers for urgent requests:

```http
POST /analyze/file
X-Priority: high
Authorization: Bearer enterprise-key
```

### Reserved Capacity

Enterprise customers can reserve capacity for guaranteed throughput:

```javascript
const enterpriseConfig = {
  reservedCapacity: {
    requestsPerHour: 5000,
    concurrentAnalyses: 10,
    guaranteedThroughput: true
  }
};
```

## Testing Rate Limits

### Test Endpoints

Use test endpoints to verify rate limit behavior:

```bash
# Test rate limiting without consuming quota
curl -H "Authorization: Bearer test-key" \
     https://test-api.codeexplain.com/v1/test/rate-limit
```

### Rate Limit Testing

```javascript
async function testRateLimits() {
  const requests = [];
  
  // Make requests until rate limited
  for (let i = 0; i < 1000; i++) {
    requests.push(
      fetch('/api/analyze', {
        headers: { 'Authorization': 'Bearer test-key' }
      })
    );
  }
  
  const responses = await Promise.allSettled(requests);
  const rateLimited = responses.filter(r => 
    r.status === 'fulfilled' && r.value.status === 429
  );
  
  console.log(`Rate limited after ${rateLimited.length} requests`);
}
```

## Best Practices

### Request Optimization

```javascript
// Batch multiple operations
const bulkAnalysis = await codeExplain.analyzeBulk([
  { type: 'file', path: 'file1.js' },
  { type: 'file', path: 'file2.js' },
  { type: 'file', path: 'file3.js' }
]);

// Use caching to reduce requests
const cachedResult = cache.get(codeHash);
if (cachedResult) {
  return cachedResult;
}
```

### Error Handling

```javascript
async function handleRateLimit(error) {
  if (error.code === 'RATE_LIMIT_EXCEEDED') {
    const retryAfter = error.details.retry_after;
    
    // Show user-friendly message
    showNotification(`Rate limit exceeded. Retrying in ${retryAfter} seconds.`);
    
    // Schedule retry
    setTimeout(() => {
      retryRequest();
    }, retryAfter * 1000);
  }
}
```

### Monitoring and Alerting

```javascript
// Set up monitoring for rate limit usage
const monitor = new RateLimitMonitor();

setInterval(() => {
  if (monitor.isNearLimit(90)) {
    alert('Rate limit usage is at 90%');
  }
}, 60000); // Check every minute
```

## Rate Limit Configuration

### Custom Limits

Enterprise customers can configure custom rate limits:

```javascript
const customLimits = {
  requestsPerHour: 5000,
  concurrentAnalyses: 15,
  fileSizeLimit: '50MB',
  burstLimit: 100
};
```

### Geographic Limits

Different limits for different regions:

```javascript
const regionalLimits = {
  'US': { requestsPerHour: 1000 },
  'EU': { requestsPerHour: 800 },
  'APAC': { requestsPerHour: 1200 }
};
```

## Troubleshooting

### Common Issues

**Rate Limit Not Resetting**
- Check system clock synchronization
- Verify timezone settings
- Contact support if issue persists

**Unexpected Rate Limiting**
- Review request patterns
- Check for burst requests
- Verify API key usage

**Slow Performance**
- Implement request queuing
- Use bulk operations
- Enable caching

### Debug Mode

Enable debug logging for rate limit information:

```bash
export CODEEXPLAIN_DEBUG=true
export LOG_LEVEL=debug
```

This will log detailed rate limit information including:
- Current usage
- Limit calculations
- Reset times
- Burst tracking

## Support

- **Rate Limit Calculator**: [https://codeexplain.com/rate-limits](https://codeexplain.com/rate-limits)
- **Upgrade Plans**: [https://codeexplain.com/pricing](https://codeexplain.com/pricing)
- **Support Email**: rate-limits@codeexplain.com
- **Status Page**: [https://status.codeexplain.com](https://status.codeexplain.com)
