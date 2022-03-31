"""Types and definitions for hardware bindings."""
from typing import Mapping, TypeVar, Dict

from opentrons_hardware.firmware_bindings.constants import NodeId

MapPayload = TypeVar("MapPayload")

NodeMap = Mapping[NodeId, MapPayload]

NodeDict = Dict[NodeId, MapPayload]
