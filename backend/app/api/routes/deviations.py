from typing import Annotated

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, Depends, Query
from sqlalchemy.orm import Session

from app.ai.graph import deviation_graph
from app.services.document_parser import parse_document
from app.db.database import get_db
from app.api.schemas import DeviationCreate, DeviationResponse, DeviationUpdate
from app.repositories.deviation_repository import create_deviation, get_deviation, get_deviations, update_deviation

router = APIRouter(
    prefix="/api/deviations", tags=["Deviations"],
)

@router.post("/analyze")
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
                status_code=400, detail={
                    "code": "EMPTY_INPUT",
                    "message": (
                    "Provide deviation text or upload "
                    "a PDF, DOCX, or TXT file."
                    ),
                },
            )

        if len(source_text.strip()) < 20:
            raise HTTPException(
                status_code=400, detail={
                    "code": "INSUFFICIENT_INPUT", "message": 
                        "Provide enough deviation information for AI analysis."
                },
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

    except ValueError as exc:
        raise HTTPException(
            status_code=400, detail={
                "code": "INVALID_INPUT",
                "message": str(exc),
            },
        ) from exc

    except Exception as exc:
        print("Deviation analysis error:", repr(exc))

        raise HTTPException(
            status_code=502, detail={
                "code": "AI_ANALYSIS_FAILED",
                "message": (
                    "The AI analysis could not be completed. Please retry."
                ),
            },
        ) from exc

@router.post("", response_model=DeviationResponse, status_code=201)
def create_single_deviation(data: DeviationCreate, db: Session = Depends(get_db)):
    return create_deviation(db, data)

@router.get(
    "", response_model=list[DeviationResponse],
)
def list_deviations(
    limit: int = Query(
        default=50, ge=1, le=100,
    ),
    offset: int = Query(
        default=0, ge=0,
    ), search: str | None = Query(default=None), severity: str | None = Query(default=None), site: str | None = Query(default=None), db: Session = Depends(get_db),
):
    return get_deviations(db=db, limit=limit, offset=offset, search=search, severity=severity, site=site)

@router.get("/stats")
def deviation_stats(db: Session = Depends(get_db)):
    records = get_deviations(db=db, limit=100000)
    return {"total": len(records), "critical": sum(r.initial_severity == "Critical" for r in records), "major": sum(r.initial_severity == "Major" for r in records), "minor": sum(r.initial_severity == "Minor" for r in records)}

@router.get(
    "/{deviation_id}", 
    response_model=DeviationResponse,
)
def get_single_deviation(
    deviation_id: int, db: Session = Depends(get_db),
):
    deviation = get_deviation(
        db, deviation_id,
    )

    if deviation is None:
        raise HTTPException(
            status_code=404, detail="Deviation not found.",
        )

    return deviation

@router.put("/{deviation_id}", response_model=DeviationResponse)
def update_single_deviation(deviation_id: int, data: DeviationUpdate, db: Session = Depends(get_db)):
    deviation = get_deviation(db, deviation_id)
    if deviation is None:
        raise HTTPException(status_code=404, detail="Deviation not found.")
    return update_deviation(db, deviation, data)
