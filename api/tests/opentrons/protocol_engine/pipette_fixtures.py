"""Nozzle Map data to use in tests."""

from typing import Dict, List
from collections import OrderedDict

from opentrons.types import Point
from opentrons.hardware_control.nozzle_manager import NozzleMap
from opentrons_shared_data.pipette.dev_types import PipetteNameType
from opentrons_shared_data.pipette.pipette_definition import ValidNozzleMaps


NINETY_SIX_ROWS = OrderedDict(
    (
        (
            "A",
            [
                "A1",
                "A2",
                "A3",
                "A4",
                "A5",
                "A6",
                "A7",
                "A8",
                "A9",
                "A10",
                "A11",
                "A12",
            ],
        ),
        (
            "B",
            [
                "B1",
                "B2",
                "B3",
                "B4",
                "B5",
                "B6",
                "B7",
                "B8",
                "B9",
                "B10",
                "B11",
                "B12",
            ],
        ),
        (
            "C",
            [
                "C1",
                "C2",
                "C3",
                "C4",
                "C5",
                "C6",
                "C7",
                "C8",
                "C9",
                "C10",
                "C11",
                "C12",
            ],
        ),
        (
            "D",
            [
                "D1",
                "D2",
                "D3",
                "D4",
                "D5",
                "D6",
                "D7",
                "D8",
                "D9",
                "D10",
                "D11",
                "D12",
            ],
        ),
        (
            "E",
            [
                "E1",
                "E2",
                "E3",
                "E4",
                "E5",
                "E6",
                "E7",
                "E8",
                "E9",
                "E10",
                "E11",
                "E12",
            ],
        ),
        (
            "F",
            [
                "F1",
                "F2",
                "F3",
                "F4",
                "F5",
                "F6",
                "F7",
                "F8",
                "F9",
                "F10",
                "F11",
                "F12",
            ],
        ),
        (
            "G",
            [
                "G1",
                "G2",
                "G3",
                "G4",
                "G5",
                "G6",
                "G7",
                "G8",
                "G9",
                "G10",
                "G11",
                "G12",
            ],
        ),
        (
            "H",
            [
                "H1",
                "H2",
                "H3",
                "H4",
                "H5",
                "H6",
                "H7",
                "H8",
                "H9",
                "H10",
                "H11",
                "H12",
            ],
        ),
    )
)


NINETY_SIX_COLS = OrderedDict(
    (
        ("1", ["A1", "B1", "C1", "D1", "E1", "F1", "G1", "H1"]),
        ("2", ["A2", "B2", "C2", "D2", "E2", "F2", "G2", "H2"]),
        ("3", ["A3", "B3", "C3", "D3", "E3", "F3", "G3", "H3"]),
        ("4", ["A4", "B4", "C4", "D4", "E4", "F4", "G4", "H4"]),
        ("5", ["A5", "B5", "C5", "D5", "E5", "F5", "G5", "H5"]),
        ("6", ["A6", "B6", "C6", "D6", "E6", "F6", "G6", "H6"]),
        ("7", ["A7", "B7", "C7", "D7", "E7", "F7", "G7", "H7"]),
        ("8", ["A8", "B8", "C8", "D8", "E8", "F8", "G8", "H8"]),
        ("9", ["A9", "B9", "C9", "D9", "E9", "F9", "G9", "H9"]),
        ("10", ["A10", "B10", "C10", "D10", "E10", "F10", "G10", "H10"]),
        ("11", ["A11", "B11", "C11", "D11", "E11", "F11", "G11", "H11"]),
        ("12", ["A12", "B12", "C12", "D12", "E12", "F12", "G12", "H12"]),
    )
)

