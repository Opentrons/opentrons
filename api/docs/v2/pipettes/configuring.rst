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
        column_rack = protocol.load_labware(
            load_name="opentrons_flex_96_tiprack_1000ul",
            location="D3"
        )
        pipette = protocol.load_instrument("flex_96channel_1000")
        pipette.configure_nozzle_layout(
            style=COLUMN,
            start="A12",
            tip_racks=[column_rack]
        )

.. versionadded:: 2.16

Let's unpack some of the details of this code.

First, we've given a special name to the tip rack, ``column_rack``. You can name your tip racks whatever you like, but if you're performing full pickup and partial pickup in the same protocol, you'll need to keep them separate. See :ref:`partial-tip-rack-adapters` below.

Next, we load the 96-channel pipette. Note that ``load_instrument()`` only has a single argument. The 96-channel pipette occupies both mounts, so ``mount`` is omissible. The ``tip_racks`` argument is always optional. But it would have no effect to declare it here, because every call to ``configure_nozzle_layout()`` resets the pipette's :py:obj:`.InstrumentContext.tip_racks` property.

Finally, we configure the nozzle layout, with three arguments.

    - The ``style`` parameter directly accepts the ``COLUMN`` constant, since we imported it at the top of the protocol.
    - The ``start`` parameter accepts a nozzle name, representing the back-left nozzle in the layout, as a string. ``"A12"`` tells the pipette to use its rightmost column of nozzles for pipetting.
    - The ``tip_racks`` parameter tells the pipette which racks to use for tip tracking, just like :ref:`adding tip racks <pipette-tip-racks>` when loading a pipette.

In this configuration, pipetting actions will use a single column::

    # configured in COLUMN mode
    pipette.pick_up_tip()  # picks up A1-H1 from tip rack
    pipette.drop_tip()
    pipette.pick_up_tip()  # picks up A2-H2 from tip rack

.. warning::

    :py:meth:`.InstrumentContext.pick_up_tip` always accepts a ``location`` argument, regardless of nozzle configuration. Do not pass a value that would lead the pipette to line up over more unused tips than specified by the current layout. For example, setting ``COLUMN`` layout and then calling ``pipette.pick_up_tip(tip_rack["A2"])`` on a full tip rack will lead to unexpected pipetting behavior and potential crashes.

.. _partial-tip-rack-adapters:

Tip Rack Adapters
-----------------

Partial tip pickup requires a tip rack that is placed directly in a deck slot. When picking up fewer than 96 tips, the 96-channel pipette lowers onto the tip rack in a horizontally offset position. If the tip rack were in the tip rack adapter, the pipette would collide with the adapter's posts, which protrude above the top of the tip rack. If you configure a partial nozzle layout and then call ``pick_up_tip()`` on a tip rack that's loaded onto an adapter, the API will raise an error.

On the other hand, full tip pickup requires the tip rack adapter. If the 96-channel pipette is in a full layout, either by default or by configuring ``style=ALL``, and you then call ``pick_up_tip()`` on a tip rack that's not in an adapter, the API will raise an error.

If your protocol switches between full and partial pickup, you may want to organize your tip racks into lists, depending on whether they're loaded on adapters or not.

.. code-block:: python

    tips_1 = protocol.load_labware(
        "opentrons_flex_96_tiprack_1000ul", "C1"
    )
    tips_2 = protocol.load_labware(
        "opentrons_flex_96_tiprack_1000ul", "D1"
    )
    tips_3 = protocol.load_labware(
        "opentrons_flex_96_tiprack_1000ul", "C3",
        adapter="opentrons_flex_96_tiprack_adapter"
    )
    tips_4 = protocol.load_labware(
        "opentrons_flex_96_tiprack_1000ul", "D3",
        adapter="opentrons_flex_96_tiprack_adapter"
    )

    partial_tip_racks = [tips_1, tips_2]
    full_tip_racks = [tips_3, tips_4]

