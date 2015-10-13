"""
This module provides an interface to other systems (such as the robot itself)
for quering the position of wells and other items within labware equipment,
such as microplates, tipracks, and reservoirs.

The containers aren't stored or defined here, merely aggregated under the
namespace expected by the external API.

For example, `containers.load('microplate.96.deepwell')` will simply load
`microplates.Microplate_96_Deepwell`.  The name that gets passed to the 
container is the same as the name that should be defined in the JSON
Protocol file.

There's also support for custom containers, by placing them in 
config/containers.yml.

This code is a big pile of magic.  Sorry.
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
    'volume', 'min_vol', 'max_vol', 'well_depth'
]

_valid_values = (int, float, str)

_containers = { }

def load_custom_containers(folder=None):
    if not folder:
        folder = os.path.join(os.getcwd(), 'config/containers')
    files = []
    for f in os.listdir(folder):
        full_path = os.path.join(folder, f)
        if os.path.isfile(full_path) and full_path.endswith('.yml'):
            data = yaml.load(open(full_path, 'r'))
            name = os.path.splitext(f)[0]
            add_custom_container(name, data)

def _load_default_containers():
    _containers['grid'] = GridContainer
    container_modules = [labware.tipracks, labware.microplates, labware.reservoirs]
    for mod in container_modules:
        props = dir(mod)
        for name in props:
            prop = getattr(mod, name)
            if inspect.isclass(prop) and issubclass(prop, GridContainer):
                name = normalize_container_name(name)
                _containers[name] = prop

def normalize_container_name(name):
    return str(name).lower().replace('_', '.')

def add_custom_container(name, data, parent=None):

    obj_type = data.pop('type', 'grid')

    if parent:
        # Merge in parent data if this is a subset.
        parent = parent.copy()
        parent.update(data)
        data = parent
        container_name = name
    else:
        # Otherwise, prefix with its base container type.
        container_name = obj_type+'.'+name
    
    subsets = data.pop('subsets', {})

    # Make sure nobody's trying any funny business with property
    # extensions.
    for key in data:
        if key not in _valid_properties:
            raise KeyError(
                "Unknown container property for custom container {}: {}"\
                .format(name, key)
            )
        if not isinstance(data[key], _valid_values):
            raise ValueError(
                "Invalid container value for custom container {}: {}"\
                .format(name, key)
            )

    # Figure out what base we're extending.
    base = _typemap.get(obj_type, None)
    if not base:
        raise KeyError(
            "Invalid container type for custom container {}: {}. "\
            .format(name, obj_type)+
            "Valid choices: {}"\
            .format(", ".join(list_container_types()))
        )

    # Do the extension.
    subclass = type(name, (base, object), data)
    _containers[container_name] = subclass

    # Recurse for subsets.
    for name in subsets:
        add_custom_container(container_name+"."+name, subsets[name], data)

def load_container(name):
    if name in _containers:
        return _containers[name]
    raise KeyError(
        "Invalid container name {}.  Valid containers: {}"\
        .format(name, ", ".join(list_containers()))
    )

def list_containers():
    return sorted(list(_containers.keys()))

def list_container_types():
    return sorted(list(_typemap.keys()))

_load_default_containers()
load_custom_containers()