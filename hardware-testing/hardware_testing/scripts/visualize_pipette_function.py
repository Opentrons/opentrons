"""Visualize Pipette Function."""
import argparse
import asyncio
from math import pi as PI
from typing import Optional
from pathlib import Path

try:
    import matplotlib.pyplot as plt  # type: ignore[import]
except ModuleNotFoundError:
    raise RuntimeError(
        "Do NOT run this script on a robot. Please install matplotlib on this computer."
    )
from typing import List, cast

from opentrons.types import Point
from opentrons.calibration_storage.types import (
    SourceType,
    CalibrationStatus,
)
from opentrons.config.robot_configs import default_pipette_offset
from opentrons_shared_data.pipette import (
    pipette_load_name_conversions as pipette_load_name,
    mutable_configurations,
)

# TODO (lc 10-27-2022) This should be changed to an ot3 pipette object once we
# have that well defined.
from opentrons.hardware_control.instruments.ot2.pipette import Pipette
from opentrons.hardware_control.instruments.ot2.instrument_calibration import (
    PipetteOffsetByPipetteMount,
)
from opentrons_shared_data.pipette import model_config
from opentrons_shared_data.pipette.dev_types import PipetteModel


def _user_select_model(model_includes: Optional[str] = None) -> str:
    cfg = model_config()["config"]
    found_pips = []
    for model, pip in cfg.items():
        if not model_includes or model_includes in pip["name"]:
            found_pips.append(model)
    found_pips.sort()
    print("Select model by number:")
    for i, mod in enumerate(found_pips):
        print(f"\t{i + 1} -\t{mod}")
    model_idx = int(input("Enter number next to desired model: ")) - 1
    return found_pips[model_idx]


def _get_plunger_displacement_at_volume(pipette: Pipette, volume: float) -> float:
    distance = volume / pipette.ul_per_mm(volume, "dispense")
    if "gen3" in pipette.name:
        if pipette.working_volume == 1000:
            diameter = 4.5
        elif pipette.working_volume == 50:
            diameter = 1.0
        else:
            raise ValueError(f"Unexpected pipette: {pipette.model}")
    elif "gen2" in pipette.name:
        if pipette.working_volume == 1000:
            diameter = 6.0
        elif pipette.working_volume == 300:
            diameter = 3.5
        elif pipette.working_volume == 20:
            diameter = 1.0
        else:
            raise ValueError(f"Unexpected pipette: {pipette.model}")
    else:
        raise ValueError(f"Unexpected pipette: {pipette.model}")
    cross_section_area = PI * ((diameter / 2) ** 2)
    return cross_section_area * distance


def _get_accuracy_adjustment_table(pipette: Pipette, length: int) -> List[List[float]]:
    _max_vol = pipette.working_volume + 1
    _step_size_ul = _max_vol / float(length)

    def _vol_at_step(step: int) -> float:
        return float(step) * _step_size_ul

    _ret: List[List[float]] = [[], []]
    for i in range(length):
        _ul = _vol_at_step(i)
        _plunger_displaced_ul = _get_plunger_displacement_at_volume(pipette, _ul)
        _ret[0].append(_ul)
        _ret[1].append(_plunger_displaced_ul - _ul)
    return _ret


def _plot_table(model: str, table: List[List[float]]) -> None:
    plt.suptitle(model)
    plt.plot(*table)
    ax = plt.gca()
    ax.set_xlim([min(table[0]), max(table[0])])
    ax.set_ylim([min(table[1]), max(table[1])])
    plt.show()


def _print_errors(table: List[List[float]]) -> None:
    input_list = table[0]
    output_list = table[1]
    assert len(input_list) == len(output_list)

    def _tot_vol_at_sample(index: int) -> float:
        return input_list[index] + output_list[index]

    num_error = 0
    for i in range(1, len(input_list)):
        prev_vol = _tot_vol_at_sample(i - 1)
        vol = _tot_vol_at_sample(i)
        if prev_vol > vol:
            num_error += 1
            print(
                f"{num_error}) Error at input volume {round(input_list[i], 3)} "
                f"({round(prev_vol, 3)} > {round(vol, 3)})"
            )
    if num_error:
        input("\nReview the errors above, ENTER to continue:")


async def _main(length: int) -> None:
    while True:
        model = _user_select_model()
        pipette_model = pipette_load_name.convert_pipette_model(
            cast(PipetteModel, model)
        )
        configurations = mutable_configurations.load_with_mutable_configurations(
            pipette_model, Path("fake/path"), "testiId"
        )
        pip_cal_obj = PipetteOffsetByPipetteMount(
            offset=Point(*default_pipette_offset()),
            source=SourceType.default,
            status=CalibrationStatus(),
        )
        pipette = Pipette(config=configurations, pipette_offset_cal=pip_cal_obj)
        table = _get_accuracy_adjustment_table(pipette, length)
        _print_errors(table)
        _plot_table(model, table)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--length", type=int, default=1000)
    args = parser.parse_args()
    asyncio.run(_main(args.length))
