"""
Tests for the analyze endpoint and backend services
"""

import pytest
import json
import os
import sys
from fastapi.testclient import TestClient

# Add the parent directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from main import app
from services.skill_service import fallback_skill_extraction, normalize_skills
from services.match_service import compute_match, get_role_skills
from services.roadmap_service import generate_roadmap


class TestAnalyzeEndpoint:
    """Test cases for the /analyze endpoint"""
    
    def setup_method(self):
        """Setup test client and sample data"""
        self.client = TestClient(app)
        self.valid_payload = {
            "resume": "Experienced Python developer with 3 years of experience in Django and FastAPI. "
                     "Proficient in JavaScript, React, PostgreSQL, and Docker. Built several web applications "
                     "using REST APIs and microservices architecture. Familiar with AWS, Git, and Agile methodologies.",
            "role": "Backend Engineer", 
            "level": "junior"
        }
        
    def test_analyze_success_happy_path(self):
        """Test successful analysis with valid resume"""
        response = self.client.post("/api/v1/analyze", json=self.valid_payload)
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "skills" in data
        assert "matched" in data
        assert "missing" in data
        assert "score" in data
        assert "roadmap" in data
        
        # Verify data types
        assert isinstance(data["skills"], list)
        assert isinstance(data["matched"], list)
        assert isinstance(data["missing"], list)
        assert isinstance(data["score"], (int, float))
        assert isinstance(data["roadmap"], list)
        
        # Verify score is within valid range
        assert 0 <= data["score"] <= 100
        
        # Verify that Python and FastAPI are detected and matched
        skills_lower = [skill.lower() for skill in data["skills"]]
        assert any("python" in skill.lower() for skill in data["skills"])
        
        # Verify roadmap structure if missing skills exist
        if data["roadmap"]:
            for item in data["roadmap"]:
                assert "skill" in item
                assert "steps" in item
                assert isinstance(item["steps"], list)
    
    def test_analyze_empty_resume_error(self):
        """Test error handling for empty resume"""
        payload = self.valid_payload.copy()
        payload["resume"] = ""
        
        response = self.client.post("/api/v1/analyze", json=payload)
        
        assert response.status_code == 422  # Validation error
        error_data = response.json()
        assert "detail" in error_data
    
    def test_analyze_short_resume_error(self):
        """Test error handling for very short resume"""
        payload = self.valid_payload.copy()
        payload["resume"] = "Short"
        
        response = self.client.post("/api/v1/analyze", json=payload)
        
        assert response.status_code == 422  # Validation error
    
    def test_analyze_invalid_role_error(self):
        """Test error handling for invalid role"""
        payload = self.valid_payload.copy()
        payload["role"] = "Nonexistent Role"
        
        response = self.client.post("/api/v1/analyze", json=payload)
        
        assert response.status_code == 400
        error_data = response.json()
        assert "not found" in error_data["detail"].lower()
    
    def test_analyze_invalid_level_error(self):
        """Test error handling for invalid experience level"""
        payload = self.valid_payload.copy()
        payload["level"] = "invalid_level"
        
        response = self.client.post("/api/v1/analyze", json=payload)
        
        assert response.status_code == 422  # Validation error
    
    def test_analyze_missing_fields(self):
        """Test error handling for missing required fields"""
        # Missing resume
        response = self.client.post("/api/v1/analyze", json={"role": "Backend Engineer", "level": "junior"})
        assert response.status_code == 422
        
        # Missing role
        response = self.client.post("/api/v1/analyze", json={"resume": "test resume", "level": "junior"})
        assert response.status_code == 422
        
        # Missing level
        response = self.client.post("/api/v1/analyze", json={"resume": "test resume", "role": "Backend Engineer"})
        assert response.status_code == 422
    
    def test_analyze_different_roles(self):
        """Test analysis with different job roles"""
        roles_to_test = ["Frontend Engineer", "Full Stack Engineer", "Data Scientist"]
        
        for role in roles_to_test:
            payload = self.valid_payload.copy()
            payload["role"] = role
            
            response = self.client.post("/api/v1/analyze", json=payload)
            
            if response.status_code == 200:  # Role exists
                data = response.json()
                assert isinstance(data["score"], (int, float))
                assert 0 <= data["score"] <= 100
    
    def test_analyze_different_levels(self):
        """Test analysis with different experience levels"""
        levels = ["entry", "junior", "senior"]
        
        for level in levels:
            payload = self.valid_payload.copy()
            payload["level"] = level
            
            response = self.client.post("/api/v1/analyze", json=payload)
            
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data["score"], (int, float))


