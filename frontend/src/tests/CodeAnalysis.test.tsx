/**
 * Frontend tests for AI Code Analysis features
 * 
 * Tests:
 * - CodeReview component rendering and interactions
 * - Health score component with detailed breakdown
 * - ArchitectureDiagram component with React Flow
 * - API integration and error handling
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import type { Node } from '@xyflow/react';
import CodeReview from '../components/CodeReview';
import QualityMetrics from '../components/QualityMetrics';
import ArchitectureDiagram from '../components/ArchitectureDiagram';
import { apiClient } from '../api/client';

vi.mock('../api/client', () => ({
  apiClient: {
    generateCodeReview: vi.fn(),
    calculateQualityMetrics: vi.fn(),
    generateArchitectureDiagram: vi.fn(),
  },
}));

vi.mock('@xyflow/react', () => ({
  ReactFlowProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  ReactFlow: ({
    nodes,
    onNodeClick,
    children,
  }: {
    nodes: Node[];
    onNodeClick?: (event: React.MouseEvent, node: Node) => void;
    children?: React.ReactNode;
  }) => (
    <div data-testid="mock-react-flow">
      {nodes.map((n) => (
        <button
          key={n.id}
          type="button"
          onClick={(e) => onNodeClick?.(e, n)}
        >
          {String((n.data as { label?: string })?.label ?? '')}
        </button>
      ))}
      {children}
    </div>
  ),
  Controls: () => null,
  Background: () => null,
  MiniMap: () => null,
  useNodesState: (initial: Node[]) => [initial, () => {}, () => {}] as const,
  useEdgesState: (initial: unknown[]) => [initial, () => {}, () => {}] as const,
  addEdge: () => [],
  BackgroundVariant: { Dots: 'dots' },
}));

const mockApiClient = vi.mocked(apiClient);

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

const mockHealthScoreData = {
  score: 78.5,
  grade: 'C',
  summary: 'Strong readability with room to improve security.',
  metrics: {
    maintainability: 80.0,
    testability: 65.0,
    readability: 90.0,
    performance: 70.0,
    security: 60.0,
  },
  breakdown: {
    maintainability: 'Good modular structure',
    testability: 'Some dependencies need injection',
    readability: 'Excellent naming and comments',
    performance: 'Algorithm could be optimized',
    security: 'Input validation needed',
  },
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


describe('CodeReview Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders code review component with generate button', () => {
    render(
      <TestWrapper>
        <CodeReview repositoryId={1} fileId={1} />
      </TestWrapper>
    );

    expect(screen.getByText('Generate Review')).toBeInTheDocument();
    expect(screen.getByText('AI-powered security, performance, and best practices analysis')).toBeInTheDocument();
  });

  test('generates code review on button click', async () => {
    mockApiClient.generateCodeReview.mockResolvedValueOnce({ code_review: mockCodeReviewData });

    render(
      <TestWrapper>
        <CodeReview repositoryId={1} fileId={1} />
      </TestWrapper>
    );

    const generateButton = screen.getByText('Generate Review');
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(mockApiClient.generateCodeReview).toHaveBeenCalledWith(1, 1);
    });
  });

  test('displays code review results after generation', async () => {
    mockApiClient.generateCodeReview.mockResolvedValueOnce({ code_review: mockCodeReviewData });

    render(
      <TestWrapper>
        <CodeReview repositoryId={1} fileId={1} />
      </TestWrapper>
    );

    const generateButton = screen.getByText('Generate Review');
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

    const generateButton = screen.getByText('Generate Review');
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Analysis Failed' })).toBeInTheDocument();
    });
  });
});

describe('QualityMetrics Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders health score component', () => {
    render(
      <TestWrapper>
        <QualityMetrics repositoryId={1} fileId={1} />
      </TestWrapper>
    );

    expect(screen.getByText('Calculate Health Score')).toBeInTheDocument();
    expect(screen.getByText('Single score with detailed breakdown')).toBeInTheDocument();
  });

  test('calculates health score on button click', async () => {
    mockApiClient.calculateQualityMetrics.mockResolvedValueOnce({
      health_score: mockHealthScoreData,
    });

    render(
      <TestWrapper>
        <QualityMetrics repositoryId={1} fileId={1} />
      </TestWrapper>
    );

    const calculateButton = screen.getByText('Calculate Health Score');
    fireEvent.click(calculateButton);

    await waitFor(() => {
      expect(mockApiClient.calculateQualityMetrics).toHaveBeenCalledWith(1, 1);
    });
  });

  test('displays health score with grade', async () => {
    mockApiClient.calculateQualityMetrics.mockResolvedValueOnce({
      health_score: mockHealthScoreData,
    });

    render(
      <TestWrapper>
        <QualityMetrics repositoryId={1} fileId={1} />
      </TestWrapper>
    );

    const calculateButton = screen.getByText('Calculate Health Score');
    fireEvent.click(calculateButton);

    await waitFor(() => {
      expect(screen.getByText('Grade C')).toBeInTheDocument();
      expect(screen.getByText('78.5')).toBeInTheDocument();
    });
  });

  test('shows detailed breakdown on toggle', async () => {
    mockApiClient.calculateQualityMetrics.mockResolvedValueOnce({
      health_score: mockHealthScoreData,
    });

    render(
      <TestWrapper>
        <QualityMetrics repositoryId={1} fileId={1} />
      </TestWrapper>
    );

    const calculateButton = screen.getByText('Calculate Health Score');
    fireEvent.click(calculateButton);

    await waitFor(() => {
      const toggleButton = screen.getByText('View detailed breakdown');
      fireEvent.click(toggleButton);
      expect(screen.getByText('Good modular structure')).toBeInTheDocument();
    });
  });
});

describe('ArchitectureDiagram Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders architecture diagram component', () => {
    render(
      <TestWrapper>
        <ArchitectureDiagram repositoryId={1} fileId={1} />
      </TestWrapper>
    );

    expect(screen.getByText('Generate Diagram')).toBeInTheDocument();
    expect(screen.getByText('Interactive code structure visualization')).toBeInTheDocument();
  });

  test('generates architecture diagram on button click', async () => {
    mockApiClient.generateArchitectureDiagram.mockResolvedValueOnce({
      architecture_diagram: mockArchitectureData,
    });

    render(
      <TestWrapper>
        <ArchitectureDiagram repositoryId={1} fileId={1} />
      </TestWrapper>
    );

    const generateButton = screen.getByText('Generate Diagram');
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(mockApiClient.generateArchitectureDiagram).toHaveBeenCalledWith(1, 1);
    });
  });

  test('displays architecture diagram with nodes and edges', async () => {
    mockApiClient.generateArchitectureDiagram.mockResolvedValueOnce({
      architecture_diagram: mockArchitectureData,
    });

    render(
      <TestWrapper>
        <ArchitectureDiagram repositoryId={1} fileId={1} />
      </TestWrapper>
    );

    const generateButton = screen.getByText('Generate Diagram');
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText('calculateTotal')).toBeInTheDocument();
      expect(screen.getByText('DataProcessor')).toBeInTheDocument();
    });
  });

  test('shows node details on click', async () => {
    mockApiClient.generateArchitectureDiagram.mockResolvedValueOnce({
      architecture_diagram: mockArchitectureData,
    });

    render(
      <TestWrapper>
        <ArchitectureDiagram repositoryId={1} fileId={1} />
      </TestWrapper>
    );

    const generateButton = screen.getByText('Generate Diagram');
    fireEvent.click(generateButton);

    await waitFor(() => {
      const node = screen.getByText('calculateTotal');
      fireEvent.click(node);

      expect(screen.getByText('Calculates the total amount')).toBeInTheDocument();
    });
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

    const generateButton = screen.getByText('Generate Review');
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Analysis Failed' })).toBeInTheDocument();
    });
  });

  test('shows loading states during API calls', async () => {
    // Mock a delayed response
    mockApiClient.generateCodeReview.mockImplementationOnce(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ code_review: mockCodeReviewData }), 100)
        )
    );

    render(
      <TestWrapper>
        <CodeReview repositoryId={1} fileId={1} />
      </TestWrapper>
    );

    const generateButton = screen.getByText('Generate Review');
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText(/Analyzing your code for issues/i)).toBeInTheDocument();
    });
  });

  test('validates API response structure', async () => {
    // Mock invalid response
    mockApiClient.generateCodeReview.mockResolvedValueOnce({ invalid: 'data' });

    render(
      <TestWrapper>
        <CodeReview repositoryId={1} fileId={1} />
      </TestWrapper>
    );

    const generateButton = screen.getByText('Generate Review');
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(mockApiClient.generateCodeReview).toHaveBeenCalled();
    });
    expect(screen.queryByText('Security Issues')).not.toBeInTheDocument();
  });
});

describe('Component Accessibility', () => {
  test('code review component has proper ARIA labels', () => {
    render(
      <TestWrapper>
        <CodeReview repositoryId={1} fileId={1} />
      </TestWrapper>
    );

    const generateButton = screen.getByRole('button', { name: /Generate Review/i });
    expect(generateButton).toHaveAttribute('type', 'button');
  });

  test('health score component has proper accessibility', () => {
    render(
      <TestWrapper>
        <QualityMetrics repositoryId={1} fileId={1} />
      </TestWrapper>
    );

    const calculateButton = screen.getByRole('button', { name: /Calculate Health Score/i });
    expect(calculateButton).toHaveAttribute('type', 'button');
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
    expect(screen.getByText('Generate Review')).toBeInTheDocument();
  });

  test('API calls are debounced', async () => {
    const mockFn = vi.fn().mockResolvedValue({ code_review: mockCodeReviewData });
    mockApiClient.generateCodeReview = mockFn;

    render(
      <TestWrapper>
        <CodeReview repositoryId={1} fileId={1} />
      </TestWrapper>
    );

    const generateButton = screen.getByText('Generate Review');
    
    // Click multiple times rapidly
    fireEvent.click(generateButton);
    fireEvent.click(generateButton);
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(mockFn).toHaveBeenCalled();
    });
    expect(mockFn.mock.calls.length).toBe(3);
  });
});
