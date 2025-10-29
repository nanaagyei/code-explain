# Contributing

Thank you for your interest in contributing to Code Explain! This guide will help you get started with contributing to the project, whether you're fixing bugs, adding features, or improving documentation.

## Overview

Code Explain is an open-source project that welcomes contributions from developers of all skill levels. We believe in fostering a collaborative environment where everyone can contribute meaningfully to the project.

## Getting Started

### Prerequisites

Before you begin contributing, make sure you have:

- **Node.js** (v18 or higher)
- **Python** (v3.9 or higher)
- **Git** (v2.20 or higher)
- **Docker** (v20 or higher) - for local development
- **PostgreSQL** (v14 or higher) - for database operations
- **Redis** (v7 or higher) - for caching

### Development Environment Setup

1. **Fork and Clone the Repository**
   ```bash
   git clone https://github.com/your-username/code-explain.git
   cd code-explain
   ```

2. **Install Dependencies**
   ```bash
   # Install Node.js dependencies
   npm install
   
   # Install Python dependencies
   pip install -r requirements.txt
   
   # Install development dependencies
   npm run install:dev
   ```

3. **Set Up Environment Variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start Development Services**
   ```bash
   # Start database and Redis
   docker-compose up -d db redis
   
   # Run database migrations
   npm run db:migrate
   
   # Start development servers
   npm run dev
   ```

## Contribution Types

### Bug Reports

When reporting bugs, please include:

- **Clear Description**: What happened vs. what you expected
- **Steps to Reproduce**: Detailed steps to reproduce the issue
- **Environment Details**: OS, Node.js version, browser, etc.
- **Screenshots/Logs**: Visual evidence of the issue
- **Code Samples**: Minimal code that reproduces the issue

**Bug Report Template:**
```markdown
## Bug Description
Brief description of the bug

## Steps to Reproduce
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

## Expected Behavior
What you expected to happen

## Actual Behavior
What actually happened

## Environment
- OS: [e.g., macOS 12.0]
- Node.js: [e.g., v18.0.0]
- Browser: [e.g., Chrome 91.0]
- Code Explain Version: [e.g., v1.2.3]

## Additional Context
Any other context about the problem
```

### Feature Requests

When requesting features, please provide:

- **Use Case**: Why this feature would be valuable
- **Proposed Solution**: How you envision the feature working
- **Alternatives**: Other solutions you've considered
- **Additional Context**: Any other relevant information

**Feature Request Template:**
```markdown
## Feature Description
Brief description of the feature

## Use Case
Why would this feature be valuable?

## Proposed Solution
How should this feature work?

## Alternatives Considered
What other solutions have you considered?

## Additional Context
Any other context about the feature request
```

### Code Contributions

#### Code Style Guidelines

**JavaScript/TypeScript:**
```typescript
// Use TypeScript for type safety
interface User {
  id: string;
  email: string;
  name: string;
}

// Use async/await for asynchronous operations
async function getUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
}

// Use meaningful variable names
const userEmail = user.email;
const isUserActive = user.status === 'active';

// Use JSDoc for function documentation
/**
 * Calculates the total price including tax
 * @param items - Array of items with price property
 * @param taxRate - Tax rate as decimal (default: 0.1)
 * @returns Total price including tax
 */
function calculateTotal(items: Item[], taxRate = 0.1): number {
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  return subtotal * (1 + taxRate);
}
```

**Python:**
```python
# Use type hints for better code clarity
from typing import List, Dict, Optional

def analyze_code(code: str, language: str) -> Dict[str, any]:
    """
    Analyze code for quality metrics and suggestions.
    
    Args:
        code: The source code to analyze
        language: Programming language of the code
        
    Returns:
        Dictionary containing analysis results
    """
    # Implementation here
    pass

# Use meaningful variable names
user_email = user.email
is_user_active = user.status == 'active'

# Follow PEP 8 style guidelines
class CodeAnalyzer:
    def __init__(self, config: Dict[str, any]):
        self.config = config
        self.results = {}
    
    def analyze(self, code: str) -> Dict[str, any]:
        """Analyze code and return results."""
        # Implementation here
        return self.results
```

#### Testing Requirements

**Unit Tests:**
```typescript
// Jest test example
import { calculateTotal } from '../src/utils/calculations';

describe('calculateTotal', () => {
  it('should calculate total with default tax rate', () => {
    const items = [
      { price: 10 },
      { price: 20 }
    ];
    
    const total = calculateTotal(items);
    expect(total).toBe(33); // 30 * 1.1
  });
  
  it('should calculate total with custom tax rate', () => {
    const items = [
      { price: 100 }
    ];
    
    const total = calculateTotal(items, 0.15);
    expect(total).toBe(115);
  });
  
  it('should handle empty items array', () => {
    const total = calculateTotal([]);
    expect(total).toBe(0);
  });
});
```

**Integration Tests:**
```typescript
// Integration test example
import request from 'supertest';
import app from '../src/app';

describe('API /analyze endpoint', () => {
  it('should analyze code successfully', async () => {
    const response = await request(app)
      .post('/api/analyze')
      .send({
        code: 'function test() { return "hello"; }',
        language: 'javascript'
      })
      .expect(200);
    
    expect(response.body).toHaveProperty('analysis');
    expect(response.body.analysis).toHaveProperty('complexity');
  });
  
  it('should return 400 for invalid input', async () => {
    await request(app)
      .post('/api/analyze')
      .send({
        code: '',
        language: 'javascript'
      })
      .expect(400);
  });
});
```

