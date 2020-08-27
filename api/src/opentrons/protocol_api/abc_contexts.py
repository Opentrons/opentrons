from abc import ABC, abstractmethod
import logging
from typing import List, TYPE_CHECKING, Union

from .labware import Labware, Well
from opentrons import types

if TYPE_CHECKING:
    from .protocol_context import ProtocolContext
    from opentrons.protocols.types import APIVersion
    from .util import HardwareManager, FlowRates, PlungerSpeeds, Clearances


class AbstractInstrumentContext(ABC):

    @abstractmethod
    def __init__(self,
                 ctx: 'ProtocolContext',
                 hardware_mgr: 'HardwareManager',
                 log_parent: logging.Logger,
                 at_version: 'APIVersion',
                 tip_racks: List[Labware] = None,
                 trash: Labware = None,
                 default_speed: float = 400.0,
                 requested_as: str = None,
                 **config_kwargs) -> None:

        self._api_version = at_version
        self._hw_manager = hardware_mgr
        self._ctx = ctx

        self._log: logging.Logger

        self._tip_racks: List[Labware]

        self._default_speed = default_speed

        self._last_location: Union[Labware, Well, None]
        self._last_tip_picked_up_from: Union[Well, None]
        self._well_bottom_clearance: 'Clearances'
        self._flow_rates: 'FlowRates'
        self._speeds: 'PlungerSpeeds'
        self._starting_tip: Union[Well, None]
        self.requested_as = requested_as

    @property
    @abstractmethod
    def api_version(self) -> APIVersion:
        pass

    @abstractmethod
    def pick_up_tip(
            self, location: Union[types.Location, Well] = None,
            presses: int = None,
            increment: float = None) -> 'AbstractInstrumentContext':
        pass

    @abstractmethod
    def drop_tip(
            self,
            location: Union[types.Location, Well] = None,
            home_after: bool = True)\
            -> 'AbstractInstrumentContext':
        pass

    @abstractmethod
    def aspirate(self,
                 volume: float = None,
                 location: Union[types.Location, Well] = None,
                 rate: float = 1.0) -> 'AbstractInstrumentContext':
        pass

    @abstractmethod
    def dispense(self,
                 volume: float = None,
                 location: Union[types.Location, Well] = None,
                 rate: float = 1.0) -> 'AbstractInstrumentContext':
        pass

    @abstractmethod
    def air_gap(self,
                volume: float = None,
                height: float = None) -> 'AbstractInstrumentContext':
        pass

    @abstractmethod
    def blow_out(self,
                 location: Union[types.Location, Well] = None
                 ) -> 'AbstractInstrumentContext':
        pass

    @abstractmethod
    def mix(self,
            repetitions: int = 1,
            volume: float = None,
            location: Union[types.Location, Well] = None,
            rate: float = 1.0) -> 'AbstractInstrumentContext':
        pass

    @abstractmethod
    def touch_tip(self,
                  location: Well = None,
                  radius: float = 1.0,
                  v_offset: float = -1.0,
                  speed: float = 60.0) -> 'AbstractInstrumentContext':
        pass

    @abstractmethod
    def return_tip(self,
                   home_after: bool = True) -> 'AbstractInstrumentContext':
        pass

    @abstractmethod
    def move_to(self, location: types.Location, force_direct: bool = False,
                minimum_z_height: float = None,
                speed: float = None
                ) -> 'AbstractInstrumentContext':
        pass
