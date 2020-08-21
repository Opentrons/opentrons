from __future__ import annotations

from abc import ABC, abstractmethod
import typing

from opentrons import types
from opentrons.protocol_api import transfers
from opentrons.protocols.types import APIVersion

from opentrons.protocol_api.instrument_context import AdvancedLiquidHandling
from opentrons.protocol_api.labware import Labware, Well
from opentrons.protocol_api.util import (FlowRates, PlungerSpeeds, Clearances)


class AbstractInstrumentContextImpl(ABC):

    @abstractmethod
    def get_api_version(self) -> APIVersion:
        """Get the api version of the protocol"""
        ...

    @abstractmethod
    def get_starting_tip(self) -> typing.Optional[Well]:
        ...

    def set_starting_tip(self, location: typing.Optional[Well]):
        ...

    @abstractmethod
    def reset_tipracks(self):
        ...

    @abstractmethod
    def get_default_speed(self) -> float:
        ...

    @abstractmethod
    def set_default_speed(self, speed: float):
        ...

    @abstractmethod
    def aspirate(self,
                 volume: float,
                 location: types.Location,
                 rate: float = 1.0):
        ...

    @abstractmethod
    def dispense(self,
                 volume: float,
                 location: types.Location,
                 rate: float = 1.0):
        ...

    @abstractmethod
    def mix(self,
            volume: float,
            location: types.Location,
            repetitions: int = 1,
            rate: float = 1.0):
        ...

    @abstractmethod
    def blow_out(self, location: types.Location):
        ...

    @abstractmethod
    def touch_tip(self,
                  location: Well,
                  radius: float = 1.0,
                  v_offset: float = -1.0,
                  speed: float = 60.0):
        ...

    @abstractmethod
    def air_gap(self,
                volume: float,
                height: float):
        ...

    @abstractmethod
    def return_tip(self, home_after: bool = True):
        ...

    @abstractmethod
    def pick_up_tip(self,
                    location: types.Location,
                    presses: int = None,
                    increment: float = None):
        ...

    @abstractmethod
    def drop_tip(self,
                 location: types.Location,
                 home_after: bool = True):
        ...

    @abstractmethod
    def home(self):
        ...

    @abstractmethod
    def home_plunger(self):
        ...

    @abstractmethod
    def distribute(self,
                   volume: float,
                   source: Well,
                   dest: typing.List[Well],
                   mode: str,
                   disposal_volume: float,
                   mix_after: typing.Tuple[int, int]):
        ...

    @abstractmethod
    def consolidate(self,
                    volume: float,
                    source: typing.List[Well],
                    dest: Well,
                    mode: str,
                    disposal_volume: float,
                    mix_before: typing.Tuple[int, int]):
        ...

    @abstractmethod
    def transfer(self,
                 volume: typing.Union[float, typing.Sequence[float]],
                 source: AdvancedLiquidHandling,
                 dest: AdvancedLiquidHandling,
                 mode: str,
                 blow_out: transfers.BlowOutStrategy,
                 drop_tip: transfers.DropTipStrategy,
                 touch_tip: transfers.TouchTipStrategy,
                 mix_strategy: transfers.MixStrategy,
                 mix_options: transfers.Mix,
                 new_tip: str,
                 disposal_volume: float,
                 air_gap: float):
        ...

    @abstractmethod
    def delay(self):
        ...

    @abstractmethod
    def move_to(self,
                location: types.Location,
                force_direct: bool = False,
                minimum_z_height: float = None,
                speed: float = None):
        ...

    @abstractmethod
    def get_mount_name(self) -> str:
        ...

    @abstractmethod
    def get_speed(self) -> PlungerSpeeds:
        ...

    @abstractmethod
    def get_flow_rate(self) -> FlowRates:
        ...

    @abstractmethod
    def get_type(self) -> str:
        ...

    @abstractmethod
    def get_tip_racks(self) -> typing.List[Labware]:
        ...

    @abstractmethod
    def set_tip_racks(self, racks: typing.List[Labware]):
        ...

    @abstractmethod
    def get_trash_container(self) -> Labware:
        ...

    @abstractmethod
    def set_trash_container(self, trash: Labware):
        ...

    @abstractmethod
    def get_name(self) -> str:
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
    def get_pipettes(self) -> typing.Dict[str, typing.Any]:
        ...

    @abstractmethod
    def get_channels(self) -> int:
        ...

    @abstractmethod
    def get_return_height(self) -> int:
        ...

    @abstractmethod
    def get_well_bottom_clearance(self) -> Clearances:
        ...
