"""Liquid Class."""
from dataclasses import dataclass
from enum import Enum
from typing import Union, Optional

from opentrons.protocol_api import InstrumentContext
from opentrons.protocol_api.labware import Well
from opentrons.protocol_api.disposal_locations import TrashBin, WasteChute
from opentrons.types import Location


class HeightRef(str, Enum):
    WELL_BOTTOM = "WELL_BOTTOM"
    WELL_TOP = "WELL_TOP"
    MENISCUS_START = "MENISCUS_START"
    MENISCUS_END = "MENISCUS_END"


@dataclass
class Height:
    value: float
    reference: HeightRef

    def in_well(self, well: Union[Location, Well]) -> Location:
        well = well.labware if isinstance(well, Location) else well
        assert isinstance(well, Well)
        ref = self.reference
        if self.reference == HeightRef.WELL_TOP:
            return well.top(self.value)
        elif self.reference == HeightRef.WELL_BOTTOM:
            return well.bottom(self.value)
        elif (
            self.reference == HeightRef.MENISCUS_START
            or self.reference == HeightRef.MENISCUS_END
        ):
            raise NotImplementedError("meniscus-relative pipetting not yet supported")
        else:
            raise ValueError(f"unexpected height reference: {ref}")


class TouchStrategy(str, Enum):
    FOUR_SIDES = "FOUR_SIDES"


class ParamType(str, Enum):
    BOOL = Union[None, bool]
    INT = Union[None, int]
    FLOAT = Union[None, float]
    STR = Union[None, str]
    HEIGHT = Union[None, Height]
    TOUCH_STRATEGY = Union[None, TouchStrategy]


@dataclass
class _PositioningMove:
    speed: ParamType.FLOAT
    height: ParamType.HEIGHT
    delay: ParamType.FLOAT


@dataclass
class Submerge(_PositioningMove):
    pass


@dataclass
class Retract(_PositioningMove):
    air_gap: ParamType.FLOAT
    blow_out: ParamType.BOOL


@dataclass
class Touch(_PositioningMove):
    strategy: ParamType.TOUCH_STRATEGY


@dataclass
class _PipettingMove:
    flow_rate: ParamType.FLOAT
    height: ParamType.HEIGHT
    z_tracking: ParamType.BOOL
    delay: ParamType.FLOAT


@dataclass
class Aspirate(_PipettingMove):
    pass


@dataclass
class Dispense(_PipettingMove):
    push_out: ParamType.FLOAT


@dataclass
class Liquid:
    submerge: Submerge
    retract: Retract
    aspirate: Aspirate
    dispense: Dispense
    touch: Touch

    def submerge_location_in_well(self, location: Union[Location, Well]) -> Location:
        return self.submerge.height.in_well(location)

    def retract_location_in_well(self, location: Union[Location, Well]) -> Location:
        return self.retract.height.in_well(location)


