"""Tests for transfer_liquid_utils."""

from contextlib import nullcontext as does_not_raise
from logging import Logger
from typing import Any, ContextManager

import pytest
from decoy import Decoy

from opentrons_shared_data.liquid_classes.liquid_class_definition import (
    Coordinate,
    PositionReference,
)
from opentrons_shared_data.pipette.pipette_definition import ValidNozzleMaps
from tests.opentrons.protocol_engine.pipette_fixtures import (
    EIGHT_CHANNEL_COLS,
    EIGHT_CHANNEL_MAP,
    EIGHT_CHANNEL_ROWS,
    NINETY_SIX_COLS,
    NINETY_SIX_MAP,
    NINETY_SIX_ROWS,
)

from .labware_well_fixtures import WELLS_BY_COLUMN_96, WELLS_BY_COLUMN_384
from opentrons.hardware_control.nozzle_manager import NozzleMap
from opentrons.protocol_api._liquid_properties import TipPosition
from opentrons.protocol_api.core.engine import WellCore
from opentrons.protocol_api.disposal_locations import (
    _TRASH_BIN_CUTOUT_FIXTURE,
    DisposalOffset,
    TrashBin,
)
from opentrons.protocol_api.labware import Labware, Well
from opentrons.protocol_engine import ProtocolEngineError
from opentrons.protocol_engine.clients.sync_client import SyncClient as EngineClient
from opentrons.protocol_engine.errors import (
    IncompleteLabwareDefinitionError,
    LiquidHeightUnknownError,
)
from opentrons.protocol_engine.types.liquid_level_detection import (
    LiquidTrackingType,
)
from opentrons.protocols.advanced_control.transfers.transfer_liquid_utils import (
    LocationCheckDescriptors,
    get_blowout_location_for_trash,
    group_wells_for_multi_channel_transfer,
    raise_if_location_inside_liquid,
)
from opentrons.protocols.api_support.types import APIVersion
from opentrons.types import DeckSlotName, Location, Point

_96_FULL_MAP = NozzleMap.build(
    physical_nozzles=NINETY_SIX_MAP,
    physical_rows=NINETY_SIX_ROWS,
    physical_columns=NINETY_SIX_COLS,
    starting_nozzle="A1",
    back_left_nozzle="A1",
    front_right_nozzle="H12",
    valid_nozzle_maps=ValidNozzleMaps(
        maps={
            "Full": sum(
                [
                    NINETY_SIX_ROWS["A"],
                    NINETY_SIX_ROWS["B"],
                    NINETY_SIX_ROWS["C"],
                    NINETY_SIX_ROWS["D"],
                    NINETY_SIX_ROWS["E"],
                    NINETY_SIX_ROWS["F"],
                    NINETY_SIX_ROWS["G"],
                    NINETY_SIX_ROWS["H"],
                ],
                [],
            )
        }
    ),
)

_96_COL1_MAP = NozzleMap.build(
    physical_nozzles=NINETY_SIX_MAP,
    physical_rows=NINETY_SIX_ROWS,
    physical_columns=NINETY_SIX_COLS,
    starting_nozzle="A1",
    back_left_nozzle="A1",
    front_right_nozzle="H1",
    valid_nozzle_maps=ValidNozzleMaps(maps={"Column1": NINETY_SIX_COLS["1"]}),
)

_96_COL12_MAP = NozzleMap.build(
    physical_nozzles=NINETY_SIX_MAP,
    physical_rows=NINETY_SIX_ROWS,
    physical_columns=NINETY_SIX_COLS,
    starting_nozzle="A12",
    back_left_nozzle="A12",
    front_right_nozzle="H12",
    valid_nozzle_maps=ValidNozzleMaps(maps={"Column12": NINETY_SIX_COLS["12"]}),
)

