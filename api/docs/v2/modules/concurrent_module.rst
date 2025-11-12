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


text used elsewhere originally; might use here:

In some cases, the amount of time it takes the Heater-Shaker to reach a temperature or shake speed is still important to your protocol. For example, you might need to wait for samples to reach a given temperature before moving to the next step in your protocol. You can still use the Heater-Shaker's non-blocking commands, each of which returns a ``task``, to accomplish this. The example below uses  :py:meth:`.ProtocolContext.wait_for_tasks` to prevent the Flex Gripper from moving the plate from the Heater-Shaker Module until the target temperature is reached: 

.. code-block:: python

  hs_adapter = hs_mod.load_adapter("opentrons_96_flat_bottom_adapter")
  hs_plate = hs_mod.load_labware("nest_96_wellplate_200ul_flat")
  temp_task=hs_mod.set_target_temperature(75)
  ctx.wait_for_tasks([temp_task])
  protocol.move_labware(labware=hs_plate, new_location="D3", use_gripper=True)

Timers
--------


Using multiple tasks 
---------------------

*example could be 1 module action + 1 timer*


