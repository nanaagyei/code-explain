from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.prompt_template import PromptTemplate


class PromptTemplateService:
    """Service for managing prompt templates"""
    
    @staticmethod
    async def seed_default_templates(db: AsyncSession):
        """Seed the database with default prompt templates"""
        
        # Check if templates already exist
        result = await db.execute(select(PromptTemplate))
        existing_templates = result.scalars().all()
        
        if existing_templates:
            print("Default prompt templates already exist, skipping seed.")
            return
        
        default_templates = [
            {
                "name": "Beginner-Friendly",
                "description": "Simple, educational documentation perfect for learning and onboarding",
                "category": "beginner",
                "system_prompt": """You are an expert technical writer specializing in beginner-friendly documentation. 
                Your goal is to make complex code accessible to developers at any skill level.
                
                Guidelines:
                - Use simple, clear language
                - Explain concepts step-by-step
                - Include practical examples
                - Avoid jargon without explanation
                - Focus on learning and understanding""",
                
                "function_prompt": """Write clear, beginner-friendly documentation for this function.

Include:
1. **What it does** - Simple explanation of the function's purpose
2. **Parameters** - Clear description of each parameter with examples
3. **Returns** - What the function returns and why
4. **Example** - A practical example showing how to use it
5. **Notes** - Any important details a beginner should know

Keep explanations simple and educational.""",
                
                "class_prompt": """Write comprehensive, beginner-friendly documentation for this class.

Include:
1. **Overview** - What this class does and why you'd use it
2. **Key Concepts** - Important programming concepts demonstrated
3. **Attributes** - What data the class holds and why
4. **Methods** - Key methods with simple explanations
5. **Usage Example** - A complete example showing how to create and use the class
6. **Best Practices** - Tips for using this class effectively

Make it educational and easy to understand.""",
                
                "file_prompt": """Write an educational overview for this code file.

Include:
1. **Purpose** - What this file does and its role in the project
2. **Key Components** - Main functions, classes, and concepts
3. **Learning Points** - Important programming concepts to understand
4. **Dependencies** - What this file needs to work
5. **Usage** - How this file fits into the bigger picture
6. **Study Guide** - Suggested order for understanding the code

Focus on helping someone learn from this code."""
            },
            
            {
                "name": "Technical Deep-Dive",
                "description": "Comprehensive, detailed documentation for experienced developers",
                "category": "technical",
                "system_prompt": """You are a senior software engineer and technical documentation expert.
                Your documentation should be comprehensive, precise, and suitable for experienced developers.
                
                Guidelines:
                - Include detailed technical specifications
                - Cover edge cases and error handling
                - Provide performance considerations
                - Include architectural insights
                - Reference related patterns and best practices""",
                
                "function_prompt": """Write comprehensive technical documentation for this function.

Include:
1. **Purpose** - Detailed explanation of functionality and use cases
2. **Parameters** - Complete parameter specification with types, constraints, and edge cases
3. **Return Value** - Detailed return specification including edge cases
4. **Implementation Details** - Key algorithmic or architectural decisions
5. **Performance** - Time/space complexity and optimization notes
6. **Error Handling** - Exceptions, edge cases, and error scenarios
7. **Examples** - Comprehensive usage examples including edge cases
8. **Related** - References to related functions, patterns, or concepts""",
                
                "class_prompt": """Write detailed technical documentation for this class.

Include:
1. **Architecture** - Class design, inheritance hierarchy, and design patterns
2. **State Management** - Instance variables, their lifecycle, and thread safety
3. **Method Specifications** - Detailed method documentation including complexity
4. **Interface Contracts** - Public API guarantees and behavioral contracts
5. **Performance Characteristics** - Memory usage, initialization cost, etc.
6. **Concurrency** - Thread safety, locking mechanisms, and parallel usage
7. **Integration** - How this class fits into the broader system architecture
8. **Advanced Usage** - Complex scenarios and optimization techniques""",
                
                "file_prompt": """Write comprehensive technical documentation for this code file.

Include:
1. **Architecture** - File's role in system architecture and design patterns
2. **Dependencies** - Detailed dependency analysis and coupling
3. **API Surface** - Public interfaces and their contracts
4. **Implementation Strategy** - Key architectural and algorithmic decisions
5. **Performance Profile** - Resource usage, bottlenecks, and optimization opportunities
6. **Testing Strategy** - Testability considerations and recommended testing approaches
7. **Evolution** - Backward compatibility, migration paths, and versioning
8. **Integration Points** - How this file interacts with other system components"""
            },
            
            {
                "name": "API Documentation",
                "description": "REST API style documentation with clear endpoints and examples",
                "category": "api",
                "system_prompt": """You are a technical writer specializing in API documentation.
                Your documentation should follow REST API best practices and be suitable for API consumers.
                
                Guidelines:
                - Use REST API terminology and conventions
                - Include request/response examples
                - Document status codes and error responses
                - Follow OpenAPI/Swagger conventions
                - Focus on integration and usage""",
                
                "function_prompt": """Write API-style documentation for this function.

Include:
1. **Endpoint** - Function name and signature (treat as API endpoint)
2. **Description** - Clear purpose and use case
3. **Parameters** - Input specification with types and validation rules
4. **Response** - Return value specification with success/error cases
5. **Status Codes** - Possible outcomes and their meanings
6. **Request Example** - How to call this function
7. **Response Example** - Expected output format
8. **Error Handling** - Error scenarios and error response format
9. **Rate Limits** - Performance considerations if applicable""",
                
                "class_prompt": """Write API-style documentation for this class.

Include:
1. **Resource** - Class as an API resource with its capabilities
2. **Operations** - Available methods as API operations (GET, POST, PUT, DELETE)
3. **Request/Response Models** - Data structures for inputs and outputs
4. **Authentication** - Access control and permissions
5. **Validation** - Input validation rules and constraints
6. **Error Responses** - Standard error formats and status codes
7. **Usage Examples** - Complete API usage scenarios
8. **Rate Limiting** - Performance and usage considerations
9. **Versioning** - API versioning and backward compatibility""",
                
                "file_prompt": """Write API documentation overview for this code file.

Include:
1. **API Overview** - File's role as part of an API system
2. **Available Endpoints** - Functions/classes as API endpoints
3. **Data Models** - Request/response schemas and data structures
4. **Authentication** - Security and access control mechanisms
5. **Error Handling** - Standard error responses and status codes
6. **Rate Limiting** - Performance and throttling considerations
7. **Integration Guide** - How to integrate with this API
8. **SDK Examples** - Client library usage examples
9. **API Versioning** - Version compatibility and migration"""
            },
            
            {
                "name": "Tutorial Style",
                "description": "Step-by-step learning documentation with practical exercises",
                "category": "tutorial",
                "system_prompt": """You are an experienced programming instructor and tutorial writer.
                Your documentation should be educational, progressive, and hands-on.
                
                Guidelines:
                - Structure content as a learning journey
                - Include step-by-step instructions
                - Provide hands-on examples and exercises
                - Build complexity gradually
                - Encourage experimentation and practice""",
                
                "function_prompt": """Write tutorial-style documentation for this function.

Include:
1. **Learning Objective** - What you'll learn from this function
2. **Step-by-Step Guide** - How to understand and use this function
3. **Interactive Example** - Hands-on example you can try
4. **Common Mistakes** - What to avoid and why
5. **Practice Exercise** - Try modifying the function or using it differently
6. **Key Takeaways** - Important concepts to remember
7. **Next Steps** - Related functions or concepts to explore
8. **Challenge** - Advanced usage or modification suggestions""",
                
                "class_prompt": """Write tutorial-style documentation for this class.

Include:
1. **Learning Path** - Progressive understanding of this class
2. **Hands-On Tutorial** - Step-by-step guide to using the class
3. **Interactive Examples** - Examples you can run and modify
4. **Common Patterns** - Typical usage patterns and best practices
5. **Practice Projects** - Ideas for projects using this class
6. **Debugging Guide** - How to troubleshoot common issues
7. **Extension Ideas** - Ways to extend or customize the class
8. **Assessment** - Self-check questions and challenges""",
                
                "file_prompt": """Write tutorial-style documentation for this code file.

Include:
1. **Learning Journey** - How to approach understanding this file
2. **Tutorial Structure** - Step-by-step learning path
3. **Hands-On Labs** - Interactive exercises to work through the code
4. **Concept Building** - How concepts build on each other
5. **Practice Exercises** - Modifications and extensions to try
6. **Troubleshooting** - Common issues and how to debug them
7. **Project Ideas** - Real projects using concepts from this file
8. **Assessment** - Self-test questions and coding challenges
9. **Further Learning** - Next topics and resources to explore"""
            }
        ]
        
        for template_data in default_templates:
            template = PromptTemplate(
                **template_data,
                is_default=True,
                is_public=True,
                user_id=None  # System template
            )
            db.add(template)
        
        await db.commit()
        print(f"Seeded {len(default_templates)} default prompt templates.")
    
    @staticmethod
    async def get_template_by_id(db: AsyncSession, template_id: int, user_id: int = None) -> PromptTemplate:
        """Get a prompt template by ID, checking permissions"""
        query = select(PromptTemplate).where(PromptTemplate.id == template_id)
        
        if user_id:
            query = query.where(
                or_(
                    PromptTemplate.is_public == True,
                    PromptTemplate.user_id == user_id
                )
            )
        
        result = await db.execute(query)
        return result.scalar_one_or_none()