_96_ROW_A_MAP = NozzleMap.build(
    physical_nozzles=NINETY_SIX_MAP,
    physical_rows=NINETY_SIX_ROWS,
    physical_columns=NINETY_SIX_COLS,
    starting_nozzle="A1",
    back_left_nozzle="A1",
    front_right_nozzle="A12",
    valid_nozzle_maps=ValidNozzleMaps(maps={"RowA": NINETY_SIX_ROWS["A"]}),
)

_96_ROW_H_MAP = NozzleMap.build(
    physical_nozzles=NINETY_SIX_MAP,
    physical_rows=NINETY_SIX_ROWS,
    physical_columns=NINETY_SIX_COLS,
    starting_nozzle="H1",
    back_left_nozzle="H1",
    front_right_nozzle="H12",
    valid_nozzle_maps=ValidNozzleMaps(maps={"RowH": NINETY_SIX_ROWS["H"]}),
)

_8_FULL_MAP = NozzleMap.build(
    physical_nozzles=EIGHT_CHANNEL_MAP,
    physical_rows=EIGHT_CHANNEL_ROWS,
    physical_columns=EIGHT_CHANNEL_COLS,
    starting_nozzle="A1",
    back_left_nozzle="A1",
    front_right_nozzle="H1",
    valid_nozzle_maps=ValidNozzleMaps(maps={"Full": EIGHT_CHANNEL_COLS["1"]}),
)


@pytest.fixture
def mock_96_well_labware(decoy: Decoy) -> Labware:
    """Get a mock 96 well labware."""
    mock_96_well_labware = decoy.mock(cls=Labware)
    decoy.when(mock_96_well_labware.parameters).then_return({"format": "96Standard"})  # type: ignore[typeddict-item]
    labware_wells_by_column = []
    for column in WELLS_BY_COLUMN_96:
        wells_by_column = []
        for well_name in column:
            mock_well = decoy.mock(cls=Well)
            decoy.when(mock_well.well_name).then_return(well_name)
            wells_by_column.append(mock_well)
        labware_wells_by_column.append(wells_by_column)
    decoy.when(mock_96_well_labware.columns()).then_return(labware_wells_by_column)
    return mock_96_well_labware


@pytest.fixture
def mock_384_well_labware(decoy: Decoy) -> Labware:
    """Get a mock 96 well labware."""
    mock_384_well_labware = decoy.mock(cls=Labware)
    decoy.when(mock_384_well_labware.parameters).then_return({"format": "384Standard"})  # type: ignore[typeddict-item]
    labware_wells_by_column = []
    for column in WELLS_BY_COLUMN_384:
        wells_by_column = []
        for well_name in column:
            mock_well = decoy.mock(cls=Well)
            decoy.when(mock_well.well_name).then_return(well_name)
            wells_by_column.append(mock_well)
        labware_wells_by_column.append(wells_by_column)
    decoy.when(mock_384_well_labware.columns()).then_return(labware_wells_by_column)
    return mock_384_well_labware


@pytest.mark.parametrize(
    argnames=["liquid_height", "pip_location", "well_bottom", "expected_raise"],
    argvalues=[
        (
            1.0,
            Location(point=Point(4, 5, 6), labware=None),
            Point(0, 0, 0),
            does_not_raise(),
        ),
        (
            100.0,
            Location(point=Point(4, 5, 6), labware=None),
            Point(0, 0, 0),
            pytest.raises(
                RuntimeError,
                match="Retract end location Location\\(point=Point\\(x=4, y=5, z=6\\), labware=,"
                " meniscus_tracking=None\\) is inside the liquid in well Well A1 of"
                " test_labware when it should be outside\\(above\\) the liquid.",
            ),
        ),
        (
            1,
            Location(point=Point(5, 6, 7), labware=None),
            Point(10, 11, 12),
            pytest.raises(
                RuntimeError,
                match="Retract end location Location\\(point=Point\\(x=5, y=6, z=7\\), labware=,"
                " meniscus_tracking=None\\) is inside the liquid in well Well A1 of"
                " test_labware when it should be outside\\(above\\) the liquid.",
            ),
        ),
        (
            None,
            Location(point=Point(5, 6, 7), labware=None),
            Point(10, 11, 12),
            does_not_raise(),
        ),
    ],
)
def test_raise_only_if_pip_location_inside_liquid(
    decoy: Decoy,
    liquid_height: LiquidTrackingType,
    pip_location: Location,
    well_bottom: Point,
    expected_raise: ContextManager[Any],
) -> None:
    """It should raise an error if we have access to liquid height and pipette is in liquid."""
    well_core = decoy.mock(cls=WellCore)
    location_descriptors = LocationCheckDescriptors(
        location_type="retract end",
        pipetting_action="aspirate",
    )
    logger = decoy.mock(cls=Logger)

    decoy.when(well_core.current_liquid_height()).then_return(liquid_height)
    decoy.when(well_core.get_bottom(0)).then_return(well_bottom)
    decoy.when(well_core.get_display_name()).then_return("Well A1 of test_labware")
    with expected_raise:
        raise_if_location_inside_liquid(
            location=pip_location,
            well_core=well_core,
            location_check_descriptors=location_descriptors,
            logger=logger,
        )


