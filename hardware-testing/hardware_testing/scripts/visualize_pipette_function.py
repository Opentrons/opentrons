"""Visualize Pipette Function."""
import argparse
import asyncio
from copy import deepcopy
from math import pi as PI
from pathlib import Path

try:
    import matplotlib.pyplot as plt  # type: ignore[import]
except ModuleNotFoundError:
    raise RuntimeError(
        "Do NOT run this script on a robot. Please install matplotlib on this computer."
    )
from typing import List, cast, Dict, Tuple

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
from opentrons.hardware_control.instruments.ot3.pipette import Pipette
from opentrons.hardware_control.instruments.ot3.instrument_calibration import (
    PipetteOffsetByPipetteMount,
)
from opentrons_shared_data.pipette.load_data import load_serial_lookup_table
from opentrons_shared_data.pipette.types import PipetteModel


MAJOR_REVS = [
    "p1000_96_v3.",
    "p1000_multi_v3.",
    "p1000_single_v3.",
    "p50_multi_v3.",
    "p50_single_v3.",
]


def _gather_models(model_includes: List[str] = []) -> List[str]:
    cfg = load_serial_lookup_table()
    found_pips = []
    for serial_abbrev, model in cfg.items():
        found_model = bool(sum([1 for m in model_includes if m in model]) > 0)
        if not model_includes or found_model:
            found_pips.append(model)
    found_pips.sort()
    return found_pips


def _user_select_model(models: List[str]) -> str:
    print("Select model by number:")
    for i, mod in enumerate(models):
        print(f"\t{i + 1} -\t{mod}")
    model_idx = int(input("Enter number next to desired model: ")) - 1
    return models[model_idx]


def _get_plunger_displacement_at_volume(pipette: Pipette, volume: float) -> float:
    distance = volume / pipette.ul_per_mm(volume, "dispense")
    if "gen3" in pipette.name or "flex" in pipette.name or "96" in pipette.name:
        if "1000" in pipette.name:
            diameter = 4.5
        elif "50" in pipette.name:
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
        raise ValueError(f"Unexpected pipette: {pipette.model}, {pipette.name}")
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


def _plot_table(model: str, tip_volume: int, table: List[List[float]]) -> None:
    plt.suptitle(f"{model} w/ {tip_volume} uL Tip")
    plt.plot(*table)
    ax = plt.gca()
    ax.set_xlim([min(table[0]), max(table[0])])  # type: ignore[arg-type]
    ax.set_ylim([min(table[1]), max(table[1])])  # type: ignore[arg-type]
    plt.show()


def _find_errors(model: str, tip_volume: int, table: List[List[float]]) -> List[str]:
    input_list = table[0]
    output_list = table[1]
    assert len(input_list) == len(output_list)

    def _tot_vol_at_sample(index: int) -> float:
        return input_list[index] + output_list[index]

    errors: List[str] = []
    for i in range(1, len(input_list)):
        prev_vol = _tot_vol_at_sample(i - 1)
        vol = _tot_vol_at_sample(i)
        if prev_vol > vol:
            error_msg = (
                f"[{model} w/ {tip_volume} ul Tip] "
                f"Error at input volume {round(input_list[i], 3)} "
                f"({round(prev_vol, 3)} > {round(vol, 3)})"
            )
            errors.append(error_msg)
    return errors


def _print_errors(errors: List[str]) -> None:
    if len(errors):
        print("-------\nERRORS:\n-------")
        for i, error in enumerate(errors):
            print(f"{i + 1}) {error}")


def _get_possible_tip_volumes_for_model(model_or_rev: str) -> List[int]:
    if "1000" in model_or_rev:
        return [50, 200, 1000]
    else:
        return [50]


def _generate_table_for_model(
    model: str, tip_volume: int, length: int
) -> List[List[float]]:
    pipette_model = pipette_load_name.convert_pipette_model(cast(PipetteModel, model))
    configurations = mutable_configurations.load_with_mutable_configurations(
        pipette_model, Path("fake/path"), "testiId"
    )
    pip_cal_obj = PipetteOffsetByPipetteMount(
        offset=Point(*default_pipette_offset()),
        source=SourceType.default,
        status=CalibrationStatus(),
    )
    pipette = Pipette(config=configurations, pipette_offset_cal=pip_cal_obj)
    pipette.set_tip_type_by_volume(tip_volume)
    table = _get_accuracy_adjustment_table(pipette, length)
    return table


def _plot_tables_per_tip(
    model: str, tables_per_tip: Dict[int, List[List[float]]]
) -> None:
    for tip_vol, table in tables_per_tip.items():
        _plot_table(model, tip_vol, table)


