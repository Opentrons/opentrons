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
    standard_run_policy,
)


def create_error_recovery_policy_from_rules(
    rules: list[ErrorRecoveryRule],
) -> ErrorRecoveryPolicy:
    """
    Given a "high-level" error recovery policy (a list of rules, as robot-server exposes
    in its HTTP API), return a "low-level" error recovery policy
    """

    def policy(
        config: Config,
        failed_command: Command,
        defined_error_data: Optional[CommandDefinedErrorData],
    ) -> ErrorRecoveryType:
        for rule in rules:
            for i, criteria in enumerate(rule.matchCriteria):
                command_type_matches = (
                    failed_command.commandType == criteria.command.commandType
                )
                error_type_matches = (
                    defined_error_data is not None
                    and defined_error_data.public.errorType == rule.ifMatch[i].value
                )
                if command_type_matches and error_type_matches:
                    if rule.ifMatch == ReactionIfMatch.IGNORE_AND_CONTINUE:
                        raise NotImplementedError  # No protocol engine support for this yet. It's in another ticket.
                    elif rule.ifMatch == ReactionIfMatch.FAIL_RUN:
                        return ErrorRecoveryType.FAIL_RUN
                    elif rule.ifMatch == ReactionIfMatch.WAIT_FOR_RECOVERY:
                        return ErrorRecoveryType.WAIT_FOR_RECOVERY

        return standard_run_policy(config, failed_command, defined_error_data)

    return policy
