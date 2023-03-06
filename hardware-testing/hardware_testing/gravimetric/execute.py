"""Gravimetric."""
from time import sleep
from typing import Optional, Dict, Tuple

from opentrons.protocol_api import ProtocolContext, InstrumentContext, Well

from hardware_testing.data import create_run_id_and_start_time
from hardware_testing.opentrons_api.types import OT3Mount
from hardware_testing.opentrons_api.helpers_ot3 import clear_pipette_ul_per_mm

from . import report
from . import config
from .helpers import get_pipette_unique_name
from .workarounds import get_sync_hw_api, get_latest_offset_for_labware
from .increments import get_volume_increments
from .liquid_height.height import LiquidTracker, initialize_liquid_from_deck
from .measurement.environment import (
    read_blank_environment_data,
    get_first_reading,
    get_last_reading,
    get_min_reading,
    get_max_reading,
)
from .measurement.record import (
    GravimetricRecorder,
    GravimetricRecorderConfig,
    GravimetricRecording,
)
from .liquid_class.defaults import get_test_volumes
from .liquid_class.pipetting import (
    aspirate_with_liquid_class,
    dispense_with_liquid_class,
    PipettingCallbacks,
)
from .vial_labware_definition import VIAL_DEFINITION


_MEASUREMENTS: Dict[str, config.MeasurementData] = dict()


def _generate_callbacks_for_trial(
    recorder: GravimetricRecorder, volume: Optional[float], trial: int
) -> PipettingCallbacks:
    def _tag(t: str) -> str:
        return report.create_measurement_tag(t, volume, trial)

    return PipettingCallbacks(
        on_submerging=lambda: recorder.set_sample_tag(_tag("submerge")),
        on_mixing=lambda: recorder.set_sample_tag(_tag("mix")),
        on_aspirating=lambda: recorder.set_sample_tag(_tag("aspirate")),
        on_dispensing=lambda: recorder.set_sample_tag(_tag("dispense")),
        on_retracting=lambda: recorder.set_sample_tag(_tag("retract")),
        on_blowing_out=lambda: recorder.set_sample_tag(_tag("blowout")),
        on_exiting=recorder.clear_sample_tag,
    )


def _build_measurement_data(
    recorder: GravimetricRecorder, tag: str, environment: config.EnvironmentData
) -> config.MeasurementData:
    recording_slice = GravimetricRecording(
        [sample for sample in recorder.recording if sample.tag and sample.tag == tag]
    )
    recording_grams_as_list = recording_slice.grams_as_list

    return config.MeasurementData(
        celsius_pipette=environment.celsius_pipette,
        celsius_air=environment.celsius_air,
        humidity_air=environment.humidity_air,
        pascals_air=environment.pascals_air,
        celsius_liquid=environment.celsius_liquid,
        grams_average=recording_slice.average,
        grams_cv=recording_slice.calculate_cv(),
        grams_min=min(recording_grams_as_list),
        grams_max=max(recording_grams_as_list),
        samples_start_time=recording_slice.start_time,
        samples_duration=recording_slice.duration,
        samples_count=len(recording_grams_as_list),
    )


def _tags_for_measurement(
    volume: float, trial: int, blank: Optional[bool] = False
) -> Tuple[str, str, str]:
    vol_in_tag = None if blank else volume
    sample_tag_init = report.create_measurement_tag(
        report.MeasurementType.INIT, vol_in_tag, trial
    )
    sample_tag_aspirate = report.create_measurement_tag(
        report.MeasurementType.ASPIRATE, vol_in_tag, trial
    )
    sample_tag_dispense = report.create_measurement_tag(
        report.MeasurementType.DISPENSE, vol_in_tag, trial
    )
    return sample_tag_init, sample_tag_aspirate, sample_tag_dispense