def _gather_tables_per_tip(
    model: str, length: int
) -> Tuple[Dict[int, List[List[float]]], List[str]]:
    possible_tip_volumes = _get_possible_tip_volumes_for_model(model)
    tables_per_tip: Dict[int, List[List[float]]] = {
        tip_vol: _generate_table_for_model(model, tip_vol, length)
        for tip_vol in possible_tip_volumes
    }
    errors: List[str] = []
    for tip_vol, table in tables_per_tip.items():
        errors += _find_errors(model, tip_vol, table)
    return tables_per_tip, errors


async def _main(length: int, plot: bool = False) -> None:
    models = _gather_models(["v3.5", "v3.6", "v3.7", "v3.8", "v3.9"])
    print(f"-------\nMODELS:\n-------")
    for m in models:
        print(m)
    if plot:
        while True:
            model = _user_select_model(models)
            tables_per_tip, errors = _gather_tables_per_tip(model, length)
            _plot_tables_per_tip(model, tables_per_tip)
            _print_errors(errors)
    else:
        all_errors: List[str] = []
        tables_per_tip_per_rev: Dict[str, List[Dict[int, List[List[float]]]]] = {
            rev: [] for rev in MAJOR_REVS
        }
        for model in models:
            tables_per_tip, errors = _gather_tables_per_tip(model, length)
            all_errors += errors
            for rev in MAJOR_REVS:
                if rev in model:
                    tables_per_tip_per_rev[rev].append(tables_per_tip)
                    break
        print("-----------------\nCOMPARE REVISIONS:\n-----------------")
        tables_per_tip_per_rev_only_multiple = deepcopy(tables_per_tip_per_rev)
        for rev, minor_rev_tables_per_tip in tables_per_tip_per_rev.items():
            if len(minor_rev_tables_per_tip) == 1:
                print(f"major-rev {rev} only have 1x minor-rev")
                del tables_per_tip_per_rev_only_multiple[rev]
        target_results: Dict[str, Dict[int, List[float]]] = {}
        percent_d_results: Dict[str, Dict[int, List[float]]] = {}
        for rev, list_of_tables_per_tip in tables_per_tip_per_rev_only_multiple.items():
            tip_volumes = _get_possible_tip_volumes_for_model(rev)
            targets_per_tip: Dict[int, List[float]] = {
                tip_vol: [] for tip_vol in tip_volumes
            }
            adj_range_per_tip: Dict[int, List[float]] = {
                tip_vol: [] for tip_vol in tip_volumes
            }
            adjustments_per_tip: Dict[int, List[List[float]]] = {
                tip_vol: [] for tip_vol in tip_volumes
            }
            for table_per_tip in list_of_tables_per_tip:
                for tip, table in table_per_tip.items():
                    only_targets: List[float] = table[0]
                    only_adjustments: List[float] = table[1]
                    adjustments_per_tip[tip].append(only_adjustments)
                    targets_per_tip[tip] = only_targets
            target_results[rev] = targets_per_tip
            for tip_vol in tip_volumes:
                for i in range(length):
                    adjs_at_this_vol = [
                        minor_rev_adjustment_for_this_tip[i]
                        for minor_rev_adjustment_for_this_tip in adjustments_per_tip[
                            tip_vol
                        ]
                    ]
                    min_adj_at_this_vol = min(adjs_at_this_vol)
                    max_adj_at_this_vol = max(adjs_at_this_vol)
                    range_adj_at_this_vol = max_adj_at_this_vol - min_adj_at_this_vol
                    adj_range_per_tip[tip_vol].append(range_adj_at_this_vol)
            percent_d_results[rev] = {
                tip_vol: [
                    adj / (target + 0.00001)  # hack to avoid non-zero division
                    for target, adj in zip(
                        targets_per_tip[tip_vol], adj_range_per_tip[tip_vol]
                    )
                ]
                for tip_vol in tip_volumes
            }
        csv_rows: List[str] = ["" for _ in range(length + 2)]
        for rev in percent_d_results.keys():
            for tip_vol in percent_d_results[rev].keys():
                csv_rows[0] += f"{rev}\t\t"
                csv_rows[1] += f"{tip_vol}\t\t"
                num_targets = 0
                for i in range(length):
                    target = target_results[rev][tip_vol][i]
                    if target == 0:
                        continue
                    num_targets += 1
                    percent_d = percent_d_results[rev][tip_vol][i]
                    csv_rows[
                        1 + num_targets
                    ] += f"{round(target, 2)}\t{round(percent_d, 4)}\t"
        csv_str = "\n".join(csv_rows)
        print(csv_str)
        _print_errors(all_errors)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--length", type=int, default=100)
    parser.add_argument("--plot", action="store_true")
    args = parser.parse_args()
    asyncio.run(_main(args.length, args.plot))
