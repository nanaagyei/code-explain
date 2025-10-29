# Testing

Code Explain employs a comprehensive testing strategy to ensure reliability, performance, and maintainability. This document covers our testing philosophy, testing types, and implementation guidelines.

## Overview

Our testing strategy includes:
- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test component interactions
- **End-to-End Tests**: Test complete user workflows
- **Performance Tests**: Test system performance under load
- **Security Tests**: Test security vulnerabilities
- **API Tests**: Test API endpoints and contracts

## Testing Philosophy

### Testing Principles

1. **Test-Driven Development (TDD)**: Write tests before implementing features
2. **Behavior-Driven Development (BDD)**: Focus on user behavior and requirements
3. **Comprehensive Coverage**: Aim for high test coverage across all components
4. **Fast Feedback**: Tests should run quickly and provide immediate feedback
5. **Reliable Tests**: Tests should be deterministic and not flaky
6. **Maintainable Tests**: Tests should be easy to understand and maintain

### Testing Pyramid

```
        /\
       /  \
      / E2E \     <- Few, slow, expensive
     /______\
    /        \
   /Integration\ <- Some, medium speed/cost
  /____________\
 /              \
/    Unit Tests   \ <- Many, fast, cheap
/__________________\
```

## Unit Testing

### Frontend Unit Tests (Jest + React Testing Library)

```typescript
// Component testing example
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CodeAnalyzer } from '../CodeAnalyzer';

describe('CodeAnalyzer', () => {
  it('should render code input field', () => {
    render(<CodeAnalyzer />);
    expect(screen.getByLabelText(/code input/i)).toBeInTheDocument();
  });
  
  it('should analyze code when submit button is clicked', async () => {
    const mockAnalyze = jest.fn().mockResolvedValue({
      complexity: 5,
      suggestions: ['Consider using const instead of let']
    });
    
    render(<CodeAnalyzer onAnalyze={mockAnalyze} />);
    
    const codeInput = screen.getByLabelText(/code input/i);
    const submitButton = screen.getByRole('button', { name: /analyze/i });
    
    fireEvent.change(codeInput, { target: { value: 'let x = 1;' } });
    fireEvent.click(submitButton);
    
    await screen.findByText('Complexity: 5');
    expect(mockAnalyze).toHaveBeenCalledWith('let x = 1;');
  });
  
  it('should display loading state during analysis', async () => {
    const mockAnalyze = jest.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );
    
    render(<CodeAnalyzer onAnalyze={mockAnalyze} />);
    
    const submitButton = screen.getByRole('button', { name: /analyze/i });
    fireEvent.click(submitButton);
    
    expect(screen.getByText(/analyzing/i)).toBeInTheDocument();
  });
});
```

### Backend Unit Tests (Jest)

```typescript
// Service testing example
import { AnalysisService } from '../services/AnalysisService';
import { CacheService } from '../services/CacheService';
import { QueueService } from '../services/QueueService';

describe('AnalysisService', () => {
  let analysisService: AnalysisService;
  let mockCacheService: jest.Mocked<CacheService>;
  let mockQueueService: jest.Mocked<QueueService>;
  
  beforeEach(() => {
    mockCacheService = {
      get: jest.fn(),
      set: jest.fn()
    } as any;
    
    mockQueueService = {
      enqueue: jest.fn(),
      getResult: jest.fn()
    } as any;
    
    analysisService = new AnalysisService(mockCacheService, mockQueueService);
  });
  
  describe('analyzeCode', () => {
    it('should return cached result if available', async () => {
      const cachedResult = { complexity: 5, suggestions: [] };
      mockCacheService.get.mockResolvedValue(cachedResult);
      
      const result = await analysisService.analyzeCode({
        code: 'function test() { return 1; }',
        language: 'javascript'
      });
      
      expect(result).toEqual(cachedResult);
      expect(mockCacheService.get).toHaveBeenCalledWith('hash_of_code');
    });
    
    it('should enqueue analysis job if not cached', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockQueueService.enqueue.mockResolvedValue({ id: 'job_123' });
      
      const result = await analysisService.analyzeCode({
        code: 'function test() { return 1; }',
        language: 'javascript'
      });
      
      expect(result).toEqual({ jobId: 'job_123', status: 'processing' });
      expect(mockQueueService.enqueue).toHaveBeenCalledWith('analysis', expect.any(Object));
    });
    
    it('should handle analysis errors gracefully', async () => {
      mockCacheService.get.mockRejectedValue(new Error('Cache error'));
      
      await expect(analysisService.analyzeCode({
        code: 'invalid code',
        language: 'javascript'
      })).rejects.toThrow('Cache error');
    });
  });
});
```

### Python Unit Tests (pytest)

