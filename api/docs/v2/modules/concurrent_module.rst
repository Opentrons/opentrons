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

When you use a Heater-Shaker, Temperature, or Thermocycler Module in your protocol, the API gives you the flexibility to perform module actions with a blocking or non-blocking method. If you use a blocking method to set the Temperature Module to 4 °C, the robot won't perform the next protocol step until the module cools to 4 °C. When you use one of the non-blocking methods shown below, the robot will continue to perform the next protocol steps, regardless of when the module reaches the target temperature or completes another action.  

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

Each command returns a :py:class:`ProtocolContext.task` that runs in the background of a protocol. Your protocol can include multiple module tasks that run parallel to one another: 

.. code-block:: python 
    temp_mod.start_set_temperature(celsius=4)

    profile = [
        {"temperature":95, "hold_time_seconds":30},
        {"temperature":57, "hold_time_seconds":30},
        {"temperature":72, "hold_time_seconds":60}
    ]
    tc_mod.start_execute_profile(
        steps=profile, 
        repetitions=20,
        block_max_volume=32)
    
    pipette.pick_up_tip()   
    pipette.aspirate(50, plate["A1"])
    pipette.dispense(50, plate["B1"])
    pipette.drop_tip()

In this example, two tasks are created: one for a Temperature Module, holding samples at 4 °C, and another for a Thermocycler Module running a profile. Neither task affects the other, and neither module action will prevent the robot from continuing to the next protocol steps. With non-blocking commands like :py:meth:`.~TemperatureModuleContext.start_set_temperature`, there's no need to wait for a module task to finish. 

Timing module tasks
--------------------

Sometimes, the amount of time it takes for a module to finish a task is still important to your protocol. 

You might need to wait for samples on the Temperature Module to reach a target temperature before moving to the next step. The example below combines a non-blocking module command with :py:meth:`.ProtocolContext.wait_for_tasks` to prevent the Flex Gripper from moving a plate until the target temperature is reached::

    temp_adapter = temp_mod.load_adapter("opentrons_96_well_aluminum_block")
    temp_plate = temp_adapter.load_labware("nest_96_wellplate_100ul_pcr_full_skirt")
    temp_task=temp_mod.start_set_temperature(75)
    protocol.wait_for_tasks(temp_task)
    protocol.move_labware(labware=temp_plate, new_location="D3", use_gripper=True)
    
    
Let's say your samples not only have to reach a target temperature, but need to incubate for a specific amount of time. The example below uses non-blocking commands to heat and shake samples, and :py:meth:`.ProtocolContext.create_timer` to set an incubation time. 

.. code-block:: python

    hs_timer = create_timer(seconds=300)
    hs_mod.start_set_temperature(75)
    hs_mod.set_shake_speed(300)
    protocol.wait_for_tasks(hs_timer)
    hs_mod.deactivate_heater()

Here, the Heater-Shaker Module will heats and shakes samples at 75 °C and 300 RPM, and a timer pauses the protocol for a 5 minute incubation. Keep in mind that this timer isn't attached to a specific module action, and will start to run as soon as the robot sets the Heater-Shaker's shake speed. And, if the Heater-Shaker takes longer than 5 minutes to reach the target temperature, your samples might not incubate at all. To prevent this, you can: 

- use :py:meth:`~.ProtocolContext.wait_for_tasks` to wait for the Heater-Shaker to reach the target temperature before the ``hs_timer`` runs.
- insert pipetting or other module actions before the ``hs_timer`` runs, giving the module time to heat.