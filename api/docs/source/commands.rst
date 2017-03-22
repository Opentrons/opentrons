.. _commands:

#################
Basic Commands
#################


This is the fun section, where we get to move things around and pipette! This section describes how to interact with your containers' wells, the ``Pipette``’s liquid-handling commands, as well as how to move the ``robot``.

**********************

***********
Well Access
***********

We spend a fair amount of time organizing and counting wells when writing Python protocols. This section describes the different ways we can access wells and groups of wells.

.. testsetup:: individualwells

    from opentrons import containers, robot

    robot.reset()
    plate = containers.load('96-flat', 'A1')

**********************

Individual Wells
================

When writing a protocol using the API, you will be spending most of your time selecting which wells to transfer liquids to and from.

The OT-One deck and containers are all set up with the same coordinate system - numbered rows and lettered columns.

.. image:: img/well_iteration/Well_Iteration.png

.. testcode:: individualwells
    
    '''
    Examples in this section expect the following
    '''
    from opentrons import containers

    plate = containers.load('96-flat', 'A1')

Wells by Name
-------------

Once a container is loaded into your protocol, you can easily access the many wells within it using ``wells()`` method. ``wells()`` takes the name of the well as an argument, and will return the well at that location.

.. testcode:: individualwells

    plate.wells('A1')
    plate.wells('H12')

Wells by Index
--------------

Wells can be referenced by their "string" name, as demonstrated above. However, they can also be referenced with zero-indexing, with the first well in a container being at position 0.

.. testcode:: individualwells

    plate.wells(0)   # well A1
    plate.wells(95)  # well H12
    plate.wells(-1)  # well H12 (Python let's you do this)

Columns and Rows
----------------

A container's wells are organized within a series of columns and rows, which are also labelled on standard labware. In the API, columns are given letter names (``'A'`` through ``'H'`` for example) and go left to right, while rows are given numbered names (``'1'`` through ``'8'`` for example) and go from front to back.
You can access a specific row or column by using the ``rows()`` and ``cols()`` methods on a container. These will return all wells within that row or column.

.. testcode:: individualwells

    column = plate.cols('A')
    row = plate.rows('1')

    print('Column "A" has', len(column), 'wells')
    print('Row "1" has', len(row), 'wells')

will print out...

.. testoutput:: individualwells
    :options: -ELLIPSIS, +NORMALIZE_WHITESPACE

    Column "A" has 12 wells
    Row "1" has 8 wells

The ``rows()`` or ``cols()`` methods can be used in combination with the ``wells()`` method to access wells within that row or column. In the example below, both lines refer to well ``'A1'``.

.. testcode:: individualwells

    plate.cols('A').wells('1')
    plate.rows('1').wells('A')

**********************

.. testsetup:: multiwells

    from opentrons import containers, robot

    robot.reset()
    plate = containers.load('96-flat', 'A1')


Multiple Wells
==============

If we had to reference each well one at a time, our protocols could get very very long.

When describing a liquid transfer, we can point to groups of wells for the liquid's source and/or destination. Or, we can get a group of wells that we want to loop through.

.. testcode:: multiwells
    
    '''
    Examples in this section expect the following
    '''
    from opentrons import containers

    plate = containers.load('96-flat', 'B1')

Wells
-----

The ``wells()`` method can return a single well, or it can return a list of wells when multiple arguments are passed.

Here is an example or accessing a list of wells, each specified by name:

.. testcode:: multiwells

    w = plate.wells('A1', 'B2', 'C3', 'H12')

    print(w)

will print out...

.. testoutput:: multiwells
    :options: -ELLIPSIS, +NORMALIZE_WHITESPACE

    <WellSeries: <Well A1><Well B2><Well C3><Well H12>>

Multiple wells can be treated just like a normal Python list, and can be iterated through:

.. testcode:: multiwells

    for w in plate.wells('A1', 'B2', 'C3', 'H12'):
        print(w)

