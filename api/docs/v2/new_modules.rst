.. _new_modules:

################
Hardware Modules
################

Modules are peripherals that attach to the OT-2 to extend its capabilities.

We currently support the Temperature, Magnetic and Thermocycler Modules.

Loading your Module onto a deck
===============================

Like labware and pipettes, you must inform the Protocol API of the modules you will use in your protocol. The Protocol API then creates software objects called :py:class:`.ModuleContext` that represent the attached modules.

Modules are loaded using the function :py:meth:`.ProtocolContext.load_module`:

.. code-block:: python

    from opentrons import protocol_api

    metadata = {'apiLevel': '2.0'}

    def run(protocol: protocol_api.ProtocolContext):
         module = protocol.load_module('Module Name', slot)



Module names can be specified in a few different ways. The valid names can be found below. They are not case-sensitive.

+--------------------------+-----------------------------------------------+
|        Module Type       |               Valid Names                     |
+==========================+===============================================+
| ``Temperature Module``   | ``'Temperature Module'``, ``'tempdeck'``      |
+--------------------------+-----------------------------------------------+
| ``Magnetic Module``      | ``'Magnetic Module'``, ``'magdeck'``          |
+--------------------------+-----------------------------------------------+
| ``Thermocycler Module``  | ``'Thermocycler Module'``, ``'thermocycler'`` |
+--------------------------+-----------------------------------------------+

.. versionadded:: 2.0

.. note::

    When you load a module in a protocol, you inform the OT-2 that you want the specified module to be present. Even if you do not use the module anywhere else in your protocol, the Opentrons App and the OT-2 will not let your protocol proceed until all modules loaded with ``load_module`` are attached to the OT-2.


Module and Labware Compatibility
================================

Before adding labware to your module, you should check if the desired labware is compatible with your module. For more information about each module’s compatible labware, check out this `support article <https://support.opentrons.com/en/articles/3540964-what-labware-can-i-use-with-my-modules>`_.


Loading Labware Onto Your Module
================================

Like specifying labware that will be present on the deck of the OT-2, you must specify labware that will be present on the module you have just loaded. You do this using :py:meth:`.ModuleContext.load_labware`. For instance, to load a Temperature Module and specify an `aluminum block for 2 mL tubes <https://labware.opentrons.com/opentrons_24_aluminumblock_generic_2ml_screwcap?category=aluminumBlock>`_, you would do:

.. code-block:: python

    from opentrons import protocol_api

    metadata = {'apiLevel': '2.1'}

    def run(protocol: protocol_api.ProtocolContext):
         module = protocol.load_module('Temperature Module', slot)
         my_labware = module.load_labware('opentrons_24_aluminumblock_generic_2ml_screwcap',
                                          label='Temperature-Controlled Tubes')

You do not need to specify a slot, because the labware is loaded into the module.

.. versionadded:: 2.0


Loading Custom Labware Into Your Module
---------------------------------------

Any custom labware added to your Opentrons App (see :ref:`v2-custom-labware`) is accessible when loading labware onto a module.

.. versionadded:: 2.1

