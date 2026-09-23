from io import BytesIO

from docx import Document
from pypdf import PdfReader

SUPPORTED_EXTENSIONS = {
    ".pdf", ".docx", ".txt",
}

def parse_text(text: str) -> str:
    return text.strip()

def parse_pdf(content: bytes) -> str:
    reader = PdfReader(BytesIO(content))

    pages = []

    for page in reader.pages:
        extracted = page.extract_text()

        if extracted:
            pages.append(extracted)

    return "\n\n".join(pages).strip()

def parse_docx(content: bytes) -> str:
    document = Document(BytesIO(content))

    paragraphs = [
        paragraph.text.strip()
        for paragraph in document.paragraphs
        if paragraph.text.strip()
    ]

    return "\n".join(paragraphs).strip()

def parse_txt(content: bytes) -> str:
    return content.decode("utf-8", errors="ignore").strip()

def parse_document(
    filename: str, content: bytes,
) -> str:
    filename_lower = filename.lower()

    if filename_lower.endswith(".pdf"):
        return parse_pdf(content)

    if filename_lower.endswith(".docx"):
        return parse_docx(content)

    if filename_lower.endswith(".txt"):
        return parse_txt(content)

    raise ValueError("Unsupported file type. Supported formats: PDF, DOCX, TXT.")