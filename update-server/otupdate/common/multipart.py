"""Streaming multipart/form-data parsing.

Starlette's built-in form parsing (``Request.form()``) buffers every uploaded
file in memory or in a temporary file before handing it over. System update
files are on the order of a gigabyte, so we parse the request body as it
arrives and stream the parts we want straight to their final location instead.
"""

from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import IO, TYPE_CHECKING, Collection, List, Optional

from fastapi import Request
from python_multipart.multipart import MultipartParser, parse_options_header

if TYPE_CHECKING:
    # python-multipart only defines this for type checkers.
    from python_multipart.multipart import MultipartCallbacks

LOG = logging.getLogger(__name__)


class MultipartError(Exception):
    """Raised when a request body can't be parsed as multipart/form-data."""


async def save_parts_to_directory(
    request: Request,
    accepted_field_names: Collection[str],
    destination_directory: str,
) -> List[str]:
    """Save a request's multipart form fields into `destination_directory`.

    Every part whose form field name is in `accepted_field_names` is written to
    a file of that same name inside `destination_directory`. Parts with any
    other field name are ignored.

    Returns the field names of every part that was saved, in the order they were
    saved, or an empty list if the request contained no acceptable parts. A field
    name can repeat, in which case each part overwrote the previous one's file.
    """
    saver = _PartSaver(accepted_field_names, destination_directory)
    parser = MultipartParser(_extract_boundary(request), saver.callbacks)

    try:
        async for chunk in request.stream():
            parser.write(chunk)
        parser.finalize()
    finally:
        saver.abort_any_partial_write()

    return saver.saved_field_names


def _extract_boundary(request: Request) -> bytes:
    _, options = parse_options_header(request.headers.get("content-type", ""))
    try:
        return options[b"boundary"]
    except KeyError:
        raise MultipartError("Missing boundary in multipart request.")


def _decode(source: bytes) -> str:
    try:
        return source.decode("utf-8")
    except UnicodeDecodeError:
        return source.decode("latin-1")


class _PartSaver:
    """Callbacks that drive `MultipartParser`, writing accepted parts to disk."""

    def __init__(
        self, accepted_field_names: Collection[str], destination_directory: str
    ) -> None:
        self._accepted_field_names = accepted_field_names
        self._destination_directory = destination_directory
        self._header_name = b""
        self._header_value = b""
        self._content_disposition: Optional[bytes] = None
        self._current_field_name: Optional[str] = None
        self._current_file: Optional[IO[bytes]] = None
        self.saved_field_names: List[str] = []

    @property
    def callbacks(self) -> "MultipartCallbacks":
        return {
            "on_part_begin": self._on_part_begin,
            "on_header_field": self._on_header_field,
            "on_header_value": self._on_header_value,
            "on_header_end": self._on_header_end,
            "on_headers_finished": self._on_headers_finished,
            "on_part_data": self._on_part_data,
            "on_part_end": self._on_part_end,
        }

    def abort_any_partial_write(self) -> None:
        """Close the file being written, if the parse ended part way through one."""
        if self._current_file is not None:
            self._current_file.close()
            self._current_file = None

    def _on_part_begin(self) -> None:
        self._header_name = b""
        self._header_value = b""
        self._content_disposition = None
        self._current_field_name = None

    def _on_header_field(self, data: bytes, start: int, end: int) -> None:
        self._header_name += data[start:end]

    def _on_header_value(self, data: bytes, start: int, end: int) -> None:
        self._header_value += data[start:end]

    def _on_header_end(self) -> None:
        if self._header_name.lower() == b"content-disposition":
            self._content_disposition = self._header_value
        self._header_name = b""
        self._header_value = b""

    def _on_headers_finished(self) -> None:
        field_name = self._parse_field_name()
        if field_name is None or field_name not in self._accepted_field_names:
            LOG.info(f"Unknown field name {field_name} in file_upload, ignoring")
            return

        LOG.info(f"Writing {field_name}")
        Path(self._destination_directory).mkdir(parents=True, exist_ok=True)
        # `field_name` is safe to use as a path component because we just
        # checked it against the caller's allowlist.
        self._current_field_name = field_name
        self._current_file = open(
            os.path.join(self._destination_directory, field_name), "wb"
        )

    def _on_part_data(self, data: bytes, start: int, end: int) -> None:
        if self._current_file is not None:
            self._current_file.write(data[start:end])

    def _on_part_end(self) -> None:
        field_name = self._current_field_name
        if self._current_file is None or field_name is None:
            return
        self._current_file.close()
        self._current_file = None
        self.saved_field_names.append(field_name)
        LOG.info(f"file written, {field_name} to path, {self._destination_directory}")

    def _parse_field_name(self) -> Optional[str]:
        if self._content_disposition is None:
            return None
        _, options = parse_options_header(self._content_disposition)
        raw_field_name = options.get(b"name")
        return None if raw_field_name is None else _decode(raw_field_name)
