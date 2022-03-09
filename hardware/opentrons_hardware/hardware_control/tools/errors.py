"""Tool detection exceptions."""
from opentrons_hardware.firmware_bindings.messages import MessageDefinition


class ToolDetectionException(Exception):
    """Base exception."""

    pass


class ErrorResponse(ToolDetectionException):
    """Error response exception."""

    message: MessageDefinition

    def __init__(self, message: MessageDefinition) -> None:
        """Constructor."""
        self.message = message
        super().__init__(f"Got error response {message}.")


class TimeoutResponse(ToolDetectionException):
    """No response exception."""

    message: MessageDefinition

    def __init__(self, message: MessageDefinition) -> None:
        """Constructor."""
        self.message = message
        super().__init__(f"Timed out waiting for response to {message}")


class ToolDetectionFailure(ToolDetectionException):
    """Tool detection failed."""

    pass
