"""Tests for the engine based Protocol API module core implementations."""

from typing import cast

import pytest
from _pytest.fixtures import SubRequest
from decoy import Decoy

from ... import versions_at_or_above, versions_below
from opentrons.drivers.types import ThermocyclerLidStatus
from opentrons.hardware_control import SynchronousAdapter
from opentrons.hardware_control.modules import (
    ModuleType,
    TemperatureStatus,
    Thermocycler,
)
from opentrons.protocol_api import MAX_SUPPORTED_VERSION
from opentrons.protocol_api.core.engine.module_core import ThermocyclerModuleCore
from opentrons.protocol_api.core.engine.protocol import ProtocolCore
from opentrons.protocol_api.core.engine.tasks import EngineTaskCore
from opentrons.protocol_engine import commands as cmd
from opentrons.protocol_engine.clients import SyncClient as EngineClient
from opentrons.protocols.api_support.types import APIVersion

SyncThermocyclerHardware = SynchronousAdapter[Thermocycler]


@pytest.fixture
def mock_engine_client(decoy: Decoy) -> EngineClient:
    """Get a mock ProtocolEngine synchronous client."""
    return decoy.mock(cls=EngineClient)


@pytest.fixture
def mock_sync_module_hardware(decoy: Decoy) -> SyncThermocyclerHardware:
    """Get a mock synchronous module hardware."""
    return decoy.mock(name="SyncThermocyclerHardware")  # type: ignore[no-any-return]


@pytest.fixture
def mock_protocol_core(decoy: Decoy) -> ProtocolCore:
    """Get a mock protocol core."""
    return decoy.mock(cls=ProtocolCore)


@pytest.fixture
def subject(
    mock_engine_client: EngineClient,
    mock_sync_module_hardware: SyncThermocyclerHardware,
    mock_protocol_core: ProtocolCore,
) -> ThermocyclerModuleCore:
    """Get a ThermocyclerModuleCore test subject."""
    return ThermocyclerModuleCore(
        module_id="1234",
        engine_client=mock_engine_client,
        api_version=MAX_SUPPORTED_VERSION,
        sync_module_hardware=mock_sync_module_hardware,
        protocol_core=mock_protocol_core,
    )


@pytest.fixture(params=versions_below(APIVersion(2, 21), flex_only=False))
def subject_below_221(
    request: SubRequest,
    mock_engine_client: EngineClient,
    mock_sync_module_hardware: SyncThermocyclerHardware,
    mock_protocol_core: ProtocolCore,
) -> ThermocyclerModuleCore:
    """Get a ThermocyclerCore below API version 2.21."""
    return ThermocyclerModuleCore(
        module_id="1234",
        engine_client=mock_engine_client,
        api_version=cast(APIVersion, request.param),
        sync_module_hardware=mock_sync_module_hardware,
        protocol_core=mock_protocol_core,
    )


@pytest.fixture(params=versions_at_or_above(APIVersion(2, 21)))
def subject_at_or_above_221(
    request: SubRequest,
    mock_engine_client: EngineClient,
    mock_sync_module_hardware: SyncThermocyclerHardware,
    mock_protocol_core: ProtocolCore,
) -> ThermocyclerModuleCore:
    """Get a ThermocyclerCore below API version 2.21."""
    return ThermocyclerModuleCore(
        module_id="1234",
        engine_client=mock_engine_client,
        api_version=cast(APIVersion, request.param),
        sync_module_hardware=mock_sync_module_hardware,
        protocol_core=mock_protocol_core,
    )


def test_create(
    decoy: Decoy,
    mock_engine_client: EngineClient,
    mock_sync_module_hardware: SyncThermocyclerHardware,
    mock_protocol_core: ProtocolCore,
) -> None:
    """It should be able to create a thermocycler module core."""
    result = ThermocyclerModuleCore(
        module_id="1234",
        engine_client=mock_engine_client,
        api_version=MAX_SUPPORTED_VERSION,
        sync_module_hardware=mock_sync_module_hardware,
        protocol_core=mock_protocol_core,
    )

    assert result.module_id == "1234"
    assert result.MODULE_TYPE == ModuleType.THERMOCYCLER


def test_open_lid(
    decoy: Decoy, mock_engine_client: EngineClient, subject: ThermocyclerModuleCore
) -> None:
    """It should open the lid with the engine client."""
    result = subject.open_lid()

    decoy.verify(
        mock_engine_client.execute_command(
            cmd.thermocycler.OpenLidParams(moduleId="1234")
        ),
        times=1,
    )
    assert result == ThermocyclerLidStatus.OPEN


