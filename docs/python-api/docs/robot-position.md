---
title: "Python API: Labware and Deck Positions"
description: How to define positions within an Opentrons robot and alter its speed and trajectory.
---

The API automatically determines how the robot needs to move when working with the instruments and labware in your protocol. But sometimes you need direct control over these activities. The API lets you do just that. Specifically, you can control movements relative to labware and deck locations. You can also manage the gantry’s speed and trajectory as it traverses the working area. This document explains how to use API commands to take direct control of the robot and position it exactly where you need it.

## Position relative to labware

When the robot positions itself relative to a piece of labware, where it moves is determined by the labware definition, the actions you want it to perform, and the labware offsets for a specific deck slot. This section describes how these positional components are calculated and how to change them.

### Well positions

Every well on every piece of labware has four addressable positions: top, bottom, center, and meniscus. 

The top, bottom, and center positions are determined by the labware definition and what the labware is loaded on top of. The meniscus position is determined by the height of the liquid inside a well. You can use these positions as-is or calculate other positions relative to them.

#### Top

Let's look at the [`Well.top()`][opentrons.protocol_api.labware.Well.top] method. It returns a position level with the top of the well, centered in both horizontal directions.

```python
plate["A1"].top()  # the top center of the well
```

This is a good position to use for a [blow out operation][blow-out-building-block] or an activity where you don't want the tip to contact the liquid. In addition, you can adjust the height of this position with the optional argument `z`, which is measured in mm. Positive `z` numbers move the position up, negative `z` numbers move it down.

```python
plate["A1"].top(z=1)  # 1 mm above the top center of the well
plate["A1"].top(z=-1) # 1 mm below the top center of the well
```

*New in version 2.0*

#### Bottom

Let's look at the [`Well.bottom()`][opentrons.protocol_api.labware.Well.bottom] method. It returns a position level with the bottom of the well, centered in both horizontal directions. 

```python
plate["A1"].bottom()  # the bottom center of the well
```

