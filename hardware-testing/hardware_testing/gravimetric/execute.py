"""Gravimetric."""
from time import sleep
from typing import Optional, Tuple, List, Dict

from opentrons.protocol_api import ProtocolContext, Well, Labware

from hardware_testing.data import ui
from hardware_testing.data.csv_report import CSVReport
from hardware_testing.opentrons_api.types import Point, OT3Mount

from . import report
from . import config
from .helpers import (
    _calculate_stats,
    _get_channel_offset,
    _calculate_average,
    _jog_to_find_liquid_height,
    _apply_labware_offsets,
    _pick_up_tip,
    _drop_tip,
)
from .trial import (
    build_gravimetric_trials,
    GravimetricTrial,
    TestResources,
    _finish_test,
)
from .liquid_class.pipetting import (
    aspirate_with_liquid_class,
    dispense_with_liquid_class,
    PipettingCallbacks,
)
from .liquid_height.height import LiquidTracker
from .measurement import (
    MeasurementData,
    MeasurementType,
    record_measurement_data,
    calculate_change_in_volume,
    create_measurement_tag,
)
from .measurement.environment import get_min_reading, get_max_reading
from .measurement.record import (
    GravimetricRecorder,
    GravimetricRecorderConfig,
)
from .tips import MULTI_CHANNEL_TEST_ORDER


_MEASUREMENTS: List[Tuple[str, MeasurementData]] = list()

_PREV_TRIAL_GRAMS: Optional[MeasurementData] = None

_tip_counter: Dict[int, int] = {}


def _minimum_z_height(cfg: config.GravimetricConfig) -> int:
    if cfg.pipette_channels == 96:
        return 133
    else:
        return 0


def _generate_callbacks_for_trial(
    recorder: GravimetricRecorder,
    volume: Optional[float],
    channel: int,
    trial: int,
    blank_measurement: bool,
) -> PipettingCallbacks:
    # it is useful to tag the scale data by what is physically happening,
    # so we can graph the data and color-code the lines based on these tags.
    # very helpful for debugging and learning more about the system.
    if blank_measurement:
        volume = None
    return PipettingCallbacks(
        on_submerging=lambda: recorder.set_sample_tag(
            create_measurement_tag("submerge", volume, channel, trial)
        ),
        on_mixing=lambda: recorder.set_sample_tag(
            create_measurement_tag("mix", volume, channel, trial)
        ),
        on_aspirating=lambda: recorder.set_sample_tag(
            create_measurement_tag("aspirate", volume, channel, trial)
        ),
        on_retracting=lambda: recorder.set_sample_tag(
            create_measurement_tag("retract", volume, channel, trial)
        ),
        on_dispensing=lambda: recorder.set_sample_tag(
            create_measurement_tag("dispense", volume, channel, trial)
        ),
        on_blowing_out=lambda: recorder.set_sample_tag(
            create_measurement_tag("blowout", volume, channel, trial)
        ),
        on_exiting=recorder.clear_sample_tag,
    )


def _update_environment_first_last_min_max(test_report: report.CSVReport) -> None:
    # update this regularly, because the script may exit early
    env_data_list = [m.environment for tag, m in _MEASUREMENTS]
    first_data = env_data_list[0]
    last_data = env_data_list[-1]
    min_data = get_min_reading(env_data_list)
    max_data = get_max_reading(env_data_list)
    report.store_environment(
        test_report, report.EnvironmentReportState.FIRST, first_data
    )
    report.store_environment(test_report, report.EnvironmentReportState.LAST, last_data)
    report.store_environment(test_report, report.EnvironmentReportState.MIN, min_data)
    report.store_environment(test_report, report.EnvironmentReportState.MAX, max_data)


def _load_labware(ctx: ProtocolContext, cfg: config.GravimetricConfig) -> Labware:
    ui.print_info(f'Loading labware on scale: "{cfg.labware_on_scale}"')
    if cfg.labware_on_scale == "radwag_pipette_calibration_vial":
        namespace = "custom_beta"
    else:
        namespace = "opentrons"
    # If running multiple tests in one run, the labware may already be loaded
    loaded_labwares = ctx.loaded_labwares
    if (
        cfg.slot_scale in loaded_labwares.keys()
        and loaded_labwares[cfg.slot_scale].name == cfg.labware_on_scale
    ):
        return loaded_labwares[cfg.slot_scale]

    labware_on_scale = ctx.load_labware(
        cfg.labware_on_scale, location=cfg.slot_scale, namespace=namespace
    )
    _apply_labware_offsets(cfg, [labware_on_scale])
    return labware_on_scale


