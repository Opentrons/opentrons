.. _pipettes:

===========
Pipettes
===========

This is the fun section, where we get to move things around and pipette! This section describes the ``Pipette`` object's many liquid-handling commands, as well as how to move the ``robot``.

.. toctree::
    :maxdepth: 3

    pipettes

**********************

.. testsetup:: liquid

    from opentrons import containers, instruments, robot

    robot.reset()

    plate = containers.load('96-flat', 'B1')
    pipette = instruments.Pipette(axis='b', max_volume=200)

Liquid Control
--------------

Demonstrates the usage for liquid-handling specific commands

.. testcode:: liquid
    
    '''
    Examples in this section expect the following
    '''
    from opentrons import containers, instruments

    plate = containers.load('96-flat', 'B1')
    pipette = instruments.Pipette(axis='b', max_volume=200)


Aspirate
^^^^^^^^

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
^^^^^^^^

To dispense is to push out liquid from the pipette's tip. It's usage in the Opentrons API is nearly identical to ``aspirate()``, in that you can specify microliters and location, only microliters, or only a location:

.. testcode:: liquid

    pipette.dispense(50, plate.wells('B1')) # dispense 50uL to plate:B1
    pipette.dispense(50)                    # dispense 50uL to current position
    pipette.dispense(plate.wells('B2'))     # dispense until pipette empties to plate:B2

That final dispense without specifying a micoliter amount will dispense all remaining liquids in the tip to ``plate.wells('B2')``, and now our pipette is empty.

Blow Out
^^^^^^^^

To blow out is to push an extra amount of air through the pipette's tip, so as to make sure that any remaining droplets are expelled.

When calling ``blow_out()`` on a pipette, we have the option to specify a location to blow out the remaining liquid. If no location is specified, the pipette will blow out from it's current position.

.. testcode:: liquid

    pipette.blow_out()                  # blow out over current location
    pipette.blow_out(plate.wells('B3')) # blow out over current plate:B3


Touch Tip
^^^^^^^^^

To touch tip is to move the pipette's currently attached tip to the edges of a well, for the purpose of knocking off any droplets that might be hanging from the tip.

When calling ``touch_tip()`` on a pipette, we have the option to specify a location where the tip will touch the inner walls. If no location is specified, the pipette will touch tip inside it's current location.

.. testcode:: liquid

    pipette.touch_tip()                  # touch tip within current location
    pipette.touch_tip(-2)                # touch tip 2mm below the top of the current location
    pipette.touch_tip(plate.wells('B1')) # touch tip within plate:B1


Mix
^^^

Mixing is simply performing a series of ``aspirate()`` and ``dispense()`` commands in a row on a single location. However, instead of having to write those commands out every time, the Opentrons API allows you to simply say ``mix()``.

The mix command takes three arguments: ``mix(repetitions, volume, location)``

.. testcode:: liquid

    pipette.mix(4, 100, plate.wells('A2'))   # mix 4 times, 100uL, in plate:A2
    pipette.mix(3, 50)                       # mix 3 times, 50uL, in current location
    pipette.mix(2)                           # mix 2 times, pipette's max volume, in current location


Air Gap
^^^^^^^

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

Moving
------

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
^^^^^^^^^^

The maximum speed of the robot's head can be set using ``robot.head_speed()``. The value we set the speed to is in millimeters-per-second (mm/sec).

.. testcode:: moving

    robot.head_speed(5000)

.. note::

    Setting the head speed to above ``6000 mm/sec`` may cause your robot to "skip", which means the motors will lose their grip and make a loud vibrating noise. We recommend you try out different speed values on your robot, and see what works and what doesn't.

Move To
^^^^^^^

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
^^^^^

To have your protocol pause for any given number of minutes or seconds, simply call ``delay()`` on your pipette. The value passed into ``delay()`` is the number of minutes or seconds the robot will wait until moving on to the next commands.

.. testcode:: moving

    pipette.delay(seconds=2)             # pause for 2 seconds
    pipette.delay(minutes=5)             # pause for 5 minutes
    pipette.delay(minutes=5, seconds=2)  # pause for 5 minutes and 2 seconds

Homing
^^^^^^

You can enqueue a ``home()`` command to your protocol, by giving it the ``enqueue=True`` option. Without passing the enqueue option, the home command will run immediately.

.. testcode:: moving

    pipette.move_to(plate.wells('A1')) # move to well A1
    robot.home(enqueue=True)           # home the robot on all axis
    pipette.move_to(plate.wells('B1')) # move to well B1
    robot.home('z', enqueue=True)      # home the Z axis only
