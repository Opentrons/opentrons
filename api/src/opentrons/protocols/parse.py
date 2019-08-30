"""
opentrons.protocols.parse: functions and state for parsing protocols
"""

import ast
import json
from typing import Union

from opentrons.config import feature_flags as ff
from opentrons.protocol_api.execute import (validate_protocol as validate_json)
from opentrons.legacy_api.protocols import\
    (validate_protocol as validate_json_v1)
from .types import Protocol, PythonProtocol, JsonProtocol, Metadata


def _parse_json(
        protocol_contents: str, filename: str = None) -> JsonProtocol:
    """ Parse a protocol known or at least suspected to be json """
    protocol_json = json.loads(protocol_contents)
    if ff.use_protocol_api_v2():
        validate_json(protocol_json)
    else:
        validate_json_v1(protocol_json)
    return JsonProtocol(
        text=protocol_contents, filename=filename, contents=protocol_json)


def _parse_python(
        protocol_contents: str, filename: str = None) -> PythonProtocol:
    """ Parse a protocol known or at least suspected to be python """
    filename_checked = filename or '<protocol>'
    parsed = ast.parse(protocol_contents,
                       filename=filename_checked)
    metadata = extract_metadata(parsed)
    protocol = compile(parsed, filename=filename_checked, mode='exec')
    version = infer_version(metadata, parsed)
    return PythonProtocol(
        text=protocol_contents,
        filename=getattr(protocol, 'co_filename', '<protocol>'),
        contents=protocol,
        metadata=metadata,
        api_level=version)


def parse(
        protocol_contents: Union[bytes, str],
        filename: str = None) -> Protocol:
    """ Parse a protocol from text.

    :param protocol_contents: The contents of the protocol
    :param filename: The name of the protocol. Optional, but helps with
                     deducing the kind of protocol (e.g. if it ends with
                     '.json' we can treat it like json)
    :return types.Protocol: The protocol holder, a named tuple that stores the
                            data in the protocol for later simulation or
                            execution.
    """
    # We're doing this part here to handle possible futures where we handle
    # richer content types; for now, though, we'll just let the exception
    # happen if somebody accidentally uploads e.g. a zip
    if isinstance(protocol_contents, bytes):
        protocol_str = protocol_contents.decode('utf-8')
    else:
        protocol_str = protocol_contents
    if filename and filename.endswith('.json'):
        return _parse_json(protocol_str, filename)
    elif filename and filename.endswith('.py'):
        return _parse_python(protocol_str, filename)
    # our jsonschema says the top level json kind is object
    if protocol_str and [0] == '{':
        return _parse_json(protocol_str, filename)
    else:
        return _parse_python(protocol_str, filename)


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
    # parsed.body[i].names[0].name in the form "opentrons.robot"
    ot_imports = list(filter(
        lambda x: 'opentrons' in x,
        [obj.names[0].name for obj in parsed.body
         if isinstance(obj, ast.Import)]))

    # Imports in the form of `from opentrons import robot` (with or without an
    # `as ___` statement) will have an entry in parsed.body[i].module
    # containing "opentrons"
    ot_from_imports = [
        obj.names[0].name for obj in parsed.body
        if isinstance(obj, ast.ImportFrom)
        and obj.module
        and 'opentrons' in obj.module]

    # If any of these are populated, filter for entries with v1-specific terms
    opentrons_imports = ot_imports + ot_from_imports
    v1evidence = ['robot' in i or 'instruments' in i or 'modules' in i
                  for i in opentrons_imports]
    if any(v1evidence):
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
