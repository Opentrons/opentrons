"""Module state store tests."""
from opentrons.types import DeckSlotName
from opentrons.protocol_engine import commands, actions
from opentrons.protocol_engine.commands import heater_shaker as hs_commands
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
        command=commands.LoadModule.construct(  # type: ignore[call-arg]
            params=commands.LoadModuleParams(
                model=ModuleModel.TEMPERATURE_MODULE_V1,
                location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
            ),
            result=commands.LoadModuleResult(
                moduleId="module-id",
                model=ModuleModel.TEMPERATURE_MODULE_V1,
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


# TODO (spp, 2022-03-24): parametrize this test as other heating modules are added
def test_handle_temperature_commands(heater_shaker_v1_def: ModuleDefinition) -> None:
    """It should update `plate_target_temperature` correctly."""
    load_module_cmd = commands.LoadModule.construct(  # type: ignore[call-arg]
        params=commands.LoadModuleParams(
            model=ModuleModel.HEATER_SHAKER_MODULE_V1,
            location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
        ),
        result=commands.LoadModuleResult(
            moduleId="module-id",
            model=ModuleModel.HEATER_SHAKER_MODULE_V1,
            serialNumber="serial-number",
            definition=heater_shaker_v1_def,
        ),
    )
    set_temp_cmd = hs_commands.StartSetTargetTemperature.construct(  # type: ignore[call-arg]  # noqa: E501
        params=hs_commands.StartSetTargetTemperatureParams(
            moduleId="module-id", temperature=42
        ),
        result=hs_commands.StartSetTargetTemperatureResult(),
    )
    deactivate_cmd = hs_commands.DeactivateHeater.construct(  # type: ignore[call-arg]
        params=hs_commands.DeactivateHeaterParams(moduleId="module-id"),
        result=hs_commands.DeactivateHeaterResult(),
    )
    subject = ModuleStore()

    subject.handle_action(actions.UpdateCommandAction(command=load_module_cmd))
    subject.handle_action(actions.UpdateCommandAction(command=set_temp_cmd))
    assert subject.state.hardware_module_by_slot == {
        DeckSlotName.SLOT_1: HardwareModule(
            serial_number="serial-number",
            definition=heater_shaker_v1_def,
            plate_target_temperature=42,
        )
    }
    subject.handle_action(actions.UpdateCommandAction(command=deactivate_cmd))
    assert subject.state.hardware_module_by_slot == {
        DeckSlotName.SLOT_1: HardwareModule(
            serial_number="serial-number",
            definition=heater_shaker_v1_def,
            plate_target_temperature=None,
        )
    }
