"""Smoke tests for the CommandExecutor class."""
import pytest
from datetime import datetime
from pydantic import BaseModel
from typing import Type, cast
from opentrons.protocols.models import LabwareDefinition

from opentrons.types import MountType, DeckSlotName
from opentrons.protocol_engine import commands
from opentrons.protocol_engine.types import DeckSlotLocation, PipetteName, WellLocation


@pytest.mark.parametrize(
    ("request_data", "request_cls", "command_cls"),
    [
        (
            commands.AddLabwareDefinitionData.construct(
                # TODO(mc, 2021-06-25): do not mock out LabwareDefinition
                definition=cast(LabwareDefinition, {"mockDefinition": True})
            ),
            commands.AddLabwareDefinitionRequest,
            commands.AddLabwareDefinition,
        ),
        (
            commands.AspirateData(
                pipetteId="pipette-id",
                labwareId="labware-id",
                wellName="well-name",
                volume=42,
                wellLocation=WellLocation(),
            ),
            commands.AspirateRequest,
            commands.Aspirate,
        ),
        (
            commands.DispenseData(
                pipetteId="pipette-id",
                labwareId="labware-id",
                wellName="well-name",
                volume=42,
                wellLocation=WellLocation(),
            ),
            commands.DispenseRequest,
            commands.Dispense,
        ),
        (
            commands.DropTipData(
                pipetteId="pipette-id",
                labwareId="labware-id",
                wellName="well-name",
            ),
            commands.DropTipRequest,
            commands.DropTip,
        ),
        (
            commands.LoadLabwareData(
                location=DeckSlotLocation(slot=DeckSlotName.SLOT_1),
                loadName="load-name",
                namespace="namespace",
                version=42,
            ),
            commands.LoadLabwareRequest,
            commands.LoadLabware,
        ),
        (
            commands.LoadPipetteData(
                mount=MountType.LEFT,
                pipetteName=PipetteName.P300_SINGLE,
            ),
            commands.LoadPipetteRequest,
            commands.LoadPipette,
        ),
        (
            commands.PickUpTipData(
                pipetteId="pipette-id",
                labwareId="labware-id",
                wellName="well-name",
            ),
            commands.PickUpTipRequest,
            commands.PickUpTip,
        ),
        (
            commands.MoveToWellData(
                pipetteId="pipette-id",
                labwareId="labware-id",
                wellName="well-name",
            ),
            commands.MoveToWellRequest,
            commands.MoveToWell,
        ),
        (
            commands.PauseData(message="hello world"),
            commands.PauseRequest,
            commands.Pause,
        ),
    ],
)
def test_map_request_to_command(
    request_data: BaseModel,
    request_cls: Type[commands.CommandRequest],
    command_cls: Type[commands.Command],
) -> None:
    """It should be able to create a command resource from a request."""
    subject = commands.CommandMapper()
    command_id = "command-id"
    created_at = datetime(year=2021, month=1, day=1, hour=1, minute=1)
    request = request_cls(data=request_data)  # type: ignore[arg-type]

    result = subject.map_request_to_command(
        request=request,
        command_id=command_id,
        created_at=created_at,
    )

    assert result == command_cls(
        id=command_id,
        createdAt=created_at,
        status=commands.CommandStatus.QUEUED,
        data=request_data,  # type: ignore[arg-type]
    )
