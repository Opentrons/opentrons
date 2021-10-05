"""Can bus errors."""


class CanError(Exception):
    """Can bus error."""

    def __init__(self, message: str) -> None:
        """Constructor."""
        super().__init__(message)


class ErrorFrameCanError(CanError):
    """An error frame was received on the can bus."""

    pass
