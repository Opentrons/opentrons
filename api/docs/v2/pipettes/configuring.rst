.. _configuring-pipette-modes:

*************************
Configuring Pipette Modes
*************************

The API provides methods to configure certain pipettes to operate in a specific mode. These configuration methods change the default behavior of the pipette on an ongoing basis, until you call them again with different values. 

This page covers the currently available modes.

- :ref:`partial-tip-pickup`: The 96-channel pipette can be configured to use 8 or 96 nozzles for pipetting.
- :ref:`pipette-volume-modes`: The Flex 50 µL pipettes can be configured to handle liquid differently for low or high volumes.

There are no mode configurations for OT-2 pipettes.


.. _partial-tip-pickup:

Partial Tip Pickup
==================

The 96-channel pipette occupies both pipette mounts on Flex, so it's not possible to attach another pipette at the same time. Partial tip pickup lets you perform some of the same actions that you would be able to perform with a second pipette. As of version 2.16 of the API, you can configure the 96-channel pipette pick up a single column of tips, similar to the behavior of an 8-channel pipette.

Nozzle Layout
-------------

Use the :py:meth:`.configure_nozzle_layout` method to choose how many tips the 96-channel pipette will pick up. The method's ``style`` parameter accepts special layout constants. When using partial tip pickup, it's generally easiest to import these at the top of your protocol.

.. code-block:: python

    from opentrons import protocol_api
    from opentrons.protocol_api import COLUMN, ALL

Then when you call ``configure_nozzle_layout`` later in your protocol, you can set ``style=COLUMN``. If, instead, you use ``from opentrons import protocol_api``, then you can pass ``protocol_api.COLUMN``. If you don't put any ``import`` statements at the top of your protocol, you won't be able to configure the nozzle layout.

Assuming the ``import`` statements from above, here is the start of a protocol that loads a 96-channel pipette and sets it to pick up a single column of tips.

.. code-block:: python
    :substitutions:

    requirements = {"robotType": "Flex", "apiLevel": "|apiLevel|"}

    def run(protocol: protocol_api.ProtocolContext):
        partial_pickup_tips = protocol.load_labware(
            load_name="opentrons_flex_96_tiprack_1000ul",
            location="D3"
        )
        pipette = protocol.load_instrument("flex_96channel_1000")
        pipette.configure_nozzle_layout(
            style=COLUMN,
            start="A12",
            tip_racks=[partial_pickup_tips]
        )

.. versionadded: 2.16

Let's unpack some of the details of this code.

First, we've given a special name to the tip rack, ``partial_pickup_tips``. You can name your tip racks whatever you like, but if you're performing full pickup and partial pickup in the same protocol, you'll need to keep them separate. See :ref:`partial-tip-rack-adapters` below.

Next, we load the 96-channel pipette. Note that ``load_instrument()`` only has a single argument. The 96-channel pipette occupies both mounts, so ``mount`` is omissible. The ``tip_racks`` argument is always optional. But it would have no effect to declare it here, because every call to ``configure_nozzle_layout()`` resets the pipette's :py:obj:`.InstrumentContext.tip_racks` property.

Finally, we configure the nozzle layout, with three arguments.

    - The ``style`` parameter directly accepts the ``COLUMN`` constant, since we imported it at the top of the protocol.
    - The ``start`` parameter accepts a nozzle name, representing the back-left nozzle in the layout, as a string. ``"A12"`` tells the pipette to use its rightmost column of nozzles for pipetting.
    - The ``tip_racks`` parameter tells the pipette which racks to use for tip tracking, just like when loading a pipette.

Now that the pipette is configured in column mode, pipetting actions will use a single column::

    # configured in COLUMN mode
    pipette.pick_up_tip()  # picks up A1-H1 from tip rack
    pipette.drop_tip()
    pipette.pick_up_tip()  # picks up A2-H2 from tip rack

.. warning::

    :py:meth:`.InstrumentContext.pick_up_tip` always accepts a ``location`` argument, regardless of nozzle configuration. Do not pass a value that would lead the pipette to line up over more unused tips than specified by the current layout. For example, setting ``COLUMN`` layout and then calling ``pipette.pick_up_tip(tip_rack["A2"])`` on a full tip rack will lead to unexpected pipetting behavior and potential crashes.

.. _partial-tip-rack-adapters:

Tip Rack Adapters
-----------------


Tip Pickup and Return Behavior
------------------------------

.. _pipette-volume-modes:

Volume Modes
============

The Flex 1-Channel 50 µL and Flex 8-Channel 50 µL pipettes must operate in a low-volume mode to accurately dispense very small volumes of liquid. Set the volume mode by calling :py:meth:`.InstrumentContext.configure_for_volume` with the amount of liquid you plan to aspirate, in µL::

    pipette50.configure_for_volume(1)
    pipette50.pick_up_tip()
    pipette50.aspirate(1, plate["A1"])
    
.. versionadded:: 2.15

Passing different values to ``configure_for_volume()`` changes the minimum and maximum volume of Flex 50 µL pipettes as follows:

.. list-table::
    :header-rows: 1
    :widths: 2 3 3
    
    * - Value
      - Minimum Volume (µL)
      - Maximum Volume (µL)
    * - 1–4.9
      - 1
      - 30
    * - 5–50
      - 5
      - 50

.. note::
    The pipette must not contain liquid when you call ``configure_for_volume()``, or the API will raise an error.
    
    Also, if the pipette is in a well location that may contain liquid, it will move upward to ensure it is not immersed in liquid before changing its mode. Calling ``configure_for_volume()`` *before* ``pick_up_tip()`` helps to avoid this situation.

In a protocol that handles many different volumes, it's a good practice to call ``configure_for_volume()`` once for each :py:meth:`.transfer` or :py:meth:`.aspirate`, specifying the volume that you are about to handle. When operating with a list of volumes, nest ``configure_for_volume()`` inside a ``for`` loop to ensure that the pipette is properly configured for each volume:

.. code-block:: python
    
    volumes = [1, 2, 3, 4, 1, 5, 2, 8]
    sources = plate.columns()[0]
    destinations = plate.columns()[1]
    for i in range(8):
        pipette50.configure_for_volume(volumes[i])
        pipette50.pick_up_tip()
        pipette50.aspirate(volume=volumes[i], location=sources[i])
        pipette50.dispense(location=destinations[i])
        pipette50.drop_tip()

If you know that all your liquid handling will take place in a specific mode, then you can call ``configure_for_volume()`` just once with a representative volume. Or if all the volumes correspond to the pipette's default mode, you don't have to call ``configure_for_volume()`` at all.
