"""Tests for the InstrumentContext class."""
import pytest

from decoy import Decoy, matchers

from opentrons.protocol_api import ProtocolContext

from opentrons.protocol_api.instrument_context import InstrumentContext
from opentrons.protocols.context.instrument import AbstractInstrument
from opentrons.types import Location, Point
from opentrons.broker import Broker
from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocol_api.labware import Well
from opentrons.protocols.api_support.instrument import validate_tiprack, tip_length_for
from opentrons.commands import publisher

@pytest.fixture(autouse=True)
def patch_mock_validate_tiprack(decoy: Decoy, monkeypatch: pytest.MonkeyPatch) -> None:
    """Replace validate_tiprack() with a mock."""
    mock_validate_tiprack = decoy.mock(func=validate_tiprack)
    monkeypatch.setattr(
        "opentrons.protocols.api_support.instrument.validate_tiprack",
        mock_validate_tiprack,
    )

@pytest.fixture(autouse=True)
def patch_mock_tip_length_for(decoy: Decoy, monkeypatch: pytest.MonkeyPatch) -> None:
    """Replace tip_length_for() with a mock."""
    mock_validate_tiprack = decoy.mock(func=tip_length_for)
    monkeypatch.setattr(
        "opentrons.protocols.api_support.instrument.tip_length_for",
        mock_validate_tiprack,
    )


@pytest.fixture(autouse=True)
def patch_mock_publish_context(decoy: Decoy, monkeypatch: pytest.MonkeyPatch) -> None:
    """Replace publish_context() with a mock."""
    mock_publish_context = decoy.mock(func=publisher.publish_context)
    monkeypatch.setattr(
        "opentrons.commands.publisher.publish_context",
        mock_publish_context,
    )

    decoy.when(
        mock_publish_context(
            broker=matchers.Anything(),
            command=matchers.Anything(),
        )
    ).then_return(decoy.mock(name="publish-context"))


@pytest.fixture
def mock_protocol_context(decoy: Decoy) -> ProtocolContext:
    mock_protocol_context = decoy.mock(cls=ProtocolContext)
    return mock_protocol_context


@pytest.fixture
def mock_instrument_implementation(decoy: Decoy) -> AbstractInstrument:
    return decoy.mock(cls=AbstractInstrument)


@pytest.fixture
def subject(
    decoy: Decoy,
    mock_instrument_implementation: AbstractInstrument,
    mock_protocol_context: ProtocolContext,
) -> InstrumentContext:
    return InstrumentContext(
        implementation=mock_instrument_implementation,
        ctx=mock_protocol_context,
        broker=Broker(),
        at_version=APIVersion(2, 0),
    )


def test_pick_up_from_location(decoy: Decoy, subject: InstrumentContext, mock_instrument_implementation: AbstractInstrument) -> None:
    """Should pick up tip from supplied location."""
    mock_well = decoy.mock(cls=Well)

    point = Point(-100, -100, 0)
    location = Location(point=point, labware=mock_well)

    decoy.when(subject._ctx._modules).then_return([])

    subject.pick_up_tip(location=location)

    decoy.verify(subject.move_to(location), times=1)
