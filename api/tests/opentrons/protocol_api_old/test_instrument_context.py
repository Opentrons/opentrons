"""Tests for the InstrumentContext class."""
import pytest
from decoy import Decoy, matchers

from opentrons.commands import publisher
from opentrons.broker import Broker
from opentrons.types import Location, Point
from opentrons.protocols.api_support import instrument
from opentrons.protocols.api_support.types import APIVersion

from opentrons.protocol_api import ProtocolContext, labware
from opentrons.protocol_api.instrument_context import InstrumentContext
from opentrons.protocol_api.labware import Well, Labware
from opentrons.protocol_api.core.instrument import AbstractInstrument
from opentrons.protocol_api.core.well import AbstractWellCore


@pytest.fixture(autouse=True)
def _mock_labware_module(decoy: Decoy, monkeypatch: pytest.MonkeyPatch) -> None:
    """Replace next_available_tip() with a mock."""
    mock_next_available_tip = decoy.mock(func=labware.next_available_tip)
    monkeypatch.setattr(
        "opentrons.protocol_api.labware.next_available_tip",
        mock_next_available_tip,
    )


@pytest.fixture(autouse=True)
def _mock_instrument_module(decoy: Decoy, monkeypatch: pytest.MonkeyPatch) -> None:
    """Replace instrument module method calls with a mock."""
    mock_validate_tiprack = decoy.mock(func=instrument.validate_tiprack)
    monkeypatch.setattr(
        "opentrons.protocols.api_support.instrument.validate_tiprack",
        mock_validate_tiprack,
    )

    mock_tip_length_for = decoy.mock(func=instrument.tip_length_for)
    monkeypatch.setattr(
        "opentrons.protocols.api_support.instrument.tip_length_for",
        mock_tip_length_for,
    )


@pytest.fixture(autouse=True)
def _mock_publish_context(decoy: Decoy, monkeypatch: pytest.MonkeyPatch) -> None:
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
    decoy.when(mock_protocol_context._modules).then_return({})
    return mock_protocol_context


@pytest.fixture
def mock_instrument_implementation(
    decoy: Decoy,
) -> AbstractInstrument[AbstractWellCore]:
    return decoy.mock(cls=AbstractInstrument)


@pytest.fixture
def mock_labware(decoy: Decoy) -> Labware:
    return decoy.mock(cls=Labware)


@pytest.fixture
def mock_trash(decoy: Decoy) -> Labware:
    return decoy.mock(cls=Labware)


@pytest.fixture
def subject(
    mock_instrument_implementation: AbstractInstrument[AbstractWellCore],
    mock_protocol_context: ProtocolContext,
    mock_trash: Labware,
) -> InstrumentContext:
    subject = InstrumentContext(
        implementation=mock_instrument_implementation,
        ctx=mock_protocol_context,
        broker=Broker(),
        api_version=APIVersion(2, 0),
        tip_racks=[],
        trash=mock_trash,
        requested_as="some-pipette-name",
    )

    return subject


def test_pick_up_from_exact_well_location(
    decoy: Decoy,
    subject: InstrumentContext,
    mock_instrument_implementation: AbstractInstrument[AbstractWellCore],
) -> None:
    """Should pick up tip from supplied exact Well Location."""
    mock_well = decoy.mock(cls=Well)
    input_location = Location(point=Point(-100, -100, 0), labware=mock_well)
    expected_location = Location(point=Point(-100, -100, 0), labware=mock_well)

    subject.pick_up_tip(location=input_location)

    decoy.verify(
        mock_instrument_implementation.pick_up_tip(
            location=expected_location,
            well_core=mock_well._impl,
            presses=None,
            increment=None,
            prep_after=False,
        ),
        times=1,
    )


def test_pick_up_from_exact_labware_location(
    decoy: Decoy,
    subject: InstrumentContext,
    mock_instrument_implementation: AbstractInstrument[AbstractWellCore],
    mock_labware: Labware,
) -> None:
    """Should pick up tip from supplied exact labware Location."""
    mock_well = decoy.mock(cls=Well)
    input_location = Location(point=Point(-100, -100, 0), labware=mock_labware)
    expected_location = Location(point=Point(-100, -100, 0), labware=mock_well)

    decoy.when(mock_labware.next_tip(None)).then_return(  # type: ignore[arg-type]
        mock_well
    )

    decoy.when(mock_well.top()).then_return(expected_location)

    subject.pick_up_tip(location=input_location)

    decoy.verify(
        mock_instrument_implementation.pick_up_tip(
            location=expected_location,
            well_core=mock_well._impl,
            presses=None,
            increment=None,
            prep_after=False,
        ),
        times=1,
    )


def test_pick_up_from_manipulated_location(
    decoy: Decoy,
    subject: InstrumentContext,
    mock_instrument_implementation: AbstractInstrument[AbstractWellCore],
) -> None:
    """Should pick up tip from move result of types.Location."""

    mock_well = decoy.mock(cls=Well)
    initial_location = Location(Point(0, 0, 0), labware=mock_well)
    move_to_location = initial_location.move(point=Point(x=-100, y=-100, z=0))

    subject.pick_up_tip(location=move_to_location)

    decoy.verify(
        mock_instrument_implementation.pick_up_tip(
            location=move_to_location,
            well_core=mock_well._impl,
            presses=None,
            increment=None,
            prep_after=False,
        ),
        times=1,
    )


def test_pick_up_from_well(
    decoy: Decoy,
    subject: InstrumentContext,
    mock_instrument_implementation: AbstractInstrument[AbstractWellCore],
    mock_labware: Labware,
) -> None:
    """Should pick up tip from supplied well location top."""
    mock_well = decoy.mock(cls=Well)
    expected_location = Location(Point(0, 0, 0), mock_well)

    decoy.when(
        mock_labware.use_tips(start_well=mock_well, num_channels=None)  # type: ignore[arg-type]
    ).then_return(False)

    decoy.when(mock_well.parent).then_return(mock_labware)
    decoy.when(mock_well.top()).then_return(expected_location)

    subject.pick_up_tip(location=mock_well)

    decoy.verify(
        mock_instrument_implementation.pick_up_tip(
            location=expected_location,
            well_core=mock_well._impl,
            presses=None,
            increment=None,
            prep_after=False,
        ),
        times=1,
    )


def test_pick_up_from_no_location(
    decoy: Decoy,
    subject: InstrumentContext,
    mock_instrument_implementation: AbstractInstrument[AbstractWellCore],
    mock_labware: Labware,
) -> None:
    """Should pick up tip from next_available_tip.top()."""
    mock_well = decoy.mock(cls=Well)

    expected_location = Location(Point(0, 0, 0), mock_well)

    decoy.when(mock_instrument_implementation.get_channels()).then_return(42)
    decoy.when(labware.next_available_tip(None, [], 42)).then_return(
        (mock_labware, mock_well)
    )
    decoy.when(
        mock_labware.use_tips(start_well=mock_well, num_channels=42)
    ).then_return(False)
    decoy.when(mock_well.top()).then_return(expected_location)

    subject.pick_up_tip(location=None)

    decoy.verify(
        mock_instrument_implementation.pick_up_tip(
            location=expected_location,
            well_core=mock_well._impl,
            presses=None,
            increment=None,
            prep_after=False,
        ),
        times=1,
    )
