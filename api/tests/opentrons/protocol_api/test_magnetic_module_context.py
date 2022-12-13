"""Tests for Protocol API magnetic module contexts."""
import pytest
from decoy import Decoy, matchers

from opentrons.broker import Broker
from opentrons.hardware_control.modules import MagneticStatus
from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocol_api import MAX_SUPPORTED_VERSION, MagneticModuleContext
from opentrons.protocol_api.core.common import ProtocolCore, MagneticModuleCore
from opentrons.protocol_api.core.core_map import LoadedCoreMap


@pytest.fixture
def mock_core(decoy: Decoy) -> MagneticModuleCore:
    """Get a mock module implementation core."""
    return decoy.mock(cls=MagneticModuleCore)


@pytest.fixture
def mock_protocol_core(decoy: Decoy) -> ProtocolCore:
    """Get a mock protocol implementation core."""
    return decoy.mock(cls=ProtocolCore)


@pytest.fixture
def mock_core_map(decoy: Decoy) -> LoadedCoreMap:
    """Get a mock LoadedCoreMap."""
    return decoy.mock(cls=LoadedCoreMap)


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
    mock_core: MagneticModuleCore,
    mock_protocol_core: ProtocolCore,
    mock_core_map: LoadedCoreMap,
    mock_broker: Broker,
) -> MagneticModuleContext:
    """Get a magnetic module context with its dependencies mocked out."""
    return MagneticModuleContext(
        core=mock_core,
        protocol_core=mock_protocol_core,
        core_map=mock_core_map,
        broker=mock_broker,
        api_version=api_version,
    )


def test_disengage(
    decoy: Decoy,
    mock_core: MagneticModuleCore,
    mock_broker: Broker,
    subject: MagneticModuleContext,
) -> None:
    """It should disengage magnets via the core."""
    subject.disengage()

    decoy.verify(
        mock_broker.publish(
            "command",
            matchers.DictMatching({"$": "before", "name": "command.MAGDECK_DISENGAGE"}),
        ),
        mock_core.disengage(),
        mock_broker.publish("command", matchers.DictMatching({"$": "after"})),
    )


def test_get_status(
    decoy: Decoy, mock_core: MagneticModuleCore, subject: MagneticModuleContext
) -> None:
    """It should report the status from the core."""
    decoy.when(mock_core.get_status()).then_return(MagneticStatus.DISENGAGED)

    result = subject.status

    assert result == "disengaged"


def test_engage_height_from_home(
    decoy: Decoy,
    mock_broker: Broker,
    mock_core: MagneticModuleCore,
    subject: MagneticModuleContext,
) -> None:
    """It should engage if given a raw motor height."""
    subject.engage(height=42.0)

    decoy.verify(
        mock_broker.publish(
            "command",
            matchers.DictMatching({"$": "before", "name": "command.MAGDECK_ENGAGE"}),
        ),
        mock_core.engage(height_from_home=42.0),
        mock_broker.publish("command", matchers.DictMatching({"$": "after"})),
    )


def test_engage_height_from_base(
    decoy: Decoy,
    mock_broker: Broker,
    mock_core: MagneticModuleCore,
    subject: MagneticModuleContext,
) -> None:
    """It should engage if given a height from the base."""
    subject.engage(height_from_base=42.0)

    decoy.verify(
        mock_broker.publish(
            "command",
            matchers.DictMatching({"$": "before", "name": "command.MAGDECK_ENGAGE"}),
        ),
        mock_core.engage(height_from_base=42.0),
        mock_broker.publish("command", matchers.DictMatching({"$": "after"})),
    )


@pytest.mark.parametrize("api_version", [APIVersion(2, 3)])
def test_engage_offset_from_default(
    decoy: Decoy,
    mock_broker: Broker,
    mock_core: MagneticModuleCore,
    subject: MagneticModuleContext,
) -> None:
    """It should engage from a labware's default engage height."""
    subject.engage(offset=42.0)

    decoy.verify(
        mock_broker.publish(
            "command",
            matchers.DictMatching({"$": "before", "name": "command.MAGDECK_ENGAGE"}),
        ),
        mock_core.engage_to_labware(offset=42.0, preserve_half_mm=False),
        mock_broker.publish("command", matchers.DictMatching({"$": "after"})),
    )


@pytest.mark.parametrize("api_version", [APIVersion(2, 2)])
def test_engage_offset_from_default_low_version(
    decoy: Decoy,
    mock_core: MagneticModuleCore,
    subject: MagneticModuleContext,
) -> None:
    """It should preserve pre-2.3 buggy labware engage height behavior."""
    subject.engage(offset=42.0)

    decoy.verify(
        mock_core.engage_to_labware(offset=42.0, preserve_half_mm=True),
        times=1,
    )
