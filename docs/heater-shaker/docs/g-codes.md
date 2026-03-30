---
title: "Heater-Shaker Module: G-codes"
description: "Lists all Heater-Shaker G-codes and responses."
---

The Thermocycler accepts the G-code commands listed below.

!!! tip
    These commands rarely change, but you can always check for updates in the [Heater-Shaker driver file](https://github.com/Opentrons/opentrons/blob/edge/api/src/opentrons/drivers/heater_shaker/driver.py).

<table>
  <thead>
    <tr>
      <th>G-Code</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>G28</code></td>
      <td>
        <strong>Command:</strong> home the shaker plate [cite: 3]<br>
        <strong>Arguments:</strong> none [cite: 3]<br>
        <strong>Response:</strong> <code>G28 OK</code> (acknowledge only or error) [cite: 3]
      </td>
    </tr>
    <tr>
      <td><code>M3</code></td>
      <td>
        <strong>Command:</strong> set shaking rpm [cite: 3]<br>
        <strong>Arguments:</strong> <code>S</code>: set rpm [cite: 3]<br>
        <strong>Example:</strong> <code>M3 S500</code> sets target rpm to 500 [cite: 3]<br>
        <strong>Response:</strong> <code>M3 OK</code> (acknowledge only or error) [cite: 3]
      </td>
    </tr>
    <tr>
      <td><code>M104</code></td>
      <td>
        <strong>Command:</strong> set temperature in °C [cite: 3]<br>
        <strong>Arguments:</strong> <code>S</code>: set temperature in °C [cite: 3]<br>
        <strong>Example:</strong> <code>M104 S25</code> sets target temperature to 25 °C [cite: 3]<br>
        <strong>Response:</strong> <code>M104 OK</code> (acknowledge only or error) [cite: 3]
      </td>
    </tr>
    <tr>
      <td><code>M105</code></td>
      <td>
        <strong>Command:</strong> get temperature in °C [cite: 3]<br>
        <strong>Arguments:</strong> none [cite: 3]<br>
        <strong>Response elements:</strong> [cite: 3]
        <ul>
          <li><code>T</code>: target temperature in °C (can be none) [cite: 3]</li>
          <li><code>C</code>: current temperature in °C [cite: 3]</li>
        </ul>
        <strong>Response:</strong> <code>M105 T:none C:82.4 OK</code> indicates the module is neither heating or cooling and its current temperature is 82.4 °C. [cite: 3]
      </td>
    </tr>
    <tr>
      <td><code>M106</code></td>
      <td>
        <strong>Command:</strong> deactivate heater [cite: 3]<br>
        <strong>Arguments:</strong> none [cite: 3]<br>
        <strong>Example:</strong> <code>M106</code> [cite: 4]<br>
        <strong>Response:</strong> <code>M106 OK</code> (acknowledge only or error) [cite: 4]
      </td>
    </tr>
    <tr>
      <td><code>M114</code></td>
      <td>
        <strong>Command:</strong> get reset reason<br>
        <strong>Arguments:</strong> none<br>
        <strong>Response:</strong> <code>M114 OK</code> (acknowledge only or error)
      </td>
    </tr>
    <tr>
      <td><code>M115</code></td>
      <td>
        <strong>Command:</strong> get hardware and software version and serial number [cite: 4]<br>
        <strong>Arguments:</strong> none [cite: 4]<br>
        <strong>Response elements:</strong> [cite: 4]
        <ul>
          <li><code>HW</code>: hardware version [cite: 4]</li>
          <li><code>FW</code>: firmware version [cite: 4]</li>
          <li><code>SerialNo</code>: serial number of the module [cite: 4]</li>
        </ul>
        <strong>Response:</strong> <code>M115 FW:v1.0.6 HW: Opentrons Heater-Shaker SerialNo: HSV012024041303 OK</code> indicates the module is on firmware version 1.0.6, is a Heater-Shaker, and has serial number HSV012024041303. [cite: 4]
      </td>
    </tr>
    <tr>
      <td><code>M123</code></td>
      <td>
        <strong>Command:</strong> get shaking rpm [cite: 4]<br>
        <strong>Arguments:</strong> none [cite: 4]<br>
        <strong>Response elements:</strong> [cite: 4]
        <ul>
          <li><code>C</code>: current speed in rpm [cite: 4]</li>
          <li><code>T</code>: target speed in rpm (or none) [cite: 4]</li>
        </ul>
        <strong>Response:</strong> <code>M123 C:0 T:0 OK</code> indicates the current and target rpm is 0 (the module is not moving). [cite: 4]
      </td>
    </tr>
    <tr>
      <td><code>M241</code></td>
      <td>
        <strong>Command:</strong> get labware latch state [cite: 5]<br>
        <strong>Arguments:</strong> none [cite: 5]<br>
        <strong>Response elements:</strong> [cite: 5]
        <ul>
          <li><code>IDLE_OPEN</code>: latch is open [cite: 5]</li>
          <li><code>IDLE_CLOSED</code>: latch is closed [cite: 5]</li>
          <li><code>OPENING</code>: latch is opening [cite: 5]</li>
          <li><code>CLOSING</code>: latch is closing [cite: 5]</li>
          <li><code>IDLE_UNKNOWN</code>: latch is not sensed [cite: 5]</li>
        </ul>
        <strong>Response:</strong> <code>M241 STATUS: CLOSING OK</code> indicates the latch is closing. [cite: 5]
      </td>
    </tr>
    <tr>
      <td><code>M242</code></td>
      <td>
        <strong>Command:</strong> open labware latch [cite: 5]<br>
        <strong>Arguments:</strong> none [cite: 5]<br>
        <strong>Response:</strong> <code>M242 OK</code> (acknowledge only or error) [cite: 5]
      </td>
    </tr>
    <tr>
      <td><code>M243</code></td>
      <td>
        <strong>Command:</strong> close labware latch [cite: 5]<br>
        <strong>Arguments:</strong> none [cite: 5]<br>
        <strong>Response:</strong> <code>M243 OK</code> (acknowledge only or error) [cite: 5]
      </td>
    </tr>
    <tr>
      <td><code>M411</code></td>
      <td>
        <strong>Command:</strong> get error state (available in robot software 8.8.0 and later) [cite: 5]<br>
        <strong>Arguments:</strong> none [cite: 10]<br>
        <strong>Example:</strong> <code>M411</code> [cite: 10]<br>
        <strong>Response:</strong> <code>M411 OK</code> (acknowledge only or error) [cite: 11]
      </td>
    </tr>
    <tr>
      <td><code>dfu</code></td>
      <td>
        <strong>Command:</strong> enter programming mode<br>
        <strong>Arguments:</strong> none<br>
        <strong>Response:</strong> <code>OK</code> (acknowledge only or error)
      </td>
    </tr>
  </tbody>
</table>