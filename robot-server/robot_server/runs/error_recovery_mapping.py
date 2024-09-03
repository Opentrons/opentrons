"""Functions used for managing error recovery policy."""
from typing import Optional
from opentrons.protocol_engine.state.config import Config
from robot_server.runs.error_recovery_models import ErrorRecoveryRule, ReactionIfMatch
from opentrons.protocol_engine.commands.command_unions import (
    Command,
    CommandDefinedErrorData,
)
from opentrons.protocol_engine.error_recovery_policy import (
    ErrorRecoveryPolicy,
    ErrorRecoveryType,
)


def create_error_recovery_policy_from_rules(
    rules: list[ErrorRecoveryRule],
) -> ErrorRecoveryPolicy:
    """Given a list of error recovery rules return an error recovery policy."""

    def _policy(
        config: Config,
        failed_command: Command,
        defined_error_data: Optional[CommandDefinedErrorData],
    ) -> ErrorRecoveryType:
        for rule in rules:
            command_type_matches = (
                failed_command.commandType == rule.matchCriteria.command.commandType
            )
            error_type_matches = (
                defined_error_data is not None
                and defined_error_data.public.errorType
                == rule.matchCriteria.command.error.errorType
            )

            if command_type_matches and error_type_matches:
                if rule.ifMatch == ReactionIfMatch.IGNORE_AND_CONTINUE:
                    return ErrorRecoveryType.IGNORE_AND_CONTINUE
                elif rule.ifMatch == ReactionIfMatch.FAIL_RUN:
                    return ErrorRecoveryType.FAIL_RUN
                elif rule.ifMatch == ReactionIfMatch.WAIT_FOR_RECOVERY:
                    return ErrorRecoveryType.WAIT_FOR_RECOVERY

        return default_error_recovery_policy(config, failed_command, defined_error_data)

    return _policy


def default_error_recovery_policy(
    config: Config,
    failed_command: Command,
    defined_error_data: Optional[CommandDefinedErrorData],
) -> ErrorRecoveryType:
    """The `ErrorRecoveryPolicy` to use when none has been set on a run.

    This is only appropriate for normal protocol runs, not maintenance runs,
    since it assumes
    """
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
