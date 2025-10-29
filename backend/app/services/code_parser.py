"""
Code parser service using tree-sitter for multi-language support.

Extracts structured information from code:
- Functions and their parameters
- Classes and methods
- Import statements
- Cyclomatic complexity
- Code statistics
"""
from tree_sitter import Language, Parser, Node
import tree_sitter_python as ts_python
import tree_sitter_javascript as ts_javascript
import tree_sitter_typescript as ts_typescript
import tree_sitter_java as ts_java
import tree_sitter_c as ts_c
import tree_sitter_cpp as ts_cpp
import tree_sitter_go as ts_go
import tree_sitter_rust as ts_rust
from typing import List, Dict, Any, Optional
import hashlib


class CodeParser:
    """
    Parse code into Abstract Syntax Tree (AST) and extract meaningful information.
    
    Supports: Python, JavaScript, TypeScript, Java, C, C++, Go, Rust
    """
    
    # Map file extensions to languages
    LANGUAGE_MAP = {
        'py': 'python',
        'js': 'javascript',
        'jsx': 'javascript',
        'ts': 'typescript',
        'tsx': 'typescript',
        'java': 'java',
        'c': 'c',
        'h': 'c',
        'cpp': 'cpp',
        'cc': 'cpp',
        'cxx': 'cpp',
        'hpp': 'cpp',
        'hxx': 'cpp',
        'go': 'go',
        'rs': 'rust',
    }
    
    # Supported languages
    SUPPORTED_LANGUAGES = [
        'python', 'javascript', 'typescript', 'java', 
        'c', 'cpp', 'go', 'rust'
    ]
    
    def __init__(self, language: str):
        """
        Initialize parser for a specific language.
        
        Args:
            language: Programming language (python, javascript, typescript, java, c, cpp, go, rust)
            
        Raises:
            ValueError: If language is not supported
        """
        if language not in self.SUPPORTED_LANGUAGES:
            raise ValueError(
                f"Unsupported language: {language}. "
                f"Supported: {', '.join(self.SUPPORTED_LANGUAGES)}"
            )
        
        self.language = language
        
        # Initialize tree-sitter language and parser based on language
        # TypeScript has a special structure with language_typescript() and language_tsx()
        if language == 'python':
            self.ts_language = Language(ts_python.language())
        elif language == 'javascript':
            self.ts_language = Language(ts_javascript.language())
        elif language == 'typescript':
            # TypeScript module has language_typescript() instead of language()
            self.ts_language = Language(ts_typescript.language_typescript())
        elif language == 'java':
            self.ts_language = Language(ts_java.language())
        elif language == 'c':
            self.ts_language = Language(ts_c.language())
        elif language == 'cpp':
            self.ts_language = Language(ts_cpp.language())
        elif language == 'go':
            self.ts_language = Language(ts_go.language())
        elif language == 'rust':
            self.ts_language = Language(ts_rust.language())
        
        self.parser = Parser(self.ts_language)
    
    def parse(self, code: str) -> Dict[str, Any]:
        """
        Parse code and extract structured information.
        
        Args:
            code: Source code string
            
        Returns:
            Dictionary containing:
            - functions: List of function information
            - classes: List of class information
            - imports: List of import statements
            - complexity: Cyclomatic complexity score
            - summary: Code statistics
        """
        tree = self.parser.parse(bytes(code, "utf8"))
        root_node = tree.root_node
        
        return {
            "functions": self._extract_functions(root_node, code),
            "classes": self._extract_classes(root_node, code),
            "imports": self._extract_imports(root_node, code),
            "complexity": self._calculate_complexity(root_node),
            "summary": self._generate_summary(root_node, code)
        }
    
    def _extract_functions(self, node: Node, code: str) -> List[Dict]:
        """Extract function definitions from the AST"""
        functions = []
        
        query_string = self._get_function_query()
        if not query_string:
            return functions
        
        query = self.ts_language.query(query_string)
        captures_dict = query.captures(node)
        
        # query.captures() returns a dict: {'function': [<Node>, <Node>, ...]}
        # Get all nodes captured with the 'function' name
        function_nodes = captures_dict.get('function', [])
        
        for capture_node in function_nodes:
            func_info = {
                "name": self._get_function_name(capture_node, code),
                "params": self._get_function_params(capture_node, code),
                "start_line": capture_node.start_point[0] + 1,
                "end_line": capture_node.end_point[0] + 1,
                "docstring": self._get_docstring(capture_node, code)
            }
            functions.append(func_info)
        
        return functions
    
    def _get_function_query(self) -> str:
        """Get language-specific tree-sitter query for functions"""
        queries = {
            'python': '(function_definition) @function',
            'javascript': '[(function_declaration) (arrow_function) (function_expression)] @function',
            'typescript': '[(function_declaration) (arrow_function) (function_expression) (method_definition)] @function',
            'java': '(method_declaration) @function',
            'c': '(function_definition) @function',
            'cpp': '(function_definition) @function',
            'go': '(function_declaration) @function',
            'rust': '(function_item) @function',
        }
        return queries.get(self.language, '')
    
    def _get_function_name(self, node: Node, code: str) -> str:
        """Extract function name from AST node"""
        # Try to find identifier child (works for most languages)
        for child in node.children:
            if child.type == 'identifier':
                return code[child.start_byte:child.end_byte]
            # For Java/C++, might be nested in declarator
            if child.type in ['function_declarator', 'method_declarator']:
                for subchild in child.children:
                    if subchild.type == 'identifier':
                        return code[subchild.start_byte:subchild.end_byte]
        
        # For arrow functions/anonymous functions
        if node.type in ['arrow_function', 'function_expression', 'lambda']:
            return "anonymous"
        
        # Fallback: try to get first identifier from the node
        if node.children:
            first_child = node.children[0]
            if first_child.type == 'identifier':
                return code[first_child.start_byte:first_child.end_byte]
        
        return "anonymous"
    
    def _get_function_params(self, node: Node, code: str) -> List[str]:
        """Extract function parameters (works across languages)"""
        params = []
        
        # Look for parameter-related nodes
        param_node_types = ['parameters', 'parameter_list', 'formal_parameters']
        
        for child in node.children:
            if child.type in param_node_types:
                # Extract all identifiers from parameter list
                params.extend(self._extract_param_identifiers(child, code))
            # For Java/C++ where params might be in declarator
            elif child.type in ['function_declarator', 'method_declarator']:
                for subchild in child.children:
                    if subchild.type in param_node_types:
                        params.extend(self._extract_param_identifiers(subchild, code))
        
        return params
    
    def _extract_param_identifiers(self, param_node: Node, code: str) -> List[str]:
        """Helper to extract parameter identifiers from a parameter node"""
        params = []
        
        for child in param_node.children:
            # Skip commas, parentheses, etc.
            if child.type in [',', '(', ')']:
                continue
            
            # Different languages use different node types for parameters
            if child.type == 'identifier':
                params.append(code[child.start_byte:child.end_byte])
            elif child.type in ['typed_parameter', 'parameter_declaration', 'formal_parameter']:
                # Look for identifier within typed parameter
                for subchild in child.children:
                    if subchild.type == 'identifier':
                        params.append(code[subchild.start_byte:subchild.end_byte])
                        break
        
        return params
    
    def _get_docstring(self, node: Node, code: str) -> Optional[str]:
        """Extract docstring/comment if available"""
        
        # Python: docstrings
        if self.language == 'python':
            for child in node.children:
                if child.type == 'block':
                    for stmt in child.children:
                        if stmt.type == 'expression_statement':
                            for expr in stmt.children:
                                if expr.type == 'string':
                                    docstring = code[expr.start_byte:expr.end_byte]
                                    return docstring.strip('"\'').strip()
        
        # JavaScript/TypeScript: JSDoc comments (/** ... */)
        elif self.language in ['javascript', 'typescript']:
            # Look for comment node immediately before function
            start_byte = node.start_byte
            # Search backwards in code for /** comment
            code_before = code[:start_byte]
            if '/**' in code_before:
                last_jsdoc = code_before.rfind('/**')
                end_jsdoc = code_before.find('*/', last_jsdoc)
                if end_jsdoc != -1 and end_jsdoc > last_jsdoc:
                    comment = code[last_jsdoc:end_jsdoc+2]
                    # Clean up the comment
                    lines = comment.split('\n')
                    cleaned_lines = []
                    for line in lines:
                        line = line.strip()
                        if line.startswith('/**'):
                            line = line[3:].strip()
                        elif line.startswith('*'):
                            line = line[1:].strip()
                        elif line.startswith('*/'):
                            continue
                        if line:
                            cleaned_lines.append(line)
                    return '\n'.join(cleaned_lines) if cleaned_lines else None
        
        # Java: JavaDoc comments
        elif self.language == 'java':
            # Similar to JSDoc
            start_byte = node.start_byte
            code_before = code[:start_byte]
            if '/**' in code_before:
                last_javadoc = code_before.rfind('/**')
                end_javadoc = code_before.find('*/', last_javadoc)
                if end_javadoc != -1:
                    return code[last_javadoc:end_javadoc+2].strip()
        
        # For other languages, try to find comment node
        # This is a best-effort approach
        return None
    
    def _extract_classes(self, node: Node, code: str) -> List[Dict]:
        """Extract class definitions"""
        classes = []
        
        query_string = self._get_class_query()
        if not query_string:
            return classes
        
        query = self.ts_language.query(query_string)
        captures_dict = query.captures(node)
        
        # query.captures() returns a dict: {'class': [<Node>, <Node>, ...]}
        # Get all nodes captured with the 'class' name
        class_nodes = captures_dict.get('class', [])
        
        for capture_node in class_nodes:
            class_info = {
                "name": self._get_class_name(capture_node, code),
                "start_line": capture_node.start_point[0] + 1,
                "end_line": capture_node.end_point[0] + 1,
                "methods": self._extract_class_methods(capture_node, code)
            }
            classes.append(class_info)
        
        return classes
    
    def _get_class_query(self) -> str:
        """Get language-specific query for classes"""
        queries = {
            'python': '(class_definition) @class',
            'javascript': '(class_declaration) @class',
            'typescript': '(class_declaration) @class',
            'java': '(class_declaration) @class',
            'cpp': '[(class_specifier) (struct_specifier)] @class',
            'c': '(struct_specifier) @class',
            'go': '(type_declaration) @class',  # Go uses type declarations for structs
            'rust': '[(struct_item) (enum_item) (impl_item)] @class',
        }
        return queries.get(self.language, '')
    
    def _get_class_name(self, node: Node, code: str) -> str:
        """Extract class name (works across languages)"""
        # Look for identifier in children
        for child in node.children:
            if child.type == 'identifier':
                return code[child.start_byte:child.end_byte]
            # For C/C++ struct/class
            elif child.type in ['type_identifier', 'field_identifier']:
                return code[child.start_byte:child.end_byte]
        
        # Fallback: check first child
        if node.children and node.children[0].type == 'identifier':
            return code[node.children[0].start_byte:node.children[0].end_byte]
        
        return "Anonymous"
    
    def _extract_class_methods(self, class_node: Node, code: str) -> List[str]:
        """Extract method names from a class (works across languages)"""
        methods = []
        
        # Method node types vary by language
        method_types = [
            'function_definition',      # Python
            'method_definition',        # JavaScript/TypeScript
            'method_declaration',       # Java
            'function_declaration',     # Go (in type)
            'function_item',            # Rust (in impl)
        ]
        
        def extract_methods_recursive(node: Node):
            """Recursively search for methods"""
            # Check if current node is a method
            if node.type in method_types:
                method_name = self._get_function_name(node, code)
                if method_name and method_name != "anonymous":
                    methods.append(method_name)
            
            # Search children
            for child in node.children:
                if child.type in ['block', 'class_body', 'declaration_list', 'field_declaration_list']:
                    extract_methods_recursive(child)
                elif child.type in method_types:
                    method_name = self._get_function_name(child, code)
                    if method_name and method_name != "anonymous":
                        methods.append(method_name)
        
        extract_methods_recursive(class_node)
        return methods
    
    def _extract_imports(self, node: Node, code: str) -> List[str]:
        """Extract import statements"""
        imports = []
        
        query_string = self._get_import_query()
        if not query_string:
            return imports
        
        query = self.ts_language.query(query_string)
        captures_dict = query.captures(node)
        
        # query.captures() returns a dict: {'import': [<Node>, <Node>, ...]}
        # Get all nodes captured with the 'import' name
        import_nodes = captures_dict.get('import', [])
        
        for capture_node in import_nodes:
            import_text = code[capture_node.start_byte:capture_node.end_byte]
            imports.append(import_text.strip())
        
        return imports
    
    def _get_import_query(self) -> str:
        """Get language-specific query for imports"""
        queries = {
            'python': '[(import_statement) (import_from_statement)] @import',
            'javascript': '(import_statement) @import',
            'typescript': '(import_statement) @import',
            'java': '(import_declaration) @import',
            'cpp': '(preproc_include) @import',  # #include statements
            'c': '(preproc_include) @import',
            'go': '(import_declaration) @import',
            'rust': '(use_declaration) @import',
        }
        return queries.get(self.language, '')
    
    def _calculate_complexity(self, node: Node) -> int:
        """
        Calculate cyclomatic complexity.
        
        Complexity = 1 + number of decision points (if, while, for, case, catch, etc.)
        Supports all programming languages with common decision structures.
        """
        complexity = 1  # Base complexity
        
        # Decision nodes that increase complexity (covers all supported languages)
        decision_nodes = [
            # Conditionals
            'if_statement', 'if_expression', 'elif_clause', 'else_clause',
            # Loops
            'while_statement', 'for_statement', 'for_in_statement', 'for_range_loop',
            'loop_expression',  # Rust
            # Switch/Match
            'case_statement', 'switch_statement', 'match_expression',
            # Exception handling
            'catch_clause', 'try_statement',
            # Ternary/Conditional expressions
            'conditional_expression', 'ternary_expression',
            # Boolean operators (sometimes counted)
            'binary_expression',  # Could be && or ||
        ]
        
        def count_decisions(n: Node) -> int:
            count = 0
            
            # Check if this node is a decision point
            if n.type in decision_nodes:
                # For binary expressions, only count logical operators
                if n.type == 'binary_expression':
                    operator_node = None
                    for child in n.children:
                        if child.type in ['&&', '||', 'and', 'or']:
                            count = 1
                            break
                else:
                    count = 1
            
            # Recursively count in children
            for child in n.children:
                count += count_decisions(child)
            
            return count
        
        complexity += count_decisions(node)
        return complexity
    
    def _generate_summary(self, node: Node, code: str) -> Dict:
        """Generate code summary statistics"""
        lines = code.split('\n')
        
        return {
            "total_lines": len(lines),
            "non_empty_lines": len([line for line in lines if line.strip()]),
            "node_count": self._count_nodes(node),
            "max_depth": self._calculate_depth(node)
        }
    
    def _count_nodes(self, node: Node) -> int:
        """Count total AST nodes"""
        count = 1
        for child in node.children:
            count += self._count_nodes(child)
        return count
    
    def _calculate_depth(self, node: Node, current_depth: int = 0) -> int:
        """Calculate maximum AST depth"""
        if not node.children:
            return current_depth
        return max(
            self._calculate_depth(child, current_depth + 1) 
            for child in node.children
        )
    
    @staticmethod
    def get_content_hash(code: str) -> str:
        """
        Generate SHA256 hash of code for caching purposes.
        
        Args:
            code: Source code string
            
        Returns:
            Hex digest of SHA256 hash
        """
        return hashlib.sha256(code.encode()).hexdigest()
    
    @classmethod
    def detect_language(cls, filename: str) -> Optional[str]:
        """
        Detect programming language from filename.
        
        Args:
            filename: Name of the file (e.g., "script.py")
            
        Returns:
            Language name or None if not supported
        """
        ext = filename.split('.')[-1].lower()
        return cls.LANGUAGE_MAP.get(ext)
