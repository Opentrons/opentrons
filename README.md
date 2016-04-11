# OpenTrons Labware Library

![TravisCI status](https://travis-ci.org/OpenTrons/labware.svg)

The point of this repository is to provide a software equivalent to
an operating OpenTrons machine, including all related deck modules
and instruments (pipettes, tipracks, microplates, etc).

This current version has basic support for keeping track of liquids (and 
mixtures of liquids) between liquid containers.

It's currently exporting data concerning modules to a separate codebases
in charge of running the OpenTrons [frontend](https://github.com/Opentrons/otone_frontend) and [backend](https://github.com/Opentrons/otone_backend).

## Containers API

The [labware.containers](labware/containers.py) module provides data about
all supported containers, as well as conversions between old and new data
formats.

Containers can be specified by the user.

### Listing Containers

```python
import labware.containers

list = labware.containers.list_containers()
```

### Defining a Container

Containers definitions are stored in [config/containers](config/containers).
These are YAML files specifying the base type of container, the number of 
columns and rows, the A1 offset, and well margin.

See the documented [example container](config/containers/example_plate.yml)
for more detailed instructions.

For containers with varying well or tube sizes, you can specify each
variation as a `custom_well` within the YAML structure.  See the
[15-50ml tuberack](config/containers/15-50ml.yml) for an example of this
functionality being used.

### Getting Container Well Offset

All container classes provide a static interface for getting non-calibrated
well offsets, which are all in reference to the A1 (or first coordinate) of
each plate.

```python
import labware.containers

microplate = labware.containers.load_container('microplate.24')
microplate.offset('A1')
```

### Tipracks and Tip Inventory

Containers of the Tiprack type have the ability to return the position of a
tip from a given offset number of tips (which represent the tips that have
been used during the operation of the robot).

For example, the code below will provide the offset to the eleventh tip
position, in the event that the first ten have already been used.

```python
import labware.containers

tiprack = labware.containers.load_container('tiprack.10ul')
tiprack.tip_offset(10)
```

### User-Specific Containers

Users can provide their own YAML files specifying custom containers. These
containers can be stored anywhere, but must be loaded within the containers
module before being accessible.

```python
import labware.containers

labware.containers.load_custom_containers('/path/to/containers')
```

This will do a recursive glob through the directory provided and add all 
YAML files to the list of available labware containers.

### Supported Container Types

As of this writing, supported container types are as follows:

* Grid (all containers extend from this base)
* Legacy (containers specified within the old containers.json format)
* Microplate
* Reservoir
* Tiprack
* Tuberack

For an up-to-date list, please use the `containers.list_container_types()`
method.

These types are implemented in the internal code and are currently not
extendable by the end user.