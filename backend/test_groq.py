from langchain_groq import ChatGroq
from pydantic import SecretStr

from app.ai.schemas import DeviationExtraction
from app.config import settings


llm = ChatGroq(
    model=settings.groq_model,
    api_key=SecretStr(settings.groq_api_key),
    temperature=0,
)


structured_llm = llm.with_structured_output(
    DeviationExtraction
)


result = structured_llm.invoke(
    """
    A temperature excursion occurred on 20 September 2026
    at the API Manufacturing Unit.

    During manufacturing of API-ABC batch B2026-091,
    reactor temperature reached 82°C while the approved
    operating range was 75°C to 80°C.

    The excursion lasted approximately 18 minutes and
    the batch was placed on hold.
    """
)


validated = DeviationExtraction.model_validate(result)

print("\nRAW RESULT:")
print(result)

print("\nVALIDATED RESULT:")
print(validated)

print("\nJSON:")
print(validated.model_dump())