def _print_stats(mode: str, average: float, cv: float, d: float) -> None:
    ui.print_info(
        f"{mode}:\n"
        f"\tavg: {round(average, 2)} uL\n"
        f"\tcv: {round(cv * 100.0, 2)}%\n"
        f"\td: {round(d * 100.0, 2)}%"
    )


def _print_final_results(
    volumes: List[float], channel_count: int, test_report: CSVReport
) -> None:
    for vol in volumes:
        ui.print_info(f"  * {vol}ul channel all:")
        for mode in ["aspirate", "dispense"]:
            avg, cv, d = report.get_volume_results_all(test_report, mode, vol)
            ui.print_info(f"    - {mode}:")
            ui.print_info(f"        avg: {avg}ul")
            ui.print_info(f"        cv:  {cv}%")
            ui.print_info(f"        d:   {d}%")
        for channel in range(channel_count):
            ui.print_info(f"  * vol {vol}ul channel {channel + 1}:")
            for mode in ["aspirate", "dispense"]:
                avg, cv, d = report.get_volume_results_per_channel(
                    test_report, mode, vol, channel
                )
                ui.print_info(f"    - {mode}:")
                ui.print_info(f"        avg: {avg}ul")
                ui.print_info(f"        cv:  {cv}%")
                ui.print_info(f"        d:   {d}%")


def _next_tip_for_channel(
    cfg: config.GravimetricConfig,
    resources: TestResources,
    channel: int,
    max_tips: int,
) -> Well:
    _tips_used = sum([tc for tc in _tip_counter.values()])
    if _tips_used >= max_tips:
        if cfg.pipette_channels != 96:
            raise RuntimeError("ran out of tips")
        if not resources.ctx.is_simulating():
            ui.print_title("Reset 96ch Tip Racks")
            ui.get_user_ready(f"ADD {max_tips}x new tip-racks")
        _tip_counter[channel] = 0
    _tip = resources.tips[channel][_tip_counter[channel]]
    _tip_counter[channel] += 1
    return _tip


def _run_trial(
    trial: GravimetricTrial,
) -> Tuple[float, MeasurementData, float, MeasurementData]:
    global _PREV_TRIAL_GRAMS
    pipetting_callbacks = _generate_callbacks_for_trial(
        trial.recorder, trial.volume, trial.channel, trial.trial, trial.blank
    )

    def _tag(m_type: MeasurementType) -> str:
        return create_measurement_tag(
            m_type, None if trial.blank else trial.volume, trial.channel, trial.trial
        )

    def _record_measurement_and_store(m_type: MeasurementType) -> MeasurementData:
        m_tag = _tag(m_type)
        if trial.recorder.is_simulator and not trial.blank:
            if m_type == MeasurementType.ASPIRATE:
                trial.recorder.add_simulation_mass(trial.volume * -0.001)
            elif m_type == MeasurementType.DISPENSE:
                trial.recorder.add_simulation_mass(trial.volume * 0.001)
        m_data = record_measurement_data(
            trial.ctx,
            m_tag,
            trial.recorder,
            trial.pipette.mount,
            trial.stable,
            trial.env_sensor,
            shorten=trial.inspect,
            delay_seconds=trial.scale_delay,
        )
        report.store_measurement(trial.test_report, m_tag, m_data)
        _MEASUREMENTS.append(
            (
                m_tag,
                m_data,
            )
        )
        _update_environment_first_last_min_max(trial.test_report)
        return m_data

    ui.print_info("recorded weights:")

    # RUN INIT
    trial.pipette.move_to(
        trial.well.top(50).move(trial.channel_offset)
    )  # center channel over well
    mnt = OT3Mount.RIGHT if trial.pipette.mount == "right" else OT3Mount.LEFT
    trial.ctx._core.get_hardware().retract(mnt)  # retract to top of gantry
    m_data_init = _record_measurement_and_store(MeasurementType.INIT)
    ui.print_info(f"\tinitial grams: {m_data_init.grams_average} g")
    if _PREV_TRIAL_GRAMS is not None:
        _evaporation_loss_ul = abs(
            calculate_change_in_volume(_PREV_TRIAL_GRAMS, m_data_init)
        )
        ui.print_info(f"{_evaporation_loss_ul} ul evaporated since last trial")
        trial.liquid_tracker.update_affected_wells(
            trial.well, aspirate=_evaporation_loss_ul, channels=1
        )
    _PREV_TRIAL_GRAMS = m_data_init

    # RUN ASPIRATE
    aspirate_with_liquid_class(
        trial.ctx,
        trial.pipette,
        trial.tip_volume,
        trial.volume,
        trial.well,
        trial.channel_offset,
        trial.channel_count,
        trial.liquid_tracker,
        callbacks=pipetting_callbacks,
        blank=trial.blank,
        inspect=trial.inspect,
        mix=trial.mix,
    )
    trial.ctx._core.get_hardware().retract(mnt)  # retract to top of gantry
    m_data_aspirate = _record_measurement_and_store(MeasurementType.ASPIRATE)
    ui.print_info(f"\tgrams after aspirate: {m_data_aspirate.grams_average} g")
    ui.print_info(f"\tcelsius after aspirate: {m_data_aspirate.celsius_pipette} C")

    # RUN DISPENSE
    dispense_with_liquid_class(
        trial.ctx,
        trial.pipette,
        trial.tip_volume,
        trial.volume,
        trial.well,
        trial.channel_offset,
        trial.channel_count,
        trial.liquid_tracker,
        callbacks=pipetting_callbacks,
        blank=trial.blank,
        inspect=trial.inspect,
        mix=trial.mix,
    )
    trial.ctx._core.get_hardware().retract(mnt)  # retract to top of gantry
    m_data_dispense = _record_measurement_and_store(MeasurementType.DISPENSE)
    ui.print_info(f"\tgrams after dispense: {m_data_dispense.grams_average} g")
    # calculate volumes
    volume_aspirate = calculate_change_in_volume(m_data_init, m_data_aspirate)
    volume_dispense = calculate_change_in_volume(m_data_aspirate, m_data_dispense)
    return volume_aspirate, m_data_aspirate, volume_dispense, m_data_dispense


