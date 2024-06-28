import typing
import pytest
import psutil
from unittest.mock import patch, MagicMock
from performance_metrics.process_resource_tracker import ProcessResourceTracker
from performance_metrics.util import get_timing_function, format_command


def mock_process_iter(attrs=None) -> typing.List[psutil.Process]:
    mock_procs = []
    
    def create_mock_process(pid, cmdline):
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

@patch('psutil.process_iter', mock_process_iter)
def test_process_filtering():
    tracker = ProcessResourceTracker(process_filters=["*my_script.py", "*another_script*"])
    
    tracker._refresh_processes()
    filtered_processes = tracker._processes
    
    assert len(filtered_processes) == 3
    assert filtered_processes[0].pid == 1
    assert filtered_processes[1].pid == 2
    assert filtered_processes[2].pid == 3