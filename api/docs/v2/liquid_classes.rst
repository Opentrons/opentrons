:og:description: How to select and apply transfer behavior optimized for liquid classes in Opentrons protocols. 

.. _liquid-classes: 

****************
Liquid Classes
****************

Accounting for properties of liquids in your protocol can increase pipetting accuracy on the Flex. For example, a slower flow rate can improve pipetting for a viscous liquid, and an air gap can prevent a volatile liquid from dripping onto the deck. 

This page covers the properties of Opentrons-verified liquid classes, how to use a verified liquid class in your protocol, and how to customize a liquid class. 


.. _opentrons-verified-liquid-classes: 

Opentrons-verified Liquid Classes
=================================

Opentrons-verified liquid classes are based on the properties of common liquids: water, ethanol, and glycerol. 

.. list-table::
    :header-rows: 1

    * - Opentrons-verified liquid class
      - Description
      - Load name
    * - Aqueous
      - Based on deionized water
      - ``water``
    * - Volatile
      - Based on 80% ethanol
      - ``ethanol_80``
    * - Viscous
      - Based on 50% glycerol
      - ``glycerol_50``

Use an Opentrons-verified liquid class in your transfers to automatically apply optimized behavior. For example, choosing the ``glycerol_50`` liquid class changes properties, like flow rate, to accurately transfer viscous liquid. 

.. _liquid-class-properties: 

Liquid Class Properties
========================

When you select a liquid class to use in transfers on the the Flex, properties like submerge speed, flow rate, touch tip, and air gap are automatically applied. These changes might help prevent splashing or dripping of a volatile liquid, or reduce air bubbles forming in a viscous liquid. 

Each Opentrons-verified liquid class is defined by a set of properties: 

.. list-table::
    :header-rows: 1
    :widths: 1 3

    * - Property
      - Description
    * - .. image:: ../img/lc_icons/submerge_position.png

        **Submerge position**
      - The pipette begins at this position above the liquid.
    * - .. image:: ../img/lc_icons/submerge_speed.png

        **Submerge speed**
      - The pipette submerges into the liquid at this speed.
    * - .. image:: ../img/lc_icons/delay_after_submerge.png

        **Delay after submerging**
      - The pipette delays a specified amount of time:

        - before submerging into or retracting from liquid.
        - before or after an aspirate or dispense.
        - after a push out.
    * - .. image:: ../img/lc_icons/mix.png

        **Mix liquid**
      - The pipette mixes liquid inside the well before an aspirate or after a dispense.
    * - .. image:: ../img/lc_icons/prewet_tip.png

        **Pre-wet tip**
      - The pipette pre-wets the attached tip before aspirating liquid.
    * - .. image:: ../img/lc_icons/flow_rate_aspirate.png

        **Aspirate flow rate**
      -  
        - The pipette aspirates liquid at this speed.
        - Varies by volume.
    * - .. image:: ../img/lc_icons/flow_rate_dispense.png

        **Dispense flow rate**
      -  
        - The pipette dispenses liquid at this speed.
        - Varies by volume.
    * - .. image:: ../img/lc_icons/retract_position.png

        **Retract position**
      - The pipette retracts from the liquid and moves to this position.
    * - .. image:: ../img/lc_icons/retract_speed.png

        **Retract speed**
      - The pipette retracts from the liquid at the specified speed.
    * - .. image:: ../img/lc_icons/push_out.png

        **Push out**
      -
        - The pipette dispenses a small amount of air to ensure all liquid leaves the tip.
        - Varies by volume.
    * - .. image:: ../img/lc_icons/touch_tip.png

        **Touch tip**
      - The pipette touches the attached tip to the sides of a well to remove droplets.
    * - .. image:: ../img/lc_icons/air_gap.png

        **Air gap**
      -  
        - The pipette aspirates a small amount of air after an aspirate or dispense.
        - Varies by volume.
    * - .. image:: ../img/lc_icons/blow_out.png
      
        **Blow out**
      - The pipette dispenses a larger amount of air to ensure all liquid leaves the tip.



