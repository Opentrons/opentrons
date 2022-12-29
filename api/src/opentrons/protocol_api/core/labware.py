"""The interface that implements InstrumentContext."""
from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Generic, List, NamedTuple, Optional, TypeVar

from opentrons_shared_data.labware.dev_types import (
    LabwareUri,
    LabwareParameters as LabwareParametersDict,
    LabwareDefinition as LabwareDefinitionDict,
)

from opentrons.protocols.geometry.labware_geometry import AbstractLabwareGeometry
from opentrons.protocols.api_support.tip_tracker import TipTracker
from opentrons.types import DeckSlotName, Point

from .well import WellCoreType


class LabwareLoadParams(NamedTuple):
    """Unique load parameters of a labware."""

    namespace: str
    load_name: str
    version: int

    def as_uri(self) -> LabwareUri:
        """Get the labware's definition URI from the load parameters."""
        return LabwareUri(f"{self.namespace}/{self.load_name}/{self.version}")

    @classmethod
    def from_uri(cls, uri: LabwareUri) -> LabwareLoadParams:
        namespace, load_name, version_str = uri.split("/")
        return cls(namespace, load_name, int(version_str))


class AbstractLabware(ABC, Generic[WellCoreType]):
    """Labware implementation core interface."""

    @property
    @abstractmethod
    def load_name(self) -> str:
        """Get the labware's load name."""

    @property
    @abstractmethod
    def highest_z(self) -> float:
        """Get the Z coordinate of the labware's highest point"""

    @abstractmethod
    def get_uri(self) -> str:
        """Get the URI string string of the labware's definition.

        The URI is unique for a given namespace, load name, and definition version.
        """

    @abstractmethod
    def get_load_params(self) -> LabwareLoadParams:
        ...

    @abstractmethod
    def get_display_name(self) -> str:
        """Get a display name for the labware, falling back to the definition."""

    @abstractmethod
    def get_user_display_name(self) -> Optional[str]:
        """Get the user-specified display name of the labware, if set."""

    @abstractmethod
    def get_name(self) -> str:
        ...

    @abstractmethod
    def set_name(self, new_name: str) -> None:
        ...

    @abstractmethod
    def get_definition(self) -> LabwareDefinitionDict:
        """Get the labware's definition as a plain dictionary."""

    @abstractmethod
    def get_parameters(self) -> LabwareParametersDict:
        """Get the labware's definition's `parameters` field as a plain dictionary."""

    @abstractmethod
    def get_quirks(self) -> List[str]:
        ...

    @abstractmethod
    def set_calibration(self, delta: Point) -> None:
        ...

    @abstractmethod
    def get_calibrated_offset(self) -> Point:
        ...

    @abstractmethod
    def is_tip_rack(self) -> bool:
        "Whether the labware is a tip rack."

    @abstractmethod
    def is_fixed_trash(self) -> bool:
        "Whether the labware is a fixed trash."

    @abstractmethod
    def get_tip_length(self) -> float:
        ...

    @abstractmethod
    def set_tip_length(self, length: float) -> None:
        ...

    @abstractmethod
    def reset_tips(self) -> None:
        ...

    @abstractmethod
    def get_next_tip(
        self, num_tips: int, starting_tip: Optional[WellCoreType]
    ) -> Optional[str]:
        """Get the name of the next available tip(s) in the rack, if available."""

    # TODO(mc, 2022-11-09): remove from abstract core
    @abstractmethod
    def get_tip_tracker(self) -> TipTracker:
        ...

    @abstractmethod
    def get_well_columns(self) -> List[List[str]]:
        """Get the all well names, organized by column, from the labware's definition."""

    @abstractmethod
    def get_geometry(self) -> AbstractLabwareGeometry:
        ...

    @abstractmethod
    def get_default_magnet_engage_height(
        self,
        preserve_half_mm: bool = False,
    ) -> Optional[float]:
        """Get the labware's default magnet engage height, if defined.

        Value returned is in real millimeters from the labware's base,
        unless `preserve_half_mm` is specified, in which case
        some definitions will return half-millimeters.
        """

    @abstractmethod
    def get_well_core(self, well_name: str) -> WellCoreType:
        """Get a well core interface to a given well in this labware."""

    @abstractmethod
    def get_deck_slot(self) -> Optional[DeckSlotName]:
        """Get the deck slot the labware or its parent is in, if any."""


LabwareCoreType = TypeVar("LabwareCoreType", bound=AbstractLabware[Any])