def test_close_lid(
    decoy: Decoy, mock_engine_client: EngineClient, subject: ThermocyclerModuleCore
) -> None:
    """It should close the lid with the engine client."""
    result = subject.close_lid()

    decoy.verify(
        mock_engine_client.execute_command(
            cmd.thermocycler.CloseLidParams(moduleId="1234")
        ),
        times=1,
    )
    assert result == ThermocyclerLidStatus.CLOSED


def test_set_target_block_temperature(
    decoy: Decoy, mock_engine_client: EngineClient, subject: ThermocyclerModuleCore
) -> None:
    """It should set the block temperature with the engine client."""
    subject.set_target_block_temperature(
        celsius=42.0,
        hold_time_seconds=1.2,
        block_max_volume=3.4,
        ramp_rate=None,
    )

    decoy.verify(
        mock_engine_client.execute_command(
            cmd.thermocycler.SetTargetBlockTemperatureParams(
                moduleId="1234",
                celsius=42.0,
                blockMaxVolumeUl=3.4,
                holdTimeSeconds=1.2,
                ramp_rate=None,
            )
        ),
        times=1,
    )


def test_start_set_target_block_temperature(
    decoy: Decoy, mock_engine_client: EngineClient, subject: ThermocyclerModuleCore
) -> None:
    """It should start to set the block temperature with the engine client and return an EngineTaskCore."""
    task_mock = decoy.mock(cls=EngineTaskCore)
    decoy.when(
        mock_engine_client.execute_command_without_recovery(
            cmd.thermocycler.SetTargetBlockTemperatureParams(
                moduleId="1234",
                celsius=42.0,
                blockMaxVolumeUl=3.4,
                ramp_rate=None,
            )
        )
    ).then_return(
        cmd.thermocycler.SetTargetBlockTemperatureResult(
            targetBlockTemperature=42.0, taskId="taskId"
        )
    )
    task_mock._id = "taskId"
    result = subject.start_set_target_block_temperature(
        celsius=42.0,
        block_max_volume=3.4,
        ramp_rate=None,
    )
    assert isinstance(result, EngineTaskCore)
    assert result._id == "taskId"


def test_wait_for_block_temperature(
    decoy: Decoy, mock_engine_client: EngineClient, subject: ThermocyclerModuleCore
) -> None:
    """It should wait for the block temperature with the engine client."""
    subject.wait_for_block_temperature()

    decoy.verify(
        mock_engine_client.execute_command(
            cmd.thermocycler.WaitForBlockTemperatureParams(moduleId="1234")
        ),
        times=1,
    )


def test_set_target_lid_temperature(
    decoy: Decoy,
    mock_engine_client: EngineClient,
    subject: ThermocyclerModuleCore,
) -> None:
    """It should set the lid temperature with the engine client."""
    subject.set_target_lid_temperature(celsius=42.0)

    decoy.verify(
        mock_engine_client.execute_command(
            cmd.thermocycler.SetTargetLidTemperatureParams(
                moduleId="1234", celsius=42.0
            )
        ),
        times=1,
    )


def test_start_set_target_lid_temperature(
    decoy: Decoy,
    mock_engine_client: EngineClient,
    subject: ThermocyclerModuleCore,
) -> None:
    """It should set the lid temperature with the engine client and return an EngineTaskCore."""
    task_mock = decoy.mock(cls=EngineTaskCore)
    decoy.when(
        mock_engine_client.execute_command_without_recovery(
            cmd.thermocycler.SetTargetLidTemperatureParams(
                moduleId="1234", celsius=42.0
            )
        ),
    ).then_return(
        cmd.thermocycler.SetTargetLidTemperatureResult(
            targetLidTemperature=42.0, taskId="taskId"
        )
    )
    task_mock._id = "taskId"
    result = subject.start_set_target_lid_temperature(42.0)
    assert isinstance(result, EngineTaskCore)
    assert result._id == "taskId"


def test_wait_for_lid_temperature(
    decoy: Decoy, mock_engine_client: EngineClient, subject: ThermocyclerModuleCore
) -> None:
    """It should wait for the lid temperature with the engine client."""
    subject.wait_for_lid_temperature()

    decoy.verify(
        mock_engine_client.execute_command(
            cmd.thermocycler.WaitForLidTemperatureParams(moduleId="1234")
        ),
        times=1,
    )


