"""Gravimetric."""
from statistics import stdev
from typing import Optional, Tuple, List

from opentrons.protocol_api import ProtocolContext, InstrumentContext, Well

from hardware_testing.data import create_run_id_and_start_time
from hardware_testing.opentrons_api.types import OT3Mount, Point
from hardware_testing.opentrons_api.helpers_ot3 import clear_pipette_ul_per_mm

from . import report
from . import config
from .helpers import get_pipette_unique_name
from .workarounds import get_sync_hw_api, get_latest_offset_for_labware
from .increments import get_volume_increments
from .liquid_height.height import LiquidTracker, initialize_liquid_from_deck
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
from .liquid_class.defaults import get_test_volumes
from .liquid_class.pipetting import (
    aspirate_with_liquid_class,
    dispense_with_liquid_class,
    PipettingCallbacks,
)
from .radwag_pipette_calibration_vial import VIAL_DEFINITION


_MEASUREMENTS: List[Tuple[str, MeasurementData]] = list()


def _generate_callbacks_for_trial(
    recorder: GravimetricRecorder,
    volume: Optional[float],
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
            create_measurement_tag("submerge", volume, trial)
        ),
        on_mixing=lambda: recorder.set_sample_tag(
            create_measurement_tag("mix", volume, trial)
        ),
        on_aspirating=lambda: recorder.set_sample_tag(
            create_measurement_tag("aspirate", volume, trial)
        ),
        on_dispensing=lambda: recorder.set_sample_tag(
            create_measurement_tag("dispense", volume, trial)
        ),
        on_retracting=lambda: recorder.set_sample_tag(
            create_measurement_tag("retract", volume, trial)
        ),
        on_blowing_out=lambda: recorder.set_sample_tag(
            create_measurement_tag("blowout", volume, trial)
        ),
        on_exiting=recorder.clear_sample_tag,
    )


def _update_environment_first_last_min_max(test_report: report.CSVReport) -> None:
    # update this regularly, because the script may exit early
    env_data_list = [m.environment for tag, m in _MEASUREMENTS]
    report.store_environment(
        test_report, report.EnvironmentReportState.FIRST, env_data_list[0]
    )
    report.store_environment(
        test_report, report.EnvironmentReportState.LAST, env_data_list[-1]
    )
    report.store_environment(
        test_report, report.EnvironmentReportState.MIN, get_min_reading(env_data_list)
    )
    report.store_environment(
        test_report, report.EnvironmentReportState.MAX, get_max_reading(env_data_list)
    )


def _run_trial(
    ctx: ProtocolContext,
    pipette: InstrumentContext,
    well: Well,
    tip_volume: int,
    volume: float,
    trial: int,
    recorder: GravimetricRecorder,
    test_report: report.CSVReport,
    liquid_tracker: LiquidTracker,
    blank: bool,
) -> Tuple[float, float]:
    pipetting_callbacks = _generate_callbacks_for_trial(recorder, volume, trial, blank)

    def _tag(m_type: MeasurementType) -> str:
        return create_measurement_tag(m_type, None if blank else volume, trial)

    def _record_measurement_and_store(m_type: MeasurementType) -> MeasurementData:
        m_tag = _tag(m_type)
        if recorder.is_simulator and not blank:
            if m_type == MeasurementType.ASPIRATE:
                recorder.scale.add_simulation_mass(volume * -0.001)
            elif m_type == MeasurementType.DISPENSE:
                recorder.scale.add_simulation_mass(volume * 0.001)
        m_data = record_measurement_data(ctx, m_tag, recorder)
        report.store_measurement(test_report, m_tag, m_data)
        _MEASUREMENTS.append(
            (
                m_tag,
                m_data,
            )
        )
        _update_environment_first_last_min_max(test_report)
        return m_data

    # RUN INIT
    pipette.move_to(well.top())
    m_data_init = _record_measurement_and_store(MeasurementType.INIT)

    # RUN ASPIRATE
    aspirate_with_liquid_class(
        ctx,
        pipette,
        tip_volume,
        volume,
        well,
        liquid_tracker,
        callbacks=pipetting_callbacks,
        blank=blank,
    )
    m_data_aspirate = _record_measurement_and_store(MeasurementType.ASPIRATE)

    # RUN DISPENSE
    dispense_with_liquid_class(
        ctx,
        pipette,
        tip_volume,
        volume,
        well,
        liquid_tracker,
        callbacks=pipetting_callbacks,
        blank=blank,
    )
    m_data_dispense = _record_measurement_and_store(MeasurementType.DISPENSE)

    # calculate volumes
    volume_aspirate = calculate_change_in_volume(m_data_init, m_data_aspirate)
    volume_dispense = calculate_change_in_volume(m_data_aspirate, m_data_dispense)
    return volume_aspirate, volume_dispense


