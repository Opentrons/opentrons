from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Optional

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
        volume: float,
        location: types.Location,
        rate: float,
    ) -> None:
        ...

    @abstractmethod
    def dispense(self, volume: float, location: types.Location, rate: float) -> None:
        ...

    @abstractmethod
    def blow_out(self, location: types.Location) -> None:
        ...

    @abstractmethod
    def touch_tip(
        self, well: Well, radius: float, v_offset: float, speed: float
    ) -> None:
        ...
