"""Tests for the InstrumentContext public interface."""
import pytest
from decoy import Decoy

from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocol_api import MAX_SUPPORTED_VERSION, Labware, Well
from opentrons.protocol_api.core.common import WellCore
from opentrons.types import Point, Location


@pytest.fixture
def mock_well_core(decoy: Decoy) -> WellCore:
    """Get a mock labware implementation core."""
    core = decoy.mock(cls=WellCore)
    decoy.when(core.get_display_name()).then_return("A1 of Cool Labware")
    return core


@pytest.fixture
def api_version() -> APIVersion:
    """Get the API version to test at."""
    return MAX_SUPPORTED_VERSION


@pytest.fixture
def mock_parent(decoy: Decoy) -> Labware:
    """Get the well's parent."""
    return decoy.mock(cls=Labware)


@pytest.fixture
def subject(
    mock_parent: Labware, mock_well_core: WellCore, api_version: APIVersion
) -> Well:
    """Get a Well test subject with its dependencies mocked out."""
    return Well(
        parent=mock_parent,
        well_implementation=mock_well_core,
        api_version=api_version,
    )


@pytest.mark.parametrize("api_version", [APIVersion(2, 0), APIVersion(2, 1)])
def test_api_version(api_version: APIVersion, subject: Well) -> None:
    """It should have an api_version property."""
    assert subject.api_version == api_version


def test_parent(mock_parent: Labware, subject: Well) -> None:
    """It should have a reference to its parent."""
    assert subject.parent is mock_parent


def test_repr(
    decoy: Decoy, mock_well_core: WellCore, mock_parent: Labware, subject: Well
) -> None:
    """It should have a string representation."""
    assert subject.display_name == "A1 of Cool Labware"
    assert repr(subject) == "A1 of Cool Labware"


def test_well_max_volume(decoy: Decoy, mock_well_core: WellCore, subject: Well) -> None:
    """It should get the well's max volume from the core."""
    decoy.when(mock_well_core.get_max_volume()).then_return(101)
    assert subject.max_volume == 101


def test_well_top(decoy: Decoy, mock_well_core: WellCore, subject: Well) -> None:
    """It should get a Location representing the top of the well."""
    decoy.when(mock_well_core.get_top(z_offset=4.2)).then_return(Point(1, 2, 3))

    result = subject.top(4.2)

    assert isinstance(result, Location)
    assert result.point == Point(1, 2, 3)
    assert result.labware.as_well() is subject


def test_well_bottom(decoy: Decoy, mock_well_core: WellCore, subject: Well) -> None:
    """It should get a Location representing the bottom of the well."""
    decoy.when(mock_well_core.get_bottom(z_offset=4.2)).then_return(Point(1, 2, 3))

    result = subject.bottom(4.2)

    assert isinstance(result, Location)
    assert result.point == Point(1, 2, 3)
    assert result.labware.as_well() is subject


def test_well_center(decoy: Decoy, mock_well_core: WellCore, subject: Well) -> None:
    """It should get a Location representing the center of the well."""
    decoy.when(mock_well_core.get_center()).then_return(Point(1, 2, 3))

    result = subject.center()

    assert isinstance(result, Location)
    assert result.point == Point(1, 2, 3)
    assert result.labware.as_well() is subject
