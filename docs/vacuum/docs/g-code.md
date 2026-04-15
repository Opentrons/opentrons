---
title: "Vacuum Module: G-Code"
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
        <strong>Response elements:</strong> <code>R:</code>, last reset reason<br>
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
          <li><code>HW</code>: hardware version</li>
          <li><code>SerialNo</code>: serial number of the module</li>
        </ul>
        <strong>Response:</strong> <code>M115 FW:&lt;version&gt; HW:&lt;version&gt; SerialNo:&lt;serial number&gt; OK</code>
      </td>
    </tr>
<tr>
  <td><code>M120</code></td>
  <td>
    <strong>Command:</strong> set pressure state <br>
    <strong>Arguments:</strong>
    <ul>
      <li><code>S</code>: Start/stop control. Accepts <code>1</code> (on) or <code>0</code> (off).</li>
      <li><code>P</code>: Target gauge pressure in mbar. Range: <code>-1013</code> (full vacuum) to <code>0</code> (atmospheric) mbar.
          <br><strong>Note:</strong> While the firmware accepts -1013 mbar, the hardware’s achievable vacuum will fall short of this theoretical limit and depends on local atmospheric pressure.</li>
      <li><code>D</code>: Duration in seconds. Range: <code>0–86400</code> seconds (up to 24 hours).</li>
      <li><code>T</code>: Timeout in seconds to reach target pressure. Range: <code>0–86400</code> seconds (up to 24 hours).</li>
      <li><code>R</code>: Ramp rate in mbar/s. Range: <code>0–50</code>.</li>
      <li><code>V</code>: Vent state after cycle. Accepts <code>1</code> (open) or <code>0</code> (close).</li>
    </ul>
    <strong>Response: Returns </strong> <code>M120 OK</code>. If the target pressure is not reached within the timeout interval <code>T</code>, the module returns <code>err400: pressure not reached</code>.
  </td>
</tr>
    </tr>
    <tr>
      <td><code>M121</code></td>
      <td>
        <strong>Command:</strong> get pressure state<br>
        <strong>Arguments:</strong> none<br>
        <strong>Response elements:</strong>
        <ul>
          <li><code>T</code>: target pressure (absolute)</li>
          <li><code>C</code>: current pressure (absolute)</li>
          <li><code>A</code>: pressure from sensor A (absolute)
          <li><code>B</code>: pressure from sensor B (absolute)</li>
          <li><code>H</code>: atmospheric pressure</li>
          <li><code>E</code>: pressure control. Returns <code>1</code> (on) or <code>0</code> (off).</li>
          <li><code>V</code>: vent state. Returns <code>1</code> (open) or <code>0</code> (closed).</li>
        </ul>
        <strong>Response:</strong> <code>M121 T:400 C:1011.0 A:1010.9 B:1012.2 H:819.2 E:1 V:0 OK</code>
      </td>
    </tr>
    <tr>
<tr>
  <td><code>M122</code></td>
  <td>
    <strong>Command:</strong> set pump state. Sending this command puts the module into "Manual Mode," causing it to ignore any pressure targets previously set via <code>M120</code>.<br>
    <strong>Arguments:</strong>
    <ul>
      <li><code>S</code>: Start/stop control. Accepts <code>1</code> (start) or <code>0</code> (stop).</li>
      <li><code>R</code>: Target rpm. Range: <code>0–3500</code> rpm.</li>
      <li><code>D</code>: PWM duty cycle. Range: <code>0–100</code> (percentage). When specified, the module ignores the rpm value target (<code>R</code>).</li>
    </ul>
    <strong>Response: Returns </strong> <code>M123 OK</code>.
  </td>
</tr>
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