class LiquidClassPipette(InstrumentContext):
    @property
    def _last_well(self) -> Optional[Well]:
        prev_loc = self._get_last_location_by_api_version()
        if prev_loc and isinstance(prev_loc.labware, Well):
            return prev_loc.labware.as_well()
        return None

    def _need_to_retract(self, location: Optional[Union[Location, Well]]) -> bool:
        if not location or not self._last_well:
            return False
        new_well = location.labware if isinstance(location, Location) else location
        return new_well and (self._last_well != new_well)

    def _need_to_submerge(self, location: Union[Location, Well]) -> bool:
        if not location:
            return False
        if (
            self._need_to_retract(location)
            or not self._get_last_location_by_api_version()
        ):
            return True

    def _retract_from_well(
        self,
        liquid: Liquid,
        location: Union[Location, Well],
        speed: Optional[float] = None,
        touch_tip: bool = False,
    ) -> None:
        speed = speed if speed else liquid.retract.speed
        self.move_to(liquid.retract.height.in_well(location), speed=speed)
        self.delay(seconds=liquid.retract.delay if liquid.retract.delay else 0)
        if not self.current_volume and liquid.retract.blow_out:
            self.Blow_out(liquid=liquid)
        if touch_tip:
            self.Touch_tip(liquid=liquid)
        self.prepare_to_aspirate()
        if liquid.retract.air_gap is not None:
            self.air_gap(liquid.retract.air_gap)
        safe_height = Height(value=1, reference=HeightRef.WELL_TOP)
        self.move_to(safe_height.in_well(location))

    def _submerge_into_well(
        self,
        liquid: Liquid,
        location: Union[Location, Well],
        speed: Optional[float] = None,
    ) -> None:
        safe_height = Height(value=1, reference=HeightRef.WELL_TOP)
        self.move_to(safe_height.in_well(location))
        speed = speed if speed else liquid.submerge.speed
        self.move_to(liquid.submerge.height.in_well(location), speed=speed)
        self.delay(seconds=liquid.submerge.delay if liquid.submerge.delay else 0)

    def Aspirate(
        self,
        volume: Optional[float] = None,
        location: Optional[Union[Location, Well]] = None,
        rate: float = 1.0,
        liquid: Optional[Liquid] = None,
    ) -> "LiquidClassPipette":
        if liquid:
            delay = 0
            if liquid.aspirate:
                if liquid.aspirate.z_tracking:
                    raise NotImplementedError("z-tracking not yet supported")
                if liquid.aspirate.flow_rate is not None:
                    self.flow_rate.aspirate = liquid.aspirate.flow_rate
                if liquid.aspirate.delay is not None:
                    delay = liquid.aspirate.delay
            self.Move_to(location, liquid=liquid)
            self.aspirate(volume, None, rate)  # in-place
            if delay:
                self.delay(seconds=delay)
        else:
            self.aspirate(volume, location, rate)
        return self

    def Dispense(
        self,
        volume: Optional[float] = None,
        location: Optional[Union[Location, Well, TrashBin, WasteChute]] = None,
        rate: float = 1.0,
        push_out: Optional[float] = None,
        liquid: Optional[Liquid] = None,
    ) -> "LiquidClassPipette":
        if liquid:
            delay = 0
            if liquid.dispense:
                if liquid.dispense.z_tracking:
                    raise NotImplementedError("z-tracking not yet supported")
                if liquid.dispense.flow_rate is not None:
                    self.flow_rate.aspirate = liquid.dispense.flow_rate
                if push_out is None:
                    push_out = liquid.dispense.push_out
                if liquid.dispense.delay is not None:
                    delay = liquid.dispense.delay
            self.Move_to(location, liquid=liquid)
            self.dispense(volume, None, rate, push_out=push_out)  # in-place
            if delay:
                self.delay(seconds=delay)
        else:
            self.dispense(volume, location, rate)
        return self

    def Blow_out(
        self,
        location: Optional[Union[Location, Well, TrashBin, WasteChute]] = None,
        liquid: Optional[Liquid] = None,
    ) -> "LiquidClassPipette":
        if liquid:
            if liquid.dispense and liquid.dispense.flow_rate:
                self.flow_rate.blow_out = liquid.dispense.flow_rate
            self.Move_to(location, liquid=liquid)
        self.blow_out(location)
        return self

    def Move_to(
        self,
        location: Union[Location, TrashBin, WasteChute],
        speed: Optional[float] = None,
        liquid: Optional[Liquid] = None,
        **kwargs,
    ) -> "LiquidClassPipette":
        if liquid:
            if self._need_to_retract(location):
                self._retract_from_well(liquid, self._last_well, speed=speed)
            if self._need_to_submerge(location):
                self._submerge_into_well(liquid, location, speed=speed)
        else:
            self.move_to(location, speed=speed, **kwargs)
        return self

    def Touch_tip(
        self,
        location: Optional[Well] = None,
        radius: float = 1.0,
        v_offset: Optional[float] = None,
        speed: Optional[float] = None,
        liquid: Optional[Liquid] = None,
    ) -> "LiquidClassPipette":
        if liquid and liquid.touch:
            if not liquid.touch.height:
                liquid.touch.height = Height(value=-1, reference=HeightRef.WELL_TOP)
            if liquid.touch.height.reference != HeightRef.WELL_TOP:
                raise NotImplementedError(
                    f"height reference not supported by touch-tip: {liquid.touch.height.reference}"
                )
            v_offset = v_offset if v_offset else liquid.touch.height.value
            speed = speed if speed else liquid.touch.speed
            self.touch_tip(location, radius, v_offset=v_offset, speed=speed)
        else:
            self.touch_tip(location, radius, v_offset, speed)
        return self


DEFAULT: Liquid = Liquid(
    submerge=Submerge(
        speed=60,
        height=None,
        delay=None,
    ),
    retract=Retract(
        speed=60,
        height=Height(1.0, HeightRef.WELL_TOP),
        delay=0,
        air_gap=5.0,
        blow_out=True,
    ),
    aspirate=Aspirate(
        flow_rate=50.0,
        height=Height(1, HeightRef.WELL_BOTTOM),
        z_tracking=False,
        delay=0.5,
    ),
    dispense=Dispense(
        flow_rate=50.0,
        height=Height(1, HeightRef.WELL_BOTTOM),
        z_tracking=False,
        delay=0.5,
        push_out=7.0,
    ),
    touch=Touch(
        speed=30.0,
        height=Height(-1, HeightRef.WELL_TOP),
        delay=None,
        strategy=TouchStrategy.FOUR_SIDES,
    ),
)
