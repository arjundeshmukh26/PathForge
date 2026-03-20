# Skill-Bridge Career Navigator - Design Documentation

## Table of Contents
- [System Overview](#system-overview)
- [Architecture Design](#architecture-design)
- [Technology Stack](#technology-stack)
- [Data Models](#data-models)
- [API Design](#api-design)
- [Frontend Architecture](#frontend-architecture)
- [AI Integration Strategy](#ai-integration-strategy)
- [Security & Reliability](#security--reliability)
- [Future Enhancements](#future-enhancements)

---

## System Overview

### Vision
Skill-Bridge Career Navigator is an AI-powered platform that analyzes professional resumes, identifies skill gaps for target roles, and provides personalized learning roadmaps with progress tracking capabilities.

### Core Value Proposition
- **Hybrid Intelligence:** AI-enhanced analysis with deterministic fallbacks ensuring 100% reliability
- **Weighted Skill Assessment:** Sophisticated compatibility scoring based on skill importance rather than simple keyword matching  
- **Actionable Learning Paths:** Curated resources with quiz-based skill verification
- **Career Transition Guidance:** AI-powered role suggestions based on skill transferability

### Key Use Cases
1. **Career Gap Analysis:** "I want to become a Senior Backend Engineer - what skills am I missing?"
2. **Learning Progress Tracking:** "Mark skills as learned through verified quizzes and see score improvements"
3. **Career Exploration:** "What other roles match my current skill set?"
4. **Resume Optimization:** "How can I better position my skills for my target role?"

---

## Architecture Design

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                          │
│                     (React Frontend)                           │
├─────────────────────────────────────────────────────────────────┤
│                     API GATEWAY LAYER                          │
│                    (FastAPI Backend)                           │
├─────────────────────────────────────────────────────────────────┤
│                    BUSINESS LOGIC LAYER                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │   Skill     │  │   Analyze   │  │    Quiz     │           │
│  │  Service    │  │   Service   │  │   Service   │           │
│  └─────────────┘  └─────────────┘  └─────────────┘           │
├─────────────────────────────────────────────────────────────────┤
│                      AI SERVICES LAYER                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │   Direct    │  │   Gemini    │  │  Fallback   │           │
│  │  Gemini     │  │  Service    │  │  Logic      │           │
│  │  Client     │  └─────────────┘  └─────────────┘           │
│  └─────────────┘                                              │
├─────────────────────────────────────────────────────────────────┤
│                        DATA LAYER                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │ roles.json  │  │synonyms.json│  │questions.json│          │
│  │   (380      │  │   (457      │  │  (Quiz DB)  │           │
│  │   lines)    │  │   entries)  │  │             │           │
│  └─────────────┘  └─────────────┘  └─────────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

### Design Principles

#### 1. **AI-Assisted, Not AI-Dependent**
- **Deterministic Core:** Every feature works without AI
- **AI Enhancement:** AI adds insights and context but never blocks functionality
- **Graceful Degradation:** System provides full value even when AI services are unavailable

#### 2. **Hybrid Intelligence Architecture**
- **Dual Processing:** AI and deterministic algorithms run in parallel
- **Result Fusion:** Best-of-both-worlds approach combining AI insights with reliable logic
- **Fallback Cascades:** Multiple AI providers with deterministic safety nets

#### 3. **Data-Driven Reliability**
- **Curated Datasets:** 8 roles with 15-20 skills each, weighted by importance (1-5)
- **Comprehensive Synonyms:** 457 skill variations mapped to canonical names
- **Application-Based Assessment:** Scenario-based quizzes rather than theoretical knowledge

---

## Technology Stack

### Backend Stack

#### **Core Framework**
- **FastAPI** (Python 3.9+)
  - *Why:* Type safety, automatic API documentation, excellent async support
  - *Benefits:* Fast development, built-in validation, modern async patterns

#### **AI Integration**
- **Google Gemini 3.1 Flash Lite Preview**
  - *Why:* Latest generation language model with excellent cost-performance ratio and enhanced reasoning
  - *Implementation:* Dual client approach (direct HTTP + SDK) for maximum reliability

#### **Data Management**
- **JSON Files** (roles.json, synonyms.json, questions.json)
  - *Why:* Simple deployment, version control friendly, fast read access
  - *Tradeoff:* Not suitable for high-concurrency writes (acceptable for MVP)

#### **Dependencies**
```python
fastapi==0.104.1          # Web framework
pydantic==2.5.0           # Data validation
uvicorn==0.24.0           # ASGI server
aiohttp==3.9.1            # Async HTTP client
python-dotenv==1.0.0      # Environment management
PyPDF2==3.0.1             # PDF processing
pdfplumber==0.9.0         # Advanced PDF text extraction
pytest==7.4.3            # Testing framework
```

### Frontend Stack

#### **Core Framework**
- **React 18** with Functional Components
  - *Why:* Modern, component-based, excellent ecosystem
  - *Benefits:* Reusable components, efficient re-rendering, active community

#### **Styling & UI**
- **Tailwind CSS 3**
  - *Why:* Utility-first approach, consistent design system, fast development
  - *Benefits:* Small bundle size, excellent responsive design capabilities

#### **State Management**
- **React useState/useEffect** + **localStorage**
  - *Why:* Simple state needs don't require complex solutions like Redux
  - *Implementation:* Client-side persistence with server-side session sync

#### **Dependencies**
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "tailwindcss": "^3.3.0",
  "autoprefixer": "^10.4.14",
  "postcss": "^8.4.24"
}
```

### Infrastructure & Deployment

#### **Development Environment**
- **Local Development:** uvicorn + npm dev servers
- **Environment Management:** .env files for configuration
- **CORS Configuration:** Multi-origin support for flexible development

#### **Production Considerations**
- **API Deployment:** Docker containers with gunicorn/uvicorn workers
- **Frontend Deployment:** Static site hosting (Netlify/Vercel)
- **Database Migration:** JSON → PostgreSQL for scalability

---

## Data Models

### Core Entities

#### **Role Definition**
```typescript
interface Role {
  category: "frontend" | "backend" | "fullstack" | "devops" | "data" | "mobile" | "security" | "qa";
  [level: "entry" | "junior" | "senior"]: {
    [skillName: string]: {
      weight: 1 | 2 | 3 | 4 | 5;  // Importance level
      resources: ResourceLink[];
    }
  }
}
```

#### **Skill Assessment**
```typescript
interface SkillAnalysis {
  user_skills: string[];
  matched_skills: SkillItem[];
  missing_skills: SkillItem[];
  compatibility_score: number;  // 0-100%
  ai_summary?: string;
}
```

#### **Quiz System**
```typescript
interface QuizQuestion {
  id: number;
  difficulty: "easy" | "hard";
  question: string;  // Scenario-based
  options: string[4];  // Exactly 4 options
  correct: 0 | 1 | 2 | 3;  // Correct option index
  explanation: string;
}
```

### Data Relationships

```
Roles (8) → Skills (721 unique) → Questions (5 per skill)
     ↓           ↓                      ↓
Categories → Synonyms (457) → Scoring Algorithm
     ↓           ↓                      ↓
User Selection → Normalization → Compatibility Assessment
```

---

## API Design

### RESTful Endpoints

#### **Analysis Endpoints**
```
POST /api/v1/analyze
├─ Input: { resume, role, level }
├─ Process: Skill extraction + Gap analysis + AI enhancement
└─ Output: Complete compatibility assessment

POST /api/v1/update-skills
├─ Input: { session_id, learned_skills[] }
├─ Process: Recalculate compatibility score
└─ Output: Updated assessment

POST /api/v1/suggest-roles
├─ Input: { user_skills, current_role, resume_text }
├─ Process: AI-powered role matching + fallback scoring
└─ Output: Alternative career suggestions
```

#### **Data Endpoints**
```
GET /api/v1/roles
└─ Output: Available roles with categories

GET /api/v1/quiz/{skill}
├─ Process: Load/generate questions + randomize
└─ Output: 5 scenario-based questions (answers removed)

POST /api/v1/quiz/submit
├─ Input: { skill, answers[]{question_id, selected_option} }
├─ Process: Grade by question ID matching
└─ Output: Score, pass/fail, explanations
```

#### **Utility Endpoints**
```
POST /api/v1/extract-pdf-text
├─ Input: PDF file upload
├─ Process: Text extraction via PyPDF2/pdfplumber
└─ Output: Extracted text + metadata

GET /api/v1/session/{session_id}
POST /api/v1/session/{session_id}
DELETE /api/v1/session/{session_id}
```

### Error Handling Strategy

#### **HTTP Status Codes**
- **200 OK:** Successful operation
- **400 Bad Request:** Invalid input (Pydantic validation failure)
- **404 Not Found:** Resource not found (role, session, etc.)
- **422 Unprocessable Entity:** Business logic validation failure
- **500 Internal Server Error:** System failure with graceful degradation

#### **Error Response Format**
```json
{
  "detail": "Human-readable error message",
  "error_code": "SKILL_NOT_FOUND",
  "suggestions": ["Available alternatives..."]
}
```

---

## Frontend Architecture

### Component Hierarchy

```
App.js (Root State Management)
├─ InteractiveResumeForm.js (Resume Input + Role Selection)
│  ├─ PDFUpload.js (File Upload + Text Extraction)
│  └─ Role/Level Selection UI
├─ InteractiveScoreCard.js (Results Display + Progress Tracking)
│  ├─ SkillQuizModal.js (Quiz Interface)
│  └─ Progress Visualization
├─ SuggestedRoles.js (AI-Powered Career Suggestions)
│  └─ ResumeSelector.js (Multi-Resume Management)
├─ PastAnalyses.js (Analysis History)
└─ Loading States
   ├─ FullScreenLoader.js (Global Analysis Loading)
   └─ AIProcessingIndicator.js (AI-Specific Loading)
```

### State Management Strategy

#### **Local State (useState)**
- Form inputs and UI interactions
- Loading states and error messages
- Modal visibility and temporary data

#### **Global State (Context + localStorage)**
- Current analysis results
- User progress tracking
- Analysis history
- Resume library

#### **Server State Synchronization**
```javascript
// Hybrid client-server state management
const handleSkillUpdate = async (skill) => {
  // 1. Optimistic UI update
  updateLocalState(skill);
  
  // 2. Server synchronization
  try {
    await updateServerSession(skill);
  } catch (error) {
    // 3. Fallback to client-only calculation
    fallbackToLocalCalculation(skill);
  }
};
```

### Responsive Design System

#### **Tailwind CSS Utility Classes**
- **Mobile-first approach:** Base styles for mobile, scale up
- **Breakpoint strategy:** sm (640px), md (768px), lg (1024px), xl (1280px)
- **Component modularity:** Reusable utility combinations

#### **Accessibility Features**
- Semantic HTML structure
- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- Color contrast compliance

---

## AI Integration Strategy

### Multi-Provider Architecture

#### **Primary AI Service: Google Gemini 3.1 Flash Lite Preview**
```javascript
// Intelligent provider selection with fallbacks
const getAIResponse = async (prompt) => {
  // Provider 1: Direct HTTP client (bypasses SSL issues)
  if (directGeminiClient.isAvailable()) {
    return await directGeminiClient.generateContent(prompt);
  }
  
  // Provider 2: Official SDK client
  if (geminiService.isAvailable()) {
    return await geminiService.generateContent(prompt);
  }
  
  // Provider 3: Deterministic fallback
  return deterministicFallback(prompt);
};
```

### Prompt Engineering Strategy

#### **Skill Extraction Prompts**
- **Context-aware parsing:** Resume structure understanding
- **Domain expertise:** Technical skill recognition
- **Synonym handling:** Variation normalization
- **Quality filtering:** Relevance scoring

#### **Gap Analysis Enhancement**
- **Strategic insights:** "Why this skill matters for your career"
- **Market context:** Industry demand and growth trends
- **Learning prioritization:** Skill importance ranking
- **Transition guidance:** Career progression advice

### AI Safety & Quality Assurance

#### **Output Validation**
```python
def validate_ai_response(response):
    # Structure validation
    if not is_valid_json(response):
        return fallback_response()
    
    # Content validation
    if contains_inappropriate_content(response):
        return sanitized_response()
    
    # Business logic validation
    if not matches_expected_format(response):
        return reformatted_response()
    
    return response
```

#### **Fallback Triggers**
- API rate limiting or quota exceeded
- Network connectivity issues
- Invalid or malformed AI responses
- Response time exceeding timeout thresholds

---

## Security & Reliability

### Security Measures

#### **API Security**
- **Input Validation:** Pydantic models with strict type checking
- **SQL Injection Prevention:** No direct database queries (JSON file storage)
- **XSS Protection:** Sanitized output rendering
- **CORS Configuration:** Restricted origin allowlist

#### **Data Privacy**
- **No Persistent Storage:** User data not permanently stored
- **Session-based Processing:** In-memory analysis sessions
- **API Key Security:** Environment variable management
- **No PII Collection:** Only professional skill data processed

### Reliability Engineering

#### **Error Recovery Patterns**
```python
# Circuit breaker pattern for AI services
class AICircuitBreaker:
    def __init__(self, failure_threshold=5, timeout=60):
        self.failure_count = 0
        self.last_failure_time = None
        self.state = "CLOSED"  # CLOSED, OPEN, HALF_OPEN
    
    async def call_ai_service(self, request):
        if self.state == "OPEN":
            if time.time() - self.last_failure_time > self.timeout:
                self.state = "HALF_OPEN"
            else:
                return fallback_response()
        
        try:
            result = await ai_service.process(request)
            self.reset()
            return result
        except Exception:
            self.record_failure()
            return fallback_response()
```

#### **Performance Optimization**
- **Lazy Loading:** Components and data loaded on demand
- **Caching Strategy:** Skill databases cached in memory
- **Request Batching:** Multiple API calls combined where possible
- **Debounced User Input:** Reduced API calls during typing

---

## Future Enhancements

### **Database Integration**
- **Migration:** JSON files → PostgreSQL for better scalability
- **Benefits:** Concurrent access, ACID transactions, better query capabilities
- **Implementation:** SQLAlchemy ORM with async support

### **Enhanced Authentication**
- **User Accounts:** Profile creation and management
- **Progress Tracking:** Long-term skill development history
- **Social Features:** Skill sharing and peer comparison

### **Advanced AI Features**
- **Multi-Model Integration:** OpenAI GPT + Anthropic Claude fallbacks
- **Contextual Understanding:** Resume parsing with work experience analysis
- **Personalized Recommendations:** Learning style and pace adaptation

### **Expanded Content Database**
- **Role Expansion:** 50+ roles across industries (healthcare, finance, education)
- **Skill Granularity:** Sub-skills and competency levels
- **Dynamic Content:** Industry trend integration and skill demand forecasting

### **Advanced Analytics**
- **Learning Path Optimization:** AI-powered curriculum sequencing
- **Market Intelligence:** Salary insights and demand forecasting
- **Career Simulation:** "What-if" scenarios for career decisions

### **Advanced Learning Integration**
- **Certification Tracking:** Professional certification progress
- **Mentorship Platform:** AI-matched industry mentors

### **AI-Powered Features**
- **Resume Optimization:** AI-powered resume writing assistance
- **Interview Preparation:** Role-specific interview question generation
- **Salary Negotiation:** Market-based compensation guidance

### **Marketplace Features**
- **Learning Providers:** Integration with training companies
- **Recruiter Tools:** Skill-based candidate matching
- **Corporate Partnerships:** Enterprise learning solutions

### **Advanced Intelligence**
- **Predictive Analytics:** Future skill demand forecasting
- **Personalized AI Assistant:** Career coaching chatbot
- **Industry Insights:** Real-time job market analysis

---

## Conclusion

The Skill-Bridge Career Navigator represents a thoughtful balance between cutting-edge AI capabilities and reliable, deterministic functionality. The hybrid architecture ensures that users always receive value regardless of external service availability, while the modular design provides a solid foundation for future enhancements.

The careful selection of technologies, emphasis on user experience, and commitment to reliability create a platform that can evolve from an MVP to an enterprise-grade career development ecosystem. The enhancement opportunities demonstrate clear progression from foundational improvements to platform-scale innovations, positioning the system for sustainable growth and market leadership in AI-powered career guidance.

