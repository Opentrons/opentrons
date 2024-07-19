"""Unit tests for `error_recovery_mapping`."""
import pdb
from opentrons.protocol_engine.error_recovery_policy import ErrorRecoveryPolicy, ErrorRecoveryType
from opentrons.protocol_engine.state.config import Config
from opentrons.protocol_engine.types import DeckType
from robot_server.runs.error_recovery_mapping import create_error_recovery_policy_from_rules
from robot_server.runs.error_recovery_models import ErrorRecoveryRule

from opentrons.protocol_engine.state.command_fixtures import create_pick_up_tip_command

def test_create_error_recovery_policy_from_rules_empty() -> None:
    rule1 = ErrorRecoveryRule(
        matchCriteria=[],
        ifMatch=[]
    )
    
    a = (create_error_recovery_policy_from_rules(rule1))
    exampleConfig = Config(
        robot_type="OT-3 Standard",
        deck_type=DeckType.OT3_STANDARD,
    )
    
    exampleCommand = create_pick_up_tip_command()
    
    assert a(exampleConfig, exampleCommand) == ErrorRecoveryType.WAIT_FOR_RECOVERY