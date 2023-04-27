"""Test Partial Pickup."""
from typing import List, Union

from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.motion_utilities import target_position_from_relative

from hardware_testing.data import ui
from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing.opentrons_api.types import OT3Axis, OT3Mount, Point
from hardware_testing.data.csv_report import (
    CSVReport,
    CSVResult,
    CSVLine,
    CSVLineRepeating,
)

SLOT_TIP_RACK = 5
TIP_VOLUME = 1000
TIP_RACK_LABWARE = f"opentrons_ot3_96_tiprack_{TIP_VOLUME}ul"
SAFE_HEIGHT_ABOVE_RACK = 5

TESTS = {
    "24-tips-right": [Point(x=9 * -9), 1.5],
    "12-tips-front": [Point(y=9 * 7), 1.0],
    "12-tips-back": [Point(y=9 * -7), 1.0],
}


async def _partial_pick_up_motion(api: OT3API, current: float, distance: float, speed: float) -> None:
    async with api._backend.restore_current():
        await api._backend.set_active_current({OT3Axis.Z_L: current})
        target_down = target_position_from_relative(
            OT3Mount.LEFT, Point(z=-distance), api._current_position
        )
        await api._move(target_down, speed=speed)
    target_up = target_position_from_relative(
        OT3Mount.LEFT, Point(z=distance), api._current_position
    )
    await api._move(target_up)
    await api._update_position_estimation([OT3Axis.Z_L])


def build_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    return [
        CSVLine(name, [CSVResult])
        for name in TESTS.keys()
    ]


async def run(api: OT3API, report: CSVReport, section: str) -> None:
    """Run."""
    # TODO: figure out with ME what we are doing here
    tip_rack_nominal = helpers_ot3.get_theoretical_a1_position(SLOT_TIP_RACK, TIP_RACK_LABWARE)

    print("homing")
    # FIXME: remove this once the "'L' format requires 0 <= number <= 4294967295" bug is gone
    await api._backend.home([OT3Axis.P_L])
    await api.refresh_positions()
    await api.home([OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L])
    if not api.is_simulator:
        ui.get_user_ready(f"place {TIP_VOLUME} uL tip-rack in slot #{SLOT_TIP_RACK}")
    await helpers_ot3.move_to_arched_ot3(api, OT3Mount.LEFT, tip_rack_nominal + Point(z=10))
    if not api.is_simulator:
        await helpers_ot3.jog_mount_ot3(api, OT3Mount.LEFT)
    tip_rack_pos = await api.gantry_position(OT3Mount.LEFT)

    async def _pick_up(offset: Point, current: float) -> None:
        tips_loc = tip_rack_pos + offset
        await helpers_ot3.move_to_arched_ot3(
            api,
            OT3Mount.LEFT,
            tips_loc,
            safe_height=tip_rack_pos.z + SAFE_HEIGHT_ABOVE_RACK,
        )
        await _partial_pick_up_motion(api, current=current, distance=13, speed=5)
        await api.add_tip(OT3Mount.LEFT, helpers_ot3.get_default_tip_length(TIP_VOLUME))
        current_pos = await api.gantry_position(OT3Mount.LEFT)
        await api.move_to(OT3Mount.LEFT, current_pos._replace(z=tip_rack_pos.z))

    for name, details in TESTS.items():
        ui.print_header(name.upper())
        if not api.is_simulator:
            ui.get_user_ready("about to pick-up tips")
        await _pick_up(details[0], current=details[1])
        if not api.is_simulator:
            result = ui.get_user_answer("look good")
        else:
            result = False
        report(section, name, [CSVResult.from_bool(result)])
        if not api.is_simulator:
            ui.get_user_ready("about to drop tips in place")
        print("dropping tips")
        await api.move_rel(OT3Mount.LEFT, Point(z=-SAFE_HEIGHT_ABOVE_RACK))
        await api.drop_tip(OT3Mount.LEFT)
