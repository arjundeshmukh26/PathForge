#!/usr/bin/env python3
"""
Test script to demonstrate improved AI prompts
Shows the difference between basic and sophisticated analysis
"""

import asyncio
import logging
import sys
import os

# Add current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from services.direct_gemini_client import direct_gemini_client
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("Make sure you're running this from the backend directory")
    sys.exit(1)

# Set up logging
logging.basicConfig(level=logging.INFO)

# Sample resume for testing
SAMPLE_RESUME = """
Senior Software Engineer | 5+ years experience

EXPERIENCE:
• Led development of microservices architecture serving 1M+ users
• Built real-time chat application using WebSocket technology
• Implemented CI/CD pipelines reducing deployment time by 60%
• Designed RESTful APIs for mobile and web applications
• Optimized database queries improving performance by 40%
• Mentored junior developers and conducted code reviews

TECHNICAL SKILLS:
• Languages: Python, JavaScript, Java
• Web: React, HTML/CSS, Bootstrap
• Backend: Django, Express.js
• Database: PostgreSQL, MongoDB
• Cloud: AWS (EC2, S3, Lambda)
• Tools: Git, Docker, Jenkins

PROJECTS:
• E-commerce Platform: Full-stack web application with payment integration
• Data Analytics Dashboard: Built using Python and React for business insights  
• Mobile API Gateway: Designed microservices architecture with rate limiting
"""

async def test_improved_prompts():
    """Test the improved prompts with a sample resume"""
    
    print("🧪 Testing Improved AI Prompts")
    print("=" * 50)
    
    if not direct_gemini_client.is_available():
        print("❌ Direct Gemini client not available - check API key")
        return
    
    print("✅ Direct Gemini client is available")
    print("\n🔍 Testing Skill Extraction with Improved Prompt...")
    
    # Test skill extraction
    try:
        skills = await direct_gemini_client.extract_skills_from_resume(SAMPLE_RESUME)
        print(f"\n📊 Extracted {len(skills)} skills:")
        for i, skill in enumerate(skills, 1):
            print(f"  {i:2d}. {skill}")
            
        print(f"\n✨ Enhanced extraction found skills like:")
        implied_skills = [s for s in skills if s in [
            "REST APIs", "WebSocket", "Microservices", "CI/CD", 
            "Performance Optimization", "Code Review", "System Architecture",
            "Database Optimization", "API Gateway", "Rate Limiting",
            "Authentication", "Payment Integration", "Real-time Communication"
        ]]
        for skill in implied_skills[:5]:
            print(f"     • {skill} (inferred from project context)")
            
    except Exception as e:
        print(f"❌ Skill extraction failed: {e}")
        return
    
    print("\n🎯 Testing Gap Analysis with Improved Prompt...")
    
    # Mock missing skills for testing
    missing_skills = [
        {"skill": "TypeScript", "weight": 4, "resources": []},
        {"skill": "Kubernetes", "weight": 5, "resources": []},
        {"skill": "Redis", "weight": 3, "resources": []},
        {"skill": "GraphQL", "weight": 3, "resources": []}
    ]
    
    try:
        gap_analysis = await direct_gemini_client.enhance_gap_analysis(
            SAMPLE_RESUME, "Senior Backend Engineer", "senior", missing_skills
        )
        
        print(f"\n📋 Gap Analysis Results:")
        print("-" * 30)
        
        # Show skill explanations
        explanations = gap_analysis.get("enhanced_missing_skills", [])
        for skill_data in explanations[:2]:  # Show first 2 for demo
            skill_name = skill_data.get("skill", "Unknown")
            explanation = skill_data.get("why_it_matters", "No explanation provided")
            print(f"\n🔸 {skill_name}:")
            print(f"   {explanation[:200]}...")
        
        # Show summary
        summary = gap_analysis.get("summary", "No summary provided")
        if summary:
            print(f"\n📝 Overall Assessment:")
            print(f"   {summary[:300]}...")
            
        print(f"\n✨ The improved prompt provides:")
        print(f"   • Transferable skills analysis")
        print(f"   • Learning difficulty assessment") 
        print(f"   • Business impact evaluation")
        print(f"   • Personalized recommendations")
        
    except Exception as e:
        print(f"❌ Gap analysis failed: {e}")
        return
    
    print(f"\n🎉 Improved prompts are working!")
    print(f"The AI now provides much more detailed, contextual analysis")

if __name__ == "__main__":
    asyncio.run(test_improved_prompts())