"""
This module provides an interface to other systems (such as the robot itself)
for quering the position of wells and other items within labware equipment,
such as microplates, tipracks, and reservoirs.

The containers aren't stored or defined here, merely aggregated under the
namespace expected by the external API.

For example, `containers.load_container('microplate.96.deepwell')` will load
`microplates.Microplate_96_Deepwell`.  The name that gets passed to the
container is the same as the name that should be defined in the JSON
Protocol file.

There's also support for custom containers, either by placing them in the
config/containers directory of this library (see included examples), or by
using the load_custom_containers function of this module to specify an
alternate configuration directory.
"""

import os
import yaml
import inspect
import json

import labware

from labware import Microplate, Tiprack, Reservoir
from .grid import GridContainer, normalize_position

# These are the base types that containers can extend from.
_typemap = {
    'grid': GridContainer,
    'tiprack': Tiprack,
    'microplate': Microplate,
    'reservoir': Reservoir
}

# Valid properties to configure.
# TODO: Define this on each container type.
_valid_properties = [
    'rows', 'cols', 'a1_x', 'a1_y', 'spacing', 'height', 'length', 'width',
    'volume', 'min_vol', 'max_vol', 'well_depth', 'row_spacing', 
    'col_spacing', 'diameter', 'legacy_name'
]

# These are the types that can be defined within a custom container.
_valid_values = (int, float, str)

# The list of modules to automatically catalog as supported containers.
_container_modules = [
    labware.tipracks, labware.microplates, labware.reservoirs
]

_containers = {}

def load_custom_containers(folder=None):
    """
    Loads YAML files from the directory specified, or the default
    configuration directory for this module.

    Loaded containers will be named for their filename and their
    specified type.

    For example, a file named "foo.yml" which specifies that its
    container is a microplate will be officially called
    "microplate.foo" for reference purposes within JSON Protocols
    and other parts of the system.

    If a container name is reused, the old container will be 
    replaced.
    """
    # Default to local library configuration.
    if not folder:
        folder = os.path.join(os.getcwd(), 'config/containers')
    files = []
    # Get all YAML files from the specified directory, parse then,
    # and send the data to add_custom_container.
    for f in os.listdir(folder):
        full_path = os.path.join(folder, f)
        if os.path.isfile(full_path) and full_path.endswith('.yml'):
            data = yaml.load(open(full_path, 'r'))
            name = os.path.splitext(f)[0]
            add_custom_container(data, name=name)
        elif os.path.isdir(full_path):
            load_custom_containers(full_path)


def _load_default_containers():
    """
    Traverses the set list of default container types in order to provide
    access to them through standardized container reference names.

    We do this so that we don't have to manually list a container in this
    module everytime we add a new one.
    """
    _containers['grid'] = GridContainer
    for mod in _container_modules:
        props = dir(mod)
        for name in props:
            prop = getattr(mod, name)
            if inspect.isclass(prop) and issubclass(prop, GridContainer):
                name = normalize_container_name(name)
                _containers[name] = prop


def normalize_container_name(name):
    """
    Takes a container class name like Microplate_96_Deepwell and normalizes
    it to a container reference name in the form of microplate.96.deepwell.
    """
    return str(name).lower().replace('_', '.')


def add_custom_container(data, name=None, parent=None):
    """
    Create a new container with custom dimensions and properties.  See the
    _valid_properties list above for a list of all valid container
    properties.

    If a name is provided, the new container will be added to the list of
    available containers.

    Additionally, custom containers can be "subclassed" by providing the
    names of child types and their unique properties within the
    'subsets' property.  Subsets are recursive, meaning that a subset
    can itself define further subsets.

    See config/containers/example_plate.yml for more information on
    custom container definitions.
    """
    obj_type = data.pop('type', 'grid')

    # Handle subsets, figure out container name.
    if name and parent:
        # Merge in parent data if this is a subset.
        parent = parent.copy()
        parent.update(data)
        data = parent
        container_name = name
    elif name:
        # Otherwise, prefix with its base container type.
        container_name = obj_type + '.' + name

    subsets = data.pop('subsets', {})

    # Make sure nobody's trying any funny business with property
    # extensions.
    for key in data:
        if key not in _valid_properties:
            raise KeyError(
                "Unknown container property for custom container {}: {}"
                .format(name or '', key)
            )
        if not isinstance(data[key], _valid_values):
            raise ValueError(
                "Invalid property value for custom container {}: {}"
                .format(name or '', key)
            )

    # Figure out what base we're extending.
    base = _typemap.get(obj_type, None)
    if not base:
        raise KeyError(
            "Invalid container type for custom container {}: {}. "
            .format(name, obj_type) +
            "Valid choices: {}"
            .format(", ".join(list_container_types()))
        )

    # Do the extension.
    tname = name or 'CustomContainer'
    subclass = type(tname, (base, object), data)

    # If this is a named container, add it to our list of containers.
    if name:
        _containers[container_name] = subclass

    # Recurse for subsets.
    for k in subsets:
        add_custom_container(
            subsets[k], name=container_name + "." + k, parent=data
        )

    return subclass


