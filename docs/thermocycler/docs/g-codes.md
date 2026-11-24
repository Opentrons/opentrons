---
title: "Thermocycler Module: G-Codes"
description: "Thermocycler G-code commands and responses."
---

The Thermocycler accepts the G-code commands listed below.

!!! tip
    These commands rarely change, but you can always check for updates in the [Thermocycler's driver file](https://github.com/Opentrons/opentrons/blob/edge/api/src/opentrons/drivers/thermocycler/driver.py).

<table>
  <thead>
    <tr>
      <th>G-Code</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>M14</code></td>
      <td>
        <strong>Command:</strong> deactivate block<br>
        <strong>Arguments:</strong> none<br>
        <strong>Example:</strong> <code>M14</code><br>
        <strong>Response:</strong> <code>M14 OK</code> (acknowledge only or error)
      </td>
    </tr>
    <tr>
      <td><code>M18</code></td>
      <td>
        <strong>Command:</strong> deactivate all<br>
        <strong>Arguments:</strong> none<br>
        <strong>Example:</strong> <code>M18</code><br>
        <strong>Response:</strong> <code>M18 OK</code> (acknowledge only or error)
      </td>
    </tr>
    <tr>
      <td><code>M104</code></td>
      <td>
        <strong>Command:</strong> set plate temperature in °C<br>
        <strong>Arguments:</strong>
        <ul>
          <li><code>S</code>: set temperature</li>
          <li><code>H</code>: hold time in seconds (optional)</li>
          <li><code>V</code>: liquid volume (optional)</li>
          <li><code>R</code>: ramp rate (optional)</li>
        </ul>
        <strong>Example:</strong> <code>M104 S95 R25</code> sets the block temperature to 95 °C using a ramp rate of 25 °C/s.<br>
        <strong>Response:</strong> <code>M104 OK</code> (acknowledge only or error)
      </td>
    </tr>
    <tr>
      <td><code>M105</code></td>
      <td>
        <strong>Command:</strong> get plate temperature in °C<br>
        <strong>Arguments:</strong> none<br>
        <strong>Response elements:</strong>
        <ul>
          <li><code>T</code>: target temperature °C</li>
          <li><code>C</code>: current temperature °C</li>
        </ul>
        <strong>Response:</strong> <code>M105 T:none C:82.3 OK</code> indicates there is no target temperature and the current temperature is 82.3 °C.
      </td>
    </tr>
    <tr>
      <td><code>M108</code></td>
      <td>
        <strong>Command:</strong> deactivate lid<br>
        <strong>Arguments:</strong> none<br>
        <strong>Response:</strong> <code>OK</code> (acknowledge only or error)
      </td>
    </tr>
    <tr>
      <td><code>M115</code></td>
      <td>
        <strong>Command:</strong> get the Thermocycler's serial number, model, and firmware version<br>
        <strong>Arguments:</strong> none<br>
        <strong>Response elements:</strong>
        <ul>
          <li><code>FW</code>: firmware version</li>
          <li><code>HW</code>: hardware version</li>
          <li><code>SerialNo</code>: serial number of the module</li>
        </ul>
        <strong>Response:</strong> <code>M115 FW:v1.1.1 HW: Opentrons Thermocycler Gen2 SerialNo: TCV220241202A02 OK</code> indicates the module is on firmware version 1.1.1, the model is a Thermocycler GEN2, and the serial number is TCV220241202A02.
      </td>
    </tr>
    <tr>
      <td><code>M119</code></td>
      <td>
        <strong>Command:</strong> get statuses for the lid motor and seal motor<br>
        <strong>Arguments:</strong> none<br>
        <strong>Response elements:</strong>
        <ul>
          <li><code>Lid</code>: lid motor status. Can be: open, closed, in between (closed and started opening or vice versa), unknown (has not been homed since boot up)</li>
          <li><code>Seal</code>: seal status. Can be: engaged (pushed out and pressed down), retracted (pulled into the lid), in_between (neither engaged or retracted)</li>
        </ul>
        <strong>Response:</strong> <code>M119 Lid: open Seal: retracted OK</code> indicates the lid is open and the seal is retracted.
      </td>
    </tr>
    <tr>
      <td><code>M126</code></td>
      <td>
        <strong>Command:</strong> open lid<br>
        <strong>Arguments:</strong> none<br>
        <strong>Response:</strong> <code>OK</code> (acknowledge only or error)
      </td>
    </tr>
    <tr>
      <td><code>M127</code></td>
      <td>
        <strong>Command:</strong> close lid<br>
        <strong>Arguments:</strong> none<br>
        <strong>Response:</strong> <code>OK</code> (acknowledge only or error)
      </td>
    </tr>
    <tr>
      <td><code>M128</code></td>
      <td>
        <strong>Command:</strong> lift plate. This command is only intended to be sent when the lid is already in the open position. The lid will open further to lift the plate, and then return to the open position.<br>
        <strong>Arguments:</strong> none<br>
        <strong>Response:</strong> <code>OK</code> (acknowledge only or error)
      </td>
    </tr>
    <tr>
      <td><code>M140</code></td>
      <td>
        <strong>Command:</strong> set lid temperature in °C<br>
        <strong>Arguments:</strong> <code>S</code> sets the lid temperature in °C. This parameter is optional. If not defined, the default temperature target is 105 °C.<br>
        <strong>Example:</strong> <code>M140 S100</code> sets the lid temperature to 100 °C.<br>
        <strong>Response:</strong> <code>OK</code> (acknowledge only or error)
      </td>
    </tr>
    <tr>
      <td><code>M141</code></td>
      <td>
        <strong>Command:</strong> get lid temperature in °C<br>
        <strong>Arguments:</strong> none<br>
        <strong>Response elements:</strong>
        <ul>
          <li><code>T</code>: the target temperature in °C</li>
          <li><code>C</code>: the current temperature in °C</li>
        </ul>
        <strong>Response:</strong> <code>M141 T:none C:85.0</code> indicates there is no target temperature and the current temperature is 85 °C.
      </td>
    </tr>
    <tr>
      <td><code>M411</code></td>
      <td>
        <strong>Command:</strong> get error state (available in firmware v1.1.1 and later)<br>
        <strong>Arguments:</strong> none<br>
        <strong>Response:</strong> <code>OK</code> (acknowledge only or error)
      </td>
    </tr>
    <tr>
      <td><code>M413</code></td>
      <td>
        <strong>Command:</strong> clear error state (available in firmware v1.1.1 and later)<br>
        <strong>Arguments:</strong> none<br>
        <strong>Response:</strong> <code>OK</code> (acknowledge only or error)
      </td>
    </tr>
    <tr>
      <td><code>M566</code></td>
      <td>
        <strong>Command:</strong> set ramp rate in °C/s<br>
        <strong>Arguments:</strong> <code>S</code> sets the temperature ramp rate in °C/s (optional). If not defined, the module tries to increase the temperature as fast as possible.<br>
        <strong>Example:</strong> <code>M566 S25</code> sets the ramp rate to 25 °C/s.<br>
        <strong>Response:</strong> <code>OK</code> (acknowledge only or error)
      </td>
    </tr>
  </tbody>
</table>