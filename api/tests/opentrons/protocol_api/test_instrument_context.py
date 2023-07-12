"""Tests for the InstrumentContext public interface."""
import inspect

import pytest
from pytest_lazyfixture import lazy_fixture  # type: ignore[import]
from decoy import Decoy

from opentrons.broker import Broker
from opentrons.protocols.api_support import instrument as mock_instrument_support
from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocols.api_support.util import (
    APIVersionError,
    FlowRates,
    PlungerSpeeds,
)
from opentrons.protocol_api import (
    MAX_SUPPORTED_VERSION,
    InstrumentContext,
    Labware,
    Well,
    labware,
    validation as mock_validation,
)
from opentrons.protocol_api.validation import WellTarget, PointTarget
from opentrons.protocol_api.core.common import InstrumentCore, ProtocolCore
from opentrons.protocol_api.core.legacy.legacy_instrument_core import (
    LegacyInstrumentCore,
)
from opentrons.types import Location, Mount, Point


@pytest.fixture(autouse=True)
def _mock_validation_module(decoy: Decoy, monkeypatch: pytest.MonkeyPatch) -> None:
    for name, func in inspect.getmembers(mock_validation, inspect.isfunction):
        monkeypatch.setattr(mock_validation, name, decoy.mock(func=func))


@pytest.fixture(autouse=True)
def _mock_instrument_support_module(
    decoy: Decoy, monkeypatch: pytest.MonkeyPatch
) -> None:
    for name, func in inspect.getmembers(mock_instrument_support, inspect.isfunction):
        monkeypatch.setattr(mock_instrument_support, name, decoy.mock(func=func))


@pytest.fixture(autouse=True)
def _mock_labware_module(decoy: Decoy, monkeypatch: pytest.MonkeyPatch) -> None:
    for name, func in inspect.getmembers(labware, inspect.isfunction):
        monkeypatch.setattr(labware, name, decoy.mock(func=func))


@pytest.fixture
def mock_instrument_core(decoy: Decoy) -> InstrumentCore:
    """Get a mock instrument implementation core."""
    instrument_core = decoy.mock(cls=InstrumentCore)
    decoy.when(instrument_core.get_mount()).then_return(Mount.LEFT)
    return instrument_core


@pytest.fixture
def mock_legacy_instrument_core(decoy: Decoy) -> LegacyInstrumentCore:
    """Get a mock instrument implementation core."""
    instrument_core = decoy.mock(cls=LegacyInstrumentCore)
    decoy.when(instrument_core.get_mount()).then_return(Mount.LEFT)
    return instrument_core


@pytest.fixture
def mock_protocol_core(decoy: Decoy) -> ProtocolCore:
    """Get a mock ProtocolCore."""
    return decoy.mock(cls=ProtocolCore)


@pytest.fixture
def mock_broker(decoy: Decoy) -> Broker:
    """Get a mock command message broker."""
    return decoy.mock(cls=Broker)


@pytest.fixture
def mock_trash(decoy: Decoy) -> Labware:
    """Get a mock fixed-trash labware."""
    return decoy.mock(cls=Labware)


@pytest.fixture
def api_version() -> APIVersion:
    """Get the API version to test at."""
    return MAX_SUPPORTED_VERSION


@pytest.fixture
def subject(
    mock_instrument_core: InstrumentCore,
    mock_protocol_core: ProtocolCore,
    mock_broker: Broker,
    mock_trash: Labware,
    api_version: APIVersion,
) -> InstrumentContext:
    """Get a ProtocolCore test subject with its dependencies mocked out."""
    return InstrumentContext(
        core=mock_instrument_core,
        protocol_core=mock_protocol_core,
        broker=mock_broker,
        api_version=api_version,
        tip_racks=[],
        trash=mock_trash,
        requested_as="requested-pipette-name",
    )


@pytest.mark.parametrize("api_version", [APIVersion(2, 0), APIVersion(2, 1)])
def test_api_version(api_version: APIVersion, subject: InstrumentContext) -> None:
    """It should have an api_version property."""
    assert subject.api_version == api_version


