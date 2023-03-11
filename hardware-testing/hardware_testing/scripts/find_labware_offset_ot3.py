"""Find labware offset."""
import argparse
import asyncio

from hardware_testing.opentrons_api import types
from hardware_testing.opentrons_api import helpers_ot3


async def _main(
    is_simulating: bool,
    mount: types.OT3Mount,
    slot: int,
    labware: str,
    tiprack_slot: int,
) -> None:
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=is_simulating, pipette_left="1000_single_v3.3"
    )
    expected_pos = helpers_ot3.get_theoretical_a1_position(slot, labware)
    print(labware)
    print(f"expected A1 position in slot #{slot}: {expected_pos}")
    print("homing...")
    await api.home()
    home_pos = await api.gantry_position(mount)
    print(f"moving to tiprack in slot {tiprack_slot}")
    tiprack_pos = helpers_ot3.get_theoretical_a1_position(
        tiprack_slot, "opentrons_ot3_96_tiprack_50ul"
    )
    await helpers_ot3.move_to_arched_ot3(api, mount, tiprack_pos)
    await helpers_ot3.jog_mount_ot3(api, mount)
    tiprack_pos = await api.gantry_position(mount)
    await api.pick_up_tip(mount, helpers_ot3.get_default_tip_length(50))
    await helpers_ot3.move_to_arched_ot3(api, mount, expected_pos)
    await helpers_ot3.jog_mount_ot3(api, mount)
    actual_pos = await api.gantry_position(mount)
    offset = actual_pos + (expected_pos * -1.0)
    print(f"found offset: {offset}")
    await helpers_ot3.move_to_arched_ot3(api, mount, tiprack_pos)
    await api.drop_tip(mount)
    await helpers_ot3.move_to_arched_ot3(api, mount, home_pos)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--mount", type=str, choices=["left", "right"], required=True)
    parser.add_argument("--slot", type=int, required=True)
    parser.add_argument("--labware", type=str, required=True)
    parser.add_argument("--tiprack-slot", type=int, required=True)
    args = parser.parse_args()
    if args.mount == "left":
        _mount = types.OT3Mount.LEFT
    else:
        _mount = types.OT3Mount.RIGHT
    asyncio.run(
        _main(args.simulate, _mount, args.slot, args.labware, args.tiprack_slot)
    )
