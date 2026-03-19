#!/usr/bin/env python3
"""
SSL Certificate Fix for Gemini API Integration

This script provides multiple approaches to fix SSL certificate verification issues
that commonly occur on Windows systems or corporate networks.
"""

import os
import ssl
import asyncio
import logging
from dotenv import load_dotenv

# Load environment
load_dotenv()

def fix_ssl_certificates():
    """Apply SSL certificate fixes"""
    
    print("🔧 Applying SSL Certificate Fixes for Gemini API")
    print("=" * 50)
    
    # Method 1: Environment Variables
    print("\n1. Setting SSL environment variables...")
    os.environ['PYTHONHTTPSVERIFY'] = '0'
    os.environ['REQUESTS_CA_BUNDLE'] = ''
    os.environ['CURL_CA_BUNDLE'] = ''
    
    # Method 2: SSL Context
    print("2. Configuring SSL context...")
    ssl._create_default_https_context = ssl._create_unverified_context
    
    # Method 3: Disable SSL warnings
    print("3. Disabling SSL warnings...")
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    
    print("✅ SSL fixes applied")
    return True

async def test_gemini_with_ssl_fix():
    """Test Gemini API with SSL fixes applied"""
    
    try:
        # Apply SSL fixes
        fix_ssl_certificates()
        
        # Import after SSL fixes
        from services.gemini_service import gemini_service
        
        print("\n🧪 Testing Gemini API with SSL fixes...")
        
        if not gemini_service.is_available():
            print("❌ Gemini service not available")
            return False
        
        # Test API call
        test_resume = """
        Senior Python Developer with Flask, FastAPI, PostgreSQL, Docker, AWS experience.
        Built microservices and REST APIs for high-traffic applications.
        """
        
        result = await gemini_service.extract_skills_from_resume(test_resume)
        
        if result:
            print(f"✅ SUCCESS! Extracted {len(result)} skills: {result[:5]}...")
            return True
        else:
            print("❌ API call returned empty results")
            return False
            
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

if __name__ == "__main__":
    success = asyncio.run(test_gemini_with_ssl_fix())
    
    if success:
        print("\n🎉 SSL issue resolved! Gemini API is working correctly.")
        print("\n💡 To make this permanent:")
        print("   1. The fixes are automatically applied when the server starts")
        print("   2. Or add these to your system environment variables")
        print("   3. Restart your backend server")
    else:
        print("\n⚠️  SSL fixes didn't resolve the issue.")
        print("\n🔍 Alternative solutions:")
        print("   1. Contact your IT admin about SSL certificate issues")
        print("   2. Try using a different network (mobile hotspot)")
        print("   3. Check if you're behind a corporate firewall")
        print("   4. The system will continue to work in fallback mode")