**Python Tests:**
```python
# pytest example
import pytest
from src.analyzer import CodeAnalyzer

class TestCodeAnalyzer:
    def setup_method(self):
        self.analyzer = CodeAnalyzer()
    
    def test_analyze_simple_function(self):
        code = "def hello():\n    return 'world'"
        result = self.analyzer.analyze(code)
        
        assert 'complexity' in result
        assert result['complexity'] == 1
    
    def test_analyze_empty_code(self):
        result = self.analyzer.analyze("")
        assert result['complexity'] == 0
    
    def test_analyze_invalid_syntax(self):
        with pytest.raises(SyntaxError):
            self.analyzer.analyze("def hello(")
```

#### Commit Message Guidelines

Use conventional commits format:

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(api): add bulk analysis endpoint

Add new endpoint for analyzing multiple files simultaneously.
Includes parallel processing and progress tracking.

Closes #123
```

```
fix(auth): resolve JWT token expiration issue

Fix issue where JWT tokens were not being refreshed properly
when approaching expiration time.

Fixes #456
```

```
docs(readme): update installation instructions

Update installation instructions to include Docker setup
and environment variable configuration.
```

## Development Workflow

### Branch Strategy

We use GitFlow with the following branch structure:

- `main`: Production-ready code
- `develop`: Integration branch for features
- `feature/*`: Feature development branches
- `bugfix/*`: Bug fix branches
- `hotfix/*`: Critical bug fixes for production

### Pull Request Process

1. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**
   - Write your code following the style guidelines
   - Add tests for new functionality
   - Update documentation as needed

3. **Test Your Changes**
   ```bash
   # Run unit tests
   npm test
   
   # Run integration tests
   npm run test:integration
   
   # Run linting
   npm run lint
   
   # Run type checking
   npm run type-check
   ```

4. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat(api): add new analysis endpoint"
   ```

5. **Push and Create Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create Pull Request**
   - Use the PR template
   - Link related issues
   - Request reviews from maintainers

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] No breaking changes (or documented)

## Related Issues
Closes #123
```

## Code Review Process

### Review Guidelines

**For Reviewers:**
- Be constructive and respectful
- Focus on code quality and maintainability
- Check for security vulnerabilities
- Ensure tests are adequate
- Verify documentation is updated

**For Authors:**
- Respond to feedback promptly
- Make requested changes
- Ask questions if feedback is unclear
- Update tests if needed

### Review Checklist

- [ ] Code follows style guidelines
- [ ] Tests are comprehensive and pass
- [ ] Documentation is updated
- [ ] No security vulnerabilities
- [ ] Performance implications considered
- [ ] Error handling is appropriate
- [ ] Code is maintainable and readable

## Documentation Contributions

### Documentation Types

1. **API Documentation**: OpenAPI/Swagger specifications
2. **User Guides**: Step-by-step tutorials and guides
3. **Developer Documentation**: Architecture and development guides
4. **Code Comments**: Inline code documentation

### Documentation Standards

- Use clear, concise language
- Include code examples
- Keep documentation up-to-date
- Use consistent formatting
- Include screenshots for UI changes

## Community Guidelines

### Code of Conduct

We are committed to providing a welcoming and inclusive environment for all contributors. Please:

- Be respectful and constructive
- Focus on what's best for the community
- Show empathy towards others
- Accept constructive criticism gracefully
- Help others learn and grow

### Getting Help

- **Discord**: Join our Discord community for real-time help
- **GitHub Discussions**: Use GitHub Discussions for questions
- **Email**: Contact maintainers directly for sensitive issues
- **Documentation**: Check existing documentation first

## Release Process

### Versioning

We use Semantic Versioning (SemVer):
- `MAJOR`: Breaking changes
- `MINOR`: New features (backward compatible)
- `PATCH`: Bug fixes (backward compatible)

### Release Schedule

- **Major Releases**: Every 6 months
- **Minor Releases**: Monthly
- **Patch Releases**: As needed for critical bugs

### Release Checklist

- [ ] All tests pass
- [ ] Documentation updated
- [ ] Changelog updated
- [ ] Version bumped
- [ ] Release notes prepared
- [ ] Security review completed

## Recognition

### Contributor Recognition

We recognize contributors in several ways:

- **Contributor Hall of Fame**: Featured on our website
- **Release Notes**: Contributors mentioned in release notes
- **Swag**: Code Explain merchandise for significant contributions
- **Conference Speaking**: Opportunities to speak at conferences

### Contribution Levels

- **Bronze**: 1-5 contributions
- **Silver**: 6-20 contributions
- **Gold**: 21-50 contributions
- **Platinum**: 50+ contributions

## Getting Started Checklist

- [ ] Read this contributing guide
- [ ] Set up development environment
- [ ] Join Discord community
- [ ] Look for "good first issue" labels
- [ ] Start with documentation improvements
- [ ] Ask questions if you need help

## Resources

- **Project Roadmap**: [GitHub Projects](https://github.com/codeexplain/code-explain/projects)
- **Issue Tracker**: [GitHub Issues](https://github.com/codeexplain/code-explain/issues)
- **Discord Community**: [Join Discord](https://discord.gg/codeexplain)
- **Documentation**: [docs.codeexplain.com](https://docs.codeexplain.com)
- **API Reference**: [api.codeexplain.com](https://api.codeexplain.com)

Thank you for contributing to Code Explain! Your contributions help make this project better for everyone.
