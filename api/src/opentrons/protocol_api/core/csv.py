from abc import ABC, abstractmethod
from typing import List


class AbstractCSV(ABC):
    @abstractmethod
    def write_row(self, row: List[str]) -> None:
        """Add a new row to the csv file."""
        ...
