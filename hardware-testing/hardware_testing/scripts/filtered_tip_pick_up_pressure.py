"""Filtered Tip Pick-Up Pressure."""
import argparse
import asyncio

from hardware_testing.opentrons_api import types
from hardware_testing.opentrons_api import helpers_ot3

TIP_VOLUME = 50  # 50, 200, or 1000
TIP_RACK_SLOT = 6
TIP_TO_PICKUP_PER_NOZZLE = {
    "A1": [f"H{c + 1}" for c in range(12)],
    "H1": [f"A{c + 1}" for c in range(12)],
}

RETRACT_MM = 10


def _get_tip_rel_location(name: str) -> types.Point:
    column = float(name[1:]) - 1
    row = float("ABCDEFGH".index(name[0]))
    tip_a1 = helpers_ot3.get_theoretical_a1_position(
        TIP_RACK_SLOT, f"opentrons_flex_96_filtertiprack_{TIP_VOLUME}ul"
    )
    return tip_a1 + types.Point(x=column * 9.0, y=row * -9.0)


async def _main(is_simulating: bool) -> None:
    mount = types.OT3Mount.LEFT
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=is_simulating, pipette_left="p1000_multi_v3.5"
    )
    print("homing")
    await api.home()
    total_trial_count = len(
        [t for tip_list in TIP_TO_PICKUP_PER_NOZZLE.values() for t in tip_list]
    )
    trial_counter = 0
    for nozzle, tip_name_list in TIP_TO_PICKUP_PER_NOZZLE.items():
        await api.update_nozzle_configuration_for_mount(mount, nozzle, nozzle, nozzle)
        for tip_name in tip_name_list:
            trial_counter += 1
            _trial_msg = f"{tip_name} ({trial_counter}/{total_trial_count})"
            tip_loc = _get_tip_rel_location(tip_name)
            print(f"[nozzle={nozzle}] moving to: {_trial_msg}")
            await helpers_ot3.move_to_arched_ot3(api, mount, tip_loc)
            print(f"[nozzle={nozzle}] picking up: {_trial_msg}")
            await api.pick_up_tip(
                mount, tip_length=helpers_ot3.get_default_tip_length(TIP_VOLUME)
            )
            print(f"[nozzle={nozzle}] retracting: {_trial_msg}")
            await api.move_rel(mount, types.Point(z=RETRACT_MM))
            print(f"[nozzle={nozzle}] dropping: {_trial_msg}")
            await api.drop_tip(mount)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    args = parser.parse_args()
    asyncio.run(_main(args.simulate))
