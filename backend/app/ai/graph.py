from typing import Any
from pydantic import SecretStr
from langchain_groq import ChatGroq
from langgraph.graph import END, START, StateGraph

from app.ai.prompts import (
    EXTRACTION_SYSTEM_PROMPT,
    IMPACT_SYSTEM_PROMPT,
    SEVERITY_SYSTEM_PROMPT,
)
from app.ai.schemas import (
    DeviationExtraction,
    ImpactAssessment,
    SeverityAssessment,
)
from app.ai.state import DeviationState
from app.ai.retry import retry
from app.config import settings
from app.services.text_normalizer import normalize_text


llm = ChatGroq(
    model=settings.groq_model,
    api_key=SecretStr(settings.groq_api_key),
    temperature=0,
)


extraction_llm = llm.with_structured_output(
    DeviationExtraction
)

impact_llm = llm.with_structured_output(
    ImpactAssessment
)

severity_llm = llm.with_structured_output(
    SeverityAssessment
)


def extract_deviation(
    state: DeviationState,
) -> DeviationState:
    source_text = normalize_text(
        state.get("source_text") or ""
    )

    if not source_text:
        raise ValueError(
            "Source material is empty."
        )

    if len(source_text) > settings.max_source_characters:
        raise ValueError(
            "Source material exceeds the maximum "
            "allowed length."
        )

    def run():
        prompt = f"""
{EXTRACTION_SYSTEM_PROMPT}

SOURCE MATERIAL:

{source_text}
"""

        raw_result: Any = extraction_llm.invoke(
            prompt
        )

        result = DeviationExtraction.model_validate(
            raw_result
        )

        return result

    result = retry(run)

    return {
        **state,
        "source_text": source_text,
        "extracted_data": result.model_dump(),
    }


def assess_impact(
    state: DeviationState,
) -> DeviationState:
    extracted = state.get("extracted_data")

    def run():
        prompt = f"""
{IMPACT_SYSTEM_PROMPT}

DEVIATION INFORMATION:

{extracted}
"""

        raw_result: Any = impact_llm.invoke(
            prompt
        )

        return ImpactAssessment.model_validate(
            raw_result
        )

    result = retry(run)

    return {
        **state,
        "impact": result.impact,
        "impact_reason": result.reason,
    }


def assess_severity(
    state: DeviationState,
) -> DeviationState:
    extracted = state.get("extracted_data")

    def run():
        prompt = f"""
{SEVERITY_SYSTEM_PROMPT}

DEVIATION INFORMATION:

{extracted}

AI IMPACT ASSESSMENT:

{state.get("impact", "")}

IMPACT REASON:

{state.get("impact_reason", "")}
"""

        raw_result: Any = severity_llm.invoke(
            prompt
        )

        return SeverityAssessment.model_validate(
            raw_result
        )

    result = retry(run)

    return {
        **state,
        "severity": result.severity,
        "severity_reason": result.reason,
    }


def build_deviation_graph():
    graph = StateGraph(DeviationState)

    graph.add_node(
        "extract_deviation",
        extract_deviation,
    )

    graph.add_node(
        "assess_impact",
        assess_impact,
    )

    graph.add_node(
        "assess_severity",
        assess_severity,
    )

    graph.add_edge(
        START,
        "extract_deviation",
    )

    graph.add_edge(
        "extract_deviation",
        "assess_impact",
    )

    graph.add_edge(
        "assess_impact",
        "assess_severity",
    )

    graph.add_edge(
        "assess_severity",
        END,
    )

    return graph.compile()

deviation_graph = build_deviation_graph()