"""Module state store tests."""
import pytest
from pytest_lazyfixture import lazy_fixture  # type: ignore[import-untyped]

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
    HeaterShakerLatchStatus,
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

from opentrons.hardware_control.modules.types import LiveData


def test_initial_state() -> None:
    """It should initialize the module state."""
    subject = ModuleStore()

    assert subject.state == ModuleState(
        requested_model_by_id={},
        slot_by_module_id={},
        hardware_by_module_id={},
        substate_by_module_id={},
        module_offset_by_serial={},
    )


@pytest.mark.parametrize(
    argnames=["module_definition", "params_model", "result_model", "expected_substate"],
    argvalues=[
        (
            lazy_fixture("magdeck_v2_def"),
            ModuleModel.MAGNETIC_MODULE_V2,
            ModuleModel.MAGNETIC_MODULE_V2,
            MagneticModuleSubState(
                module_id=MagneticModuleId("module-id"),
                model=ModuleModel.MAGNETIC_MODULE_V2,
            ),
        ),
        (
            lazy_fixture("heater_shaker_v1_def"),
            ModuleModel.HEATER_SHAKER_MODULE_V1,
            ModuleModel.HEATER_SHAKER_MODULE_V1,
            HeaterShakerModuleSubState(
                module_id=HeaterShakerModuleId("module-id"),
                labware_latch_status=HeaterShakerLatchStatus.UNKNOWN,
                is_plate_shaking=False,
                plate_target_temperature=None,
            ),
        ),
        (
            lazy_fixture("tempdeck_v1_def"),
            ModuleModel.TEMPERATURE_MODULE_V1,
            ModuleModel.TEMPERATURE_MODULE_V1,
            TemperatureModuleSubState(
                module_id=TemperatureModuleId("module-id"),
                plate_target_temperature=None,
            ),
        ),
        (
            lazy_fixture("tempdeck_v1_def"),
            ModuleModel.TEMPERATURE_MODULE_V2,
            ModuleModel.TEMPERATURE_MODULE_V1,
            TemperatureModuleSubState(
                module_id=TemperatureModuleId("module-id"),
                plate_target_temperature=None,
            ),
        ),
        (
            lazy_fixture("tempdeck_v2_def"),
            ModuleModel.TEMPERATURE_MODULE_V1,
            ModuleModel.TEMPERATURE_MODULE_V2,
            TemperatureModuleSubState(
                module_id=TemperatureModuleId("module-id"),
                plate_target_temperature=None,
            ),
        ),
        (
            lazy_fixture("tempdeck_v2_def"),
            ModuleModel.TEMPERATURE_MODULE_V2,
            ModuleModel.TEMPERATURE_MODULE_V2,
            TemperatureModuleSubState(
                module_id=TemperatureModuleId("module-id"),
                plate_target_temperature=None,
            ),
        ),
        (
            lazy_fixture("thermocycler_v1_def"),
            ModuleModel.THERMOCYCLER_MODULE_V1,
            ModuleModel.THERMOCYCLER_MODULE_V1,
            ThermocyclerModuleSubState(
                module_id=ThermocyclerModuleId("module-id"),
                is_lid_open=False,
                target_block_temperature=None,
                target_lid_temperature=None,
            ),
        ),
    ],
)
def test_load_module(
    module_definition: ModuleDefinition,
    params_model: ModuleModel,
    result_model: ModuleModel,
    expected_substate: ModuleSubStateType,
) -> None:
    """It should handle a successful LoadModule command."""
    action = actions.UpdateCommandAction(
        private_result=None,
        command=commands.LoadModule.construct(  # type: ignore[call-arg]
            params=commands.LoadModuleParams(
                model=params_model,
                location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
            ),
            result=commands.LoadModuleResult(
                moduleId="module-id",
                model=result_model,
                serialNumber="serial-number",
                definition=module_definition,
            ),
        ),
    )

    subject = ModuleStore()
    subject.handle_action(action)

    assert subject.state == ModuleState(
        slot_by_module_id={"module-id": DeckSlotName.SLOT_1},
        requested_model_by_id={"module-id": params_model},
        hardware_by_module_id={
            "module-id": HardwareModule(
                serial_number="serial-number",
                definition=module_definition,
            )
        },
        substate_by_module_id={"module-id": expected_substate},
        module_offset_by_serial={},
    )


