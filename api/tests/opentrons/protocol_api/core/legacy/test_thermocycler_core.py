"""Tests for the legacy Protocol API module core implementations."""
import pytest
from decoy import Decoy

from opentrons.drivers.types import ThermocyclerLidStatus
from opentrons.hardware_control import SynchronousAdapter
from opentrons.hardware_control.modules import Thermocycler, TemperatureStatus
from opentrons.hardware_control.modules.types import (
    ThermocyclerModuleModel,
)
from opentrons.protocols.geometry.module_geometry import ThermocyclerGeometry

from opentrons.protocol_api.core.protocol_api.protocol_context import (
    ProtocolContextImplementation,
)
from opentrons.protocol_api.core.protocol_api.legacy_module_core import (
    LegacyThermocyclerCore,
    create_module_core,
)

SyncThermocyclerHardware = SynchronousAdapter[Thermocycler]


@pytest.fixture
def mock_protocol_core(decoy: Decoy) -> ProtocolContextImplementation:
    """Get a mock protocol context implementation core."""
    return decoy.mock(cls=ProtocolContextImplementation)


@pytest.fixture
def mock_geometry(decoy: Decoy) -> ThermocyclerGeometry:
    """Get a mock thermocycler geometry."""
    return decoy.mock(cls=ThermocyclerGeometry)


@pytest.fixture
def mock_sync_module_hardware(decoy: Decoy) -> SyncThermocyclerHardware:
    """Get a mock module hardware control interface."""
    return decoy.mock(name="SyncThermocyclerHardware")  # type: ignore[no-any-return]


@pytest.fixture
def subject(
    mock_geometry: ThermocyclerGeometry,
    mock_protocol_core: ProtocolContextImplementation,
    mock_sync_module_hardware: SyncThermocyclerHardware,
) -> LegacyThermocyclerCore:
    """Get a legacy module implementation core with mocked out dependencies."""
    return LegacyThermocyclerCore(
        requested_model=ThermocyclerModuleModel.THERMOCYCLER_V1,
        protocol_core=mock_protocol_core,
        geometry=mock_geometry,
        sync_module_hardware=mock_sync_module_hardware,
    )


def test_create(
    decoy: Decoy,
    mock_geometry: ThermocyclerGeometry,
    mock_protocol_core: ProtocolContextImplementation,
) -> None:
    """It should be able to create a thermocycler module core."""
    mock_module_hardware_api = decoy.mock(cls=Thermocycler)
    result = create_module_core(
        geometry=mock_geometry,
        protocol_core=mock_protocol_core,
        module_hardware_api=mock_module_hardware_api,
        requested_model=ThermocyclerModuleModel.THERMOCYCLER_V1,
    )

    assert isinstance(result, LegacyThermocyclerCore)


def test_get_lid_position(
    decoy: Decoy,
    mock_sync_module_hardware: SyncThermocyclerHardware,
    subject: LegacyThermocyclerCore,
) -> None:
    """It should report the current lid position."""
    decoy.when(mock_sync_module_hardware.lid_status).then_return(
        ThermocyclerLidStatus.OPEN
    )
    result = subject.get_lid_position()
    assert result == "open"


def test_get_block_temperature_status(
    decoy: Decoy,
    mock_sync_module_hardware: SyncThermocyclerHardware,
    subject: LegacyThermocyclerCore,
) -> None:
    """It should report the current block temperature status."""
    decoy.when(mock_sync_module_hardware.status).then_return(TemperatureStatus.IDLE)
    result = subject.get_block_temperature_status()
    assert result == "idle"


def test_get_lid_temperature_status(
    decoy: Decoy,
    mock_sync_module_hardware: SyncThermocyclerHardware,
    subject: LegacyThermocyclerCore,
) -> None:
    """It should report the current lid temperature status."""
    decoy.when(mock_sync_module_hardware.lid_temp_status).then_return(
        TemperatureStatus.IDLE
    )
    result = subject.get_lid_temperature_status()
    assert result == "idle"


def test_get_block_temperature(
    decoy: Decoy,
    mock_sync_module_hardware: SyncThermocyclerHardware,
    subject: LegacyThermocyclerCore,
) -> None:
    """It should report the current block temperature."""
    decoy.when(mock_sync_module_hardware.temperature).then_return(12.3)
    result = subject.get_block_temperature()
    assert result == 12.3


def test_get_block_target_temperature(
    decoy: Decoy,
    mock_sync_module_hardware: SyncThermocyclerHardware,
    subject: LegacyThermocyclerCore,
) -> None:
    """It should report the target block temperature."""
    decoy.when(mock_sync_module_hardware.target).then_return(12.3)
    result = subject.get_block_target_temperature()
    assert result == 12.3


def test_get_lid_temperature(
    decoy: Decoy,
    mock_sync_module_hardware: SyncThermocyclerHardware,
    subject: LegacyThermocyclerCore,
) -> None:
    """It should report the current lid temperature."""
    decoy.when(mock_sync_module_hardware.lid_temp).then_return(42.0)
    result = subject.get_lid_temperature()
    assert result == 42.0


def test_get_lid_target_temperature(
    decoy: Decoy,
    mock_sync_module_hardware: SyncThermocyclerHardware,
    subject: LegacyThermocyclerCore,
) -> None:
    """It should report the current lid temperature."""
    decoy.when(mock_sync_module_hardware.lid_target).then_return(42.0)
    result = subject.get_lid_target_temperature()
    assert result == 42.0


def test_get_ramp_rate(
    decoy: Decoy,
    mock_sync_module_hardware: SyncThermocyclerHardware,
    subject: LegacyThermocyclerCore,
) -> None:
    """It should report the ramp rate."""
    decoy.when(mock_sync_module_hardware.ramp_rate).then_return(1.23)
    result = subject.get_ramp_rate()
    assert result == 1.23


def test_get_hold_time(
    decoy: Decoy,
    mock_sync_module_hardware: SyncThermocyclerHardware,
    subject: LegacyThermocyclerCore,
) -> None:
    """It should report the hold time."""
    decoy.when(mock_sync_module_hardware.hold_time).then_return(13.37)
    result = subject.get_hold_time()
    assert result == 13.37


def test_get_total_cycle_count(
    decoy: Decoy,
    mock_sync_module_hardware: SyncThermocyclerHardware,
    subject: LegacyThermocyclerCore,
) -> None:
    """It should report the total cycle count."""
    decoy.when(mock_sync_module_hardware.total_cycle_count).then_return(321)
    result = subject.get_total_cycle_count()
    assert result == 321


def test_get_current_cycle_index(
    decoy: Decoy,
    mock_sync_module_hardware: SyncThermocyclerHardware,
    subject: LegacyThermocyclerCore,
) -> None:
    """It should report the current cycle index."""
    decoy.when(mock_sync_module_hardware.current_cycle_index).then_return(123)
    result = subject.get_current_cycle_index()
    assert result == 123


def test_get_total_step_count(
    decoy: Decoy,
    mock_sync_module_hardware: SyncThermocyclerHardware,
    subject: LegacyThermocyclerCore,
) -> None:
    """It should report the total step count."""
    decoy.when(mock_sync_module_hardware.total_step_count).then_return(1337)
    result = subject.get_total_step_count()
    assert result == 1337


def test_get_current_step_index(
    decoy: Decoy,
    mock_sync_module_hardware: SyncThermocyclerHardware,
    subject: LegacyThermocyclerCore,
) -> None:
    """It should report the current step index."""
    decoy.when(mock_sync_module_hardware.current_step_index).then_return(42)
    result = subject.get_current_step_index()
    assert result == 42
