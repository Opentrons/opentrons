# OpenTrons Labware Library

[![Build Status](https://travis-ci.org/OpenTrons/labware.svg?branch=master)](https://travis-ci.org/OpenTrons/labware)

The point of this repository is to provide a software equivalent to
an operating OpenTrons machine, including all related deck modules
and instruments (pipettes, tipracks, microplates, etc).

This current version has basic support for keeping track of liquids (and 
mixtures of liquids) between liquid containers.

It's currently exporting data concerning modules to a separate codebases
in charge of running the OpenTrons [frontend](https://github.com/Opentrons/otone_frontend) and [backend](https://github.com/Opentrons/otone_backend).


## Protocol Definition

```python
protocol.add_container('A1', 'microplate.96')
protocol.add_container('C1', 'tiprack.p200')

# Add a pipette (p200)
protocol.add_instrument('A', 'p200')

# Define transfers.
protocol.transfer('A1:A1', 'A1:A2', ul=100)
protocol.transfer('A1:A2', 'A1:A3', ul=80)
```

### Running on the Robot

```python
# Calibrate containers relative to the only instrument.
protocol.calibrate('A1', x=1, y=2, top=40, bottom=50)
protocol.calibrate('C1', x=100, y=100, top=40)

# Attach to the robot via USB port.
protocol.attach_motor('/dev/tty.usbmodem1421')

# Run protocol.
for current, total in protocol.run():
    print("Completed command {} of {}.").format(current, total)

# Disconnect from the serial port.
protocol.disconnect()
```

## Containers API

The [labware.containers](labsuite/labware/containers.py) module provides data about
all supported containers, as well as conversions between old and new data
formats.

Containers can be specified by the user.

### Listing Containers

```python
from labsuite.labware import containers

list = labware.containers.list_containers()
```

### Defining a Container

Containers definitions are stored in [config/containers](labsuite/config/containers).
These are YAML files specifying the base type of container, the number of 
columns and rows, the A1 offset, and well margin.

See the documented [example container](labsuite/config/containers/example_plate.yml)
for more detailed instructions.

For containers with varying well or tube sizes, you can specify each
variation as a `custom_well` within the YAML structure.  See the
[15-50ml tuberack](labsuite/config/containers/tuberacks/15-50ml.yml) for an example of this
functionality being used.

### Getting Container Well Offset

All container classes provide a static interface for getting non-calibrated
well offsets, which are all in reference to the A1 (or first coordinate) of
each plate.

```python
from labsuite.labware import containers

microplate = containers.load_container('microplate.24')
microplate.offset('A1')
```

### Tipracks and Tip Inventory

Containers of the Tiprack type have the ability to return the position of a
tip from a given offset number of tips (which represent the tips that have
been used during the operation of the robot).

For example, the code below will provide the offset to the eleventh tip
position, in the event that the first ten have already been used.

```python
from labsuite.labware import containers

tiprack = containers.load_container('tiprack.10ul')
tiprack.tip_offset(10)
```

### User-Specific Containers

Users can provide their own YAML files specifying custom containers. These
containers can be stored anywhere, but must be loaded within the containers
module before being accessible.

```python
from labsuite.labware import containers

containers.load_custom_containers('/path/to/containers')
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