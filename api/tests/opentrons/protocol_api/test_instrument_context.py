"""Tests for the InstrumentContext class."""
import pytest

from decoy import Decoy, matchers

from opentrons.protocol_api import ProtocolContext
from opentrons.protocol_api.instrument_context import InstrumentContext
from opentrons.protocols.context.instrument import AbstractInstrument
from opentrons.types import Location, Point
from opentrons.broker import Broker
from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocol_api.labware import Well, Labware
from opentrons.protocols.context.well import WellImplementation
from opentrons.protocols.context.labware import AbstractLabware
from opentrons.protocols.geometry.well_geometry import WellGeometry
from opentrons.protocols.api_support import instrument
from opentrons.commands import publisher
from opentrons.protocol_api import labware


@pytest.fixture(autouse=True)
def patch_mock_next_available_tip(
    decoy: Decoy,
    monkeypatch: pytest.MonkeyPatch,
    mock_labware: Labware,
) -> None:
    """Replace next_available_tip() with a mock."""
    mock_well = decoy.mock(cls=Well)
    mock_next_available_tip = decoy.mock(func=labware.next_available_tip)
    monkeypatch.setattr(
        "opentrons.protocol_api.labware.next_available_tip",
        mock_next_available_tip,
    )

    decoy.when(mock_next_available_tip(None, [], 0)).then_return(
        (mock_labware, mock_well)
    )


@pytest.fixture(autouse=True)
def patch_mock_validate_tiprack(decoy: Decoy, monkeypatch: pytest.MonkeyPatch) -> None:
    """Replace validate_tiprack() with a mock."""
    mock_validate_tiprack = decoy.mock(func=instrument.validate_tiprack)
    monkeypatch.setattr(
        "opentrons.protocols.api_support.instrument.validate_tiprack",
        mock_validate_tiprack,
    )


@pytest.fixture(autouse=True)
def patch_mock_tip_length_for(decoy: Decoy, monkeypatch: pytest.MonkeyPatch) -> None:
    """Replace tip_length_for() with a mock."""
    mock_validate_tiprack = decoy.mock(func=instrument.tip_length_for)
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
    decoy.when(mock_protocol_context._modules).then_return([])
    return mock_protocol_context


@pytest.fixture
def mock_instrument_implementation(decoy: Decoy) -> AbstractInstrument:
    return decoy.mock(cls=AbstractInstrument)


@pytest.fixture
def subject(
    decoy: Decoy,
    mock_instrument_implementation: AbstractInstrument,
    mock_protocol_context: ProtocolContext,
    mock_labware: Labware,
) -> InstrumentContext:

    subject = InstrumentContext(
        implementation=mock_instrument_implementation,
        ctx=mock_protocol_context,
        broker=Broker(),
        at_version=APIVersion(2, 0),
    )

    decoy.when(subject.channels).then_return(0)

    return subject


@pytest.fixture
def mock_abstract_labware(decoy: Decoy) -> AbstractLabware:
    return decoy.mock(cls=AbstractLabware)


@pytest.fixture
def mock_labware(decoy: Decoy, mock_abstract_labware: AbstractLabware) -> Labware:
    return decoy.mock(cls=Labware)


@pytest.fixture
def mock_well_implementation(mock_well_geometry: WellGeometry) -> WellImplementation:
    return WellImplementation(
        well_geometry=mock_well_geometry, display_name="test", has_tip=True, name="A1"
    )


@pytest.fixture
def mock_well_geometry(decoy: Decoy) -> WellGeometry:
    return decoy.mock(cls=WellGeometry)


