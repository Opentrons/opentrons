"""
opentrons.protocols.parse: functions and state for parsing protocols
"""

import ast
import itertools
import json
import pkgutil
from io import BytesIO
from zipfile import ZipFile
from typing import Any, Dict, Union

import jsonschema  # type: ignore

from opentrons.config import feature_flags as ff
from .types import Protocol, PythonProtocol, JsonProtocol, Metadata
from .bundle import extract_bundle


def _parse_json(
        protocol_contents: str, filename: str = None) -> JsonProtocol:
    """ Parse a protocol known or at least suspected to be json """
    protocol_json = json.loads(protocol_contents)
    version = validate_json(protocol_json)
    return JsonProtocol(
        text=protocol_contents, filename=filename, contents=protocol_json,
        schema_version=version)


def _parse_python(
    protocol_contents: str,
    filename: str = None,
    bundled_labware: Dict[str, Dict[str, Any]] = None,
    bundled_data: Dict[str, bytes] = None,
    bundled_python: Dict[str, str] = None,
    extra_labware: Dict[str, Dict[str, Any]] = None,
) -> PythonProtocol:
    """ Parse a protocol known or at least suspected to be python """
    filename_checked = filename or '<protocol>'
    if filename_checked.endswith('.zip'):
        ast_filename = 'protocol.ot2.py'
    else:
        ast_filename = filename_checked

    parsed = ast.parse(protocol_contents,
                       filename=ast_filename)
    metadata = extract_metadata(parsed)
    protocol = compile(parsed, filename=ast_filename, mode='exec')
    version = infer_version(metadata, parsed)

    result = PythonProtocol(
        text=protocol_contents,
        filename=getattr(protocol, 'co_filename', '<protocol>'),
        contents=protocol,
        metadata=metadata,
        api_level=version,
        bundled_labware=bundled_labware,
        bundled_data=bundled_data,
        bundled_python=bundled_python,
        extra_labware=extra_labware)

    return result


def _parse_bundle(bundle: ZipFile, filename: str = None) -> PythonProtocol:  # noqa: C901
    """ Parse a bundled Python protocol """
    if not ff.use_protocol_api_v2():
        raise RuntimeError(
            'Uploading a bundled protocol requires the robot to be set to '
            'Protocol API V2. Enable the \'Use Protocol API version 2\' '
            'toggle in the robot\'s Advanced Settings and restart the robot')

    contents = extract_bundle(bundle)

    result = _parse_python(
        contents.protocol, filename,
        contents.bundled_labware,
        contents.bundled_data,
        contents.bundled_python)

    if result.api_level != '2':
        raise RuntimeError('Bundled protocols must use Protocol API V2, ' +
                           f'got {result.api_level}')

    return result


