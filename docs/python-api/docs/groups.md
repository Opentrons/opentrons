---
title: "Python API: Step Grouping"
description: "Use step grouping to organize groups of commands in Python protocols."
---

Step grouping lets you organize groups of commands within your Python protocols, and can be especially helpful when writing long protocols. Beginning with API version 9.1.0, use commands to separate groups of steps: 

- the context manager [`ProtocolContext.group_steps()`][opentrons.protocol_api.ProtocolContext.group_steps], which uses `with` syntax.
- the paired [`ProtocolContext.create_and_start_step_group()`][opentrons.protocol_api.ProtocolContext.create_and_start_step_group] and [`ProtocolContext.close_step_group()`][opentrons.protocol_api.ProtocolContext.close_step_group] commands. 

The examples on this page demonstrate using either method to create step groups that are visible in your Python protocol file, and protocol visualization or the run log in the Opentrons App. 

!!! note
    Step grouping doesn't affect the execution of your protocol. It's simply a way to organize writing and assessing your Python protocols.
