"""Gravimetric."""
from inspect import getsource
from statistics import stdev
from typing import Tuple, List, Dict
from math import ceil

from opentrons.hardware_control.instruments.ot3.pipette import Pipette
from opentrons.types import Location
from opentrons.protocol_api import ProtocolContext, InstrumentContext, Well, Labware

from hardware_testing.data import create_run_id_and_start_time, ui, get_git_description
from hardware_testing.opentrons_api.types import Point, OT3Axis

from . import report
from . import config
from .helpers import get_pipette_unique_name
from .workarounds import get_latest_offset_for_labware
from .liquid_class.defaults import get_test_volumes, get_liquid_class
from .liquid_class.pipetting import (
    aspirate_with_liquid_class,
    dispense_with_liquid_class,
    PipettingCallbacks,
)
from .liquid_height.height import LiquidTracker, initialize_liquid_from_deck
from .measurement import (
    MeasurementData,
)
from .measurement.environment import get_min_reading, get_max_reading
from .tips import get_tips


_MEASUREMENTS: List[Tuple[str, MeasurementData]] = list()

TARGET_END_PHOTOPLATE_VOLUME = 200

_DYE_MAP: Dict[str, Dict[str, float]] = {
    "HV": {"min": 200.1, "max": 350},
    "A": {"min": 50, "max": 200},
    "B": {"min": 10, "max": 49.99},
    "C": {"min": 2, "max": 9.999},
    "D": {"min": 1, "max": 1.999},
}
_MIN_START_VOLUME_UL = 30000
_MIN_END_VOLUME_UL = 10000
_MAX_VOLUME_UL = 165000


def _get_dye_type(volume: float) -> str:
    dye_type = None
    for dye in _DYE_MAP.keys():
        if volume >= _DYE_MAP[dye]["min"] and volume <= _DYE_MAP[dye]["max"]:
            dye_type = dye
            break
    assert (
        dye_type is not None
    ), f"volume {volume} is outside of the available dye range"
    return dye_type


