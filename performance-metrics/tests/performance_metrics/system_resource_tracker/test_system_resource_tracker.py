"""Test process resource tracker."""

import typing
import psutil
from pathlib import Path
from unittest.mock import patch, MagicMock
from performance_metrics.system_resource_tracker._system_resource_tracker import (
    SystemResourceTracker,
)
from performance_metrics.system_resource_tracker._config import (
    SystemResourceTrackerConfiguration,
)


def mock_process_iter(
    attrs: typing.Tuple[str, ...]
) -> typing.Tuple[psutil.Process, ...]:
    """Mock psutil.process_iter to return a list of mocked processes."""

    def create_mock_process(
        pid: int, cmdline: typing.Tuple[str, ...]
    ) -> psutil.Process:
        mock_proc = MagicMock(spec=psutil.Process)
        mock_proc.pid = pid
        mock_proc.info = {"cmdline": cmdline}
        mock_proc.cmdline.return_value = cmdline
        return mock_proc

    return (
        create_mock_process(1, ("python", "my_script.py")),
        create_mock_process(2, ("bash", "another_script.sh")),
        create_mock_process(3, ("python", "yet_another_script.py")),
        create_mock_process(4, ("java", "my_java_app.jar")),
    )


@patch("psutil.process_iter", mock_process_iter)
def test_process_filtering(tmp_path: Path) -> None:
    """Test process filtering."""
    config = SystemResourceTrackerConfiguration(
        process_filters=("*my_script.py", "*another_script*"), storage_dir=tmp_path
    )
    tracker = SystemResourceTracker(config)

    tracker.refresh_processes()
    snapshots = tracker.snapshots
    assert len(snapshots) == 3
    assert snapshots[0].command == "python my_script.py"
    assert snapshots[1].command == "bash another_script.sh"
    assert snapshots[2].command == "python yet_another_script.py"
