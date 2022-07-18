from dataclasses import dataclass
from typing import Optional, Callable, List

from opentrons.protocol_api import ProtocolContext, InstrumentContext
from opentrons.protocol_api.labware import Well, Labware

from hardware_testing.liquid.height import LiquidTracker
from hardware_testing.liquid.liquid_class import (
    LiquidClassSettings,
    LIQUID_CLASS_DEFAULT,
)
from hardware_testing.opentrons_api.workarounds import force_prepare_for_aspirate

LABWARE_BOTTOM_CLEARANCE = 1.5  # FIXME: not sure who should own this


def apply_pipette_speeds(pipette: InstrumentContext, settings: LiquidClassSettings):
    assert settings.traverse.speed
    pipette.default_speed = settings.traverse.speed
    pipette.flow_rate.aspirate = settings.aspirate.flow_rate
    pipette.flow_rate.dispense = settings.dispense.flow_rate
    pipette.flow_rate.blow_out = settings.blow_out.flow_rate


@dataclass
class LiquidSurfaceHeights:
    above: float
    below: float


@dataclass
class PipettingHeights:
    start: LiquidSurfaceHeights
    end: LiquidSurfaceHeights


def _create_pipetting_heights(
    start_mm: float, end_mm: float, liquid_class: LiquidClassSettings
) -> PipettingHeights:
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
    assert liquid_class.retract.distance
    assert liquid_class.submerge.distance
    return PipettingHeights(
        start=LiquidSurfaceHeights(
            above=max(
                start_mm + liquid_class.retract.distance, LABWARE_BOTTOM_CLEARANCE
            ),
            below=max(
                start_mm - liquid_class.submerge.distance, LABWARE_BOTTOM_CLEARANCE
            ),
        ),
        end=LiquidSurfaceHeights(
            above=max(end_mm + liquid_class.retract.distance, LABWARE_BOTTOM_CLEARANCE),
            below=max(
                end_mm - liquid_class.submerge.distance, LABWARE_BOTTOM_CLEARANCE
            ),
        ),
    )


@dataclass
class PipettingLiquidSettingsConfig:
    pipette: InstrumentContext
    well: Well
    heights: PipettingHeights
    settings: LiquidClassSettings
    aspirate: Optional[float]
    dispense: Optional[float]


class PipettingLiquidSettings:
    def __init__(
        self, ctx: ProtocolContext, cfg: PipettingLiquidSettingsConfig
    ) -> None:
        assert (
            cfg.aspirate is not None or cfg.dispense is not None
        ), "must either aspirate or dispense"
        assert (
            cfg.aspirate is None or cfg.dispense is None
        ), "cannot both aspirate and dispense"
        self._ctx = ctx
        self._cfg = cfg

    def _approach(self) -> None:
        self._cfg.pipette.move_to(self._cfg.well.top())
        if self._cfg.aspirate:
            force_prepare_for_aspirate(self._cfg.pipette)

    def _gather_air_gaps(self) -> None:
        if self._cfg.aspirate and self._cfg.settings.wet_air_gap.volume:
            self._cfg.pipette.aspirate(self._cfg.settings.wet_air_gap.volume)

    def _submerge(self) -> None:
        # Note: in case (start.above < end.below)
        start_above = max(self._cfg.heights.start.above, self._cfg.heights.end.below)
        self._cfg.pipette.move_to(
            self._cfg.well.bottom(start_above), force_direct=False
        )
        submerged_loc = self._cfg.well.bottom(self._cfg.heights.end.below)
        self._cfg.pipette.move_to(
            submerged_loc, force_direct=True, speed=self._cfg.settings.submerge.speed
        )

    def _aspirate(self) -> None:
        if self._cfg.aspirate:
            self._cfg.pipette.aspirate(self._cfg.aspirate)

    def _dispense(self) -> None:
        if self._cfg.dispense:
            self._cfg.pipette.dispense(self._cfg.dispense)
            if self._cfg.pipette.current_volume > 0:
                # temporarily change the dispense speed
                self._cfg.pipette.flow_rate.dispense = (
                    self._cfg.settings.wet_air_gap.flow_rate
                )
                self._cfg.pipette.dispense()
                # go back to previous speed
                apply_pipette_speeds(
                    self._cfg.pipette, self._cfg.settings
                )  # back to defaults

    def _delay(self) -> None:
        if self._cfg.aspirate and self._cfg.settings.aspirate.delay:
            delay_time = self._cfg.settings.aspirate.delay
        elif self._cfg.dispense and self._cfg.settings.dispense.delay:
            delay_time = self._cfg.settings.dispense.delay
        else:
            delay_time = 0
        self._ctx.delay(seconds=delay_time)

    def _retract(self) -> None:
        self._cfg.pipette.move_to(
            self._cfg.well.bottom(self._cfg.heights.end.above),
            force_direct=True,
            speed=self._cfg.settings.retract.speed,
        )

    def _blow_out(self) -> None:
        if self._cfg.dispense and self._cfg.settings.blow_out.volume:
            self._cfg.pipette.blow_out()  # nothing to loose

    def _finish(self) -> None:
        self._cfg.pipette.move_to(self._cfg.well.top(), force_direct=True)

    def run(
        self,
        on_pre_submerge: Optional[Callable[[], None]] = None,
        on_post_emerge: Optional[Callable[[], None]] = None,
    ) -> None:
        self._approach()
        if callable(on_pre_submerge):
            on_pre_submerge()
        self._gather_air_gaps()
        self._submerge()
        if self._cfg.aspirate:
            self._aspirate()
        else:
            self._dispense()
        self._delay()
        self._retract()
        self._blow_out()
        self._finish()
        if callable(on_post_emerge):
            on_post_emerge()


