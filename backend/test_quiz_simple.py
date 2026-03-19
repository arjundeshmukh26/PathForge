#!/usr/bin/env python3
"""
Simple test script to verify quiz routes work in isolation.
"""
import sys
import os
sys.path.insert(0, os.getcwd())

from fastapi import FastAPI
from routes.quiz_routes import router as quiz_router

# Create a minimal FastAPI app with just quiz routes
app = FastAPI()
app.include_router(quiz_router, prefix="/api/v1")

@app.get("/")
def root():
    return {"message": "Quiz test server running"}

if __name__ == "__main__":
    import uvicorn
    print("Starting minimal quiz test server...")
    uvicorn.run(app, host="127.0.0.1", port=8001)