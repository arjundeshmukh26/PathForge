#!/usr/bin/env python3
"""
List available Gemini models to find the correct model name
"""

import os
import asyncio
import aiohttp
import json

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

async def list_gemini_models():
    """List all available Gemini models"""
    
    if not GEMINI_API_KEY or GEMINI_API_KEY == "your_gemini_api_key_here":
        print("❌ No valid API key found")
        return
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models"
    headers = {"x-goog-api-key": GEMINI_API_KEY}
    
    try:
        async with aiohttp.ClientSession(
            connector=aiohttp.TCPConnector(ssl=False)
        ) as session:
            async with session.get(url, headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    models = data.get("models", [])
                    
                    print("Available Gemini Models:")
                    print("=" * 40)
                    
                    for model in models:
                        name = model.get("name", "Unknown")
                        display_name = model.get("displayName", "")
                        supported_methods = model.get("supportedGenerationMethods", [])
                        
                        if "generateContent" in supported_methods:
                            print(f"✅ {name}")
                            if display_name:
                                print(f"   Display Name: {display_name}")
                            print(f"   Methods: {supported_methods}")
                            print()
                        
                else:
                    error_text = await response.text()
                    print(f"❌ API Error {response.status}: {error_text}")
                    
    except Exception as e:
        print(f"❌ Failed to list models: {e}")

if __name__ == "__main__":
    asyncio.run(list_gemini_models())