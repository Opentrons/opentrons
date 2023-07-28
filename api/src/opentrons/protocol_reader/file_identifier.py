"""File identifier interface."""

import ast
import json
from dataclasses import dataclass
from typing import Any, Dict, Sequence, Union

import anyio

from opentrons_shared_data.robot.dev_types import RobotType

from opentrons.protocols.api_support.definitions import MAX_SUPPORTED_VERSION
from opentrons.protocols.parse import (
    extract_static_python_info,
    version_from_static_python_info,
)
from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocols.types import StaticPythonInfo

from .file_reader_writer import BufferedFile
from .protocol_files_invalid_error import ProtocolFilesInvalidError
from .protocol_source import Metadata


JsonDict = Dict[str, Any]


@dataclass(frozen=True)
class IdentifiedJsonMain:
    """A file identified as a JSON protocol's main .json file."""

    original_file: BufferedFile
    """The original file that this was identified from."""

    unvalidated_json: JsonDict
    """The parsed JSON contents.

    Believed, but not confirmed at this point, to conform to one of our JSON protocol
    schemas.
    """

    schema_version: int
    """The JSON protocol schema that this file is believed to conform to."""

    robot_type: RobotType
    """The type of robot on which this protocol is meant to run."""

    metadata: Metadata
    """The protocol metadata extracted from this file."""


@dataclass(frozen=True)
class IdentifiedPythonMain:
    """A file identified as a Python protocol's main .py file."""

    original_file: BufferedFile
    """The original file that this was identified from."""

    api_level: APIVersion
    """The Python Protocol API apiLevel declared by the Python source."""

    robot_type: RobotType
    """The type of robot on which this protocol is meant to run."""

    metadata: Metadata
    """The protocol metadata extracted from this file."""


@dataclass(frozen=True)
class IdentifiedLabwareDefinition:
    """A file identified as a labware definition."""

    original_file: BufferedFile
    """The original file that this was identified from."""

    unvalidated_json: JsonDict
    """The parsed JSON contents.

    Believed, but not confirmed at this point, to conform to our labware definition
    schema v2.
    """


@dataclass(frozen=True)
class IdentifiedData:
    """A file identified as a user-defined data file."""

    original_file: BufferedFile
    """The original file that this was identified from."""


IdentifiedFile = Union[
    IdentifiedJsonMain,
    IdentifiedPythonMain,
    IdentifiedLabwareDefinition,
    IdentifiedData,
]


class FileIdentificationError(ProtocolFilesInvalidError):
    """Raised when FileIdentifier detects an invalid file."""


class FileIdentifier:
    """File identifier interface."""

    @staticmethod
    async def identify(files: Sequence[BufferedFile]) -> Sequence[IdentifiedFile]:
        """Identify the type and extract basic information from each file.

        This is intended to take ≲1 second per protocol on an OT-2, so it can extract
        basic information about all stored protocols relatively quickly. Fully parsing
        and validating protocols can take 10-100x longer, so that's left to other units,
        for only when it's really needed.
        """
        return [await _identify(file) for file in files]


async def _identify(file: BufferedFile) -> IdentifiedFile:
    lower_file_name = file.name.lower()
    if lower_file_name.endswith(".json"):
        return await _analyze_json(json_file=file)
    elif lower_file_name.endswith(".py"):
        return _analyze_python_protocol(py_file=file)
    elif lower_file_name.endswith(".csv") or lower_file_name.endswith(".txt"):
        return IdentifiedData(original_file=file)
    else:
        raise FileIdentificationError(
            f"{file.name} has an unrecognized file extension."
        )


async def _analyze_json(
    json_file: BufferedFile,
) -> Union[IdentifiedJsonMain, IdentifiedLabwareDefinition]:
    try:
        json_contents = await anyio.to_thread.run_sync(json.loads, json_file.contents)
    except json.JSONDecodeError as e:
        raise FileIdentificationError(
            f"{json_file.name} is not valid JSON. {str(e)}"
        ) from e

    if _json_seems_like_labware(json_contents):
        return IdentifiedLabwareDefinition(
            original_file=json_file,
            unvalidated_json=json_contents,
        )
    elif _json_seems_like_protocol(json_contents):
        return _analyze_json_protocol(
            original_file=json_file,
            json_contents=json_contents,
        )
    else:
        raise FileIdentificationError(
            f"{json_file.name} is not a known Opentrons format."
        )