class TestSkillService:
    """Test cases for skill extraction and normalization"""
    
    def setup_method(self):
        """Setup test data"""
        self.sample_skills_db = {
            "skills": ["Python", "JavaScript", "React", "Django", "PostgreSQL", "Docker", "AWS", "Git"]
        }
        
        self.sample_resume = """
        Software Engineer with 3 years of experience.
        
        Skills: Python, JavaScript, React.js, Node.js, PostgreSQL, Docker
        
        Experience:
        - Built web applications using Django and Flask
        - Developed REST APIs with FastAPI
        - Worked with MySQL databases
        - Used Git for version control
        """
    
    def test_fallback_skill_extraction(self):
        """Test fallback skill extraction from resume text"""
        extracted_skills = fallback_skill_extraction(self.sample_resume, self.sample_skills_db)
        
        assert isinstance(extracted_skills, list)
        assert len(extracted_skills) > 0
        
        # Should find Python, JavaScript, React, PostgreSQL, Docker, Git
        skills_lower = [skill.lower() for skill in extracted_skills]
        assert any("python" in skill.lower() for skill in extracted_skills)
        assert any("javascript" in skill.lower() for skill in extracted_skills)
    
    def test_normalize_skills(self):
        """Test skill normalization"""
        raw_skills = ["python", "js", "react.js", "docker", "postgres", "git"]
        normalized = normalize_skills(raw_skills)
        
        assert isinstance(normalized, list)
        assert "Python" in normalized
        assert "JavaScript" in normalized
        assert "React" in normalized
        assert "Docker" in normalized
        assert "PostgreSQL" in normalized
        assert "Git" in normalized
        
        # Check deduplication
        duplicates = ["python", "Python", "PYTHON"]
        normalized = normalize_skills(duplicates)
        assert normalized.count("Python") == 1
    
    def test_normalize_skills_empty_input(self):
        """Test normalization with empty input"""
        assert normalize_skills([]) == []
        assert normalize_skills(None) == []


