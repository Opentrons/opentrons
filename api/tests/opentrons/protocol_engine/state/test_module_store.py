"""Module state store tests."""
from opentrons.types import DeckSlotName
from opentrons.protocol_engine import commands, actions

from opentrons.protocol_engine.types import (
    DeckSlotLocation,
    ModuleDefinition,
    ModuleModel,
)

from opentrons.protocol_engine.state.modules import (
    ModuleStore,
    ModuleState,
    HardwareModule,
)


def test_initial_state() -> None:
    """It should initialize the module state."""
    subject = ModuleStore()

    assert subject.state == ModuleState(
        slot_by_module_id={},
        hardware_module_by_slot={},
    )


def test_load_module(tempdeck_v2_def: ModuleDefinition) -> None:
    """It should handle a successful LoadModule command."""
    action = actions.UpdateCommandAction(
        command=commands.LoadModule(  # type: ignore[call-arg]
            params=commands.LoadModuleParams(
                model=ModuleModel.TEMPERATURE_MODULE_V1,
                location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
            ),
            result=commands.LoadModuleResult(
                moduleId="module-id",
                model=ModuleModel.TEMPERATURE_MODULE_V2,
                serialNumber="serial-number",
                definition=tempdeck_v2_def,
            ),
        )
    )

    subject = ModuleStore()
    subject.handle_action(action)

    assert subject.state == ModuleState(
        slot_by_module_id={"module-id": DeckSlotName.SLOT_1},
        hardware_module_by_slot={
            DeckSlotName.SLOT_1: HardwareModule(
                serial_number="serial-number",
                definition=tempdeck_v2_def,
            )
        },
    )
