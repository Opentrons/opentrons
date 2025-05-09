"""Pipette motions."""
from dataclasses import dataclass
from typing import Optional, Callable, Tuple

from opentrons.protocol_api import InstrumentContext, ProtocolContext
from opentrons.protocol_api.labware import Well

from hardware_testing.gravimetric import config
from hardware_testing.gravimetric.workarounds import get_sync_hw_api
from hardware_testing.gravimetric.liquid_height.height import LiquidTracker
from hardware_testing.opentrons_api.types import OT3Mount, Point
from hardware_testing.opentrons_api.helpers_ot3 import clear_pipette_ul_per_mm

from .definition import LiquidClassSettings


@dataclass
class LiquidSurfaceHeights:
    """Liquid Surface Heights."""

    above: float
    below: float


@dataclass
class PipettingHeights:
    """Pipetting heights."""

    start: LiquidSurfaceHeights
    end: LiquidSurfaceHeights


@dataclass
class PipettingCallbacks:
    """Pipetting callbacks."""

    on_submerging: Callable
    on_mixing: Callable
    on_aspirating: Callable
    on_dispensing: Callable
    on_retracting: Callable
    on_blowing_out: Callable
    on_exiting: Callable


def _check_aspirate_dispense_args(
    mix: Optional[float], aspirate: Optional[float], dispense: Optional[float]
) -> None:
    if mix is None and aspirate is None and dispense is None:
        raise ValueError("either mix, aspirate or dispense volume must be set")
    if aspirate and dispense or mix and aspirate or mix and dispense:
        raise ValueError("only a mix, aspirate or dispense volumes can be set")


def _get_approach_submerge_retract_heights(
    well: Well,
    liquid_tracker: LiquidTracker,
    submerge_mm: float,
    retract_mm: float,
    mix: Optional[float],
    aspirate: Optional[float],
    dispense: Optional[float],
    blank: bool,
    channel_count: int,
) -> Tuple[float, float, float]:

    liquid_before, liquid_after = liquid_tracker.get_before_and_after_heights(
        well,
        aspirate=aspirate if aspirate else 0,
        dispense=dispense,
        channels=channel_count,
    )
    if blank:
        # force the pipette to move above the well
        liquid_before = well.depth + (well.depth - liquid_before)
        liquid_after = well.depth + (well.depth - liquid_after)

    if dispense and submerge_mm > 0:
        # guarantee NON-contact dispensing does not touch liquid
        submerge = liquid_after + submerge_mm
    else:
        # guarantee CONTACT dispensing and aspirates stay submerged
        submerge = min(liquid_before, liquid_after) + submerge_mm
    # also make sure it doesn't hit the well's bottom
    submerge = max(submerge, config.LABWARE_BOTTOM_CLEARANCE)
    approach = max(liquid_before + retract_mm, submerge)
    retract = max(liquid_after + retract_mm, submerge)
    return approach, submerge, retract


def _submerge(
    pipette: InstrumentContext,
    well: Well,
    height: float,
    channel_offset: Point,
    speed: float,
) -> None:
    pipette.move_to(
        well.bottom(height).move(channel_offset),
        speed=speed,
    )


def _retract(
    ctx: ProtocolContext,
    pipette: InstrumentContext,
    well: Well,
    channel_offset: Point,
    mm_above_well_bottom: float,
    speed: float,
) -> None:
    # retract out of the liquid (not out of the well)
    pipette.move_to(well.bottom(mm_above_well_bottom).move(channel_offset), speed=speed)


