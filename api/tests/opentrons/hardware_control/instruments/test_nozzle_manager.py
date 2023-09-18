import pytest
from typing import Dict, List, ContextManager, Tuple, Optional

from contextlib import nullcontext as does_not_raise
from opentrons.hardware_control.instruments import nozzle_manager
from opentrons.hardware_control.types import CriticalPoint


def build_nozzle_manger(
    nozzle_map: Dict[str, List[float]]
) -> nozzle_manager.NozzleConfigurationManager:
    return nozzle_manager.NozzleConfigurationManager.build_from_nozzlemap(
        nozzle_map, current_scalar=1
    )


@pytest.mark.parametrize(
    argnames=["nozzle_map", "critical_point_configuration", "expected"],
    argvalues=[
        [
            {
                "A1": [1, 1, 1],
                "B1": [0.5, 0.5, 0.5],
                "C1": [2, 2, 2],
                "D1": [1.5, 1.5, 1.5],
                "E1": [2.1, 2.1, 2.1],
                "F1": [3, 3, 3],
                "G1": [0.5, 0.6, 0.7],
                "H1": [2.3, 2.1, 2.5],
            },
            CriticalPoint.XY_CENTER,
            [2.1, 2.1, 2.1],
        ],
        [
            {"A1": [1, 1, 1]},
            CriticalPoint.FRONT_NOZZLE,
            [1, 1, 1],
        ],
    ],
)
def test_update_nozzles_with_critical_points(
    nozzle_map: Dict[str, List[float]],
    critical_point_configuration: CriticalPoint,
    expected: List[float],
) -> None:
    subject = build_nozzle_manger(nozzle_map)
    new_cp = subject.update_nozzle_with_critical_point(critical_point_configuration)
    assert new_cp == expected


@pytest.mark.parametrize(
    argnames=["nozzle_map", "updated_nozzle_configuration", "exception", "expected_cp"],
    argvalues=[
        [
            {
                "A1": [1, 1, 1],
                "B1": [0.5, 0.5, 0.5],
                "C1": [2, 2, 2],
                "D1": [1.5, 1.5, 1.5],
                "E1": [2.1, 2.1, 2.1],
                "F1": [3, 3, 3],
                "G1": [0.5, 0.6, 0.7],
                "H1": [2.3, 2.1, 2.5],
            },
            ("D1", 4),
            does_not_raise(),
            [1.5, 1.5, 1.5],
        ],
        [
            {"A1": [1, 1, 1]},
            ("A1", 4),
            pytest.raises(nozzle_manager.IncompatibleNozzleConfiguration),
            [1, 1, 1],
        ],
    ],
)
def test_update_nozzles_with_tips(
    nozzle_map: Dict[str, List[float]],
    updated_nozzle_configuration: Tuple[str, int],
    exception: ContextManager[None],
    expected_cp: List[float],
) -> None:
    subject = build_nozzle_manger(nozzle_map)
    with exception:
        subject.update_nozzle_with_tips(*updated_nozzle_configuration)
    assert subject.nozzle_offset == expected_cp
