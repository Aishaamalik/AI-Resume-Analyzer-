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
        result = model.compare_resume(text, category)
        top_skills = model.get_category_skills(category)
        # Add curated skills for this category, excluding stopwords
        from utils import CATEGORY_SKILLS
        curated_skills = [s.strip() for s in CATEGORY_SKILLS.get(category, "").split(",") if s.strip() and s.strip().lower() not in ENGLISH_STOP_WORDS]
        return {
            "similarity": result["similarity"],
            "skill_match": result["skill_match"],
            "matched_skills": result["matched_skills"],
            "top_skills": top_skills,
            "all_skills": curated_skills
        }
    except Exception as e:
        return JSONResponse(status_code=400, content={"error": str(e)})

@app.get("/dataset_summary/")
def dataset_summary():
    try:
        model = get_benchmark_model()
        df = model.df
        print('DF columns:', df.columns.tolist())
        print('DF head:', df.head().to_dict())
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
        # --- New EDA with Skills column ---
        # 1. Top skills per category (from Skills column)
        top_skills_per_category = {}
        for cat in df['Category'].unique():
            skills = df[df['Category'] == cat]['Skills'].iloc[0] if not df[df['Category'] == cat]['Skills'].isnull().all() else ""
            top_skills_per_category[cat] = [s.strip() for s in skills.split(',') if s.strip()]

        # 2. Skill frequency across all resumes (from curated skills)
        all_skills = []
        for skills in df['Skills'].dropna().unique():
            all_skills.extend([s.strip() for s in skills.split(',') if s.strip()])
        all_skills = list(set(all_skills))
        skill_appearance = {skill: int(df['Resume'].str.lower().str.contains(skill.lower()).sum()) for skill in all_skills}
        most_common_skills = [(skill, int(count)) for skill, count in sorted(skill_appearance.items(), key=lambda x: x[1], reverse=True)]
        least_common_skills = [(skill, int(count)) for skill, count in sorted(skill_appearance.items(), key=lambda x: x[1])]

        # 3. Skill coverage per category (what % of resumes in each category mention each curated skill)
        skill_coverage_per_category = {}
        for cat in df['Category'].unique():
            cat_df = df[df['Category'] == cat]
            skills = top_skills_per_category[cat]
            coverage = {}
            for skill in skills:
                coverage[skill] = float(cat_df['Resume'].str.lower().str.contains(skill.lower()).mean())  # as fraction
            skill_coverage_per_category[cat] = coverage

        # 4. Heatmap: categories vs. curated skills (fraction of resumes mentioning each skill)
        heatmap_categories = list(df['Category'].unique())
        heatmap_skills = all_skills
        heatmap_matrix = []
        for cat in heatmap_categories:
            cat_df = df[df['Category'] == cat]
            row = [float(cat_df['Resume'].str.lower().str.contains(skill.lower()).mean()) for skill in heatmap_skills]
            heatmap_matrix.append(row)

        # Category-skill cross-tab (top 5 curated skills per top 5 categories, with coverage)
        cross_tab = {}
        for cat in df['Category'].value_counts().head(5).index:
            skills = top_skills_per_category[cat][:5]
            cat_df = df[df['Category'] == cat]
            skill_rows = []
            for skill in skills:
                coverage = float(cat_df['Resume'].str.lower().str.contains(skill.lower()).mean())
                skill_rows.append({"skill": skill, "coverage": coverage})
            cross_tab[cat] = skill_rows

        return {
            "summary": summary,
            "top_categories": top_categories,
            "resume_length_stats": length_stats,
            "top_words": top_words_list,
            "skill_freq": skill_freq,
            "category_skill_crosstab": cross_tab,
            "top_skills_per_category": top_skills_per_category,
            "skill_appearance": skill_appearance,
            "most_common_skills": most_common_skills,
            "least_common_skills": least_common_skills,
            "skill_coverage_per_category": skill_coverage_per_category,
            "heatmap_categories": heatmap_categories,
            "heatmap_skills": heatmap_skills,
            "heatmap_matrix": heatmap_matrix
        }
    except Exception as e:
        import traceback
        print('Error in /dataset_summary:', traceback.format_exc())
        return JSONResponse(status_code=500, content={"error": str(e)})

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