def _pipette_with_liquid_settings(  # noqa: C901
    ctx: ProtocolContext,
    pipette: InstrumentContext,
    liquid_class: LiquidClassSettings,
    well: Well,
    channel_offset: Point,
    channel_count: int,
    liquid_tracker: LiquidTracker,
    callbacks: PipettingCallbacks,
    mix: Optional[float] = None,
    aspirate: Optional[float] = None,
    dispense: Optional[float] = None,
    blank: bool = True,
    touch_tip: bool = False,
    mode: str = "",
    clear_accuracy_function: bool = False,
    pose_for_camera: bool = False,
) -> None:
    """Run a pipette given some Pipetting Liquid Settings."""
    # FIXME: stop using hwapi, and get those functions into core software
    hw_api = get_sync_hw_api(ctx)
    hw_mount = OT3Mount.LEFT if pipette.mount == "left" else OT3Mount.RIGHT
    hw_pipette = hw_api.hardware_pipettes[hw_mount.to_mount()]

    def _get_max_blow_out_ul() -> float:
        # NOTE: calculated using blow-out distance (mm) and the nominal ul-per-mm
        blow_out_ul_per_mm = hw_pipette.config.shaft_ul_per_mm
        bottom = hw_pipette.plunger_positions.bottom
        blow_out = hw_pipette.plunger_positions.blow_out
        return (blow_out - bottom) * blow_out_ul_per_mm

    assert liquid_class.aspirate.delay is not None
    assert liquid_class.dispense.delay is not None
    assert liquid_class.dispense.push_out is not None
    assert liquid_class.aspirate.flow_rate is not None
    assert liquid_class.dispense.flow_rate is not None
    assert liquid_class.aspirate.z_speed is not None
    assert liquid_class.dispense.z_speed is not None
    assert liquid_class.aspirate.submerge_mm is not None
    assert liquid_class.aspirate.retract_mm is not None
    assert liquid_class.dispense.submerge_mm is not None
    assert liquid_class.dispense.retract_mm is not None

    aspirate_delay = (
        0 if not liquid_class.aspirate.delay else liquid_class.aspirate.delay
    )
    dispense_delay = (
        0 if not liquid_class.dispense.delay else liquid_class.dispense.delay
    )
    dispense_retract_delay = (
        liquid_class.dispense.retract_delay
        if liquid_class.dispense.retract_delay
        else 0
    )
    _po = liquid_class.dispense.push_out
    push_out = min(_po if _po else 0, _get_max_blow_out_ul())
    retract_delay = (
        liquid_class.aspirate.retract_delay
        if liquid_class.aspirate.retract_delay
        else 0
    )
    aspirate_submerge_mm = (
        liquid_class.aspirate.submerge_mm if liquid_class.aspirate.submerge_mm else 0
    )
    dispense_submerge_mm = (
        liquid_class.dispense.submerge_mm if liquid_class.dispense.submerge_mm else 0
    )
    air_gap = liquid_class.aspirate.air_gap if liquid_class.aspirate.air_gap else 0
    aspirate_flow_rate = liquid_class.aspirate.flow_rate
    dispense_flow_rate = liquid_class.dispense.flow_rate

    # ASPIRATE/DISPENSE SEQUENCE HAS THREE PHASES:
    #  1. APPROACH
    #  2. SUBMERGE
    #  3. RETRACT

    # CALCULATE TIP HEIGHTS FOR EACH PHASE
    if aspirate:
        defined_submerge_mm = liquid_class.aspirate.submerge_mm
        defined_retract_mm = liquid_class.aspirate.retract_mm
    else:
        defined_submerge_mm = liquid_class.dispense.submerge_mm
        defined_retract_mm = liquid_class.dispense.retract_mm
    approach_mm, submerge_mm, retract_mm = _get_approach_submerge_retract_heights(
        well,
        liquid_tracker,
        defined_submerge_mm,
        defined_retract_mm,
        mix,
        aspirate,
        dispense,
        blank,
        channel_count,
    )
    if pose_for_camera:
        retract_mm = well.depth
        approach_mm = max(approach_mm, retract_mm)
        assert liquid_class.dispense.submerge_mm is not None
        if dispense and liquid_class.dispense.submerge_mm > 2:
            submerge_mm = well.depth

    # SET Z SPEEDS DURING SUBMERGE/RETRACT
    if aspirate or mix:
        submerge_speed = (
            liquid_class.aspirate.z_speed if liquid_class.aspirate.z_speed else 0
        )
        retract_speed = (
            liquid_class.aspirate.z_speed if liquid_class.aspirate.z_speed else 0
        )
    else:
        submerge_speed = (
            liquid_class.dispense.z_speed if liquid_class.dispense.z_speed else 0
        )
        retract_speed = (
            liquid_class.dispense.z_speed if liquid_class.dispense.z_speed else 0
        )

    # CREATE CALLBACKS FOR EACH PHASE
    def _aspirate_on_approach() -> None:
        if hw_pipette.current_volume > 0:
            print(
                "WARNING: removing trailing air-gap from pipette, "
                "this should only happen during blank trials"
            )
            pipette.dispense(volume=pipette.current_volume)
        if mode:
            # NOTE: increment test requires the plunger's "bottom" position
            #       does not change during the entire test run
            hw_api.set_liquid_class(hw_mount, mode)
        else:
            cfg_volume: float = aspirate if aspirate else dispense  # type: ignore[assignment]
            pipette.configure_for_volume(cfg_volume)
        if clear_accuracy_function:
            clear_pipette_ul_per_mm(hw_api, hw_mount)  # type: ignore[arg-type]
        pipette.prepare_to_aspirate()

    def _aspirate_on_mix() -> None:
        callbacks.on_mixing()
        _submerge(pipette, well, submerge_mm, channel_offset, submerge_speed)
        _num_mixes = 5
        for i in range(_num_mixes):
            pipette.aspirate(mix)
            ctx.delay(aspirate_delay)
            if i < _num_mixes - 1:
                pipette.dispense(mix)
            else:
                pipette.dispense(dispense, push_out=push_out)
            ctx.delay(dispense_delay)
        # don't go all the way up to retract position, but instead just above liquid
        _retract(ctx, pipette, well, channel_offset, approach_mm, retract_speed)
        pipette.blow_out()
        pipette.prepare_to_aspirate()
        assert pipette.current_volume == 0

    def _aspirate_on_submerge() -> None:
        # aspirate specified volume
        callbacks.on_aspirating()
        pipette.aspirate(aspirate)
        # delay
        ctx.delay(aspirate_delay)
        # update liquid-height tracker
        liquid_tracker.update_affected_wells(
            well, aspirate=aspirate, channels=channel_count
        )

    def _aspirate_on_retract() -> None:
        if retract_delay and aspirate_submerge_mm < 0:
            # NOTE: residual liquid on outside of tip will drop down to bottom of tip
            #       after retracting from liquid. If we air-gap too soon before
            #       said liquid slides down to bottom of tip, the air-gap we create
            #       will be encased by liquid at the bottom after the residual liquid
            #       does eventually slide down. So instead, wait for it to slide down,
            #       then air-gap, thus pulling it also up into the pipette. To reduce
            #       the residual volume, the aspirate submerge depth is reduced.
            ctx.delay(seconds=retract_delay)
        # add trailing-air-gap
        if not blank and air_gap > 0:
            pipette.flow_rate.aspirate = max(air_gap, 1)  # 1 second (minimum)
            pipette.aspirate(air_gap)
            pipette.flow_rate.aspirate = aspirate_flow_rate

    def _dispense_on_approach() -> None:
        # remove trailing-air-gap if:
        #  1) not a "blank" trial
        #  2) currently holds an air-gap
        #  3) contact dispensing (below meniscus)
        has_air_gap = air_gap > 0
        # NOTE: it is preferable to INCLUDE the air-gap with the actual dispense
        #       during a NON-CONTACT dispense, b/c the liquid will first exit
        #       the tip at a faster speed, reducing the chance of the liquid
        #       adhering to outside of tip.
        likely_a_contact_dispense = dispense_submerge_mm <= 1
        if not blank and has_air_gap and likely_a_contact_dispense:
            pipette.flow_rate.dispense = max(air_gap, 1)  # 1 second (minimum)
            pipette.dispense(air_gap)
            pipette.flow_rate.dispense = dispense_flow_rate

    def _dispense_on_submerge() -> None:
        callbacks.on_dispensing()
        # FIXME: hack to enable "break-off" deceleration during dispense
        #        ideally this would only decelerate, while acceleration
        #        would remain at the higher default "flow-acceleration"
        #        from shared-data
        default_flow_accel = float(hw_pipette.flow_acceleration)
        try:
            push_out: Optional[float] = liquid_class.dispense.push_out
            assert (
                push_out is None or push_out <= _get_max_blow_out_ul()
            ), f"push-out ({push_out}) cannot exceed {_get_max_blow_out_ul()}"
            if liquid_class.dispense.break_off_flow_acceleration:
                hw_pipette.flow_acceleration = (
                    liquid_class.dispense.break_off_flow_acceleration
                )
            hw_api.dispense(hw_mount, push_out=push_out)
            pipette.dispense(push_out=push_out)
        finally:
            hw_pipette.flow_acceleration = default_flow_accel
        # delay
        _delay_seconds = float(dispense_delay)
        if dispense_submerge_mm >= 0:
            # NOTE: include retract delay if dispense is non-contact
            _delay_seconds = max(dispense_delay, dispense_retract_delay)
        ctx.delay(_delay_seconds)
        # update liquid-height tracker
        liquid_tracker.update_affected_wells(
            well, dispense=dispense, channels=channel_count
        )

    def _dispense_on_retract() -> None:
        if dispense_retract_delay and dispense_submerge_mm < 0:
            # NOTE: if non-contact dispense, the "retract" delay should have already happened
            ctx.delay(seconds=dispense_retract_delay)
        # NOTE: both the plunger reset or tje trailing-air-gap
        #       pull remaining droplets inside the tip upwards
        if pipette.current_volume <= 0:
            # NOTE: yes, liquid would get pulled up
            if liquid_class.dispense.blow_out:
                callbacks.on_blowing_out()
                pipette.blow_out()
            pipette.flow_rate.aspirate = min(push_out, 1)
            pipette.prepare_to_aspirate()
            pipette.flow_rate.aspirate = aspirate_flow_rate
        else:
            pipette.air_gap(air_gap, height=0)
        if touch_tip:
            pipette.touch_tip(speed=config.TOUCH_TIP_SPEED)

    # PHASE 1: APPROACH
    pipette.flow_rate.aspirate = aspirate_flow_rate
    pipette.flow_rate.dispense = dispense_flow_rate
    pipette.flow_rate.blow_out = dispense_flow_rate  # FIXME: is this correct?

    pipette.move_to(well.bottom(approach_mm).move(channel_offset))
    _aspirate_on_approach() if aspirate or mix else _dispense_on_approach()

    if mix:
        # PHASE 2A: MIXING
        _aspirate_on_mix()
    else:
        # PHASE 2B: ASPIRATE or DISPENSE
        callbacks.on_submerging()
        _submerge(pipette, well, submerge_mm, channel_offset, submerge_speed)
        _aspirate_on_submerge() if aspirate else _dispense_on_submerge()

        # PHASE 3: RETRACT
        callbacks.on_retracting()
        _retract(ctx, pipette, well, channel_offset, retract_mm, retract_speed)
        _aspirate_on_retract() if aspirate else _dispense_on_retract()

    # EXIT
    callbacks.on_exiting()


