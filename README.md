# PathForge: Skill-Bridge Career Navigator

**Candidate Name:** Arjun Deshmukh

**Scenario Chosen:** AI-Powered Career Skill Analysis Platform

**Estimated Time Spent:** 5.5-6 hours

## Quick Start

### Prerequisites:
- Python 3.9+ with pip
- Node.js 16+ with npm
- Google Gemini API key (optional - has fallback)

### Run Commands:
```bash
# Backend
cd backend
pip install -r requirements.txt
cp .env.example .env  # Add your GEMINI_API_KEY if available
uvicorn main:app --reload --port 8000

# Frontend (new terminal)
cd frontend
npm install
npm start
```

### Test Commands:
```bash
# Backend tests
cd backend
python -m pytest tests/ -v

# Frontend tests
cd frontend  
npm test
```

## AI Disclosure

**Did you use an AI assistant (Copilot, ChatGPT, etc.)?** Yes, I used cursor.

**How did you verify the suggestions?**
- Manual testing of all critical functionality
- Unit tests for core business logic (skill scoring, quiz validation)
- Integration tests for API endpoints
- Browser testing for UI components
- Code review and debugging of AI-generated solutions

**Give one example of a suggestion you rejected or changed:**
AI initially suggested using a simple count-based scoring system for skill compatibility. I rejected this in favor of a weighted scoring system where skills have different importance levels (1-5), providing more accurate career assessments. This required manual implementation of the scoring algorithm and extensive testing.

## Tradeoffs & Prioritization

**What did you cut to stay within the 4–6 hour limit?**
- Advanced user authentication and persistence (used localStorage instead)
- Comprehensive role database (limited to 8 key tech roles)
- Advanced AI prompt engineering (kept prompts effective but not overly complex)
- Detailed UI animations and micro-interactions
- Advanced error recovery and retry mechanisms

**What would you build next if you had more time?**
- User authentication with profile persistence
- Expanded role database (50+ roles across industries)
- Learning progress tracking with time estimates
- Interactive skill roadmaps with prerequisites
- Integration with job boards and salary data
- Advanced analytics and career progression insights
- Mobile-responsive design improvements

**Known limitations:**
- In-memory session storage (resets on server restart)
- Limited to 8 predefined job roles
- AI enhancement requires API key (graceful fallback exists)
- No user accounts or data persistence across browser sessions
- Skill extraction optimized for tech roles only

---

## Project Architecture & Technical Implementation

### Requirements & Scope Identification

**Core Requirements Targeted:**
- **Skill Gap Analysis:** Parse resumes, identify missing skills for target roles
- **Career Guidance:** Provide weighted skill recommendations with learning resources
- **Progress Tracking:** Allow users to mark skills as learned and see score improvements
- **AI Enhancement:** Use AI for intelligent skill extraction and gap analysis
- **Fallback Reliability:** System must work even when AI is unavailable

**Scope Decisions:**
- **MVP Focus:** Prioritized core functionality over advanced features
- **Tech-Centric:** Limited to 8 high-demand technology roles for depth over breadth
- **Hybrid Approach:** AI-enhanced with deterministic fallbacks for reliability
- **Session-Based:** Simplified user management using browser localStorage + server sessions

### Technical Architecture & Design Philosophy

**"AI-Assisted, Not AI-Dependent" Architecture:**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │     Backend      │    │   AI Services  │
│   (React)       │    │    (FastAPI)     │    │   (Gemini)      │
├─────────────────┤    ├──────────────────┤    ├─────────────────┤
│ • Resume Input  │────│ • Skill Service  │────│ • Skill Extract │
│ • Role Selection│    │ • Analyze Routes │    │ • Gap Analysis  │
│ • Progress UI   │    │ • Quiz System    │    │ • Role Suggest  │
│ • Local Storage │    │ • Deterministic  │    │                 │
│                 │    │   Scoring Logic  │    │   (Optional)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                       ┌──────────────────┐
                       │   Data Layer     │
                       ├──────────────────┤
                       │ • roles.json     │
                       │ • synonyms.json  │
                       │ • questions.json │
                       └──────────────────┘
