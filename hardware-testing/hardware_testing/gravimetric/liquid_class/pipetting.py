"""Pipette motions."""
from dataclasses import dataclass
from typing import Optional, Callable, Tuple

from opentrons.protocol_api import InstrumentContext, ProtocolContext
from opentrons.protocol_api.labware import Well

from hardware_testing.gravimetric import config
from hardware_testing.gravimetric.liquid_height.height import LiquidTracker
from hardware_testing.opentrons_api.types import OT3Mount

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


def _pipette_with_liquid_settings(
    ctx: ProtocolContext,
    pipette: InstrumentContext,
    liquid_class: LiquidClassSettings,
    well: Well,
    liquid_tracker: LiquidTracker,
    callbacks: PipettingCallbacks,
    aspirate: Optional[float] = None,
    dispense: Optional[float] = None,
    blank: bool = True,
) -> None:
    """Run a pipette given some Pipetting Liquid Settings."""
    if aspirate is None and dispense is None:
        raise ValueError("either a aspirate or dispense volume must be set")
    if aspirate and dispense:
        raise ValueError("both aspirate and dispense volumes cannot be set together")

    # ASPIRATE/DISPENSE SEQUENCE HAS THREE PHASES:
    #  1. APPROACH
    #  2. SUBMERGE
    #  3. RETRACT

    # CALCULATE TIP HEIGHTS FOR EACH PHASE
    liquid_before, liquid_after = liquid_tracker.get_before_and_after_heights(
        pipette, well, aspirate=aspirate, dispense=dispense
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
        return

    def _aspirate_on_submerge() -> None:
        # mix 5x times
        callbacks.on_mixing()
        for _ in range(config.NUM_MIXES_BEFORE_ASPIRATE):
            pipette.aspirate(aspirate)
            pipette.dispense(aspirate)
        # aspirate specified volume
        callbacks.on_aspirating()
        pipette.aspirate(aspirate)
        # update liquid-height tracker
        liquid_tracker.update_affected_wells(pipette, well, aspirate=aspirate)
        # delay
        ctx.delay(liquid_class.aspirate.delay)

    def _aspirate_on_retract() -> None:
        # add trailing-air-gap
        pipette.aspirate(liquid_class.aspirate.air_gap.trailing_air_gap)

    def _dispense_on_approach() -> None:
        # remove trailing-air-gap
        pipette.dispense(liquid_class.aspirate.air_gap.trailing_air_gap)

    def _dispense_on_submerge() -> None:
        # dispense all liquid, plus some air by calling `pipette.blow_out(location, volume)`
        # TODO: if P50 has droplets inside the tip after dispense with a full blow-out,
        #       try increasing the blow-out volume by raising the "bottom" plunger position
        # temporarily set blow-out flow-rate to be same as dispense
        old_blow_out_flow_rate = pipette.flow_rate.blow_out
        pipette.flow_rate.blow_out = pipette.flow_rate.dispense
        # FIXME: this is a hack, until there's an equivalent `pipette.blow_out(location, volume)`
        hw_api = ctx._core.get_hardware()
        hw_mount = OT3Mount.LEFT if pipette.mount == "left" else OT3Mount.RIGHT
        callbacks.on_dispensing()
        hw_api.blow_out(hw_mount, liquid_class.aspirate.air_gap.leading_air_gap)
        pipette.flow_rate.blow_out = old_blow_out_flow_rate
        # update liquid-height tracker
        liquid_tracker.update_affected_wells(pipette, well, dispense=dispense)
        # delay
        ctx.delay(liquid_class.dispense.delay)

    def _dispense_on_retract() -> None:
        # blow-out any remaining air in pipette (any reason why not?)
        callbacks.on_blowing_out()
        pipette.blow_out()

    # PHASE 1: APPROACH
    pipette.move_to(well.bottom(approach_mm))
    _aspirate_on_approach() if aspirate else _dispense_on_approach()

    # PHASE 2: SUBMERGE
    callbacks.on_submerging()
    pipette.move_to(
        well.bottom(submerge_mm),
        force_direct=True,
        speed=config.TIP_SPEED_WHILE_SUBMERGED,
    )
    _aspirate_on_submerge() if aspirate else _dispense_on_submerge()

    # PHASE 3: RETRACT
    callbacks.on_retracting()
    pipette.move_to(
        well.bottom(retract_mm),
        force_direct=True,
        speed=config.TIP_SPEED_WHILE_SUBMERGED,
    )
    _aspirate_on_retract() if aspirate else _dispense_on_retract()

    # EXIT
    callbacks.on_exiting()
    pipette.move_to(well.top(), force_direct=True)


def aspirate_with_liquid_class(
    ctx: ProtocolContext,
    pipette: InstrumentContext,
    tip_volume: int,
    aspirate_volume: float,
    well: Well,
    liquid_tracker: LiquidTracker,
    callbacks: PipettingCallbacks,
    blank: bool = True,
) -> None:
    """Aspirate with liquid class."""
    liquid_class = get_liquid_class(
        int(pipette.max_volume), tip_volume, int(aspirate_volume)
    )
    # FIXME: change API to allow going beyond tip max volume
    artificial_aspirate_max = tip_volume * 0.9
    if aspirate_volume > artificial_aspirate_max:
        aspirate_volume = artificial_aspirate_max
        print(f"FIXME: using workaround volume: {aspirate_volume}")
    _pipette_with_liquid_settings(
        ctx,
        pipette,
        liquid_class,
        well,
        liquid_tracker,
        callbacks,
        aspirate=aspirate_volume,
        blank=blank,
    )


def dispense_with_liquid_class(
    ctx: ProtocolContext,
    pipette: InstrumentContext,
    tip_volume: int,
    dispense_volume: float,
    well: Well,
    liquid_tracker: LiquidTracker,
    callbacks: PipettingCallbacks,
    blank: bool = True,
) -> None:
    """Dispense with liquid class."""
    liquid_class = get_liquid_class(
        int(pipette.max_volume), tip_volume, int(dispense_volume)
    )
    _pipette_with_liquid_settings(
        ctx,
        pipette,
        liquid_class,
        well,
        liquid_tracker,
        callbacks,
        dispense=dispense_volume,
        blank=blank,
    )
