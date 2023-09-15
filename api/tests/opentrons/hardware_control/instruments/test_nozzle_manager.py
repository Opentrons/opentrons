import pytest
from typing import Dict, List, ContextManager

from contextlib import nullcontext as does_not_raise
from opentrons.hardware_control.instruments import nozzle_manager


def build_nozzle_manger(
    nozzle_map: Dict[str, List[float]], nozzle_configuration: nozzle_manager.UpdateTipTo
) -> nozzle_manager.NozzleConfigurationManager:
    return nozzle_manager.NozzleConfigurationManager(nozzle_map, nozzle_configuration)


@pytest.mark.parametrize(
    argnames=["nozzle_map", "nozzle_configuration", "critical_point_configuration"],
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
            nozzle_manager.UpdateTipTo(starting_nozzle="A1", number_of_tips=8),
            CriticalPoint.XY_OFFSET,
        ],
        [
            {
                "A1": [1, 1, 1]
            },
            nozzle_manager.UpdateTipTo(starting_nozzle="A1", number_of_tips=1),
            CriticalPoint.FRONT_NOZZLE,
        ]
    ],
)
def test_update_nozzles_with_critical_points(
    nozzle_map: Dict[str, List[float]], nozzle_configuration: nozzle_manager.UpdateTipTo, critical_point_configuration: nozzle_manager.UpdateTipTo
) -> None:
    subject = build_nozzle_manger(nozzle_map, nozzle_configuration)
    new_cp = subject.update_nozzle_with_critical_point(critical_point_configuration)
    assert new_cp == nozzle_map["A1"]


@pytest.mark.parametrize(argnames=["nozzle_map", "nozzle_configuration", "updated_nozzle_configuration", "exception"], argvalues=[
    [{
                "A1": [1, 1, 1],
                "B1": [0.5, 0.5, 0.5],
                "C1": [2, 2, 2],
                "D1": [1.5, 1.5, 1.5],
                "E1": [2.1, 2.1, 2.1],
                "F1": [3, 3, 3],
                "G1": [0.5, 0.6, 0.7],
                "H1": [2.3, 2.1, 2.5],
            },
            nozzle_manager.UpdateTipTo(starting_nozzle="A1", number_of_tips=8),
            nozzle_manager.UpdateTipTo(starting_nozzle="D1", number_of_tips=4),
            does_not_raise()
        ],
        [
            {
                "A1": [1, 1, 1]
            },
            nozzle_manager.UpdateTipTo(starting_nozzle="A1", number_of_tips=1),
            nozzle_manager.UpdateTipTo(starting_nozzle="A1", number_of_tips=4),
            does_not_raise()
        ]
])
def test_update_nozzles_with_tips(
    nozzle_map: Dict[str, List[float]], nozzle_configuration: nozzle_manager.UpdateTipTo, updated_nozzle_configuration: nozzle_manager.UpdateTipTo, exception: ContextManager[None],
) -> None:
    subject = build_nozzle_manger(nozzle_map, nozzle_configuration)
    with exception:
        new_cp = subject.update_nozzle_with_tips(updated_nozzle_configuration)
        assert new_cp == nozzle_map["A1"]
