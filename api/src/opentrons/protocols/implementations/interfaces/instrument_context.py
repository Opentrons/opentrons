from __future__ import annotations

from abc import abstractmethod
import typing

from opentrons import types
from opentrons.protocols.api_support.util import (
    FlowRates, PlungerSpeeds, Clearances)
from opentrons.protocols.implementations.interfaces.versioned import \
    ApiVersioned
from opentrons.protocols.implementations.well import WellImplementation
from opentrons.protocols.implementations.interfaces.labware import LabwareInterface


class InstrumentContextInterface(ApiVersioned):

    @abstractmethod
    def get_starting_tip(self) -> typing.Optional[WellImplementation]:
        ...

    @abstractmethod
    def set_starting_tip(self, location: typing.Optional[WellImplementation]):
        ...

    @abstractmethod
    def reset_tipracks(self) -> None:
        ...

    @abstractmethod
    def get_default_speed(self) -> float:
        ...

    @abstractmethod
    def set_default_speed(self, speed: float) -> None:
        ...

    @abstractmethod
    def aspirate(self,
                 volume: float,
                 location: types.Location,
                 rate: float = 1.0) -> None:
        ...

    @abstractmethod
    def dispense(self,
                 volume: float,
                 location: types.Location,
                 rate: float = 1.0) -> None:
        ...

    @abstractmethod
    def blow_out(self, location: types.Location) -> None:
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
                    location: types.Location,
                    presses: int = None,
                    increment: float = None) -> None:
        ...

    @abstractmethod
    def drop_tip(self,
                 location: types.Location,
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
    def get_speed(self) -> PlungerSpeeds:
        ...

    @abstractmethod
    def get_flow_rate(self) -> FlowRates:
        ...

    @abstractmethod
    def get_tip_racks(self) -> typing.List[LabwareInterface]:
        ...

    @abstractmethod
    def set_tip_racks(self, racks: typing.List[LabwareInterface]):
        ...

    @abstractmethod
    def get_trash_container(self) -> LabwareInterface:
        ...

    @abstractmethod
    def set_trash_container(self, trash: LabwareInterface):
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
    def get_return_height(self) -> float:
        ...

    @abstractmethod
    def get_well_bottom_clearance(self) -> Clearances:
        ...
