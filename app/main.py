from io import BytesIO
from os import getenv

import fitz
from dotenv import load_dotenv
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from google import genai

load_dotenv()

app = FastAPI()
app.mount("/static", StaticFiles(directory="app/static"), name="static")


@app.get("/")
async def read_root():
    return FileResponse("app/static/index.html")


client = genai.Client(api_key=getenv("GEMINI_API_KEY"))
prompt = """
Act as a professional recruiter and career coach. Analyze the provided resume text thoroughly. Respond strictly in the following format, using the exact headings in English. Write all analysis in the same language as the resume.

Key Points:
- Identify three actionable, specific highlights from the resume (e.g., quantifiable achievements, rare skills, unique experience). Explain why each is valuable for employers.

Strengths:
- List the main strengths of the resume (e.g., strong formatting, relevant keywords, clear career progression, measurable results). Provide concrete examples from the text.

Weaknesses:
- Identify specific weaknesses (e.g., employment gaps, lack of keywords, vague descriptions, overused buzzwords, missing metrics). Refer to actual sentences or sections.

What needs improvement:
- Give 3–5 concrete, prioritized suggestions to make the resume more competitive. For each suggestion, explain the problem and how to fix it (e.g., “Add numbers to the project description…”, “Rephrase the summary to include…”).

Be concise, practical, and avoid generic statements. Use bullet points within each section.

Resume:
[TEXT]
"""


@app.post("/upload/")
async def upload_file(file: UploadFile = File(...)):
    pdf_bytes = await file.read()
    if not pdf_bytes:
        return {"error": "file is empty"}
    pdf_stream = BytesIO(pdf_bytes)
    full_text = []
    try:
        doc = fitz.open(stream=pdf_stream, filetype="pdf")
        for page in doc:
            text = page.get_text()
            if text:
                full_text.append(text)
        doc.close()
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt.replace("[TEXT]", " ".join(full_text)),
        )
    except Exception as e:
        return {"error": f"Error while working with file: {str(e)}"}
    return {"response": response.text}
