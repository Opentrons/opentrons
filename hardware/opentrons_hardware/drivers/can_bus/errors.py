"""Can bus errors."""

from opentrons_hardware.firmware_bindings.constants import ErrorCode, ErrorSeverity


class CanError(Exception):
    """Can bus error."""

    def __init__(self, message: str) -> None:
        """Constructor."""
        super().__init__(message)


class ErrorFrameCanError(CanError):
    """An error frame was received on the can bus."""

    pass


class AsyncHardwareError(RuntimeError):
    """An error generated from firmware that was not caused by a command sent from hardware controller."""

    def __init__(
        self, description: str, error_code: ErrorCode, error_severity: ErrorSeverity
    ) -> None:
        """Build an async error."""
        self.description = description
        self.error_code = error_code
        self.error_severity = error_severity
