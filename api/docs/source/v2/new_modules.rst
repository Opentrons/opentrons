.. _new_modules:

################
Hardware Modules
################

Hardware modules are peripherals that attach to the OT-2 to extend its capabilities.

The modules currently supported are Temperature, Magnetic and Thermocycler Module.

This is not an exhaustive list of functionality for modules. Check :ref:`protocol-api-modules` or on
our github ('link to public repo') for the most up to date methods.


Loading your Module onto a deck
===============================
Just like labware, you will also need to load in your module in order to use it
within a protocol. To do this,  call the following *inside* the run function:

.. code-block:: python

    from opentrons import protocol_api

    def run(protocol: protocol_api.ProtocolContext):
         module = protocol.load_module('Module Name', slot)


You can reference your module in a few different ways. The valid names can be found below. They are not case-sensitive.

+--------------------------+-----------------------------------------------+
|        Module Name       |               Nickname(s)                     |
+==========================+===============================================+
| ``Temperature Module``   | ``'Temperature Module'``, ``'tempdeck'``      |
+--------------------------+-----------------------------------------------+
| ``Magnetic Module``      | ``'Magnetic Module'``, ``'magdeck'``          |
+--------------------------+-----------------------------------------------+
| ``Thermocycler Module``  | ``'Thermocycler Module'``, ``'thermocycler'`` |
+--------------------------+-----------------------------------------------+

Loading Labware onto your Module
================================
If you want to interact with labware on top of your Module, you must load labware
onto the module. You can do this via:

.. code-block:: python

    from opentrons import protocol_api

    def run(protocol: protocol_api.ProtocolContext):
         module = protocol.load_module('Module Name', slot)
         my_labware = module.load_labware('labware_definition_name')

Where ``module`` is the variable name you saved your module to. You do not need to specify the slot.

Status of your Module
=====================
All modules have the ability to check what state they are currently in. To do this run the following:

.. code-block:: python

    from opentrons import protocol_api

    def run(protocol: protocol_api.ProtocolContext):
         module = protocol.load_module('Module Name', slot)
         status = module.status

For the temperature module this will return a string stating ``'heating'``, ``'cooling'``, ``'holding at target'`` or ``'idle'``.
For the magnetic module this will return a string stating ``'engaged'`` or ``'disengaged'``.
For the thermocycler module this will return ``'holding at target'`` or ``'idle'``. 

There are more detailed status checks which can be found in at :ref:`thermocycler-section`

******************
Temperature Module
******************

Our temperature module acts as both a cooling and heating device. The range
of temperatures this module can reach goes from 4 to 95 degrees celsius with a resolution of 1 degree celcius.

The temperature module has the following methods that can be accessed during a protocol. For the purposes of this
section, assume the following already:

.. code-block:: python

    from opentrons import protocol_api

    def run(protocol: protocol_api.ProtocolContext):
        temp_mod = protocol.load_module('temperature module', '1')
        plate = temp_mod.load_labware('corning_96_wellplate_360ul_flat')
        # The code from the rest of the examples in this section goes here

Set Temperature
^^^^^^^^^^^^^^^
To set the temperature module to 4 degrees celsius do the following:

.. code-block:: python

    temp_mod.set_temperature(4)

Wait Until Setpoint Reached
^^^^^^^^^^^^^^^^^^^^^^^^^^^
This function will pause your protocol until your target temperature is reached.

.. code-block:: python

    temp_mod.set_temperature(4) # set temperature to 4 degrees celsius
    temp_mod.wait_for_temp() # protocol will wait until module reaches target temperature above

If no target temperature is set via ``set_temperature()``, the protocol will be stuck in
an indefinite hold loop.

Read the Current Temperature
^^^^^^^^^^^^^^^^^^^^^^^^^^^^
You can read the current real-time temperature of the module by the following:

.. code-block:: python

    temp_mod.temperature

Read the Target Temperature
^^^^^^^^^^^^^^^^^^^^^^^^^^^
We can read the target temperature of the module by the following:

.. code-block:: python

    temp_mod.target

Deactivate
^^^^^^^^^^
This function will stop heating or cooling and will turn off the fan on the module.
You would still be able to call ``set_temperature()`` function to initiate a heating
or cooling phase again.