@pytest.mark.parametrize(
    "error_raised", [LiquidHeightUnknownError(), IncompleteLabwareDefinitionError()]
)
def test_log_warning_if_pip_location_cannot_be_validated(
    decoy: Decoy,
    error_raised: ProtocolEngineError,
) -> None:
    """It should log a warning if we don't have access to liquid height."""
    pip_location = Location(point=Point(1, 2, 3), labware=None)
    well_core = decoy.mock(cls=WellCore)
    location_descriptors = LocationCheckDescriptors(
        location_type="retract end",
        pipetting_action="aspirate",
    )
    logger = decoy.mock(cls=Logger)

    decoy.when(well_core.current_liquid_height()).then_raise(error_raised)
    decoy.when(well_core.get_bottom(0)).then_return(Point(0, 0, 0))
    decoy.when(well_core.get_display_name()).then_return("Well A1 of test_labware")
    raise_if_location_inside_liquid(
        location=pip_location,
        well_core=well_core,
        location_check_descriptors=location_descriptors,
        logger=logger,
    )
    decoy.verify(
        logger.info(
            "Could not verify height of liquid in well Well A1 of test_labware, either"
            " because the liquid in this well has not been probed or"
            " liquid was not loaded in this well using `load_liquid` or"
            " inner geometry is not available for the target well."
            " Proceeding without verifying if retract end location is outside the liquid."
        )
    )


@pytest.mark.parametrize(
    argnames="nozzle_map", argvalues=[_8_FULL_MAP, _96_COL1_MAP, _96_COL12_MAP]
)
def test_grouping_wells_for_column_96_plate(
    nozzle_map: NozzleMap, mock_96_well_labware: Labware, decoy: Decoy
) -> None:
    """It should group two columns into A1 and A2."""
    mock_wells = [decoy.mock(cls=Well) for _ in range(16)]
    for mock_well, well_name in zip(
        mock_wells, WELLS_BY_COLUMN_96[0] + WELLS_BY_COLUMN_96[1]
    ):
        decoy.when(mock_well.well_name).then_return(well_name)
        decoy.when(mock_well.parent).then_return(mock_96_well_labware)

    wells = group_wells_for_multi_channel_transfer(mock_wells, nozzle_map, "source")
    assert len(wells) == 2
    assert wells[0].well_name == "A1"
    assert wells[1].well_name == "A2"


@pytest.mark.parametrize(
    argnames="nozzle_map", argvalues=[_8_FULL_MAP, _96_COL1_MAP, _96_COL12_MAP]
)
def test_grouping_wells_for_column_384_plate(
    nozzle_map: NozzleMap, mock_384_well_labware: Labware, decoy: Decoy
) -> None:
    """It should group two columns into A1, B1, A2 and B2."""
    mock_wells = [decoy.mock(cls=Well) for _ in range(32)]
    for mock_well, well_name in zip(
        mock_wells, WELLS_BY_COLUMN_384[0] + WELLS_BY_COLUMN_384[1]
    ):
        decoy.when(mock_well.well_name).then_return(well_name)
        decoy.when(mock_well.parent).then_return(mock_384_well_labware)

    wells = group_wells_for_multi_channel_transfer(mock_wells, nozzle_map, "source")
    assert len(wells) == 4
    assert wells[0].well_name == "A1"
    assert wells[1].well_name == "B1"
    assert wells[2].well_name == "A2"
    assert wells[3].well_name == "B2"