def parse(
    protocol_file: Union[str, bytes],
    filename: str = None,
    extra_labware: Dict[str, Dict[str, Any]] = None,
    extra_data: Dict[str, bytes] = None
) -> Protocol:
    """ Parse a protocol from text.

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
    if filename and filename.endswith('.zip'):
        if not isinstance(protocol_file, bytes):
            raise RuntimeError('Please update your Run App version to '
                               'support uploading a .zip file')

        with ZipFile(BytesIO(protocol_file)) as bundle:
            result = _parse_bundle(bundle, filename)
        return result
    else:
        if isinstance(protocol_file, bytes):
            protocol_str = protocol_file.decode('utf-8')
        else:
            protocol_str = protocol_file

        if filename and filename.endswith('.json'):
            return _parse_json(protocol_str, filename)
        elif filename and filename.endswith('.py'):
            return _parse_python(
                protocol_str, filename, extra_labware=extra_labware,
                bundled_data=extra_data)

        # our jsonschema says the top level json kind is object
        if protocol_str and protocol_str[0] in ('{', b'{'):
            return _parse_json(protocol_str, filename)
        else:
            return _parse_python(
                protocol_str, filename, extra_labware=extra_labware,
                bundled_data=extra_data)


def extract_metadata(parsed: ast.Module) -> Metadata:
    metadata: Metadata = {}
    assigns = [
        obj for obj in parsed.body if isinstance(obj, ast.Assign)]
    for obj in assigns:
        # XXX This seems brittle and could probably do with
        # - enough love that we can remove the type: ignores
        # - some thought about exactly what types are allowed in metadata
        if isinstance(obj.targets[0], ast.Name) \
                and obj.targets[0].id == 'metadata' \
                and isinstance(obj.value, ast.Dict):
            keys = [k.s for k in obj.value.keys]  # type: ignore
            values = [v.s for v in obj.value.values]  # type: ignore
            metadata = dict(zip(keys, values))
    return metadata


def infer_version_from_imports(parsed: ast.Module) -> str:
    # Imports in the form of `import opentrons.robot` will have an entry in
    # parsed.body[i].names[j].name in the form "opentrons.robot". Find those
    # imports and transform them to strip away the 'opentrons.' part.
    ot_imports = ['.'.join(name.name.split('.')[1:]) for name in
                  itertools.chain.from_iterable(
                      [obj.names for obj in parsed.body
                       if isinstance(obj, ast.Import)])
                  if 'opentrons' in name.name]

    # Imports in the form of `from opentrons import robot` (with or without an
    # `as ___` statement) will have an entry in parsed.body[i].module
    # containing "opentrons"
    ot_from_imports = [
        name.name for name in
        itertools.chain.from_iterable(
            [obj.names for obj in parsed.body
             if isinstance(obj, ast.ImportFrom)
             and obj.module
             and 'opentrons' in obj.module])
    ]

    # If any of these are populated, filter for entries with v1-specific terms
    opentrons_imports = set(ot_imports + ot_from_imports)
    v1_markers = set(('robot', 'instruments', 'modules', 'containers'))
    v1evidence = v1_markers.intersection(opentrons_imports)
    if v1evidence:
        return '1'
    else:
        return '2'


def infer_version(metadata: Metadata, parsed: ast.Module) -> str:
    """
    Infer protocol API version based on a combination of metadata and imports.

    If a protocol specifies its API version using the 'apiLevel' key of a top-
    level dict variable named `metadata`, the value for that key will be
    returned as the version (the value will be intified, so numeric values
    only can be used).

    If that variable does not exist or if it does not contain the 'apiLevel'
    key, the API version will be inferred from the imports. A script with an
    import containing 'robot', 'instruments', or 'modules' will be assumed to
    be an APIv1 protocol. If none of these are present, it is assumed to be an
    APIv2 protocol (note that 'labware' is not in this list, as there is a
    valid APIv2 import named 'labware').
    """
    level = str(metadata.get('apiLevel'))
    if level in ('1', '2'):
        return level
    return infer_version_from_imports(parsed)


def _get_protocol_schema_version(protocol_json: Dict[Any, Any]) -> int:
    # v3 and above uses `schemaVersion: integer`
    version = protocol_json.get('schemaVersion')
    if version:
        return int(version)
    # v1 uses 1.x.x and v2 uses 2.x.x
    legacyKebabVersion = protocol_json.get('protocol-schema')
    # No minor/patch schemas ever were released,
    # do not permit protocols with nonexistent schema versions to load
    if legacyKebabVersion == '1.0.0':
        return 1
    elif legacyKebabVersion == '2.0.0':
        return 2
    elif legacyKebabVersion:
        raise RuntimeError(
            f'No such schema version: "{legacyKebabVersion}". Did you mean ' +
            '"1.0.0" or "2.0.0"?')
    # no truthy value for schemaVersion or protocol-schema
    raise RuntimeError(
        'Could not determine schema version for protocol. ' +
        'Make sure there is a version number under "schemaVersion"')


def _get_schema_for_protocol(version_num: int) -> Dict[Any, Any]:
    """ Retrieve the json schema for a protocol schema version
    """
    if version_num > 3:
        raise RuntimeError(
            f'JSON Protocol version {version_num} is not yet ' +
            'supported in this version of the API')
    try:
        schema = pkgutil.get_data(
            'opentrons',
            f'shared_data/protocol/schemas/{version_num}.json')
    except FileNotFoundError:
        schema = None
    if not schema:
        raise RuntimeError('JSON Protocol schema "{}" does not exist'
                           .format(version_num))
    return json.loads(schema.decode('utf-8'))


def validate_json(protocol_json: Dict[Any, Any]) -> int:
    """ Validates a json protocol and returns its schema version """
    version_num = _get_protocol_schema_version(protocol_json)
    if version_num <= 2:
        raise RuntimeError(
            f'JSON protocol version {version_num} is '
            'deprecated. Please upload your protocol into Protocol '
            'Designer and save it to migrate the protocol to a later '
            'version.')
    protocol_schema = _get_schema_for_protocol(version_num)
    # instruct schema how to resolve all $ref's used in protocol schemas
    schema_body = pkgutil.get_data(  # type: ignore
        'opentrons',
        'shared_data/labware/schemas/2.json').decode('utf-8')
    labware_schema_v2 = json.loads(schema_body)

    resolver = jsonschema.RefResolver(
        protocol_schema.get('$id', ''),
        protocol_schema,
        store={
            "opentronsLabwareSchemaV2": labware_schema_v2
        })
    # do the validation
    jsonschema.validate(protocol_json, protocol_schema, resolver=resolver)
    return version_num
