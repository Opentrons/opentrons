"""Tests for Protocol API thermocycler module contexts."""
import pytest
from decoy import Decoy

from opentrons.broker import Broker
from opentrons.drivers.types import ThermocyclerLidStatus
from opentrons.hardware_control.modules import TemperatureStatus
from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocol_api import MAX_SUPPORTED_VERSION, ThermocyclerContext

from .types import ProtocolCore, ThermocyclerCore


@pytest.fixture
def mock_core(decoy: Decoy) -> ThermocyclerCore:
    """Get a mock module implementation core."""
    return decoy.mock(cls=ThermocyclerCore)


@pytest.fixture
def mock_protocol_core(decoy: Decoy) -> ProtocolCore:
    """Get a mock protocol implementation core."""
    return decoy.mock(cls=ProtocolCore)


@pytest.fixture
def mock_broker(decoy: Decoy) -> Broker:
    """Get a mock command message broker."""
    return decoy.mock(cls=Broker)


@pytest.fixture
def api_version() -> APIVersion:
    """Get an API version to apply to the interface."""
    return MAX_SUPPORTED_VERSION


@pytest.fixture
def subject(
    api_version: APIVersion,
    mock_core: ThermocyclerCore,
    mock_protocol_core: ProtocolCore,
    mock_broker: Broker,
) -> ThermocyclerContext:
    """Get a thermocycler module context with its dependencies mocked out."""
    return ThermocyclerContext(
        core=mock_core,
        protocol_core=mock_protocol_core,
        broker=mock_broker,
        api_version=api_version,
    )


def test_get_lid_position(
    decoy: Decoy, mock_core: ThermocyclerCore, subject: ThermocyclerContext
) -> None:
    """It should get the lid position status from the core."""
    decoy.when(mock_core.get_lid_position()).then_return(ThermocyclerLidStatus.OPEN)
    result = subject.lid_position
    assert result == "open"


def test_get_block_temperature_status(
    decoy: Decoy, mock_core: ThermocyclerCore, subject: ThermocyclerContext
) -> None:
    """It should get the block temperature status from the core."""
    decoy.when(mock_core.get_block_temperature_status()).then_return(
        TemperatureStatus.IDLE
    )
    result = subject.block_temperature_status
    assert result == "idle"


def test_get_lid_temperature_status(
    decoy: Decoy, mock_core: ThermocyclerCore, subject: ThermocyclerContext
) -> None:
    """It should get the lid temperature status from the core."""
    decoy.when(mock_core.get_lid_temperature_status()).then_return(
        TemperatureStatus.IDLE
    )
    result = subject.lid_temperature_status
    assert result == "idle"


def test_get_block_temperature(
    decoy: Decoy, mock_core: ThermocyclerCore, subject: ThermocyclerContext
) -> None:
    """It should get the current block temperature from the core."""
    decoy.when(mock_core.get_block_temperature()).then_return(12.3)
    result = subject.block_temperature
    assert result == 12.3


def test_get_block_target_temperature(
    decoy: Decoy, mock_core: ThermocyclerCore, subject: ThermocyclerContext
) -> None:
    """It should get the target block temperature from the core."""
    decoy.when(mock_core.get_block_target_temperature()).then_return(12.3)
    result = subject.block_target_temperature
    assert result == 12.3


def test_get_lid_temperature(
    decoy: Decoy, mock_core: ThermocyclerCore, subject: ThermocyclerContext
) -> None:
    """It should get the current lid temperature from the core."""
    decoy.when(mock_core.get_lid_temperature()).then_return(42.0)
    result = subject.lid_temperature
    assert result == 42.0


def test_get_lid_target_temperature(
    decoy: Decoy, mock_core: ThermocyclerCore, subject: ThermocyclerContext
) -> None:
    """It should get the target lid temperature from the core."""
    decoy.when(mock_core.get_lid_target_temperature()).then_return(42.0)
    result = subject.lid_target_temperature
    assert result == 42.0


def test_get_ramp_rate(
    decoy: Decoy, mock_core: ThermocyclerCore, subject: ThermocyclerContext
) -> None:
    """It should get the current ramp rate from the core."""
    decoy.when(mock_core.get_ramp_rate()).then_return(1.23)
    result = subject.ramp_rate
    assert result == 1.23


def test_get_hold_time(
    decoy: Decoy, mock_core: ThermocyclerCore, subject: ThermocyclerContext
) -> None:
    """It should get the current hold time from the core."""
    decoy.when(mock_core.get_hold_time()).then_return(13.37)
    result = subject.hold_time
    assert result == 13.37


def test_get_total_cycle_count(
    decoy: Decoy, mock_core: ThermocyclerCore, subject: ThermocyclerContext
) -> None:
    """It should get the total cycle count from the core."""
    decoy.when(mock_core.get_total_cycle_count()).then_return(321)
    result = subject.total_cycle_count
    assert result == 321


def test_get_current_cycle_index(
    decoy: Decoy, mock_core: ThermocyclerCore, subject: ThermocyclerContext
) -> None:
    """It should get the current cycle index from the core."""
    decoy.when(mock_core.get_current_cycle_index()).then_return(123)
    result = subject.current_cycle_index
    assert result == 123


def test_get_total_step_count(
    decoy: Decoy, mock_core: ThermocyclerCore, subject: ThermocyclerContext
) -> None:
    """It should get the total step count from the core."""
    decoy.when(mock_core.get_total_step_count()).then_return(1337)
    result = subject.total_step_count
    assert result == 1337


def test_get_current_step_index(
    decoy: Decoy, mock_core: ThermocyclerCore, subject: ThermocyclerContext
) -> None:
    """It should get the current step index from the core."""
    decoy.when(mock_core.get_current_step_index()).then_return(42)
    result = subject.current_step_index
    assert result == 42
