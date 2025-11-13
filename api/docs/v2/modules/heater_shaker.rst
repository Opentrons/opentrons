:og:description: How to use the Heater-Shaker Module in a Python protocol, and where it can be safely placed on the deck.

.. _heater-shaker-module:

********************
Heater-Shaker Module
********************

The Heater-Shaker Module provides on-deck heating and orbital shaking. The module can heat samples to 95 °C, and can shake samples from 200 to 3000 rpm.

The Heater-Shaker Module is represented in code by a :py:class:`.HeaterShakerContext` object. For example::

    hs_mod = protocol.load_module(
        module_name="heaterShakerModuleV1", location="D1"
    )

.. versionadded:: 2.13
  The Heater-Shaker can heat samples from 37 to 95 °C. 
.. versionchanged:: 2.25
  The Heater-Shaker accepts target temperatures lower than 37 °C. Set the Heater-Shaker's temperature at least 1.5 °C above ambient temperature. 


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

Use the Heater-Shaker’s :py:meth:`~.HeaterShakerContext.load_adapter` and :py:meth:`~.HeaterShakerContext.load_labware` methods to specify what you will place on the module. For the Heater-Shaker, use one of the thermal adapters listed below and labware that fits on the adapter. See :ref:`labware-on-adapters` for examples of loading labware on modules.

The `Opentrons Labware Library <https://labware.opentrons.com/>`_ includes definitions for both standalone adapters and adapter–labware combinations. These labware definitions help make the Heater-Shaker ready to use right out of the box.

.. note::
    If you plan to :ref:`move labware <moving-labware>` onto or off of the Heater-Shaker during your protocol, you must use a standalone adapter definition, not an adapter–labware combination definiton.

Standalone Adapters
-------------------

You can use these standalone adapter definitions to load Opentrons verified or custom labware on top of the Heater-Shaker. 

.. list-table::
   :header-rows: 1

   * - Adapter Type
     - API Load Name
   * - Opentrons Universal Flat Heater-Shaker Adapter
     - ``opentrons_universal_flat_adapter``
   * - Opentrons Universal Flat Heater-Shaker Adapter Type B
     - ``opentrons_universal_flat_adapter_type_b``
   * - Opentrons 96 PCR Heater-Shaker Adapter
     - ``opentrons_96_pcr_adapter``
   * - Opentrons 96 Deep Well Heater-Shaker Adapter
     - ``opentrons_96_deep_well_adapter``
   * - Opentrons 96 Flat Bottom Heater-Shaker Adapter
     - ``opentrons_96_flat_bottom_adapter``

For example, these commands load a well plate on top of the flat bottom adapter::

    hs_adapter = hs_mod.load_adapter("opentrons_96_flat_bottom_adapter")
    hs_plate = hs_adapter.load_labware("nest_96_wellplate_200ul_flat")

.. versionadded:: 2.15
    The ``load_adapter()`` method.


Pre-configured Combinations
---------------------------

The Heater-Shaker supports these thermal adapter and labware combinations for backwards compatibility. If your protocol specifies an ``apiLevel`` of 2.15 or higher, you should use the standalone adapter definitions instead.

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

This command loads the same physical adapter and labware as the example in the previous section, but it is also compatible with API versions 2.13 and 2.14::

    hs_combo = hs_mod.load_labware(
        "opentrons_96_flat_bottom_adapter_nest_wellplate_200ul_flat"
    )

.. versionadded:: 2.13

Custom Flat-Bottom Labware
--------------------------

Custom flat-bottom labware can be used with the Universal Flat Adapter. See the support article `Requesting a Custom Labware Definition <https://support.opentrons.com/s/article/Requesting-a-custom-labware-definition>`_ if you need assistance creating custom labware definitions for the Heater-Shaker.

Heating and Shaking
===================

The API treats heating and shaking as separate, independent activities due to the amount of time they take. Increasing or reducing shaking speed takes a few seconds, while heating or letting the module passively cool takes more time.

In both cases, the API lets you choose whether to perform other protocol steps while heating and shaking. To do this, you can design your protocol to run in a *blocking* or non-blocking manner. When you use a blocking module command, the robot won't perform other commands until the module reaches the required temperature or shaking speed. Non-blocking commands let the robot perform other pipetting and some other module actions while heating and shaking. 

