"""Firmware upgrade exceptions."""
from opentrons_ot3_firmware.constants import ErrorCode
from opentrons_ot3_firmware.messages import MessageDefinition


class FirmwareUpgradeException(Exception):
    """Base exception."""

    pass


class ErrorResponse(FirmwareUpgradeException):
    """Error response exception."""

    error_code: ErrorCode

    def __init__(self, error_code: ErrorCode) -> None:
        """Constructor."""
        self.error_code = error_code
        super().__init__(f"Got error response: {error_code}")


class TimeoutResponse(FirmwareUpgradeException):
    """No response exception."""

    message: MessageDefinition

    def __init__(self, message: MessageDefinition) -> None:
        """Constructor."""
        self.message = message
        super().__init__(f"Timed out waiting for response to : {message}")
