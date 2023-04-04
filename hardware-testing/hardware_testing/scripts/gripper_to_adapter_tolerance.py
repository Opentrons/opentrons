"""Gripper-to-Adapter Tolerance."""
import argparse
import asyncio
from typing import List

from hardware_testing.data import ui
from hardware_testing.opentrons_api.types import OT3Mount, OT3Axis, Point
from hardware_testing.opentrons_api import helpers_ot3


RETRACT_HEIGHT_REL_MM = 20


async def _main(
        is_simulating: bool,
        trials: int,
        max_error: float,
        step: float,
        drop_offset: float,
        force: float,
        test_drop: bool,
        test_pick_up: bool,
) -> None:
    ui.print_title("SETUP")
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=is_simulating, gripper="GRPV1120230403A01"
    )
    print("homing...")
    await api.home()
    await api.ungrip()
    ui.print_title("JOG TO LABWARE CENTER")
    await helpers_ot3.jog_mount_ot3(api, OT3Mount.GRIPPER)
    labware_center = await api.gantry_position(OT3Mount.GRIPPER)
    print(f"labware center: {labware_center}")
    await api.ungrip()
    await api.home([OT3Axis.Z_G])

    async def _move_to(offset: Point) -> None:
        await helpers_ot3.move_to_arched_ot3(
            api,
            OT3Mount.GRIPPER,
            labware_center + offset,
            safe_height=labware_center.z + RETRACT_HEIGHT_REL_MM,
        )

    async def _pick_up(offset: Point, check: bool = False) -> bool:
        await api.ungrip()
        await _move_to(offset)
        await api.grip(force)
        await api.move_rel(OT3Mount.GRIPPER, Point(z=RETRACT_HEIGHT_REL_MM))
        if check and not api.is_simulator:
            return ui.get_user_answer("good pick-up")
        return True

    async def _drop(offset: Point, check: bool = False) -> bool:
        await _move_to(offset + Point(z=drop_offset))
        await api.ungrip()
        await api.move_rel(OT3Mount.GRIPPER, Point(z=RETRACT_HEIGHT_REL_MM))
        if check and not api.is_simulator:
            return ui.get_user_answer("good drop")
        return True

    async def _test(action: str, axis: OT3Axis) -> List[float]:
        ui.print_title(f"{action.upper()}-{axis.name.upper()}")
        check_pick_up = (action == "pick-up")
        check_drop = (action == "drop")
        if axis == OT3Axis.X:
            offset = Point(x=max_error * -1)
            step_pnt = Point(x=step)
        else:
            offset = Point(y=max_error * -1)
            step_pnt = Point(y=step)
        good_offsets = []
        while offset.x <= max_error and offset.y <= max_error:
            ui.print_header(f"{action.upper()}: X={round(offset.x, 1)}, Y={round(offset.y, 1)}")
            for t in range(trials):
                print(f"trial {t + 1}/{trials}")
                if not api.is_simulator:
                    ui.get_user_ready("about to use gripper")
                picked_up = await _pick_up(offset if check_pick_up else Point(), check=check_pick_up)
                dropped_off = await _drop(offset if check_drop else Point(), check=check_drop)
                result = picked_up if check_pick_up else dropped_off
                if not result:
                    break
                elif t + 1 == trials:
                    good_offsets.append(offset.x if axis == OT3Axis.X else offset.y)
            offset += step_pnt
        print(good_offsets)
        return good_offsets

    # NOTE: no need to test X axis during pick-up,
    #       because an offset along there would be fine during pick-up,
    #       but bad during drop.
    good_drop_x = []
    good_drop_y = []
    good_pick_up_y = []
    if test_drop:
        good_drop_x = await _test("drop", OT3Axis.X)
        good_drop_y = await _test("drop", OT3Axis.Y)
    if test_pick_up:
        good_pick_up_y = await _test("pick-up", OT3Axis.Y)
    ui.print_title("RESULTS")
    if test_drop:
        ui.print_header("DROP-X")
        print(good_drop_x)
        ui.print_header("DROP-Y")
        print(good_drop_y)
    if test_pick_up:
        ui.print_header("PICK-UP-Y")
        print(good_pick_up_y)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--trials", type=int, default=1)
    parser.add_argument("--max-error", type=float, default=3.0)
    parser.add_argument("--step", type=float, default=0.5)
    parser.add_argument("--drop-offset", type=float, default=0.0)
    parser.add_argument("--force", type=float, default=15.0)
    parser.add_argument("--skip-drop", action="store_true")
    parser.add_argument("--skip-pick-up", action="store_true")
    args = parser.parse_args()
    asyncio.run(_main(
        is_simulating=args.simulate,
        trials=args.trials,
        max_error=args.max_error,
        step=args.step,
        drop_offset=args.drop_offset,
        force=args.force,
        test_drop=not args.skip_drop,
        test_pick_up=not args.skip_pick_up,
    ))
