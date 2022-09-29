"""Tests for Protocol API temperature module contexts."""
import pytest
from decoy import Decoy, matchers

from opentrons.broker import Broker
from opentrons.drivers.types import HeaterShakerLabwareLatchStatus
from opentrons.hardware_control.modules import TemperatureStatus, SpeedStatus
from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocol_api import MAX_SUPPORTED_VERSION, HeaterShakerContext
from opentrons.protocol_api.module_contexts import (
    NoTargetTemperatureSetError,
    CannotPerformModuleAction,
)

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


def test_set_target_temperature(
    decoy: Decoy,
    mock_core: HeaterShakerCore,
    mock_broker: Broker,
    subject: HeaterShakerContext,
) -> None:
    """It should set the temperature via the core."""
    subject.set_target_temperature(42.0)

    decoy.verify(
        mock_broker.publish(
            "command",
            matchers.DictMatching(
                {
                    "$": "before",
                    "name": "command.HEATER_SHAKER_SET_TARGET_TEMPERATURE",
                }
            ),
        ),
        mock_core.set_target_temperature(celsius=42.0),
        mock_broker.publish(
            "command",
            matchers.DictMatching({"$": "after"}),
        ),
    )


def test_wait_for_temperature(
    decoy: Decoy,
    mock_core: HeaterShakerCore,
    mock_broker: Broker,
    subject: HeaterShakerContext,
) -> None:
    """It should wait for temperature via the core."""
    decoy.when(mock_core.get_target_temperature()).then_return(42.0)

    subject.wait_for_temperature()

    decoy.verify(
        mock_broker.publish(
            "command",
            matchers.DictMatching(
                {
                    "$": "before",
                    "name": "command.HEATER_SHAKER_WAIT_FOR_TEMPERATURE",
                }
            ),
        ),
        mock_core.wait_for_target_temperature(),
        mock_broker.publish(
            "command",
            matchers.DictMatching({"$": "after"}),
        ),
    )


def test_wait_for_temperature_no_target(
    decoy: Decoy,
    mock_core: HeaterShakerCore,
    mock_broker: Broker,
    subject: HeaterShakerContext,
) -> None:
    """It should raise a NoTargetTemperatureSetError."""
    with pytest.raises(NoTargetTemperatureSetError) as exc_info:
        subject.wait_for_temperature()

    decoy.verify(
        mock_broker.publish(
            "command",
            matchers.DictMatching({"$": "after", "error": exc_info.value}),
        ),
    )


# TODO set and wait for target temperature??


def test_set_and_wait_for_shake_speed(
    decoy: Decoy,
    mock_core: HeaterShakerCore,
    mock_broker: Broker,
    subject: HeaterShakerContext,
) -> None:
    """It should set and wait for shake speed via the core."""
    decoy.when(mock_core.get_labware_latch_status()).then_return(
        HeaterShakerLabwareLatchStatus.IDLE_CLOSED
    )

    subject.set_and_wait_for_shake_speed(rpm=1337)

    decoy.verify(
        mock_broker.publish(
            "command",
            matchers.DictMatching(
                {
                    "$": "before",
                    "name": "command.HEATER_SHAKER_SET_AND_WAIT_FOR_SHAKE_SPEED",
                }
            ),
        ),
        mock_core.set_and_wait_for_shake_speed(rpm=1337),
        mock_broker.publish(
            "command",
            matchers.DictMatching({"$": "after"}),
        ),
    )


def test_set_and_wait_for_shake_speed_latch_not_closed(
    decoy: Decoy,
    mock_core: HeaterShakerCore,
    mock_broker: Broker,
    subject: HeaterShakerContext,
) -> None:
    """It should raise a CannotPerformModuleAction when latch is not closed."""
    decoy.when(mock_core.get_labware_latch_status()).then_return(
        HeaterShakerLabwareLatchStatus.IDLE_OPEN
    )

    with pytest.raises(CannotPerformModuleAction) as exc_info:
        subject.set_and_wait_for_shake_speed(rpm=1337)

    decoy.verify(
        mock_broker.publish(
            "command",
            matchers.DictMatching({"$": "after", "error": exc_info.value}),
        ),
    )


def test_open_labware_latch(
    decoy: Decoy,
    mock_core: HeaterShakerCore,
    mock_broker: Broker,
    subject: HeaterShakerContext,
) -> None:
    """It should open the labware latch via the core."""
    decoy.when(mock_core.get_speed_status()).then_return(SpeedStatus.IDLE)

    subject.open_labware_latch()

    decoy.verify(
        mock_broker.publish(
            "command",
            matchers.DictMatching(
                {
                    "$": "before",
                    "name": "command.HEATER_SHAKER_OPEN_LABWARE_LATCH",
                }
            ),
        ),
        mock_core.open_labware_latch(),
        mock_broker.publish(
            "command",
            matchers.DictMatching({"$": "after"}),
        ),
    )


def test_open_labware_latch_not_idle(
    decoy: Decoy,
    mock_core: HeaterShakerCore,
    mock_broker: Broker,
    subject: HeaterShakerContext,
) -> None:
    """It should raise a CannotPerformModuleAction when heater-shaker is not idle."""
    decoy.when(mock_core.get_speed_status()).then_return(SpeedStatus.ACCELERATING)

    with pytest.raises(CannotPerformModuleAction) as exc_info:
        subject.open_labware_latch()

    decoy.verify(
        mock_broker.publish(
            "command",
            matchers.DictMatching({"$": "after", "error": exc_info.value}),
        ),
    )


def test_close_labware_latch(
    decoy: Decoy,
    mock_core: HeaterShakerCore,
    mock_broker: Broker,
    subject: HeaterShakerContext,
) -> None:
    """It should close the labware latch via the core."""
    subject.close_labware_latch()

    decoy.verify(
        mock_broker.publish(
            "command",
            matchers.DictMatching(
                {
                    "$": "before",
                    "name": "command.HEATER_SHAKER_CLOSE_LABWARE_LATCH",
                }
            ),
        ),
        mock_core.close_labware_latch(),
        mock_broker.publish(
            "command",
            matchers.DictMatching({"$": "after"}),
        ),
    )


def test_deactivate_shaker(
    decoy: Decoy,
    mock_core: HeaterShakerCore,
    mock_broker: Broker,
    subject: HeaterShakerContext,
) -> None:
    """It should stop shaking via the core."""
    subject.deactivate_shaker()

    decoy.verify(
        mock_broker.publish(
            "command",
            matchers.DictMatching(
                {
                    "$": "before",
                    "name": "command.HEATER_SHAKER_DEACTIVATE_SHAKER",
                }
            ),
        ),
        mock_core.deactivate_shaker(),
        mock_broker.publish(
            "command",
            matchers.DictMatching({"$": "after"}),
        ),
    )


def test_deactivate_heater(
    decoy: Decoy,
    mock_core: HeaterShakerCore,
    mock_broker: Broker,
    subject: HeaterShakerContext,
) -> None:
    """It should stop heating via the core."""
    subject.deactivate_heater()

    decoy.verify(
        mock_broker.publish(
            "command",
            matchers.DictMatching(
                {
                    "$": "before",
                    "name": "command.HEATER_SHAKER_DEACTIVATE_HEATER",
                }
            ),
        ),
        mock_core.deactivate_heater(),
        mock_broker.publish(
            "command",
            matchers.DictMatching({"$": "after"}),
        ),
    )
