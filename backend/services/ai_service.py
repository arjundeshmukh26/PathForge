"""
AI Service - Handles AI-powered skill extraction from resume text
"""

import os
import re
from typing import List, Optional
import json

# For future AI integration - will be configured later
AI_API_KEY = os.getenv("AI_API_KEY", None)
AI_PROVIDER = os.getenv("AI_PROVIDER", "openai")  # openai, anthropic, etc.


async def extract_skills_with_ai(resume_text: str) -> List[str]:
    """
    Extract technical skills from resume using AI
    
    Args:
        resume_text: Raw resume text
        
    Returns:
        List of normalized technical skills
        
    Note:
        Currently returns empty list - AI integration will be added later
        when API key is configured. For now, relies on fallback extraction.
    """
    
    # TODO: Implement actual AI calls when API key is configured
    if not AI_API_KEY:
        print("AI_API_KEY not configured. Skipping AI extraction.")
        return []
    
    try:
        # Placeholder for AI integration
        # Will implement calls to OpenAI/Anthropic/other providers here
        
        # Example structure for future implementation:
        if AI_PROVIDER == "openai":
            return await _call_openai_api(resume_text)
        elif AI_PROVIDER == "anthropic":
            return await _call_anthropic_api(resume_text)
        else:
            print(f"Unknown AI provider: {AI_PROVIDER}")
            return []
            
    except Exception as e:
        print(f"AI skill extraction failed: {e}")
        return []


async def _call_openai_api(resume_text: str) -> List[str]:
    """
    Call OpenAI API for skill extraction (placeholder)
    """
    # TODO: Implement OpenAI API call
    # import openai
    # 
    # prompt = f"""
    # Extract technical skills from this resume. Return only the skill names as a JSON list.
    # Focus on programming languages, frameworks, tools, and technologies.
    # Use standard naming conventions (e.g., "JavaScript" not "js", "React.js" not "react").
    # 
    # Resume:
    # {resume_text}
    # 
    # Skills (JSON list only):
    # """
    # 
    # response = await openai.ChatCompletion.create(
    #     model="gpt-3.5-turbo",
    #     messages=[{"role": "user", "content": prompt}],
    #     max_tokens=500
    # )
    # 
    # Try to parse JSON response and extract skills
    
    return []


async def _call_anthropic_api(resume_text: str) -> List[str]:
    """
    Call Anthropic API for skill extraction (placeholder)
    """
    # TODO: Implement Anthropic API call
    # import anthropic
    # 
    # Similar implementation to OpenAI but with Anthropic's API
    
    return []


def normalize_ai_skills(raw_skills: List[str]) -> List[str]:
    """
    Normalize AI-extracted skills to match standard naming conventions
    
    Args:
        raw_skills: Raw skill names from AI
        
    Returns:
        Normalized skill names
    """
    if not raw_skills:
        return []
    
    # Skill normalization mappings
    skill_mappings = {
        # Programming languages
        "js": "JavaScript",
        "javascript": "JavaScript",
        "ts": "TypeScript",
        "typescript": "TypeScript",
        "py": "Python",
        "python": "Python",
        "java": "Java",
        "c#": "C#",
        "csharp": "C#",
        "cpp": "C++",
        "c++": "C++",
        "php": "PHP",
        "ruby": "Ruby",
        "go": "Go",
        "golang": "Go",
        "rust": "Rust",
        "swift": "Swift",
        "kotlin": "Kotlin",
        
        # Frontend frameworks
        "react": "React",
        "reactjs": "React",
        "react.js": "React",
        "vue": "Vue.js",
        "vuejs": "Vue.js",
        "vue.js": "Vue.js",
        "angular": "Angular",
        "angularjs": "Angular",
        
        # Backend frameworks
        "express": "Express.js",
        "expressjs": "Express.js",
        "express.js": "Express.js",
        "django": "Django",
        "flask": "Flask",
        "spring": "Spring Boot",
        "springboot": "Spring Boot",
        "spring boot": "Spring Boot",
        "laravel": "Laravel",
        "rails": "Ruby on Rails",
        "ruby on rails": "Ruby on Rails",
        
        # Databases
        "mysql": "MySQL",
        "postgresql": "PostgreSQL",
        "postgres": "PostgreSQL",
        "mongodb": "MongoDB",
        "mongo": "MongoDB",
        "redis": "Redis",
        "sqlite": "SQLite",
        
        # Cloud & DevOps
        "aws": "AWS",
        "amazon web services": "AWS",
        "azure": "Microsoft Azure",
        "gcp": "Google Cloud Platform",
        "google cloud": "Google Cloud Platform",
        "docker": "Docker",
        "kubernetes": "Kubernetes",
        "k8s": "Kubernetes",
        
        # Tools
        "git": "Git",
        "github": "GitHub",
        "gitlab": "GitLab",
        "jenkins": "Jenkins",
        "nginx": "Nginx",
        "apache": "Apache",
    }
    
    normalized = []
    for skill in raw_skills:
        if not skill:
            continue
            
        # Clean and lowercase for lookup
        clean_skill = skill.strip().lower()
        
        # Use mapping if available, otherwise use title case of original
        normalized_skill = skill_mappings.get(clean_skill, skill.strip().title())
        
        if normalized_skill and normalized_skill not in normalized:
            normalized.append(normalized_skill)
    
    return normalized