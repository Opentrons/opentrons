"""Gravimetric."""
from statistics import stdev
from typing import Optional, Tuple, List

from opentrons.protocol_api import ProtocolContext, InstrumentContext, Well, Labware

from hardware_testing.data import create_run_id_and_start_time, ui, get_git_description
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
        on_retracting=lambda: recorder.set_sample_tag(
            create_measurement_tag("retract", volume, trial)
        ),
        on_dispensing=lambda: recorder.set_sample_tag(
            create_measurement_tag("dispense", volume, trial)
        ),
        on_blowing_out=lambda: recorder.set_sample_tag(
            create_measurement_tag("blowout", volume, trial)
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


def _get_volumes(ctx: ProtocolContext, cfg: config.GravimetricConfig) -> List[float]:
    if cfg.increment:
        test_volumes = get_volume_increments(cfg.pipette_volume, cfg.tip_volume)
    elif cfg.user_volumes and not ctx.is_simulating():
        _inp = input('Enter desired volumes, comma separated (eg: "10,100,1000") :')
        test_volumes = [
            float(vol_str) for vol_str in _inp.strip().split(",") if vol_str
        ]
    else:
        test_volumes = get_test_volumes(cfg.pipette_volume, cfg.tip_volume)
    if not test_volumes:
        raise ValueError("no volumes to test, check the configuration")
    return sorted(test_volumes, reverse=True)


def _get_channel_offset(cfg: config.GravimetricConfig, channel: int) -> Point:
    assert (
        channel < cfg.pipette_channels
    ), f"unexpected channel on {cfg.pipette_channels} channel pipette: {channel}"
    if cfg.pipette_channels == 1:
        return Point()
    if cfg.pipette_channels == 8:
        return Point(y=channel * 9.0)
    if cfg.pipette_channels == 96:
        row = channel % 8  # A-H
        col = int(float(channel) / 8.0)  # 1-12
        return Point(x=col * 9.0, y=row * 9.0)
    raise ValueError(f"unexpected number of channels in config: {cfg.pipette_channels}")


def _load_pipette(
    ctx: ProtocolContext, cfg: config.GravimetricConfig, tipracks: List[Labware]
) -> InstrumentContext:
    load_str_channels = {1: "single", 8: "multi", 96: "96"}
    if cfg.pipette_channels not in load_str_channels:
        raise ValueError(f"unexpected number of channels: {cfg.pipette_channels}")
    chnl_str = load_str_channels[cfg.pipette_channels]
    pip_name = f"p{cfg.pipette_volume}_{chnl_str}"
    print(f'pipette "{pip_name}" on mount "{cfg.pipette_mount}"')
    pipette = ctx.load_instrument(pip_name, cfg.pipette_mount, tip_racks=tipracks)
    pipette.default_speed = config.GANTRY_MAX_SPEED
    if cfg.increment:
        print("clearing pipette ul-per-mm table to be linear")
        clear_pipette_ul_per_mm(
            get_sync_hw_api(ctx)._obj_to_adapt,  # type: ignore[arg-type]
            OT3Mount.LEFT if cfg.pipette_mount == "left" else OT3Mount.RIGHT,
        )
    return pipette


def _apply_labware_offsets(
    cfg: config.GravimetricConfig, tip_racks: List[Labware], vial: Labware
) -> None:
    def _apply(labware: Labware) -> None:
        o = get_latest_offset_for_labware(cfg.labware_offsets, labware)
        print(
            f'Apply labware offset to "{labware.name}" (slot={labware.parent}): '
            f"x={round(o.x, 2)}, y={round(o.y, 2)}, z={round(o.z, 2)}"
        )
        labware.set_calibration(o)

    _apply(vial)
    for rack in tip_racks:
        _apply(rack)


def _load_labware(
    ctx: ProtocolContext, cfg: config.GravimetricConfig
) -> Tuple[Labware, List[Labware]]:
    vial = ctx.load_labware_from_definition(VIAL_DEFINITION, location=cfg.slot_vial)
    tiprack_load_settings: List[Tuple[int, str]] = [
        (
            slot,
            f"opentrons_ot3_96_tiprack_{cfg.tip_volume}ul",
        )
        for slot in cfg.slots_tiprack
    ]
    for ls in tiprack_load_settings:
        print(f'Loading tiprack "{ls[1]}" in slot #{ls[0]}')
    tipracks = [ctx.load_labware(ls[1], location=ls[0]) for ls in tiprack_load_settings]
    _apply_labware_offsets(cfg, tipracks, vial)
    return vial, tipracks


def _jog_to_find_liquid_height(
    ctx: ProtocolContext, pipette: InstrumentContext, well: Well
) -> float:
    _well_depth = well.depth
    _liquid_height = _well_depth
    _jog_size = -1.0
    while not ctx.is_simulating():
        pipette.move_to(well.bottom(_liquid_height))
        inp = input(
            f"height={_liquid_height}: ENTER to jog {_jog_size} mm, "
            f'or enter new jog size, or "yes" to save: '
        )
        if inp:
            if inp[0] == "y":
                break
            try:
                _jog_size = min(max(float(inp), -1.0), 1.0)
            except ValueError:
                continue
        _liquid_height = min(max(_liquid_height + _jog_size, 0), _well_depth)
    return _liquid_height


def _run_trial(
    ctx: ProtocolContext,
    pipette: InstrumentContext,
    well: Well,
    channel_offset: Point,
    tip_volume: int,
    volume: float,
    trial: int,
    recorder: GravimetricRecorder,
    test_report: report.CSVReport,
    liquid_tracker: LiquidTracker,
    blank: bool,
    inspect: bool,
    mix: bool = False,
    stable: bool = False,
) -> Tuple[float, float]:
    pipetting_callbacks = _generate_callbacks_for_trial(recorder, volume, trial, blank)

    def _tag(m_type: MeasurementType) -> str:
        return create_measurement_tag(m_type, None if blank else volume, trial)

    def _record_measurement_and_store(m_type: MeasurementType) -> MeasurementData:
        m_tag = _tag(m_type)
        if recorder.is_simulator and not blank:
            if m_type == MeasurementType.ASPIRATE:
                recorder.add_simulation_mass(volume * -0.001)
            elif m_type == MeasurementType.DISPENSE:
                recorder.add_simulation_mass(volume * 0.001)
        m_data = record_measurement_data(
            ctx, m_tag, recorder, pipette.mount, stable, shorten=inspect
        )
        report.store_measurement(test_report, m_tag, m_data)
        _MEASUREMENTS.append(
            (
                m_tag,
                m_data,
            )
        )
        _update_environment_first_last_min_max(test_report)
        return m_data

    print("recorded weights:")

    # RUN INIT
    pipette.move_to(well.top().move(channel_offset))
    m_data_init = _record_measurement_and_store(MeasurementType.INIT)
    print(f"\tinitial grams: {m_data_init.grams_average} g")

    # RUN ASPIRATE
    aspirate_with_liquid_class(
        ctx,
        pipette,
        tip_volume,
        volume,
        well,
        channel_offset,
        liquid_tracker,
        callbacks=pipetting_callbacks,
        blank=blank,
        inspect=inspect,
        mix=mix,
    )
    m_data_aspirate = _record_measurement_and_store(MeasurementType.ASPIRATE)
    print(f"\tgrams after aspirate: {m_data_aspirate.grams_average} g")
    print(f"\tcelsius after aspirate: {m_data_aspirate.celsius_pipette} C")

    # RUN DISPENSE
    dispense_with_liquid_class(
        ctx,
        pipette,
        tip_volume,
        volume,
        well,
        channel_offset,
        liquid_tracker,
        callbacks=pipetting_callbacks,
        blank=blank,
        inspect=inspect,
        mix=mix,
    )
    m_data_dispense = _record_measurement_and_store(MeasurementType.DISPENSE)
    print(f"\tgrams after dispense: {m_data_dispense.grams_average} g")

    # calculate volumes
    volume_aspirate = calculate_change_in_volume(m_data_init, m_data_aspirate)
    volume_dispense = calculate_change_in_volume(m_data_aspirate, m_data_dispense)
    return volume_aspirate, volume_dispense


def _get_operator_name(is_simulating: bool) -> str:
    if not is_simulating:
        return input("OPERATOR name:").strip()
    else:
        return "simulation"


def run(ctx: ProtocolContext, cfg: config.GravimetricConfig) -> None:
    """Run."""
    run_id, start_time = create_run_id_and_start_time()

    ui.print_header("LOAD LABWARE")
    vial, tipracks = _load_labware(ctx, cfg)
    liquid_tracker = LiquidTracker()
    initialize_liquid_from_deck(ctx, liquid_tracker)

    ui.print_header("LOAD PIPETTE")
    pipette = _load_pipette(ctx, cfg, tipracks)
    pipette_tag = get_pipette_unique_name(pipette)
    print(f'found pipette "{pipette_tag}"')
    pipette.starting_tip = tipracks[0][cfg.starting_tip]
    print(f"starting on tip {cfg.starting_tip}")

    def _drop_tip() -> None:
        if cfg.return_tip:
            pipette.return_tip(home_after=False)
        else:
            pipette.drop_tip(home_after=False)

    # GET TEST VOLUMES
    test_volumes = _get_volumes(ctx, cfg)
    print("test volumes:")
    for v in test_volumes:
        print(f"\t{v} uL")

    ui.print_header("LOAD SCALE")
    print(
        "Some Radwag settings cannot be controlled remotely.\n"
        "Listed below are the things the must be done using the touchscreen:\n"
        "  1) Set profile to USER\n"
        "  2) Set screensaver to NONE\n"
    )
    recorder = GravimetricRecorder(
        GravimetricRecorderConfig(
            test_name=cfg.name,
            run_id=run_id,
            tag=pipette_tag,
            start_time=start_time,
            duration=0,
            frequency=1000 if ctx.is_simulating() else 5,
            stable=False,
        ),
        simulate=ctx.is_simulating(),
    )
    print(f'found scale "{recorder.serial_number}"')
    if recorder.is_simulator:
        if cfg.pipette_volume == 50 or cfg.tip_volume == 50:
            recorder.set_simulation_mass(15)
        else:
            recorder.set_simulation_mass(200)
    recorder.record(in_thread=True)
    print(f'scale is recording to "{recorder.file_name}"')

    ui.print_header("CREATE TEST-REPORT")
    test_report = report.create_csv_test_report(test_volumes, cfg, run_id=run_id)
    test_report.set_tag(pipette_tag)
    test_report.set_operator(_get_operator_name(ctx.is_simulating()))
    test_report.set_version(get_git_description())
    report.store_serial_numbers(
        test_report,
        robot="ot3",
        pipette=pipette_tag,
        scale=recorder.serial_number,
        environment="None",
        liquid="None",
    )

    ui.print_title("FIND LIQUID HEIGHT")
    print("homing...")
    ctx.home()
    print("picking up tip")
    pipette.pick_up_tip()
    print("moving to vial")
    well = vial["A1"]
    pipette.move_to(well.top())
    _liquid_height = _jog_to_find_liquid_height(ctx, pipette, well)
    height_below_top = well.depth - _liquid_height
    print(f"liquid is {height_below_top} mm below top of vial")
    liquid_tracker.set_start_volume_from_liquid_height(
        vial["A1"], _liquid_height, name="Water"
    )
    vial_volume = liquid_tracker.get_volume(well)
    print(f"software thinks there is {vial_volume} uL of liquid in the vial")
    print("dropping tip")
    _drop_tip()

    try:
        if not cfg.blank or cfg.inspect:
            average_aspirate_evaporation_ul = 0.0
            average_dispense_evaporation_ul = 0.0
        else:
            ui.print_title("MEASURE EVAPORATION")
            print(f"running {config.NUM_BLANK_TRIALS}x blank measurements")
            actual_asp_list: List[float] = list()
            actual_disp_list: List[float] = list()
            for trial in range(config.NUM_BLANK_TRIALS):
                ui.print_header(f"BLANK {trial + 1}/{config.NUM_BLANK_TRIALS}")
                print("picking up tip")
                tip_rack = pipette.tip_racks[0]
                hover_above_tip = tip_rack["A1"].top(20)
                pipette.pick_up_tip(hover_above_tip)
                evap_aspirate, evap_dispense = _run_trial(
                    ctx,
                    pipette,
                    vial["A1"],
                    Point(),  # first channel
                    cfg.tip_volume,
                    test_volumes[-1],
                    trial,
                    recorder,
                    test_report,
                    liquid_tracker,
                    blank=True,  # stay away from the liquid
                    inspect=cfg.inspect,
                    mix=cfg.mix,
                    stable=cfg.stable,
                )
                print(
                    f"blank {trial + 1}/{config.NUM_BLANK_TRIALS}:\n"
                    f"\taspirate: {evap_aspirate} uL\n"
                    f"\tdispense: {evap_dispense} uL"
                )
                actual_asp_list.append(evap_aspirate)
                actual_disp_list.append(evap_dispense)
                print("dropping tip")
                _drop_tip()
            pipette.reset_tipracks()
            ui.print_header("EVAPORATION AVERAGE")
            average_aspirate_evaporation_ul = sum(actual_asp_list) / len(
                actual_asp_list
            )
            average_dispense_evaporation_ul = sum(actual_disp_list) / len(
                actual_disp_list
            )
            print(
                "average:\n"
                f"\taspirate: {average_aspirate_evaporation_ul} uL\n"
                f"\tdispense: {average_dispense_evaporation_ul} uL"
            )
            report.store_average_evaporation(
                test_report,
                average_aspirate_evaporation_ul,
                average_dispense_evaporation_ul,
            )
        test_count = 0
        test_total = len(test_volumes) * cfg.trials
        for volume in test_volumes:
            ui.print_title(f"{volume} uL")
            for channel in range(cfg.pipette_channels):
                channel_offset = _get_channel_offset(cfg, channel)
                actual_asp_list = list()
                actual_disp_list = list()
                for trial in range(cfg.trials):
                    test_count += 1
                    ui.print_header(f"{volume} uL ({trial + 1}/{cfg.trials})")
                    print(f"trial total {test_count}/{test_total}")
                    print("picking up tip")
                    pipette.pick_up_tip()
                    # NOTE: aspirate will be negative, dispense will be positive
                    actual_aspirate, actual_dispense = _run_trial(
                        ctx,
                        pipette,
                        vial["A1"],
                        channel_offset,
                        cfg.tip_volume,
                        volume,
                        trial,
                        recorder,
                        test_report,
                        liquid_tracker,
                        blank=False,
                        inspect=cfg.inspect,
                        mix=cfg.mix,
                        stable=cfg.stable,
                    )
                    print(
                        "measured volumes:\n"
                        f"\taspirate: {round(actual_aspirate, 2)} uL\n"
                        f"\tdispense: {round(actual_dispense, 2)} uL"
                    )
                    asp_with_evap = actual_aspirate - average_aspirate_evaporation_ul
                    disp_with_evap = actual_dispense + average_dispense_evaporation_ul
                    print(
                        "measured volumes with evaporation:\n"
                        f"\taspirate: {round(asp_with_evap, 2)} uL\n"
                        f"\tdispense: {round(disp_with_evap, 2)} uL"
                    )
                    actual_asp_list.append(asp_with_evap)
                    actual_disp_list.append(disp_with_evap)
                    report.store_trial(
                        test_report, trial, volume, asp_with_evap, disp_with_evap
                    )
                    print("dropping tip")
                    _drop_tip()

                ui.print_header(f"{volume} uL CALCULATIONS")
                # AVERAGE
                dispense_average = sum(actual_disp_list) / len(actual_disp_list)
                aspirate_average = sum(actual_asp_list) / len(actual_asp_list)
                # %CV
                if len(actual_asp_list) <= 1:
                    print("skipping CV, only 1x trial per volume")
                    aspirate_cv = -0.01  # negative number is impossible
                    dispense_cv = -0.01
                else:
                    aspirate_cv = stdev(actual_asp_list) / aspirate_average
                    dispense_cv = stdev(actual_disp_list) / dispense_average
                # %D
                aspirate_d = (aspirate_average - volume) / volume
                dispense_d = (dispense_average - volume) / volume
                print(
                    "aspirate:\n"
                    f"\tavg: {round(aspirate_average, 2)} uL\n"
                    f"\tcv: {round(aspirate_cv * 100.0, 2)}%\n"
                    f"\td: {round(aspirate_d * 100.0, 2)}%"
                )
                print(
                    "dispense:\n"
                    f"\tavg: {round(dispense_average, 2)} uL\n"
                    f"\tcv: {round(dispense_cv * 100.0, 2)}%\n"
                    f"\td: {round(dispense_d * 100.0, 2)}%"
                )
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
        print("ending recording")
        recorder.stop()
        recorder.deactivate()  # stop the server
    ui.print_title("RESULTS")
    for vol in test_volumes:
        print(f"  * {vol}:")
        for mode in ["aspirate", "dispense"]:
            avg, cv, d = report.get_volume_results(test_report, mode, vol)
            print(f"    - {mode}:")
            print(f"        avg: {avg}ul")
            print(f"        cv:  {cv}%")
            print(f"        d:   {d}%")
