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

from opentrons.protocol_engine.state.module_substates import (
    MagneticModuleId,
    MagneticModuleSubState,
    HeaterShakerModuleId,
    HeaterShakerModuleSubState,
)


def test_initial_state() -> None:
    """It should initialize the module state."""
    subject = ModuleStore()

    assert subject.state == ModuleState(
        slot_by_module_id={},
        hardware_by_module_id={},
        substate_by_module_id={},
    )


def test_load_module(magdeck_v2_def: ModuleDefinition) -> None:
    """It should handle a successful LoadModule command."""
    action = actions.UpdateCommandAction(
        command=commands.LoadModule.construct(  # type: ignore[call-arg]
            params=commands.LoadModuleParams(
                model=ModuleModel.MAGNETIC_MODULE_V2,
                location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
            ),
            result=commands.LoadModuleResult(
                moduleId="module-id",
                model=ModuleModel.MAGNETIC_MODULE_V2,
                serialNumber="serial-number",
                definition=magdeck_v2_def,
            ),
        )
    )

    subject = ModuleStore()
    subject.handle_action(action)

    assert subject.state == ModuleState(
        slot_by_module_id={"module-id": DeckSlotName.SLOT_1},
        hardware_by_module_id={
            "module-id": HardwareModule(
                serial_number="serial-number",
                definition=magdeck_v2_def,
            )
        },
        substate_by_module_id={
            "module-id": MagneticModuleSubState(
                module_id=MagneticModuleId("module-id"),
                model=ModuleModel.MAGNETIC_MODULE_V2,
            )
        },
    )


def test_add_module_action(magdeck_v1_def: ModuleDefinition) -> None:
    """It should be able to add attached modules directly into state."""
    action = actions.AddModuleAction(
        module_id="module-id",
        serial_number="serial-number",
        definition=magdeck_v1_def,
    )

    subject = ModuleStore()
    subject.handle_action(action)

    assert subject.state == ModuleState(
        slot_by_module_id={"module-id": None},
        hardware_by_module_id={
            "module-id": HardwareModule(
                serial_number="serial-number",
                definition=magdeck_v1_def,
            )
        },
        substate_by_module_id={
            "module-id": MagneticModuleSubState(
                module_id=MagneticModuleId("module-id"),
                model=ModuleModel.MAGNETIC_MODULE_V1,
            )
        },
    )


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
    assert subject.state.substate_by_module_id == {
        "module-id": HeaterShakerModuleSubState(
            module_id=HeaterShakerModuleId("module-id"), plate_target_temperature=42
        )
    }
    subject.handle_action(actions.UpdateCommandAction(command=deactivate_cmd))
    assert subject.state.substate_by_module_id == {
        "module-id": HeaterShakerModuleSubState(
            module_id=HeaterShakerModuleId("module-id"), plate_target_temperature=None
        )
    }