def test_trash_container(
    decoy: Decoy,
    mock_trash: Labware,
    subject: InstrumentContext,
) -> None:
    """It should have a settable trash_container property."""
    assert subject.trash_container is mock_trash

    other_trash = decoy.mock(cls=Labware)
    subject.trash_container = other_trash

    assert subject.trash_container is other_trash


def test_tip_racks(decoy: Decoy, subject: InstrumentContext) -> None:
    """It should have a settable tip_racks property."""
    assert subject.tip_racks == []

    tip_racks = [decoy.mock(cls=Labware), decoy.mock(cls=Labware)]
    subject.tip_racks = tip_racks

    assert subject.tip_racks == tip_racks


def test_mount(
    decoy: Decoy, mock_instrument_core: InstrumentCore, subject: InstrumentContext
) -> None:
    """It should have a mount property."""
    decoy.when(mock_instrument_core.get_mount()).then_return(Mount.RIGHT)

    assert subject.mount == "right"


def test_move_to(
    decoy: Decoy, mock_instrument_core: InstrumentCore, subject: InstrumentContext
) -> None:
    """It should move the pipette to a location."""
    location = Location(point=Point(1, 2, 3), labware=None)

    subject.move_to(location)

    decoy.verify(
        mock_instrument_core.move_to(
            well_core=None,
            location=location,
            force_direct=False,
            minimum_z_height=None,
            speed=None,
        ),
        times=1,
    )


def test_move_to_well(
    decoy: Decoy, mock_instrument_core: InstrumentCore, subject: InstrumentContext
) -> None:
    """It should move the pipette to a location."""
    mock_well = decoy.mock(cls=Well)
    location = Location(point=Point(1, 2, 3), labware=mock_well)

    subject.move_to(location)

    decoy.verify(
        mock_instrument_core.move_to(
            location=location,
            well_core=mock_well._core,
            force_direct=False,
            minimum_z_height=None,
            speed=None,
        ),
        times=1,
    )


@pytest.mark.parametrize("api_version", [APIVersion(2, 13)])
def test_pick_up_from_well(
    decoy: Decoy, mock_instrument_core: InstrumentCore, subject: InstrumentContext
) -> None:
    """It should pick up a specific tip."""
    mock_well = decoy.mock(cls=Well)
    top_location = Location(point=Point(1, 2, 3), labware=mock_well)

    decoy.when(mock_well.top()).then_return(top_location)

    subject.pick_up_tip(mock_well, presses=1, increment=2.0, prep_after=False)

    decoy.verify(
        mock_instrument_core.pick_up_tip(
            location=top_location,
            well_core=mock_well._core,
            presses=1,
            increment=2.0,
            prep_after=False,
        ),
        times=1,
    )


@pytest.mark.parametrize("api_version", [APIVersion(2, 14)])
def test_pick_up_from_well_deprecated_args(
    decoy: Decoy, mock_instrument_core: InstrumentCore, subject: InstrumentContext
) -> None:
    """It should pick up a specific tip."""
    mock_well = decoy.mock(cls=Well)

    with pytest.raises(APIVersionError):
        subject.pick_up_tip(mock_well, presses=1, increment=2.0, prep_after=False)


def test_aspirate(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    subject: InstrumentContext,
    mock_protocol_core: ProtocolCore,
) -> None:
    """It should aspirate to a well."""
    mock_well = decoy.mock(cls=Well)
    bottom_location = Location(point=Point(1, 2, 3), labware=mock_well)
    input_location = Location(point=Point(2, 2, 2), labware=None)
    last_location = Location(point=Point(9, 9, 9), labware=None)
    decoy.when(mock_instrument_core.get_mount()).then_return(Mount.RIGHT)

    decoy.when(mock_protocol_core.get_last_location(Mount.RIGHT)).then_return(
        last_location
    )
    decoy.when(
        mock_validation.validate_location(
            location=input_location, last_location=last_location
        )
    ).then_return(WellTarget(well=mock_well, location=None, in_place=False))
    decoy.when(mock_well.bottom(z=1.0)).then_return(bottom_location)
    decoy.when(mock_instrument_core.get_aspirate_flow_rate(1.23)).then_return(5.67)

    subject.aspirate(volume=42.0, location=input_location, rate=1.23)

    decoy.verify(
        mock_instrument_core.aspirate(
            location=bottom_location,
            well_core=mock_well._core,
            in_place=False,
            volume=42.0,
            rate=1.23,
            flow_rate=5.67,
        ),
        times=1,
    )


