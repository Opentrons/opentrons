"""An implementation of AbstractInstrument backed by Protocol Engine."""

from __future__ import annotations

import typing

from opentrons import types
from opentrons.hardware_control.dev_types import PipetteDict
from opentrons.protocols.api_support.util import Clearances, PlungerSpeeds, \
    FlowRates
from opentrons.protocols.context.well import WellImplementation

from opentrons.protocols.context.instrument import AbstractInstrument


class PipetteContext(AbstractInstrument):

    def get_default_speed(self) -> float:
        raise NotImplementedError()

    def set_default_speed(self, speed: float) -> None:
        raise NotImplementedError()

    def aspirate(self,
                 volume: float,
                 rate: float) -> None:
        raise NotImplementedError()

    def dispense(self,
                 volume: float,
                 rate: float) -> None:
        raise NotImplementedError()

    def blow_out(self) -> None:
        raise NotImplementedError()

    def touch_tip(self,
                  location: WellImplementation,
                  radius: float,
                  v_offset: float,
                  speed: float) -> None:
        raise NotImplementedError()

    def pick_up_tip(self,
                    well: WellImplementation,
                    tip_length: float,
                    presses: typing.Optional[int],
                    increment: typing.Optional[float]) -> None:
        raise NotImplementedError()

    def drop_tip(self, home_after: bool) -> None:
        raise NotImplementedError()

    def home(self) -> None:
        raise NotImplementedError()

    def home_plunger(self) -> None:
        raise NotImplementedError()

    def delay(self) -> None:
        raise NotImplementedError()

    def move_to(self,
                location: types.Location,
                force_direct: bool,
                minimum_z_height: typing.Optional[float],
                speed: typing.Optional[float]) -> None:
        raise NotImplementedError()

    def get_mount(self) -> types.Mount:
        raise NotImplementedError()

    def get_instrument_name(self) -> str:
        raise NotImplementedError()

    def get_pipette_name(self) -> str:
        raise NotImplementedError()

    def get_model(self) -> str:
        raise NotImplementedError()

    def get_min_volume(self) -> float:
        raise NotImplementedError()

    def get_max_volume(self) -> float:
        raise NotImplementedError()

    def get_current_volume(self) -> float:
        raise NotImplementedError()

    def get_available_volume(self) -> float:
        raise NotImplementedError()

    def get_pipette(self) -> PipetteDict:
        raise NotImplementedError()

    def get_channels(self) -> int:
        raise NotImplementedError()

    def has_tip(self) -> bool:
        raise NotImplementedError()

    def is_ready_to_aspirate(self) -> bool:
        raise NotImplementedError()

    def prepare_for_aspirate(self) -> None:
        raise NotImplementedError()

    def get_return_height(self) -> float:
        raise NotImplementedError()

    def get_well_bottom_clearance(self) -> Clearances:
        raise NotImplementedError()

    def get_speed(self) -> PlungerSpeeds:
        raise NotImplementedError()

    def get_flow_rate(self) -> FlowRates:
        raise NotImplementedError()

    def set_flow_rate(
            self,
            aspirate: typing.Optional[float] = None,
            dispense: typing.Optional[float] = None,
            blow_out: typing.Optional[float] = None) -> None:
        raise NotImplementedError()

    def set_pipette_speed(
            self,
            aspirate: typing.Optional[float] = None,
            dispense: typing.Optional[float] = None,
            blow_out: typing.Optional[float] = None) -> None:
        raise NotImplementedError()
