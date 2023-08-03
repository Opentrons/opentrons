"""Gripper-to-Adapter Tolerance."""
import argparse
import asyncio
from typing import List

from opentrons_hardware.hardware_control.gripper_settings import set_error_tolerance

from opentrons.hardware_control.ot3api import OT3API

from hardware_testing.data import ui
from hardware_testing.opentrons_api.types import OT3Mount, Axis, Point
from hardware_testing.opentrons_api import helpers_ot3


RETRACT_HEIGHT_REL_MM = 20
UNGRIP_WIDTH = 87


def _get_answer(msg: str, fake_it: bool) -> bool:
    return fake_it or ui.get_user_answer(msg)


def _get_ready(msg: str, fake_it: bool) -> None:
    if not fake_it:
        ui.get_user_ready(msg)


async def _find_labware_center(api: OT3API, force: float) -> Point:
    while True:
        await helpers_ot3.jog_mount_ot3(api, OT3Mount.GRIPPER)
        _get_ready("about to GRIP", api.is_simulator)
        await api.grip(force)
        _get_ready("about to UNGRIP", api.is_simulator)
        await api.hold_jaw_width(UNGRIP_WIDTH)
        if _get_answer("does it look good", api.is_simulator):
            break
    labware_center = await api.gantry_position(OT3Mount.GRIPPER)
    await api.hold_jaw_width(UNGRIP_WIDTH)
    return labware_center


async def _move_to_labware(api: OT3API, center: Point, offset: Point) -> None:
    await helpers_ot3.move_to_arched_ot3(
        api,
        OT3Mount.GRIPPER,
        center + offset,
        safe_height=center.z + RETRACT_HEIGHT_REL_MM,
    )


async def _pick_up(
    api: OT3API, center: Point, offset: Point, force: float, check: bool = False
) -> bool:
    await api.hold_jaw_width(UNGRIP_WIDTH)
    await _move_to_labware(api, center, offset)
    await api.grip(force)
    await api.move_rel(OT3Mount.GRIPPER, Point(z=RETRACT_HEIGHT_REL_MM))
    return _get_answer("good pick-up", not api.is_simulator and check)


async def _drop(api: OT3API, center: Point, offset: Point, check: bool = False) -> bool:
    await _move_to_labware(api, center, offset)
    await api.hold_jaw_width(UNGRIP_WIDTH)
    await api.move_rel(OT3Mount.GRIPPER, Point(z=RETRACT_HEIGHT_REL_MM))
    return _get_answer("good drop", not api.is_simulator and check)


async def _run_test_sequence(
    api: OT3API,
    center: Point,
    action: str,
    axis: Axis,
    trials: int,
    max_error_pick_up: float,
    max_error_drop: float,
    step: float,
    drop_offset: float,
    force: float,
) -> List[float]:
    ui.print_title(f"{action.upper()}-{axis.name.upper()}")
    check_pick_up = action == "pick-up"
    check_drop = action == "drop"
    max_error = max_error_pick_up if check_pick_up else max_error_drop
    if axis == Axis.X:
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
                _get_ready("about to use gripper", api.is_simulator)
                picked_up = await _pick_up(
                    api=api,
                    center=center,
                    offset=offset if check_pick_up else Point(),
                    force=force,
                    check=check_pick_up,
                )
                if not picked_up:
                    dropped_off = False
                    await api.hold_jaw_width(UNGRIP_WIDTH)
                else:
                    if check_pick_up and axis == Axis.Y:
                        # if pick-up is off along X, we don't want to re-center for drop
                        offset_for_this_drop = Point()
                    else:
                        offset_for_this_drop = offset
                    dropped_off = await _drop(
                        api=api,
                        center=center,
                        offset=offset_for_this_drop + Point(z=drop_offset),
                        check=check_drop,
                    )
                result = picked_up if check_pick_up else dropped_off
                if not result:
                    await api.hold_jaw_width(UNGRIP_WIDTH)
                    await api.home([Axis.Z_G])
                    break
                elif t + 1 == trials:
                    good_offsets.append(offset.x if axis == Axis.X else offset.y)
            if not result and not ui.get_user_answer("test remaining offsets"):
                break
            offset += step_pnt * direction
    print(good_offsets)
    return good_offsets


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

    ui.print_title("SETUP")
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=is_simulating, gripper="GRPV1120230403A01"
    )
    # NOTE: we will be purposefully colliding with stuff,
    #       so disable gripper collision detection.
    if not api.is_simulator:
        await set_error_tolerance(
            api._backend._messenger,  # type: ignore[union-attr]
            max_pos_error=0.1,
            max_unwanted_movement=50.0,  # much bigger than gripper's jaw width
        )

    print("homing...")
    await api.home()
    await api.hold_jaw_width(UNGRIP_WIDTH)

    ui.print_title("JOG TO LABWARE CENTER")
    labware_center = await _find_labware_center(api, force)
    print(f"labware center: {labware_center}")

    await api.home([Axis.Z_G])

    async def _test(action: str, axis: Axis) -> List[float]:
        return await _run_test_sequence(
            api,
            center=labware_center,
            action=action,
            axis=axis,
            trials=trials,
            max_error_pick_up=max_error_pick_up,
            max_error_drop=max_error_drop,
            step=step,
            drop_offset=drop_offset,
            force=force,
        )

    good_drop_x = []
    good_drop_y = []
    good_pick_up_x = []
    good_pick_up_y = []
    if test_drop:
        good_drop_y = await _test("drop", Axis.Y)
        good_drop_x = await _test("drop", Axis.X)
    if test_pick_up:
        good_pick_up_y = await _test("pick-up", Axis.Y)
        good_pick_up_x = await _test("pick-up", Axis.X)
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
