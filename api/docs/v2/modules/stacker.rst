:og:description: How to use the Flex Stacker Module in a Python protocol. 

.. _stacker:

*******************
Flex Stacker Module
*******************

The Flex Stacker is an external module that provides automated labware storage. Each Flex supports up to four attached Stackers containing well plates, Flex tip racks, or reservoirs. The Stacker's shuttle moves labware from the stack to the deck for use during a protocol. 

The Stacker is represented in code by a ``StackerContext`` object that includes methods for storing and retrieving labware. You can also use helper commands in your protocol to calculate how many labware the Stacker can store. 

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

In this example, each Stacker has an attached shuttle that occupy deck slots A3 and C3. 

Adding Labware to the Stacker
==============================

Next, you'll need to define the *type* and amount of labware a Stacker will store. Throughout yor protocol, the Flex can automatically move labware, like well plates or tip racks, from inside the Stacker to the deck. 

Each Stacker can hold a labware stack of up to:

- 7 Flex tipracks (6 in the Stacker and 1 on the shuttle)
- 48 PCR plates 
- 16 deep well plates 

##TODO: update the above list with tested labware types ("like <specific load name>")

Use :py:meth:`~.StackerContext.set_stored_labware()` to configure the Stacker. You must call this function before adding or removing labware from the Stacker during a protocol. Only one type of labware can be stored in each Stacker at one time. 

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









