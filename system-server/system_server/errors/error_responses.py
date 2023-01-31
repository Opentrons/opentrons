"""JSON API errors and response models."""
from typing import Any, Dict


class ApiError(Exception):
    """An exception to throw when an endpoint should respond with an error."""

    def __init__(self, status_code: int, content: Dict[str, Any]) -> None:
        """Initialize the exception.

        Arguments:
            status_code: The status code of the response
            content: The JSON response body
        """
        self.status_code = status_code
        self.content = content