def run(ctx: ProtocolContext, cfg: config.GravimetricConfig) -> None:
    """Run."""
    if ctx.is_simulating():
        get_input = print
    else:
        get_input = input  # type: ignore[assignment]
    run_id, start_time = create_run_id_and_start_time()

    # LOAD LABWARE
    tipracks = [
        ctx.load_labware(
            f"opentrons_ot3_96_tiprack_{cfg.tip_volume}ul",
            location=slot,
        )
        for slot in cfg.slots_tiprack
    ]
    rack_offsets = {
        rack: get_latest_offset_for_labware(cfg.labware_offsets, rack)
        for rack in tipracks
    }
    print("Labware Offsets:")
    for rack, offset in rack_offsets.items():
        print(f"\t{rack.name} (slot={rack.parent}): {offset}")
    if not ctx.is_simulating():
        input("press ENTER to continue")
    for rack in tipracks:
        rack.set_calibration(rack_offsets[rack])
    vial = ctx.load_labware_from_definition(VIAL_DEFINITION, location=cfg.slot_vial)
    # FIXME: a bug in the App is blocking calibrating this labware using LPC
    vial.set_calibration(Point(x=0.0, y=-54.001, z=-40.792))

    # LIQUID TRACKING
    liquid_tracker = LiquidTracker()
    initialize_liquid_from_deck(ctx, liquid_tracker)
    liquid_tracker.set_start_volume_from_liquid_height(
        vial["A1"], vial["A1"].depth - config.VIAL_SAFE_Z_OFFSET, name="Water"
    )

    # PIPETTE
    pipette = ctx.load_instrument(
        f"p{cfg.pipette_volume}_single", cfg.pipette_mount, tip_racks=tipracks
    )
    pipette.default_speed = config.GANTRY_MAX_SPEED
    pipette_tag = get_pipette_unique_name(pipette)

    def _drop_tip() -> None:
        if cfg.return_tip:
            pipette.return_tip(home_after=False)
        else:
            pipette.drop_tip(home_after=False)

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
    if recorder.is_simulator:
        if cfg.low_volume:
            recorder.scale.set_simulation_mass(200)
        else:
            recorder.scale.set_simulation_mass(15)

    # CREATE CSV TEST REPORT
    test_report = report.create_csv_test_report(test_volumes, cfg, run_id=run_id)
    test_report.set_tag(pipette_tag)
    test_report.set_operator("unknown")
    test_report.set_version("unknown")
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

    # HOME
    ctx.home()

    # TEST VIAL LIQUID HEIGHT
    expected_height = liquid_tracker.get_liquid_height(vial["A1"])
    pipette.pick_up_tip()
    pipette.move_to(vial["A1"].bottom(expected_height))
    get_input("Check that tip is touching liquid surface (+/-) 0.1 mm")
    _drop_tip()

    recorder.record(in_thread=True)

    try:
        total = len(test_volumes) * cfg.trials + config.NUM_BLANK_TRIALS
        count = 0

        # MEASURE EVAPORATION
        actual_asp_list: List[float] = list()
        actual_disp_list: List[float] = list()
        for trial in range(config.NUM_BLANK_TRIALS):
            count += 1
            if cfg.skip_blank:
                actual_asp_list.append(0.0)
                actual_disp_list.append(0.0)
                continue
            print(
                f"{count}/{total}: blank (trial {trial + 1}/{config.NUM_BLANK_TRIALS})"
            )
            pipette.pick_up_tip()
            # both volumes measured should be negative (-)
            evap_aspirate, evap_dispense = _run_trial(
                ctx,
                pipette,
                vial["A1"],
                cfg.tip_volume,
                test_volumes[-1],
                trial,
                recorder,
                test_report,
                liquid_tracker,
                blank=True,  # stay away from the liquid
            )
            actual_asp_list.append(evap_aspirate)
            actual_disp_list.append(evap_dispense)
            _drop_tip()

        # CALCULATE AVERAGE EVAPORATION
        average_aspirate_evaporation_ul = sum(actual_asp_list) / len(actual_asp_list)
        average_dispense_evaporation_ul = sum(actual_disp_list) / len(actual_disp_list)
        report.store_average_evaporation(
            test_report,
            average_aspirate_evaporation_ul,
            average_dispense_evaporation_ul,
        )

        # TEST
        for volume in test_volumes:
            actual_asp_list = list()
            actual_disp_list = list()
            for trial in range(cfg.trials):
                count += 1
                print(f"{count}/{total}: {volume} uL (trial {trial + 1}/{cfg.trials})")
                pipette.pick_up_tip()
                # NOTE: aspirate will be negative, dispense will be positive
                actual_aspirate, actual_dispense = _run_trial(
                    ctx,
                    pipette,
                    vial["A1"],
                    cfg.tip_volume,
                    volume,
                    trial,
                    recorder,
                    test_report,
                    liquid_tracker,
                    blank=False,
                )
                # factor in average evaporation (which should each be negative uL amounts)
                asp_with_evap = actual_aspirate - average_aspirate_evaporation_ul
                disp_with_evap = actual_dispense - average_dispense_evaporation_ul
                # convert volumes to positive amounts
                aspirate_rectified = abs(asp_with_evap)
                dispense_rectified = abs(disp_with_evap)
                actual_asp_list.append(aspirate_rectified)
                actual_disp_list.append(dispense_rectified)
                report.store_trial(
                    test_report, trial, volume, aspirate_rectified, dispense_rectified
                )
                _drop_tip()

            # CALCULATE AVERAGE, %CV, %D
            aspirate_average = sum(actual_asp_list) / len(actual_asp_list)
            dispense_average = sum(actual_disp_list) / len(actual_disp_list)
            aspirate_cv = stdev(actual_asp_list) / aspirate_average
            dispense_cv = stdev(actual_disp_list) / dispense_average
            aspirate_d = (aspirate_average - volume) / volume
            dispense_d = (dispense_average - volume) / volume
            report.store_volume(
                test_report,
                "aspirate",
                volume,
                aspirate_average,
                aspirate_cv,
                aspirate_d,
            )
            report.store_volume(
                test_report,
                "dispense",
                volume,
                dispense_average,
                dispense_cv,
                dispense_d,
            )
    finally:
        recorder.stop()
