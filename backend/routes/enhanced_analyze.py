"""
Enhanced Analyze Route - Main endpoint for comprehensive resume analysis
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, field_validator
from typing import List, Dict, Any, Optional
import json
import os
import uuid
from datetime import datetime

from services.enhanced_skill_service import skill_service
from services.gemini_service import gemini_service
from services.direct_gemini_client import direct_gemini_client

router = APIRouter()

# In-memory session storage (in production, use Redis or database)
analysis_sessions: Dict[str, Dict[str, Any]] = {}


class AnalyzeRequest(BaseModel):
    """Request model for resume analysis"""
    resume: str
    role: str
    level: str

    @field_validator('resume')
    @classmethod
    def validate_resume(cls, v):
        if not v or not v.strip():
            raise ValueError('Resume cannot be empty')
        if len(v.strip()) < 50:
            raise ValueError('Resume is too short (minimum 50 characters)')
        return v.strip()

    @field_validator('role')
    @classmethod
    def validate_role(cls, v):
        if not v or not v.strip():
            raise ValueError('Role cannot be empty')
        return v.strip()

    @field_validator('level')
    @classmethod
    def validate_level(cls, v):
        allowed_levels = ['entry', 'junior', 'senior']
        if v.lower() not in allowed_levels:
            raise ValueError(f'Level must be one of: {allowed_levels}')
        return v.lower()


class UpdateSkillsRequest(BaseModel):
    """Request model for updating learned skills"""
    session_id: str
    learned_skills: List[str]


class SkillItem(BaseModel):
    """Individual skill item with weight and resources"""
    skill: str
    weight: int
    resources: List[Dict[str, str]]
    why_it_matters: Optional[str] = None


class AnalyzeResponse(BaseModel):
    """Response model for resume analysis"""
    session_id: str
    user_skills: List[str]
    matched_skills: List[SkillItem]
    missing_skills: List[SkillItem]
    compatibility_score: float
    ai_summary: Optional[str] = None
    role: str
    level: str
    timestamp: str


def load_roles_db() -> Dict[str, Any]:
    """Load roles database"""
    try:
        data_dir = os.path.join(os.path.dirname(__file__), '..', 'data')
        with open(os.path.join(data_dir, 'roles.json'), 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Roles database not found")


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_resume(request: AnalyzeRequest):
    """
    Comprehensive resume analysis with AI enhancement and deterministic fallback
    
    Args:
        request: Resume analysis request
        
    Returns:
        Detailed analysis with scores, gaps, and learning resources
    """
    try:
        # Load roles database
        roles_db = load_roles_db()
        
        # Validate role exists
        if request.role not in roles_db:
            available_roles = list(roles_db.keys())
            raise HTTPException(
                status_code=400,
                detail=f"Role '{request.role}' not found. Available roles: {available_roles}"
            )
        
        # Get role requirements for the specified level
        role_data = roles_db[request.role]
        if request.level not in role_data:
            raise HTTPException(
                status_code=400,
                detail=f"Level '{request.level}' not found for role '{request.role}'"
            )
        
        role_skills = role_data[request.level]
        if not isinstance(role_skills, dict):
            raise HTTPException(
                status_code=500,
                detail="Invalid role data structure"
            )
        
        # Extract skills using hybrid approach
        user_skills = await skill_service.extract_skills_hybrid(request.resume)
        
        # Calculate compatibility score and gaps
        compatibility_analysis = skill_service.calculate_compatibility_score(
            user_skills, role_skills
        )
        
        # Enhance analysis with AI insights (optional - graceful fallback)
        ai_summary = None
        enhanced_missing_skills = compatibility_analysis["missing_skills"]
        ai_enhancement_successful = False
        
        # Try direct Gemini client first (bypasses SSL issues)
        if direct_gemini_client.is_available() and compatibility_analysis["missing_skills"]:
            try:
                ai_enhancement = await direct_gemini_client.enhance_gap_analysis(
                    request.resume,
                    request.role,
                    request.level,
                    compatibility_analysis["missing_skills"]
                )
                ai_summary = ai_enhancement.get("summary")
                enhanced_missing_skills = ai_enhancement.get("enhanced_missing_skills", 
                                                           compatibility_analysis["missing_skills"])
                ai_enhancement_successful = True
                print("AI enhancement completed using direct client")
            except Exception as e:
                print(f"Direct AI enhancement failed: {e}")
        
        # Fallback to original gemini service if direct client failed
        if not ai_enhancement_successful and gemini_service.is_available() and compatibility_analysis["missing_skills"]:
            try:
                ai_enhancement = await gemini_service.enhance_gap_analysis(
                    request.resume,
                    request.role,
                    request.level,
                    compatibility_analysis["missing_skills"]
                )
                ai_summary = ai_enhancement.get("summary")
                enhanced_missing_skills = ai_enhancement.get("enhanced_missing_skills", 
                                                           compatibility_analysis["missing_skills"])
                print("AI enhancement completed using original client")
            except Exception as e:
                print(f"Original AI enhancement failed, using deterministic results: {e}")
        
        # Create session for updates
        session_id = str(uuid.uuid4())
        session_data = {
            "resume": request.resume,
            "role": request.role,
            "level": request.level,
            "user_skills": user_skills,
            "role_skills": role_skills,
            "original_missing_skills": compatibility_analysis["missing_skills"],
            "learned_skills": [],
            "timestamp": datetime.now().isoformat()
        }
        analysis_sessions[session_id] = session_data
        
        # Format response
        matched_skills = [
            SkillItem(
                skill=item["skill"],
                weight=item["weight"],
                resources=item["resources"]
            )
            for item in compatibility_analysis["matched_skills"]
        ]
        
        missing_skills = [
            SkillItem(
                skill=item["skill"],
                weight=item["weight"],
                resources=item["resources"],
                why_it_matters=item.get("why_it_matters")
            )
            for item in enhanced_missing_skills
        ]
        
        return AnalyzeResponse(
            session_id=session_id,
            user_skills=user_skills,
            matched_skills=matched_skills,
            missing_skills=missing_skills,
            compatibility_score=compatibility_analysis["score"],
            ai_summary=ai_summary,
            role=request.role,
            level=request.level,
            timestamp=session_data["timestamp"]
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Unexpected error in analyze_resume: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/update-skills", response_model=AnalyzeResponse)
async def update_learned_skills(request: UpdateSkillsRequest):
    """
    Update learned skills and recalculate compatibility score
    
    Args:
        request: Update request with session ID and learned skills
        
    Returns:
        Updated analysis results
    """
    try:
        # Validate session exists
        if request.session_id not in analysis_sessions:
            raise HTTPException(
                status_code=404,
                detail="Session not found. Please start a new analysis."
            )
        
        session_data = analysis_sessions[request.session_id]
        
        # Update learned skills
        session_data["learned_skills"] = request.learned_skills
        
        # Recalculate with updated skills
        updated_user_skills = session_data["user_skills"] + request.learned_skills
        updated_user_skills = list(set(updated_user_skills))  # Remove duplicates
        
        # Recalculate compatibility
        compatibility_analysis = skill_service.calculate_compatibility_score(
            updated_user_skills, session_data["role_skills"]
        )
        
        # Format response
        matched_skills = [
            SkillItem(
                skill=item["skill"],
                weight=item["weight"],
                resources=item["resources"]
            )
            for item in compatibility_analysis["matched_skills"]
        ]
        
        missing_skills = [
            SkillItem(
                skill=item["skill"],
                weight=item["weight"],
                resources=item["resources"]
            )
            for item in compatibility_analysis["missing_skills"]
        ]
        
        return AnalyzeResponse(
            session_id=request.session_id,
            user_skills=updated_user_skills,
            matched_skills=matched_skills,
            missing_skills=missing_skills,
            compatibility_score=compatibility_analysis["score"],
            ai_summary=None,  # No AI re-analysis for updates
            role=session_data["role"],
            level=session_data["level"],
            timestamp=session_data["timestamp"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error in update_learned_skills: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/roles")
async def get_available_roles():
    """Get list of available job roles with categories"""
    try:
        roles_db = load_roles_db()
        
        roles_by_category = {}
        for role_name, role_data in roles_db.items():
            category = role_data.get("category", "other")
            if category not in roles_by_category:
                roles_by_category[category] = []
            roles_by_category[category].append(role_name)
        
        return {
            "roles": list(roles_db.keys()),
            "categories": roles_by_category
        }
    except Exception as e:
        print(f"Error getting roles: {e}")
        raise HTTPException(status_code=500, detail="Failed to load roles")


@router.get("/session/{session_id}")
async def get_session_data(session_id: str):
    """Get current session data"""
    if session_id not in analysis_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session_data = analysis_sessions[session_id]
    return {
        "session_id": session_id,
        "role": session_data["role"],
        "level": session_data["level"],
        "learned_skills": session_data["learned_skills"],
        "timestamp": session_data["timestamp"]
    }


@router.delete("/session/{session_id}")
async def delete_session(session_id: str):
    """Delete a session"""
    if session_id in analysis_sessions:
        del analysis_sessions[session_id]
        return {"message": "Session deleted successfully"}
    else:
        raise HTTPException(status_code=404, detail="Session not found")