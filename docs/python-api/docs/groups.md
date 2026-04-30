---
title: "Python API: Step Grouping"
description: "Use step grouping to organize groups of commands in Python protocols."
---

Step grouping lets you organize groups of commands within your Python protocols, and can be especially helpful when writing long protocols. Beginning with API version 9.1.0, use commands to separate groups of steps: 

- the context manager [`ProtocolContext.group_steps()`][opentrons.protocol_api.ProtocolContext.group_steps], which uses `with` syntax.
- the [`ProtocolContext.create_and_start_step_group()`][opentrons.protocol_api.ProtocolContext.create_and_start_step_group] and [`ProtocolContext.close_step_group()`][opentrons.protocol_api.ProtocolContext.close_step_group] commands.

The examples on this page demonstrate using either method to create step groups that are visible in your Python protocol file, and in protocol visualization or the run log in the Opentrons App. 

!!! note
    Step grouping doesn't affect the execution of your protocol. It's simply a way to organize writing and viewing your Python protocols.


The first example uses the context manager [`ProtocolContext.group_steps()`][opentrons.protocol_api.ProtocolContext.group_steps] to create a group of steps, contained inside a `with` block:

```python

with protocol_context.group_steps(name="Aspirate and Dispense Buffer", description="Do x, y, and z"):
    pipette.pick_up_tip()
    pipette.aspirate(
        volume=50,
        source=reservoir['A1'].bottom(z=1),
        dest=plate['A1']
    )
    pipette.drop_tip

# protocol proceeds below
```
*New in version 2.29*

The second example uses the [`ProtocolContext.create_and_start_step_group()`][opentrons.protocol_api.ProtocolContext.create_and_start_step_group] to create a group of steps. Because this command isn't a context manager, you'll need to include the [`ProtocolContext.end_step_group][opentrons.protocol_api.ProtocolContext.end_step_group] command to close your step group. 

```python

## create a step group for aspirating and dispensing steps

step_group_1 = protocol_context.create_and_start_step_group(
    name="Aspirate and Dispense Buffer",
    description="Do X, Y, and Z")

pipette.pick_up_tip()
pipette.aspirate(
        volume=50,
        source=reservoir['A1'].bottom(z=1),
        dest=plate['A1']
    )
    pipette.drop_tip

step_group_1.close_group()

## protocol proceeds below
```
*New in version 2.29*


** idea: screenshot of the run log or protocol viz? show why this is truly useful? 


