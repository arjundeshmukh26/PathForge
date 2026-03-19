"""
Enhanced Skill Service - Handles hybrid skill extraction, normalization, and processing
"""

import re
import json
import os
from typing import List, Dict, Set, Any, Optional
from collections import Counter


def load_synonyms() -> Dict[str, str]:
    """Load skill synonyms mapping"""
    try:
        data_dir = os.path.join(os.path.dirname(__file__), '..', 'data')
        with open(os.path.join(data_dir, 'synonyms.json'), 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return {}


def fallback_skill_extraction(resume_text: str, skills_db: Dict) -> List[str]:
    """
    Extract skills from resume using keyword matching as fallback
    
    Args:
        resume_text: Raw resume text
        skills_db: Database of known skills from skills.json
        
    Returns:
        List of matched skills
    """
    if not resume_text or not skills_db:
        return []
    
    # Get the skills list from the database
    known_skills = skills_db.get("skills", [])
    if not known_skills:
        return []
    
    # Normalize resume text for better matching
    resume_lower = resume_text.lower()
    
    # Remove common non-skill words and clean text
    cleaned_resume = _clean_resume_text(resume_lower)
    
    found_skills = []
    
    # Direct skill matching
    for skill in known_skills:
        if _skill_matches_in_text(skill, cleaned_resume):
            found_skills.append(skill)
    
    # Additional pattern-based extraction
    pattern_skills = _extract_skills_by_patterns(resume_text)
    found_skills.extend(pattern_skills)
    
    # Remove duplicates while preserving order
    return list(dict.fromkeys(found_skills))


def _clean_resume_text(text: str) -> str:
    """Clean resume text for better skill matching"""
    # Remove common resume noise words
    noise_words = [
        "experience", "years", "year", "months", "month", "proficient", 
        "familiar", "knowledge", "skilled", "expert", "advanced", "basic",
        "intermediate", "working", "hands-on", "strong", "excellent", "good"
    ]
    
    # Replace noise words with spaces
    for word in noise_words:
        text = re.sub(rf'\b{word}\b', ' ', text, flags=re.IGNORECASE)
    
    # Clean up extra whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    
    return text


def _skill_matches_in_text(skill: str, text: str) -> bool:
    """
    Check if a skill matches in the text with various patterns
    """
    skill_lower = skill.lower()
    
    # Direct word boundary match
    if re.search(rf'\b{re.escape(skill_lower)}\b', text):
        return True
    
    # Match with common variations
    variations = _get_skill_variations(skill_lower)
    for variation in variations:
        if re.search(rf'\b{re.escape(variation)}\b', text):
            return True
    
    # Match with dots, hyphens (e.g., "react.js", "node-js")
    skill_pattern = skill_lower.replace('.', r'\.?').replace('-', r'[-\s]?')
    if re.search(rf'\b{skill_pattern}\b', text):
        return True
    
    return False


def _get_skill_variations(skill: str) -> List[str]:
    """Get common variations of a skill name"""
    variations = []
    
    # Common abbreviations and variations
    variation_map = {
        "javascript": ["js", "ecmascript"],
        "typescript": ["ts"],
        "python": ["py"],
        "c#": ["csharp", "c-sharp"],
        "c++": ["cpp", "cplusplus"],
        "postgresql": ["postgres", "psql"],
        "mongodb": ["mongo"],
        "kubernetes": ["k8s"],
        "amazon web services": ["aws"],
        "google cloud platform": ["gcp", "google cloud"],
        "microsoft azure": ["azure"],
        "react": ["reactjs", "react.js"],
        "vue.js": ["vue", "vuejs"],
        "node.js": ["nodejs", "node"],
        "express.js": ["express", "expressjs"],
        "spring boot": ["springboot", "spring"],
        "ruby on rails": ["rails", "ror"],
    }
    
    # Add variations from map
    for key, vars_list in variation_map.items():
        if skill.lower() == key:
            variations.extend(vars_list)
        elif skill.lower() in vars_list:
            variations.append(key)
            variations.extend([v for v in vars_list if v != skill.lower()])
    
    return variations


def _extract_skills_by_patterns(text: str) -> List[str]:
    """
    Extract skills using common resume patterns
    """
    skills = []
    
    # Pattern 1: "Skills: X, Y, Z"
    skills_sections = re.findall(
        r'(?:skills?|technologies?|tools?|languages?)[:\s-]+([^.\n]+)', 
        text, 
        re.IGNORECASE
    )
    
    for section in skills_sections:
        # Split by common separators
        items = re.split(r'[,;|&\n]+', section)
        for item in items:
            clean_item = item.strip().title()
            if len(clean_item) > 1 and len(clean_item) < 30:
                skills.append(clean_item)
    
    # Pattern 2: Programming languages pattern
    prog_langs = re.findall(
        r'\b(Java|Python|JavaScript|C\+\+|C#|PHP|Ruby|Go|Swift|Kotlin|Rust|TypeScript|Scala|Perl|R|MATLAB)\b',
        text,
        re.IGNORECASE
    )
    skills.extend([lang.title() for lang in prog_langs])
    
    # Pattern 3: Frameworks and libraries
    frameworks = re.findall(
        r'\b(React|Angular|Vue|Django|Flask|Spring|Laravel|Rails|Express|Node\.js|jQuery|Bootstrap)\b',
        text,
        re.IGNORECASE
    )
    skills.extend([fw.title() for fw in frameworks])
    
    return skills


def normalize_skills(skills: List[str]) -> List[str]:
    """
    Normalize and deduplicate skills list
    
    Args:
        skills: Raw skills list (may contain duplicates and variations)
        
    Returns:
        Normalized and deduplicated skills list
    """
    if not skills:
        return []
    
    # Skill normalization mappings (standard names)
    normalization_map = {
        # Programming languages
        "js": "JavaScript",
        "javascript": "JavaScript",
        "ts": "TypeScript", 
        "typescript": "TypeScript",
        "py": "Python",
        "python": "Python",
        "java": "Java",
        "c#": "C#",
        "csharp": "C#",
        "c-sharp": "C#",
        "cpp": "C++",
        "c++": "C++",
        "cplusplus": "C++",
        "php": "PHP",
        "ruby": "Ruby",
        "go": "Go",
        "golang": "Go",
        "rust": "Rust",
        "swift": "Swift",
        "kotlin": "Kotlin",
        "scala": "Scala",
        
        # Frontend
        "react": "React",
        "reactjs": "React",
        "react.js": "React",
        "vue": "Vue.js",
        "vuejs": "Vue.js",
        "vue.js": "Vue.js",
        "angular": "Angular",
        "angularjs": "Angular",
        "html": "HTML",
        "html5": "HTML5",
        "css": "CSS",
        "css3": "CSS3",
        "sass": "Sass",
        "scss": "Sass",
        "less": "Less",
        "jquery": "jQuery",
        "bootstrap": "Bootstrap",
        "tailwind": "Tailwind CSS",
        "tailwindcss": "Tailwind CSS",
        
        # Backend
        "node.js": "Node.js",
        "nodejs": "Node.js",
        "node": "Node.js",
        "express": "Express.js",
        "expressjs": "Express.js",
        "express.js": "Express.js",
        "django": "Django",
        "flask": "Flask",
        "fastapi": "FastAPI",
        "spring": "Spring Boot",
        "springboot": "Spring Boot",
        "spring boot": "Spring Boot",
        "laravel": "Laravel",
        "rails": "Ruby on Rails",
        "ruby on rails": "Ruby on Rails",
        "ror": "Ruby on Rails",
        ".net": ".NET",
        "dotnet": ".NET",
        "asp.net": "ASP.NET",
        
        # Databases
        "sql": "SQL",
        "mysql": "MySQL",
        "postgresql": "PostgreSQL",
        "postgres": "PostgreSQL",
        "psql": "PostgreSQL",
        "mongodb": "MongoDB",
        "mongo": "MongoDB",
        "redis": "Redis",
        "sqlite": "SQLite",
        "oracle": "Oracle",
        "cassandra": "Cassandra",
        "elasticsearch": "Elasticsearch",
        
        # Cloud & DevOps
        "aws": "AWS",
        "amazon web services": "AWS",
        "azure": "Microsoft Azure",
        "microsoft azure": "Microsoft Azure",
        "gcp": "Google Cloud Platform",
        "google cloud": "Google Cloud Platform",
        "google cloud platform": "Google Cloud Platform",
        "docker": "Docker",
        "kubernetes": "Kubernetes",
        "k8s": "Kubernetes",
        "jenkins": "Jenkins",
        "gitlab ci": "GitLab CI",
        "github actions": "GitHub Actions",
        "terraform": "Terraform",
        "ansible": "Ansible",
        
        # Tools & Others
        "git": "Git",
        "github": "GitHub",
        "gitlab": "GitLab",
        "bitbucket": "Bitbucket",
        "jira": "Jira",
        "confluence": "Confluence",
        "slack": "Slack",
        "nginx": "Nginx",
        "apache": "Apache",
        "linux": "Linux",
        "ubuntu": "Ubuntu",
        "centos": "CentOS",
        "windows": "Windows",
        "macos": "macOS",
        "bash": "Bash",
        "powershell": "PowerShell",
        "vim": "Vim",
        "vscode": "VS Code",
        "intellij": "IntelliJ IDEA",
    }
    
    normalized_skills = []
    seen_skills = set()
    
    for skill in skills:
        if not skill or not skill.strip():
            continue
            
        # Clean the skill name
        clean_skill = skill.strip()
        
        # Normalize using mapping
        lookup_key = clean_skill.lower()
        normalized = normalization_map.get(lookup_key, clean_skill)
        
        # Avoid duplicates (case-insensitive)
        if normalized.lower() not in seen_skills:
            seen_skills.add(normalized.lower())
            normalized_skills.append(normalized)
    
    return sorted(normalized_skills)


def merge_ai_and_fallback_skills(ai_skills: List[str], fallback_skills: List[str]) -> List[str]:
    """
    Merge AI and fallback skills, giving preference to AI results
    
    Args:
        ai_skills: Skills extracted using AI
        fallback_skills: Skills extracted using keyword matching
        
    Returns:
        Merged and normalized skills list
    """
    # Combine both lists
    all_skills = (ai_skills or []) + (fallback_skills or [])
    
    # Normalize the combined list (this also deduplicates)
    return normalize_skills(all_skills)