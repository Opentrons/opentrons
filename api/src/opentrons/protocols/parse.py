"""
opentrons.protocols.parse: functions and state for parsing protocols
"""

import ast
import functools
import itertools
import json
import logging
import re
import traceback
from io import BytesIO
from zipfile import ZipFile
from typing import Any, Dict, Optional, Union, Tuple, TYPE_CHECKING

import jsonschema  # type: ignore

from opentrons_shared_data.labware import load_schema as load_labware_schema
from opentrons_shared_data.protocol import (
    Schema as JSONProtocolSchema,
    load_schema as load_protocol_schema,
)
from opentrons_shared_data.robot.dev_types import RobotType

from .api_support.types import APIVersion
from .types import (
    RUN_FUNCTION_MESSAGE,
    Protocol,
    PythonProtocol,
    JsonProtocol,
    StaticPythonInfo,
    PythonProtocolMetadata,
    PythonProtocolRequirements,
    MalformedPythonProtocolError,
    ApiDeprecationError,
)
from .bundle import extract_bundle

if TYPE_CHECKING:
    from opentrons_shared_data.labware.dev_types import LabwareDefinition
    from opentrons_shared_data.protocol.dev_types import JsonProtocol as JsonProtocolDef

MODULE_LOG = logging.getLogger(__name__)

# match e.g. "2.0" but not "hi", "2", "2.0.1"
API_VERSION_RE = re.compile(r"^(\d+)\.(\d+)$")
MAX_SUPPORTED_JSON_SCHEMA_VERSION = 5
API_VERSION_FOR_JSON_V5_AND_BELOW = APIVersion(2, 8)


class JSONSchemaVersionTooNewError(RuntimeError):
    def __init__(self, attempted_schema_version: int) -> None:
        super().__init__(attempted_schema_version)
        self.attempted_schema_version = attempted_schema_version

    def __str__(self) -> str:
        return (
            f"The protocol you are trying to open is a"
            f" JSONv{self.attempted_schema_version} protocol,"
            f" which is not supported by this software version."
        )


def _validate_v2_ast(protocol_ast: ast.Module) -> None:
    defs = [fdef for fdef in protocol_ast.body if isinstance(fdef, ast.FunctionDef)]
    rundefs = [fdef for fdef in defs if fdef.name == "run"]
    # There must be precisely 1 one run function
    if len(rundefs) > 1:
        lines = [str(d.lineno) for d in rundefs]
        linestr = ", ".join(lines)
        raise MalformedPythonProtocolError(
            short_message=f"More than one run function is defined (lines {linestr}).",
            long_additional_message=RUN_FUNCTION_MESSAGE,
        )
    if not rundefs:
        raise MalformedPythonProtocolError(
            short_message="No function 'run(ctx)' defined",
            long_additional_message=RUN_FUNCTION_MESSAGE,
        )
    if _has_api_v1_imports(protocol_ast):
        raise MalformedPythonProtocolError(
            short_message=(
                "Protocol API v1 modules such as robot, instruments, and labware "
                "may not be imported in Protocol API V2 protocols"
            )
        )


def version_from_string(vstr: str) -> APIVersion:
    """Parse an API version from a string

    :param str vstr: The version string to parse
    :returns APIVersion: The parsed version
    :raises ValueError: if the version string is the wrong format
    """
    matches = API_VERSION_RE.match(vstr)
    if not matches:
        raise MalformedPythonProtocolError(
            short_message=(
                f"apiLevel {vstr} is incorrectly formatted. It should be "
                "major.minor, where both major and minor are numbers."
            )
        )
    return APIVersion(major=int(matches.group(1)), minor=int(matches.group(2)))


def _parse_json(protocol_contents: str, filename: Optional[str] = None) -> JsonProtocol:
    """Parse a protocol known or at least suspected to be json"""
    protocol_json = json.loads(protocol_contents)
    version, validated = validate_json(protocol_json)
    return JsonProtocol(
        text=protocol_contents,
        filename=filename,
        contents=validated,
        schema_version=version,
        api_level=API_VERSION_FOR_JSON_V5_AND_BELOW,
        metadata=validated["metadata"],
        robot_type=validated["robot"]["model"],
    )


