"""Logic for running a single liquid probe test."""
from typing import Dict
from opentrons.protocol_api import Well
from .report import store_tip_results, store_trial
from opentrons.config.types import LiquidProbeSettings
from .__main__ import RunArgs
from hardware_testing.gravimetric.workarounds import get_sync_hw_api
from hardware_testing.gravimetric.config import LIQUID_PROBE_SETTINGS
from hardware_testing.opentrons_api.types import OT3Mount
from opentrons.hardware_control.types import InstrumentProbeType
from statistics import stdev

def run(tip: int, run_args: RunArgs) -> None:
    """Run a liquid probe test."""
    well: Well = Well()
    results : List[float] = []
    for trial in range(run_args.trials):
        print(f"Running liquid probe test with tip {tip}")
        height = _run_trial(run_args, tip, well, trial)
        results.append(height)
        store_trial(run_args.test_report, trial, tip, height)

    average:float = sum(results) / runargs.trials
    cv: float = stdev(results) / average
    #fake this for now
    expected_height = 40.0
    d: float = (average - expected_height) / expected_height
    store_tip_results(run_args.test_report, tip, average, cv, d)


def _run_trial(run_args: RunArgs, tip: int, well: Well, trial: int) -> float:
    hw_api = get_sync_hw_api(run_args.ctx)
    lqid_cfg: Dict[str, int] = LIQUID_PROBE_SETTINGS[run_args.pipette_volume][
        run_args.pipette_channels
    ][tip]
    lps = LiquidProbeSettings(
        starting_mount_height=well.top().point.z,
        max_z_distance=min(well.depth, lqid_cfg["max_z_distance"]),
        min_z_distance=lqid_cfg["min_z_distance"],
        mount_speed=run_args.z_speed,
        plunger_speed=lqid_cfg["plunger_speed"],
        sensor_threshold_pascals=lqid_cfg["sensor_threshold_pascals"],
        expected_liquid_height=110,
        log_pressure=True,
        aspirate_while_sensing=True,
        auto_zero_sensor=True,
        num_baseline_reads=10,
        data_file="/user_data/testing_data/pressure_sensor_data.csv",
    )
    run_args.pipette.move_to(well.top())

    hw_mount = OT3Mount.LEFT if run_args.pipette.mount == "left" else OT3Mount.RIGHT
    run_args.recorder.set_sample_tag(f"trial-{trial}-{tip}ul")
    # TODO add in stuff for secondary probe
    height = hw_api.liquid_probe(hw_mount, lps, InstrumentProbeType.PRIMARY)
    run_args.recorder.clear_sample_tag()
    return