@pytest.mark.parametrize(
    argnames="nozzle_map", argvalues=[_8_FULL_MAP, _96_COL1_MAP, _96_COL12_MAP]
)
def test_grouping_wells_for_column_96_plate_raises(
    nozzle_map: NozzleMap, mock_96_well_labware: Labware, decoy: Decoy
) -> None:
    """It should raise if a valid grouping can't be found for all wells."""
    mock_wells = [decoy.mock(cls=Well) for _ in range(18)]
    for mock_well, well_name in zip(
        mock_wells, WELLS_BY_COLUMN_96[0] + WELLS_BY_COLUMN_96[1] + ["A3", "B3"]
    ):
        decoy.when(mock_well.well_name).then_return(well_name)
        decoy.when(mock_well.parent).then_return(mock_96_well_labware)

    # leftover wells
    with pytest.raises(ValueError, match="Pipette will access source wells"):
        group_wells_for_multi_channel_transfer(mock_wells, nozzle_map, "source")

    # non-contiguous wells from the same labware
    with pytest.raises(ValueError, match="Could not group source wells"):
        group_wells_for_multi_channel_transfer(
            mock_wells[:7] + [mock_wells[-1], mock_wells[7]], nozzle_map, "source"
        )

    other_labware = decoy.mock(cls=Labware)
    decoy.when(other_labware.parameters).then_return({"format": "96Standard"})  # type: ignore[typeddict-item]
    other_well = decoy.mock(cls=Well)
    decoy.when(other_well.well_name).then_return("H1")
    decoy.when(other_well.parent).then_return(other_labware)

    # non-contiguous wells from different labware, well name is correct though
    with pytest.raises(ValueError, match="Could not group source wells"):
        group_wells_for_multi_channel_transfer(
            mock_wells[:7] + [other_well], nozzle_map, "source"
        )


@pytest.mark.parametrize(
    argnames="nozzle_map", argvalues=[_8_FULL_MAP, _96_COL1_MAP, _96_COL12_MAP]
)
def test_grouping_wells_for_column_384_plate_raises(
    nozzle_map: NozzleMap, mock_384_well_labware: Labware, decoy: Decoy
) -> None:
    """It should raise if a valid grouping can't be found for all wells."""
    mock_wells = [decoy.mock(cls=Well) for _ in range(32)]
    for mock_well, well_name in zip(
        mock_wells, WELLS_BY_COLUMN_384[0] + WELLS_BY_COLUMN_384[1]
    ):
        decoy.when(mock_well.well_name).then_return(well_name)
        decoy.when(mock_well.parent).then_return(mock_384_well_labware)

    # leftover wells
    with pytest.raises(ValueError, match="Pipette will access destination wells"):
        group_wells_for_multi_channel_transfer(
            mock_wells[:-1], nozzle_map, "destination"
        )

    # non-contiguous or every other wells from the same labware
    with pytest.raises(ValueError, match="Could not group"):
        group_wells_for_multi_channel_transfer(
            mock_wells[:2] + [mock_wells[-1]], nozzle_map, "source"
        )
        group_wells_for_multi_channel_transfer(
            mock_wells[:-1] + [mock_wells[0]], nozzle_map, "destination"
        )

    other_labware = decoy.mock(cls=Labware)
    decoy.when(other_labware.parameters).then_return({"format": "384Standard"})  # type: ignore[typeddict-item]
    other_well = decoy.mock(cls=Well)
    decoy.when(other_well.well_name).then_return("P1")
    decoy.when(other_well.parent).then_return(other_labware)

    # non-contiguous wells from different labware, well name is correct though
    with pytest.raises(ValueError, match="Could not group source wells"):
        group_wells_for_multi_channel_transfer(
            mock_wells[:15] + [other_well], nozzle_map, "source"
        )


