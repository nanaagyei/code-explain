# API Key Management

Code Explain's API Key Management system provides secure, flexible, and comprehensive control over API access for individuals, teams, and organizations. This feature ensures proper authentication, authorization, and usage tracking across all Code Explain services.

## Overview

API Key Management offers:
- **Secure Key Generation**: Cryptographically secure API key generation
- **Granular Permissions**: Fine-grained access control and permissions
- **Usage Tracking**: Detailed usage analytics and monitoring
- **Key Rotation**: Secure key rotation without service interruption
- **Team Management**: Organization-wide key management and sharing
- **Audit Logging**: Comprehensive audit trails for security compliance

## Key Features

### Key Generation and Security
- **Cryptographically Secure**: Uses industry-standard algorithms for key generation
- **Unique Identifiers**: Each key has a unique identifier for tracking
- **Scoped Access**: Keys can be scoped to specific features or resources
- **Expiration Support**: Optional expiration dates for enhanced security
- **Key Hashing**: Keys are hashed and never stored in plain text

### Permission Management
- **Feature-Based Permissions**: Control access to specific features
- **Resource-Based Permissions**: Limit access to specific resources
- **Rate Limiting**: Per-key rate limiting and quotas
- **IP Restrictions**: Optional IP address restrictions
- **Time-Based Access**: Time-based access controls

### Usage Analytics
- **Real-Time Monitoring**: Live usage tracking and analytics
- **Historical Data**: Long-term usage trends and patterns
- **Cost Tracking**: Track usage costs and billing
- **Performance Metrics**: API performance and response times
- **Error Tracking**: Monitor API errors and failures

## Usage

### Creating API Keys

```javascript
import { CodeExplain } from '@codeexplain/sdk';

const codeExplain = new CodeExplain({
  apiKey: 'your-master-api-key'
});

// Create a new API key
const apiKey = await codeExplain.apiKeys.create({
  name: 'Frontend Application Key',
  description: 'API key for frontend application',
  permissions: {
    features: ['analyze', 'generate_docs', 'quality_metrics'],
    resources: ['repositories', 'files'],
    rateLimits: {
      requestsPerHour: 1000,
      requestsPerDay: 10000
    }
  },
  options: {
    expiresAt: '2024-12-31T23:59:59Z', // Optional expiration
    ipRestrictions: ['192.168.1.0/24'], // Optional IP restrictions
    notifications: {
      usageAlerts: true,
      expirationWarnings: true
    }
  }
});

console.log('Created API Key:', apiKey.id);
console.log('Key Value:', apiKey.key); // Only shown once!
```

**API Key Response:**
```json
{
  "id": "key_abc123def456",
  "name": "Frontend Application Key",
  "description": "API key for frontend application",
  "key": "ce_live_abc123def456789...", // Only shown on creation
  "permissions": {
    "features": ["analyze", "generate_docs", "quality_metrics"],
    "resources": ["repositories", "files"],
    "rateLimits": {
      "requestsPerHour": 1000,
      "requestsPerDay": 10000
    }
  },
  "options": {
    "expiresAt": "2024-12-31T23:59:59Z",
    "ipRestrictions": ["192.168.1.0/24"],
    "notifications": {
      "usageAlerts": true,
      "expirationWarnings": true
    }
  },
  "createdAt": "2024-01-15T10:00:00Z",
  "lastUsedAt": null,
  "status": "active"
}
```

### Managing API Keys

