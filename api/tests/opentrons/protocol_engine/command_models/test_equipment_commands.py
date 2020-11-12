"""Test creating equipment commands."""
from opentrons.protocol_engine import command_models as commands
from opentrons.types import MountType, DeckSlotName
from opentrons.protocol_engine.types import DeckSlotLocation


def test_load_labware_request() -> None:
    """It should have a LoadLabwareRequest model."""
    payload = commands.LoadLabwareRequest(
        location=DeckSlotLocation(DeckSlotName.SLOT_3),
        loadName="some-load-name",
        namespace="opentrons-test",
        version=1
    )

    assert payload.location == DeckSlotLocation(DeckSlotName.SLOT_3)
    assert payload.loadName == "some-load-name"
    assert payload.namespace == "opentrons-test"
    assert payload.version == 1


def test_load_pipette_command() -> None:
    """It should have a LoadPipetteRequest model."""
    payload = commands.LoadPipetteRequest(
        pipetteName="p300_single",
        mount=MountType.LEFT
    )

    assert payload.pipetteName == "p300_single"
    assert payload.mount == MountType.LEFT