@pytest.mark.parametrize(
    argnames="nozzle_map", argvalues=[_96_ROW_A_MAP, _96_ROW_H_MAP]
)
def test_grouping_wells_for_row_96_plate(
    nozzle_map: NozzleMap, mock_96_well_labware: Labware, decoy: Decoy
) -> None:
    """It should group two rows into A1 and B1."""
    mock_wells = [decoy.mock(cls=Well) for _ in range(24)]
    first_two_row_well_names = [f"A{i}" for i in range(1, 13)] + [
        f"B{i}" for i in range(1, 13)
    ]
    for mock_well, well_name in zip(mock_wells, first_two_row_well_names):
        decoy.when(mock_well.well_name).then_return(well_name)
        decoy.when(mock_well.parent).then_return(mock_96_well_labware)

    wells = group_wells_for_multi_channel_transfer(
        mock_wells, nozzle_map, "destination"
    )
    assert len(wells) == 2
    assert wells[0].well_name == "A1"
    assert wells[1].well_name == "B1"


@pytest.mark.parametrize(
    argnames="nozzle_map", argvalues=[_96_ROW_A_MAP, _96_ROW_H_MAP]
)
def test_grouping_wells_for_row_384_plate(
    nozzle_map: NozzleMap, mock_384_well_labware: Labware, decoy: Decoy
) -> None:
    """It should group two columns into A1, A2, B1, B2."""
    mock_wells = [decoy.mock(cls=Well) for _ in range(48)]
    first_two_row_well_names = [f"A{i}" for i in range(1, 25)] + [
        f"B{i}" for i in range(1, 25)
    ]
    for mock_well, well_name in zip(mock_wells, first_two_row_well_names):
        decoy.when(mock_well.well_name).then_return(well_name)
        decoy.when(mock_well.parent).then_return(mock_384_well_labware)

    wells = group_wells_for_multi_channel_transfer(mock_wells, nozzle_map, "source")
    assert len(wells) == 4
    assert wells[0].well_name == "A1"
    assert wells[1].well_name == "A2"
    assert wells[2].well_name == "B1"
    assert wells[3].well_name == "B2"


@pytest.mark.parametrize(
    argnames="nozzle_map", argvalues=[_96_ROW_A_MAP, _96_ROW_H_MAP]
)
def test_grouping_wells_for_row_96_plate_raises(
    nozzle_map: NozzleMap, mock_96_well_labware: Labware, decoy: Decoy
) -> None:
    """It should raise if a valid grouping can't be found for all wells."""
    mock_wells = [decoy.mock(cls=Well) for _ in range(24)]
    first_two_row_well_names = [f"A{i}" for i in range(1, 13)] + [
        f"B{i}" for i in range(1, 13)
    ]
    for mock_well, well_name in zip(mock_wells, first_two_row_well_names):
        decoy.when(mock_well.well_name).then_return(well_name)
        decoy.when(mock_well.parent).then_return(mock_96_well_labware)

    # leftover wells
    with pytest.raises(ValueError, match="Pipette will access source wells"):
        group_wells_for_multi_channel_transfer(mock_wells[:-1], nozzle_map, "source")

    # non-contiguous wells from the same labware
    with pytest.raises(ValueError, match="Could not group source wells"):
        group_wells_for_multi_channel_transfer(
            mock_wells[:11] + [mock_wells[-1], mock_wells[11]], nozzle_map, "source"
        )

    other_labware = decoy.mock(cls=Labware)
    decoy.when(other_labware.parameters).then_return({"format": "96Standard"})  # type: ignore[typeddict-item]
    other_well = decoy.mock(cls=Well)
    decoy.when(other_well.well_name).then_return("A12")
    decoy.when(other_well.parent).then_return(other_labware)

    # non-contiguous wells from different labware, well name is correct though
    with pytest.raises(ValueError, match="Could not group destination wells"):
        group_wells_for_multi_channel_transfer(
            mock_wells[:11] + [other_well], nozzle_map, "destination"
        )


