# noqa: D100

from __future__ import annotations

import enum
from typing import Optional, Protocol, TYPE_CHECKING

if TYPE_CHECKING:
    from opentrons.protocol_engine.commands import (
        Command,
        CommandDefinedErrorData,
    )
    from opentrons.protocol_engine.state.config import Config


class ErrorRecoveryType(enum.Enum):
    """Ways to handle a command failure."""

    FAIL_RUN = enum.auto()
    """Permanently fail the entire run.

    TODO(mm, 2024-03-18): This might be a misnomer because failing the run is not
    a decision that's up to Protocol Engine. It's decided by what the caller supplies
    to `ProtocolEngine.finish()`. For example, a Python protocol can
    theoretically swallow the exception and continue on.
    """

    WAIT_FOR_RECOVERY = enum.auto()
    """Enter interactive error recovery mode."""

    CONTINUE_WITH_ERROR = enum.auto()
    """Continue without interruption, carrying on from whatever error state the failed
    command left the engine in.

    This is like `ProtocolEngine.resume_from_recovery(reconcile_false_positive=False)`.
    """

    ASSUME_FALSE_POSITIVE_AND_CONTINUE = enum.auto()
    """Continue without interruption, acting as if the underlying error was a false positive.

    This is like `ProtocolEngine.resume_from_recovery(reconcile_false_positive=True)`.
    """


class ErrorRecoveryPolicy(Protocol):
    """An interface to decide how to handle a command failure.

    This describes a function that Protocol Engine calls after each command failure,
    with the details of that failure. The implementation should inspect those details
    and return an appropriate `ErrorRecoveryType`.

    Args:
        config: The config of the calling `ProtocolEngine`.
        failed_command: The command that failed, in its final `status=="failed"` state.
        defined_error_data: If the command failed with a defined error, details about
            that error. If the command failed with an undefined error, `None`.
            By design, this callable isn't given details about undefined errors,
            since it would be fragile to rely on them.
    """

    @staticmethod
    def __call__(  # noqa: D102
        config: Config,
        failed_command: Command,
        defined_error_data: Optional[CommandDefinedErrorData],
    ) -> ErrorRecoveryType:
        ...


def never_recover(
    config: Config,
    failed_command: Command,
    defined_error_data: Optional[CommandDefinedErrorData],
) -> ErrorRecoveryType:
    """An error recovery policy where error recovery is never attempted.

    This makes sense for things like the `opentrons_simulate` and `opentrons_execute`
    CLIs. Those don't expose any way to bring the run out of recovery mode after it's
    been entered, so we need to avoid entering recovery mode in the first place.
    """
    return ErrorRecoveryType.FAIL_RUN
