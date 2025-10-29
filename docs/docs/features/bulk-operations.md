# Bulk Operations

Code Explain's Bulk Operations feature allows you to analyze multiple files, repositories, or codebases simultaneously, providing efficient processing for large-scale code analysis and documentation generation.

## Overview

Bulk Operations provide:
- **Parallel Processing**: Analyze multiple items simultaneously
- **Batch Management**: Organize and track large analysis jobs
- **Progress Monitoring**: Real-time progress tracking for bulk operations
- **Resource Optimization**: Efficient resource usage for large-scale operations
- **Error Handling**: Robust error handling and recovery for bulk operations

## Key Features

### Multi-Item Analysis
- **File Analysis**: Analyze multiple files in a single operation
- **Repository Analysis**: Process multiple repositories simultaneously
- **Mixed Operations**: Combine files and repositories in one batch
- **Dependency Analysis**: Analyze related files together for better context

### Parallel Processing
- **Concurrent Execution**: Process multiple items in parallel
- **Resource Management**: Intelligent resource allocation and throttling
- **Queue Management**: Priority-based processing queues
- **Load Balancing**: Distribute load across available resources

### Progress Tracking
- **Real-time Updates**: Live progress updates via WebSocket
- **Detailed Status**: Individual item status and completion tracking
- **Error Reporting**: Detailed error information for failed items
- **Resume Capability**: Resume interrupted bulk operations

## Usage

### Basic Bulk Analysis

```javascript
import { CodeExplain } from '@codeexplain/sdk';

const codeExplain = new CodeExplain({
  apiKey: 'your-api-key'
});

// Analyze multiple files
const bulkAnalysis = await codeExplain.bulkOperations.analyze({
  items: [
    {
      type: 'file',
      path: 'src/components/Button.tsx',
      content: buttonCode
    },
    {
      type: 'file',
      path: 'src/components/Input.tsx',
      content: inputCode
    },
    {
      type: 'file',
      path: 'src/utils/helpers.ts',
      content: helpersCode
    }
  ],
  options: {
    generateDocs: true,
    qualityMetrics: true,
    parallel: true,
    maxConcurrent: 3
  }
});

console.log('Bulk Analysis ID:', bulkAnalysis.id);
```

**Response:**
```json
{
  "id": "bulk_analysis_123",
  "status": "processing",
  "totalItems": 3,
  "completedItems": 0,
  "failedItems": 0,
  "estimatedCompletion": "2024-01-15T10:35:00Z",
  "items": [
    {
      "id": "item_1",
      "type": "file",
      "path": "src/components/Button.tsx",
      "status": "pending"
    },
    {
      "id": "item_2",
      "type": "file",
      "path": "src/components/Input.tsx",
      "status": "pending"
    },
    {
      "id": "item_3",
      "type": "file",
      "path": "src/utils/helpers.ts",
      "status": "pending"
    }
  ]
}
```

### Repository Bulk Analysis

```javascript
// Analyze multiple repositories
const repoBulkAnalysis = await codeExplain.bulkOperations.analyze({
  items: [
    {
      type: 'repository',
      url: 'https://github.com/facebook/react',
      branch: 'main',
      includeTests: true
    },
    {
      type: 'repository',
      url: 'https://github.com/vuejs/vue',
      branch: 'main',
      includeTests: true
    },
    {
      type: 'repository',
      url: 'https://github.com/angular/angular',
      branch: 'main',
      includeTests: true
    }
  ],
  options: {
    parallel: true,
    maxConcurrent: 2,
    analysisOptions: {
      generateDocs: true,
      qualityMetrics: true,
      architectureDiagrams: true
    }
  }
});
```

### Mixed Operations

```javascript
// Combine files and repositories
const mixedBulkAnalysis = await codeExplain.bulkOperations.analyze({
  items: [
    {
      type: 'file',
      path: 'src/components/Button.tsx',
      content: buttonCode
    },
    {
      type: 'repository',
      url: 'https://github.com/user/project',
      branch: 'main'
    },
    {
      type: 'directory',
      path: 'src/utils',
      files: ['helper1.ts', 'helper2.ts', 'helper3.ts']
    }
  ],
  options: {
    parallel: true,
    maxConcurrent: 5,
    dependencyAnalysis: true
  }
});
```

## Progress Monitoring

### Real-time Progress Updates

```javascript
// Monitor bulk operation progress
const progressStream = codeExplain.bulkOperations.watchProgress({
  bulkAnalysisId: 'bulk_analysis_123',
  onUpdate: (update) => {
    console.log(`Progress: ${update.completedItems}/${update.totalItems}`);
    console.log(`Status: ${update.status}`);
    
    // Handle individual item updates
    update.itemUpdates.forEach(itemUpdate => {
      console.log(`Item ${itemUpdate.id}: ${itemUpdate.status}`);
      if (itemUpdate.status === 'completed') {
        console.log('Results:', itemUpdate.results);
      } else if (itemUpdate.status === 'failed') {
        console.log('Error:', itemUpdate.error);
      }
    });
  },
  onComplete: (finalResults) => {
    console.log('Bulk analysis completed!');
    console.log('Summary:', finalResults.summary);
  },
  onError: (error) => {
    console.error('Bulk analysis failed:', error);
  }
});

// Stop monitoring
progressStream.stop();
```

