# Custom Prompts

Code Explain's Custom Prompts feature allows you to create and use personalized AI prompts for code analysis, documentation generation, and development assistance. This enables you to tailor the AI's behavior to your specific needs, coding standards, and project requirements.

## Overview

Custom Prompts provide:
- **Personalized AI Behavior**: Customize how the AI analyzes and responds to your code
- **Project-Specific Guidance**: Create prompts tailored to your project's architecture and requirements
- **Team Standards**: Share custom prompts across your team for consistent analysis
- **Multiple Prompt Types**: Different prompts for different analysis tasks
- **Prompt Management**: Organize, version, and manage your custom prompts

## Key Features

### Prompt Customization
- **Analysis Prompts**: Customize code analysis behavior and focus areas
- **Documentation Prompts**: Control documentation style, tone, and content
- **Review Prompts**: Customize code review criteria and feedback style
- **Learning Prompts**: Personalize learning recommendations and explanations

### Prompt Management
- **Prompt Library**: Store and organize your custom prompts
- **Version Control**: Track changes and versions of your prompts
- **Sharing**: Share prompts with team members or the community
- **Templates**: Create reusable prompt templates for common scenarios

### Dynamic Prompting
- **Context-Aware**: Prompts adapt based on code context and project type
- **Variable Substitution**: Use variables in prompts for dynamic content
- **Conditional Logic**: Different prompts based on conditions
- **Multi-Step Prompts**: Chain multiple prompts for complex analysis

## Usage

### Creating Custom Prompts

```javascript
import { CodeExplain } from '@codeexplain/sdk';

const codeExplain = new CodeExplain({
  apiKey: 'your-api-key'
});

// Create a custom analysis prompt
const analysisPrompt = await codeExplain.prompts.create({
  name: 'React Component Analysis',
  type: 'analysis',
  description: 'Analyze React components with focus on performance and accessibility',
  content: `
    You are an expert React developer analyzing a React component.
    
    Focus on:
    1. Performance optimization opportunities
    2. Accessibility best practices
    3. Code maintainability
    4. TypeScript usage
    5. Testing considerations
    
    For each issue found, provide:
    - Specific problem description
    - Code example of the issue
    - Suggested solution with code
    - Explanation of why the solution is better
    - Priority level (high/medium/low)
    
    Be constructive and educational in your feedback.
  `,
  variables: {
    framework: 'react',
    experienceLevel: 'intermediate',
    projectType: 'web_application'
  }
});

console.log('Created prompt:', analysisPrompt.id);
```

### Using Custom Prompts

```javascript
// Use custom prompt for code analysis
const analysis = await codeExplain.analyze({
  code: `
    const UserProfile = ({ user }) => {
      const [loading, setLoading] = useState(false);
      
      const handleSubmit = async (data) => {
        setLoading(true);
        try {
          await updateUser(user.id, data);
        } finally {
          setLoading(false);
        }
      };
      
      return (
        <form onSubmit={handleSubmit}>
          <input type="text" defaultValue={user.name} />
          <button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </button>
        </form>
      );
    };
  `,
  language: 'typescript',
  prompt: 'React Component Analysis',
  options: {
    generateDocs: true,
    suggestImprovements: true
  }
});

console.log('Analysis with custom prompt:', analysis);
```

**Custom Prompt Analysis Response:**
```json
{
  "analysis": {
    "overallScore": 7.5,
    "feedback": [
      {
        "category": "performance",
        "priority": "medium",
        "issue": "Missing React.memo optimization",
        "description": "Component re-renders on every parent render",
        "code": "const UserProfile = ({ user }) => { ... }",
        "solution": "const UserProfile = React.memo(({ user }) => { ... })",
        "explanation": "React.memo prevents unnecessary re-renders when props haven't changed",
        "impact": "Reduces render cycles and improves performance"
      },
      {
        "category": "accessibility",
        "priority": "high",
        "issue": "Missing form labels",
        "description": "Input field lacks proper labeling",
        "code": "<input type=\"text\" defaultValue={user.name} />",
        "solution": "<label htmlFor=\"user-name\">Name</label>\n<input id=\"user-name\" type=\"text\" defaultValue={user.name} />",
        "explanation": "Labels improve accessibility for screen readers",
        "impact": "Essential for users with disabilities"
      }
    ]
  }
}
```