def _get_test_channels(cfg: config.GravimetricConfig) -> List[int]:
    if cfg.pipette_channels == 8 and not cfg.increment:
        # NOTE: only test channels separately when QC'ing a 8ch
        return MULTI_CHANNEL_TEST_ORDER
    else:
        return [0]


def _get_channel_divider(cfg: config.GravimetricConfig) -> float:
    if cfg.pipette_channels == 8 and not cfg.increment:
        return 1.0
    else:
        return float(cfg.pipette_channels)


def build_gm_report(
    cfg: config.GravimetricConfig,
    resources: TestResources,
    recorder: GravimetricRecorder,
) -> report.CSVReport:
    """Build a CSVReport formated for gravimetric tests."""
    ui.print_header("CREATE TEST-REPORT")
    test_report = report.create_csv_test_report(
        resources.test_volumes, cfg, run_id=resources.run_id
    )
    test_report.set_tag(resources.pipette_tag)
    test_report.set_operator(resources.operator_name)
    test_report.set_version(resources.git_description)
    report.store_serial_numbers(
        test_report,
        robot=resources.robot_serial,
        pipette=resources.pipette_tag,
        tips=resources.tip_batch,
        scale=recorder.serial_number,
        environment="None",
        liquid="None",
    )
    return test_report


def _load_scale(
    cfg: config.GravimetricConfig, resources: TestResources
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
            test_name=cfg.name,
            run_id=resources.run_id,
            tag=resources.pipette_tag,
            start_time=resources.start_time,
            duration=0,
            frequency=1000 if resources.ctx.is_simulating() else 5,
            stable=False,
        ),
        simulate=resources.ctx.is_simulating(),
    )
    ui.print_info(f'found scale "{recorder.serial_number}"')
    if resources.ctx.is_simulating():
        start_sim_mass = {50: 15, 200: 200, 1000: 200}
        recorder.set_simulation_mass(start_sim_mass[cfg.tip_volume])
    recorder.record(in_thread=True)
    ui.print_info(f'scale is recording to "{recorder.file_name}"')
    return recorder