### Progress Query

```javascript
// Get current progress
const progress = await codeExplain.bulkOperations.getProgress({
  bulkAnalysisId: 'bulk_analysis_123'
});

console.log(progress);
```

**Progress Response:**
```json
{
  "id": "bulk_analysis_123",
  "status": "processing",
  "totalItems": 3,
  "completedItems": 2,
  "failedItems": 0,
  "progressPercentage": 66.7,
  "estimatedCompletion": "2024-01-15T10:32:00Z",
  "items": [
    {
      "id": "item_1",
      "status": "completed",
      "completedAt": "2024-01-15T10:30:00Z",
      "results": {
        "qualityScore": 8.5,
        "documentation": "Generated docs..."
      }
    },
    {
      "id": "item_2",
      "status": "completed",
      "completedAt": "2024-01-15T10:31:00Z",
      "results": {
        "qualityScore": 7.8,
        "documentation": "Generated docs..."
      }
    },
    {
      "id": "item_3",
      "status": "processing",
      "startedAt": "2024-01-15T10:31:30Z"
    }
  ]
}
```

## Advanced Features

### Dependency-Aware Analysis

```javascript
// Analyze files with dependency context
const dependencyAnalysis = await codeExplain.bulkOperations.analyze({
  items: [
    {
      type: 'file',
      path: 'src/components/Button.tsx',
      content: buttonCode
    },
    {
      type: 'file',
      path: 'src/components/ButtonGroup.tsx',
      content: buttonGroupCode,
      dependencies: ['src/components/Button.tsx']
    }
  ],
  options: {
    dependencyAnalysis: true,
    contextAware: true,
    parallel: false // Process dependencies first
  }
});
```

### Conditional Processing

```javascript
// Process items based on conditions
const conditionalAnalysis = await codeExplain.bulkOperations.analyze({
  items: fileList,
  options: {
    parallel: true,
    maxConcurrent: 5,
    conditions: {
      // Only analyze files modified in last 7 days
      modifiedAfter: '2024-01-08T00:00:00Z',
      // Only analyze files larger than 1KB
      minSize: 1024,
      // Skip test files
      excludePatterns: ['**/*.test.*', '**/*.spec.*']
    }
  }
});
```

### Batch Scheduling

```javascript
// Schedule bulk operations for later execution
const scheduledBulk = await codeExplain.bulkOperations.schedule({
  items: largeFileList,
  scheduleAt: '2024-01-16T02:00:00Z', // Run at 2 AM
  options: {
    parallel: true,
    maxConcurrent: 10,
    priority: 'low'
  }
});

console.log('Scheduled bulk analysis:', scheduledBulk.id);
```

## Error Handling

### Retry Logic

```javascript
// Configure retry behavior
const bulkAnalysis = await codeExplain.bulkOperations.analyze({
  items: fileList,
  options: {
    parallel: true,
    maxConcurrent: 5,
    retryPolicy: {
      maxRetries: 3,
      retryDelay: 5000, // 5 seconds
      retryOnErrors: ['timeout', 'rate_limit', 'server_error']
    }
  }
});
```

### Error Recovery

```javascript
// Resume failed bulk operation
const resumedAnalysis = await codeExplain.bulkOperations.resume({
  bulkAnalysisId: 'bulk_analysis_123',
  retryFailedItems: true,
  skipCompletedItems: true
});

console.log('Resumed analysis:', resumedAnalysis.id);
```

### Partial Results

```javascript
// Get partial results even if some items failed
const partialResults = await codeExplain.bulkOperations.getResults({
  bulkAnalysisId: 'bulk_analysis_123',
  includeFailed: false // Only return successful results
});

console.log('Successful results:', partialResults.successful);
console.log('Failed items:', partialResults.failed);
```

## Performance Optimization

### Resource Management

```javascript
// Optimize resource usage
const optimizedBulk = await codeExplain.bulkOperations.analyze({
  items: largeFileList,
  options: {
    parallel: true,
    maxConcurrent: 10,
    resourceLimits: {
      maxMemoryPerItem: '512MB',
      maxCpuTimePerItem: '300s',
      maxFileSize: '10MB'
    },
    throttling: {
      requestsPerSecond: 50,
      burstLimit: 100
    }
  }
});
```

### Caching Strategy

```javascript
// Use caching for repeated analysis
const cachedBulk = await codeExplain.bulkOperations.analyze({
  items: fileList,
  options: {
    parallel: true,
    cache: {
      enabled: true,
      ttl: 3600, // 1 hour
      keyStrategy: 'content_hash'
    }
  }
});
```

## Integration Options