def test_execute_profile_below_221(
    decoy: Decoy,
    mock_engine_client: EngineClient,
    subject_below_221: ThermocyclerModuleCore,
) -> None:
    """It should run a thermocycler profile with the engine client."""
    subject_below_221.execute_profile(
        steps=[{"temperature": 45.6, "hold_time_seconds": 12.3, "ramp_rate": 0.0}],
        repetitions=2,
        block_max_volume=78.9,
    )

    decoy.verify(
        mock_engine_client.execute_command(
            cmd.thermocycler.RunProfileParams(
                moduleId="1234",
                profile=[
                    cmd.thermocycler.RunProfileStepParams(
                        celsius=45.6, holdSeconds=12.3, rampRate=0.0
                    ),
                    cmd.thermocycler.RunProfileStepParams(
                        celsius=45.6, holdSeconds=12.3, rampRate=0.0
                    ),
                ],
                blockMaxVolumeUl=78.9,
            )
        )
    )


def test_execute_profile_above_221(
    decoy: Decoy,
    mock_engine_client: EngineClient,
    subject_at_or_above_221: ThermocyclerModuleCore,
) -> None:
    """It should run a thermocycler profile with the engine client."""
    subject_at_or_above_221.execute_profile(
        steps=[
            {"temperature": 45.6, "hold_time_seconds": 12.3, "ramp_rate": 0.0},
            {"temperature": 78.9, "hold_time_seconds": 45.6, "ramp_rate": 1.0},
        ],
        repetitions=2,
        block_max_volume=25,
    )
    decoy.verify(
        mock_engine_client.execute_command(
            cmd.thermocycler.RunExtendedProfileParams(
                moduleId="1234",
                profileElements=[
                    cmd.thermocycler.ProfileCycle(
                        repetitions=2,
                        steps=[
                            cmd.thermocycler.ProfileStep(
                                celsius=45.6, holdSeconds=12.3, rampRate=0.0
                            ),
                            cmd.thermocycler.ProfileStep(
                                celsius=78.9, holdSeconds=45.6, rampRate=1.0
                            ),
                        ],
                    )
                ],
                blockMaxVolumeUl=25,
            )
        )
    )


def test_start_execute_profile(
    decoy: Decoy,
    mock_engine_client: EngineClient,
    subject: ThermocyclerModuleCore,
) -> None:
    """It should run a thermocycler profile with the engine client and return an EngineTaskCore."""
    task_mock = decoy.mock(cls=EngineTaskCore)
    decoy.when(
        mock_engine_client.execute_command_without_recovery(
            cmd.thermocycler.StartRunExtendedProfileParams(
                moduleId="1234",
                profileElements=[
                    cmd.thermocycler.ProfileCycle(
                        repetitions=2,
                        steps=[
                            cmd.thermocycler.ProfileStep(
                                celsius=45.6, holdSeconds=12.3, rampRate=0.0
                            ),
                            cmd.thermocycler.ProfileStep(
                                celsius=78.9, holdSeconds=45.6, rampRate=1.0
                            ),
                        ],
                    )
                ],
                blockMaxVolumeUl=25,
            )
        )
    ).then_return(cmd.thermocycler.StartRunExtendedProfileResult(taskId="taskId"))
    task_mock._id = "taskId"
    result = subject.start_execute_profile(
        steps=[
            {"temperature": 45.6, "hold_time_seconds": 12.3, "ramp_rate": 0.0},
            {"temperature": 78.9, "hold_time_seconds": 45.6, "ramp_rate": 1.0},
        ],
        repetitions=2,
        block_max_volume=25,
    )
    assert isinstance(result, EngineTaskCore)
    assert result._id == "taskId"


def test_deactivate_lid(
    decoy: Decoy, mock_engine_client: EngineClient, subject: ThermocyclerModuleCore
) -> None:
    """It should turn of the heated lid with the engine client."""
    subject.deactivate_lid()

    decoy.verify(
        mock_engine_client.execute_command(
            cmd.thermocycler.DeactivateLidParams(moduleId="1234")
        ),
        times=1,
    )


def test_deactivate_block(
    decoy: Decoy, mock_engine_client: EngineClient, subject: ThermocyclerModuleCore
) -> None:
    """It should turn of the well block temperature controller with the engine client."""
    subject.deactivate_block()

    decoy.verify(
        mock_engine_client.execute_command(
            cmd.thermocycler.DeactivateBlockParams(moduleId="1234")
        ),
        times=1,
    )


def test_deactivate(
    decoy: Decoy, mock_engine_client: EngineClient, subject: ThermocyclerModuleCore
) -> None:
    """It should turn of the well block temperature controller with the engine client."""
    subject.deactivate()

    decoy.verify(
        mock_engine_client.execute_command(
            cmd.thermocycler.DeactivateBlockParams(moduleId="1234")
        ),
        mock_engine_client.execute_command(
            cmd.thermocycler.DeactivateLidParams(moduleId="1234")
        ),
    )