Now, when you configure the nozzle layout, you can use the appropriate list as the value of ``tip_racks``::

    pipette.configure_nozzle_layout(
        style=COLUMN,
        start="A12",
        tip_racks=partial_tip_racks
    )
    # partial pipetting commands go here

    pipette.configure_nozzle_layout(
        style=ALL,
        tip_racks=full_tip_racks
    )
    pipette.pick_up_tip()  # picks up full rack in C1


Tip Pickup and Conflicts
------------------------

The horizontally offset position of the 96-channel pipette during partial tip pickup also places restrictions on where you can put other tall labware on the deck. 

Using Column 12
^^^^^^^^^^^^^^^

All of the examples in this section will use a 96-channel pipette configured to pick up tips with column 12. This is the *only* partial nozzle configuration for which the API will automatically detect labware placed in locations that could cause collisions, and raise errors to prevent them.

.. code-block:: python

    pipette.configure_nozzle_layout(
        style=COLUMN,
        start="A12",
    )

When using column 12, the pipette overhangs space to the left of wherever it is picking up tips or pipetting. For this reason, it's a good idea to organize tip racks front to back on the deck. If you place them side by side, the rack to the right will be inaccessible. For example, let's load three tip racks in the front left corner of the deck::

    tips_C1 = protocol.load_labware("opentrons_flex_96_tiprack_1000ul", "C1")
    tips_D1 = protocol.load_labware("opentrons_flex_96_tiprack_1000ul", "D1")
    tips_D2 = protocol.load_labware("opentrons_flex_96_tiprack_1000ul", "D2")

Now the pipette will be able to access the racks in column 1 only. ``pick_up_tip(tips_D2["A1"])`` will raise an error due to the tip rack immediately to its left, in slot D1. There a couple of ways to avoid this error:

    - Load the tip rack in a different slot, with no tall labware to its left.
    - Use all the tips in slot D1 first, and then use :py:meth:`.move_labware` to make space for the pipette before picking up tips from D2.

You would get a similar error trying to aspirate from or dispense into a well plate in slot D3, since there is a tip rack to the left.

.. tip::

    When using column 12 for partial tip pickup and pipetting, generally organize your deck with the shortest labware on the left side of the deck, and the tallest labware on the right side.

Using Column 1
^^^^^^^^^^^^^^

If your application can't accommodate a deck layout that works well with column 12, you can configure the 96-channel pipette to pick up tips with column 1::

    pipette.configure_nozzle_layout(
        style=COLUMN,
        start="A1",
    )

This configuration has several drawbacks compared to using column 12.

First, tip tracking is not available with column 1. You must always specify a ``location`` parameter for :py:meth:`.pick_up_tip`. This *requires careful tip tracking* so you don't place the pipette over more than a single column of unused tips at once. You can write some additional code to manage valid tip pickup locations, like this::

    tip_rack = protocol.load_labware("opentrons_flex_96_tiprack_1000ul", "C1")
    pipette.configure_nozzle_layout(style=COLUMN, start="A1")
    row_a = tiprack.rows()[0]
    pipette.pick_up_tip(row_a.pop())  # pick up A12-H12
    pipette.drop_tip()
    pipette.pick_up_tip(row_a.pop())  # pick up A11-H11
    pipette.drop_tip()

This code first constructs a list of all the wells in row A of the tip rack. Then, when picking up a tip, instead of referencing one of those wells directly, the ``location`` is set to ``row_a.pop()``. This uses the built-in :py:meth:`pop` method to get the last item from the list and remove it from the list. If you keep using this approach to pick up tips, you'll get an error once the tip rack is empty — not from the API, but from Python itself, since you're trying to ``pop`` an item from an empty list.

While you can easily add tip tracking to a column 1 configuration, you will still be operating without the collision detection the API has for column 12. 

.. warning::

    The API *will not* raise errors for potential labware crashes when using a column 1 partial configuration. If you must use one:

    - Plan your deck layout carefully. Make a diagram and visualize everywhere the pipette will travel.
    - Simulate your protocol and compare the run preview to your expectations of where the pipette will travel.
    - Perform a dry run with only tip racks on the deck. Have the Emergency Stop Pendant handy in case you see an impending crash.

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
