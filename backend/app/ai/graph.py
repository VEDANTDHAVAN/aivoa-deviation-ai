from typing import Any, cast

from pydantic import SecretStr
from langchain_groq import ChatGroq
from langgraph.graph import END, START, StateGraph

from app.ai.prompts import (
    EXTRACTION_SYSTEM_PROMPT, IMPACT_SYSTEM_PROMPT, SEVERITY_SYSTEM_PROMPT,
)
from app.ai.schemas import (
    DeviationExtraction, ImpactAssessment, SeverityAssessment,
)
from app.ai.state import DeviationState
from app.config import settings

llm = ChatGroq(
    model=settings.groq_model,
    api_key=SecretStr(settings.groq_api_key),
    temperature=0,
)

extraction_llm = llm.with_structured_output(DeviationExtraction)

impact_llm = llm.with_structured_output(ImpactAssessment)

severity_llm = llm.with_structured_output(SeverityAssessment)


def _as_dict(value):
    if value is None:
        return {}
    if hasattr(value, "model_dump"):
        return value.model_dump()
    if hasattr(value, "dict"):
        return value.dict()
    if isinstance(value, dict):
        return value
    return {"value": value}


def extract_deviation(
    state: DeviationState,
) -> DeviationState:
    source_text = state.get('source_text', '')

    prompt = f"""
{EXTRACTION_SYSTEM_PROMPT}

SOURCE MATERIAL:

{source_text}
"""

    result = extraction_llm.invoke(prompt)
    result_data = _as_dict(result)

    return {
        **state, "extracted_data": result_data,
    }


def assess_impact(
    state: DeviationState,
) -> DeviationState:
    extracted = state.get("extracted_data", {})

    prompt = f"""
{IMPACT_SYSTEM_PROMPT}

DEVIATION INFORMATION:

{extracted}
"""

    result = impact_llm.invoke(prompt)
    result_data = _as_dict(result)

    # Ensure we return plain strings for fields expected by DeviationState
    impact = cast(str, result_data.get("impact") or "")
    impact_reason = cast(str, result_data.get("reason") or "")

    return {
        **state,
        "impact": impact,
        "impact_reason": impact_reason,
    }


def assess_severity(
    state: DeviationState,
) -> DeviationState:
    extracted = state.get("extracted_data")

    prompt = f"""
{SEVERITY_SYSTEM_PROMPT}

DEVIATION INFORMATION:

{extracted}

AI IMPACT ASSESSMENT:

{state.get("impact", "")}

IMPACT REASON:

{state.get("impact_reason", "")}
"""

    result = severity_llm.invoke(prompt)
    result_data = _as_dict(result)

    severity = cast(str, result_data.get("severity") or "")
    severity_reason = cast(str, result_data.get("reason") or "")

    return {
        **state,
        "severity": severity,
        "severity_reason": severity_reason,
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