"""
Pydantic schemas for AI-powered code analysis features.

Includes schemas for:
- Code Review (security, performance, best practices)
- Quality Metrics (5-metric scoring system)
- Architecture Diagrams (component relationships)
"""
from pydantic import BaseModel
from typing import List, Dict, Any


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


class HealthScore(BaseModel):
    """Aggregate health score with detailed breakdown."""
    score: float  # 0-100
    grade: str  # A, B, C, D, F
    summary: str
    metrics: Dict[str, float]  # per-dimension scores
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


# Request/Response schemas for API endpoints

class CodeReviewResponse(BaseModel):
    """Response schema for code review endpoint."""
    code_review: CodeReview
    processing_time: float
    cached: bool = False


class HealthScoreResponse(BaseModel):
    """Response schema for health score endpoint."""
    health_score: HealthScore
    processing_time: float
    cached: bool = False


class ArchitectureDiagramResponse(BaseModel):
    """Response schema for architecture diagram endpoint."""
    architecture_diagram: ArchitectureDiagram
    processing_time: float
    cached: bool = False


class QuickFileAnalysisRequest(BaseModel):
    """Request schema for quick file analysis."""
    code: str
    language: str
    file_path: str
    repo_name: str | None = None


class QuickFileAnalysisResponse(BaseModel):
    """Response schema for quick file analysis."""
    summary: str
    health_score: HealthScore
    tokens_used: int


