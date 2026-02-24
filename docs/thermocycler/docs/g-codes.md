---
title: "Thermocycler Module: G-codes"
---

This section describes and lists the G-code commands and error codes used by the Thermocycler.

## Understanding G-codes

G-codes are standard machine-readable instructions used to control hardware directly. While most users rely on our [Python API](../../python-api/) or [Protocol Designer](../../protocol-designer/), Opentrons provides G-codes to 3rd-party developers and integrators. They allow you to operate independently of our standard software ecosystem, establishing direct serial control over Opentrons modules using your own custom software or APIs.

### Command syntax

A typical G-code command string uses this syntax:

`COMMAND[ARGUMENT-KEY][ARGUMENT-VALUE]...TERMINATOR`

The following table defines these code elements.

[\\]: <> (Using inline styles in 1st col because another CSS rule might be overkill)

| Element | Description |
|----|----|
| <span style="white-space: nowrap;">`COMMAND`</span> | This is a particular G-code itself. For example, the command `G0` is a movement command. |
| <span style="white-space: nowrap;">`ARGUMENT-KEY`</span> | This is an optional element that identifies an argument or parameter that provides data to the G-code. Typically, it is a single letter followed by the value of the parameter, usually a number. For instance, a command like `G0` might take parameters for movement along an X, Y, and Z axis. X would be the `ARGUMENT-KEY`, and an `ARGUMENT-VALUE` of `10` would make the system move to `X=10`. The full g-code movement command would look like `G0 X10`. |
| <span style="white-space: nowrap;">`TERMINATOR`</span> | Every G-code sequence must be ended with a termination character, which is always a newline character (`\n`). Unlike some other systems that allow multiple commands per line, Opentrons modules only accept one G-code and its arguments for each line of text. In the Thermocycler g-codes, each code that accepts arguments includes documentation for its required argument keys and possible values. |

### Response syntax

Every G-code command sent to an Opentrons module will trigger a response from the module after execution. This response will be one of the following defined below.

| Type | Description |
|----|----|
| Acknowledgement | This response does not echo the command code. It returns an `OK` only. This indicates the command G-code executed successfully. |
| Response | This response echoes the command code and appends `OK` to the response string. For example, successfully sending the command `M119` (get the Thermocycler lid and seal motor status) would return `M119 Lid: open Seal: retracted OK`. Other responses can return `OK` only or an error only. |
| Error | This response does not echo the command code. Instead it appears as an error string formatted as `ERRNNN:error`, where `N` is an error code number. For example, sending too many commands to a Heater-Shaker too quickly might result in the response `ERR004:gcode cache full`. Each module’s possible error codes are documented below in the <font color="red">Module Error Code section</font>. |