"""System resource tracker."""

import typing
import psutil
import fnmatch

from pathlib import Path
from .util import format_command, get_timing_function
from .data_shapes import ProcessResourceUsageSnapshot, MetricsMetadata
from .metrics_store import MetricsStore

_timing_function = get_timing_function()
SHOULD_TRACK_ENV_VAR_NAME: typing.Final[str] = "OT_PERFORMANCE_METRICS_SHOULD_TRACK"


class SystemResourceTracker:
    """Tracks system resource usage."""

    def __init__(
        self,
        process_filters: typing.List[str],
        storage_location: Path,
    ) -> None:
        """Initialize the tracker."""
        self._process_filters = process_filters
        self._processes: typing.List[
            psutil.Process
        ]  # intentionally not public as process.kill can be called
        self._store = MetricsStore[ProcessResourceUsageSnapshot](
            MetricsMetadata(
                name="system_resource_data",
                storage_dir=storage_location,
                headers=ProcessResourceUsageSnapshot.headers(),
            )
        )
        self._store.setup()
        self.refresh_processes()

    def refresh_processes(self) -> None:
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

            if any(
                fnmatch.fnmatch(formatted_cmdline, pattern)
                for pattern in self._process_filters
            ):
                processes.append(process)

        self._processes = processes

    @property
    def snapshots(self) -> typing.List[ProcessResourceUsageSnapshot]:
        """Get snapshots."""
        snapshots: typing.List[ProcessResourceUsageSnapshot] = []
        for process in self._processes:
            with process.oneshot():
                snapshots.append(
                    ProcessResourceUsageSnapshot(
                        query_time=_timing_function(),
                        command=format_command(process.cmdline()),
                        running_since=process.create_time(),
                        cpu_percent=process.cpu_percent(),
                        memory_percent=process.memory_percent(),
                    )
                )

        return snapshots

    def get_and_store_system_data_snapshots(self) -> None:
        """Get and store system data snapshots."""
        self.refresh_processes()
        self._store.add_all(self.snapshots)
        self._store.store()


if __name__ == "__main__":
    # TODO: (dm: 2024-07-01) - replace with service startup logic
    tracker = SystemResourceTracker(
        process_filters=["/opt/opentrons*", "python3*"],
        storage_location=Path("/data/performance_metrics_data/"),
    )
    tracker.get_and_store_system_data_snapshots()
