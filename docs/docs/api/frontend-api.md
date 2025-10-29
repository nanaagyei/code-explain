# Frontend API Reference

The Code Explain frontend API provides client-side integration capabilities for web applications, including real-time analysis, interactive documentation, and seamless GitHub/GitLab integration.

## Overview

The frontend API is designed for browser-based applications and provides:
- Real-time code analysis
- Interactive documentation generation
- GitHub/GitLab repository integration
- WebSocket connections for live updates
- Client-side SDKs for popular frameworks

## Base Configuration

### CDN Integration

```html
<!-- Core SDK -->
<script src="https://cdn.codeexplain.com/sdk/v1/codeexplain.min.js"></script>

<!-- React Integration -->
<script src="https://cdn.codeexplain.com/sdk/v1/react.min.js"></script>

<!-- Vue Integration -->
<script src="https://cdn.codeexplain.com/sdk/v1/vue.min.js"></script>
```

### NPM Packages

```bash
# Core SDK
npm install @codeexplain/frontend-sdk

# React Integration
npm install @codeexplain/react

# Vue Integration
npm install @codeexplain/vue

# Angular Integration
npm install @codeexplain/angular
```

## Core SDK

### Initialization

```javascript
import { CodeExplain } from '@codeexplain/frontend-sdk';

const codeExplain = new CodeExplain({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.codeexplain.com/v1',
  options: {
    realTimeAnalysis: true,
    autoSave: true,
    theme: 'dark'
  }
});
```

### Configuration Options

```javascript
const config = {
  apiKey: 'string',           // Required: Your API key
  baseUrl: 'string',          // API base URL
  realTimeAnalysis: boolean,  // Enable real-time analysis
  autoSave: boolean,          // Auto-save analysis results
  theme: 'light' | 'dark',    // UI theme
  language: 'en',             // Interface language
  debug: boolean,             // Enable debug logging
  cache: {
    enabled: boolean,         // Enable caching
    ttl: number              // Cache TTL in seconds
  }
};
```

## Real-Time Analysis

### WebSocket Connection

```javascript
const ws = codeExplain.connectWebSocket({
  onAnalysisComplete: (result) => {
    console.log('Analysis complete:', result);
  },
  onError: (error) => {
    console.error('Analysis error:', error);
  },
  onProgress: (progress) => {
    console.log('Progress:', progress.percentage);
  }
});
```

### Live Code Analysis

```javascript
// Analyze code as user types
const analyzer = codeExplain.createLiveAnalyzer({
  debounceMs: 500,
  onResult: (analysis) => {
    updateUI(analysis);
  }
});

// Start analyzing
analyzer.start();

// Update code content
analyzer.updateCode(`
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}
`);

// Stop analyzing
analyzer.stop();
```

## Repository Integration

### GitHub Integration

```javascript
// Authenticate with GitHub
const githubAuth = await codeExplain.github.authenticate({
  clientId: 'your-github-client-id',
  scopes: ['repo', 'read:user']
});

// Load repository
const repo = await codeExplain.github.loadRepository({
  owner: 'facebook',
  repo: 'react',
  branch: 'main'
});

// Analyze repository
const analysis = await repo.analyze({
  includeTests: true,
  generateDocs: true,
  qualityMetrics: true
});
```

### GitLab Integration

```javascript
// Authenticate with GitLab
const gitlabAuth = await codeExplain.gitlab.authenticate({
  clientId: 'your-gitlab-client-id',
  scopes: ['read_api', 'read_repository']
});

// Load repository
const repo = await codeExplain.gitlab.loadRepository({
  projectId: '12345',
  branch: 'main'
});
```

## Interactive Documentation

### Documentation Generator

```javascript
const docGenerator = codeExplain.createDocGenerator({
  style: 'jsdoc',           // Documentation style
  includeExamples: true,     // Include code examples
  includeTypes: true,       // Include TypeScript types
  interactive: true         // Enable interactive features
});

// Generate documentation
const docs = await docGenerator.generate({
  code: `
    /**
     * Calculates the total price of items
     * @param {Array} items - Array of items
     * @returns {number} Total price
     */
    function calculateTotal(items) {
      return items.reduce((sum, item) => sum + item.price, 0);
    }
  `,
  language: 'javascript'
});

// Render documentation
docGenerator.render(docs, '#documentation-container');
```

