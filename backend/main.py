from fastapi import FastAPI, UploadFile, File, Form, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from utils import allowed_file, extract_text, extract_resume_entities, get_benchmark_model

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