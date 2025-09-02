import os
import json
import openai

def analyze_resume_with_ai(job_description, resume_text):
    """
    Analyzes a single resume against a job description using the OpenAI API.
    Uses the older, more stable OpenAI API format.
    """
    try:
        # Set the API key
        openai.api_key = os.environ.get("OPENAI_API_KEY")
        
        prompt = f"""
You are an expert talent acquisition specialist. Analyze this resume against the job description and return a JSON object.

**Output Schema - Return ONLY valid JSON:**
{{
  "candidate_name": "Full name from resume, or 'Name Not Found'",
  "fit_score": 85,
  "bucket": "⚡ Book-the-Call",
  "reasoning": "Strong match with relevant experience",
  "summary_points": ["Point 1", "Point 2", "Point 3"],
  "skill_matrix": {{
    "matches": ["Skill 1", "Skill 2"],
    "gaps": ["Missing skill 1"]
  }},
  "timeline": [
    {{
      "period": "2022-Now",
      "role": "Senior Engineer, Company",
      "details": "Led development of key features"
    }}
  ],
  "logistics": {{
    "compensation": "Not specified",
    "notice_period": "Not specified",
    "work_authorization": "Not specified",
    "location": "Not specified"
  }}
}}

Job Description:
{job_description}

Resume:
{resume_text}
"""

        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that provides analysis in JSON format."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=1500
        )
        
        return response.choices[0].message.content
        
    except Exception as e:
        print(f"AI analysis error: {e}")
        # Return a safe fallback JSON
        error_response = {
            "candidate_name": "Analysis Failed",
            "fit_score": 50,
            "bucket": "🛠️ Bench Prospect",
            "reasoning": "Could not complete AI analysis",
            "summary_points": ["Analysis failed due to technical error"],
            "skill_matrix": {"matches": [], "gaps": []},
            "timeline": [],
            "logistics": {
                "compensation": "Not specified",
                "notice_period": "Not specified", 
                "work_authorization": "Not specified",
                "location": "Not specified"
            }
        }
        return json.dumps(error_response)

def extract_job_title_with_ai(job_description):
    """Extract job title from description"""
    try:
        openai.api_key = os.environ.get("OPENAI_API_KEY")
        
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "Extract only the job title from the description."},
                {"role": "user", "content": f"Job Description: {job_description}\n\nJob Title:"}
            ],
            temperature=0,
            max_tokens=50
        )
        
        return response.choices[0].message.content.strip()
        
    except Exception as e:
        print(f"Job title extraction error: {e}")
        return "Job Title Not Found" 