# GitHub Integration

Code Explain's GitHub Integration provides seamless connectivity with GitHub repositories, enabling automated code analysis, documentation generation, and AI-powered development assistance directly within your GitHub workflow.

## Overview

GitHub Integration offers:
- **Repository Analysis**: Analyze entire GitHub repositories automatically
- **Pull Request Reviews**: AI-powered code reviews for pull requests
- **Issue Integration**: Generate documentation and analysis from GitHub issues
- **Webhook Support**: Real-time updates and automated workflows
- **GitHub Actions**: CI/CD integration for automated analysis
- **Organization Support**: Team-wide analysis and documentation

## Key Features

### Repository Management
- **Full Repository Access**: Analyze public and private repositories
- **Branch Support**: Analyze specific branches or compare branches
- **Commit Analysis**: Analyze individual commits or commit ranges
- **File Filtering**: Analyze specific files or file patterns
- **Dependency Analysis**: Understand repository dependencies and relationships

### Pull Request Integration
- **Automated Reviews**: AI-powered code reviews on every PR
- **Documentation Updates**: Automatically update documentation for changed code
- **Quality Metrics**: Track code quality improvements over time
- **Comment Integration**: Post analysis results as PR comments
- **Status Checks**: Add analysis results as required status checks

### Issue Management
- **Issue Analysis**: Analyze code mentioned in GitHub issues
- **Documentation Generation**: Generate documentation from issue descriptions
- **Code Suggestions**: Provide code suggestions based on issue context
- **Progress Tracking**: Track issue resolution progress

## Setup and Configuration

### GitHub App Installation

