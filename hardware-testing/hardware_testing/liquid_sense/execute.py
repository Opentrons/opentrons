"""Logic for running a single liquid probe test."""
from typing import Dict, Any, List, Tuple, Optional
from .report import store_tip_results, store_trial
from opentrons.config.types import LiquidProbeSettings
from .__main__ import RunArgs
from hardware_testing.gravimetric.workarounds import get_sync_hw_api
from hardware_testing.gravimetric.helpers import _calculate_stats
from hardware_testing.gravimetric.config import LIQUID_PROBE_SETTINGS
from hardware_testing.gravimetric.tips import get_unused_tips
from hardware_testing.data import ui, get_testing_data_directory
from opentrons.hardware_control.types import InstrumentProbeType, OT3Mount, Axis

from hardware_testing.gravimetric.measurement.scale import Scale

from hardware_testing.gravimetric.measurement.record import GravimetricRecorder
from opentrons.protocol_api._types import OffDeckType

from opentrons.protocol_api import ProtocolContext, Well, Labware


def _load_tipracks(
    ctx: ProtocolContext, pipette_channels: int, protocol_cfg: Any, tip: int
) -> List[Labware]:
    # TODO add logic here for partial tip using 96
    use_adapters: bool = pipette_channels == 96
    tiprack_load_settings: List[Tuple[int, str]] = [
        (
            slot,
            f"opentrons_flex_96_tiprack_{tip}ul",
        )
        for slot in protocol_cfg.SLOTS_TIPRACK[tip]  # type: ignore[attr-defined]
    ]
    for ls in tiprack_load_settings:
        ui.print_info(f'Loading tiprack "{ls[1]}" in slot #{ls[0]}')

    adapter: Optional[str] = (
        "opentrons_flex_96_tiprack_adapter" if use_adapters else None
    )
    # If running multiple tests in one run, the labware may already be loaded
    loaded_labwares = ctx.loaded_labwares
    print(f"Loaded labwares {loaded_labwares}")
    pre_loaded_tips: List[Labware] = []
    for ls in tiprack_load_settings:
        if ls[0] in loaded_labwares.keys():
            if loaded_labwares[ls[0]].name == ls[1]:
                pre_loaded_tips.append(loaded_labwares[ls[0]])
            else:
                # If something is in the slot that's not what we want, remove it
                # we use this only for the 96 channel
                ui.print_info(
                    f"Removing {loaded_labwares[ls[0]].name} from slot {ls[0]}"
                )
                ctx._core.move_labware(
                    loaded_labwares[ls[0]]._core,
                    new_location=OffDeckType.OFF_DECK,
                    use_gripper=False,
                    pause_for_manual_move=False,
                    pick_up_offset=None,
                    drop_offset=None,
                )
    if len(pre_loaded_tips) == len(tiprack_load_settings):
        return pre_loaded_tips

    tipracks: List[Labware] = []
    for ls in tiprack_load_settings:
        if ctx.deck[ls[0]] is not None:
            tipracks.append(
                ctx.deck[ls[0]].load_labware(ls[1])  # type: ignore[union-attr]
            )
        else:
            tipracks.append(ctx.load_labware(ls[1], location=ls[0], adapter=adapter))
    return tipracks


def _load_test_well(run_args: RunArgs) -> Labware:
    slot_scale = run_args.protocol_cfg.SLOT_SCALE  # type: ignore[union-attr]
    labware_on_scale = run_args.protocol_cfg.LABWARE_ON_SCALE  # type: ignore[union-attr]
    ui.print_info(f'Loading labware on scale: "{labware_on_scale}"')
    if labware_on_scale == "radwag_pipette_calibration_vial":
        namespace = "custom_beta"
    else:
        namespace = "opentrons"
    # If running multiple tests in one run, the labware may already be loaded
    loaded_labwares = run_args.ctx.loaded_labwares
    if (
        slot_scale in loaded_labwares.keys()
        and loaded_labwares[slot_scale].name == labware_on_scale
    ):
        return loaded_labwares[slot_scale]

    labware_on_scale = run_args.ctx.load_labware(
        labware_on_scale, location=slot_scale, namespace=namespace
    )
    return labware_on_scale

