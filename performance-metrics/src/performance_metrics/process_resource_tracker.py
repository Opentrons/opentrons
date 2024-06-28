"""System resource tracker."""

import typing
import psutil
import dataclasses
import fnmatch
from time import sleep

from .util import get_timing_function, format_command

_timing_function = get_timing_function()


@dataclasses.dataclass(frozen=True)
class ProcessResourceUsageSnapshot:
    """Data for a tracked process."""

    query_time: int
    command: str
    running_since: float
    cpu_percent: float
    memory_percent: float

    @classmethod
    def from_psutil_process(cls, process: psutil.Process) -> "ProcessResourceUsageSnapshot":
        """Create a ProcessData object from a psutil.Process object."""
        return cls(
            query_time=_timing_function(),
            command=format_command(process.cmdline()),
            running_since=process.create_time(),
            cpu_percent=process.cpu_percent(),
            memory_percent=process.memory_percent(),
        )


class ProcessResourceTracker:
    """Tracks system resource usage."""

    def __init__(
        self,
        process_filters: typing.List[str],
    ) -> None:
        """Initialize the tracker."""
        self._process_filters = process_filters
        self._processes: typing.List[psutil.Process]  # intentionally not exposed as process.kill can be called
        self._refresh_processes()

    def _refresh_processes(self) -> None:
        """Filter processes by their command line path with globbing support.

        Returns:
            list of psutil.Process: List of processes that match the filters.
        """
        # Note that psutil.process_iter caches the list of processes
        # As long as the process is alive, it will be cached and reused on the next call to process_iter.

        # Ensure that when calling process_iter you specify at least one attribute to the attr list.
        # Otherwise all processes info will be retrieved which is slow.
        # Ideally you will only specify the attributes that you want to filter on.

        # See https://psutil.readthedocs.io/en/latest/#psutil.process_iter

        processes = []
        for process in psutil.process_iter(attrs=["cmdline"]):
            try:
                process_cmdline: typing.List[str] | None = process.info.get("cmdline")
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                continue

            if not process_cmdline:
                continue

            formatted_cmdline: str = format_command(process_cmdline)

            if not formatted_cmdline:
                continue

            if any(fnmatch.fnmatch(formatted_cmdline, pattern) for pattern in self._process_filters):
                processes.append(process)
                
        self._processes = processes

    def query_process_data(self) -> typing.List[ProcessResourceUsageSnapshot]:
        """Query the tracked processes."""
        self._refresh_processes()
        return [ProcessResourceUsageSnapshot.from_psutil_process(process) for process in self._processes]