def test_aspirate_well_location(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    subject: InstrumentContext,
    mock_protocol_core: ProtocolCore,
) -> None:
    """It should aspirate to a well."""
    mock_well = decoy.mock(cls=Well)
    input_location = Location(point=Point(2, 2, 2), labware=mock_well)
    last_location = Location(point=Point(9, 9, 9), labware=None)
    decoy.when(mock_instrument_core.get_mount()).then_return(Mount.RIGHT)

    decoy.when(mock_protocol_core.get_last_location(Mount.RIGHT)).then_return(
        last_location
    )
    decoy.when(
        mock_validation.validate_location(
            location=input_location, last_location=last_location
        )
    ).then_return(WellTarget(well=mock_well, location=input_location, in_place=False))
    decoy.when(mock_instrument_core.get_aspirate_flow_rate(1.23)).then_return(5.67)

    subject.aspirate(volume=42.0, location=input_location, rate=1.23)

    decoy.verify(
        mock_instrument_core.aspirate(
            location=input_location,
            well_core=mock_well._core,
            in_place=False,
            volume=42.0,
            rate=1.23,
            flow_rate=5.67,
        ),
        times=1,
    )


def test_aspirate_from_coordinates(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    subject: InstrumentContext,
    mock_protocol_core: ProtocolCore,
) -> None:
    """It should aspirate from given coordinates."""
    input_location = Location(point=Point(2, 2, 2), labware=None)
    last_location = Location(point=Point(9, 9, 9), labware=None)
    decoy.when(mock_instrument_core.get_mount()).then_return(Mount.RIGHT)

    decoy.when(mock_protocol_core.get_last_location(Mount.RIGHT)).then_return(
        last_location
    )
    decoy.when(
        mock_validation.validate_location(
            location=input_location, last_location=last_location
        )
    ).then_return(PointTarget(location=input_location, in_place=True))
    decoy.when(mock_instrument_core.get_aspirate_flow_rate(1.23)).then_return(5.67)

    subject.aspirate(volume=42.0, location=input_location, rate=1.23)

    decoy.verify(
        mock_instrument_core.aspirate(
            location=input_location,
            well_core=None,
            in_place=True,
            volume=42.0,
            rate=1.23,
            flow_rate=5.67,
        ),
        times=1,
    )


def test_aspirate_raises_no_location(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    subject: InstrumentContext,
    mock_protocol_core: ProtocolCore,
) -> None:
    """Shound raise a RuntimeError error."""
    decoy.when(mock_instrument_core.get_mount()).then_return(Mount.RIGHT)
    decoy.when(mock_protocol_core.get_last_location(Mount.RIGHT)).then_return(None)

    decoy.when(
        mock_validation.validate_location(location=None, last_location=None)
    ).then_raise(mock_validation.NoLocationError())
    with pytest.raises(RuntimeError):
        subject.aspirate(location=None)


def test_blow_out_to_well(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    subject: InstrumentContext,
    mock_protocol_core: ProtocolCore,
) -> None:
    """It should blow out to a well."""
    mock_well = decoy.mock(cls=Well)
    top_location = Location(point=Point(1, 2, 3), labware=mock_well)
    input_location = Location(point=Point(2, 2, 2), labware=None)
    last_location = Location(point=Point(9, 9, 9), labware=None)
    decoy.when(mock_instrument_core.get_mount()).then_return(Mount.RIGHT)

    decoy.when(mock_protocol_core.get_last_location(Mount.RIGHT)).then_return(
        last_location
    )
    decoy.when(
        mock_validation.validate_location(
            location=input_location, last_location=last_location
        )
    ).then_return(WellTarget(well=mock_well, location=None, in_place=False))
    decoy.when(mock_well.top()).then_return(top_location)
    subject.blow_out(location=input_location)

    decoy.verify(
        mock_instrument_core.blow_out(
            location=top_location, well_core=mock_well._core, in_place=False
        ),
        times=1,
    )


