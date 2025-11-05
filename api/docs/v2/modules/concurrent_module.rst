:og:description: How to use the concurrent module actions in a Python protocol. 

.. _concurrent-module:

**************************
Concurrent Module Actions
**************************

The Opentrons Flex and OT-2 can each use hardware modules, like the Heater-Shaker and Thermocycler Modules. Beginning with API version 2.27, use non-blocking module commands to add concurrent module actions to your protocols. Using multiple modules at a time speeds up runtime for your protocols and decreases your time at the bench. Run multiple Heater-Shaker or Temperature Modules together, or in parallel with a Thermocycler Module and pipetting actions. [maybe replace this last sentence with a bullet list of what you can do?]

This section covers running multiple module tasks in your protocols, including timing actions to work together. 

.. note::
    In API version 2.27, lids and labware latch moves are still blocking actions. These moves happen quickly, and you'll be able to proceed with other steps of your protocol immediately after. 


Module tasks 
-------------

*explains one task at a time. each non-blocking command creates a task, and you can wait for it to complete but don't need to*


Timers
--------


Using multiple tasks 
---------------------

*example could be 1 module action + 1 timer*


