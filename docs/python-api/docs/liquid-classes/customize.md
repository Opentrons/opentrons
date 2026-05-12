---
title: 'Python API: Customizing Liquid Classes'
---

You can create your own liquid class to customize transfer behavior for any liquid in a Flex protocol. To make changes, you can edit individual properties of an existing liquid class, or add properties to a new liquid class.

To customize an Opentrons-verified liquid class, first add your pipettes, tips, trash, and labware. Then, use [`get_liquid_class()`][opentrons.protocol_api.ProtocolContext.get_liquid_class] to specify the liquid class you'll make changes to:

```python
custom_water = protocol.get_liquid_class(name="water", version=1)
custom_water_properties = custom_water.get_for(pipette, tiprack)
```

Here, you can also use the optional `version` parameter to specify which version of the liquid class definition you’d like to customize. If unspecified, the API loads the latest version.

_New in version 2.24_

_Changed in version 2.26:_ The `version` parameter lets you apply a previous liquid class definition version.

Next, edit individual liquid class properties based on your Flex pipette and tip combination.

```python
# edit aspirate submerge speed to 80 μL/sec
custom_water_properties.aspirate.submerge.speed = 80

# edit aspirate flow rate by volume for 10 μL and 20 μL volumes
custom_water_properties.aspirate.flow_rate_by_volume.set_for_volume = [(10.0, 40.0)]
custom_water_properties.aspirate.flow_rate_by_volume.set_for_volume = [(20.0, 30.0)]

# edit to delay for 1 sec before retracting after an aspirate
custom_water_properties.aspirate.retract.delay.enabled = True
custom_water_properties.aspirate.retract.delay.duration = 1.0

# edit aspirate tip position
custom_water_properties.aspirate.aspirate_position = {
    "position_reference": "well-top",
    "offset": {"x": 1, "y": 2, "z": 3}
}
# use aspirate tip position to set dispense tip position
custom_water_properties.dispense.dispense_position = custom_water_properties.aspirate.aspirate_position
```

_New in version 2.24_

_Changed in version 2.28_: Edit tip position for an aspirate, dispense, or blowout in a single line, and use one tip position to set another.

Then, complete your transfers with the modified `custom_water` liquid class.

All Opentrons-verified liquid classes position the pipette relative to the well. To customize your liquid class to use [meniscus-relative](robot-position.md#meniscus) locations, set the `positionReference` to `"liquid-meniscus"` for actions like an aspirate or dispense.

## Defining new liquid classes

You can also create a new liquid class for your Flex protocols. Instead of using an Opentrons-verified liquid class, you'll start from scratch, providing a value for every required property in your liquid class.

```python
custom_liquid_class_properties = {
    "p20_single_gen2": {
        "opentrons/opentrons_96_tiprack_20ul/1": {
            "aspirate": {
                "aspirate_position": {
                    "offset": {"x": 1, "y": 2, "z": 3},
                    "position_reference": "well-bottom",
                },
                "correction_by_volume": [(0.0, 0.0)],
                "delay": {"enabled": False},
                "flow_rate_by_volume": [(10.0, 40.0), (20.0, 30.0)],
                "mix": {
                    "enabled": True,
                    "repetitions": 1,
                    "volume": 50,
                },
                "pre_wet": True,
                "retract": {
                    "air_gap_by_volume": [(5.0, 3.0), (10.0, 4.0)],
                    "delay": {"enabled": False},
                    "end_position": {
                        "offset": {"x": 1, "y": 2, "z": 3},
                        "position_reference": "well-bottom",
                    },
                    "speed": 40,
                    "touch_tip": {"enabled": False},
                },
                "submerge": {
                    "delay": {"enabled": False},
                    "speed": 100,
                    "start_position": {
                        "offset": {"x": 1, "y": 2, "z": 3},
                        "position_reference": "well-bottom",
                    },
                },
            },
            "dispense": {
                "correction_by_volume": [(0.0, 0.0)],
                "delay": {"enabled": False},
                "dispense_position": {
                    "offset": {"x": 1, "y": 2, "z": 3},
                    "position_reference": "well-bottom",
                },
                "flow_rate_by_volume": [(10.0, 40.0), (20.0, 30.0)],
                "mix": {"enabled": False},
                "push_out_by_volume": [(10.0, 7.0), (20.0, 10.0)],
                "retract": {
                    "air_gap_by_volume": [(5.0, 3.0), (10.0, 4.0)],
                    "blowout": {
                        "enabled": True,
                        "location": "destination",
                        "flowRate": 50,
                    },
                    "delay": {"enabled": False},
                    "end_position": {
                        "offset": {"x": 1, "y": 2, "z": 3},
                        "position_reference": "well-bottom",
                    },
                    "speed": 40,
                    "touch_tip": {"enabled": False},
                },
                "submerge": {
                    "delay": {"enabled": False},
                    "speed": 100,
                    "start_position": {
                        "offset": {"x": 1, "y": 2, "z": 3},
                        "position_reference": "well-bottom",
                    },
                },
            },
        }
    }
}
```

Then, use the defined properties and [`define_liquid_class()`][opentrons.protocol_api.ProtocolContext.define_liquid_class] to create your new liquid class:

```python
# create a new liquid class
custom_viscous = protocol.define_liquid_class(
   name="custom_viscous",
   properties=custom_liquid_class_properties,
   display_name="Custom Viscous"
)
```

_New in version 2.24_

_Changed in version 2.28_: Add ability to control where and when the pipette blows out excess liquid.

You'll need to define values for all required properties in your new liquid class, like submerging before aspirating or after dispensing, speeds and flow rates, and position offsets. See the Opentrons-verified [liquid class properties](https://github.com/Opentrons/opentrons/tree/edge/shared-data/liquid-class/definitions/1) for examples.

The example above also defines some optional properties, like a mix and a blowout, in a custom liquid class. See [the liquid class schema](https://github.com/Opentrons/opentrons/blob/edge/shared-data/liquid-class/schemas/1.json) for a complete list of properties.

!!! note
The [`ProtocolContext.get_liquid_class()`][opentrons.protocol_api.ProtocolContext.get_liquid_class] method only accepts Opentrons-verified liquid classes, like `glycerol_50`. You'll need to use [`ProtocolContext.define_liquid_class()`][opentrons.protocol_api.ProtocolContext.define_liquid_class] in each Flex protocol that uses a custom liquid class.