class TestMatchService:
    """Test cases for skill matching and scoring"""
    
    def setup_method(self):
        """Setup test data"""
        self.sample_roles_db = {
            "Backend Engineer": {
                "entry": ["Python", "SQL"],
                "junior": ["Python", "SQL", "Django", "REST APIs"],
                "senior": ["Python", "SQL", "Django", "REST APIs", "System Design", "Docker"]
            }
        }
    
    def test_get_role_skills(self):
        """Test getting skills for a role and level"""
        skills = get_role_skills("Backend Engineer", "junior", self.sample_roles_db)
        
        expected = ["Python", "SQL", "Django", "REST APIs"]
        assert skills == expected
    
    def test_get_role_skills_invalid_role(self):
        """Test getting skills for invalid role"""
        skills = get_role_skills("Invalid Role", "junior", self.sample_roles_db)
        assert skills == []
    
    def test_get_role_skills_invalid_level(self):
        """Test getting skills for invalid level"""
        skills = get_role_skills("Backend Engineer", "invalid", self.sample_roles_db)
        assert skills == []
    
    def test_compute_match_perfect_score(self):
        """Test match computation with perfect score"""
        user_skills = ["Python", "SQL", "Django", "REST APIs"]
        role_skills = ["Python", "SQL", "Django", "REST APIs"]
        
        result = compute_match(user_skills, role_skills)
        
        assert result["score"] == 100.0
        assert len(result["matched"]) == 4
        assert len(result["missing"]) == 0
        assert result["total_required"] == 4
        assert result["total_matched"] == 4
    
    def test_compute_match_partial_score(self):
        """Test match computation with partial score"""
        user_skills = ["Python", "SQL"]
        role_skills = ["Python", "SQL", "Django", "REST APIs"]
        
        result = compute_match(user_skills, role_skills)
        
        assert result["score"] == 50.0  # 2 out of 4 matched
        assert len(result["matched"]) == 2
        assert len(result["missing"]) == 2
        assert "Django" in result["missing"]
        assert "REST APIs" in result["missing"]
    
    def test_compute_match_no_skills(self):
        """Test match computation with no user skills"""
        user_skills = []
        role_skills = ["Python", "SQL", "Django"]
        
        result = compute_match(user_skills, role_skills)
        
        assert result["score"] == 0.0
        assert len(result["matched"]) == 0
        assert len(result["missing"]) == 3
    
    def test_compute_match_empty_requirements(self):
        """Test match computation with no role requirements"""
        user_skills = ["Python", "JavaScript"]
        role_skills = []
        
        result = compute_match(user_skills, role_skills)
        
        assert result["score"] == 100.0  # No requirements means perfect match
        assert len(result["matched"]) == 0
        assert len(result["missing"]) == 0


class TestRoadmapService:
    """Test cases for roadmap generation"""
    
    def test_generate_roadmap(self):
        """Test roadmap generation for missing skills"""
        missing_skills = ["React", "Docker", "AWS"]
        roadmap = generate_roadmap(missing_skills)
        
        assert isinstance(roadmap, list)
        assert len(roadmap) == 3
        
        for item in roadmap:
            assert "skill" in item
            assert "steps" in item
            assert isinstance(item["steps"], list)
            assert len(item["steps"]) > 0
            assert item["skill"] in missing_skills
    
    def test_generate_roadmap_empty_skills(self):
        """Test roadmap generation with empty skills list"""
        roadmap = generate_roadmap([])
        assert roadmap == []
    
    def test_generate_roadmap_known_skills(self):
        """Test roadmap generation for well-known skills"""
        missing_skills = ["JavaScript", "Python"]
        roadmap = generate_roadmap(missing_skills)
        
        assert len(roadmap) == 2
        
        # Check that JavaScript roadmap contains relevant steps
        js_roadmap = next((item for item in roadmap if item["skill"] == "JavaScript"), None)
        assert js_roadmap is not None
        assert any("fundamentals" in step.lower() for step in js_roadmap["steps"])


class TestEndpointHelpers:
    """Test cases for helper endpoints"""
    
    def setup_method(self):
        """Setup test client"""
        self.client = TestClient(app)
    
    def test_get_roles_endpoint(self):
        """Test the /roles endpoint"""
        response = self.client.get("/api/v1/roles")
        
        assert response.status_code == 200
        data = response.json()
        assert "roles" in data
        assert isinstance(data["roles"], list)
        assert len(data["roles"]) > 0
        assert "Backend Engineer" in data["roles"]
    
    def test_get_skills_endpoint(self):
        """Test the /skills endpoint"""
        response = self.client.get("/api/v1/skills")
        
        assert response.status_code == 200
        data = response.json()
        assert "skills" in data
        assert isinstance(data["skills"], list)
        assert len(data["skills"]) > 0
    
    def test_root_endpoint(self):
        """Test the root endpoint"""
        response = self.client.get("/")
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "version" in data
    
    def test_health_endpoint(self):
        """Test the health endpoint"""
        response = self.client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert data["status"] == "healthy"


if __name__ == "__main__":
    # Run tests with pytest
    pytest.main([__file__, "-v"])