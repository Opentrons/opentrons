"""Tests for the legacy Protocol API module core implementations."""
import pytest
from decoy import Decoy

from opentrons.hardware_control import SynchronousAdapter
from opentrons.hardware_control.modules import TempDeck
from opentrons.hardware_control.modules.types import (
    TemperatureModuleModel,
    TemperatureStatus,
)
from opentrons.protocols.geometry.module_geometry import ModuleGeometry

from opentrons.protocol_api.core.protocol_api.legacy_module_core import (
    LegacyTemperatureModuleCore,
    create_module_core,
)


@pytest.fixture
def mock_geometry(decoy: Decoy) -> ModuleGeometry:
    """Get a mock module geometry."""
    return decoy.mock(cls=ModuleGeometry)


@pytest.fixture
def mock_sync_module_hardware(decoy: Decoy) -> SynchronousAdapter[TempDeck]:
    """Get a mock synchronous temperature module hardware."""
    return decoy.mock(name="SynchronousAdapater[TempDeck]")  # type: ignore[no-any-return]


@pytest.fixture
def subject(
    mock_geometry: ModuleGeometry,
    mock_sync_module_hardware: SynchronousAdapter[TempDeck],
) -> LegacyTemperatureModuleCore:
    """Get a legacy module implementation core with mocked out dependencies."""
    return LegacyTemperatureModuleCore(
        requested_model=TemperatureModuleModel.TEMPERATURE_V1,
        geometry=mock_geometry,
        sync_module_hardware=mock_sync_module_hardware,
    )


def test_create(
    decoy: Decoy,
    mock_geometry: ModuleGeometry,
) -> None:
    """It should be able to create a temperature module core."""
    mock_module_hardware_api = decoy.mock(cls=TempDeck)
    result = create_module_core(
        geometry=mock_geometry,
        module_hardware_api=mock_module_hardware_api,
        requested_model=TemperatureModuleModel.TEMPERATURE_V1,
    )

    assert isinstance(result, LegacyTemperatureModuleCore)


def test_set_target_temperature(
    decoy: Decoy,
    mock_sync_module_hardware: SynchronousAdapter[TempDeck],
    subject: LegacyTemperatureModuleCore,
) -> None:
    """It should set the target temperature with the hardware."""
    subject.set_target_temperature(42.0)

    decoy.verify(mock_sync_module_hardware.start_set_temperature(42.0), times=1)


def test_wait_for_target_temperature(
    decoy: Decoy,
    mock_sync_module_hardware: SynchronousAdapter[TempDeck],
    subject: LegacyTemperatureModuleCore,
) -> None:
    """It should wait for the target to be reached with the hardware."""
    subject.wait_for_target_temperature(42.0)

    decoy.verify(mock_sync_module_hardware.await_temperature(42.0), times=1)


def test_deactivate(
    decoy: Decoy,
    mock_sync_module_hardware: SynchronousAdapter[TempDeck],
    subject: LegacyTemperatureModuleCore,
) -> None:
    """It should deactivate the hardware."""
    subject.deactivate()

    decoy.verify(mock_sync_module_hardware.deactivate(), times=1)


def test_get_current_temperature(
    decoy: Decoy,
    mock_sync_module_hardware: SynchronousAdapter[TempDeck],
    subject: LegacyTemperatureModuleCore,
) -> None:
    """It should get the current temperature from the hardware."""
    decoy.when(mock_sync_module_hardware.temperature).then_return(42.0)

    result = subject.get_current_temperature()

    assert result == 42.0


def test_get_target_temperature(
    decoy: Decoy,
    mock_sync_module_hardware: SynchronousAdapter[TempDeck],
    subject: LegacyTemperatureModuleCore,
) -> None:
    """It should get the current temperature from the hardware."""
    decoy.when(mock_sync_module_hardware.target).then_return(42.0)

    result = subject.get_target_temperature()

    assert result == 42.0


def test_get_status(
    decoy: Decoy,
    mock_sync_module_hardware: SynchronousAdapter[TempDeck],
    subject: LegacyTemperatureModuleCore,
) -> None:
    """It should get the status string from the hardware."""
    decoy.when(mock_sync_module_hardware.status).then_return(TemperatureStatus.HEATING)

    result = subject.get_status()

    assert result == TemperatureStatus.HEATING
