---
title: "Python API: Step Grouping"
description: "Use step grouping to organize groups of commands in Python protocols."
---

Step grouping lets you organize groups of commands within your Python protocols. This can be especially helpful when writing or working with long protocols. Beginning with API version 9.1.0, use commands to separate groups of steps:

- the context manager [`group_steps()`][opentrons.protocol_api.ProtocolContext.group_steps], which uses `with` syntax.
- the paired [`create_and_start_step_group()`][opentrons.protocol_api.ProtocolContext.create_and_start_step_group] and [`end_group()`][opentrons.protocol_api._command_annotations.GroupedSteps.end_group] commands.

The examples on this page demonstrate using either method to create step groups that are visible in your Python protocol file, or in [visualization](../flex/opentrons-app/protocol-viz.md) in the Opentrons App.

!!! note
    Step grouping doesn't affect the execution of your protocol. It's simply a way to organize writing and assessing your Python protocols.

The first example uses the context manager [`ProtocolContext.group_steps()`][opentrons.protocol_api.ProtocolContext.group_steps] to create a group of steps, contained inside a `with` block:

```python

# create a step group for aspirating and dispensing steps

with protocol_context.group_steps(name="Aspirate and Dispense Buffer", description="Transfer liquid from reservoir to well plate"):
    pipette.pick_up_tip()
    pipette.aspirate(
        volume=50,
        source=reservoir['A1'].bottom(z=1),
        dest=plate['A1']
    )
    pipette.drop_tip
```
*New in version 2.29*

Each command you add inside the `with` block becomes a part of the step group.

The second example uses the [`create_and_start_step_group()`][opentrons.protocol_api.ProtocolContext.create_and_start_step_group] command to create a group of steps. Because this command isn't a context manager, you'll need to include the [`end_step_group][opentrons.protocol_api._command_annotations.GroupedSteps.end_group] command to close your step group.

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

step_group_1.end_group()
```
*New in version 2.29*


** idea: screenshot of step grouping in protocol viz? show why this is truly useful? + of course, some text as well