NINETY_SIX_MAP = OrderedDict(
    (
        ("A1", Point(-36.0, -25.5, -259.15)),
        ("A2", Point(-27.0, -25.5, -259.15)),
        ("A3", Point(-18.0, -25.5, -259.15)),
        ("A4", Point(-9.0, -25.5, -259.15)),
        ("A5", Point(0.0, -25.5, -259.15)),
        ("A6", Point(9.0, -25.5, -259.15)),
        ("A7", Point(18.0, -25.5, -259.15)),
        ("A8", Point(27.0, -25.5, -259.15)),
        ("A9", Point(36.0, -25.5, -259.15)),
        ("A10", Point(45.0, -25.5, -259.15)),
        ("A11", Point(54.0, -25.5, -259.15)),
        ("A12", Point(63.0, -25.5, -259.15)),
        ("B1", Point(-36.0, -34.5, -259.15)),
        ("B2", Point(-27.0, -34.5, -259.15)),
        ("B3", Point(-18.0, -34.5, -259.15)),
        ("B4", Point(-9.0, -34.5, -259.15)),
        ("B5", Point(0.0, -34.5, -259.15)),
        ("B6", Point(9.0, -34.5, -259.15)),
        ("B7", Point(18.0, -34.5, -259.15)),
        ("B8", Point(27.0, -34.5, -259.15)),
        ("B9", Point(36.0, -34.5, -259.15)),
        ("B10", Point(45.0, -34.5, -259.15)),
        ("B11", Point(54.0, -34.5, -259.15)),
        ("B12", Point(63.0, -34.5, -259.15)),
        ("C1", Point(-36.0, -43.5, -259.15)),
        ("C2", Point(-27.0, -43.5, -259.15)),
        ("C3", Point(-18.0, -43.5, -259.15)),
        ("C4", Point(-9.0, -43.5, -259.15)),
        ("C5", Point(0.0, -43.5, -259.15)),
        ("C6", Point(9.0, -43.5, -259.15)),
        ("C7", Point(18.0, -43.5, -259.15)),
        ("C8", Point(27.0, -43.5, -259.15)),
        ("C9", Point(36.0, -43.5, -259.15)),
        ("C10", Point(45.0, -43.5, -259.15)),
        ("C11", Point(54.0, -43.5, -259.15)),
        ("C12", Point(63.0, -43.5, -259.15)),
        ("D1", Point(-36.0, -52.5, -259.15)),
        ("D2", Point(-27.0, -52.5, -259.15)),
        ("D3", Point(-18.0, -52.5, -259.15)),
        ("D4", Point(-9.0, -52.5, -259.15)),
        ("D5", Point(0.0, -52.5, -259.15)),
        ("D6", Point(9.0, -52.5, -259.15)),
        ("D7", Point(18.0, -52.5, -259.15)),
        ("D8", Point(27.0, -52.5, -259.15)),
        ("D9", Point(36.0, -52.5, -259.15)),
        ("D10", Point(45.0, -52.5, -259.15)),
        ("D11", Point(54.0, -52.5, -259.15)),
        ("D12", Point(63.0, -52.5, -259.15)),
        ("E1", Point(-36.0, -61.5, -259.15)),
        ("E2", Point(-27.0, -61.5, -259.15)),
        ("E3", Point(-18.0, -61.5, -259.15)),
        ("E4", Point(-9.0, -61.5, -259.15)),
        ("E5", Point(0.0, -61.5, -259.15)),
        ("E6", Point(9.0, -61.5, -259.15)),
        ("E7", Point(18.0, -61.5, -259.15)),
        ("E8", Point(27.0, -61.5, -259.15)),
        ("E9", Point(36.0, -61.5, -259.15)),
        ("E10", Point(45.0, -61.5, -259.15)),
        ("E11", Point(54.0, -61.5, -259.15)),
        ("E12", Point(63.0, -61.5, -259.15)),
        ("F1", Point(-36.0, -70.5, -259.15)),
        ("F2", Point(-27.0, -70.5, -259.15)),
        ("F3", Point(-18.0, -70.5, -259.15)),
        ("F4", Point(-9.0, -70.5, -259.15)),
        ("F5", Point(0.0, -70.5, -259.15)),
        ("F6", Point(9.0, -70.5, -259.15)),
        ("F7", Point(18.0, -70.5, -259.15)),
        ("F8", Point(27.0, -70.5, -259.15)),
        ("F9", Point(36.0, -70.5, -259.15)),
        ("F10", Point(45.0, -70.5, -259.15)),
        ("F11", Point(54.0, -70.5, -259.15)),
        ("F12", Point(63.0, -70.5, -259.15)),
        ("G1", Point(-36.0, -79.5, -259.15)),
        ("G2", Point(-27.0, -79.5, -259.15)),
        ("G3", Point(-18.0, -79.5, -259.15)),
        ("G4", Point(-9.0, -79.5, -259.15)),
        ("G5", Point(0.0, -79.5, -259.15)),
        ("G6", Point(9.0, -79.5, -259.15)),
        ("G7", Point(18.0, -79.5, -259.15)),
        ("G8", Point(27.0, -79.5, -259.15)),
        ("G9", Point(36.0, -79.5, -259.15)),
        ("G10", Point(45.0, -79.5, -259.15)),
        ("G11", Point(54.0, -79.5, -259.15)),
        ("G12", Point(63.0, -79.5, -259.15)),
        ("H1", Point(-36.0, -88.5, -259.15)),
        ("H2", Point(-27.0, -88.5, -259.15)),
        ("H3", Point(-18.0, -88.5, -259.15)),
        ("H4", Point(-9.0, -88.5, -259.15)),
        ("H5", Point(0.0, -88.5, -259.15)),
        ("H6", Point(9.0, -88.5, -259.15)),
        ("H7", Point(18.0, -88.5, -259.15)),
        ("H8", Point(27.0, -88.5, -259.15)),
        ("H9", Point(36.0, -88.5, -259.15)),
        ("H10", Point(45.0, -88.5, -259.15)),
        ("H11", Point(54.0, -88.5, -259.15)),
        ("H12", Point(63.0, -88.5, -259.15)),
    )
)