def load_container(name):
    """
    Returns a Python class representing the named container.

    For a list of all valid containers, use list_containers.
    """
    if name in _containers:
        return _containers[name]
    raise KeyError(
        "Invalid container name {}.  Valid containers: {}"
        .format(name, ", ".join(list_containers()))
    )


def list_containers():
    """
    Returns a list of all valid container names for use in the JSON protocol
    """
    return sorted(list(_containers.keys()))


def list_container_types():
    """
    Returns a list of all valid container types (microplate, tiprack, etc)
    for use in custom container definitions.
    """
    return sorted(list(_typemap.keys()))


def generate_legacy_container(container_name, format=False):
    """
    Loads a container and outputs a dict in the format expected by
    the legacy containers.json file in the otone_frontend repository.

    If format is set to True, then a string will be output with nicely-
    formatted JSON, for pasting directly into the containers.json file.
    """

    container = load_container(container_name)

    data = {}

    data['origin-offset'] = {
        'x': container.a1_x,
        'y': container.a1_y
    }

    if format is True:
        print('"{}": {{'.format(container_name))
        print('\t"origin-offset": ', json.dumps(data['origin-offset'])+',')

    locs = {}

    if format is True:
        print('\t"locations": {')
    for col in range(0, container.cols):
        for row in range(1, container.rows+1):
            loc = []
            pos = '{}{}'.format(chr(col+ord('A')), row)
            (x, y) = container.calculate_offset(pos)
            locs[pos] = {
                'x': round(x, 2),
                'y': round(y, 2),
                'z': 0,
                'depth': container.depth,
                'diameter': container.diameter,
                'total-liquid-volume': container.volume
            }
            if format is True:
                print('\t\t"{}":'.format(pos), json.dumps(locs[pos])+',')

    if format is True:
        print("\t}")
        return None

    data['locations'] = locs

    return data

def convert_legacy_containers(containers=None, path=None, interactive=False):
    """
    Takes a dict from a legacy containers struct and converts each container
    listed to the new YAML format.

    If you provide path instead of a dict representing containers (use the
    same structure as containers.json), then that file will be loaded and
    its JSON parsed.

    If you put it into interactive mode, it will prompt you to provide new
    file paths (relative to config/containers) for each container and 
    automatically save them in the default config/containers.
    """

    if path:
        containers = json.load(open(path).read())

    yaml = ""

    for name in containers:

        out = convert_legacy_container(containers[name])

        # Pretty-print this because we're going to be maintaining them.
        key_order = [
            # Empty array values will insert a new line. ¯\_(ツ)_/¯
            'rows', 'cols', 'a1_x', 'a1_y', 'spacing', 'col_spacing', 
            'row_spacing', None, 'height', 'diameter',
            'well_depth', None, 'volume', None
        ]

        # Are we concatting our big string or saving this bit to its own file?
        if interactive:
            yaml = ""  # Flush.
        else:
            yaml = "---\n"

        for key in key_order:
            val = out.get(key)
            if key is None:
                yaml = yaml + "\n"
            elif val is not None:
                yaml = yaml + "{}: {}\n".format(key, val)

        if interactive:
            print("Converted: {}".format(name))
            path = input("New path: ")
            f = open(os.path.join(os.getcwd(), 'config/containers', path))
            f.write(yaml)

        yaml += 'legacy_name: '+json.dumps(name)

    return yaml


def convert_legacy_container(container):
    """
    Takes the dict from an old-style legacy containers.json format and
    converts it to the new format for serializing to YAML.
    """

    lines = []

    wells = container['locations']

    a1 = wells.get('A1')
    b1 = wells.get('B1', {})
    a2 = wells.get('A2', {})

    out = {}

    out['volume'] = a1.get('total-liquid-volume')
    out['diameter'] = a1.get('diameter')
    out['well_depth'] = a1.get('depth')
    out['height'] = a1.get('depth')
    out['a1_x'] = container.get('origin-offset', {'x': None}).get('x')
    out['a1_y'] = container.get('origin-offset', {'y': None}).get('y')

    spacing_x = b1.get('x')
    spacing_y = a2.get('y')

    if spacing_x == spacing_y:
        out['spacing'] = spacing_y
    else:
        out['col_spacing'] = spacing_x
        out['row_spacing'] = spacing_y

    max_col, max_row = normalize_position(max(wells.keys()))

    out['rows'] = max_row + 1 
    out['cols'] = max_col + 1

    return out

_load_default_containers()
load_custom_containers()