```javascript
// List all API keys
const apiKeys = await codeExplain.apiKeys.list({
  status: 'active',
  limit: 10,
  offset: 0
});

console.log('Active API Keys:', apiKeys);

// Get specific API key details
const keyDetails = await codeExplain.apiKeys.get('key_abc123def456');
console.log('Key Details:', keyDetails);

// Update API key
const updatedKey = await codeExplain.apiKeys.update('key_abc123def456', {
  name: 'Updated Frontend Key',
  permissions: {
    features: ['analyze', 'generate_docs', 'quality_metrics', 'ai_mentor'],
    resources: ['repositories', 'files', 'issues'],
    rateLimits: {
      requestsPerHour: 2000,
      requestsPerDay: 20000
    }
  }
});

// Deactivate API key
await codeExplain.apiKeys.deactivate('key_abc123def456');

// Reactivate API key
await codeExplain.apiKeys.activate('key_abc123def456');

// Delete API key
await codeExplain.apiKeys.delete('key_abc123def456');
```

### Permission Management

```javascript
// Create API key with specific permissions
const restrictedKey = await codeExplain.apiKeys.create({
  name: 'Read-Only Analysis Key',
  description: 'Key for read-only analysis operations',
  permissions: {
    features: ['analyze'], // Only analysis feature
    resources: ['repositories'], // Only repository access
    operations: ['read'], // Only read operations
    rateLimits: {
      requestsPerHour: 100,
      requestsPerDay: 1000
    },
    restrictions: {
      maxFileSize: '1MB',
      maxAnalysisTime: '60s',
      allowedLanguages: ['javascript', 'typescript']
    }
  }
});

// Update permissions
await codeExplain.apiKeys.updatePermissions('key_abc123def456', {
  features: ['analyze', 'generate_docs'],
  resources: ['repositories', 'files'],
  rateLimits: {
    requestsPerHour: 500,
    requestsPerDay: 5000
  }
});
```

### Usage Analytics

```javascript
// Get usage analytics for an API key
const usage = await codeExplain.apiKeys.getUsage('key_abc123def456', {
  timeRange: 'last_30_days',
  granularity: 'daily'
});

console.log('Usage Analytics:', usage);
```

**Usage Analytics Response:**
```json
{
  "keyId": "key_abc123def456",
  "timeRange": "last_30_days",
  "usage": {
    "totalRequests": 15420,
    "successfulRequests": 15234,
    "failedRequests": 186,
    "averageResponseTime": 245,
    "peakUsage": {
      "date": "2024-01-10",
      "requests": 892
    }
  },
  "breakdown": {
    "byFeature": {
      "analyze": 12340,
      "generate_docs": 2340,
      "quality_metrics": 740
    },
    "byResource": {
      "repositories": 8900,
      "files": 6520
    },
    "byDay": [
      {
        "date": "2024-01-01",
        "requests": 450,
        "successRate": 98.2
      }
    ]
  },
  "costs": {
    "totalCost": 45.67,
    "byFeature": {
      "analyze": 32.45,
      "generate_docs": 10.22,
      "quality_metrics": 3.00
    }
  }
}
```

## Advanced Features

### Key Rotation

```javascript
// Rotate API key (creates new key, deactivates old one)
const rotatedKey = await codeExplain.apiKeys.rotate('key_abc123def456', {
  name: 'Rotated Frontend Key',
  description: 'Rotated API key for enhanced security',
  gracePeriod: '24h' // Old key remains active for 24 hours
});

console.log('New Key:', rotatedKey.key);
console.log('Old Key Status:', rotatedKey.oldKeyStatus);

// Schedule automatic rotation
await codeExplain.apiKeys.scheduleRotation('key_abc123def456', {
  rotationInterval: '90d', // Rotate every 90 days
  notificationDays: [30, 7, 1] // Notify 30, 7, and 1 days before
});
```

### Team Management

```javascript
// Create team API key
const teamKey = await codeExplain.apiKeys.create({
  name: 'Team Development Key',
  description: 'Shared API key for development team',
  teamId: 'team_123',
  permissions: {
    features: ['analyze', 'generate_docs', 'quality_metrics'],
    resources: ['repositories', 'files'],
    rateLimits: {
      requestsPerHour: 5000,
      requestsPerDay: 50000
    }
  },
  options: {
    teamAccess: {
      members: ['user1', 'user2', 'user3'],
      permissions: ['use', 'view_usage']
    }
  }
});

// Add team member to key
await codeExplain.apiKeys.addTeamMember('key_abc123def456', {
  userId: 'user4',
  permissions: ['use']
});

// Remove team member from key
await codeExplain.apiKeys.removeTeamMember('key_abc123def456', 'user4');
```

