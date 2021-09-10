# noqa: D100

from dataclasses import dataclass
from json import JSONDecodeError, loads as json_loads
from pathlib import Path
from typing import Any, Dict, List, Union

from pydantic import ValidationError as PydanticValidationError

from opentrons.protocols.models import JsonProtocol


class PreAnalyzer:  # noqa: D101
    @staticmethod
    def analyze(  # noqa: D102
        protocol_files: List[Path],
    ) -> Union["PythonPreAnalysis", "JsonPreAnalysis"]:
        if len(protocol_files) == 0:
            raise NoFilesError("Protocol must have at least one file.")
        elif len(protocol_files) > 1:
            # TODO(mm, 2021-09-07): add multi-file support
            raise NotImplementedError("Multi-file protocols not yet supported.")

        main_file = protocol_files[0]
        suffix = main_file.suffix

        if suffix == ".json":
            return _analyze_json(main_file)
        elif suffix == ".py":
            raise NotImplementedError()
        else:
            raise FileTypeError(f'Unrecognized file extension "{suffix}"')


def _analyze_json(main_file: Path) -> "JsonPreAnalysis":
    try:
        parsed_json = json_loads(main_file.read_bytes())
    except JSONDecodeError as exception:
        raise JsonParseError() from exception

    try:
        JsonProtocol.parse_obj(parsed_json)
    except PydanticValidationError as exception:
        raise JsonSchemaValidationError() from exception

    # We extract metadata directly from the JSON dict,
    # instead of from the fully parsed Pydantic model.
    # This way, we preserve metadata fields that the Pydantic model doesn't know about.
    # (Otherwise, Pydantic would silently discard them.)
    return JsonPreAnalysis(metadata=parsed_json["metadata"])


Metadata = Dict[str, Any]
"""A protocol's metadata (non-essential info, like author and title).

Robot software should not change how it handles a protocol depending on anything in
here.

This must be a simple JSON-like dict, serializable to JSON via ``json.dumps()``.
``Dict[str, Any]`` is an overly-permissive approximation, needed because mypy doesn't
support recursive types.
"""


@dataclass(frozen=True)
class PythonPreAnalysis:  # noqa: D101
    metadata: Metadata
    api_level: str


@dataclass(frozen=True)
class JsonPreAnalysis:  # noqa: D101
    metadata: Metadata


class NotPreAnalyzableError(Exception):
    """Raised when a problem with the provided files prevents pre-analysis."""


class FileTypeError(NotPreAnalyzableError):
    """Raised when a file is provided that's apparently not a protocol file."""


class JsonParseError(NotPreAnalyzableError):
    """Raised when an apparent JSON protocol isn't actually parseable as JSON."""


class JsonSchemaValidationError(NotPreAnalyzableError):
    """Raised when an apparent JSON protocol doesn't conform to our schema."""


class NoFilesError(NotPreAnalyzableError):
    """Raised when an empty list of files is provided."""