1. **Install Code Explain GitHub App**
   - Visit [GitHub App Marketplace](https://github.com/marketplace/codeexplain)
   - Click "Install" and select repositories or organizations
   - Grant necessary permissions

2. **Configure Permissions**
   ```yaml
   # Required permissions
   permissions:
     contents: read          # Read repository contents
     pull_requests: write    # Comment on pull requests
     issues: write          # Comment on issues
     metadata: read         # Read repository metadata
     checks: write          # Create status checks
   ```

3. **Webhook Configuration**
   ```yaml
   # Webhook events to subscribe to
   events:
     - pull_request
     - pull_request_review
     - issues
     - push
     - repository
   ```

### Authentication Setup

```javascript
import { CodeExplain } from '@codeexplain/sdk';

const codeExplain = new CodeExplain({
  apiKey: 'your-api-key',
  github: {
    appId: 'your-github-app-id',
    privateKey: 'your-github-private-key',
    webhookSecret: 'your-webhook-secret'
  }
});
```

## Repository Analysis

### Analyze Entire Repository

```javascript
// Analyze a GitHub repository
const repoAnalysis = await codeExplain.github.analyzeRepository({
  owner: 'facebook',
  repo: 'react',
  branch: 'main',
  options: {
    includeTests: true,
    generateDocs: true,
    qualityMetrics: true,
    architectureDiagrams: true
  }
});

console.log('Repository Analysis:', repoAnalysis);
```

**Analysis Response:**
```json
{
  "repository": {
    "owner": "facebook",
    "name": "react",
    "branch": "main",
    "language": "JavaScript",
    "size": "45.2MB"
  },
  "analysis": {
    "qualityScore": 9.2,
    "maintainabilityIndex": 87,
    "testCoverage": 92.5,
    "codeDuplication": 8.3,
    "documentationCoverage": 78.2
  },
  "components": {
    "total": 156,
    "analyzed": 142,
    "documented": 111
  },
  "architecture": {
    "diagramUrl": "https://api.codeexplain.com/diagrams/react-architecture.svg",
    "complexity": "medium",
    "dependencies": 23
  }
}
```

### Branch Comparison

```javascript
// Compare branches for changes
const branchComparison = await codeExplain.github.compareBranches({
  owner: 'user',
  repo: 'project',
  base: 'main',
  head: 'feature/new-feature',
  options: {
    analyzeChanges: true,
    generateDocs: true,
    qualityMetrics: true
  }
});

console.log('Branch Comparison:', branchComparison);
```

### File Pattern Analysis

```javascript
// Analyze specific file patterns
const patternAnalysis = await codeExplain.github.analyzePattern({
  owner: 'user',
  repo: 'project',
  pattern: 'src/components/**/*.tsx',
  options: {
    generateDocs: true,
    qualityMetrics: true,
    includeTests: false
  }
});
```

## Pull Request Integration

### Automated PR Reviews

```javascript
// Configure automated PR reviews
const prReview = await codeExplain.github.reviewPullRequest({
  owner: 'user',
  repo: 'project',
  pullNumber: 123,
  options: {
    generateComments: true,
    qualityMetrics: true,
    documentationUpdates: true,
    suggestImprovements: true
  }
});

console.log('PR Review:', prReview);
```

**PR Review Response:**
```json
{
  "pullRequest": {
    "number": 123,
    "title": "Add new authentication feature",
    "author": "developer",
    "changedFiles": 8,
    "additions": 245,
    "deletions": 12
  },
  "review": {
    "overallScore": 8.5,
    "suggestions": [
      {
        "file": "src/auth/AuthService.ts",
        "line": 45,
        "type": "improvement",
        "message": "Consider adding input validation for the username parameter",
        "suggestion": "if (!username || username.trim().length === 0) throw new Error('Username is required');",
        "severity": "medium"
      }
    ],
    "documentation": {
      "generated": true,
      "updatedFiles": ["src/auth/AuthService.ts"]
    },
    "qualityMetrics": {
      "complexityIncrease": 2.3,
      "maintainabilityScore": 8.2,
      "testCoverage": 85.5
    }
  }
}
```

### PR Comment Integration

```javascript
// Post analysis results as PR comments
const commentResult = await codeExplain.github.postPRComment({
  owner: 'user',
  repo: 'project',
  pullNumber: 123,
  comment: `
## Code Analysis Results

### Quality Score: 8.5/10
- **Maintainability**: Good
- **Performance**: Excellent
- **Security**: Good

### Suggestions:
1. Add input validation for username parameter
2. Consider using React.memo for the UserCard component
3. Add error handling for API calls

### Documentation:
- Generated documentation for AuthService
- Updated README with new features
  `,
  options: {
    markdown: true,
    sticky: true
  }
});
```

### Status Checks

```javascript
// Create status checks for PRs
const statusCheck = await codeExplain.github.createStatusCheck({
  owner: 'user',
  repo: 'project',
  sha: 'abc123def456',
  state: 'success',
  description: 'Code analysis passed with score 8.5/10',
  context: 'codeexplain/analysis',
  targetUrl: 'https://app.codeexplain.com/analysis/123'
});
```

## Issue Integration

### Issue Analysis

```javascript
// Analyze code mentioned in GitHub issues
const issueAnalysis = await codeExplain.github.analyzeIssue({
  owner: 'user',
  repo: 'project',
  issueNumber: 456,
  options: {
    analyzeCodeBlocks: true,
    generateSuggestions: true,
    createDocumentation: true
  }
});

console.log('Issue Analysis:', issueAnalysis);
```

### Issue Comment Integration

```javascript
// Post analysis results as issue comments
const issueComment = await codeExplain.github.postIssueComment({
  owner: 'user',
  repo: 'project',
  issueNumber: 456,
  comment: `
## Code Analysis for Issue #456

### Problem Analysis:
The issue describes a performance problem in the user authentication flow.

### Suggested Solution:
\`\`\`typescript
// Optimized authentication function
async function authenticateUser(credentials: UserCredentials) {
  // Add caching to reduce database calls
  const cachedUser = await cache.get(credentials.username);
  if (cachedUser) {
    return cachedUser;
  }
  
  // Rest of implementation...
}
\`\`\`

### Performance Impact:
- **Before**: 150ms average response time
- **After**: 45ms average response time (70% improvement)
  `,
  options: {
    markdown: true
  }
});
```

## Webhook Integration

### Webhook Handler

```javascript
// Handle GitHub webhooks
app.post('/webhooks/github', (req, res) => {
  const event = req.headers['x-github-event'];
  const payload = req.body;
  
  switch (event) {
    case 'pull_request':
      handlePullRequestEvent(payload);
      break;
    case 'issues':
      handleIssueEvent(payload);
      break;
    case 'push':
      handlePushEvent(payload);
      break;
  }
  
  res.status(200).send('OK');
});

async function handlePullRequestEvent(payload) {
  if (payload.action === 'opened' || payload.action === 'synchronize') {
    const analysis = await codeExplain.github.reviewPullRequest({
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
      pullNumber: payload.pull_request.number,
      options: {
        generateComments: true,
        qualityMetrics: true
      }
    });
    
    console.log('PR Analysis completed:', analysis);
  }
}
```

### Webhook Events

```javascript
// Supported webhook events
const webhookEvents = {
  'pull_request': {
    'opened': 'Analyze new pull request',
    'synchronize': 'Re-analyze updated pull request',
    'closed': 'Archive analysis results'
  },
  'issues': {
    'opened': 'Analyze new issue',
    'edited': 'Re-analyze updated issue',
    'closed': 'Archive issue analysis'
  },
  'push': {
    'default': 'Analyze pushed changes'
  },
  'repository': {
    'created': 'Initialize repository analysis',
    'deleted': 'Clean up repository data'
  }
};
```

## GitHub Actions Integration

### Workflow Configuration

```yaml
# .github/workflows/codeexplain.yml
name: Code Explain Analysis

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      
      - name: Code Explain Analysis
        uses: codeexplain/github-action@v1
        with:
          api-key: ${{ secrets.CODEEXPLAIN_API_KEY }}
          github-token: ${{ secrets.GITHUB_TOKEN }}
          generate-docs: true
          quality-metrics: true
          post-comments: true
          create-status-checks: true
