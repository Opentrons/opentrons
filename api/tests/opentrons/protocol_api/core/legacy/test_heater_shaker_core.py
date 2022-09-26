"""Tests for the legacy Protocol API module core implementations."""
import pytest
from decoy import Decoy

from opentrons.drivers.types import HeaterShakerLabwareLatchStatus
from opentrons.hardware_control import SynchronousAdapter
from opentrons.hardware_control.modules import HeaterShaker
from opentrons.hardware_control.modules.types import (
    HeaterShakerModuleModel,
    TemperatureStatus,
    SpeedStatus,
)
from opentrons.protocols.geometry.module_geometry import HeaterShakerGeometry

from opentrons.protocol_api.core.protocol_api.legacy_module_core import (
    LegacyHeaterShakerCore,
    create_module_core,
)

SyncHeaterShakerHardware = SynchronousAdapter[HeaterShaker]


@pytest.fixture
def mock_geometry(decoy: Decoy) -> HeaterShakerGeometry:
    """Get a mock heater-shaker geometry."""
    return decoy.mock(cls=HeaterShakerGeometry)


@pytest.fixture
def mock_sync_module_hardware(decoy: Decoy) -> SyncHeaterShakerHardware:
    """Get a mock module hardware control interface."""
    return decoy.mock(name="SyncHeaterShakerHardware")  # type: ignore[no-any-return]


@pytest.fixture
def subject(
    mock_geometry: HeaterShakerGeometry,
    mock_sync_module_hardware: SyncHeaterShakerHardware,
) -> LegacyHeaterShakerCore:
    """Get a legacy module implementation core with mocked out dependencies."""
    return LegacyHeaterShakerCore(
        requested_model=HeaterShakerModuleModel.HEATER_SHAKER_V1,
        geometry=mock_geometry,
        sync_module_hardware=mock_sync_module_hardware,
    )


def test_create(
    decoy: Decoy,
    mock_geometry: HeaterShakerGeometry,
) -> None:
    """It should be able to create a magnetic module core."""
    mock_module_hardware_api = decoy.mock(cls=HeaterShaker)
    result = create_module_core(
        geometry=mock_geometry,
        module_hardware_api=mock_module_hardware_api,
        requested_model=HeaterShakerModuleModel.HEATER_SHAKER_V1,
    )

    assert isinstance(result, LegacyHeaterShakerCore)


def test_get_current_temperature(
    decoy: Decoy,
    mock_sync_module_hardware: SyncHeaterShakerHardware,
    subject: LegacyHeaterShakerCore,
) -> None:
    """It should report the current temperature."""
    decoy.when(mock_sync_module_hardware.temperature).then_return(42.0)
    result = subject.get_current_temperature()
    assert result == 42.0


def test_get_target_temperature(
    decoy: Decoy,
    mock_sync_module_hardware: SyncHeaterShakerHardware,
    subject: LegacyHeaterShakerCore,
) -> None:
    """It should report the target temperature."""
    decoy.when(mock_sync_module_hardware.target_temperature).then_return(42.0)
    result = subject.get_target_temperature()
    assert result == 42.0


def test_get_temperature_status(
    decoy: Decoy,
    mock_sync_module_hardware: SyncHeaterShakerHardware,
    subject: LegacyHeaterShakerCore,
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
    subject: LegacyHeaterShakerCore,
) -> None:
    """It should report the current speed."""
    decoy.when(mock_sync_module_hardware.speed).then_return(321)
    result = subject.get_current_speed()
    assert result == 321


def test_get_target_speed(
    decoy: Decoy,
    mock_sync_module_hardware: SyncHeaterShakerHardware,
    subject: LegacyHeaterShakerCore,
) -> None:
    """It should report the target speed."""
    decoy.when(mock_sync_module_hardware.target_speed).then_return(321)
    result = subject.get_target_speed()
    assert result == 321


def test_get_speed_status(
    decoy: Decoy,
    mock_sync_module_hardware: SyncHeaterShakerHardware,
    subject: LegacyHeaterShakerCore,
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
    subject: LegacyHeaterShakerCore,
) -> None:
    """It should report the labware latch status."""
    decoy.when(mock_sync_module_hardware.labware_latch_status).then_return(
        HeaterShakerLabwareLatchStatus.OPENING
    )
    result = subject.get_labware_latch_status()
    assert result == HeaterShakerLabwareLatchStatus.OPENING
