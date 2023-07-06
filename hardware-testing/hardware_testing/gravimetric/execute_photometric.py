"""Gravimetric."""
from typing import Tuple, List, Dict
from math import ceil

from opentrons.protocol_api import ProtocolContext, InstrumentContext, Well, Labware


from hardware_testing.data.csv_report import CSVReport
from hardware_testing.data import create_run_id_and_start_time, ui, get_git_description
from hardware_testing.opentrons_api.types import Point
from .measurement import (
    MeasurementType,
    create_measurement_tag,
    EnvironmentData,
)
from .measurement.environment import read_environment_data
from . import report
from . import config
from .helpers import (
    get_pipette_unique_name,
    _get_operator_name,
    _get_robot_serial,
    _jog_to_find_liquid_height,
    _get_tip_batch,
    _apply_labware_offsets,
    _pick_up_tip,
    _drop_tip,
    _get_volumes,
    _load_pipette,
    _load_tipracks,
)
from .liquid_class.pipetting import (
    aspirate_with_liquid_class,
    dispense_with_liquid_class,
    PipettingCallbacks,
)
from .liquid_height.height import LiquidTracker, initialize_liquid_from_deck

from .tips import get_tips


_MEASUREMENTS: List[Tuple[str, EnvironmentData]] = list()

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


def _load_labware(
    ctx: ProtocolContext, cfg: config.PhotometricConfig
) -> Tuple[Labware, Labware, List[Labware]]:
    print(f'Loading photoplate labware: "{cfg.photoplate}"')
    photoplate = ctx.load_labware(cfg.photoplate, location=cfg.photoplate_slot)
    reservoir = ctx.load_labware(cfg.reservoir, location=cfg.reservoir_slot)
    tipracks = _load_tipracks(ctx, cfg, use_adapters=True)
    _apply_labware_offsets(cfg, [photoplate, reservoir])
    return photoplate, reservoir, tipracks


def _dispense_volumes(volume: float) -> Tuple[float, float, int]:
    num_dispenses = ceil(volume / 250)
    volume_to_dispense = volume / num_dispenses
    target_volume = min(max(volume_to_dispense, 200), 250)
    return target_volume, volume_to_dispense, num_dispenses


def _run_trial(
    ctx: ProtocolContext,
    test_report: CSVReport,
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

    def _tag(m_type: MeasurementType) -> str:
        return create_measurement_tag(m_type, volume, 0, trial)

    def _record_measurement_and_store(m_type: MeasurementType) -> EnvironmentData:
        m_tag = _tag(m_type)
        m_data = read_environment_data(cfg.pipette_mount, ctx.is_simulating())
        report.store_measurements_pm(test_report, m_tag, m_data)
        _MEASUREMENTS.append(
            (
                m_tag,
                m_data,
            )
        )
        return m_data

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

    if num_dispenses > 1 and not ctx.is_simulating():
        # TODO: Likely will not test 1000 uL in the near-term,
        #       but eventually we'll want to be more helpful here in prompting
        #       what volumes need to be added between trials.
        ui.get_user_ready("check DYE is enough")

    _record_measurement_and_store(MeasurementType.INIT)
    pipette.move_to(location=source.top().move(channel_offset), minimum_z_height=133)
    while do_jog:
        required_ul = max(
            (volume * channel_count * cfg.trials) + _MIN_END_VOLUME_UL,
            _MIN_START_VOLUME_UL,
        )
        if not ctx.is_simulating():
            _liquid_height = _jog_to_find_liquid_height(ctx, pipette, source)
            height_below_top = source.depth - _liquid_height
            print(f"liquid is {height_below_top} mm below top of reservoir")
            liquid_tracker.set_start_volume_from_liquid_height(
                source, _liquid_height, name="Dye"
            )
        else:
            liquid_tracker.set_start_volume(source, required_ul)
        reservoir_ul = liquid_tracker.get_volume(source)
        print(
            f"software thinks there is {round(reservoir_ul / 1000, 1)} mL "
            f"of liquid in the reservoir (required = {round(required_ul / 1000, 1)} ml)"
        )
        if required_ul <= reservoir_ul < _MAX_VOLUME_UL:
            break
        elif required_ul > _MAX_VOLUME_UL:
            raise NotImplementedError(
                f"too many trials ({cfg.trials}) at {volume} uL, "
                f"refilling reservoir is currently not supported"
            )
        elif reservoir_ul < required_ul:
            error_msg = (
                f"not enough volume in reservoir to aspirate {volume} uL "
                f"across {channel_count}x channels for {cfg.trials}x trials"
            )
            if ctx.is_simulating():
                raise ValueError(error_msg)
            ui.print_error(error_msg)
            pipette.move_to(location=source.top(100).move(channel_offset))
            difference_ul = required_ul - reservoir_ul
            ui.get_user_ready(
                f"ADD {round(difference_ul / 1000.0, 1)} mL more liquid to RESERVOIR"
            )
            pipette.move_to(location=source.top().move(channel_offset))
        else:
            raise RuntimeError(
                f"bad volume in reservoir: {round(reservoir_ul / 1000, 1)} ml"
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
        touch_tip=False,
    )

    _record_measurement_and_store(MeasurementType.ASPIRATE)
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
            touch_tip=cfg.touch_tip,
        )
        _record_measurement_and_store(MeasurementType.DISPENSE)
        pipette.move_to(location=dest["A1"].top().move(Point(0, 0, 133)))
        if (i + 1) == num_dispenses:
            _drop_tip(ctx, pipette, cfg)
        else:
            pipette.move_to(location=dest["A1"].top().move(Point(0, 107, 133)))
        if not ctx.is_simulating():
            ui.get_user_ready("add SEAL to plate and remove from DECK")
    return


