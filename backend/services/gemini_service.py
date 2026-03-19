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
MODEL_NAME = "gemini-3.1-flash-lite-preview"  # Using stable model for better compatibility

logger.info(f"Initializing Gemini service...")
if GEMINI_API_KEY:
    logger.info(f"Gemini API key found: {GEMINI_API_KEY[:10]}...")
else:
    logger.warning("No Gemini API key found in environment variables")

class GeminiService:
    def __init__(self):
        if GEMINI_API_KEY and GEMINI_API_KEY != "your_gemini_api_key_here":
            try:
                # Skip complex patching to avoid errors - rely on environment SSL fixes
                logger.info("Skipping complex Google client patching to avoid initialization errors")
                
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
        You are a senior technical recruiter with deep expertise in software engineering. Analyze this resume comprehensively to extract ALL technical skills, both explicitly mentioned and implicitly demonstrated.

        **EXTRACTION GUIDELINES:**

        1. **Direct Skills**: Extract explicitly mentioned technologies, languages, frameworks, tools
        2. **Implied Skills**: Infer skills from project descriptions, achievements, and context
        3. **Experience Depth**: Consider not just mentions but evidence of practical usage
        4. **Modern Equivalents**: If outdated technologies are mentioned, consider if modern equivalents are implied
        5. **Related Technologies**: Extract complementary skills that would be necessary for described work

        **SKILL CATEGORIES TO ANALYZE:**
        - **Programming Languages**: Java, Python, JavaScript, TypeScript, Go, Rust, C++, C#, PHP, Ruby, Swift, Kotlin, Scala
        - **Frontend Technologies**: React, Vue.js, Angular, Svelte, HTML5, CSS3, Sass, Tailwind, Bootstrap, jQuery
        - **Backend Frameworks**: Node.js, Express.js, Django, Flask, FastAPI, Spring Boot, Laravel, Ruby on Rails, ASP.NET
        - **Databases**: PostgreSQL, MySQL, MongoDB, Redis, Elasticsearch, SQLite, Oracle, Cassandra, DynamoDB
        - **Cloud & DevOps**: AWS, Google Cloud, Microsoft Azure, Docker, Kubernetes, Jenkins, GitLab CI, GitHub Actions, Terraform, Ansible
        - **Development Tools**: Git, VS Code, IntelliJ, Webpack, Vite, ESLint, Prettier, Jest, Cypress, Postman
        - **Methodologies**: Agile, Scrum, TDD, CI/CD, Microservices, REST APIs, GraphQL, WebSockets
        - **Data & Analytics**: Pandas, NumPy, TensorFlow, PyTorch, Apache Spark, Kafka, Airflow, ETL
        - **Mobile**: React Native, Swift, Kotlin, Flutter, iOS, Android
        - **Other Technologies**: Blockchain, Machine Learning, AI, Data Science, Security, Performance Optimization

        **INFERENCE EXAMPLES:**
        - "Built a web application with user authentication" → infer: JWT, Sessions, Password Hashing, Authentication
        - "Deployed scalable microservices" → infer: Docker, Load Balancing, API Gateway, Service Discovery
        - "Managed large datasets" → infer: Data Pipeline, ETL, Database Optimization
        - "Developed mobile-responsive interfaces" → infer: Responsive Design, CSS Grid, Flexbox
        - "Implemented real-time features" → infer: WebSockets, Server-Sent Events, Real-time Protocols
        - "Built APIs for external integrations" → infer: REST APIs, API Design, Documentation, Rate Limiting
        - "Optimized application performance" → infer: Performance Monitoring, Caching, Code Optimization

        **CONTEXT ANALYSIS:**
        - Look for years of experience with each technology
        - Consider project complexity to gauge skill level
        - Extract skills from job titles, company types, and project descriptions
        - Identify leadership/architecture skills from role descriptions
        - Recognize testing, security, and best practices from project contexts

        **NAMING CONVENTIONS:**
        - Use industry-standard names: "JavaScript" not "js", "Node.js" not "nodejs", "PostgreSQL" not "postgres"
        - Include specific versions when mentioned: "React 18", "Python 3.9"
        - Use full names for clarity: "Amazon Web Services" can be "AWS", "Machine Learning" not "ML"

        **RESUME TO ANALYZE:**
        {resume_text}

        **OUTPUT REQUIREMENTS:**
        Return a comprehensive JSON array of ALL technical skills found or reasonably inferred. Be thorough but accurate.
        
        Format: ["skill1", "skill2", "skill3", ...]
        """
        
        try:
            logger.info("Calling Gemini API for skill extraction...")
            # Set a shorter timeout for faster fallback
            response = await asyncio.wait_for(
                asyncio.to_thread(
                    self.model.generate_content,
                    prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.2,
                    max_output_tokens=2000,
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
        You are a senior technical hiring manager with 10+ years of experience evaluating candidates for {level} {role} positions. 

        **CANDIDATE PROFILE ANALYSIS:**
        Analyze this resume deeply to understand the candidate's technical background, experience depth, and potential for growth.

        **CURRENT SKILLS ASSESSMENT:**
        Before focusing on missing skills, first evaluate:
        1. **Transferable Skills**: What existing skills could bridge to the missing ones?
        2. **Experience Depth**: How deep is their experience in related areas?
        3. **Learning Trajectory**: What does their skill progression show about adaptability?
        4. **Project Complexity**: What level of technical challenges have they handled?

        **MISSING SKILLS ANALYSIS:**
        For each missing skill, provide nuanced analysis considering:

        **Missing Skills to Evaluate:** {', '.join(skills_list)}

        **EVALUATION FRAMEWORK:**

        1. **Skill Criticality**: How essential is this skill for day-to-day success?
        2. **Learning Curve**: Given their background, how quickly could they acquire this?
        3. **Transferable Knowledge**: What existing skills make this easier to learn?
        4. **Compensation Strategies**: How could their other strengths offset this gap?
        5. **Market Reality**: How common is this skill gap among successful candidates?

        **SPECIFIC CONSIDERATIONS FOR {level.upper()} {role.upper()}:**

        - **Entry Level**: Focus on foundational learning ability, related coursework, personal projects
        - **Junior Level**: Assess growth potential, related experience, ability to learn on the job
        - **Senior Level**: Evaluate architectural thinking, leadership potential, deep expertise in core areas

        **TRANSFERABLE SKILLS ANALYSIS:**
        Consider these potential bridges:
        - **Language Similarity**: Java ↔ C#, JavaScript ↔ TypeScript, Python ↔ Ruby
        - **Framework Patterns**: React ↔ Vue ↔ Angular (component-based thinking)
        - **Database Concepts**: SQL skills transfer across PostgreSQL, MySQL, SQL Server
        - **Cloud Principles**: AWS experience helps with Google Cloud, Azure
        - **DevOps Mindset**: CI/CD, containerization concepts transfer across tools
        - **Architectural Thinking**: Microservices, APIs, system design principles are universal

        **RESUME CONTEXT:**
        {resume_text}

        **OUTPUT REQUIREMENTS:**
        For each missing skill, provide:
        1. **Why it matters**: Role-specific importance and daily usage
        2. **Learning assessment**: Difficulty given their background (Easy/Moderate/Challenging)
        3. **Bridging skills**: What they already know that helps
        4. **Business impact**: How this gap affects immediate productivity vs long-term growth

        **OVERALL ASSESSMENT CRITERIA:**
        - **Technical Readiness**: Can they contribute meaningfully from day 1?
        - **Growth Potential**: How quickly will they close critical gaps?
        - **Cultural Fit**: Do their experiences align with team needs?
        - **Risk Assessment**: What are the hiring risks vs potential upside?

        **OUTPUT FORMAT - RETURN VALID JSON:**
        {{
            "skill_explanations": {{
                "Skill Name": "**Why Critical**: [Specific importance for role]. **Learning Path**: [Easy/Moderate/Challenging given their [specific related experience]]. **Bridging Skills**: [What they know that helps]. **Business Impact**: [Immediate vs future productivity impact]."
            }},
            "summary": "Technical Assessment: [Current capability level and readiness]. Growth Trajectory: [Learning potential and speed]. Hiring Recommendation: [Strong fit/Good potential/Risky hire/Not recommended] because [specific reasoning]. Key Strengths: [What they excel at]. Development Areas: [Priority skills to develop]."
        }}
        
        IMPORTANT: The "summary" field must be a single string, not a JSON object. Combine all assessment parts into one continuous text string.
        """
        
        try:
            response = await asyncio.wait_for(
                asyncio.to_thread(
                    self.model.generate_content,
                    prompt,
                    generation_config=genai.types.GenerationConfig(
                        temperature=0.2,
                        max_output_tokens=2500,
                    )
                ),
                timeout=15.0  # 15 second timeout for detailed analysis
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
            
            # Handle summary formatting - convert structured response to string if needed
            summary = analysis.get("summary")
            if isinstance(summary, dict):
                # Convert structured summary to formatted string
                summary_parts = []
                for key, value in summary.items():
                    if value:  # Only include non-empty values
                        summary_parts.append(f"**{key}**: {value}")
                summary = " | ".join(summary_parts)
            elif not isinstance(summary, str):
                summary = str(summary) if summary else None
            
            return {
                "enhanced_missing_skills": enhanced_skills,
                "summary": summary
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