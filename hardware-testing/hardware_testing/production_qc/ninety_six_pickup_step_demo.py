"""96-channel pickup staged demo script.

This script splits the 96 pickup flow into explicit stages so we can
observe/control each step independently before finalizing requirements.
"""

import argparse
import asyncio
from typing import Literal, Optional

from opentrons.hardware_control.ot3api import OT3API

from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing.opentrons_api.types import OT3Mount, Point


TIP_RACK_96_SLOT = 3
TIP_RACK_96_ADAPTER_HEIGHT = 11
RESERVOIR_SLOT = 2
RESERVOIR_LABWARE = "nest_1_reservoir_195ml"
OFFSET_FOR_1_WELL_LABWARE = Point(x=9 * -11 * 0.5, y=9 * 7 * 0.5)
ASPIRATE_Z = -24
HOVER_Z = 30


def _pipette_name(volume_ul: Literal[200, 1000]) -> str:
    return "p1000_96_v3.4" if volume_ul == 1000 else "p200_96_v3.0"


def _tip_length(volume_ul: Literal[200, 1000]) -> float:
    return helpers_ot3.get_default_tip_length(volume_ul)


def _tiprack_pickup_nominal(volume_ul: Literal[200, 1000]) -> Point:
    return helpers_ot3.get_theoretical_a1_position(
        TIP_RACK_96_SLOT, f"opentrons_flex_96_tiprack_{volume_ul}ul"
    ) + Point(z=TIP_RACK_96_ADAPTER_HEIGHT)


def _reservoir_nominal() -> Point:
    return helpers_ot3.get_theoretical_a1_position(
        RESERVOIR_SLOT, RESERVOIR_LABWARE
    ) + OFFSET_FOR_1_WELL_LABWARE


async def stage_move_to_pickup(api: OT3API, pickup_point: Point) -> None:
    print("[stage] move_to_pickup")
    await helpers_ot3.move_to_arched_ot3(api, OT3Mount.LEFT, pickup_point)


async def stage_plunger_bottom(api: OT3API) -> None:
    print("[stage] plunger_bottom")
    # Intentionally use internal stage to expose split action.
    await api._move_to_plunger_bottom(OT3Mount.LEFT, rate=1.0)


async def stage_tip_pickup_core(api: OT3API) -> None:
    print("[stage] tip_pickup_core")
    await api.tip_pickup_moves_96(OT3Mount.LEFT)


async def stage_add_tip_state(api: OT3API, tip_length: float) -> None:
    print("[stage] add_tip_state")
    # Mirrors pick_up_tip_96_fixture internal state update.
    api.add_tip(OT3Mount.LEFT, tip_length)


async def stage_prepare_for_aspirate(api: OT3API) -> None:
    print("[stage] prepare_for_aspirate")
    await api.prepare_for_aspirate(OT3Mount.LEFT)


async def stage_aspirate(api: OT3API, volume_ul: float, reservoir: Point) -> None:
    print(f"[stage] aspirate {volume_ul}uL")
    await helpers_ot3.move_to_arched_ot3(api, OT3Mount.LEFT, reservoir)
    await api.move_to(OT3Mount.LEFT, reservoir + Point(z=ASPIRATE_Z))
    await api.aspirate(OT3Mount.LEFT, volume_ul)
    await api.move_to(OT3Mount.LEFT, reservoir + Point(z=HOVER_Z))


async def stage_cleanup_drop_tip(api: OT3API, enable: bool) -> None:
    if not enable:
        return
    print("[stage] cleanup_drop_tip")
    await api.move_rel(OT3Mount.LEFT, Point(z=20))
    try:
        await api.drop_tip(OT3Mount.LEFT)
    except Exception as err:  # keep cleanup best-effort
        print(f"[warn] drop_tip failed: {err}")


async def run(args: argparse.Namespace) -> None:
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=args.simulate,
        pipette_left=_pipette_name(args.pipette),
    )
    pickup_point = (
        Point(x=args.pickup_x, y=args.pickup_y, z=args.pickup_z)
        if args.pickup_x is not None and args.pickup_y is not None and args.pickup_z is not None
        else _tiprack_pickup_nominal(args.pipette)
    )
    reservoir = _reservoir_nominal()

    print("=== 96 pickup staged demo ===")
    print(f"simulate={args.simulate}, pipette={_pipette_name(args.pipette)}")
    print(f"pickup_point={pickup_point}")
    print(f"reservoir={reservoir}")

    try:
        await api.home()
        if args.do_jog:
            print("[stage] jog_for_pickup_calibration")
            await helpers_ot3.move_to_arched_ot3(api, OT3Mount.LEFT, pickup_point)
            await helpers_ot3.jog_mount_ot3(api, OT3Mount.LEFT)
            pickup_point = await api.gantry_position(OT3Mount.LEFT)
            print(f"[info] calibrated pickup_point={pickup_point}")

        await stage_move_to_pickup(api, pickup_point)
        await stage_plunger_bottom(api)
        await stage_tip_pickup_core(api)
        await stage_add_tip_state(api, _tip_length(args.pipette))

        if not args.skip_prep_after:
            await stage_prepare_for_aspirate(api)

        if args.aspirate_volume > 0:
            await stage_aspirate(api, args.aspirate_volume, reservoir)

    finally:
        await stage_cleanup_drop_tip(api, enable=args.drop_tip_at_end)
        await api.home()
        print("=== done ===")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="96 pickup staged demo")
    parser.add_argument("--simulate", action="store_true", help="run in simulator")
    parser.add_argument("--pipette", type=int, choices=[200, 1000], default=1000)
    parser.add_argument(
        "--do-jog",
        action="store_true",
        help="jog and capture pickup point before staged flow",
    )
    parser.add_argument(
        "--pickup-x",
        type=float,
        default=None,
        help="explicit pickup point X (mm)",
    )
    parser.add_argument(
        "--pickup-y",
        type=float,
        default=None,
        help="explicit pickup point Y (mm)",
    )
    parser.add_argument(
        "--pickup-z",
        type=float,
        default=None,
        help="explicit pickup point Z (mm)",
    )
    parser.add_argument(
        "--skip-prep-after",
        action="store_true",
        help="skip prepare_for_aspirate stage after pickup",
    )
    parser.add_argument(
        "--aspirate-volume",
        type=float,
        default=50.0,
        help="aspirate volume after pickup, set 0 to skip aspirate",
    )
    parser.add_argument(
        "--no-drop-tip-at-end",
        action="store_false",
        dest="drop_tip_at_end",
        help="skip drop_tip in cleanup stage",
    )
    parser.set_defaults(drop_tip_at_end=True)
    return parser


if __name__ == "__main__":
    parser = build_parser()
    asyncio.run(run(parser.parse_args()))
