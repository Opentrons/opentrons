"""Test load adapter commands."""
import inspect
import pytest

from decoy import Decoy

from opentrons.types import DeckSlotName
from opentrons.protocols.models import LabwareDefinition
from opentrons.protocol_engine.errors import LabwareDefinitionIsNotAdapterError
from opentrons.protocol_engine.types import DeckSlotLocation
from opentrons.protocol_engine.execution import LoadedLabwareData, EquipmentHandler
from opentrons.protocol_engine.resources import labware_validation

from opentrons.protocol_engine.commands.load_adapter import (
    LoadAdapterParams,
    LoadAdapterResult,
    LoadAdapterImplementation,
)


@pytest.fixture(autouse=True)
def patch_mock_labware_validation(
    decoy: Decoy, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Mock out move_types.py functions."""
    for name, func in inspect.getmembers(labware_validation, inspect.isfunction):
        monkeypatch.setattr(labware_validation, name, decoy.mock(func=func))


async def test_load_adapter_implementation(
    decoy: Decoy,
    equipment: EquipmentHandler,
) -> None:
    """A LoadAdapter command should have an execution implementation."""
    subject = LoadAdapterImplementation(equipment=equipment)

    data = LoadAdapterParams(
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_3),
        loadName="some-load-name",
        namespace="opentrons-test",
        version=1,
        adapterId="abc-123",
    )

    labware_definition = LabwareDefinition.construct()  # type: ignore[call-arg]

    decoy.when(
        await equipment.load_labware(
            location=DeckSlotLocation(slotName=DeckSlotName.SLOT_3),
            load_name="some-load-name",
            namespace="opentrons-test",
            version=1,
            labware_id="abc-123",
        )
    ).then_return(
        LoadedLabwareData(
            labware_id="adapter-id",
            definition=labware_definition,
            offsetId="adapter-offset-id",
        )
    )

    decoy.when(
        labware_validation.validate_definition_is_adapter(labware_definition)
    ).then_return(True)

    result = await subject.execute(data)

    assert result == LoadAdapterResult(
        adapterId="adapter-id",
        definition=labware_definition,
        offsetId="adapter-offset-id",
    )


async def test_load_adapter_raises_not_adapter(
    decoy: Decoy,
    equipment: EquipmentHandler,
) -> None:
    """A LoadAdapter command should raise if the definition is not validated as an adapter."""
    subject = LoadAdapterImplementation(equipment=equipment)

    data = LoadAdapterParams(
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_3),
        loadName="some-load-name",
        namespace="opentrons-test",
        version=1,
        adapterId="abc-123",
    )

    labware_definition = LabwareDefinition.construct()  # type: ignore[call-arg]

    decoy.when(
        await equipment.load_labware(
            location=DeckSlotLocation(slotName=DeckSlotName.SLOT_3),
            load_name="some-load-name",
            namespace="opentrons-test",
            version=1,
            labware_id="abc-123",
        )
    ).then_return(
        LoadedLabwareData(
            labware_id="adapter-id",
            definition=labware_definition,
            offsetId="adapter-offset-id",
        )
    )

    decoy.when(
        labware_validation.validate_definition_is_adapter(labware_definition)
    ).then_return(False)

    with pytest.raises(LabwareDefinitionIsNotAdapterError):
        await subject.execute(data)
