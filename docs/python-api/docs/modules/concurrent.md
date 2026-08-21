---
title: "Python API: Concurrent Module Actions"
description: How to use concurrent module actions in a Python protocol. 
---

You can use multiple modules simultaneously to speed up protocol runtime and reduce your hands-on time at the bench. Beginning with API version 2.27, add concurrent module actions in Flex and OT-2 protocols: 

- Execute protocol steps in parallel with module actions, like pipetting while running a Thermocycler profile or cooling samples on the Temperature Module.
- Run multiple Heater-Shaker or Temperature Modules together, or in parallel with a Thermocycler Module.

This section covers module tasks and explains how to run multiple module actions in the same protocol, including timing tasks to work together. 

!!! note
    In API version 2.27, lids and labware latch moves are still blocking actions. These moves happen quickly, and you'll be able to proceed with other steps of your protocol immediately after.

## Module tasks

When you use a Heater-Shaker, Temperature, or Thermocycler Module in your protocol, you can choose to use a concurrent command for the module actions shown below. Each command returns a [`Task`][opentrons.protocol_api.Task] that runs in the background of your protocol and allows the robot to continue performing protocol steps, regardless of whether the module reaches the target temperature or completes another action. 

| **Module** | **Concurrent commands** |
| :----------|------------------------ |
| Heater-Shaker Module | <ul><li>[`set_target_temperarature()`][opentrons.protocol_api.HeaterShakerContext.set_target_temperature]</li><li>[`set_shake_speed()`][opentrons.protocol_api.HeaterShakerContext.set_shake_speed]</li></ul> |
| Temperature Module | <ul><li>[`start_set_temperature()`][opentrons.protocol_api.TemperatureModuleContext.start_set_temperature]</li></ul> |
| Thermocycler Module | <ul><li>[`start_set_lid_temperature()`][opentrons.protocol_api.ThermocyclerContext.start_set_lid_temperature]</li><li>[`start_set_block_temperature()`][opentrons.protocol_api.ThermocyclerContext.start_set_block_temperature]</li><li>[`start_execute_profile()`][opentrons.protocol_api.ThermocyclerContext.start_execute_profile]</li></ul> |
| Vacuum Module | <ul><li>[`start_set_vacuum_pressure()`][opentrons.protocol_api.VacuumModuleContext.start_set_vacuum_pressure]</li><li>[`start_set_vacuum_power()`][opentrons.protocol_api.VacuumModuleContext.start_set_vacuum_power]</li><li>[`start_execute_profile()`][opentrons.protocol_api.VacuumModuleContext.start_execute_profile]</li></ul> |

Your protocol can include multiple module tasks that run parallel to one another. The example below has the API create two tasks: one for a Temperature Module, holding samples at 4 °C, and another for a Thermocycler Module running a profile. Neither task affects the other, and neither module action will prevent the robot from continuing to the next protocol steps. 

```python
temp_mod.start_set_temperature(celsius=4)

profile = [
    {"temperature":95, "hold_time_seconds":30},
    {"temperature":57, "hold_time_seconds":30},
    {"temperature":72, "hold_time_seconds":60}
]
tc_mod.start_execute_profile(
    steps=profile,
    repetitions=20,
    block_max_volume=32
)

pipette.pick_up_tip()
pipette.aspirate(50, plate["A1"])
pipette.dispense(50, plate["B1"])
pipette.drop_tip()

```

Although tasks are created when you use concurrent commands like [`TemperatureModuleContext.start_set_temperature()`][opentrons.protocol_api.TemperatureModuleContext.start_set_temperature] or [`ThermocyclerContext.start_execute_profile()`][opentrons.protocol_api.ThermocyclerContext.start_execute_profile], there's no need to wait for either task to finish. Here, the robot can continue pipetting while the Temperature Module cools and the Thermocycler profile runs.

## Timing module tasks

Sometimes, the amount of time it takes for a module to finish a task is still important to your protocol. You might need to wait for samples on the Temperature Module to reach a target temperature before moving to the next step. The example below combines a concurrent module command with [`wait_for_tasks()`][opentrons.protocol_api.ProtocolContext.wait_for_tasks] to prevent the Flex Gripper from moving a plate until the target temperature is reached: 

```python
temp_adapter = temp_mod.load_adapter("opentrons_96_well_aluminum_block")
temp_plate = temp_adapter.load_labware("nest_96_wellplate_100ul_pcr_full_skirt")
heat_task = temp_mod.start_set_temperature(75)
protocol.wait_for_tasks([heat_task])
protocol.move_labware(labware=temp_plate, new_location="D3", use_gripper="True")
```

Let's say your samples have to both reach a target temperature and incubate for a specific amount of time. The example below uses concurrent commands to heat and shake samples, and [`create_timer()`][opentrons.protocol_api.ProtocolContext.create_timer] to set an incubation time. 

```python

# set Heater-Shaker temperature and shake speed
heat_task = hs_mod.start_set_temperature(75)
hs_mod.set_shake_speed(300)

# wait for module to finish heating
protocol.wait_for_tasks([heat_task])

# create timer for sample incubation
hs_timer = create_timer(seconds=300)

# hold samples at target temperature
protocol.wait_for_tasks([hs_timer])
hs_mod.deactivate_heater()
```

Here, the Heater-Shaker Module will heat and shake samples at 75 °C and 300 RPM, and a timer pauses the protocol for a 5 minute incubation. Because the Heater-Shaker could take longer than 5 minutes to reach the target temperature, `wait_for_tasks()` ensures the timer starts only after the target temperature is reached. 

!!! note
    Using the [`wait_for_tasks()`][opentrons.protocol_api.ProtocolContext.wait_for_tasks] method to wait for multiple of the same task on the same module will cause the API to raise an error. For example, if you need to heat a Temperature Module to two separate target temperatures, use [`wait_for_tasks()`][opentrons.protocol_api.ProtocolContext.wait_for_tasks] twice: 

    ```python
    heat_task_1 = temp_mod.start_set_temperature(55)
    protocol.wait_for_tasks([heat_task_1])

    heat_task_2 = temp_mod.start_set_temperature(75)
    protocol.wait_for_tasks([heat_task_2])
    ```

