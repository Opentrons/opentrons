"""Proof of concept for use of touch probe."""
import argparse
import asyncio
from hardware_testing.opentrons_api import helpers_ot3
from opentrons.hardware_control.types import OT3Mount, Axis
from opentrons.types import Point
from hardware_testing.drivers.touch_probe import TouchProbe, ProbeConfig

# ============================================================================
# Main Function
# ============================================================================


async def _main(simulating: bool, mount: OT3Mount, num_wells: int, slot: int) -> None:
    config = ProbeConfig()
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=simulating, use_defaults=True
    )
    await api.home()
    await api.cache_instruments()
    tp = TouchProbe(api, mount, config)
    # probe deck surface
    print(f"\nProbing slot center #{6}")
    deck_pos = await tp.get_deck_z(6)
    print(f"z deck pos: {deck_pos.z}")
    deck_square_center_radius = await tp.search_hole_and_center(deck_pos)
    if deck_square_center_radius:
        deck_square_center, deck_square_radius = deck_square_center_radius
        print(
            f"Deck square center: {deck_square_center} length: {deck_square_radius * 2}"
        )

    # probe gauge block
    print(f"\nProbing Gauge Block on slot #{7}")
    block_dims = await tp.calibrate_labware(7, deck_pos)
    if not block_dims:
        print("Calibration failed.")
        return

    print("\nCalibration Block Dimensions:")
    print(f"  Width:  {block_dims.width:.3f} mm")
    print(f"  Length: {block_dims.length:.3f} mm")
    print(f"  Height: {block_dims.height:.3f} mm")

    # probe module
    print(f"\nProbing Module on slot #{4}")
    module_pos = await tp.get_deck_z(4)
    print(f"z module pos: {module_pos.z}")
    await tp.search_hole_and_center(module_pos)

    # Probe labware
    print(f"\nStarting Calibration on slot #{slot}")
    dimensions = await tp.calibrate_labware(slot, deck_pos)
    if not dimensions:
        print("Calibration failed.")
        return

    dimensions.set_num_wells(num_wells)

    # calculate A1 pos
    first_well_xy = Point(
        x=dimensions.x_min.x + dimensions.x_offset,
        y=dimensions.y_max.y - dimensions.y_offset,
        z=dimensions.z_max.z,
    )

    # Detecting A1 + center
    well_center_and_radius = await tp.search_hole_and_center(first_well_xy)
    if well_center_and_radius:
        well_center, dimensions.radius = well_center_and_radius
        brim_z = await tp.get_brim_height(well_center, dimensions.radius)
        if brim_z is not None:
            dimensions.z_max = dimensions.z_max._replace(z=brim_z)
            well_center = well_center._replace(z=brim_z)
            dimensions.well_bottom = await tp.get_bottom(well_center)
        else:
            print("Unable to determine well dimensions.")

    # Print final dimensions using dataclass properties
    print("\nLabware Dimensions:")
    print(f"  Deck Radius: {deck_square_radius:.3f} mm")
    print(f"  Deck Center: {deck_square_center} mm")
    print(f"  Width:  {dimensions.width:.3f} mm")
    print(f"  Length: {dimensions.length:.3f} mm")
    print(f"  Height: {dimensions.height:.3f} mm")
    print(f"  Depth: {dimensions.depth:.3f} mm")
    print(f"  Bottom Offset: {dimensions.bottom_offset:.3f} mm")
    print(f"  Well Radius: {dimensions.radius:.3f} mm")
    print(f"  Well Center: {well_center} mm")
    print(f"  radius: {dimensions.radius} mm")
    print(f"  spacing: {dimensions.spacing}")
    await asyncio.sleep(3.0)
    await api.home([Axis.Z, Axis.X, Axis.Y])
    return


if __name__ == "__main__":
    print("\nTouch Probe Test\n")
    arg_parser = argparse.ArgumentParser(description="Touch Probe Test")
    arg_parser.add_argument("--simulate", action="store_true")
    arg_parser.add_argument("--num_wells", type=int, default=96)
    arg_parser.add_argument("--slot", type=int, default=5)
    args = arg_parser.parse_args()
    mount = OT3Mount.LEFT
    asyncio.run(_main(args.simulate, mount, args.num_wells, args.slot))
