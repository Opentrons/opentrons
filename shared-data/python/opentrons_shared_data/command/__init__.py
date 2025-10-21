"""opentrons_shared_data.command: functions command schemas."""
from pathlib import Path
from functools import cache
import json
import os
import re
from logging import getLogger

from opentrons_shared_data.errors.exceptions import (
    InvalidProtocolData,
    PythonException,
    InvalidStoredData,
)

from ..load import load_shared_data, get_shared_data_root

LOG = getLogger(__name__)

SCHEMA_REF_VERSION_RE = re.compile(r"opentronsCommandSchemaV(\d+)")


def get_newest_schema_version() -> str:
    """Get the version string of the most modern command schema currently in shared-data."""
    schema_ids = known_schema_ids()
    max_version = 0
    for schema_id in schema_ids:
        ref_version_match = SCHEMA_REF_VERSION_RE.match(schema_id)
        if not ref_version_match:
            continue
        ref_version = int(ref_version_match.group(1))
        if ref_version > max_version:
            max_version = ref_version

    return str(max_version)


def load_schema_string(version: str) -> str:
    """Get the string containing the command JSON schema for the given version string."""
    path = Path("command") / "schemas" / f"{version}.json"
    try:
        return json.dumps(json.loads(load_shared_data(path)), indent=2)
    except OSError as ose:
        raise InvalidProtocolData(
            message=f"Command schema version {version} is not available",
            detail={
                "type": "bad-schema-version",
                "schema-kind": "command",
                "version": version,
            },
            wrapping=[PythonException(ose)],
        )


def schema_version_from_ref(ref: str) -> str:
    """Parse the command schema version from a command schema ref."""
    version = SCHEMA_REF_VERSION_RE.match(ref)
    if not version:
        raise InvalidProtocolData(
            message=f"Could not parse version from command schema ${ref}",
            detail={"ref": ref, "type": "bad-schema-ref", "schema-kind": "command"},
        )
    return version.group(1)


def _schema_id_from_file(schema_file_name: str) -> str:
    schema_version_match = re.match(r"^.*(\d+).json$", schema_file_name)
    if schema_version_match is None:
        raise InvalidStoredData(
            message=f"Command schema {schema_file_name} is not named appropriately for its version",
            detail={"type": "bad-schema-name", "schema-kind": "command"},
        )
    try:
        schema_content = json.load(open(schema_file_name))
    except json.JSONDecodeError as jde:
        raise InvalidStoredData(
            message=f"Command schema {schema_file_name} is not valid json",
            detail={"type": "bad-schema-json", "schema-kind": "command"},
            wrapping=[PythonException(jde)],
        ) from jde

    try:
        schema_id: str = schema_content["$id"]
    except KeyError as ke:
        raise InvalidStoredData(
            message=f"Command schema {schema_file_name} has no $id",
            detail={"type": "bad-schema-json", "schema-kind": "command"},
            wrapping=[PythonException(ke)],
        ) from ke
    if not SCHEMA_REF_VERSION_RE.match(schema_id):
        raise InvalidStoredData(
            message=f"Command schema {schema_file_name} has an invalid id {schema_id} that does not match opentronsCommandSchema#"
        )
    return schema_id


@cache
def known_schema_ids() -> list[str]:
    """Get a list of all known command schema IDs."""
    command_schemas_dir = get_shared_data_root() / "command" / "schemas"
    command_schemas = os.listdir(command_schemas_dir)
    all_schema_ids = []
    for schema_file_name in command_schemas:
        try:
            all_schema_ids.append(
                _schema_id_from_file(str(command_schemas_dir / schema_file_name))
            )
        except Exception:
            LOG.exception(
                f"Could not load command schema from {str(command_schemas_dir/schema_file_name)}, skipping"
            )
    return all_schema_ids
