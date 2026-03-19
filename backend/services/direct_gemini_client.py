"""
Direct Gemini API Client - Bypasses google-generativeai library SSL issues
Uses raw HTTP requests with verify=False
"""

import os
import json
import asyncio
import logging
import ssl
from typing import List, Dict, Any, Optional
import aiohttp

logger = logging.getLogger(__name__)

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta"

class DirectGeminiClient:
    """Direct HTTP client for Gemini API that bypasses SSL verification"""
    
    def __init__(self):
        self.api_key = GEMINI_API_KEY
        self.base_url = GEMINI_API_BASE_URL
        
        # Create SSL context that doesn't verify certificates
        self.ssl_context = ssl.create_default_context()
        self.ssl_context.check_hostname = False
        self.ssl_context.verify_mode = ssl.CERT_NONE
        
        logger.info("DirectGeminiClient initialized with SSL verification disabled")
    
    def is_available(self) -> bool:
        """Check if API key is available"""
        available = self.api_key and self.api_key != "your_gemini_api_key_here"
        if available:
            logger.info("Direct Gemini client is available")
        else:
            logger.warning("Direct Gemini client not available - no valid API key")
        return available
    
    async def generate_content(self, prompt: str, model: str = "gemini-1.5-flash", timeout: int = 10) -> str:
        """
        Generate content using direct HTTP API call to Gemini
        
        Args:
            prompt: The prompt to send to Gemini
            model: Model name to use
            timeout: Request timeout in seconds
            
        Returns:
            Generated text content
        """
        if not self.is_available():
            raise ValueError("Gemini API key not available")
        
        url = f"{self.base_url}/models/{model}:generateContent"
        
        headers = {
            "Content-Type": "application/json",
            "x-goog-api-key": self.api_key
        }
        
        payload = {
            "contents": [{
                "parts": [{
                    "text": prompt
                }]
            }],
            "generationConfig": {
                "temperature": 0.1,
                "maxOutputTokens": 1000,
                "topP": 0.8,
                "topK": 10
            },
            "safetySettings": [
                {
                    "category": "HARM_CATEGORY_HARASSMENT",
                    "threshold": "BLOCK_NONE"
                },
                {
                    "category": "HARM_CATEGORY_HATE_SPEECH", 
                    "threshold": "BLOCK_NONE"
                },
                {
                    "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    "threshold": "BLOCK_NONE"
                },
                {
                    "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                    "threshold": "BLOCK_NONE"
                }
            ]
        }
        
        timeout_config = aiohttp.ClientTimeout(total=timeout)
        
        async with aiohttp.ClientSession(
            timeout=timeout_config,
            connector=aiohttp.TCPConnector(ssl=False)  # Disable SSL verification
        ) as session:
            logger.info(f"Making direct API call to Gemini: {url}")
            
            async with session.post(url, headers=headers, json=payload) as response:
                if response.status != 200:
                    error_text = await response.text()
                    logger.error(f"Gemini API error {response.status}: {error_text}")
                    raise Exception(f"Gemini API returned status {response.status}: {error_text}")
                
                result = await response.json()
                
                # Extract text from response
                candidates = result.get("candidates", [])
                if not candidates:
                    raise Exception("No candidates in Gemini response")
                
                content = candidates[0].get("content", {})
                parts = content.get("parts", [])
                if not parts:
                    raise Exception("No parts in Gemini response")
                
                text = parts[0].get("text", "")
                logger.info(f"Received Gemini response: {len(text)} characters")
                
                return text
    
    async def extract_skills_from_resume(self, resume_text: str) -> List[str]:
        """
        Extract technical skills from resume text using direct Gemini API
        
        Args:
            resume_text: Raw resume content
            
        Returns:
            List of extracted skill names
        """
        if not self.is_available():
            logger.warning("Direct Gemini client not available")
            return []
        
        prompt = f"""
        Extract all technical skills from this resume. Focus on:
        - Programming languages
        - Frameworks and libraries
        - Tools and technologies
        - Cloud platforms
        - Databases
        - Development methodologies

        Return ONLY a JSON array of skill names. Use standard naming conventions:
        - "JavaScript" not "js" or "javascript"
        - "Node.js" not "nodejs" or "node"
        - "React" not "react.js" or "reactjs"
        
        Resume:
        {resume_text}
        
        Response format: ["skill1", "skill2", "skill3"]
        """
        
        try:
            logger.info("Calling direct Gemini API for skill extraction...")
            response_text = await self.generate_content(prompt)
            
            # Parse JSON response
            content = response_text.strip()
            if content.startswith('```json'):
                content = content.replace('```json', '').replace('```', '').strip()
            elif content.startswith('```'):
                content = content.replace('```', '').strip()
            
            skills = json.loads(content)
            extracted_skills = skills if isinstance(skills, list) else []
            logger.info(f"Direct Gemini API extracted {len(extracted_skills)} skills: {extracted_skills[:5]}...")
            return extracted_skills
            
        except asyncio.TimeoutError:
            logger.warning("Direct Gemini API call timed out")
            return []
        except Exception as e:
            logger.error(f"Direct Gemini skill extraction failed: {e}")
            return []
    
    async def enhance_gap_analysis(
        self, 
        resume_text: str, 
        role: str, 
        level: str,
        missing_skills: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Enhance gap analysis with AI insights using direct API
        
        Args:
            resume_text: Original resume
            role: Target job role
            level: Experience level
            missing_skills: List of missing skills with weights
            
        Returns:
            Enhanced analysis with explanations and summary
        """
        if not self.is_available() or not missing_skills:
            return {
                "enhanced_missing_skills": missing_skills,
                "summary": None
            }
        
        skills_list = [skill["skill"] for skill in missing_skills[:10]]  # Limit to top 10
        
        prompt = f"""
        Analyze this resume for a {level} {role} position. The candidate is missing these key skills:
        {', '.join(skills_list)}

        For each missing skill, provide a 1-2 line explanation of why it matters for this role.
        Also provide an overall 2-3 sentence summary of the candidate's readiness.

        Resume:
        {resume_text}

        Return JSON in this exact format:
        {{
            "skill_explanations": {{
                "Skill Name": "Why this skill matters for the role..."
            }},
            "summary": "Overall assessment of candidate readiness..."
        }}
        """
        
        try:
            logger.info("Calling direct Gemini API for gap analysis...")
            response_text = await self.generate_content(prompt)
            
            content = response_text.strip()
            if content.startswith('```json'):
                content = content.replace('```json', '').replace('```', '').strip()
            elif content.startswith('```'):
                content = content.replace('```', '').strip()
            
            analysis = json.loads(content)
            
            # Enhance missing skills with explanations
            enhanced_skills = []
            explanations = analysis.get("skill_explanations", {})
            
            for skill_data in missing_skills:
                enhanced_skill = skill_data.copy()
                skill_name = skill_data["skill"]
                if skill_name in explanations:
                    enhanced_skill["why_it_matters"] = explanations[skill_name]
                enhanced_skills.append(enhanced_skill)
            
            logger.info("Direct Gemini gap analysis completed successfully")
            return {
                "enhanced_missing_skills": enhanced_skills,
                "summary": analysis.get("summary")
            }
            
        except asyncio.TimeoutError:
            logger.warning("Direct Gemini gap analysis timed out")
            return {
                "enhanced_missing_skills": missing_skills,
                "summary": None
            }
        except Exception as e:
            logger.error(f"Direct Gemini gap analysis failed: {e}")
            return {
                "enhanced_missing_skills": missing_skills,
                "summary": None
            }

# Global client instance
direct_gemini_client = DirectGeminiClient()