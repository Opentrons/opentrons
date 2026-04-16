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
        <strong>Response elements:</strong> <code>R:</code>, last reset reason <font color="red">Is there a list of reasons?</font><br>
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
          <li><code>S</code>: Start/stop control. Accepts <code>1</code> (start/on) or <code>0</code> (stop/off).</li>
          <li><code>P</code>: Target gauge pressure in mbar. Range: <code>-1013</code>mbar (full vacuum) to <code>0</code> mbar (atmospheric).
            <br><strong>Note:</strong> While the firmware accepts -1013 mbar, the vacuum the pump can achieve will fall short of this theoretical limit and depends on local atmospheric pressure.</li>
          <li><code>D</code>: Duration in seconds. Range: <code>0–86400</code> seconds (up to 24 hours).</li>
          <li><code>T</code>: Timeout in seconds to reach target pressure. Range: <code>0–86400</code> seconds (up to 24 hours).</li>
          <li><code>R</code>: Ramp rate in mbar/s. Range: <code>0–50</code> mbar/s.</li>
          <li><code>V</code>: Vent state after cycle. Accepts <code>1</code> (open) or <code>0</code> (close).</li>
        </ul>
        <strong>Response: Returns </strong> <code>M120 OK</code>. If the target pressure is not reached within the timeout interval <code>T</code>, the module returns <code>err400: pressure not reached</code>.
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
        <strong>Response: Returns </strong> <code>M121 T:&lt;target&gt; C:&lt;current&gt; A:&lt;sensor_a&gt; B:&lt;sensor_b&gt; H:&lt;atm&gt; E:&lt;enabled&gt; V:&lt;vent&gt; OK</code>
      </td>
    </tr>
    <tr>
      <td><code>M122</code></td>
      <td>
        <strong>Command:</strong> set pump state. Sending this command puts the module into "manual mode," causing it to ignore any pressure targets previously set via <code>M120</code>.<br>
        <strong>Arguments:</strong>
        <ul>
          <li><code>S</code>: Start/stop control. Accepts <code>1</code> (start) or <code>0</code> (stop).</li>
          <li><code>R</code>: Target rpm. Range: <code>0–3500</code> rpm.</li>
          <li><code>D</code>: PWM duty cycle. Range: <code>0–100</code>, expressed as a %. When specified, the module ignores the rpm value target (<code>R</code>).</li>
        </ul>
        <strong>Response: Returns </strong> <code>M122 OK</code><font color="red">Does this fail, similar to M120?</font>.
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
        <strong>Response: Returns </strong> <code>M123 T:&lt;target_rpm&gt; R:&lt;current_rpm&gt; A:&lt;target_pwm&gt; D:&lt;current_pwm&gt; E:&lt;running&gt; M:&lt;manual&gt; OK</code>
      </td>
    </tr>
    <tr>
      <td><code>M124</code></td>
      <td>
        <strong>Command:</strong> set vent state.<br>
        <strong>Arguments:</strong>
        <ul>
          <li><code>V</code>: vent state. Accepts <code>1</code> (open) or <code>0</code> (close). Opening the vent (<code>V1</code>) returns the system to atmospheric pressure.</li>
        </ul>
        <strong>Response: Returns </strong><code>M124 OK</code>.
      </td>
    </tr>
    <tr>
      <td><code>M125</code></td>
      <td>
        <strong>Command:</strong> set pressure tunings (PID parameters). These values control the responsiveness and stability of the vacuum control loop.<br>
        <strong>Arguments:</strong>
        <ul>
          <li><code>P</code>: proportional gain</li>
          <li><code>I</code>: integral gain</li>
          <li><code>D</code>: derivative gain</li>
          <li><code>O</code>: overshoot error limit</li>
          <li><code>V</code>: velocity constant (K<sub>v</sub>)</li>
          <li><code>H</code>: holding constant (K<sub>h</sub>)</li>
          <li><code>T</code>: relative tolerance, expressed as a % <font color="red">Check if %</font></li>
          <li><code>R</code>: reset PID (accepts <code>1</code> to trigger)</li>
        </ul>
        <strong>Response: Returns </strong> <code>M125 OK</code>.
      </td>
    </tr>
    <tr>
      <td><code>M126</code></td>
      <td>
        <strong>Command:</strong> get pressure tunings<br>
        <strong>Arguments:</strong> none<br>
        <strong>Response: Returns </strong> <code>M126 P:&lt;p&gt; I:&lt;i&gt; D:&lt;d&gt; O:&lt;o&gt; V:&lt;v&gt; H:&lt;h&gt; T:&lt;tolerance&gt; OK</code>
      </td>
    </tr>
    <tr>
      <td><code>M127</code></td>
      <td>
        <strong>Command:</strong> set waste detection configurations. These parameters are used to detect a "waste full" condition based on pressure fluctuations.<br>
        <strong>Arguments:</strong>
        <ul>
          <li><code>E</code>: enable waste full detection. Accepts <code>1</code> (on) or <code>0</code> (off).</li>
          <li><code>S</code>: pressure window start.</li>
          <li><code>P</code>: pressure window end.</li>
          <li><code>F</code>: baseline fast factor.</li>
          <li><code>D</code>: max delta per tick. <font color="red">what or how much is a "tick"?</font></li>
          <li><code>R</code>: max rise per tick. <font color="red">what or how much is a "tick"?</font></li>
          <li><code>C</code>: max cumulative rise.</li>
          <li><code>A</code>: alpha (smoothing factor).</li>
          <li><code>M</code>: minimum window time (ms).</li>
          <li><code>X</code>: maximum window time (ms).</font></li>
        </ul>
        <strong>Response: Returns </strong> <code>M127 OK</code>.
      </td>
    </tr>
    <tr>
      <td><code>M128</code></td>
      <td>
        <strong>Command:</strong> get waste detection configurations<br>
        <strong>Arguments:</strong> none<br>
        <strong>Response: Returns </strong> <code>M128 S:&lt;start&gt; P:&lt;end&gt; F:&lt;fast&gt; D:&lt;delta&gt; R:&lt;rise&gt; C:&lt;cumulative&gt; A:&lt;alpha&gt; M:&lt;min&gt; X:&lt;max&gt; E:&lt;enabled&gt; OK</code>
      </td>
    </tr>
    <tr>
      <td><code>M200</code></td>
      <td>
        <strong>Command:</strong> set status bar color and pattern.<br>
        <strong>Arguments:</strong>
        <ul>
          <li><code>P</code>: power. Float range <code>0.0–1.0</code> (0 is off, 1.0 is full brightness).</li>
          <li><code>C</code>: color. Accepts: <code>0</code> (white), <code>1</code> (red), <code>2</code> (green), <code>3</code> (blue), <code>4</code> (yellow).</li>
          <li><code>K</code>: kind. Accepts <code>0</code> (internal status bar) or <code>1</code> (external status bar).</li>
          <li><code>A</code>: animation pattern. Accepts: <code>0</code> (static), <code>1</code> (flash), <code>2</code> (pulse), <code>3</code> (confirm).</li>
          <li><code>D</code>: duration in ms. Range: <code>25–10000</code> ms.</li>
          <li><code>R</code>: repetitions. Use <code>-1</code> for an infinite loop.</li>
        </ul>
        <strong>Response: Returns </strong> <code>M200 OK</code>.
      </td>
    </tr>
    <tr>
      <td><code>M996</code></td>
      <td>
        <strong>Command:</strong> set module serial number. This is typically used during factory calibration to assign a unique identifier. <font color="red">Exclude this? Do we want people setting the SN?</font><br>
        <strong>Arguments:</strong>
        <ul>
          <li>Takes a single string argument (e.g., <code>vacuum-module-v1</code>).</li>
        </ul>
        <strong>Response: Returns </strong> <code>M996 OK</code>.
      </td>
    </tr>
    <tr>
      <td><code>dfu</code></td>
      <td>
        <strong>Command:</strong> enter bootloader mode<br>
        <strong>Arguments:</strong> none<br>
        <strong>Response:</strong> none
      </td>
    </tr>
  </tbody>
</table>
