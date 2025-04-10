:og:description: How to select and apply a liquid class definition in Opentrons protocols.

.. _liquid-classes: 

***************
Liquid Classes 
***************

At the core of your protocol are liquid transfers, the liquid handling steps the robot performs to move liquids in labware. 

Accounting for properties of a liquid, like viscosity or volatility, can improve pipetting accuracy on the Flex. You can use liquid classes in your protocols to automatically define optimized transfer behavior based on a specific liquid. For example, a slower flow rate can improve pipetting for a viscous liquid, and an air gap can prevent a volatile liquid from dripping onto the deck. 

Each Opentrons-verified liquid class is defined by a set of properties: 

.. list-table::
    :header-rows: 1

    * - Property
      - Description
    * - Submerge position, speed
      - 
        * Position where the pipette begins before submerging into the liquid. 
        * Speed the pipette submerges into the liquid at to prevent air bubbles from forming. 
    * - Delay
      -
        * Time the pipette delays before submerging into or retracting from liquid. 
        * Time the pipette delays before or after an aspirate or dispense, or after a push out. 
    * - Mix
      - Mix liquid inside a well before an aspirate or after a dispense.
    * - Pre-wet tip
      - Pre-wet tip before an aspirate to prevent droplets from sticking to the pipette. 
    * - Flow rate*
      - Speed the pipette aspirates or dispenses liquid at. 
    * - Retract position, speed
      - 
        * Position the pipette moves to in order to retract from the liquid. 
        * Speed the pipette retracts at to prevent droplets from sticking to the pipette. 
    * - Push out*
      - Volume of air the pipette dispenses to ensure all liquid leaves the tip. 
    * - Touch tip
      - Pipette touches the tip to the sides of a well to remove droplets from the pipette. 
    * - Air gap*
      - Pipette adds an air gap after an aspirate or dispense to prevent liquid from dripping onto the deck.
    * - Blowout
      - Larger volume of air the pipette dispenses to ensure all liquid leaves the tip. 

A :ref:`liquid class definition <liquid-class-definitions>` specifies values for each property based on the liquid class. When you transfer with a liquid class in your protocol, transfer behavior based on each property is automatically applied. For example, when you use `.InstrumentContext.transfer_with_liquid_class` to transfer a viscous liquid, your Flex pipette automatically submerges more slowly into the liquid to prevent air bubbles from forming. 

Properties marked with an asterisk, shown above, are determined by your pipette, tip, and volume combinations. For more information, see :ref:`liquid-class-definitions`. 

.. _opentrons-verified-liquid-classes:

Opentrons-verified Liquid Classes
=================================

Opentrons-verified liquid classes are liquid class definitions based on the properties of a specific liquid: 

.. list-table:: 
    :header-rows: 1

    * - Opentrons-verified liquid class
      - Description
      - Load name
    * - Aqueous
      - 
        * Based on deionized water
        * The system default
      - ``water``
    * - Volatile
      - Based on 80% ethanol
      - ``ethanol_80``
    * - Viscous
      - Based on 50% glycerol
      - ``glycerol_50``

You can define and specify liquid classes in your protocols to automatically apply transfer behavior like flow rate, submerge and retract speeds, and advanced settings optimized for your liquid class.

.. _selecting-a-liquid-class:

Selecting a Liquid Class
========================

You'll use a :ref:`liquid class definition <liquid-class-definitions>` in your protocol to optimize transfer behavior based not only on liquid properties, but on your chosen Flex pipette and tips. Start by defining the tips, trash, pipette, and labware used in your transfers. Then, use :py:meth:`.ProtocolContext.define_liquid_class` to select a liquid class. 