@pytest.mark.parametrize(
    argnames="nozzle_map", argvalues=[_96_ROW_A_MAP, _96_ROW_H_MAP]
)
def test_grouping_wells_for_row_384_plate_raises(
    nozzle_map: NozzleMap, mock_384_well_labware: Labware, decoy: Decoy
) -> None:
    """It should raise if a valid grouping can't be found for all wells."""
    mock_wells = [decoy.mock(cls=Well) for _ in range(48)]
    first_two_row_well_names = [f"A{i}" for i in range(1, 25)] + [
        f"B{i}" for i in range(1, 25)
    ]
    for mock_well, well_name in zip(mock_wells, first_two_row_well_names):
        decoy.when(mock_well.well_name).then_return(well_name)
        decoy.when(mock_well.parent).then_return(mock_384_well_labware)

    # leftover wells
    with pytest.raises(ValueError, match="Pipette will access destination wells"):
        group_wells_for_multi_channel_transfer(
            mock_wells[:-1], nozzle_map, "destination"
        )

    # non-contiguous or every other wells from the same labware
    with pytest.raises(ValueError, match="Could not group"):
        group_wells_for_multi_channel_transfer(
            mock_wells[:2] + [mock_wells[-1]], nozzle_map, "destination"
        )
        group_wells_for_multi_channel_transfer(
            mock_wells[:-1] + [mock_wells[0]], nozzle_map, "source"
        )

    other_labware = decoy.mock(cls=Labware)
    decoy.when(other_labware.parameters).then_return({"format": "384Standard"})  # type: ignore[typeddict-item]
    other_well = decoy.mock(cls=Well)
    decoy.when(other_well.well_name).then_return("A24")
    decoy.when(other_well.parent).then_return(other_labware)

    # non-contiguous wells from different labware, well name is correct though
    with pytest.raises(ValueError, match="Could not group destination wells"):
        group_wells_for_multi_channel_transfer(
            mock_wells[:23] + [other_well], nozzle_map, "destination"
        )


def test_grouping_wells_for_full_96_plate(
    mock_96_well_labware: Labware, decoy: Decoy
) -> None:
    """It should group a whole 96 well plate into A1."""
    mock_wells = [decoy.mock(cls=Well) for _ in range(96)]
    for mock_well, well_name in zip(mock_wells, NINETY_SIX_MAP.keys()):
        decoy.when(mock_well.well_name).then_return(well_name)
        decoy.when(mock_well.parent).then_return(mock_96_well_labware)

    wells = group_wells_for_multi_channel_transfer(
        mock_wells, _96_FULL_MAP, "destination"
    )
    assert len(wells) == 1
    assert wells[0].well_name == "A1"


def test_grouping_wells_for_full_384_plate(
    mock_384_well_labware: Labware, decoy: Decoy
) -> None:
    """It should a whole 384 well plate into A1, B1, A2 and B2."""
    mock_wells = [decoy.mock(cls=Well) for _ in range(384)]
    flat_384_well_names = [well for column in WELLS_BY_COLUMN_384 for well in column]
    for mock_well, well_name in zip(mock_wells, flat_384_well_names):
        decoy.when(mock_well.well_name).then_return(well_name)
        decoy.when(mock_well.parent).then_return(mock_384_well_labware)

    wells = group_wells_for_multi_channel_transfer(mock_wells, _96_FULL_MAP, "source")
    assert len(wells) == 4
    assert wells[0].well_name == "A1"
    assert wells[1].well_name == "B1"
    assert wells[2].well_name == "A2"
    assert wells[3].well_name == "B2"


