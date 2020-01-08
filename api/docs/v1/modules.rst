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
    robot.discover_modules()

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
of temperatures this module can reach goes from 4 to 95 degrees celsius with a resolution of 1 degree celcius.


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


** Note**
You can also deactivate your temperature module through our Run App by
clicking on the `Pipettes & Modules` tab. Your temperature module will automatically
deactivate if another protocol is uploaded to the app. Your temperature module will
not deactivate automatically upon protocol end, cancel or re-setting a protocol.

**********
Magnetic Module
**********

The magnetic module has two actions:

- engage: The magnetic stage rises to a default height unless an *offset* or a custom *height* is specified
- disengage: The magnetic stage moves down to its home position

The magnetic module api is currently fully compatible with the BioRad Hardshell 96-PCR (.2ml) well plates. The magnets will
default to an engaged height of about 4.3 mm from the bottom of the well (or 18mm from magdeck home position). This is
roughly 30% of the well depth. This engaged height has been tested for an elution volume of 40ul.

You can also specify a custom engage height for the magnets so you can use a different labware with the magdeck.
In the future, we will have adapters to support tuberacks as well as deep well plates.


Engage
======
.. code-block:: python

    from opentrons import modules, labware

    module = modules.load('magdeck', slot)
    plate = labware.load('biorad-hardshell-96-PCR', slot, share=True)

    module.engage()

If you deem that the default engage height is not ideal for your applications,
you can include an offset in mm for the magnet to move to. The engage function
will take in a value (positive or negative) to offset the magnets from the **default** position.

To move the magnets higher than the default position you would specify a positive mm offset such as:
``module.engage(offset=4)``

To move the magnets lower than the default position you would input a negative mm value such as:
``module.engage(offset=-4)``

You can also use a custom height parameter with engage():

.. code-block:: python

    from opentrons import modules, labware

    module = modules.load('magdeck', slot)
    plate = labware.load('96-deep-well', slot, share=True)

    module.engage(height=12)

The height should be specified in mm from the magdeck home position (i.e. the position of magnets when power-cycled or
disengaged)

You can also move the position of the magnets relative to the base of the labware that is loaded on the module:

.. code-block:: python

    module.engage(height_from_base=7)

The ``height_from_base`` should be specifed in mm from the bottom of the labware. A ``module.engage(height_from_base=0)``
should move the tops of the magnets to level with base of the labware.

.. note::

    There is a +/- 1 mmm variance across magnetic module units, using ``height_from_base=0`` might not be able to get the magnets to completely flush with base of the labware. Please test before carrying out your experiment to ensure the desired engage height for your labware.


.. note::
    `engage()` and `engage(offset=y)` can only be used for labware that have default heights defined in the api. If your
    labware doesn't yet have a default height definition and your protocol uses either of those methods then you will get
    an error. Simply use the height parameter to provide a custom height for you labware in such a case.

Disengage
=========
.. code-block:: python

    from opentrons import modules, labware

    module = modules.load('magdeck', slot)
    plate = labware.load('biorad-hardshell-96-PCR', slot, share=True)

    module.engage()
    ## OTHER PROTOCOL ACTIONS
    module.disengage()

The magnetic modules will disengage on power cycle of the device. It will not auto-disengage otherwise
unless you specify in your protocol.
