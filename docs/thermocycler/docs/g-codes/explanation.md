---
title: "Thermocycler Module: G-Code Essentials"
description: "Defines G-codes and includes Thermocycler command and response examples along with baud rate and device ID information."
---

This section explains the structure of a typical Thermocycler G-code command and response. It also defines the connection parameters used by every Thermocycler. For a complete list of codes, with examples, see [Thermocycler Module G-Codes](./thermocycler-g-codes.md).

!!! note
    You do not need to understand or use G-codes to operate a Thermocycler with your Flex or OT-2 robot. This section is a technical resource for developers building custom applications that work with Opentrons hardware.

## Understanding G-Codes

G-codes are machine-readable instructions used to control hardware directly. While most users work with the Thermocycler using protocols developed with the Opentrons [Python API](../../python-api/index.md) or [Protocol Designer](../../protocol-designer/index.md), these codes are available to third-party developers who require direct serial access to this module.

## G-Code command syntax

A Thermocycler G-code command is an alphanumeric string that starts with the letter "M" followed by an integer. If a command accepts arguments, those are formatted as a letter-number combination. Each command ends with a new line termination character. Opentrons modules only accept one G-code for each line of text. You cannot pass multiple commands on a single line.

- **Syntax:** `MCOMMAND [ARGUMENT-KEY][ARGUMENT-VALUE] TERMINATOR \n`
- **Example:** `M104 S95 \n`

The following table explains these G-code command elements.

<table>
  <thead>
    <tr>
      <th>Element</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><span style="white-space: nowrap;"><code>MCOMMAND</code></span></td>
      <td>This is a G-code command itself. For example, sending <code>M115 \n</code> to the Thermocycler returns its serial number, model, and firmware version.</td>
    </tr>
    <tr>
      <td><span style="white-space: nowrap;"><code>ARGUMENT-KEY</code></span></td>
      <td>This is an optional key-value pair that lets you pass variables to a module in a G-code command.<br><br>Typically, the key is a single letter followed by the value, which is usually an integer. For example, sending <code>M140 S95 \n</code> to the Thermocycler sets the lid temperature to 100 °C. In this command, <code>S</code> is the argument key and <code>100</code> is the argument value.</td>
    </tr>
    <tr>
      <td><span style="white-space: nowrap;"><code>TERMINATOR</code></span></td>
      <td>Every G-code sequence ends with a terminator, which is always a newline character (<code>\n</code>).</td>
    </tr>
  </tbody>
</table>

## G-Code response syntax

Every Opentrons module returns a response after executing a command. A response will be one of the types defined below.

<table>
  <thead>
    <tr>
      <th>Response type</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Acknowledgement</td>
      <td>An acknowledgement returns <code>OK</code> when the command is successful.<br><br>This response type does not echo the command code.</td>
    </tr>
    <tr>
      <td>Response</td>
      <td>Some responses echo the command code and append <code>OK</code> to the response string when the command is successful. For example, successfully sending the command <code>M119</code> (get the Thermocycler lid and seal motor status) would return <code>M119 Lid: open Seal: retracted OK</code>.<br><br>Other responses do not echo the command code and only return an acknowledgement (<code>OK</code>) or an error code.</td>
    </tr>
    <tr>
      <td>Error</td>
      <td>An error indicates a command failed and does not echo the command code.<br><br>Error responses are strings formatted as <code>ERRNNN:error</code>, where <code>N</code> is an integer followed by a plain text description. For example, sending too many commands to a module too quickly might result in the response <code>ERR004:G-code cache full</code>.<br><br>See the <a href="./thermocycler-error-codes.md">Thermocycler Error Codes section</a> for a complete list of errors and their descriptions.</td>
    </tr>
  </tbody>
</table>

## Connection parameters

To establish a serial USB connection, your application must specify the baud rate and identify the module using its Vendor ID (VID) and Product ID (PID). 

- **Baud rate**: Defines the communication speed for the module.
- **VID**: Identifies the manufacturer of the integrated circuit running the module's firmware. 
- **PID**: Identifies the specific Thermocycler type based on its model generation.

The following table lists these required connection parameters.

| Module | Baud Rate | VID | PID |
|----|----|----|----|
| Thermocycler GEN1 | 115200 | 0x04D8 or<br> 0x239a | 0xED8C or <br> 0x800b |
| Thermocycler GEN2 | 115200 | 0x0483 | 0xED8D |

!!! tip "Making Good G-Code Connections"
    Identifying modules by their VID and PID helps you write resilient, cross-platform code. Hard coding for a specific port (e.g., `COM3` for Windows or `/dev/ttyUSB0` for macOS) makes code brittle. By using a library like [pyserial](https://pythonhosted.org/pyserial/) to scan for specific VID/PID combinations, your application can dynamically find and connect to the correct Opentrons module regardless of its physical connection point.