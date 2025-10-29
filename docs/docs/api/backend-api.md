# Backend API Reference

The Code Explain backend API provides comprehensive endpoints for code analysis, documentation generation, and AI-powered development assistance.

## Base URL

```
Production: https://api.codeexplain.com/v1
Development: http://localhost:3001/api/v1
```

## Authentication

All API requests require authentication. See the [Authentication documentation](./authentication.md) for details.

```bash
Authorization: Bearer YOUR_API_KEY
```

## Core Endpoints

### Code Analysis

#### Analyze Repository
Analyze an entire repository for code quality, documentation, and architectural insights.

```http
POST /analyze/repository
Content-Type: application/json

{
  "repository_url": "https://github.com/user/repo",
  "branch": "main",
  "analysis_options": {
    "include_tests": true,
    "generate_docs": true,
    "quality_metrics": true,
    "architecture_diagram": true
  }
}
```

**Response:**
```json
{
  "analysis_id": "uuid",
  "status": "processing",
  "estimated_completion": "2024-01-15T10:35:00Z",
  "repository_info": {
    "name": "repo",
    "owner": "user",
    "language": "TypeScript",
    "size": "2.5MB"
  }
}
```

#### Get Analysis Results
Retrieve the results of a completed analysis.

```http
GET /analyze/{analysis_id}
```

**Response:**
```json
{
  "analysis_id": "uuid",
  "status": "completed",
  "completed_at": "2024-01-15T10:30:00Z",
  "results": {
    "quality_metrics": {
      "complexity_score": 7.2,
      "maintainability_index": 85,
      "test_coverage": 78.5,
      "code_duplication": 12.3
    },
    "documentation": {
      "coverage_percentage": 65,
      "missing_docs": ["src/utils/helper.ts", "src/api/auth.ts"],
      "generated_docs": ["src/components/Button.tsx"]
    },
    "architecture": {
      "diagram_url": "https://api.codeexplain.com/diagrams/uuid.svg",
      "components": 15,
      "dependencies": 8
    }
  }
}
```

### File Analysis

#### Analyze Single File
Analyze a specific file for code quality and generate documentation.

```http
POST /analyze/file
Content-Type: application/json

{
  "file_path": "src/components/Button.tsx",
  "file_content": "export const Button = () => { ... }",
  "language": "typescript",
  "options": {
    "generate_docs": true,
    "suggest_improvements": true,
    "check_patterns": true
  }
}
```

**Response:**
```json
{
  "file_analysis": {
    "complexity": 3,
    "maintainability": "good",
    "suggestions": [
      {
        "type": "performance",
        "message": "Consider using React.memo for this component",
        "line": 5,
        "severity": "medium"
      }
    ],
    "documentation": {
      "generated": "/**\n * A reusable button component\n * @param props - Button properties\n */",
      "coverage": "complete"
    }
  }
}
```

### AI Mentor

#### Ask AI Mentor
Get AI-powered code suggestions and explanations.

```http
POST /mentor/ask
Content-Type: application/json

{
  "question": "How can I improve the performance of this React component?",
  "code_context": "const MyComponent = () => { ... }",
  "language": "typescript",
  "context": {
    "framework": "react",
    "experience_level": "intermediate"
  }
}
```

**Response:**
```json
{
  "answer": "Here are several ways to improve your React component performance...",
  "suggestions": [
    {
      "type": "optimization",
      "code": "const MyComponent = React.memo(() => { ... })",
      "explanation": "Using React.memo prevents unnecessary re-renders"
    }
  ],
  "resources": [
    {
      "title": "React Performance Optimization",
      "url": "https://react.dev/learn/render-and-commit"
    }
  ]
}
```

### Documentation Generation

#### Generate Documentation
Generate comprehensive documentation for code.

```http
POST /docs/generate
Content-Type: application/json

{
  "code": "export function calculateTotal(items) { ... }",
  "language": "javascript",
  "style": "jsdoc",
  "include_examples": true,
  "include_parameters": true
}
```

