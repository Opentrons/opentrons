:og:description: Basic commands for working with robot utility features.

.. _new-utility-commands:

****************
Utility Commands
****************

With utility commands, you can control various robot functions such as pausing or delaying a protocol, checking the robot's door, turning robot lights on/off, and more. The following sections show you how to these utility commands and include sample code. The examples used here assume that you’ve loaded the pipettes and labware from the basic :ref:`protocol template <protocol-template>`.

Delay and Resume
================

Call the :py:meth:`.ProtocolContext.delay` method to insert a timed delay into your protocol. This method accepts time increments in seconds, minutes, or combinations of both. Your protocol resumes automatically after the specified time expires.

This example delays a protocol for 10 seconds::

    protocol.delay(seconds=10)

This example delays a protocol for 5 minutes::

    protocol.delay(minutes=5)

This example delays a protocol for 5 minutes and 10 seconds::

    protocol.delay(minutes=5, seconds=10)

Pause Until Resumed
===================

Call the :py:meth:`.ProtocolContext.pause` method to stop a protocol at a specific step. Unlike a delay, :py:meth:`~.ProtocolContext.pause` does not restart your protocol automatically. To resume, you'll respond to a prompt on the touchscreen or in the Opentrons App. This method also lets you specify an optional message that provides on-screen or in-app instructions on how to proceed. This example inserts a pause and includes a brief message::

    protocol.pause('Remember to get more pipette tips')

.. versionadded:: 2.0

Homing
======

Homing commands the robot to move the gantry, a pipette, or a pipette plunger to a defined position. For example, homing the gantry moves it to the back right of the working area. With the available homing methods you can home the gantry, home the mounted pipette and plunger, and home the pipette plunger. These functions take no arguments.

To home the gantry, call :py:meth:`.ProtocolContext.home`::

    protocol.home()

To home a specific pipette's Z axis and plunger, call :py:meth:`.InstrumentContext.home`::

    pipette = protocol.load_instrument('flex_1channel_1000', 'right')
    pipette.home()

To home a specific pipette's plunger only, you can call :py:meth:`.InstrumentContext.home_plunger`::

    pipette = protocol.load_instrument('flex_1channel_1000', 'right')
    pipette.home_plunger()

.. versionadded:: 2.0

Comment
=======

Call the :py:meth:`.ProtocolContext.comment` method if you want to write and display a brief message in the Opentrons App during a protocol run::

    protocol.comment('Hello, world!')

.. versionadded:: 2.0

Control and Monitor Robot Rail Lights
=====================================

Call the :py:meth:`.ProtocolContext.set_rail_lights` method to turn the robot's rail lights on or off during a protocol. This method accepts Boolean ``True`` (lights on) or ``False`` (lights off) arguments. Rail lights are off by default.

This example turns the rail lights on::

    protocol.set_rail_lights(True)


This example turns the rail lights off::

    protocol.set_rail_lights(False)

.. versionadded:: 2.5

You can also check whether the rail lights are on or off in the protocol by using :py:obj:`.ProtocolContext.rail_lights_on`. This method returns ``True`` when lights are on and ``False`` when the lights are off.

.. versionadded:: 2.5


OT-2 Door Safety Switch
=======================

Introduced with :ref:`robot software version <version-table>` 3.19, the safety switch feature prevents the OT-2, and your protocol, from running if the door is open. To operate properly, the front door and top window of your OT-2 must be closed. You can toggle the door safety switch on or off from **Robot Settings > Advanced > Usage Settings**.

To check if the robot's door is closed at a specific point during a protocol run, call :py:obj:`.ProtocolContext.door_closed`. It returns a Boolean ``True`` (door closed) or ``False`` (door open) response.

.. code-block:: python

    protocol.door_closed

.. warning::

    :py:obj:`~.ProtocolContext.door_closed` is a status check only. It does not control the robot's behavior. If you wish to implement a custom method to pause or resume a protocol using ``door_closed``, disable the door safety feature first (not recommended).

.. versionadded:: 2.5
