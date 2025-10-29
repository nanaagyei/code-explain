"""
Encryption service for securely storing user API keys.
"""
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64
import os
from typing import Optional


class EncryptionService:
    """Service for encrypting and decrypting sensitive data"""
    
    def __init__(self):
        # Use environment variable for encryption key or generate one
        encryption_key = os.getenv("ENCRYPTION_KEY")
        if not encryption_key:
            # Generate a key based on app secret (not ideal for production)
            from app.core.config import get_settings
            settings = get_settings()
            password = settings.secret_key.encode()
            salt = b'codeexplain_salt'  # In production, use a random salt per user
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=salt,
                iterations=100000,
            )
            key = base64.urlsafe_b64encode(kdf.derive(password))
        else:
            key = encryption_key.encode()
        
        self.fernet = Fernet(key)
    
    def encrypt(self, data: str) -> str:
        """Encrypt a string"""
        if not data:
            return data
        encrypted_data = self.fernet.encrypt(data.encode())
        return base64.urlsafe_b64encode(encrypted_data).decode()
    
    def decrypt(self, encrypted_data: str) -> str:
        """Decrypt a string"""
        if not encrypted_data:
            return encrypted_data
        try:
            encrypted_bytes = base64.urlsafe_b64decode(encrypted_data.encode())
            decrypted_data = self.fernet.decrypt(encrypted_bytes)
            return decrypted_data.decode()
        except Exception as e:
            raise ValueError(f"Failed to decrypt data: {e}")
    
    def get_key_prefix(self, api_key: str) -> str:
        """Get the prefix of an API key for identification (first 8 chars)"""
        if not api_key:
            return ""
        # Show first 8 characters, mask the rest
        if len(api_key) > 8:
            return api_key[:8] + "..."
        return api_key


# Global instance
_encryption_service: Optional[EncryptionService] = None

def get_encryption_service() -> EncryptionService:
    """Get the global encryption service instance"""
    global _encryption_service
    if _encryption_service is None:
        _encryption_service = EncryptionService()
    return _encryption_service
