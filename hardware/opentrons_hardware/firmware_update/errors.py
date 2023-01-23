"""Firmware update exceptions."""
from opentrons_hardware.firmware_bindings.messages import MessageDefinition


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

class FirmwareUpdateRequired(FirmwareUpdateException):
    """At least one subsystem requires an update."""

    message: MessageDefinition

    def __init__(self, message: MessageDefinition = "") -> None:
        self.message = message
        super().__init__(f"Operation not permited because a firmware update is required {message}.")

class FirmwareManifestMissing(FirmwareUpdateException):
    """The firmware manifest file was not found."""

    message: MessageDefinition

    def __init__(self, message: MessageDefinition) -> None:
        self.message = message
        super().__init__(f"Firmware update manifest file not found {message}.")
