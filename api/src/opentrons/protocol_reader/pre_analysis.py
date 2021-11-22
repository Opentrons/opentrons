"""Protocol pre-analysis.

Pre-analysis is the first step to reading a protocol. Given an opaque set of files,
pre-analysis extracts basic information, like whether the files appear to represent a
protocol, and if so, what kind of protocol it is.
"""
from ast import parse as parse_python
from dataclasses import dataclass
from json import JSONDecodeError, loads as json_loads
from pathlib import Path
from typing import Any, IO, Dict, Sequence, Union
from typing_extensions import Protocol

from pydantic import ValidationError as PydanticValidationError

from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocols.parse import extract_metadata as extract_python_metadata
from opentrons.protocols.models import JsonProtocol


class InputFile(Protocol):
    """An individual file to be pre-analyzed as part of a protocol.

    Properties:
        filename: The basename, including extension, of the file.
        file: A [file](https://docs.python.org/3/glossary.html#term-file-object)
            providing the contents of the protocol to be read. If you want
            to read this file multiple times, you should call `seek(0)`
            after passing it to the PreAnalyzer.
    """

    filename: str
    file: IO[bytes]


Metadata = Dict[str, Any]
"""A protocol's metadata (non-essential info, like author and title).

Robot software should not change how it handles a protocol depending on anything in
here.

This must be a simple JSON-like dict, serializable to JSON via ``json.dumps()``.
``Dict[str, Any]`` is an overly-permissive approximation,
needed because mypy doesn't support recursive types.
"""


@dataclass(frozen=True)
class PythonPreAnalysis:
    """A pre-analysis of a Python protocol."""

    metadata: Metadata
    api_version: APIVersion


@dataclass(frozen=True)
class JsonPreAnalysis:
    """A pre-analysis of a JSON protocol."""

    metadata: Metadata
    schema_version: int


PreAnalysis = Union[PythonPreAnalysis, JsonPreAnalysis]


# todo(mm, 2021-09-13): Currently wrapped in a class so dependency-injection and mocking
# feel less fragile, pending a team discussion about whether we still think this is
# a good thing to do in Python.
class PreAnalyzer:
    """A protocol pre-analyzer."""

    @staticmethod
    def analyze(protocol_files: Sequence[InputFile]) -> PreAnalysis:
        """Pre-analyze a set of files that's thought to define a protocol.

        Returns:
            A `JsonPreAnalysis` or `PythonPreAnalysis`, if the files look like a
            basically valid JSON or Python protocol, respectively.

        Raises:
            Any `NotPreAnalyzableError` subclass defined in this module: If a problem
                with the protocol prevents pre-analysis.

            IOError: If a file isn't readable.
        """
        if len(protocol_files) == 0:
            raise NoFilesError("Protocol must have at least one file.")
        elif len(protocol_files) > 1:
            # TODO(mm, 2021-09-07): add multi-file support
            raise NotImplementedError("Multi-file protocols not yet supported.")

        main_file = protocol_files[0]
        suffix = Path(main_file.filename).suffix

        # May raise IOError.
        main_file_contents = main_file.file.read()

        if suffix == ".json":
            return _analyze_json(main_file_contents)
        elif suffix == ".py":
            return _analyze_python(main_file_contents, main_file.filename)
        else:
            raise FileTypeError(f'Unrecognized file extension "{suffix}"')


def _analyze_json(main_file_contents: bytes) -> JsonPreAnalysis:
    try:
        # Avoid JsonProtocol.parse_raw() because it wraps JSONDecodeError with
        # PydanticValidationError, but we want to preserve the distinction.
        parsed_json = json_loads(main_file_contents)
    except JSONDecodeError as exception:
        raise JsonParseError() from exception
    try:
        parsed_protocol = JsonProtocol.parse_obj(parsed_json)
    except PydanticValidationError as exception:
        raise JsonSchemaValidationError() from exception

    return JsonPreAnalysis(
        metadata=parsed_protocol.metadata.dict(exclude_unset=True),
        schema_version=parsed_protocol.schemaVersion,
    )


# todo(mm, 2021-09-13): Deduplicate with opentrons.protocols.parse.
def _analyze_python(  # noqa: C901
    main_file_contents: bytes,
    main_file_name: str,
) -> "PythonPreAnalysis":
    try:
        # todo(mm, 2021-09-13): Investigate whether it's really appropriate to leave
        # the Python compilation flags at their defaults. For example, we probably
        # don't truly want the protocol to inherit our own __future__ features.
        module_ast = parse_python(source=main_file_contents, filename=main_file_name)
    except (SyntaxError, ValueError) as exception:
        # parse_python() raises SyntaxError for most errors,
        # but ValueError if the source contains null bytes.
        raise PythonFileParseError() from exception

    try:
        metadata = extract_python_metadata(module_ast)
    except ValueError as exception:
        raise PythonMetadataError() from exception

    try:
        api_level = metadata["apiLevel"]
    except KeyError as exception:
        raise PythonMetadataError(
            f"No apiLevel found in metadata: {metadata}"
        ) from exception

    if not isinstance(api_level, str):
        raise PythonMetadataError(
            f"apiLevel must be a string, but it instead has type"
            f' "{type(api_level)}".'
        )

    try:
        api_version = APIVersion.from_string(api_level)
    except ValueError as exception:
        raise PythonMetadataError(
            f"apiLevel '{api_level}' is not of the format X.Y"
        ) from exception

    return PythonPreAnalysis(metadata=metadata, api_version=api_version)


class NotPreAnalyzableError(Exception):
    """Raised when any problem with the provided files prevents pre-analysis."""


class FileTypeError(NotPreAnalyzableError):
    """Raised when a file is provided that doesn't look like any kind of protocol."""


class NoFilesError(NotPreAnalyzableError):
    """Raised when an empty list of files is provided."""


class JsonParseError(NotPreAnalyzableError):
    """Raised when an apparent JSON protocol isn't actually parseable as JSON."""


class JsonSchemaValidationError(NotPreAnalyzableError):
    """Raised when an apparent JSON protocol doesn't conform to our schema."""


class PythonFileParseError(NotPreAnalyzableError):
    """Raised when an apparent Python protocol can't be parsed as Python."""


class PythonMetadataError(NotPreAnalyzableError):
    """Raised when something's wrong with a Python protocol's metadata block."""
