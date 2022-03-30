"""The interface that implements InstrumentContext."""

from __future__ import annotations

from abc import abstractmethod, ABC
import typing

from opentrons import types
from opentrons.hardware_control.dev_types import PipetteDict
from opentrons.protocols.api_support.util import Clearances, PlungerSpeeds, FlowRates
from opentrons.protocols.context.well import WellImplementation


class AbstractInstrument(ABC):
    @abstractmethod
    def get_default_speed(self) -> float:
        ...

    @abstractmethod
    def set_default_speed(self, speed: float) -> None:
        ...

    @abstractmethod
    def aspirate(self, volume: float, rate: float) -> None:
        ...

    @abstractmethod
    def dispense(self, volume: float, rate: float) -> None:
        ...

    @abstractmethod
    def blow_out(self) -> None:
        ...

    @abstractmethod
    def touch_tip(
        self, location: WellImplementation, radius: float, v_offset: float, speed: float
    ) -> None:
        ...

    @abstractmethod
    def pick_up_tip(
        self,
        well: WellImplementation,
        tip_length: float,
        presses: typing.Optional[int],
        increment: typing.Optional[float],
    ) -> None:
        ...

    @abstractmethod
    def drop_tip(self, home_after: bool) -> None:
        ...

    @abstractmethod
    def home(self) -> None:
        ...

    @abstractmethod
    def home_plunger(self) -> None:
        ...

    @abstractmethod
    def move_to(
        self,
        location: types.Location,
        force_direct: bool,
        minimum_z_height: typing.Optional[float],
        speed: typing.Optional[float],
    ) -> None:
        ...

    @abstractmethod
    def get_mount(self) -> types.Mount:
        ...

    @abstractmethod
    def get_instrument_name(self) -> str:
        ...

    @abstractmethod
    def get_pipette_name(self) -> str:
        ...

    @abstractmethod
    def get_model(self) -> str:
        ...

    @abstractmethod
    def get_min_volume(self) -> float:
        ...

    @abstractmethod
    def get_max_volume(self) -> float:
        ...

    @abstractmethod
    def get_current_volume(self) -> float:
        ...

    @abstractmethod
    def get_available_volume(self) -> float:
        ...

    @abstractmethod
    def get_pipette(self) -> PipetteDict:
        ...

    @abstractmethod
    def get_channels(self) -> int:
        ...

    @abstractmethod
    def has_tip(self) -> bool:
        ...

    @abstractmethod
    def is_ready_to_aspirate(self) -> bool:
        ...

    @abstractmethod
    def prepare_for_aspirate(self) -> None:
        ...

    @abstractmethod
    def get_return_height(self) -> float:
        ...

    @abstractmethod
    def get_well_bottom_clearance(self) -> Clearances:
        ...

    @abstractmethod
    def get_speed(self) -> PlungerSpeeds:
        ...

    @abstractmethod
    def get_flow_rate(self) -> FlowRates:
        ...

    @abstractmethod
    def set_flow_rate(
        self,
        aspirate: typing.Optional[float] = None,
        dispense: typing.Optional[float] = None,
        blow_out: typing.Optional[float] = None,
    ) -> None:
        ...

    @abstractmethod
    def set_pipette_speed(
        self,
        aspirate: typing.Optional[float] = None,
        dispense: typing.Optional[float] = None,
        blow_out: typing.Optional[float] = None,
    ) -> None:
        ...
