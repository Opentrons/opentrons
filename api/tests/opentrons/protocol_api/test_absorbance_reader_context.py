"""Tests for Protocol API absorbance plate reader contexts."""

import pytest
from decoy import Decoy

from opentrons.legacy_broker import LegacyBroker
from opentrons.protocol_api import AbsorbanceReaderContext
from opentrons.protocol_api.core.common import AbsorbanceReaderCore, ProtocolCore
from opentrons.protocol_api.core.core_map import LoadedCoreMap
from opentrons.protocols.api_support.types import APIVersion


@pytest.fixture
def mock_core(decoy: Decoy) -> AbsorbanceReaderCore:
    """Get a mock module implementation core."""
    return decoy.mock(cls=AbsorbanceReaderCore)


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
    return APIVersion(2, 21)


@pytest.fixture
def subject(
    api_version: APIVersion,
    mock_core: AbsorbanceReaderCore,
    mock_protocol_core: ProtocolCore,
    mock_core_map: LoadedCoreMap,
    mock_broker: LegacyBroker,
) -> AbsorbanceReaderContext:
    """Get an absorbance reader context with its dependencies mocked out."""
    return AbsorbanceReaderContext(
        core=mock_core,
        protocol_core=mock_protocol_core,
        core_map=mock_core_map,
        broker=mock_broker,
        api_version=api_version,
    )


def test_get_serial_number(
    decoy: Decoy, mock_core: AbsorbanceReaderCore, subject: AbsorbanceReaderContext
) -> None:
    """It should get the serial number from the core."""
    decoy.when(mock_core.get_serial_number()).then_return("12345")
    result = subject.serial_number
    assert result == "12345"
