import pytest
from typing import Dict, List, ContextManager, Tuple

from contextlib import nullcontext as does_not_raise
from opentrons.hardware_control import nozzle_manager

from opentrons.types import Point
from opentrons.hardware_control.types import CriticalPoint


def build_nozzle_manger(
    nozzle_map: Dict[str, List[float]]
) -> nozzle_manager.NozzleConfigurationManager:
    return nozzle_manager.NozzleConfigurationManager.build_from_nozzlemap(
        nozzle_map, pick_up_current_map={1: 0.1}
    )


NINETY_SIX_CHANNEL_MAP = {
    "A1": [-36.0, -25.5, -259.15],
    "A2": [-27.0, -25.5, -259.15],
    "A3": [-18.0, -25.5, -259.15],
    "A4": [-9.0, -25.5, -259.15],
    "A5": [0.0, -25.5, -259.15],
    "A6": [9.0, -25.5, -259.15],
    "A7": [18.0, -25.5, -259.15],
    "A8": [27.0, -25.5, -259.15],
    "A9": [36.0, -25.5, -259.15],
    "A10": [45.0, -25.5, -259.15],
    "A11": [54.0, -25.5, -259.15],
    "A12": [63.0, -25.5, -259.15],
    "B1": [-36.0, -34.5, -259.15],
    "B2": [-27.0, -34.5, -259.15],
    "B3": [-18.0, -34.5, -259.15],
    "B4": [-9.0, -34.5, -259.15],
    "B5": [0.0, -34.5, -259.15],
    "B6": [9.0, -34.5, -259.15],
    "B7": [18.0, -34.5, -259.15],
    "B8": [27.0, -34.5, -259.15],
    "B9": [36.0, -34.5, -259.15],
    "B10": [45.0, -34.5, -259.15],
    "B11": [54.0, -34.5, -259.15],
    "B12": [63.0, -34.5, -259.15],
    "C1": [-36.0, -43.5, -259.15],
    "C2": [-27.0, -43.5, -259.15],
    "C3": [-18.0, -43.5, -259.15],
    "C4": [-9.0, -43.5, -259.15],
    "C5": [0.0, -43.5, -259.15],
    "C6": [9.0, -43.5, -259.15],
    "C7": [18.0, -43.5, -259.15],
    "C8": [27.0, -43.5, -259.15],
    "C9": [36.0, -43.5, -259.15],
    "C10": [45.0, -43.5, -259.15],
    "C11": [54.0, -43.5, -259.15],
    "C12": [63.0, -43.5, -259.15],
    "D1": [-36.0, -52.5, -259.15],
    "D2": [-27.0, -52.5, -259.15],
    "D3": [-18.0, -52.5, -259.15],
    "D4": [-9.0, -52.5, -259.15],
    "D5": [0.0, -52.5, -259.15],
    "D6": [9.0, -52.5, -259.15],
    "D7": [18.0, -52.5, -259.15],
    "D8": [27.0, -52.5, -259.15],
    "D9": [36.0, -52.5, -259.15],
    "D10": [45.0, -52.5, -259.15],
    "D11": [54.0, -52.5, -259.15],
    "D12": [63.0, -52.5, -259.15],
    "E1": [-36.0, -61.5, -259.15],
    "E2": [-27.0, -61.5, -259.15],
    "E3": [-18.0, -61.5, -259.15],
    "E4": [-9.0, -61.5, -259.15],
    "E5": [0.0, -61.5, -259.15],
    "E6": [9.0, -61.5, -259.15],
    "E7": [18.0, -61.5, -259.15],
    "E8": [27.0, -61.5, -259.15],
    "E9": [36.0, -61.5, -259.15],
    "E10": [45.0, -61.5, -259.15],
    "E11": [54.0, -61.5, -259.15],
    "E12": [63.0, -61.5, -259.15],
    "F1": [-36.0, -70.5, -259.15],
    "F2": [-27.0, -70.5, -259.15],
    "F3": [-18.0, -70.5, -259.15],
    "F4": [-9.0, -70.5, -259.15],
    "F5": [0.0, -70.5, -259.15],
    "F6": [9.0, -70.5, -259.15],
    "F7": [18.0, -70.5, -259.15],
    "F8": [27.0, -70.5, -259.15],
    "F9": [36.0, -70.5, -259.15],
    "F10": [45.0, -70.5, -259.15],
    "F11": [54.0, -70.5, -259.15],
    "F12": [63.0, -70.5, -259.15],
    "G1": [-36.0, -79.5, -259.15],
    "G2": [-27.0, -79.5, -259.15],
    "G3": [-18.0, -79.5, -259.15],
    "G4": [-9.0, -79.5, -259.15],
    "G5": [0.0, -79.5, -259.15],
    "G6": [9.0, -79.5, -259.15],
    "G7": [18.0, -79.5, -259.15],
    "G8": [27.0, -79.5, -259.15],
    "G9": [36.0, -79.5, -259.15],
    "G10": [45.0, -79.5, -259.15],
    "G11": [54.0, -79.5, -259.15],
    "G12": [63.0, -79.5, -259.15],
    "H1": [-36.0, -88.5, -259.15],
    "H2": [-27.0, -88.5, -259.15],
    "H3": [-18.0, -88.5, -259.15],
    "H4": [-9.0, -88.5, -259.15],
    "H5": [0.0, -88.5, -259.15],
    "H6": [9.0, -88.5, -259.15],
    "H7": [18.0, -88.5, -259.15],
    "H8": [27.0, -88.5, -259.15],
    "H9": [36.0, -88.5, -259.15],
    "H10": [45.0, -88.5, -259.15],
    "H11": [54.0, -88.5, -259.15],
    "H12": [63.0, -88.5, -259.15],
}