def _calculate_evaporation(
    cfg: config.GravimetricConfig,
    resources: TestResources,
    recorder: GravimetricRecorder,
    liquid_tracker: LiquidTracker,
    test_report: report.CSVReport,
    labware_on_scale: Labware,
) -> Tuple[float, float]:
    ui.print_title("MEASURE EVAPORATION")
    blank_trials = build_gravimetric_trials(
        resources.ctx,
        resources.pipette,
        cfg,
        labware_on_scale["A1"],
        [resources.test_volumes[-1]],
        [],
        recorder,
        test_report,
        liquid_tracker,
        True,
        resources.env_sensor,
    )
    ui.print_info(f"running {config.NUM_BLANK_TRIALS}x blank measurements")
    mnt = OT3Mount.RIGHT if resources.pipette.mount == "right" else OT3Mount.LEFT
    resources.ctx._core.get_hardware().retract(mnt)
    for i in range(config.SCALE_SECONDS_TO_TRUE_STABILIZE):
        ui.print_info(
            f"wait for scale to stabilize "
            f"({i + 1}/{config.SCALE_SECONDS_TO_TRUE_STABILIZE})"
        )
        if not resources.ctx.is_simulating():
            sleep(1)
    actual_asp_list_evap: List[float] = []
    actual_disp_list_evap: List[float] = []
    for b_trial in blank_trials[resources.test_volumes[-1]][0]:
        ui.print_header(f"BLANK {b_trial.trial + 1}/{config.NUM_BLANK_TRIALS}")
        evap_aspirate, _, evap_dispense, _ = _run_trial(b_trial)
        ui.print_info(
            f"blank {b_trial.trial + 1}/{config.NUM_BLANK_TRIALS}:\n"
            f"\taspirate: {evap_aspirate} uL\n"
            f"\tdispense: {evap_dispense} uL"
        )
        actual_asp_list_evap.append(evap_aspirate)
        actual_disp_list_evap.append(evap_dispense)
    ui.print_header("EVAPORATION AVERAGE")
    average_aspirate_evaporation_ul = _calculate_average(actual_asp_list_evap)
    average_dispense_evaporation_ul = _calculate_average(actual_disp_list_evap)
    ui.print_info(
        "average:\n"
        f"\taspirate: {average_aspirate_evaporation_ul} uL\n"
        f"\tdispense: {average_dispense_evaporation_ul} uL"
    )
    report.store_average_evaporation(
        test_report,
        average_aspirate_evaporation_ul,
        average_dispense_evaporation_ul,
    )
    return average_aspirate_evaporation_ul, average_dispense_evaporation_ul