```python
# AI service testing example
import pytest
from unittest.mock import Mock, patch
from src.services.ai_service import AIService
from src.analyzer.code_analyzer import CodeAnalyzer

class TestAIService:
    def setup_method(self):
        self.ai_service = AIService()
        self.mock_analyzer = Mock(spec=CodeAnalyzer)
        self.ai_service.code_analyzer = self.mock_analyzer
    
    def test_analyze_code_success(self):
        # Arrange
        code = "def hello():\n    return 'world'"
        expected_result = {
            'complexity': 1,
            'suggestions': ['Consider adding type hints'],
            'quality_score': 8.5
        }
        self.mock_analyzer.analyze.return_value = expected_result
        
        # Act
        result = self.ai_service.analyze_code(code, 'python')
        
        # Assert
        assert result == expected_result
        self.mock_analyzer.analyze.assert_called_once_with(code, 'python')
    
    def test_analyze_code_with_invalid_syntax(self):
        # Arrange
        invalid_code = "def hello(\n    return 'world'"
        self.mock_analyzer.analyze.side_effect = SyntaxError("Invalid syntax")
        
        # Act & Assert
        with pytest.raises(SyntaxError):
            self.ai_service.analyze_code(invalid_code, 'python')
    
    @patch('src.services.ai_service.time')
    def test_analyze_code_performance_tracking(self, mock_time):
        # Arrange
        mock_time.time.side_effect = [0, 1.5]  # 1.5 seconds elapsed
        self.mock_analyzer.analyze.return_value = {'complexity': 1}
        
        # Act
        result = self.ai_service.analyze_code("def test(): pass", 'python')
        
        # Assert
        assert result['duration'] == 1.5
        assert result['complexity'] == 1
```

## Integration Testing

### API Integration Tests

```typescript
// API integration test example
import request from 'supertest';
import app from '../src/app';
import { DatabaseService } from '../src/services/DatabaseService';

describe('API Integration Tests', () => {
  let db: DatabaseService;
  
  beforeAll(async () => {
    db = new DatabaseService();
    await db.connect();
  });
  
  afterAll(async () => {
    await db.disconnect();
  });
  
  beforeEach(async () => {
    await db.clearTestData();
  });
  
  describe('POST /api/analyze', () => {
    it('should analyze code and return results', async () => {
      const response = await request(app)
        .post('/api/analyze')
        .set('Authorization', 'Bearer valid-token')
        .send({
          code: 'function test() { return 1; }',
          language: 'javascript',
          options: {
            generateDocs: true,
            qualityMetrics: true
          }
        })
        .expect(200);
      
      expect(response.body).toHaveProperty('analysis');
      expect(response.body.analysis).toHaveProperty('complexity');
      expect(response.body.analysis).toHaveProperty('documentation');
      expect(response.body.analysis).toHaveProperty('qualityMetrics');
    });
    
    it('should return 401 for invalid token', async () => {
      await request(app)
        .post('/api/analyze')
        .set('Authorization', 'Bearer invalid-token')
        .send({
          code: 'function test() { return 1; }',
          language: 'javascript'
        })
        .expect(401);
    });
    
    it('should return 400 for invalid input', async () => {
      await request(app)
        .post('/api/analyze')
        .set('Authorization', 'Bearer valid-token')
        .send({
          code: '',
          language: 'javascript'
        })
        .expect(400);
    });
  });
  
  describe('GET /api/analyses/:id', () => {
    it('should return analysis result by ID', async () => {
      // Create analysis first
      const createResponse = await request(app)
        .post('/api/analyze')
        .set('Authorization', 'Bearer valid-token')
        .send({
          code: 'function test() { return 1; }',
          language: 'javascript'
        });
      
      const analysisId = createResponse.body.id;
      
      // Get analysis result
      const response = await request(app)
        .get(`/api/analyses/${analysisId}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
      
      expect(response.body).toHaveProperty('id', analysisId);
      expect(response.body).toHaveProperty('status', 'completed');
    });
  });
});
```

### Database Integration Tests

```typescript
// Database integration test example
import { DatabaseService } from '../src/services/DatabaseService';
import { Analysis } from '../src/models/Analysis';

