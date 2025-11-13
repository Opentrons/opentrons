:og:description: How to use the concurrent module actions in a Python protocol. 

.. _concurrent-module:

**************************
Concurrent Module Actions
**************************

You can use multiple modules at the same time, in the same protocol, to speed up runtime and reduce hands-on time at the bench. Beginning with API version 2.27, use non-blocking module commands to add concurrent module actions to Flex and OT-2 protocols: 
 
- run multiple Heater-Shaker or Temperature Modules together, or in parallel with a Thermocycler Module.  
- continue to perform protocol steps in parallel with Heater-Shaker, Temperature, or Thermocycler Module actions. 

This section covers module tasks and how to run multiple module tasks in the same protocol, including timing actions to work together. 

.. note::
    In API version 2.27, lids and labware latch moves are still blocking actions. These moves happen quickly, and you'll be able to proceed with other steps of your protocol immediately after. 

Module tasks 
-------------

When you use a Heater-Shaker, Temperature, or Thermocycler Module in your protocol, the API gives you the flexibility to perform module actions with a blocking or non-blocking methods. If you use a blocking method to set the Temperature Module to 4 °C, the robot won't perform the next protocol step until the module cools to 4 °C. When you use one of the non-blocking methods shown below, the robot will continue to perform the next protocol steps, regardless of when the module reaches the target temperature or completes another action.  

.. list-table::
   :header-rows: 1

   * - **Module**
     - **Non-blocking command**
   * - Heater-Shaker Module 
     - 
       - :py:meth:`.HeaterShakerContext.set_target_temperaure`
       - :py:meth:`.HeaterShakerContext.set_shake_speed`
   * - Temperature Module
     - :py:meth:`.TemperatureModuleContext.start_set_temperature`
   * - Thermocycler Module
     - 
       - :py:meth:`.ThermocyclerContext.start_set_lid_temperature`
       - :py:meth:`.ThermocyclerContext.start_set_block_temperature`
       - :py:meth:`.ThermocyclerContext.start_execute_profile`

*what is a task; each command returns a task*
*tasks can run in the background- example; running a thermocycler profile and the temperature module holds samples at a specific temp*
*you can wait for a task to complete but don't need to*
*if you do need to know when a task finishes, you can use wait_for_tasks. example; need to wait for a thermocycler profile to be completed before the plate moves to the temperature module to infinite hold*


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

In some cases, the amount of time it takes for a module action to complete is still important... or rather, samples have to be maintained at a given temp for a certain amount of time... 

example: use create_timer to shake samples for a specific amount of time


Using multiple tasks 
---------------------

*example could be 1 module action + 1 timer*
*give a larger example of managing more than one module action - thermocycler runs a profile while the heater-shaker shakes. when the profile is done, remove the plate from the heater-shaker?*


