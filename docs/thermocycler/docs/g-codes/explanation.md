---
title: "Thermocycler Module: G-codes and Device IDs"
---

This section provides an overview of Thermocycler G-codes, including the structure of a typical command and response. It also defines the vendor and device IDs used by every Thermocycler. See [Thermocycler Module G-codes](./thermocycler-g-codes.md) for a complete list of codes used by this device.

!!!note
    You do not need to understand or use G-codes to operate a Thermocycler with your Flex or OT-2 robot. This section is a technical resource for developers building custom applications that work with Opentrons hardware.

## Understanding G-codes

G-codes are machine-readable instructions used to control hardware directly. While most users control modules using protocols developed with the Opentrons [Python API](../../python-api/index.md) or [Protocol Designer](../../protocol-designer/index.md), we also provide G-codes to third-party developers and integrators. These codes allow you to operate hardware independently of our software ecosystem, establishing direct serial control over Opentrons modules using your own custom software or APIs.

## G-code command syntax

A typical G-code command string uses this syntax:

`COMMAND[ARGUMENT-KEY][ARGUMENT-VALUE]...TERMINATOR`

The following table defines these code elements.

<table>
  <thead>
    <tr>
      <th>Element</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><span style="white-space: nowrap;"><code>COMMAND</code></span></td>
      <td>This is a particular G-code command itself. For example, <code>G0</code> is a movement command.</p><p> Also, Opentrons modules only accept one G-code for each line of text. You cannot pass multiple commands on a single line.</td>
    </tr>
    <tr>
      <td><span style="white-space: nowrap;"><code>ARGUMENT-KEY</code></span></td>
      <td>This is an optional key-value pair that adds additional data to the G-code.</p><p>Typically, the key is a single letter followed by the value, which is usually an integer. For instance, a command like <code>G0</code> might take parameters for movement along an X, Y, and Z axis. X would be the <code>ARGUMENT-KEY</code>, and an <code>ARGUMENT-VALUE</code> of <code>10</code> would make the system move to <code>X=10</code>. The full g-code movement command would look like <code>G0 X10 \n</code>.</td>
    </tr>
    <tr>
      <td><span style="white-space: nowrap;"><code>TERMINATOR</code></span></td>
      <td>Every G-code sequence ends with a terminator, which is always a newline character (<code>\n</code>).</td>
    </tr>
  </tbody>
</table>

## G-code response syntax

Every G-code command sent to an Opentrons module returns a response from the module after execution. This response will be one of the following types defined below.

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
      <td>An acknowledgement returns <code>OK</code> when the command is successful.<p>This response type does not echo the command code.</td>
    </tr>
    <tr>
      <td>Response</td>
      <td>A response echoes the command code and appends <code>OK</code> to the response string when the command is successful. For example, successfully sending the command <code>M119</code> (get the Thermocycler lid and seal motor status) would return <code>M119 Lid: open Seal: retracted OK</code>.<p>Some responses do not echo the command code and only return an acknowledgement (<code>OK</code>) or an error code.</td>
    </tr>
    <tr>
      <td>Error</td>
      <td>An error indicates a command failed and does not echo the command code.</p><p>Error responses are strings formatted as <code>ERRNNN:error</code>, where <code>N</code> is an integer followed by a plain text description. For example, sending too many commands to a module too quickly might result in the response <code>ERR004:gcode cache full</code>.</p><p>See the <a href="./thermocycler-error-codes.md">Thermocycler Error Codes section</a> for a complete list of errors and their descriptions.</td>
    </tr>
  </tbody>
</table>

## Device IDs

After making a USB connection, the Thermocycler broadcasts two special hexadecimal codes that a computer's operating system uses to identify the attached device. These are the Vendor ID (VID) and Product ID (PID).

- **VID**: Identifies the device manufacturer. An Opentrons Thermocycler VID is based on the manufacturer of the integrated circuit that runs the module's firmware. 

- **PID**: Identifies the specific module type. Every Opentrons Thermocycler uses the same PID, depending on its generation designation (e.g., GEN1 or GEN2).

The following table lists the Thermocycler VIDs and PIDs.

| Module | VID | PID |
|----|----|----|
|Thermocycler GEN1 | 0x04D8 or<br> 0x239a | 0xED8C or <br> 0x800b |
|Thermocycler GEN2 | 0x0483 | 0xED8D |

!!! tip
    Identifying modules by their VID and PID helps you write resilient, cross-platform code. Hard coding for a specific port (e.g. `COM3` for Windows or `/dev/ttyUSB0` for macOS) makes your code brittle; your software will fail if the module is plugged in to a different USB port. By using a library like [pyserial](https://pythonhosted.org/pyserial/) to scan for specific VID/PID combinations, your application can dynamically search for, find, and connect to the correct Opentrons module regardless of its physical connection point.