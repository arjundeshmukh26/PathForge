"""
Analyze Route - Main endpoint for resume analysis and skill matching
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, validator
from typing import List, Dict, Any, Optional
import json
import os

from services.ai_service import extract_skills_with_ai
from services.skill_service import fallback_skill_extraction, normalize_skills
from services.match_service import get_role_skills, compute_match
from services.roadmap_service import generate_roadmap

analyze_router = APIRouter()


class AnalyzeRequest(BaseModel):
    """Request model for resume analysis"""
    resume: str
    role: str
    level: str

    @validator('resume')
    def validate_resume(cls, v):
        if not v or not v.strip():
            raise ValueError('Resume cannot be empty')
        if len(v.strip()) < 10:
            raise ValueError('Resume is too short (minimum 10 characters)')
        return v.strip()

    @validator('role')
    def validate_role(cls, v):
        if not v or not v.strip():
            raise ValueError('Role cannot be empty')
        return v.strip()

    @validator('level')
    def validate_level(cls, v):
        allowed_levels = ['entry', 'junior', 'senior']
        if v.lower() not in allowed_levels:
            raise ValueError(f'Level must be one of: {allowed_levels}')
        return v.lower()


class SkillItem(BaseModel):
    """Individual skill item"""
    skill: str
    steps: List[str]


class AnalyzeResponse(BaseModel):
    """Response model for resume analysis"""
    skills: List[str]
    matched: List[str]
    missing: List[str]
    score: float
    roadmap: List[SkillItem]


@analyze_router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_resume(request: AnalyzeRequest):
    """
    Analyze resume and generate skill matching report with roadmap
    
    Args:
        request: Resume analysis request containing resume text, role, and level
        
    Returns:
        Analysis results with extracted skills, matches, gaps, and learning roadmap
    """
    try:
        # Load data files
        data_dir = os.path.join(os.path.dirname(__file__), '..', 'data')
        
        with open(os.path.join(data_dir, 'roles.json'), 'r') as f:
            roles_db = json.load(f)
            
        with open(os.path.join(data_dir, 'skills.json'), 'r') as f:
            skills_db = json.load(f)

        # Validate role exists
        if request.role not in roles_db:
            available_roles = list(roles_db.keys())
            raise HTTPException(
                status_code=400,
                detail=f"Role '{request.role}' not found. Available roles: {available_roles[:10]}..."
            )

        # Extract skills from resume
        try:
            # Try AI extraction first
            ai_skills = await extract_skills_with_ai(request.resume)
        except Exception as e:
            # Fallback to keyword matching if AI fails
            print(f"AI extraction failed: {e}. Using fallback method.")
            ai_skills = []

        # Always use fallback extraction as backup/enhancement
        fallback_skills = fallback_skill_extraction(request.resume, skills_db)
        
        # Normalize and merge skills
        all_skills = normalize_skills(ai_skills + fallback_skills)
        
        # Ensure we always return a list
        if not isinstance(all_skills, list):
            all_skills = []

        # Get required skills for role and level
        role_skills = get_role_skills(request.role, request.level, roles_db)
        
        # Compute matching
        match_result = compute_match(all_skills, role_skills)
        
        # Generate learning roadmap for missing skills
        roadmap = generate_roadmap(match_result['missing'])

        return AnalyzeResponse(
            skills=all_skills,
            matched=match_result['matched'],
            missing=match_result['missing'],
            score=match_result['score'],
            roadmap=roadmap
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail="Data files not found")
    except Exception as e:
        print(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@analyze_router.get("/roles")
async def get_available_roles():
    """Get list of available job roles"""
    try:
        data_dir = os.path.join(os.path.dirname(__file__), '..', 'data')
        with open(os.path.join(data_dir, 'roles.json'), 'r') as f:
            roles_db = json.load(f)
        return {"roles": list(roles_db.keys())}
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Roles data not found")


@analyze_router.get("/skills")
async def get_available_skills():
    """Get list of all available skills"""
    try:
        data_dir = os.path.join(os.path.dirname(__file__), '..', 'data')
        with open(os.path.join(data_dir, 'skills.json'), 'r') as f:
            skills_db = json.load(f)
        return {"skills": skills_db.get("skills", [])}
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Skills data not found")