"""
Enhanced Skill Service - Comprehensive skill analysis with hybrid AI + deterministic approach
"""

import re
import json
import os
import asyncio
import logging
from typing import List, Dict, Set, Any, Optional, Tuple
from collections import Counter

from .gemini_service import gemini_service

# Configure logging
logger = logging.getLogger(__name__)


class EnhancedSkillService:
    def __init__(self):
        self.synonyms = self._load_synonyms()
        self.skills_db = self._load_skills_db()
    
    def _load_synonyms(self) -> Dict[str, str]:
        """Load skill synonyms mapping"""
        try:
            data_dir = os.path.join(os.path.dirname(__file__), '..', 'data')
            with open(os.path.join(data_dir, 'synonyms.json'), 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            return {}
    
    def _load_skills_db(self) -> Dict[str, Any]:
        """Load skills database"""
        try:
            data_dir = os.path.join(os.path.dirname(__file__), '..', 'data')
            with open(os.path.join(data_dir, 'skills.json'), 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            return {"skills": []}
    
    def normalize_skill(self, skill: str) -> str:
        """
        Normalize a skill name using synonyms mapping
        
        Args:
            skill: Raw skill name
            
        Returns:
            Normalized skill name
        """
        if not skill:
            return ""
        
        # Clean the skill name
        clean_skill = skill.strip().lower()
        
        # Check synonyms mapping
        if clean_skill in self.synonyms:
            return self.synonyms[clean_skill]
        
        # Return title case if no mapping found
        return skill.strip().title()
    
    def extract_skills_fallback(self, resume_text: str) -> List[str]:
        """
        Fallback skill extraction using keyword matching and patterns
        
        Args:
            resume_text: Raw resume content
            
        Returns:
            List of extracted skills
        """
        if not resume_text:
            return []
        
        # Get known skills from database
        known_skills = self.skills_db.get("skills", [])
        
        # Normalize resume text for better matching
        resume_lower = resume_text.lower()
        cleaned_resume = self._clean_resume_text(resume_lower)
        
        found_skills = []
        
        # Direct skill matching against known skills
        for skill in known_skills:
            if self._skill_matches_in_text(skill, cleaned_resume):
                found_skills.append(skill)
        
        # Pattern-based extraction for additional skills
        pattern_skills = self._extract_skills_by_patterns(resume_text)
        found_skills.extend(pattern_skills)
        
        # Normalize all extracted skills
        normalized_skills = []
        for skill in found_skills:
            normalized = self.normalize_skill(skill)
            if normalized and normalized not in normalized_skills:
                normalized_skills.append(normalized)
        
        return normalized_skills
    
    async def extract_skills_hybrid(self, resume_text: str) -> List[str]:
        """
        Hybrid skill extraction using AI + fallback approach
        
        Args:
            resume_text: Raw resume content
            
        Returns:
            Combined list of extracted skills from both AI and fallback
        """
        if not resume_text:
            logger.warning("No resume text provided for skill extraction")
            return []
        
        logger.info(f"Starting hybrid skill extraction for resume with {len(resume_text)} characters")
        
        # Try AI extraction first
        ai_skills = []
        if gemini_service.is_available():
            try:
                logger.info("Attempting AI-powered skill extraction...")
                ai_skills = await gemini_service.extract_skills_from_resume(resume_text)
                # Normalize AI-extracted skills
                ai_skills = [self.normalize_skill(skill) for skill in ai_skills if skill]
                logger.info(f"AI extraction completed: {len(ai_skills)} skills found")
            except Exception as e:
                logger.error(f"AI skill extraction failed, using fallback only: {e}")
        else:
            logger.info("AI not available, using fallback extraction only")
        
        # Always run fallback extraction
        logger.info("Running fallback skill extraction...")
        fallback_skills = self.extract_skills_fallback(resume_text)
        logger.info(f"Fallback extraction completed: {len(fallback_skills)} skills found")
        
        # Merge and deduplicate skills
        all_skills = list(set(ai_skills + fallback_skills))
        
        # Filter out empty or invalid skills
        valid_skills = [skill for skill in all_skills if skill and len(skill) > 1]
        
        logger.info(f"Total unique skills extracted: {len(valid_skills)} (AI: {len(ai_skills)}, Fallback: {len(fallback_skills)})")
        
        return sorted(valid_skills)
    
    def calculate_compatibility_score(
        self, 
        user_skills: List[str], 
        role_skills: Dict[str, Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Calculate compatibility score based on weighted skills
        
        Args:
            user_skills: Skills extracted from user's resume
            role_skills: Role requirements with weights and resources
            
        Returns:
            Detailed compatibility analysis
        """
        if not role_skills:
            return {
                "score": 0.0,
                "matched_skills": [],
                "missing_skills": [],
                "total_weight": 0,
                "matched_weight": 0
            }
        
        # Normalize user skills for comparison
        user_skills_normalized = [self.normalize_skill(skill) for skill in user_skills]
        user_skills_set = set(skill.lower() for skill in user_skills_normalized if skill)
        
        matched_skills = []
        missing_skills = []
        total_weight = 0
        matched_weight = 0
        
        # Process each required skill
        for skill_name, skill_data in role_skills.items():
            weight = skill_data.get("weight", 1)
            resources = skill_data.get("resources", [])
            total_weight += weight
            
            # Check if user has this skill (fuzzy matching)
            is_matched = self._is_skill_matched(skill_name, user_skills_set)
            
            if is_matched:
                matched_skills.append({
                    "skill": skill_name,
                    "weight": weight,
                    "resources": resources
                })
                matched_weight += weight
            else:
                missing_skills.append({
                    "skill": skill_name,
                    "weight": weight,
                    "resources": resources
                })
        
        # Calculate score as percentage
        score = (matched_weight / total_weight * 100) if total_weight > 0 else 0
        
        # Sort missing skills by weight (descending)
        missing_skills.sort(key=lambda x: x["weight"], reverse=True)
        
        return {
            "score": round(score, 1),
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "total_weight": total_weight,
            "matched_weight": matched_weight
        }
    
    def _is_skill_matched(self, required_skill: str, user_skills_set: Set[str]) -> bool:
        """
        Check if a required skill is matched by user skills with fuzzy matching
        
        Args:
            required_skill: Required skill name
            user_skills_set: Set of user skills (lowercase)
            
        Returns:
            True if skill is matched
        """
        required_lower = required_skill.lower()
        
        # Direct match
        if required_lower in user_skills_set:
            return True
        
        # Fuzzy matching for variations
        for user_skill in user_skills_set:
            if self._skills_are_similar(required_lower, user_skill):
                return True
        
        return False
    
    def _skills_are_similar(self, skill1: str, skill2: str) -> bool:
        """Check if two skills are similar enough to be considered a match"""
        if not skill1 or not skill2:
            return False
        
        # Exact match
        if skill1 == skill2:
            return True
        
        # Check if one contains the other (for cases like "react" vs "react.js")
        if skill1 in skill2 or skill2 in skill1:
            return True
        
        # Check through synonyms
        normalized1 = self.normalize_skill(skill1)
        normalized2 = self.normalize_skill(skill2)
        
        return normalized1.lower() == normalized2.lower()
    
    def _clean_resume_text(self, text: str) -> str:
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
    
    def _skill_matches_in_text(self, skill: str, text: str) -> bool:
        """Check if a skill matches in the text with various patterns"""
        skill_lower = skill.lower()
        
        # Direct word boundary match
        if re.search(rf'\b{re.escape(skill_lower)}\b', text):
            return True
        
        # Match with common variations
        variations = self._get_skill_variations(skill_lower)
        for variation in variations:
            if re.search(rf'\b{re.escape(variation)}\b', text):
                return True
        
        return False
    
    def _get_skill_variations(self, skill: str) -> List[str]:
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
        }
        
        # Add variations from map
        for key, vars_list in variation_map.items():
            if skill.lower() == key:
                variations.extend(vars_list)
            elif skill.lower() in vars_list:
                variations.append(key)
                variations.extend([v for v in vars_list if v != skill.lower()])
        
        return variations
    
    def _extract_skills_by_patterns(self, text: str) -> List[str]:
        """Extract skills using common resume patterns"""
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
                clean_item = item.strip()
                if len(clean_item) > 1 and len(clean_item) < 30:
                    skills.append(clean_item)
        
        # Pattern 2: Programming languages pattern
        prog_langs = re.findall(
            r'\b(Java|Python|JavaScript|C\+\+|C#|PHP|Ruby|Go|Swift|Kotlin|Rust|TypeScript|Scala)\b',
            text,
            re.IGNORECASE
        )
        skills.extend(prog_langs)
        
        return skills


# Global service instance
skill_service = EnhancedSkillService()