from io import BytesIO
from zipfile import BadZipFile

from docx import Document
from pypdf import PdfReader

SUPPORTED_EXTENSIONS = {
    ".pdf", ".docx", ".txt",
}

def parse_text(text: str) -> str:
    return text.strip()

def parse_pdf(content: bytes) -> str:
    if not content.lstrip().startswith(b"%PDF-"):
        raise ValueError(
            "The uploaded file is not a valid PDF. "
            "Please upload a PDF file or choose the correct file type."
        )

    try:
        reader = PdfReader(BytesIO(content))
    except Exception as exc:
        raise ValueError(
            "The uploaded PDF could not be read. "
            "Please upload a valid, uncorrupted PDF."
        ) from exc

    pages = []

    for page in reader.pages:
        extracted = page.extract_text()

        if extracted:
            pages.append(extracted)

    return "\n\n".join(pages).strip()

def parse_docx(content: bytes) -> str:
    try:
        document = Document(BytesIO(content))
    except (BadZipFile, ValueError, KeyError) as exc:
        raise ValueError(
            "The uploaded DOCX file could not be read. "
            "Please upload a valid, uncorrupted DOCX file."
        ) from exc

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
