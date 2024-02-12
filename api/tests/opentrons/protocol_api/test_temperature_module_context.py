"""Tests for Protocol API temperature module contexts."""
import pytest
from decoy import Decoy, matchers

from opentrons.legacy_broker import LegacyBroker
from opentrons.hardware_control.modules import TemperatureStatus
from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocols.api_support.util import APIVersionError
from opentrons.protocol_api import MAX_SUPPORTED_VERSION, TemperatureModuleContext
from opentrons.protocol_api.core.common import ProtocolCore, TemperatureModuleCore
from opentrons.protocol_api.core.core_map import LoadedCoreMap


@pytest.fixture
def mock_core(decoy: Decoy) -> TemperatureModuleCore:
    """Get a mock module implementation core."""
    return decoy.mock(cls=TemperatureModuleCore)


@pytest.fixture
def mock_protocol_core(decoy: Decoy) -> ProtocolCore:
    """Get a mock protocol implementation core."""
    return decoy.mock(cls=ProtocolCore)


@pytest.fixture
def mock_core_map(decoy: Decoy) -> LoadedCoreMap:
    """Get a mock LoadedCoreMap."""
    return decoy.mock(cls=LoadedCoreMap)


@pytest.fixture
def mock_broker(decoy: Decoy) -> LegacyBroker:
    """Get a mock command message broker."""
    return decoy.mock(cls=LegacyBroker)


@pytest.fixture
def api_version() -> APIVersion:
    """Get an API version to apply to the interface."""
    return MAX_SUPPORTED_VERSION


@pytest.fixture
def subject(
    api_version: APIVersion,
    mock_core: TemperatureModuleCore,
    mock_protocol_core: ProtocolCore,
    mock_core_map: LoadedCoreMap,
    mock_broker: LegacyBroker,
) -> TemperatureModuleContext:
    """Get a temperature module context with its dependencies mocked out."""
    return TemperatureModuleContext(
        core=mock_core,
        protocol_core=mock_protocol_core,
        core_map=mock_core_map,
        broker=mock_broker,
        api_version=api_version,
    )


def test_set_temperature(
    decoy: Decoy,
    mock_core: TemperatureModuleCore,
    mock_broker: LegacyBroker,
    subject: TemperatureModuleContext,
) -> None:
    """It should set and wait for the temperature via the core."""
    subject.set_temperature(42.0)

    decoy.verify(
        mock_broker.publish(
            "command",
            matchers.DictMatching(
                {
                    "$": "before",
                    "name": "command.TEMPDECK_SET_TEMP",
                    "payload": matchers.DictMatching({"celsius": 42.0}),
                }
            ),
        ),
        mock_core.set_target_temperature(42.0),
        mock_core.wait_for_target_temperature(),
        mock_broker.publish(
            "command",
            matchers.DictMatching({"$": "after"}),
        ),
    )


@pytest.mark.parametrize("api_version", [APIVersion(2, 3)])
def test_start_set_temperature(
    decoy: Decoy,
    mock_core: TemperatureModuleCore,
    mock_broker: LegacyBroker,
    subject: TemperatureModuleContext,
) -> None:
    """It should set the target temperature via the core."""
    subject.start_set_temperature(42.0)

    decoy.verify(
        mock_broker.publish(
            "command",
            matchers.DictMatching(
                {
                    "$": "before",
                    "name": "command.TEMPDECK_SET_TEMP",
                    "payload": matchers.DictMatching({"celsius": 42.0}),
                }
            ),
        ),
        mock_core.set_target_temperature(42.0),
        mock_broker.publish("command", matchers.DictMatching({"$": "after"})),
    )

    decoy.verify(
        mock_core.wait_for_target_temperature(), ignore_extra_args=True, times=0
    )


