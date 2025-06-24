:og:description: Properties that make up liquid class definitions in Opentrons protocols. 

.. _liquid-class-definitions: 

*************************
Liquid Class Definitions
*************************

A *liquid class definition* specifies nearly all transfer behavior a Flex pipette will perform during a :py:meth:`.InstrumentContext.transfer_with_liquid_class`, :py:meth:`.InstrumentContext.distribute_with_liquid_class`, or :py:meth:`.InstrumentContext.consolidate_with_liquid_class`. Properties, like aspirate flow rate, submerge speed, or dispense position, are required in every liquid class definition. 

This section details specific changes to transfer behavior for each Opentrons-verified liquid class. The transfer steps are listed in the order the robot performs them. Advanced settings like mix, pre-wet tip, touch tip, and blowout are automatically disabled in Opentrons-verified liquid class definitions. 

.. note:: 
    You can customize a liquid class definition for your workflow by:
    * Customizing individual properties of an Opentrons-verified liquid class definition. 
    * Creating your own liquid class definition from scratch. 
  
  For more information, see :ref:`customizing-liquid-classes`. 


To use the tables below, select your liquid class: :ref:`aqueous`, :ref:`viscous`, or :ref:`volatile`. Then, click different tabs to view your pipette and tip combination. 

In a liquid class transfer, flow rates and air gap or push out volumes vary based on the pipette and tip combination used in your protocol. Let's say you use a Flex P1000 1-channel pipette and Flex 200 µL tips to aspirate a volatile liquid. The transfer volume specifies the flow rate: 
* 7 µL/sec to aspirate 5 µL
* 50 µL/sec to aspirate 50 µL
* 200 µL/sec to aspirate 200 µL 

When your aspirate volume falls in between, like 100 µL, a linear interpolation automatically determines the flow rate. 


.. _aqueous: 

Aqueous
--------
The Opentrons-verified ``aqueous`` liquid class is based on deionized water.

.. tabs::

    .. tab:: Flex P50 1-channel

        +------------------------------+---------------------+
        |           Behavior           |        50 µL        |
        +==============================+=====================+
        |        Submerge speed        |     100 mm/sec      |
        +------------------------------+---------------------+
        | Aspirate flow rate by volume | - 1 µL: 35 µL/sec   |
        |                              | - 10 µL: 24 µL/sec  |
        |                              | - 50 µL: 35 µL/sec  |
        +------------------------------+---------------------+
        |     Correction by volume     |         --          |
        +------------------------------+---------------------+
        |    Delay after aspirating    |       0.2 sec       |
        +------------------------------+---------------------+
        |         Retract speed        |     50 mm/sec       |
        +------------------------------+---------------------+
        |    Delay after retracting    |           --        |
        +------------------------------+---------------------+
        |       Air gap by volume      | - 1-49.9 µL: 0.1 µL |
        |                              | - 50 µL: 0 µL       |
        +------------------------------+---------------------+

    .. tab:: Flex P50 8-channel

        +------------------------------+---------------------+
        |           Behavior           |        50 µL        |
        +==============================+=====================+
        |        Submerge speed        |      100 mm/sec     |
        +------------------------------+---------------------+
        | Aspirate flow rate by volume |  - 1 µL: 35 µL/sec  |
        |                              |  - 10 µL: 24 µL/sec |
        |                              |  - 50 µL: 35 µL/sec |
        +------------------------------+---------------------+
        |     Correction by volume     |          --         |
        +------------------------------+---------------------+
        |    Delay after aspirating    |       0.2 sec       |
        +------------------------------+---------------------+
        |         Retract speed        |      50 mm/sec      |
        +------------------------------+---------------------+
        |    Delay after retracting    |          --         |
        +------------------------------+---------------------+
        |       Air gap by volume      | - 1-49.9 µL: 0.1 µL |
        |                              |    - 50 µL: 0 µL    |
        +------------------------------+---------------------+

    .. tab:: Flex P1000 1-channel # update table values!

        +------------------------------+---------------------+
        |           Behavior           |        50 µL        |
        +==============================+=====================+
        |        Submerge speed        |      100 mm/sec     |
        +------------------------------+---------------------+
        | Aspirate flow rate by volume |  - 1 µL: 35 µL/sec  |
        |                              |  - 10 µL: 24 µL/sec |
        |                              |  - 50 µL: 35 µL/sec |
        +------------------------------+---------------------+
        |     Correction by volume     |          --         |
        +------------------------------+---------------------+
        |    Delay after aspirating    |       0.2 sec       |
        +------------------------------+---------------------+
        |         Retract speed        |      50 mm/sec      |
        +------------------------------+---------------------+
        |    Delay after retracting    |          --         |
        +------------------------------+---------------------+
        |       Air gap by volume      | - 1-49.9 µL: 0.1 µL |
        |                              |    - 50 µL: 0 µL    |
        +------------------------------+---------------------+

    .. tab:: Flex P1000 8-channel #update table values!

        +------------------------------+---------------------+
        |           Behavior           |        50 µL        |
        +==============================+=====================+
        |        Submerge speed        |      100 mm/sec     |
        +------------------------------+---------------------+
        | Aspirate flow rate by volume |  - 1 µL: 35 µL/sec  |
        |                              |  - 10 µL: 24 µL/sec |
        |                              |  - 50 µL: 35 µL/sec |
        +------------------------------+---------------------+
        |     Correction by volume     |          --         |
        +------------------------------+---------------------+
        |    Delay after aspirating    |       0.2 sec       |
        +------------------------------+---------------------+
        |         Retract speed        |      50 mm/sec      |
        +------------------------------+---------------------+
        |    Delay after retracting    |          --         |
        +------------------------------+---------------------+
        |       Air gap by volume      | - 1-49.9 µL: 0.1 µL |
        |                              |    - 50 µL: 0 µL    |
        +------------------------------+---------------------+

    .. tab:: Flex P1000 96-channel #update table values!

        +------------------------------+---------------------+
        |           Behavior           |        50 µL        |
        +==============================+=====================+
        |        Submerge speed        |      100 mm/sec     |
        +------------------------------+---------------------+
        | Aspirate flow rate by volume |  - 1 µL: 35 µL/sec  |
        |                              |  - 10 µL: 24 µL/sec |
        |                              |  - 50 µL: 35 µL/sec |
        +------------------------------+---------------------+
        |     Correction by volume     |          --         |
        +------------------------------+---------------------+
        |    Delay after aspirating    |       0.2 sec       |
        +------------------------------+---------------------+
        |         Retract speed        |      50 mm/sec      |
        +------------------------------+---------------------+
        |    Delay after retracting    |          --         |
        +------------------------------+---------------------+
        |       Air gap by volume      | - 1-49.9 µL: 0.1 µL |
        |                              |    - 50 µL: 0 µL    |
        +------------------------------+---------------------+

Dispense
^^^^^^^^^


Multi-dispense
^^^^^^^^^^^^^^^

.. _viscous: 

Viscous
--------

.. _volatile: 

Volatile
--------
