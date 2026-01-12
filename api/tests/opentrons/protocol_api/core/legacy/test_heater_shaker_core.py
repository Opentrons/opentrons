"""Tests for the legacy Protocol API module core implementations."""

import pytest
from decoy import Decoy

from opentrons.drivers.types import HeaterShakerLabwareLatchStatus
from opentrons.hardware_control import SyncHardwareAPI, SynchronousAdapter
from opentrons.hardware_control.modules import HeaterShaker
from opentrons.hardware_control.modules.types import (
    HeaterShakerModuleModel,
    SpeedStatus,
    TemperatureStatus,
)
from opentrons.hardware_control.types import Axis
from opentrons.protocol_api.core.legacy.legacy_module_core import (
    CannotPerformModuleAction,
    LegacyHeaterShakerCore,
    NoTargetTemperatureSetError,
    create_module_core,
)
from opentrons.protocol_api.core.legacy.legacy_protocol_core import (
    LegacyProtocolCore,
)
from opentrons.protocol_api.core.legacy.module_geometry import (
    HeaterShakerGeometry,
)
from opentrons.types import Location, Point

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
def mock_sync_hardware_api(decoy: Decoy) -> SyncHardwareAPI:
    """Get a mock sync hardware API."""
    return decoy.mock(cls=SyncHardwareAPI)


@pytest.fixture
def mock_protocol_core(
    decoy: Decoy, mock_sync_hardware_api: SyncHardwareAPI
) -> LegacyProtocolCore:
    """Get a mock protocol core."""
    mock_protocol_core = decoy.mock(cls=LegacyProtocolCore)
    decoy.when(mock_protocol_core.get_hardware()).then_return(mock_sync_hardware_api)
    return mock_protocol_core


@pytest.fixture
def subject(
    mock_geometry: HeaterShakerGeometry,
    mock_sync_module_hardware: SyncHeaterShakerHardware,
    mock_protocol_core: LegacyProtocolCore,
) -> LegacyHeaterShakerCore:
    """Get a legacy module implementation core with mocked out dependencies."""
    return LegacyHeaterShakerCore(
        requested_model=HeaterShakerModuleModel.HEATER_SHAKER_V1,
        geometry=mock_geometry,
        sync_module_hardware=mock_sync_module_hardware,
        protocol_core=mock_protocol_core,
    )


