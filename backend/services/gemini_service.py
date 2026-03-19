"""
Gemini AI Service - Handles AI-powered skill extraction and analysis
"""

import os
import json
import asyncio
import logging
import ssl
from typing import List, Dict, Any, Optional
import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold

# Configure logging
logger = logging.getLogger(__name__)

# Disable SSL verification completely for personal project
def disable_ssl_verification():
    """Completely disable SSL verification for personal/development use"""
    try:
        # Disable SSL verification warnings
        import urllib3
        urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
        
        # Set environment variables to completely bypass SSL verification
        os.environ['PYTHONHTTPSVERIFY'] = '0'
        os.environ['REQUESTS_CA_BUNDLE'] = ''
        os.environ['CURL_CA_BUNDLE'] = ''
        os.environ['SSL_VERIFY'] = 'false'
        os.environ['GRPC_SSL_CIPHER_SUITES'] = 'HIGH'
        os.environ['GOOGLE_APPLICATION_CREDENTIALS_JSON'] = ''
        os.environ['GRPC_VERBOSITY'] = 'ERROR'
        os.environ['GRPC_TRACE'] = ''
        
        # Create completely unverified SSL context
        ssl._create_default_https_context = ssl._create_unverified_context
        
        # Aggressively patch all HTTP libraries to disable SSL verification
        try:
            import requests
            import httpx
            
            # Patch requests session to always use verify=False
            original_request = requests.Session.request
            def patched_request(self, *args, **kwargs):
                kwargs['verify'] = False
                return original_request(self, *args, **kwargs)
            requests.Session.request = patched_request
            
            # Patch default requests functions
            original_get = requests.get
            original_post = requests.post
            original_put = requests.put
            original_delete = requests.delete
            
            def patched_get(*args, **kwargs):
                kwargs['verify'] = False
                return original_get(*args, **kwargs)
            def patched_post(*args, **kwargs):
                kwargs['verify'] = False
                return original_post(*args, **kwargs)
            def patched_put(*args, **kwargs):
                kwargs['verify'] = False
                return original_put(*args, **kwargs)
            def patched_delete(*args, **kwargs):
                kwargs['verify'] = False
                return original_delete(*args, **kwargs)
                
            requests.get = patched_get
            requests.post = patched_post
            requests.put = patched_put
            requests.delete = patched_delete
            
            # Also patch httpx if available
            try:
                original_httpx_get = httpx.get
                original_httpx_post = httpx.post
                def patched_httpx_get(*args, **kwargs):
                    kwargs['verify'] = False
                    return original_httpx_get(*args, **kwargs)
                def patched_httpx_post(*args, **kwargs):
                    kwargs['verify'] = False
                    return original_httpx_post(*args, **kwargs)
                httpx.get = patched_httpx_get
                httpx.post = patched_httpx_post
            except:
                pass
                
        except ImportError:
            pass
        
        logger.info("SSL verification completely disabled for development")
        return True
    except Exception as e:
        logger.warning(f"Could not disable SSL verification: {e}")
        return False

# Disable SSL verification on import
disable_ssl_verification()

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
MODEL_NAME = "gemini-1.5-flash"  # Using stable model for better compatibility

logger.info(f"Initializing Gemini service...")
if GEMINI_API_KEY:
    logger.info(f"Gemini API key found: {GEMINI_API_KEY[:10]}...")
else:
    logger.warning("No Gemini API key found in environment variables")