def _display_dye_information(
    ctx: ProtocolContext,
    dye_types_req: Dict[str, float],
    refill: bool,
    include_hv: bool,
) -> None:
    for dye in dye_types_req.keys():
        transfered_ul = dye_types_req[dye]
        reservoir_ul = max(_MIN_START_VOLUME_UL, transfered_ul + _MIN_END_VOLUME_UL)
        leftover_ul = reservoir_ul - transfered_ul

        def _ul_to_ml(x: float) -> float:
            return round(x / 1000.0, 1)

        if dye_types_req[dye] > 0:
            if refill:
                # only add the minimum required volume
                print(f' * {_ul_to_ml(leftover_ul)} mL "{dye}" LEFTOVER in reservoir')
                if not ctx.is_simulating():
                    ui.get_user_ready(
                        f'[refill] ADD {_ul_to_ml(transfered_ul)} mL more DYE type "{dye}"'
                    )
            else:
                # add minimum required volume PLUS labware's dead-volume
                if not ctx.is_simulating():
                    dye_msg = 'A" or "HV' if include_hv and dye == "A" else dye
                    ui.get_user_ready(
                        f'add {_ul_to_ml(reservoir_ul)} mL of DYE type "{dye_msg}"'
                    )


def run(ctx: ProtocolContext, cfg: config.PhotometricConfig) -> None:
    """Run."""
    run_id, start_time = create_run_id_and_start_time()
    dye_types_req: Dict[str, float] = {dye: 0 for dye in _DYE_MAP.keys()}
    test_volumes = _get_volumes(ctx, cfg)
    total_photoplates = 0
    for vol in test_volumes:
        target_volume, volume_to_dispense, num_dispenses = _dispense_volumes(vol)
        total_photoplates += num_dispenses * cfg.trials
        dye_per_vol = vol * 96 * cfg.trials
        dye_types_req[_get_dye_type(volume_to_dispense)] += dye_per_vol

    trial_total = len(test_volumes) * cfg.trials

    ui.print_header("LOAD LABWARE")
    photoplate, reservoir, tipracks = _load_labware(ctx, cfg)
    liquid_tracker = LiquidTracker()
    initialize_liquid_from_deck(ctx, liquid_tracker)

    ui.print_header("LOAD PIPETTE")
    pipette = _load_pipette(ctx, cfg)
    pipette_tag = get_pipette_unique_name(pipette)
    print(f"found pipette: {pipette_tag}")
    if not ctx.is_simulating():
        ui.get_user_ready("create pipette QR code")
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

    def _next_tip() -> Well:
        nonlocal tips
        if not len(tips[0]):
            if not ctx.is_simulating():
                ui.get_user_ready(f"replace TIPRACKS in slots {cfg.slots_tiprack}")
            tips = get_tips(ctx, pipette)
        return tips[0].pop(0)

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
    tip_batch = _get_tip_batch(ctx.is_simulating())
    test_report.set_version(get_git_description())
    report.store_serial_numbers_pm(
        test_report,
        robot=serial_number,
        pipette=pipette_tag,
        tips=tip_batch,
        environment="None",
        liquid="None",
    )

    ui.print_header("PREPARE")
    can_swap_a_for_hv = not [
        v for v in test_volumes if _DYE_MAP["A"]["min"] <= v < _DYE_MAP["A"]["max"]
    ]
    _display_dye_information(ctx, dye_types_req, cfg.refill, can_swap_a_for_hv)

    print("homing...")
    ctx.home()
    pipette.home_plunger()
    # get the first channel's first-used tip
    # NOTE: note using list.pop(), b/c tip will be re-filled by operator,
    #       and so we can use pick-up-tip from there again
    try:
        trial_count = 0
        for volume in test_volumes:
            ui.print_title(f"{volume} uL")
            do_jog = True
            for trial in range(cfg.trials):
                trial_count += 1
                ui.print_header(f"{volume} uL ({trial + 1}/{cfg.trials})")
                print(f"trial total {trial_count}/{trial_total}")
                if not ctx.is_simulating():
                    ui.get_user_ready(f"put PLATE #{trial + 1} and remove SEAL")
                next_tip: Well = _next_tip()
                next_tip_location = next_tip.top()
                _pick_up_tip(ctx, pipette, cfg, location=next_tip_location)

                _run_trial(
                    ctx=ctx,
                    test_report=test_report,
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
                if volume < 250:
                    do_jog = False

    finally:
        ui.print_title("CHANGE PIPETTES")
        if pipette.has_tip:
            if pipette.current_volume > 0:
                print("dispensing liquid to trash")
                trash = pipette.trash_container.wells()[0]
                # FIXME: this should be a blow_out() at max volume,
                #        but that is not available through PyAPI yet
                #        so instead just dispensing.
                pipette.dispense(pipette.current_volume, trash.top())
                pipette.aspirate(10)  # to pull any droplets back up
            print("dropping tip")
            _drop_tip(ctx, pipette, cfg)
        print("moving to attach position")
        pipette.move_to(ctx.deck.position_for(5).move(Point(x=0, y=9 * 7, z=150)))
