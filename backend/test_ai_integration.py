"""
Test AI documentation generation with real OpenAI API.

Make sure you have OPENAI_API_KEY in your .env file!
"""
import asyncio
from app.services.documentation_service import DocumentationPipeline


async def test_ai_documentation():
    print("=" * 60)
    print("Testing AI Documentation Generation")
    print("=" * 60)
    
    # Sample Python code to document
    sample_code = '''
import math
from typing import List

def calculate_average(numbers: List[float]) -> float:
    """Calculate the average of a list of numbers."""
    if not numbers:
        return 0.0
    return sum(numbers) / len(numbers)

class DataProcessor:
    def __init__(self, data: List[float]):
        self.data = data
        self.processed = False
    
    def normalize(self) -> List[float]:
        """Normalize data to range [0, 1]"""
        if not self.data:
            return []
        
        min_val = min(self.data)
        max_val = max(self.data)
        
        if max_val == min_val:
            return [0.5] * len(self.data)
        
        normalized = [(x - min_val) / (max_val - min_val) for x in self.data]
        self.processed = True
        return normalized
'''
    
    # Create pipeline and process file
    pipeline = DocumentationPipeline()
    
    result = await pipeline.process_file(
        code=sample_code,
        file_path="data_utils.py",
        language="python"
    )
    
    # Display results
    if result['status'] == 'success':
        print("\n✅ Documentation Generated Successfully!\n")
        
        data = result['data']
        
        print("📝 File Summary:")
        print("-" * 60)
        print(data['summary'])
        
        print("\n\n🔧 Functions:")
        print("-" * 60)
        for func in data['functions']:
            print(f"\nFunction: {func['name']}")
            print(f"Parameters: {', '.join(func['params'])}")
            print(f"Documentation:\n{func['documentation']}\n")
        
        print("\n\n📦 Classes:")
        print("-" * 60)
        for cls in data['classes']:
            print(f"\nClass: {cls['name']}")
            print(f"Methods: {', '.join(cls['methods'])}")
            print(f"Documentation:\n{cls['documentation']}\n")
        
        print("\n\n📊 Statistics:")
        print("-" * 60)
        print(f"Complexity: {data['complexity']}")
        print(f"Total Lines: {data['stats']['total_lines']}")
        print(f"Non-empty Lines: {data['stats']['non_empty_lines']}")
        
        print("\n" + "=" * 60)
        print("✨ Test Complete!")
        print("=" * 60)
        
    else:
        print(f"\n❌ Error: {result['error']}")


if __name__ == "__main__":
    asyncio.run(test_ai_documentation())