EIGHT_CHANNEL_ROWS = OrderedDict(
    (
        (
            "A",
            ["A1"],
        ),
        (
            "B",
            ["B1"],
        ),
        (
            "C",
            ["C1"],
        ),
        (
            "D",
            ["D1"],
        ),
        (
            "E",
            ["E1"],
        ),
        (
            "F",
            ["F1"],
        ),
        (
            "G",
            ["G1"],
        ),
        (
            "H",
            ["H1"],
        ),
    )
)

EIGHT_CHANNEL_COLS = OrderedDict(
    (("1", ["A1", "B1", "C1", "D1", "E1", "F1", "G1", "H1"]),)
)

EIGHT_CHANNEL_MAP = OrderedDict(
    (
        ("A1", Point(0.0, 31.5, 35.52)),
        ("B1", Point(0.0, 22.5, 35.52)),
        ("C1", Point(0.0, 13.5, 35.52)),
        ("D1", Point(0.0, 4.5, 35.52)),
        ("E1", Point(0.0, -4.5, 35.52)),
        ("F1", Point(0.0, -13.5, 35.52)),
        ("G1", Point(0.0, -22.5, 35.52)),
        ("H1", Point(0.0, -31.5, 35.52)),
    )
)


def get_default_nozzle_map(pipette_type: PipetteNameType) -> NozzleMap:
    """Get default nozzle map for a given pipette type."""
    if "multi" in pipette_type.value:
        multi_full: Dict[str, List[str]] = {"Full": EIGHT_CHANNEL_COLS["1"]}
        return NozzleMap.build(
            physical_nozzles=EIGHT_CHANNEL_MAP,
            physical_rows=EIGHT_CHANNEL_ROWS,
            physical_columns=EIGHT_CHANNEL_COLS,
            starting_nozzle="A1",
            back_left_nozzle="A1",
            front_right_nozzle="H1",
            valid_nozzle_maps=ValidNozzleMaps(maps=multi_full),
        )
    elif "96" in pipette_type.value:
        all_nozzles = sum(
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
        ninety_six_full: Dict[str, List[str]] = {"Full": all_nozzles}
        return NozzleMap.build(
            physical_nozzles=NINETY_SIX_MAP,
            physical_rows=NINETY_SIX_ROWS,
            physical_columns=NINETY_SIX_COLS,
            starting_nozzle="A1",
            back_left_nozzle="A1",
            front_right_nozzle="H12",
            valid_nozzle_maps=ValidNozzleMaps(maps=ninety_six_full),
        )
    else:
        single_full: Dict[str, List[str]] = {"Full": ["A1"]}
        return NozzleMap.build(
            physical_nozzles=OrderedDict({"A1": Point(0, 0, 0)}),
            physical_rows=OrderedDict({"A": ["A1"]}),
            physical_columns=OrderedDict({"1": ["A1"]}),
            starting_nozzle="A1",
            back_left_nozzle="A1",
            front_right_nozzle="A1",
            valid_nozzle_maps=ValidNozzleMaps(maps=single_full),
        )