will print out...

.. testoutput:: multiwells
    :options: -ELLIPSIS, +NORMALIZE_WHITESPACE

    <Well A1>
    <Well B2>
    <Well C3>
    <Well H12>

Wells To
--------

Instead of having to list the name of every well, we can also create a range of wells with a start and end point. The first argument is the starting well, and the ``to=`` argument is the last well.

.. testcode:: multiwells
    
    for w in plate.wells('A1', to='H1'):
        print(w)

will print out...

.. testoutput:: multiwells
    :options: -ELLIPSIS, +NORMALIZE_WHITESPACE

    <Well A1>
    <Well B1>
    <Well C1>
    <Well D1>
    <Well E1>
    <Well F1>
    <Well G1>
    <Well H1>

Not only can we get every well between the start and end positions, but we can also set the ``step=`` size. The example below will access every 2nd well between ``'A1'`` and ``'H'``:

.. testcode:: multiwells
    
    for w in plate.wells('A1', to='H1', step=2):
        print(w)

will print out...

.. testoutput:: multiwells
    :options: -ELLIPSIS, +NORMALIZE_WHITESPACE

    <Well A1>
    <Well C1>
    <Well E1>
    <Well G1>

These lists of wells can also move in the reverse direction along your container. For example, setting the ``to=`` argument to a well that comes before the starting position is allowed:

.. testcode:: multiwells
    
    for w in plate.wells('H1', to='A1', step=2):
        print(w)

will print out...

.. testoutput:: multiwells
    :options: -ELLIPSIS, +NORMALIZE_WHITESPACE

    <Well H1>
    <Well F1>
    <Well D1>
    <Well B1>

Wells Length
------------

Another way you can create a list of wells is by specifying the length= of the well list you need, in addition to the starting point. The example below will return eight wells, starting at well ``'A1'``:

.. testcode:: multiwells
    
    for w in plate.wells('A1', length=8):
        print(w)

will print out...

.. testoutput:: multiwells
    :options: -ELLIPSIS, +NORMALIZE_WHITESPACE

    <Well A1>
    <Well B1>
    <Well C1>
    <Well D1>
    <Well E1>
    <Well F1>
    <Well G1>
    <Well H1>

And just like before, we can also set the ``step=`` argument. Except this time the example will be accessing every 3rd well, until a total of eight wells have been found:

.. testcode:: multiwells
    
    for w in plate.wells('A1', length=8, step=3):
        print(w)

will print out...

.. testoutput:: multiwells
    :options: -ELLIPSIS, +NORMALIZE_WHITESPACE

    <Well A1>
    <Well D1>
    <Well G1>
    <Well B2>
    <Well E2>
    <Well H2>
    <Well C3>
    <Well F3>

You can set the step= value to a negative number to move in the reverse direction along the container:

.. testcode:: multiwells
    
    for w in plate.wells('H11', length=8, step=-1):
        print(w)

will print out...

.. testoutput:: multiwells
    :options: -ELLIPSIS, +NORMALIZE_WHITESPACE

    <Well H11>
    <Well G11>
    <Well F11>
    <Well E11>
    <Well D11>
    <Well C11>
    <Well B11>
    <Well A11>

Columns and Rows
----------------

Columns and Rows
The same arguments described above can be used with ``rows()`` and ``cols()`` to create lists of rows or columns.

Here is an example of iterating through rows:

.. testcode:: multiwells

    for r in plate.rows('2', length=3, step=-2):
        print(r)

will print out...

.. testoutput:: multiwells
    :options: -ELLIPSIS, +NORMALIZE_WHITESPACE

    <WellSeries: <Well A2><Well B2><Well C2><Well D2><Well E2><Well F2><Well G2><Well H2>>
    <WellSeries: <Well A12><Well B12><Well C12><Well D12><Well E12><Well F12><Well G12><Well H12>>
    <WellSeries: <Well A10><Well B10><Well C10><Well D10><Well E10><Well F10><Well G10><Well H10>>

