#!/usr/bin/env python3
"""
Test script to verify Gemini AI integration
Run this to check if your Gemini API key is working correctly.

Usage: python test_gemini.py
"""

import os
import asyncio
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import our services
from services.gemini_service import gemini_service
from services.enhanced_skill_service import skill_service


async def test_gemini_integration():
    """Test the Gemini AI integration"""
    
    print("🔍 Testing Skill-Bridge Gemini AI Integration")
    print("=" * 50)
    
    # Check API key
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("❌ ERROR: No GEMINI_API_KEY found in environment variables")
        print("📝 To fix this:")
        print("   1. Get a free API key from: https://ai.google.dev/")
        print("   2. Add it to your .env file:")
        print("      GEMINI_API_KEY=your_api_key_here")
        print("   3. Restart the server")
        return False
    
    print(f"✅ API key found: {api_key[:10]}...")
    
    # Check service availability
    if not gemini_service.is_available():
        print("❌ ERROR: Gemini service is not available")
        return False
    
    print("✅ Gemini service is available")
    
    # Test skill extraction
    test_resume = """
    Senior Full Stack Developer with 5 years of experience.
    
    Technical Skills:
    - Frontend: React, JavaScript, TypeScript, HTML5, CSS3
    - Backend: Python, Node.js, FastAPI, Express.js
    - Database: PostgreSQL, MongoDB, Redis
    - Cloud: AWS, Docker, Kubernetes
    - Tools: Git, Jenkins, Terraform
    """
    
    print("\n🧪 Testing AI skill extraction...")
    try:
        ai_skills = await gemini_service.extract_skills_from_resume(test_resume)
        print(f"✅ AI extraction successful: {len(ai_skills)} skills found")
        print(f"   Skills: {', '.join(ai_skills[:10])}{'...' if len(ai_skills) > 10 else ''}")
    except Exception as e:
        print(f"❌ AI extraction failed: {e}")
        return False
    
    # Test hybrid extraction
    print("\n🔄 Testing hybrid skill extraction...")
    try:
        hybrid_skills = await skill_service.extract_skills_hybrid(test_resume)
        print(f"✅ Hybrid extraction successful: {len(hybrid_skills)} skills found")
        print(f"   Skills: {', '.join(hybrid_skills[:10])}{'...' if len(hybrid_skills) > 10 else ''}")
    except Exception as e:
        print(f"❌ Hybrid extraction failed: {e}")
        return False
    
    print("\n🎉 All tests passed! Gemini AI integration is working correctly.")
    print("\n💡 Your system will now use:")
    print("   • AI-powered skill extraction for better accuracy")
    print("   • Contextual insights for missing skills")
    print("   • Deterministic fallback for reliability")
    
    return True


async def main():
    """Main test function"""
    try:
        success = await test_gemini_integration()
        if success:
            print("\n🚀 Ready to use Skill-Bridge with AI enhancement!")
            sys.exit(0)
        else:
            print("\n⚠️  Skill-Bridge will work in fallback mode only")
            print("   Add your Gemini API key to enable AI features")
            sys.exit(1)
    except Exception as e:
        print(f"\n💥 Unexpected error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())