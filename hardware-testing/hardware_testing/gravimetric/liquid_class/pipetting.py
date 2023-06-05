"""Pipette motions."""
from dataclasses import dataclass
from math import pi
from typing import Optional, Callable, Tuple

from opentrons.hardware_control.motion_utilities import target_position_from_plunger

from opentrons.protocol_api import InstrumentContext, ProtocolContext
from opentrons.protocol_api.labware import Well

from hardware_testing.gravimetric import config
from hardware_testing.gravimetric.liquid_height.height import LiquidTracker
from hardware_testing.opentrons_api.types import OT3Mount, Point

from .definition import LiquidClassSettings
from .defaults import get_liquid_class


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


def _get_heights_in_well(
    height_before: float,
    height_after: float,
    submerge: float,
    retract: float,
) -> Tuple[float, float, float]:
    pipetting_heights = PipettingHeights(
        start=LiquidSurfaceHeights(
            above=max(height_before + retract, config.LABWARE_BOTTOM_CLEARANCE),
            below=max(height_before - submerge, config.LABWARE_BOTTOM_CLEARANCE),
        ),
        end=LiquidSurfaceHeights(
            above=max(height_after + retract, config.LABWARE_BOTTOM_CLEARANCE),
            below=max(height_after - submerge, config.LABWARE_BOTTOM_CLEARANCE),
        ),
    )
    approach = max(pipetting_heights.start.above, pipetting_heights.end.below)
    submerge = pipetting_heights.end.below
    retract = pipetting_heights.end.above
    return approach, submerge, retract


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


def _do_user_pause(ctx: ProtocolContext, inspect: bool, msg: str = "") -> None:
    if not ctx.is_simulating() and inspect:
        input(f"{msg}, ENTER to continue")


def _check_aspirate_dispense_args(
    aspirate: Optional[float], dispense: Optional[float]
) -> None:
    if aspirate is None and dispense is None:
        raise ValueError("either a aspirate or dispense volume must be set")
    if aspirate and dispense:
        raise ValueError("both aspirate and dispense volumes cannot be set together")


def _get_approach_submerge_retract_heights(
    pipette: InstrumentContext,
    well: Well,
    liquid_tracker: LiquidTracker,
    liquid_class: LiquidClassSettings,
    aspirate: Optional[float],
    dispense: Optional[float],
    blank: bool,
    channel_count: int,
) -> Tuple[float, float, float]:
    liquid_before, liquid_after = liquid_tracker.get_before_and_after_heights(
        well,
        aspirate=aspirate,
        dispense=dispense,
        channels=channel_count,
    )
    if blank:
        # force the pipette to move above the well
        liquid_before = well.depth + (well.depth - liquid_before)
        liquid_after = well.depth + (well.depth - liquid_after)
    if aspirate:
        liq_submerge = liquid_class.aspirate.submerge
        liq_retract = liquid_class.aspirate.retract
    else:
        liq_submerge = liquid_class.dispense.submerge
        liq_retract = liquid_class.dispense.retract
    approach_mm, submerge_mm, retract_mm = _get_heights_in_well(
        liquid_before, liquid_after, liq_submerge, liq_retract
    )
    return approach_mm, submerge_mm, retract_mm


def _submerge(
    pipette: InstrumentContext,
    well: Well,
    height: float,
    channel_offset: Point,
    speed: float,
) -> None:
    pipette.move_to(
        well.bottom(height).move(channel_offset),
        force_direct=True,
        speed=speed,
    )


def _retract(
    pipette: InstrumentContext,
    well: Well,
    height: float,
    channel_offset: Point,
    speed: float,
) -> None:
    pipette.move_to(
        well.bottom(height).move(channel_offset),
        force_direct=True,
        speed=speed,
    )
    pipette.move_to(
        well.top().move(channel_offset),
        force_direct=True,
    )


