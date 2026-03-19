#!/usr/bin/env python3
"""
Find skills in roles.json that don't have questions in questions.json.
"""
import json
import sys
from pathlib import Path

def load_roles():
    """Load roles from roles.json file."""
    try:
        roles_file = Path(__file__).parent / "data" / "roles.json"
        with open(roles_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Failed to load roles.json: {e}")
        return {}

def load_questions():
    """Load questions from questions.json file."""
    try:
        questions_file = Path(__file__).parent / "data" / "questions.json"
        with open(questions_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Failed to load questions.json: {e}")
        return {}

def find_missing_skills():
    """Find skills in roles that don't have questions."""
    roles_data = load_roles()
    questions_data = load_questions()
    
    all_skills_in_roles = set()
    
    # Extract all skills from all roles and levels
    for role_name, role_data in roles_data.items():
        for level in ['entry', 'junior', 'senior']:
            if level in role_data:
                level_data = role_data[level]
                for skill_name in level_data.keys():
                    all_skills_in_roles.add(skill_name)
    
    # Find skills without questions
    skills_with_questions = set(questions_data.keys())
    missing_skills = all_skills_in_roles - skills_with_questions
    
    print(f"Total skills in roles: {len(all_skills_in_roles)}")
    print(f"Skills with questions: {len(skills_with_questions)}")
    print(f"Missing skills: {len(missing_skills)}")
    
    if missing_skills:
        print("\nSkills missing questions:")
        for skill in sorted(missing_skills):
            print(f"  - {skill}")
    else:
        print("\nAll skills have questions!")
    
    return missing_skills

if __name__ == "__main__":
    missing = find_missing_skills()
    sys.exit(0 if not missing else 1)