**Response:**
```json
{
  "documentation": "/**\n * Calculates the total price of items\n * @param {Array} items - Array of items with price property\n * @returns {number} The total price\n * @example\n * const items = [{price: 10}, {price: 20}];\n * const total = calculateTotal(items); // 30\n */",
  "metadata": {
    "function_name": "calculateTotal",
    "parameters": ["items"],
    "return_type": "number",
    "complexity": "O(n)"
  }
}
```

### Bulk Operations

#### Bulk Analysis
Analyze multiple files or repositories in a single request.

```http
POST /analyze/bulk
Content-Type: application/json

{
  "items": [
    {
      "type": "file",
      "path": "src/utils/helper.ts",
      "content": "..."
    },
    {
      "type": "repository",
      "url": "https://github.com/user/repo",
      "branch": "main"
    }
  ],
  "options": {
    "parallel": true,
    "max_concurrent": 5
  }
}
```

**Response:**
```json
{
  "bulk_analysis_id": "uuid",
  "status": "processing",
  "total_items": 2,
  "completed_items": 0,
  "results": []
}
```

## Error Handling

### Standard Error Response

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid file content provided",
    "details": {
      "field": "file_content",
      "reason": "Content cannot be empty"
    },
    "timestamp": "2024-01-15T10:30:00Z",
    "request_id": "req_123456"
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request parameters |
| `AUTHENTICATION_FAILED` | 401 | Invalid or missing authentication |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `ANALYSIS_FAILED` | 500 | Analysis processing error |
| `QUOTA_EXCEEDED` | 402 | Usage quota exceeded |

## Rate Limiting

### Limits by Plan

| Plan | Requests/Hour | Concurrent Analyses | File Size Limit |
|------|---------------|-------------------|-----------------|
| Free | 100 | 1 | 1MB |
| Pro | 1,000 | 5 | 10MB |
| Enterprise | 10,000 | 20 | 100MB |

### Rate Limit Headers

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642248600
```

## Webhooks

### Analysis Complete Webhook

Configure webhooks to receive notifications when analyses complete.

```http
POST /webhooks
Content-Type: application/json

{
  "url": "https://your-app.com/webhooks/analysis-complete",
  "events": ["analysis.completed", "analysis.failed"],
  "secret": "your-webhook-secret"
}
```

**Webhook Payload:**
```json
{
  "event": "analysis.completed",
  "data": {
    "analysis_id": "uuid",
    "status": "completed",
    "results_url": "https://api.codeexplain.com/results/uuid"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## SDKs and Libraries

### JavaScript/TypeScript SDK

```bash
npm install @codeexplain/sdk
```

```javascript
import { CodeExplain } from '@codeexplain/sdk';

const client = new CodeExplain({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.codeexplain.com/v1'
});

const analysis = await client.analyzeFile({
  filePath: 'src/components/Button.tsx',
  fileContent: code,
  options: { generateDocs: true }
});
```

### Python SDK

```bash
pip install codeexplain-sdk
```

```python
from codeexplain import CodeExplainClient

client = CodeExplainClient(api_key='your-api-key')

analysis = client.analyze_file(
    file_path='src/components/Button.tsx',
    file_content=code,
    options={'generate_docs': True}
)
```

## Testing

### Test Endpoints

Use the test endpoints for development and integration testing:

```http
POST /test/analyze/file
```

Test endpoints return mock data and don't consume your quota.

### Postman Collection

Download our Postman collection for easy API testing:

```bash
curl -o codeexplain-api.postman_collection.json \
  https://api.codeexplain.com/docs/postman-collection.json
```

## Support

- **Documentation**: [https://docs.codeexplain.com](https://docs.codeexplain.com)
- **API Status**: [https://status.codeexplain.com](https://status.codeexplain.com)
- **Support Email**: api-support@codeexplain.com
- **Discord Community**: [https://discord.gg/codeexplain](https://discord.gg/codeexplain)
