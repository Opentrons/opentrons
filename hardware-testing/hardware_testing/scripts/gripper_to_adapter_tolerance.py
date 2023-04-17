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
    max_error_pick_up: float,
    max_error_drop: float,
    step: float,
    drop_offset: float,
    force: float,
    test_drop: bool,
    test_pick_up: bool,
) -> None:
    def _get_answer(msg: str) -> bool:
        if api.is_simulator:
            return True
        return ui.get_user_answer(msg)

    def _get_ready(msg: str) -> None:
        if api.is_simulator:
            return
        return ui.get_user_ready(msg)

    ui.print_title("SETUP")
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=is_simulating, gripper="GRPV1120230403A01"
    )
    print("homing...")
    await api.home()
    await api.ungrip()
    ui.print_title("JOG TO LABWARE CENTER")
    while True:
        await helpers_ot3.jog_mount_ot3(api, OT3Mount.GRIPPER)
        _get_ready("about to GRIP")
        await api.grip(force)
        _get_ready("about to UNGRIP")
        await api.ungrip()
        if _get_answer("does it look good"):
            break
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
        if check:
            return _get_answer("good pick-up")
        else:
            return True

    async def _drop(offset: Point, check: bool = False) -> bool:
        await _move_to(offset + Point(z=drop_offset))
        await api.ungrip()
        await api.move_rel(OT3Mount.GRIPPER, Point(z=RETRACT_HEIGHT_REL_MM))
        if check:
            return _get_answer("good drop")
        else:
            return True

    async def _test(action: str, axis: OT3Axis) -> List[float]:
        ui.print_title(f"{action.upper()}-{axis.name.upper()}")
        check_pick_up = action == "pick-up"
        check_drop = action == "drop"
        max_error = max_error_pick_up if check_pick_up else max_error_drop
        if axis == OT3Axis.X:
            step_pnt = Point(x=step)
        else:
            step_pnt = Point(y=step)
        good_offsets = []
        for direction in [-1.0, 1.0]:
            offset = Point()
            while abs(offset.x) <= max_error and abs(offset.y) <= max_error:
                ui.print_header(
                    f"{action.upper()}: X={round(offset.x, 2)}, Y={round(offset.y, 2)}"
                )
                result = False
                for t in range(trials):
                    print(f"trial {t + 1}/{trials}")
                    _get_ready("about to use gripper")
                    picked_up = await _pick_up(
                        offset if check_pick_up else Point(), check=check_pick_up
                    )
                    if picked_up:
                        use_offset = (axis == OT3Axis.X and check_pick_up)
                        dropped_off = await _drop(
                            offset if use_offset else Point(),
                            check=check_drop
                        )
                    else:
                        dropped_off = False
                        await api.ungrip()
                    result = picked_up if check_pick_up else dropped_off
                    if not result:
                        await api.ungrip()
                        await api.home([OT3Axis.Z_G])
                        break
                    elif t + 1 == trials:
                        good_offsets.append(offset.x if axis == OT3Axis.X else offset.y)
                if not result and not ui.get_user_answer("test remaining offsets"):
                    break
                offset += step_pnt * direction
        print(good_offsets)
        return good_offsets

    # NOTE: no need to test X axis during pick-up,
    #       because an offset along there would be fine during pick-up,
    #       but bad during drop.
    good_drop_x = []
    good_drop_y = []
    good_pick_up_x = []
    good_pick_up_y = []
    if test_drop:
        good_drop_y = await _test("drop", OT3Axis.Y)
        good_drop_x = await _test("drop", OT3Axis.X)
    if test_pick_up:
        good_pick_up_y = await _test("pick-up", OT3Axis.Y)
        good_pick_up_x = await _test("pick-up", OT3Axis.X)
    ui.print_title("RESULTS")
    if test_drop:
        ui.print_header("DROP-Y")
        print(good_drop_y)
        ui.print_header("DROP-X")
        print(good_drop_x)
    if test_pick_up:
        ui.print_header("PICK-UP-Y")
        print(good_pick_up_y)
        ui.print_header("PICK-UP-X")
        print(good_pick_up_x)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--trials", type=int, default=1)
    parser.add_argument("--max-error-pick-up", type=float, default=3.0)
    parser.add_argument("--max-error-drop", type=float, default=3.0)
    parser.add_argument("--step", type=float, default=0.5)
    parser.add_argument("--drop-offset", type=float, default=0.0)
    parser.add_argument("--force", type=float, default=15.0)
    parser.add_argument("--skip-drop", action="store_true")
    parser.add_argument("--skip-pick-up", action="store_true")
    args = parser.parse_args()
    asyncio.run(
        _main(
            is_simulating=args.simulate,
            trials=args.trials,
            max_error_pick_up=args.max_error_pick_up,
            max_error_drop=args.max_error_drop,
            step=args.step,
            drop_offset=args.drop_offset,
            force=args.force,
            test_drop=not args.skip_drop,
            test_pick_up=not args.skip_pick_up,
        )
    )