And here is an example of iterating through columns:

.. testcode:: multiwells

    for c in plate.cols('B', to='F', step=2):
        print(c)

will print out...

.. testoutput:: multiwells
    :options: -ELLIPSIS, +NORMALIZE_WHITESPACE

    <WellSeries: <Well B1><Well B2><Well B3><Well B4><Well B5><Well B6><Well B7><Well B8><Well B9><Well B10><Well B11><Well B12>>
    <WellSeries: <Well D1><Well D2><Well D3><Well D4><Well D5><Well D6><Well D7><Well D8><Well D9><Well D10><Well D11><Well D12>>
    <WellSeries: <Well F1><Well F2><Well F3><Well F4><Well F5><Well F6><Well F7><Well F8><Well F9><Well F10><Well F11><Well F12>>


Slices
------

Containers can also be treating similarly to Python lists, and can therefore handle slices.

.. testcode:: multiwells

    for w in plate[0:8:2]:
        print(w)

will print out...

.. testoutput:: multiwells
    :options: -ELLIPSIS, +NORMALIZE_WHITESPACE

    <Well A1>
    <Well C1>
    <Well E1>
    <Well G1>

The API's containers are also prepared to take string values for the slice's ``start`` and ``stop`` positions.

.. testcode:: multiwells

    for w in plate['A1':'A2':2]:
        print(w)

will print out...

.. testoutput:: multiwells
    :options: -ELLIPSIS, +NORMALIZE_WHITESPACE

    <Well A1>
    <Well C1>
    <Well E1>
    <Well G1>

.. testcode:: multiwells

    for w in plate.cols['B']['1'::2]:
        print(w)

will print out...

.. testoutput:: multiwells
    :options: -ELLIPSIS, +NORMALIZE_WHITESPACE

    <Well B1>
    <Well B3>
    <Well B5>
    <Well B7>
    <Well B9>
    <Well B11>

**********************

**************
Tip Handling
**************

When we handle liquids with a pipette, we are constantly exchanging old, used tips for new ones to prevent cross-contamination between our wells. To help with this constant need, we describe in this section a few methods for getting new tips, and removing tips from a pipette.

**********************

.. testsetup:: tips

    from opentrons import containers, instruments, robot

    robot.reset()

    trash = containers.load('point', 'D2')
    tiprack = containers.load('tiprack-200ul', 'B1')

    pipette = instruments.Pipette(axis='a')

Tips Basics
===========

This section demonstrates the options available for controlling tips

.. testcode:: tips
    
    '''
    Examples in this section expect the following
    '''
    from opentrons import containers, instruments

    trash = containers.load('point', 'D2')
    tiprack = containers.load('tiprack-200ul', 'B1')

    pipette = instruments.Pipette(axis='a')

Pick Up Tip
-----------

Before any liquid handling can be done, your pipette must have a tip on it. The command ``pick_up_tip()`` will move the pipette over to the specified tip, the press down into it to create a vacuum seal. The below example picks up the tip at location ``'A1'``.

.. testcode:: tips

    pipette.pick_up_tip(tiprack.wells('A1'))

Drop Tip
--------

Once finished with a tip, the pipette will autonomously remove the tip when we call ``drop_tip()``. We can specify where to drop the tip by passing in a location. The below example drops the tip back at its originating location on the tip rack.

.. testcode:: tips

    pipette.drop_tip(tiprack.wells('A1'))

Instead of returning a tip to the tip rack, we can also drop it in a trash container.

.. testcode:: tips

    pipette.pick_up_tip(tiprack.wells('A2'))
    pipette.drop_tip(trash)

Return Tip
----------

When we need to return the tip to its originating location on the tip rack, we can simply call ``return_tip()``. The example below will automatically return the tip to ``'A3'`` on the tip rack.