def _json_seems_like_labware(json: JsonDict) -> bool:
    # "ordering" and "wells" are required properties in our labware schema v2.
    return "ordering" in json and "wells" in json


def _json_seems_like_protocol(json: JsonDict) -> bool:
    # "schemaVersion" and "commands" are required properties in all of our JSON
    # protocol schemas since schema v3. (v7 is the latest at the time of writing.)
    #
    # When we stop supporting v3 files, we can look at "$otSharedSchema" instead,
    # which is more precise.
    return "schemaVersion" in json and "commands" in json


def _analyze_json_protocol(
    original_file: BufferedFile, json_contents: JsonDict
) -> IdentifiedJsonMain:
    error_message = f"{original_file.name} is not a valid JSON protocol."

    try:
        metadata = json_contents["metadata"]
        schema_version = json_contents["schemaVersion"]
        robot_type = json_contents["robot"]["model"]
    except KeyError as e:
        raise FileIdentificationError(error_message) from e

    # todo(mm, 2022-12-22): A JSON protocol file's metadata is not quite just an
    # arbitrary dict: its fields are supposed to follow a schema. Should we validate
    # this metadata against that schema instead of doing this simple isinstance() check?
    if not isinstance(metadata, dict):
        raise FileIdentificationError(error_message)

    if not isinstance(schema_version, int):
        raise FileIdentificationError(error_message)

    if robot_type not in ("OT-2 Standard", "OT-3 Standard"):
        raise FileIdentificationError(error_message)

    return IdentifiedJsonMain(
        original_file=original_file,
        unvalidated_json=json_contents,
        schema_version=schema_version,
        robot_type=robot_type,
        metadata=metadata,
    )


# todo(mm, 2021-09-13): This duplicates opentrons.protocols.parse.parse()
# and misses some of its functionality. For example, this misses looking at import
# statements to see if a protocol looks like APIv1, and this misses statically
# validating the structure of an APIv2 protocol to make sure it has exactly 1 run()
# function, etc.
def _analyze_python_protocol(
    py_file: BufferedFile,
) -> IdentifiedPythonMain:
    try:
        # todo(mm, 2021-09-13): Investigate whether it's really appropriate to leave
        # the Python compilation flags at their defaults. For example, we probably
        # don't truly want the protocol to inherit our own __future__ features.
        module_ast = ast.parse(source=py_file.contents, filename=py_file.name)
    except (SyntaxError, ValueError) as e:
        # ast.parse() raises SyntaxError for most errors,
        # but ValueError if the source contains null bytes.
        raise FileIdentificationError(f"Unable to parse {py_file.name}.") from e

    try:
        static_info = extract_static_python_info(module_ast)
    except ValueError as e:
        raise FileIdentificationError(
            f"Unable to extract metadata from {py_file.name}."
        ) from e

    try:
        api_version = version_from_static_python_info(static_info)
    except ValueError as e:
        raise FileIdentificationError(str(e)) from e
    if api_version is None:
        raise FileIdentificationError(f"apiLevel not declared in {py_file.name}")
    if api_version > MAX_SUPPORTED_VERSION:
        raise FileIdentificationError(
            f"API version {api_version} is not supported by this "
            f"robot software. Please either reduce your requested API "
            f"version or update your robot."
        )

    robot_type = _robot_type_from_static_python_info(static_info)

    return IdentifiedPythonMain(
        original_file=py_file,
        metadata=static_info.metadata or {},
        robot_type=robot_type,
        api_level=api_version,
    )


def _robot_type_from_static_python_info(
    static_python_info: StaticPythonInfo,
) -> RobotType:
    python_robot_type = (static_python_info.requirements or {}).get("robotType", None)
    if python_robot_type in (None, "OT-2"):
        return "OT-2 Standard"
    # Allow "OT-3" as a deprecated alias of "Flex" to support internal-to-Opentrons Python protocols
    # that were written before the "Flex" name existed.
    elif python_robot_type in ("Flex", "OT-3"):
        return "OT-3 Standard"
    else:
        raise FileIdentificationError(
            f"robotType must be 'OT-2' or 'Flex', not {repr(python_robot_type)}."
        )
