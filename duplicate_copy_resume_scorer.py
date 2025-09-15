import json
import os
import openai
from typing import Dict, Any, List
import time
import hashlib

# OpenAI API Configuration
# OpenAI API Configuration - using environment variable
# OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")

# Prompt Template 1 - Section Weights
SECTION_WEIGHT_TEMPLATE = """You are an expert at evaluating job descriptions. Your task is to assign importance weights to resume sections solely based on the job description. Do not consider any resume content when assigning these weights.

Purpose:
These weights will later be used to evaluate and score resumes, but your current task is to analyze the job description only.

Resume Sections:

Education
Experience
Projects
Leadership
Skills
Research
Certifications
Awards
Publications

Instructions for Weight Assignment Logic:

CONTEXT-AWARE SCORING CRITERIA:
⚠️ CRITICAL: Be extremely strict about basic vs. specific statements. Basic/generic phrases should NOT receive high scores.

SCORING RUBRIC FOR ALL SECTIONS: 

Education – Scoring Rubric
Score	Meaning
0	Not Required or Not Mentioned: The job description does not mention any educational requirement (degree level or field). – It may focus solely on skills, certifications, or experience. – Phrases like "degree not necessary", "self-taught welcome", or complete absence of education keywords are strong indicators.
1	Preferred or Generally Expected: The job description includes some general or implicit mention of education, but without specifying a required degree level or field. – Examples include: "bachelor's degree preferred", "education in a relevant field is a plus", or "bachelor's or master's degree preferred". – Use this if there is a mention of "Bachelor's or equivalent experience", or "undergraduate degree in a related field".
2	Specific Degree Level and Field Required: The job description explicitly requires a particular degree level and/or field of study. – Examples include: "MS in Computer Science required", "Bachelor's in Data Science or related field required", "PhD in a quantitative discipline preferred", or "Master's in Statistics or Mathematics". – Strong indicators: "required", "must have", "minimum qualification" or "candidates without a [degree] will not be considered". Education is non-negotiable.

Experience – Scoring Rubric
Score	Meaning
0	No Emphasis on Prior Work Experience: The job description – Does not mention prior work experience as a requirement or expectation. – May focus solely on skills, certifications, education, or projects. – Uses phrasing like: "no experience required", "entry-level", "fresh graduates welcome", "training will be provided", "we'll teach you", "on-the-job training available", or "background not necessary". – Also score 0 if the only experience mentioned is in non-professional contexts (e.g., volunteering, coursework) and not expected from applicants.
1	Some Experience Preferred or Lightly Mentioned: The job description mentions experience, but – Does not specify exact years or demands. – Lists experience as "preferred", "a plus", or includes examples like: "prior experience in similar roles is helpful", "some experience preferred", "familiarity with X is beneficial", or "should have worked in similar environments". – Applies when experience is not framed as mandatory, or the required depth/scope is unclear. – Indicators like "preferred experience in...", "Bonus if candidate has some experience in..." without quantification.
2	Strong Emphasis on X+ Years or Industry-Specific Experience: The job description places clear, strong emphasis on past professional experience. – Explicit mentions of X+ years required (e.g., "3+ years of experience in data analysis", "minimum 5 years in product management"). – Use when terms like "required experience in...", "must have led...", "must demonstrate history of...", "proven ability to...", "track record of..." or "minimum of X years in similar roles" are present. – Applies when the description ties specific skills to experience, such as: "2+ years working with AWS in production", "must have experience deploying ML models at scale", etc. – Also applicable for senior roles (e.g., "Senior Data Analyst") that list clear, cumulative experience expectations. – If lack of experience would disqualify a candidate, this is a 2.

Projects – Scoring Rubric (ENHANCED WITH CONTEXT-AWARE CRITERIA)
Score	Meaning
0	Projects Not Required or Irrelevant: The job description – Does not mention projects in any form (portfolio, hands-on experience, self-initiated work, GitHub, etc.). – Phrases may include: "industry experience required", "full-time experience only", "internship experience required".
1	Projects Helpful but Not Emphasized: The job description – Mentions projects, but only as a supplemental indicator of skills. – Common phrases include: "project experience is a plus", "should be able to demonstrate skills through coursework or side projects", "portfolio optional", "GitHub link preferred". Especially for early-career candidates but are not required.
2	Projects Explicitly Required or Core to Evaluation: Explicitly valued or required (e.g., "must demonstrate prior project portfolio") – Phrases include: "must include portfolio", "GitHub link required", "hands-on project experience required", "showcase past work", "submit 2–3 relevant projects", or "ability to demonstrate capabilities via real-world projects". If asked to submit a portfolio.

⚠️ PROJECTS CONTEXT RULES:
- "You will be working on real world projects" → Score 0 (company assigns projects, not candidate requirement)
- "You will work on projects" → Score 0 (company work, not prior experience)
- "Join our project teams" → Score 0 (company team assignment, not prior experience)
- "Contribute to ongoing projects" → Score 0 (company contribution, not prior experience)
- "Project experience is a plus" → Score 1 (moderate requirement)
- "Portfolio required" → Score 2 (specific requirement)
- "GitHub link required" → Score 2 (specific requirement)
- "Must demonstrate prior project work" → Score 2 (specific requirement)
- "Submit 2-3 relevant projects" → Score 2 (specific requirement)
- "Showcase past work" → Score 2 (specific requirement)
- "Hands-on project experience required" → Score 2 (specific requirement)

Leadership – Scoring Rubric (ENHANCED WITH CONTEXT-AWARE CRITERIA)
Score	Meaning
0	No Leadership Mentioned or Valued: The job description contains no reference to leadership, management, or ownership responsibilities. Roles are individual contributor-focused, emphasizing technical or operational duties.
1	Soft or Collaborative Leadership Mentioned: Mentions team collaboration, cross-functional work, or communication skills, but no expectation of direct leadership. Phrases include: "team player", "works well with others", "support cross-functional teams".
2	Explicit Leadership Required or Emphasized: Clearly expects people/team/project management experience or leadership capability. Phrases include: "lead a team", "manage direct reports", "ownership of outcomes", or "proven leadership track record".

⚠️ LEADERSHIP CONTEXT RULES (JOB LEVEL AWARE):
ENTRY LEVEL INTERPRETATION:
- "Train staff members" → Score 1 (shows initiative and teaching ability)
- "Collaborate with team" → Score 1 (teamwork is leadership for entry level)
- "Help team members" → Score 1 (supporting others is leadership)
- "Lead a team of X people" → Score 2 (specific leadership)
- "Manage direct reports" → Score 2 (specific management)

MID LEVEL INTERPRETATION:
- "Train staff members" → Score 0 (basic operational task)
- "Collaborate with team" → Score 1 (moderate leadership)
- "Coordinate cross-functional teams" → Score 1 (moderate leadership)
- "Lead a team of X people" → Score 2 (specific leadership)
- "Manage direct reports" → Score 2 (specific management)
- "Own project outcomes" → Score 2 (specific ownership)

SENIOR LEVEL INTERPRETATION:
- "Train staff members" → Score 0 (basic operational task, expected)
- "Collaborate with team" → Score 0 (basic requirement, not leadership)
- "Help team members" → Score 0 (basic collaboration, not leadership)
- "Lead a team of X people" → Score 2 (specific leadership)
- "Manage direct reports" → Score 2 (specific management)
- "Strategic leadership" → Score 2 (senior-level leadership)
- "Proven leadership track record" → Score 2 (senior-level requirement)

Skills – Scoring Rubric
Score	Meaning
0	No Skills Emphasis: The job description contains no mention of specific tools, technologies, programming languages, platforms, frameworks, or domain-specific technical abilities. This happens rarely.
1	Mentioned, But Not Central: The job mentions some tools or technologies, but they are briefly listed, optional, or categorized as "nice to have", "a plus." or any other. There is no indication that lacking them would disqualify a candidate, and they are not tied directly to responsibilities or outcomes.
2	Explicitly Required and Critical: The job description clearly lists specific technical skills, tools, or platforms as required (e.g., "must have experience with Python, SQL, and Tableau", "preferred skills") and often ties them directly to daily responsibilities or minimum qualifications. These skills are framed as essential for performance or eligibility.

Research – Scoring Rubric (ENHANCED WITH CONTEXT-AWARE CRITERIA)

- **Score 0 (No Research Expected)**:  
  When a job description includes only passive learning or general awareness phrases, it reflects that the role does not require active research engagement. 
  Examples such as "Learn and research the latest trends," "Stay updated with trends," "Follow industry developments," "Keep up with trends," or even "Research trends".  
  These statements indicate a surface-level, monitoring-based involvement and should be scored as 0.
  
- **Score 1 (Moderate / Informal Research)**:  
  The job includes methodological thinking or hands-on research-like tasks, but not formal academic or institutional research.
  Phrases like "Formulate hypotheses," "Design experiments," and "Conduct research". 
  These imply structured analytical tasks, but do not necessarily indicate published work, team collaboration, or advanced research credentials.
  
- **Score 2 (Explicit, Formal Research Expected)**:  
  The job clearly expects formal research engagement, qualifications, or published output, such as:  
  "Research experience required," "PhD with research background," "Work with research teams," or "Contribute to academic or scientific publications."
  These phrases imply deep, structured research responsibilities, often tied to collaboration, publishing, or advanced education.

⚠️ PATTERN MATCHING RULES:
EXPLICIT PATTERNS THAT ALWAYS SCORE 0:
- "Learn and research the latest trends" → Score 0 (passive learning, not research)
- "Stay updated with trends" → Score 0 (general awareness, not research)
- "Follow industry developments" → Score 0 (monitoring, not research)
- "Keep up with trends" → Score 0 (awareness, not research)
- "Research trends" → Score 0 (monitoring, not research)

EXPLICIT PATTERNS THAT ALWAYS SCORE 1:
- "Formulate hypotheses" → Score 1 (formal research methodology)
- "Design experiments" → Score 1 (formal research methodology)
- "Conduct research" → Score 1 (formal research activity)

EXPLICIT PATTERNS THAT ALWAYS SCORE 2:
- "Research experience required" → Score 2 (formal research requirement)
- "PhD with research background" → Score 2 (formal research qualification)
- "Work with research teams" → Score 2 (formal research collaboration)
- "Contribute to academic or scientific publications" → Score 2 (formal research output)

PATTERN MATCHING PRIORITY:
1. First, check for EXPLICIT PATTERNS above
2. If no explicit patterns match, then apply general scoring logic
3. If the description is ambiguous or unclear, default to the **lower score**
4. When in doubt, score 0 (be conservative)

Certifications – Scoring Rubric
Score	Meaning
0	No Mention or Need: Not required.
1	Helpful but Optional: Optional or considered a bonus (e.g., "AWS certification is a plus").
2	Central or Required: Mandatory for consideration (e.g., "must be PMP-certified", "Google Cloud Professional Certification required").

Awards – Scoring Rubric
Score	Meaning
0	Not Mentioned or Valued: The job description does not reference awards, accomplishments, recognitions, or individual distinctions. There is no indication that such credentials influence hiring or are valued.
1	Mentioned as Differentiator: Achievements or recognitions are mentioned as a differentiator (e.g., "demonstrated excellence," "proven track record," "recognition preferred") but not required for eligibility.
2	Emphasized or Required: The job description explicitly calls for significant accomplishments (e.g., "must have led award-winning initiatives," "recognized industry leader," "demonstrated record of top-tier performance") and uses them as core evaluation criteria.

Publications – Scoring Rubric
Score	Meaning
0	Not Relevant: The job description does not mention publications, writing, or disseminating results. No indication that published work matters.
1	Optional or Nice to Have: Mentions publications or writing (e.g., "published work is a plus," "strong writing skills desired") but not as a core competency or requirement.
2	Mandatory or Strongly Preferred: Publications are explicitly required or heavily emphasized (e.g., "peer-reviewed papers required," "must demonstrate publication history") and tied to hiring qualifications.

⚠️ CONTEXT-AWARE SCORING PRINCIPLES:
1. BASIC STATEMENTS = Score 0: Generic phrases like "train staff", "learn trends", "help others", "you will work on projects" should NOT receive scores
2. MODERATE STATEMENTS = Score 1: Specific but not critical requirements
3. SPECIFIC REQUIREMENTS = Score 2: Clear, detailed, mandatory requirements
4. WEIGHT IMPACT: Remember that Score 1 = 13-15% weight, so be very conservative
5. COMPANY vs CANDIDATE: Distinguish between what the company will provide vs what the candidate must bring

Weight Normalization:

Convert all non-zero rubric scores into normalized percentage weights that sum to exactly 1.0.

Sections with a rubric score of 0 receive a weight of 0.

Sections with scores of 1 or 2 are scaled proportionally to reflect relative emphasis in the job description.

Sample example:

Example:

If the rubric scores are:

Education: 2
Experience: 2
Skills: 1
All other sections: 0

The total score sum = 2 + 2 + 1 = 5

The normalized weights would be:

Education: 2 / 5 = 0.40
Experience: 2 / 5 = 0.40
Skills: 1 / 5 = 0.20
All others: 0.00
In total they should sum upto 1. 

Key Constraint:
✅ You must base all scoring and weighting decisions solely on the content of the job description.
✅ Be extremely conservative with scores - when in doubt, score lower rather than higher.

Expected Output Format (EXAMPLE):  

{ 

  "reasoning": "<Detailed explanation of why each section was scored and weighted. use new lines for each section explanation>", 

  "rubric_scores": { 

    "education": <0–2>, 

    "experience": <0–2>, 

    "projects": <0–2>, 

    "leadership": <0–2>, 

    "research": <0–2>, 

    "skills": <0–2>, 

    "certifications": <0–2>, 

    "awards": <0–2>, 

    "publications": <0–2> 

  }, 

  "validation": "<Show rubric sum and normalization calculations>", 

  "weights": { 

    "education": <final weight between 0–1>, 

    "experience": <final weight between 0–1>, 

    "projects": <final weight between 0–1>, 

    "leadership": <final weight between 0–1>, 

    "research": <0–1>, 

    "skills": <final weight between 0–1>, 

    "certifications": <final weight between 0–1>, 

    "awards": <final weight between 0–1>, 

    "publications": <final weight between 0–1> 

  } 

}"""