.. testcode:: tips

    pipette.pick_up_tip(tiprack.wells('A3'))
    pipette.return_tip()

**********************

.. testsetup:: tipsiterating

    from opentrons import containers, instruments, robot

    robot.reset()

    trash = containers.load('point', 'D2')
    tip_rack_1 = containers.load('tiprack-200ul', 'B1')
    tip_rack_2 = containers.load('tiprack-200ul', 'B2')

    pipette = instruments.Pipette(
        axis='b',
        tip_racks=[tip_rack_1, tip_rack_2],
        trash_container=trash
    )

Tips Iterating
==============

Automatically iterate through tips and drop tip in trash by attaching containers to a pipette

.. testcode:: tipsiterating
    
    '''
    Examples in this section expect the following
    '''
    from opentrons import containers, instruments

    trash = containers.load('point', 'D2')
    tip_rack_1 = containers.load('tiprack-200ul', 'B1')
    tip_rack_2 = containers.load('tiprack-200ul', 'B2')

Attach Tip Rack to Pipette
--------------------------

Tip racks and trash containers can be "attached" to a pipette when the pipette is created. This give the pipette the ability to automatically iterate through tips, and to automatically send the tip to the trash container.

Trash containers can be attached with the option ``trash_container=TRASH_CONTAINER``.

Multiple tip racks are can be attached with the option ``tip_racks=[RACK_1, RACK_2, etc... ]``.

.. testcode:: tipsiterating

    pipette = instruments.Pipette(
        axis='b',
        tip_racks=[tip_rack_1, tip_rack_2],
        trash_container=trash
    )

.. note::

    The ``tip_racks=`` option expects us to give it a Python list, containing each tip rack we want to attach. If we are only attaching one tip rack, then the list will have a length of one, like the following:

    ``tip_racks=[tiprack]``


Iterating Through Tips
----------------------

Now that we have two tip racks attached to the pipette, we can automatically step through each tip whenever we call ``pick_up_tip()``. We then have the option to either ``return_tip()`` to the tip rack, or we can ``drop_tip()`` to remove the tip in the attached trash container.

.. testcode:: tipsiterating

    pipette.pick_up_tip()  # picks up tip_rack_1:A1
    pipette.return_tip()
    pipette.pick_up_tip()  # picks up tip_rack_1:A2
    pipette.drop_tip()     # automatically drops in trash

    # use loop to pick up tips tip_rack_1:A3 through tip_rack_2:H12
    for i in range(94 + 96):
        pipette.pick_up_tip()
        pipette.return_tip()

If we try to ``pick_up_tip()`` again when all the tips have been used, the Opentrons API will show you an error.

.. note::

    If you run the cell above, and then uncomment and run the cell below, you will get an error because the pipette is out of tips.

.. testcode:: tipsiterating

    # this will raise an exception if run after the previous code block
    # pipette.pick_up_tip()


Select Starting Tip
-------------------

Calls to ``pick_up_tip()`` will by default start at the attached tip rack's ``'A1'`` location. If you however want to start automatic tip iterating at a different tip, you can use ``start_at_tip()``.

.. testcode:: tipsiterating

    pipette.reset()

    pipette.start_at_tip(tip_rack_1['C3'])
    pipette.pick_up_tip()  # pick up C3 from "tip_rack_1"
    pipette.return_tip()

Get Current Tip
---------------

Get the source location of the pipette's current tip by calling ``current_tip()``. If the tip was from the ``'A1'`` position on our tip rack, ``current_tip()`` will return that position.

.. testcode:: tipsiterating

    print(pipette.current_tip())  # is holding no tip

    pipette.pick_up_tip()
    print(pipette.current_tip())  # is holding the next available tip

    pipette.return_tip()
    print(pipette.current_tip())  # is holding no tip

will print out...

.. testoutput:: tipsiterating

    None
    <Well D3>
    None

**********************

****************
Liquid Control
****************

