"""Run error models."""


class RunStoppedError(ValueError):
    """Error raised when a given Run ID engine has stopped."""

    def __init__(self, run_id: str) -> None:
        """Initialize the error message from the missing ID."""
        super().__init__(f"Run {run_id} has stopped.")


class RunActionNotAllowedError(ValueError):
    """Error raised when a given Run ID action is not allowed."""

    def __init__(self, run_id: str) -> None:
        """Initialize the error message from the missing ID."""
        super().__init__(
            f"Action for run {run_id} is not allowed in current run state."
        )
