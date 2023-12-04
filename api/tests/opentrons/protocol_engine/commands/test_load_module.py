"""Test load module command."""
import pytest
from decoy import Decoy

from opentrons.protocol_engine.errors import LocationIsOccupiedError
from opentrons.protocol_engine.state import StateView
from opentrons.types import DeckSlotName
from opentrons.protocol_engine.types import (
    DeckSlotLocation,
    ModuleModel,
    ModuleDefinition,
)
from opentrons.protocol_engine.execution import EquipmentHandler, LoadedModuleData

from opentrons.protocol_engine.commands.load_module import (
    LoadModuleParams,
    LoadModuleResult,
    LoadModuleImplementation,
)


async def test_load_module_implementation(
    decoy: Decoy,
    equipment: EquipmentHandler,
    state_view: StateView,
    tempdeck_v2_def: ModuleDefinition,
) -> None:
    """A loadModule command should have an execution implementation."""
    subject = LoadModuleImplementation(equipment=equipment, state_view=state_view)

    data = LoadModuleParams(
        model=ModuleModel.TEMPERATURE_MODULE_V1,
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
        moduleId="some-id",
    )
    decoy.when(
        state_view.geometry.ensure_location_not_occupied(
            DeckSlotLocation(slotName=DeckSlotName.SLOT_1)
        )
    ).then_return(DeckSlotLocation(slotName=DeckSlotName.SLOT_2))

    decoy.when(
        await equipment.load_module(
            model=ModuleModel.TEMPERATURE_MODULE_V1,
            location=DeckSlotLocation(slotName=DeckSlotName.SLOT_2),
            module_id="some-id",
        )
    ).then_return(
        LoadedModuleData(
            module_id="module-id",
            serial_number="mod-serial",
            definition=tempdeck_v2_def,
        )
    )

    result = await subject.execute(data)
    assert result == LoadModuleResult(
        moduleId="module-id",
        serialNumber="mod-serial",
        model=ModuleModel.TEMPERATURE_MODULE_V2,
        definition=tempdeck_v2_def,
    )


async def test_load_module_implementation_mag_block(
    decoy: Decoy,
    equipment: EquipmentHandler,
    state_view: StateView,
    mag_block_v1_def: ModuleDefinition,
) -> None:
    """A loadModule command for mag block should have an execution implementation."""
    subject = LoadModuleImplementation(equipment=equipment, state_view=state_view)

    data = LoadModuleParams(
        model=ModuleModel.MAGNETIC_BLOCK_V1,
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
        moduleId="some-id",
    )
    decoy.when(
        state_view.geometry.ensure_location_not_occupied(
            DeckSlotLocation(slotName=DeckSlotName.SLOT_1)
        )
    ).then_return(DeckSlotLocation(slotName=DeckSlotName.SLOT_2))

    decoy.when(
        await equipment.load_magnetic_block(
            model=ModuleModel.MAGNETIC_BLOCK_V1,
            location=DeckSlotLocation(slotName=DeckSlotName.SLOT_2),
            module_id="some-id",
        )
    ).then_return(
        LoadedModuleData(
            module_id="module-id",
            serial_number=None,
            definition=mag_block_v1_def,
        )
    )

    result = await subject.execute(data)
    assert result == LoadModuleResult(
        moduleId="module-id",
        serialNumber=None,
        model=ModuleModel.MAGNETIC_BLOCK_V1,
        definition=mag_block_v1_def,
    )


async def test_load_module_raises_if_location_occupied(
    decoy: Decoy,
    equipment: EquipmentHandler,
    state_view: StateView,
) -> None:
    """A loadModule command should have an execution implementation."""
    subject = LoadModuleImplementation(equipment=equipment, state_view=state_view)

    data = LoadModuleParams(
        model=ModuleModel.TEMPERATURE_MODULE_V1,
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
        moduleId="some-id",
    )

    decoy.when(
        state_view.geometry.ensure_location_not_occupied(
            DeckSlotLocation(slotName=DeckSlotName.SLOT_1)
        )
    ).then_raise(LocationIsOccupiedError("Get your own spot!"))

    with pytest.raises(LocationIsOccupiedError):
        await subject.execute(data)