def _run_sample(
    ctx: ProtocolContext,
    pipette: InstrumentContext,
    well: Well,
    tip_volume: int,
    volume: float,
    trial: int,
    recorder: GravimetricRecorder,
    test_report: report.CSVReport,
    liquid_tracker: LiquidTracker,
    stay_above_well: bool,
) -> None:
    tags = _tags_for_measurement(volume, trial, blank=stay_above_well)
    sample_tag_init, sample_tag_aspirate, sample_tag_dispense = tags
    vol_in_tag = None if stay_above_well else volume
    callbacks = _generate_callbacks_for_trial(recorder, vol_in_tag, trial)

    # NOTE: give a bit of time during simulation, so some fake data can be stored
    def _delay(seconds: float) -> None:
        if ctx.is_simulating():
            sleep(0.1)
        else:
            ctx.delay(seconds)

    def _save_measurement_data(
        tag: str, m_type: report.MeasurementType, env_data: config.EnvironmentData
    ) -> None:
        meas_data = _build_measurement_data(recorder, tag, env_data)
        report.store_measurement(test_report, m_type, None, trial, meas_data)
        _MEASUREMENTS[tag] = meas_data

    # RUN INIT
    pipette.move_to(well.top())
    env_data_init = read_blank_environment_data()  # cache state of environment
    with recorder.samples_of_tag(sample_tag_init):
        _delay(config.DELAY_SECONDS_BEFORE_ASPIRATE)

    # RUN ASPIRATE
    aspirate_with_liquid_class(
        ctx,
        pipette,
        tip_volume,
        volume,
        well,
        liquid_tracker,
        callbacks=callbacks,
        stay_above_well=stay_above_well,
    )
    env_data_aspirate = read_blank_environment_data()  # cache state of environment
    with recorder.samples_of_tag(sample_tag_aspirate):
        _delay(config.DELAY_SECONDS_AFTER_ASPIRATE)

    # RUN DISPENSE
    dispense_with_liquid_class(
        ctx,
        pipette,
        tip_volume,
        volume,
        well,
        liquid_tracker,
        callbacks=callbacks,
        stay_above_well=stay_above_well,
    )
    env_data_dispense = read_blank_environment_data()  # cache state of environment
    with recorder.samples_of_tag(sample_tag_dispense):
        _delay(config.DELAY_SECONDS_AFTER_DISPENSE)

    # STORE MEASUREMENT DATA
    _save_measurement_data(sample_tag_init, report.MeasurementType.INIT, env_data_init)
    _save_measurement_data(
        sample_tag_aspirate, report.MeasurementType.ASPIRATE, env_data_aspirate
    )
    _save_measurement_data(
        sample_tag_dispense, report.MeasurementType.DISPENSE, env_data_dispense
    )
    # STORE ENVIRONMENT STATES
    report.store_environment(
        test_report, report.EnvironmentReportState.FIRST, get_first_reading()
    )
    report.store_environment(
        test_report, report.EnvironmentReportState.LAST, get_last_reading()
    )
    report.store_environment(
        test_report, report.EnvironmentReportState.MIN, get_min_reading()
    )
    report.store_environment(
        test_report, report.EnvironmentReportState.MAX, get_max_reading()
    )


