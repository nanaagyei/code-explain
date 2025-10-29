"""
Debug script to understand tree-sitter API behavior
"""
from tree_sitter import Language, Parser
import tree_sitter_python as ts_python

# Setup
language = Language(ts_python.language())
parser = Parser(language)

code = '''
def calculate_sum(a, b):
    """Calculate sum of two numbers"""
    return a + b
'''

# Parse
tree = parser.parse(bytes(code, "utf8"))
root = tree.root_node

# Test query
query_string = '(function_definition) @function'
query = language.query(query_string)
captures = query.captures(root)

print("Type of captures:", type(captures))
print("Length of captures:", len(captures))
print("\nFirst capture:")
if len(captures) > 0:
    first = captures[0]
    print(f"  Type: {type(first)}")
    print(f"  Value: {first}")
    print(f"  Length: {len(first) if hasattr(first, '__len__') else 'N/A'}")
    
    if hasattr(first, 'node'):
        print(f"  Has .node attribute: {first.node}")
    if hasattr(first, 'name'):
        print(f"  Has .name attribute: {first.name}")
    
    if isinstance(first, (tuple, list)):
        print(f"  First element: {first[0]}")
        print(f"  First element type: {type(first[0])}")
        if len(first) > 1:
            print(f"  Second element: {first[1]}")
            print(f"  Second element type: {type(first[1])}")
        if len(first) > 2:
            print(f"  Third element: {first[2]}")
            print(f"  Third element type: {type(first[2])}")

print("\nAll captures:")
for i, capture in enumerate(captures):
    print(f"{i}: {capture}")

