# AI Documentation

Code Explain's AI Documentation feature automatically generates comprehensive, accurate, and maintainable documentation for your codebase using advanced AI models trained specifically on code understanding and documentation best practices.

## Overview

The AI Documentation feature analyzes your code and generates:
- Function and method documentation
- Class and interface documentation
- API documentation
- README files
- Architecture overviews
- Code examples and usage guides

## Key Features

### Intelligent Code Analysis
- **Context Understanding**: Analyzes code context, dependencies, and usage patterns
- **Pattern Recognition**: Identifies common patterns and best practices
- **Type Inference**: Automatically infers parameter and return types
- **Complexity Assessment**: Evaluates code complexity for appropriate documentation depth

### Multiple Documentation Styles
- **JSDoc**: JavaScript/TypeScript documentation format
- **Python Docstrings**: PEP 257 compliant Python documentation
- **JavaDoc**: Java documentation format
- **GoDoc**: Go documentation format
- **Markdown**: General-purpose documentation format

### Smart Content Generation
- **Parameter Descriptions**: Detailed parameter documentation with types and constraints
- **Return Value Documentation**: Clear return value descriptions and examples
- **Usage Examples**: Practical code examples showing how to use functions
- **Error Handling**: Documentation of exceptions and error conditions
- **Performance Notes**: Performance considerations and optimization tips

## Usage

### Basic Documentation Generation

```javascript
import { CodeExplain } from '@codeexplain/sdk';

const codeExplain = new CodeExplain({
  apiKey: 'your-api-key'
});

// Generate documentation for a function
const docs = await codeExplain.generateDocumentation({
  code: `
    function calculateTotal(items, taxRate = 0.1) {
      if (!Array.isArray(items)) {
        throw new Error('Items must be an array');
      }
      
      const subtotal = items.reduce((sum, item) => sum + item.price, 0);
      const tax = subtotal * taxRate;
      return subtotal + tax;
    }
  `,
  language: 'javascript',
  style: 'jsdoc'
});

console.log(docs);
```

**Generated Documentation:**
```javascript
/**
 * Calculates the total price of items including tax
 * 
 * @param {Array<Object>} items - Array of items with price property
 * @param {number} [taxRate=0.1] - Tax rate as decimal (default: 0.1)
 * @returns {number} Total price including tax
 * 
 * @throws {Error} Throws error if items is not an array
 * 
 * @example
 * const items = [
 *   { price: 10.00 },
 *   { price: 20.00 }
 * ];
 * const total = calculateTotal(items, 0.15); // Returns 34.50
 * 
 * @performance O(n) time complexity where n is the number of items
 */
function calculateTotal(items, taxRate = 0.1) {
  // ... implementation
}
```

### Class Documentation

```python
# Input Python code
class UserManager:
    def __init__(self, database):
        self.db = database
        self.cache = {}
    
    def get_user(self, user_id):
        if user_id in self.cache:
            return self.cache[user_id]
        
        user = self.db.query("SELECT * FROM users WHERE id = %s", user_id)
        if user:
            self.cache[user_id] = user
        return user
    
    def create_user(self, user_data):
        # Implementation
        pass
```

**Generated Documentation:**
```python
class UserManager:
    """
    Manages user operations with caching support
    
    This class provides methods for user management including retrieval,
    creation, and caching for improved performance.
    
    Attributes:
        db: Database connection instance
        cache: Dictionary for caching user data
    """
    
    def __init__(self, database):
        """
        Initialize UserManager with database connection
        
        Args:
            database: Database connection instance
        """
        self.db = database
        self.cache = {}
    
    def get_user(self, user_id):
        """
        Retrieve user by ID with caching
        
        First checks the cache for the user, then queries the database
        if not found. Caches the result for future requests.
        
        Args:
            user_id (int): Unique identifier for the user
            
        Returns:
            dict: User data dictionary or None if not found
            
        Example:
            >>> manager = UserManager(db)
            >>> user = manager.get_user(123)
            >>> print(user['name'])
            'John Doe'
        """
        # ... implementation
```

