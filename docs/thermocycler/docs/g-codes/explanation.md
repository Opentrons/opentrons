---
title: "Thermocycler Module: G-codes and Device IDs"
---

This section provides an overview of G-codes, including the structure of a typical command and response. It also defines the vendor and device IDs used by every Thermocycler. See [Thermocycler Module G-codes](./thermocycler-g-codes.md) for a complete list of codes used by this device.

!!!note
    You do not need to understand or use G-codes to operate a Thermocycler with your Flex robot or protocols. This section is a technical resource for developers building custom applications that work with Opentrons hardware.

## Understanding G-codes

G-codes are machine-readable instructions used to control hardware directly. While most users control modules using protocols developed with the Opentrons [Python API](../../python-api/index.md) or [Protocol Designer](../../protocol-designer/index.md), we also provide G-codes to third-party developers and integrators. These codes allow you to operate hardware independently of our software ecosystem, establishing direct serial control over Opentrons modules using your own custom software or APIs.

## G-code command syntax

A typical G-code command string uses this syntax:

`COMMAND[ARGUMENT-KEY][ARGUMENT-VALUE]...TERMINATOR`

The following table defines these code elements.

[\\]: <> (Using inline styles in 1st col because another CSS rule might be overkill)

| Element | Description |
|----|----|
| <span style="white-space: nowrap;">`COMMAND`</span> | This is a particular G-code itself. For example, the command `G0` is a movement command. |
| <span style="white-space: nowrap;">`ARGUMENT-KEY`</span> | This is an optional element that identifies an argument or parameter that provides data to the G-code. Typically, it is a single letter followed by the value of the parameter, usually a number. For instance, a command like `G0` might take parameters for movement along an X, Y, and Z axis. X would be the `ARGUMENT-KEY`, and an `ARGUMENT-VALUE` of `10` would make the system move to `X=10`. The full g-code movement command would look like `G0 X10`. |
| <span style="white-space: nowrap;">`TERMINATOR`</span> | Every G-code sequence must end with a termination character, which is always a newline character (`\n`). Unlike some other systems that allow multiple commands per line, Opentrons modules only accept one G-code and its arguments for each line of text. In the Thermocycler g-codes, each code that accepts arguments includes documentation for its required argument keys and possible values. |

## G-code response syntax

Every G-code command sent to an Opentrons module will trigger a response from the module after execution. This response will be one of the following types defined below.

| Response type | Description |
|----|----|
| Acknowledgement | This response does not echo the command code. It returns an `OK` only. This indicates the command G-code executed successfully. |
| Response | This response echoes the command code and appends `OK` to the response string. For example, successfully sending the command `M119` (get the Thermocycler lid and seal motor status) would return `M119 Lid: open Seal: retracted OK`. Other responses can return `OK` only or an error only. |
| Error | This response does not echo the command code. Instead it appears as an error string formatted as `ERRNNN:error`, where `N` is an error code number. For example, sending too many commands to a Heater-Shaker too quickly might result in the response `ERR004:gcode cache full`. See the <font color="red">Module Error Code section</font> for a complete list of g-code error responses. |

## Device IDs

After making a USB connection, the Thermocycler broadcasts two special hexicecimal codes that a computer's operating system can read to identify the attached device. These are the Vendor ID (VID) and Product ID (PID).

- **VID**: Identifies the device manufacturer. An Opentrons Thermocycler VID is based on the manufacturer of the integrated circuit that runs the module's firmware. 

- **PID**: Identifies the specific module type. Every Opentrons Thermocycler uses the same PID, depending on its model generation (e.g., GEN1 or GEN1).

Every Thermocycler uses one of the VID and PID combinations listed below.

| Module | VID | PID |
|----|----|----|
|Thermocycler GEN1 | 0x04D8 or<br> 0x239a | 0xED8C or <br> 0x800b |
|Thermocycler GEN2 | 0x0483 | 0xED8D |

Identifying modules by their VID and PID helps you write resilient, cross-platform code. Hard coding for a specific port (e.g. `COM3` for Windows or `/dev/ttyUSB0` for macOS) makes your code brittle; your software will fail if the module is plugged in to a different USB port. By using a library like [pyserial](https://pythonhosted.org/pyserial/) to scan for specific VID/PID combinations, your application can dynamically search for, find, and connect to the correct Opentrons module regardless of its physical connection point.