def _pipette_with_liquid_settings(
    ctx: ProtocolContext,
    pipette: InstrumentContext,
    liquid_class: LiquidClassSettings,
    well: Well,
    channel_offset: Point,
    channel_count: int,
    liquid_tracker: LiquidTracker,
    callbacks: PipettingCallbacks,
    aspirate: Optional[float] = None,
    dispense: Optional[float] = None,
    blank: bool = True,
    inspect: bool = False,
    mix: bool = False,
) -> None:
    """Run a pipette given some Pipetting Liquid Settings."""
    _check_aspirate_dispense_args(aspirate, dispense)

    def _dispense_with_added_blow_out() -> None:
        # dispense all liquid, plus some air by calling `pipette.blow_out(location, volume)`
        # TODO: if P50 has droplets inside the tip after dispense with a full blow-out,
        #       try increasing the blow-out volume by raising the "bottom" plunger position
        # FIXME: this is a hack, until there's an equivalent `pipette.blow_out(location, volume)`
        hw_api = ctx._core.get_hardware()
        hw_mount = OT3Mount.LEFT if pipette.mount == "left" else OT3Mount.RIGHT
        pip = hw_api.hardware_pipettes[hw_mount.to_mount()]
        assert pip is not None
        shaft_diameter = 4.5 if pipette.max_volume >= 1000 else 1
        ul_per_mm = pi * pow(shaft_diameter / 2, 2)
        dist_mm = liquid_class.aspirate.air_gap.leading_air_gap / ul_per_mm
        target_pos = target_position_from_plunger(
            hw_mount, pip.plunger_positions.bottom + dist_mm, hw_api._current_position
        )
        hw_api._move(
            target_pos,
            speed=pipette.flow_rate.dispense / ul_per_mm,
            home_flagged_axes=False,
        )
        pip.set_current_volume(0)
        pip.ready_to_aspirate = False

    # ASPIRATE/DISPENSE SEQUENCE HAS THREE PHASES:
    #  1. APPROACH
    #  2. SUBMERGE
    #  3. RETRACT

    # CALCULATE TIP HEIGHTS FOR EACH PHASE
    approach_mm, submerge_mm, retract_mm = _get_approach_submerge_retract_heights(
        pipette,
        well,
        liquid_tracker,
        liquid_class,
        aspirate,
        dispense,
        blank,
        channel_count,
    )

    # SET Z SPEEDS DURING SUBMERGE/RETRACT
    if aspirate:
        submerge_speed = config.TIP_SPEED_WHILE_SUBMERGING_ASPIRATE
        retract_speed = config.TIP_SPEED_WHILE_RETRACTING_ASPIRATE
    else:
        submerge_speed = config.TIP_SPEED_WHILE_SUBMERGING_DISPENSE
        retract_speed = config.TIP_SPEED_WHILE_RETRACTING_DISPENSE

    # CREATE CALLBACKS FOR EACH PHASE
    def _aspirate_on_approach() -> None:
        # set plunger speeds
        pipette.flow_rate.aspirate = liquid_class.aspirate.flow_rate
        pipette.flow_rate.dispense = liquid_class.dispense.flow_rate
        # Note: Here, we previously would aspirate some air, to account for the leading-air-gap.
        #       However, we can instead use the already-present air between the pipette's
        #       "bottom" and "blow-out" plunger positions. This would require the `pipette.blow_out`
        #       method to accept a microliter amount as an optional argument.
        # Advantage: guarantee all aspirations begin at same position, helping low-volume accuracy.
        # Disadvantage: limit our max leading-air-gap volume, potentially leaving droplets behind.

    def _aspirate_on_submerge() -> None:
        # mix 5x times
        callbacks.on_mixing()
        if mix:
            for i in range(config.NUM_MIXES_BEFORE_ASPIRATE):
                pipette.aspirate(aspirate)
                pipette.dispense(aspirate)
                _retract(
                    pipette, well, approach_mm, channel_offset, retract_speed
                )  # retract to the approach height
                pipette.blow_out().aspirate(pipette.min_volume).dispense()
                _submerge(pipette, well, submerge_mm, channel_offset, submerge_speed)
        # aspirate specified volume
        callbacks.on_aspirating()
        pipette.aspirate(aspirate)
        # update liquid-height tracker
        liquid_tracker.update_affected_wells(
            well, aspirate=aspirate, channels=channel_count
        )
        # delay
        ctx.delay(liquid_class.aspirate.delay)

    def _aspirate_on_retract() -> None:
        # add trailing-air-gap
        pipette.aspirate(liquid_class.aspirate.air_gap.trailing_air_gap)

    def _dispense_on_approach() -> None:
        _do_user_pause(ctx, inspect, "about to dispense")
        # remove trailing-air-gap
        pipette.dispense(liquid_class.aspirate.air_gap.trailing_air_gap)

    def _dispense_on_submerge() -> None:
        callbacks.on_dispensing()
        _dispense_with_added_blow_out()
        # update liquid-height tracker
        liquid_tracker.update_affected_wells(
            well, dispense=dispense, channels=channel_count
        )
        # delay
        ctx.delay(liquid_class.dispense.delay)
        _do_user_pause(ctx, inspect, "about to retract")

    def _dispense_on_retract() -> None:
        # blow-out any remaining air in pipette (any reason why not?)
        callbacks.on_blowing_out()
        _do_user_pause(ctx, inspect, "about to blow-out")
        pipette.blow_out()

    # PHASE 1: APPROACH
    pipette.move_to(well.bottom(approach_mm).move(channel_offset))
    _aspirate_on_approach() if aspirate else _dispense_on_approach()

    # PHASE 2: SUBMERGE
    callbacks.on_submerging()
    _submerge(pipette, well, submerge_mm, channel_offset, submerge_speed)
    _aspirate_on_submerge() if aspirate else _dispense_on_submerge()

    # PHASE 3: RETRACT
    callbacks.on_retracting()
    _retract(pipette, well, retract_mm, channel_offset, retract_speed)
    _aspirate_on_retract() if aspirate else _dispense_on_retract()

    # EXIT
    callbacks.on_exiting()
    pipette.move_to(well.top().move(channel_offset), force_direct=True)


def aspirate_with_liquid_class(
    ctx: ProtocolContext,
    pipette: InstrumentContext,
    tip_volume: int,
    aspirate_volume: float,
    well: Well,
    channel_offset: Point,
    channel_count: int,
    liquid_tracker: LiquidTracker,
    callbacks: PipettingCallbacks,
    blank: bool = False,
    inspect: bool = False,
    mix: bool = False,
) -> None:
    """Aspirate with liquid class."""
    liquid_class = get_liquid_class(
        int(pipette.max_volume), pipette.channels, tip_volume, int(aspirate_volume)
    )
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
        inspect=inspect,
        mix=mix,
    )


def dispense_with_liquid_class(
    ctx: ProtocolContext,
    pipette: InstrumentContext,
    tip_volume: int,
    dispense_volume: float,
    well: Well,
    channel_offset: Point,
    channel_count: int,
    liquid_tracker: LiquidTracker,
    callbacks: PipettingCallbacks,
    blank: bool = False,
    inspect: bool = False,
    mix: bool = False,
) -> None:
    """Dispense with liquid class."""
    liquid_class = get_liquid_class(
        int(pipette.max_volume), pipette.channels, tip_volume, int(dispense_volume)
    )
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
        inspect=inspect,
        mix=mix,
    )
