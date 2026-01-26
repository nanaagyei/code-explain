# Quick Start

Get up and running with CodeXplain in just a few minutes! This guide will walk you through creating your first AI-powered code documentation.

## Step 1: Access CodeXplain

1. Open your browser and navigate to `http://localhost:3000` (or your deployed app URL).
2. You'll see the CodeXplain welcome page.

### Sign in or sign up

Use the login page to sign in or create an account:

![CodeXplain login](/login.png)

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
   - **Description**: `Learning CodeXplain with a sample project`
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

CodeXplain focuses on deep support for core languages:

- **JavaScript/TypeScript**: `.js`, `.jsx`, `.ts`, `.tsx`
- **Python**: `.py`
- **Java**: `.java`
- **C/C++**: `.c`, `.h`, `.cpp`, `.hpp`
- **Go**: `.go`
- **Rust**: `.rs`

## Step 5: Generate AI Documentation

### Automatic Documentation

1. Once files are uploaded, CodeXplain will automatically:
   - Parse your code structure
   - Generate comprehensive documentation
   - Analyze code quality
   - Create architecture diagrams

### Manual Documentation

1. Click on any file in your repository
2. You'll see the **File Documentation** page with tabs:
   - **Documentation**: AI-generated documentation
   - **Code Review**: Security and performance analysis
   - **Health Score**: Single score with detailed breakdown
   - **Architecture**: Interactive code structure diagram

## Step 6: Explore AI Features

### Code Review

1. Click the **"Code Review"** tab
2. Click **"Generate Review"** to analyze your code
3. Review the results:
   - **Security Issues**: Vulnerabilities and fixes
   - **Performance Issues**: Optimization suggestions
   - **Best Practices**: Code improvement recommendations

### Health Score

1. Click the **"Health Score"** tab
2. Click **"Calculate Health Score"** to get your score
3. Review the breakdown:
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

## Step 7: Customize Your Experience

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

## Step 8: Export and Share

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

Here's what CodeXplain generates for a simple Python function:

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
- Monitor quality metrics over time

## Next Steps

Now that you've created your first documentation:

1. **[Configuration Guide](./configuration.md)** — Customize CodeXplain for your needs
2. **[Features Overview](/docs/features/ai-documentation)** - Explore all available features
3. **[API Reference](/docs/api/backend-api)** — Integrate CodeXplain into your workflow

## Getting Help

- **Documentation**: Browse our comprehensive guides
- **GitHub Issues**: Report bugs or request features
- **Discord Community**: Join our developer community
- **Email Support**: Contact us for enterprise support

---

**Congratulations!** You've successfully created your first AI-powered code documentation with CodeXplain. The platform is now ready to help you document, analyze, and improve your code with the power of artificial intelligence.