def test_grouping_wells_raises_for_unsupported_configuration() -> None:
    """It should raise if the well configuration is not supported."""
    nozzle_map = NozzleMap.build(
        physical_nozzles=EIGHT_CHANNEL_MAP,
        physical_rows=EIGHT_CHANNEL_ROWS,
        physical_columns=EIGHT_CHANNEL_COLS,
        starting_nozzle="A1",
        back_left_nozzle="A1",
        front_right_nozzle="D1",
        valid_nozzle_maps=ValidNozzleMaps(maps={"Half": ["A1", "B1", "C1", "D1"]}),
    )
    with pytest.raises(ValueError, match="Unsupported nozzle configuration"):
        group_wells_for_multi_channel_transfer([], nozzle_map, "source")


@pytest.mark.parametrize(
    argnames="nozzle_map",
    argvalues=[
        _8_FULL_MAP,
        _96_FULL_MAP,
        _96_COL1_MAP,
        _96_COL12_MAP,
        _96_ROW_A_MAP,
        _96_ROW_H_MAP,
    ],
)
def test_grouping_well_returns_all_wells_for_non_96_or_384_plate(
    nozzle_map: NozzleMap, decoy: Decoy
) -> None:
    """It should return all wells if parent labware is not a 96 or 384 well plate"""
    mock_reservoir = decoy.mock(cls=Labware)
    decoy.when(mock_reservoir.parameters).then_return({"format": "reservoir"})  # type: ignore[typeddict-item]

    mock_wells = [decoy.mock(cls=Well) for _ in range(12)]
    for mock_well, well_name in zip(mock_wells, [f"A{i}" for i in range(1, 13)]):
        decoy.when(mock_well.well_name).then_return(well_name)
        decoy.when(mock_well.parent).then_return(mock_reservoir)

    result = group_wells_for_multi_channel_transfer(mock_wells, nozzle_map, "source")
    assert result == mock_wells


@pytest.mark.parametrize(
    argnames="target_tip_position, expected_offset_from_top",
    argvalues=[
        (
            TipPosition(
                _position_reference=PositionReference.WELL_TOP,
                _offset=Coordinate(x=0, y=0, z=0),
            ),
            DisposalOffset(x=0, y=0, z=0),
        ),
        (
            TipPosition(
                _position_reference=PositionReference.WELL_BOTTOM,
                _offset=Coordinate(x=0, y=0, z=0),
            ),
            DisposalOffset(x=0, y=0, z=-10),
        ),
        (
            TipPosition(
                _position_reference=PositionReference.WELL_CENTER,
                _offset=Coordinate(x=1, y=2, z=3),
            ),
            DisposalOffset(x=1, y=2, z=-2),
        ),
    ],
)
def test_blowout_location_for_trash(
    decoy: Decoy,
    target_tip_position: TipPosition,
    expected_offset_from_top: DisposalOffset,
) -> None:
    """Should return the expected blowout location for all given disposal locations."""
    engine_client = decoy.mock(cls=EngineClient)
    trash = TrashBin(
        location=DeckSlotName.SLOT_A1,
        addressable_area_name="moveableTrashD3",
        api_version=APIVersion(2, 28),
        engine_client=engine_client,
    )
    decoy.when(
        engine_client.state.addressable_areas.get_fixture_height(
            _TRASH_BIN_CUTOUT_FIXTURE
        )
    ).then_return(10)
    assert (
        get_blowout_location_for_trash(trash, target_tip_position).offset
        == expected_offset_from_top
    )


def test_blowout_location_for_trash_raises_when_position_reference_is_liquid_meniscus(
    decoy: Decoy,
) -> None:
    """Should raise ValueError when position reference is PositionReference.LIQUID_MENISCUS."""
    with pytest.raises(ValueError):
        get_blowout_location_for_trash(
            decoy.mock(cls=TrashBin),
            TipPosition(
                _position_reference=PositionReference.LIQUID_MENISCUS,
                _offset=Coordinate(x=0, y=0, z=0),
            ),
        )
