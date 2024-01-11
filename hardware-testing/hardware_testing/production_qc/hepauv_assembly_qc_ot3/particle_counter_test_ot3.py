import argparse
from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing.opentrons_api.types import (
    OT3Mount,
    Point,
    Axis,
)
async def _main() -> None:
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=False,
        # pipette_left="p1000_single_v3.4",
        pipette_right="p1000_multi_v3.4",
    )
    # home and move to attach position
    await api.home([Axis.X, Axis.Y, Axis.Z_L, Axis.Z_R])
    attach_pos = helpers_ot3.get_slot_calibration_square_position_ot3(5)
    current_pos = await api.gantry_position(OT3Mount.RIGHT)
    await api.move_to(OT3Mount.RIGHT, attach_pos._replace(z=current_pos.z))
    

if __name__ == "__main__":
    arg_parser = argparse.ArgumentParser(description="OT-3 HEPA/UV Assembly QC Test")
    arg_parser.add_argument("--operator", type=str, default=None)
    arg_parser.add_argument("--part_number", type=str, default=None)
    args = arg_parser.parse_args()
    if args.operator:
        operator = args.operator
    elif not args.simulate:
        operator = input("OPERATOR name:").strip()
    else:
        operator = "simulation"