class GeminiService:
    def __init__(self):
        if GEMINI_API_KEY and GEMINI_API_KEY != "your_gemini_api_key_here":
            try:
                # Aggressively patch Google's transport layers to disable SSL verification
                try:
                    import google.auth.transport.requests
                    import google.auth.transport._http_client
                    
                    # Monkey patch Google's HTTP client to disable SSL verification
                    original_request_init = google.auth.transport.requests.Request.__init__
                    def patched_init(self, session=None, timeout=None):
                        if session is None:
                            import requests
                            session = requests.Session()
                            session.verify = False
                        return original_request_init(self, session, timeout)
                    google.auth.transport.requests.Request.__init__ = patched_init
                    
                    # Also patch the underlying HTTP client if it exists
                    try:
                        import google.api_core.client_info
                        import google.api_core.client_options
                        
                        # Patch any HTTP clients in the Google API core
                        original_build_api_call_settings = getattr(google.api_core, '_build_api_call_settings', None)
                        if original_build_api_call_settings:
                            def patched_build_api_call_settings(*args, **kwargs):
                                result = original_build_api_call_settings(*args, **kwargs)
                                # Try to set verify=False on any HTTP settings
                                if hasattr(result, 'transport') and hasattr(result.transport, 'verify'):
                                    result.transport.verify = False
                                return result
                            google.api_core._build_api_call_settings = patched_build_api_call_settings
                    except:
                        pass
                    
                except Exception as e:
                    logger.warning(f"Could not patch Google auth transport: {e}")
                
                # Try to patch the generative AI client specifically
                try:
                    import google.generativeai.client
                    import google.generativeai._client
                    
                    # If we can access the client's HTTP session, patch it
                    logger.info("Attempting to patch Google GenerativeAI client for SSL bypass")
                except:
                    pass
                
                # Configure Gemini with API key
                genai.configure(
                    api_key=GEMINI_API_KEY,
                    transport='rest'  # Use REST transport
                )
                
                self.model = genai.GenerativeModel(
                    model_name=MODEL_NAME,
                    safety_settings={
                        HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
                        HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
                        HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
                        HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
                    }
                )
                logger.info("Gemini service initialized with aggressive SSL verification disabled")
            except Exception as e:
                logger.error(f"Failed to initialize Gemini service: {e}")
                self.model = None
        else:
            logger.warning("No valid Gemini API key found")
            self.model = None
    
    def is_available(self) -> bool:
        """Check if Gemini API is available"""
        available = self.model is not None and GEMINI_API_KEY is not None
        logger.info(f"Gemini AI availability check: {available}")
        if not available:
            logger.warning("Gemini AI not available - will use fallback logic")
        return available
    
    async def extract_skills_from_resume(self, resume_text: str) -> List[str]:
        """
        Extract technical skills from resume text using Gemini AI
        
        Args:
            resume_text: Raw resume content
            
        Returns:
            List of extracted skill names
        """
        logger.info("Starting AI skill extraction...")
        if not self.is_available():
            logger.warning("Gemini AI not available for skill extraction")
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
            logger.info("Calling Gemini API for skill extraction...")
            # Set a shorter timeout for faster fallback
            response = await asyncio.wait_for(
                asyncio.to_thread(
                    self.model.generate_content,
                    prompt,
                    generation_config=genai.types.GenerationConfig(
                        temperature=0.1,
                        max_output_tokens=1000,
                    )
                ),
                timeout=10.0  # 10 second timeout for faster fallback
            )
            
            logger.info(f"Gemini API response received: {len(response.text)} characters")
            
            # Parse JSON response
            content = response.text.strip()
            if content.startswith('```json'):
                content = content.replace('```json', '').replace('```', '').strip()
            elif content.startswith('```'):
                content = content.replace('```', '').strip()
            
            skills = json.loads(content)
            extracted_skills = skills if isinstance(skills, list) else []
            logger.info(f"AI extracted {len(extracted_skills)} skills: {extracted_skills[:5]}...")
            return extracted_skills
            
        except asyncio.TimeoutError:
            logger.warning("Gemini API call timed out, using fallback")
            return []
        except asyncio.TimeoutError:
            logger.warning("Gemini API call timed out, using fallback")
            return []
        except ssl.SSLError as e:
            logger.warning(f"SSL error in Gemini API call (using fallback): {e}")
            return []
        except Exception as e:
            error_msg = str(e).lower()
            if 'ssl' in error_msg or 'certificate' in error_msg or 'handshake' in error_msg:
                logger.warning(f"SSL-related error in Gemini API call (using fallback): {e}")
            else:
                logger.error(f"Gemini skill extraction failed: {e}")
            return []
    
    async def enhance_gap_analysis(
        self, 
        resume_text: str, 
        role: str, 
        level: str,
        missing_skills: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Enhance gap analysis with AI insights
        
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
            response = await asyncio.wait_for(
                asyncio.to_thread(
                    self.model.generate_content,
                    prompt,
                    generation_config=genai.types.GenerationConfig(
                        temperature=0.3,
                        max_output_tokens=1500,
                    )
                ),
                timeout=10.0  # 10 second timeout for analysis
            )
            
            content = response.text.strip()
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
            
            return {
                "enhanced_missing_skills": enhanced_skills,
                "summary": analysis.get("summary")
            }
            
        except asyncio.TimeoutError:
            logger.warning("Gemini gap analysis timed out, using basic results")
            return {
                "enhanced_missing_skills": missing_skills,
                "summary": None
            }
        except ssl.SSLError as e:
            logger.warning(f"SSL error in Gemini gap analysis (using basic results): {e}")
            return {
                "enhanced_missing_skills": missing_skills,
                "summary": None
            }
        except Exception as e:
            error_msg = str(e).lower()
            if 'ssl' in error_msg or 'certificate' in error_msg or 'handshake' in error_msg:
                logger.warning(f"SSL-related error in Gemini gap analysis (using basic results): {e}")
            else:
                logger.error(f"Gemini gap analysis enhancement failed: {e}")
            return {
                "enhanced_missing_skills": missing_skills,
                "summary": None
            }

# Global service instance
gemini_service = GeminiService()