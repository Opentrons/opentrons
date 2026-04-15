---
title: "Vacuum Module: G-Codes"
description: "Vacuum Module G-code commands and responses."
---

The Vacuum Module accepts the G-code commands listed below. 

!!! tip
    These commands rarely change, but you can always check for updates in the [module's driver files](https://github.com/Opentrons/opentrons/tree/edge/api/src/opentrons/drivers/vacuum_module) on GitHub.

<table>
  <thead>
    <tr>
      <th>G-Code</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>dfu</code></td>
      <td>
        <strong>Command:</strong> enter bootloader mode<br>
        <strong>Arguments:</strong> none<br>
        <strong>Response:</strong> none
      </td>
    </tr>
    <tr>
      <td><code>M114</code></td>
      <td>
        <strong>Command:</strong> get reset reason<br>
        <strong>Arguments:</strong> none <br>
        <strong>Response elements:</strong>
        <ul>
          <li><code>R</code>: last reset reason (retrieves the RCC reset flag) </li>
        </ul>
        <strong>Example:</strong> <code>M114</code> returns <code>M114 R:1 OK</code> 
      </td>
    </tr>
    <tr>
      <td><code>M115</code></td>
      <td>
        <strong>Command:</strong> get device info <br>
        <strong>Arguments:</strong> none<br>
        <strong>Response elements:</strong>
        <ul>
          <li><code>FW</code>: firmware version</li>
          <li><code>HW</code>: hardware revision. Possible values include <code>nff</code> or <code>a1</code> (EVT).</li>
          <li><code>SerialNo</code>: module serial number</li>
        </ul>
        <strong>Response:</strong> <code>M115 FW:(version) HW:nff SerialNo:(serial) OK</code>
      </td>
    </tr>
    <tr>
      <td><code>M120</code></td>
      <td>
        <strong>Command:</strong> set pressure state<br>
        <strong>Arguments:</strong>
        <ul>
          <li><code>S</code>: start/stop control (0: Off, 1: On)</li>
          <li><code>P</code>: target gauge pressure (-1013 to 0 mbar)</li>
          <li><code>D</code>: duration (0–86400 s)</li>
          <li><code>T</code>: timeout to reach target (0–86400 s)</li>
          <li><code>R</code>: ramp rate (0–50 mbar/s)</li>
          <li><code>V</code>: vent after cycle (0: Close, 1: Open)</li>
        </ul>
        <strong>Note:</strong> If the target is not reached within the timeout <code>T</code>, the module returns <code>err400: pressure not reached</code>. <br>
        <strong>Response:</strong> <code>M120 OK</code>
      </td>
    </tr>
    <tr>
      <td><code>M121</code></td>
      <td>
        <strong>Command:</strong> get pressure state<br>
        <strong>Arguments:</strong> none<br>
        <strong>Response elements:</strong>
        <ul>
          <li><code>T</code>: target pressure / <code>C</code>: current pressure</li>
          <li><code>A</code>/<code>B</code>: ABS pressure from Sensor A/B</li>
          <li><code>H</code>: ATM pressure</li>
          <li><code>E</code>: pressure control enabled (0: Off, 1: On)</li>
          <li><code>V</code>: vent state (0: Closed, 1: Open)</li>
        </ul>
        <strong>Response:</strong> <code>M121 T:400 C:1011.0 A:1010.9 B:1012.2 H:819.2 E:1 V:0 OK</code>
      </td>
    </tr>
    <tr>
      <td><code>M122</code></td>
      <td>
        <strong>Command:</strong> set pump state (Manual Mode)<br>
        <strong>Arguments:</strong>
        <ul>
          <li><code>S</code>: start RPM control (0: Stop, 1: Start)</li>
          <li><code>R</code>: target RPM (0–3500)</li>
          <li><code>D</code>: duty cycle/PWM (0–100, ignores <code>R</code> if provided)</li>
        </ul>
        <strong>Note:</strong> Sending this command puts the module into "Manual Mode," causing it to ignore pressure targets set by <code>M120</code>. <br>
        <strong>Response:</strong> <code>M122 OK</code>
      </td>
    </tr>
    <tr>
      <td><code>M123</code></td>
      <td>
        <strong>Command:</strong> get pump state<br>
        <strong>Arguments:</strong> none<br>
        <strong>Response elements:</strong>
        <ul>
          <li><code>T</code>: target RPM / <code>R</code>: current RPM</li>
          <li><code>A</code>: target duty cycle (PWM) / <code>D</code>: current duty cycle (PWM)</li>
          <li><code>E</code>: pump running state</li>
          <li><code>M</code>: manual mode enabled</li>
        </ul>
        <strong>Response:</strong> <code>M123 T:1000 R:998 A:0 D:0 E:1 M:1 OK</code>
      </td>
    </tr>
    <tr>
      <td><code>M124</code></td>
      <td>
        <strong>Command:</strong> set vent state<br>
        <strong>Arguments:</strong> <code>V</code> (0: Close, 1: Open) <br>
        <strong>Note:</strong> Opening the vent returns the system to atmospheric pressure. <br>
        <strong>Response:</strong> <code>M124 OK</code>
      </td>
    </tr>
    <tr>
      <td><code>M125</code></td>
      <td>
        <strong>Command:</strong> set pressure tunings (PID)<br>
        <strong>Arguments:</strong>
        <ul>
          <li><code>P</code>: Proportional / <code>I</code>: Integral / <code>D</code>: Derivative</li>
          <li><code>O</code>: Overshoot Error</li>
          <li><code>V</code>: K Velocity / <code>H</code>: K Holding</li>
          <li><code>T</code>: Relative Tolerance %</li>
          <li><code>R</code>: Reset PID</li>
        </ul>
        <strong>Response:</strong> <code>M125 OK</code>
      </td>
    </tr>
    <tr>
      <td><code>M126</code></td>
      <td>
        <strong>Command:</strong> get pressure tunings<br>
        <strong>Response:</strong> <code>M126 P:1 I:2 D:3 O:2 V:10 H:43 T:2 OK</code>
      </td>
    </tr>
    <tr>
      <td><code>M127</code></td>
      <td>
        <strong>Command:</strong> set waste detection configurations<br>
        <strong>Arguments:</strong>
        <ul>
          <li><code>E</code>: Enable Waste Full Detection (0: Disable, 1: Enable)</li>
          <li><code>S</code>: Pressure Window Start / <code>P</code>: Pressure Window End</li>
          <li><code>F</code>: Baseline Fast Factor</li>
          <li><code>D</code>: Max Delta Per Tick / <code>R</code>: Max Rise Per Tick</li>
          <li><code>C</code>: Max Cumulative Rise</li>
          <li><code>A</code>: Waste Full Sensor Alpha (Smoothing)</li>
          <li><code>M</code>: Min Window Time / <code>X</code>: Max Window Time</li>
        </ul>
        <strong>Response:</strong> <code>M127 OK</code>
      </td>
    </tr>
    <tr>
      <td><code>M128</code></td>
      <td>
        <strong>Command:</strong> get waste detection configurations<br>
        <strong>Response:</strong> <code>M128 S:0.10 P:0.95 F:0.75 D:3.4 R:250 C:11.4 A:0.95 M:600 X:20000 E:1 OK</code>
      </td>
    </tr>
    <tr>
      <td><code>M200</code></td>
      <td>
        <strong>Command:</strong> set status bar color and power<br>
        <strong>Arguments:</strong>
        <ul>
          <li><code>P</code>: power (float 0.0–1.0; >0 turns ON)</li>
          <li><code>C</code>: color (int 0: White, 1: Red, 2: Green, 3: Blue, 4: Yellow)</li>
          <li><code>K</code>: kind (0: internal, 1: external status bar)</li>
          <li><code>A</code>: pattern (0: Static, 1: Flash, 2: Pulse, 3: Confirm)</li>
          <li><code>D</code>: duration (int 25–10000 ms)</li>
          <li><code>R</code>: repetitions (-1 for forever)</li>
        </ul>
        <strong>Response:</strong> <code>M200 OK</code>
      </td>
    </tr>
    <tr>
      <td><code>M996</code></td>
      <td>
        <strong>Command:</strong> set serial number<br>
        <strong>Arguments:</strong> string (e.g., <code>vacuum-module-1</code>)<br>
        <strong>Response:</strong> <code>M996 OK</code>
      </td>
    </tr>
  </tbody>
</table>