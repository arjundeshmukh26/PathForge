"""
Tests for the skill analysis system
"""

import pytest
import asyncio
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient
import sys
import os

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app
from services.skill_service import skill_service
from services.gemini_service import gemini_service

client = TestClient(app)


class TestSkillService:
    """Test the skill service functionality"""
    
    def test_normalize_skill(self):
        """Test skill normalization with synonyms"""
        # Test exact matches
        assert skill_service.normalize_skill("javascript") == "JavaScript"
        assert skill_service.normalize_skill("react") == "React"
        assert skill_service.normalize_skill("nodejs") == "Node.js"
        
        # Test case insensitive
        assert skill_service.normalize_skill("PYTHON") == "Python"
        
        # Test unknown skills (should return title case)
        assert skill_service.normalize_skill("unknown_skill") == "Unknown_Skill"
    
    def test_fallback_extraction(self):
        """Test fallback skill extraction without AI"""
        resume = """
        Full Stack Developer with 3 years experience.
        Skills: JavaScript, React, Node.js, Python, PostgreSQL, Docker, Git
        Experience with REST APIs and microservices architecture.
        """
        
        extracted_skills = skill_service.extract_skills_fallback(resume)
        
        # Should find common skills
        assert "JavaScript" in extracted_skills
        assert "React" in extracted_skills
        assert "Python" in extracted_skills
        assert len(extracted_skills) > 0
    
    @pytest.mark.asyncio
    async def test_hybrid_extraction_without_ai(self):
        """Test hybrid extraction when AI is not available"""
        resume = "Python developer with Django and PostgreSQL experience"
        
        with patch.object(gemini_service, 'is_available', return_value=False):
            skills = await skill_service.extract_skills_hybrid(resume)
            
        # Should still extract skills using fallback
        assert len(skills) > 0
        assert any("Python" in skill for skill in skills)
    
    def test_compatibility_score_calculation(self):
        """Test the weighted compatibility score calculation"""
        user_skills = ["JavaScript", "React", "Git"]
        
        # Mock role requirements
        role_skills = {
            "JavaScript": {"weight": 5, "resources": []},
            "React": {"weight": 4, "resources": []},
            "TypeScript": {"weight": 3, "resources": []},
            "Git": {"weight": 2, "resources": []}
        }
        
        result = skill_service.calculate_compatibility_score(user_skills, role_skills)
        
        # Should match JavaScript (5) + React (4) + Git (2) = 11 out of 14 total
        expected_score = (11 / 14) * 100  # ~78.6%
        
        assert abs(result["score"] - expected_score) < 1  # Allow small rounding differences
        assert len(result["matched_skills"]) == 3
        assert len(result["missing_skills"]) == 1
        assert result["missing_skills"][0]["skill"] == "TypeScript"


class TestAnalyzeEndpoint:
    """Test the analyze endpoint"""
    
    def test_analyze_successful_request(self):
        """Test successful resume analysis"""
        request_data = {
            "resume": "Senior Python developer with FastAPI, PostgreSQL, Docker, and AWS experience. Built microservices and REST APIs.",
            "role": "Backend Engineer",
            "level": "senior"
        }
        
        response = client.post("/api/v1/analyze", json=request_data)
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "session_id" in data
        assert "compatibility_score" in data
        assert "user_skills" in data
        assert "matched_skills" in data
        assert "missing_skills" in data
        assert "role" in data
        assert "level" in data
        
        # Verify data types
        assert isinstance(data["compatibility_score"], (int, float))
        assert isinstance(data["user_skills"], list)
        assert isinstance(data["matched_skills"], list)
        assert isinstance(data["missing_skills"], list)
        
        # Should extract some Python-related skills
        assert len(data["user_skills"]) > 0
    
    def test_analyze_with_invalid_role(self):
        """Test analysis with non-existent role"""
        request_data = {
            "resume": "Software developer with Python experience",
            "role": "Non Existent Role",
            "level": "junior"
        }
        
        response = client.post("/api/v1/analyze", json=request_data)
        # This should be a 422 validation error since role validation happens at Pydantic level
        assert response.status_code == 422
    
    def test_analyze_with_short_resume(self):
        """Test analysis with too short resume"""
        request_data = {
            "resume": "Short",  # Less than 50 characters
            "role": "Backend Engineer",
            "level": "entry"
        }
        
        response = client.post("/api/v1/analyze", json=request_data)
        assert response.status_code == 422  # Validation error
    
    def test_analyze_with_invalid_level(self):
        """Test analysis with invalid experience level"""
        request_data = {
            "resume": "Python developer with several years of experience in web development and APIs",
            "role": "Backend Engineer",
            "level": "invalid_level"
        }
        
        response = client.post("/api/v1/analyze", json=request_data)
        assert response.status_code == 422  # Validation error


