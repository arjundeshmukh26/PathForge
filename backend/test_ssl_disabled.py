#!/usr/bin/env python3
"""
Test that SSL verification is properly disabled
"""

import os
import requests
import ssl

def test_ssl_disabled():
    """Test that SSL verification is disabled"""
    print("Testing SSL verification status...")
    
    # Test environment variables
    print(f"PYTHONHTTPSVERIFY: {os.environ.get('PYTHONHTTPSVERIFY', 'Not set')}")
    print(f"SSL_VERIFY: {os.environ.get('SSL_VERIFY', 'Not set')}")
    
    # Test SSL context
    try:
        context = ssl.create_default_context()
        print(f"SSL context check_hostname: {context.check_hostname}")
        print(f"SSL context verify_mode: {context.verify_mode}")
    except Exception as e:
        print(f"SSL context test failed: {e}")
    
    # Test requests with HTTPS URL
    try:
        print("Testing requests with HTTPS...")
        response = requests.get('https://httpbin.org/get', timeout=5)
        print(f"Requests test successful: {response.status_code}")
    except Exception as e:
        print(f"Requests test failed: {e}")
    
    print("SSL verification test completed.")

if __name__ == "__main__":
    # Import our service to apply SSL fixes
    try:
        from services.gemini_service import gemini_service
        print("Gemini service imported (SSL fixes applied)")
    except Exception as e:
        print(f"Failed to import gemini service: {e}")
    
    test_ssl_disabled()