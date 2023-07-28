.. _heater-shaker-module:

********************
Heater-Shaker Module
********************

The Heater-Shaker Module provides on-deck heating and orbital shaking. The module can heat from 37 to 95 °C, and can shake samples from 200 to 3000 rpm.

The Heater-Shaker Module is represented in code by a :py:class:`.HeaterShakerContext` object. For example::

    def run(protocol: protocol_api.ProtocolContext):
         hs_mod = protocol.load_module(
          module_name='heaterShakerModuleV1',
          location="D1")

.. versionadded:: 2.13

Deck Slots
==========

The supported deck slot positions for the Heater-Shaker depend on the robot you’re using. 

.. list-table::
   :widths: 30 80
   :header-rows: 1

   * - Robot Model
     - Heater-Shaker Deck Placement
   * - Flex
     - In any deck slot in column 1 or 3. The module can go in slot A3, but you need to move the trash bin first.
   * - OT-2
     - In deck slot 1, 3, 4, 6, 7, or 10.
     
OT-2 Placement Restrictions
===========================

On OT-2, you need to restrict placement of other modules and labware around the Heater-Shaker. On Flex, the module is installed below-deck in a caddy and there is more space between deck slots, so these restrictions don't apply.

In general, it's best to leave all slots adjacent to the Heater-Shaker empty. If your protocol requires filling those slots, observe the following restrictions to avoid physical crashes involving the Heater-Shaker.

Adjacent Modules
----------------

Do not place other modules next to the Heater-Shaker. Keeping adjacent deck slots clear helps prevents collisions during shaking and while opening the labware latch. Loading a module next to the Heater-Shaker on OT-2 will raise a ``DeckConflictError``.

Tall Labware
------------

Do not place labware taller than 53 mm to the left or right of the Heater-Shaker. This prevents the Heater-Shaker’s latch from colliding with the adjacent labware. Common labware that exceed the height limit include Opentrons tube racks and Opentrons 1000 µL tip racks. Loading tall labware to the right or left of the Heater-Shaker on OT-2 will raise a ``DeckConflictError``. 

8-Channel Pipettes
------------------

You can't perform pipetting actions in `any` slots adjacent to the Heater-Shaker if you're using a GEN2 or GEN1 8-channel pipette. This prevents the pipette ejector from crashing on the module housing or labware latch. Using an 8-channel pipette will raise a ``PipetteMovementRestrictedByHeaterShakerError``.

There is one exception: to the front or back of the Heater-Shaker, an 8-channel pipette can access tip racks only. Attempting to pipette to non-tip-rack labware will also raise a ``PipetteMovementRestrictedByHeaterShakerError``.

Latch Control
=============

To add and remove labware from the Heater-Shaker, control the module's labware latch from your protocol using :py:meth:`.open_labware_latch` and :py:meth:`.close_labware_latch`. Shaking requires the labware latch to be closed, so you may want to issue a close command before the first shake command in your protocol:

.. code-block:: python

    hs_mod.close_labware_latch()
    hs_mod.set_and_wait_for_shake_speed(500)

If the labware latch is already closed, ``close_labware_latch()`` will succeed immediately; you don’t have to check the status of the latch before opening or closing it.

To prepare the deck before running a protocol, use the labware latch controls in the Opentrons App or run these methods in Jupyter notebook.

Loading Labware
===============

Like with all modules, use the Heater-Shaker’s :py:meth:`~.HeaterShakerContext.load_labware` method to specify what you will place on the module. For the Heater-Shaker, you must use a definition that describes the combination of a thermal adapter and labware that fits it.  See the :ref:`load-labware-module` section for an example of how to place labware on a module.

Currently, the `Opentrons Labware Library <https://labware.opentrons.com/>`_ includes several pre-configured adapter–labware combinations and standalone adapter definitions that help make the Heater-Shaker ready to use right out of the box. See :ref:`labware-on-adapters` for examples of loading labware on modules.

Pre-configured Combinations
---------------------------

The Heater-Shaker supports these thermal adapter and labware combinations by default. These let you load the adapter and labware with a single definition.

.. list-table::
   :header-rows: 1

   * - Adapter/Labware Combination
     - API Load Name
   * - Opentrons 96 Deep Well Adapter with NEST Deep Well Plate 2 mL
     - ``opentrons_96_deep_well_adapter_nest_wellplate_2ml_deep``
   * - Opentrons 96 Flat Bottom Adapter with NEST 96 Well Plate 200 µL Flat
     - ``opentrons_96_flat_bottom_adapter_nest_wellplate_200ul_flat``
   * - Opentrons 96 PCR Adapter with Armadillo Well Plate 200 µL
     - ``opentrons_96_pcr_adapter_armadillo_wellplate_200ul``
   * - Opentrons 96 PCR Adapter with NEST Well Plate 100 µL
     - ``opentrons_96_pcr_adapter_nest_wellplate_100ul_pcr_full_skirt``
   * - Opentrons Universal Flat Adapter with Corning 384 Well Plate 112 µL Flat
     - ``opentrons_universal_flat_adapter_corning_384_wellplate_112ul_flat``