def test_pick_up_from_exact_well_location(
    decoy: Decoy,
    subject: InstrumentContext,
    mock_instrument_implementation: AbstractInstrument,
    mock_well_implementation: WellImplementation,
    mock_well_geometry: WellGeometry,
) -> None:
    """Should pick up tip from supplied exact Well Location."""
    mock_well = decoy.mock(cls=Well)
    input_location = Location(point=Point(-100, -100, 0), labware=mock_well)
    expected_location = Location(point=Point(-100, -100, 0), labware=mock_well)

    subject.pick_up_tip(location=input_location)

    decoy.verify(
        mock_instrument_implementation.move_to(
            location=expected_location,
            force_direct=False,
            minimum_z_height=None,
            speed=None,
        ),
        times=1,
    )


def test_pick_up_from_exact_labware_location(
    decoy: Decoy,
    subject: InstrumentContext,
    mock_instrument_implementation: AbstractInstrument,
    mock_well_implementation: WellImplementation,
    mock_well_geometry: WellGeometry,
    mock_labware: Labware,
) -> None:
    """Should pick up tip from supplied exact labware Location."""
    mock_well = decoy.mock(cls=Well)
    input_location = Location(point=Point(-100, -100, 0), labware=mock_labware)
    expected_location = Location(point=Point(-100, -100, 0), labware=mock_well)

    decoy.when(mock_labware.next_tip(0)).then_return(mock_well)

    decoy.when(mock_well.top()).then_return(expected_location)

    subject.pick_up_tip(location=input_location)

    decoy.verify(
        mock_instrument_implementation.move_to(
            location=expected_location,
            force_direct=False,
            minimum_z_height=None,
            speed=None,
        ),
        times=1,
    )


def test_pick_up_from_manipulated_location(
    decoy: Decoy,
    subject: InstrumentContext,
    mock_instrument_implementation: AbstractInstrument,
    mock_well_implementation: WellImplementation,
    mock_well_geometry: WellGeometry,
    mock_labware: Labware,
) -> None:
    """Should pick up tip from move result of types.Location."""

    mock_well = decoy.mock(cls=Well)
    initial_location = Location(Point(0, 0, 0), labware=mock_well)
    move_to_location = initial_location.move(point=Point(x=-100, y=-100, z=0))

    subject.pick_up_tip(location=move_to_location)

    decoy.verify(
        mock_instrument_implementation.move_to(
            location=move_to_location,
            force_direct=False,
            minimum_z_height=None,
            speed=None,
        ),
        times=1,
    )


def test_pick_up_from_well(
    decoy: Decoy,
    subject: InstrumentContext,
    mock_instrument_implementation: AbstractInstrument,
    mock_well_implementation: WellImplementation,
    mock_abstract_labware: AbstractLabware,
    mock_labware: Labware,
) -> None:
    """Should pick up tip from supplied well location top."""
    mock_well = decoy.mock(cls=Well)
    expected_location = Location(Point(0, 0, 0), mock_well)

    decoy.when(mock_labware.use_tips(start_well=mock_well, num_channels=0)).then_return(
        False
    )

    decoy.when(mock_well.parent).then_return(mock_labware)
    decoy.when(mock_well.top()).then_return(expected_location)

    subject.pick_up_tip(location=mock_well)

    decoy.verify(
        mock_instrument_implementation.move_to(
            location=expected_location,
            force_direct=False,
            minimum_z_height=None,
            speed=None,
        ),
        times=1,
    )


def test_pick_up_from_no_location(
    decoy: Decoy,
    subject: InstrumentContext,
    mock_instrument_implementation: AbstractInstrument,
    mock_well_implementation: WellImplementation,
    mock_labware: Labware,
) -> None:
    """Should pick up tip from next_available_tip.top()."""
    mock_well = decoy.mock(cls=Well)

    expected_location = Location(Point(0, 0, 0), mock_well)

    decoy.when(mock_labware.use_tips(start_well=mock_well, num_channels=0)).then_return(
        False
    )

    decoy.when(mock_well.top()).then_return(expected_location)

    subject.pick_up_tip(location=None)

    decoy.verify(
        mock_instrument_implementation.move_to(
            location=expected_location,
            force_direct=False,
            minimum_z_height=None,
            speed=None,
        ),
        times=1,
    )