.. note::

    In API version 2.0, :py:meth:`.ModuleContext.load_labware` only took a ``load_name`` argument. In API version 2.1 (introduced in Robot Software version 3.15.2) you can now specify a label, version, and namespace (though most of the time you won't have to).


Checking The Status Of Your Module
==================================

All modules have the ability to check what state they are currently in:

.. code-block:: python

    from opentrons import protocol_api

    metadata = {'apiLevel': '2.0'}

    def run(protocol: protocol_api.ProtocolContext):
         module = protocol.load_module('Module Name', slot)
         status = module.status

The Temperature Module's ``status`` is a string that is one of  ``'heating'``, ``'cooling'``, ``'holding at target'`` or ``'idle'``.

The Magnetic Module's ``status`` is a string that is one of  ``'engaged'`` or ``'disengaged'``.

The Thermocycler Module ``status`` is a string that is one of ``'holding at target'`` or ``'idle'``. There are more detailed status checks which can be found in :ref:`thermocycler-section`

.. versionadded:: 2.0

******************
Temperature Module
******************

The Temperature Module acts as both a cooling and heating device. It can control the temperature
of its deck between 4 °C and 95 °C with a resolution of 1 °C.

Temperature Modules are represented in code by :py:class:`.TemperatureModuleContext` objects.

The Temperature Module has the following methods that can be accessed during a protocol. For the purposes of this
section, assume we have the following already:

.. code-block:: python

    from opentrons import protocol_api

    metadata = {'apiLevel': '2.0'}

    def run(protocol: protocol_api.ProtocolContext):
        temp_mod = protocol.load_module('temperature module', '1')
        plate = temp_mod.load_labware('corning_96_wellplate_360ul_flat')
        # The code from the rest of the examples in this section goes here

.. versionadded:: 2.0

Set Temperature
^^^^^^^^^^^^^^^

To set the Temperature Module to 4 °C do the following:

.. code-block:: python

    temp_mod.set_temperature(4)

This function will pause your protocol until your target temperature is reached.

.. note::

     This is unlike version 1 of the Python API, in which you would have to use the separate function ``wait_for_temperature`` to block protocol execution until the Temperature Module was ready.

.. versionadded:: 2.0

Read the Current Temperature
^^^^^^^^^^^^^^^^^^^^^^^^^^^^

You can read the current real-time temperature of the Temperature Module using the :py:attr:`.TemperatureModuleContext.temperature` property:

.. code-block:: python

    temp_mod.temperature

.. versionadded:: 2.0

Read the Target Temperature
^^^^^^^^^^^^^^^^^^^^^^^^^^^

You can read the current target temperature of the Temperature Module using the :py:attr:`.TemperatureModuleContext.target` property:

.. code-block:: python

    temp_mod.target

.. versionadded:: 2.0

Deactivate
^^^^^^^^^^

This function will stop heating or cooling and will turn off the fan on the Temperature Module.

.. code-block:: python

    temp_mod.deactivate()

.. note::

    You can also deactivate your temperature module through the Opentrons App by
    clicking on the ``Pipettes & Modules`` tab. Your Temperature Module will automatically
    deactivate if another protocol is uploaded to the app. Your Temperature Module will
    *not* deactivate automatically when the protocol ends, is cancelled, or is reset.

After deactivating your Temperature module, you can later call :py:meth:`.TemperatureModuleContext.set_temperature` to heat or cool phase again.

.. versionadded:: 2.0

***************
Magnetic Module
***************

The Magnetic Module controls a set of permanent magnets which can move vertically. When the magnets are raised or engaged, they induce a magnetic field in the labware on the module. When they are lowered or disengaged, they do not.

The Magnetic Module is represented by a :py:class:`.MagneticModuleContext` object.

For the purposes of this section, assume we have the following already:

.. code-block:: python

    from opentrons import protocol_api

    metadata = {'apiLevel': '2.0'}

    def run(protocol: protocol_api.ProtocolContext):
        mag_mod = protocol.load_module('magnetic module', '1')
        plate = mag_mod.load_labware('nest_96_wellplate_100ul_pcr_full_skirt')
        # The code from the rest of the examples in this section goes here

.. versionadded:: 2.0


Engage
^^^^^^

The :py:meth:`.MagneticModuleContext.engage` function raises the magnets to induce a magnetic field in the labware on top of the Magnetic Module. The height of the magnets can be specified in several different ways, based on internally stored default heights for labware:

   - If neither ``height`` nor ``offset`` is specified **and** the labware is supported on the Magnetic Module,
     the magnets will raise to a reasonable default height based on the specified labware.

     .. code-block:: python

         mag_mod.engage()

   - If ``height`` is specified, it should be a distance in mm from the home position of the magnets.

     .. code-block:: python

        mag_mod.engage(height=18.5)

   - You can also specify the height for the magnet to be raised from the base of the labware:

    .. code-block:: python

       mag_mod.engage(labware_base_offset=13.5)

    .. versionadded:: 2.2

.. note::

    Only certain labwares have defined engage heights for the Magnetic
    Module. If a labware that does not have a defined engage height is
    loaded on the Magnetic Module (or if no labware is loaded), then
    ``height`` must be specified.

.. versionadded:: 2.0

Disengage
^^^^^^^^^

.. code-block:: python

   mag_mod.disengage()

The Magnetic Module will disengage when the device is turned on. It will not auto-disengage otherwise unless you call :py:meth:`.MagneticModuleContext.disengage` in your protocol.

.. versionadded:: 2.0

.. _thermocycler-section:

*******************
Thermocycler Module
*******************


The Thermocycler Module allows users to perform complete experiments that require temperature sensitive reactions such as PCR.

There are two heating mechanisms in the Thermocycler. One is the block in which samples are located; the other is the lid heating pad.

The block can control its temperature between 4 °C and 99 °C to the nearest 1 °C.

The lid can control its temperature between 37 °C to 110 °C. Please see our `support article <https://support.opentrons.com/en/articles/3469797-thermocycler-module>`_ on controlling the Thermocycler in the Opentrons App.

For the purposes of this section, assume we have the following already:

.. code-block:: python

    from opentrons import protocol_api

    metadata = {'apiLevel': '2.0'}

    def run(protocol: protocol_api.ProtocolContext):
        tc_mod = protocol.load_module('Thermocycler Module')
        plate = tc_mod.load_labware('nest_96_wellplate_100ul_pcr_full_skirt')

.. note::

    When loading the Thermocycler, it is not necessary to specify a slot.
    This is because the Thermocycler has a default position that covers Slots 7, 8, 10, and 11.
    This is the only valid location for the Thermocycler on the OT-2 deck.

.. versionadded:: 2.0

Lid Motor Control
^^^^^^^^^^^^^^^^^

The Thermocycler can control its temperature with the lid open or closed. When the lid of the Thermocycler is open, the pipettes can access the loaded labware. You can control the lid position with the methods below.

Open Lid
++++++++

.. code-block:: python

    tc_mod.open_lid()


.. versionadded:: 2.0

Close Lid
+++++++++

.. code-block:: python

    tc_mod.close_lid()

.. versionadded:: 2.0

Lid Temperature Control
^^^^^^^^^^^^^^^^^^^^^^^

You can control when a lid temperature is set. It is recommended that you set
the lid temperature before executing a Thermocycler profile (see :ref:`thermocycler-profiles`). The range of the Thermocycler lid is
37 °C to 110 °C.

Set Lid Temperature
+++++++++++++++++++

:py:meth:`.ThermocyclerContext.set_lid_temperature` takes one parameter: the ``temperature`` you wish the lid to be set to. The protocol will only proceed once the lid temperature has been reached.

.. code-block:: python

    tc_mod.set_lid_temperature(temperature)

.. versionadded:: 2.0

Block Temperature Control
^^^^^^^^^^^^^^^^^^^^^^^^^

To set the block temperature inside the Thermocycler, you can use the method :py:meth:`.ThermocyclerContext.set_block_temperature`. It takes five parameters:
``temperature``, ``hold_time_seconds``, ``hold_time_minutes``, ``ramp_rate`` and ``block_max_volume``. Only ``temperature`` is required; the two ``hold_time`` parameters, ``ramp_rate``, and ``block_max_volume`` are optional.


Temperature
+++++++++++

If you only specify a ``temperature`` in °C, the Thermocycler will hold this temperature indefinitely until powered off.

.. code-block:: python

        tc_mod.set_block_temperature(4)

.. versionadded:: 2.0

Hold Time
+++++++++

If you set a ``temperature`` and a ``hold_time``, the Thermocycler will hold the temperature for the specified amount of time. Time can be passed in as minutes or seconds.

With a hold time, it is important to also include the ``block_max_volume`` parameter. This is to ensure that the sample reaches the target temperature before the hold time counts down.

In the example below, the Thermocycler will hold the 50 µl samples at the specified temperature for 45 minutes and 15 seconds.

If you do not specify a hold time the protocol will proceed once the temperature specified is reached.

.. code-block:: python

        tc_mod.set_block_temperature(4, hold_time_seconds=15, hold_time_minutes=45, block_max_volume=50)

.. versionadded:: 2.0

Block Max Volume
++++++++++++++++

The Thermocycler's block temperature controller varies its behavior based on the amount of liquid in the wells of its labware. Specifying an accurate volume allows the Thermocycler to precisely track the temperature of the samples. The ``block_max_volume`` parameter is specified in µL and is the volume of the most-full well in the labware that is loaded on the Thermocycler's block. If not specified, it defaults to 25 µL.

.. code-block:: python

        tc_mod.set_block_temperature(4, hold_time_seconds=20, block_max_volume=80)


.. versionadded:: 2.0

Ramp Rate
+++++++++

Lastly, you can modify the ``ramp_rate`` in °C/sec for a given ``temperature``.

.. code-block:: python

        tc_mod.set_block_temperature(4, hold_time_seconds=60, ramp_rate=0.5)

.. warning::

  Do not modify the ``ramp_rate`` unless you know what you're doing.

.. versionadded:: 2.0

.. _thermocycler-profiles:

Thermocycler Profiles
^^^^^^^^^^^^^^^^^^^^^

The Thermocycler can rapidly cycle through temperatures to execute heat-sensitive reactions. These cycles are defined as profiles.


Thermocycler profiles are defined for the Protocol API as lists of dicts. Each dict should have a ``temperature`` key, which specifies the temperature of a profile step, and either or both of ``hold_time_seconds`` or ``hold_time_minutes``, which specify the duration of the step. For instance, this profile commands the Thermocycler to drive its temperature to 10 °C for 30 seconds, and then 60 °C for 45 seconds:


.. code-block:: python

        profile = [
          {temperature: 10, hold_time_seconds: 30},
          {temperature: 60, hold_time_seconds: 45}]

Once you have written your profile, you command the Thermocycler to execute it using :py:meth:`.ThermocyclerContext.execute_profile`. This function executes your profile steps multiple times depending on the ``repetitions`` parameter. It also takes a ``block_max_volume`` parameter, which is the same as that of the :py:meth:`.ThermocyclerContext.set_block_temperature` function.

For instance, you can execute the profile defined above 100 times for a 30 µL-per-well volume like this:

.. code-block:: python

        profile = [
          {temperature: 10, hold_time_seconds: 30},
          {temperature: 60, hold_time_seconds: 30}]

        tc_mod.execute_profile(steps=profile, repetitions=100, block_max_volume=30)


.. note::

    Temperature profiles only control the temperature of the `block` in the Thermocycler. You should set a lid temperature before executing the profile using :py:meth:`.ThermocyclerContext.set_lid_temperature`.

.. versionadded:: 2.0

Thermocycler Status
^^^^^^^^^^^^^^^^^^^

Throughout your protocol, you may want particular information on the current status of your Thermocycler. Below are
a few methods that allow you to do that.

Lid Position
++++++++++++

The current status of the lid position. It can be one of the strings ``'open'``, ``'closed'`` or ``'in_between'``.

.. code-block:: python

    tc_mod.lid_position

.. versionadded:: 2.0

Heated Lid Temperature Status
+++++++++++++++++++++++++++++

The current status of the heated lid temperature controller. It can be one of the strings ``'holding at target'``, ``'heating'``, ``'idle'``,  or ``'error'``.

.. code-block:: python

    tc_mod.lid_temperature_status

.. versionadded:: 2.0

Block Temperature Status
++++++++++++++++++++++++

The current status of the well block temperature controller. It can be one of the strings ``'holding at target'``, ``'cooling'``, ``'heating'``, ``'idle'``, or ``'error'``.

.. code-block:: python

    tc_mod.block_temperature_status

.. versionadded:: 2.0

.. _thermocycler-deactivation:

Thermocycler Deactivate
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

At some points in your protocol, you may want to deactivate specific temperature controllers of your Thermocycler. This can be done with three methods,
:py:meth:`.ThermocyclerContext.deactivate`, :py:meth:`.ThermocyclerContext.deactivate_lid`, :py:meth:`.ThermocyclerContext.deactivate_block`.

Deactivate
++++++++++

This deactivates both the well block and the heated lid of the Thermocycler.

.. code-block:: python

  tc_mod.deactivate()

Deactivate Lid
++++++++++++++

This deactivates only the heated lid of the Thermocycler.

.. code-block:: python

  tc_mod.deactivate_lid()

.. versionadded:: 2.0

Deactivate Block
++++++++++++++++

This deactivates only the well block of the Thermocycler.

.. code-block:: python

  tc_mod.deactivate_block()

.. versionadded:: 2.0
