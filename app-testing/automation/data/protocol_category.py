from dataclasses import dataclass
from typing import Literal


@dataclass(frozen=True)
class ProtocolCategory:
    """Folder structure hierarchy for protocols."""

    robot: Literal["Flex", "OT2"]
    outcome: Literal["Success", "Error"]
    # the remainder of the description is in the file name