### Documentation Components

```javascript
// Create interactive documentation component
const docComponent = codeExplain.createDocComponent({
  container: '#docs-container',
  features: {
    syntaxHighlighting: true,
    codeExecution: true,
    parameterTooltips: true,
    exampleRunner: true
  }
});

// Load documentation
docComponent.load(docs);
```

## React Integration

### React Hook

```jsx
import { useCodeAnalysis } from '@codeexplain/react';

function CodeEditor() {
  const { analysis, analyze, loading, error } = useCodeAnalysis({
    apiKey: 'your-api-key',
    options: {
      realTime: true,
      generateDocs: true
    }
  });

  const handleCodeChange = (code) => {
    analyze(code);
  };

  return (
    <div>
      <textarea onChange={(e) => handleCodeChange(e.target.value)} />
      {loading && <div>Analyzing...</div>}
      {error && <div>Error: {error.message}</div>}
      {analysis && (
        <div>
          <h3>Analysis Results</h3>
          <pre>{JSON.stringify(analysis, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
```

### React Components

```jsx
import { 
  CodeAnalyzer, 
  DocumentationViewer, 
  QualityMetrics 
} from '@codeexplain/react';

function App() {
  return (
    <div>
      <CodeAnalyzer
        apiKey="your-api-key"
        onAnalysisComplete={(result) => console.log(result)}
      />
      
      <DocumentationViewer
        docs={generatedDocs}
        interactive={true}
      />
      
      <QualityMetrics
        metrics={qualityData}
        showTrends={true}
      />
    </div>
  );
}
```

## Vue Integration

### Vue Composable

```vue
<template>
  <div>
    <textarea v-model="code" @input="analyzeCode" />
    <div v-if="loading">Analyzing...</div>
    <div v-if="error">Error: {{ error.message }}</div>
    <div v-if="analysis">
      <h3>Analysis Results</h3>
      <pre>{{ JSON.stringify(analysis, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useCodeAnalysis } from '@codeexplain/vue';

const code = ref('');
const { analysis, analyze, loading, error } = useCodeAnalysis({
  apiKey: 'your-api-key'
});

const analyzeCode = () => {
  analyze(code.value);
};
</script>
```

### Vue Components

```vue
<template>
  <div>
    <CodeAnalyzer
      :api-key="apiKey"
      @analysis-complete="handleAnalysisComplete"
    />
    
    <DocumentationViewer
      :docs="docs"
      :interactive="true"
    />
  </div>
</template>

<script setup>
import { CodeAnalyzer, DocumentationViewer } from '@codeexplain/vue';

const apiKey = 'your-api-key';
const docs = ref(null);

const handleAnalysisComplete = (result) => {
  docs.value = result.documentation;
};
</script>
```

## Angular Integration

### Angular Service

```typescript
import { Injectable } from '@angular/core';
import { CodeExplainService } from '@codeexplain/angular';

@Injectable({
  providedIn: 'root'
})
export class MyService {
  constructor(private codeExplain: CodeExplainService) {}

  async analyzeCode(code: string) {
    return this.codeExplain.analyze({
      code,
      options: {
        generateDocs: true,
        qualityMetrics: true
      }
    });
  }
}
```

### Angular Component

```typescript
import { Component } from '@angular/core';
import { CodeAnalyzerComponent } from '@codeexplain/angular';

@Component({
  selector: 'app-code-editor',
  template: `
    <codeexplain-analyzer
      [apiKey]="apiKey"
      (analysisComplete)="onAnalysisComplete($event)">
    </codeexplain-analyzer>
  `,
  imports: [CodeAnalyzerComponent]
})
export class CodeEditorComponent {
  apiKey = 'your-api-key';

  onAnalysisComplete(result: any) {
    console.log('Analysis complete:', result);
  }
}
```

