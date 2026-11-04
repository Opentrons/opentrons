---
title: "Vacuum Module: G-Code Concepts"
description: "Vacuum Module G-code syntax, examples, and configuration information."
---

G-codes are machine-readable instructions used to control hardware. You do not need to understand or use G-codes to operate a Vacuum Module with Flex. This section is a technical resource for developers building custom applications that work with the Vacuum Module.

## G-code command syntax

Vacuum Module G-codes are strings starting with M followed by an integer. Arguments are formatted as letter-number combinations without separators. Each command must end with a new line terminator. Opentrons modules do not support multiple commands on a single line. For a complete list of codes and examples see [Vacuum Module G-Codes](g-codes.md).

- **Syntax:** `MCOMMAND [ARGUMENT-KEY][ARGUMENT-VALUE] TERMINATOR`
- **Examples:** `M115 \n` or `M120 S1 P-400 \n`

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
      <td>This is a G-code command itself. For example, sending a simple looking command like <code>M115 \n</code> to the Vacuum Module returns its serial number, model, and firmware version.</td>
    </tr>
    <tr>
      <td><span style="white-space: nowrap;"><code>ARGUMENT-KEY</code></span></td>
      <td>
        An optional key-value pair used to pass parameters to a command.
        <br><br>
        Typically, the key is a single, uppercase letter followed by its value (usually an integer). For example, sending <code>M120 S1 P-400 \n</code> sets the module's gague pressure to -400 mbar. In this command:
        <ul>
          <li><code>S</code> and <code>P</code> are the keys for "start pump" and set target pressure in mbar.</li>
          <li><code>1</code> and <code>-400</code> are the values for the pump state and setting the desired pressure.</li>
        </ul>
      </td>
    </tr>
    <tr>
      <td><span style="white-space: nowrap;"><code>TERMINATOR</code></span></td>
      <td>Every G-code sequence ends with a terminator, which is always a newline character (<code>\n</code>).</td>
    </tr>
  </tbody>
</table>

## G-code response syntax

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
      <td>Some responses echo the command code and append <code>OK</code> to the response string when the command is successful. For example, successfully sending the command <code>M114</code> (get reset reason) would return <code>M114 R:1 OK</code>.<br><br>Other responses do not echo the command code and only return an acknowledgement (<code>OK</code>) or an error code.</td>
    </tr>
    <tr>
      <td>Error</td>
      <td>An error indicates a command failed and does not echo the command code.<br><br>Error responses are strings formatted as <code>ERRNNN:error</code>, where <code>N</code> is an integer followed by a plain text description. For example, sending too many commands to a module too quickly might result in the response <code>ERR004:G-code cache full</code>.<br><br>See <a href="../error-codes/">Vacuum Module Error Codes</a> for a complete list.</td>
    </tr>
  </tbody>
</table>

## Connection parameters

To establish a serial USB connection, your application must specify the baud rate and identify the module using its Vendor ID (VID) and Product ID (PID).

- **Baud rate:** `115200`
- **VID:** `0x0483`
- **PID:** `0xEF40`

!!! tip "Making Good G-code Connections"
    Identifying modules by their VID and PID helps you write resilient, cross-platform code. Hard coding for a specific port (e.g., `COM3` for Windows or `/dev/ttyUSB0` for macOS) makes code brittle. By using a library like [pyserial](https://pythonhosted.org/pyserial/) to scan for specific VID/PID combinations, your application can dynamically find and connect to the correct Opentrons module regardless of its physical connection point.
