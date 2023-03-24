"""
opentrons_shared_data.labware: types and functions for accessing labware defs
"""
from dataclasses import dataclass
from hashlib import sha256
import json
from typing import Any, Dict, NewType, Union, cast

from .. import load_shared_data

from .dev_types import LabwareDefinition, LabwareUri

Schema = NewType("Schema", Dict[str, Any])


def load_definition(loadname: str, version: int) -> "LabwareDefinition":
    return json.loads(
        load_shared_data(f"labware/definitions/2/{loadname}/{version}.json")
    )


def load_schema() -> Schema:
    return json.loads(load_shared_data("labware/schemas/2.json"))


@dataclass
class UriDetails:
    namespace: str
    load_name: str
    version: int


def uri_from_details(
    namespace: str, load_name: str, version: Union[str, int], delimiter: str = "/"
) -> LabwareUri:
    """Build a labware URI from its details.

    A labware URI is a string that uniquely specifies a labware definition.

    :returns str: The URI.
    """
    return cast(LabwareUri, f"{namespace}{delimiter}{load_name}{delimiter}{version}")


def uri_from_definition(
    definition: LabwareDefinition, delimiter: str = "/"
) -> LabwareUri:
    """Build a labware URI from its definition.

    A labware URI is a string that uniquely specifies a labware definition.

    :returns str: The URI.
    """
    return uri_from_details(
        namespace=definition["namespace"],
        load_name=definition["parameters"]["loadName"],
        version=definition["version"],
        delimiter=delimiter,
    )


def details_from_uri(uri: str, delimiter: str = "/") -> UriDetails:
    """
    Unpack a labware URI to get the namespace, loadname and version
    """
    try:
        info = uri.split(delimiter)
        return UriDetails(namespace=info[0], load_name=info[1], version=int(info[2]))
    except IndexError:
        # Here we are assuming that the 'uri' passed in is actually
        # the loadname, though sometimes it may be an empty string.
        return UriDetails(namespace="", load_name=uri, version=1)


# TODO(mc, 2021-11-09): this hashing function may produce different hashes
# for semantically identical labware defs. For example, a value of `10` will
# produce a different hash than a value of `10.0`. Hashing should be produce
# identical hashes for `==` values. This could be done by running defs through
# Pydantic or similar rather via json.dumps
def hash_labware_def(labware_def: LabwareDefinition) -> str:
    """
    Helper function to take in a labware definition and return
    a hashed string of key elements from the labware definition
    to make it a unique identifier.

    :param labware_def: Full labware definition
    :returns: sha256 string
    """
    # remove keys that do not affect run
    blocklist = ["metadata", "brand", "groups"]
    def_no_metadata = {k: v for k, v in labware_def.items() if k not in blocklist}
    sorted_def_str = json.dumps(def_no_metadata, sort_keys=True, separators=(",", ":"))

    return sha256(sorted_def_str.encode("utf-8")).hexdigest()
