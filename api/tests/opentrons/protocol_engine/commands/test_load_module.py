"""Test load module command."""
from decoy import Decoy

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
    tempdeck_v2_def: ModuleDefinition,
) -> None:
    """A loadModule command should have an execution implementation."""
    subject = LoadModuleImplementation(equipment=equipment)

    data = LoadModuleParams(
        model=ModuleModel.TEMPERATURE_MODULE_V1,
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
        moduleId="some-id",
    )

    decoy.when(
        await equipment.load_module(
            model=ModuleModel.TEMPERATURE_MODULE_V1,
            location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
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