# Prompt Template 2 - Subfield Scoring
SUBFIELD_SCORING_TEMPLATE = """ 

Instruction 

You are an expert at evaluating resumes for a job opening. Your goal is to score each resume section based on its alignment with the provided job description, using customized subfields per section. You must provide clear, concise feedback for each score. 

NOTE: Since you are acting as an automated system for screening candidates, be brutally honest and objective. If the resume fails to meet critical or niche job requirements, assign low scores accordingly. For example, if a job requires hardware engineering experience and the resume only contains software projects, the experience section should score at most a 0 or 1 if partial alignement. 

CRITICAL: Experience calculation is the most important factor. If a job requires X years of experience and the candidate has significantly less (especially 1+ years less), the experience_level_vs_role_expectation MUST be scored 0, regardless of other factors. Do not inflate experience scores based on skills or education. 

Evaluation Rules 

Evaluate All Sections.   

(NOTE:  consider leadership, research, location, work authorization and citizenship in the scoring if they are mentioned in the job description) 

Evaluate all listed sections, whether they are present in the parsed resume.  

If a section is present: score it using the defined subfields. 

CROSS-SECTION CONTENT ANALYSIS (CRITICAL):

This is very important: You MUST search for information across ALL sections of the resume, not just dedicated sections. Many candidates include valuable information in unexpected places.

LEADERSHIP SEARCH: Look for leadership experience in ALL sections:
- Experience descriptions: "led team", "managed", "supervised", "coordinated", "oversaw"
- Project roles: "team lead", "project lead", "coordinated cross-functional team"
- Skills: "Team Management", "Leadership", "Project Management"
- Education activities: "student leader", "club president", "committee chair"
- Any mention of people management, team coordination, or project ownership

RESEARCH SEARCH: Look for research work in ALL sections:
- Experience descriptions: "conducted research", "investigation", "analysis", "study"
- Projects: "research project", "experiment", "investigation", "data analysis"
- Education: "research thesis", "capstone project", "independent study"
- Skills: "Research Methods", "Statistical Analysis", "Data Analysis"
- Any mention of systematic investigation, experimentation, or scholarly inquiry

PUBLICATIONS SEARCH: Look for publications in ALL sections:
- Experience: "published paper", "journal article", "conference presentation"
- Projects: "research paper", "publication", "conference submission"
- Education: "thesis", "dissertation", "academic paper"
- Skills: "Technical Writing", "Academic Writing", "Publication"
- Any mention of written work, papers, articles, or presentations

AWARDS SEARCH: Look for awards/recognition in ALL sections:
- Experience: "awarded", "recognized", "honored", "achievement"
- Projects: "won competition", "received recognition", "award-winning"
- Education: "dean's list", "honors", "scholarship", "academic excellence"
- Skills: "Award-winning", "Recognition", "Achievement"
- Any mention of honors, recognition, or accomplishments

If you find relevant information in other sections, score accordingly and explain in comments where the information was found. Example: "Leadership experience found in experience section: 'Led team of 5 developers' and skills section: 'Team Management'" 

 

Keyword Match Threshold (Disqualification Check) 

Before scoring, compare the resume's content with a keyword set (skills, tools, technologies) extracted from the job description.  

Calculate the keyword match percentage: (number of matched keywords / total job keywords) * 100.  

If this match percentage is less than 10%, disqualify the resume or assign very low section scores (no section should exceed a score of 0).  

Include the keyword match percentage in your output and justify how it impacted your scoring. 

 

Scoring Range 

a. Each subfield score must be an integer between 0 and 2. 

b. Each section must include a brief comment explaining the score, referencing the job description or absence of relevant details. 

Scoring Instructions 


JOB LEVEL DEFINITIONS:
- Junior/Intern: 0-2 years, entry-level, learning-focused, basic technical skills
- Mid-level: 3-5 years, independent contributor, moderate complexity, some leadership
- Senior: 7+ years, leadership, strategic thinking, team management, high complexity

Section-specific Scoring Subfields 

Experience

1. relevancy (0–2): How closely aligned is the candidate's experience with the job responsibilities and domain? Score higher only if the candidate’s experience closely matches the job’s required skills, responsibilities, and domain. Tangential or loosely related experience should score lower.

2. recency (0–2): Are the most relevant experiences recent?

3. depth (0–2): What is the level of complexity, responsibility, and autonomy in the candidate's previous roles? Evaluate the complexity, responsibility level, and autonomy in the candidate’s past roles. Senior roles with ownership, leadership, or challenging projects merit higher scores.

4. impact (0–2): Are there clear, meaningful achievements, metrics, or business outcomes from their work? Score based on clear, measurable achievements such as performance metrics, business outcomes, or process improvements explicitly stated in the resume. Avoid giving credit for vague or unsubstantiated claims.


Education 

alignment (0–2): Degree relevance to the job. 

level (0–2): Educational level vs. job requirement (e.g., MS vs. PhD). 

institution_reputation (0–2): Score the reputation of the candidate's educational institution on a scale of 0 to 2. Assign **0** if the institution is generally unknown, unranked globally or nationally, or lacks recognized academic standing. Assign **1** for moderately reputed or regionally well-known universities, or those with decent rankings but not globally distinguished. Assign **2** for top-tier institutions with strong academic prestige, global or national rankings (e.g., Ivy League, Oxbridge, IITs, or top 100 in QS/Times). Use publicly known academic rankings or reputation indicators as reference points when available.
.
  

Projects 

relevance (0–2): Score higher only if the project clearly aligns with the core skills, tools, or domain areas emphasized in the job description. Surface-level overlap or unrelated tech stacks should score low. 

complexity (0–2): award points only for projects that demonstrate deep technical challenge or architecture. Projects that appear simple, basic, or templated should be scored 0 or 1 

outcome (0–2): Deliverables, results, or practical use. 

Leadership 

initiative (0–2): Score 2 if the candidate clearly initiated or drove a significant effort—such as launching a project, securing resources, or solving a complex organizational problem. Score 1 for some signs of ownership in smaller settings. Score 0 for vague contributions (e.g., “assisted” or “participated”) without any leadership behavior.

scope (0–2):  Score 2 for leadership over large teams (5+), cross-functional groups, or high-complexity projects. Score 1 for leading 2–4 people or moderately complex tasks. Score 0 for classroom roles, solo work, or efforts lacking leadership responsibility.

influence (0–2): Score 2 only when the candidate's leadership led to measurable, concrete impact—e.g., increased revenue, reduced costs, product launches, institutional improvements, or published work. Score 1 for minor, indirect, or anecdotal improvements. Score 0 if no outcome is specified or if leadership had no visible effect. Do not infer impact unless clearly stated.

Research 

domain_relevance (0–2): Does the research align with the job field? 

novelty (0–2): Originality or innovation in research. 

publication_impact (0–2): Consider publication quality and outcome. Top-tier conferences, high citations, patents, or real-world deployment merit 2. Mid-tier journals or limited impact work score 1. Unpublished or internal-only work typically scores 0 unless notable in scope. 

Important: Do not infer depth, originality, or impact without clear supporting language in the resume.


Skills 

alignment (0–2): Does the candidate possess the core required skills? Score higher if the key technical or domain-specific skills are directly mentioned and demonstrated.

coverage (0–2): Breadth across required and preferred skills. Award 2 only if they touch most or all relevant areas mentioned in the job listing.

proficiency (0–2): Depth of expertise demonstrated. Do not assign high proficiency scores for skills that are merely listed. Instead, prioritize resumes that show applied usage of skills in context (projects, achievements, tools, or roles). A strong skill score must reflect evidence of usage, not just mention. 


Certifications 

relevance (0–2): Are the certifications applicable to the role or industry? Score 2 if the certification is directly tied to the job's technical or functional requirements (e.g., "AWS Solutions Architect" for a cloud engineer). Score 1 if it is tangentially helpful or supports broader professional development. Score 0 if it's unrelated to the role or the topic is unclear or missing.

recognition (0–2): Are the certs from reputable, known organizations?  Score 2 if the certification is from a globally credible, industry-standard issuer (e.g., Microsoft, CISCO, PMI, Google, CFA Institute). Score 1 if it comes from a smaller but valid platform (e.g., Coursera/edX partner universities). Score 0 if the issuer is unverified, self-created, or completely missing.

recency (0–2): How recent and up-to-date are the certifications? Score 0 if no date is given or cannot be inferred. Score 1 if the certification is less than 2 years old. Score 2 if the certification is more than 2 years old.

Awards 

prestige (0–2): Is the award from a reputable institution or organization? Score 2 if from a globally recognized institution or organization, 1 if from a regionally respected institution or organization, 0 if from an unknown or obscure source.

relevance (0–2): Does the award relate to the role or demonstrate excellence in a relevant area? Score 2 if directly relevant to the job’s core functions, 1 if indirectly useful or adjacent, 0 if unrelated to the position or if the award topic or purpose is unclear or not mentioned.

selectivity (0–2): Was it competitive or merit-based? Score 2 if it was a highly competitive process, 1 if it was a moderately competitive process, 0 if it was not a competitive process or if the selection process is unclear or not mentioned.

Publications 

venue_quality (0–2): Score 2 for publications in top-tier, peer-reviewed venues (e.g., Nature, ICML, NeurIPS, IEEE Transactions). Mid-tier or workshop venues score 1. Non-peer-reviewed platforms, local proceedings, or unverified sources score 0.

topic_alignment (0–2): Is the publication related to the job or industry? 

impact (0–2): Assign 2 if the paper has high citation counts, is widely read, or has led to real-world adoption. Modest visibility or minor influence scores 1. Low/no measurable impact or internal-only documents score 0.

Scoring Rubric 

#### Scoring Rubric 
 
 | Score | Meaning                                                                                                                                                                                                                                                        |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **0** | **Not Applicable / Weak or Missing**: No content provided, or the subfield is irrelevant to the job. May also include content that is generic, vague, or demonstrates little to no measurable value.                                                           |
| **1** | **Moderately Relevant / Adequate**: Content is present and somewhat aligned with the job description. May lack depth or specificity but shows minimal to moderate relevance or contribution. Represents the middle tier .                                      |
| **2** | **Highly Relevant / Strong Fit**: Content is detailed, well-aligned with job responsibilities, and demonstrates significant impact or accomplishments. Indicates strong relevance and value for the role. Represents the upper tier .                          |


Output Format 

 
  "experience": { 
    "relevancy": 0-2, 
    "recency": 0-2, 
    "depth": 0-2, 
    "impact": 0-2, 
    "comment": "..." 
}, 
  "education": { 
    "alignment": 0-2, 
    "level": 0-2, 
    "institution_reputation": 0-2, 
    "comment": "..." 
  }, 
  "projects": { 
    "relevance": 0-2, 
    "complexity": 0-2, 
    "outcome": 0-2, 
    "comment": "..." 
  }, 
  "leadership": { 
    "initiative": 0-2, 
    "scope": 0-2, 
    "influence": 0-2, 
    "comment": "..." 
  }, 
  "research": { 
    "domain_relevance": 0-2, 
    "novelty": 0-2,     
    "publication_impact": 0-2, 
    "comment": "..." 
  }, 
  "skills": { 
    "alignment": 0-2, 
    "coverage": 0-2, 
    "proficiency": 0-2, 
    "comment": "..." 
  }, 
  "certifications": { 
    "relevance": 0-2, 
    "recognition": 0-2, 
    "recency": 0-2, 
    "comment": "..." 
  }, 
  "awards": { 
    "prestige": 0-2, 
    "relevance": 0-2, 
    "selectivity": 0-2, 
    "comment": "..." 
  }, 
  "publications": { 
    "venue_quality": 0-2, 
    "topic_alignment": 0-2, 
    "impact": 0-2, 
    "comment": "..." 
  }, 
  "overall_comment": "..." 
}
"""

