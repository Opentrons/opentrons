import pytest
from pydantic import ValidationError
from opentrons.protocol_engine import command_models as commands


def test_move_to_well_command():
    """It should be able to create a MoveToWellRequest."""
    payload = commands.MoveToWellRequest(
        pipetteId="abc",
        labwareId="123",
        wellId="A3",
    )

    assert payload.pipetteId == "abc"
    assert payload.labwareId == "123"
    assert payload.wellId == "A3"


def test_pick_up_tip_command():
    """It should be able to create a PickUpTipRequest."""
    payload = commands.PickUpTipRequest(
        pipetteId="abc",
        labwareId="123",
        wellId="A3",
    )

    assert payload.pipetteId == "abc"
    assert payload.labwareId == "123"
    assert payload.wellId == "A3"


def test_drop_tip_command():
    """It should be able to create a DropTipRequest."""
    payload = commands.DropTipRequest(
        pipetteId="abc",
        labwareId="123",
        wellId="A3",
    )

    assert payload.pipetteId == "abc"
    assert payload.labwareId == "123"
    assert payload.wellId == "A3"


def test_aspirate_command():
    """It should be able to create an AspirateRequest."""
    payload = commands.AspirateRequest(
        pipetteId="abc",
        labwareId="123",
        wellId="A3",
        volume=50,
        offsetFromBottom=1.5,
        flowRate=1.0
    )

    assert payload.pipetteId == "abc"
    assert payload.labwareId == "123"
    assert payload.wellId == "A3"
    assert payload.volume == 50
    assert payload.offsetFromBottom == 1.5
    assert payload.flowRate == 1.0


@pytest.mark.parametrize(
    "key_under_test",
    ["volume", "flowRate", "offsetFromBottom"]
)
def test_aspirate_command_validation(key_under_test):
    """AspirateRequest require positive volume, flowRate, offsetFromBottom."""
    init_args = {
        "pipetteId": "abc",
        "labwareId": "123",
        "wellId": "A3",
        "volume": 50,
        "offsetFromBottom": 1.5,
        "flowRate": 1.0
    }
    init_args[key_under_test] = -1

    with pytest.raises(ValidationError):
        commands.AspirateRequest(**init_args)


def test_dispense_command():
    """It should be able to create a DispenseRequest."""
    payload = commands.DispenseRequest(
        pipetteId="abc",
        labwareId="123",
        wellId="A3",
        volume=50,
        offsetFromBottom=1.5,
        flowRate=1.0
    )

    assert payload.pipetteId == "abc"
    assert payload.labwareId == "123"
    assert payload.wellId == "A3"
    assert payload.volume == 50
    assert payload.offsetFromBottom == 1.5
    assert payload.flowRate == 1.0
