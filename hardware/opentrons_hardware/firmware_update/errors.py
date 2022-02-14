"""Firmware update exceptions."""
from opentrons_ot3_firmware.messages import MessageDefinition


class FirmwareUpdateException(Exception):
    """Base exception."""

    pass


class ErrorResponse(FirmwareUpdateException):
    """Error response exception."""

    message: MessageDefinition

    def __init__(self, message: MessageDefinition) -> None:
        """Constructor."""
        self.message = message
        super().__init__(f"Got error response {message}.")


class TimeoutResponse(FirmwareUpdateException):
    """No response exception."""

    message: MessageDefinition

    def __init__(self, message: MessageDefinition) -> None:
        """Constructor."""
        self.message = message
        super().__init__(f"Timed out waiting for response to {message}")


class BootloaderNotReady(FirmwareUpdateException):
    """Bootloader is not ready."""

    pass