def _parse_python(
    protocol_contents: str,
    filename: Optional[str] = None,
    bundled_labware: Optional[Dict[str, "LabwareDefinition"]] = None,
    bundled_data: Optional[Dict[str, bytes]] = None,
    bundled_python: Optional[Dict[str, str]] = None,
    extra_labware: Optional[Dict[str, "LabwareDefinition"]] = None,
) -> PythonProtocol:
    """Parse a protocol known or at least suspected to be python"""
    filename_checked = filename or "<protocol>"
    if filename_checked.endswith(".zip"):
        ast_filename = "protocol.ot2.py"
    else:
        ast_filename = filename_checked

    # todo(mm, 2021-09-13): By default, ast.parse will inherit compiler options
    # and future features from this module. This may not be appropriate.
    # Investigate switching to compile() with dont_inherit=True.
    try:
        parsed = ast.parse(protocol_contents, filename=ast_filename)
    except SyntaxError as syntax_error:
        raise MalformedPythonProtocolError(
            short_message=str(syntax_error),
            # Get Python's nice syntax error message with carets pointing to where in the line
            # had the problem.
            long_additional_message="\n".join(
                traceback.format_exception_only(type(syntax_error), syntax_error)
            ),
        ) from syntax_error
    except ValueError as null_bytes_error:
        # ast.parse() raises SyntaxError for most errors,
        # but ValueError if the source contains null bytes.
        raise MalformedPythonProtocolError(short_message=str(null_bytes_error))

    static_info = _extract_static_python_info(parsed)
    protocol = compile(parsed, filename=ast_filename, mode="exec")
    version = _get_version(static_info, parsed, filename_checked)
    robot_type = _robot_type_from_static_python_info(static_info)

    if version >= APIVersion(2, 0):
        _validate_v2_ast(parsed)
    else:
        raise ApiDeprecationError(version)

    result = PythonProtocol(
        text=protocol_contents,
        filename=getattr(protocol, "co_filename", "<protocol>"),
        contents=protocol,
        metadata=static_info.metadata,
        api_level=version,
        robot_type=robot_type,
        bundled_labware=bundled_labware,
        bundled_data=bundled_data,
        bundled_python=bundled_python,
        extra_labware=extra_labware,
    )

    return result


def _parse_bundle(bundle: ZipFile, filename: Optional[str] = None) -> PythonProtocol:
    """Parse a bundled Python protocol"""
    contents = extract_bundle(bundle)

    result = _parse_python(
        contents.protocol,
        filename,
        contents.bundled_labware,
        contents.bundled_data,
        contents.bundled_python,
    )

    if result.api_level < APIVersion(2, 0):
        raise MalformedPythonProtocolError(
            short_message=f"Bundled protocols must use Protocol API v2, got {result.api_level}."
        )

    return result


def parse(
    protocol_file: Union[str, bytes],
    filename: Optional[str] = None,
    extra_labware: Optional[Dict[str, "LabwareDefinition"]] = None,
    extra_data: Optional[Dict[str, bytes]] = None,
) -> Protocol:
    """Parse a protocol from text.

    :param protocol_file: The protocol file, or for single-file protocols, a
                        string of the protocol contents.
    :param filename: The name of the protocol. Optional, but helps with
                     deducing the kind of protocol (e.g. if it ends with
                     '.json' we can treat it like json)
    :param extra_labware: Any extra labware defs that should be given to the
                          protocol. Ignored if the protocol is json or zipped
                          python.
    :param extra_data: Any extra data files that should be provided to the
                       protocol. Ignored if the protocol is json or zipped
                       python.
    :return types.Protocol: The protocol holder, a named tuple that stores the
                        data in the protocol for later simulation or
                        execution.
    """
    if filename and filename.endswith(".zip"):
        if not isinstance(protocol_file, bytes):
            raise RuntimeError(
                "Please update your Run App version to support uploading a .zip file"
            )

        with ZipFile(BytesIO(protocol_file)) as bundle:
            result = _parse_bundle(bundle, filename)
        return result
    else:
        if isinstance(protocol_file, bytes):
            protocol_str = protocol_file.decode("utf-8")
        else:
            protocol_str = protocol_file

        if filename and filename.endswith(".json"):
            return _parse_json(protocol_str, filename)
        elif filename and filename.endswith(".py"):
            return _parse_python(
                protocol_str,
                filename,
                extra_labware=extra_labware,
                bundled_data=extra_data,
            )

        # our jsonschema says the top level json kind is object
        if protocol_str and protocol_str[0] in ("{", b"{"):
            return _parse_json(protocol_str, filename)
        else:
            return _parse_python(
                protocol_str,
                filename,
                extra_labware=extra_labware,
                bundled_data=extra_data,
            )


