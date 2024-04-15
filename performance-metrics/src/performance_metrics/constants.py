from enum import Enum
from pathlib import Path

class PerformanceMetricsFilename(Enum):
    """Performance metrics filenames."""

    ROBOT_CONTEXT = "robot_context.csv"

    def get_storage_file_path(self, base_path: Path) -> Path:
        """Builds the full path to the file."""
        return base_path / self.value