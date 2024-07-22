"""Unit tests for `error_recovery_mapping`."""
from datetime import datetime

from pydantic import BaseModel
from opentrons.protocol_engine.commands.command import BaseCommand, CommandStatus
from opentrons.protocol_engine.commands.pick_up_tip import TipPhysicallyMissingError
from opentrons.protocol_engine.error_recovery_policy import ErrorRecoveryType
from opentrons.protocol_engine.state.config import Config
from opentrons.protocol_engine.types import DeckType
from robot_server.runs.error_recovery_mapping import (
    create_error_recovery_policy_from_rules,
)
from robot_server.runs.error_recovery_models import ErrorRecoveryRule


def test_create_error_recovery_policy_undefined_error() -> None:
    rule1 = ErrorRecoveryRule(matchCriteria=[], ifMatch=[])

    policy = create_error_recovery_policy_from_rules([rule1])
    exampleConfig = Config(
        robot_type="OT-3 Standard",
        deck_type=DeckType.OT3_STANDARD,
    )

    exampleCommand = BaseCommand(
        id="command-id",
        createdAt=datetime.now(),
        commandType="command-type",
        key="command-key",
        status=CommandStatus.RUNNING,
        params=BaseModel(),
    )

    assert policy(exampleConfig, exampleCommand, None) == ErrorRecoveryType.FAIL_RUN


def test_create_error_recovery_policy_defined_error() -> None:
    rule1 = ErrorRecoveryRule(matchCriteria=[], ifMatch=[])

    policy = create_error_recovery_policy_from_rules([rule1])
    exampleConfig = Config(
        robot_type="OT-3 Standard",
        deck_type=DeckType.OT3_STANDARD,
    )

    exampleCommand = BaseCommand(
        id="command-id",
        createdAt=datetime.now(),
        commandType="command-type",
        key="command-key",
        status=CommandStatus.RUNNING,
        params=BaseModel(),
    )

    assert (
        policy(exampleConfig, exampleCommand, TipPhysicallyMissingError)
        == ErrorRecoveryType.WAIT_FOR_RECOVERY
    )
