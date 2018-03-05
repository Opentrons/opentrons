import os
import json
from typing import List

"""
There will be 3 directories for json blobs to define labware:
- `labware_data`: Definitions live in the `labware-definitions` project in the
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


def default_definition_dir():
    return os.environ.get(
        'LABWARE_DEF',
        os.path.abspath(os.path.join(
            FILE_DIR, '..', '..', '..', 'labware-definitions', 'definitions')))


def user_defn_root():
    return os.environ.get(
        'USER_DEFN_ROOT',
        os.path.abspath(os.path.join(
            FILE_DIR, '..', '..', '..', 'labware-definitions', 'user')))


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
    offs = {}
    try:
        if os.path.exists(offset_file):
            with open(offset_file) as offs_f:
                offs = json.load(offs_f)
    except FileNotFoundError:
        pass
    # from pprint import pprint
    # print("Offsets:")
    # pprint(offs)
    return offs


def _load(default_defn_dir: str,
          user_defn_root_path: str,
          labware_name: str) -> dict:
    """
    Try to find definition file in <user_defn_root_path>/definitions first,
    then fall back to <default_defn_dir>. If a definition is found in either
    place, look for an offset file in <user_defn_root_path>/offsets and apply
    it if found.

    If no definition file is found, raise a FileNotFoundException.

    :param default_defn_dir: Opentrons default labware definition directory
    :param user_defn_root_path: User labware definition directory
    :param labware_name: Name of labware definition file (without extension)
    :return: a dict of the definition with offset applied to each well
    """
    defn_dir = os.path.join(user_defn_root_path, 'definitions')
    offset_dir = os.path.join(user_defn_root_path, 'offsets')
    lw = _load_definition(defn_dir, labware_name)
    if not lw:
        lw = _load_definition(default_defn_dir, labware_name)
    if not lw:
        raise FileNotFoundError
    offs = _load_offset(offset_dir, labware_name)

    if offs:
        for well in lw['wells'].keys():
            for axis in 'xyz':
                default_value = lw['wells'][well][axis]
                offset = offs[axis]
                lw['wells'][well][axis] = round(default_value + offset, 2)

    # from pprint import pprint
    # print("Labware with offsets:")
    # pprint(lw)
    return lw


def load_json(labware_name: str) -> dict:
    return _load(default_definition_dir(), user_defn_root(), labware_name)


def _list_labware(path: str) -> List[str]:
    try:
        lw = list(map(lambda x: os.path.splitext(x)[0], os.listdir(path)))
    except FileNotFoundError:
        lw = []
    return lw


def list_all_labware() -> List[str]:
    user_list = [] + _list_labware(
        os.path.join(user_defn_root(), 'definitions'))
    default_list = [] + _list_labware(
        default_definition_dir())
    return sorted(list(set(user_list + default_list)))


def _save_user_definition(path: str, defn: dict) -> bool:
    filename = os.path.join(
        path, '{}.json'.format(defn['metadata']['name']))
    with open(filename, 'w') as def_file:
        json.dump(defn, def_file, indent=2)
    # Once possible failures are understood, catch and return a success code
    return True


def _save_offset(path: str, name: str, offset: dict):
    filename = os.path.join(
        path, '{}.json'.format(name))
    with open(filename, 'w') as offset_file:
        json.dump(offset, offset_file, indent=2)
    # Once possible failures are understood, catch and return a success code
    return True


def save_user_definition(defn: dict) -> bool:
    """
    :param defn: a definition json dict, as returned by
        `opentrons.data_storage.serializers.labware_to_json`
    :return: success code
    """
    defn_dir = os.path.join(user_defn_root(), 'definitions')
    if not os.path.exists(defn_dir):
        os.makedirs(defn_dir, exist_ok=True)
    return _save_user_definition(defn_dir, defn)


def save_labware_offset(name: str, offset: dict) -> bool:
    """
    :param name: the name of the labware (most easily found in the labware
        dict in ['metadata']['name'])
    :param offset: a dict with keys 'x', 'y', and 'z', and float values
        representing the relative position of a container compared to the
        definition file, as determined by calibration
    :return: success code
    """
    offset_dir = os.path.join(user_defn_root(), 'offsets')
    if not os.path.exists(offset_dir):
        os.makedirs(offset_dir, exist_ok=True)
    return _save_offset(offset_dir, name, offset)