# Prompt Template 3 - Final Score Computation (Mathematical Formula)
FINAL_SCORE_TEMPLATE = """ 

Instruction 

You are an automated resume evaluation assistant. 

Your goal is to compute the final resume score on a scale of 0 to 100, based on: 

Section-wise scores from an earlier evaluation (each section has one or more subfields, scored from 0 to 2). 

Pre-assigned weights for each section (all weights sum to 1.0). 

 

Final Scoring Rules 

For each section: 

Compute the average of all its subfield scores. 

Normalize the average by dividing it by 3 (since subfields are on a 0–2 scale). 

Multiply the normalized average by the section's weight. 

Sum the results of all sections. 

Multiply the final result by 100 to get a score between 0 and 100. 

If a section is missing or all subfields are 0, its average will be 0 and it contributes 0 to the final score. 

 

Output Format (EXAMPLE) 

{ 
  "section_scores": { 
    "experience": 1.75, 
    "skills": 2.0, 
    "education": 1.67, 
    "projects": 1.33, 
    "certifications": 1.0, 
    "leadership": 1.0, 
    "research": 0.0, 
    "awards": 0.0, 
    "publications": 0.0 
  }, 
  "section_weights": { 
    "experience": 0.4, 
    "skills": 0.25, 
    "education": 0.1, 
    "projects": 0.1, 
    "certifications": 0.05, 
    "leadership": 0.05, 
    "research": 0.03, 
    "awards": 0.01, 
    "publications": 0.01 
  }, 
  "final_weighted_score": 68.55, 
  "scoring_formula_used": "Final Score = sum(avg(section_score) / 3 * section_weight) * 100", 
  "explanation": "The final score was computed by taking the average score of each section, normalizing it to a 0–1 range, weighting it by importance, and scaling to 100." 
} 

"""

