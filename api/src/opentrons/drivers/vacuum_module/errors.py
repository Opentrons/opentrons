"""Vacuum Module-specific errors and exceptions."""

from opentrons.drivers.asyncio.communication.errors import (
    BaseErrorCode,
    ErrorResponse,
    GCodeCacheFull,
    TaskNotReady,
    UnhandledGcode,
)


class EStopTriggered(ErrorResponse):
    """Raised when the estop is triggered during a module action."""

    def __init__(self, port: str, response: str, command: str) -> None:
        super().__init__(port, response, command)


class PumpMotorError(ErrorResponse):
    """Raised when pump motor error is received."""

    def __init__(self, port: str, response: str, command: str) -> None:
        super().__init__(port, response, command)


class StopRequested(ErrorResponse):
    """Raised when a stop is requested during a module action."""

    def __init__(self, port: str, response: str, command: str) -> None:
        super().__init__(port, response, command)


class VacuumModuleErrorCodes(BaseErrorCode):
    """Vacuum Module Error Codes."""

    UNHANDLED_GCODE = ("ERR003", UnhandledGcode)
    GCODE_CACHE_FULL = ("ERR004", GCodeCacheFull)
    TASK_NOT_READY = ("ERR007", TaskNotReady)
    STOP_REQUESTED = ("ERR504", StopRequested)
