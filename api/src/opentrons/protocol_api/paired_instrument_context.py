from __future__ import annotations

from typing import TYPE_CHECKING, Union

from opentrons import types
from opentrons.commands import CommandPublisher
from opentrons.protocols.types import APIVersion

from opentrons.protocols.api_support.util import requires_version
from .labware import Labware, Well

if TYPE_CHECKING:
    from .instrument_context import InstrumentContext


class UnsupportedInstrumentPairingError(Exception):
    pass


class PairedInstrumentContext(CommandPublisher):

    def __init__(self,
                 primary_instrument: InstrumentContext,
                 secondary_instrument: InstrumentContext,
                 api_version: APIVersion,
                 trash: Labware = None) -> None:

        self._primary_instrument = primary_instrument
        self._secondary_instrument = secondary_instrument
        self._api_version = api_version

        self._last_location: Union[Labware, Well, None]
        self._last_tip_picked_up_from: Union[Well, None]
        self._starting_tip: Union[Well, None]

        self.trash_container = trash

    @property  # type: ignore
    @requires_version(2, 7)
    def api_version(self) -> APIVersion:
        pass

    @requires_version(2, 7)
    def pick_up_tip(
            self, location: Union[types.Location, Well] = None,
            presses: int = None,
            increment: float = None) -> PairedInstrumentContext:
        pass

    @requires_version(2, 7)
    def drop_tip(
            self,
            location: Union[types.Location, Well] = None,
            home_after: bool = True)\
            -> PairedInstrumentContext:
        pass

    @requires_version(2, 7)
    def aspirate(self,
                 volume: float = None,
                 location: Union[types.Location, Well] = None,
                 rate: float = 1.0) -> PairedInstrumentContext:
        pass

    @requires_version(2, 7)
    def dispense(self,
                 volume: float = None,
                 location: Union[types.Location, Well] = None,
                 rate: float = 1.0) -> PairedInstrumentContext:
        pass

    @requires_version(2, 7)
    def air_gap(self,
                volume: float = None,
                height: float = None) -> PairedInstrumentContext:
        pass

    @requires_version(2, 7)
    def blow_out(self,
                 location: Union[types.Location, Well] = None
                 ) -> PairedInstrumentContext:
        pass

    @requires_version(2, 7)
    def mix(self,
            repetitions: int = 1,
            volume: float = None,
            location: Union[types.Location, Well] = None,
            rate: float = 1.0) -> PairedInstrumentContext:
        pass

    @requires_version(2, 7)
    def touch_tip(self,
                  location: Well = None,
                  radius: float = 1.0,
                  v_offset: float = -1.0,
                  speed: float = 60.0) -> PairedInstrumentContext:
        pass

    @requires_version(2, 7)
    def return_tip(self,
                   home_after: bool = True) -> PairedInstrumentContext:
        pass

    @requires_version(2, 7)
    def move_to(self, location: types.Location, force_direct: bool = False,
                minimum_z_height: float = None,
                speed: float = None
                ) -> PairedInstrumentContext:
        pass