```

### Custom GitHub Action

```yaml
# Custom action for specific analysis
name: Custom Analysis

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  custom-analysis:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run Custom Analysis
        run: |
          npx codeexplain github analyze \
            --owner ${{ github.repository_owner }} \
            --repo ${{ github.event.repository.name }} \
            --pr ${{ github.event.number }} \
            --generate-docs \
            --quality-metrics \
            --post-comments
        env:
          CODEEXPLAIN_API_KEY: ${{ secrets.CODEEXPLAIN_API_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Organization Features

### Team Analysis

```javascript
// Analyze all repositories in an organization
const orgAnalysis = await codeExplain.github.analyzeOrganization({
  org: 'facebook',
  options: {
    includePrivate: false,
    generateDocs: true,
    qualityMetrics: true,
    teamMetrics: true
  }
});

console.log('Organization Analysis:', orgAnalysis);
```

### Team Metrics

```javascript
// Get team-wide metrics
const teamMetrics = await codeExplain.github.getTeamMetrics({
  org: 'company',
  timeRange: 'last_30_days',
  metrics: ['code_quality', 'documentation', 'test_coverage']
});

console.log('Team Metrics:', teamMetrics);
```

**Team Metrics Response:**
```json
{
  "organization": "company",
  "timeRange": "last_30_days",
  "metrics": {
    "code_quality": {
      "average": 8.2,
      "trend": "upward",
      "repositories": 15
    },
    "documentation": {
      "coverage": 76.5,
      "trend": "upward",
      "generated": 234
    },
    "test_coverage": {
      "average": 82.3,
      "trend": "stable",
      "repositories": 15
    }
  },
  "topPerformers": [
    {
      "repository": "frontend-app",
      "score": 9.1,
      "improvement": 12.5
    }
  ]
}
```

## Configuration

### GitHub App Settings

```javascript
const githubConfig = {
  // App configuration
  appId: 'your-github-app-id',
  privateKey: 'your-github-private-key',
  webhookSecret: 'your-webhook-secret',
  
  // Permissions
  permissions: {
    contents: 'read',
    pull_requests: 'write',
    issues: 'write',
    metadata: 'read',
    checks: 'write'
  },
  
  // Webhook events
  events: [
    'pull_request',
    'pull_request_review',
    'issues',
    'push',
    'repository'
  ],
  
  // Analysis settings
  analysis: {
    autoReview: true,
    generateDocs: true,
    qualityMetrics: true,
    postComments: true,
    createStatusChecks: true
  }
};
```

### Repository Settings

```javascript
const repoConfig = {
  // Analysis settings
  analysis: {
    enabled: true,
    autoReview: true,
    generateDocs: true,
    qualityMetrics: true
  },
  
  // File patterns
  patterns: {
    include: ['src/**/*.{ts,tsx,js,jsx}'],
    exclude: ['**/*.test.*', '**/*.spec.*', 'node_modules/**']
  },
  
  // Quality thresholds
  thresholds: {
    minQualityScore: 7.0,
    minTestCoverage: 80.0,
    maxComplexity: 10
  }
};
```

## Best Practices

### Repository Management

1. **Regular Analysis**: Set up automated analysis for all repositories
2. **Quality Gates**: Use status checks to enforce quality standards
3. **Documentation**: Keep documentation up-to-date with code changes
4. **Team Standards**: Establish consistent coding standards across teams

### Pull Request Workflow

1. **Automated Reviews**: Enable automated PR reviews for all repositories
2. **Quality Metrics**: Track quality metrics over time
3. **Documentation Updates**: Automatically update documentation for changed code
4. **Status Checks**: Use status checks to prevent merging low-quality code

### Issue Management

1. **Code Analysis**: Analyze code mentioned in issues
2. **Solution Suggestions**: Provide code suggestions for issue resolution
3. **Progress Tracking**: Track issue resolution progress
4. **Documentation**: Generate documentation from issue context

## Troubleshooting

### Common Issues

**Authentication Errors**
- Verify GitHub App installation and permissions
- Check API key and private key configuration
- Ensure webhook secret is correct

**Webhook Issues**
- Verify webhook URL is accessible
- Check webhook secret validation
- Ensure proper event subscription

**Analysis Failures**
- Check repository access permissions
- Verify file patterns and exclusions
- Review rate limiting settings

### Debug Mode

Enable debug mode for detailed GitHub integration logs:

```bash
export CODEEXPLAIN_DEBUG=true
export GITHUB_DEBUG=true
```

## Support

- **GitHub Integration Guide**: [https://docs.codeexplain.com/github](https://docs.codeexplain.com/github)
- **GitHub App Marketplace**: [https://github.com/marketplace/codeexplain](https://github.com/marketplace/codeexplain)
- **Support Email**: github-support@codeexplain.com
- **Discord**: [https://discord.gg/codeexplain](https://discord.gg/codeexplain)
