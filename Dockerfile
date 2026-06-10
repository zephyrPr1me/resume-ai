FROM python:3.12-slim

WORKDIR /usr/src/app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN python -m pip install --upgrade pip
RUN pip install --no-cache-dir \
    fastapi[standard]>=0.136.1 \
    json-repair>=0.59.5 \
    openrouter>=0.9.1 \
    pymupdf>=1.27.2.3 \
    python-dotenv>=1.0.0

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