This is the fun section, where we get to move things around and pipette! This section describes the ``Pipette`` object's many liquid-handling commands, as well as how to move the ``robot``.

**********************

.. testsetup:: liquid

    from opentrons import containers, instruments, robot

    robot.reset()

    plate = containers.load('96-flat', 'B1')
    pipette = instruments.Pipette(axis='b', max_volume=200)

.. testcode:: liquid
    
    '''
    Examples in this section expect the following
    '''
    from opentrons import containers, instruments

    plate = containers.load('96-flat', 'B1')
    pipette = instruments.Pipette(axis='b', max_volume=200)


Aspirate
========

To aspirate is to pull liquid up into the pipette's tip. When calling aspirate on a pipette, we can specify how many micoliters, and at which location, to draw liquid from:

.. testcode:: liquid

    pipette.aspirate(50, plate.wells('A1'))  # aspirate 50uL from plate:A1

Now our pipette's tip is holding 50uL.

We can also simply specify how many microliters to aspirate, and not mention a location. The pipette in this circumstance will aspirate from it's current location (which we previously set as ``plate.wells('A1'))``.

.. testcode:: liquid

    pipette.aspirate(50)                     # aspirate 50uL from current position

Now our pipette's tip is holding 100uL.

We can also specify only the location to aspirate from. If we do not tell the pipette how many micoliters to aspirate, it will by default fill up the remaining volume in it's tip. In this example, since we already have 100uL in the tip, the pipette will aspirate another 100uL

.. testcode:: liquid

    pipette.aspirate(plate.wells('A2'))      # aspirate until pipette fills from plate:A2


Dispense
========

To dispense is to push out liquid from the pipette's tip. It's usage in the Opentrons API is nearly identical to ``aspirate()``, in that you can specify microliters and location, only microliters, or only a location:

.. testcode:: liquid

    pipette.dispense(50, plate.wells('B1')) # dispense 50uL to plate:B1
    pipette.dispense(50)                    # dispense 50uL to current position
    pipette.dispense(plate.wells('B2'))     # dispense until pipette empties to plate:B2

That final dispense without specifying a micoliter amount will dispense all remaining liquids in the tip to ``plate.wells('B2')``, and now our pipette is empty.

Blow Out
========

To blow out is to push an extra amount of air through the pipette's tip, so as to make sure that any remaining droplets are expelled.

When calling ``blow_out()`` on a pipette, we have the option to specify a location to blow out the remaining liquid. If no location is specified, the pipette will blow out from it's current position.

.. testcode:: liquid

    pipette.blow_out()                  # blow out over current location
    pipette.blow_out(plate.wells('B3')) # blow out over current plate:B3


Touch Tip
=========

To touch tip is to move the pipette's currently attached tip to the edges of a well, for the purpose of knocking off any droplets that might be hanging from the tip.

When calling ``touch_tip()`` on a pipette, we have the option to specify a location where the tip will touch the inner walls. If no location is specified, the pipette will touch tip inside it's current location.

.. testcode:: liquid

    pipette.touch_tip()                  # touch tip within current location
    pipette.touch_tip(-2)                # touch tip 2mm below the top of the current location
    pipette.touch_tip(plate.wells('B1')) # touch tip within plate:B1


Mix
===

Mixing is simply performing a series of ``aspirate()`` and ``dispense()`` commands in a row on a single location. However, instead of having to write those commands out every time, the Opentrons API allows you to simply say ``mix()``.

The mix command takes three arguments: ``mix(repetitions, volume, location)``

.. testcode:: liquid

    pipette.mix(4, 100, plate.wells('A2'))   # mix 4 times, 100uL, in plate:A2
    pipette.mix(3, 50)                       # mix 3 times, 50uL, in current location
    pipette.mix(2)                           # mix 2 times, pipette's max volume, in current location


Air Gap
=======

Some liquids need an extra amount of air in the pipette's tip to prevent it from sliding out. A call to ``air_gap()`` with a microliter amount will aspirate that much air into the tip.

