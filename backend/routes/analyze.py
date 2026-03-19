"""
Analyze Route - Main endpoint for comprehensive resume analysis
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, field_validator
from typing import List, Dict, Any, Optional
import json
import os
import uuid
from datetime import datetime

from services.skill_service import skill_service
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
        
        # Try direct Gemini client first
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


@router.post("/suggest-roles")
async def suggest_matching_roles(request: dict):
    """
    AI-powered role suggestion based on user profile
    
    Analyzes user skills and suggests other matching roles they might be interested in
    """
    try:
        user_skills = request.get("user_skills", [])
        current_role = request.get("current_role", "")
        current_level = request.get("current_level", "entry")
        resume_text = request.get("resume_text", "")
        
        if not user_skills and not resume_text:
            raise HTTPException(status_code=400, detail="Either user_skills or resume_text is required")
        
        # Load available roles
        try:
            roles_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'roles.json')
            with open(roles_path, 'r') as f:
                roles_data = json.load(f)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to load roles data: {e}")
        
        # Prepare role information for AI analysis
        available_roles = []
        for role_name, role_info in roles_data.items():
            if role_name == current_role:
                continue  # Skip the current role
                
            category = role_info.get("category", "general")
            
            # Get skills for the user's level (or closest available level)
            level_skills = {}
            if current_level in role_info:
                level_skills = role_info[current_level]
            elif "junior" in role_info:
                level_skills = role_info["junior"]
            elif "entry" in role_info:
                level_skills = role_info["entry"]
            
            skills_list = list(level_skills.keys())
            
            available_roles.append({
                "name": role_name,
                "category": category,
                "skills": skills_list[:10],  # Limit to top 10 skills
                "skill_count": len(skills_list)
            })
        
        # Prepare AI prompt for role matching
        skills_text = ", ".join(user_skills[:20]) if user_skills else "Skills extracted from resume"
        
        prompt = f"""
        You are a senior career counselor specializing in technology career transitions. Analyze this candidate's profile and suggest the top 3-4 alternative roles that would be the best matches for them.

        **YOUR PROFILE:**
        Current Target Role: {current_role}
        Experience Level: {current_level.title()}
        Your Key Skills: {skills_text}
        
        Your Resume Context:
        {resume_text[:1000] if resume_text else "No additional context provided"}

        **AVAILABLE ROLES TO CONSIDER:**
        {json.dumps(available_roles[:15], indent=2)}  # Limit to prevent token overflow

        **ANALYSIS CRITERIA:**
        1. **Skill Overlap**: How many of your current skills transfer to this role?
        2. **Learning Curve**: How manageable is the transition given your experience level?
        3. **Career Progression**: Does this role offer good growth opportunities for you?
        4. **Market Demand**: Is this role in high demand in the current market?
        5. **Salary Potential**: Does this role offer competitive compensation?

        **MATCHING LOGIC:**
        - Prioritize roles where 40%+ of your skills are relevant
        - Consider complementary skills that show natural progression from your background
        - Factor in your experience level (don't suggest roles too advanced or too basic)
        - Look for roles in growing fields with good career prospects

        **OUTPUT FORMAT:**
        Return a JSON array of the top 3-4 role suggestions, ordered by match strength. Use second person ("you", "your") throughout:

        [
          {{
            "role": "Role Name",
            "category": "role category",
            "match_percentage": 75,
            "transition_difficulty": "Easy|Moderate|Challenging",
            "why_good_fit": "2-3 sentence explanation of why this role matches your profile and what makes the transition feasible for you.",
            "key_overlapping_skills": ["skill1", "skill2", "skill3"],
            "skills_to_learn": ["newskill1", "newskill2"],
            "growth_potential": "Brief description of career growth opportunities for you",
            "market_outlook": "Brief market demand assessment"
          }}
        ]

        **IMPORTANT GUIDELINES:**
        - Only suggest realistic transitions based on their current skills
        - Provide specific, actionable insights in the explanations
        - Consider both technical skills and implied soft skills from their experience
        - Don't suggest roles that are completely unrelated to their background
        """
        
        # Try AI enhancement with fallback
        ai_suggestions = []
        
        # Try direct Gemini client first
        if direct_gemini_client.is_available():
            try:
                response_text = await direct_gemini_client.generate_content(prompt, timeout=25)
                
                # Parse JSON response
                content = response_text.strip()
                if content.startswith('```json'):
                    content = content.replace('```json', '').replace('```', '').strip()
                elif content.startswith('```'):
                    content = content.replace('```', '').strip()
                
                ai_suggestions = json.loads(content)
                
            except Exception as e:
                print(f"Direct Gemini client role suggestion failed: {e}")
        
        # Try regular Gemini service if direct client failed
        if not ai_suggestions and gemini_service.model:
            try:
                import asyncio
                response = await asyncio.wait_for(
                    asyncio.to_thread(
                        gemini_service.model.generate_content,
                        prompt,
                        generation_config=gemini_service.genai.types.GenerationConfig(
                            temperature=0.3,
                            max_output_tokens=2000,
                        )
                    ),
                    timeout=20.0
                )
                
                response_text = response.text
                
                # Parse JSON response
                content = response_text.strip()
                if content.startswith('```json'):
                    content = content.replace('```json', '').replace('```', '').strip()
                elif content.startswith('```'):
                    content = content.replace('```', '').strip()
                
                ai_suggestions = json.loads(content)
                
            except Exception as e:
                print(f"Gemini service role suggestion failed: {e}")
        
        # Fallback: deterministic role matching based on skill overlap
        if not ai_suggestions:
            print("AI role suggestion failed, using fallback logic")
            fallback_suggestions = []
            
            user_skills_lower = [skill.lower() for skill in user_skills]
            
            for role_info in available_roles:
                role_skills_lower = [skill.lower() for skill in role_info["skills"]]
                
                # Calculate skill overlap
                overlap = len(set(user_skills_lower) & set(role_skills_lower))
                total_role_skills = len(role_skills_lower)
                
                if total_role_skills > 0:
                    match_percentage = min(int((overlap / total_role_skills) * 100), 95)
                    
                    # Only suggest roles with reasonable overlap
                    if overlap >= 2 or match_percentage >= 30:
                        difficulty = "Easy" if match_percentage >= 60 else "Moderate" if match_percentage >= 40 else "Challenging"
                        
                        fallback_suggestions.append({
                            "role": role_info["name"],
                            "category": role_info["category"],
                            "match_percentage": match_percentage,
                            "transition_difficulty": difficulty,
                            "why_good_fit": f"You already have {overlap} relevant skills for this {role_info['category']} role. The transition appears {difficulty.lower()} based on your current skill set.",
                            "key_overlapping_skills": [skill for skill in role_info["skills"][:3] if skill.lower() in user_skills_lower],
                            "skills_to_learn": [skill for skill in role_info["skills"][:3] if skill.lower() not in user_skills_lower],
                            "growth_potential": f"Good growth opportunities for you in the {role_info['category']} field",
                            "market_outlook": "Growing demand in tech industry"
                        })
            
            # Sort by match percentage and take top 4
            ai_suggestions = sorted(fallback_suggestions, key=lambda x: x["match_percentage"], reverse=True)[:4]
        
        # Ensure we have valid suggestions
        if not ai_suggestions:
            ai_suggestions = [{
                "role": "Consider exploring related roles",
                "category": "general",
                "match_percentage": 0,
                "transition_difficulty": "Moderate",
                "why_good_fit": "Based on your skills, you should consider exploring roles in adjacent fields that leverage your existing expertise.",
                "key_overlapping_skills": user_skills[:3] if user_skills else [],
                "skills_to_learn": ["Research specific roles", "Identify skill gaps"],
                "growth_potential": "Many growth opportunities available for you",
                "market_outlook": "Technology roles continue to be in demand"
            }]
        
        return {
            "suggested_roles": ai_suggestions[:4],  # Limit to top 4
            "analysis_method": "ai_enhanced" if len(ai_suggestions) > 1 else "fallback",
            "total_roles_considered": len(available_roles)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error in suggest_matching_roles: {e}")
        raise HTTPException(status_code=500, detail=f"Role suggestion failed: {str(e)}")