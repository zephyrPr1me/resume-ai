# Test Coverage Guide

## Running Tests

### Run all tests
```bash
pytest
```

### Run specific test file
```bash
pytest tests/test_main.py
pytest tests/test_frontend.py
```

### Run with coverage report
```bash
pytest --cov=app --cov-report=html
```

### Run specific test class or function
```bash
pytest tests/test_main.py::TestExtractJsonFromAi::test_extract_json_valid_json
pytest -k "test_upload" -v
```

### Run only unit tests
```bash
pytest -m unit
```

### Run only integration tests
```bash
pytest -m integration
```

### Run with verbose output
```bash
pytest -v
```

## Test Organization

### `tests/test_main.py` - Backend Unit & Integration Tests
- **TestExtractJsonFromAi**: JSON extraction and parsing
  - Valid JSON extraction
  - JSON from markdown code blocks
  - JSON with extra text
  - BOM character handling
  - Nested structures
  - Special characters

- **TestTextExtractor**: File extraction
  - TXT file extraction
  - PDF file extraction
  - Unsupported file types
  - File size validation
  - Stream validation

- **TestAnalysisResult**: Data model validation
  - Valid result creation
  - Match percentage bounds (0-100)
  - Nullable percentage

- **TestHttpEndpoints**: HTTP endpoint integration
  - GET / (root)
  - GET /models-free/
  - POST /upload/ with various scenarios
  - Error handling (empty file, too large, invalid JSON)
  - Job description passing
  - AI error handling

- **TestModelParameter**: Model selection feature
  - Custom model usage
  - Default model fallback

### `tests/test_frontend.py` - Frontend Integration Tests
- **TestFrontendModelSelection**: Model dropdown functionality
  - Models endpoint structure
  - Model list format

- **TestFrontendUploadFlow**: User upload workflows
  - Upload with job description
  - Upload without job description
  - Model selection passing
  - Error handling (API failure, invalid file)
  - Response field display

- **TestFrontendResponseHandling**: Response parsing
  - Response JSON structure
  - Null match percentage handling
  - Empty lists handling

## Test Coverage Summary

| Component | Coverage | Tests |
|-----------|----------|-------|
| JSON Extraction | High | 6 unit tests |
| Text Extraction | High | 6 unit tests |
| Model Validation | High | 3 unit tests |
| HTTP Endpoints | High | 15+ integration tests |
| Frontend Flow | High | 10+ integration tests |
| Error Handling | High | 5+ error scenarios |

## Key Test Scenarios

### Backend
✅ Extract JSON from various formats (code blocks, BOM, nested)
✅ Extract text from PDF and TXT files
✅ Validate file size limits (50MB)
✅ Validate AnalysisResult model (0-100 range)
✅ Handle empty and missing files
✅ Pass job description to AI
✅ Use selected model for analysis
✅ Handle AI API errors gracefully
✅ Parse invalid JSON from AI
✅ Return proper response structure

### Frontend (Integration)
✅ Load models from /models-free/ endpoint
✅ Upload file with job description
✅ Upload file without job description
✅ Select and use custom model
✅ Handle API failures
✅ Handle empty file uploads
✅ Display all response fields
✅ Parse response with null values
✅ Handle empty recommendation lists

