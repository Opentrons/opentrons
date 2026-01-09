"""Tests for the engine based Protocol API module core implementations."""

import pytest
from decoy import Decoy

from opentrons.drivers.types import HeaterShakerLabwareLatchStatus
from opentrons.hardware_control import SynchronousAdapter
from opentrons.hardware_control.modules import HeaterShaker
from opentrons.hardware_control.modules.types import (
    ModuleType,
    SpeedStatus,
    TemperatureStatus,
)
from opentrons.protocol_api import MAX_SUPPORTED_VERSION
from opentrons.protocol_api.core.engine.module_core import HeaterShakerModuleCore
from opentrons.protocol_api.core.engine.protocol import ProtocolCore
from opentrons.protocol_api.core.engine.tasks import EngineTaskCore
from opentrons.protocol_engine import commands as cmd
from opentrons.protocol_engine.clients import SyncClient as EngineClient

SyncHeaterShakerHardware = SynchronousAdapter[HeaterShaker]


@pytest.fixture
def mock_engine_client(decoy: Decoy) -> EngineClient:
    """Get a mock ProtocolEngine synchronous client."""
    return decoy.mock(cls=EngineClient)


@pytest.fixture
def mock_sync_module_hardware(decoy: Decoy) -> SyncHeaterShakerHardware:
    """Get a mock synchronous module hardware."""
    return decoy.mock(name="SyncHeaterShakerHardware")  # type: ignore[no-any-return]


@pytest.fixture
def mock_protocol_core(decoy: Decoy) -> ProtocolCore:
    """Get a mock protocol core."""
    return decoy.mock(cls=ProtocolCore)


@pytest.fixture
def subject(
    mock_engine_client: EngineClient,
    mock_sync_module_hardware: SyncHeaterShakerHardware,
    mock_protocol_core: ProtocolCore,
) -> HeaterShakerModuleCore:
    """Get a HeaterShakerModuleCore test subject."""
    return HeaterShakerModuleCore(
        module_id="1234",
        engine_client=mock_engine_client,
        api_version=MAX_SUPPORTED_VERSION,
        sync_module_hardware=mock_sync_module_hardware,
        protocol_core=mock_protocol_core,
    )


def test_create(
    decoy: Decoy,
    mock_engine_client: EngineClient,
    mock_sync_module_hardware: SyncHeaterShakerHardware,
    mock_protocol_core: ProtocolCore,
) -> None:
    """It should be able to create a heater shaker module core."""
    result = HeaterShakerModuleCore(
        module_id="1234",
        engine_client=mock_engine_client,
        api_version=MAX_SUPPORTED_VERSION,
        sync_module_hardware=mock_sync_module_hardware,
        protocol_core=mock_protocol_core,
    )

    assert result.module_id == "1234"
    assert result.MODULE_TYPE == ModuleType.HEATER_SHAKER


def test_set_target_temperature(
    decoy: Decoy, mock_engine_client: EngineClient, subject: HeaterShakerModuleCore
) -> None:
    """It should set the target temperature with the engine client and return a EngineTaskCore."""
    task_mock = decoy.mock(cls=EngineTaskCore)
    decoy.when(
        mock_engine_client.execute_command_without_recovery(
            cmd.heater_shaker.SetTargetTemperatureParams(moduleId="1234", celsius=42.0)
        )
    ).then_return(cmd.heater_shaker.SetTargetTemperatureResult(taskId="taskId"))
    task_mock._id = "taskId"
    result = subject.set_target_temperature(42.0)
    assert isinstance(result, EngineTaskCore)
    assert result._id == "taskId"


def test_wait_for_target_temperature(
    decoy: Decoy, mock_engine_client: EngineClient, subject: HeaterShakerModuleCore
) -> None:
    """It should wait for the target temperature with the engine client."""
    subject.wait_for_target_temperature()

    decoy.verify(
        mock_engine_client.execute_command(
            cmd.heater_shaker.WaitForTemperatureParams(moduleId="1234")
        ),
        times=1,
    )


def test_set_and_wait_for_shake_speed(
    decoy: Decoy, mock_engine_client: EngineClient, subject: HeaterShakerModuleCore
) -> None:
    """It should set and wait for shake speed with the engine client."""
    subject.set_and_wait_for_shake_speed(rpm=1337)

    decoy.verify(
        mock_engine_client.execute_command(
            cmd.heater_shaker.SetAndWaitForShakeSpeedParams(moduleId="1234", rpm=1337)
        ),
        times=1,
    )


def test_shake_speed(
    decoy: Decoy, mock_engine_client: EngineClient, subject: HeaterShakerModuleCore
) -> None:
    """It should set and wait for shake speed with the engine client."""
    task_mock = decoy.mock(cls=EngineTaskCore)
    decoy.when(
        mock_engine_client.execute_command_without_recovery(
            cmd.heater_shaker.SetShakeSpeedParams(moduleId="1234", rpm=1337)
        )
    ).then_return(
        cmd.heater_shaker.SetShakeSpeedResult(taskId="taskId", pipetteRetracted=True)
    )
    task_mock._id = "taskId"
    result = subject.set_shake_speed(1337)
    assert isinstance(result, EngineTaskCore)
    assert result._id == "taskId"


