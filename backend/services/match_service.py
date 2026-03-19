"""
Match Service - Handles skill matching and scoring between user skills and job requirements
"""

from typing import List, Dict, Any
import re


def get_role_skills(role: str, level: str, roles_db: Dict) -> List[str]:
    """
    Get required skills for a specific role and experience level
    
    Args:
        role: Job role name (e.g., "Backend Engineer")
        level: Experience level ("entry", "junior", "senior")
        roles_db: Database of job roles and their skill requirements
        
    Returns:
        List of required skills for the role and level
    """
    if not role or not level or not roles_db:
        return []
    
    # Get role data
    role_data = roles_db.get(role, {})
    if not role_data:
        return []
    
    # Get skills for the specific level
    level_skills = role_data.get(level.lower(), [])
    
    # Ensure we return a list
    if not isinstance(level_skills, list):
        return []
    
    return level_skills


def compute_match(user_skills: List[str], role_skills: List[str]) -> Dict[str, Any]:
    """
    Compute skill matching between user skills and job requirements
    
    Args:
        user_skills: Skills extracted from user's resume
        role_skills: Required skills for the target role
        
    Returns:
        Dictionary with match results:
        - matched: Skills the user has that match requirements
        - missing: Required skills the user is missing
        - score: Matching percentage (0-100)
        - total_required: Total number of required skills
        - total_matched: Total number of matched skills
    """
    if not user_skills:
        user_skills = []
    if not role_skills:
        role_skills = []
    
    # Normalize skills for comparison (case-insensitive)
    user_skills_lower = [skill.lower().strip() for skill in user_skills if skill]
    role_skills_lower = [skill.lower().strip() for skill in role_skills if skill]
    
    # Find matches using fuzzy matching
    matched_skills = []
    missing_skills = []
    
    for required_skill in role_skills:
        if _skill_is_matched(required_skill, user_skills_lower):
            matched_skills.append(required_skill)
        else:
            missing_skills.append(required_skill)
    
    # Calculate score
    total_required = len(role_skills)
    total_matched = len(matched_skills)
    
    if total_required == 0:
        score = 100.0  # No requirements means perfect match
    else:
        score = round((total_matched / total_required) * 100, 1)
    
    return {
        "matched": matched_skills,
        "missing": missing_skills,
        "score": score,
        "total_required": total_required,
        "total_matched": total_matched
    }


def _skill_is_matched(required_skill: str, user_skills_lower: List[str]) -> bool:
    """
    Check if a required skill is matched by any user skill
    Uses fuzzy matching to handle skill variations
    
    Args:
        required_skill: The skill required by the job
        user_skills_lower: User's skills in lowercase
        
    Returns:
        True if the skill is matched
    """
    if not required_skill:
        return False
    
    required_lower = required_skill.lower().strip()
    
    # Direct match
    if required_lower in user_skills_lower:
        return True
    
    # Fuzzy matching for skill variations
    for user_skill in user_skills_lower:
        if _skills_are_equivalent(required_lower, user_skill):
            return True
    
    return False


def _skills_are_equivalent(skill1: str, skill2: str) -> bool:
    """
    Check if two skills are equivalent using fuzzy matching rules
    
    Args:
        skill1: First skill (lowercase)
        skill2: Second skill (lowercase)
        
    Returns:
        True if skills are considered equivalent
    """
    if not skill1 or not skill2:
        return False
    
    # Exact match
    if skill1 == skill2:
        return True
    
    # Define equivalence groups
    equivalence_groups = [
        # JavaScript variations
        {"javascript", "js", "ecmascript"},
        {"typescript", "ts"},
        
        # Python variations
        {"python", "py"},
        
        # C# variations
        {"c#", "csharp", "c-sharp"},
        
        # C++ variations
        {"c++", "cpp", "cplusplus"},
        
        # Database variations
        {"postgresql", "postgres", "psql"},
        {"mongodb", "mongo"},
        
        # Cloud variations
        {"aws", "amazon web services"},
        {"gcp", "google cloud platform", "google cloud"},
        {"azure", "microsoft azure"},
        
        # Framework variations
        {"react", "reactjs", "react.js"},
        {"vue.js", "vue", "vuejs"},
        {"node.js", "nodejs", "node"},
        {"express.js", "express", "expressjs"},
        {"spring boot", "springboot", "spring"},
        {"ruby on rails", "rails", "ror"},
        
        # DevOps variations
        {"kubernetes", "k8s"},
        {"docker", "containerization"},
        
        # Version control
        {"git", "version control"},
        
        # Operating systems
        {"linux", "unix"},
        
        # Styling
        {"css", "css3"},
        {"html", "html5"},
        {"sass", "scss"},
        {"tailwind css", "tailwindcss", "tailwind"},
    ]
    
    # Check if skills are in the same equivalence group
    for group in equivalence_groups:
        if skill1 in group and skill2 in group:
            return True
    
    # Partial matching for compound skills
    if _partial_skill_match(skill1, skill2):
        return True
    
    return False


