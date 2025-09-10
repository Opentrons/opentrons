"""Types and definitions for hardware bindings."""
import re
from dataclasses import dataclass
from enum import Enum
from typing import Mapping, TypeVar, Dict, List, Optional, Tuple
from functools import total_ordering

from opentrons_hardware.firmware_bindings.constants import NodeId, MoveAckId

MapPayload = TypeVar("MapPayload")

NodeMap = Mapping[NodeId, MapPayload]

NodeList = List[NodeId]

NodeDict = Dict[NodeId, MapPayload]


@total_ordering
@dataclass(frozen=True)
class PCBARevision:
    """The electrical revision of a PCBA."""

    main: Optional[str]
    #: A combination of primary and secondary used for looking up firmware
    tertiary: Optional[str] = None
    #: An often-not-present tertiary

    @classmethod
    def from_string(cls, rev: str) -> "PCBARevision":
        """Parse a revision string of the form 'xy.z'."""
        match = re.match(r"^([A-Za-z]\d+)(?:\.(\d+))?$", rev)
        if not match:
            raise ValueError(f"Invalid revision format: {rev}")
        main, tertiary = match.groups()
        return cls(main, tertiary)

    def __repr__(self) -> str:
        """Readable representation of the PCB revision."""
        return f"{self.main}.{self.tertiary or 0}".upper()

    def _as_tuple(self) -> Tuple[str, int, int]:
        if not self.main:
            return ("", 0, 0)

        prim = self.main[0]
        sec = int(self.main[1:]) if len(self.main) > 1 else 0
        tert = int(self.tertiary) if self.tertiary else 0
        return (prim, sec, tert)

    def __gt__(self, other: "PCBARevision") -> bool:
        return self._as_tuple() > other._as_tuple()

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, PCBARevision):
            return False
        return self._as_tuple() == other._as_tuple()


class MoveCompleteAck(Enum):
    """Move Complete Ack."""

    complete_without_condition = MoveAckId.complete_without_condition.value
    stopped_by_condition = MoveAckId.stopped_by_condition.value
    timeout = MoveAckId.timeout.value
    position_error = MoveAckId.position_error.value


@dataclass
class MotorPositionStatus:
    """Motor Position Status information."""

    motor_position: float
    encoder_position: float
    motor_ok: bool
    encoder_ok: bool
    move_ack: Optional[MoveCompleteAck] = None

    def positions_only(self) -> Tuple[float, float]:
        """Returns motor and encoder positions as a tuple."""
        return (
            self.motor_position,
            self.encoder_position,
        )
