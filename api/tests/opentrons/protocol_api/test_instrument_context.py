"""Tests for the InstrumentContext class."""
import pytest
from pytest_lazyfixture import lazy_fixture

from decoy import Decoy, matchers
from typing import Union, Optional

from opentrons.protocol_api import ProtocolContext
from opentrons.protocol_api.instrument_context import InstrumentContext
from opentrons.protocols.context.instrument import AbstractInstrument
from opentrons.types import Location, Point, LocationLabware
from opentrons.broker import Broker
from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocol_api.labware import Well, Labware
from opentrons.protocols.context.protocol_api.labware import LabwareImplementation
from opentrons.protocols.context.well import WellImplementation, WellGeometry
from opentrons.protocols.api_support.instrument import validate_tiprack, tip_length_for
from opentrons.commands import publisher
from opentrons.protocol_api import labware


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


@pytest.fixture
def mock_well(decoy: Decoy) -> Well:
    return decoy.mock(cls=Well)


@pytest.fixture
def mock_labware(decoy: Decoy) -> Labware:
    return decoy.mock(cls=Labware)


@pytest.fixture
def mock_well_implementation(mock_well_geometry) -> WellImplementation:
    return WellImplementation(
        well_geometry=mock_well_geometry,
        display_name="test",
        has_tip=True,
        name="test"
    )


@pytest.fixture
def mock_well_geometry(decoy: Decoy) -> WellGeometry:
    return decoy.mock(cls=WellGeometry)

@pytest.fixture
def opentrons_96_tiprack_300ul_def():
    labware_name = "opentrons_96_tiprack_300ul"
    return labware.get_labware_definition(labware_name)


@pytest.fixture
def opentrons_96_tiprack_300ul(opentrons_96_tiprack_300ul_def):
    return labware.Labware(
        implementation=LabwareImplementation(
            definition=opentrons_96_tiprack_300ul_def,
            parent=Location(Point(0, 0, 0), "Test Slot"),
        )
    )


@pytest.mark.parametrize(
    "input_point, labware, expected_point_call, is_type_location",
    [
        (Point(-100, -100, 0), lazy_fixture("mock_well"), Point(-100, -100, 0), True),
        (
            Point(-100, -100, 0),
            lazy_fixture("mock_labware"),
            Point(-100, -100, 0),
            True,
        ),
        (
            Well(well_implementation=lazy_fixture("mock_well_implementation")),
            False,
        ),
    ],
)
def test_pick_up_from_location(
    decoy: Decoy,
    subject: InstrumentContext,
    mock_instrument_implementation: AbstractInstrument,
    mock_well_implementation: WellImplementation,
    mock_well_geometry: WellGeometry,
    mock_well: Well,
    mock_labware: Labware,
    input_point: Union[Point, Well],
    labware: Optional[LocationLabware],
    expected_point_call: Optional[Point],
    opentrons_96_tiprack_300ul,
    is_type_location: bool,
) -> None:
    """Should pick up tip from supplied location."""
    if is_type_location:
        input_location = Location(point=input_point, labware=labware)
        expected_location = Location(point=expected_point_call, labware=mock_well)
    else:
        input_location = Well(mock_instrument_implementation)
        expected_location = Location(point=expected_point_call, labware=mock_well)

    decoy.when(subject._ctx._modules).then_return([])
    decoy.when(mock_well_implementation.get_geometry()).then_return(mock_well_geometry)
    tiprack = opentrons_96_tiprack_300ul
    print("tiprack")
    print(tiprack)
    print(type(tiprack))
    print(tiprack._implementation.is_tiprack())
    decoy.when(mock_labware.next_tip(None)).then_return(mock_well)
    # decoy.when(Well(mock_labware.next_tip(None)).top()).then_return(tiprack)

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