def _extract_static_python_info(parsed: ast.Module) -> StaticPythonInfo:
    """Extract statically analyzable info from a Python protocol, like its metadata.

    Raises:
        ValueError: If the places that we expect to be statically analyzable are
            actually not, or if they contain unsupported types.
    """
    extracted_metadata: PythonProtocolMetadata = None
    extracted_requirements: PythonProtocolRequirements = None

    assignments = (obj for obj in parsed.body if isinstance(obj, ast.Assign))
    for assignment in assignments:
        target = assignment.targets[0]
        assigned_value = assignment.value

        if isinstance(target, ast.Name) and isinstance(assigned_value, ast.Dict):
            target_name = target.id
            if target_name == "metadata":
                extracted_metadata = _extract_static_dict(
                    static_dict=assigned_value, name="metadata"
                )

            # `requirements` was added later. This is technically a breaking change if
            # anyone happened to declare a module-level `requirements` variable in their
            # protocol, since we'll now raise an error if it isn't statically parseable
            # or if it contains unsupported types.
            elif target_name == "requirements":
                extracted_requirements = _extract_static_dict(
                    static_dict=assigned_value, name="requirements"
                )

    return StaticPythonInfo(
        metadata=extracted_metadata, requirements=extracted_requirements
    )


def _extract_static_dict(static_dict: ast.Dict, name: str) -> Dict[str, str]:
    """Statically read a `metadata`-like dict from a Python Protocol API file.

    Args:
        static_dict: The AST node representing the dict.
        name: The name of the dict in the user's Python source code,
            for error reporting.

    Raises:
        MalformedPythonError: If the dict is too complex for this function to understand
            statically, or if it contains unsupported types.
    """
    try:
        evaluated_literal = ast.literal_eval(static_dict)
    except ValueError as exception:
        # Undocumented, but ast.literal_eval() seems to raise ValueError for
        # expressions that aren't statically or "safely" evaluable, like
        # `{"o": object()}` or `{"s": "abc"[0]}`.
        raise MalformedPythonProtocolError(
            short_message=(
                f"Could not read the contents of the {name} dict."
                f" Make sure it doesn't contain any complex expressions, such as"
                f" function calls or array indexings."
            )
        ) from exception

    # ast.literal_eval() is typed as returning Any, but we're pretty sure it
    # should return a dict in this case because we passed it an ast.Dict.
    assert isinstance(evaluated_literal, dict)

    # Make sure we don't return anything outside of our declared return type.
    for key, value in evaluated_literal.items():
        if not isinstance(key, str):
            raise MalformedPythonProtocolError(
                short_message=(
                    f'Keys in the {name} dict must be strings, but key "{key}"'
                    f' has type "{type(key).__name__}".'
                )
            )
        if not isinstance(value, str):
            raise MalformedPythonProtocolError(
                short_message=(
                    f'Values in the {name} dict must be strings, but value "{value}"'
                    f' has type "{type(value).__name__}".'
                )
            )

    return evaluated_literal


