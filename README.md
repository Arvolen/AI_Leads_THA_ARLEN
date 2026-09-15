## Lead Management App with AI Extraction

This is my submission for the lead management take-home assignment. It's a full-stack web application built using Django REST Framework for the backend and React (Vite) for the frontend. It helps track leads, automatically extracts lead sources from unstructured notes using rules + AI, and lets you merge duplicate leads.

## How to Run the Project  

1. Backend Setup (Django)

Open your terminal, go to the backend folder, and set up a virtual environment:

    cd backend
    python -m venv venv

    venv\Scripts\activate

    pip install -r requirements.txt
    
Create a .env file in the backend root folder (you can base it on .env.example):

    GEMINI_API_KEY=your_gemini_api_key_here

Run database migrations and seed the leads data:

    python manage.py migrate
    python manage.py seed_leads
    
Start the Django server:

    python manage.py runserver

2. Frontend Setup (React / Vite)
Open a new terminal tab and go to the frontend folder:

    cd frontend
    npm install
    npm run dev

## Design Decisions

1. AI Source Extraction (leads/services/extraction.py)
A lot of leads in the CSV had vague sources, but the actual details were hidden in text notes (like "Met at SFF booth" or "Found on LinkedIn").

To extract the channel (Event, LinkedIn, Organic Search, etc.):

- Fast Keyword Matching First: I wrote simple keyword checks first. If a note mentions words like "booth", "conference", or "LinkedIn", it categorizes it instantly without calling the AI.

- Gemini LLM Fallback: If no keywords match, it calls Google Gemini (gemini-2.5-flash) to parse the note and return JSON.

 - Why do this? Running 2,000 requests through an AI API takes a long time and hits rate limits fast. Checking keywords first saves API quota and makes seeding much faster!

2. Seeding 2,000+ Records Fast (seed_leads.py)

Processing 2,000 leads one by one through the API was very slow. So I used Python's ThreadPoolExecutor (with 4 workers) to process rows in parallel while avoiding 429 rate limit errors from Gemini. Then I used Lead.objects.bulk_create() to save leads in batches instead of hitting the database 2,000 individual times.

3. Smart Deduplication & Lead Merging (leads/services/deduplication.py)

Instead of just checking for exact email matches, I built a fuzzy matching system using rapidfuzz to catch similar leads across 2,000+ records.

- Making it fast (Blocking stage): Comparing 2,000 leads against every single lead means doing over 2 million comparisons ($O(N^2)$), which takes way too long. To fix this, I grouped leads into "buckets" by phone number and corporate email domains (skipping generic domains like @gmail.com or @yahoo.com). Only leads in the same bucket get compared.
  
- Weighted match score: Leads get a match score based on three fields: Name (40%), Email (40%), and Company (20%).Last name penalty: If two leads share a company and first name but have different last names (like John Smith and John Doe), the score gets capped at 0.40 so different people at the same company don't get merged by accident.
  
- Phone bonus: Having the exact same phone number adds a +0.30 boost to the match score.
  
- Safe merging logic (merge_leads):
  - Backfills missing info: Copies over missing details (phone, company, AI source) from the secondary lead to the main lead before deleting the duplicate.
  - Saves note history: Appends old notes to the main lead with a label (--- Merged Notes (From Lead #X) ---) so no text gets wiped out.
  - Safety checks: Wrapped everything in a database transaction (@transaction.atomic) and added a check to stop you from merging a lead into itself.

## LLM API & Costs

- Provider / Model: Google Gemini 2.5 Flash (gemini-2.5-flash).

- Token Usage & Cost: Used roughly 3,000 tokens in total across seeding and testing runs. Total cost was $0 using the Google AI Studio Free Tier.

- Why: It's free, super fast, and easily outputs structured JSON without complex setup.

## Testing

I added tests in Django to verify edge cases alongside standard behavior:

- Fast Rule Matching: Ensures common keywords skip the LLM to save tokens and execution time.

- AI Fallback: Checks that tricky or ambiguous notes still get sent to Gemini and parse correctly.

- Lead Merge Logic: Verifies empty fields backfill properly and note histories get combined instead of deleted.

- Self-Merge Guard: Confirms that attempting to merge a lead into itself returns an error instead of corrupting data.

## To run the test suite

    python manage.py test

## What I'd Do Next (With More Time)

- Background Tasks: Use Celery or Django Q to process CSV imports in the background so the user doesn't have to wait for the request to complete.

- Smarter Duplicate Matching: Expand beyond exact email/phone matches by adding fuzzy matching on company/lead names (e.g., matching "Acme Inc." to "Acme Corp").

- Manual AI Overrides in UI: Add a simple frontend dropdown so sales reps can manually adjust the AI-assigned source channel if it gets something wrong.
  
