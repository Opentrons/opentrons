"""Test process resource tracker."""

import typing
import psutil
from unittest.mock import patch, MagicMock
from performance_metrics.system_resource_tracker import SystemResourceTracker


def mock_process_iter(attrs: typing.List[str]) -> typing.List[psutil.Process]:
    """Mock psutil.process_iter to return a list of mocked processes."""
    mock_procs = []

    def create_mock_process(pid: int, cmdline: typing.List[str]) -> psutil.Process:
        mock_proc = MagicMock(spec=psutil.Process)
        mock_proc.pid = pid
        mock_proc.info = {"cmdline": cmdline}
        mock_proc.cmdline.return_value = cmdline
        return mock_proc

    mock_procs.append(create_mock_process(1, ["python", "my_script.py"]))
    mock_procs.append(create_mock_process(2, ["bash", "another_script.sh"]))
    mock_procs.append(create_mock_process(3, ["python", "yet_another_script.py"]))
    mock_procs.append(create_mock_process(4, ["java", "my_java_app.jar"]))

    return mock_procs


@patch("psutil.process_iter", mock_process_iter)
def test_process_filtering() -> None:
    """Test process filtering."""
    tracker = SystemResourceTracker(
        process_filters=["*my_script.py", "*another_script*"],
        storage_location=MagicMock(),
    )

    tracker.refresh_processes()
    snapshots = tracker.snapshots
    assert len(snapshots) == 3
    assert snapshots[0].command == "python my_script.py"
    assert snapshots[1].command == "bash another_script.sh"
    assert snapshots[2].command == "python yet_another_script.py"
