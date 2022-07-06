"""Tests for the InstrumentContext class."""
import pytest

from decoy import Decoy

from opentrons.protocol_api import ProtocolContext

from opentrons.protocol_api.instrument_context import InstrumentContext
from opentrons.protocols.context.instrument import AbstractInstrument
from opentrons.types import Location, Point
from opentrons.broker import Broker
from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocol_api.labware import Well
from opentrons.protocols.api_support.instrument import validate_tiprack
from opentrons.commands import publisher



@pytest.fixture(autouse=True)
def patch_mock_validate_tiprack(decoy: Decoy, monkeypatch: pytest.MonkeyPatch) -> None:
    """Replace motion_planning.get_waypoints() with a mock."""
    mock_validate_tiprack = decoy.mock(func=validate_tiprack)
    monkeypatch.setattr(
        "opentrons.protocols.api_support.instrument.validate_tiprack",
        mock_validate_tiprack,
    )

@pytest.fixture(autouse=True)
def patch_mock_publish_context(decoy: Decoy, monkeypatch: pytest.MonkeyPatch) -> None:
    """Replace motion_planning.get_waypoints() with a mock."""
    mock_publish_context = decoy.mock(func=publisher.publish_context)
    monkeypatch.setattr(
        "opentrons.commands.publisher.publish_context",
        mock_publish_context,
    )

@pytest.fixture
def mock_protocol_context(decoy: Decoy) -> ProtocolContext:
    return decoy.mock(cls=ProtocolContext)


@pytest.fixture
def mock_pipette_implementation(decoy: Decoy) -> AbstractInstrument:
    return decoy.mock(cls=AbstractInstrument)


@pytest.fixture
def subject(
    decoy: Decoy,
    mock_pipette_implementation: AbstractInstrument,
    mock_protocol_context: ProtocolContext,
) -> InstrumentContext:
    return InstrumentContext(
        implementation=mock_pipette_implementation,
        ctx=mock_protocol_context,
        broker=Broker(),
        at_version=APIVersion(2, 0),
    )


def test_pick_up_from_location(decoy: Decoy, subject: InstrumentContext) -> None:
    """Should pick up tip from supplied location."""
    mock_well = decoy.mock(cls=Well)

    point = Point(-100, -100, 0)
    location = Location(point=point, labware=mock_well)

    subject.pick_up_tip(location=location)

    decoy.verify(subject.move_to(location))