def test_blow_out_to_well_location(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    subject: InstrumentContext,
    mock_protocol_core: ProtocolCore,
) -> None:
    """It should blow out to a well location."""
    mock_well = decoy.mock(cls=Well)
    input_location = Location(point=Point(2, 2, 2), labware=None)
    last_location = Location(point=Point(9, 9, 9), labware=None)
    decoy.when(mock_instrument_core.get_mount()).then_return(Mount.RIGHT)

    decoy.when(mock_protocol_core.get_last_location(Mount.RIGHT)).then_return(
        last_location
    )
    decoy.when(
        mock_validation.validate_location(
            location=input_location, last_location=last_location
        )
    ).then_return(WellTarget(well=mock_well, location=input_location, in_place=False))
    subject.blow_out(location=input_location)

    decoy.verify(
        mock_instrument_core.blow_out(
            location=input_location, well_core=mock_well._core, in_place=False
        ),
        times=1,
    )


def test_blow_out_to_location(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    subject: InstrumentContext,
    mock_protocol_core: ProtocolCore,
) -> None:
    """It should blow out to a location."""
    mock_well = decoy.mock(cls=Well)
    input_location = Location(point=Point(2, 2, 2), labware=mock_well)
    last_location = Location(point=Point(9, 9, 9), labware=None)
    point_target = PointTarget(location=input_location, in_place=True)
    decoy.when(mock_instrument_core.get_mount()).then_return(Mount.RIGHT)

    decoy.when(mock_protocol_core.get_last_location(Mount.RIGHT)).then_return(
        last_location
    )
    decoy.when(
        mock_validation.validate_location(
            location=input_location, last_location=last_location
        )
    ).then_return(point_target)

    subject.blow_out(location=input_location)

    decoy.verify(
        mock_instrument_core.blow_out(
            location=input_location, well_core=None, in_place=True
        ),
        times=1,
    )


def test_blow_out_raises_no_location(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    subject: InstrumentContext,
    mock_protocol_core: ProtocolCore,
) -> None:
    """Should raise a RuntimeError."""
    decoy.when(mock_instrument_core.get_mount()).then_return(Mount.RIGHT)
    decoy.when(mock_protocol_core.get_last_location(Mount.RIGHT)).then_return(None)

    decoy.when(
        mock_validation.validate_location(location=None, last_location=None)
    ).then_raise(mock_validation.NoLocationError())
    with pytest.raises(RuntimeError):
        subject.blow_out(location=None)


def test_pick_up_tip_from_labware(
    decoy: Decoy, mock_instrument_core: InstrumentCore, subject: InstrumentContext
) -> None:
    """It should pick up the next tip from a given labware."""
    mock_tip_rack = decoy.mock(cls=Labware)
    mock_well = decoy.mock(cls=Well)
    top_location = Location(point=Point(1, 2, 3), labware=mock_well)

    decoy.when(mock_instrument_core.get_channels()).then_return(123)
    decoy.when(
        labware.next_available_tip(
            starting_tip=None,
            tip_racks=[mock_tip_rack],
            channels=123,
        )
    ).then_return((mock_tip_rack, mock_well))
    decoy.when(mock_well.top()).then_return(top_location)

    subject.pick_up_tip(mock_tip_rack)

    decoy.verify(
        mock_instrument_core.pick_up_tip(
            location=top_location,
            well_core=mock_well._core,
            presses=None,
            increment=None,
            prep_after=True,
        ),
        times=1,
    )


