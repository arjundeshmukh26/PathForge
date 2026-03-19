"""
Tests for the quiz system functionality
"""

import json
import sys
import os
from fastapi.testclient import TestClient

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app

client = TestClient(app)


class TestQuizSystem:
    """Test quiz system endpoints and functionality"""
    
    def test_get_quiz_for_existing_skill(self):
        """Test getting quiz questions for an existing skill"""
        response = client.get("/api/v1/quiz/JavaScript")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "skill" in data
        assert "questions" in data
        assert "total_questions" in data
        assert "pass_threshold" in data
        
        assert data["skill"] == "JavaScript"
        assert data["total_questions"] == 5
        assert data["pass_threshold"] == 3
        assert len(data["questions"]) == 5
        
        # Verify question structure (should not include correct answers)
        for question in data["questions"]:
            assert "id" in question
            assert "difficulty" in question
            assert "question" in question
            assert "options" in question
            assert len(question["options"]) == 4
            
            # Security check: correct answer and explanation should not be exposed
            assert "correct" not in question
            assert "explanation" not in question
    
    def test_get_quiz_case_insensitive(self):
        """Test quiz endpoint with case-insensitive skill matching"""
        response = client.get("/api/v1/quiz/javascript")  # lowercase
        
        assert response.status_code == 200
        data = response.json()
        assert data["skill"] == "javascript"  # Should normalize properly
    
    def test_get_quiz_for_nonexistent_skill(self):
        """Test getting quiz for a skill that doesn't exist (should generate defaults)"""
        response = client.get("/api/v1/quiz/NonExistentSkill")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["skill"] == "NonExistentSkill"
        assert data["total_questions"] == 5  # Default questions should be generated
        assert len(data["questions"]) == 5
    
    def test_submit_quiz_success(self):
        """Test successful quiz submission with passing score"""
        # First get a quiz
        quiz_response = client.get("/api/v1/quiz/JavaScript")
        assert quiz_response.status_code == 200
        quiz_data = quiz_response.json()
        
        # Submit answers (using question IDs)
        answers = []
        for question in quiz_data["questions"]:
            answers.append({
                "question_id": question["id"],
                "selected_option": 1  # Always select option 1 (may not be correct, but valid format)
            })
        
        submit_data = {
            "skill": "JavaScript",
            "answers": answers
        }
        
        response = client.post("/api/v1/quiz/submit", json=submit_data)
        assert response.status_code == 200
        
        result = response.json()
        assert "skill" in result
        assert "score" in result
        assert "total_questions" in result
        assert "passed" in result
        assert "pass_threshold" in result
        assert "correct_answers" in result
        assert "explanations" in result
        
        assert result["skill"] == "JavaScript"
        assert result["total_questions"] == 5
        assert result["pass_threshold"] == 3
        assert isinstance(result["passed"], bool)
        assert 0 <= result["score"] <= 5
        assert len(result["correct_answers"]) == 5
        assert len(result["explanations"]) == 5
    
    def test_submit_quiz_wrong_question_count(self):
        """Test quiz submission with wrong number of answers"""
        submit_data = {
            "skill": "JavaScript",
            "answers": [
                {"question_id": 1, "selected_option": 0},
                {"question_id": 2, "selected_option": 1}
            ]  # Only 2 answers instead of 5
        }
        
        response = client.post("/api/v1/quiz/submit", json=submit_data)
        assert response.status_code == 400
        assert "Expected 5 answers" in response.json()["detail"]
    
    def test_submit_quiz_invalid_question_id(self):
        """Test quiz submission with invalid question ID"""
        submit_data = {
            "skill": "JavaScript", 
            "answers": [
                {"question_id": 999, "selected_option": 0},  # Invalid question ID
                {"question_id": 1, "selected_option": 1},
                {"question_id": 2, "selected_option": 1},
                {"question_id": 3, "selected_option": 1},
                {"question_id": 4, "selected_option": 1}
            ]
        }
        
        response = client.post("/api/v1/quiz/submit", json=submit_data)
        assert response.status_code == 400
        assert "Question ID 999 not found" in response.json()["detail"]


class TestAnalyzeEndpoint:
    """Test the main analyze endpoint"""
    
    def test_analyze_basic_request(self):
        """Test basic analyze request with valid data"""
        request_data = {
            "resume": "Experienced JavaScript developer with 5 years working with React, Node.js, and MongoDB. Led several full-stack projects and mentored junior developers.",
            "role": "Frontend Engineer",
            "level": "senior"
        }
        
        response = client.post("/api/v1/analyze", json=request_data)
        assert response.status_code == 200
        
        data = response.json()
        
        # Verify response structure
        required_fields = [
            "session_id", "role", "level", "compatibility_score",
            "user_skills", "matched_skills", "missing_skills", "timestamp"
        ]
        
        for field in required_fields:
            assert field in data, f"Missing required field: {field}"
        
        # Verify data types and constraints
        assert isinstance(data["compatibility_score"], (int, float))
        assert 0 <= data["compatibility_score"] <= 100
        assert isinstance(data["user_skills"], list)
        assert isinstance(data["matched_skills"], list)
        assert isinstance(data["missing_skills"], list)
        assert data["role"] == request_data["role"]
        assert data["level"] == request_data["level"]
    
    def test_analyze_invalid_resume(self):
        """Test analyze with invalid (too short) resume"""
        request_data = {
            "resume": "Short",  # Too short
            "role": "Frontend Engineer", 
            "level": "senior"
        }
        
        response = client.post("/api/v1/analyze", json=request_data)
        assert response.status_code == 422  # Validation error
    
    def test_analyze_invalid_role(self):
        """Test analyze with invalid role"""
        request_data = {
            "resume": "Experienced developer" * 10,  # Long enough resume
            "role": "InvalidRole",
            "level": "senior"
        }
        
        response = client.post("/api/v1/analyze", json=request_data)
        assert response.status_code == 400
        assert "not found" in response.json()["detail"]


class TestHealthEndpoints:
    """Test basic health and info endpoints"""
    
    def test_root_endpoint(self):
        """Test root endpoint returns basic info"""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "version" in data
    
    def test_health_endpoint(self):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"


if __name__ == "__main__":
    # Simple test runner for manual execution
    import traceback
    
    test_classes = [TestQuizSystem, TestAnalyzeEndpoint, TestHealthEndpoints]
    
    total_tests = 0
    passed_tests = 0
    
    for test_class in test_classes:
        print(f"\nRunning {test_class.__name__}...")
        test_instance = test_class()
        
        # Get all test methods
        test_methods = [method for method in dir(test_instance) if method.startswith('test_')]
        
        for test_method in test_methods:
            total_tests += 1
            try:
                print(f"  {test_method}... ", end="")
                getattr(test_instance, test_method)()
                print("PASSED")
                passed_tests += 1
            except Exception as e:
                print("FAILED")
                print(f"    Error: {str(e)}")
                if "--verbose" in sys.argv:
                    traceback.print_exc()
    
    print(f"\nTest Results: {passed_tests}/{total_tests} passed")
    
    if passed_tests == total_tests:
        print("✅ All tests passed!")
        sys.exit(0)
    else:
        print("❌ Some tests failed")
        sys.exit(1)