@pytest.mark.parametrize("api_version", [APIVersion(2, 2)])
def test_start_set_temperature_api_version_low(
    decoy: Decoy, mock_broker: LegacyBroker, subject: TemperatureModuleContext
) -> None:
    """It should reject if API version is lower than 2.3."""
    with pytest.raises(APIVersionError) as exc_info:
        subject.start_set_temperature(42.0)

    decoy.verify(
        mock_broker.publish(
            "command",
            matchers.DictMatching({"$": "after", "error": exc_info.value}),
        ),
    )


@pytest.mark.parametrize("api_version", [APIVersion(2, 3)])
def test_await_temperature(
    decoy: Decoy,
    mock_core: TemperatureModuleCore,
    mock_broker: LegacyBroker,
    subject: TemperatureModuleContext,
) -> None:
    """It should wait for a specified target temperature."""
    subject.await_temperature(42.0)

    decoy.verify(
        mock_broker.publish(
            "command",
            matchers.DictMatching(
                {
                    "$": "before",
                    "name": "command.TEMPDECK_AWAIT_TEMP",
                    "payload": matchers.DictMatching({"celsius": 42.0}),
                }
            ),
        ),
        mock_core.wait_for_target_temperature(42.0),
        mock_broker.publish("command", matchers.DictMatching({"$": "after"})),
    )


@pytest.mark.parametrize("api_version", [APIVersion(2, 2)])
def test_await_temperature_api_version_low(
    decoy: Decoy, mock_broker: LegacyBroker, subject: TemperatureModuleContext
) -> None:
    """It should reject if API version is lower than 2.3."""
    with pytest.raises(APIVersionError) as exc_info:
        subject.await_temperature(42.0)

    decoy.verify(
        mock_broker.publish(
            "command",
            matchers.DictMatching({"$": "after", "error": exc_info.value}),
        ),
    )


def test_deactivate(
    decoy: Decoy,
    mock_core: TemperatureModuleCore,
    mock_broker: LegacyBroker,
    subject: TemperatureModuleContext,
) -> None:
    """It should deactivate the heater."""
    subject.deactivate()

    decoy.verify(
        mock_broker.publish(
            "command",
            matchers.DictMatching(
                {"$": "before", "name": "command.TEMPDECK_DEACTIVATE"}
            ),
        ),
        mock_core.deactivate(),
        mock_broker.publish("command", matchers.DictMatching({"$": "after"})),
    )


def test_get_current_temperature(
    decoy: Decoy, mock_core: TemperatureModuleCore, subject: TemperatureModuleContext
) -> None:
    """It should get the current temperature from the core."""
    decoy.when(mock_core.get_current_temperature()).then_return(42.0)

    result = subject.temperature

    assert result == 42.0


def test_get_target_temperature(
    decoy: Decoy, mock_core: TemperatureModuleCore, subject: TemperatureModuleContext
) -> None:
    """It should get the target temperature from the core."""
    decoy.when(mock_core.get_target_temperature()).then_return(42.0)

    result = subject.target

    assert result == 42.0


@pytest.mark.parametrize("api_version", [APIVersion(2, 3)])
def test_get_status(
    decoy: Decoy, mock_core: TemperatureModuleCore, subject: TemperatureModuleContext
) -> None:
    """It should get the target temperature from the core."""
    decoy.when(mock_core.get_status()).then_return(TemperatureStatus.HEATING)

    result = subject.status

    assert result == "heating"


@pytest.mark.parametrize("api_version", [APIVersion(2, 2)])
def test_get_status_version_low(subject: TemperatureModuleContext) -> None:
    """It should reject if API version is lower than 2.3."""
    with pytest.raises(APIVersionError):
        subject.status


def test_serial_number(
    decoy: Decoy,
    mock_core: TemperatureModuleCore,
    subject: TemperatureModuleContext,
) -> None:
    """It should get the module's unique serial number."""
    decoy.when(mock_core.get_serial_number()).then_return("abc-123")
    result = subject.serial_number
    assert result == "abc-123"
