"""Test Alignment."""
from typing import List, Union
from typing_extensions import Final

from opentrons.config.defaults_ot3 import DEFAULT_DECK_TRANSFORM
from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.ot3_calibration import (
    find_deck_height,
    find_slot_center_linear,
)

from hardware_testing.data.csv_report import (
    CSVReport,
    CSVResult,
    CSVLine,
    CSVLineRepeating,
)
from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing.opentrons_api.types import Point, OT3Mount
from hardware_testing.data import ui


EXPECTED_POINTS = {
    1: helpers_ot3.get_slot_calibration_square_position_ot3(1),
    3: helpers_ot3.get_slot_calibration_square_position_ot3(3),
    12: helpers_ot3.get_slot_calibration_square_position_ot3(12),
}
SLOT_12_TO_SLOT_3 = Point(y=-1 * (EXPECTED_POINTS[12].y - EXPECTED_POINTS[3].y))
SLOT_3_TO_SLOT_1 = Point(x=-1 * (EXPECTED_POINTS[3].x - EXPECTED_POINTS[1].x))

ALIGNMENT_TESTS: Final = [
    "deck-flatness",
    "parallelism-y",
    "parallelism-x",
]

RELATIVE_MOVE_FROM_HOME_DELTA = Point(x=-500, y=-300)
RELATIVE_MOVE_FROM_HOME_SPEED = 200


def build_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    lines: List[Union[CSVLine, CSVLineRepeating]] = list()
    for t in ALIGNMENT_TESTS:
        lines.append(CSVLine(t, [CSVResult]))
    return lines


async def _find_slot(api: OT3API, mount: OT3Mount, expected: Point) -> Point:
    if not api.is_simulator:
        pos = await api.gantry_position(mount)
        await api.move_to(mount, pos._replace(z=max(pos.z, 100)))
        z_height = await find_deck_height(api, mount, expected)
        actual = await find_slot_center_linear(
            api, mount, expected._replace(z=z_height)
        )
    else:
        actual = expected + Point()
    return actual


def _assert_deck_transform_is_default(api: OT3API) -> None:
    att_matrix = api.config.deck_transform
    for def_row, att_row in zip(DEFAULT_DECK_TRANSFORM, att_matrix):
        for default_val, current_val in zip(def_row, att_row):
            assert current_val == default_val, \
                f"deck transform is not equal to default: {att_matrix}"


async def run(api: OT3API, report: CSVReport, section: str) -> None:
    """Run."""
    ui.print_header("PROBE DECK")
    _assert_deck_transform_is_default(api)
    print("homing")
    await api.home()

    # ATTACH PIPETTE
    print("moving to front of machine")
    mount = OT3Mount.LEFT
    await api.move_rel(
        mount,
        RELATIVE_MOVE_FROM_HOME_DELTA,
        speed=RELATIVE_MOVE_FROM_HOME_SPEED,
    )
    while not api.hardware_pipettes[mount.to_mount()] and not api.is_simulator:
        ui.get_user_ready(f"attached a pipette to the {mount.value} mount")

    # PROBE SLOTS
    actual_12 = await _find_slot(api, mount, EXPECTED_POINTS[12])
    actual_3 = await _find_slot(api, mount, actual_12 + SLOT_12_TO_SLOT_3)
    actual_1 = await _find_slot(api, mount, actual_3 + SLOT_3_TO_SLOT_1)
