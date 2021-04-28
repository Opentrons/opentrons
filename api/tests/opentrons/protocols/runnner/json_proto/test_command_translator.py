import pytest
from mock import MagicMock
from opentrons.protocol_engine import StateView, WellLocation, WellOrigin
from opentrons.protocol_engine.commands import AspirateRequest
from opentrons.protocols.runner.json_proto.models import json_protocol as models

from opentrons.protocols.runner.json_proto.command_translator import (
    CommandTranslator
)


@pytest.fixture
def mock_state_view() -> MagicMock:
    return MagicMock(spec=StateView)


@pytest.fixture
def subject(mock_state_view) -> CommandTranslator:
    return CommandTranslator(state_view=mock_state_view)


def test_aspirate(subject, aspirate_command: models.LiquidCommand) -> None:
    """It should translate a JSON aspirate command to a Protocol Engine
     aspirate request."""
    request = subject.translate(aspirate_command)

    assert request == [
        AspirateRequest(
            pipetteId=aspirate_command.params.pipette,
            labwareId=aspirate_command.params.labware,
            wellName=aspirate_command.params.well,
            volume=aspirate_command.params.volume,
            wellLocation=WellLocation(
                origin=WellOrigin.BOTTOM,
                offset=(0, 0, aspirate_command.params.offsetFromBottomMm)
            )
        )
    ]
