# pylama:ignore=E252
import json
import logging
import os
import pkgutil
import sys
from typing import List

from opentrons.config import CONFIG

"""
There will be 3 directories for json blobs to define labware:
- `labware_data`: Definitions live in the `shared-data` project in the
        root of the Opentrons/opentrons GitHub repo. These are copied into the
        Docker container to "/etc/labware".
- `custom_definitions`: Same format as definitions in `labware_data`, but lives
        in the persistent data directory
        "/data/user_storage/opentrons_data/labware/definitions".
- `offsets`: A dict with xyz values that get added to each well's xyz fields,
        lives in the persistent data directory
        "/data/user_storage/opentrons_data/labware/offsets".

Container load function will take "<labware_name>" as a parameter (consistent
with existing behavior), check `custom_definitions` first, and fall back to the
`labware_data` directory, looking for "<labware_name>.json" (if it does not
exist in either directory, raise an error). Then, check the `offsets` directory
for a corresponding file. If found, apply the offsets to the wells in the
definition. Then construct a Container object and return it.

This makes it easy to add custom containers for a protocol as well, both in
Python protocols and in the proposed json protocol format (the new container
can be included as a json blob in the protocol, and will get added to the
`custom_definitions`.

Adding to `custom_definitions` should ideally check if the file already exists,
and raise a warning if it exists and there is a difference between it and the
new definition.

Example definition format:
```json
{
  "metadata": {
    "name": "4-well-plate"
  },
  "wells": {
    "A1": {
      "x": 40,
      "y": 40,
      "z": 30,
      "depth": 26,
      "diameter": 10,
      "total-liquid-volume": 78.6
    },
    "A2": {
      "x": 40,
      "y": 80,
      "z": 30,
      "depth": 26,
      "diameter": 10,
      "total-liquid-volume": 78.6
    },
    "B1": {
      "x": 40,
      "y": 80,
      "z": 30,
      "depth": 26,
      "diameter": 10,
      "total-liquid-volume": 78.6
    },
    "B2": {
      "x": 80,
      "y": 80,
      "z": 30,
      "depth": 26,
      "diameter": 10,
      "total-liquid-volume": 78.6
    }
  },
  "ordering": [
    [
      "A1",
      "A2"
    ],
    [
      "B1",
      "B2"
    ]
  ]
}
```

Example offset format:
```json
{
  "x": -0.34,
  "y": 0.7,
  "z": 0.1
}
```

Notes:
- want to get rid of "origin-offsets". Fold it into the x/y/z of each well
- rename "locations" -> "wells"
- add "ordering" to explicitly define rows & columns as 2D array
- because of the magic that happens in the migration script, will probably
  need to figure out how to export from the sqlite db to json, rather than
  from default-containers.json to new json blobs directly

"""


# Contants that use paths defined by environment variables that should be set
# on the robot, and fall back to paths relative to this file within the source
# repository for development purposes
FILE_DIR = os.path.abspath(os.path.dirname(__file__))
log = logging.getLogger(__name__)


def user_defn_dir():
    return CONFIG['labware_user_definitions_dir_v3']


def offset_dir():
    return CONFIG['labware_calibration_offsets_dir_v3']


def _load_definition(path: str, labware_name: str) -> dict:
    definition_file = os.path.join(
        path, "{}.json".format(labware_name))
    try:
        with open(definition_file) as defn_f:
            lw = json.load(defn_f)
    except FileNotFoundError:
        lw = {}
    # from pprint import pprint
    # print("Labware definition:")
    # pprint(lw)
    return lw


def _load_offset(path: str, labware_name: str) -> dict:
    offset_file = os.path.join(
        path, "{}.json".format(labware_name))
    offs: dict = {}
    try:
        if os.path.exists(offset_file):
            with open(offset_file) as offs_f:
                offs = json.load(offs_f)
    except FileNotFoundError:
        pass
    return offs


def _load(user_defn_root_path: str,
          labware_name: str,
          offset_dir_path: str,
          with_offset: bool) -> dict:
    """
    Try to find definition file in <user_defn_dir> first, then fall back to
    the internal defaults. If a definition is found in either place, look
    for an offset file in <offset_dir> and apply it if found.

    If no definition file is found, raise a FileNotFoundException.

    :param user_defn_root_path: User labware definition directory
    :param labware_name: Name of labware definition file (without extension)
    :param with_offset: A boolean flag to control whether the offset file
        should also be loaded and applied, if one exists
    :return: a dict of the definition with offset applied to each well
    """
    lw = _load_definition(user_defn_root_path, labware_name)
    if not lw:
        # This raises FileNotFoundError if it can’t be found
        contents = pkgutil.get_data(
            'opentrons',
            'shared_data/definitions/{}.json'.format(labware_name))
        if not contents:
            raise FileNotFoundError
        lw = json.loads(contents)

    offs = _load_offset(offset_dir_path, labware_name) if with_offset else None

    if offs:
        for well in lw['wells'].keys():
            for axis in 'xyz':
                default_value = lw['wells'][well][axis]
                offset = offs[axis]
                lw['wells'][well][axis] = round(default_value + offset, 2)

    return lw


def load_json(labware_name: str, with_offset: bool=True) -> dict:
    return _load(
        user_defn_dir(),
        labware_name,
        offset_dir(),
        with_offset)


def _list_labware(path: str) -> List[str]:
    try:
        lw = list(map(lambda x: os.path.splitext(x)[0], os.listdir(path)))
    except FileNotFoundError:
        lw = list()
    return lw


def list_all_labware() -> List[str]:
    user_list = _list_labware(user_defn_dir())
    d = os.path.dirname(sys.modules['opentrons'].__file__)
    default_list = _list_labware(os.path.join(d, 'shared_data', 'definitions'))
    return sorted(list(set(user_list + default_list)))


def _save_user_definition(path: str, defn: dict) -> bool:
    filename = os.path.join(
        path, '{}.json'.format(defn['metadata']['name']))
    try:
        with open(filename, 'w') as def_file:
            json.dump(defn, def_file, indent=2)
        successful = True
    except OSError:
        log.exception('Failed to write user definition with exception:')
        successful = False
    return successful


def _save_offset(path: str, name: str, offset: dict):
    filename = os.path.join(
        path, '{}.json'.format(name))
    try:
        with open(filename, 'w') as offset_file:
            json.dump(offset, offset_file, indent=2)
        successful = True
    except OSError:
        log.exception('Failed to write user definition with exception:')
        successful = False
    return successful


def save_user_definition(defn: dict) -> bool:
    """
    :param defn: a definition json dict, as returned by
        `opentrons.data_storage.serializers.labware_to_json`
    :return: success code
    """
    defn_dir = user_defn_dir()
    try:
        if not os.path.exists(defn_dir):
            os.makedirs(defn_dir, exist_ok=True)
        successful = _save_user_definition(defn_dir, defn)
    except OSError:
        log.exception('Failed to save user definition with exception:')
        successful = False
    return successful


def save_labware_offset(name: str, offset: dict) -> bool:
    """
    :param name: the name of the labware (most easily found in the labware
        dict in ['metadata']['name'])
    :param offset: a dict with keys 'x', 'y', and 'z', and float values
        representing the relative position of a container compared to the
        definition file, as determined by calibration
    :return: success code
    """
    offset_d = offset_dir()
    if not os.path.exists(offset_d):
        os.makedirs(offset_d, exist_ok=True)
    return _save_offset(offset_d, name, offset)
