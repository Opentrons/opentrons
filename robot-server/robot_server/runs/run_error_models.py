"""Run error models."""


class RunStoppedError(ValueError):
    """Error raised when a given Run ID engine has stopped."""

    def __init__(self, run_id: str) -> None:
        """Initialize the error message from the missing ID."""
        super().__init__(f"Run {run_id} has stopped.")
