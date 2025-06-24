import os
import fitz  # PyMuPDF
import docx
from fastapi import UploadFile
import spacy
from typing import Dict, List
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import dateparser
from datetime import datetime
import textstat

ALLOWED_EXTENSIONS = {'.pdf', '.docx'}

# Load spaCy model once
try:
    nlp = spacy.load('en_core_web_sm')
except OSError:
    nlp = None  # Will raise error if used before download

# Example skill/education/experience keywords (expand as needed)
SKILL_KEYWORDS = [
    'python', 'java', 'sql', 'machine learning', 'data analysis', 'excel', 'communication', 'leadership',
    'project management', 'deep learning', 'nlp', 'statistics', 'cloud', 'aws', 'azure', 'pandas', 'numpy'
]
EDU_KEYWORDS = ['bachelor', 'master', 'phd', 'university', 'college', 'degree', 'b.sc', 'm.sc', 'bachelor of', 'master of']
EXP_KEYWORDS = ['engineer', 'developer', 'manager', 'analyst', 'consultant', 'intern', 'specialist', 'scientist']

DATASET_PATH = 'UpdatedResumeDataSet.csv'

# Mapping of categories to their top skills
CATEGORY_SKILLS = {
    'Advocate': 'legal, law, advocate, court, district, courts, criminal, cases, chennai, high, matters, paper, llb, civil, drafting',
    'Arts': 'arts, council, british, music, days, events, experience, state, managing, new, marketing, nagpur, workshop, board, programmes',
    'Automation Testing': 'qtp, good, integration, involved, cases, selenium, manual, regression, creation, driven, functional, release, case, plan, bug',
    'Blockchain': 'blockchain, ethereum, smart, computer, build, global, contracts, product, solidity, limited, analytics, html, javascript, css, networking',
    'Business Analyst': 'requirement, functional, analysis, analyst, user, report, cases, processes, gathering, cash, maintain, excel, documentation, end, users',
    'Civil Engineer': 'civil, site, construction, inspection, drawings, material, building, name, etc, ensure, autocad, position, including, job, specifications',
    'Data Science': 'learning, science, machine, analytics, analysis, deep, sap, text, platform, information, hana, nlp, industry, experience, neural',
    'Database': 'oracle, databases, backup, installation, servers, administrator, monitoring, creating, log, rman, linux, backups, user, production, managing',
    'DevOps Engineer': 'shell, devops, servers, build, applications, scripts, linux, users, cloud, scripting, deployment, different, commerce, creating, aws',
    'DotNet Developer': 'net, asp, jquery, dot, mvc, javascript, framework, layer, html, visual, css, designing, studio, end, comments',
    'ETL Developer': 'etl, informatica, talend, unix, mappings, oracle, unit, jobs, center, source, warehouse, job, power, files, reconciliation',
    'Electrical Engineering': 'electrical, maintenance, power, operation, control, plant, layout, equipment, cable, panels, panel, completed, drawing, schedules, distribution',
    'HR': 'payroll, june, computer, mba, statutory, compliance, employee, salary, employees, dynamics, school, payment, form, accounting, dbms',
    'Hadoop': 'hadoop, hive, sqoop, hdfs, spark, cluster, pig, involved, mapreduce, queries, hbase, tables, scala, map, reduce',
    'Health and Fitness': 'fitness, health, gym, nutrition, science, related, handling, queries, customers, hotel, centre, high, good, people, spa',
    'Java Developer': 'ajax, spring, jsp, hibernate, javascript, servlet, jquery, computer, title, systems, databases, amravati, website, operating, oracle',
    'Mechanical Engineer': 'mechanical, products, vendor, cost, vendors, machine, proposal, manufacturing, order, also, field, quotations, ensure, maintain, estimation',
    'Network Security Engineer': 'network, security, cisco, configuration, firewall, etc, switches, servers, firewalls, devices, troubleshooting, asa, troubleshoot, routing, maintaining',
    'Operations Manager': 'ensuring, job, timely, ensure, meetings, honeywell, control, monitored, ges, fat, customers, managing, activity, international, delivery',
    'PMO': 'report, responsible, sla, documentation, risk, resource, monitor, senior, maintain, ensure, reporting, pmo, billing, delivery, ability',
    'Python Developer': 'completed, internal, django, computer, movex, erp, rest, api, agile, science, html, june, mongodb, created, successfully',
    'SAP Developer': 'sap, hana, users, webi, bods, universe, end, views, order, experience, performance, implemented, user, nestle, involved',
    'Sales': 'marketing, office, targets, cricket, staff, performance, managing, clients, leads, high, school, calling, good, lead, job',
    'Testing': 'check, transformer, android, assembly, inspection, electronics, resistance, core, power, name, transformers, tests, good, electrical, state',
    'Web Designing': 'bootstrap, jquery, developed, roles, responsibility, website, designed, com, photoshop, php, javascript, nagpur, trust, made, loan',
}

