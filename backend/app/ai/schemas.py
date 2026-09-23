from datetime import date
from typing import Literal

from pydantic import BaseModel, Field


Severity = Literal["Critical", "Major", "Minor"]


class DeviationExtraction(BaseModel):
    site: str = Field(
        default="",
        description="Manufacturing site or plant where the deviation occurred.",
    )

    date_of_occurrence: str = Field(
        default="",
        description="Date when the deviation occurred, preferably YYYY-MM-DD.",
    )

    title: str = Field(
        default="",
        description="Short descriptive title of the deviation.",
    )

    source: str = Field(
        default="",
        description="Source or department responsible for reporting the deviation.",
    )

    product_material: str = Field(
        default="",
        description="Affected product, API, raw material, or material.",
    )

    batch_lot_number: str = Field(
        default="",
        description="Affected batch or lot number.",
    )

    description: str = Field(
        default="",
        description="Detailed description of what happened, when, where, and how it was detected.",
    )

    initial_impact: str = Field(
        default="",
        description="Potential or observed impact described in the source material.",
    )

    initial_severity: Severity | None = Field(
        default=None,
        description="Initial severity if explicitly stated or reasonably supported.",
    )


class ImpactAssessment(BaseModel):
    impact: str = Field(
        description="Concise description of the potential impact."
    )

    reason: str = Field(
        description="Short evidence-based reason for the impact assessment."
    )


class SeverityAssessment(BaseModel):
    severity: Severity = Field(
        description="Recommended deviation severity."
    )

    reason: str = Field(
        description="Short evidence-based reason for the severity recommendation."
    )


class DeviationAIResult(BaseModel):
    deviation: DeviationExtraction
    impact: ImpactAssessment
    severity: SeverityAssessment