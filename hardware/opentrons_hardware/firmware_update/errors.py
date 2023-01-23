"""Firmware update exceptions."""
from api.src.opentrons.hardware_control.types import OT3SubSystem
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

class MustUpdateFirmware(FirmwareUpdateException):
    """At least one subsystem requires an update."""

    subsystem: OT3SubSystem

    def __init__(self, subsystem: OT3SubSystem) -> None:
        self.subsystem = subsystem
        super().__init__(f"Operation not permited because subsystem {subsystem} requires an update.")
