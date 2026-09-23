from typing import TypedDict

class DeviationState(TypedDict, total=False):
    source_text: str
    extracted_data: dict
    impact: str
    impact_reason: str
    severity: str
    severity_reason: str
    error: str