"""Functions used for managing error recovery policy."""
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
    enabled: bool,
) -> ErrorRecoveryPolicy:
    """Map a robot-server error recovery policy to an opentrons.protocol_engine one.

    In its HTTP API, robot-server expresses error recovery policies as Pydantic models.
    But opentrons.protocol_engine is more general, expressing them as Python callables.

    Args:
        rules: The rules in the robot-server error recovery policy.
        enabled: Whether error recovery should be enabled at all.
            If `False`, `rules` is ignored.

    Returns:
        An error recovery policy in `opentrons.protocol_engine` terms.
    """

    def mapped_policy(
        config: Config,
        failed_command: Command,
        defined_error_data: CommandDefinedErrorData | None,
    ) -> ErrorRecoveryType:
        first_matching_rule = next(
            (
                rule
                for rule in rules
                if _rule_matches_error(rule, failed_command, defined_error_data)
            ),
            None,
        )
        robot_is_flex = config.robot_type == "OT-3 Standard"
        error_is_defined = defined_error_data is not None

        if not enabled:
            return ErrorRecoveryType.FAIL_RUN
        elif not robot_is_flex:
            # Although error recovery can theoretically work on OT-2s, we haven't tested
            # it, and it's generally scarier because the OT-2 has much less hardware
            # feedback.
            return ErrorRecoveryType.FAIL_RUN
        elif first_matching_rule is not None:
            # The input policy explicitly deals this error, so do what it says.
            return _map_error_recovery_type(first_matching_rule.ifMatch)
        else:
            # The input policy doesn't explicitly deal with this error, so the decision
            # is our own.
            #
            # We try to WAIT_FOR_RECOVERY whenever we can, for two reasons:
            #
            # 1. It matches the frontend's current expectations.
            #    For example, the frontend expects us to WAIT_FOR_RECOVERY on
            #    overpressure errors, but it does not send us an error recovery policy
            #    that explicitly says that; it relies on this default.
            # 2. Philosophically, we always want to give the operator a shot at
            #    recovery, even if we don't know the details of the problem and can't
            #    guarantee good robot behavior if they keep using it.
            #
            # We currently FAIL_RUN for undefined errors, with the thinking that they
            # are especially likely to have messed something up in Protocol Engine's
            # internal state, and that they are especially likely to cause confusing
            # behavior. But we might want to change that--see point (2) above.
            return (
                ErrorRecoveryType.WAIT_FOR_RECOVERY
                if error_is_defined
                else ErrorRecoveryType.FAIL_RUN
            )

    return mapped_policy


def _rule_matches_error(
    rule: ErrorRecoveryRule,
    failed_command: Command,
    defined_error_data: CommandDefinedErrorData | None,
) -> bool:
    command_type_matches = (
        failed_command.commandType == rule.matchCriteria.command.commandType
    )
    error_type_matches = (
        defined_error_data is not None
        and defined_error_data.public.errorType
        == rule.matchCriteria.command.error.errorType
    )
    return command_type_matches and error_type_matches


def _map_error_recovery_type(reaction_if_match: ReactionIfMatch) -> ErrorRecoveryType:
    match reaction_if_match:
        case ReactionIfMatch.IGNORE_AND_CONTINUE:
            return ErrorRecoveryType.IGNORE_AND_CONTINUE
        case ReactionIfMatch.ASSUME_FALSE_POSITIVE_AND_CONTINUE:
            # todo(mm, 2024-10-23): Connect to work in
            # https://github.com/Opentrons/opentrons/pull/16556.
            return ErrorRecoveryType.IGNORE_AND_CONTINUE
        case ReactionIfMatch.FAIL_RUN:
            return ErrorRecoveryType.FAIL_RUN
        case ReactionIfMatch.WAIT_FOR_RECOVERY:
            return ErrorRecoveryType.WAIT_FOR_RECOVERY