def run(ctx: ProtocolContext, cfg: config.GravimetricConfig) -> None:
    """Run."""
    if ctx.is_simulating():
        get_input = print
    else:
        get_input = input  # type: ignore[assignment]
    run_id, start_time = create_run_id_and_start_time()

    # TODO: create test-report

    # LOAD LABWARE
    tiprack = ctx.load_labware(
        f"opentrons_ot3_96_tiprack_{cfg.tip_volume}ul",
        location=cfg.slot_tiprack,
    )
    tiprack.set_calibration(get_latest_offset_for_labware(cfg.labware_offsets, tiprack))
    vial = ctx.load_labware_from_definition(VIAL_DEFINITION, location=cfg.slot_vial)
    vial.set_calibration(get_latest_offset_for_labware(cfg.labware_offsets, vial))

    # LIQUID TRACKING
    liquid_tracker = LiquidTracker()
    initialize_liquid_from_deck(ctx, liquid_tracker)
    liquid_tracker.set_start_volume_from_liquid_height(
        vial["A1"], vial["A1"].depth - config.VIAL_SAFE_Z_OFFSET, name="Water"
    )

    # PIPETTE
    pipette = ctx.load_instrument(
        f"p{cfg.pipette_volume}_single", cfg.pipette_mount, tip_racks=[tiprack]
    )
    pipette_tag = get_pipette_unique_name(pipette)

    # GET TEST VOLUMES
    if cfg.increment:
        test_volumes = get_volume_increments(cfg.pipette_volume, cfg.tip_volume)
        clear_pipette_ul_per_mm(
            get_sync_hw_api(ctx)._obj_to_adapt,  # type: ignore[arg-type]
            OT3Mount.LEFT if cfg.pipette_mount == "left" else OT3Mount.RIGHT,
        )
    else:
        test_volumes = get_test_volumes(cfg.pipette_volume, cfg.tip_volume)
    # anything volumes < 2uL must be done on the super-high-precision scale
    if cfg.low_volume:
        test_volumes = [v for v in test_volumes if v < config.LOW_VOLUME_UPPER_LIMIT_UL]
    else:
        test_volumes = [
            v for v in test_volumes if v >= config.LOW_VOLUME_UPPER_LIMIT_UL
        ]
    if not test_volumes:
        raise ValueError("no volumes to test, check the configuration")

    # SCALE
    # Some Radwag settings cannot be controlled remotely.
    # Listed below are the things the must be done using the touchscreen:
    #   1) Set profile to USER
    #   2) Set screensaver to NONE
    recorder = GravimetricRecorder(
        GravimetricRecorderConfig(
            test_name=cfg.name,
            run_id=run_id,
            tag=pipette_tag,
            start_time=start_time,
            duration=0,
            frequency=50 if ctx.is_simulating() else 5,
            stable=False,
        ),
        simulate=ctx.is_simulating(),
    )

    # CREATE CSV TEST REPORT
    test_report = report.create_csv_test_report(test_volumes, cfg, run_id=run_id)
    test_report.set_tag(pipette_tag)
    report.store_serial_numbers(
        test_report,
        robot="ot3",
        pipette=pipette_tag,
        scale=recorder.scale.read_serial_number(),
        environment="None",
        liquid="None",
    )

    # USER SETUP LIQUIDS
    setup_str = liquid_tracker.get_setup_instructions_string()
    print(setup_str)
    get_input("press ENTER when ready...")

    # TEST VIAL LIQUID HEIGHT
    expected_height = liquid_tracker.get_liquid_height(vial["A1"])
    pipette.pick_up_tip()
    pipette.move_to(vial["A1"].bottom(expected_height))
    get_input("Check that tip is touching liquid surface (+/-) 0.1 mm")
    pipette.drop_tip()

    # RECORD SCALE
    recorder.record(in_thread=True)

    try:
        total = len(test_volumes) * cfg.trials + config.NUM_BLANK_TRIALS
        count = 0
        # MEASURE EVAPORATION
        for trial in range(config.NUM_BLANK_TRIALS):
            count += 1
            print(
                f"{count}/{total}: blank (trial {trial + 1}/{config.NUM_BLANK_TRIALS})"
            )
            pipette.pick_up_tip()
            _run_sample(
                ctx,
                pipette,
                vial["A1"],
                cfg.tip_volume,
                test_volumes[-1],
                trial,
                recorder,
                test_report,
                liquid_tracker,
                stay_above_well=True,  # stay away from the liquid
            )
            pipette.drop_tip()
        # LOOP THROUGH SAMPLES
        for volume in test_volumes:
            for trial in range(cfg.trials):
                count += 1
                print(f"{count}/{total}: {volume} uL (trial {trial + 1}/{cfg.trials})")
                pipette.pick_up_tip()
                _run_sample(
                    ctx,
                    pipette,
                    vial["A1"],
                    cfg.tip_volume,
                    volume,
                    trial,
                    recorder,
                    test_report,
                    liquid_tracker,
                    stay_above_well=False,
                )
                # TODO: calculate volume, and store in TRIAL section
                pipette.drop_tip()
            # TODO: calculate volume Average, CV, and D, and store in VOLUME section
    finally:
        recorder.stop()