def _setup_dye(volume: float, cfg: config.PhotometricConfig) -> None:
    if volume == 250:
        # this is actually the 1000ul test
        dye_required = (volume * 4 * 96) + _MIN_END_VOLUME_UL
    else:
        dye_required = max(
            _MIN_START_VOLUME_UL, volume * 96 * cfg.trials + _MIN_END_VOLUME_UL
        )
    ui.get_user_ready(
        f"Place the {_get_dye_type(volume)} reservoir in slot {cfg.reservoir_slot}"
        f" and fill to {dye_required}ul of {_get_dye_type(volume)} dye"
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


def _check_if_software_supports_high_volumes() -> bool:
    src_a = getsource(Pipette.set_current_volume)
    src_b = getsource(Pipette.ok_to_add_volume)
    modified_a = "# assert new_volume <= self.working_volume" in src_a
    modified_b = "return True" in src_b
    return modified_a and modified_b


def _reduce_volumes_to_not_exceed_software_limit(
    test_volumes: List[float], cfg: config.PhotometricConfig
) -> List[float]:
    for i, v in enumerate(test_volumes):
        liq_cls = get_liquid_class(cfg.pipette_volume, 96, cfg.tip_volume, int(v))
        max_vol = cfg.tip_volume - liq_cls.aspirate.air_gap.trailing_air_gap
        test_volumes[i] = min(v, max_vol - 0.1)
    return test_volumes


def _get_volumes(ctx: ProtocolContext, cfg: config.PhotometricConfig) -> List[float]:
    if cfg.user_volumes and not ctx.is_simulating():
        _inp = input('Enter desired volumes, comma separated (eg: "10,100,1000") :')
        test_volumes = [
            float(vol_str) for vol_str in _inp.strip().split(",") if vol_str
        ]
    else:
        test_volumes = get_test_volumes(cfg.pipette_volume, 96, cfg.tip_volume)
    if not test_volumes:
        raise ValueError("no volumes to test, check the configuration")
    if not _check_if_software_supports_high_volumes():
        if ctx.is_simulating():
            test_volumes = _reduce_volumes_to_not_exceed_software_limit(
                test_volumes, cfg
            )
        else:
            raise RuntimeError("you are not the correct branch")
    return sorted(test_volumes, reverse=False)  # lowest volumes first


def _get_channel_offset(cfg: config.PhotometricConfig, channel: int) -> Point:
    row = channel % 8  # A-H
    col = int(float(channel) / 8.0)  # 1-12
    return Point(x=col * 9.0, y=row * 9.0)


def _load_pipette(
    ctx: ProtocolContext, cfg: config.PhotometricConfig
) -> InstrumentContext:
    pip_name = f"p{cfg.pipette_volume}_96"
    print(f'pipette "{pip_name}" on mount "{cfg.pipette_mount}"')
    pipette = ctx.load_instrument(pip_name, cfg.pipette_mount)
    assert pipette.max_volume == cfg.pipette_volume, (
        f"expected {cfg.pipette_volume} uL pipette, "
        f"but got a {pipette.max_volume} uL pipette"
    )
    # pipette.default_speed = cfg.gantry_speed
    return pipette


def _apply_labware_offsets(
    cfg: config.PhotometricConfig,
    tip_racks: List[Labware],
    photoplate: Labware,
    reservoir: Labware,
) -> None:
    def _apply(labware: Labware) -> None:
        o = get_latest_offset_for_labware(cfg.labware_offsets, labware)
        print(
            f'Apply labware offset to "{labware.name}" (slot={labware.parent}): '
            f"x={round(o.x, 2)}, y={round(o.y, 2)}, z={round(o.z, 2)}"
        )
        labware.set_calibration(o)

    _apply(photoplate)
    for rack in tip_racks:
        _apply(rack)
    _apply(reservoir)


def _load_labware(
    ctx: ProtocolContext, cfg: config.PhotometricConfig
) -> Tuple[Labware, Labware, List[Labware]]:
    print(f'Loading photoplate labware: "{cfg.photoplate}"')
    photoplate = ctx.load_labware(cfg.photoplate, location=cfg.photoplate_slot)
    tiprack_load_settings: List[Tuple[int, str]] = [
        (
            slot,
            f"opentrons_ot3_96_tiprack_{cfg.tip_volume}ul_adp",
        )
        for slot in cfg.slots_tiprack
    ]
    for ls in tiprack_load_settings:
        print(f'Loading tiprack "{ls[1]}" in slot #{ls[0]}')
    reservoir = ctx.load_labware(cfg.reservoir, location=cfg.reservoir_slot)
    tiprack_namespace = "custom_beta"
    if ctx.is_simulating():
        tiprack_namespace = "opentrons"
    tipracks = [
        ctx.load_labware(ls[1], location=ls[0], namespace=tiprack_namespace)
        for ls in tiprack_load_settings
    ]
    _apply_labware_offsets(cfg, tipracks, photoplate, reservoir)
    return photoplate, reservoir, tipracks


def _jog_to_find_liquid_height(
    ctx: ProtocolContext, pipette: InstrumentContext, well: Well
) -> float:
    _well_depth = well.depth
    _liquid_height = _well_depth
    _jog_size = -1.0
    if ctx.is_simulating():
        return _liquid_height - 1
    while True:
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


def _calculate_average(volume_list: List[float]) -> float:
    return sum(volume_list) / len(volume_list)


def _calculate_stats(
    volume_list: List[float], total_volume: float
) -> Tuple[float, float, float]:
    average = _calculate_average(volume_list)
    if len(volume_list) <= 1:
        print("skipping CV, only 1x trial per volume")
        cv = -0.01  # negative number is impossible
    else:
        cv = stdev(volume_list) / average
    d = (average - total_volume) / total_volume
    return average, cv, d


def _print_stats(mode: str, average: float, cv: float, d: float) -> None:
    print(
        f"{mode}:\n"
        f"\tavg: {round(average, 2)} uL\n"
        f"\tcv: {round(cv * 100.0, 2)}%\n"
        f"\td: {round(d * 100.0, 2)}%"
    )


def _dispense_volumes(volume: float) -> Tuple[float, float, int]:
    target_volume = 250 if volume > 800 else TARGET_END_PHOTOPLATE_VOLUME
    num_dispenses = ceil(volume / target_volume)
    volume_to_dispense = volume / num_dispenses
    return target_volume, volume_to_dispense, num_dispenses


def _run_trial(
    ctx: ProtocolContext,
    pipette: InstrumentContext,
    source: Well,
    dest: Labware,
    channel_offset: Point,
    tip_volume: int,
    volume: float,
    trial: int,
    liquid_tracker: LiquidTracker,
    blank: bool,
    inspect: bool,
    do_jog: bool,
    cfg: config.PhotometricConfig,
    mix: bool = False,
    stable: bool = True,
) -> None:
    """Aspirate dye and dispense into a photometric plate."""

    def _no_op() -> None:
        """Do Nothing."""
        return

    pipetting_callbacks = PipettingCallbacks(
        on_submerging=_no_op,
        on_mixing=_no_op,
        on_aspirating=_no_op,
        on_dispensing=_no_op,
        on_retracting=_no_op,
        on_blowing_out=_no_op,
        on_exiting=_no_op,
    )

    channel_count = 96
    # RUN INIT
    target_volume, volume_to_dispense, num_dispenses = _dispense_volumes(volume)
    photoplate_preped_vol = max(target_volume - volume_to_dispense, 0)

    pipette.move_to(location=source.top().move(channel_offset), minimum_z_height=133)
    if do_jog:
        _setup_dye(volume_to_dispense, cfg)
        _liquid_height = _jog_to_find_liquid_height(ctx, pipette, source)
        height_below_top = source.depth - _liquid_height
        print(f"liquid is {height_below_top} mm below top of reservoir")
        liquid_tracker.set_start_volume_from_liquid_height(
            source, _liquid_height, name="Dye"
        )
        reservoir_volume = liquid_tracker.get_volume(source)
        print(
            f"software thinks there is {reservoir_volume} uL of liquid in the reservoir"
        )

    # RUN ASPIRATE
    aspirate_with_liquid_class(
        ctx,
        pipette,
        tip_volume,
        volume,
        source,
        channel_offset,
        channel_count,
        liquid_tracker,
        callbacks=pipetting_callbacks,
        blank=blank,
        inspect=inspect,
        mix=mix,
    )

    for i in range(num_dispenses):

        for w in dest.wells():
            liquid_tracker.set_start_volume(w, photoplate_preped_vol)
        pipette.move_to(dest["A1"].top().move(channel_offset))

        # RUN DISPENSE
        dispense_with_liquid_class(
            ctx,
            pipette,
            tip_volume,
            volume_to_dispense,
            dest["A1"],
            channel_offset,
            channel_count,
            liquid_tracker,
            callbacks=pipetting_callbacks,
            blank=blank,
            inspect=inspect,
            mix=mix,
            added_blow_out=(i + 1) == num_dispenses,
        )
        if cfg.touch_tip:
            ui.get_user_ready("ready")
            pipette.touch_tip(speed=30)
        pipette.move_to(location=dest["A1"].top().move(Point(0, 0, 133)))
        pipette.move_to(location=dest["A1"].top().move(Point(0, 107, 133)))
        ui.get_user_ready("Cover and replace the photoplate in slot 3")
    _drop_tip(ctx, pipette, cfg)
    return


def _get_operator_name(is_simulating: bool) -> str:
    if not is_simulating:
        return input("OPERATOR name:").strip()
    else:
        return "simulation"


def _get_robot_serial(is_simulating: bool) -> str:
    if not is_simulating:
        return input("ROBOT SERIAL NUMBER:").strip()
    else:
        return "simulation-serial-number"


def _pick_up_tip(
    ctx: ProtocolContext,
    pipette: InstrumentContext,
    cfg: config.PhotometricConfig,
    location: Location,
) -> None:
    print(
        f"picking tip {location.labware.as_well().well_name} "
        f"from slot #{location.labware.parent.parent}"
    )
    pipette.pick_up_tip(location)


def _drop_tip(
    ctx: ProtocolContext, pipette: InstrumentContext, cfg: config.PhotometricConfig
) -> None:
    if cfg.return_tip:
        pipette.return_tip(home_after=False)
    else:
        pipette.drop_tip(home_after=False)


def run(ctx: ProtocolContext, cfg: config.PhotometricConfig) -> None:
    """Run."""
    run_id, start_time = create_run_id_and_start_time()
    dye_types_req: Dict[str, float] = {dye: 0 for dye in _DYE_MAP.keys()}
    test_volumes = _get_volumes(ctx, cfg)
    total_photoplates = 0
    for vol in test_volumes:
        target_volume, volume_to_dispense, _ = _dispense_volumes(vol)
        total_photoplates = total_photoplates + (ceil(vol / target_volume) * cfg.trials)
        dye_required = vol * 96 * (cfg.trials if vol < 1000 else 3)
        dye_types_req[_get_dye_type(volume_to_dispense)] += dye_required

    trial_total = len(test_volumes) * cfg.trials
    if cfg.trials > 3 and 1000 in test_volumes:
        trial_total = trial_total - cfg.trials + 3

    ui.print_header("PREPARE")
    ui.get_user_ready(
        f"Is there 1 {cfg.photoplate} on the deck and {total_photoplates-1} ready?"
    )
    ui.get_user_ready(f"Is there {total_photoplates} {cfg.photoplate} covers ready?")
    ui.get_user_ready(
        f"Is there {trial_total-cfg.trials}  extra full {cfg.tip_volume}ul tipracks?"
    )
    for dye in dye_types_req.keys():
        if dye_types_req[dye] > 0:
            dye_req = max(_MIN_START_VOLUME_UL, dye_types_req[dye] + _MIN_END_VOLUME_UL)
            ui.get_user_ready(f"Is there {dye_req}ul of dye type {dye}?")

    ui.print_header("LOAD LABWARE")
    photoplate, reservoir, tipracks = _load_labware(ctx, cfg)
    liquid_tracker = LiquidTracker()
    initialize_liquid_from_deck(ctx, liquid_tracker)

    ui.print_header("LOAD PIPETTE")
    pipette = _load_pipette(ctx, cfg)
    pipette_tag = get_pipette_unique_name(pipette)
    print(f'found pipette "{pipette_tag}"')
    if cfg.user_volumes:
        pipette_tag += "-user-volume"
    else:
        pipette_tag += "-qc"

    ui.print_header("GET PARAMETERS")
    for v in test_volumes:
        print(f"\t{v} uL")
    tips = get_tips(ctx, pipette)
    total_tips = len([tip for chnl_tips in tips.values() for tip in chnl_tips]) * len(
        test_volumes
    )

    assert (
        trial_total <= total_tips
    ), f"more trials ({trial_total}) than tips ({total_tips})"

    ui.print_header("CREATE TEST-REPORT")
    test_report = report.create_csv_test_report_photometric(
        test_volumes, cfg, run_id=run_id
    )
    test_report.set_tag(pipette_tag)
    test_report.set_operator(_get_operator_name(ctx.is_simulating()))
    serial_number = _get_robot_serial(ctx.is_simulating())
    test_report.set_version(get_git_description())
    report.store_serial_numbers_pm(
        test_report,
        robot=serial_number,
        pipette=pipette_tag,
        environment="None",
        liquid="None",
    )

    print("homing...")
    ctx.home()
    # get the first channel's first-used tip
    # NOTE: note using list.pop(), b/c tip will be re-filled by operator,
    #       and so we can use pick-up-tip from there again
    try:
        trial_count = 0
        tip_iter = 0
        for volume in test_volumes:
            ui.print_title(f"{volume} uL")
            do_jog = True
            for trial in range(cfg.trials):
                trial_count += 1
                if trial >= 3 and volume == 1000:
                    # we only do 3 1000ul tests
                    break
                ui.print_header(f"{volume} uL ({trial + 1}/{cfg.trials})")
                print(f"trial total {trial_count}/{trial_total}")
                next_tip: Well = tips[0][tip_iter]
                next_tip_location = next_tip.top()
                _pick_up_tip(ctx, pipette, cfg, location=next_tip_location)

                _run_trial(
                    ctx=ctx,
                    pipette=pipette,
                    source=reservoir["A1"],
                    dest=photoplate,
                    channel_offset=Point(),
                    tip_volume=cfg.tip_volume,
                    volume=volume,
                    trial=trial,
                    liquid_tracker=liquid_tracker,
                    blank=False,
                    inspect=cfg.inspect,
                    do_jog=do_jog,
                    cfg=cfg,
                    mix=cfg.mix,
                    stable=True,
                )
                tip_iter += 1
                if tip_iter >= len(tips[0]) and not (
                    (trial + 1) == cfg.trials and volume == test_volumes[-1]
                ):
                    ui.get_user_ready(
                        f"Replace the tipracks in slots {cfg.slots_tiprack} with new"
                        f" {cfg.tip_volume}uL tipracks"
                    )
                    tip_iter = 0
                if volume < 250:
                    do_jog = False

    finally:
        # FIXME: instead keep motors engaged, and move to an ATTACH position
        hw_api = ctx._core.get_hardware()
        hw_api.disengage_axes([OT3Axis.X, OT3Axis.Y])  # disengage xy axis
    ui.print_title("RESULTS")
