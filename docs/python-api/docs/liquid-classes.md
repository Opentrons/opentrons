---
title: 'Python API: Liquid Classes'
---

Accounting for properties of liquids in your protocol can increase pipetting accuracy on the Flex. For example, a slower flow rate can improve pipetting for a viscous liquid, and an air gap can prevent a volatile liquid from dripping onto the deck.

This page covers the properties of Opentrons-verified liquid classes, how to use a verified liquid class in your protocol, and how to customize a liquid class.

## Opentrons-verified liquid classes

Opentrons-verified liquid classes are based on the properties of common liquids: water, ethanol, and glycerol.

| Opentrons-verified liquid class | Description              | Load name {width="25%"} |
| ------------------------------- | ------------------------ | ----------------------- |
| Aqueous                         | Based on deionized water | `water`                 |
| Volatile                        | Based on 80% ethanol     | `ethanol_80`            |
| Viscous                         | Based on 50% glycerol    | `glycerol_50`           |

Use an Opentrons-verified liquid class in your transfers to automatically apply optimized behavior. For example, choosing the `glycerol_50` liquid class changes properties, like flow rate, to accurately transfer viscous liquid.

## Liquid class properties

When you select a liquid class to use in transfers on the Flex, properties like submerge speed, flow rate, touch tip, and air gap are automatically applied. These changes might help prevent splashing or dripping of a volatile liquid, or reduce air bubbles forming in a viscous liquid.

Each Opentrons-verified liquid class is defined by a set of properties:

<table>
    <thead>
        <tr>
            <th>Property</th>
            <th>Description</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>
                <img src="../img/lc_icons/submerge_position.png">
                <p><strong>Submerge position</strong></p>
            </td>
            <td>The pipette begins at this position above the liquid.</td>
        </tr>
        <tr>
            <td>
                <img src="../img/lc_icons/submerge_speed.png">
                <p><strong>Submerge speed</strong></p>
            </td>
            <td>The pipette submerges into the liquid at this speed.</td>
        </tr>
        <tr>
            <td>
                <img src="../img/lc_icons/delay_after_submerge.png">
                <p><strong>Delay after submerging</strong></p>
            </td>
            <td>
                <p>The pipette delays a specified amount of time:</p>
                <ul>
                    <li>before submerging into or retracting from liquid.</li>
                    <li>before or after an aspirate or dispense.</li>
                    <li>after a push out.</li>
                </ul>
            </td>
        </tr>
        <tr>
            <td>
                <img src="../img/lc_icons/mix.png">
                <p><strong>Mix liquid</strong></p>
            </td>
            <td>The pipette mixes liquid inside the well before an aspirate or after a dispense.</td>
        </tr>
        <tr>
            <td>
                <img src="../img/lc_icons/prewet_tip.png">
                <p><strong>Pre-wet tip</strong></p>
            </td>
            <td>The pipette pre-wets the attached tip before aspirating liquid.</td>
        </tr>
        <tr>
            <td>
                <img src="../img/lc_icons/flow_rate_aspirate.png">
                <p><strong>Aspirate flow rate</strong></p>
            </td>
            <td>
                <ul>
                    <li>The pipette aspirates liquid at this speed.</li>
                    <li>Varies by volume.</li>
                </ul>
            </td>
        </tr>
        <tr>
            <td>
                <img src="../img/lc_icons/flow_rate_dispense.png">
                <p><strong>Dispense flow rate</strong></p>
            </td>
            <td>
                <ul>
                    <li>The pipette dispenses liquid at this speed.</li>
                    <li>Varies by volume.</li>
                </ul>
            </td>
        </tr>
        <tr>
            <td>
                <img src="../img/lc_icons/retract_position.png">
                <p><strong>Retract position</strong></p>
            </td>
            <td>The pipette retracts from the liquid and moves to this position.</td>
        </tr>
        <tr>
            <td>
                <img src="../img/lc_icons/retract_speed.png">
                <p><strong>Retract speed</strong></p>
            </td>
            <td>The pipette retracts from the liquid at the specified speed.</td>
        </tr>
        <tr>
            <td>
                <img src="../img/lc_icons/push_out.png">
                <p><strong>Push out</strong></p>
            </td>
            <td>
                <ul>
                    <li>The pipette dispenses a small amount of air to ensure all liquid leaves the tip.</li>
                    <li>Varies by volume.</li>
                </ul>
            </td>
        </tr>
        <tr>
            <td>
                <img src="../img/lc_icons/touch_tip.png">
                <p><strong>Touch tip</strong></p>
            </td>
            <td>The pipette touches the attached tip to the sides of a well to remove droplets.</td>
        </tr>
        <tr>
            <td>
                <img src="../img/lc_icons/air_gap.png">
                <p><strong>Air gap</strong></p>
            </td>
            <td>
                <ul>
                    <li>The pipette aspirates a small amount of air after an aspirate or dispense.</li>
                    <li>Varies by volume.</li>
                </ul>
            </td>
        </tr>
        <tr>
            <td>
                <img src="../img/lc_icons/blow_out.png">
                <p><strong>Blow out</strong></p>
            </td>
            <td>The pipette dispenses a larger amount of air to ensure all liquid leaves the tip.</td>
        </tr>
    </tbody>
</table>

A [liquid class definition](liquid-class-definitions.md) specifies values for each property. When your Flex protocol includes a liquid class, these property values automatically define transfer behavior. For example, if you use `transfer_with_liquid_class()` to transfer a viscous liquid, the pipette submerges into the liquid and aspirates more slowly to prevent air bubbles from forming.

