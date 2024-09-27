"""Interface for storing performance metrics data to a CSV file."""

import csv
import typing
import logging
from ._data_shapes import MetricsMetadata, CSVStorageBase
from ._logging_config import LOGGER_NAME

logger = logging.getLogger(LOGGER_NAME)

T = typing.TypeVar("T", bound=CSVStorageBase)


class MetricsStore(typing.Generic[T]):
    """Dataclass to store data for tracking robot activity."""

    def __init__(self, metadata: MetricsMetadata) -> None:
        """Initialize the metrics store."""
        self.metadata = metadata
        self._data_store: typing.List[T] = []

    def add(self, data: T) -> None:
        """Add data to the store."""
        self._data_store.append(data)

    def add_all(self, data: typing.Iterable[T]) -> None:
        """Add data to the store."""
        self._data_store.extend(data)

    def setup(self) -> None:
        """Set up the data store."""
        logger.info(
            f"Setting up metrics store for {self.metadata.name} at {self.metadata.storage_dir}"
        )
        self.metadata.storage_dir.mkdir(parents=True, exist_ok=True)
        self.metadata.data_file_location.touch(exist_ok=True)
        self.metadata.headers_file_location.touch(exist_ok=True)
        self.metadata.headers_file_location.write_text(",".join(self.metadata.headers))

    def store(self) -> None:
        """Clear the stored data and write it to the storage file."""
        stored_data = self._data_store.copy()
        self._data_store.clear()
        rows_to_write = [activity_data.csv_row() for activity_data in stored_data]
        with open(self.metadata.data_file_location, "a") as storage_file:
            logger.debug(
                f"Writing {len(rows_to_write)} rows to {self.metadata.data_file_location}"
            )
            writer = csv.writer(storage_file, quoting=csv.QUOTE_ALL)
            writer.writerows(rows_to_write)