.. code-block:: python

    temp_mod.deactivate()

** Note**
You can also deactivate your temperature module through our Run App by
clicking on the ``Pipettes & Modules`` tab. Your temperature module will automatically
deactivate if another protocol is uploaded to the app. Your temperature module will
not deactivate automatically upon protocol end, cancel or re-setting a protocol.


***************
Magnetic Module
***************

The magnetic module has two modes:

- ``engage``: The magnetic stage rises to a default height unless an *offset* or a custom *height* is specified
- ``disengage``: The magnetic stage moves down to its home position

You can also specify a custom engage height for the magnets so you can use a different labware with the magdeck.

The magnetic module has the following methods that can be accessed during a protocol. For the purposes of this
section, assume we have the following already:

.. code-block:: python

    from opentrons import protocol_api

    def run(protocol: protocol_api.ProtocolContext):
        mag_mod = protocol.load_module('magnetic module', '1')
        plate = mag_mod.load_labware('nest_96_wellplate_100ul_pcr_full_skirt')
        # The code from the rest of the examples in this section goes here

Engage
^^^^^^

The destination of the magnets can be specified in several different
ways, based on internally stored default heights for labware:

   - If neither ``height`` nor ``offset`` is specified **and** the labware is support on the magnetic module,
     the magnets will raise to a reasonable default height based on the specified
     labware.

     .. code-block:: python

         mag_mod.engage()

   - If ``height`` is specified, it should be a distance in mm from the
     home position of the magnets.

     .. code-block:: python

        mag_mod.engage(height=18.5)

**Note** Only certain labwares have defined engage heights for the Magnetic
Module. If a labware that does not have a defined engage height is
loaded on the Magnetic Module (or if no labware is loaded), then
``height`` MUST be specified.

Disengage
^^^^^^^^^
.. code-block:: python

   mag_mod.disengage()

The magnetic modules will disengage on the power cycle of the device. It will not auto-disengage unless you specify in your protocol.


.. _thermocycler-section:

*******************
Thermocycler Module
*******************

The thermocycler is still under active development. The commands are subject to change, the most up to date commands can be found at ('git hub repo page link here'). At the time of publication, valid operational range has not yet been defined.

The Thermocycler Module allows users to perform complete experiments that require temperature sensitive reactions
such as PCR, restriction enzyme etc. Below is a description of a few ways you can control this module.

There are two heating mechanisms in the Thermocycler module which the user has access to.

One is the bottom plate in which samples are located, the other is the lid heating pad.

For the purposes of this section, assume the following:

.. code-block:: python

    from opentrons import protocol_api

    def run(protocol: protocol_api.ProtocolContext):
        tc_mod = protocol.load_module('thermocycler module')
        plate = tc_mod.load_labware('nest_96_wellplate_100ul_pcr_full_skirt')

.. note::

    When loading the Thermocycler Module, it is not necessary to specify a slot.
    The Thermocycler Module has a default position that covers Slots 7, 8, 10, and 11.
    This is the only valid location for the Thermocycler Module on the OT2 deck.

Set Temperature
^^^^^^^^^^^^^^^
To set the temperature of the bottom plate you have a few options:

Temperature
+++++++++++

If you only specify a temperature in celcius, the thermocycler will hold this temperature indefinitely until powered off.

.. code-block:: python

        tc_mod.set_temperature(4)

Hold Time
+++++++++

If you set a temperature and a hold time, the thermocycler will hold the temperature for the specified amount of time.


.. code-block:: python

        tc_mod.set_temperature(4, hold_time=60) #time is defined in seconds, 60

Ramp Rate
+++++++++

You can modify the ramp rate in degC/sec for a given temperature.

.. code-block:: python

        tc_mod.set_temperature(4, hold_time=60, ramp_rate=0.5)

.. warning::

  Do not change this parameter unless you know what you're doing.

Set Lid Temperature
^^^^^^^^^^^^^^^^^^^
To set the temperature of the lid in celcius:

    .. code-block:: python

            tc_mod.set_lid_temperature(4)

Open Lid
^^^^^^^^
To perform liquid handling steps on the thermocycler you must ensure that the lid of the thermocycler is open.
