# Authentication

Code Explain uses a robust authentication system to secure access to AI-powered code analysis and documentation features.

## Overview

The authentication system supports multiple methods to ensure secure access while providing flexibility for different deployment scenarios.

## Authentication Methods

### API Key Authentication

The primary authentication method for programmatic access:

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     https://api.codeexplain.com/v1/analyze
```

#### API Key Management

- **Generation**: API keys are generated through the web interface or CLI
- **Scoping**: Keys can be scoped to specific projects or organizations
- **Rotation**: Keys can be rotated without service interruption
- **Expiration**: Keys support configurable expiration dates

### JWT Token Authentication

For web application authentication:

```javascript
const token = localStorage.getItem('authToken');
fetch('/api/analyze', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

### OAuth Integration

Code Explain supports OAuth 2.0 integration with popular platforms:

#### GitHub OAuth
- **Scopes**: `repo`, `read:user`, `read:org`
- **Callback**: `/auth/github/callback`
- **Usage**: Access private repositories for analysis

#### GitLab OAuth
- **Scopes**: `read_api`, `read_user`, `read_repository`
- **Callback**: `/auth/gitlab/callback`
- **Usage**: Enterprise GitLab integration

## Security Features

### Rate Limiting
- **Per User**: 1000 requests/hour
- **Per API Key**: 5000 requests/hour
- **Per IP**: 10000 requests/hour

### Request Validation
- **CSRF Protection**: All state-changing operations
- **Input Sanitization**: Automatic sanitization of user inputs
- **SQL Injection Prevention**: Parameterized queries only

### Audit Logging
- **Authentication Events**: Login attempts, token generation
- **API Usage**: Request logging with user attribution
- **Security Events**: Failed authentication attempts, suspicious activity

## Configuration

### Environment Variables

```bash
# JWT Configuration
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=24h

# OAuth Configuration
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITLAB_CLIENT_ID=your-gitlab-client-id
GITLAB_CLIENT_SECRET=your-gitlab-client-secret

# Security Settings
RATE_LIMIT_ENABLED=true
CSRF_PROTECTION=true
AUDIT_LOGGING=true
```

### Database Schema

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    github_id VARCHAR(255),
    gitlab_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- API Keys table
CREATE TABLE api_keys (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    key_hash VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    scopes TEXT[],
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Sessions table
CREATE TABLE sessions (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## Error Handling

### Common Error Responses

```json
{
  "error": "authentication_failed",
  "message": "Invalid API key",
  "code": 401,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Error Codes

- `401`: Unauthorized - Invalid or missing credentials
- `403`: Forbidden - Valid credentials but insufficient permissions
- `429`: Too Many Requests - Rate limit exceeded
- `500`: Internal Server Error - Authentication service error

## Best Practices

### API Key Security
- Store API keys securely (environment variables, secret managers)
- Never commit API keys to version control
- Use different keys for different environments
- Rotate keys regularly

### Token Management
- Implement token refresh mechanisms
- Store tokens securely (httpOnly cookies, secure storage)
- Handle token expiration gracefully
- Log out users on token invalidation

### Monitoring
- Monitor authentication success rates
- Alert on unusual authentication patterns
- Track API key usage and performance
- Regular security audits

## Troubleshooting

### Common Issues

**Invalid API Key Error**
- Verify the API key is correct
- Check if the key has expired
- Ensure the key has the required scopes

**Rate Limit Exceeded**
- Implement exponential backoff
- Consider upgrading your plan
- Optimize request frequency

**OAuth Integration Issues**
- Verify OAuth app configuration
- Check callback URLs
- Ensure proper scopes are requested

### Debug Mode

Enable debug logging for authentication issues:

```bash
export AUTH_DEBUG=true
export LOG_LEVEL=debug
```

This will provide detailed logs for authentication flows and help identify issues.
