from dataclasses import dataclass
from typing import Optional, Callable

from opentrons.protocol_api import ProtocolContext, InstrumentContext
from opentrons.protocol_api.labware import Well

from hardware_testing.liquid.liquid_class import LiquidClassSettings
from hardware_testing.liquid.height import CarefulHeights


def apply_pipette_speeds(pipette: InstrumentContext, settings: LiquidClassSettings):
    pipette.default_speed = settings.traverse.speed
    pipette.flow_rate.aspirate = settings.aspirate.flow_rate
    pipette.flow_rate.dispense = settings.dispense.flow_rate
    pipette.flow_rate.blow_out = settings.blow_out.flow_rate


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
        # FIXME: remove this and use latest API version once available
        # NOTE: this MUST happen before the .move_to()
        #       because the API automatically moves the pipette
        #       to well.top() before beginning the .aspirate()
        cfg.pipette.aspirate(cfg.pipette.max_volume / 100)
        cfg.pipette.dispense()
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
