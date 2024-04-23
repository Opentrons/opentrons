from pathlib import Path
import pytest
from opentrons_shared_data.performance.dev_types import MetricsMetadata

def test_metrics_metadata(tmp_path: Path) -> None:
    MetricsMetadata(
        name="test",
        storage_dir=tmp_path,
        headers=("a", "b")
    )