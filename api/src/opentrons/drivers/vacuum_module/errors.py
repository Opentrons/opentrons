"""Vacuum Module-specific errors and exceptions."""

from opentrons.drivers.asyncio.communication.errors import (
    BaseErrorCode,
    ErrorResponse,
    GCodeCacheFull,
    TaskNotReady,
    UnhandledGcode,
)


class PressureNotReached(ErrorResponse):
    """Raised when the target pressure is not reached."""

    def __init__(self, port: str, response: str, command: str) -> None:
        super().__init__(port, response, command)


class WasteContainerFull(ErrorResponse):
    """Raised when the waste container is full."""

    def __init__(self, port: str, response: str, command: str) -> None:
        super().__init__(port, response, command)


class FailedToVent(ErrorResponse):
    """Raised when the system fails to actuate the vent solenoid."""

    def __init__(self, port: str, response: str, command: str) -> None:
        super().__init__(port, response, command)


class VacuumModuleErrorCodes(BaseErrorCode):
    """Vacuum Module Error Codes."""

    UNHANDLED_GCODE = ("ERR003", UnhandledGcode)
    GCODE_CACHE_FULL = ("ERR004", GCodeCacheFull)
    TASK_NOT_READY = ("ERR007", TaskNotReady)
    PRESSURE_NOT_REACHED = ("ERR400", PressureNotReached)
    WASTE_FULL = ("ERR401", WasteContainerFull)
    FAILED_TO_VENT = ("ERR402", FailedToVent)