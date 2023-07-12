"""Types and definitions for hardware bindings."""
from typing import Mapping, TypeVar, Dict, List, Optional
from dataclasses import dataclass

from opentrons_hardware.firmware_bindings.constants import NodeId

MapPayload = TypeVar("MapPayload")

NodeMap = Mapping[NodeId, MapPayload]

NodeList = List[NodeId]

NodeDict = Dict[NodeId, MapPayload]


@dataclass
class PCBARevision:
    """The electrical revision of a PCBA."""

    main: Optional[str]
    #: A combination of primary and secondary used for looking up firmware
    tertiary: Optional[str] = None
    #: An often-not-present tertiary