def test_pick_up_tip_from_well_location(
    decoy: Decoy, mock_instrument_core: InstrumentCore, subject: InstrumentContext
) -> None:
    """It should pick up the next tip from a given well-based Location."""
    mock_well = decoy.mock(cls=Well)
    location = Location(point=Point(1, 2, 3), labware=mock_well)

    subject.pick_up_tip(location)

    decoy.verify(
        mock_instrument_core.pick_up_tip(
            location=location,
            well_core=mock_well._core,
            presses=None,
            increment=None,
            prep_after=True,
        ),
        times=1,
    )


def test_pick_up_tip_from_labware_location(
    decoy: Decoy, mock_instrument_core: InstrumentCore, subject: InstrumentContext
) -> None:
    """It should pick up the next tip from a given labware-based Location."""
    mock_tip_rack = decoy.mock(cls=Labware)
    mock_well = decoy.mock(cls=Well)
    location = Location(point=Point(1, 2, 3), labware=mock_tip_rack)
    top_location = Location(point=Point(1, 2, 3), labware=mock_well)

    decoy.when(mock_instrument_core.get_channels()).then_return(123)
    decoy.when(
        labware.next_available_tip(
            starting_tip=None,
            tip_racks=[mock_tip_rack],
            channels=123,
        )
    ).then_return((mock_tip_rack, mock_well))
    decoy.when(mock_well.top()).then_return(top_location)

    subject.pick_up_tip(location)

    decoy.verify(
        mock_instrument_core.pick_up_tip(
            location=top_location,
            well_core=mock_well._core,
            presses=None,
            increment=None,
            prep_after=True,
        ),
        times=1,
    )


def test_pick_up_from_associated_tip_racks(
    decoy: Decoy, mock_instrument_core: InstrumentCore, subject: InstrumentContext
) -> None:
    """It should pick up from it associated tip racks."""
    mock_tip_rack_1 = decoy.mock(cls=Labware)
    mock_tip_rack_2 = decoy.mock(cls=Labware)
    mock_starting_tip = decoy.mock(cls=Well)
    mock_well = decoy.mock(cls=Well)
    top_location = Location(point=Point(1, 2, 3), labware=mock_well)

    decoy.when(mock_instrument_core.get_channels()).then_return(123)
    decoy.when(
        labware.next_available_tip(
            starting_tip=mock_starting_tip,
            tip_racks=[mock_tip_rack_1, mock_tip_rack_2],
            channels=123,
        )
    ).then_return((mock_tip_rack_2, mock_well))
    decoy.when(mock_well.top()).then_return(top_location)

    subject.starting_tip = mock_starting_tip
    subject.tip_racks = [mock_tip_rack_1, mock_tip_rack_2]
    subject.pick_up_tip()

    decoy.verify(
        mock_instrument_core.pick_up_tip(
            location=top_location,
            well_core=mock_well._core,
            presses=None,
            increment=None,
            prep_after=True,
        ),
        times=1,
    )


def test_drop_tip_to_well(
    decoy: Decoy, mock_instrument_core: InstrumentCore, subject: InstrumentContext
) -> None:
    """It should drop a tip in a specific well."""
    mock_well = decoy.mock(cls=Well)

    subject.drop_tip(mock_well, home_after=False)

    decoy.verify(
        mock_instrument_core.drop_tip(
            location=None,
            well_core=mock_well._core,
            home_after=False,
            alternate_drop_location=False,
        ),
        times=1,
    )


@pytest.mark.parametrize("api_version", [APIVersion(2, 14)])
def test_drop_tip_to_trash(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    mock_trash: Labware,
    subject: InstrumentContext,
) -> None:
    """It should drop a tip in the trash if not given a location ."""
    mock_well = decoy.mock(cls=Well)

    decoy.when(mock_trash.wells()).then_return([mock_well])

    subject.drop_tip()

    decoy.verify(
        mock_instrument_core.drop_tip(
            location=None,
            well_core=mock_well._core,
            home_after=None,
            alternate_drop_location=False,
        ),
        times=1,
    )


