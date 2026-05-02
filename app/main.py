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
Review the resume [TEXT] and highlight 3 key points
Weaknesses in the resume
Strengths in the resume
What needs improvement
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
