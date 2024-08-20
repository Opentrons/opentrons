import csv
from tempfile import NamedTemporaryFile
from typing import Optional, TextIO, Any, List

from opentrons.protocols.api_support.types import APIVersion

from .exceptions import ParameterValueError, RuntimeParameterRequired


# TODO(jbl 2024-08-02) This is a public facing class and as such should be moved to the protocol_api folder
class CSVParameter:
    def __init__(self, contents: Optional[bytes], api_version: APIVersion) -> None:
        self._contents = contents
        self._api_version = api_version
        self._file: Optional[TextIO] = None

    @property
    def file(self) -> TextIO:
        """Returns the file handler for the CSV file."""
        if self._file is None:
            text = self.contents
            temporary_file = NamedTemporaryFile("r+")
            temporary_file.write(text)
            temporary_file.flush()

            # Open a new file handler for the temporary file with read-only permissions and close the other
            self._file = open(temporary_file.name, "r")
            temporary_file.close()
        return self._file

    @property
    def file_opened(self) -> bool:
        """Return if a file handler has been opened for the CSV parameter."""
        return self._file is not None

    @property
    def contents(self) -> str:
        """Returns the full contents of the CSV file as a single string."""
        if self._contents is None:
            raise RuntimeParameterRequired(
                "CSV parameter needs to be set to a file for full analysis or run."
            )
        return self._contents.decode("utf-8")

    def parse_as_csv(
        self, detect_dialect: bool = True, **kwargs: Any
    ) -> List[List[str]]:
        """Returns a list of rows with each row represented as a list of column elements.

        If there is a header for the CSV that will be the first row in the list (i.e. `.rows()[0]`).
        All elements will be represented as strings, even if they are numeric in nature.
        """
        rows: List[List[str]] = []
        if detect_dialect:
            try:
                dialect = csv.Sniffer().sniff(self.contents[:1024])
                reader = csv.reader(self.contents.split("\n"), dialect, **kwargs)
            except (UnicodeDecodeError, csv.Error):
                raise ParameterValueError(
                    "Cannot parse dialect or contents from provided CSV contents."
                )
        else:
            try:
                reader = csv.reader(self.contents.split("\n"), **kwargs)
            except (UnicodeDecodeError, csv.Error):
                raise ParameterValueError("Cannot parse provided CSV contents.")
        try:
            for row in reader:
                rows.append(row)
        except (UnicodeDecodeError, csv.Error):
            raise ParameterValueError("Cannot parse provided CSV contents.")
        return rows
