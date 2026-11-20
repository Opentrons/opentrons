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
      <td><code>M114</code></td>
      <td>
        <strong>Command:</strong> get reset reason<br>
        <strong>Arguments:</strong> none <br>
        <strong>Response elements:</strong> <code>R:</code> and a reset code between 1–14. Codes are for Opentrons use only. They do not provide actionable information about normal module operations.<br>
        <strong>Example: </strong> <code>M114</code><br>
        <strong>Response:</strong> <code>M114 R:1 OK</code>
      </td>
    </tr>
    <tr>
      <td><code>M115</code></td>
      <td>
        <strong>Command:</strong> get firmware and software version and serial number<br>
        <strong>Arguments:</strong> none<br>
        <strong>Response elements:</strong>
        <ul>
          <li><code>FW</code>: firmware version</li>
          <li><code>HW</code>: hardware version</li>
          <li><code>SerialNo</code>: serial number of the module</li>
        </ul>
        <strong>Example:</strong> <code>M115</code><br>
        <strong>Response:</strong> <code>M115 FW: v1.0 HW: Opentrons-vacuum-module SerialNo:&lt;serial_number&gt; OK</code>
      </td>
    </tr>
    <tr>
      <td><code>M120</code></td>
      <td>
        <strong>Command:</strong> set pressure state <br>
        <strong>Arguments:</strong>
        <ul>
          <li><code>S</code>: Start/stop control. Accepts <code>1</code> (start/on) or <code>0</code> (stop/off).</li>
          <li><code>P</code>: Target gauge pressure in mbar. Range: <code>-1013</code>mbar (full vacuum) to <code>0</code> mbar (atmospheric).
            <br><strong>Note:</strong> While the firmware accepts -1013 mbar, the vacuum the pump can achieve will fall short of this theoretical limit and depends on local atmospheric pressure.</li>
          <li><code>D</code>: Duration in seconds <i>(optional)</i>. Range: <code>0</code> (indefinite) to <code>86400</code> seconds (24 hours).</li>
          <li><code>T</code>: Timeout in seconds to reach target pressure <i>(optional)</i>. Range: <code>0</code> (indefinite) to <code>86400</code> seconds (24 hours).
            <br><strong>Note:</strong> If the target pressure is not reached within the timeout interval, the module returns <code>err400: pressure not reached</code>.</li>
          <li><code>R</code>: Ramp rate in mbar/s <i>(optional)</i>. Range: <code>0–50</code> mbar/s.</li>
          <li><code>V</code>: Vent state after cycle <i>(optional)</i>. Accepts <code>1</code> (open) or <code>0</code> (close).</li>
        </ul>
        <strong>Example:</strong> <code>M120 S1 P-400</code> sets the gauge pressure to -400 mbar.<br>
        <strong>Response:</strong> <code>M120 OK</code>.<br>
      </td>
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
          <li><code>A</code>: pressure from sensor A (absolute)</li>
          <li><code>B</code>: pressure from sensor B (absolute)</li>
          <li><code>H</code>: atmospheric pressure</li>
          <li><code>E</code>: pressure control enabled. Returns <code>1</code> (on) or <code>0</code> (off).</li>
          <li><code>V</code>: vent state. Returns <code>1</code> (open) or <code>0</code> (closed).</li>
        </ul>
        <strong>Example:</strong> <code>M121</code><br>
        <strong>Response:</strong> <code>M121 T:400 C:1011.0 A:1010.9 B:1012.2 H:819.2 E:1 V:0 OK</code>
      </td>
    </tr>
    <tr>
      <td><code>M122</code></td>
      <td>
        <strong>Command:</strong> set pump state. This command enables "manual mode," which overrides any active pressure targets set via <code>M120</code>.<br>
        <strong>Arguments:</strong>
        <ul>
          <li><code>S</code>: Start/stop control. Accepts <code>1</code> (start) or <code>0</code> (stop).</li>
          <li><code>R</code>: Target rpm. Range: <code>0–3500</code> rpm.</li>
          <li><code>D</code>: PWM duty cycle. Range: <code>0–100</code>, expressed as a %. When specified, the module ignores the rpm value target (<code>R</code>).</li>
        </ul>
        <strong>Example:</strong> <code>M122 S1 D50</code>, run the motor at 50% duty cycle.<br>
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
          <li><code>T</code>: target rpm</li>
          <li><code>R</code>: current rpm</li>
          <li><code>A</code>: target PWM duty cycle, expressed as a %.</li>
          <li><code>D</code>: current PWM duty cycle, expressed as a %.</li>
          <li><code>E</code>: pump running state. Returns <code>1</code> (running) or <code>0</code> (stopped).</li>
          <li><code>M</code>: manual mode state. Returns <code>1</code> (enabled) or <code>0</code> (disabled).</li>
        </ul>
        <strong>Example:</strong> <code>M123</code><br>
        <strong>Response:</strong> <code>M123 T:100 R:998 A:0 D:0 E:1 M:1 OK</code>
      </td>
    </tr>
    <tr>
      <td><code>M124</code></td>
      <td>
        <strong>Command:</strong> set vent state.<br>
        <strong>Arguments:</strong> <code>V</code>, vent state. Accepts <code>1</code> (open) or <code>0</code> (close). Opening the vent (<code>V1</code>) returns the system to atmospheric pressure.<br>
        <strong>Example:</strong><code>M124 V1</code><br>
        <strong>Response:</strong><code>M124 OK</code>
      </td>
    </tr>
    <tr>
      <td><code>M125</code></td>
      <td>
        <strong>Command:</strong> set pressure tunings (PID parameters). These values control the responsiveness and stability of the vacuum control loop.<br>
        <strong>Arguments:</strong>
        <ul>
          <li><code>P</code>: proportional gain <i>(optional)</i></li>
          <li><code>I</code>: integral gain <i>(optional)</i></li>
          <li><code>D</code>: derivative gain <i>(optional)</i></li>
          <li><code>O</code>: overshoot error limit <i>(optional)</i></li>
          <li><code>V</code>: velocity constant (K<sub>v</sub>) <i>(optional)</i></li>
          <li><code>H</code>: holding constant (K<sub>h</sub>) <i>(optional)</i></li>
          <li><code>T</code>: the allowable percentage deviation (range 1—100 %) from the target pressure. <i>(optional)</i></li>
          <li><code>R</code>: <code>1</code> resets the pressure control PID error and integral terms.</li>
        </ul>
        <strong>Example:</strong> <code>M125, P1, I2, D3, T2</code>. Sets the PID to 1, 2, and 3 (respectively), and sets the pressure target deviation to 2%.<br>
        <strong>Response:</strong> <code>M125 OK</code>
      </td>
    </tr>
    <tr>
      <td><code>M126</code></td>
      <td>
        <strong>Command:</strong> get pressure tunings<br>
        <strong>Arguments:</strong> none<br>
        <strong>Example:</strong> <code>M126</code><br>
        <strong>Response:</strong> <code>M126 P:1 I:2 D:3 O:2 V:10 H:43 T:2 OK</code>
      </td>
    </tr>
    <tr>
      <td><code>M128</code></td>
      <td>
        <strong>Command:</strong> get waste detection configurations<br>
        <strong>Arguments:</strong> none<br>
        <strong>Example:</strong> <code>M128</code><br>
        <strong>Response:</strong> <code>M128 S:0.10 P:0.95 F:0.75 D:3.4 R:250 C:11.4 A:0.95 M:600 X:20000 E:1 OK</code><br>
      </td>
    </tr>
  </tbody>
</table>
