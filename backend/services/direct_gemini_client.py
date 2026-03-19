"""
Direct Gemini API Client - Direct HTTP client for Gemini API
Uses standard HTTP requests with proper SSL verification
"""

import os
import json
import asyncio
import logging
from typing import List, Dict, Any, Optional
import aiohttp

logger = logging.getLogger(__name__)

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta"

class DirectGeminiClient:
    """Direct HTTP client for Gemini API with standard SSL verification"""
    
    def __init__(self):
        self.api_key = GEMINI_API_KEY
        self.base_url = GEMINI_API_BASE_URL
        
        logger.info("DirectGeminiClient initialized with standard SSL verification")
    
    def is_available(self) -> bool:
        """Check if API key is available"""
        available = self.api_key and self.api_key != "your_gemini_api_key_here"
        if available:
            logger.info("Direct Gemini client is available")
        else:
            logger.warning("Direct Gemini client not available - no valid API key")
        return available
    
    async def generate_content(self, prompt: str, model: str = "gemini-3.1-flash-lite-preview", timeout: int = 10) -> str:
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
                "temperature": 0.2,
                "maxOutputTokens": 2000,
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
            timeout=timeout_config
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
            logger.info("Calling direct Gemini API for skill extraction...")
            response_text = await self.generate_content(prompt, timeout=15)
            
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
        You are a senior technical hiring manager with 10+ years of experience evaluating candidates for {level} {role} positions. You're having a direct, honest conversation with a candidate about their fit for this role.

        **YOUR PROFILE ANALYSIS:**
        Analyze this resume deeply to understand your technical background, experience depth, and potential for growth. Speak directly to the candidate using "you" and "your".

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
        For each missing skill, provide (using second person - "you"):
        1. **Why it matters**: Role-specific importance and daily usage for you
        2. **Learning assessment**: Difficulty given your background (Easy/Moderate/Challenging)
        3. **Bridging skills**: What you already know that helps
        4. **Business impact**: How this gap affects your immediate productivity vs long-term growth

        **OVERALL ASSESSMENT CRITERIA:**
        - **Technical Readiness**: Can you contribute meaningfully from day 1?
        - **Growth Potential**: How quickly will you close critical gaps?
        - **Cultural Fit**: Do your experiences align with team needs?
        - **Risk Assessment**: What are the hiring risks vs your potential upside?

        **OUTPUT FORMAT - RETURN VALID JSON:**
        {{
            "skill_explanations": {{
                "Skill Name": "**Why Critical**: [Specific importance for role]. **Learning Path**: [Easy/Moderate/Challenging given your [specific related experience]]. **Bridging Skills**: [What you already know that helps]. **Business Impact**: [How this gap affects your immediate productivity vs long-term growth]."
            }},
            "summary": "Your resume shows [current capability level and readiness for this role]. Your growth trajectory looks [learning potential and speed]. You're a [Strong fit/Good potential/Risky hire/Not recommended] for this role because [specific reasoning based on your background]. Your key strengths include [what you excel at that's relevant]. To improve your candidacy, you should focus on developing [priority skills to develop with specific recommendations]."
        }}
        
        IMPORTANT: The "summary" field must be a single string, not a JSON object. Use second person throughout - address the candidate directly as "you" and "your".
        """
        
        try:
            logger.info("Calling direct Gemini API for gap analysis...")
            response_text = await self.generate_content(prompt, timeout=20)
            
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
            
            logger.info("Direct Gemini gap analysis completed successfully")
            return {
                "enhanced_missing_skills": enhanced_skills,
                "summary": summary
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