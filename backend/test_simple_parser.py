"""
Simple test to verify tree-sitter works at all
"""
from tree_sitter import Language, Parser
import tree_sitter_python as ts_python

# Initialize
language = Language(ts_python.language())
parser = Parser(language)

code = b'''
def hello(name):
    """Say hello"""
    return f"Hello {name}"
'''

# Parse
tree = parser.parse(code)
root = tree.root_node

print("=== Tree-sitter Basic Test ===")
print(f"Root type: {root.type}")
print(f"Root children count: {len(root.children)}")

# Walk children
for i, child in enumerate(root.children):
    print(f"\nChild {i}:")
    print(f"  Type: {child.type}")
    print(f"  Text: {child.text.decode('utf8')[:50]}...")
    
    if child.type == 'function_definition':
        print("  Found a function!")
        
        # Get function name
        name_node = child.child_by_field_name('name')
        if name_node:
            print(f"  Name: {name_node.text.decode('utf8')}")
        
        # Get parameters
        params_node = child.child_by_field_name('parameters')
        if params_node:
            print(f"  Parameters node type: {params_node.type}")
            print(f"  Parameters: {params_node.text.decode('utf8')}")

print("\n=== Testing Query API ===")
# Test query
query = language.query('(function_definition) @function')
print(f"Query created: {query}")

# Get matches
matches = query.matches(root)
print(f"Matches type: {type(matches)}")
print(f"Matches count: {len(matches)}")

for i, match in enumerate(matches):
    print(f"\nMatch {i}:")
    print(f"  Type: {type(match)}")
    print(f"  Value: {match}")
    if hasattr(match, 'captures'):
        print(f"  Has .captures: {match.captures}")

# Get captures
captures = query.captures(root)
print(f"\nCaptures type: {type(captures)}")
print(f"Captures length: {len(captures)}")

if len(captures) > 0:
    first = captures[0]
    print(f"\nFirst capture:")
    print(f"  Type: {type(first)}")
    print(f"  Value: {first}")
    print(f"  Length: {len(first) if hasattr(first, '__len__') else 'N/A'}")
    
    # Try different access methods
    try:
        print(f"  [0]: {first[0]}")
        print(f"  [0] type: {type(first[0])}")
    except:
        pass
    
    try:
        print(f"  [1]: {first[1]}")
        print(f"  [1] type: {type(first[1])}")
    except:
        pass
    
    try:
        print(f"  Has .node: {hasattr(first, 'node')}")
        if hasattr(first, 'node'):
            print(f"  .node: {first.node}")
    except:
        pass

