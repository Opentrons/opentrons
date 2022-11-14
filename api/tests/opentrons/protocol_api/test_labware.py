"""Tests for the InstrumentContext public interface."""
import inspect

import pytest
from decoy import Decoy

from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocol_api import MAX_SUPPORTED_VERSION, Labware, Well
from opentrons.protocol_api.core import well_grid
from opentrons.protocol_api.core.common import LabwareCore, WellCore


@pytest.fixture(autouse=True)
def _mock_well_grid_module(decoy: Decoy, monkeypatch: pytest.MonkeyPatch) -> None:
    """Mock out the well grid module."""
    for name, func in inspect.getmembers(well_grid, inspect.isfunction):
        monkeypatch.setattr(well_grid, name, decoy.mock(func=func))


@pytest.fixture
def mock_labware_core(decoy: Decoy) -> LabwareCore:
    """Get a mock labware implementation core."""
    return decoy.mock(cls=LabwareCore)


@pytest.fixture
def api_version() -> APIVersion:
    """Get the API version to test at."""
    return MAX_SUPPORTED_VERSION


@pytest.fixture
def subject(
    decoy: Decoy, mock_labware_core: LabwareCore, api_version: APIVersion
) -> Labware:
    """Get a Labware test subject with its dependencies mocked out."""
    decoy.when(mock_labware_core.get_well_columns()).then_return([])
    decoy.when(well_grid.create([])).then_return(
        well_grid.WellGrid(columns_by_name={}, rows_by_name={})
    )
    return Labware(implementation=mock_labware_core, api_version=api_version)


@pytest.mark.parametrize("api_version", [APIVersion(2, 0), APIVersion(2, 1)])
def test_api_version(api_version: APIVersion, subject: Labware) -> None:
    """It should have an api_version property."""
    assert subject.api_version == api_version


def test_is_tiprack(
    decoy: Decoy, mock_labware_core: LabwareCore, subject: Labware
) -> None:
    """It should report if it's a tip rack."""
    decoy.when(mock_labware_core.is_tip_rack()).then_return(True)
    assert subject.is_tiprack is True

    decoy.when(mock_labware_core.is_tip_rack()).then_return(False)
    assert subject.is_tiprack is False


def test_wells(
    decoy: Decoy,
    api_version: APIVersion,
    mock_labware_core: LabwareCore,
    subject: Labware,
) -> None:
    """It should return a list of wells."""
    mock_well_core_1 = decoy.mock(cls=WellCore)
    mock_well_core_2 = decoy.mock(cls=WellCore)
    grid = well_grid.WellGrid(
        columns_by_name={"1": ["A1", "B1"]},
        rows_by_name={"A": ["A1"], "B": ["B1"]},
    )

    decoy.when(mock_well_core_1.get_name()).then_return("A1")
    decoy.when(mock_well_core_1.get_max_volume()).then_return(100)
    decoy.when(mock_well_core_2.get_name()).then_return("B1")
    decoy.when(mock_well_core_1.get_max_volume()).then_return(1000)

    decoy.when(mock_labware_core.get_well_columns()).then_return([["A1", "B1"]])
    decoy.when(mock_labware_core.get_well_core("A1")).then_return(mock_well_core_1)
    decoy.when(mock_labware_core.get_well_core("B1")).then_return(mock_well_core_2)
    decoy.when(well_grid.create([["A1", "B1"]])).then_return(grid)

    subject = Labware(implementation=mock_labware_core, api_version=api_version)
    result = subject.wells()
    result_a1 = result[0]
    result_b1 = result[1]

    assert len(result) == 2
    assert isinstance(result_a1, Well)
    assert result_a1.well_name == "A1"
    assert isinstance(result_b1, Well)
    assert result_b1.well_name == "B1"

    assert subject.wells_by_name() == {"A1": result_a1, "B1": result_b1}

    assert subject.rows() == [[result_a1], [result_b1]]
    assert subject.rows_by_name() == {"A": [result_a1], "B": [result_b1]}
    assert subject.columns() == [[result_a1, result_b1]]
    assert subject.columns_by_name() == {"1": [result_a1, result_b1]}


def test_reset_tips(
    decoy: Decoy, mock_labware_core: LabwareCore, subject: Labware
) -> None:
    """It should reset and tip state."""
    subject.reset()
    decoy.verify(mock_labware_core.reset_tips(), times=1)
