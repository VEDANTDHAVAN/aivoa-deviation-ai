class AIAnalysisError(Exception):
    """Raised when AI analysis cannot produce a valid result."""
    def __init__(
        self, message: str,
        stage: str | None = None,
    ):
        self.message = message
        self.stage = stage

        super().__init__(message)