class ResumeScorer:
    def __init__(self, api_key: str = None):
        """Initialize the ResumeScorer with OpenAI API key."""
        self.api_key = api_key or os.environ.get("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OpenAI API key is required")
        self.client = openai.OpenAI(api_key=self.api_key)
        self.section_weights_cache = {}
        self.subfield_scores_cache = {}
        self.job_level_cache = {}
    
    def clear_cache(self):
        """Clear all cached results to force fresh evaluation."""
        self.section_weights_cache = {}
        self.subfield_scores_cache = {}
        self.job_level_cache = {}
        
    def _get_deterministic_seed(self, job_description: str) -> int:
        """Generate a deterministic seed based on job description hash."""
        hash_object = hashlib.md5(job_description.encode())
        return int(hash_object.hexdigest()[:8], 16)
    
    def _get_deterministic_seed_with_resume(self, job_description: str, resume_text: str) -> int:
        """Generate a deterministic seed based on job description and resume hash."""
        combined = job_description + resume_text
        hash_object = hashlib.md5(combined.encode())
        return int(hash_object.hexdigest()[:8], 16)
    
    def assign_section_weights(self, job_description: str) -> Dict[str, Any]:
        """
        Phase 1: Assign weights to resume sections based on job description.
        Uses Prompt Template 1 with job level context for true context-aware interpretation.
        """
        print("  🔍 Analyzing job description for section importance...")
        
        # Check cache first for deterministic behavior
        
        try:
            # Step 1: Determine job level first for context-aware interpretation
            print("  🎯 Determining job level for context-aware interpretation...")
            job_requirement = self._extract_job_experience_requirement(job_description)
            job_level = job_requirement.get("job_level", "entry")
            print(f"  📊 Job level detected: {job_level.upper()}")

            # Create comprehensive cache key including job level for deterministic behavior
            cache_key = hashlib.md5(f"v2_{job_description}_{job_level}".encode()).hexdigest()
            if cache_key in self.section_weights_cache:
                print("  ✅ Using cached section weights...")
                return self.section_weights_cache[cache_key]
            
            # Step 2: Create context-aware prompt with job level information
            print("  📝 Creating context-aware prompt...")
            context_aware_prompt = f"""
{SECTION_WEIGHT_TEMPLATE}

IMPORTANT CONTEXT FOR INTERPRETATION:
Job Level: {job_level.upper()}

CONTEXT-AWARE INTERPRETATION RULES:
- For ENTRY level: Basic collaboration and training may be considered leadership indicators
- For MID level: Team coordination and project ownership are leadership indicators  
- For SENIOR level: Only explicit management and strategic leadership count as leadership

PATTERN MATCHING PRIORITY:
1. First, check for EXPLICIT PATTERNS in the scoring rubrics
2. If explicit patterns match, use those scores regardless of job level
3. If no explicit patterns match, then apply context-aware interpretation
4. When in doubt, score 0 (be conservative)

Apply the scoring rubric with this job level context in mind.
"""
            
            print("  🤖 Calling LLM for section weight analysis...")
            
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are an expert resume evaluator. Provide only valid JSON output."},
                    {"role": "user", "content": f"{context_aware_prompt}\n\nJob Description:\n{job_description}"}
                ],
                temperature=0.0,  # Ensure deterministic output
                max_tokens=2000,
                seed=self._get_deterministic_seed(job_description)
            )
            
            print("  📝 Parsing LLM response...")
            
            # Parse JSON response
            content = response.choices[0].message.content.strip()
            # Extract JSON from the response (handle potential markdown formatting)
            if content.startswith("```json"):
                content = content[7:-3]
            elif content.startswith("```"):
                content = content[3:-3]
            
            response_data = json.loads(content)
            
            # Extract weights from the new format
            if "weights" in response_data:
                weights = response_data["weights"]
            else:
                # Fallback to old format for backward compatibility
                weights = response_data
            
            # Validate weights sum to 1
            total_weight = sum([
                weights.get("education", 0),
                weights.get("experience", 0),
                weights.get("projects", 0),
                weights.get("leadership", 0),
                weights.get("research", 0),
                weights.get("skills", 0),
                weights.get("certifications", 0),
                weights.get("awards", 0),
                weights.get("publications", 0)
            ])
            
            if abs(total_weight - 1.0) > 0.02:
                raise ValueError(f"Weights must sum to 1.0, got {total_weight}")
            
            # Step 3: Apply dynamic Experience:Education ratio adjustment
            print("  ⚖️  Applying experience:education ratio adjustment...")
            adjusted_weights = self._apply_experience_education_ratio(weights, job_level)
            
            # Cache the result
            self.section_weights_cache[cache_key] = adjusted_weights
            
            print("  ✅ Section weights assigned successfully!")
            
            return adjusted_weights
            
        except Exception as e:
            raise Exception(f"Error in section weight assignment: {str(e)}")
    
    def score_subfields(self, job_description: str, resume_text: str, section_weights: Dict[str, float]) -> Dict[str, Any]:
        """
        Phase 2: Score subfields within each resume section.
        Uses deterministic experience calculation and LLM for other sections.
        """
        print("  🔍 Starting subfield scoring...")
        
        try:
            # Prepare resume data for the prompt
            resume_text_str = resume_text  # for caching
            
            # Check cache first for deterministic behavior
            cache_key = hashlib.md5((job_description + resume_text_str).encode()).hexdigest()
            if cache_key in self.subfield_scores_cache:
                print("  ✅ Using cached subfield scores...")
                return self.subfield_scores_cache[cache_key]
            
            # Step 1: Calculate experience deterministically
            print("  ⏰ Calculating candidate experience deterministically...")
            candidate_experience = self._calculate_candidate_experience(resume_text)
            print(f"  📊 Experience calculated: {candidate_experience['total_years']:.2f} years ({candidate_experience['total_months']} months)")
            
            # Step 1.5: Extract cross-section content for enhanced analysis
            print("  🔗 Extracting cross-section content for enhanced analysis...")
            cross_section_content = self._extract_cross_section_content(resume_text)
            print(f"  📈 Cross-section analysis completed: {len(cross_section_content)} sections analyzed")
            
            # Step 2: Get other subfield scores from LLM with cross-section analysis
            print("  🤖 Calling LLM for subfield scoring...")
            cross_section_info = f"""
CROSS-SECTION CONTENT ANALYSIS RESULTS:
Leadership keywords found: {cross_section_content['leadership']['count']} ({', '.join(cross_section_content['leadership']['found_keywords'][:5])})
Research keywords found: {cross_section_content['research']['count']} ({', '.join(cross_section_content['research']['found_keywords'][:5])})
Publication keywords found: {cross_section_content['publications']['count']} ({', '.join(cross_section_content['publications']['found_keywords'][:5])})
Award keywords found: {cross_section_content['awards']['count']} ({', '.join(cross_section_content['awards']['found_keywords'][:5])})

Use this information to enhance your scoring. If keywords are found but sections appear weak, consider the cross-section evidence.
"""
            
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are an expert resume evaluator. Current Date: September 03, 2025. Provide only valid JSON output following the exact format specified."},
                    {"role": "user", "content": f"{SUBFIELD_SCORING_TEMPLATE}\n\nJob Description:\n{job_description}\n\nResume Text:\n{resume_text}\n\n{cross_section_info}"}
                ],
                temperature=0.0,  # Ensure deterministic output
                max_tokens=6000,  # Increased for longer comments
                seed=self._get_deterministic_seed_with_resume(job_description, resume_text_str)
            )
            
            print("  📝 Parsing LLM response...")
            
            # Parse JSON response
            content = response.choices[0].message.content.strip()
            # Extract JSON from the response (handle potential markdown formatting)
            if content.startswith("```json"):
                content = content[7:-3]
            elif content.startswith("```"):
                content = content[3:-3]
            
            subfield_scores = json.loads(content)
            
            # Step 3: Replace experience section with deterministic calculation
            print("  ⚡ Applying deterministic experience scoring...")
            job_requirement = self._extract_job_experience_requirement(job_description)
            experience_match = self._calculate_experience_match_score(
                candidate_experience["total_years"], 
                job_requirement["years_required"]
            )
            
            experience_score = experience_match["score"]
            experience_comment = f"Candidate: {candidate_experience['total_years']:.2f} years ({candidate_experience['total_months']} months). Job requires: {job_requirement['years_required']} years. {experience_match['reason']}. Details: {candidate_experience['calculation_details']}"
            
            # Apply cascading rules for experience subfields
            if experience_score == 0:
                # All experience subfields must be 0
                subfield_scores["experience"] = {
                    "candidate_years_of_experience_vs_role_expectation_match": 0,
                    "relevancy": 0,
                    "recency": 0,
                    "depth": 0,
                    "impact": 0,
                    "comment": experience_comment
                }
            elif experience_score == 1:
                # Use our deterministic score for the match, but allow other subfields to be scored independently
                subfield_scores["experience"]["candidate_years_of_experience_vs_role_expectation_match"] = 1
                subfield_scores["experience"]["comment"] = experience_comment
                # Other subfields (relevancy, recency, depth, impact) are scored independently by the LLM
            else:  # experience_score == 2
                # Other subfields can be scored independently, but use our deterministic score
                subfield_scores["experience"]["candidate_years_of_experience_vs_role_expectation_match"] = 2
                subfield_scores["experience"]["comment"] = experience_comment
            
            # Step 4: Enhance comments with cross-section analysis for weak/missing sections
            print("  🔗 Enhancing comments with cross-section analysis...")
            subfield_scores = self._enhance_comments_with_cross_section_analysis(
                subfield_scores, cross_section_content
            )
            
            # Validate that all required sections are present
            required_sections = ["experience", "education", "projects", "leadership", "research", 
                               "skills", "certifications", "awards", "publications"]
            
            for section in required_sections:
                if section not in subfield_scores:
                    # If section is missing, create it with zero scores
                    subfield_scores[section] = self._get_zero_scores_for_section(section)
            
            # Cache the result
            self.subfield_scores_cache[cache_key] = subfield_scores
            
            print("  ✅ Subfield scoring completed successfully!")
            
            return subfield_scores
            
        except Exception as e:
            raise Exception(f"Error in subfield scoring: {str(e)}")
    
    def _extract_cross_section_content(self, resume_text: str) -> Dict[str, Any]:
        """
        Extract cross-section content for leadership, research, publications, and awards.
        Searches all sections for relevant information that might be missed.
        """
        import re
        
        # Use the provided resume text directly
        text_lower = resume_text.lower()
        
        # Define keywords for each section
        leadership_keywords = [
            'led', 'managed', 'supervised', 'coordinated', 'oversaw', 'directed',
            'team lead', 'project lead', 'leadership', 'management', 'supervision',
            'coordinated team', 'managed team', 'led team', 'oversaw project',
            'team management', 'project management', 'people management',
            'student leader', 'club president', 'committee chair', 'president',
            'vice president', 'treasurer', 'secretary', 'chair', 'coordinator'
        ]
        
        research_keywords = [
            'research', 'investigation', 'study', 'analysis', 'experiment',
            'thesis', 'dissertation', 'capstone', 'independent study',
            'research project', 'data analysis', 'statistical analysis',
            'methodology', 'hypothesis', 'experiment', 'investigation',
            'scholarly', 'academic research', 'empirical study'
        ]
        
        publication_keywords = [
            'published', 'publication', 'paper', 'journal', 'conference',
            'article', 'thesis', 'dissertation', 'presentation', 'poster',
            'academic paper', 'research paper', 'technical paper',
            'conference paper', 'journal article', 'peer-reviewed',
            'citation', 'bibliography', 'references'
        ]
        
        award_keywords = [
            'award', 'recognition', 'honor', 'achievement', 'excellence',
            'dean\'s list', 'scholarship', 'fellowship', 'grant',
            'competition winner', 'award-winning', 'recognized',
            'honored', 'distinguished', 'outstanding', 'merit',
            'academic excellence', 'achievement award'
        ]
        
        # Search for keywords and collect evidence
        def search_keywords(keywords, section_name):
            found_keywords = []
            evidence = []
            
            for keyword in keywords:
                if keyword in text_lower:
                    found_keywords.append(keyword)
                    # Find context around the keyword
                    pattern = rf'.{{0,100}}{re.escape(keyword)}.{{0,100}}'
                    matches = re.findall(pattern, text_lower, re.IGNORECASE)
                    # Clean and truncate evidence to avoid overly long strings
                    for match in matches[:2]:  # Limit to 2 examples
                        clean_match = match.strip().replace('\n', ' ').replace('  ', ' ')
                        if len(clean_match) > 150:  # Truncate if too long
                            clean_match = clean_match[:147] + "..."
                        evidence.append(clean_match)
            
            return {
                'found_keywords': found_keywords,
                'evidence': evidence,
                'count': len(found_keywords)
            }
        
        # Search for each section type
        leadership_info = search_keywords(leadership_keywords, 'leadership')
        research_info = search_keywords(research_keywords, 'research')
        publication_info = search_keywords(publication_keywords, 'publications')
        award_info = search_keywords(award_keywords, 'awards')
        
        return {
            'leadership': leadership_info,
            'research': research_info,
            'publications': publication_info,
            'awards': award_info
        }

    def _enhance_comments_with_cross_section_analysis(self, subfield_scores: Dict[str, Any], cross_section_content: Dict[str, Any]) -> Dict[str, Any]:
        """
        Enhance section comments with cross-section analysis results.
        Shows where information was found across different sections.
        """
        # Define sections that benefit from cross-section analysis
        cross_section_sections = ['leadership', 'research', 'publications', 'awards']
        
        for section in cross_section_sections:
            if section in subfield_scores:
                section_data = cross_section_content.get(section, {})
                found_keywords = section_data.get('found_keywords', [])
                evidence = section_data.get('evidence', [])
                
                if found_keywords:
                    # Enhance comment with cross-section findings
                    original_comment = subfield_scores[section].get('comment', '')
                    
                    # Create enhanced comment
                    keyword_summary = ', '.join(found_keywords[:3])  # Show top 3 keywords
                    evidence_summary = '; '.join(evidence[:2]) if evidence else 'No specific evidence found'
                    
                    # Truncate evidence if too long
                    if len(evidence_summary) > 200:
                        evidence_summary = evidence_summary[:197] + "..."
                    
                    enhanced_comment = f"{original_comment}"
                    
                    # Add cross-section analysis as separate section
                    cross_section_analysis = f"CROSS-SECTION ANALYSIS: Found {len(found_keywords)} relevant keywords ({keyword_summary}). Evidence: {evidence_summary}"
                    
                    # Store both main comment and cross-section analysis
                    subfield_scores[section]["cross_section_analysis"] = cross_section_analysis
                    
                    subfield_scores[section]['comment'] = enhanced_comment
                    
                    # If section was scored 0 but keywords were found, consider boosting
                    section_scores = [v for k, v in subfield_scores[section].items() 
                                    if k != 'comment' and isinstance(v, (int, float))]
                    
                    if section_scores and all(score == 0 for score in section_scores) and len(found_keywords) > 2:
                        # Add note about potential missed information
                        subfield_scores[section]['comment'] += " NOTE: Cross-section analysis suggests relevant information may be present in other sections."
        
        return subfield_scores
    
    def _get_zero_scores_for_section(self, section: str) -> Dict[str, Any]:
        """Helper method to create zero scores for missing sections."""
        section_configs = {
            "experience": {"candidate_years_of_experience_vs_role_expectation_match": 0, "relevancy": 0, "recency": 0, "depth": 0, "impact": 0, "comment": "Section not present in resume"},
            "education": {"alignment": 0, "level": 0, "institution_reputation": 0, "comment": "Section not present in resume"},
            "projects": {"relevance": 0, "complexity": 0, "outcome": 0, "comment": "Section not present in resume"},
            "leadership": {"initiative": 0, "scope": 0, "influence": 0, "comment": "Section not present in resume"},
            "research": {"domain_relevance": 0, "novelty": 0, "publication_impact": 0, "comment": "Section not present in resume"},
            "skills": {"alignment": 0, "coverage": 0, "proficiency": 0, "comment": "Section not present in resume"},
            "certifications": {"relevance": 0, "recognition": 0, "recency": 0, "comment": "Section not present in resume"},
            "awards": {"prestige": 0, "relevance": 0, "selectivity": 0, "comment": "Section not present in resume"},
            "publications": {"venue_quality": 0, "topic_alignment": 0, "impact": 0, "comment": "Section not present in resume"}
        }
        
        return section_configs.get(section, {"comment": "Section not present in resume"})
    

    
    def _apply_experience_education_ratio(self, base_weights: Dict[str, float], job_level: str) -> Dict[str, float]:
        """
        Apply dynamic Experience:Education ratio based on job level.
        
        Logic: Only adjust the ratio between Experience and Education within their total weight.
        All other sections remain unchanged (proportional to their original weights).
        
        Ratios:
        - Entry: 1:1 (equal weight within exp+edu total)
        - Mid: 2:1 (experience twice as important within exp+edu total)  
        - Senior: 3:1 (experience three times as important within exp+edu total)
        """
        # Define ratios based on job level
        ratios = {
            "entry": 1.0,    # 1:1 ratio
            "mid": 2.0,      # 2:1 ratio  
            "senior": 3.0,   # 3:1 ratio
        }
        
        ratio = ratios.get(job_level, 1.0)
        
        # Create new weights dictionary
        adjusted_weights = base_weights.copy()
        
        # Step 1: Calculate total weight of experience and education
        exp_weight = base_weights.get('experience', 0)
        edu_weight = base_weights.get('education', 0)
        total_exp_edu_weight = exp_weight + edu_weight
            
        # Step 2: Apply ratio only to experience and education
        if total_exp_edu_weight > 0:
            # Calculate new weights maintaining the ratio within the total
                new_exp_weight = (ratio / (ratio + 1)) * total_exp_edu_weight
                new_edu_weight = (1 / (ratio + 1)) * total_exp_edu_weight
                
                adjusted_weights['experience'] = round(new_exp_weight, 3)
                adjusted_weights['education'] = round(new_edu_weight, 3)
                
        # Step 3: All other sections remain unchanged
        # (No changes needed - they keep their original weights)
                
        return adjusted_weights
        
    
    
    def _calculate_candidate_experience(self, resume_text: str) -> Dict[str, Any]:
        """
        Calculate total years of professional experience from resume using LLM.
        """
        try:
            # Create a focused prompt for experience calculation
            experience_prompt = f"""
            You are an expert at calculating total years of experience from resume text.
            
            IMPORTANT: Use the current date as September 2025 for all calculations.
            
            Calculate TOTAL YEARS of PROFESSIONAL WORK EXPERIENCE from the resume text.
            
            CRITICAL MATHEMATICAL ACCURACY REQUIREMENTS:
            - Be mathematically precise. Double-check all calculations.
            - Use a calculator for division: 35/12 = 2.9167, NOT 2.17
            - Verify your math: if total_months = 35, then total_years = 35/12 = 2.9167 years
            - Common mistake: 35/12 ≠ 2.17 (this is WRONG)
            
            INSTRUCTIONS:
            - Parse the resume text to identify all work experience entries
            - Look for job titles, company names, and date ranges (e.g., "January 2024-August 2024", "2020-2021", "Present")
            - For each experience entry, extract the start and end dates
            - IMPORTANT: If a date is in the future (like "January 2025-Present"), assume end date is current month/year
            - Add up the durations in **months**, then convert total to **years** using exact calculation
            - Consider overlapping experience as separate experiences
            - DO NOT round down unless dates are truly unclear or ambiguous. Use exact calculations for clear dates
            - Calculate exact months and years: Total years = total_months / 12
            
            EXPERIENCE CALCULATION EXAMPLE (FOR REFERENCE ONLY):
                - EXAMPLE Resume shows: "November 2020-may 2021" (7 months) + "march 2020-December 2020" (10 months) + "January 2025-June 2025" (6 months)
                - EXAMPLE Total: 7 + 10 + 6 = 23 months = 23/12 = 1.9167 years
                - EXAMPLE Total years of experience: 1.9167 years
                
                ⚠️  IMPORTANT: This is just an EXAMPLE to show the calculation method.
                ⚠️  Do NOT use these example values (7, 10, 6, 23, 1.9167) in your actual calculation.
                ⚠️  You must calculate based on the ACTUAL resume text provided below.
                ⚠️  The example values (23 months, 1.9167 years) are NOT real data - they are just for demonstration.
            
            Resume Text:
            {resume_text}
            
            Return ONLY a JSON object with:
            {{
                "total_months": <exact number of months>,
                "total_years": <exact years calculated as total_months/12>,
                "calculation_details": "<detailed explanation ending with: Total: X months = X/12 = Y years>"
            }}
            """
            
            
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": experience_prompt}],
                temperature=0,
                seed=self._get_deterministic_seed_with_resume("", resume_text),
                max_tokens=1000
            )
            
            content = response.choices[0].message.content.strip()
            
            
            # Extract JSON from the response (handle potential markdown formatting)
            if content.startswith("```json"):
                content = content[7:-3]
                
            elif content.startswith("```"):
                content = content[3:-3]
                
            
            
            result = json.loads(content)
            
            # Mathematical validation and recalculation
            if "calculation_details" in result:
                import re
                details = result["calculation_details"]
                
                # Extract the sum calculation: "Total: 25 + 2 + 2 + 6 = 35 months"
                sum_match = re.search(r"Total: ([\d\s\+\=]+) = (\d+) months", details)
                if sum_match:
                    # Get the sum expression: "25 + 2 + 2 + 6"
                    sum_expression = sum_match.group(1).replace(" ", "").replace("=", "")
                    
                    # Calculate the actual sum
                    numbers = [int(x) for x in sum_expression.split("+")]
                    actual_total_months = sum(numbers)
                    
                    # Calculate correct years
                    actual_total_years = actual_total_months / 12
                    
                    # Override with correct values
                    result["total_months"] = actual_total_months
                    result["total_years"] = actual_total_years
                    
                    print(f"  🔧 Math validation: {actual_total_years:.2f} years ({actual_total_months} months)")
            return result
            # Cache the result for deterministic behavior
            self.job_level_cache[cache_key] = result

            
        except Exception as e:
            
            
            # Fallback: Manual calculation based on the resume data
            try:
                total_months = 0
                calculation_details = []
                
                if "experience" in resume_text:
                    for exp in resume_text["experience"]:
                        duration = exp.get("duration", "")
                        title = exp.get("title", "")
                        
                        
                        
                        # Count all experience (including internships/co-ops as they are relevant experience)
                        # Only skip if explicitly stated as part-time or unpaid
                        
                        # Parse duration dynamically - handle various formats
                        import re
                        from datetime import datetime
                        
                        # Multiple patterns to handle various duration formats
                        patterns = [
                            # "January 2024 - June 2024" or "Jan 2024-Jun 2024"
                            r'(\w+)\s+(\d{4})\s*[-–]\s*(\w+)\s+(\d{4})',
                            # "January 2024 - June" (same year)
                            r'(\w+)\s+(\d{4})\s*[-–]\s*(\w+)',
                            # "Jan 2024 - Present" or "Jan 2024 - Current"
                            r'(\w+)\s+(\d{4})\s*[-–]\s*(present|current|now)',
                            # "2024 - 2025" (year range)
                            r'(\d{4})\s*[-–]\s*(\d{4})',
                            # "Jan 2024 to Jun 2024" or "Jan 2024 to Present"
                            r'(\w+)\s+(\d{4})\s+to\s+(\w+)\s*(\d{4})?',
                            # "2024.01 - 2024.06" (YYYY.MM format)
                            r'(\d{4})\.(\d{2})\s*[-–]\s*(\d{4})\.(\d{2})',
                            # "01/2024 - 06/2024" (MM/YYYY format)
                            r'(\d{1,2})/(\d{4})\s*[-–]\s*(\d{1,2})/(\d{4})',
                        ]
                        
                        months_calculated = False
                        
                        for pattern in patterns:
                            match = re.search(pattern, duration, re.IGNORECASE)
                            if match:
                                
                                
                                groups = match.groups()
                                
                                try:
                                    # Convert month names to numbers
                                    month_map = {
                                        'january': 1, 'jan': 1, 'february': 2, 'feb': 2, 'march': 3, 'mar': 3,
                                        'april': 4, 'apr': 4, 'may': 5, 'june': 6, 'jun': 6, 'july': 7, 'jul': 7,
                                        'august': 8, 'aug': 8, 'september': 9, 'sep': 9, 'october': 10, 'oct': 10,
                                        'november': 11, 'nov': 11, 'december': 12, 'dec': 12
                                    }
                                    
                                    # Handle different pattern types
                                    if len(groups) == 4 and groups[0].isalpha() and groups[2].isalpha():
                                        # "January 2024 - June 2024"
                                        start_month, start_year, end_month, end_year = groups
                                        start_month_num = month_map.get(start_month.lower(), 1)
                                        end_month_num = month_map.get(end_month.lower(), 1)
                                        start_date = datetime(int(start_year), start_month_num, 1)
                                        end_date = datetime(int(end_year), end_month_num, 1)
                                        
                                    elif len(groups) == 3 and groups[0].isalpha():
                                        # "January 2024 - June" or "Jan 2024 - Present"
                                        start_month, start_year, end_part = groups
                                        start_month_num = month_map.get(start_month.lower(), 1)
                                        start_date = datetime(int(start_year), start_month_num, 1)
                                        
                                        if end_part.lower() in ['present', 'current', 'now']:
                                            # Use current date for "Present"
                                            end_date = datetime.now()
                                        else:
                                            # Same year
                                            end_month_num = month_map.get(end_part.lower(), 1)
                                            end_date = datetime(int(start_year), end_month_num, 1)
                                            
                                    elif len(groups) == 2 and groups[0].isdigit() and len(groups[0]) == 4:
                                        # "2024 - 2025" (year range)
                                        start_year, end_year = groups
                                        start_date = datetime(int(start_year), 1, 1)
                                        end_date = datetime(int(end_year), 12, 1)
                                        
                                    elif len(groups) == 4 and groups[0].isdigit() and len(groups[0]) == 4:
                                        # "2024.01 - 2024.06" (YYYY.MM format)
                                        start_year, start_month, end_year, end_month = groups
                                        start_date = datetime(int(start_year), int(start_month), 1)
                                        end_date = datetime(int(end_year), int(end_month), 1)
                                        
                                    elif len(groups) == 4 and len(groups[0]) <= 2:
                                        # "01/2024 - 06/2024" (MM/YYYY format)
                                        start_month, start_year, end_month, end_year = groups
                                        start_date = datetime(int(start_year), int(start_month), 1)
                                        end_date = datetime(int(end_year), int(end_month), 1)
                                    
                                    # Calculate months difference (inclusive)
                                    months_diff = (end_date.year - start_date.year) * 12 + (end_date.month - start_date.month) + 1
                                    
                                    
                                    
                                    # Ensure positive months and reasonable range
                                    if 0 < months_diff <= 120:  # Max 10 years per role
                                        total_months += months_diff
                                        calculation_details.append(f"Counted {title}: {duration} = {months_diff} months")
                                        months_calculated = True
                                        break
                                    else:
                                        calculation_details.append(f"Skipped {title}: {duration} (unreasonable duration: {months_diff} months)")
                                        months_calculated = True
                                        break
                                        
                                except (ValueError, TypeError) as e:
                                    calculation_details.append(f"Skipped {title}: {duration} (parsing error: {str(e)})")
                                    
                                    months_calculated = True
                                    break
                        
                        if not months_calculated:
                            calculation_details.append(f"Skipped {title}: {duration} (could not parse dates)")
                            
                
                total_years = total_months / 12.0
                details = "; ".join(calculation_details) if calculation_details else "No professional experience found"
                
                
                
                return {
                    "total_months": total_months,
                    "total_years": total_years,
                    "calculation_details": f"Fallback calculation: {details}. Total: {total_months} months = {total_years:.2f} years"
                }
                
            except Exception as fallback_error:
                
                return {
                    "total_months": 0,
                    "total_years": 0,
                    "calculation_details": f"Error in calculation: {str(e)}. Fallback also failed: {str(fallback_error)}"
                }
    
    def _parse_calculation_details(self, calculation_details: str) -> Dict[str, float]:
        """
        Parse calculation_details to extract actual calculated months and years.
        This fixes the inconsistency between LLM JSON response and calculation_details.
        """
        import re
        
        try:
            # Look for patterns like "Total: 21 months + 4 months + 19 months = 44 months"
            total_pattern = r'Total:\s*(\d+)\s*months\s*\+\s*(\d+)\s*months\s*\+\s*(\d+)\s*months\s*=\s*(\d+)\s*months'
            match = re.search(total_pattern, calculation_details)
            
            if match:
                # Extract the total months from the calculation
                total_months = int(match.group(4))
            else:
                # Try pattern like "Total: 21 + 4 + 19 = 44 months"
                simple_pattern = r'Total:\s*(\d+)\s*\+\s*(\d+)\s*\+\s*(\d+)\s*=\s*(\d+)\s*months'
                simple_match = re.search(simple_pattern, calculation_details)
                if simple_match:
                    total_months = int(simple_match.group(4))
                else:
                    # Fallback: Look for "Total: X months" pattern
                    fallback_total_pattern = r'Total:\s*(\d+)\s*months'
                    fallback_match = re.search(fallback_total_pattern, calculation_details)
                    if fallback_match:
                        total_months = int(fallback_match.group(1))
                    else:
                        # Try to find "Total years of experience: X years"
                        years_pattern = r'Total years of experience:\s*(\d+\.?\d*)\s*years'
                        years_match = re.search(years_pattern, calculation_details)
                        if years_match:
                            total_years = float(years_match.group(1))
                            total_months = int(total_years * 12)
                        else:
                            raise ValueError("Could not parse total months from calculation_details.")

            total_years = round(total_months / 12.0, 2)
            
            
            
            return {"total_months": total_months, "total_years": total_years}
            
        except Exception as e:
            
            # Fallback to LLM's provided total_months/years if parsing fails
            return {"total_months": 0, "total_years": 0} # This should ideally not happen if LLM provides valid details
    
    def _extract_job_experience_requirement(self, job_description: str) -> Dict[str, Any]:
        """
        Extract years of experience required and job level from job description using LLM.
        This is the preferred method as LLM analysis is more sophisticated than regex patterns.
        """
        try:
            # Check cache first for deterministic behavior
            cache_key = hashlib.md5(job_description.encode()).hexdigest()
            if cache_key in self.job_level_cache:
                print("  ✅ Using cached job level extraction...")
                return self.job_level_cache[cache_key]
        

            # Create a focused prompt for job requirement and level extraction
            requirement_prompt = f"""
            Analyze the job description to extract both the years of experience required and the job level.
            
            Job Description:
            {job_description}
            
            Instructions:
            - Look for phrases like "X+ years", "minimum X years", "X-Y years"
            - If multiple requirements are mentioned, use the highest one
            - If no specific years mentioned, return 0
            - Determine job level based on years requirement and job description context:
              * Entry/Junior: 0-2 years, entry-level, learning-focused, basic technical skills
              * Mid-level: 3-5 years, independent contributor, moderate complexity, some leadership
              * Senior: 7+ years, leadership, strategic thinking, team management, high complexity
            - Consider job titles, responsibilities, and context beyond just years
            
            Return ONLY a JSON object with:
            {{
                "years_required": <number>,
                "job_level": "<entry|mid|senior>",
                "extraction_details": "<explanation of what was found and level determination>"
            }}
            """
            
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": requirement_prompt}],
                temperature=0,
                seed=self._get_deterministic_seed(job_description),
                max_tokens=800
            )
            
            content = response.choices[0].message.content.strip()
            # Extract JSON from the response (handle potential markdown formatting)
            if content.startswith("```json"):
                content = content[7:-3]
            elif content.startswith("```"):
                content = content[3:-3]
            
            result = json.loads(content)
            
            # Mathematical validation and recalculation
            if "calculation_details" in result:
                import re
                details = result["calculation_details"]
                
                # Extract the sum calculation: "Total: 25 + 2 + 2 + 6 = 35 months"
                sum_match = re.search(r"Total: ([\d\s\+\=]+) = (\d+) months", details)
                if sum_match:
                    # Get the sum expression: "25 + 2 + 2 + 6"
                    sum_expression = sum_match.group(1).replace(" ", "").replace("=", "")
                    
                    # Calculate the actual sum
                    numbers = [int(x) for x in sum_expression.split("+")]
                    actual_total_months = sum(numbers)
                    
                    # Calculate correct years
                    actual_total_years = actual_total_months / 12
                    
                    # Override with correct values
                    result["total_months"] = actual_total_months
                    result["total_years"] = actual_total_years
                    
            # Cache the result for deterministic behavior
            self.job_level_cache[cache_key] = result
            return result
            
        except Exception as e:
            return {
                "years_required": 0,
                "job_level": "entry",
                "extraction_details": f"Error in extraction: {str(e)}"
            }
    
    def _calculate_experience_match_score(self, candidate_years: float, required_years: float) -> Dict[str, Any]:
        """
        Calculate experience match score based on deterministic rules.
        
        Scoring Rules:
        - Score 0: Candidate's total experience is short by ≥12 months compared to required
        - Score 1: Candidate's total experience is short by <12 months (close but not fully meeting)
        - Score 2: Candidate's experience meets or exceeds required years
        """
        try:
            gap_months = (required_years - candidate_years) * 12
            
            if gap_months >= 12:
                score = 0
                reason = f"Short by {gap_months:.1f} months (≥12 months gap)"
            elif gap_months > 0:
                score = 1
                reason = f"Short by {gap_months:.1f} months (<12 months gap)"
            else:
                score = 2
                reason = f"Meets or exceeds requirement (gap: {gap_months:.1f} months)"
            
            return {
                "score": score,
                "candidate_years": candidate_years,
                "required_years": required_years,
                "gap_months": gap_months,
                "reason": reason
            }
            
        except Exception as e:
            return {
                "score": 0,
                "candidate_years": 0,
                "required_years": 0,
                "gap_months": 0,
                "reason": f"Error in calculation: {str(e)}"
            }
    
    def compute_final_score(self, section_weights: Dict[str, float], subfield_scores: Dict[str, Any]) -> Dict[str, Any]:
        """
        Phase 3: Compute final weighted resume score (0-100).
        Uses mathematical formula as specified in Prompt Template 3.
        """
        print("  🧮 Computing final weighted score...")
        
        try:
            section_scores = {}
            total_weighted_score = 0.0
            
            # Define the subfield mappings for each section
            section_subfields = {
                "experience": ["candidate_years_of_experience_vs_role_expectation_match", "relevancy", "recency", "depth", "impact"],
                "education": ["alignment", "level", "institution_reputation"],
                "projects": ["relevance", "complexity", "outcome"],
                "leadership": ["initiative", "scope", "influence"],
                "research": ["domain_relevance", "novelty", "publication_impact"],
                "skills": ["alignment", "coverage", "proficiency"],
                "certifications": ["relevance", "recognition", "recency"],
                "awards": ["prestige", "relevance", "selectivity"],
                "publications": ["venue_quality", "topic_alignment", "impact"]
            }
            
            print("  📊 Calculating section scores and weighted contributions...")
            
            # Calculate section scores and weighted contributions
            for section, subfields in section_subfields.items():
                if section in subfield_scores:
                    # Get scores for this section's subfields
                    section_data = subfield_scores[section]
                    scores = []
                    
                    for subfield in subfields:
                        if subfield in section_data and isinstance(section_data[subfield], (int, float)):
                            scores.append(section_data[subfield])
                        else:
                            scores.append(0)  # Default to 0 if subfield missing or invalid
                    
                    # Calculate average score for this section
                    if scores:
                        avg_score = sum(scores) / len(scores)
                    else:
                        avg_score = 0.0
                    
                    section_scores[section] = round(avg_score, 2)
                    
                    # Get section weight (default to 0 if not in weights)
                    section_weight = section_weights.get(section, 0.0)
                    
                    # Calculate weighted contribution: (avg_score / 2) * weight (0-2 scale)
                    weighted_contribution = (avg_score / 2.0) * section_weight
                    total_weighted_score += weighted_contribution
                    
                    print(f"    • {section.capitalize()}: {avg_score:.2f}/2 (weight: {section_weight:.3f}) = {weighted_contribution:.3f} contribution")
                else:
                    # Section not present in subfield scores
                    section_scores[section] = 0.0
                    print(f"    • {section.capitalize()}: 0.00/2 (not present)")
            
            # Calculate final score (0-100)
            final_score = round(total_weighted_score * 100, 2)
            
            # Ensure score never exceeds 100
            if final_score > 100.0:
                final_score = 100.0
                print(f"  ⚠️  Score capped at 100.0 (was {total_weighted_score * 100:.2f})")
            
            print(f"  📈 Total weighted score: {total_weighted_score:.3f}")
            print(f"  🏆 Final score: {final_score:.2f}/100")
            
            # Prepare the result
            result = {
                "section_scores": section_scores,
                "section_weights": {k: v for k, v in section_weights.items() if k in section_scores},
                "final_weighted_score": final_score,
                "scoring_formula_used": "Final Score = sum(avg(section_score) / 2 * section_weight) * 100",
                "explanation": "The final score was computed by taking the average score of each section, normalizing it to a 0–1 range, weighting it by importance, and scaling to 100."
            }
            
            print("  ✅ Final score computation completed!")
            
            return result
            
        except Exception as e:
            raise Exception(f"Error in final score computation: {str(e)}")
    
    def score_resume(self, job_description: str, resume_text: str) -> Dict[str, Any]:
        """
        Main method to score a resume against a job description with real-time streaming output.
        Returns complete scoring breakdown with all phases.
        """
        start_time = time.time()
        
        print("🔄 Starting Resume Scoring Process...")
        print("=" * 80)
        
        try:
            # Phase 1: Assign section weights
            print("📊 Phase 1: Assigning section weights...")
            section_weights = self.assign_section_weights(job_description)
            
            print()
            
            # Phase 2: Score subfields
            print("📊 Phase 2: Scoring subfields...")
            subfield_scores = self.score_subfields(job_description, resume_text, section_weights)
            
            print()
            
            # Phase 3: Compute final score
            print("📊 Phase 3: Computing final score...")
            final_score = self.compute_final_score(section_weights, subfield_scores)
            
            print()
            
            # Get job level for transparency (using LLM-based analysis)
            job_requirement = self._extract_job_experience_requirement(job_description)
            job_level = job_requirement.get("job_level", "entry")
            
            # Compile complete result
            result = {
                "job_level": job_level,
                "experience_education_ratio": {"entry": 1.0, "mid": 2.0, "senior": 3.0}.get(job_level, 1.0),
                "section_weights": section_weights,
                "subfield_scores": subfield_scores,
                "final_score": final_score,
                "processing_time": time.time() - start_time
            }
            
            print(f"⏱️  Total processing time: {result['processing_time']:.2f} seconds")
            print("=" * 80)
            
            return result
            
        except Exception as e:
            raise Exception(f"Error in resume scoring: {str(e)}")

def main():
    """Example usage of the ResumeScorer."""
    scorer = ResumeScorer()
    
    # Example job description and resume
    job_description = """
    Senior Software Engineer
    
    We are looking for a Senior Software Engineer with 5+ years of experience in Python, 
    JavaScript, and cloud technologies. The ideal candidate should have proven experience 
    in building scalable web applications and working with microservices architecture.
    
    Requirements:
    - 5+ years of software development experience
    - Strong proficiency in Python and JavaScript
    - Experience with AWS or similar cloud platforms
    - Knowledge of database design and SQL
    - Experience with agile development methodologies
    """
    
    resume_text = """
    Software Engineer at Tech Corp (2020-2023)
    • Developed web applications using Python and JavaScript
    • Worked with AWS services and microservices architecture
    
    Education:
    Bachelor of Science in Computer Science, University of Technology (2018)
    GPA: 3.8
    
    Skills: Python, JavaScript, AWS, SQL, Docker
    
    Projects:
    E-commerce Platform - Built a scalable e-commerce platform using Python and React
    """
    
    # Score the resume
    result = scorer.score_resume(job_description, resume_text)
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main() # Deployment fix - Thu Sep  4 02:02:32 EDT 2025
