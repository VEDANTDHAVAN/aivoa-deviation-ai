from pydantic import BaseModel

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