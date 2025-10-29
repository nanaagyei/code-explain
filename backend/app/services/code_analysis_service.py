"""
AI-powered code analysis service for advanced features.

Provides:
- Code Review (security, performance, best practices)
- Quality Metrics (5-metric scoring system)
- Architecture Diagrams (component relationships)
- Mentor Insights (skill assessment and learning paths)
"""
import asyncio
import hashlib
import json
import time
from typing import Dict, List, Any, Optional
from openai import OpenAI
from app.core.config import get_settings
from app.core.cache import cache
from app.schemas.code_analysis import (
    CodeReview, SecurityIssue, PerformanceIssue, BestPractice,
    QualityMetrics, ArchitectureDiagram, ArchitectureNode, ArchitectureEdge,
    MentorInsight, LearningPathItem, Challenge
)

settings = get_settings()


class CodeAnalysisService:
    """
    Advanced AI-powered code analysis service.
    
    Uses GPT-4o for complex analysis with aggressive caching to minimize API costs.
    Provides comprehensive code review, quality metrics, architecture visualization,
    and personalized mentoring insights.
    """
    
    def __init__(self):
        self.client = OpenAI(api_key=settings.openai_api_key)
        self.gpt4_model = settings.openai_model_gpt4
        self.gpt4_mini_model = settings.openai_model_gpt4_mini
        self.total_tokens_used = 0
    
    def _clean_json_response(self, content: str) -> str:
        """Clean AI response by removing markdown code blocks."""
        cleaned_content = content.strip()
        if cleaned_content.startswith('```json'):
            # Remove ```json from start and ``` from end
            cleaned_content = cleaned_content[7:]  # Remove ```json
            if cleaned_content.endswith('```'):
                cleaned_content = cleaned_content[:-3]  # Remove ```
            cleaned_content = cleaned_content.strip()
        elif cleaned_content.startswith('```'):
            # Remove ``` from start and end
            cleaned_content = cleaned_content[3:]
            if cleaned_content.endswith('```'):
                cleaned_content = cleaned_content[:-3]
            cleaned_content = cleaned_content.strip()
        return cleaned_content
    
    async def generate_code_review(
        self,
        code: str,
        language: str,
        file_path: str
    ) -> CodeReview:
        """
        Generate comprehensive code review with security, performance, and best practices analysis.
        
        Args:
            code: Source code to analyze
            language: Programming language
            file_path: File path for context
            
        Returns:
            CodeReview object with all findings
        """
        # Check cache first
        cache_key = cache.generate_cache_key(
            "code_review",
            file_path,
            code[:200],  # First 200 chars for uniqueness
            language
        )
        
        cached_review = await cache.get(cache_key)
        if cached_review:
            # Only use cache if it's a successful result (not error fallback)
            cached_result = CodeReview(**cached_review)
            if cached_result.overall_score > 0 or len(cached_result.security_issues) > 0 or len(cached_result.performance_issues) > 0 or len(cached_result.best_practices) > 0:
                print(f"  ♻️  Cache hit for code review: {file_path}")
                return cached_result
            else:
                print(f"  🗑️  Cache miss (error response): {file_path}")
                await cache.delete(cache_key)  # Clear bad cache entry
        
        print(f"  🔍 Generating code review for: {file_path}")
        start_time = time.time()
        
        # Generate prompt
        prompt = self._create_code_review_prompt(code, language, file_path)
        
        # Call OpenAI
        response = await asyncio.to_thread(
            self.client.chat.completions.create,
            model=self.gpt4_model,  # Use GPT-4 for complex analysis
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a senior software security engineer and performance optimization expert. "
                        "Analyze code for security vulnerabilities (OWASP Top 10), performance bottlenecks, "
                        "and adherence to best practices. Provide specific, actionable suggestions with "
                        "line numbers where applicable. Always respond with valid JSON."
                    )
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.2,  # Low temperature for consistent analysis
            max_tokens=2000
        )
        
        # Parse response
        content = response.choices[0].message.content
        tokens_used = response.usage.total_tokens
        self.total_tokens_used += tokens_used
        
        print(f"  🔍 Raw AI response length: {len(content) if content else 0}")
        print(f"  🔍 Raw AI response preview: {content[:200] if content else 'None'}")
        
        try:
            cleaned_content = self._clean_json_response(content)
            review_data = json.loads(cleaned_content)
            code_review = CodeReview(**review_data)
        except (json.JSONDecodeError, ValueError) as e:
            print(f"  ❌ Error parsing code review response: {e}")
            print(f"  🔍 Content that failed to parse: {repr(content)}")
            # Return empty review on error
            code_review = CodeReview(
                security_issues=[],
                performance_issues=[],
                best_practices=[],
                overall_score=0.0,
                summary="Analysis failed due to parsing error."
            )
        
        # Cache result only if successful (not error fallback)
        if code_review.overall_score > 0 or len(code_review.security_issues) > 0 or len(code_review.performance_issues) > 0 or len(code_review.best_practices) > 0:
            await cache.set(cache_key, code_review.dict(), expire=3600)  # 1 hour cache
        
        processing_time = time.time() - start_time
        print(f"  ✅ Code review completed in {processing_time:.2f}s ({tokens_used} tokens)")
        
        return code_review
    
    async def calculate_quality_metrics(
        self,
        code: str,
        language: str,
        file_path: str
    ) -> QualityMetrics:
        """
        Calculate 5-metric code quality scoring system.
        
        Args:
            code: Source code to analyze
            language: Programming language
            file_path: File path for context
            
        Returns:
            QualityMetrics object with scores and explanations
        """
        # Check cache first
        cache_key = cache.generate_cache_key(
            "quality_metrics",
            file_path,
            code[:200],
            language
        )
        
        cached_metrics = await cache.get(cache_key)
        if cached_metrics:
            # Only use cache if it's a successful result (not error fallback)
            cached_result = QualityMetrics(**cached_metrics)
            if cached_result.overall > 50:  # Check if it's not the default error values
                print(f"  ♻️  Cache hit for quality metrics: {file_path}")
                return cached_result
            else:
                print(f"  🗑️  Cache miss (error response): {file_path}")
                await cache.delete(cache_key)  # Clear bad cache entry
        
        print(f"  📊 Calculating quality metrics for: {file_path}")
        start_time = time.time()
        
        # Generate prompt
        prompt = self._create_quality_metrics_prompt(code, language, file_path)
        
        # Call OpenAI
        response = await asyncio.to_thread(
            self.client.chat.completions.create,
            model=self.gpt4_model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a code quality expert. Analyze code across 5 dimensions: "
                        "Maintainability (structure, modularity, coupling), "
                        "Testability (testable design, dependency injection), "
                        "Readability (naming, comments, complexity), "
                        "Performance (algorithm efficiency, resource usage), "
                        "Security (vulnerability assessment, data validation). "
                        "Provide scores 0-100 for each metric with detailed explanations. "
                        "Calculate overall score as weighted average. Always respond with valid JSON."
                    )
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.2,
            max_tokens=1500
        )
        
        # Parse response
        content = response.choices[0].message.content
        tokens_used = response.usage.total_tokens
        self.total_tokens_used += tokens_used
        
        try:
            cleaned_content = self._clean_json_response(content)
            metrics_data = json.loads(cleaned_content)
            quality_metrics = QualityMetrics(**metrics_data)
        except (json.JSONDecodeError, ValueError) as e:
            print(f"  ❌ Error parsing quality metrics response: {e}")
            # Return default metrics on error
            quality_metrics = QualityMetrics(
                maintainability=50.0,
                testability=50.0,
                readability=50.0,
                performance=50.0,
                security=50.0,
                overall=50.0,
                breakdown={
                    "maintainability": "Analysis failed",
                    "testability": "Analysis failed",
                    "readability": "Analysis failed",
                    "performance": "Analysis failed",
                    "security": "Analysis failed"
                }
            )
        
        # Cache result only if successful (not error fallback)
        if quality_metrics.overall > 50:  # Check if it's not the default error values
            await cache.set(cache_key, quality_metrics.dict(), expire=3600)  # 1 hour cache
        
        processing_time = time.time() - start_time
        print(f"  ✅ Quality metrics completed in {processing_time:.2f}s ({tokens_used} tokens)")
        
        return quality_metrics
    
    async def generate_architecture_diagram(
        self,
        code: str,
        language: str,
        file_path: str
    ) -> ArchitectureDiagram:
        """
        Generate interactive architecture diagram showing component relationships.
        
        Args:
            code: Source code to analyze
            language: Programming language
            file_path: File path for context
            
        Returns:
            ArchitectureDiagram object with nodes and edges
        """
        # Check cache first
        cache_key = cache.generate_cache_key(
            "architecture_diagram",
            file_path,
            code[:200],
            language
        )
        
        cached_diagram = await cache.get(cache_key)
        if cached_diagram:
            # Only use cache if it's a successful result (not error fallback)
            cached_result = ArchitectureDiagram(**cached_diagram)
            if len(cached_result.nodes) > 0 or len(cached_result.edges) > 0:  # Check if it has actual data
                print(f"  ♻️  Cache hit for architecture diagram: {file_path}")
                return cached_result
            else:
                print(f"  🗑️  Cache miss (error response): {file_path}")
                await cache.delete(cache_key)  # Clear bad cache entry
        
        print(f"  🏗️  Generating architecture diagram for: {file_path}")
        start_time = time.time()
        
        # Generate prompt
        prompt = self._create_architecture_prompt(code, language, file_path)
        
        # Call OpenAI
        response = await asyncio.to_thread(
            self.client.chat.completions.create,
            model=self.gpt4_model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a software architecture expert. Extract architectural components "
                        "and their relationships from code. Identify functions, classes, modules, "
                        "APIs, and their interactions. Create a graph structure with nodes and edges. "
                        "Node types: function, class, module, api. Edge types: calls, imports, depends_on. "
                        "Always respond with valid JSON."
                    )
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.2,
            max_tokens=1800
        )
        
        # Parse response
        content = response.choices[0].message.content
        tokens_used = response.usage.total_tokens
        self.total_tokens_used += tokens_used
        
        try:
            cleaned_content = self._clean_json_response(content)
            diagram_data = json.loads(cleaned_content)
            architecture_diagram = ArchitectureDiagram(**diagram_data)
        except (json.JSONDecodeError, ValueError) as e:
            print(f"  ❌ Error parsing architecture diagram response: {e}")
            # Return minimal diagram on error
            architecture_diagram = ArchitectureDiagram(
                nodes=[],
                edges=[],
                layout="horizontal"
            )
        
        # Cache result only if successful (not error fallback)
        if len(architecture_diagram.nodes) > 0 or len(architecture_diagram.edges) > 0:  # Check if it has actual data
            await cache.set(cache_key, architecture_diagram.dict(), expire=3600)  # 1 hour cache
        
        processing_time = time.time() - start_time
        print(f"  ✅ Architecture diagram completed in {processing_time:.2f}s ({tokens_used} tokens)")
        
        return architecture_diagram
    
    async def generate_mentor_insights(
        self,
        code: str,
        language: str,
        file_path: str
    ) -> MentorInsight:
        """
        Generate personalized mentoring insights and learning path.
        
        Args:
            code: Source code to analyze
            language: Programming language
            file_path: File path for context
            
        Returns:
            MentorInsight object with skill assessment and learning recommendations
        """
        # Check cache first
        cache_key = cache.generate_cache_key(
            "mentor_insights",
            file_path,
            code[:200],
            language
        )
        
        cached_insights = await cache.get(cache_key)
        if cached_insights:
            # Only use cache if it's a successful result (not error fallback)
            cached_result = MentorInsight(**cached_insights)
            if len(cached_result.learning_path) > 0 or len(cached_result.strengths) > 0:  # Check if it has actual data
                print(f"  ♻️  Cache hit for mentor insights: {file_path}")
                return cached_result
            else:
                print(f"  🗑️  Cache miss (error response): {file_path}")
                await cache.delete(cache_key)  # Clear bad cache entry
        
        print(f"  🧑‍🏫 Generating mentor insights for: {file_path}")
        start_time = time.time()
        
        # Generate prompt
        prompt = self._create_mentor_prompt(code, language, file_path)
        
        # Call OpenAI
        response = await asyncio.to_thread(
            self.client.chat.completions.create,
            model=self.gpt4_model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an expert coding mentor and educator. Assess the skill level "
                        "demonstrated in code and create a personalized learning path. Consider "
                        "code patterns used, best practices adherence, complexity handled, and "
                        "problem-solving approach. Provide beginner/intermediate/advanced classification "
                        "with specific guidance, learning resources, and coding challenges. "
                        "Always respond with valid JSON."
                    )
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.3,
            max_tokens=2000
        )
        
        # Parse response
        content = response.choices[0].message.content
        tokens_used = response.usage.total_tokens
        self.total_tokens_used += tokens_used
        
        try:
            cleaned_content = self._clean_json_response(content)
            insights_data = json.loads(cleaned_content)
            mentor_insights = MentorInsight(**insights_data)
        except (json.JSONDecodeError, ValueError) as e:
            print(f"  ❌ Error parsing mentor insights response: {e}")
            # Return default insights on error
            mentor_insights = MentorInsight(
                skill_level="intermediate",
                strengths=["Code structure"],
                weaknesses=["Error handling"],
                learning_path=[],
                challenges=[],
                estimated_time="2-4 weeks",
                next_milestone="Improve error handling patterns"
            )
        
        # Cache result only if successful (not error fallback)
        if len(mentor_insights.learning_path) > 0 or len(mentor_insights.strengths) > 0:  # Check if it has actual data
            await cache.set(cache_key, mentor_insights.dict(), expire=3600)  # 1 hour cache
        
        processing_time = time.time() - start_time
        print(f"  ✅ Mentor insights completed in {processing_time:.2f}s ({tokens_used} tokens)")
        
        return mentor_insights
    
    def _create_code_review_prompt(self, code: str, language: str, file_path: str) -> str:
        """Create prompt for code review analysis."""
        return f"""
You are a senior software security engineer and performance optimization expert. Analyze this {language} code comprehensively:

File: {file_path}
Code:
```{language}
{code}
```

## Security Analysis (OWASP Top 10 Focus):
- Check for SQL injection, XSS, CSRF vulnerabilities
- Validate input sanitization and authentication
- Look for hardcoded secrets, weak encryption
- Assess authorization and access control
- Check for insecure direct object references

## Performance Analysis:
- Identify algorithmic complexity issues (O(n²) vs O(n))
- Look for memory leaks and inefficient data structures
- Check database query optimization opportunities
- Assess resource usage patterns
- Identify blocking operations and async opportunities

## Best Practices Assessment:
- Code organization and modularity
- Naming conventions and readability
- Error handling and logging
- Design patterns usage
- Documentation and comments quality

Provide JSON response with this exact structure:
{{
  "security_issues": [
    {{
      "severity": "critical|high|medium|low",
      "type": "specific vulnerability type (e.g., SQL Injection, XSS, Hardcoded Secret)",
      "line_number": 123,
      "description": "detailed explanation of the security issue",
      "fix_suggestion": "specific, actionable fix with code example if possible"
    }}
  ],
  "performance_issues": [
    {{
      "impact": "high|medium|low",
      "type": "performance issue type (e.g., N+1 Query, Memory Leak, Inefficient Algorithm)",
      "line_number": 123,
      "description": "detailed explanation of the performance impact",
      "optimization_suggestion": "specific optimization with code example if possible"
    }}
  ],
  "best_practices": [
    {{
      "category": "naming|structure|patterns|error_handling|documentation",
      "description": "what could be improved with specific examples",
      "suggestion": "recommended improvement with rationale",
      "priority": "high|medium|low"
    }}
  ],
  "overall_score": 85.5,
  "summary": "Concise overall assessment highlighting key strengths and areas for improvement"
}}

## Important Instructions:
- Be specific with line numbers when possible
- Provide actionable suggestions with code examples
- Consider the programming language's best practices
- Rate severity/impact realistically
- Give an overall score between 0-100
- If no issues found in a category, return empty array []
"""
    
    def _create_quality_metrics_prompt(self, code: str, language: str, file_path: str) -> str:
        """Create prompt for quality metrics calculation."""
        return f"""
You are a code quality expert. Calculate comprehensive quality metrics for this {language} code:

File: {file_path}
Code:
```{language}
{code}
```

## Quality Metrics Assessment:

### 1. Maintainability (0-100):
- Code structure and organization
- Modularity and separation of concerns
- Cyclomatic complexity
- Coupling and cohesion
- Code duplication
- Refactoring ease

### 2. Testability (0-100):
- Dependency injection usage
- Function/method isolation
- Mockability of external dependencies
- Test coverage potential
- Side effects and state management
- Unit testing feasibility

### 3. Readability (0-100):
- Naming conventions and clarity
- Code organization and structure
- Comments and documentation quality
- Consistent formatting and style
- Logical flow and complexity
- Self-documenting code

### 4. Performance (0-100):
- Algorithm efficiency and complexity
- Resource usage optimization
- Memory management
- Database query efficiency
- Caching opportunities
- Scalability considerations

### 5. Security (0-100):
- Input validation and sanitization
- Authentication and authorization
- Vulnerability assessment
- Secure coding practices
- Data protection and encryption
- Error handling security

Provide JSON response with scores and detailed explanations:
{{
  "maintainability": 85.0,
  "testability": 70.0,
  "readability": 90.0,
  "performance": 75.0,
  "security": 80.0,
  "overall": 80.0,
  "breakdown": {{
    "maintainability": "Detailed explanation of maintainability score with specific examples",
    "testability": "Detailed explanation of testability score with specific examples",
    "readability": "Detailed explanation of readability score with specific examples",
    "performance": "Detailed explanation of performance score with specific examples",
    "security": "Detailed explanation of security score with specific examples"
  }}
}}

## Scoring Guidelines:
- 90-100: Excellent, industry best practices
- 80-89: Good, minor improvements needed
- 70-79: Average, several areas need attention
- 60-69: Below average, significant improvements required
- 0-59: Poor, major refactoring needed

Calculate overall score as weighted average: Maintainability(25%) + Testability(20%) + Readability(20%) + Performance(20%) + Security(15%)
"""
    
    def _create_architecture_prompt(self, code: str, language: str, file_path: str) -> str:
        """Create prompt for architecture diagram generation."""
        return f"""
You are a software architecture expert. Extract comprehensive architectural components and relationships from this {language} code:

File: {file_path}
Code:
```{language}
{code}
```

## Architecture Analysis:

### Component Identification:
- **Functions**: Individual functions and their purposes
- **Classes**: Object-oriented classes, their methods and properties
- **Modules**: Imported modules and their usage
- **APIs**: Endpoints, interfaces, and external service calls
- **Data Structures**: Key data models and their relationships

### Relationship Mapping:
- **Function Calls**: Direct function invocations and call chains
- **Import Dependencies**: Module imports and their usage
- **Inheritance**: Class inheritance and composition patterns
- **Data Flow**: How data moves through the system
- **Control Flow**: Program execution flow and decision points

### Architecture Patterns:
- Identify design patterns used (MVC, Factory, Observer, etc.)
- Recognize architectural patterns (Layered, Microservices, Event-driven)
- Note coupling and cohesion relationships
- Identify potential architectural improvements

Provide JSON response with detailed graph structure:
{{
  "nodes": [
    {{
      "id": "unique_component_id",
      "type": "function|class|module|api|data_structure",
      "label": "Human-readable component name",
      "description": "Detailed description of what this component does and its role",
      "metadata": {{
        "line": 123,
        "size": 50,
        "complexity": "low|medium|high",
        "importance": "critical|important|supporting"
      }}
    }}
  ],
  "edges": [
    {{
      "id": "unique_edge_id",
      "source": "source_node_id",
      "target": "target_node_id",
      "label": "Specific relationship description (e.g., 'calls validate_input', 'inherits from BaseModel')",
      "type": "calls|imports|depends_on|inherits|implements|uses"
    }}
  ],
  "layout": "horizontal|vertical|circular"
}}

## Node Types:
- **function**: Individual functions and methods
- **class**: Object-oriented classes and interfaces
- **module**: External modules and libraries
- **api**: API endpoints and external service interfaces
- **data_structure**: Key data models and structures

## Edge Types:
- **calls**: Direct function/method calls
- **imports**: Module imports and dependencies
- **depends_on**: General dependency relationships
- **inherits**: Class inheritance relationships
- **implements**: Interface implementations
- **uses**: Data structure usage

## Important Instructions:
- Create meaningful, descriptive IDs and labels
- Include all significant components and relationships
- Provide detailed descriptions for complex components
- Use appropriate metadata to enhance understanding
- Choose the best layout for the component structure
"""
    
    def _create_mentor_prompt(self, code: str, language: str, file_path: str) -> str:
        """Create prompt for mentor insights generation."""
        return f"""
You are an expert coding mentor and educator. Assess the skill level demonstrated in this {language} code and create a personalized learning path:

File: {file_path}
Code:
```{language}
{code}
```

## Skill Assessment Analysis:

### Code Quality Indicators:
- **Code Structure**: Organization, modularity, separation of concerns
- **Best Practices**: Adherence to language conventions and industry standards
- **Problem Solving**: Approach to complex problems and algorithmic thinking
- **Design Patterns**: Usage of appropriate design patterns and architectural decisions
- **Error Handling**: Robustness and defensive programming practices
- **Testing**: Testability and testing considerations
- **Documentation**: Code documentation and self-documenting practices

### Skill Level Classification:
- **Beginner**: Basic syntax, simple logic, minimal patterns
- **Intermediate**: Good structure, some patterns, moderate complexity
- **Advanced**: Complex patterns, optimization, architectural thinking

### Learning Path Creation:
- Identify specific skill gaps and areas for improvement
- Create progressive learning modules with clear objectives
- Provide practical coding challenges and exercises
- Suggest relevant resources and documentation
- Estimate realistic timeframes for skill development

Provide JSON response:
{{
  "skill_level": "beginner|intermediate|advanced",
  "strengths": [
    "Specific strength with brief explanation (e.g., 'Excellent use of async/await patterns')"
  ],
  "weaknesses": [
    "Specific weakness with brief explanation (e.g., 'Limited error handling coverage')"
  ],
  "learning_path": [
    {{
      "title": "Specific learning module title",
      "description": "Detailed description of what will be learned and why it's important",
      "resources": [
        "https://specific-resource.com/topic",
        "Book: 'Specific Book Title' by Author",
        "Practice: 'Hands-on Exercise Description'"
      ],
      "estimated_time": "Realistic time estimate (e.g., '3-5 hours', '1 week')",
      "difficulty": "beginner|intermediate|advanced",
      "prerequisites": ["Required knowledge or skills"],
      "learning_objectives": [
        "Specific objective 1",
        "Specific objective 2"
      ],
      "practical_exercises": [
        "Exercise 1: Description of hands-on practice",
        "Exercise 2: Description of coding challenge"
      ]
    }}
  ],
  "challenges": [
    {{
      "title": "Challenge project title",
      "description": "Detailed description of the challenge and its learning value",
      "difficulty": "beginner|intermediate|advanced",
      "estimated_time": "Realistic completion time",
      "skills_practiced": ["specific skill 1", "specific skill 2"],
      "starter_code": "// TODO: implement specific functionality",
      "success_criteria": [
        "Criterion 1: Specific measurable outcome",
        "Criterion 2: Quality standard to meet"
      ],
      "hints": [
        "Helpful hint 1",
        "Helpful hint 2"
      ]
    }}
  ],
  "estimated_time": "Overall time estimate for complete learning path",
  "next_milestone": "Specific, achievable next milestone with clear success criteria",
  "career_advice": "Brief career development advice based on current skill level and code analysis"
}}

## Important Guidelines:
- Be specific and actionable in all recommendations
- Provide realistic time estimates based on typical learning curves
- Include diverse learning resources (documentation, books, videos, hands-on practice)
- Create progressive challenges that build on each other
- Focus on practical, applicable skills
- Consider the developer's current level and provide appropriate scaffolding
"""


# Global instance
_code_analysis_service = None

def get_code_analysis_service() -> CodeAnalysisService:
    """Get or create global CodeAnalysisService instance."""
    global _code_analysis_service
    if _code_analysis_service is None:
        _code_analysis_service = CodeAnalysisService()
    return _code_analysis_service
