.. _modules:

################
Hardware Modules
################

This documentation and modules API is subject to change. Check here or on
our github for updated information.

This code is only valid on software version 3.3.0 or later.

Loading your Module onto a deck
===============================
Just like labware, you will also need to load in your module in order to use it
within a protocol. To do this, you call:

.. code-block:: python
    from opentrons import modules

    module = modules.load('Module Name', slot)


Above, `Module Name` represents either `tempdeck` or `magdeck`.

To add a labware onto a given module, you will need to use the `share=True` call-out

.. code-block:: python
   from opentrons import labware

   labware = labware.load('96-flat', slot, share=True)

Where slot is the same slot in which you loaded your module.

Detecting your Module on the robot
==================================
The Run App auto-detects and connects to modules that are plugged into the robot upon robot connection.
If you plug in a module with the app open and connected to your robot already, you can simply navigate to the
`Pipettes & Modules` in the Run App and hit the `refresh` icon.

If you are running a program outside of the app, you will need to initiate robot connection to the module. This can
be done like the following:
.. code-block:: python
    from opentrons import modules, robot

    robot.connect()
    for module in robot.modules:
            module.disconnect()
    robot.modules = modules.discover_and_connect()

    module = modules.load('Module Name', slot)
    ... etc

Checking the status of your Module
==================================
Both modules have the ability to check what state they are currently in. To do this run the following:
.. code-block:: python
    from opentrons import modules

    module = modules.load('Module Name', slot)
    status = module.status

For the temperature module this will return a string stating whether it's `heating`, `cooling`, `holding at target` or `idle`.
For the magnetic module this will return a string stating whether it's `engaged` or `disengaged`.

**********
Temperature Module
**********

Our temperature module acts as both a cooling and heating device. The range
of temperatures this module can reach goes from -9 to 99 degrees celsius with a resolution of 3 decimal places.


The temperature module has the following methods that can be accessed during a protocol.

Set Temperature
===============
To set the temperature module to a given temperature in degrees celsius do the following:

.. code-block:: python
    from opentrons import modules, labware

    module = modules.load('tempdeck', slot)
    plate = labware.load('96-flat', slot, share=True)

    module.set_temperature(4)

This will set your Temperature module to 4 degrees celsius.

Wait Until Setpoint Reached
==========================
This function will pause your protocol until your target temperature is reached.

.. code-block:: python
    from opentrons import modules, labware

    module = modules.load('tempdeck', slot)
    plate = labware.load('96-flat', slot, share=True)

    module.set_temperature(4)
    module.wait_for_temp()

Before using `wait_for_temp()` you must set a target temperature with `set_temperature()`.
Once the target temperature is set, when you want the protocol to wait until the module
reaches the target you can call `wait_for_temp().`

If no target temperature is set via `set_temperature()`, the protocol will be stuck in
an indefinite loop.

Read the Current Temperature
============================
You can read the current real-time temperature of the module by the following:
.. code-block:: python
    from opentrons import modules, labware

    module = modules.load('tempdeck', slot)
    plate = labware.load('96-flat', slot, share=True)

    temperature = module.temperature

This will return a float of the temperature in celsius.

Read the Target Temperature
===========================
We can read the target temperature of the module by the following:
.. code-block:: python
    from opentrons import modules, labware

    module = modules.load('tempdeck', slot)
    plate = labware.load('96-flat', slot, share=True)

    temperature = module.target
This will return a float of the temperature that the module is trying to reach.

Deactivate
==========
This function will stop heating or cooling and will turn off the fan on the module.
You would still be able to call `set_temperature()` function to initiate a heating
or cooling phase again.

.. code-block:: python
    from opentrons import modules, labware

    module = modules.load('tempdeck', slot)
    plate = labware.load('96-flat', slot, share=True)

    module.set_temperature(4)
    module.wait_for_temp()

    ## OTHER PROTOCOL ACTIONS

    module.deactivate()

** Note** You can also deactivate your temperature module through our Run App by
clicking on the `Pipettes & Modules` tab. Your temperature module will automatically
deactivate if another protocol is uploaded to the app. Your temperature module will
not deactivate automatically upon protocol end, cancel or re-setting a protocol.

**********
Magnetic Module
**********

The magnetic module has three actions:

- calibration: The magnetic stage probes for the bottom of the labware you placed on top
- engage: The magnetic stage rises to the calibrated height (flush with the bottom of the labware)
- disengage: The magnetic stage moves down to its home position

At the start of a protocol run within our Run App, the module is auto-calibrated so please
ensure that your module has the labware you will be utilizing on top of it before a run.

If you are running a program outside of our App you can use the calibration function below.

The magnetic module is currently compatible with normal PCR well plates.

In the future, we will have adapters to support tuberacks as well as deep well plates.

Calibrate
=========
.. code-block:: python
    from opentrons import modules, labware

    module = modules.load('magdeck', slot)
    plate = labware.load('96-flat', slot, share=True)

    module.calibrate()

Engage
======
.. code-block:: python
    from opentrons import modules, labware

    module = modules.load('magdeck', slot)
    plate = labware.load('96-flat', slot, share=True)

    module.engage()

Disengage
=========
.. code-block:: python
    from opentrons import modules, labware

    module = modules.load('magdeck', slot)
    plate = labware.load('96-flat', slot, share=True)

    module.engage()
    ## OTHER PROTOCOL ACTIONS
    module.disengage()

The magnetic modules will disengage on power cycle of the device. It will not auto-disengage otherwise
unless you specify in your protocol.