def _partial_skill_match(skill1: str, skill2: str) -> bool:
    """
    Check for partial matches between skills
    
    Args:
        skill1: First skill
        skill2: Second skill
        
    Returns:
        True if there's a meaningful partial match
    """
    # Remove common words
    common_words = {"js", "css", "api", "framework", "library", "database", "db"}
    
    # Split skills into words
    words1 = set(re.findall(r'\w+', skill1.lower())) - common_words
    words2 = set(re.findall(r'\w+', skill2.lower())) - common_words
    
    if not words1 or not words2:
        return False
    
    # Check if one skill contains significant words from another
    intersection = words1.intersection(words2)
    
    # If there's substantial overlap, consider it a match
    min_words = min(len(words1), len(words2))
    if min_words > 0 and len(intersection) >= min_words * 0.7:
        return True
    
    # Special cases for specific technologies
    special_matches = [
        # Frontend framework ecosystem
        ({"react", "redux"}, {"react"}),
        ({"vue", "vuex"}, {"vue"}),
        ({"angular", "rxjs"}, {"angular"}),
        
        # Backend framework ecosystem  
        ({"django", "rest"}, {"django"}),
        ({"spring", "boot"}, {"spring"}),
        ({"express", "node"}, {"node"}),
        
        # Database related
        ({"mysql", "sql"}, {"sql"}),
        ({"postgresql", "sql"}, {"sql"}),
        ({"mongodb", "nosql"}, {"nosql"}),
        
        # Cloud related
        ({"aws", "s3"}, {"aws"}),
        ({"aws", "ec2"}, {"aws"}),
        ({"aws", "lambda"}, {"aws"}),
        ({"azure", "blob"}, {"azure"}),
        ({"gcp", "storage"}, {"gcp"}),
        
        # DevOps related
        ({"docker", "container"}, {"containerization"}),
        ({"kubernetes", "orchestration"}, {"container orchestration"}),
        ({"jenkins", "ci/cd"}, {"ci/cd"}),
        ({"git", "github"}, {"version control"}),
    ]
    
    for group1, group2 in special_matches:
        if (group1.issubset(words1) and group2.issubset(words2)) or \
           (group1.issubset(words2) and group2.issubset(words1)):
            return True
    
    return False


def get_skill_similarity_score(user_skills: List[str], role_skills: List[str]) -> float:
    """
    Calculate a more nuanced similarity score that considers partial matches
    
    Args:
        user_skills: Skills from user's resume
        role_skills: Required skills for the job
        
    Returns:
        Similarity score between 0 and 1
    """
    if not role_skills:
        return 1.0
    
    if not user_skills:
        return 0.0
    
    total_score = 0.0
    
    for required_skill in role_skills:
        best_match_score = 0.0
        
        for user_skill in user_skills:
            # Calculate similarity between this pair
            similarity = _calculate_skill_similarity(required_skill.lower(), user_skill.lower())
            best_match_score = max(best_match_score, similarity)
        
        total_score += best_match_score
    
    return total_score / len(role_skills)


def _calculate_skill_similarity(skill1: str, skill2: str) -> float:
    """
    Calculate similarity score between two individual skills
    
    Returns:
        Similarity score between 0 and 1
    """
    if skill1 == skill2:
        return 1.0
    
    if _skills_are_equivalent(skill1, skill2):
        return 1.0
    
    # Partial matching with scoring
    words1 = set(re.findall(r'\w+', skill1.lower()))
    words2 = set(re.findall(r'\w+', skill2.lower()))
    
    if not words1 or not words2:
        return 0.0
    
    intersection = words1.intersection(words2)
    union = words1.union(words2)
    
    # Jaccard similarity
    jaccard = len(intersection) / len(union)
    
    # Boost score for meaningful technology overlaps
    if jaccard > 0.3:
        return min(1.0, jaccard * 1.5)
    
    return jaccard