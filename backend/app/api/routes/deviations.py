from typing import Annotated

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.ai.graph import deviation_graph
from app.services.document_parser import parse_document

router = APIRouter(
    prefix="/api/deviations", tags=["Deviations"],
)

@router.post("analyze")
async def analyze_deviation(
    text: Annotated[str | None, Form()] = None,
    file: UploadFile | None = File(default=None),
):
    try:
        source_text = ""
        # Text input
        if text and text.strip():
            source_text = text.strip()

        # File input
        if file:
            content = await file.read()

            source_text = parse_document(
                file.filename or "", content,
            )

        if not source_text:
            raise HTTPException(
                status_code=400, detail=(
                    "Provide deviation text or upload "
                    "a PDF, DOCX, or TXT file."
                ),
            )

        if len(source_text) < 20:
            raise HTTPException(
                status_code=400, detail="The provided source material is too short.",
            )

        result = deviation_graph.invoke(
            {
                "source_text": source_text,
            }
        )

        return {
            "success": True, "data": {
                "deviation": result["extracted_data"],
                "assessment": {
                    "impact": result.get("impact", ""),
                    "impact_reason": result.get("impact_reason", ""),
                    "severity": result.get("severity", ""),
                    "severity_reason": result.get("severity_reason", ""),
                },
            },
        }

    except HTTPException:
        raise

    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"AI analysis failed: {str(exc)}",
        ) from exc