@pytest.mark.parametrize("api_version", [APIVersion(2, 15)])
def test_drop_tip_to_randomized_trash_location(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    mock_trash: Labware,
    subject: InstrumentContext,
) -> None:
    """It should drop a tip in the trash if not given a location ."""
    mock_well = decoy.mock(cls=Well)

    decoy.when(mock_trash.wells()).then_return([mock_well])

    subject.drop_tip()

    decoy.verify(
        mock_instrument_core.drop_tip(
            location=None,
            well_core=mock_well._core,
            home_after=None,
            alternate_drop_location=True,
        ),
        times=1,
    )


def test_return_tip(
    decoy: Decoy, mock_instrument_core: InstrumentCore, subject: InstrumentContext
) -> None:
    """It should pick up a tip and return it."""
    mock_well = decoy.mock(cls=Well)
    top_location = Location(point=Point(1, 2, 3), labware=mock_well)
    decoy.when(mock_well.top()).then_return(top_location)

    subject.pick_up_tip(mock_well)
    subject.return_tip()

    decoy.verify(
        mock_instrument_core.pick_up_tip(
            location=top_location,
            well_core=mock_well._core,
            presses=None,
            increment=None,
            prep_after=True,
        ),
        mock_instrument_core.drop_tip(
            location=None,
            well_core=mock_well._core,
            home_after=None,
            alternate_drop_location=False,
        ),
    )

    with pytest.raises(TypeError, match="Last tip location"):
        subject.return_tip()


def test_dispense_with_location(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    subject: InstrumentContext,
    mock_protocol_core: ProtocolCore,
) -> None:
    """It should dispense to a given location."""
    input_location = Location(point=Point(2, 2, 2), labware=None)
    last_location = Location(point=Point(9, 9, 9), labware=None)
    decoy.when(mock_instrument_core.get_mount()).then_return(Mount.RIGHT)

    decoy.when(mock_protocol_core.get_last_location(Mount.RIGHT)).then_return(
        last_location
    )
    decoy.when(
        mock_validation.validate_location(
            location=input_location, last_location=last_location
        )
    ).then_return(PointTarget(location=input_location, in_place=True))
    decoy.when(mock_instrument_core.get_dispense_flow_rate(1.23)).then_return(5.67)

    subject.dispense(volume=42.0, location=input_location, rate=1.23)

    decoy.verify(
        mock_instrument_core.dispense(
            location=input_location,
            well_core=None,
            in_place=True,
            volume=42.0,
            rate=1.23,
            flow_rate=5.67,
        ),
        times=1,
    )


def test_dispense_with_well_location(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    subject: InstrumentContext,
    mock_protocol_core: ProtocolCore,
) -> None:
    """It should dispense to a well location."""
    mock_well = decoy.mock(cls=Well)
    input_location = Location(point=Point(2, 2, 2), labware=None)
    last_location = Location(point=Point(9, 9, 9), labware=None)
    decoy.when(mock_instrument_core.get_mount()).then_return(Mount.RIGHT)

    decoy.when(mock_protocol_core.get_last_location(Mount.RIGHT)).then_return(
        last_location
    )
    decoy.when(
        mock_validation.validate_location(
            location=input_location, last_location=last_location
        )
    ).then_return(WellTarget(well=mock_well, location=input_location, in_place=False))
    decoy.when(mock_instrument_core.get_dispense_flow_rate(1.23)).then_return(3.0)

    subject.dispense(volume=42.0, location=input_location, rate=1.23)

    decoy.verify(
        mock_instrument_core.dispense(
            location=input_location,
            well_core=mock_well._core,
            in_place=False,
            volume=42.0,
            rate=1.23,
            flow_rate=3.0,
        ),
        times=1,
    )