def mix_with_liquid_class(
    ctx: ProtocolContext,
    liquid_class: LiquidClassSettings,
    pipette: InstrumentContext,
    mix_volume: float,
    well: Well,
    channel_offset: Point,
    channel_count: int,
    liquid_tracker: LiquidTracker,
    callbacks: PipettingCallbacks,
    blank: bool = False,
    touch_tip: bool = False,
    mode: str = "",
    clear_accuracy_function: bool = False,
    pose_for_camera: bool = False,
) -> None:
    """Mix with liquid class."""
    _pipette_with_liquid_settings(
        ctx,
        pipette,
        liquid_class,
        well,
        channel_offset,
        channel_count,
        liquid_tracker,
        callbacks,
        mix=mix_volume,
        blank=blank,
        touch_tip=touch_tip,
        mode=mode,
        clear_accuracy_function=clear_accuracy_function,
        pose_for_camera=pose_for_camera,
    )


def aspirate_with_liquid_class(
    ctx: ProtocolContext,
    liquid_class: LiquidClassSettings,
    pipette: InstrumentContext,
    aspirate_volume: float,
    well: Well,
    channel_offset: Point,
    channel_count: int,
    liquid_tracker: LiquidTracker,
    callbacks: PipettingCallbacks,
    blank: bool = False,
    touch_tip: bool = False,
    mode: str = "",
    clear_accuracy_function: bool = False,
    pose_for_camera: bool = False,
) -> None:
    """Aspirate with liquid class."""
    _pipette_with_liquid_settings(
        ctx,
        pipette,
        liquid_class,
        well,
        channel_offset,
        channel_count,
        liquid_tracker,
        callbacks,
        aspirate=aspirate_volume,
        blank=blank,
        touch_tip=touch_tip,
        mode=mode,
        clear_accuracy_function=clear_accuracy_function,
        pose_for_camera=pose_for_camera,
    )


def dispense_with_liquid_class(
    ctx: ProtocolContext,
    liquid_class: LiquidClassSettings,
    pipette: InstrumentContext,
    dispense_volume: float,
    well: Well,
    channel_offset: Point,
    channel_count: int,
    liquid_tracker: LiquidTracker,
    callbacks: PipettingCallbacks,
    blank: bool = False,
    touch_tip: bool = False,
    mode: str = "",
    clear_accuracy_function: bool = False,
    pose_for_camera: bool = False,
) -> None:
    """Dispense with liquid class."""
    _pipette_with_liquid_settings(
        ctx,
        pipette,
        liquid_class,
        well,
        channel_offset,
        channel_count,
        liquid_tracker,
        callbacks,
        dispense=dispense_volume,
        blank=blank,
        touch_tip=touch_tip,
        mode=mode,
        clear_accuracy_function=clear_accuracy_function,
        pose_for_camera=pose_for_camera,
    )
