from dataclasses import dataclass
from pathlib import Path
from typing import Literal


@dataclass(frozen=True)
class ProtocolCategory:
    """Folder structure hierarchy for protocols."""

    robot: Literal["Flex", "OT2"]
    outcome: Literal["Success", "Error"]
    # the remainder of the description is in the file name

    @property
    def folder_path(self) -> Path:
        """Folder name for the category."""
        return Path(self.robot, self.outcome)