def run(cfg: config.GravimetricConfig, resources: TestResources) -> None:
    """Run."""
    global _PREV_TRIAL_GRAMS
    global _MEASUREMENTS
    ui.print_header("LOAD LABWARE")
    labware_on_scale = _load_labware(resources.ctx, cfg)
    liquid_tracker = LiquidTracker(resources.ctx)

    total_tips = len(
        [tip for chnl_tips in resources.tips.values() for tip in chnl_tips]
    )
    channels_to_test = _get_test_channels(cfg)
    for channel in channels_to_test:
        # initialize the global tip counter, per each channel that will be tested
        _tip_counter[channel] = 0
    trial_total = len(resources.test_volumes) * cfg.trials * len(channels_to_test)
    support_tip_resupply = bool(cfg.pipette_channels == 96 and cfg.increment)
    if trial_total > total_tips:
        if not support_tip_resupply:
            raise ValueError(f"more trials ({trial_total}) than tips ({total_tips})")
        elif not resources.ctx.is_simulating():
            ui.get_user_ready(f"prepare {trial_total - total_tips} extra tip-racks")
    recorder = _load_scale(cfg, resources)
    test_report = build_gm_report(cfg, resources, recorder)

    calibration_tip_in_use = True

    if resources.ctx.is_simulating():
        _PREV_TRIAL_GRAMS = None
        _MEASUREMENTS = list()
    try:
        ui.print_title("FIND LIQUID HEIGHT")
        ui.print_info("homing...")
        resources.ctx.home()
        resources.pipette.home_plunger()
        first_tip = resources.tips[0][0]
        setup_channel_offset = _get_channel_offset(cfg, channel=0)
        first_tip_location = first_tip.top().move(setup_channel_offset)
        _pick_up_tip(resources.ctx, resources.pipette, cfg, location=first_tip_location)
        mnt = OT3Mount.LEFT if cfg.pipette_mount == "left" else OT3Mount.RIGHT
        resources.ctx._core.get_hardware().retract(mnt)
        if not resources.ctx.is_simulating():
            ui.get_user_ready("REPLACE first tip with NEW TIP")
            ui.get_user_ready("CLOSE the door, and MOVE AWAY from machine")
        ui.print_info("moving to scale")
        well = labware_on_scale["A1"]
        resources.pipette.move_to(well.top(0), minimum_z_height=_minimum_z_height(cfg))
        _liquid_height = _jog_to_find_liquid_height(
            resources.ctx, resources.pipette, well
        )
        resources.pipette.move_to(well.top().move(Point(0, 0, _minimum_z_height(cfg))))
        height_below_top = well.depth - _liquid_height
        ui.print_info(f"liquid is {height_below_top} mm below top of vial")
        liquid_tracker.set_start_volume_from_liquid_height(
            labware_on_scale["A1"], _liquid_height, name="Water"
        )
        vial_volume = liquid_tracker.get_volume(well)
        ui.print_info(
            f"software thinks there is {vial_volume} uL of liquid in the vial"
        )
        if not cfg.blank or cfg.inspect:
            average_aspirate_evaporation_ul = 0.0
            average_dispense_evaporation_ul = 0.0
        else:
            (
                average_aspirate_evaporation_ul,
                average_dispense_evaporation_ul,
            ) = _calculate_evaporation(
                cfg,
                resources,
                recorder,
                liquid_tracker,
                test_report,
                labware_on_scale,
            )

        ui.print_info("dropping tip")
        _drop_tip(
            resources.pipette, return_tip=False, minimum_z_height=_minimum_z_height(cfg)
        )  # always trash calibration tips
        calibration_tip_in_use = False
        trial_count = 0
        trials = build_gravimetric_trials(
            resources.ctx,
            resources.pipette,
            cfg,
            labware_on_scale["A1"],
            resources.test_volumes,
            channels_to_test,
            recorder,
            test_report,
            liquid_tracker,
            False,
            resources.env_sensor,
        )
        for volume in trials.keys():
            actual_asp_list_all = []
            actual_disp_list_all = []
            ui.print_title(f"{volume} uL")

            trial_asp_dict: Dict[int, List[float]] = {
                trial: [] for trial in range(cfg.trials)
            }
            trial_disp_dict: Dict[int, List[float]] = {
                trial: [] for trial in range(cfg.trials)
            }
            for channel in trials[volume].keys():
                channel_offset = _get_channel_offset(cfg, channel)
                actual_asp_list_channel = []
                actual_disp_list_channel = []
                aspirate_data_list = []
                dispense_data_list = []
                for run_trial in trials[volume][channel]:
                    trial_count += 1
                    ui.print_header(
                        f"{volume} uL channel {channel + 1} ({run_trial.trial + 1}/{cfg.trials})"
                    )
                    ui.print_info(f"trial total {trial_count}/{trial_total}")
                    # NOTE: always pick-up new tip for each trial
                    #       b/c it seems tips heatup
                    next_tip: Well = _next_tip_for_channel(
                        cfg, resources, channel, total_tips
                    )
                    next_tip_location = next_tip.top().move(channel_offset)
                    _pick_up_tip(
                        resources.ctx,
                        resources.pipette,
                        cfg,
                        location=next_tip_location,
                    )
                    (
                        actual_aspirate,
                        aspirate_data,
                        actual_dispense,
                        dispense_data,
                    ) = _run_trial(run_trial)
                    ui.print_info(
                        "measured volumes:\n"
                        f"\taspirate: {round(actual_aspirate, 2)} uL\n"
                        f"\tdispense: {round(actual_dispense, 2)} uL"
                    )
                    asp_with_evap = actual_aspirate - average_aspirate_evaporation_ul
                    disp_with_evap = actual_dispense + average_dispense_evaporation_ul
                    chnl_div = _get_channel_divider(cfg)
                    disp_with_evap /= chnl_div
                    asp_with_evap /= chnl_div
                    ui.print_info(
                        "per-channel volume, with evaporation:\n"
                        f"\taspirate: {round(asp_with_evap, 2)} uL\n"
                        f"\tdispense: {round(disp_with_evap, 2)} uL"
                    )

                    actual_asp_list_channel.append(asp_with_evap)
                    actual_disp_list_channel.append(disp_with_evap)

                    trial_asp_dict[run_trial.trial].append(asp_with_evap)
                    trial_disp_dict[run_trial.trial].append(disp_with_evap)

                    aspirate_data_list.append(aspirate_data)
                    dispense_data_list.append(dispense_data)

                    report.store_trial(
                        test_report,
                        run_trial.trial,
                        run_trial.volume,
                        run_trial.channel,
                        asp_with_evap,
                        disp_with_evap,
                    )
                    ui.print_info("dropping tip")
                    _drop_tip(resources.pipette, cfg.return_tip, _minimum_z_height(cfg))

                ui.print_header(f"{volume} uL channel {channel + 1} CALCULATIONS")
                aspirate_average, aspirate_cv, aspirate_d = _calculate_stats(
                    actual_asp_list_channel, volume
                )
                dispense_average, dispense_cv, dispense_d = _calculate_stats(
                    actual_disp_list_channel, volume
                )

                # Average Celsius
                aspirate_celsius_avg = sum(
                    a_data.environment.celsius_pipette for a_data in dispense_data_list
                ) / len(aspirate_data_list)
                dispense_celsius_avg = sum(
                    d_data.environment.celsius_pipette for d_data in aspirate_data_list
                ) / len(dispense_data_list)
                # Average humidity
                aspirate_humidity_avg = sum(
                    a_data.environment.humidity_pipette for a_data in dispense_data_list
                ) / len(aspirate_data_list)
                dispense_humidity_avg = sum(
                    d_data.environment.humidity_pipette for d_data in aspirate_data_list
                ) / len(dispense_data_list)

                _print_stats("aspirate", aspirate_average, aspirate_cv, aspirate_d)
                _print_stats("dispense", dispense_average, dispense_cv, dispense_d)

                report.store_volume_per_channel(
                    report=test_report,
                    mode="aspirate",
                    volume=volume,
                    channel=channel,
                    average=aspirate_average,
                    cv=aspirate_cv,
                    d=aspirate_d,
                    celsius=aspirate_celsius_avg,
                    humidity=aspirate_humidity_avg,
                )
                report.store_volume_per_channel(
                    report=test_report,
                    mode="dispense",
                    volume=volume,
                    channel=channel,
                    average=dispense_average,
                    cv=dispense_cv,
                    d=dispense_d,
                    celsius=dispense_celsius_avg,
                    humidity=dispense_humidity_avg,
                )
                actual_asp_list_all.extend(actual_asp_list_channel)
                actual_disp_list_all.extend(actual_disp_list_channel)

            for trial in range(cfg.trials):
                trial_asp_list = trial_asp_dict[trial]
                trial_disp_list = trial_disp_dict[trial]

                aspirate_average, aspirate_cv, aspirate_d = _calculate_stats(
                    trial_asp_list, volume
                )
                dispense_average, dispense_cv, dispense_d = _calculate_stats(
                    trial_disp_list, volume
                )

                report.store_volume_per_trial(
                    report=test_report,
                    mode="aspirate",
                    volume=volume,
                    trial=trial,
                    average=aspirate_average,
                    cv=aspirate_cv,
                    d=aspirate_d,
                )
                report.store_volume_per_trial(
                    report=test_report,
                    mode="dispense",
                    volume=volume,
                    trial=trial,
                    average=dispense_average,
                    cv=dispense_cv,
                    d=dispense_d,
                )

            ui.print_header(f"{volume} uL channel all CALCULATIONS")
            aspirate_average, aspirate_cv, aspirate_d = _calculate_stats(
                actual_asp_list_all, volume
            )
            dispense_average, dispense_cv, dispense_d = _calculate_stats(
                actual_disp_list_all, volume
            )

            _print_stats("aspirate", aspirate_average, aspirate_cv, aspirate_d)
            _print_stats("dispense", dispense_average, dispense_cv, dispense_d)

            report.store_volume_all(
                report=test_report,
                mode="aspirate",
                volume=volume,
                average=aspirate_average,
                cv=aspirate_cv,
                d=aspirate_d,
            )
            report.store_volume_all(
                report=test_report,
                mode="dispense",
                volume=volume,
                average=dispense_average,
                cv=dispense_cv,
                d=dispense_d,
            )
    finally:
        ui.print_info("ending recording")
        recorder.stop()
        recorder.deactivate()
        _return_tip = False if calibration_tip_in_use else cfg.return_tip
        _finish_test(cfg, resources, _return_tip)
    ui.print_title("RESULTS")
    _print_final_results(
        volumes=resources.test_volumes,
        channel_count=len(channels_to_test),
        test_report=test_report,
    )