### Documentation Prompts

```javascript
// Create custom documentation prompt
const docPrompt = await codeExplain.prompts.create({
  name: 'API Documentation Style',
  type: 'documentation',
  description: 'Generate API documentation in our team style',
  content: `
    Generate comprehensive API documentation following these guidelines:
    
    1. Use JSDoc format with TypeScript types
    2. Include practical examples for each function
    3. Document all parameters with types and constraints
    4. Include error conditions and exceptions
    5. Add performance notes where relevant
    6. Use clear, concise language
    7. Include usage patterns and best practices
    
    Example format:
    /**
     * Brief description of the function
     * 
     * @param {Type} paramName - Description of parameter
     * @returns {Type} Description of return value
     * 
     * @throws {ErrorType} When error condition occurs
     * 
     * @example
     * const result = functionName(param);
     * 
     * @performance O(n) time complexity
     */
  `,
  variables: {
    team: 'backend',
    style: 'jsdoc',
    includeExamples: true
  }
});

// Use custom documentation prompt
const docs = await codeExplain.generateDocumentation({
  code: functionCode,
  prompt: 'API Documentation Style',
  options: {
    includeExamples: true,
    includePerformance: true
  }
});
```

### Review Prompts

```javascript
// Create custom code review prompt
const reviewPrompt = await codeExplain.prompts.create({
  name: 'Security-Focused Review',
  type: 'review',
  description: 'Code review with emphasis on security vulnerabilities',
  content: `
    Conduct a thorough security-focused code review:
    
    1. **Input Validation**: Check for proper input sanitization
    2. **Authentication**: Verify secure authentication patterns
    3. **Authorization**: Ensure proper access controls
    4. **Data Protection**: Check for sensitive data exposure
    5. **SQL Injection**: Look for SQL injection vulnerabilities
    6. **XSS Prevention**: Check for cross-site scripting risks
    7. **CSRF Protection**: Verify CSRF protection measures
    8. **Secrets Management**: Check for hardcoded secrets
    
    For each security issue:
    - Rate severity (critical/high/medium/low)
    - Provide specific remediation steps
    - Include code examples
    - Reference relevant security standards
  `,
  variables: {
    securityLevel: 'high',
    compliance: 'SOC2'
  }
});

// Use security review prompt
const securityReview = await codeExplain.reviewCode({
  code: userCode,
  prompt: 'Security-Focused Review',
  options: {
    includeSuggestions: true,
    severityLevel: 'high'
  }
});
```

## Advanced Features

### Dynamic Prompt Variables