def _load_scale(
    name: str,
    scale: Scale,
    run_id: str,
    pipette_tag: str,
    start_time: float,
    simulating: bool,
) -> GravimetricRecorder:
    ui.print_header("LOAD SCALE")
    ui.print_info(
        "Some Radwag settings cannot be controlled remotely.\n"
        "Listed below are the things the must be done using the touchscreen:\n"
        "  1) Set profile to USER\n"
        "  2) Set screensaver to NONE\n"
    )
    recorder = GravimetricRecorder(
        GravimetricRecorderConfig(
            test_name=name,
            run_id=run_id,
            tag=pipette_tag,
            start_time=start_time,
            duration=0,
            frequency=1000 if simulating else 50,
            stable=False,
        ),
        scale,
        simulate=simulating,
    )
    ui.print_info(f'found scale "{recorder.serial_number}"')
    if simulating:
        recorder.set_simulation_mass(0)
    recorder.record(in_thread=True)
    ui.print_info(f'scale is recording to "{recorder.file_name}"')
    return recorder

def run(tip: int, run_args: RunArgs) -> None:
    """Run a liquid probe test."""
    test_labware: Labware = _load_test_well(run_args)
    hw_api = get_sync_hw_api(run_args.ctx)
    test_well: Well = test_labware["A1"]
    _load_tipracks(run_args.ctx, run_args.pipette_channels, run_args.protocol_cfg, tip)
    tips: List[Well] = get_unused_tips(run_args.ctx, tip)
    assert len(tips) >= run_args.trials
    results: List[float] = []
    for trial in range(run_args.trials):
        print(f"Picking up {tip}ul tip")
        run_args.pipette.pick_up_tip(tips.pop(0))
        run_args.pipette.move_to(test_well.top())

        start_pos = hw_api.current_position_ot3(OT3Mount.LEFT)
        print(f"Running liquid probe test with tip {tip}")
        height = _run_trial(run_args, tip, test_well, trial)
        end_pos = hw_api.current_position_ot3(OT3Mount.LEFT)
        print("Droping tip")
        run_args.pipette.blow_out()
        if run_args.return_tip:
            run_args.pipette.return_tip()
        else:
            run_args.pipette.drop_tip()
        results.append(height)
        env_data = run_args.environment_sensor.get_reading()
        store_trial(
            run_args.test_report,
            trial,
            tip,
            height,
            end_pos[Axis.P_L],
            env_data.relative_humidity,
            env_data.temperature,
            start_pos[Axis.Z_L] - end_pos[Axis.Z_L],
            start_pos[Axis.P_L] - end_pos[Axis.P_L],
        )
        print(f"\n\nstart pos{start_pos[Axis.Z_L]} end pos {end_pos[Axis.Z_L]}")
        print(f"start pos{start_pos[Axis.P_L]} end pos {end_pos[Axis.P_L]}\n\n")

    # fake this for now
    expected_height = 40.0
    average, cv, d = _calculate_stats(results, expected_height)
    store_tip_results(run_args.test_report, tip, average, cv, d)


def _run_trial(run_args: RunArgs, tip: int, well: Well, trial: int) -> float:
    hw_api = get_sync_hw_api(run_args.ctx)
    lqid_cfg: Dict[str, int] = LIQUID_PROBE_SETTINGS[run_args.pipette_volume][
        run_args.pipette_channels
    ][tip]
    data_dir = get_testing_data_directory()
    data_file = (
        f"{data_dir}/{run_args.name}/{run_args.run_id}/pressure_sensor_data-trial{trial}-tip{tip}.csv"
    )
    ui.print_info(f"logging pressure data to {data_file}")
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
        data_file=data_file,
    )


    hw_mount = OT3Mount.LEFT if run_args.pipette.mount == "left" else OT3Mount.RIGHT
    run_args.recorder.set_sample_tag(f"trial-{trial}-{tip}ul")
    # TODO add in stuff for secondary probe
    height = hw_api.liquid_probe(hw_mount, lps, InstrumentProbeType.PRIMARY)
    run_args.recorder.clear_sample_tag()
    return height