@functools.lru_cache(1)
def _has_api_v1_imports(parsed: ast.Module) -> bool:
    """Return whether a Python protocol has import statements specific to PAPIv1."""
    # Imports in the form of `import opentrons.robot` will have an entry in
    # parsed.body[i].names[j].name in the form "opentrons.robot". Find those
    # imports and transform them to strip away the 'opentrons.' part.
    ot_imports = [
        ".".join(name.name.split(".")[1:])
        for name in itertools.chain.from_iterable(
            [obj.names for obj in parsed.body if isinstance(obj, ast.Import)]
        )
        if "opentrons" in name.name
    ]

    # Imports in the form of `from opentrons import robot` (with or without an
    # `as ___` statement) will have an entry in parsed.body[i].module
    # containing "opentrons"
    ot_from_imports = [
        name.name
        for name in itertools.chain.from_iterable(
            [
                obj.names
                for obj in parsed.body
                if isinstance(obj, ast.ImportFrom)
                and obj.module
                and "opentrons" in obj.module
            ]
        )
    ]

    # If any of these are populated, filter for entries with v1-specific terms
    opentrons_imports = set(ot_imports + ot_from_imports)
    v1_markers = set(("robot", "instruments", "modules", "containers"))
    return bool(v1_markers.intersection(opentrons_imports))


def _version_from_static_python_info(
    static_python_info: StaticPythonInfo,
) -> Optional[APIVersion]:
    """Get an explicitly specified apiLevel from static info, if we can.

    If the protocol doesn't declare apiLevel at all, return None.
    If the protocol declares apiLevel incorrectly, raise a ValueError.
    """
    # TODO(mm, 2022-10-21):
    #
    # This logic is quick and dirty, and might allow things that we don't want.
    #
    # - Require protocols with new `apiLevel`s to specify `apiLevel` in `requirements`
    #   and not in `metadata`?
    # - Forbid protocols from specifying `apiLevel` in both `requirements` and
    #   `metadata`?
    # - Be more careful with falsey values, like `"apiLevel": ""`?
    # - Forbid unrecognized keys in `requirements`?

    from_requirements = (static_python_info.requirements or {}).get("apiLevel", None)
    from_metadata = (static_python_info.metadata or {}).get("apiLevel", None)
    requested_level = from_requirements or from_metadata
    if requested_level is None:
        return None
    elif requested_level == "1":
        # TODO(mm, 2022-10-21): Can we safely move this special case to
        # version_from_string()?
        return APIVersion(1, 0)
    else:
        return version_from_string(requested_level)


def robot_type_from_python_identifier(python_robot_type: str) -> RobotType:
    if python_robot_type == "OT-2":
        return "OT-2 Standard"
    # Allow "OT-3" as a deprecated alias of "Flex" to support internal-to-Opentrons Python protocols
    # that were written before the "Flex" name existed.
    elif python_robot_type in ("Flex", "OT-3"):
        return "OT-3 Standard"
    else:
        raise MalformedPythonProtocolError(
            short_message=f"robotType must be 'OT-2' or 'Flex', not {repr(python_robot_type)}."
        )


def _robot_type_from_static_python_info(
    static_python_info: StaticPythonInfo,
) -> RobotType:
    python_robot_type = (static_python_info.requirements or {}).get("robotType", None)
    if python_robot_type is None:
        return "OT-2 Standard"
    else:
        return robot_type_from_python_identifier(python_robot_type)


def _get_version(
    static_python_info: StaticPythonInfo, parsed: ast.Module, filename: str
) -> APIVersion:
    """
    Infer protocol API version based on a combination of metadata and imports.

    If a protocol specifies its API version using the 'apiLevel' key of a top-
    level dict variable named `metadata`, the value for that key will be
    returned as the version.

    If that variable does not exist or if it does not contain the 'apiLevel'
    key, the API version will be inferred from the imports. A script with an
    import containing 'robot', 'instruments', or 'modules' will be assumed to
    be an APIv1 protocol. If none of these are present, it is assumed to be an
    APIv2 protocol (note that 'labware' is not in this list, as there is a
    valid APIv2 import named 'labware').
    """
    declared_version = _version_from_static_python_info(static_python_info)
    if declared_version:
        return declared_version
    else:
        # No apiLevel key, may be apiv1
        if not _has_api_v1_imports(parsed):
            raise MalformedPythonProtocolError(
                short_message=(
                    f"apiLevel not declared in {filename}. "
                    f"You must specify the target API version "
                    f"in the apiLevel key of the metadata dict. For instance, "
                    f'metadata={{"apiLevel": "2.0"}}'
                )
            )
        return APIVersion(1, 0)