def test_open_labware_latch(
    decoy: Decoy, mock_engine_client: EngineClient, subject: HeaterShakerModuleCore
) -> None:
    """It should open the labware latch with the engine client."""
    subject.open_labware_latch()

    decoy.verify(
        mock_engine_client.execute_command(
            cmd.heater_shaker.OpenLabwareLatchParams(moduleId="1234")
        ),
        times=1,
    )


def test_close_labware_latch(
    decoy: Decoy, mock_engine_client: EngineClient, subject: HeaterShakerModuleCore
) -> None:
    """It should close the labware latch with the engine client."""
    subject.close_labware_latch()

    decoy.verify(
        mock_engine_client.execute_command(
            cmd.heater_shaker.CloseLabwareLatchParams(moduleId="1234")
        ),
        times=1,
    )


def test_deactivate_shaker(
    decoy: Decoy, mock_engine_client: EngineClient, subject: HeaterShakerModuleCore
) -> None:
    """It should deactivate the shaker with the engine client."""
    subject.deactivate_shaker()

    decoy.verify(
        mock_engine_client.execute_command(
            cmd.heater_shaker.DeactivateShakerParams(moduleId="1234")
        ),
        times=1,
    )


def test_deactivate_heater(
    decoy: Decoy, mock_engine_client: EngineClient, subject: HeaterShakerModuleCore
) -> None:
    """It should deactivate the heater with the engine client."""
    subject.deactivate_heater()

    decoy.verify(
        mock_engine_client.execute_command(
            cmd.heater_shaker.DeactivateHeaterParams(moduleId="1234")
        ),
        times=1,
    )


def test_get_current_temperature(
    decoy: Decoy,
    mock_sync_module_hardware: SyncHeaterShakerHardware,
    subject: HeaterShakerModuleCore,
) -> None:
    """It should report the current temperature."""
    decoy.when(mock_sync_module_hardware.temperature).then_return(42.0)
    result = subject.get_current_temperature()
    assert result == 42.0


def test_get_target_temperature(
    decoy: Decoy,
    mock_sync_module_hardware: SyncHeaterShakerHardware,
    subject: HeaterShakerModuleCore,
) -> None:
    """It should report the target temperature."""
    decoy.when(mock_sync_module_hardware.target_temperature).then_return(42.0)
    result = subject.get_target_temperature()
    assert result == 42.0


def test_get_temperature_status(
    decoy: Decoy,
    mock_sync_module_hardware: SyncHeaterShakerHardware,
    subject: HeaterShakerModuleCore,
) -> None:
    """It should report the temperature status."""
    decoy.when(mock_sync_module_hardware.temperature_status).then_return(
        TemperatureStatus.COOLING
    )
    result = subject.get_temperature_status()
    assert result == TemperatureStatus.COOLING


def test_get_current_speed(
    decoy: Decoy,
    mock_sync_module_hardware: SyncHeaterShakerHardware,
    subject: HeaterShakerModuleCore,
) -> None:
    """It should report the current speed."""
    decoy.when(mock_sync_module_hardware.speed).then_return(321)
    result = subject.get_current_speed()
    assert result == 321


def test_get_target_speed(
    decoy: Decoy,
    mock_sync_module_hardware: SyncHeaterShakerHardware,
    subject: HeaterShakerModuleCore,
) -> None:
    """It should report the target speed."""
    decoy.when(mock_sync_module_hardware.target_speed).then_return(321)
    result = subject.get_target_speed()
    assert result == 321


def test_get_speed_status(
    decoy: Decoy,
    mock_sync_module_hardware: SyncHeaterShakerHardware,
    subject: HeaterShakerModuleCore,
) -> None:
    """It should report the speed status."""
    decoy.when(mock_sync_module_hardware.speed_status).then_return(
        SpeedStatus.ACCELERATING
    )
    result = subject.get_speed_status()
    assert result == SpeedStatus.ACCELERATING


def test_get_labware_latch_status(
    decoy: Decoy,
    mock_sync_module_hardware: SyncHeaterShakerHardware,
    subject: HeaterShakerModuleCore,
) -> None:
    """It should report the labware latch status."""
    decoy.when(mock_sync_module_hardware.labware_latch_status).then_return(
        HeaterShakerLabwareLatchStatus.OPENING
    )
    result = subject.get_labware_latch_status()
    assert result == HeaterShakerLabwareLatchStatus.OPENING


def test_get_serial_number(
    decoy: Decoy, subject: HeaterShakerModuleCore, mock_engine_client: EngineClient
) -> None:
    """It should return a serial number."""
    decoy.when(mock_engine_client.state.modules.get_serial_number("1234")).then_return(
        "abc"
    )

    assert subject.get_serial_number() == "abc"
