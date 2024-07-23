"""Unit tests for `error_recovery_mapping`."""
import pytest
from decoy import Decoy

from opentrons.protocol_engine.commands.command import (
    DefinedErrorData,
)
from opentrons.protocol_engine.commands.command_unions import CommandDefinedErrorData
from opentrons.protocol_engine.commands.liquid_probe import LiquidProbe
from opentrons.protocol_engine.error_recovery_policy import ErrorRecoveryType
from opentrons.protocol_engine.state.config import Config
from opentrons.protocol_engine.types import DeckType
from robot_server.runs.error_recovery_mapping import (
    create_error_recovery_policy_from_rules,
)
from robot_server.runs.error_recovery_models import (
    ErrorRecoveryRule,
    MatchCriteria
)


@pytest.fixture
def mock_command(decoy: Decoy) -> LiquidProbe:
    """Get a mock PickUpTip command."""
    mock = decoy.mock(cls=LiquidProbe)
    return mock


@pytest.fixture
def mock_error_data(decoy: Decoy) -> CommandDefinedErrorData:
    """Get a mock TipPhysicallyMissingError."""
    mock = decoy.mock(cls=DefinedErrorData)
    return mock


@pytest.fixture
def mock_criteria(decoy: Decoy) -> MatchCriteria:
    """Get a mock Match Criteria."""
    mock = decoy.mock(cls=MatchCriteria)
    decoy.when(mock.command.commandType).then_return("liquidProbe")
    decoy.when(mock.command.error.errorType).then_return()
    return mock


@pytest.fixture
def mock_rule(decoy: Decoy, mock_criteria: MatchCriteria) -> ErrorRecoveryRule:
    """Get a mock ErrorRecoveryRule."""
    mock = decoy.mock(cls=ErrorRecoveryRule)
    decoy.when(mock.matchCriteria).then_return([mock_criteria])
    return mock


def test_create_error_recovery_policy_with_rules(
    decoy: Decoy,
    mock_command: LiquidProbe,
    mock_error_data: CommandDefinedErrorData,
    mock_rule: ErrorRecoveryRule,
) -> None:
    """Should return IGNORE_AND_CONTINUE if that's what we specify as the rule."""
    policy = create_error_recovery_policy_from_rules([mock_rule])
    exampleConfig = Config(
        robot_type="OT-3 Standard",
        deck_type=DeckType.OT3_STANDARD,
    )
    assert policy(exampleConfig, mock_command, mock_error_data)


def test_create_error_recovery_policy_undefined_error(
    decoy: Decoy, mock_command: LiquidProbe
) -> None:
    """Should return a FAIL_RUN policy when error is not defined."""
    rule1 = ErrorRecoveryRule(matchCriteria=[], ifMatch=[])

    policy = create_error_recovery_policy_from_rules([rule1])
    exampleConfig = Config(
        robot_type="OT-3 Standard",
        deck_type=DeckType.OT3_STANDARD,
    )

    assert policy(exampleConfig, mock_command, None) == ErrorRecoveryType.FAIL_RUN


def test_create_error_recovery_policy_defined_error(
    decoy: Decoy, mock_command: LiquidProbe, mock_error_data: CommandDefinedErrorData
) -> None:
    """Should return a WAIT_FOR_RECOVERY policy when error is defined."""
    rule1 = ErrorRecoveryRule(matchCriteria=[], ifMatch=[])

    policy = create_error_recovery_policy_from_rules([rule1])
    exampleConfig = Config(
        robot_type="OT-3 Standard",
        deck_type=DeckType.OT3_STANDARD,
    )

    assert (
        policy(exampleConfig, mock_command, mock_error_data)
        == ErrorRecoveryType.WAIT_FOR_RECOVERY
    )
