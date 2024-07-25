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
    """Stop and wait for the error to be recovered from manually."""

    IGNORE_AND_CONTINUE = enum.auto()
    """Continue with the run, as if the command never failed."""


class ErrorRecoveryPolicy(Protocol):
    """An interface to decide how to handle a command failure.

    This describes a function that Protocol Engine calls after each command failure,
    with the details of that failure. The implementation should inspect those details
    and return an appropriate `ErrorRecoveryType`.

    Args:
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


# todo(mm, 2024-07-05): This "static" policy will need to somehow become dynamic for
# https://opentrons.atlassian.net/browse/EXEC-589.
def standard_run_policy(
    config: Config,
    failed_command: Command,
    defined_error_data: Optional[CommandDefinedErrorData],
) -> ErrorRecoveryType:
    """An error recovery policy suitable for normal protocol runs via robot-server."""
    # Although error recovery can theoretically work on OT-2s, we haven't tested it,
    # and it's generally scarier because the OT-2 has much less hardware feedback.
    robot_is_flex = config.robot_type == "OT-3 Standard"
    # If the error is defined, we're taking that to mean that we should
    # WAIT_FOR_RECOVERY. This is not necessarily the right long-term logic--we might
    # want to FAIL_RUN on certain defined errors and WAIT_FOR_RECOVERY on certain
    # undefined errors--but this is convenient for now.
    error_is_defined = defined_error_data is not None
    if robot_is_flex and error_is_defined:
        return ErrorRecoveryType.WAIT_FOR_RECOVERY
    else:
        return ErrorRecoveryType.FAIL_RUN


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
