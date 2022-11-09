"""The interface that implements InstrumentContext."""

from __future__ import annotations

from abc import abstractmethod, ABC
from typing import Any, Generic, Optional, TypeVar

from opentrons import types
from opentrons.hardware_control.dev_types import PipetteDict
from opentrons.protocols.api_support.util import Clearances, PlungerSpeeds, FlowRates

from .well import WellCoreType


class AbstractInstrument(ABC, Generic[WellCoreType]):
    @abstractmethod
    def get_default_speed(self) -> float:
        ...

    @abstractmethod
    def set_default_speed(self, speed: float) -> None:
        ...

    @abstractmethod
    def aspirate(
        self,
        location: types.Location,
        well_core: Optional[WellCoreType],
        volume: float,
        rate: float,
        flow_rate: float,
    ) -> None:
        ...

    @abstractmethod
    def dispense(self, volume: float, rate: float) -> None:
        ...

    @abstractmethod
    def blow_out(self) -> None:
        ...

    @abstractmethod
    def touch_tip(
        self, location: WellCoreType, radius: float, v_offset: float, speed: float
    ) -> None:
        ...

    @abstractmethod
    def pick_up_tip(
        self,
        location: types.Location,
        well_core: WellCoreType,
        presses: Optional[int],
        increment: Optional[float],
        prep_after: bool = True,
    ) -> None:
        """Move to and pick up a tip from a given well.

        Args:
            location: The location of the well we're picking up from.
            well_core: The well to pick up from.
            presses: Customize the number of presses the pipette does.
            increment: Customize the movement "distance" of the pipette to press harder.
            prep_after: Move plunger to the "ready to aspirate" position after pick up.
        """
        ...

    @abstractmethod
    def drop_tip(
        self,
        location: Optional[types.Location],
        well_core: WellCoreType,
        home_after: bool,
    ) -> None:
        """Move to and drop a tip into a given well.

        Args:
            location: The location of the well we're dropping to.
                If unspecified, the default drop location of the well will be used.
            well_core: The well we're dropping into
            home_after: Whether to home the pipette after the tip is dropped.
        """
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
        well_core: Optional[WellCoreType],
        force_direct: bool,
        minimum_z_height: Optional[float],
        speed: Optional[float],
    ) -> None:
        ...

    @abstractmethod
    def get_mount(self) -> types.Mount:
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
    def get_hardware_state(self) -> PipetteDict:
        """Get the current state of the pipette hardware as a dictionary."""
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
    def get_absolute_aspirate_flow_rate(self, rate: float) -> float:
        ...

    @abstractmethod
    def set_flow_rate(
        self,
        aspirate: Optional[float] = None,
        dispense: Optional[float] = None,
        blow_out: Optional[float] = None,
    ) -> None:
        ...

    @abstractmethod
    def set_pipette_speed(
        self,
        aspirate: Optional[float] = None,
        dispense: Optional[float] = None,
        blow_out: Optional[float] = None,
    ) -> None:
        ...


InstrumentCoreType = TypeVar("InstrumentCoreType", bound=AbstractInstrument[Any])
