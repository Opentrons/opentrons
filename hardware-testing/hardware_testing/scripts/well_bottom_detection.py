"""Well Bottom Detection."""
import argparse
import asyncio

from opentrons.config.types import LiquidProbeSettings, OutputOptions

from hardware_testing.opentrons_api.types import OT3Mount, Point, InstrumentProbeType
from hardware_testing.opentrons_api import helpers_ot3


LABWARE = "armadillo_96_wellplate_200ul_pcr_full_skirt"

SLOT_TIP_RACK = 8
SLOT_LABWARE = 2
SLOT_CORNING = 3

SPEED_IN_WELL = 60.0


async def _main(
    is_simulating: bool,
    mount: OT3Mount,
    pipette: int,
    tip: int,
    volume: float,
    trials: int,
    mm_from_bottom: float,
    threshold: float,
) -> None:
    tip_a1_pos = helpers_ot3.get_theoretical_a1_position(
        SLOT_TIP_RACK, f"opentrons_flex_96_tiprack_{tip}ul"
    )
    plate_a1_pos = helpers_ot3.get_theoretical_a1_position(SLOT_TIP_RACK, LABWARE)
    corning_a1_pos = helpers_ot3.get_theoretical_a1_position(
        SLOT_CORNING, "corning_96_wellplate_360ul_flat"
    )
    lps = LiquidProbeSettings(
        starting_mount_height=plate_a1_pos.z,
        max_z_distance=20,
        mount_speed=5.0,
        plunger_speed=0.001,
        sensor_threshold_pascals=threshold,
        output_option=OutputOptions.sync_only,
        aspirate_while_sensing=False,
        data_files=None,
    )
    xy_offsets_per_trial = [
        Point(x=9 * col, y=-9 * row, z=0) for col in range(12) for row in range(8)
    ][:trials]

    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=is_simulating,
        pipette_left=f"p{pipette}_single_v3.5",  # just try 1ch for now, keep is simple
        pipette_right=f"p{pipette}_single_v3.5",
    )
    await api.home()

    for xy_offset in xy_offsets_per_trial:
        trial_tip_pos = tip_a1_pos + xy_offset
        trial_plate_pos = plate_a1_pos + xy_offset
        trial_corning_pos = corning_a1_pos + xy_offset

        # pick up a tip
        print("picking up tip")
        await helpers_ot3.move_to_arched_ot3(api, mount, trial_tip_pos)
        await api.pick_up_tip(mount, helpers_ot3.get_default_tip_length(tip))
        await api.move_to(mount, trial_tip_pos + Point(z=10))

        # move to over the well
        print("moving to plate")
        await helpers_ot3.move_to_arched_ot3(api, mount, trial_plate_pos)

        # probe down until we hit the well's bottom
        print("probing to hit well bottom")
        await api.liquid_probe(mount, lps, InstrumentProbeType.PRIMARY)

        # move up some distance and aspirate
        print(f"moving up {mm_from_bottom} mm from bottom:")
        await api.move_rel(mount, Point(z=mm_from_bottom), speed=SPEED_IN_WELL)
        print(f"aspirating {volume} uL")
        await api.aspirate(mount, volume)
        await api.move_to(mount, trial_plate_pos, speed=SPEED_IN_WELL)
        await api.move_to(mount, trial_plate_pos + Point(z=10))

        # move to the destination plate, and dispense
        print(f"dispensing into corning plate")
        await helpers_ot3.move_to_arched_ot3(api, mount, trial_corning_pos)
        await api.move_rel(mount, Point(z=-6), speed=SPEED_IN_WELL)  # i just know
        await api.dispense(mount, push_out=7)
        await api.move_to(mount, trial_corning_pos, speed=SPEED_IN_WELL)
        await api.move_to(mount, trial_corning_pos + Point(z=10))

        # return the tip
        print("returning tip to tip-rack")
        await helpers_ot3.move_to_arched_ot3(api, mount, trial_tip_pos)
        await api.move_rel(mount, Point(z=-20))
        await api.drop_tip(mount)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--mount", type=str, choices=["left", "right"], required=True)
    parser.add_argument("--pipette", type=int, choices=[50, 1000], required=True)
    parser.add_argument("--tip", type=int, choices=[50, 200, 1000], required=True)
    parser.add_argument("--volume", type=float, required=True)
    parser.add_argument("--trials", type=int, default=1)
    parser.add_argument("--mm-from-bottom", type=float, default=0.25)
    parser.add_argument("--threshold", type=float, default=10.0)
    args = parser.parse_args()
    assert 0 < args.trials <= 96
    assert 0.0 < args.volume <= float(args.pipette)
    assert args.tip <= args.pipette
    assert 0.0 < args.mm_from_bottom < 20.0
    assert 0.0 < args.threshold
    _mount = OT3Mount.LEFT if args.mount == "left" else OT3Mount.RIGHT
    asyncio.run(
        _main(
            args.simulate,
            _mount,
            args.pipette,
            args.tip,
            args.volume,
            args.trials,
            args.mm_from_bottom,
            args.threshold,
        )
    )
