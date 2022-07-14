from dataclasses import dataclass
from typing import Optional, Callable

from opentrons.protocol_api import ProtocolContext, InstrumentContext
from opentrons.protocol_api.labware import Well

from hardware_testing.liquid.liquid_class import LiquidClassSettings
from hardware_testing.opentrons_api.workarounds import force_prepare_for_aspirate

LABWARE_BOTTOM_CLEARANCE = 1.5  # FIXME: not sure who should own this


def apply_pipette_speeds(pipette: InstrumentContext, settings: LiquidClassSettings):
    pipette.default_speed = settings.traverse.speed
    pipette.flow_rate.aspirate = settings.aspirate.flow_rate
    pipette.flow_rate.dispense = settings.dispense.flow_rate
    pipette.flow_rate.blow_out = settings.blow_out.flow_rate


@dataclass
class LiquidSurfaceHeights:
    above: float
    below: float


@dataclass
class CarefulHeights:
    start: LiquidSurfaceHeights
    end: LiquidSurfaceHeights


def create_careful_heights(start_mm: float, end_mm: float,
                           liquid_class: LiquidClassSettings) -> CarefulHeights:
    # Calculates the:
    #     1) current liquid-height of the well
    #     2) the resulting liquid-height of the well, after a specified volume is
    #        aspirated/dispensed
    #
    # Then, use these 2 liquid-heights (start & end heights) to return four Locations:
    #     1) Above the starting liquid height
    #     2) Submerged in the starting liquid height
    #     3) Above the ending liquid height
    #     4) Submerged in the ending liquid height
    return CarefulHeights(
        start=LiquidSurfaceHeights(
            above=max(start_mm + liquid_class.retract.distance, LABWARE_BOTTOM_CLEARANCE),
            below=max(start_mm - liquid_class.submerge.distance, LABWARE_BOTTOM_CLEARANCE)
        ),
        end=LiquidSurfaceHeights(
            above=max(end_mm + liquid_class.retract.distance, LABWARE_BOTTOM_CLEARANCE),
            below=max(end_mm - liquid_class.submerge.distance, LABWARE_BOTTOM_CLEARANCE)
        )
    )


@dataclass
class CarefulPipettingConfig:
    pipette: InstrumentContext
    well: Well
    heights: CarefulHeights
    settings: LiquidClassSettings
    aspirate: Optional[float]
    dispense: Optional[float]


def carefully_pipette(protocol: ProtocolContext, cfg: CarefulPipettingConfig,
                      on_pre_submerge: Optional[Callable[[], None]] = None,
                      on_post_emerge: Optional[Callable[[], None]] = None):
    assert (cfg.aspirate is not None or cfg.dispense is not None),\
        'must either aspirate or dispense'
    assert (cfg.aspirate is None or cfg.dispense is None),\
        'cannot both aspirate and dispense'
    cfg.pipette.move_to(cfg.well.top())
    if cfg.aspirate:
        force_prepare_for_aspirate(cfg.pipette)
    if callable(on_pre_submerge):
        on_pre_submerge()
    if cfg.aspirate and cfg.settings.wet_air_gap.volume:
        cfg.pipette.aspirate(cfg.settings.wet_air_gap.volume)
    # in case (start.above < end.below)
    start_above = max(cfg.heights.start.above, cfg.heights.end.below)
    cfg.pipette.move_to(cfg.well.bottom(start_above),
                        force_direct=False)
    submerged_loc = cfg.well.bottom(cfg.heights.end.below)
    cfg.pipette.move_to(submerged_loc, force_direct=True, speed=cfg.settings.submerge.speed)
    if cfg.aspirate:
        cfg.pipette.aspirate(cfg.aspirate)
    else:
        cfg.pipette.dispense(cfg.dispense)
        if cfg.pipette.current_volume > 0:
            # temporarily change the dispense volume
            cfg.pipette.flow_rate.dispense = cfg.settings.wet_air_gap.flow_rate
            cfg.pipette.dispense()
            apply_pipette_speeds(cfg.pipette, cfg.settings)  # back to defaults
    if cfg.aspirate and cfg.settings.aspirate.delay:
        delay_time = cfg.settings.aspirate.delay
    elif cfg.dispense and cfg.settings.dispense.delay:
        delay_time = cfg.settings.dispense.delay
    else:
        delay_time = 0
    protocol.delay(seconds=delay_time)
    cfg.pipette.move_to(cfg.well.bottom(cfg.heights.end.above),
                        force_direct=True, speed=cfg.settings.retract.speed)
    if cfg.dispense and cfg.settings.blow_out.volume:
        cfg.pipette.blow_out()  # nothing to loose
    cfg.pipette.move_to(cfg.well.top(), force_direct=True)
    if callable(on_post_emerge):
        on_post_emerge()
