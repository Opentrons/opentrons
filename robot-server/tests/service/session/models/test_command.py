from datetime import datetime
import pytest
from opentrons.types import MountType
from pydantic import ValidationError

from opentrons.protocol_engine import commands as pe_commands

from robot_server.service.session.models import command, command_definitions


@pytest.mark.parametrize(
    argnames="command_def",
    argvalues=[
        command_definitions.ProtocolCommand.start_run,
        command_definitions.CalibrationCommand.move_to_deck,
        command_definitions.CheckCalibrationCommand.compare_point,
    ])
def test_empty(command_def: command_definitions.CommandDefinition):
    """Test creation of empty command request and response."""
    request = command.CommandRequest.parse_obj({
        "data": {
            "command": command_def.value,
            "data": {}
        }
    })
    assert request.data.command == command_def
    assert request.data.data == command.EmptyModel()

    dt = datetime(2000, 1, 1)

    response = request.data.make_response(
        identifier="id",
        status=command.CommandStatus.executed,
        created_at=dt,
        started_at=None,
        completed_at=None,
        result=None
    )

    assert response.command == command_def
    assert response.data == command.EmptyModel()
    assert response.id == "id"
    assert response.createdAt == dt
    assert response.startedAt is None
    assert response.completedAt is None
    assert response.result is None


def test_not_empty():
    """Test that command request with data and result are created properly."""
    request = command.CommandRequest.parse_obj({
        "data": {
            "command": "equipment.loadPipette",
            "data": {
                "pipetteName": "p10_single",
                "mount": "left",
                "pipetteId": None,
            }
        }
    })
    assert request.data.command == \
           command_definitions.EquipmentCommand.load_pipette
    assert request.data.data == pe_commands.LoadPipetteRequest(
        pipetteName="p10_single",
        mount=MountType.LEFT,
        pipetteId=None,
    )

    dt = datetime(2000, 1, 1)

    response = request.data.make_response(
        identifier="id",
        status=command.CommandStatus.executed,
        created_at=dt,
        started_at=None,
        completed_at=None,
        result=pe_commands.LoadPipetteResult(
            pipetteId="123"
        )
    )

    assert response.command == \
           command_definitions.EquipmentCommand.load_pipette
    assert response.data == pe_commands.LoadPipetteRequest(
        pipetteName="p10_single",
        mount=MountType.LEFT,
        pipetteId=None,
    )
    assert response.id == "id"
    assert response.createdAt == dt
    assert response.startedAt is None
    assert response.completedAt is None
    assert response.result == pe_commands.LoadPipetteResult(
        pipetteId="123"
    )


@pytest.mark.parametrize(
    argnames="command_def",
    argvalues=[
        command_definitions.EquipmentCommand.load_labware,
        command_definitions.EquipmentCommand.load_pipette,
        command_definitions.PipetteCommand.aspirate,
        command_definitions.PipetteCommand.dispense,
        command_definitions.PipetteCommand.drop_tip,
        command_definitions.PipetteCommand.pick_up_tip,
        command_definitions.CalibrationCommand.jog,
        command_definitions.CalibrationCommand.set_has_calibration_block
    ])
def test_requires_data(command_def: command_definitions.CommandDefinition):
    """Test creation of command requiring data will fail with empty body."""
    with pytest.raises(ValidationError):
        command.CommandRequest.parse_obj({
            "data": {
                "command": command_def.value,
                "data": {}
            }
        })
