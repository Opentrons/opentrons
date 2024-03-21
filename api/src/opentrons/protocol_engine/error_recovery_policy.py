# noqa: D100

import enum
from typing import Protocol

from opentrons_shared_data.errors import EnumeratedError, ErrorCodes

from opentrons.config import feature_flags as ff
from opentrons.protocol_engine.commands import Command


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
    """

    @staticmethod
    def __call__(  # noqa: D102
        failed_command: Command, exception: Exception
    ) -> ErrorRecoveryType:
        ...


def error_recovery_by_ff(
    failed_command: Command, exception: Exception
) -> ErrorRecoveryType:
    """Use API feature flags to decide how to handle an error.

    This is just for development. This should be replaced by a proper config
    system exposed through robot-server's HTTP API.
    """
    # todo(mm, 2024-03-18): Do we need to do anything explicit here to disable
    # error recovery on the OT-2?
    if ff.enable_error_recovery_experiments() and _is_recoverable(
        failed_command, exception
    ):
        return ErrorRecoveryType.WAIT_FOR_RECOVERY
    else:
        return ErrorRecoveryType.FAIL_RUN


def _is_recoverable(failed_command: Command, exception: Exception) -> bool:
    if (
        failed_command.commandType == "pickUpTip"
        and isinstance(exception, EnumeratedError)
        # Hack(?): It seems like this should be ErrorCodes.TIP_PICKUP_FAILED, but that's
        # not what gets raised in practice.
        and exception.code == ErrorCodes.UNEXPECTED_TIP_REMOVAL
    ):
        return True
    else:
        return False
