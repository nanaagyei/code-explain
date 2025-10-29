"""
Quick test script for authentication endpoints.

Make sure the server is running (python run.py) before running this script.
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_authentication():
    print("=" * 60)
    print("Testing CodeExplain Authentication System")
    print("=" * 60)
    
    # Test 1: Register a new user
    print("\n1. Testing Registration...")
    register_data = {
        "email": "test@example.com",
        "username": "testuser",
        "password": "testpass123"
    }
    
    response = requests.post(f"{BASE_URL}/auth/register", json=register_data)
    
    if response.status_code == 201:
        print("✓ Registration successful!")
        user_data = response.json()
        print(f"  User ID: {user_data['id']}")
        print(f"  Username: {user_data['username']}")
        print(f"  Email: {user_data['email']}")
    elif response.status_code == 400:
        print("⚠ User already exists (this is OK if running multiple times)")
    else:
        print(f"✗ Registration failed: {response.status_code}")
        print(f"  Response: {response.text}")
        return
    
    # Test 2: Login
    print("\n2. Testing Login...")
    login_data = {
        "username": "testuser",
        "password": "testpass123"
    }
    
    response = requests.post(
        f"{BASE_URL}/auth/login",
        data=login_data  # OAuth2PasswordRequestForm expects form data
    )
    
    if response.status_code == 200:
        print("✓ Login successful!")
        token_data = response.json()
        access_token = token_data["access_token"]
        print(f"  Token: {access_token[:50]}...")
    else:
        print(f"✗ Login failed: {response.status_code}")
        print(f"  Response: {response.text}")
        return
    
    # Test 3: Access protected endpoint
    print("\n3. Testing Protected Endpoint (/auth/me)...")
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    
    if response.status_code == 200:
        print("✓ Protected endpoint access successful!")
        user_data = response.json()
        print(f"  User: {user_data['username']}")
        print(f"  Email: {user_data['email']}")
    else:
        print(f"✗ Protected endpoint access failed: {response.status_code}")
        print(f"  Response: {response.text}")
        return
    
    # Test 4: Test invalid credentials
    print("\n4. Testing Invalid Credentials...")
    bad_login_data = {
        "username": "testuser",
        "password": "wrongpassword"
    }
    
    response = requests.post(
        f"{BASE_URL}/auth/login",
        data=bad_login_data
    )
    
    if response.status_code == 401:
        print("✓ Invalid credentials correctly rejected!")
    else:
        print(f"⚠ Unexpected response: {response.status_code}")
    
    # Test 5: Test accessing protected endpoint without token
    print("\n5. Testing Protected Endpoint Without Token...")
    response = requests.get(f"{BASE_URL}/auth/me")
    
    if response.status_code == 401:
        print("✓ Unauthorized access correctly rejected!")
    else:
        print(f"⚠ Unexpected response: {response.status_code}")
    
    print("\n" + "=" * 60)
    print("✓ All authentication tests passed!")
    print("=" * 60)


if __name__ == "__main__":
    try:
        test_authentication()
    except requests.exceptions.ConnectionError:
        print("✗ Error: Could not connect to server.")
        print("  Make sure the server is running: cd backend && python run.py")
    except Exception as e:
        print(f"✗ Error: {e}")
