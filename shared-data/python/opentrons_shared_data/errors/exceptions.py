"""Exception hierarchy for error codes."""

from .codes import ErrorCodes


class EnumeratedError(Exception):
    """The root class of error-code-bearing exceptions."""

    def __init__(self, code: ErrorCodes) -> None:
        """Build an EnumeratedError."""
        self.code = code

    def __repr__(self) -> str:
        """Get a representative string for the exception."""
        return f"<{self.code.value.code}: {self.code.value.detail}>"
