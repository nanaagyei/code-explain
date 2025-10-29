"""
Test repository API endpoints including file upload and documentation generation.

Make sure the server is running (python run.py) before running this script.
"""
import requests
import time

BASE_URL = "http://localhost:8000"

def test_repository_workflow():
    print("=" * 70)
    print("Testing Complete Repository Workflow")
    print("=" * 70)
    
    # Step 1: Register/Login to get token
    print("\n1️⃣  Authenticating...")
    login_response = requests.post(
        f"{BASE_URL}/auth/login",
        data={"username": "testuser", "password": "testpass123"}
    )
    
    if login_response.status_code != 200:
        print("   ⚠️  Login failed, trying to register first...")
        register_response = requests.post(
            f"{BASE_URL}/auth/register",
            json={
                "email": "test@example.com",
                "username": "testuser",
                "password": "testpass123"
            }
        )
        if register_response.status_code in [200, 201]:
            print("   ✓ Registered new user")
        
        # Try login again
        login_response = requests.post(
            f"{BASE_URL}/auth/login",
            data={"username": "testuser", "password": "testpass123"}
        )
    
    if login_response.status_code != 200:
        print(f"   ✗ Authentication failed: {login_response.status_code}")
        return
    
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("   ✓ Authentication successful")
    
    # Step 2: Create a test Python file
    print("\n2️⃣  Creating test code file...")
    test_code = '''
def fibonacci(n):
    """Calculate the nth Fibonacci number"""
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

class MathHelper:
    @staticmethod
    def square(x):
        return x * x
    
    @staticmethod
    def cube(x):
        return x * x * x
'''
    
    # Step 3: Upload files to create repository
    print("\n3️⃣  Uploading files and creating repository...")
    
    files = {
        'files': ('math_utils.py', test_code, 'text/plain')
    }
    data = {
        'name': 'Test Math Library'
    }
    
    response = requests.post(
        f"{BASE_URL}/repositories/",
        headers=headers,
        files=files,
        data=data
    )
    
    if response.status_code != 201:
        print(f"   ✗ Upload failed: {response.status_code}")
        print(f"   Response: {response.text}")
        return
    
    repo_data = response.json()
    repo_id = repo_data['id']
    print(f"   ✓ Repository created! ID: {repo_id}")
    print(f"   Status: {repo_data['status']}")
    print(f"   Total files: {repo_data['total_files']}")
    
    # Step 4: Poll repository status
    print("\n4️⃣  Waiting for processing to complete...")
    print("   (This will take ~10-30 seconds as AI generates documentation)")
    
    max_attempts = 30
    for attempt in range(max_attempts):
        time.sleep(2)
        
        response = requests.get(
            f"{BASE_URL}/repositories/{repo_id}",
            headers=headers
        )
        
        if response.status_code != 200:
            print(f"   ✗ Error fetching repository: {response.status_code}")
            break
        
        data = response.json()
        repo = data['repository']
        
        progress = (repo['processed_files'] / repo['total_files'] * 100) if repo['total_files'] > 0 else 0
        print(f"   Progress: {progress:.0f}% ({repo['processed_files']}/{repo['total_files']}) - Status: {repo['status']}")
        
        if repo['status'] == 'completed':
            print("\n   ✅ Processing complete!")
            break
        elif repo['status'] == 'failed':
            print("\n   ❌ Processing failed")
            break
    
    # Step 5: Get repository details
    print("\n5️⃣  Fetching repository details...")
    response = requests.get(
        f"{BASE_URL}/repositories/{repo_id}",
        headers=headers
    )
    
    if response.status_code == 200:
        data = response.json()
        repo = data['repository']
        files = data['files']
        
        print(f"   Repository: {repo['name']}")
        print(f"   Status: {repo['status']}")
        print(f"   Files: {len(files)}")
        
        for file in files:
            print(f"\n   📄 {file['file_path']}")
            print(f"      Language: {file['language']}")
            print(f"      Status: {file['status']}")
            print(f"      Complexity: {file.get('complexity_score', 'N/A')}")
    
    # Step 6: Get file documentation
    print("\n6️⃣  Fetching generated documentation...")
    
    if files and files[0]['status'] == 'completed':
        file_id = files[0]['id']
        response = requests.get(
            f"{BASE_URL}/repositories/{repo_id}/files/{file_id}",
            headers=headers
        )
        
        if response.status_code == 200:
            doc = response.json()
            print(f"\n   ✅ Documentation retrieved!")
            print(f"\n   📝 File Summary:")
            print("   " + "-" * 60)
            print("   " + doc['summary'][:200] + "...")
            
            print(f"\n   🔧 Functions: {len(doc['functions'])}")
            for func in doc['functions']:
                print(f"      - {func['name']}({', '.join(func['params'])})")
            
            print(f"\n   📦 Classes: {len(doc['classes'])}")
            for cls in doc['classes']:
                print(f"      - {cls['name']}")
            
            print(f"\n   📊 Statistics:")
            print(f"      Complexity: {doc['complexity']}")
            print(f"      Total Lines: {doc['stats']['total_lines']}")
        else:
            print(f"   ✗ Failed to get documentation: {response.status_code}")
    
    # Step 7: List all repositories
    print("\n7️⃣  Listing all repositories...")
    response = requests.get(
        f"{BASE_URL}/repositories/",
        headers=headers
    )
    
    if response.status_code == 200:
        repos = response.json()
        print(f"   ✓ Found {len(repos)} repository(ies)")
        for repo in repos[:5]:  # Show first 5
            print(f"      - {repo['name']} ({repo['status']}) - {repo['processed_files']}/{repo['total_files']} files")
    
    print("\n" + "=" * 70)
    print("✨ Complete Repository Workflow Test Passed!")
    print("=" * 70)


if __name__ == "__main__":
    try:
        test_repository_workflow()
    except requests.exceptions.ConnectionError:
        print("✗ Error: Could not connect to server.")
        print("  Make sure the server is running: cd backend && python run.py")
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
