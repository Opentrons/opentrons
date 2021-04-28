import pytest
from opentrons.protocol_engine import WellLocation, WellOrigin
from opentrons.protocol_engine.commands import AspirateRequest, DispenseRequest
from opentrons.protocols.runner.json_proto.models import json_protocol as models

from opentrons.protocols.runner.json_proto.command_translator import (
    CommandTranslator
)


@pytest.fixture
def subject() -> CommandTranslator:
    return CommandTranslator()


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


def test_dispense(subject, dispense_command: models.LiquidCommand) -> None:
    """It should translate a JSON dispense command to a Protocol Engine
     dispense request."""
    request = subject.translate(dispense_command)

    assert request == [
        DispenseRequest(
            pipetteId=dispense_command.params.pipette,
            labwareId=dispense_command.params.labware,
            wellName=dispense_command.params.well,
            volume=dispense_command.params.volume,
            wellLocation=WellLocation(
                origin=WellOrigin.BOTTOM,
                offset=(0, 0, dispense_command.params.offsetFromBottomMm)
            )
        )
    ]