### API Documentation Generation

```javascript
// Generate API documentation for Express.js routes
const apiDocs = await codeExplain.generateAPIDocumentation({
  routes: [
    {
      method: 'GET',
      path: '/api/users/:id',
      handler: getUserHandler,
      middleware: [authMiddleware, rateLimitMiddleware]
    },
    {
      method: 'POST',
      path: '/api/users',
      handler: createUserHandler,
      middleware: [authMiddleware, validateUserData]
    }
  ],
  style: 'openapi',
  includeExamples: true
});
```

**Generated OpenAPI Specification:**
```yaml
openapi: 3.0.0
info:
  title: User API
  version: 1.0.0
paths:
  /api/users/{id}:
    get:
      summary: Get user by ID
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      responses:
        '200':
          description: User data
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '404':
          description: User not found
  /api/users:
    post:
      summary: Create new user
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateUserRequest'
      responses:
        '201':
          description: User created successfully
```

## Advanced Features

### Context-Aware Documentation

The AI considers the broader codebase context when generating documentation:

```javascript
// When analyzing this function in a React component context
const Button = ({ children, variant = 'primary', onClick }) => {
  return (
    <button 
      className={`btn btn-${variant}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
```

**Context-Aware Documentation:**
```javascript
/**
 * Reusable button component with variant support
 * 
 * @param {React.ReactNode} children - Button content
 * @param {'primary' | 'secondary' | 'danger'} [variant='primary'] - Button style variant
 * @param {Function} onClick - Click event handler
 * 
 * @returns {JSX.Element} Styled button element
 * 
 * @example
 * <Button variant="primary" onClick={handleClick}>
 *   Click me
 * </Button>
 * 
 * @see {@link https://reactjs.org/docs/components-and-props.html} React Components
 */
```

### Multi-Language Support

Generate documentation in multiple languages:

```javascript
const multiLangDocs = await codeExplain.generateDocumentation({
  code: userFunction,
  language: 'javascript',
  outputLanguages: ['en', 'es', 'fr', 'de'],
  style: 'jsdoc'
});

// Returns documentation in English, Spanish, French, and German
```

### Documentation Templates

Use custom templates for consistent documentation style:

```javascript
const customDocs = await codeExplain.generateDocumentation({
  code: functionCode,
  template: {
    style: 'jsdoc',
    sections: ['description', 'parameters', 'returns', 'examples', 'seeAlso'],
    includePerformance: true,
    includeSecurity: true,
    customFormatting: {
      parameterFormat: 'detailed',
      exampleFormat: 'comprehensive'
    }
  }
});
```

## Integration Options

### IDE Integration

Generate documentation directly in your IDE:

```javascript
// VS Code extension
const vscode = require('vscode');

function generateDocsForSelection() {
  const editor = vscode.window.activeTextEditor;
  const selection = editor.selection;
  const code = editor.document.getText(selection);
  
  codeExplain.generateDocumentation({
    code: code,
    language: getLanguageFromExtension(editor.document.fileName)
  }).then(docs => {
    editor.edit(editBuilder => {
      editBuilder.insert(selection.start, docs);
    });
  });
}
```

### CI/CD Integration

Automatically generate documentation in your build pipeline:

```yaml
# GitHub Actions workflow
name: Generate Documentation
on:
  push:
    branches: [main]

jobs:
  generate-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Generate AI Documentation
        run: |
          npx codeexplain docs generate \
            --input src/ \
            --output docs/ \
            --style jsdoc \
            --include-examples
```

### Git Hooks

Generate documentation on commit:

```bash
#!/bin/sh
# pre-commit hook
echo "Generating documentation for changed files..."

git diff --cached --name-only | grep '\.js$' | while read file; do
  echo "Generating docs for $file"
  codeexplain docs generate "$file" --style jsdoc --in-place
  git add "$file"