This is a good position for [aspirating liquid](building-block-commands/liquids.md#aspirate-building-block) or an activity where you want the tip to contact the liquid. Similar to the `Well.top()` method, you can adjust the height of this position with the optional argument `z`, which is measured in mm. Positive `z` numbers move the position up, negative `z` numbers move it down.

```python
plate["A1"].bottom(z=1)  # 1 mm above the bottom center of the well
plate["A1"].bottom(z=-1) # 1 mm below the bottom center of the well
                         # this may be dangerous!
```

!!! warning
    Negative `z` arguments to `Well.bottom()` will cause the pipette tip to collide with the bottom of the well. Collisions may bend the tip (affecting liquid handling) and the pipette may be higher than expected on the z-axis until it picks up another tip.
    
    Flex can detect collisions, and even gentle contact may trigger an overpressure error and cause the protocol to fail. Avoid `z` values less than 1, if possible.
    
    The OT-2 has no sensors to detect contact with a well bottom. The protocol will continue even after a collision.

*New in version 2.0*

#### Center

Let's look at the [`Well.center()`][opentrons.protocol_api.labware.Well.center] method. It returns a position centered in the well both vertically and horizontally. This can be a good place to start for precise control of positions within the well for unusual or custom labware.

```python
plate["A1"].center() # the vertical and horizontal center of the well
```

*New in version 2.0*

#### Meniscus

Let's look at the [`Well.meniscus()`][opentrons.protocol_api.labware.Well.meniscus] method. It returns a position at the surface of liquid, or meniscus, inside a well. Similar to the `.Well.top()` and `.Well.bottom()` methods, you can adjust the height of this position with the optional argument `z`, which is measured in mm. Positive `z` values move the position up, and negative ones move it down. 

```python
plate["A1"].meniscus(
    z=-1, target= "end"
    ) 
# 1 mm below the meniscus of liquid inside the well
```

The liquid meniscus in a well changes during aspirating or dispensing, so you'll also need to specify a `target` position relative to the meniscus. Each position target is useful in different scenarios: 

- Set `target="start"` to target the existing liquid meniscus in the destination well before a dispense. 
- Set `target="end"` to ensure the pipette stays submerged while aspirating, or to avoid touching liquid in the destination well while dispensing. 

You can use the optional `location` and `end_location` parameters of the [`aspirate()`][opentrons.protocol_api.InstrumentContext.aspirate] and [`dispense()`][opentrons.protocol_api.InstrumentContext.dispense] methods to pipette relative to the liquid meniscus as it changes: 

```python
pipette.aspirate(
    volume=100,
    location=plate["A1"].meniscus(z=-1, target="start"),
    end_location=plate["A1"].meniscus(z=-1, target="end")
)
```

*Changed in version 2.27*: The `end_location` parameter.

Here, the pipette tip stays at 1 mm below the liquid meniscus, regardless of changes in liquid height during the aspirate. For more, see the [aspirate][aspirate-building-block] and [dispense][dispense-building-block] sections.

!!! note
    To use the [`meniscus()`][opentrons.protocol_api.labware.Well.meniscus] method, you'll first need to specify the starting liquid volume with [`Labware.load_liquid()`][opentrons.protocol_api.labware.Labware.load_liquid] or probe for liquid with [`measure_liquid_height()`][opentrons.protocol_api.InstrumentContext.measure_liquid_height].
    
    Detecting liquid in a well requires pipette sensors, so you can only measure liquid height with a Flex pipette. 

*New in version 2.23*

### Default positions

By default, your robot will aspirate and dispense 1 mm above the bottom of wells. This default clearance may not be suitable for some labware geometries, liquids, or protocols. You can change this value based on your labware with the [`Well.bottom()`][opentrons.protocol_api.labware.Well.bottom] method and the `z` argument, though it can be cumbersome to do so repeatedly.

If you need to change the aspiration or dispensing height for multiple operations, specify the distance in mm from the well bottom with the [`InstrumentContext.well_bottom_clearance`][opentrons.protocol_api.InstrumentContext.well_bottom_clearance] object. It has two attributes: `well_bottom_clearance.aspirate` and `well_bottom_clearance.dispense`. These change the aspiration height and dispense height, respectively.

Modifying these attributes will affect all subsequent aspirate and dispense actions performed by the attached pipette, even those executed as part of a [`transfer()`][opentrons.protocol_api.InstrumentContext.transfer] operation. This snippet from a sample protocol demonstrates how to work with and change the default clearance:

```python
# aspirate 1 mm above the bottom of the well (default)
pipette.aspirate(50, plate["A1"])
# dispense 1 mm above the bottom of the well (default)
pipette.dispense(50, plate["A1"])

# change clearance for aspiration to 2 mm
pipette.well_bottom_clearance.aspirate = 2
# aspirate 2 mm above the bottom of the well
pipette.aspirate(50, plate["A1"])
# still dispensing 1 mm above the bottom
pipette.dispense(50, plate["A1"])

pipette.aspirate(50, plate["A1"])
# change clearance for dispensing to 10 mm      
pipette.well_bottom_clearance.dispense = 10
# dispense high above the well
pipette.dispense(50, plate["A1"])
```

*New in version 2.0*

## Using Labware Position Check

All positions relative to labware are adjusted automatically based on labware offset data. Calculate labware offsets by running Labware Position Check during protocol setup, either in the Opentrons App or on the Flex touchscreen. Version 6.0.0 and later of the robot software can apply previously calculated offsets on the same robot for the same labware type and deck slot, even across different protocols.

You should only adjust labware offsets in your Python code if you plan to run your protocol in Jupyter Notebook or from the command line. See [Setting Labware Offsets][setting-labware-offsets] in the Advanced Control section for information.

## Position relative to trash containers

Movement to [`TrashBin`][opentrons.protocol_api.TrashBin] or [`WasteChute`][opentrons.protocol_api.WasteChute] objects is based on the horizontal *center* of the pipette. This is different than movement to labware, which is based on the primary channel (the back channel on 8-channel pipettes, and the back-left channel on 96-channel pipettes in default configuration). Using the center of the pipette ensures that all attached tips are over the trash container for blowing out, dropping tips, or other disposal operations.

!!! note
    In API version 2.15 and earlier, trash containers are [`Labware`][opentrons.protocol_api.labware.Labware] objects that have a single well. See [fixed_trash][opentrons.protocol_api.ProtocolContext.fixed_trash] and [Position Relative to Labware](#position-relative-to-labware) above.

You can adjust the position of the pipette center with the [`TrashBin.top()`][opentrons.protocol_api.TrashBin.top] and [`WasteChute.top()`][opentrons.protocol_api.WasteChute.top] methods. These methods allow adjustments along the x-, y-, and z-axes. In contrast, `Well.top()`, [covered above](#top), only allows z-axis adjustment. With no adjustments, the "top" position is centered on the x- and y-axes and is just below the opening of the trash container.

```python
trash = protocol.load_trash_bin("A3")

trash  # pipette center just below trash top center
trash.top()  # same position
trash.top(z=10)  # 10 mm higher
trash.top(y=10)  # 10 mm towards back, default height
```

*New in version 2.18*

Another difference between the trash container `top()` methods and `Well.top()` is that they return an object of the same type, not a [`Location`][opentrons.types.Location]. This helps prevent performing undesired actions in trash containers. For example, you can aspirate at a location or from a well, but not from a trash container. On the other hand, you can blow out at a location, well, trash bin, or waste chute.

## Position relative to the deck

The robot's base coordinate system is known as *deck coordinates*. Many API functions use this coordinate system, and you can also reference it directly. It is a right-handed coordinate system always specified in mm, with the origin `(0, 0, 0)` at the front left of the robot. The positive `x` direction is to the right, the positive `y` direction is to the back, and the positive `z` direction is up. 

You can identify a point in this coordinate system with a [`Location`][opentrons.types.Location] object, either as a standard Python [`tuple`](https://docs.python.org/3/library/stdtypes.html#tuple) of three floats, or as an instance of the [`namedtuple`](https://docs.python.org/3/library/collections.html#collections.namedtuple) [`Point`][opentrons.types.Point].

!!! note
    There are technically multiple vertical axes. For example, `z` is the axis of the left pipette mount and `a` is the axis of the right pipette mount. There are also pipette plunger axes: `b` (left) and `c` (right). You usually don't have to refer to these axes directly, since most motion commands are issued to a particular pipette and the robot automatically selects the correct axis to move. Similarly, [`Location`][opentrons.types.Location] only deals with `x`, `y`, and `z` values. 

## Independent movement

For convenience, many methods have location arguments and incorporate movement automatically. This section will focus on moving the pipette independently, without performing other actions like `aspirate()` or `dispense()`.

### Move to

The [`InstrumentContext.move_to()`][opentrons.protocol_api.InstrumentContext.move_to] method moves a pipette to any reachable location on the deck. If the pipette has picked up a tip, it will move the end of the tip to that position; if it hasn't, it will move the pipette nozzle to that position.

The `move_to()` method requires the `location` argument. The location can be automatically generated by methods like `Well.top()`, `Well.bottom()`, and `Well.meniscus()`, or one you've created yourself. However, you can't move a pipette to a well directly:

<!-- test: raises -->
```python
pipette.move_to(plate["A1"])              # error; can't move to a well itself
pipette.move_to(plate["A1"].bottom())     # move to the bottom of well A1
pipette.move_to(plate["A1"].top())        # move to the top of well A1
pipette.move_to(plate["A1"].bottom(z=2))  # move to 2 mm above the bottom of well A1
pipette.move_to(plate["A1"].top(z=-2))    # move to 2 mm below the top of well A1
```

When using `move_to()`, by default the pipette will move in an arc: first upwards, then laterally to a position above the target location, and finally downwards to the target location. If you have a reason for doing so, you can force the pipette to move in a straight line to the target location:

```python
pipette.move_to(plate["A1"].top(), force_direct=True)
```

!!! warning
    Moving without an arc runs the risk of the pipette colliding with objects on the deck. Be very careful when using this option, especially when moving longer distances.

Small, direct movements can be useful for working inside of a well, without having the tip exit and re-enter the well. This code sample demonstrates how to move the pipette to a well, make direct movements inside that well, and then move on to a different well:

```python
pipette.move_to(plate["A1"].top())
pipette.move_to(plate["A1"].bottom(1), force_direct=True)
pipette.move_to(plate["A1"].top(-2), force_direct=True)
pipette.move_to(plate["A2"].top())
```

*New in version 2.0*

### Points and locations

When instructing the robot to move, it's important to consider the difference between the [`Point`][opentrons.types.Point] and [`Location`][opentrons.types.Location] types.

- Points are ordered tuples or named tuples: `Point(10, 20, 30)`, `Point(x=10, y=20, z=30)`, and `Point(z=30, y=20, x=10)` are all equivalent.
- Locations are a higher-order tuple that combines a point with a reference object: a well, a piece of labware, or `None` (the deck).

This distinction is important for the [`Location.move()`][opentrons.types.Location.move] method, which operates on a location, takes a point as an argument, and outputs an updated location. To use this method, include `from opentrons import types` at the start of your protocol. The `move()` method does not mutate the location it is called on, so to perform an action at the updated location, use it as an argument of another method or save it to a variable. For example:

```python
from opentrons import types

# get the location at the center of well A1
center_location = plate["A1"].center()

# get a location 1 mm right, 1 mm back, and 1 mm up from the center of well A1
adjusted_location = center_location.move(types.Point(x=1, y=1, z=1))

# aspirate 1 mm right, 1 mm back, and 1 mm up from the center of well A1
pipette.aspirate(50, adjusted_location)

# dispense at the same location
pipette.dispense(50, center_location.move(types.Point(x=1, y=1, z=1)))
```

!!! note
    The additional `z` arguments of the `top()` and `bottom()` methods (see [Position Relative to Labware][position-relative-to-labware] above) are shorthand for adjusting the top and bottom locations with `move()`. You still need to use `move()` to adjust these positions along the x- or y-axis:
    
    <!-- test: continue-previous -->
    ```python
    # the following are equivalent
    pipette.move_to(plate["A1"].bottom(z=2))
    pipette.move_to(plate["A1"].bottom().move(types.Point(z=2)))
    
    # adjust along the y-axis
    pipette.move_to(plate["A1"].bottom().move(types.Point(y=2)))
    ```

*New in version 2.0*

## Movement speeds

In addition to instructing the robot where to move a pipette, you can also control the speed at which it moves. Speed controls can be applied either to all pipette motions or to movement along a particular axis.

!!! note
    Like all mechanical systems, Opentrons robots have resonant frequencies that depend on their construction and current configuration. It's possible to set a speed that causes your robot to resonate, producing louder sounds than typical operation. This is safe, but if you find it annoying, increase or decrease the speed slightly.

### Gantry speed

The robot's gantry usually moves as fast as it can given its construction. The default speed for Flex varies between 300 and 350 mm/s. The OT-2 default is 400 mm/s. However, some experiments or liquids may require slower movements. In this case, you can reduce the gantry speed for a specific pipette by setting [`InstrumentContext.default_speed`][opentrons.protocol_api.InstrumentContext.default_speed] like this:

```python
pipette.move_to(plate["A1"].top())  # move to the first well at default speed
pipette.default_speed = 100         # reduce pipette speed
pipette.move_to(plate["D6"].top())  # move to the last well at the slower speed
```

!!! warning
    These default speeds were chosen because they're the maximum speeds that Opentrons knows will work with the gantry. Your robot may be able to move faster, but you shouldn't increase this value unless instructed by Opentrons Support.

*New in version 2.0*