describe('Database Integration Tests', () => {
  let db: DatabaseService;
  
  beforeAll(async () => {
    db = new DatabaseService();
    await db.connect();
  });
  
  afterAll(async () => {
    await db.disconnect();
  });
  
  beforeEach(async () => {
    await db.clearTestData();
  });
  
  describe('Analysis CRUD Operations', () => {
    it('should create and retrieve analysis', async () => {
      const analysisData = {
        userId: 'user_123',
        codeHash: 'hash_456',
        language: 'javascript',
        status: 'completed',
        result: { complexity: 5 }
      };
      
      const created = await db.analyses.create(analysisData);
      expect(created).toHaveProperty('id');
      
      const retrieved = await db.analyses.findById(created.id);
      expect(retrieved).toEqual(expect.objectContaining(analysisData));
    });
    
    it('should update analysis status', async () => {
      const analysis = await db.analyses.create({
        userId: 'user_123',
        codeHash: 'hash_456',
        language: 'javascript',
        status: 'pending'
      });
      
      await db.analyses.updateStatus(analysis.id, 'completed');
      
      const updated = await db.analyses.findById(analysis.id);
      expect(updated.status).toBe('completed');
    });
    
    it('should find analyses by user', async () => {
      await db.analyses.create({
        userId: 'user_123',
        codeHash: 'hash_1',
        language: 'javascript',
        status: 'completed'
      });
      
      await db.analyses.create({
        userId: 'user_123',
        codeHash: 'hash_2',
        language: 'typescript',
        status: 'completed'
      });
      
      const userAnalyses = await db.analyses.findByUser('user_123');
      expect(userAnalyses).toHaveLength(2);
    });
  });
});
```

## End-to-End Testing

### Playwright E2E Tests

```typescript
// E2E test example
import { test, expect } from '@playwright/test';

test.describe('Code Analysis Workflow', () => {
  test('should analyze code and display results', async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3000');
    
    // Wait for the page to load
    await expect(page.locator('h1')).toContainText('Code Explain');
    
    // Enter code in the textarea
    const codeInput = page.locator('[data-testid="code-input"]');
    await codeInput.fill(`
      function calculateTotal(items) {
        return items.reduce((sum, item) => sum + item.price, 0);
      }
    `);
    
    // Select language
    await page.selectOption('[data-testid="language-select"]', 'javascript');
    
    // Click analyze button
    await page.click('[data-testid="analyze-button"]');
    
    // Wait for analysis to complete
    await expect(page.locator('[data-testid="analysis-results"]')).toBeVisible();
    
    // Verify results
    await expect(page.locator('[data-testid="complexity-score"]')).toContainText('2');
    await expect(page.locator('[data-testid="suggestions"]')).toBeVisible();
    await expect(page.locator('[data-testid="documentation"]')).toBeVisible();
  });
  
  test('should handle analysis errors gracefully', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Enter invalid code
    const codeInput = page.locator('[data-testid="code-input"]');
    await codeInput.fill('invalid javascript code');
    
    await page.click('[data-testid="analyze-button"]');
    
    // Verify error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid syntax');
  });
  
  test('should save and load analysis history', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Perform analysis
    const codeInput = page.locator('[data-testid="code-input"]');
    await codeInput.fill('function test() { return 1; }');
    await page.click('[data-testid="analyze-button"]');
    
    // Wait for analysis to complete
    await expect(page.locator('[data-testid="analysis-results"]')).toBeVisible();
    
    // Save analysis
    await page.click('[data-testid="save-analysis"]');
    await expect(page.locator('[data-testid="save-success"]')).toBeVisible();
    
    // Navigate to history
    await page.click('[data-testid="history-tab"]');
    
    // Verify analysis appears in history
    await expect(page.locator('[data-testid="analysis-history"]')).toContainText('function test()');
  });
});
```

## Performance Testing

### Load Testing (Artillery)

```yaml
# artillery-load-test.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
    - duration: 120
      arrivalRate: 50
    - duration: 60
      arrivalRate: 10

scenarios:
  - name: "Code Analysis API"
    weight: 70
    flow:
      - post:
          url: "/api/analyze"
          headers:
            Authorization: "Bearer {{ $randomString() }}"
          json:
            code: "function test() { return {{ $randomInt(1, 100) }}; }"
            language: "javascript"
          capture:
            - json: "$.id"
              as: "analysisId"
      - get:
          url: "/api/analyses/{{ analysisId }}"
          headers:
            Authorization: "Bearer {{ $randomString() }}"
  
  - name: "Documentation Generation"
    weight: 30
    flow:
      - post:
          url: "/api/docs/generate"
          headers:
            Authorization: "Bearer {{ $randomString() }}"
          json:
            code: "class TestClass { method() { return 'test'; } }"
            language: "javascript"
            style: "jsdoc"
```

### Performance Monitoring

```typescript
// Performance monitoring example
import { performance } from 'perf_hooks';

