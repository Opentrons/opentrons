"""Test load labware commands."""
import inspect
import pytest

from decoy import Decoy

from opentrons.types import DeckSlotName
from opentrons.protocols.models import LabwareDefinition

from opentrons.protocol_engine.errors import (
    LabwareIsNotAllowedInLocationError,
    LabwareNotLoadedError,
)

from opentrons.protocol_engine.types import (
    DeckSlotLocation,
)
from opentrons.protocol_engine.execution import ReloadedLabwareData, EquipmentHandler
from opentrons.protocol_engine.resources import labware_validation
from opentrons.protocol_engine.state import StateView

from opentrons.protocol_engine.commands.reload_labware import (
    ReloadLabwareParams,
    ReloadLabwareResult,
    ReloadLabwareImplementation,
)


@pytest.fixture(autouse=True)
def patch_mock_labware_validation(
    decoy: Decoy, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Mock out move_types.py functions."""
    for name, func in inspect.getmembers(labware_validation, inspect.isfunction):
        monkeypatch.setattr(labware_validation, name, decoy.mock(func=func))


async def test_reload_labware_implementation(
    decoy: Decoy,
    well_plate_def: LabwareDefinition,
    equipment: EquipmentHandler,
    state_view: StateView,
) -> None:
    """A ReloadLabware command should have an execution implementation."""
    subject = ReloadLabwareImplementation(equipment=equipment, state_view=state_view)

    data = ReloadLabwareParams(
        labwareId="my-labware-id",
        loadName="some-load-name",
        namespace="opentrons-test",
        version=1,
        displayName="My custom display name",
    )

    decoy.when(
        await equipment.reload_labware(
            labware_id="my-labware-id",
            load_name="some-load-name",
            namespace="opentrons-test",
            version=1,
        )
    ).then_return(
        ReloadedLabwareData(
            location=DeckSlotLocation(slotName=DeckSlotName.SLOT_4),
            definition=well_plate_def,
            offsetId="labware-offset-id",
        )
    )

    result = await subject.execute(data)

    assert result == ReloadLabwareResult(
        labwareId="my-labware-id",
        definition=well_plate_def,
        offsetId="labware-offset-id",
    )


async def test_reload_labware_raises_labware_does_not_exist(
    decoy: Decoy,
    well_plate_def: LabwareDefinition,
    equipment: EquipmentHandler,
    state_view: StateView,
) -> None:
    """A ReloadLabware command should raise if the specified labware is not loaded."""
    subject = ReloadLabwareImplementation(equipment=equipment, state_view=state_view)

    data = ReloadLabwareParams(
        labwareId="my-labware-id",
        loadName="some-load-name",
        namespace="opentrons-test",
        version=1,
        displayName="My custom display name",
    )

    decoy.when(
        await equipment.reload_labware(
            labware_id="my-labware-id",
            load_name="some-load-name",
            namespace="opentrons-test",
            version=1,
        )
    ).then_raise(LabwareNotLoadedError("What labware is this!"))

    with pytest.raises(LabwareNotLoadedError):
        await subject.execute(data)


async def test_load_labware_raises_location_not_allowed(
    decoy: Decoy,
    equipment: EquipmentHandler,
    state_view: StateView,
    well_plate_def: LabwareDefinition,
) -> None:
    """A ReloadLabware command should raise if the flex trash definition is not in a valid slot."""
    subject = ReloadLabwareImplementation(equipment=equipment, state_view=state_view)
    decoy.when(labware_validation.is_flex_trash("some-load-name")).then_return(True)
    decoy.when(
        await equipment.reload_labware(
            labware_id="my-labware-id",
            load_name="some-load-name",
            namespace="opentrons-test",
            version=1,
        )
    ).then_return(
        ReloadedLabwareData(
            location=DeckSlotLocation(slotName=DeckSlotName.SLOT_A3),
            definition=well_plate_def,
            offsetId="labware-offset-id",
        )
    )
    data = ReloadLabwareParams(
        labwareId="my-labware-id",
        loadName="some-load-name",
        namespace="opentrons-test",
        version=1,
        displayName="My custom display name",
    )

    with pytest.raises(LabwareIsNotAllowedInLocationError):
        await subject.execute(data)
