""" opentrons.calibration_storage.helpers: various miscellaneous
functions

This module has functions that you can import to save robot or
labware calibration to its designated file location.
"""
import json
from typing import Union, List, Dict, TYPE_CHECKING, cast
from dataclasses import is_dataclass, asdict


from hashlib import sha256

from . import types as local_types

if TYPE_CHECKING:
    from opentrons_shared_data.labware.dev_types import LabwareDefinition
    from opentrons_shared_data.pipette.dev_types import LabwareUri


DictionaryFactoryType = Union[List, Dict]


def dict_filter_none(data: DictionaryFactoryType) -> Dict:
    """
    Helper function to filter out None keys from a dataclass
    before saving to file.
    """
    return dict(item for item in data if item[1] is not None)


def convert_to_dict(obj) -> Dict:
    # The correct way to type this is described here:
    # https://github.com/python/mypy/issues/6568
    # Unfortnately, since it's not currently supported I have an
    # assert check instead.
    assert is_dataclass(obj), 'This function is intended for dataclasses only'
    return asdict(obj, dict_factory=dict_filter_none)


def hash_labware_def(labware_def: 'LabwareDefinition') -> str:
    """
    Helper function to take in a labware definition and return
    a hashed string of key elemenets from the labware definition
    to make it a unique identifier.

    :param labware_def: Full labware definitino
    :returns: sha256 string
    """
    # remove keys that do not affect run
    blocklist = ['metadata', 'brand', 'groups']
    def_no_metadata = {
        k: v for k, v in labware_def.items() if k not in blocklist}
    sorted_def_str = json.dumps(
        def_no_metadata, sort_keys=True, separators=(',', ':'))
    return sha256(sorted_def_str.encode('utf-8')).hexdigest()


def details_from_uri(uri: str, delimiter='/') -> local_types.UriDetails:
    """
    Unpack a labware URI to get the namespace, loadname and version
    """
    if uri:
        info = uri.split(delimiter)
        return local_types.UriDetails(
            namespace=info[0], load_name=info[1], version=int(info[2]))
    else:
        # Here we are assuming that the 'uri' passed in is actually
        # the loadname, though sometimes it may be an empty string.
        return local_types.UriDetails(
            namespace='', load_name=uri, version=1)


def uri_from_details(namespace: str, load_name: str,
                     version: Union[str, int],
                     delimiter='/') -> 'LabwareUri':
    """ Build a labware URI from its details.

    A labware URI is a string that uniquely specifies a labware definition.

    :returns str: The URI.
    """
    return cast(
        'LabwareUri',
        f'{namespace}{delimiter}{load_name}{delimiter}{version}')


def uri_from_definition(
        definition: 'LabwareDefinition', delimiter='/') -> 'LabwareUri':
    """ Build a labware URI from its definition.

    A labware URI is a string that uniquely specifies a labware definition.

    :returns str: The URI.
    """
    return uri_from_details(definition['namespace'],
                            definition['parameters']['loadName'],
                            definition['version'])
