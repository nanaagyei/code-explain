"""
Simplified upload test with better error reporting
"""
import requests

BASE_URL = "http://localhost:8000"

# Login first
print("Logging in...")
login = requests.post(
    f"{BASE_URL}/auth/login",
    data={"username": "testuser", "password": "testpass123"}
)

if login.status_code != 200:
    print(f"Login failed: {login.status_code}")
    print(login.text)
    exit(1)

token = login.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}
print(f"✓ Logged in. Token: {token[:20]}...")

# Try to upload
print("\nUploading file...")

# Create a simple Python file
file_content = '''
def hello():
    return "Hello World"
'''

files = [
    ('files', ('test.py', file_content, 'text/plain'))
]

data = {
    'name': 'Simple Test'
}

response = requests.post(
    f"{BASE_URL}/repositories/",
    headers=headers,
    files=files,
    data=data
)

print(f"Response Status: {response.status_code}")
print(f"Response Headers: {response.headers}")
print(f"Response Body: {response.text}")

if response.status_code == 201:
    print("\n✅ Upload successful!")
    print(response.json())
else:
    print(f"\n❌ Upload failed with status {response.status_code}")

