"""Module state store tests."""
import pytest
from pytest_lazyfixture import lazy_fixture  # type: ignore[import]

from opentrons.types import DeckSlotName
from opentrons.protocol_engine import commands, actions
from opentrons.protocol_engine.commands import (
    heater_shaker as hs_commands,
    temperature_module as temp_commands,
    thermocycler as tc_commands,
)
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
    TemperatureModuleId,
    TemperatureModuleSubState,
    ThermocyclerModuleId,
    ThermocyclerModuleSubState,
    ModuleSubStateType,
)


def test_initial_state() -> None:
    """It should initialize the module state."""
    subject = ModuleStore()

    assert subject.state == ModuleState(
        slot_by_module_id={},
        hardware_by_module_id={},
        substate_by_module_id={},
    )


@pytest.mark.parametrize(
    argnames=["module_definition", "model", "expected_substate"],
    argvalues=[
        (
            lazy_fixture("magdeck_v2_def"),
            ModuleModel.MAGNETIC_MODULE_V2,
            MagneticModuleSubState(
                module_id=MagneticModuleId("module-id"),
                model=ModuleModel.MAGNETIC_MODULE_V2,
            ),
        ),
        (
            lazy_fixture("heater_shaker_v1_def"),
            ModuleModel.HEATER_SHAKER_MODULE_V1,
            HeaterShakerModuleSubState(
                module_id=HeaterShakerModuleId("module-id"),
                plate_target_temperature=None,
            ),
        ),
        (
            lazy_fixture("tempdeck_v1_def"),
            ModuleModel.TEMPERATURE_MODULE_V1,
            TemperatureModuleSubState(
                module_id=TemperatureModuleId("module-id"),
                plate_target_temperature=None,
            ),
        ),
        (
            lazy_fixture("thermocycler_v1_def"),
            ModuleModel.THERMOCYCLER_MODULE_V1,
            ThermocyclerModuleSubState(
                module_id=ThermocyclerModuleId("module-id"),
                target_block_temperature=None,
                target_lid_temperature=None,
            ),
        ),
    ],
)
def test_load_module(
    module_definition: ModuleDefinition,
    model: ModuleModel,
    expected_substate: ModuleSubStateType,
) -> None:
    """It should handle a successful LoadModule command."""
    action = actions.UpdateCommandAction(
        command=commands.LoadModule.construct(  # type: ignore[call-arg]
            params=commands.LoadModuleParams(
                model=model,
                location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
            ),
            result=commands.LoadModuleResult(
                moduleId="module-id",
                model=model,
                serialNumber="serial-number",
                definition=module_definition,
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
                definition=module_definition,
            )
        },
        substate_by_module_id={"module-id": expected_substate},
    )


@pytest.mark.parametrize(
    argnames=["module_definition", "expected_substate"],
    argvalues=[
        (
            lazy_fixture("magdeck_v2_def"),
            MagneticModuleSubState(
                module_id=MagneticModuleId("module-id"),
                model=ModuleModel.MAGNETIC_MODULE_V2,
            ),
        ),
        (
            lazy_fixture("heater_shaker_v1_def"),
            HeaterShakerModuleSubState(
                module_id=HeaterShakerModuleId("module-id"),
                plate_target_temperature=None,
            ),
        ),
        (
            lazy_fixture("tempdeck_v2_def"),
            TemperatureModuleSubState(
                module_id=TemperatureModuleId("module-id"),
                plate_target_temperature=None,
            ),
        ),
        (
            lazy_fixture("thermocycler_v1_def"),
            ThermocyclerModuleSubState(
                module_id=ThermocyclerModuleId("module-id"),
                target_block_temperature=None,
                target_lid_temperature=None,
            ),
        ),
    ],
)
def test_add_module_action(
    module_definition: ModuleDefinition,
    expected_substate: ModuleSubStateType,
) -> None:
    """It should be able to add attached modules directly into state."""
    action = actions.AddModuleAction(
        module_id="module-id",
        serial_number="serial-number",
        definition=module_definition,
    )

    subject = ModuleStore()
    subject.handle_action(action)

    assert subject.state == ModuleState(
        slot_by_module_id={"module-id": None},
        hardware_by_module_id={
            "module-id": HardwareModule(
                serial_number="serial-number",
                definition=module_definition,
            )
        },
        substate_by_module_id={"module-id": expected_substate},
    )