done
```

## Configuration

### Documentation Settings

```javascript
const docConfig = {
  // Style preferences
  style: 'jsdoc',
  language: 'en',
  
  // Content options
  includeExamples: true,
  includePerformance: true,
  includeSecurity: true,
  includeDeprecation: true,
  
  // Formatting options
  lineLength: 80,
  indentSize: 2,
  useTabs: false,
  
  // AI preferences
  detailLevel: 'comprehensive', // 'basic', 'detailed', 'comprehensive'
  tone: 'professional', // 'casual', 'professional', 'technical'
  audience: 'developers' // 'beginners', 'developers', 'experts'
};
```

### Custom Prompts

Customize AI behavior with custom prompts:

```javascript
const customPrompt = `
Generate documentation for this function following these guidelines:
1. Use clear, concise language
2. Include practical examples
3. Mention performance implications
4. Document error conditions
5. Use JSDoc format
`;

const docs = await codeExplain.generateDocumentation({
  code: functionCode,
  customPrompt: customPrompt,
  style: 'jsdoc'
});
```

## Quality Assurance

### Documentation Validation

Validate generated documentation for completeness and accuracy:

```javascript
const validation = await codeExplain.validateDocumentation({
  code: originalCode,
  documentation: generatedDocs,
  checks: [
    'completeness',      // All parameters documented
    'accuracy',          // Documentation matches implementation
    'examples',          // Examples are valid
    'formatting',        // Proper formatting
    'consistency'        // Consistent style
  ]
});

if (!validation.isValid) {
  console.log('Documentation issues:', validation.issues);
}
```

### Documentation Testing

Test that documentation examples work correctly:

```javascript
const testResults = await codeExplain.testDocumentation({
  code: functionCode,
  documentation: generatedDocs,
  runExamples: true,
  validateTypes: true
});

console.log('Example tests passed:', testResults.examplesPassed);
console.log('Type validation passed:', testResults.typesValid);
```

## Best Practices

### Documentation Standards

1. **Consistency**: Use consistent terminology and formatting
2. **Completeness**: Document all public APIs and parameters
3. **Accuracy**: Ensure documentation matches implementation
4. **Examples**: Include practical, working examples
5. **Maintenance**: Keep documentation updated with code changes

### Code Organization

```javascript
// Well-structured code for better documentation
class PaymentProcessor {
  /**
   * Process payment with validation and error handling
   * 
   * @param {PaymentRequest} request - Payment request object
   * @param {PaymentOptions} options - Processing options
   * @returns {Promise<PaymentResult>} Payment processing result
   * 
   * @throws {ValidationError} When request validation fails
   * @throws {PaymentError} When payment processing fails
   * 
   * @example
   * const result = await processor.processPayment({
   *   amount: 100.00,
   *   currency: 'USD',
   *   method: 'credit_card'
   * });
   */
  async processPayment(request, options = {}) {
    // Implementation
  }
}
```

## Troubleshooting

### Common Issues

**Incomplete Documentation**
- Ensure code has clear function signatures
- Add type annotations where possible
- Use descriptive variable names

**Inaccurate Examples**
- Test examples before including them
- Use realistic data in examples
- Keep examples simple and focused

**Formatting Issues**
- Check documentation style configuration
- Validate against style guide
- Use consistent indentation

### Debug Mode

Enable debug mode for detailed documentation generation logs:

```bash
export CODEEXPLAIN_DEBUG=true
export DOCS_DEBUG=true
```

## Support

- **Documentation Examples**: [https://docs.codeexplain.com/examples](https://docs.codeexplain.com/examples)
- **Style Guide**: [https://docs.codeexplain.com/style-guide](https://docs.codeexplain.com/style-guide)
- **Support Email**: docs-support@codeexplain.com
- **Community**: [https://discord.gg/codeexplain](https://discord.gg/codeexplain)