.. code-block:: python
    :substitutions:

    from opentrons import protocol_api

    requirements = {"robotType": "Flex", "apiLevel": "|2.23|"}

    # define tips, trash, and pipette
    def run(protocol: protocol_api.ProtocolContext):
        tiprack1 = protocol_context.load_labware("opentrons_flex_96_tiprack_50ul", "D3")
        trash = protocol_context.load_trash_bin("A3")
        pipette_50 = protocol_context.load_instrument("flex_1channel_50", "left, tip_racks=[tiprack1]")
    
    ## load source and destination labware

        nest_plate = protocol_context.load_labware("nest_96_wellplate_200ul_flat", "C3")
        arma_plate = protocol_context.load_labware("armadillo_96_wellplate_200ul_pcr_full_skirt","C2")

    # select liquid classes
     
        liquid_1 = protocol_context.define_liquid_class("glycerol_50")
        liquid_2 = protocol_context.define_liquid_class("ethanol_80")
        liquid_3 = protocol_context.define_liquid_class("glycerol_50")


You'll need to add a label to liquid classes in your protocol, like ``liquid_1``. Not only does this help you keep track of multiple liquids of the same class in a protocol, but ``transfer_with_liquid_class()`` requires a label previously defined in your protocol instead of a liquid class load name, like ``glycerol_50``. 

.. _liquid-class-transfers:

Liquid Class Transfers
======================

Use ``transfer_with_liquid_class`` to transfer an aqueous, volatile, or viscous liquid defined in your protocol. Here, you'll specify your liquid, volume, source, and destination wells, tip handling preferences, and the trash location. 

TODO: add in transfer_with_liquid_class py meth references when updated

.. code-block:: python

    pipette_50.transfer_with_liquid_class(
        liquid_class=liquid_1, 
        volume=50,
        source=nest_plate.rows()[0],
        dest=arma_plate.rows()[0],
        new_tip="always", 
        trash_location=trash)

The Flex P50 1-channel pipette will transfer 50 µL of your viscous ``liquid_1`` from each well of the  source plate to each well of the destination plate. A new tip is used for each well transfer, and each tip is dropped in the trash bin loaded in slot A3. 

The ``glycerol_50`` viscous liquid class definition accounts for all other transfer behavior, like flow rate, whether or not to add an air gap or delay, and submerge and retract speeds. For each aspirate, the pipette: 

* Moves to the submerge start position of 2 mm above the top of the source well at 4 mm/sec.
* Submerges into ``liquid_1`` at 4 mm/sec to the aspirate start position of 2 mm above the bottom of the well. 
* Aspirates 50 µL of ``liquid_1`` at 50 µL/sec with a correction by volume of -0.2 µL. 
* Delays for 1 sec after aspirating. 
* Moves to the retract position of 2 mm above the top of the well at 4 mm/sec. 

And for each dispense, the pipette: 

* Moves to the submerge start position of 2 mm above the top of the destination well at 4 mm/sec. 
* Moves to the dispense position of 2 mm above the top of the destination well at 4 mm/sec. 
* Dispense 50 µL of ``liquid_1`` at 25 µL/sec with a correction by volume of -0.2 µL. 
* Pushes out a volume of air equivalent to 3.9 µL to ensure all liquid leaves the tip, and delays for 0.5 sec afterward. 
* Moves to the retract position of 2 mm above the top of the well at 4 mm/sec. 

In many cases, the liquid class definition represents fine-tuned changes optimized for each liquid class. If you instead use the Flex P50 1-channel pipette to transfer 50 µL of a volatile liquid, transfer behavior would include: 
* Submerging into and retracting from the volatile ``liquid_2`` at 100 mm/sec.
* Adding larger air gaps after aspirating *and* dispensing to prevent dripping onto the deck.
* Aspirating and dispensing at 30 µL/sec with a larger correction by volume. 
* Pushing out a larger volume of air to ensure all liquid leaves the tip. 

Not all transfer behavior is easily visible. See the next section for a full list of changes based on liquid class, pipette, and tip combination. For more detail on individual transfer settings, see :ref:`liquid-control`. 

.. _liquid-class-definitions:

Liquid Class Definitions
=========================

