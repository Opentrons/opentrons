---
title: "Python API: Pipette Tips"
description: Basic commands for working with pipette tips.
---

Your robot needs to attach a disposable tip to the pipette before it can aspirate or dispense liquids. The API provides three basic functions that help the robot attach and manage pipette tips during a protocol run. These methods are [`InstrumentContext.pick_up_tip()`][opentrons.protocol_api.InstrumentContext.pick_up_tip], [`InstrumentContext.drop_tip()`][opentrons.protocol_api.InstrumentContext.drop_tip], and [`InstrumentContext.return_tip()`][opentrons.protocol_api.InstrumentContext.return_tip]. Respectively, these methods tell the robot to pick up a tip from a tip rack, drop a tip into the trash (or another location), and return a tip to its location in the tip rack.

The following sections demonstrate how to use each method and include sample code. The examples used here assume that you've loaded the pipettes and labware from the basic [protocol template][protocol-template].

## Picking up a tip

To pick up a tip, call the [`pick_up_tip()`][opentrons.protocol_api.InstrumentContext.pick_up_tip] method without any arguments:

```python
pipette.pick_up_tip()
```

When added to the protocol template, this simple statement works because the API knows which tip rack is associated with `pipette`, as indicated by `tip_racks=[tip_rack]` in the [`load_instrument()`][opentrons.protocol_api.ProtocolContext.load_instrument] call. And it knows the on-deck location of the tip rack (slot D3 on Flex, slot 3 on OT-2) from the `location` argument of [`load_labware()`][opentrons.protocol_api.ProtocolContext.load_labware]. Given this information, the robot moves to the tip rack and picks up a tip from position A1 in the rack. On subsequent calls to `pick_up_tip()`, the robot will use the next available tip. For example:

```python
pipette.pick_up_tip()  # picks up tip from rack location A1
pipette.drop_tip()     # drops tip in trash bin
pipette.pick_up_tip()  # picks up tip from rack location B1
pipette.drop_tip()     # drops tip in trash bin
```

If you omit the `tip_rack` argument from the `pipette` variable, the API will raise an error. In that case, you must pass the tip rack's location to `pick_up_tip` like this:

```python
pipette.pick_up_tip(tip_rack["A1"])
pipette.drop_tip()
pipette.pick_up_tip(tip_rack["B1"])
```

In most cases, it's best to associate tip racks with a pipette and let the API automatically track pickup location for you. This also makes it easy to pick up tips when iterating over a loop, as shown in the next section.

*New in version 2.0*

## Automating tip pickup

When used with Python's [`range`](https://docs.python.org/3/library/stdtypes.html#range) class, a `for` loop brings automation to the tip pickup and tracking process. It also eliminates the need to call `pick_up_tip()` multiple times. For example, this snippet tells the robot to sequentially use all the tips in a 96-tip rack:

```python
for i in range(96):
    pipette.pick_up_tip()
    # liquid handling commands
    pipette.drop_tip()
```

If your protocol requires a lot of tips, add a second tip rack to the protocol. Then, associate it with your pipette and increase the number of repetitions in the loop. The robot will work through both racks.

First, add another tip rack to the sample protocol:

```python
tip_rack_2 = protocol.load_labware(
    load_name="opentrons_flex_96_tiprack_1000ul",
    location="C3"
)
```

Next, change the pipette's `tip_rack` property to include the additional rack:

```python
pipette = protocol.load_instrument(
    instrument_name="flex_1channel_1000",
    mount="left",
    tip_racks=[tip_rack, tip_rack_2],
)
```

Finally, iterate over a larger range:

```python
for i in range(192):
    pipette.pick_up_tip()
    # liquid handling commands
    pipette.drop_tip()
```

For a more advanced "real-world" example, review the [off-deck location protocol][the-off-deck-location] on the [Moving Labware](../moving-labware.md) page. This example also uses a `for` loop to iterate through a tip rack, but it includes other commands that pause the protocol and let you replace an on-deck tip rack with another rack stored in an off-deck location.

## Dropping a tip

To drop a tip in the pipette's trash container, call the [`drop_tip()`][opentrons.protocol_api.InstrumentContext.drop_tip] method with no arguments:

```python
pipette.drop_tip()
```

You can specify where to drop the tip by passing in a location. For example, this code drops a tip in the trash bin and returns another tip to a previously used well in a tip rack:

```python
pipette.pick_up_tip()            # picks up tip from rack location A1
pipette.drop_tip()               # drops tip in default trash container
pipette.pick_up_tip()            # picks up tip from rack location B1
pipette.drop_tip(tip_rack["A1"])  # drops tip in rack location A1
```

*New in version 2.0*

Another use of the `location` parameter is to drop a tip in a specific trash container. For example, calling `pipette.drop_tip(chute)` will dispose tips in the waste chute, even if the pipette's default trash container is a trash bin:

```python
pipette.pick_up_tip()    # picks up tip from rack location A1
pipette.drop_tip()       # drops tip in default trash container
pipette.pick_up_tip()    # picks up tip from rack location B1
pipette.drop_tip(chute)  # drops tip in waste chute
```

*New in version 2.16*

The API automatically varies the tip drop location in the default trash container, or when you haven't specified a `location`, to help keep tips from piling up. Beginning with API version 2.28, you can add the optional `alternate_drop_location` argument to control the tip drop location in a specified `location`:

```python
trash = protocol_context.load_trash_bin("A3")
pipette.pick_up_tip() #picks up the next tip

# alternate drop tip location in the specified trash
pipette.drop_tip(
    location=secondary_trash,
    alternate_drop_location=True)
pipette.pick_up_tip() # picks up the next tip
pipette.drop_tip(
    location=secondary_trash,
    alternate_drop_location=True)
```
*New in version 2.28*

In the example above, the pipette drops each tip in a slightly different location in the `secondary_trash`.  

## Returning a tip

To return a tip to its original location, call the [`return_tip()`][opentrons.protocol_api.InstrumentContext.return_tip] method with no arguments:

```python
pipette.return_tip()
```

*New in version 2.0*

Beginning with API version 2.28, you can return tips with a pipette that's configured to use [partial tip pickup](../pipettes/partial-tip-pickup.md). 

When you return tips to their original position in the tip rack, you'll need to consider which tips, if any, you plan to pick up and use again. For example, a 96-channel pipette in column configuration can't reach column 2 unless column 1 is completely empty. When you call [`pick_up_tip()`][opentrons.protocol_api.InstrumentContext.pick_up_tip] again, the robot won't be able to access unused tips in column 2.

You can still pick up the used tips again from their original location by explictly specifying their location in the tip rack. See below for details.

<!--------

To avoid these tip use conflicts, you can use [`set_empty()`][opentrons.protocol_api.labware.Labware.set_empty] to return used tips to an empty tip rack on the deck.

Start by specifying and placing an empty tip rack on the deck:

```python
# set tip_rack_1 as empty
tip_rack_1.set_empty()

# pick up a tip from the pipette's assigned tip rack
pipette.pick_up_tip()

# return attached tips to the empty tip_rack_1
pipette.drop_tip(tip_rack_1["A1"])
```

*New in version 2.28*

In the example above, the pipette uses automatic tip tracking to pick up the next available tip in its assigned tip rack. Then, it drops the attached tip in well A1 of the empty `tip_rack_1`.

----->
## Working with used tips

Currently, the API considers tips as "used" after being picked up. For example, if the robot picked up a tip from rack location A1 and then returned it to the same location, it will not attempt to pick up this tip again, unless explicitly specified. Instead, the robot will pick up a tip starting from rack location B1. For example:

```python
pipette.pick_up_tip()                # picks up tip from rack location A1
pipette.return_tip()                 # drops tip in rack location A1
pipette.pick_up_tip()                # picks up tip from rack location B1
pipette.drop_tip()                   # drops tip in trash bin
pipette.pick_up_tip(tip_rack["A1"]) # picks up tip from rack location A1
```

Early API versions treated returned tips as unused items. They could be picked up again without an explicit argument. For example:

```python
pipette.pick_up_tip()  # picks up tip from rack location A1
pipette.return_tip()   # drops tip in rack location A1
pipette.pick_up_tip()  # picks up tip from rack location A1
```

*Changed in version 2.2*