```

**Core Design Principles:**
1. **Hybrid Intelligence:** AI enhances but never blocks functionality
2. **Deterministic Core:** Weighted scoring algorithm always produces consistent results
3. **Graceful Degradation:** System provides full value even without AI
4. **Data-Driven:** Comprehensive skill databases power fallback systems

### AI Integration & Logic Flow

**Multi-Layer AI Strategy:**

**1. Skill Extraction (Hybrid Approach):**
The system employs a two-layer extraction strategy. First, it attempts AI-powered skill extraction using either the DirectGeminiClient or the standard GeminiService, with graceful failure handling. Simultaneously, it runs deterministic skill extraction that matches against a database of 721 known skills using pattern recognition and keyword matching. Both results are merged and deduplicated to provide comprehensive skill identification regardless of AI availability.

**2. Gap Analysis Enhancement:**
The system first calculates a deterministic compatibility score using weighted skill matching, where each skill has an importance weight from 1-5. This ensures a consistent, reproducible score regardless of external dependencies. When AI is available, it enhances this analysis by adding contextual explanations for why specific skills matter in the target role and provides strategic insights about skill gaps and career progression paths.

**3. Role Suggestion Algorithm:**
The system provides career transition suggestions through a dual approach. The deterministic method calculates skill overlap percentages between the user's profile and all available roles, ranking them by compatibility score. When AI is available, it performs sophisticated analysis considering market trends, career progression logic, and transition feasibility to provide more nuanced role recommendations with detailed explanations and transition strategies.

### Comprehensive Fallback Logic

**Level 1: Skill Extraction Fallback**
The fallback skill extraction employs four complementary strategies: direct skill matching against a curated database of 721 known technical skills using fuzzy text matching; pattern-based extraction that identifies skill sections in resumes using regex patterns like "Skills: JavaScript, React, Node.js"; programming language detection through targeted regex patterns for common languages; and comprehensive synonym normalization that maps skill variations to canonical names (e.g., "nodejs" becomes "Node.js").

**Level 2: Scoring Fallback (Always Deterministic)**
The compatibility scoring system uses a weighted algorithm that never depends on external services. It calculates the total weight of all required skills for a role, then determines how many of those skills the user possesses, summing up the weights of matched skills. The final score is the percentage of matched weight versus total weight, bounded between 0% and 100%, ensuring consistent and reproducible results regardless of system state.

**Level 3: Quiz Validation System**
The skill verification system uses application-based quizzes to validate learning progress. For each skill, it loads five scenario-based questions (two easy, three hard) from the questions database, or generates default questions if skill-specific ones aren't available. Users must score at least 60% (3 out of 5 questions correct) to mark a skill as learned, ensuring meaningful skill acquisition rather than simple checkbox completion.

### Data Flow & State Management

**Complete User Journey:**

1. **Input Phase:**
   - User provides resume (text or PDF upload)
   - Selects target role and experience level

2. **Analysis Phase:**
   ```
   Resume Text → Hybrid Skill Extraction → Normalization → 
   Role Matching → Weighted Scoring → AI Enhancement → Results
   ```

3. **Enhancement Phase:**
   - AI adds strategic insights and "why it matters" explanations
   - Deterministic core ensures base functionality always works

4. **Learning Phase:**
   - User attempts skill quizzes to mark skills as learned
   - Real-time score recalculation with client-side and server-side sync

5. **Exploration Phase:**
   - AI suggests alternative career paths based on skill overlap
   - Fallback provides deterministic suggestions if AI unavailable

### Reliability & Error Handling

**Multi-Tier Fallback Strategy:**
1. **AI Services:** DirectGeminiClient → GeminiService → Deterministic fallback
2. **Data Sources:** Live data → Cached data → Default values  
3. **Skill Extraction:** AI → Pattern matching → Keyword matching → Default skills
4. **Scoring:** Always deterministic, never dependent on external services
5. **Quiz System:** Skill-specific questions → Generic questions → Manual validation

**Session Management:**
- **Server-side:** In-memory session storage for real-time analysis
- **Client-side:** localStorage for persistence across browser sessions
- **Sync Strategy:** Client falls back gracefully when server sessions expire

This architecture ensures the system delivers value to users regardless of AI availability, network conditions, or data quality, while providing enhanced insights when all systems are operational.
