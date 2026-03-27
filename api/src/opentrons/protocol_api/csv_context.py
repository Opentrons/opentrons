"""Provide an way to create an update csv files."""

from typing import List

from .core.csv import AbstractCSV
from opentrons.protocols.api_support.types import APIVersion


class CSVContext:
    """Provide a protocol accessible csv object."""

    def __init__(self, core: AbstractCSV, api_version: APIVersion):
        """Create a new CSV context."""
        self._core = core
        self._api_version = api_version

    def write_row(self, row: List[str]) -> None:
        """Append a row to the csv."""
        self._core.write_row(row)