# Simple career ladder mapping for demonstration
CAREER_LADDERS = {
    'Intern': ['Junior Developer', 'Analyst', 'Associate'],
    'Junior Developer': ['Developer', 'Software Engineer'],
    'Developer': ['Senior Developer', 'Tech Lead'],
    'Senior Developer': ['Tech Lead', 'Engineering Manager'],
    'Data Science': ['Data Analyst', 'Data Scientist', 'Senior Data Scientist', 'ML Engineer'],
    'Business Analyst': ['Senior Business Analyst', 'Product Manager'],
    'Analyst': ['Senior Analyst', 'Consultant'],
    'Manager': ['Senior Manager', 'Director'],
    # Add more as needed
}

# Map category to a canonical role for ladder lookup
CATEGORY_TO_ROLE = {
    'Data Science': 'Data Science',
    'Business Analyst': 'Business Analyst',
    'Python Developer': 'Developer',
    'DotNet Developer': 'Developer',
    'Java Developer': 'Developer',
    'Intern': 'Intern',
    'Analyst': 'Analyst',
    'Manager': 'Manager',
    # Add more as needed
}

# List of common soft skills
SOFT_SKILLS = [
    'communication', 'leadership', 'teamwork', 'collaboration', 'adaptability', 'problem solving',
    'critical thinking', 'creativity', 'work ethic', 'time management', 'empathy', 'conflict resolution',
    'interpersonal skills', 'flexibility', 'initiative', 'responsibility', 'decision making', 'motivation',
    'organization', 'attention to detail', 'stress management', 'negotiation', 'public speaking', 'active listening',
    'emotional intelligence', 'self-motivation', 'patience', 'open-mindedness', 'dependability', 'positivity'
]

# List of common resume buzzwords
BUZZWORDS = [
    'synergy', 'dynamic', 'proactive', 'innovative', 'results-driven', 'go-getter', 'team player',
    'go-to person', 'think outside the box', 'detail-oriented', 'hard worker', 'self-motivated',
    'track record', 'fast-paced', 'problem solver', 'strategic thinker', 'value-added', 'bottom line',
    'core competency', 'best practice', 'move the needle', 'leverage', 'circle back', 'touch base',
    'game changer', 'paradigm shift', 'disruptive', 'mission-critical', 'pivot', 'bandwidth', 'streamline'
]

# Common resume section headers
SECTION_HEADERS = [
    'experience', 'education', 'skills', 'projects', 'summary', 'objective', 'certifications',
    'achievements', 'publications', 'interests', 'languages', 'contact', 'profile', 'work history'
]

class ResumeBenchmarkModel:
    def __init__(self, dataset_path=DATASET_PATH):
        self.df = pd.read_csv(dataset_path)
        print('CSV columns:', self.df.columns.tolist())  # Debug print
        self.categories = self.df['Category'].unique().tolist()
        self.vectorizer = TfidfVectorizer(stop_words='english', max_features=2000)
        # Fit on all resumes once
        all_texts = self.df['Resume'].astype(str).tolist()
        self.vectorizer.fit(all_texts)
        self.category_profiles = self._build_category_profiles()

    def _build_category_profiles(self):
        profiles = {}
        for cat in self.categories:
            cat_texts = self.df[self.df['Category'] == cat]['Resume'].astype(str).tolist()
            if cat_texts:
                tfidf = self.vectorizer.transform(cat_texts)
                mean_vec = tfidf.mean(axis=0)
                mean_vec = np.asarray(mean_vec)
                profiles[cat] = mean_vec
        return profiles

    def get_category_skills(self, category, top_n=20):
        cat_texts = self.df[self.df['Category'] == category]['Resume'].astype(str).tolist()
        if not cat_texts:
            return []
        tfidf = self.vectorizer.transform(cat_texts)
        feature_array = self.vectorizer.get_feature_names_out()
        avg_tfidf = tfidf.mean(axis=0).A1
        top_indices = avg_tfidf.argsort()[::-1][:top_n]
        return [feature_array[i] for i in top_indices]

    def compare_resume(self, resume_text, category):
        # Vectorize resume and compare to category profile
        resume_vec = self.vectorizer.transform([resume_text])
        cat_vec = self.category_profiles.get(category)
        if cat_vec is None:
            return {"similarity": 0.0, "skill_match": 0.0, "matched_skills": []}
        # Ensure both are arrays
        sim = cosine_similarity(resume_vec, cat_vec)
        similarity_score = float(sim[0, 0])

        # Skill match logic
        skills_str = CATEGORY_SKILLS.get(category, "")
        skill_list = [s.strip().lower() for s in skills_str.split(",") if s.strip()]
        resume_text_lower = resume_text.lower()
        matched_skills = [skill for skill in skill_list if skill in resume_text_lower]
        skill_match_score = len(matched_skills) / len(skill_list) if skill_list else 0.0

        return {
            "similarity": similarity_score,
            "skill_match": skill_match_score,
            "matched_skills": matched_skills
        }

