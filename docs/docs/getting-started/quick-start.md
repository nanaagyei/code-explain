# Quick Start

Get up and running with CodeExplain in just a few minutes! This guide will walk you through creating your first AI-powered code documentation.

## Step 1: Access CodeExplain

1. Open your browser and navigate to `http://localhost:3000`
2. You'll see the CodeExplain welcome page

## Step 2: Create Your Account

1. Click **"Get Started"** or **"Sign Up"**
2. Fill in your details:
   - **Email**: Your email address
   - **Password**: A secure password
   - **Full Name**: Your display name
3. Click **"Create Account"**

## Step 3: Create Your First Repository

### Option A: Upload Local Files

1. Click **"New Repository"** on the dashboard
2. Fill in repository details:
   - **Name**: `my-first-project`
   - **Description**: `Learning CodeExplain with a sample project`
   - **Language**: Select your primary language
3. Click **"Create Repository"**

### Option B: Import from GitHub

1. Click **"Import from GitHub"**
2. Paste your GitHub repository URL
3. Click **"Import Repository"**
4. Wait for the import to complete

## Step 4: Upload Your Code

### Drag & Drop Upload

1. Navigate to your repository
2. Click **"Upload Files"**
3. Drag and drop your code files into the upload area
4. Click **"Upload"**

### Supported File Types

CodeExplain supports a wide range of programming languages:

- **Web**: `.js`, `.ts`, `.jsx`, `.tsx`, `.html`, `.css`, `.scss`
- **Python**: `.py`, `.pyx`
- **Java**: `.java`, `.kt`
- **C/C++**: `.c`, `.cpp`, `.h`, `.hpp`
- **Go**: `.go`
- **Rust**: `.rs`
- **PHP**: `.php`
- **Ruby**: `.rb`
- **And many more!**

## Step 5: Generate AI Documentation

### Automatic Documentation

1. Once files are uploaded, CodeExplain will automatically:
   - Parse your code structure
   - Generate comprehensive documentation
   - Analyze code quality
   - Create architecture diagrams

### Manual Documentation

1. Click on any file in your repository
2. You'll see the **File Documentation** page with tabs:
   - **Documentation**: AI-generated documentation
   - **Code Review**: Security and performance analysis
   - **Quality Score**: 5-dimensional quality metrics
   - **Architecture**: Interactive code structure diagram

## Step 6: Explore AI Features

### Code Review

1. Click the **"Code Review"** tab
2. Click **"Generate Review"** to analyze your code
3. Review the results:
   - **Security Issues**: Vulnerabilities and fixes
   - **Performance Issues**: Optimization suggestions
   - **Best Practices**: Code improvement recommendations

### Quality Metrics

1. Click the **"Quality Score"** tab
2. Click **"Calculate Metrics"** to get quality scores
3. View your scores:
   - **Maintainability**: Code structure and modularity
   - **Testability**: How easy it is to test
   - **Readability**: Code clarity and documentation
   - **Performance**: Algorithm efficiency
   - **Security**: Vulnerability assessment

### Architecture Diagram

1. Click the **"Architecture"** tab
2. Click **"Generate Diagram"** to create a visual representation
3. Explore the interactive diagram:
   - **Nodes**: Functions, classes, modules
   - **Edges**: Relationships and dependencies
   - **Zoom/Pan**: Navigate the diagram
   - **Export**: Save as PNG or SVG

## Step 7: AI Mentor Dashboard

### Access Mentor Features

1. Click **"AI Mentor"** in the navigation
2. Explore your personalized dashboard:
   - **Skill Assessment**: Your current skill level
   - **Learning Path**: Recommended next steps
   - **Challenges**: Practice exercises
   - **Progress Tracking**: Your improvement over time

### Get Personalized Insights

1. The AI Mentor analyzes your code patterns
2. Provides skill-level assessment
3. Suggests learning paths based on your code
4. Recommends challenges to improve your skills

## Step 8: Bulk Operations

### Process Multiple Repositories

1. Go to the **Dashboard**
2. Click **"Bulk Operations"**
3. Select multiple repositories
4. Choose analysis types:
   - Code Review
   - Quality Metrics
   - Architecture Diagrams
   - Mentor Insights
5. Click **"Start Batch Processing"**

## Step 9: Customize Your Experience

### Custom AI Prompts

1. Go to **Settings** → **AI Prompts**
2. Customize documentation style:
   - **Tone**: Formal, casual, technical
   - **Detail Level**: Brief, comprehensive, expert
   - **Focus Areas**: Security, performance, best practices
3. Save your preferences

### API Key Management

1. Go to **Settings** → **API Keys**
2. Add your OpenAI API key for enhanced features
3. Configure usage limits and monitoring

## Step 10: Export and Share

### Export Documentation

1. Navigate to any file's documentation
2. Click **"Export"** button
3. Choose format:
   - **Markdown**: For GitHub, GitLab, etc.
   - **PDF**: For offline reading
   - **HTML**: For web publishing

### Share with Team

1. Use the **"Share"** button to get a public link
2. Set permissions (view-only or editable)
3. Share the link with your team members

## Example: Python Function Documentation

Here's what CodeExplain generates for a simple Python function:

**Input Code:**
```python
def calculate_fibonacci(n):
    if n <= 1:
        return n
    return calculate_fibonacci(n-1) + calculate_fibonacci(n-2)
```

**Generated Documentation:**
```markdown
# calculate_fibonacci

## Overview
Calculates the nth Fibonacci number using recursive approach.

## Parameters
- `n` (int): The position in the Fibonacci sequence

## Returns
- `int`: The Fibonacci number at position n

## Algorithm
Uses recursive approach with base cases for n <= 1.

## Performance
- Time Complexity: O(2^n) - Exponential
- Space Complexity: O(n) - Linear due to recursion stack

## Security Considerations
- No input validation - could cause stack overflow for large n
- Consider adding bounds checking

## Best Practices
- Consider iterative approach for better performance
- Add input validation
- Consider memoization for repeated calculations
```

## Tips for Best Results

### 1. Clean Code Structure
- Use meaningful variable and function names
- Add comments for complex logic
- Follow consistent coding style

### 2. Comprehensive Files
- Include multiple functions/classes per file
- Show relationships between components
- Provide context through imports and dependencies

### 3. Regular Updates
- Re-generate documentation when code changes
- Use bulk operations for large codebases
- Monitor quality metrics over time

## Next Steps

Now that you've created your first documentation:

1. **[Configuration Guide](./configuration.md)** - Customize CodeExplain for your needs
2. **[Features Overview](/docs/features/ai-documentation)** - Explore all available features
3. **[API Reference](/docs/api/backend-api)** - Integrate CodeExplain into your workflow

## Getting Help

- **Documentation**: Browse our comprehensive guides
- **GitHub Issues**: Report bugs or request features
- **Discord Community**: Join our developer community
- **Email Support**: Contact us for enterprise support

---

**Congratulations!** You've successfully created your first AI-powered code documentation with CodeExplain. The platform is now ready to help you document, analyze, and improve your code with the power of artificial intelligence.