### Audit Logging

```javascript
// Get audit log for API key
const auditLog = await codeExplain.apiKeys.getAuditLog('key_abc123def456', {
  timeRange: 'last_7_days',
  events: ['usage', 'permission_changes', 'rotations'],
  limit: 100
});

console.log('Audit Log:', auditLog);
```

**Audit Log Response:**
```json
{
  "keyId": "key_abc123def456",
  "timeRange": "last_7_days",
  "events": [
    {
      "timestamp": "2024-01-15T10:30:00Z",
      "event": "usage",
      "details": {
        "endpoint": "/api/v1/analyze",
        "method": "POST",
        "status": 200,
        "responseTime": 245,
        "ipAddress": "192.168.1.100"
      }
    },
    {
      "timestamp": "2024-01-14T15:20:00Z",
      "event": "permission_changes",
      "details": {
        "changedBy": "user123",
        "changes": {
          "added": ["ai_mentor"],
          "removed": [],
          "modified": {
            "rateLimits": {
              "requestsPerHour": "1000 -> 2000"
            }
          }
        }
      }
    }
  ]
}
```

## Integration Options

### Web Application Integration

```javascript
// Frontend API key management
class APIKeyManager {
  constructor() {
    this.apiKeys = new Map();
    this.loadStoredKeys();
  }
  
  async createKey(name, permissions) {
    const key = await codeExplain.apiKeys.create({
      name: name,
      permissions: permissions,
      options: {
        expiresAt: this.getDefaultExpiration(),
        ipRestrictions: this.getClientIPRange()
      }
    });
    
    this.apiKeys.set(key.id, key);
    this.storeKey(key);
    return key;
  }
  
  async rotateKey(keyId) {
    const rotatedKey = await codeExplain.apiKeys.rotate(keyId);
    this.apiKeys.set(rotatedKey.id, rotatedKey);
    this.storeKey(rotatedKey);
    return rotatedKey;
  }
  
  getActiveKeys() {
    return Array.from(this.apiKeys.values()).filter(key => key.status === 'active');
  }
  
  storeKey(key) {
    localStorage.setItem(`api_key_${key.id}`, JSON.stringify({
      id: key.id,
      name: key.name,
      permissions: key.permissions,
      expiresAt: key.expiresAt
    }));
  }
  
  loadStoredKeys() {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('api_key_')) {
        const keyData = JSON.parse(localStorage.getItem(key));
        this.apiKeys.set(keyData.id, keyData);
      }
    }
  }
}
```

### CLI Integration

```bash
# List API keys
codeexplain api-keys list

# Create new API key
codeexplain api-keys create \
  --name "CLI Development Key" \
  --description "Key for CLI development" \
  --features "analyze,generate_docs" \
  --rate-limit "1000/hour"

# Get usage analytics
codeexplain api-keys usage key_abc123def456 --time-range "last_30_days"

# Rotate API key
codeexplain api-keys rotate key_abc123def456 --grace-period "24h"

# Update permissions
codeexplain api-keys update-permissions key_abc123def456 \
  --add-features "ai_mentor" \
  --rate-limit "2000/hour"
```

### CI/CD Integration

