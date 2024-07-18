"""Functions used for managing error recovery policy."""
from robot_server.runs.error_recovery_models import ErrorRecoveryRule, valueMatchType
from opentrons.protocol_engine.commands.command_unions import (
    Command,
    CommandDefinedErrorData,
)
from opentrons.protocol_engine.error_recovery_policy import (
    ErrorRecoveryPolicy,
    ErrorRecoveryType,
    standard_run_policy,
)
from opentrons.protocol_engine.state.config import Config
from typing import Optional


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
            command_type_matches = failed_command.commandType == rule.commandType
            error_type_matches = (
                defined_error_data is not None
                and defined_error_data.public.errorType == rule.errorType
            )
            if command_type_matches and error_type_matches:
                if rule.ifMatch == valueMatchType.IGNORE_AND_CONTINUE:
                    raise NotImplementedError  # No protocol engine support for this yet. It's in another ticket.
                elif rule.ifMatch == valueMatchType.FAIL_RUN:
                    return ErrorRecoveryType.FAIL_RUN
                elif rule.ifMatch == valueMatchType.WAIT_FOR_RECOVERY:
                    return ErrorRecoveryType.WAIT_FOR_RECOVERY

        return standard_run_policy(config, failed_command, defined_error_data)

    return policy
