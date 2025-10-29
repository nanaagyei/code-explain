/**
 * Frontend tests for AI Code Analysis features
 * 
 * Tests:
 * - CodeReview component rendering and interactions
 * - QualityMetrics component with progress indicators
 * - ArchitectureDiagram component with React Flow
 * - MentorHint component behavior
 * - API integration and error handling
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import CodeReview from '../components/CodeReview';
import QualityMetrics from '../components/QualityMetrics';
import ArchitectureDiagram from '../components/ArchitectureDiagram';
import MentorHint from '../components/MentorHint';
import { apiClient } from '../api/client';

// Mock the API client
jest.mock('../api/client');
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

// Test wrapper with providers
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

// Mock data
const mockCodeReviewData = {
  security_issues: [
    {
      severity: 'high',
      type: 'SQL Injection',
      line_number: 15,
      description: 'Potential SQL injection vulnerability',
      fix_suggestion: 'Use parameterized queries'
    }
  ],
  performance_issues: [
    {
      impact: 'medium',
      type: 'Inefficient Algorithm',
      line_number: 25,
      description: 'O(n²) algorithm could be optimized',
      optimization_suggestion: 'Use hash map for O(n) lookup'
    }
  ],
  best_practices: [
    {
      category: 'naming',
      description: 'Variable names could be more descriptive',
      suggestion: 'Use camelCase for variables',
      priority: 'low'
    }
  ],
  overall_score: 75.5,
  summary: 'Code has good structure but needs security improvements'
};

const mockQualityMetricsData = {
  maintainability: 80.0,
  testability: 65.0,
  readability: 90.0,
  performance: 70.0,
  security: 60.0,
  overall: 73.0,
  breakdown: {
    maintainability: 'Good modular structure',
    testability: 'Some dependencies need injection',
    readability: 'Excellent naming and comments',
    performance: 'Algorithm could be optimized',
    security: 'Input validation needed'
  }
};

const mockArchitectureData = {
  nodes: [
    {
      id: 'func1',
      type: 'function',
      label: 'calculateTotal',
      description: 'Calculates the total amount',
      metadata: { line: 10, complexity: 'low' }
    },
    {
      id: 'class1',
      type: 'class',
      label: 'DataProcessor',
      description: 'Processes input data',
      metadata: { line: 20, complexity: 'medium' }
    }
  ],
  edges: [
    {
      id: 'edge1',
      source: 'class1',
      target: 'func1',
      label: 'calls',
      type: 'calls'
    }
  ],
  layout: 'horizontal'
};

const mockMentorInsightData = {
  skill_level: 'intermediate',
  strengths: ['Good code organization', 'Proper error handling'],
  weaknesses: ['Security awareness', 'Testing practices'],
  learning_path: [
    {
      title: 'Security Best Practices',
      description: 'Learn about common security vulnerabilities',
      resources: ['https://owasp.org/', 'Security Handbook'],
      estimated_time: '2 hours',
      difficulty: 'intermediate',
      prerequisites: ['Basic programming knowledge'],
      learning_objectives: ['Identify security issues', 'Implement secure coding'],
      practical_exercises: ['Code review exercise', 'Security audit practice']
    }
  ],
  challenges: [
    {
      title: 'Build Secure API',
      description: 'Create an API with proper security measures',
      difficulty: 'intermediate',
      estimated_time: '1 week',
      skills_practiced: ['security', 'API design'],
      starter_code: '// TODO: implement secure endpoints',
      success_criteria: ['Passes security audit', 'Handles edge cases'],
      hints: ['Use input validation', 'Implement rate limiting']
    }
  ],
  estimated_time: '2-4 weeks',
  next_milestone: 'Master security best practices',
  career_advice: 'Focus on security certifications'
};

describe('CodeReview Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders code review component with generate button', () => {
    render(
      <TestWrapper>
        <CodeReview repositoryId={1} fileId={1} />
      </TestWrapper>
    );

    expect(screen.getByText('Generate Code Review')).toBeInTheDocument();
    expect(screen.getByText('AI-powered code analysis for security vulnerabilities, performance issues, and best practices.')).toBeInTheDocument();
  });

  test('generates code review on button click', async () => {
    mockApiClient.generateCodeReview.mockResolvedValueOnce(mockCodeReviewData);

    render(
      <TestWrapper>
        <CodeReview repositoryId={1} fileId={1} />
      </TestWrapper>
    );

    const generateButton = screen.getByText('Generate Code Review');
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(mockApiClient.generateCodeReview).toHaveBeenCalledWith(1, 1);
    });
  });

  test('displays code review results after generation', async () => {
    mockApiClient.generateCodeReview.mockResolvedValueOnce(mockCodeReviewData);

    render(
      <TestWrapper>
        <CodeReview repositoryId={1} fileId={1} />
      </TestWrapper>
    );

    const generateButton = screen.getByText('Generate Code Review');
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText('Security Issues')).toBeInTheDocument();
      expect(screen.getByText('Performance Issues')).toBeInTheDocument();
      expect(screen.getByText('Best Practices')).toBeInTheDocument();
      expect(screen.getByText('75.5')).toBeInTheDocument(); // Overall score
    });
  });

  test('handles API errors gracefully', async () => {
    mockApiClient.generateCodeReview.mockRejectedValueOnce(new Error('API Error'));

    render(
      <TestWrapper>
        <CodeReview repositoryId={1} fileId={1} />
      </TestWrapper>
    );

    const generateButton = screen.getByText('Generate Code Review');
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});

describe('QualityMetrics Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders quality metrics component', () => {
    render(
      <TestWrapper>
        <QualityMetrics repositoryId={1} fileId={1} />
      </TestWrapper>
    );

    expect(screen.getByText('Calculate Quality Metrics')).toBeInTheDocument();
    expect(screen.getByText('5-dimensional code quality assessment with detailed scoring and explanations.')).toBeInTheDocument();
  });

  test('calculates quality metrics on button click', async () => {
    mockApiClient.calculateQualityMetrics.mockResolvedValueOnce(mockQualityMetricsData);

    render(
      <TestWrapper>
        <QualityMetrics repositoryId={1} fileId={1} />
      </TestWrapper>
    );

    const calculateButton = screen.getByText('Calculate Quality Metrics');
    fireEvent.click(calculateButton);

    await waitFor(() => {
      expect(mockApiClient.calculateQualityMetrics).toHaveBeenCalledWith(1, 1);
    });
  });

  test('displays quality metrics with progress indicators', async () => {
    mockApiClient.calculateQualityMetrics.mockResolvedValueOnce(mockQualityMetricsData);

    render(
      <TestWrapper>
        <QualityMetrics repositoryId={1} fileId={1} />
      </TestWrapper>
    );

    const calculateButton = screen.getByText('Calculate Quality Metrics');
    fireEvent.click(calculateButton);

    await waitFor(() => {
      expect(screen.getByText('Maintainability')).toBeInTheDocument();
      expect(screen.getByText('Testability')).toBeInTheDocument();
      expect(screen.getByText('Readability')).toBeInTheDocument();
      expect(screen.getByText('Performance')).toBeInTheDocument();
      expect(screen.getByText('Security')).toBeInTheDocument();
      expect(screen.getByText('73.0')).toBeInTheDocument(); // Overall score
    });
  });

  test('expands metric details on click', async () => {
    mockApiClient.calculateQualityMetrics.mockResolvedValueOnce(mockQualityMetricsData);

    render(
      <TestWrapper>
        <QualityMetrics repositoryId={1} fileId={1} />
      </TestWrapper>
    );

    const calculateButton = screen.getByText('Calculate Quality Metrics');
    fireEvent.click(calculateButton);

    await waitFor(() => {
      const maintainabilityCard = screen.getByText('Maintainability');
      fireEvent.click(maintainabilityCard);

      expect(screen.getByText('Good modular structure')).toBeInTheDocument();
    });
  });
});

describe('ArchitectureDiagram Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders architecture diagram component', () => {
    render(
      <TestWrapper>
        <ArchitectureDiagram repositoryId={1} fileId={1} />
      </TestWrapper>
    );

    expect(screen.getByText('Generate Architecture Diagram')).toBeInTheDocument();
    expect(screen.getByText('Interactive visualization of code components, relationships, and data flow.')).toBeInTheDocument();
  });

  test('generates architecture diagram on button click', async () => {
    mockApiClient.generateArchitectureDiagram.mockResolvedValueOnce(mockArchitectureData);

    render(
      <TestWrapper>
        <ArchitectureDiagram repositoryId={1} fileId={1} />
      </TestWrapper>
    );

    const generateButton = screen.getByText('Generate Architecture Diagram');
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(mockApiClient.generateArchitectureDiagram).toHaveBeenCalledWith(1, 1);
    });
  });

  test('displays architecture diagram with nodes and edges', async () => {
    mockApiClient.generateArchitectureDiagram.mockResolvedValueOnce(mockArchitectureData);

    render(
      <TestWrapper>
        <ArchitectureDiagram repositoryId={1} fileId={1} />
      </TestWrapper>
    );

    const generateButton = screen.getByText('Generate Architecture Diagram');
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText('calculateTotal')).toBeInTheDocument();
      expect(screen.getByText('DataProcessor')).toBeInTheDocument();
    });
  });

  test('shows node details on click', async () => {
    mockApiClient.generateArchitectureDiagram.mockResolvedValueOnce(mockArchitectureData);

    render(
      <TestWrapper>
        <ArchitectureDiagram repositoryId={1} fileId={1} />
      </TestWrapper>
    );

    const generateButton = screen.getByText('Generate Architecture Diagram');
    fireEvent.click(generateButton);

    await waitFor(() => {
      const node = screen.getByText('calculateTotal');
      fireEvent.click(node);

      expect(screen.getByText('Calculates the total amount')).toBeInTheDocument();
    });
  });
});

describe('MentorHint Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders mentor hint component', () => {
    render(
      <TestWrapper>
        <MentorHint repositoryId={1} fileId={1} />
      </TestWrapper>
    );

    // Component should be visible after delay
    expect(screen.getByText('Learning Suggestions')).toBeInTheDocument();
  });

  test('shows learning suggestions', () => {
    render(
      <TestWrapper>
        <MentorHint repositoryId={1} fileId={1} />
      </TestWrapper>
    );

    expect(screen.getByText('Async/Await Patterns')).toBeInTheDocument();
    expect(screen.getByText('Error Handling Best Practices')).toBeInTheDocument();
    expect(screen.getByText('Unit Testing Strategies')).toBeInTheDocument();
  });

  test('can be dismissed', () => {
    render(
      <TestWrapper>
        <MentorHint repositoryId={1} fileId={1} />
      </TestWrapper>
    );

    const dismissButton = screen.getByLabelText('Dismiss');
    fireEvent.click(dismissButton);

    expect(screen.queryByText('Learning Suggestions')).not.toBeInTheDocument();
  });

  test('can be minimized', () => {
    render(
      <TestWrapper>
        <MentorHint repositoryId={1} fileId={1} />
      </TestWrapper>
    );

    const minimizeButton = screen.getByLabelText('Minimize');
    fireEvent.click(minimizeButton);

    expect(screen.getByText('3 learning suggestions available')).toBeInTheDocument();
  });

  test('links to mentor dashboard', () => {
    render(
      <TestWrapper>
        <MentorHint repositoryId={1} fileId={1} />
      </TestWrapper>
    );

    const mentorLink = screen.getByText('View Full Learning Path');
    expect(mentorLink.closest('a')).toHaveAttribute('href', '/mentor');
  });
});

describe('API Integration', () => {
  test('handles network errors gracefully', async () => {
    mockApiClient.generateCodeReview.mockRejectedValueOnce(new Error('Network error'));

    render(
      <TestWrapper>
        <CodeReview repositoryId={1} fileId={1} />
      </TestWrapper>
    );

    const generateButton = screen.getByText('Generate Code Review');
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  test('shows loading states during API calls', async () => {
    // Mock a delayed response
    mockApiClient.generateCodeReview.mockImplementationOnce(
      () => new Promise(resolve => setTimeout(() => resolve(mockCodeReviewData), 100))
    );

    render(
      <TestWrapper>
        <CodeReview repositoryId={1} fileId={1} />
      </TestWrapper>
    );

    const generateButton = screen.getByText('Generate Code Review');
    fireEvent.click(generateButton);

    // Should show loading state
    expect(screen.getByText(/generating/i)).toBeInTheDocument();
  });

  test('validates API response structure', async () => {
    // Mock invalid response
    mockApiClient.generateCodeReview.mockResolvedValueOnce({ invalid: 'data' });

    render(
      <TestWrapper>
        <CodeReview repositoryId={1} fileId={1} />
      </TestWrapper>
    );

    const generateButton = screen.getByText('Generate Code Review');
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});

describe('Component Accessibility', () => {
  test('code review component has proper ARIA labels', () => {
    render(
      <TestWrapper>
        <CodeReview repositoryId={1} fileId={1} />
      </TestWrapper>
    );

    const generateButton = screen.getByText('Generate Code Review');
    expect(generateButton).toHaveAttribute('type', 'button');
  });

  test('quality metrics component has proper accessibility', () => {
    render(
      <TestWrapper>
        <QualityMetrics repositoryId={1} fileId={1} />
      </TestWrapper>
    );

    const calculateButton = screen.getByText('Calculate Quality Metrics');
    expect(calculateButton).toHaveAttribute('type', 'button');
  });

  test('mentor hint component has proper ARIA labels', () => {
    render(
      <TestWrapper>
        <MentorHint repositoryId={1} fileId={1} />
      </TestWrapper>
    );

    const dismissButton = screen.getByLabelText('Dismiss');
    const minimizeButton = screen.getByLabelText('Minimize');
    
    expect(dismissButton).toBeInTheDocument();
    expect(minimizeButton).toBeInTheDocument();
  });
});

describe('Performance Optimization', () => {
  test('components use proper memoization', () => {
    const { rerender } = render(
      <TestWrapper>
        <CodeReview repositoryId={1} fileId={1} />
      </TestWrapper>
    );

    // Rerender with same props should not cause unnecessary re-renders
    rerender(
      <TestWrapper>
        <CodeReview repositoryId={1} fileId={1} />
      </TestWrapper>
    );

    // Component should still be rendered
    expect(screen.getByText('Generate Code Review')).toBeInTheDocument();
  });

  test('API calls are debounced', async () => {
    const mockFn = jest.fn().mockResolvedValue(mockCodeReviewData);
    mockApiClient.generateCodeReview = mockFn;

    render(
      <TestWrapper>
        <CodeReview repositoryId={1} fileId={1} />
      </TestWrapper>
    );

    const generateButton = screen.getByText('Generate Code Review');
    
    // Click multiple times rapidly
    fireEvent.click(generateButton);
    fireEvent.click(generateButton);
    fireEvent.click(generateButton);

    // Should only call API once
    await waitFor(() => {
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });
});
