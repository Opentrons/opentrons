"""Interface for storing performance metrics data to a CSV file."""

import csv
import typing
from opentrons_shared_data.performance.dev_types import MetricsMetadata
from performance_metrics.datashapes import SupportsCSVStorage

T = typing.TypeVar("T", bound=SupportsCSVStorage)


class MetricsStore(typing.Generic[T]):
    """Dataclass to store data for tracking robot context."""

    def __init__(self, metadata: MetricsMetadata) -> None:
        """Initialize the metrics store."""
        self.metadata = metadata
        self._data: typing.List[T] = []

    def add(self, context_data: T) -> None:
        """Add data to the store."""
        self._data.append(context_data)

    def setup(self) -> None:
        """Set up the data store."""
        self.metadata.storage_dir.mkdir(parents=True, exist_ok=True)
        self.metadata.data_file_location.touch(exist_ok=True)
        self.metadata.headers_file_location.touch(exist_ok=True)
        self.metadata.headers_file_location.write_text(",".join(self.metadata.headers))

    def store(self) -> None:
        """Clear the stored data and write it to the storage file."""
        stored_data = self._data.copy()
        self._data.clear()
        rows_to_write = [context_data.csv_row() for context_data in stored_data]
        with open(self.metadata.data_file_location, "a") as storage_file:
            writer = csv.writer(storage_file)
            writer.writerows(rows_to_write)