### CLI Integration

```bash
# Analyze multiple files via CLI
codeexplain bulk analyze \
  --files "src/**/*.ts" \
  --parallel \
  --max-concurrent 5 \
  --generate-docs \
  --output results.json

# Analyze multiple repositories
codeexplain bulk analyze \
  --repos "https://github.com/user/repo1,https://github.com/user/repo2" \
  --parallel \
  --include-tests \
  --output results.json
```

### CI/CD Integration

```yaml
# GitHub Actions workflow
name: Bulk Code Analysis
on:
  push:
    branches: [main]

jobs:
  bulk-analysis:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Bulk Analysis
        run: |
          codeexplain bulk analyze \
            --files "src/**/*.{ts,tsx}" \
            --parallel \
            --generate-docs \
            --quality-metrics \
            --output analysis-results.json
      
      - name: Upload Results
        uses: actions/upload-artifact@v2
        with:
          name: analysis-results
          path: analysis-results.json
```

### Webhook Integration

```javascript
// Configure webhooks for bulk operation events
const webhook = await codeExplain.webhooks.create({
  url: 'https://your-app.com/webhooks/bulk-analysis',
  events: [
    'bulk_analysis.started',
    'bulk_analysis.progress',
    'bulk_analysis.completed',
    'bulk_analysis.failed'
  ],
  secret: 'your-webhook-secret'
});

// Webhook payload example
{
  "event": "bulk_analysis.progress",
  "data": {
    "bulkAnalysisId": "bulk_analysis_123",
    "status": "processing",
    "progressPercentage": 45.2,
    "completedItems": 23,
    "totalItems": 51
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Configuration

### Bulk Operation Settings

```javascript
const bulkConfig = {
  // Processing options
  parallel: true,
  maxConcurrent: 10,
  
  // Analysis options
  analysisOptions: {
    generateDocs: true,
    qualityMetrics: true,
    architectureDiagrams: true,
    includeTests: true
  },
  
  // Resource limits
  resourceLimits: {
    maxMemoryPerItem: '1GB',
    maxCpuTimePerItem: '600s',
    maxFileSize: '50MB'
  },
  
  // Error handling
  retryPolicy: {
    maxRetries: 3,
    retryDelay: 5000,
    retryOnErrors: ['timeout', 'rate_limit']
  },
  
  // Caching
  cache: {
    enabled: true,
    ttl: 3600,
    keyStrategy: 'content_hash'
  }
};
```

### Queue Configuration

```javascript
const queueConfig = {
  // Queue settings
  priority: 'normal', // 'low', 'normal', 'high', 'urgent'
  maxQueueSize: 1000,
  queueTimeout: 3600, // 1 hour
  
  // Processing settings
  batchSize: 10,
  processingInterval: 1000, // 1 second
  
  // Resource management
  resourceAllocation: {
    cpu: 0.8, // 80% CPU usage
    memory: 0.7, // 70% memory usage
    network: 0.5 // 50% network bandwidth
  }
};
```

## Best Practices

### Efficient Bulk Operations

1. **Batch Similar Items**: Group similar files or repositories together
2. **Use Parallel Processing**: Enable parallel processing for better performance
3. **Set Appropriate Limits**: Configure resource limits based on your system
4. **Monitor Progress**: Use progress monitoring to track long-running operations
5. **Handle Errors Gracefully**: Implement proper error handling and retry logic

### Resource Management

1. **Monitor Resource Usage**: Keep track of CPU, memory, and network usage
2. **Throttle Requests**: Use throttling to avoid overwhelming the API
3. **Use Caching**: Enable caching for repeated analysis of unchanged files
4. **Optimize Concurrency**: Balance parallel processing with resource constraints

### Error Handling

1. **Implement Retry Logic**: Use exponential backoff for failed requests
2. **Handle Partial Failures**: Process successful items even if some fail
3. **Log Errors**: Maintain detailed logs for debugging
4. **Resume Operations**: Use resume capability for interrupted operations

## Troubleshooting

### Common Issues

**Memory Issues**
- Reduce `maxConcurrent` setting
- Increase `maxMemoryPerItem` limit
- Process smaller batches

**Timeout Errors**
- Increase `maxCpuTimePerItem` limit
- Reduce file sizes
- Use sequential processing for large files

**Rate Limiting**
- Implement request throttling
- Use lower concurrency settings
- Enable caching to reduce requests

### Debug Mode

Enable debug mode for detailed bulk operation logs:

```bash
export CODEEXPLAIN_DEBUG=true
export BULK_DEBUG=true
```

## Support

- **Bulk Operations Guide**: [https://docs.codeexplain.com/bulk-operations](https://docs.codeexplain.com/bulk-operations)
- **Performance Tips**: [https://docs.codeexplain.com/performance](https://docs.codeexplain.com/performance)
- **Support Email**: bulk-support@codeexplain.com
- **Discord**: [https://discord.gg/codeexplain](https://discord.gg/codeexplain)