This section includes specific changes to transfer behavior for each liquid class. The transfer steps are listed in order the robot performs them. Advanced settings like mix, pre-wet tip, touch tip, and blowout are automatically disabled for liquid class transfers. 

To use the tables below, select your liquid class: :ref:`aqueous`, :ref:`viscous`, or :ref:`volatile`. Then, use the tabs feature to find your pipette and tip combination. 

The flow rates and air gap or push out volumes used in a liquid class transfer vary based on the pipette and tip combination in your protocol. Let's say you use a Flex P1000 1-channel pipette and Flex 200 µL tips to aspirate a volatile liquid. The transfer volume specifies the flow rate: 
* 7 µL/sec to aspirate 5 µL
* 50 µL/sec to aspirate 50 µL
* 200 µL/sec to aspirate 200 µL 

When you aspirate a liquid between these three volumes, like 100 µL, a linear interpolation automatically determines the flow rate. 

.. _aqueous: 

Aqueous 
-------
.. tabs::

    .. tab:: Flex P50 1-channel 

      +----------------+------------------------------+---------------------------------------------------+
      |                |         Transfer Step        |               Flex 96 Tiprack 50 µL               |
      +================+==============================+===================================================+
      |    Aspirate    |        Submerge speed        |                    100 mm/sec                     |
      |                +------------------------------+---------------------------------------------------+
      |                | Aspirate flow rate by volume |       - Default: 50 µL/sec- 1 µL: 35 µL/sec       |
      |                |                              |       - 10 µL: 24 µL/sec- 50 µL: 35 µL/sec        |
      |                +------------------------------+---------------------------------------------------+
      |                |     Correction by volume     |                         --                        |
      |                +------------------------------+---------------------------------------------------+
      |                |    Delay after aspirating    |                      0.2 sec                      |
      |                +------------------------------+---------------------------------------------------+
      |                |         Retract speed        |                     50 mm/sec                     |
      |                +------------------------------+---------------------------------------------------+
      |                |    Delay after retracting    |                        --                         |
      |                +------------------------------+---------------------------------------------------+
      |                |       Air gap by volume      | - Default: 0.1 µL- 1-49.9 µL: 0.1 µL- 50 µL: 0 µL |
      +----------------+------------------------------+---------------------------------------------------+
      |    Dispense    |        Submerge speed        |                     100 mm/sec                    |
      |                +------------------------------+---------------------------------------------------+
      |                | Dispense position            | 2 mm above the well bottom                        |
      |                +------------------------------+---------------------------------------------------+
      |                | Dispense flow rate by volume | Default: 50 µL                                    |
      |                +------------------------------+---------------------------------------------------+
      |                | Push out by volume           | - Default: 2 µL- 1-4.999 µL: 7 µL- 5-50 µL: 2 µL  |
      |                +------------------------------+---------------------------------------------------+
      |                | Delay after push out         | 0.2 sec                                           |
      |                +------------------------------+---------------------------------------------------+
      |                | Retract speed                | 50 mm/sec                                         |
      |                +------------------------------+---------------------------------------------------+
      |                | Delay after retracting       | --                                                |
      |                +------------------------------+---------------------------------------------------+
      |                | Air gap by volume            | - Default: 0.1µL- 1-49.9 µL: 0.1 µL- 50 µL: 0 µL  |
      +----------------+------------------------------+---------------------------------------------------+
      | Multi-dispense | Submerge speed               | 100 mm/sec                                        |
      |                +------------------------------+---------------------------------------------------+
      |                | Dispense position            | 2 mm below the well top                           |
      |                +------------------------------+---------------------------------------------------+
      |                | Dispense flow rate by volume | 50 µL/sec                                         |
      |                +------------------------------+---------------------------------------------------+
      |                | Delay after dispensing       | 0.2 sec                                           |
      |                +------------------------------+---------------------------------------------------+
      |                | Retract speed                | 50 mm/sec                                         |
      |                +------------------------------+---------------------------------------------------+
      |                | Delay after retracting       | --                                                |
      |                +------------------------------+---------------------------------------------------+
      |                | Air gap by volume            | - Default: 0.1 µL- 1-49.9 µL:0.1 µL- 50 µL: 0 µL  |
      +----------------+------------------------------+---------------------------------------------------+


