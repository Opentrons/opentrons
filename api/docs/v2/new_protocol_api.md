---
og:description: A comprehensive reference of classes and methods that make up the
  Opentrons Python Protocol API.
---

(protocol-api-reference)=

# API Version 2 Reference

(protocol-api-protocols-and-instruments)=

## Protocols

```{eval-rst}
.. module:: opentrons.protocol_api
```

```{eval-rst}
.. autoclass:: opentrons.protocol_api.ProtocolContext
   :members:
   :exclude-members: location_cache, cleanup, clear_commands
```

## Instruments

```{eval-rst}
.. autoclass:: opentrons.protocol_api.InstrumentContext
   :members:
   :exclude-members: delay
```

(protocol-api-labware)=

## Labware

```{eval-rst}
.. autoclass:: opentrons.protocol_api.Labware
   :members:
   :exclude-members: next_tip, use_tips, previous_tip, return_tips
```

% The trailing ()s at the end of TrashBin and WasteChute here hide the __init__()
% signatures, since users should never construct these directly.

```{eval-rst}
.. autoclass:: opentrons.protocol_api.TrashBin()
   :members:
```

```{eval-rst}
.. autoclass:: opentrons.protocol_api.WasteChute()
   :members:
```

## Wells and Liquids

```{eval-rst}
.. autoclass:: opentrons.protocol_api.Well
   :members:
   :exclude-members: geometry
```

```{eval-rst}
.. autoclass:: opentrons.protocol_api.Liquid
```

(protocol-api-modules)=

## Modules

```{eval-rst}
.. autoclass:: opentrons.protocol_api.HeaterShakerContext
   :members:
   :exclude-members: broker, geometry, load_labware_object
   :inherited-members:
```

```{eval-rst}
.. autoclass:: opentrons.protocol_api.MagneticBlockContext
   :members:
   :exclude-members: broker, geometry, load_labware_object
   :inherited-members:
```

```{eval-rst}
.. autoclass:: opentrons.protocol_api.MagneticModuleContext
   :members:
   :exclude-members: calibrate, broker, geometry, load_labware_object
   :inherited-members:
```

```{eval-rst}
.. autoclass:: opentrons.protocol_api.TemperatureModuleContext
   :members:
   :exclude-members: start_set_temperature, await_temperature, broker, geometry, load_labware_object
   :inherited-members:
```

```{eval-rst}
.. autoclass:: opentrons.protocol_api.ThermocyclerContext
   :members:
   :exclude-members: total_step_count, current_cycle_index, total_cycle_count, hold_time, ramp_rate, current_step_index, broker, geometry, load_labware_object
   :inherited-members:

```

(protocol-api-types)=

## Useful Types

% The opentrons.types module contains a mixture of public Protocol API things and private internal things.
% Explicitly name the things that we expect to be public, excluding everything else.

```{eval-rst}
.. automodule:: opentrons.types
   :members: PipetteNotAttachedError, Point, Location, Mount
```

```{eval-rst}
.. autodata:: opentrons.protocol_api.OFF_DECK
   :no-value:
```

## Executing and Simulating Protocols

```{eval-rst}
.. automodule:: opentrons.execute
   :members:
```

```{eval-rst}
.. automodule:: opentrons.simulate
   :members:

```
