"""System resource tracker."""

import typing
import psutil
import dataclasses
import fnmatch

from .dev_types import SystemResourceMetricName


def process_matches_a_filter(
    process: psutil.Process, filters: typing.List[str]
) -> bool:
    """Check if a process matches a filter in the passed list.

    Args:
        process (psutil.Process): Process to check.
        filters (list of str): List of command line path filters with globbing support.

    Returns:
        bool: True if the process matches any of the filters, False otherwise.
    """
    try:
        process_cmdline: typing.List[str] | None = process.info.get("cmdline")
    except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
        return False

    if process_cmdline is None:
        return False

    formatted_cmdline: str = " ".join(process.info["cmdline"]).strip()

    if len(formatted_cmdline) == 0:
        return False

    if any(fnmatch.fnmatch(formatted_cmdline, pattern) for pattern in filters):
        return True
    else:
        return False


@dataclasses.dataclass
class SystemResourceTrackingConfiguration:
    """Configuration for system resource tracking."""

    metrics_to_track: typing.Set[SystemResourceMetricName]
    process_filters: typing.List[str]


@dataclasses.dataclass(frozen=True)
class ProcessData:
    """Data for a tracked process."""

    command: str
    running_since: float
    cpu_percent: float
    memory_percent: float

    @classmethod
    def from_psutil_process(cls, process: psutil.Process) -> "ProcessData":
        """Create a ProcessData object from a psutil.Process object."""
        return cls(
            command=" ".join(process.info["cmdline"]).strip(),
            running_since=process.create_time(),
            cpu_percent=process.cpu_percent(),
            memory_percent=process.memory_percent(),
        )


class ProcessTracker:
    """Tracks system resource usage."""

    def __init__(
        self,
        tracking_config: SystemResourceTrackingConfiguration,
    ) -> None:
        """Initialize the tracker."""
        self._tracking_config = tracking_config
        self.processes = self.refresh_processes()

    def refresh_processes(self) -> typing.List[psutil.Process]:
        """Filter processes by their command line path with globbing support.

        Args:
            filters (list of str): List of command line path filters with globbing support.

        Returns:
            list of psutil.Process: List of processes that match the filters.
        """
        # Note that psutil.process_iter caches the list of processes
        # As long as the process is alive, it will be cached and reused on the next call to process_iter.

        # Ensure that when calling process_iter you specify at least one attribute to the attr list.
        # Otherwise all processes info will be retrieved which is slow.
        # Ideally you will only specify the attributes that you want to filter on.
        # This function should only filter processes. Gathering any additional
        # information should be done outside of this function.
        # See https://psutil.readthedocs.io/en/latest/#psutil.process_iter
        return [
            process
            for process in psutil.process_iter(attrs=["cmdline"])
            if process_matches_a_filter(process, self._tracking_config.process_filters)
        ]

    def query_process_data(self) -> typing.List[ProcessData]:
        """Get data for all tracked processes."""
        process_data = []
        for process in self.processes:
            with process.oneshot():
                process_data.append(ProcessData.from_psutil_process(process))
        return process_data


if __name__ == "__main__":
    tracking_config = SystemResourceTrackingConfiguration(
        # metrics_to_track doesn't actually do anything yet
        metrics_to_track={
            "COMMAND_PATH",
            "RUNNING_SINCE",
            "CPU_PERCENT",
            "MEMORY_PERCENT",
        },
        process_filters=["/opt/opentrons*", "python3*"],
    )
    tracked_resources = ProcessTracker(tracking_config)

    for process in tracked_resources.query_process_data():
        print(process)
