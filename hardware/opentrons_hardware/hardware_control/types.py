"""Types and definitions for hardware bindings."""
from typing import Mapping, TypeVar, Dict, List

from opentrons_hardware.firmware_bindings.constants import NodeId

MapPayload = TypeVar("MapPayload")

NodeMap = Mapping[NodeId, MapPayload]

NodeList = List[NodeId]

NodeDict = Dict[NodeId, MapPayload]