## Using liquid classes

You'll use a [liquid class definition](liquid-class-definitions.md) in your protocol to optimize transfer behavior based on liquid properties, along with your chosen Flex pipettes and tips.

This section covers selecting a liquid class and using the [`transfer_with_liquid_class()`][opentrons.protocol_api.InstrumentContext.transfer_with_liquid_class] method. For more details, including using the [`distribute_with_liquid_class()`][opentrons.protocol_api.InstrumentContext.distribute_with_liquid_class] and [`consolidate_with_liquid_class()`][opentrons.protocol_api.InstrumentContext.consolidate_with_liquid_class] methods, see [Complex Commands](complex-commands/index.md).

Start by defining the tips, trash, pipette, and labware used in your transfers. Then, use [`ProtocolContext.get_liquid_class()`][opentrons.protocol_api.ProtocolContext.get_liquid_class] to select an Opentrons-verified liquid class and save its results to a variable. `get_liquid_class()` takes into account the pipette and tip racks in your protocol and only loads the relevant portion of the liquid class definition.

```python
from opentrons import protocol_api

requirements = {"robotType": "Flex", "apiLevel": "{{ apiLevel }}"}

# define tips, trash, and pipette
def run(protocol: protocol_api.ProtocolContext):
    tip_rack = protocol.load_labware(
        load_name="opentrons_flex_96_tiprack_50ul", location="D3"
    )
    trash = protocol.load_trash_bin(location="A3")
    pipette = protocol.load_instrument(
        instrument_name="flex_1channel_50",
        mount="left",
        tip_racks=[tip_rack],
    )

    # load source and destination labware
    reservoir = protocol.load_labware(
       load_name="nest_12_reservoir_15ml", location="C3"
    )
    plate = protocol.load_labware(
        load_name="nest_96_wellplate_200ul_flat", location="C2"
    )

    # select liquid class to use in your protocol
    viscous_liquid = protocol.get_liquid_class(name="glycerol_50")
```

_New in version 2.24_

Next, use the [`InstrumentContext.transfer_with_liquid_class()`][opentrons.protocol_api.InstrumentContext.transfer_with_liquid_class] method to transfer an aqueous, volatile, or viscous liquid defined in a Flex protocol. This method requires the stored set of properties defined earlier, `viscous_liquid`, instead of the `glycerol_50` load name. It accepts additional arguments that let you specify your liquid, volume, source and destination wells, tip handling preferences, and trash location.

Opentrons-verified liquid class definitions are based on Flex pipette and tip combinations. The API will raise an error if you try to perform a liquid class transfer with an OT-2 pipette and tips.

In the example below, a Flex 1-channel pipette will transfer 50 µL of your `viscous_liquid` from well A1 of the reservoir to well A1 of the destination plate. A new tip is used for each well transfer, and each tip is dropped in the trash bin loaded in slot A3.

```python
# transfer with the viscous liquid class
pipette.transfer_with_liquid_class(
   liquid_class=viscous_liquid,
   volume=50,
   source=reservoir["A1"],
   dest=plate["A1"],
   new_tip="always",
   trash_location=trash,
)
```

_New in version 2.24_

Here, the `glycerol_50` viscous liquid class definition accounts for all other transfer behavior, like flow rate, whether or not to add an air gap or delay, and submerge and retract speeds. For each aspirate, the pipette:

- Moves to 2 mm above the top of the source well at 4 mm/sec.
- Submerges to 2 mm above the bottom of the source well at 4mm/sec.
- Aspirates 50 µL at 50 µL/sec with a volume correction.
- Delays for 1 second.
- Retracts to 2 mm above the top of the well at 4 mm/sec.

And for each dispense, the pipette:

- Moves to 2 mm above the top of the destination well at 4 mm/sec.
- Submerges to 2 mm above the top of the destination well at 4 mm/sec.
- Dispenses 50 µL at 25 µL/sec with a volume correction.
- Pushes out a volume of air equivalent to 3.9 µL
- Delays for 0.5 second.
- Retracts to 2 mm above the top of the well at 4 mm/sec.

In many cases, the liquid class definition represents fine-tuned changes optimized for each liquid class. If you instead used the same pipette to transfer 50 µL of the volatile `liquid_2`, transfer behavior would include:

- Submerging into and retracting from the volatile `liquid_2` at 100 mm/sec.
- Adding larger air gaps after aspirating _and_ dispensing to prevent dripping onto the deck.
- Aspirating and dispensing at 30 µL/sec with a larger correction by volume.
- Pushing out a larger volume of air to ensure all liquid leaves the tip.

Not all transfer behavior is easily visible. See [Liquid Class Definitions](liquid-class-definitions.md) for a full list of changes based on liquid class, pipette, and tip combination. For more detail on individual transfer settings, see [Liquid Control](building-block-commands/liquids.md).

## Customizing liquid classes

You can create your own liquid class to customize transfer behavior for any liquid in a Flex protocol. To make changes, you can edit individual properties of an existing liquid class, or add properties to a new liquid class.

To customize an Opentrons-verified liquid class, first add your pipettes, tips, trash, and labware. Then, use [`get_liquid_class()`][opentrons.protocol_api.ProtocolContext.get_liquid_class] to specify the liquid class you'll make changes to:

```python
custom_water = protocol.get_liquid_class(name="water", version=1)
custom_water_properties = custom_water.get_for(pipette, tip_rack)
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
