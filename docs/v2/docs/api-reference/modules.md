---
title: "Python API Reference: Modules"
---

## Absorbance Plate Reader

::: opentrons.protocol_api.AbsorbanceReaderContext
    options:
      heading_level: 3
      inherited_members: true
      filters:
        - "public"
        - "!^__"
        - "!broker"
        - "!geometry"
        - "!load_labware_object"
        - "!load_adapter*"
      
## Flex Stacker

::: opentrons.protocol_api.FlexStackerContext
    options:
      heading_level: 3
      inherited_members: true
      
## Heater-Shaker

::: opentrons.protocol_api.HeaterShakerContext
    options:
      heading_level: 3
      inherited_members: true
      
## Magnetic Block

::: opentrons.protocol_api.MagneticBlockContext
    options:
      heading_level: 3
      inherited_members: true
      
## Magnetic Module

::: opentrons.protocol_api.MagneticModuleContext
    options:
      heading_level: 3
      inherited_members: true
      filters:
        - "public"
        - "!^__"
        - "!broker"
        - "!geometry"
        - "!load_labware_object"
        - "!calibrate"
      
## Temperature Module

::: opentrons.protocol_api.TemperatureModuleContext
    options:
      heading_level: 3
      inherited_members: true
      
## Thermocycler

::: opentrons.protocol_api.ThermocyclerContext
    options:
      heading_level: 3
      inherited_members: true
      filters:
        - "public"
        - "!^__"
        - "!broker"
        - "!geometry"
        - "!load_labware_object"
        - "!total_step_count"
        - "!current_cycle_index"
        - "!total_cycle_count"
        - "!hold_time"
        - "!ramp_rate"
        - "!current_step_index"
