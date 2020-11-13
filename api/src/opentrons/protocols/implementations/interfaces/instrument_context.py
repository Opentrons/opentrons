from __future__ import annotations

from abc import abstractmethod
import typing

from opentrons import types
from opentrons.protocols.api_support.util import Clearances, PlungerSpeeds, \
    FlowRates
from opentrons.protocols.implementations.well import WellImplementation
from opentrons.protocols.implementations.interfaces.labware import LabwareInterface


class InstrumentContextInterface:

    @abstractmethod
    def get_default_speed(self) -> float:
        ...

    @abstractmethod
    def set_default_speed(self, speed: float) -> None:
        ...

    @abstractmethod
    def aspirate(self,
                 volume: float,
                 rate: float = 1.0) -> None:
        ...

    @abstractmethod
    def dispense(self,
                 volume: float,
                 rate: float = 1.0) -> None:
        ...

    @abstractmethod
    def blow_out(self) -> None:
        ...

    @abstractmethod
    def touch_tip(self,
                  location: WellImplementation,
                  radius: float = 1.0,
                  v_offset: float = -1.0,
                  speed: float = 60.0) -> None:
        ...

    @abstractmethod
    def pick_up_tip(self,
                    well: WellImplementation,
                    tip_length: float,
                    presses: int = None,
                    increment: float = None) -> None:
        ...

    @abstractmethod
    def drop_tip(self,
                 home_after: bool = True) -> None:
        ...

    @abstractmethod
    def home(self) -> None:
        ...

    @abstractmethod
    def home_plunger(self) -> None:
        ...

    @abstractmethod
    def delay(self) -> None:
        ...

    @abstractmethod
    def move_to(self,
                location: types.Location,
                force_direct: bool = False,
                minimum_z_height: float = None,
                speed: float = None) -> None:
        ...

    @abstractmethod
    def get_mount(self) -> types.Mount:
        ...

    @abstractmethod
    def get_tip_racks(self) -> typing.List[LabwareInterface]:
        ...

    @abstractmethod
    def set_tip_racks(self, racks: typing.List[LabwareInterface]) -> None:
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
    def get_current_location(self) -> types.Location:
        """The current location of the pipette: (ie location cache)"""
        ...

    @abstractmethod
    def get_pipette(self) -> typing.Dict[str, typing.Any]:
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
            aspirate: float = None,
            dispense: float = None,
            blow_out: float = None) -> None:
        ...

    @abstractmethod
    def set_pipette_speed(
            self,
            aspirate: float = None,
            dispense: float = None,
            blow_out: float = None) -> None:
        ...