```yaml
# GitHub Actions workflow
name: API Key Management
on:
  schedule:
    - cron: '0 0 * * 0' # Weekly

jobs:
  rotate-keys:
    runs-on: ubuntu-latest
    steps:
      - name: Rotate API Keys
        run: |
          codeexplain api-keys rotate-all \
            --rotation-interval "90d" \
            --notification-days "30,7,1" \
            --auto-rotate
        env:
          CODEEXPLAIN_API_KEY: ${{ secrets.CODEEXPLAIN_MASTER_KEY }}
      
      - name: Update Environment Variables
        run: |
          # Update environment variables with new keys
          echo "NEW_API_KEY=${{ steps.rotate-keys.outputs.newKey }}" >> $GITHUB_ENV
```

## Configuration

### API Key Settings

```javascript
const apiKeyConfig = {
  // Default settings for new keys
  defaults: {
    expiration: '1y', // Default expiration period
    rateLimits: {
      requestsPerHour: 1000,
      requestsPerDay: 10000
    },
    permissions: {
      features: ['analyze', 'generate_docs'],
      resources: ['repositories', 'files']
    }
  },
  
  // Security settings
  security: {
    keyLength: 32, // Key length in bytes
    hashAlgorithm: 'sha256',
    rotationInterval: '90d',
    maxInactiveDays: 365
  },
  
  // Notification settings
  notifications: {
    usageAlerts: {
      enabled: true,
      thresholds: [80, 90, 95] // Percentage thresholds
    },
    expirationWarnings: {
      enabled: true,
      days: [30, 7, 1] // Days before expiration
    }
  }
};
```

### Team Configuration

```javascript
const teamConfig = {
  // Team-wide settings
  teamSettings: {
    defaultPermissions: {
      features: ['analyze', 'generate_docs', 'quality_metrics'],
      resources: ['repositories', 'files']
    },
    maxKeysPerMember: 5,
    sharedKeyLimit: 10
  },
  
  // Access control
  accessControl: {
    keyCreation: ['senior_developers', 'team_leads'],
    keyRotation: ['team_leads', 'admins'],
    usageViewing: ['all_members']
  },
  
  // Compliance settings
  compliance: {
    auditLogging: true,
    retentionPeriod: '7y',
    encryptionRequired: true
  }
};
```

## Best Practices

### Security Best Practices

1. **Regular Rotation**: Rotate keys regularly (every 90 days)
2. **Principle of Least Privilege**: Grant minimum necessary permissions
3. **Monitor Usage**: Regularly monitor key usage and activity
4. **Secure Storage**: Store keys securely (environment variables, secret managers)
5. **Access Control**: Implement proper access controls for key management

### Key Management

1. **Naming Convention**: Use descriptive names for keys
2. **Documentation**: Document key purpose and usage
3. **Lifecycle Management**: Track key lifecycle from creation to deletion
4. **Backup Strategy**: Have backup keys for critical applications
5. **Cleanup**: Regularly clean up unused or expired keys

### Team Collaboration

1. **Shared Keys**: Use shared keys for team operations
2. **Individual Keys**: Use individual keys for personal development
3. **Permission Reviews**: Regularly review and update permissions
4. **Training**: Train team members on key management best practices
5. **Incident Response**: Have procedures for key compromise incidents

## Troubleshooting

### Common Issues

**Key Not Working**
- Check key status (active/inactive)
- Verify permissions and scopes
- Check expiration date
- Verify IP restrictions

**Permission Denied**
- Review key permissions
- Check resource access rights
- Verify feature access
- Check rate limits

**Usage Issues**
- Monitor usage analytics
- Check rate limit settings
- Review cost tracking
- Verify billing status

### Debug Mode

Enable debug mode for detailed API key management logs:

```bash
export CODEEXPLAIN_DEBUG=true
export API_KEYS_DEBUG=true
```

## Support

- **API Key Guide**: [https://docs.codeexplain.com/api-keys](https://docs.codeexplain.com/api-keys)
- **Security Best Practices**: [https://docs.codeexplain.com/security](https://docs.codeexplain.com/security)
- **Support Email**: api-keys-support@codeexplain.com
- **Discord**: [https://discord.gg/codeexplain](https://discord.gg/codeexplain)
