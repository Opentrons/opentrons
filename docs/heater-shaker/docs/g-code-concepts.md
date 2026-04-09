---
title: "Heater-Shaker Module: G-Code Concepts"
description: "Heater-Shaker G-code syntax, examples, and configuration information."
---

G-codes are machine-readable instructions used to control hardware. You do not need to understand or use G-codes to operate a Heater-Shaker with Flex or OT-2. This section is a technical resource for developers building custom applications that work with the Heater-Shaker.

## G-Code command syntax

Heater-Shaker G-codes are strings starting with `M` followed by an integer. Arguments are formatted as letter-number combinations without separators. Each command must end with a new line character; Opentrons modules do not support multiple commands on a single line. For a complete list of codes and examples see [Heater-Shaker G-codes](./g-codes.md).

- **Syntax:** `MCOMMAND [ARGUMENT-KEY][ARGUMENT-VALUE] TERMINATOR`
- **Examples:** `M115 \n` or `M104 S25 \n`

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
      <td>This is a G-code command itself. For example, sending a simple looking command like <code>M115 \n</code> to the Heater-Shaker returns its hardware version, firmware version, and serial number.</td>
    </tr>
    <tr>
      <td><code>ARGUMENT-KEY ARGUMENT-VALUE</code></td>
      <td>
        An optional key-value pair used to pass parameters to a command.
        <br><br>
        Typically, the key is a single, uppercase letter followed by its value (usually an integer). For example, sending <code>M104 S95 \n</code> sets the Heater-Shaker temperature to 95 °C. In this command:
        <ul>
          <li><code>S</code> is the key for temperature.</li>
          <li><code>95</code> is the value for °C.</li>
        </ul>
      </td>
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
      <td>Some responses echo the command code and append <code>OK</code> to the response string when the command is successful. For example, successfully sending the command <code>M106</code> (deactivate the heater) would return <code>M106 OK</code>.<br><br>Other responses do not echo the command code and only return an acknowledgement (<code>OK</code>) or an error code.</td>
    </tr>
    <tr>
      <td>Error</td>
      <td>An error indicates a command failed and does not echo the command code.<br><br>Error responses are strings formatted as <code>ERRNNN:error</code>, where <code>N</code> is an integer followed by a plain text description. For example, sending too many commands to a module too quickly might result in the response <code>ERR004:G-code cache full</code>.<br><br>See the <a href="../error-codes/">Heater-Shaker Error Codes section</a> for a complete list.</td>
    </tr>
  </tbody>
</table>

## Connection parameters

To establish a serial USB connection with a Heater-Shaker, your application must specify the baud rate and identify the module using its Vendor ID (VID) and Product ID (PID).

- **Baud rate**: `115200`
- **VID**: `0x0483`
- **PID**: `0x4853`

!!! tip "Making Good G-Code Connections"
    Identifying modules by their VID and PID helps you write resilient, cross-platform code. Hard coding for a specific port (e.g., `COM3` for Windows or `/dev/ttyUSB0` for macOS) makes code brittle. By using a library like [pyserial](https://pythonhosted.org/pyserial/) to scan for specific VID/PID combinations, your application can dynamically find and connect to the correct Opentrons module regardless of its physical connection point.
