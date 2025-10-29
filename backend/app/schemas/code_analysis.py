"""
Pydantic schemas for AI-powered code analysis features.

Includes schemas for:
- Code Review (security, performance, best practices)
- Quality Metrics (5-metric scoring system)
- Architecture Diagrams (component relationships)
- Mentor Insights (skill assessment and learning paths)
"""
from pydantic import BaseModel
from typing import List, Dict, Any, Optional


class SecurityIssue(BaseModel):
    """Represents a security vulnerability found in code."""
    severity: str  # critical, high, medium, low
    type: str  # XSS, SQL Injection, etc.
    line_number: int
    description: str
    fix_suggestion: str


class PerformanceIssue(BaseModel):
    """Represents a performance issue found in code."""
    impact: str  # high, medium, low
    type: str  # algorithm complexity, memory leak, etc.
    line_number: int
    description: str
    optimization_suggestion: str


class BestPractice(BaseModel):
    """Represents a best practice recommendation."""
    category: str  # naming, structure, patterns, etc.
    description: str
    suggestion: str
    priority: str  # high, medium, low


class CodeReview(BaseModel):
    """Complete code review results."""
    security_issues: List[SecurityIssue]
    performance_issues: List[PerformanceIssue]
    best_practices: List[BestPractice]
    overall_score: float
    summary: str


class QualityMetrics(BaseModel):
    """5-metric code quality scoring system."""
    maintainability: float  # 0-100
    testability: float
    readability: float
    performance: float
    security: float
    overall: float
    breakdown: Dict[str, str]  # explanations for each metric


class ArchitectureNode(BaseModel):
    """Node in architecture diagram."""
    id: str
    type: str  # function, class, module, api
    label: str
    description: str
    metadata: Dict[str, Any]


class ArchitectureEdge(BaseModel):
    """Edge in architecture diagram."""
    id: str
    source: str
    target: str
    label: str
    type: str  # calls, imports, depends_on


class ArchitectureDiagram(BaseModel):
    """Complete architecture diagram structure."""
    nodes: List[ArchitectureNode]
    edges: List[ArchitectureEdge]
    layout: str  # horizontal, vertical, circular


class LearningPathItem(BaseModel):
    """Individual item in learning path."""
    title: str
    description: str
    resources: List[str]  # URLs, book titles, etc.
    estimated_time: str  # "2 hours", "1 week", etc.
    difficulty: str  # beginner, intermediate, advanced
    prerequisites: List[str]


class Challenge(BaseModel):
    """Coding challenge recommendation."""
    title: str
    description: str
    difficulty: str
    estimated_time: str
    skills_practiced: List[str]
    starter_code: Optional[str] = None


class MentorInsight(BaseModel):
    """Complete mentor insights for skill development."""
    skill_level: str  # beginner, intermediate, advanced
    strengths: List[str]
    weaknesses: List[str]
    learning_path: List[LearningPathItem]
    challenges: List[Challenge]
    estimated_time: str
    next_milestone: str


# Request/Response schemas for API endpoints

class CodeReviewResponse(BaseModel):
    """Response schema for code review endpoint."""
    code_review: CodeReview
    processing_time: float
    cached: bool = False


class QualityMetricsResponse(BaseModel):
    """Response schema for quality metrics endpoint."""
    quality_metrics: QualityMetrics
    processing_time: float
    cached: bool = False


class ArchitectureDiagramResponse(BaseModel):
    """Response schema for architecture diagram endpoint."""
    architecture_diagram: ArchitectureDiagram
    processing_time: float
    cached: bool = False


class MentorInsightsResponse(BaseModel):
    """Response schema for mentor insights endpoint."""
    mentor_insights: MentorInsight
    processing_time: float
    cached: bool = False


class BatchAnalysisRequest(BaseModel):
    """Request schema for batch analysis."""
    analysis_types: List[str]  # ["review", "quality", "architecture", "mentor"]
    force_regenerate: bool = False


class BatchAnalysisResponse(BaseModel):
    """Response schema for batch analysis."""
    results: Dict[str, Any]  # analysis_type -> result
    processing_time: float
    cached_counts: Dict[str, int]