def test_dispense_with_well(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    subject: InstrumentContext,
    mock_protocol_core: ProtocolCore,
) -> None:
    """It should dispense to a well."""
    mock_well = decoy.mock(cls=Well)
    bottom_location = Location(point=Point(1, 2, 3), labware=mock_well)
    input_location = Location(point=Point(2, 2, 2), labware=None)
    last_location = Location(point=Point(9, 9, 9), labware=None)
    decoy.when(mock_instrument_core.get_mount()).then_return(Mount.RIGHT)

    decoy.when(mock_protocol_core.get_last_location(Mount.RIGHT)).then_return(
        last_location
    )
    decoy.when(
        mock_validation.validate_location(
            location=input_location, last_location=last_location
        )
    ).then_return(WellTarget(well=mock_well, location=None, in_place=False))
    decoy.when(mock_well.bottom(z=1.0)).then_return(bottom_location)
    decoy.when(mock_instrument_core.get_dispense_flow_rate(1.23)).then_return(5.67)

    subject.dispense(volume=42.0, location=input_location, rate=1.23)

    decoy.verify(
        mock_instrument_core.dispense(
            location=bottom_location,
            well_core=mock_well._core,
            in_place=False,
            volume=42.0,
            rate=1.23,
            flow_rate=5.67,
        ),
        times=1,
    )


def test_dispense_raises_no_location(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    subject: InstrumentContext,
    mock_protocol_core: ProtocolCore,
) -> None:
    """Should raise a RuntimeError."""
    decoy.when(mock_instrument_core.get_mount()).then_return(Mount.RIGHT)
    decoy.when(mock_protocol_core.get_last_location(Mount.RIGHT)).then_return(None)

    decoy.when(
        mock_validation.validate_location(location=None, last_location=None)
    ).then_raise(mock_validation.NoLocationError())
    with pytest.raises(RuntimeError):
        subject.dispense(location=None)


def test_touch_tip(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    subject: InstrumentContext,
) -> None:
    """It should touch the pipette tip to the edges of the well with the core."""
    mock_well = decoy.mock(cls=Well)

    decoy.when(mock_instrument_core.has_tip()).then_return(True)

    decoy.when(mock_well.top(z=4.56)).then_return(
        Location(point=Point(1, 2, 3), labware=mock_well)
    )

    decoy.when(mock_well.parent.quirks).then_return([])

    subject.touch_tip(mock_well, radius=0.123, v_offset=4.56, speed=42.0)

    decoy.verify(
        mock_instrument_core.touch_tip(
            location=Location(point=Point(1, 2, 3), labware=mock_well),
            well_core=mock_well._core,
            radius=0.123,
            z_offset=4.56,
            speed=42.0,
        )
    )


def test_return_height(
    decoy: Decoy, mock_instrument_core: InstrumentCore, subject: InstrumentContext
) -> None:
    """It should get the tip return scale factor."""
    decoy.when(mock_instrument_core.get_return_height()).then_return(0.123)

    result = subject.return_height

    assert result == 0.123


def test_flow_rate(
    decoy: Decoy, mock_instrument_core: InstrumentCore, subject: InstrumentContext
) -> None:
    """It should return a FlowRates object."""
    flow_rates = decoy.mock(cls=FlowRates)
    decoy.when(mock_instrument_core.get_flow_rate()).then_return(flow_rates)

    result = subject.flow_rate

    assert result == flow_rates


@pytest.mark.parametrize("api_version", [APIVersion(2, 13)])
@pytest.mark.parametrize(
    "mock_instrument_core",
    [lazy_fixture("mock_legacy_instrument_core")],
)
def test_plunger_speed(
    decoy: Decoy,
    mock_legacy_instrument_core: LegacyInstrumentCore,
    subject: InstrumentContext,
) -> None:
    """It should return a PlungerSpeeds object on PAPI <= v2.13."""
    plunger_speeds = decoy.mock(cls=PlungerSpeeds)
    decoy.when(mock_legacy_instrument_core.get_speed()).then_return(plunger_speeds)

    result = subject.speed

    assert result == plunger_speeds


@pytest.mark.parametrize("api_version", [APIVersion(2, 14)])
def test_plunger_speed_removed(subject: InstrumentContext) -> None:
    """It should raise an error on PAPI >= v2.14."""
    with pytest.raises(APIVersionError):
        subject.speed
