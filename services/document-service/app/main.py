from datetime import datetime, timedelta, timezone
from io import BytesIO
from uuid import uuid4

import pdfplumber
from docx import Document
from fastapi import FastAPI, File, HTTPException, UploadFile


app = FastAPI(
    title="Document Service",
    description="Internal document parsing service",
    version="1.0.0"
)


# In-memory document storage
documents = {}

# Maximum file size: 10 MB
MAX_FILE_SIZE = 10 * 1024 * 1024

# Document TTL: 1 hour
TTL_HOURS = 1


def extract_txt(file_data: bytes) -> str:
    return file_data.decode("utf-8")


def extract_pdf(file_data: bytes) -> str:
    text_parts = []

    with pdfplumber.open(BytesIO(file_data)) as pdf:
        for page in pdf.pages:
            text = page.extract_text()

            if text:
                text_parts.append(text)

    return "\n\n".join(text_parts)


def extract_docx(file_data: bytes) -> str:
    document = Document(BytesIO(file_data))

    text_parts = []

    for paragraph in document.paragraphs:
        if paragraph.text:
            text_parts.append(paragraph.text)

    return "\n".join(text_parts)

@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "document-service"
    }


@app.post("/internal/documents/parse", status_code=201)
async def parse_document(file: UploadFile = File(...)):

    # Read uploaded file
    file_data = await file.read()

    # Check file size
    if len(file_data) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="File size exceeds 10 MB limit"
        )

    # Extract text based on file type
    if file.content_type == "text/plain":
        try:
            extracted_text = extract_txt(file_data)
        except Exception:
            raise HTTPException(
                status_code=422,
                detail="Failed to extract text from TXT file"
            )

    elif file.content_type == "application/pdf":
        try:
            extracted_text = extract_pdf(file_data)
        except Exception:
            raise HTTPException(
                status_code=422,
                detail="Failed to extract text from PDF file"
            )

    elif file.content_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        try:
            extracted_text = extract_docx(file_data)
        except Exception:
            raise HTTPException(
                status_code=422,
                detail="Failed to extract text from DOCX file"
            )

    else:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Only PDF, DOCX and TXT files are supported"
        )

    # Generate document ID
    document_id = str(uuid4())

    # Calculate expiration time
    expires_at = datetime.now(timezone.utc) + timedelta(hours=TTL_HOURS)

    # Store document in memory
    documents[document_id] = {
        "filename": file.filename,
        "mime_type": file.content_type,
        "extracted_text": extracted_text,
        "expires_at": expires_at
    }

    return {
        "document_id": document_id,
        "filename": file.filename,
        "mime_type": file.content_type,
        "extracted_text": extracted_text,
        "char_count": len(extracted_text),
        "expires_at": expires_at
    }



@app.get("/internal/documents/{document_id}/text")
def get_document_text(document_id: str):

    # Check if document exists
    document = documents.get(document_id)

    if document is None:
        raise HTTPException(
            status_code=404,
            detail="Document not found or expired"
        )

    # Check if document has expired
    if datetime.now(timezone.utc) >= document["expires_at"]:
        # Remove expired document from memory
        del documents[document_id]

        raise HTTPException(
            status_code=404,
            detail="Document not found or expired"
        )

    # Return document text
    extracted_text = document["extracted_text"]

    return {
        "document_id": document_id,
        "extracted_text": extracted_text,
        "char_count": len(extracted_text)
    }