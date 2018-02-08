import os
import json

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

file_dir = os.path.abspath(os.path.dirname(__file__))


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
    default_defn_dir = os.environ.get(
        'LABWARE_DEF',
        os.path.abspath(os.path.join(
            file_dir, '..', '..', '..', 'labware-definitions', 'definitions')))
    print("=-> {}".format(default_defn_dir))
    user_defn_root = os.path.join(
        '/', 'data', 'user_storage', 'opentrons_data', 'labware')
    return _load(default_defn_dir, user_defn_root, labware_name)
