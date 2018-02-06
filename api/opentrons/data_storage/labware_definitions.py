import os
import json

"""
There will be 3 directories for json blobs to define labware:
- `labware_data`: Currently in opentrons/api/opentrons/config, should be moved
        to the repo root and get copied in by the Dockerfile (how to deal with
        this for local development?).
- `custom_definitions`: Same format as definitions in `labware_data`, but lives
        in the persistent data directory.
- `offsets`: A dict with xyz values that get added to each well's xyz fields,
        lives in the persistent data directory.

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


def load_definition(path: str, labware_name: str):
    definition_file = os.path.join(
        path, "{}.json".format(labware_name))
    with open(definition_file) as defn_f:
        lw = json.load(defn_f)
    # from pprint import pprint
    # print("Labware definition:")
    # pprint(lw)
    return lw


def load_offset(path: str, labware_name: str):
    offset_file = os.path.join(
        path, "{}.json".format(labware_name))
    offs = {}
    if os.path.exists(offset_file):
        with open(offset_file) as offs_f:
            offs = json.load(offs_f)
    # from pprint import pprint
    # print("Offsets:")
    # pprint(offs)
    return offs


def load(root_path: str, labware_name: str):
    defn_dir = os.path.join(root_path, 'definitions')
    offset_dir = os.path.join(root_path, 'offsets')
    lw = load_definition(defn_dir, labware_name)
    offs = load_offset(offset_dir, labware_name)

    for well in lw['wells'].keys():
        for axis in 'xyz':
            default_value = lw['wells'][well][axis]
            offset = offs[axis]
            lw['wells'][well][axis] = round(default_value + offset, 2)

    # from pprint import pprint
    # print("Labware with offsets:")
    # pprint(lw)
    return lw
