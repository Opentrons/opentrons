from pathlib import Path
from opentrons_shared_data.performance.dev_types import RobotContextState


def test_metrics_metadata(tmp_path: Path) -> None:
    RobotContextState.ANALYZING_PROTOCOL
