"""Errors returned from /system endpoints."""
from robot_server.service.errors import (
    RobotServerError,
    CommonErrorDef,
    ErrorDef,
)


class SystemException(RobotServerError):
    """Base of all system exceptions."""

    pass


class SystemTimeAlreadySynchronized(SystemException):
    """Cannot update system time because it is already set via NTP and/or RTC."""

    def __init__(self, msg: str) -> None:
        """Initialize a SystemTimeAlreadySynchronized error.

        Args:
            msg: Human-readable message describing the failure.
        """
        super().__init__(
            definition=CommonErrorDef.ACTION_FORBIDDEN,
            reason=msg,
        )


class SystemSetTimeException(SystemException):
    """Failure to set system time due to failure in `date` utility."""

    def __init__(self, msg: str, definition: ErrorDef = None) -> None:
        """Initialize a SystemSetTimeException error.

        Args:
            msg: Human-readable message describing the failure.
            definition: An optional error type to use, defaulting to
                INTERNAL_SERVER_ERROR
        """
        if definition is None:
            definition = CommonErrorDef.INTERNAL_SERVER_ERROR

        super().__init__(definition=definition, error=msg)
