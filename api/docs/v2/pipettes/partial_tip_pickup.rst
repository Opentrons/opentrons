:og:description: How to change the number of tips an Opentrons pipette uses.

.. _partial-tip-pickup:

******************
Partial Tip Pickup
******************

The 96-channel pipette occupies both pipette mounts on Flex, so it's not possible to attach another pipette at the same time. Partial tip pickup lets you perform some of the same actions that you would be able to perform with a second pipette. As of version 2.16 of the API, you can configure the 96-channel pipette to pick up a single column of tips, similar to the behavior of an 8-channel pipette.

Nozzle Layout
=============

Use the :py:meth:`.configure_nozzle_layout` method to choose how many tips the 96-channel pipette will pick up. The method's ``style`` parameter accepts special layout constants. You must import these constants at the top of your protocol, or you won't be able to configure the pipette for partial tip pickup.

At minimum, import the API from the ``opentrons`` package::

    from opentrons import protocol_api

Then when you call ``configure_nozzle_layout`` later in your protocol, you can set ``style=protocol_api.COLUMN``.

For greater convenience, also import the individual layout constants that you plan to use in your protocol::

    from opentrons.protocol_api import COLUMN, ALL

Then when you call ``configure_nozzle_layout`` later in your protocol, you can set ``style=COLUMN``. 

Here is the start of a protocol that performs both imports, loads a 96-channel pipette, and sets it to pick up a single column of tips.

.. code-block:: python
    :substitutions:

    from opentrons import protocol_api
    from opentrons.protocol_api import COLUMN, ALL

    requirements = {"robotType": "Flex", "apiLevel": "|apiLevel|"}

    def run(protocol: protocol_api.ProtocolContext):
        column_rack = protocol.load_labware(
            load_name="opentrons_flex_96_tiprack_1000ul",
            location="D3"
        )
        trash = protocol.load_trash_bin("A3")
        pipette = protocol.load_instrument("flex_96channel_1000")
        pipette.configure_nozzle_layout(
            style=COLUMN,
            start="A12",
            tip_racks=[column_rack]
        )

.. versionadded:: 2.16

Let's unpack some of the details of this code.

First, we've given a special name to the tip rack, ``column_rack``. You can name your tip racks whatever you like, but if you're performing full pickup and partial pickup in the same protocol, you'll need to keep them separate. See :ref:`partial-tip-rack-adapters` below.

Next, we load the 96-channel pipette. Note that :py:meth:`.load_instrument` only has a single argument. The 96-channel pipette occupies both mounts, so ``mount`` is omissible. The ``tip_racks`` argument is always optional. But it would have no effect to declare it here, because every call to ``configure_nozzle_layout()`` resets the pipette's :py:obj:`.InstrumentContext.tip_racks` property.

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
=================

You can use both partial and full tip pickup in the same protocol. This requires having some tip racks directly on the deck, and some tip racks in the tip rack adapter.

Do not use a tip rack adapter when performing partial tip pickup. Instead, place the tip rack on the deck. During partial tip pickup, the 96-channel pipette lowers onto the tip rack in a horizontally offset position. If the tip rack were in its adapter, the pipette would collide with the adapter's posts, which protrude above the top of the tip rack. If you configure the pipette for partial pickup and then call ``pick_up_tip()`` on a tip rack that's loaded onto an adapter, the API will raise an error.

On the other hand, you must use the tip rack adapter for full tip pickup. If the 96-channel pipette is in a full layout, either by default or by configuring ``style=ALL``, and you then call ``pick_up_tip()`` on a tip rack that's not in an adapter, the API will raise an error.

When switching between full and partial pickup, you may want to organize your tip racks into lists, depending on whether they're loaded on adapters or not.

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

Now, when you configure the nozzle layout, you can reference the appropriate list as the value of ``tip_racks``::

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
    
This keeps tip tracking consistent across each type of pickup. And it reduces the risk of errors due to the incorrect presence or absence of a tip rack adapter.


Tip Pickup and Conflicts
========================

The horizontally offset position of the 96-channel pipette during partial tip pickup  places restrictions on where you can put other tall labware on the deck. The restrictions vary depending on the layout. For column layouts, Opentrons recommends using column 12.

The API will raise errors for potential labware crashes when using a column partial configuration. Nevertheless, it's a good idea to do the following when working with partial tip pickup:

    - Plan your deck layout carefully. Make a diagram and visualize everywhere the pipette will travel.
    - Simulate your protocol and compare the run preview to your expectations of where the pipette will travel.
    - Perform a dry run with only tip racks on the deck. Have the Emergency Stop Pendant handy in case you see an impending crash.


Using Column 12
---------------

All of the examples in this section will use a 96-channel pipette configured to pick up tips with column 12::

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
--------------

If your application can't accommodate a deck layout that works well with column 12, you can configure the 96-channel pipette to pick up tips with column 1::

    pipette.configure_nozzle_layout(
        style=COLUMN,
        start="A1",
    )

The major drawback of this configuration, compared to using column 12, is that tip tracking is not available with column 1. You must always specify a ``location`` parameter for :py:meth:`.pick_up_tip`. This *requires careful tip tracking* so you don't place the pipette over more than a single column of unused tips at once. You can write some additional code to manage valid tip pickup locations, like this::

    tip_rack = protocol.load_labware("opentrons_flex_96_tiprack_1000ul", "C1")
    pipette.configure_nozzle_layout(style=COLUMN, start="A1")
    row_a = tip_rack.rows()[0]
    pipette.pick_up_tip(row_a.pop())  # pick up A12-H12
    pipette.drop_tip()
    pipette.pick_up_tip(row_a.pop())  # pick up A11-H11
    pipette.drop_tip()

This code first constructs a list of all the wells in row A of the tip rack. Then, when picking up a tip, instead of referencing one of those wells directly, the ``location`` is set to ``row_a.pop()``. This uses the built-in :py:meth:`pop` method to get the last item from the list and remove it from the list. If you keep using this approach to pick up tips, you'll get an error once the tip rack is empty — not from the API, but from Python itself, since you're trying to ``pop`` an item from an empty list.

Finally, you can't access the rightmost columns in labware in column 3, since they are beyond the movement limit of the pipette. The exact number of inaccessible columns varies by labware type. Any well that is within 28 mm of the right edge of the slot is inaccessible in a column 12 configuration. Call ``configure_nozzle_layout()`` again to switch to a column 1 layout if you need to pipette in that area.