@pytest.mark.parametrize(
    argnames=["nozzle_map", "critical_point_configuration", "expected"],
    argvalues=[
        [
            {
                "A1": [-8.0, -16.0, -259.15],
                "B1": [-8.0, -25.0, -259.15],
                "C1": [-8.0, -34.0, -259.15],
                "D1": [-8.0, -43.0, -259.15],
                "E1": [-8.0, -52.0, -259.15],
                "F1": [-8.0, -61.0, -259.15],
                "G1": [-8.0, -70.0, -259.15],
                "H1": [-8.0, -79.0, -259.15],
            },
            CriticalPoint.XY_CENTER,
            Point(-8.0, -47.5, -259.15),
        ],
        [
            NINETY_SIX_CHANNEL_MAP,
            CriticalPoint.XY_CENTER,
            Point(13.5, -57.0, -259.15),
        ],
        [
            {"A1": [1, 1, 1]},
            CriticalPoint.FRONT_NOZZLE,
            Point(1, 1, 1),
        ],
    ],
)
def test_update_nozzles_with_critical_points(
    nozzle_map: Dict[str, List[float]],
    critical_point_configuration: CriticalPoint,
    expected: List[float],
) -> None:
    subject = build_nozzle_manger(nozzle_map)
    new_cp = subject.critical_point_with_tip_length(critical_point_configuration)
    assert new_cp == expected


@pytest.mark.parametrize(
    argnames=["nozzle_map", "updated_nozzle_configuration", "exception", "expected_cp"],
    argvalues=[
        [
            {
                "A1": [0.0, 31.5, 0.8],
                "B1": [0.0, 22.5, 0.8],
                "C1": [0.0, 13.5, 0.8],
                "D1": [0.0, 4.5, 0.8],
                "E1": [0.0, -4.5, 0.8],
                "F1": [0.0, -13.5, 0.8],
                "G1": [0.0, -22.5, 0.8],
                "H1": [0.0, -31.5, 0.8],
            },
            ("D1", "H1"),
            does_not_raise(),
            Point(0.0, 4.5, 0.8),
        ],
        [
            {"A1": [1, 1, 1]},
            ("A1", "D1"),
            pytest.raises(nozzle_manager.IncompatibleNozzleConfiguration),
            Point(1, 1, 1),
        ],
        [
            NINETY_SIX_CHANNEL_MAP,
            ("A12", "H12"),
            does_not_raise(),
            Point(x=63.0, y=-25.5, z=-259.15),
        ],
    ],
)
def test_update_nozzle_configuration(
    nozzle_map: Dict[str, List[float]],
    updated_nozzle_configuration: Tuple[str, str],
    exception: ContextManager[None],
    expected_cp: List[float],
) -> None:
    subject = build_nozzle_manger(nozzle_map)
    with exception:
        subject.update_nozzle_configuration(*updated_nozzle_configuration)
    assert subject.starting_nozzle_offset == expected_cp