A :ref:`liquid class definition <liquid-class-definitions>` specifies values for each property. When your Flex protocol includes a liquid class, these property values automatically define transfer behavior. For example, if you use ``.transfer_with_liquid_class`` to transfer a viscous liquid, the pipette submerges into the liquid and aspirates more slowly to prevent air bubbles from forming. 
 

.. _using-liquid-classes:

Using Liquid Classes
======================

You'll use a :ref:`liquid class definition <liquid-class-definitions>` in your protocol to optimize transfer behavior based on liquid properties, along with your chosen Flex pipettes and tips. 

Start by definining the tips, trash, pipette, and labware used in your transfers. Then, use :py:meth:`.ProtocolContext.get_liquid_class` to select an Opentrons-verified liquid class.

.. code-block:: python
    :substitutions: 

    from opentrons import protocol_api

    requirements = {"robotType": "Flex", "apiLevel": "|2.24|"}

    # define tips, trash, and pipette
    def run(protocol: protocol_api.ProtocolContext):
        tiprack = protocol.load_labware(
            load_name="opentrons_flex_96_tiprack_50ul", location="D3"
        )
        trash = protocol.load_trash_bin(location="A3")
        pipette = protocol.load_instrument(
            instrument_name="flex_1channel_50",
            mount="left",
            tip_racks=[tiprack],
        )

    # load source and destination labware
       reservoir = protocol.load_labware(
           load_name="nest_12_reservoir_15ml", location="C3"
        )
        plate = protocol.load_labware(
            load_name="nest_96_wellplate_200ul_flat", location="C2"
        )

    # select liquid class to use in your protocol
        viscous_liquid = protocol.get_liquid_class(name="glycerol_50")


.. versionadded:: 2.24

Use :py:meth:`.ProtocolContext.get_liquid_class` to name the Opentrons-verified liquid class you'll use in the protocol. :py:meth:`~.get_liquid_class` also takes into account pipettes and tipracks in your protocol to define transfer behavior. 

Next, use the :py:meth:`.InstrumentContext.transfer_with_liquid_class` method to transfer an aqueous, volatile, or viscous liquid defined in a Flex protocol. This method requires the stored set of properties defined earlier, ``viscous_liquid``, instead of the ``glycerol_50`` load name. It accepts additional arguments that let you specify your liquid, volume, source and destination wells, tip handling preferences, and trash location. 

Opentrons-verified liquid class definitions are based on Flex pipette and tip combinations. The API will raise an error if you try to perform a liquid class transfer with an OT-2 pipette and tips. 

In the example below, a Flex P50 1-channel pipette will transfer 50 µL of your ``viscous_liquid`` from well A1 of the reservoir to well A1 of the destination plate. A new tip is used for each well transfer, and each tip is dropped in the trash bin loaded in slot A3. 

.. code-block:: python

    # transfer with the viscous liquid class
    pipette.transfer_with_liquid_class(
       liquid_class=viscous_liquid,
       volume=50,
       source=reservoir["A1"],
       dest=plate["A1"],
       new_tip="always",
       trash_location=trash,
    )
  
.. versionadded:: 2.24


Here, the ``glycerol_50`` viscous liquid class definition accounts for all other transfer behavior, like flow rate, whether or not to add an air gap or delay, and submerge and retract speeds. For each aspirate, the pipette: 

* Moves to 2 mm above the top of the source well at 4 mm/sec.
* Submerges to 2 mm above the bottom of the source well at 4mm/sec. 
* Aspirates 50 µL at 50 µL/sec with a correction of -0.2 µL. 
* Delays for 1 second.
* Retracts to 2 mm above the top of the well at 4 mm/sec. 

And for each dispense, the pipette: 

* Moves to 2 mm above the top of the destination well at 4 mm/sec. 
* Submerges to 2 mm above the top of the destination well at 4 mm/sec. 
* Dispenses 50 µL at 25 µL/sec with a correction of -0.2 µL. 
* Pushes out a volume of air equivalent to 3.9 µL
* Delays for 0.5 second. 
* Retracts to 2 mm above the top of the well at 4 mm/sec. 

