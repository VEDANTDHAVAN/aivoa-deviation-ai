from collections.abc import Callable
from typing import TypeVar


T = TypeVar("T")


def retry(
    operation: Callable[[], T],
    retries: int = 2,
) -> T:
    last_error: Exception | None = None

    for _ in range(retries + 1):

        try:
            return operation()

        except Exception as exc:
            last_error = exc

    raise last_error or RuntimeError(
        "Operation failed."
    )