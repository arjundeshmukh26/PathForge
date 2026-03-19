#!/usr/bin/env python3
"""
Minimal server to test quiz functionality in isolation.
"""
import json
import random
from pathlib import Path

# Simulate the quiz endpoint logic
def load_questions():
    """Load questions from questions.json file."""
    try:
        questions_file = Path(__file__).parent / "data" / "questions.json"
        with open(questions_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Failed to load questions.json: {e}")
        return {}

def get_quiz_questions(skill_name: str):
    """Get quiz questions for a specific skill."""
    questions_data = load_questions()
    
    # Normalize skill name for lookup (handle variations)
    normalized_skill = skill_name.strip()
    skill_questions = None
    
    # Try exact match first
    if normalized_skill in questions_data:
        skill_questions = questions_data[normalized_skill]
    else:
        # Try case-insensitive match
        for skill, questions in questions_data.items():
            if skill.lower() == normalized_skill.lower():
                skill_questions = questions
                break
    
    if not skill_questions:
        # Return error for missing skills
        return {"error": f"No questions found for skill: {normalized_skill}"}
    
    # Randomize question order
    randomized_questions = random.sample(skill_questions, len(skill_questions))
    
    # Remove correct answers and explanations from response
    safe_questions = []
    for question in randomized_questions:
        safe_question = {
            "id": question["id"],
            "difficulty": question["difficulty"],
            "question": question["question"],
            "options": question["options"]
        }
        safe_questions.append(safe_question)
    
    return {
        "skill": normalized_skill,
        "questions": safe_questions,
        "total_questions": len(safe_questions),
        "pass_threshold": 3
    }

def test_quiz_endpoints():
    """Test the quiz functionality with various skills."""
    print("Testing quiz endpoint functionality...")
    
    test_skills = ['Selenium', 'Security', 'JavaScript', 'Git', 'HTML', 'NonExistentSkill']
    
    for skill in test_skills:
        print(f"\n--- Testing skill: {skill} ---")
        result = get_quiz_questions(skill)
        
        if "error" in result:
            print(f"[ERROR] {result['error']}")
        else:
            print(f"[SUCCESS] {skill}: {result['total_questions']} questions, pass threshold: {result['pass_threshold']}")
            
            # Show first question as example
            if result['questions']:
                first_q = result['questions'][0]
                print(f"Sample question: {first_q['question'][:60]}...")
                print(f"Options: {len(first_q['options'])} choices")

if __name__ == "__main__":
    test_quiz_endpoints()