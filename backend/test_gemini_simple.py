#!/usr/bin/env python3
"""
Simple Gemini API Test - Test SSL fixes and API connectivity
"""

import os
import asyncio
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def simple_gemini_test():
    """Simple test of Gemini API with SSL fixes"""
    
    print("Testing Gemini API Connection")
    print("=" * 40)
    
    try:
        # Apply basic SSL fixes
        import ssl
        
        # Set environment variables to bypass SSL verification  
        os.environ['PYTHONHTTPSVERIFY'] = '0'
        os.environ['REQUESTS_CA_BUNDLE'] = ''
        os.environ['CURL_CA_BUNDLE'] = ''
        
        # Create unverified SSL context
        ssl._create_default_https_context = ssl._create_unverified_context
        
        print("SUCCESS: SSL fixes applied")
        
        # Import and configure Gemini
        import google.generativeai as genai
        
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key or api_key == "your_gemini_api_key_here":
            print("ERROR: No valid API key found")
            return False
            
        print(f"SUCCESS: API key found: {api_key[:10]}...")
        
        # Configure Gemini
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.0-flash-exp")
        
        print("SUCCESS: Model configured")
        
        # Simple test prompt
        test_prompt = "List 3 programming languages as a JSON array. Example: [\"Python\", \"JavaScript\", \"Java\"]"
        
        print("INFO: Making API call...")
        
        response = model.generate_content(
            test_prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.1,
                max_output_tokens=100,
            )
        )
        
        print("SUCCESS: Response received!")
        print(f"Response: {response.text}")
        
        return True
        
    except Exception as e:
        print(f"ERROR: Test failed: {e}")
        return False

if __name__ == "__main__":
    success = asyncio.run(simple_gemini_test())
    
    if success:
        print("\nSUCCESS! Gemini API is working with SSL fixes!")
        print("The backend should now work correctly with AI features.")
    else:
        print("\nWARNING: Gemini API test failed.")
        print("The system will continue to work in fallback mode.")