#!/usr/bin/env python3
"""
Direct test of quiz functionality without FastAPI server.
"""
import sys
import os
import json
from pathlib import Path

# Add current directory to path
sys.path.insert(0, os.getcwd())

def load_questions():
    """Load questions from questions.json file."""
    try:
        questions_file = Path(__file__).parent / "data" / "questions.json"
        with open(questions_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Failed to load questions.json: {e}")
        return {}

def test_quiz_data():
    """Test that quiz questions are loaded correctly."""
    print("Testing quiz data loading...")
    
    questions_data = load_questions()
    
    if not questions_data:
        print("[ERROR] Failed to load questions data")
        return False
        
    print(f"[OK] Loaded questions for {len(questions_data)} skills")
    
    # Test specific skills mentioned in the error
    test_skills = ['Security', 'Configuration Management', 'JavaScript', 'Selenium']
    
    for skill in test_skills:
        if skill in questions_data:
            questions = questions_data[skill]
            print(f"[OK] {skill}: {len(questions)} questions")
            
            # Validate question structure
            for i, question in enumerate(questions[:1]):  # Check first question
                required_keys = ['id', 'difficulty', 'question', 'options', 'correct', 'explanation']
                missing_keys = [key for key in required_keys if key not in question]
                if missing_keys:
                    print(f"[ERROR] {skill} question {i+1} missing keys: {missing_keys}")
                else:
                    print(f"[OK] {skill} question {i+1} structure is valid")
        else:
            print(f"[ERROR] {skill}: No questions found")
    
    return True

if __name__ == "__main__":
    success = test_quiz_data()
    if success:
        print("\n[SUCCESS] Quiz data test completed successfully!")
    else:
        print("\n[FAILED] Quiz data test failed!")
    
    sys.exit(0 if success else 1)