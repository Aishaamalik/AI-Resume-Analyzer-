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
        tfidf = self.vectorizer.fit_transform(cat_texts)
        feature_array = self.vectorizer.get_feature_names_out()
        avg_tfidf = tfidf.mean(axis=0).A1
        top_indices = avg_tfidf.argsort()[::-1][:top_n]
        return [feature_array[i] for i in top_indices]

    def compare_resume(self, resume_text, category):
        # Vectorize resume and compare to category profile
        resume_vec = self.vectorizer.transform([resume_text])
        cat_vec = self.category_profiles.get(category)
        if cat_vec is None:
            return 0.0
        # Ensure both are arrays
        sim = cosine_similarity(resume_vec, cat_vec)
        return float(sim[0, 0])

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