.. list-table::
    :header-rows: 1

    * - **Command**
      - **API version**
      - **Module action**
    * - 
        - ``set_and_wait_for_temperature()``
        - ``wait_for_temperature()``
        - ``set_and_wait_for_shake_speed()``
      - Added in API 2.13
      - Blocking
    * - ``set_target_temperature()``
      - 
        - Added in API 2.13
        - Updated in API 2.27; returns a ``task``
      - Non-blocking
    * - ``set_shake_speed``
      - Added in API 2.27
      - Non-blocking

The sections below cover heating and shaking samples using the Heater-Shaker Module's blocking and non-blocking commands. 

Heating
--------

The examples below use a blocking or non-blocking command to set the Heater-Shaker Module to 75 °C. 

.. tabs::

    .. tab:: Blocking

      .. code-block:: python
    
        hs_mod.set_and_wait_for_temperature(75)
        protocol.delay(minutes=1)

    .. tab:: Non-blocking 

      .. code-block:: python
      
        hs_mod.set_target_temperature(75)
        pipette.pick_up_tip()   
        pipette.aspirate(50, plate["A1"])
        pipette.dispense(50, plate["B1"])
        pipette.drop_tip()

When you use a blocking command like :py:meth:`.HeaterShakerContext.set_and_wait_for_temperature`, no other commands will execute until the module reaches the target temperature. Here, a delay lets samples incubate at the target temperature. The robot will wait an additional minute before resuming the next protocol steps. 

Heating the Heater-Shaker Module can take a much longer time than reaching a shake speed, depending on the thermal block used, the volume and type of liquid contained in the labware, and the initial temperature of the module. To perform other actions while the module reaches it's target temperature, use the non-blocking :py:meth:`.HeaterShakerContext.set_target_temperature` command. Here, the robot will continue to perform pipetting steps in your protocol.

If you want the robot to continue pipetting while the module holds a temperature for a certain length of time, you can use :py:meth:`.ProtocolContext.create_timer`:: 

  temp_timer = create_timer(seconds=120)
  hs_mod.set_target_temperature(75)
  pipette.pick_up_tip()
  pipette.aspirate(50, plate["A1"])
  pipette.dispense(50, plate["B1"])
  protocol.wait_for_tasks(temp_timer)
  hs_mod.deactivate_heater()

Here, the robot will perform protocol steps placed after the non-blocking :py:meth:`~.HeaterShakerContext.set_target_temperature` command. Once the protocol reaches the :py:meth:`.ProtocolContext.wait_for_tasks` command, the robot pauses while the module holds at 75 °C. 

Shaking 
--------

The examples below use a blocking or non-blocking command to set the Heater-Shaker Module to a shake speed of 500 RPM. 

.. tabs::

    .. tab:: Blocking

      .. code-block:: python
      
        hs_mod.set_and_wait_for_shake_speed(500)
        protocol.delay(minutes=1)

    .. tab:: Non-blocking 

      .. code-block:: python
      
        hs_mod.set_shake_speed(500)
        pipette.pick_up_tip()   
        pipette.aspirate(50, plate["A1"])
        pipette.dispense(50, plate["B1"])
        pipette.drop_tip()

The first example uses the blocking command :py:meth:`.HeaterShakerContext.set_and_wait_for_shake_speed` to shake samples for one minute. No other commands will execute until the module reaches the desired shake speed and a minute has elapsed. Because reaching the shake speed takes much less time than heating the module, these actions will take only about 65 seconds total. 

When you use a non-blocking command like :py:meth:`.HeaterShakerContext.set_shake_speed`, the robot continues to perform pipetting and some other module actions while the module reaches the target shake speed. 

You can also use non-blocking commands to heat and shake simultaneously. The amount of time it takes for the Heater-Shaker Module to reach either the target temperature or shake speed won't affect other steps in your protocol. The non-blocking ``set_target_temperature()`` and ``set_shake_speed()`` methods also allow some other simulatenous module actions. For more, see the :ref:`concurrent-module` section. 


Deactivating
============

Deactivating the heater and shaker are done separately using the :py:meth:`~.HeaterShakerContext.deactivate_heater` and :py:meth:`~.HeaterShakerContext.deactivate_shaker` methods, respectively. There is no method to deactivate both simultaneously. Call the two methods in sequence if you need to stop both heating and shaking.

.. note:: 

    The robot will not automatically deactivate the Heater-Shaker at the end of a protocol. If you need to deactivate the module after a protocol is completed or canceled, use the Heater-Shaker module controls on the device detail page in the Opentrons App or run these methods in Jupyter notebook.