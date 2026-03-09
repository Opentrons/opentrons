"""Firmware update exceptions."""
from typing import Optional, Sequence
from opentrons_shared_data.errors.exceptions import (
    FirmwareUpdateFailedError,
    EnumeratedError,
)
from opentrons_hardware.firmware_bindings.messages import MessageDefinition
from opentrons_hardware.firmware_bindings import FirmwareTarget


class ErrorResponse(FirmwareUpdateFailedError):
    """Error response exception."""

    def __init__(
        self,
        error_message: MessageDefinition,
        target: FirmwareTarget,
    ) -> None:
        """Build an ErrorResponse."""
        super().__init__(
            message="Error response during firmware update",
            detail={"node": target.application_for().name, "error": str(error_message)},
        )


class TimeoutResponse(FirmwareUpdateFailedError):
    """No response exception."""

    def __init__(
        self,
        message: MessageDefinition,
        target: FirmwareTarget,
    ) -> None:
        """Build a TimeoutResponse."""
        super().__init__(
            message="Device response timeout during firmware update",
            detail={
                "node": target.application_for().name,
                "message": str(message),
            },
        )


class BootloaderNotReady(FirmwareUpdateFailedError):
    """Bootloader is not ready."""

    def __init__(
        self,
        target: FirmwareTarget,
        wrapping: Optional[Sequence[EnumeratedError]] = None,
    ) -> None:
        """Build a BootloaderNotReady."""
        super().__init__(
            message="Device did not enter bootloader for firmware update",
            detail={
                "node": target.application_for().name,
            },
            wrapping=wrapping,
        )