In many cases, the liquid class definition represents fine-tuned changes optimized for each liquid class. If you instead use the Flex P50 1-channel pipette to transfer 50 µL of the volatile ``liquid_2``, transfer behavior would include: 
* Submerging into and retracting from the volatile ``liquid_2`` at 100 mm/sec.
* Adding larger air gaps after aspirating *and* dispensing to prevent dripping onto the deck.
* Aspirating and dispensing at 30 µL/sec with a larger correction by volume. 
* Pushing out a larger volume of air to ensure all liquid leaves the tip. 

Not all transfer behavior is easily visible. See :ref:`liquid-class-definitions` for a full list of changes based on liquid class, pipette, and tip combination. For more detail on individual transfer settings, see :ref:`liquid-control`. 

.. _customizing-liquid-classes:

Customizing Liquid Classes
===========================

You can create your own liquid class to customize transfer behavior for any liquid in a Flex protocol. To make changes, you can edit individual properties of an existing liquid class, or add properties to a new liquid class. 

To customize an Opentrons-verified liquid class, first add your pipettes, tips, trash, and labware. Then, use :py:meth:`~.ProtocolContext.get_liquid_class` to specify the liquid class you'll make changes to::

  # get base liquid class and custom properties for the Flex pipette and tips 

    custom_water = protocol.get_liquid_class(name="water")
    custom_water_properties=custom_water.get_for(pipette, tiprack)

.. versionadded:: 2.24

Next, edit indivual liquid class properties based on your Flex pipette and tip combination. 

.. code-block:: python
    
  # edit aspirate submerge speed to 80 μL/sec
    custom_water_properties.aspirate.submerge.speed = 80

  # edit aspirate flow rate by volume for 10 μL and 20 μL volumes
    custom_water_properties.aspirate.flow_rate_by_volume.set_for_volume = [(10.0, 40.0)
    custom_water_properties.aspirate.flow_rate_by_volume.set_for_volume = [(20.0, 30.0)]

  # edit to delay for 1 sec before retracting after an aspirate
    custom_water_properties.aspirate.retract.delay.enabled = True
    custom_water_properties.aspirate.retract.delay.duration = 1.0

.. versionadded:: 2.24

Then, complete your transfers with the modified ``custom_water`` liquid class. 

All Opentrons-verified liquid classes position the pipette relative to the well. To customize your liquid class to use :ref:`meniscus-relative <well-meniscus>` locations, set the ``positionReference`` to ``"liquid-meniscus"`` for actions like an aspirate or dispense.   


.. _new-liquid-classes:

Defining New Liquid Classes
============================

You can also create a new liquid class for your Flex protocols. Instead of using an Opentrons-verified liquid class, you'll start from scratch, providing a value for `every required property <https://github.com/Opentrons/opentrons/blob/edge/shared-data/liquid-class/schemas/1.json>`__ in your liquid class. 

.. code-block:: python

 # examples of required properties in a dictionary for your pipette and tip racks
    custom_liquid_class_properties = {
      "flex_1channel_50": {
        "opentrons/opentrons_flex_96_tiprack_50ul/1": {
            "aspirate": {
                "aspirate_position": {
                     "offset": {"x": 1, "y": 2, "z": 3},
                     "position_reference": "well-bottom",
                  },
              },
          },
      }
    
 # create a new liquid class
    custom_viscous = protocol.define_liquid_class(
      name="custom_viscous",
      properties=custom_liquid_class_properties,
      display_name="Custom Viscous"
    )

.. versionadded:: 2.24

The example above is shortened and only includes aspirate position properties. To create your liquid class, you'll need to define values for all `required properties <https://github.com/Opentrons/opentrons/blob/edge/shared-data/liquid-class/schemas/1.json>` in your new liquid class, like submerging before aspirating or after dispensing, speeds and flow rates, and position offsets. 

.. note:: 

    The :py:meth:`.ProtocolContext.get_liquid_class` method only accepts Opentrons-verified liquid classes, like ``glycerol_50``. You'll need to use :py:meth:`.ProtocolContext.define_liquid_class` in each Flex protocol that uses a custom liquid class.
