"""
Quiz routes for skill verification before marking skills as learned.
"""
import json
import logging
import random
from pathlib import Path
from fastapi import APIRouter, HTTPException, Request, Body
from pydantic import BaseModel, ValidationError
from typing import List, Dict, Any, Union

logger = logging.getLogger(__name__)

router = APIRouter()

class QuizResponse(BaseModel):
    skill: str
    questions: List[Dict[str, Any]]
    total_questions: int
    pass_threshold: int

class QuizAnswer(BaseModel):
    question_id: int
    selected_option: int

class QuizSubmission(BaseModel):
    skill: str
    answers: List[QuizAnswer]


class QuizResult(BaseModel):
    skill: str
    score: int
    total_questions: int
    passed: bool
    pass_threshold: int
    correct_answers: List[int]
    explanations: List[str]

def load_questions():
    """Load questions from questions.json file."""
    try:
        questions_file = Path(__file__).parent.parent / "data" / "questions.json"
        with open(questions_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Failed to load questions.json: {e}")
        return {}

@router.get("/quiz/{skill_name}", response_model=QuizResponse)
async def get_skill_quiz(skill_name: str):
    """
    Get quiz questions for a specific skill.
    
    Args:
        skill_name: Name of the skill to quiz on
        
    Returns:
        Quiz questions for the skill
    """
    try:
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
            # Generate default questions if none exist for this skill
            logger.warning(f"No questions found for skill: {normalized_skill}")
            skill_questions = generate_default_questions(normalized_skill)
        
        # Randomize question order to prevent memorization
        randomized_questions = random.sample(skill_questions, len(skill_questions))
        
        # Remove correct answers and explanations from response (client shouldn't see these)
        safe_questions = []
        for question in randomized_questions:
            safe_question = {
                "id": question["id"],
                "difficulty": question["difficulty"],
                "question": question["question"],
                "options": question["options"]
                # Intentionally exclude 'correct' and 'explanation'
            }
            safe_questions.append(safe_question)
        
        pass_threshold = 3  # Need 3 out of 5 correct
        
        logger.info(f"Generated quiz for skill '{normalized_skill}' with {len(safe_questions)} questions")
        
        return QuizResponse(
            skill=normalized_skill,
            questions=safe_questions,
            total_questions=len(safe_questions),
            pass_threshold=pass_threshold
        )
        
    except Exception as e:
        logger.error(f"Failed to generate quiz for skill '{skill_name}': {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate quiz for skill: {skill_name}")


@router.post("/quiz/submit", response_model=QuizResult)
async def submit_quiz(data: dict = Body(...)):
    """
    Submit quiz answers and get results.
    
    Args:
        submission: Quiz answers submission
        
    Returns:
        Quiz results with score and explanations
    """
    try:
        # Manual validation and parsing
        if not isinstance(data, dict):
            raise HTTPException(status_code=400, detail="Request body must be a JSON object")
        
        if "skill" not in data or "answers" not in data:
            raise HTTPException(status_code=400, detail="Missing required fields: skill and answers")
        
        skill = data["skill"]
        answers_data = data["answers"]
        
        logger.info(f"Quiz submission received - Skill: {skill}, Answers: {len(answers_data)}")
        
        # Validate and convert answers
        validated_answers = []
        for i, answer_obj in enumerate(answers_data):
            if not isinstance(answer_obj, dict):
                raise HTTPException(status_code=400, detail=f"Answer {i+1} must be an object")
            
            if "question_id" not in answer_obj or "selected_option" not in answer_obj:
                raise HTTPException(status_code=400, detail=f"Answer {i+1} missing question_id or selected_option")
            
            try:
                question_id = int(answer_obj["question_id"])
                selected_option = int(answer_obj["selected_option"])
            except (ValueError, TypeError):
                raise HTTPException(status_code=400, detail=f"Answer {i+1} contains invalid integers")
            
            validated_answers.append({
                "question_id": question_id,
                "selected_option": selected_option
            })
            
            logger.info(f"  Answer {i+1}: question_id={question_id}, selected_option={selected_option}")
        
        questions_data = load_questions()
        
        # Get the original questions for this skill
        normalized_skill = skill.strip()
        skill_questions = None
        
        if normalized_skill in questions_data:
            skill_questions = questions_data[normalized_skill]
        else:
            # Try case-insensitive match
            for skill, questions in questions_data.items():
                if skill.lower() == normalized_skill.lower():
                    skill_questions = questions
                    break
        
        if not skill_questions:
            skill_questions = generate_default_questions(normalized_skill)
        
        if len(validated_answers) != len(skill_questions):
            raise HTTPException(
                status_code=400, 
                detail=f"Expected {len(skill_questions)} answers, got {len(validated_answers)}"
            )
        
        # Create lookup for questions by ID
        question_lookup = {q["id"]: q for q in skill_questions}
        
        # Calculate score by matching question IDs
        correct_count = 0
        correct_answers = []
        explanations = []
        
        # Sort answers by question ID to ensure consistent ordering
        sorted_answers = sorted(validated_answers, key=lambda x: x["question_id"])
        
        for answer in sorted_answers:
            question_id = answer["question_id"]
            user_selection = answer["selected_option"]
            
            if question_id not in question_lookup:
                raise HTTPException(
                    status_code=400,
                    detail=f"Question ID {question_id} not found for skill {normalized_skill}"
                )
            
            question = question_lookup[question_id]
            correct_answer = question["correct"]
            correct_answers.append(correct_answer)
            explanations.append(question.get("explanation", "No explanation available."))
            
            if user_selection == correct_answer:
                correct_count += 1
        
        pass_threshold = 3
        passed = correct_count >= pass_threshold
        
        logger.info(f"Quiz submitted for skill '{normalized_skill}': {correct_count}/{len(skill_questions)} correct, passed: {passed}")
        
        return QuizResult(
            skill=normalized_skill,
            score=correct_count,
            total_questions=len(skill_questions),
            passed=passed,
            pass_threshold=pass_threshold,
            correct_answers=correct_answers,
            explanations=explanations
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to process quiz submission for skill '{skill}': {e}")
        raise HTTPException(status_code=500, detail="Failed to process quiz submission")

def generate_default_questions(skill_name: str) -> List[Dict[str, Any]]:
    """
    Generate default questions when none exist for a skill.
    
    Args:
        skill_name: Name of the skill
        
    Returns:
        List of default questions
    """
    return [
        {
            "id": 1,
            "difficulty": "easy",
            "question": f"You're working on a project that requires {skill_name}. A team member asks you to explain a basic concept. What approach demonstrates solid foundational knowledge?",
            "options": [
                "Refer them to documentation only",
                "Explain the core principles and provide a practical example",
                "Tell them to figure it out themselves",
                "Give a theoretical definition without examples"
            ],
            "correct": 1,
            "explanation": f"Demonstrating {skill_name} knowledge means combining theoretical understanding with practical application."
        },
        {
            "id": 2,
            "difficulty": "easy",
            "question": f"Your project encounters a common {skill_name} issue that's blocking progress. What's the most effective troubleshooting approach?",
            "options": [
                "Restart the entire application",
                "Systematically isolate the problem, check logs, and apply best practices",
                "Try random solutions until something works",
                "Ask others to fix it"
            ],
            "correct": 1,
            "explanation": f"Effective {skill_name} problem-solving requires systematic debugging and applying established best practices."
        },
        {
            "id": 3,
            "difficulty": "hard",
            "question": f"You need to implement a complex feature using {skill_name} that must scale to handle high load and be maintainable. What's your architectural approach?",
            "options": [
                "Implement the quickest solution that works",
                "Design with scalability, maintainability, and {skill_name} best practices in mind",
                "Copy an existing solution without modifications",
                "Use the most complex approach possible"
            ],
            "correct": 1,
            "explanation": f"Advanced {skill_name} skills require balancing immediate needs with long-term architectural considerations."
        },
        {
            "id": 4,
            "difficulty": "hard",
            "question": f"Your team is adopting {skill_name} for a critical system. You need to ensure code quality and knowledge transfer. What's the most comprehensive approach?",
            "options": [
                "Write code without documentation",
                "Establish coding standards, implement code reviews, create documentation, and provide team training",
                "Let everyone learn independently",
                "Focus only on getting features delivered"
            ],
            "correct": 1,
            "explanation": f"Professional {skill_name} implementation requires comprehensive practices including standards, reviews, documentation, and knowledge sharing."
        },
        {
            "id": 5,
            "difficulty": "hard",
            "question": f"You're leading a project where {skill_name} performance is critical and requirements may change. How do you ensure adaptability while maintaining quality?",
            "options": [
                "Over-engineer everything upfront",
                "Implement monitoring, testing, and flexible architecture that can evolve with changing requirements",
                "Avoid any optimization until problems occur",
                "Use only the simplest possible implementation"
            ],
            "correct": 1,
            "explanation": f"Expert-level {skill_name} skills involve building systems that are performant, monitorable, testable, and adaptable to changing requirements."
        }
    ]


@router.post("/quiz/debug-submit")
async def debug_submit_quiz(request: Request):
    """Debug endpoint to see raw request data"""
    try:
        body = await request.json()
        logger.info(f"Raw quiz submission body: {body}")
        return {"received": body, "status": "success"}
    except Exception as e:
        logger.error(f"Debug submit error: {e}")
        return {"error": str(e), "status": "failed"}