def pipette_liquid_settings(
    ctx: ProtocolContext,
    pipette: InstrumentContext,
    well: Well,
    liquid_class: LiquidClassSettings,
    liquid_tracker: LiquidTracker,
    aspirate: Optional[float] = None,
    dispense: Optional[float] = None,
    on_pre_submerge=None,
    on_post_emerge=None,
):
    height_before, height_after = liquid_tracker.get_before_and_after_heights(
        pipette, well, aspirate=aspirate, dispense=dispense
    )
    pipetting_heights = _create_pipetting_heights(
        start_mm=height_before, end_mm=height_after, liquid_class=liquid_class
    )
    pipetting_cfg = PipettingLiquidSettingsConfig(
        pipette=pipette,
        well=well,
        heights=pipetting_heights,
        settings=liquid_class,
        aspirate=aspirate,
        dispense=dispense,
    )
    pip_runner = PipettingLiquidSettings(ctx=ctx, cfg=pipetting_cfg)
    pip_runner.run(on_pre_submerge=on_pre_submerge, on_post_emerge=on_post_emerge)
    liquid_tracker.update_affected_wells(
        pipette, well, aspirate=aspirate, dispense=dispense
    )


class PipetteLiquidClass:
    def __init__(
        self, ctx: ProtocolContext, model: str, mount: str, tip_racks: List[Labware]
    ) -> None:
        self._ctx = ctx
        self._pipette = ctx.load_instrument(model, mount, tip_racks=tip_racks)
        self._liq_cls: LiquidClassSettings = LIQUID_CLASS_DEFAULT
        self._on_pre_aspirate: Optional[Callable] = None
        self._on_post_aspirate: Optional[Callable] = None
        self._on_pre_dispense: Optional[Callable] = None
        self._on_post_dispense: Optional[Callable] = None

    @property
    def pipette(self) -> InstrumentContext:
        return self._pipette

    def set_liquid_class(self, settings: LiquidClassSettings) -> None:
        self._liq_cls = settings
        apply_pipette_speeds(self._pipette, settings)

    def assign_callbacks(
        self,
        on_pre_aspirate: Optional[Callable] = None,
        on_post_aspirate: Optional[Callable] = None,
        on_pre_dispense: Optional[Callable] = None,
        on_post_dispense: Optional[Callable] = None,
    ) -> None:
        self._on_pre_aspirate = on_pre_aspirate
        self._on_post_aspirate = on_post_aspirate
        self._on_pre_dispense = on_pre_dispense
        self._on_post_dispense = on_post_dispense

    def aspirate(self, volume: float, well: Well, liquid_level: LiquidTracker) -> None:
        pipette_liquid_settings(
            self._ctx,
            self._pipette,
            well,
            self._liq_cls,
            liquid_level,
            aspirate=volume,
            on_pre_submerge=self._on_pre_aspirate,
            on_post_emerge=self._on_post_aspirate,
        )

    def dispense(self, volume: float, well: Well, liquid_level: LiquidTracker) -> None:
        pipette_liquid_settings(
            self._ctx,
            self._pipette,
            well,
            self._liq_cls,
            liquid_level,
            dispense=volume,
            on_pre_submerge=self._on_pre_dispense,
            on_post_emerge=self._on_post_dispense,
        )