class TestUpdateSkills:
    """Test the skill update functionality"""
    
    def test_update_learned_skills(self):
        """Test marking skills as learned and score recalculation"""
        # First, create an analysis session
        request_data = {
            "resume": "Junior developer with HTML, CSS, JavaScript experience learning React and TypeScript",
            "role": "Frontend Engineer", 
            "level": "junior"
        }
        
        analysis_response = client.post("/api/v1/analyze", json=request_data)
        assert analysis_response.status_code == 200
        
        analysis_data = analysis_response.json()
        session_id = analysis_data["session_id"]
        initial_score = analysis_data["compatibility_score"]
        
        # Update with learned skills
        update_data = {
            "session_id": session_id,
            "learned_skills": ["React", "TypeScript"]
        }
        
        update_response = client.post("/api/v1/update-skills", json=update_data)
        assert update_response.status_code == 200
        
        updated_data = update_response.json()
        
        # Score should improve after learning new skills
        assert updated_data["compatibility_score"] >= initial_score
        
        # User skills should include the learned skills
        user_skills = updated_data["user_skills"]
        assert "React" in user_skills
        assert "TypeScript" in user_skills
    
    def test_update_with_invalid_session(self):
        """Test updating skills with non-existent session"""
        update_data = {
            "session_id": "non-existent-session-id",
            "learned_skills": ["React"]
        }
        
        response = client.post("/api/v1/update-skills", json=update_data)
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()


class TestRolesEndpoint:
    """Test the roles listing endpoint"""
    
    def test_get_roles(self):
        """Test getting available roles"""
        response = client.get("/api/v1/roles")
        assert response.status_code == 200
        
        data = response.json()
        assert "roles" in data
        assert "categories" in data
        
        # Should have at least the main roles
        roles = data["roles"]
        assert "Frontend Engineer" in roles
        assert "Backend Engineer" in roles
        assert "Full Stack Engineer" in roles
        assert "DevOps Engineer" in roles
        
        # Should have categories
        categories = data["categories"]
        assert isinstance(categories, dict)
        assert len(categories) > 0


class TestSessionManagement:
    """Test session management endpoints"""
    
    def test_get_session_data(self):
        """Test retrieving session data"""
        # Create a session first
        request_data = {
            "resume": "Python developer with Flask and PostgreSQL experience",
            "role": "Backend Engineer",
            "level": "junior"
        }
        
        analysis_response = client.post("/api/v1/analyze", json=request_data)
        session_id = analysis_response.json()["session_id"]
        
        # Get session data
        response = client.get(f"/api/v1/session/{session_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["session_id"] == session_id
        assert data["role"] == "Backend Engineer"
        assert data["level"] == "junior"
        assert "timestamp" in data
    
    def test_delete_session(self):
        """Test deleting a session"""
        # Create a session first
        request_data = {
            "resume": "Frontend developer with React and JavaScript experience",
            "role": "Frontend Engineer", 
            "level": "entry"
        }
        
        analysis_response = client.post("/api/v1/analyze", json=request_data)
        session_id = analysis_response.json()["session_id"]
        
        # Delete the session
        response = client.delete(f"/api/v1/session/{session_id}")
        assert response.status_code == 200
        
        # Verify session is deleted (should return 404)
        get_response = client.get(f"/api/v1/session/{session_id}")
        assert get_response.status_code == 404


# Integration test to verify the complete flow
def test_complete_analysis_flow():
    """Test the complete analysis and update flow"""
    # Step 1: Analyze resume
    resume_text = """
    Full Stack Developer with 2 years of experience.
    
    Frontend Skills:
    - React with hooks and context
    - JavaScript ES6+
    - HTML5 and CSS3
    - Responsive design
    
    Backend Skills:
    - Node.js and Express.js
    - MongoDB for database
    - RESTful API design
    - Basic authentication
    
    Tools:
    - Git version control
    - Basic Docker knowledge
    - Familiar with AWS S3
    """
    
    request_data = {
        "resume": resume_text,
        "role": "Full Stack Engineer",
        "level": "junior"
    }
    
    # Analyze
    response = client.post("/api/v1/analyze", json=request_data)
    assert response.status_code == 200
    
    data = response.json()
    session_id = data["session_id"]
    initial_score = data["compatibility_score"]
    
    # Verify we got reasonable results
    assert len(data["user_skills"]) > 5  # Should extract multiple skills
    assert 0 <= initial_score <= 100
    
    # Step 2: Learn some missing skills
    missing_skills = [skill["skill"] for skill in data["missing_skills"][:2]]  # Take first 2
    
    if missing_skills:  # Only if there are missing skills
        update_data = {
            "session_id": session_id,
            "learned_skills": missing_skills
        }
        
        update_response = client.post("/api/v1/update-skills", json=update_data)
        assert update_response.status_code == 200
        
        updated_data = update_response.json()
        new_score = updated_data["compatibility_score"]
        
        # Score should improve
        assert new_score >= initial_score
    
    # Step 3: Verify session data
    session_response = client.get(f"/api/v1/session/{session_id}")
    assert session_response.status_code == 200
    
    # Step 4: Clean up
    delete_response = client.delete(f"/api/v1/session/{session_id}")
    assert delete_response.status_code == 200