:og:description: How to use the Flex Stacker Module in a Python protocol. 

.. _stacker:

*******************
Flex Stacker Module
*******************

The Flex Stacker is an external module that provides automated storage of well plates, Flex tip racks, or reservoirs. The Stacker's attached shuttle moves labware from the stack to the deck for use during a protocol. 

The Stacker is represented in code by a ``StackerContext`` object that includes methods for storing and retrieving labware. You can also use helper commands in your protocol to calculate how many labware the Stacker can store at once. 

Loading and Deck Slots
========================

Up to four Stacker Modules can be attached to the right side of your Flex, creating deck slots A4--D4. Each Stacker occupies a deck slot in column 4, with the shuttle in column 3. 

Start by loading each Stacker as you would any other module: 

.. code-block:: python
    stacker_1 = protocol.load_module(
        module_name="flexStackerModuleV1",
        location="A4"
    )
    stacker_2 = protocol.load_module(
        module_name="flexStackerModuleV1",
        location="C4"
    )

Each Stacker occupies a deck slot in column 4, with the attached shuttle in column 3. In this example, Stacker shuttles occupy deck slots A3 and C3. 

Adding Labware to the Stacker
==============================

Next, you'll need to define the *type* and amount of labware the Stacker will store. Throughout yor protocol, the Flex automatically moves labware, like well plates or tip racks, from inside the Stacker to the deck. 

Each Stacker can hold a labware stack of up to:

- 7 Flex tipracks (6 in the Stacker and 1 on the shuttle)
- 48 PCR plates, like <tested load_name>
- 16 deep well plates, like <tested load_name>

You'll need to use :py:meth:`~.StackerContext.set_stored_labware()` to configure the Stacker before adding or removing labware during a protocol. Only one type of labware can be stored in each Stacker at one time. 

.. code-block:: python

    stacker_1.set_stored_labware(
        load_name="opentrons_flex_96_tiprack_200ul",
        count=6,
        lid="opentrons_flex_tiprack_lid"
    )
    stacker_2.set_stored_labware(
        load_name="opentrons_96_wellplate_200ul_pcr_full_skirt",
        count=12
    )

In this example, `stacker_1` is configured to hold 6 Flex tip racks, each with a compatible lid. Flex tip racks must have lids to be properly stored in the Stacker. `stacker_2` is configured to hold 12 PCR plates without lids. 

Configuring the Stacker assigns a labware stack to this deck slot. You can use the Stacker and shuttle as a normal deck slot earlier in your protocol with :py:meth:`~.StackerContext.load_labware()`. You'll need to move this labware elsewhere on the deck before configuring and using the Stacker for storage.  

.. note:: 
    Different labware have varying `z` heights. One well plate might be 2 mm taller than another, affecting the number of plates the Stacker can store at once. The API includes helper commands to calculate how many labware the Stacker can hold: 

    - `.ModuleContext.get_max_storable_labware()`
    - `.ModuleContext.get_current_storable_labware()` 
    - `.ModuleContext.get_stored_labware()` 
    
    Use ``get_max_storable_labware()`` or ``get_current_storable_labware()`` to calculate the maximum or current number of labware the Stacker can store, based on either the labware definition or the Stacker's current storage conditions.

    Like other hardware modules, the Stacker doesn't verify the labware you place inside it. If your Stacker is configured correctly, you can use ``get_stored_labware()`` throughout your protocol to check an updated list of labware stored inside. 

Using Stacker Labware
======================
During a protocol, use `~.ModuleContext.stacker.retrieve()` to automatically access a single piece of labware to use on the Flex deck. 

.. code-block:: python

    stacker_1.retrieve()
    protocol.move_labware(
        labware="opentrons_flex_96_tiprack_200ul",
        new_location="B2",
        use_gripper="True"
    )
Here, the Flex tip rack at the bottom of the labware stack is moved to the shuttle in slot A3. Then, use the Flex Gripper or manually move the new tip rack elsewhere on the deck. 

To add more labware to a Stacker, use `~.ModuleContext.stacker.store()`::

    protocol.move_labware(
        labware="opentrons_96_wellplate_200ul_pcr_full_skirt",
        new_location="C3",
        use_gripper="True"
    )
    stacker_2.store()

After placing labware on the shuttle in slot C3, ``stacker_2`` stores another well plate on the bottom of the stack. 

To mark a Stacker as completely full or empty, use `~.ModuleContext.stacker.fill()` or `~.StackerContext.stacker.empty()`::

    # mark the second Stacker as empty
    stacker_2.empty()

    # configure the second Stacker and fill with new labware
    stacker_2.set_stored_labware(
        load_name="nest_12_reservoir_15ml",
        count=8
    )
    stacker_2.fill(8, "Add 8 reservoirs to stacker_2.")

Both ``fill()`` and ``empty()`` pause the protocol and allow you to manually add or remove labware from the Stacker. Each method assumes labware is loaded or moved ``off_deck``. 