Standalone Well-Plate Adapters
------------------------------

You can use these standalone adapter definitions to load Opentrons verified or custom labware on top of the Heater-Shaker.

.. list-table::
   :header-rows: 1

   * - Adapter Type
     - API Load Name
   * - Opentrons Universal Flat Adapter
     - ``opentrons_universal_flat_adapter``
   * - Opentrons 96 PCR Adapter
     - ``opentrons_96_pcr_adapter``
   * - Opentrons 96 Deep Well Adapter
     - ``opentrons_96_deep_well_adapter``
   * - Opentrons 96 Flat Bottom Adapter
     - ``opentrons_96_flat_bottom_adapter``

Custom Flat-Bottom Labware
--------------------------

Custom flat-bottom labware can be used with the Universal Flat Adapter. See the support article `Requesting a Custom Labware Definition <https://support.opentrons.com/s/article/Requesting-a-custom-labware-definition>`_ if you need assistance creating custom labware definitions for the Heater-Shaker.

Heating and Shaking
===================

The API treats heating and shaking as separate, independent activities due to the amount of time they take.

Increasing or reducing shaking speed takes a few seconds, so the API treats these actions as *blocking* commands. All other commands cannot run until the module reaches the required speed.

Heating the module, or letting it passively cool, takes more time than changing the shaking speed. As a result, the API gives you the flexibility to perform other pipetting actions while waiting for the module to reach a target temperature. When holding at temperature, you can design your protocol to run in a blocking or non-blocking manner.

.. note::

	Since API version 2.13, only the Heater-Shaker Module supports non-blocking command execution. All other modules' methods are blocking commands.

Blocking commands
-----------------

This example uses a blocking command and shakes a sample for one minute. No other commands will execute until a minute has elapsed. The three commands in this example start the shake, wait for one minute, and then stop the shake::

    hs_mod.set_and_wait_for_shake_speed(500)
    protocol.delay(minutes=1)
    hs_mod.deactivate_shaker()

These actions will take about 65 seconds total. Compare this with similar-looking commands for holding a sample at a temperature for one minute:

.. code-block:: python

    hs_mod.set_and_wait_for_temperature(75)
    protocol.delay(minutes=1)
    hs_mod.deactivate_heater()

This may take much longer, depending on the thermal block used, the volume and type of liquid contained in the labware, and the initial temperature of the module. 

Non-blocking commands
---------------------

To pipette while the Heater-Shaker is heating, use :py:meth:`~.HeaterShakerContext.set_target_temperature` and :py:meth:`~.HeaterShakerContext.wait_for_temperature` instead of :py:meth:`~.HeaterShakerContext.set_and_wait_for_temperature`:

.. code-block:: python

    hs_mod.set_target_temperature(75)
    pipette.pick_up_tip()   
    pipette.aspirate(50, plate['A1'])
    pipette.dispense(50, plate['B1'])
    pipette.drop_tip()
    hs_mod.wait_for_temperature()
    protocol.delay(minutes=1)
    hs_mod.deactivate_heater()

This example would likely take just as long as the blocking version above; it’s unlikely that one aspirate and one dispense action would take longer than the time for the module to heat. However, be careful when putting a lot of commands between a ``set_target_temperature()`` call and a ``delay()`` call. In this situation, you’re relying on ``wait_for_temperature()`` to resume execution of commands once heating is complete. But if the temperature has already been reached, the delay will begin later than expected and the Heater-Shaker will hold at its target temperature longer than intended.

Additionally, if you want to pipette while the module holds a temperature for a certain length of time, you need to track the holding time yourself. One of the simplest ways to do this is with Python’s ``time`` module. First, add ``import time`` at the start of your protocol. Then, use :py:func:`time.monotonic` to set a reference time when the target is reached. Finally, add a delay that calculates how much holding time is remaining after the pipetting actions:

.. code-block:: python

    hs_mod.set_and_wait_for_temperature(75)
    start_time = time.monotonic()  # set reference time
    pipette.pick_up_tip()   
    pipette.aspirate(50, plate['A1'])
    pipette.dispense(50, plate['B1'])
    pipette.drop_tip()
    # delay for the difference between now and 60 seconds after the reference time
    protocol.delay(max(0, start_time+60 - time.monotonic()))
    hs_mod.deactivate_heater()

Provided that the parallel pipetting actions don’t take more than one minute, this code will deactivate the heater one minute after its target was reached. If more than one minute has elapsed, the value passed to ``protocol.delay()`` will equal 0, and the protocol will continue immediately.

Deactivating
============

Deactivating the heater and shaker are done separately using the :py:meth:`~.HeaterShakerContext.deactivate_heater` and :py:meth:`~.HeaterShakerContext.deactivate_shaker` methods, respectively. There is no method to deactivate both simultaneously. Call the two methods in sequence if you need to stop both heating and shaking.

.. note:: 

    The robot will not automatically deactivate the Heater-Shaker at the end of a protocol. If you need to deactivate the module after a protocol is completed or canceled, use the Heater-Shaker module controls on the device detail page in the Opentrons App or run these methods in Jupyter notebook.

