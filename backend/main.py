from fastapi import FastAPI, UploadFile, File, Form, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from utils import allowed_file, extract_text, extract_resume_entities, get_benchmark_model
import pandas as pd
from collections import Counter
import re
from sklearn.feature_extraction.text import ENGLISH_STOP_WORDS
import numpy as np

app = FastAPI()

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "AI-Powered Resume Analyzer Backend"}

@app.post("/upload_resume/")
async def upload_resume(file: UploadFile = File(...)):
    if not allowed_file(file.filename):
        return JSONResponse(status_code=400, content={"error": "Unsupported file type"})
    try:
        text = extract_text(file)
        return {"filename": file.filename, "text": text[:1000]}  # Return first 1000 chars for preview
    except Exception as e:
        return JSONResponse(status_code=400, content={"error": str(e)})

@app.post("/upload_jd/")
async def upload_jd(file: UploadFile = File(None), text: str = Form(None)):
    if file:
        if not allowed_file(file.filename):
            return JSONResponse(status_code=400, content={"error": "Unsupported file type"})
        try:
            jd_text = extract_text(file)
            return {"filename": file.filename, "text": jd_text[:1000]}
        except Exception as e:
            return JSONResponse(status_code=400, content={"error": str(e)})
    elif text:
        return {"text": text[:1000]}
    return JSONResponse(status_code=400, content={"error": "No JD provided"})

@app.post("/parse_resume/")
async def parse_resume(text: str = Body(..., embed=True)):
    try:
        entities = extract_resume_entities(text)
        return entities
    except Exception as e:
        return JSONResponse(status_code=400, content={"error": str(e)})

@app.post("/analyze_resume/")
async def analyze_resume(text: str = Body(...), category: str = Body(...)):
    try:
        model = get_benchmark_model()
        similarity = model.compare_resume(text, category)
        top_skills = model.get_category_skills(category)
        return {"similarity": similarity, "top_skills": top_skills}
    except Exception as e:
        return JSONResponse(status_code=400, content={"error": str(e)})

@app.get("/dataset_summary/")
def dataset_summary():
    model = get_benchmark_model()
    df = model.df
    summary = {
        "total_resumes": len(df),
        "unique_categories": len(df['Category'].unique()),
        "top_skill": None
    }
    # Top N categories
    top_categories = (
        df['Category'].value_counts().head(10).reset_index().rename(columns={"index": "category", "Category": "count"})
        .to_dict(orient="records")
    )
    # Resume length stats
    resume_lengths = df['Resume'].astype(str).apply(lambda x: len(x.split()))
    length_stats = {
        "min": int(resume_lengths.min()),
        "max": int(resume_lengths.max()),
        "mean": float(resume_lengths.mean()),
        "median": float(resume_lengths.median()),
        "std": float(resume_lengths.std()),
    }
    # Most common words (excluding stopwords)
    all_text = " ".join(df['Resume'].astype(str).tolist()).lower()
    words = re.findall(r"\b\w+\b", all_text)
    words = [w for w in words if w not in ENGLISH_STOP_WORDS and len(w) > 2]
    top_words = Counter(words).most_common(20)
    summary["top_skill"] = top_words[0][0] if top_words else None
    top_words_list = [{"word": s, "count": c} for s, c in top_words]
    # Skill frequency distribution (bar chart data)
    skill_freq = dict(top_words)
    # Category-skill cross-tab (top 5 skills per top 5 categories)
    cross_tab = {}
    for cat in df['Category'].value_counts().head(5).index:
        cat_text = " ".join(df[df['Category'] == cat]['Resume'].astype(str).tolist()).lower()
        cat_words = re.findall(r"\b\w+\b", cat_text)
        cat_words = [w for w in cat_words if w not in ENGLISH_STOP_WORDS and len(w) > 2]
        cat_top = Counter(cat_words).most_common(5)
        cross_tab[cat] = [{"word": w, "count": c} for w, c in cat_top]
    return {
        "summary": summary,
        "top_categories": top_categories,
        "resume_length_stats": length_stats,
        "top_words": top_words_list,
        "skill_freq": skill_freq,
        "category_skill_crosstab": cross_tab
    }

@app.get("/resume_length_histogram/")
def resume_length_histogram():
    model = get_benchmark_model()
    df = model.df
    resume_lengths = df['Resume'].astype(str).apply(lambda x: len(x.split()))
    # Bin lengths (e.g., 0-100, 100-200, ...)
    bins = list(range(0, int(resume_lengths.max()) + 100, 100))
    hist, bin_edges = np.histogram(resume_lengths, bins=bins)
    return {
        "bins": [int(b) for b in bin_edges],
        "counts": hist.tolist()
    }

@app.get("/category_skill_frequency/")
def category_skill_frequency(category: str):
    model = get_benchmark_model()
    df = model.df
    cat_text = " ".join(df[df['Category'] == category]['Resume'].astype(str).tolist()).lower()
    words = re.findall(r"\b\w+\b", cat_text)
    words = [w for w in words if w not in ENGLISH_STOP_WORDS and len(w) > 2]
    top_words = Counter(words).most_common(20)
    return {"category": category, "top_words": [{"word": w, "count": c} for w, c in top_words]}

@app.get("/skill_category_heatmap/")
def skill_category_heatmap():
    model = get_benchmark_model()
    df = model.df
    all_text = " ".join(df['Resume'].astype(str).tolist()).lower()
    words = re.findall(r"\b\w+\b", all_text)
    words = [w for w in words if w not in ENGLISH_STOP_WORDS and len(w) > 2]
    top_skills = [w for w, _ in Counter(words).most_common(10)]
    top_categories = df['Category'].value_counts().head(5).index.tolist()
    matrix = []
    for cat in top_categories:
        cat_text = " ".join(df[df['Category'] == cat]['Resume'].astype(str).tolist()).lower()
        cat_words = re.findall(r"\b\w+\b", cat_text)
        cat_words = [w for w in cat_words if w not in ENGLISH_STOP_WORDS and len(w) > 2]
        cat_counter = Counter(cat_words)
        row = [cat_counter.get(skill, 0) for skill in top_skills]
        matrix.append(row)
    return {
        "categories": top_categories,
        "skills": top_skills,
        "matrix": matrix
    } 