def test_get_lid_position(
    decoy: Decoy,
    mock_sync_module_hardware: SyncThermocyclerHardware,
    subject: ThermocyclerModuleCore,
) -> None:
    """It should report the current lid position."""
    decoy.when(mock_sync_module_hardware.lid_status).then_return(
        ThermocyclerLidStatus.OPEN
    )
    result = subject.get_lid_position()
    assert result == ThermocyclerLidStatus.OPEN


def test_get_block_temperature_status(
    decoy: Decoy,
    mock_sync_module_hardware: SyncThermocyclerHardware,
    subject: ThermocyclerModuleCore,
) -> None:
    """It should report the current block temperature status."""
    decoy.when(mock_sync_module_hardware.status).then_return(TemperatureStatus.IDLE)
    result = subject.get_block_temperature_status()
    assert result == TemperatureStatus.IDLE


def test_get_lid_temperature_status(
    decoy: Decoy,
    mock_sync_module_hardware: SyncThermocyclerHardware,
    subject: ThermocyclerModuleCore,
) -> None:
    """It should report the current lid temperature status."""
    decoy.when(mock_sync_module_hardware.lid_temp_status).then_return(
        TemperatureStatus.IDLE
    )
    result = subject.get_lid_temperature_status()
    assert result == TemperatureStatus.IDLE


def test_get_block_temperature(
    decoy: Decoy,
    mock_sync_module_hardware: SyncThermocyclerHardware,
    subject: ThermocyclerModuleCore,
) -> None:
    """It should report the current block temperature."""
    decoy.when(mock_sync_module_hardware.temperature).then_return(12.3)
    result = subject.get_block_temperature()
    assert result == 12.3


def test_get_block_target_temperature(
    decoy: Decoy,
    mock_sync_module_hardware: SyncThermocyclerHardware,
    subject: ThermocyclerModuleCore,
) -> None:
    """It should report the target block temperature."""
    decoy.when(mock_sync_module_hardware.target).then_return(12.3)
    result = subject.get_block_target_temperature()
    assert result == 12.3


def test_get_lid_temperature(
    decoy: Decoy,
    mock_sync_module_hardware: SyncThermocyclerHardware,
    subject: ThermocyclerModuleCore,
) -> None:
    """It should report the current lid temperature."""
    decoy.when(mock_sync_module_hardware.lid_temp).then_return(42.0)
    result = subject.get_lid_temperature()
    assert result == 42.0


def test_get_lid_target_temperature(
    decoy: Decoy,
    mock_sync_module_hardware: SyncThermocyclerHardware,
    subject: ThermocyclerModuleCore,
) -> None:
    """It should report the current lid temperature."""
    decoy.when(mock_sync_module_hardware.lid_target).then_return(42.0)
    result = subject.get_lid_target_temperature()
    assert result == 42.0


def test_get_ramp_rate(
    decoy: Decoy,
    mock_sync_module_hardware: SyncThermocyclerHardware,
    subject: ThermocyclerModuleCore,
) -> None:
    """It should report the ramp rate."""
    decoy.when(mock_sync_module_hardware.ramp_rate).then_return(1.23)
    result = subject.get_ramp_rate()
    assert result == 1.23


def test_get_hold_time(
    decoy: Decoy,
    mock_sync_module_hardware: SyncThermocyclerHardware,
    subject: ThermocyclerModuleCore,
) -> None:
    """It should report the hold time."""
    decoy.when(mock_sync_module_hardware.hold_time).then_return(13.37)
    result = subject.get_hold_time()
    assert result == 13.37


def test_cycle_counting(
    decoy: Decoy,
    mock_sync_module_hardware: SyncThermocyclerHardware,
    subject: ThermocyclerModuleCore,
) -> None:
    """It should keep track of cycle and step counts and indices."""
    subject.execute_profile(
        [
            {"temperature": 45.6, "hold_time_seconds": 12.3, "ramp_rate": 0.0},
            {"temperature": 78.9, "hold_time_seconds": 45.6, "ramp_rate": 0.0},
        ],
        repetitions=3,
    )

    decoy.when(mock_sync_module_hardware.current_step_index).then_return(6)

    assert subject.get_total_cycle_count() == 3
    assert subject.get_current_cycle_index() == 3
    assert subject.get_total_step_count() == 2
    assert subject.get_current_step_index() == 2

    subject.deactivate_block()

    assert subject.get_total_cycle_count() is None
    assert subject.get_current_cycle_index() is None
    assert subject.get_total_step_count() is None
    assert subject.get_current_step_index() is None


def test_get_serial_number(
    decoy: Decoy, subject: ThermocyclerModuleCore, mock_engine_client: EngineClient
) -> None:
    """It should return a serial number."""
    decoy.when(mock_engine_client.state.modules.get_serial_number("1234")).then_return(
        "abc"
    )

    assert subject.get_serial_number() == "abc"
