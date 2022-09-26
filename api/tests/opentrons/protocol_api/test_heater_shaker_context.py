"""Tests for Protocol API temperature module contexts."""
import pytest
from decoy import Decoy

from opentrons.broker import Broker
from opentrons.drivers.types import HeaterShakerLabwareLatchStatus
from opentrons.hardware_control.modules import TemperatureStatus, SpeedStatus
from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocol_api import MAX_SUPPORTED_VERSION, HeaterShakerContext

from .types import ProtocolCore, HeaterShakerCore


@pytest.fixture
def mock_core(decoy: Decoy) -> HeaterShakerCore:
    """Get a mock module implementation core."""
    return decoy.mock(cls=HeaterShakerCore)


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
    mock_core: HeaterShakerCore,
    mock_protocol_core: ProtocolCore,
    mock_broker: Broker,
) -> HeaterShakerContext:
    """Get a temperature module context with its dependencies mocked out."""
    return HeaterShakerContext(
        core=mock_core,
        protocol_core=mock_protocol_core,
        broker=mock_broker,
        api_version=api_version,
    )


def test_get_current_temperature(
    decoy: Decoy, mock_core: HeaterShakerCore, subject: HeaterShakerContext
) -> None:
    """It should get the current temperature from the core."""
    decoy.when(mock_core.get_current_temperature()).then_return(42.0)
    result = subject.current_temperature
    assert result == 42.0


def test_get_target_temperature(
    decoy: Decoy, mock_core: HeaterShakerCore, subject: HeaterShakerContext
) -> None:
    """It should get the target temperature from the core."""
    decoy.when(mock_core.get_target_temperature()).then_return(42.0)
    result = subject.target_temperature
    assert result == 42.0


def test_get_current_speed(
    decoy: Decoy, mock_core: HeaterShakerCore, subject: HeaterShakerContext
) -> None:
    """It should get the current temperature from the core."""
    decoy.when(mock_core.get_current_speed()).then_return(321)
    result = subject.current_speed
    assert result == 321


def test_get_target_speed(
    decoy: Decoy, mock_core: HeaterShakerCore, subject: HeaterShakerContext
) -> None:
    """It should get the target temperature from the core."""
    decoy.when(mock_core.get_target_speed()).then_return(321)
    result = subject.target_speed
    assert result == 321


def test_get_temperature_status(
    decoy: Decoy, mock_core: HeaterShakerCore, subject: HeaterShakerContext
) -> None:
    """It should get the temperature status from the core."""
    decoy.when(mock_core.get_temperature_status()).then_return(
        TemperatureStatus.HEATING
    )
    result = subject.temperature_status
    assert result == "heating"


def test_get_speed_status(
    decoy: Decoy, mock_core: HeaterShakerCore, subject: HeaterShakerContext
) -> None:
    """It should get the speed status from the core."""
    decoy.when(mock_core.get_speed_status()).then_return(SpeedStatus.ACCELERATING)
    result = subject.speed_status
    assert result == "speeding up"


def test_get_labware_latch_status(
    decoy: Decoy, mock_core: HeaterShakerCore, subject: HeaterShakerContext
) -> None:
    """It should get the speed status from the core."""
    decoy.when(mock_core.get_labware_latch_status()).then_return(
        HeaterShakerLabwareLatchStatus.OPENING
    )
    result = subject.labware_latch_status
    assert result == "opening"
