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
        """Returns the file handler for the CSV file.

        The file is treated as read-only, UTF-8-encoded text.
        """
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
        """Returns ``True`` if a file handler is open for the CSV parameter."""
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
        """Parses the CSV data and returns a list of lists.

        Each item in the parent list corresponds to a row in the CSV file.
        If the CSV has a header, that will be the first row in the list: ``.parse_as_csv()[0]``.

        Each item in the child lists corresponds to a single cell within its row.
        The data for each cell is represented as a string. You may need to trim whitespace
        or otherwise validate string contents before passing them as inputs to other API methods.
        For numeric data, cast these strings to integers or floating point numbers,
        as appropriate.

        :param detect_dialect: If ``True``, examine the file and try to assign it a
            :py:class:`csv.Dialect` to improve parsing behavior.
        :param kwargs: For advanced CSV handling, you can pass any of the
            `formatting parameters <https://docs.python.org/3/library/csv.html#csv-fmt-params>`_
            accepted by :py:func:`csv.reader` from the Python standard library.
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
        return self._remove_trailing_empty_rows(rows)

    @staticmethod
    def _remove_trailing_empty_rows(rows: List[List[str]]) -> List[List[str]]:
        """Removes any trailing empty rows."""
        while rows and rows[-1] == []:
            rows.pop()
        return rows