def test_create(
    decoy: Decoy,
    mock_geometry: HeaterShakerGeometry,
    mock_protocol_core: LegacyProtocolCore,
) -> None:
    """It should be able to create a magnetic module core."""
    mock_module_hardware_api = decoy.mock(cls=HeaterShaker)
    result = create_module_core(
        geometry=mock_geometry,
        module_hardware_api=mock_module_hardware_api,
        requested_model=HeaterShakerModuleModel.HEATER_SHAKER_V1,
        protocol_core=mock_protocol_core,
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


def test_set_target_temperature(
    decoy: Decoy,
    mock_sync_module_hardware: SyncHeaterShakerHardware,
    subject: LegacyHeaterShakerCore,
) -> None:
    """It should set the target temperature with the hardware."""
    subject.set_target_temperature(42.0)

    decoy.verify(mock_sync_module_hardware.start_set_temperature(42.0), times=1)


def test_wait_for_target_temperature(
    decoy: Decoy,
    mock_sync_module_hardware: SyncHeaterShakerHardware,
    subject: LegacyHeaterShakerCore,
) -> None:
    """It should wait for the target temperature with the hardware."""
    decoy.when(subject.get_target_temperature()).then_return(42.0)

    subject.wait_for_target_temperature()

    decoy.verify(mock_sync_module_hardware.await_temperature(42.0), times=1)


def test_wait_for_temperature_no_target(
    decoy: Decoy,
    subject: LegacyHeaterShakerCore,
) -> None:
    """It should raise a NoTargetTemperatureSetError."""
    decoy.when(subject.get_target_temperature()).then_return(None)

    with pytest.raises(NoTargetTemperatureSetError):
        subject.wait_for_target_temperature()


def test_set_and_wait_for_shake_speed(
    decoy: Decoy,
    mock_sync_module_hardware: SyncHeaterShakerHardware,
    mock_geometry: HeaterShakerGeometry,
    mock_sync_hardware_api: SyncHardwareAPI,
    mock_protocol_core: LegacyProtocolCore,
    subject: LegacyHeaterShakerCore,
) -> None:
    """It should set and wait for the target speed with the hardware."""
    decoy.when(subject.get_labware_latch_status()).then_return(
        HeaterShakerLabwareLatchStatus.IDLE_CLOSED
    )
    decoy.when(mock_protocol_core.get_last_location()).then_return(
        Location(point=Point(x=1, y=2, z=3), labware=None)
    )
    decoy.when(
        mock_geometry.is_pipette_blocking_shake_movement(
            Location(point=Point(x=1, y=2, z=3), labware=None)
        )
    ).then_return(True)

    subject.set_and_wait_for_shake_speed(1337)

    decoy.verify(
        mock_sync_hardware_api.home(axes=[Axis.Z, Axis.A]),
        mock_protocol_core.set_last_location(None),
        mock_sync_module_hardware.set_speed(rpm=1337),
    )


def test_set_and_wait_for_shake_speed_no_prep(
    decoy: Decoy,
    mock_sync_module_hardware: SyncHeaterShakerHardware,
    mock_geometry: HeaterShakerGeometry,
    mock_sync_hardware_api: SyncHardwareAPI,
    mock_protocol_core: LegacyProtocolCore,
    subject: LegacyHeaterShakerCore,
) -> None:
    """It should set and wait for the target speed with the hardware."""
    decoy.when(subject.get_labware_latch_status()).then_return(
        HeaterShakerLabwareLatchStatus.IDLE_CLOSED
    )
    decoy.when(mock_protocol_core.get_last_location()).then_return(
        Location(point=Point(x=1, y=2, z=3), labware=None)
    )
    decoy.when(
        mock_geometry.is_pipette_blocking_shake_movement(
            Location(point=Point(x=1, y=2, z=3), labware=None)
        )
    ).then_return(False)

    subject.set_and_wait_for_shake_speed(1337)

    decoy.verify(mock_sync_hardware_api.home(axes=[Axis.Z, Axis.A]), times=0)
    decoy.verify(mock_sync_module_hardware.set_speed(rpm=1337), times=1)


@pytest.mark.parametrize(
    "latch_status",
    [
        HeaterShakerLabwareLatchStatus.IDLE_UNKNOWN,
        HeaterShakerLabwareLatchStatus.UNKNOWN,
        HeaterShakerLabwareLatchStatus.CLOSING,
        HeaterShakerLabwareLatchStatus.IDLE_OPEN,
        HeaterShakerLabwareLatchStatus.OPENING,
    ],
)
def test_set_and_wait_for_shake_speed_raises(
    decoy: Decoy,
    latch_status: HeaterShakerLabwareLatchStatus,
    subject: LegacyHeaterShakerCore,
) -> None:
    """It should raise a CannotPerformModuleAction when latch is not closed."""
    decoy.when(subject.get_labware_latch_status()).then_return(latch_status)

    with pytest.raises(CannotPerformModuleAction):
        subject.set_and_wait_for_shake_speed(rpm=1337)


def test_open_labware_latch(
    decoy: Decoy,
    mock_sync_module_hardware: SyncHeaterShakerHardware,
    mock_geometry: HeaterShakerGeometry,
    mock_sync_hardware_api: SyncHardwareAPI,
    mock_protocol_core: LegacyProtocolCore,
    subject: LegacyHeaterShakerCore,
) -> None:
    """It should open the labware latch with the hardware."""
    decoy.when(subject.get_speed_status()).then_return(SpeedStatus.IDLE)
    decoy.when(mock_protocol_core.get_last_location()).then_return(
        Location(point=Point(x=1, y=2, z=3), labware=None)
    )
    decoy.when(
        mock_geometry.is_pipette_blocking_latch_movement(
            Location(point=Point(x=1, y=2, z=3), labware=None)
        )
    ).then_return(True)

    subject.open_labware_latch()

    decoy.verify(
        mock_sync_hardware_api.home(axes=[Axis.Z, Axis.A]),
        mock_protocol_core.set_last_location(None),
        mock_sync_module_hardware.open_labware_latch(),
    )


def test_open_labware_latch_no_prep(
    decoy: Decoy,
    mock_sync_module_hardware: SyncHeaterShakerHardware,
    mock_geometry: HeaterShakerGeometry,
    mock_sync_hardware_api: SyncHardwareAPI,
    mock_protocol_core: LegacyProtocolCore,
    subject: LegacyHeaterShakerCore,
) -> None:
    """It should open the labware latch with the hardware."""
    decoy.when(subject.get_speed_status()).then_return(SpeedStatus.IDLE)
    decoy.when(mock_protocol_core.get_last_location()).then_return(
        Location(point=Point(x=1, y=2, z=3), labware=None)
    )
    decoy.when(
        mock_geometry.is_pipette_blocking_latch_movement(
            Location(point=Point(x=1, y=2, z=3), labware=None)
        )
    ).then_return(False)

    subject.open_labware_latch()

    decoy.verify(mock_sync_hardware_api.home(axes=[Axis.Z, Axis.A]), times=0)
    decoy.verify(
        mock_sync_module_hardware.open_labware_latch(),
        times=1,
    )


@pytest.mark.parametrize(
    "speed_status",
    [
        SpeedStatus.DECELERATING,
        SpeedStatus.ACCELERATING,
        SpeedStatus.HOLDING,
        SpeedStatus.ERROR,
    ],
)
def test_open_labware_latch_raises(
    decoy: Decoy,
    speed_status: SpeedStatus,
    subject: LegacyHeaterShakerCore,
) -> None:
    """It should raise a CannotPerformModuleAction when heater-shaker is not idle."""
    decoy.when(subject.get_speed_status()).then_return(speed_status)

    with pytest.raises(CannotPerformModuleAction):
        subject.open_labware_latch()


def test_close_labware_latch(
    decoy: Decoy,
    mock_sync_module_hardware: SyncHeaterShakerHardware,
    subject: LegacyHeaterShakerCore,
) -> None:
    """It should close the labware latch with the hardware."""
    subject.close_labware_latch()

    decoy.verify(mock_sync_module_hardware.close_labware_latch(), times=1)


def test_deactivate_shaker(
    decoy: Decoy,
    mock_sync_module_hardware: SyncHeaterShakerHardware,
    subject: LegacyHeaterShakerCore,
) -> None:
    """It should stop shaking with the hardware."""
    subject.deactivate_shaker()

    decoy.verify(mock_sync_module_hardware.deactivate_shaker(), times=1)


def test_deactivate_heater(
    decoy: Decoy,
    mock_sync_module_hardware: SyncHeaterShakerHardware,
    subject: LegacyHeaterShakerCore,
) -> None:
    """It should stop heating with the hardware."""
    subject.deactivate_heater()

    decoy.verify(mock_sync_module_hardware.deactivate_heater(), times=1)