.. tabs:: 

  .. tab:: Flex P50 8-channel

    +----------------+------------------------------+----------------------------------------------------------------+
    |                |         Transfer Step        |                      Flex 96 Tiprack 50 µL                     |
    +================+==============================+================================================================+
    |    Aspirate    |        Submerge speed        |                           100 mm/sec                           |
    |                +------------------------------+----------------------------------------------------------------+
    |                | Aspirate flow rate by volume |              - Default: 50 µL/sec- 1 µL: 35 µL/sec             |
    |                |                              |              - 10 µL: 24 µL/sec- 50 µL: 35 µL/sec              |
    |                +------------------------------+----------------------------------------------------------------+
    |                |     Correction by volume     |                               --                               |
    |                +------------------------------+----------------------------------------------------------------+
    |                |    Delay after aspirating    |                             0.2 sec                            |
    |                +------------------------------+----------------------------------------------------------------+
    |                |         Retract speed        |                            50 mm/sec                           |
    |                +------------------------------+----------------------------------------------------------------+
    |                |    Delay after retracting    |                               --                               |
    |                +------------------------------+----------------------------------------------------------------+
    |                |       Air gap by volume      |        - Default: 0.1 µL- 1-49.9 µL: 0.1 µL- 50 µL: 0 µL       |
    +----------------+------------------------------+----------------------------------------------------------------+
    |    Dispense    |        Submerge speed        |                           100 mm/sec                           |
    |                +------------------------------+----------------------------------------------------------------+
    |                | Dispense position            | 2 mm above the well bottom                                     |
    |                +------------------------------+----------------------------------------------------------------+
    |                | Dispense flow rate by volume | Default: 50 µL                                                 |
    |                +------------------------------+----------------------------------------------------------------+
    |                | Push out by volume           | - Default: 2 µL- 1-4.999 µL: 7 µL- 5-50 µL: 2 µL - 50 µL: 3 µL |
    |                +------------------------------+----------------------------------------------------------------+
    |                | Delay after push out         | 0.3 sec                                                        |
    |                +------------------------------+----------------------------------------------------------------+
    |                | Retract speed                | 50 mm/sec                                                      |
    |                +------------------------------+----------------------------------------------------------------+
    |                | Delay after retracting       | --                                                             |
    |                +------------------------------+----------------------------------------------------------------+
    |                | Air gap by volume            | - Default: 0.1µL- 1-49.9 µL: 0.1 µL- 50 µL: 0 µL               |
    +----------------+------------------------------+----------------------------------------------------------------+
    | Multi-dispense | Submerge speed               | 100 mm/sec                                                     |
    |                +------------------------------+----------------------------------------------------------------+
    |                | Dispense position            | 2 mm above the well bottom                                     |
    |                +------------------------------+----------------------------------------------------------------+
    |                | Dispense flow rate by volume | 50 µL/sec                                                      |
    |                +------------------------------+----------------------------------------------------------------+
    |                | Delay after dispensing       | 0.3 sec                                                        |
    |                +------------------------------+----------------------------------------------------------------+
    |                | Retract speed                | 50 mm/sec                                                      |
    |                +------------------------------+----------------------------------------------------------------+
    |                | Delay after retracting       | --                                                             |
    |                +------------------------------+----------------------------------------------------------------+
    |                | Air gap by volume            | - Default: 0.1 µL- 1-49.9 µL:0.1 µL- 50 µL: 0 µL               |
    +----------------+------------------------------+----------------------------------------------------------------+

    
.. _viscous: 

Viscous 
-------

.. _volatile: 

Volatile 
---------
        


      
    
