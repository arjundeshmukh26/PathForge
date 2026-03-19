# 🔧 Setting Up Gemini AI Integration

The system is currently running on **fallback mode only** (no AI calls). To enable AI-powered features, follow these steps:

## 1. Get a Free Gemini API Key

1. Visit: https://ai.google.dev/
2. Click "Get API Key"
3. Sign in with your Google account
4. Create a new API key
5. Copy the key (starts with `AIza...`)

## 2. Configure Your Environment

**Option A: Edit .env file**
```bash
# Edit the .env file in the backend directory
GEMINI_API_KEY=AIzaSyC-your-actual-api-key-here
```

**Option B: Set environment variable**
```bash
# Windows PowerShell
$env:GEMINI_API_KEY="AIzaSyC-your-actual-api-key-here"

# Windows CMD
set GEMINI_API_KEY=AIzaSyC-your-actual-api-key-here

# Linux/Mac
export GEMINI_API_KEY="AIzaSyC-your-actual-api-key-here"
```

## 3. Restart the Backend Server

After adding the API key:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
uvicorn main:app --reload
```

## 4. Verify AI Integration

You should now see logs like:
```
INFO: Gemini API key found: AIzaSyC-12...
INFO: Starting AI skill extraction...
INFO: Calling Gemini API for skill extraction...
INFO: AI extracted 8 skills: ['Python', 'React', 'Docker', ...]
```

## 5. Test the System

1. Visit: http://localhost:3001
2. Paste a resume (try the example buttons)
3. Select a role and analyze
4. Check the backend logs for AI activity

## Current Status

**Without API Key:**
- ✅ Deterministic skill extraction (regex + keyword matching)
- ✅ Weighted gap analysis and scoring
- ✅ Learning resources and progress tracking
- ❌ AI-powered skill extraction
- ❌ Contextual insights for missing skills

**With API Key:**
- ✅ Everything above PLUS:
- ✅ AI-powered skill extraction with context understanding
- ✅ Enhanced analysis with "why this matters" explanations
- ✅ More accurate skill recognition from natural language

## Troubleshooting

**No logs showing AI calls?**
- Check if `GEMINI_API_KEY` is set: `echo $env:GEMINI_API_KEY`
- Ensure the key starts with `AIza`
- Restart the backend server after setting the key

**API calls failing?**
- Verify your API key is correct
- Check your internet connection
- Ensure you have API quota remaining

**Still using fallback?**
- The system gracefully falls back if AI fails
- Check logs for error messages
- Verify the API key has proper permissions