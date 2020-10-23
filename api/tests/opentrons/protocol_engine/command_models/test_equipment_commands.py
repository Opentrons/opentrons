"""Text creating equipment commands."""
from opentrons.protocol_engine import command_models as commands
from opentrons.types import MountType


def test_load_labware_request():
    """It should have a LoadLabwareRequest model."""
    payload = commands.LoadLabwareRequest(
        location=3,
        loadName="some-load-name",
        namespace="opentrons-test",
        version=1
    )

    assert payload.location == 3
    assert payload.loadName == "some-load-name"
    assert payload.namespace == "opentrons-test"
    assert payload.version == 1


def test_load_pipette_command():
    """It should have a LoadPipetteRequest model."""
    payload = commands.LoadPipetteRequest(
        pipetteName="p300_single",
        mount=MountType.LEFT
    )

    assert payload.pipetteName == "p300_single"
    assert payload.mount == MountType.LEFT