## Browser Extensions

### Chrome Extension

```javascript
// manifest.json
{
  "manifest_version": 3,
  "name": "Code Explain",
  "permissions": ["activeTab", "storage"],
  "content_scripts": [{
    "matches": ["https://github.com/*", "https://gitlab.com/*"],
    "js": ["content.js"]
  }]
}

// content.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyzeCode') {
    const codeExplain = new CodeExplain({
      apiKey: request.apiKey
    });
    
    codeExplain.analyzeFile({
      fileContent: request.code,
      language: request.language
    }).then(sendResponse);
  }
});
```

## Error Handling

### Error Types

```javascript
try {
  const result = await codeExplain.analyze(code);
} catch (error) {
  if (error instanceof CodeExplainError) {
    switch (error.code) {
      case 'AUTHENTICATION_FAILED':
        // Handle auth error
        break;
      case 'RATE_LIMIT_EXCEEDED':
        // Handle rate limit
        break;
      case 'ANALYSIS_FAILED':
        // Handle analysis error
        break;
    }
  }
}
```

### Error Recovery

```javascript
const analyzer = codeExplain.createLiveAnalyzer({
  onError: (error) => {
    if (error.code === 'RATE_LIMIT_EXCEEDED') {
      // Implement exponential backoff
      setTimeout(() => analyzer.retry(), 5000);
    }
  },
  retryPolicy: {
    maxRetries: 3,
    backoffMs: 1000
  }
});
```

## Performance Optimization

### Caching

```javascript
const codeExplain = new CodeExplain({
  cache: {
    enabled: true,
    ttl: 3600, // 1 hour
    maxSize: 100 // Max 100 cached analyses
  }
});
```

### Lazy Loading

```javascript
// Load SDK components on demand
const loadAnalyzer = async () => {
  const { CodeAnalyzer } = await import('@codeexplain/react/analyzer');
  return CodeAnalyzer;
};
```

### Web Workers

```javascript
// Run analysis in web worker
const worker = new Worker('/codeexplain-worker.js');
worker.postMessage({
  action: 'analyze',
  code: code,
  options: options
});

worker.onmessage = (event) => {
  const result = event.data;
  updateUI(result);
};
```

## Testing

### Unit Testing

```javascript
import { CodeExplain } from '@codeexplain/frontend-sdk';

// Mock API responses
jest.mock('@codeexplain/frontend-sdk', () => ({
  CodeExplain: jest.fn().mockImplementation(() => ({
    analyze: jest.fn().mockResolvedValue({
      quality: 'good',
      suggestions: []
    })
  }))
}));

test('analyzes code correctly', async () => {
  const codeExplain = new CodeExplain({ apiKey: 'test-key' });
  const result = await codeExplain.analyze('const x = 1;');
  
  expect(result.quality).toBe('good');
});
```

### Integration Testing

```javascript
// Test with real API (use test endpoints)
const codeExplain = new CodeExplain({
  apiKey: 'test-api-key',
  baseUrl: 'https://test-api.codeexplain.com/v1'
});
```

## Browser Support

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 90+ | Full |
| Firefox | 88+ | Full |
| Safari | 14+ | Full |
| Edge | 90+ | Full |
| IE | 11 | Limited |

## Security Considerations

### Content Security Policy

```html
<meta http-equiv="Content-Security-Policy" 
      content="script-src 'self' https://cdn.codeexplain.com; 
               connect-src 'self' https://api.codeexplain.com;">
```

### API Key Security

```javascript
// Never expose API keys in client-side code
// Use environment variables or secure configuration
const apiKey = process.env.REACT_APP_CODEEXPLAIN_API_KEY;
```

## Support

- **Documentation**: [https://docs.codeexplain.com/frontend](https://docs.codeexplain.com/frontend)
- **Examples**: [https://github.com/codeexplain/examples](https://github.com/codeexplain/examples)
- **Support**: frontend-support@codeexplain.com
- **Discord**: [https://discord.gg/codeexplain](https://discord.gg/codeexplain)
