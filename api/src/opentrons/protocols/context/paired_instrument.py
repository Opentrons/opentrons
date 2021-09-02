from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Optional, Callable, Tuple

from opentrons import types
from opentrons.protocol_api.labware import Labware, Well


class AbstractPairedInstrument(ABC):
    @abstractmethod
    def pick_up_tip(
        self,
        target: Well,
        secondary_target: Well,
        tiprack: Labware,
        presses: Optional[int],
        increment: Optional[float],
        tip_length: float,
    ) -> None:
        ...

    @abstractmethod
    def drop_tip(self, target: types.Location, home_after: bool) -> None:
        ...

    @abstractmethod
    def move_to(
        self,
        location: types.Location,
        force_direct: bool = False,
        minimum_z_height: Optional[float] = None,
        speed: Optional[float] = None,
    ) -> None:
        ...

    @abstractmethod
    def aspirate(
        self,
        volume: Optional[float],
        location: Optional[types.Location] = None,
        rate: Optional[float] = 1.0,
    ) -> Tuple[types.Location, Callable]:
        ...

    @abstractmethod
    def dispense(
        self, volume: Optional[float], location: Optional[types.Location], rate: float
    ) -> Tuple[types.Location, Callable]:
        ...

    @abstractmethod
    def blow_out(self, location: types.Location) -> None:
        ...

    @abstractmethod
    def air_gap(self, volume: Optional[float], height: float) -> None:
        ...

    @abstractmethod
    def touch_tip(
        self, location: Optional[Well], radius: float, v_offset: float, speed: float
    ) -> None:
        ...