.. testcode:: liquid

    pipette.aspirate(100, plate.wells('B4'))
    pipette.air_gap(20)

**********************

.. testsetup:: moving

    from opentrons import robot, containers, instruments

    robot.reset()

    tiprack = containers.load('tiprack-200ul', 'A1')
    plate = containers.load('96-flat', 'B1')

    pipette = instruments.Pipette(axis='b')

******
Moving
******

Demonstrates the different ways to control the movement of the Opentrons liquid handler during a protocol run.

.. testcode:: moving
    
    '''
    Examples in this section expect the following
    '''
    from opentrons import containers, instruments, robot

    tiprack = containers.load('tiprack-200ul', 'A1')
    plate = containers.load('96-flat', 'B1')

    pipette = instruments.Pipette(axis='b')


Head Speed
==========

The maximum speed of the robot's head can be set using ``robot.head_speed()``. The value we set the speed to is in millimeters-per-second (mm/sec).

.. testcode:: moving

    robot.head_speed(5000)

.. note::

    Setting the head speed to above ``6000 mm/sec`` may cause your robot to "skip", which means the motors will lose their grip and make a loud vibrating noise. We recommend you try out different speed values on your robot, and see what works and what doesn't.

Move To
=======

Pipette's are able to ``move_to()`` any location on the deck. Any call to ``move_to()`` will be enqueued, meaning that it will not execute until calling ``robot.run()``.

For example, we can enqueue a movement to the first tip in our tip rack:

.. testcode:: moving

    pipette.move_to(tiprack.wells('A1'))

You can also specify at what height you would like the robot to move to inside of a location using ``top()`` and ``bottom()`` methods on that location.

.. testcode:: moving

    pipette.move_to(plate.wells('A1').bottom())  # move to the bottom of well A1
    pipette.move_to(plate.wells('A1').top())     # move to the top of well A1
    pipette.move_to(plate.wells('A1').bottom(2)) # move to 2mm above the bottom of well A1
    pipette.move_to(plate.wells('A1').top(-2))   # move to 2mm below the top of well A1

The above commands will cause the robot's head to first move upwards, then over to above the target location, then finally downwards until the target location is reached. If instead you would like the robot to mive in a straight line to the target location, you can set the movement strategy to ``'direct'``.

.. testcode:: moving

    pipette.move_to(plate.wells('A1'), strategy='direct')

.. note::
    
    Moving with ``strategy='direct'`` will run the risk of colliding with things on your deck. Be very careful when using the option.

Usually the ``strategy='direct'`` option is useful when moving inside of a well. Take a look at the below sequence of movements, which first move the head to a well, and use 'direct' movements inside that well, then finally move on to a different well.

.. testcode:: moving

    pipette.move_to(plate.wells('A1'))
    pipette.move_to(plate.wells('A1').bottom(1), strategy='direct')
    pipette.move_to(plate.wells('A1').top(-2), strategy='direct')
    pipette.move_to(plate.wells('A1'))

Delay
=====

To have your protocol pause for any given number of minutes or seconds, simply call ``delay()`` on your pipette. The value passed into ``delay()`` is the number of minutes or seconds the robot will wait until moving on to the next commands.

.. testcode:: moving

    pipette.delay(seconds=2)             # pause for 2 seconds
    pipette.delay(minutes=5)             # pause for 5 minutes
    pipette.delay(minutes=5, seconds=2)  # pause for 5 minutes and 2 seconds

Homing
======

You can enqueue a ``home()`` command to your protocol, by giving it the ``enqueue=True`` option. Without passing the enqueue option, the home command will run immediately.

.. testcode:: moving

    pipette.move_to(plate.wells('A1')) # move to well A1
    robot.home(enqueue=True)           # home the robot on all axis
    pipette.move_to(plate.wells('B1')) # move to well B1
    robot.home('z', enqueue=True)      # home the Z axis only

