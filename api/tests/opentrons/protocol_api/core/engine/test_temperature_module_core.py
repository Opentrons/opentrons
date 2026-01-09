"""Test temperature module core."""

import pytest
from decoy import Decoy

from opentrons.hardware_control import SynchronousAdapter
from opentrons.hardware_control.modules import TempDeck
from opentrons.hardware_control.modules.types import ModuleType, TemperatureStatus
from opentrons.protocol_api import MAX_SUPPORTED_VERSION
from opentrons.protocol_api.core.engine.module_core import TemperatureModuleCore
from opentrons.protocol_api.core.engine.protocol import ProtocolCore
from opentrons.protocol_api.core.engine.tasks import EngineTaskCore
from opentrons.protocol_engine import commands as cmd
from opentrons.protocol_engine.clients import SyncClient as EngineClient

TempDeckHardware = SynchronousAdapter[TempDeck]


@pytest.fixture
def mock_engine_client(decoy: Decoy) -> EngineClient:
    """Get a mock ProtocolEngine synchronous client."""
    return decoy.mock(cls=EngineClient)


@pytest.fixture
def mock_sync_module_hardware(decoy: Decoy) -> TempDeckHardware:
    """Get a mock synchronous module hardware."""
    return decoy.mock(name="TempDeckHardware")  # type: ignore[no-any-return]


@pytest.fixture
def mock_protocol_core(decoy: Decoy) -> ProtocolCore:
    """Get a mock protocol core."""
    return decoy.mock(cls=ProtocolCore)


@pytest.fixture
def subject(
    decoy: Decoy,
    mock_engine_client: EngineClient,
    mock_sync_module_hardware: TempDeckHardware,
    mock_protocol_core: ProtocolCore,
) -> TemperatureModuleCore:
    """Get a mock of TemperatureModuleCore."""
    return TemperatureModuleCore(
        module_id="1234",
        engine_client=mock_engine_client,
        api_version=MAX_SUPPORTED_VERSION,
        sync_module_hardware=mock_sync_module_hardware,
        protocol_core=mock_protocol_core,
    )


def test_create(
    decoy: Decoy,
    mock_engine_client: EngineClient,
    mock_sync_module_hardware: TempDeckHardware,
    mock_protocol_core: ProtocolCore,
) -> None:
    """It should be able to create a temperature module core."""
    result = TemperatureModuleCore(
        module_id="1234",
        engine_client=mock_engine_client,
        api_version=MAX_SUPPORTED_VERSION,
        sync_module_hardware=mock_sync_module_hardware,
        protocol_core=mock_protocol_core,
    )

    assert result.module_id == "1234"
    assert result.MODULE_TYPE == ModuleType.TEMPERATURE


def test_set_target_temperature(
    decoy: Decoy,
    subject: TemperatureModuleCore,
    mock_engine_client: EngineClient,
) -> None:
    """Should verify EngineClient call to set_target_temperature and return an EngineTaskCore."""
    task_mock = decoy.mock(cls=EngineTaskCore)
    decoy.when(
        mock_engine_client.execute_command_without_recovery(
            cmd.temperature_module.SetTargetTemperatureParams(
                moduleId="1234", celsius=38.9
            )
        ),
    ).then_return(
        cmd.temperature_module.SetTargetTemperatureResult(
            targetTemperature=38.9, taskId="taskId"
        )
    )
    task_mock._id = "taskId"
    result = subject.set_target_temperature(38.9)
    assert isinstance(result, EngineTaskCore)
    assert result._id == "taskId"


def test_wait_for_target_temperature(
    decoy: Decoy,
    subject: TemperatureModuleCore,
    mock_engine_client: EngineClient,
) -> None:
    """Should verify EngineClient call to wait_for_target_temperature."""
    subject.wait_for_target_temperature()

    decoy.verify(
        mock_engine_client.execute_command(
            cmd.temperature_module.WaitForTemperatureParams(
                moduleId="1234", celsius=None
            )
        ),
        times=1,
    )


def test_deactivate(
    decoy: Decoy,
    subject: TemperatureModuleCore,
    mock_engine_client: EngineClient,
) -> None:
    """Should verify EngineClient call to deactivate temp module."""
    subject.deactivate()

    decoy.verify(
        mock_engine_client.execute_command(
            cmd.temperature_module.DeactivateTemperatureParams(moduleId="1234")
        ),
        times=1,
    )


def test_get_target_temperature(
    decoy: Decoy,
    subject: TemperatureModuleCore,
    mock_engine_client: EngineClient,
    mock_sync_module_hardware: TempDeckHardware,
) -> None:
    """Should return the target temperature."""
    decoy.when(mock_sync_module_hardware.target).then_return(38.9)

    result = subject.get_target_temperature()

    assert result == 38.9


def test_get_status(
    decoy: Decoy,
    subject: TemperatureModuleCore,
    mock_engine_client: EngineClient,
    mock_sync_module_hardware: TempDeckHardware,
) -> None:
    """Should get temp deck status."""
    decoy.when(mock_sync_module_hardware.status).then_return(TemperatureStatus.HEATING)

    assert subject.get_status() == TemperatureStatus.HEATING


def test_get_current_temperature(
    decoy: Decoy,
    subject: TemperatureModuleCore,
    mock_engine_client: EngineClient,
    mock_sync_module_hardware: TempDeckHardware,
) -> None:
    """Should get the current module temperature."""
    decoy.when(mock_sync_module_hardware.temperature).then_return(36.5)

    assert subject.get_current_temperature() == 36.5


def test_get_serial_number(
    decoy: Decoy, subject: TemperatureModuleCore, mock_engine_client: EngineClient
) -> None:
    """It should return a serial number."""
    decoy.when(mock_engine_client.state.modules.get_serial_number("1234")).then_return(
        "abc"
    )

    assert subject.get_serial_number() == "abc"
