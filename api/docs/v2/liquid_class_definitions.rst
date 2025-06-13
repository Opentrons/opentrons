:og:description: Properties that make up liquid class definitions in Opentrons protocols. 

.. _liquid-class-definitions: 

*************************
Liquid Class Definitions
*************************

A *liquid class definition* specifies nearly all transfer behavior a Flex pipette will perform during a :py:meth:`.InstrumentContext.transfer_with_liquid_class`, :py:meth:`.InstrumentContext.distribute_with_liquid_class`, or :py:meth:`InstrumentContext.consolidate_with_liquid_class`. Properties, like aspirate flow rate, submerge speed, or dispense position, are required in every liquid class definition. 

To create your own liquid class... ## TODO: maybe add the liquid class schema here. Or, direct users to github. Adding here could make this easier for intermediate users. 
## TODO: give examples of which properties are absolutely required. for example, users don't need to specify optional properties like touch tip and mix that can be disabled. multi-dispense isn't required unless users plan to use distribute with multiple dispenses. 

The rest of this section details specific changes to transfer behavior for each liquid class. The transfer steps are listed in the order the robot performs them. Advanced settings like mix, pre-wet tip, touch tip, and blowout are automatically disabled in Opentrons-verified liquid class definitions. 

To use the tables below, select your liquid class: :ref:`aqueous`, :ref:`viscous`, or :ref:`volatile`. Then, click different tabs to view your pipette and tip combination. 

In a liquid class transfer, flow rates and air gap or push out volumes vary based on the pipette and tip combination used in your protocol. Let's say you use a Flex P1000 1-channel pipette and Flex 200 µL tips to aspirate a volatile liquid. The transfer volume specifies the flow rate: 
* 7 µL/sec to aspirate 5 µL
* 50 µL/sec to aspirate 50 µL
* 200 µL/sec to aspirate 200 µL 

When your aspirate volume falls in between, like 100 µL, a linear interpolation automatically determines the flow rate. 

.. _aqueous: 

Aqueous
--------
The Opentrons-verified ``aqueous`` liquid class is the Flex system default and is based on deionized water. 

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
--------
The Opentrons-verified viscous liquid class is based on 50% glycerol. 

.. _volatile: 

Volatile
--------
The Opentrons-verified volatile liquid class is based on 80% ethanol. 
