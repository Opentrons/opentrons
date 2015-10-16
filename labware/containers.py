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

import labware

from labware import Microplate, Tiprack, Reservoir
from .grid import GridContainer

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
    'volume', 'min_vol', 'max_vol', 'well_depth', 'spacing_y', 'spacing_x',
    'diameter'
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
            add_custom_container(name, data)


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


def add_custom_container(name, data, parent=None):
    """
    Create a new container with custom dimensions and properties.  See the
    _valid_properties list above for a list of all valid container
    properties.

    Additionally, custom containers can be "subclassed" by providing the
    names of child types and their unique properties within the
    'subsets' property.  Subsets are recursive, meaning that a subset
    can itself define further subsets.

    See config/containers/example_plate.yml for more information on
    custom container definitions.
    """
    obj_type = data.pop('type', 'grid')

    # Handle subsets, figure out container name.
    if parent:
        # Merge in parent data if this is a subset.
        parent = parent.copy()
        parent.update(data)
        data = parent
        container_name = name
    else:
        # Otherwise, prefix with its base container type.
        container_name = obj_type + '.' + name

    subsets = data.pop('subsets', {})

    # Make sure nobody's trying any funny business with property
    # extensions.
    for key in data:
        if key not in _valid_properties:
            raise KeyError(
                "Unknown container property for custom container {}: {}"
                .format(name, key)
            )
        if not isinstance(data[key], _valid_values):
            raise ValueError(
                "Invalid property value for custom container {}: {}"
                .format(name, key)
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
    subclass = type(name, (base, object), data)
    _containers[container_name] = subclass

    # Recurse for subsets.
    for name in subsets:
        add_custom_container(container_name + "." + name, subsets[name], data)


def load_container(name):
    """
    Returns a reference to a Python class representing the named container.

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

_load_default_containers()
load_custom_containers()