```javascript
// Create prompt with dynamic variables
const dynamicPrompt = await codeExplain.prompts.create({
  name: 'Context-Aware Analysis',
  type: 'analysis',
  content: `
    Analyze this {{language}} code for a {{projectType}} project.
    
    Consider the following based on the developer's experience level ({{experienceLevel}}):
    - {{#if experienceLevel === 'beginner'}}Focus on basic best practices and common mistakes{{/if}}
    - {{#if experienceLevel === 'intermediate'}}Focus on performance and maintainability{{/if}}
    - {{#if experienceLevel === 'advanced'}}Focus on advanced patterns and optimization{{/if}}
    
    Project context: {{projectType}}
    - {{#if projectType === 'web_application'}}Consider web-specific concerns like SEO and accessibility{{/if}}
    - {{#if projectType === 'mobile_app'}}Consider mobile-specific concerns like battery usage and performance{{/if}}
    - {{#if projectType === 'api'}}Consider API-specific concerns like rate limiting and security{{/if}}
  `,
  variables: {
    language: 'javascript',
    projectType: 'web_application',
    experienceLevel: 'intermediate'
  }
});

// Use with different contexts
const webAnalysis = await codeExplain.analyze({
  code: webCode,
  prompt: 'Context-Aware Analysis',
  context: {
    language: 'typescript',
    projectType: 'web_application',
    experienceLevel: 'intermediate'
  }
});

const mobileAnalysis = await codeExplain.analyze({
  code: mobileCode,
  prompt: 'Context-Aware Analysis',
  context: {
    language: 'swift',
    projectType: 'mobile_app',
    experienceLevel: 'advanced'
  }
});
```

### Multi-Step Prompts

```javascript
// Create multi-step analysis prompt
const multiStepPrompt = await codeExplain.prompts.create({
  name: 'Comprehensive Code Review',
  type: 'multi_step',
  steps: [
    {
      name: 'initial_analysis',
      prompt: 'Analyze the code structure and identify main components',
      output: 'structure_analysis'
    },
    {
      name: 'quality_review',
      prompt: 'Review code quality based on the structure analysis: {{structure_analysis}}',
      output: 'quality_feedback'
    },
    {
      name: 'security_check',
      prompt: 'Check for security issues based on quality feedback: {{quality_feedback}}',
      output: 'security_issues'
    },
    {
      name: 'final_recommendations',
      prompt: 'Provide final recommendations combining all analysis: {{structure_analysis}}, {{quality_feedback}}, {{security_issues}}',
      output: 'final_recommendations'
    }
  ]
});

// Use multi-step prompt
const comprehensiveReview = await codeExplain.analyze({
  code: complexCode,
  prompt: 'Comprehensive Code Review',
  options: {
    includeIntermediateResults: true
  }
});
```

### Prompt Templates

```javascript
// Create reusable prompt template
const templatePrompt = await codeExplain.prompts.createTemplate({
  name: 'Component Analysis Template',
  description: 'Template for analyzing UI components',
  template: `
    Analyze this {{componentType}} component:
    
    1. **Functionality**: Does it work as intended?
    2. **Performance**: Any performance issues?
    3. **Accessibility**: Accessibility compliance?
    4. **Maintainability**: Code maintainability?
    5. **Testing**: Test coverage and quality?
    
    Provide specific suggestions for improvement.
  `,
  variables: ['componentType'],
  examples: [
    {
      componentType: 'button',
      description: 'Analysis for button components'
    },
    {
      componentType: 'form',
      description: 'Analysis for form components'
    }
  ]
});

// Use template with specific component type
const buttonAnalysis = await codeExplain.analyze({
  code: buttonCode,
  prompt: 'Component Analysis Template',
  context: {
    componentType: 'button'
  }
});
```

## Prompt Management

### Prompt Library

```javascript
// List all custom prompts
const prompts = await codeExplain.prompts.list({
  type: 'analysis',
  tags: ['react', 'typescript'],
  limit: 10
});

console.log('Available prompts:', prompts);

// Get specific prompt
const prompt = await codeExplain.prompts.get('prompt_id');

// Update prompt
const updatedPrompt = await codeExplain.prompts.update('prompt_id', {
  content: 'Updated prompt content...',
  variables: {
    newVariable: 'value'
  }
});

// Delete prompt
await codeExplain.prompts.delete('prompt_id');
```

### Prompt Versioning

```javascript
// Create new version of prompt
const newVersion = await codeExplain.prompts.createVersion('prompt_id', {
  content: 'Updated prompt content...',
  version: '2.0',
  changelog: 'Added security analysis section'
});

// Get prompt history
const history = await codeExplain.prompts.getHistory('prompt_id');

// Rollback to previous version
await codeExplain.prompts.rollback('prompt_id', '1.0');
```

### Team Sharing

```javascript
// Share prompt with team
const shareResult = await codeExplain.prompts.share('prompt_id', {
  teamId: 'team_123',
  permissions: 'read'
});

// Make prompt public
const publicPrompt = await codeExplain.prompts.makePublic('prompt_id');

// Fork public prompt
const forkedPrompt = await codeExplain.prompts.fork('public_prompt_id', {
  name: 'My Custom Version',
  modifications: 'Added specific requirements...'
});
```

## Integration Options

### IDE Integration

```javascript
// VS Code extension integration
const vscode = require('vscode');

function activate(context) {
  const customPromptCommand = vscode.commands.registerCommand(
    'codeexplain.prompts.useCustom',
    async () => {
      const prompts = await codeExplain.prompts.list();
      const selectedPrompt = await vscode.window.showQuickPick(
        prompts.map(p => ({ label: p.name, description: p.description, prompt: p }))
      );
      
      if (selectedPrompt) {
        const editor = vscode.window.activeTextEditor;
        const code = editor.document.getText();
        
        const analysis = await codeExplain.analyze({
          code: code,
          prompt: selectedPrompt.prompt.id
        });
        
        showAnalysisResults(analysis);
      }
    }
  );
  
  context.subscriptions.push(customPromptCommand);
}
```

### CLI Integration

```bash
# List custom prompts
codeexplain prompts list

# Use custom prompt for analysis
codeexplain analyze --prompt "React Component Analysis" --file src/Button.tsx

# Create new prompt
codeexplain prompts create \
  --name "Security Review" \
  --type "review" \
  --content "prompt content here"

# Update existing prompt
codeexplain prompts update prompt_id --content "updated content"
```

### API Integration

```javascript
// Use custom prompts via API
const analysis = await fetch('/api/analyze', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-api-key'
  },
  body: JSON.stringify({
    code: userCode,
    language: 'typescript',
    prompt: 'custom_prompt_id',
    options: {
      generateDocs: true
    }
  })
});
```

## Configuration

### Prompt Settings

```javascript
const promptConfig = {
  // Default prompt settings
  defaults: {
    analysisPrompt: 'default_analysis',
    documentationPrompt: 'default_docs',
    reviewPrompt: 'default_review'
  },
  
  // Prompt behavior
  behavior: {
    includeExamples: true,
    includePerformance: true,
    includeSecurity: true,
    detailLevel: 'comprehensive'
  },
  
  // Variable substitution
  variables: {
    team: 'backend',
    project: 'api-service',
    language: 'typescript'
  },
  
  // Prompt caching
  cache: {
    enabled: true,
    ttl: 3600
  }
};
```

### Team Configuration

```javascript
const teamConfig = {
  // Team-wide prompt settings
  sharedPrompts: [
    'team_code_review',
    'team_documentation_style',
    'team_security_check'
  ],
  
  // Prompt permissions
  permissions: {
    create: ['senior_developers'],
    edit: ['team_leads'],
    share: ['all_members']
  },
  
  // Prompt standards
  standards: {
    requiredSections: ['description', 'examples', 'best_practices'],
    maxLength: 5000,
    minLength: 100
  }
};
```

## Best Practices

### Prompt Design

1. **Clear Instructions**: Provide clear, specific instructions
2. **Context Setting**: Set appropriate context for the AI
3. **Output Format**: Specify desired output format
4. **Examples**: Include examples of good and bad outputs
5. **Constraints**: Set clear constraints and limitations

### Prompt Management

1. **Version Control**: Use versioning for prompt changes
2. **Documentation**: Document prompt purpose and usage
3. **Testing**: Test prompts with various code samples
4. **Sharing**: Share effective prompts with the team
5. **Maintenance**: Regularly review and update prompts

### Team Collaboration

1. **Standards**: Establish team-wide prompt standards
2. **Reviews**: Review prompts before sharing
3. **Feedback**: Collect feedback on prompt effectiveness
4. **Training**: Train team members on prompt usage
5. **Iteration**: Continuously improve prompts based on results

## Troubleshooting

### Common Issues

**Prompt Not Working**
- Check prompt syntax and format
- Verify variable substitution
- Test with simple examples first

**Inconsistent Results**
- Review prompt clarity
- Add more specific instructions
- Include examples in the prompt

**Performance Issues**
- Optimize prompt length
- Use caching for repeated prompts
- Consider prompt complexity

### Debug Mode

Enable debug mode for detailed prompt processing logs:

```bash
export CODEEXPLAIN_DEBUG=true
export PROMPTS_DEBUG=true
```

## Support

- **Prompt Examples**: [https://docs.codeexplain.com/prompts/examples](https://docs.codeexplain.com/prompts/examples)
- **Prompt Templates**: [https://docs.codeexplain.com/prompts/templates](https://docs.codeexplain.com/prompts/templates)
- **Support Email**: prompts-support@codeexplain.com
- **Discord**: [https://discord.gg/codeexplain](https://discord.gg/codeexplain)
