from pydantic import BaseModel, ConfigDict
from datetime import date, datetime
from app.ai.schemas import DeviationExtraction

class AssessmentResponse(BaseModel):
    impact: str
    impact_reason: str

    severity: str
    severity_reason: str

class DeviationAnalysisResponse(BaseModel):
    success: bool
    deviation: DeviationExtraction
    assessment: AssessmentResponse

class DeviationCreate(BaseModel):
    site: str
    date_of_occurrence: date
    title: str
    source: str
    product_material: str
    batch_lot_number: str
    description: str
    initial_impact: str
    initial_severity: str

    ai_impact: str | None = None
    ai_impact_reason: str | None = None
    ai_severity: str | None = None
    ai_severity_reason: str | None = None

class DeviationUpdate(DeviationCreate):
    pass


class DeviationResponse(DeviationCreate):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )
