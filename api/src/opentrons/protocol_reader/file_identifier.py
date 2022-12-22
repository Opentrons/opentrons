import ast
import json
from dataclasses import dataclass
from typing import Any, Dict, List, Sequence, Union

import anyio

from opentrons.protocols.api_support.definitions import MAX_SUPPORTED_VERSION
from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocols.parse import extract_metadata as extract_python_metadata

from .file_reader_writer import BufferedFile
from .protocol_files_invalid_error import ProtocolFilesInvalidError
from .protocol_source import Metadata


_JSONDict = Dict[str, Any]


@dataclass(frozen=True)
class JsonProtocolFileInfo:
    original_file: BufferedFile
    unvalidated_json: _JSONDict
    schema_version: int
    metadata: Metadata


@dataclass(frozen=True)
class PythonProtocolFileInfo:
    original_file: BufferedFile
    api_level: APIVersion
    metadata: Metadata


@dataclass(frozen=True)
class LabwareDefinitionFileInfo:
    original_file: BufferedFile
    unvalidated_json: _JSONDict


FileInfo = Union[
    JsonProtocolFileInfo,
    PythonProtocolFileInfo,
    LabwareDefinitionFileInfo,
]


class FileIdentifier:
    @staticmethod
    async def identify(files: List[BufferedFile]) -> List[FileInfo]:
        return [await _identify(file) for file in files]


# FIX BEFORE MERGE: Rename exception.
class ConfigAnalysisError(ProtocolFilesInvalidError):
    pass


async def _identify(file: BufferedFile) -> FileInfo:
    if file.name.lower().endswith(".json"):
        return await _analyze_json(json_file=file)
    elif file.name.lower().endswith(".py"):
        return _analyze_python_protocol(py_file=file)
    else:
        # FIX BEFORE MERGE: Use a better exception type.
        raise ConfigAnalysisError(f"{file.name} has an unrecognized file extension.")


async def _analyze_json(
    json_file: BufferedFile,
) -> Union[JsonProtocolFileInfo, LabwareDefinitionFileInfo]:
    try:
        json_contents = await anyio.to_thread.run_sync(json.loads, json_file.contents)
    except json.JSONDecodeError as e:
        # FIX BEFORE MERGE: Exception type.
        raise ConfigAnalysisError(
            f"{json_file.name} is not valid JSON. {str(e)}"
        ) from e

    if _json_seems_like_labware(json_contents):
        return LabwareDefinitionFileInfo(
            original_file=json_file,
            unvalidated_json=json_contents,
        )
    elif _json_seems_like_protocol(json_contents):
        return _analyze_json_protocol(
            original_file=json_file,
            json_contents=json_contents,
        )
    else:
        # FIX BEFORE MERGE: Exception type and message.
        raise ConfigAnalysisError(f"{json_file.name} is not a known Opentrons format.")


def _json_seems_like_labware(json: _JSONDict) -> bool:
    # "ordering" and "wells" are required properties in our labware schema v2.
    return "ordering" in json and "wells" in json


def _json_seems_like_protocol(json: _JSONDict) -> bool:
    # "schemaVersion" and "commands" are required properties in all of our JSON
    # protocol schemas since schema v3. (v7 is the latest at the time of writing.)
    #
    # When we stop supporting v3 files, we can look at "$otSharedSchema" instead,
    # which is more precise.
    return "schemaVersion" in json and "commands" in json


def _analyze_json_protocol(
    original_file: BufferedFile, json_contents: _JSONDict
) -> JsonProtocolFileInfo:
    try:
        metadata = json_contents["metadata"]
        schema_version = json_contents["schemaVersion"]
    except KeyError as e:
        # FIX BEFORE MERGE: Exception type and message.
        raise ConfigAnalysisError from e

    # FIX BEFORE MERGE: Use the actual Metadata model?
    if not isinstance(metadata, dict):
        # FIX BEFORE MERGE: Exception type and message.
        raise ConfigAnalysisError

    if not isinstance(schema_version, int):
        # FIX BEFORE MERGE: Exception type and message.
        raise ConfigAnalysisError

    return JsonProtocolFileInfo(
        original_file=original_file,
        unvalidated_json=json_contents,
        schema_version=schema_version,
        metadata=metadata,
    )


# todo(mm, 2021-09-13): Deduplicate with opentrons.protocols.parse.
def _analyze_python_protocol(
    py_file: BufferedFile,
) -> PythonProtocolFileInfo:  # noqa: C901
    try:
        # todo(mm, 2021-09-13): Investigate whether it's really appropriate to leave
        # the Python compilation flags at their defaults. For example, we probably
        # don't truly want the protocol to inherit our own __future__ features.
        module_ast = ast.parse(source=py_file.contents, filename=py_file.name)
    except (SyntaxError, ValueError) as e:
        # ast.parse() raises SyntaxError for most errors,
        # but ValueError if the source contains null bytes.
        raise ConfigAnalysisError(f"Unable to parse {py_file.name}.") from e
        # FIX BEFORE MERGE: Exception type.

    try:
        metadata = extract_python_metadata(module_ast)
    except ValueError as e:
        raise ConfigAnalysisError(
            f"Unable to extract metadata from {py_file.name}."
        ) from e

    try:
        api_level = metadata["apiLevel"]
    except KeyError as e:
        raise ConfigAnalysisError(
            "metadata.apiLevel missing or not statically analyzable"
            f" in {py_file.name}."
        ) from e

    if not isinstance(api_level, str):
        raise ConfigAnalysisError(
            f"metadata.apiLevel must be a string, but it instead has type"
            f' "{type(api_level)}" in {py_file.name}.'
        )

    try:
        api_version = APIVersion.from_string(api_level)
    except ValueError as e:
        raise ConfigAnalysisError(
            f'metadata.apiLevel "{api_level}" is not of the format X.Y'
            f" in {py_file.name}."
        ) from e

    if api_version > MAX_SUPPORTED_VERSION:
        raise ConfigAnalysisError(
            f"API version {api_version} is not supported by this "
            f"robot software. Please either reduce your requested API "
            f"version or update your robot."
        )

    return PythonProtocolFileInfo(
        original_file=py_file,
        metadata=metadata,
        api_level=api_version,
    )
