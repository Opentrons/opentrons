:og:description: How to select and apply a liquid class definition in Opentrons protocols.

.. _liquid-class-definitions:

Liquid Class Definitions
=========================

A liquid class definition specifies nearly all transfer behavior a Flex pipette will perform during a :py:meth:`.InstrumentContext.transfer_with_liquid_class`, :py:meth:`.InstrumentContext.distribute_with_liquid_class`, or :py:meth:`.InstrumentContext.consolidate_with_liquid_class`.

Let's take a look at a Flex P50 1-channel pipette transferring 30 µL of an ``aqueous`` liquid: 

## TODO: insert icons paired with text description for steps of this transfer. can also make this a transfer that performs every action.I already have a text description of a transfer in the Liquid Classes article- can keep both or cut the first to spend more time describing how to edit.   

The rest of this section details specific changes to transfer behavior for each liquid class. The transfer steps are listed in order the robot performs them. Advanced settings like mix, pre-wet tip, touch tip, and blowout are automatically disabled for liquid class transfers. 

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
        


      
    