def _get_protocol_schema_version(protocol_json: Dict[Any, Any]) -> int:
    # v3 and above uses `schemaVersion: integer`
    version = protocol_json.get("schemaVersion")
    if version:
        return int(version)
    # v1 uses 1.x.x and v2 uses 2.x.x
    legacyKebabVersion = protocol_json.get("protocol-schema")
    # No minor/patch schemas ever were released,
    # do not permit protocols with nonexistent schema versions to load
    if legacyKebabVersion == "1.0.0":
        return 1
    elif legacyKebabVersion == "2.0.0":
        return 2
    elif legacyKebabVersion:
        raise RuntimeError(
            f'No such schema version: "{legacyKebabVersion}". Did you mean '
            + '"1.0.0" or "2.0.0"?'
        )
    # no truthy value for schemaVersion or protocol-schema
    raise RuntimeError(
        "Could not determine schema version for protocol. "
        + 'Make sure there is a version number under "schemaVersion"'
    )


def _get_schema_for_protocol(version_num: int) -> JSONProtocolSchema:
    """Retrieve the json schema for a protocol schema version"""
    # TODO(IL, 2020/03/05): use $otSharedSchema, but maybe wait until
    # deprecating v1/v2 JSON protocols?
    if version_num > MAX_SUPPORTED_JSON_SCHEMA_VERSION:
        raise RuntimeError(
            f"JSON Protocol version {version_num} is not yet "
            + "supported in this version of the API"
        )
    try:
        return load_protocol_schema(version=version_num)
    except FileNotFoundError:
        raise RuntimeError(
            'JSON Protocol schema "{}" does not exist'.format(version_num)
        ) from None


def validate_json(protocol_json: Dict[Any, Any]) -> Tuple[int, "JsonProtocolDef"]:
    """Validates a json protocol and returns its schema version"""
    # Check if this is actually a labware
    labware_schema_v2 = load_labware_schema()
    try:
        jsonschema.validate(protocol_json, labware_schema_v2)
    except jsonschema.ValidationError:
        pass
    else:
        MODULE_LOG.error("labware uploaded instead of protocol")
        raise RuntimeError(
            "The file you are trying to open is a JSON labware definition, "
            "and therefore can not be opened here. Please try "
            "uploading a JSON protocol file instead."
        )

    # this is now either a protocol or something corrupt
    version_num = _get_protocol_schema_version(protocol_json)
    if version_num <= 2:
        raise RuntimeError(
            f"JSON protocol version {version_num} is "
            "deprecated. Please upload your protocol into Protocol "
            "Designer and save it to migrate the protocol to a later "
            "version. This error might mean a labware "
            "definition was specified instead of a protocol."
        )
    if version_num > MAX_SUPPORTED_JSON_SCHEMA_VERSION:
        raise JSONSchemaVersionTooNewError(attempted_schema_version=version_num)
    protocol_schema = _get_schema_for_protocol(version_num)

    # instruct schema how to resolve all $ref's used in protocol schemas
    resolver = jsonschema.RefResolver(
        protocol_schema.get("$id", ""),
        protocol_schema,
        store={"opentronsLabwareSchemaV2": labware_schema_v2},
    )

    # do the validation
    try:
        jsonschema.validate(protocol_json, protocol_schema, resolver=resolver)
    except jsonschema.ValidationError:
        MODULE_LOG.exception("JSON protocol validation failed")
        raise RuntimeError(
            "This may be a corrupted file or a JSON file that is not an "
            "Opentrons JSON protocol."
        )
    else:
        return version_num, protocol_json  # type: ignore
