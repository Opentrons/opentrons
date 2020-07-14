import typing
import json

from hashlib import sha256
from pathlib import Path

from opentrons.protocol_api.definitions import DeckItem
from . import types as local_types

if typing.TYPE_CHECKING:
    from opentrons.protocol_api.labware import Well, Labware
    from opentrons_shared_data.labware.dev_types import LabwareDefinition


def _get_parent_identifier(
        parent: typing.Union['Well', str, DeckItem, None]) -> str:
    if isinstance(parent, DeckItem) and parent.separate_calibration:
        # treat a given labware on a given module type as same
        return parent.load_name
    else:
        return ''  # treat all slots as same


def _hash_labware_def(labware_def: 'LabwareDefinition') -> str:
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
    info = uri.split(delimiter)
    return local_types.UriDetails(
        namespace=info[0], load_name=info[1], version=int(info[2]))