class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  
  startTimer(label: string): void {
    performance.mark(`${label}-start`);
  }
  
  endTimer(label: string): number {
    performance.mark(`${label}-end`);
    performance.measure(label, `${label}-start`, `${label}-end`);
    
    const measure = performance.getEntriesByName(label)[0];
    const duration = measure.duration;
    
    // Store metric
    if (!this.metrics.has(label)) {
      this.metrics.set(label, []);
    }
    this.metrics.get(label)!.push(duration);
    
    return duration;
  }
  
  getAverageTime(label: string): number {
    const times = this.metrics.get(label) || [];
    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }
  
  getMetrics(): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const [label, times] of this.metrics) {
      result[label] = {
        count: times.length,
        average: this.getAverageTime(label),
        min: Math.min(...times),
        max: Math.max(...times),
        p95: this.percentile(times, 95),
        p99: this.percentile(times, 99)
      };
    }
    
    return result;
  }
  
  private percentile(arr: number[], p: number): number {
    const sorted = arr.sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index];
  }
}

// Usage in tests
const monitor = new PerformanceMonitor();

test('API response time should be under 500ms', async () => {
  monitor.startTimer('api-analyze');
  
  const response = await request(app)
    .post('/api/analyze')
    .send({ code: 'function test() { return 1; }', language: 'javascript' });
  
  const duration = monitor.endTimer('api-analyze');
  
  expect(duration).toBeLessThan(500);
  expect(response.status).toBe(200);
});
```

## Security Testing

### Security Test Suite

```typescript
// Security testing example
import request from 'supertest';
import app from '../src/app';

describe('Security Tests', () => {
  describe('Authentication Security', () => {
    it('should reject requests without authentication', async () => {
      await request(app)
        .post('/api/analyze')
        .send({ code: 'test', language: 'javascript' })
        .expect(401);
    });
    
    it('should reject requests with invalid JWT', async () => {
      await request(app)
        .post('/api/analyze')
        .set('Authorization', 'Bearer invalid-jwt')
        .send({ code: 'test', language: 'javascript' })
        .expect(401);
    });
    
    it('should reject requests with expired JWT', async () => {
      const expiredToken = generateExpiredJWT();
      await request(app)
        .post('/api/analyze')
        .set('Authorization', `Bearer ${expiredToken}`)
        .send({ code: 'test', language: 'javascript' })
        .expect(401);
    });
  });
  
  describe('Input Validation', () => {
    it('should sanitize malicious code input', async () => {
      const maliciousCode = `
        <script>alert('xss')</script>
        function test() { 
          eval('malicious code');
          return 1; 
        }
      `;
      
      const response = await request(app)
        .post('/api/analyze')
        .set('Authorization', 'Bearer valid-token')
        .send({ code: maliciousCode, language: 'javascript' })
        .expect(200);
      
      // Verify malicious content is sanitized
      expect(response.body.analysis.code).not.toContain('<script>');
      expect(response.body.analysis.code).not.toContain('eval(');
    });
    
    it('should prevent SQL injection', async () => {
      const sqlInjection = "'; DROP TABLE analyses; --";
      
      await request(app)
        .post('/api/analyze')
        .set('Authorization', 'Bearer valid-token')
        .send({ code: sqlInjection, language: 'sql' })
        .expect(400);
    });
  });
  
  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      const promises = Array(100).fill(null).map(() =>
        request(app)
          .post('/api/analyze')
          .set('Authorization', 'Bearer valid-token')
          .send({ code: 'test', language: 'javascript' })
      );
      
      const responses = await Promise.all(promises);
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});
```

## Test Configuration

### Jest Configuration

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 10000
};
```

### Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    }
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI
  }
});
```

## Running Tests

### Test Commands

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Run performance tests
npm run test:performance

# Run security tests
npm run test:security

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- --testPathPattern=AnalysisService.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should analyze code"
```

### CI/CD Integration

```yaml
# GitHub Actions workflow
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test
          REDIS_URL: redis://localhost:6379
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
```

## Best Practices

### Test Organization

1. **Test Structure**: Follow AAA pattern (Arrange, Act, Assert)
2. **Test Naming**: Use descriptive test names that explain the scenario
3. **Test Isolation**: Each test should be independent and not rely on others
4. **Test Data**: Use factories or builders for test data creation
5. **Mocking**: Mock external dependencies appropriately

### Test Maintenance

1. **Regular Updates**: Keep tests updated with code changes
2. **Refactoring**: Refactor tests when refactoring production code
3. **Performance**: Monitor test execution time and optimize slow tests
4. **Coverage**: Maintain high test coverage but focus on meaningful tests
5. **Documentation**: Document complex test scenarios and setup

### Quality Assurance

1. **Code Reviews**: Include tests in code reviews
2. **Automated Testing**: Run tests automatically on every commit
3. **Test Metrics**: Track test metrics and quality indicators
4. **Continuous Improvement**: Regularly improve testing practices
5. **Team Training**: Ensure team members understand testing best practices

This comprehensive testing strategy ensures Code Explain maintains high quality, reliability, and performance while providing confidence in our codebase changes.