def test_handle_hs_temperature_commands(heater_shaker_v1_def: ModuleDefinition) -> None:
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
    set_temp_cmd = hs_commands.SetTargetTemperature.construct(  # type: ignore[call-arg]
        params=hs_commands.SetTargetTemperatureParams(moduleId="module-id", celsius=42),
        result=hs_commands.SetTargetTemperatureResult(),
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


def test_handle_tempdeck_temperature_commands(
    tempdeck_v2_def: ModuleDefinition,
) -> None:
    """It should update Tempdeck's `plate_target_temperature` correctly."""
    load_module_cmd = commands.LoadModule.construct(  # type: ignore[call-arg]
        params=commands.LoadModuleParams(
            model=ModuleModel.TEMPERATURE_MODULE_V2,
            location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
        ),
        result=commands.LoadModuleResult(
            moduleId="module-id",
            model=ModuleModel.TEMPERATURE_MODULE_V2,
            serialNumber="serial-number",
            definition=tempdeck_v2_def,
        ),
    )
    set_temp_cmd = temp_commands.SetTargetTemperature.construct(  # type: ignore[call-arg]
        params=temp_commands.SetTargetTemperatureParams(
            moduleId="module-id", celsius=42.4
        ),
        result=temp_commands.SetTargetTemperatureResult(targetTemperature=42),
    )
    deactivate_cmd = temp_commands.DeactivateTemperature.construct(  # type: ignore[call-arg]
        params=temp_commands.DeactivateTemperatureParams(moduleId="module-id"),
        result=temp_commands.DeactivateTemperatureResult(),
    )
    subject = ModuleStore()

    subject.handle_action(actions.UpdateCommandAction(command=load_module_cmd))
    subject.handle_action(actions.UpdateCommandAction(command=set_temp_cmd))
    assert subject.state.substate_by_module_id == {
        "module-id": TemperatureModuleSubState(
            module_id=TemperatureModuleId("module-id"), plate_target_temperature=42
        )
    }
    subject.handle_action(actions.UpdateCommandAction(command=deactivate_cmd))
    assert subject.state.substate_by_module_id == {
        "module-id": TemperatureModuleSubState(
            module_id=TemperatureModuleId("module-id"), plate_target_temperature=None
        )
    }


def test_handle_thermocycler_block_temperature_commands(
    thermocycler_v1_def: ModuleDefinition,
) -> None:
    """It should update Tempdeck's `plate_target_temperature` correctly."""
    load_module_cmd = commands.LoadModule.construct(  # type: ignore[call-arg]
        params=commands.LoadModuleParams(
            model=ModuleModel.THERMOCYCLER_MODULE_V1,
            location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
        ),
        result=commands.LoadModuleResult(
            moduleId="module-id",
            model=ModuleModel.THERMOCYCLER_MODULE_V1,
            serialNumber="serial-number",
            definition=thermocycler_v1_def,
        ),
    )
    set_block_temp_cmd = tc_commands.SetTargetBlockTemperature.construct(  # type: ignore[call-arg]
        params=tc_commands.SetTargetBlockTemperatureParams(
            moduleId="module-id", celsius=42.4
        ),
        result=tc_commands.SetTargetBlockTemperatureResult(targetBlockTemperature=42.4),
    )
    deactivate_block_cmd = tc_commands.DeactivateBlock.construct(  # type: ignore[call-arg]
        params=tc_commands.DeactivateBlockParams(moduleId="module-id"),
        result=tc_commands.DeactivateBlockResult(),
    )
    set_lid_temp_cmd = tc_commands.SetTargetLidTemperature.construct(  # type: ignore[call-arg]
        params=tc_commands.SetTargetLidTemperatureParams(
            moduleId="module-id", celsius=35.3
        ),
        result=tc_commands.SetTargetLidTemperatureResult(targetLidTemperature=35.3),
    )
    deactivate_lid_cmd = tc_commands.DeactivateLid.construct(  # type: ignore[call-arg]
        params=tc_commands.DeactivateLidParams(moduleId="module-id"),
        result=tc_commands.DeactivateLidResult(),
    )
    subject = ModuleStore()

    subject.handle_action(actions.UpdateCommandAction(command=load_module_cmd))
    subject.handle_action(actions.UpdateCommandAction(command=set_block_temp_cmd))
    assert subject.state.substate_by_module_id == {
        "module-id": ThermocyclerModuleSubState(
            module_id=ThermocyclerModuleId("module-id"),
            target_block_temperature=42.4,
            target_lid_temperature=None,
        )
    }
    subject.handle_action(actions.UpdateCommandAction(command=set_lid_temp_cmd))
    assert subject.state.substate_by_module_id == {
        "module-id": ThermocyclerModuleSubState(
            module_id=ThermocyclerModuleId("module-id"),
            target_block_temperature=42.4,
            target_lid_temperature=35.3,
        )
    }
    subject.handle_action(actions.UpdateCommandAction(command=deactivate_lid_cmd))
    assert subject.state.substate_by_module_id == {
        "module-id": ThermocyclerModuleSubState(
            module_id=ThermocyclerModuleId("module-id"),
            target_block_temperature=42.4,
            target_lid_temperature=None,
        )
    }
    subject.handle_action(actions.UpdateCommandAction(command=deactivate_block_cmd))
    assert subject.state.substate_by_module_id == {
        "module-id": ThermocyclerModuleSubState(
            module_id=ThermocyclerModuleId("module-id"),
            target_block_temperature=None,
            target_lid_temperature=None,
        )
    }
