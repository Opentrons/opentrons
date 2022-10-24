"""Visualize Pipette Function."""
import argparse
import asyncio
from math import pi as PI

from opentrons.hardware_control.instruments.pipette import Pipette

from hardware_testing.opentrons_api.types import OT3Mount
from hardware_testing.opentrons_api.helpers_ot3 import build_async_ot3_hardware_api


def _get_plunger_displacement_at_volume(pipette: Pipette, volume: float) -> float:
    distance = volume / pipette.ul_per_mm(volume, "dispense")
    if pipette.working_volume == 1000:
        diameter = 4.5
    elif pipette.working_volume == 50:
        diameter = 1.0
    else:
        raise ValueError(f"Unexpected pipette: {pipette.model}")
    cross_section_area = PI * ((diameter / 2)**2)
    return cross_section_area * distance


async def _main(is_simulating: bool) -> None:
    api = await build_async_ot3_hardware_api(
        is_simulating=is_simulating,
        pipette_left="p50_single_v4.3",
    )
    assert api.hardware_pipettes[OT3Mount.LEFT.to_mount()], "No pipette on the left!"
    instr = api.hardware_pipettes[OT3Mount.LEFT.to_mount()]
    num_steps = 1000
    step_size_ul = instr.working_volume / float(num_steps)
    prev_volume = 0.0

    def _vol_at_step(step: int) -> float:
        return float(step) * step_size_ul

    def _print_error(step: int) -> None:
        print("Error:")
        for i in range(-1, 2):
            vol = _vol_at_step(step + i)
            disp_vol = _get_plunger_displacement_at_volume(instr, vol)
            print(f"\t{round(vol, 3)},{round(disp_vol, 3)}")

    errors = []
    for step in range(num_steps):
        ul = _vol_at_step(step)
        plunger_dispalaced_ul = _get_plunger_displacement_at_volume(instr, ul)
        print(f"{ul},{plunger_dispalaced_ul}")
        if plunger_dispalaced_ul < prev_volume:
            errors.append(step)
        prev_volume = plunger_dispalaced_ul

    print("******** ERRORS *********")
    for e in errors:
        _print_error(e)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    args = parser.parse_args()
    asyncio.run(_main(args.simulate))
