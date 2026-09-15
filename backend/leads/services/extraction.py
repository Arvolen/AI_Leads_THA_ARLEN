import json
import os
import time
from google import genai
from google.genai import types

VALID_CHANNELS = ['Website', 'Event', 'LinkedIn', 'Organic Search', 'Referral', 'Manual/Sales', 'Other']

def extract_source_from_text(notes: str) -> dict:
    if not notes:
        return {"channel": "Other", "detail": "No notes provided"}

    notes_lower = notes.lower()

    if any(k in notes_lower for k in ['google search', 'searched online', 'organic search']):
        return {"channel": "Organic Search", "detail": notes[:100]}
    if any(k in notes_lower for k in ['linkedin', 'inmail']):
        return {"channel": "LinkedIn", "detail": notes[:100]}
    if any(k in notes_lower for k in ['booth', 'conference', 'sff', 'saastr']):
        return {"channel": "Event", "detail": notes[:100]}

    # If there is no obvious sign go to LLM
    api_key = os.getenv("GEMINI_API_KEY")
    client = genai.Client(api_key=api_key)
    
    prompt = f"""
    Extract the marketing/sales channel from this note: "{notes}"
    Channel MUST be one of: {VALID_CHANNELS}.
    Return JSON format only: {{"channel": "<Channel>", "detail": "<Short explanation>"}}
    """

    for attempt in range(3):
        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.0,
                    automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
                ),
            )
            return json.loads(response.text)
        except Exception as e:
            if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                time.sleep(2 * (attempt + 1))
                continue
            break

    return {"channel": "Other", "detail": notes[:100]}