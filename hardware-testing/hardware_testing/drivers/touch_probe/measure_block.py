"""Measure calibration block."""
import argparse
import asyncio
from hardware_testing.opentrons_api import helpers_ot3
from opentrons.hardware_control.types import OT3Mount, Axis
from hardware_testing.drivers.touch_probe import TouchProbe, ProbeConfig

# ============================================================================
# Main Function
# ============================================================================


async def _main(simulating: bool, mount: OT3Mount, slot: int) -> None:
    config = ProbeConfig()
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=simulating, use_defaults=True
    )
    await api.home()
    await api.cache_instruments()
    tp = TouchProbe(api, mount, config)
    # probe for deck surface
    deck_pos = await tp.get_deck_z(slot + 1)
    print(f"z deck pos: {deck_pos.z}")
    await tp.search_hole_and_center(deck_pos)

    dimensions = await tp.calibrate_labware(slot, deck_pos)
    if not dimensions:
        print("Calibration failed.")
        return

    # Print final dimensions using dataclass properties
    print("\nFinal Dimensions:")
    print(f"  Width:  {dimensions.width:.3f} mm")
    print(f"  Length: {dimensions.length:.3f} mm")
    print(f"  Height: {dimensions.height:.3f} mm")
    await asyncio.sleep(0.5)
    await api.home([Axis.Z, Axis.X, Axis.Y])
    return


if __name__ == "__main__":
    print("\nTouch Probe Test\n")
    arg_parser = argparse.ArgumentParser(description="Touch Probe Test")
    arg_parser.add_argument("--simulate", action="store_true")
    arg_parser.add_argument("--slot", type=int, default=5)
    args = arg_parser.parse_args()
    mount = OT3Mount.LEFT
    asyncio.run(_main(args.simulate, mount, args.slot))