@pytest.mark.parametrize(
    argnames=["module_definition", "live_data", "expected_substate"],
    argvalues=[
        (
            lazy_fixture("magdeck_v2_def"),
            {},
            MagneticModuleSubState(
                module_id=MagneticModuleId("module-id"),
                model=ModuleModel.MAGNETIC_MODULE_V2,
            ),
        ),
        (
            lazy_fixture("heater_shaker_v1_def"),
            {
                "status": "abc",
                "data": {
                    "labwareLatchStatus": "idle_closed",
                    "speedStatus": "holding at target",
                    "targetSpeed": 123,
                    "targetTemp": 123,
                },
            },
            HeaterShakerModuleSubState(
                module_id=HeaterShakerModuleId("module-id"),
                labware_latch_status=HeaterShakerLatchStatus.CLOSED,
                is_plate_shaking=True,
                plate_target_temperature=123,
            ),
        ),
        (
            lazy_fixture("tempdeck_v2_def"),
            {"status": "abc", "data": {"targetTemp": 123}},
            TemperatureModuleSubState(
                module_id=TemperatureModuleId("module-id"),
                plate_target_temperature=123,
            ),
        ),
        (
            lazy_fixture("thermocycler_v1_def"),
            {
                "status": "abc",
                "data": {
                    "targetTemp": 123,
                    "lidTarget": 321,
                    "lid": "open",
                },
            },
            ThermocyclerModuleSubState(
                module_id=ThermocyclerModuleId("module-id"),
                is_lid_open=True,
                target_block_temperature=123,
                target_lid_temperature=321,
            ),
        ),
    ],
)
def test_add_module_action(
    module_definition: ModuleDefinition,
    live_data: LiveData,
    expected_substate: ModuleSubStateType,
) -> None:
    """It should be able to add attached modules directly into state."""
    action = actions.AddModuleAction(
        module_id="module-id",
        serial_number="serial-number",
        definition=module_definition,
        module_live_data=live_data,
    )

    subject = ModuleStore()
    subject.handle_action(action)

    assert subject.state == ModuleState(
        slot_by_module_id={"module-id": None},
        requested_model_by_id={"module-id": None},
        hardware_by_module_id={
            "module-id": HardwareModule(
                serial_number="serial-number",
                definition=module_definition,
            )
        },
        substate_by_module_id={"module-id": expected_substate},
        module_offset_by_serial={},
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

    subject.handle_action(
        actions.UpdateCommandAction(private_result=None, command=load_module_cmd)
    )
    subject.handle_action(
        actions.UpdateCommandAction(private_result=None, command=set_temp_cmd)
    )
    assert subject.state.substate_by_module_id == {
        "module-id": HeaterShakerModuleSubState(
            module_id=HeaterShakerModuleId("module-id"),
            labware_latch_status=HeaterShakerLatchStatus.UNKNOWN,
            is_plate_shaking=False,
            plate_target_temperature=42,
        )
    }
    subject.handle_action(
        actions.UpdateCommandAction(private_result=None, command=deactivate_cmd)
    )
    assert subject.state.substate_by_module_id == {
        "module-id": HeaterShakerModuleSubState(
            module_id=HeaterShakerModuleId("module-id"),
            labware_latch_status=HeaterShakerLatchStatus.UNKNOWN,
            is_plate_shaking=False,
            plate_target_temperature=None,
        )
    }


def test_handle_hs_shake_commands(heater_shaker_v1_def: ModuleDefinition) -> None:
    """It should update heater-shaker's `is_plate_shaking` correctly."""
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
    set_shake_cmd = hs_commands.SetAndWaitForShakeSpeed.construct(  # type: ignore[call-arg]
        params=hs_commands.SetAndWaitForShakeSpeedParams(moduleId="module-id", rpm=111),
        result=hs_commands.SetAndWaitForShakeSpeedResult(pipetteRetracted=False),
    )
    deactivate_cmd = hs_commands.DeactivateShaker.construct(  # type: ignore[call-arg]
        params=hs_commands.DeactivateShakerParams(moduleId="module-id"),
        result=hs_commands.DeactivateShakerResult(),
    )
    subject = ModuleStore()

    subject.handle_action(
        actions.UpdateCommandAction(private_result=None, command=load_module_cmd)
    )
    subject.handle_action(
        actions.UpdateCommandAction(private_result=None, command=set_shake_cmd)
    )
    assert subject.state.substate_by_module_id == {
        "module-id": HeaterShakerModuleSubState(
            module_id=HeaterShakerModuleId("module-id"),
            labware_latch_status=HeaterShakerLatchStatus.UNKNOWN,
            is_plate_shaking=True,
            plate_target_temperature=None,
        )
    }
    subject.handle_action(
        actions.UpdateCommandAction(private_result=None, command=deactivate_cmd)
    )
    assert subject.state.substate_by_module_id == {
        "module-id": HeaterShakerModuleSubState(
            module_id=HeaterShakerModuleId("module-id"),
            labware_latch_status=HeaterShakerLatchStatus.UNKNOWN,
            is_plate_shaking=False,
            plate_target_temperature=None,
        )
    }


def test_handle_hs_labware_latch_commands(
    heater_shaker_v1_def: ModuleDefinition,
) -> None:
    """It should update heater-shaker's `is_labware_latch_closed` correctly."""
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
    close_latch_cmd = hs_commands.CloseLabwareLatch.construct(  # type: ignore[call-arg]
        params=hs_commands.CloseLabwareLatchParams(moduleId="module-id"),
        result=hs_commands.CloseLabwareLatchResult(),
    )
    open_latch_cmd = hs_commands.OpenLabwareLatch.construct(  # type: ignore[call-arg]
        params=hs_commands.OpenLabwareLatchParams(moduleId="module-id"),
        result=hs_commands.OpenLabwareLatchResult(pipetteRetracted=False),
    )
    subject = ModuleStore()

    subject.handle_action(
        actions.UpdateCommandAction(private_result=None, command=load_module_cmd)
    )
    assert subject.state.substate_by_module_id == {
        "module-id": HeaterShakerModuleSubState(
            module_id=HeaterShakerModuleId("module-id"),
            labware_latch_status=HeaterShakerLatchStatus.UNKNOWN,
            is_plate_shaking=False,
            plate_target_temperature=None,
        )
    }

    subject.handle_action(
        actions.UpdateCommandAction(private_result=None, command=close_latch_cmd)
    )
    assert subject.state.substate_by_module_id == {
        "module-id": HeaterShakerModuleSubState(
            module_id=HeaterShakerModuleId("module-id"),
            labware_latch_status=HeaterShakerLatchStatus.CLOSED,
            is_plate_shaking=False,
            plate_target_temperature=None,
        )
    }
    subject.handle_action(
        actions.UpdateCommandAction(private_result=None, command=open_latch_cmd)
    )
    assert subject.state.substate_by_module_id == {
        "module-id": HeaterShakerModuleSubState(
            module_id=HeaterShakerModuleId("module-id"),
            labware_latch_status=HeaterShakerLatchStatus.OPEN,
            is_plate_shaking=False,
            plate_target_temperature=None,
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

    subject.handle_action(
        actions.UpdateCommandAction(private_result=None, command=load_module_cmd)
    )
    subject.handle_action(
        actions.UpdateCommandAction(private_result=None, command=set_temp_cmd)
    )
    assert subject.state.substate_by_module_id == {
        "module-id": TemperatureModuleSubState(
            module_id=TemperatureModuleId("module-id"), plate_target_temperature=42
        )
    }
    subject.handle_action(
        actions.UpdateCommandAction(private_result=None, command=deactivate_cmd)
    )
    assert subject.state.substate_by_module_id == {
        "module-id": TemperatureModuleSubState(
            module_id=TemperatureModuleId("module-id"), plate_target_temperature=None
        )
    }


def test_handle_thermocycler_temperature_commands(
    thermocycler_v1_def: ModuleDefinition,
) -> None:
    """It should update thermocycler's temperature statuses correctly."""
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

    subject.handle_action(
        actions.UpdateCommandAction(private_result=None, command=load_module_cmd)
    )
    subject.handle_action(
        actions.UpdateCommandAction(private_result=None, command=set_block_temp_cmd)
    )
    assert subject.state.substate_by_module_id == {
        "module-id": ThermocyclerModuleSubState(
            module_id=ThermocyclerModuleId("module-id"),
            is_lid_open=False,
            target_block_temperature=42.4,
            target_lid_temperature=None,
        )
    }
    subject.handle_action(
        actions.UpdateCommandAction(private_result=None, command=set_lid_temp_cmd)
    )
    assert subject.state.substate_by_module_id == {
        "module-id": ThermocyclerModuleSubState(
            module_id=ThermocyclerModuleId("module-id"),
            is_lid_open=False,
            target_block_temperature=42.4,
            target_lid_temperature=35.3,
        )
    }
    subject.handle_action(
        actions.UpdateCommandAction(private_result=None, command=deactivate_lid_cmd)
    )
    assert subject.state.substate_by_module_id == {
        "module-id": ThermocyclerModuleSubState(
            module_id=ThermocyclerModuleId("module-id"),
            is_lid_open=False,
            target_block_temperature=42.4,
            target_lid_temperature=None,
        )
    }
    subject.handle_action(
        actions.UpdateCommandAction(private_result=None, command=deactivate_block_cmd)
    )
    assert subject.state.substate_by_module_id == {
        "module-id": ThermocyclerModuleSubState(
            module_id=ThermocyclerModuleId("module-id"),
            is_lid_open=False,
            target_block_temperature=None,
            target_lid_temperature=None,
        )
    }


def test_handle_thermocycler_lid_commands(
    thermocycler_v1_def: ModuleDefinition,
) -> None:
    """It should update thermocycler's lid status after executing lid commands."""
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

    open_lid_cmd = tc_commands.OpenLid.construct(  # type: ignore[call-arg]
        params=tc_commands.OpenLidParams(moduleId="module-id"),
        result=tc_commands.OpenLidResult(),
    )
    close_lid_cmd = tc_commands.CloseLid.construct(  # type: ignore[call-arg]
        params=tc_commands.CloseLidParams(moduleId="module-id"),
        result=tc_commands.CloseLidResult(),
    )

    subject = ModuleStore()

    subject.handle_action(
        actions.UpdateCommandAction(private_result=None, command=load_module_cmd)
    )
    subject.handle_action(
        actions.UpdateCommandAction(private_result=None, command=open_lid_cmd)
    )
    assert subject.state.substate_by_module_id == {
        "module-id": ThermocyclerModuleSubState(
            module_id=ThermocyclerModuleId("module-id"),
            is_lid_open=True,
            target_block_temperature=None,
            target_lid_temperature=None,
        )
    }

    subject.handle_action(
        actions.UpdateCommandAction(private_result=None, command=close_lid_cmd)
    )
    assert subject.state.substate_by_module_id == {
        "module-id": ThermocyclerModuleSubState(
            module_id=ThermocyclerModuleId("module-id"),
            is_lid_open=False,
            target_block_temperature=None,
            target_lid_temperature=None,
        )
    }
