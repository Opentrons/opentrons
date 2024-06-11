# noqa: D100

import enum
from typing import Optional, Protocol

from opentrons.config import feature_flags as ff
from opentrons.protocol_engine.commands import (
    Command,
    CommandDefinedErrorData,
)


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

    # TODO(mm, 2023-03-18): Add something like this for
    # https://opentrons.atlassian.net/browse/EXEC-302.
    # CONTINUE = enum.auto()
    # """Continue with the run, as if the command never failed."""


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
        failed_command: Command, defined_error_data: Optional[CommandDefinedErrorData]
    ) -> ErrorRecoveryType:
        ...


def error_recovery_by_ff(
    failed_command: Command, defined_error_data: Optional[CommandDefinedErrorData]
) -> ErrorRecoveryType:
    """Use API feature flags to decide how to handle an error.

    This is just for development. This should be replaced by a proper config
    system exposed through robot-server's HTTP API.
    """
    # todo(mm, 2024-03-18): Do we need to do anything explicit here to disable
    # error recovery on the OT-2?
    error_is_defined = defined_error_data is not None
    # If the error is defined, we're taking that to mean that we should
    # WAIT_FOR_RECOVERY. This is not necessarily the right production logic--we might
    # want to FAIL_RUN on certain defined errors and WAIT_FOR_RECOVERY on certain
    # undefined errors--but this is convenient for development.
    if ff.enable_error_recovery_experiments() and error_is_defined:
        return ErrorRecoveryType.WAIT_FOR_RECOVERY
    else:
        return ErrorRecoveryType.FAIL_RUN