# Singleton for the model
benchmark_model = None

def get_benchmark_model():
    global benchmark_model
    if benchmark_model is None:
        benchmark_model = ResumeBenchmarkModel()
    return benchmark_model

def allowed_file(filename):
    ext = os.path.splitext(filename)[1].lower()
    return ext in ALLOWED_EXTENSIONS


def extract_text_from_pdf(file_bytes):
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    text = "\n".join(page.get_text() for page in doc)
    doc.close()
    return text


def extract_text_from_docx(file_bytes):
    from io import BytesIO
    doc = docx.Document(BytesIO(file_bytes))
    text = "\n".join([para.text for para in doc.paragraphs])
    return text


def extract_text(upload_file: UploadFile):
    filename = upload_file.filename
    ext = os.path.splitext(filename)[1].lower()
    file_bytes = upload_file.file.read()
    if ext == '.pdf':
        return extract_text_from_pdf(file_bytes)
    elif ext == '.docx':
        return extract_text_from_docx(file_bytes)
    else:
        raise ValueError("Unsupported file type")


def extract_resume_entities(text: str) -> Dict[str, List[str]]:
    if nlp is None:
        raise RuntimeError("spaCy model not loaded. Run: python -m spacy download en_core_web_sm")
    doc = nlp(text)
    skills = set()
    education = set()
    experience = set()
    # Simple keyword-based extraction
    lower_text = text.lower()
    for skill in SKILL_KEYWORDS:
        if skill in lower_text:
            skills.add(skill)
    for edu in EDU_KEYWORDS:
        if edu in lower_text:
            education.add(edu)
    for exp in EXP_KEYWORDS:
        if exp in lower_text:
            experience.add(exp)
    # Optionally, use NER for ORG, DATE, etc.
    orgs = [ent.text for ent in doc.ents if ent.label_ == 'ORG']
    dates = [ent.text for ent in doc.ents if ent.label_ == 'DATE']
    return {
        'skills': list(skills),
        'education': list(education),
        'experience': list(experience),
        'organizations': orgs,
        'dates': dates
    }

def add_skills_column_to_dataset(dataset_path=DATASET_PATH):
    df = pd.read_csv(dataset_path)
    # Add the Skills column based on Category
    df['Skills'] = df['Category'].map(CATEGORY_SKILLS)
    df.to_csv(dataset_path, index=False)
    print('Skills column added and dataset overwritten.')

def check_timeline_consistency(dates: list, gap_threshold_months: int = 6):
    """
    Analyze a list of date strings for timeline consistency (gaps, overlaps).
    Args:
        dates: List of date strings (from NER or manual extraction)
        gap_threshold_months: Minimum gap (in months) to flag as a gap
    Returns:
        dict: { 'gaps': [...], 'overlaps': [...], 'parsed_dates': [...], 'issues': [...] }
    """
    # Parse dates and sort
    parsed = []
    for d in dates:
        # Try to parse single dates or ranges (e.g., 'Jan 2020 - Mar 2021')
        if '-' in d and len(d.split('-')) == 2:
            start, end = d.split('-')
            start_dt = dateparser.parse(start.strip())
            end_dt = dateparser.parse(end.strip())
            if start_dt and end_dt:
                parsed.append((start_dt, end_dt, d))
        else:
            dt = dateparser.parse(d)
            if dt:
                parsed.append((dt, dt, d))
    # Sort by start date
    parsed = sorted(parsed, key=lambda x: x[0])
    issues = []
    gaps = []
    overlaps = []
    for i in range(1, len(parsed)):
        prev_end = parsed[i-1][1]
        curr_start = parsed[i][0]
        # Gap detection
        gap_months = (curr_start.year - prev_end.year) * 12 + (curr_start.month - prev_end.month)
        if gap_months > gap_threshold_months:
            gaps.append({
                'between': (parsed[i-1][2], parsed[i][2]),
                'gap_months': gap_months
            })
            issues.append(f"Gap of {gap_months} months between '{parsed[i-1][2]}' and '{parsed[i][2]}'")
        # Overlap detection
        if curr_start < prev_end:
            overlaps.append({
                'between': (parsed[i-1][2], parsed[i][2]),
                'overlap': (prev_end - curr_start).days
            })
            issues.append(f"Overlap between '{parsed[i-1][2]}' and '{parsed[i][2]}'")
    return {
        'gaps': gaps,
        'overlaps': overlaps,
        'parsed_dates': [(str(s), str(e), label) for s, e, label in parsed],
        'issues': issues
    }

def suggest_career_path_and_upskilling(category, missing_skills):
    """
    Suggest next possible roles/job titles and upskilling suggestions.
    Args:
        category: Current resume category
        missing_skills: List of missing skills from analysis
    Returns:
        dict: { 'next_roles': [...], 'upskilling': [...] }
    """
    role = CATEGORY_TO_ROLE.get(category, category)
    next_roles = CAREER_LADDERS.get(role, [])
    # Upskilling: recommend missing skills, or top skills from next role if available
    upskilling = list(missing_skills)
    # If next role exists and has curated skills, suggest those not in current resume
    if next_roles:
        next_role = next_roles[0]  # Take the first as the most likely next step
        next_role_skills = []
        for cat, skills in CATEGORY_SKILLS.items():
            if next_role.lower() in cat.lower():
                next_role_skills = [s.strip() for s in skills.split(',') if s.strip()]
                break
        upskilling += [s for s in next_role_skills if s not in upskilling]
    # Deduplicate
    upskilling = list(dict.fromkeys(upskilling))
    return {
        'next_roles': next_roles,
        'upskilling': upskilling
    }

def detect_soft_skills(text: str):
    """
    Detect soft skills mentioned in the resume text.
    Args:
        text: Resume text
    Returns:
        list: Detected soft skills
    """
    lower_text = text.lower()
    detected = [skill for skill in SOFT_SKILLS if skill in lower_text]
    return detected

def analyze_readability_ats(text, category=None, curated_skills=None):
    """
    Analyze resume readability and ATS optimization.
    Returns a dict with readability score, buzzword overuse, passive voice, section headers, keyword frequency, etc.
    """
    report = {}
    # Readability
    try:
        flesch = textstat.flesch_reading_ease(text)
        flesch_kincaid = textstat.flesch_kincaid_grade(text)
        report['flesch_reading_ease'] = flesch
        report['flesch_kincaid_grade'] = flesch_kincaid
    except Exception as e:
        report['flesch_reading_ease'] = None
        report['flesch_kincaid_grade'] = None
        report['readability_error'] = str(e)
    # Buzzword overuse
    buzzword_counts = {bw: text.lower().count(bw) for bw in BUZZWORDS if text.lower().count(bw) > 0}
    report['buzzword_counts'] = buzzword_counts
    report['buzzword_flag'] = any(count > 2 for count in buzzword_counts.values())  # flag if any buzzword used >2 times
    # Passive voice (simple heuristic: look for 'was|were|is|are|been|being' + past participle)
    passive_phrases = []
    import re
    sentences = re.split(r'[.!?]', text)
    for sent in sentences:
        if re.search(r'\b(was|were|is|are|been|being)\b\s+\w+ed\b', sent, re.IGNORECASE):
            passive_phrases.append(sent.strip())
    report['passive_voice_count'] = len(passive_phrases)
    report['passive_voice_examples'] = passive_phrases[:3]  # show up to 3 examples
    # Section headers
    found_headers = [h for h in SECTION_HEADERS if h in text.lower()]
    report['section_headers_found'] = found_headers
    report['section_headers_missing'] = [h for h in SECTION_HEADERS if h not in found_headers]
    # ATS keyword frequency (from curated_skills)
    if curated_skills:
        keyword_freq = {k: text.lower().count(k.lower()) for k in curated_skills}
        report['ats_keyword_frequency'] = keyword_freq
        # Flag if any important skill is missing
        report['ats_missing_keywords'] = [k for k, v in keyword_freq.items() if v == 0]
    else:
        report['ats_keyword_frequency'] = {}
        report['ats_missing_keywords'] = []
    return report 