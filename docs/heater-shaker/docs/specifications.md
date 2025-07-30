---
title: "Heater-Shaker Module: Product Specifications"
---

# Product Specifications

<font color="red">IMAGE PLACEHOLDER</font>

## Model Number

GEN1

## Included Parts

<font color="red">IMAGE PLACEHOLDER</font>

## Software Requirements

The Heater-Shaker requires version 6.1.0 or newer of the Opentrons App and robot server. You can download the Opentrons App for Mac, Windows, or Linux at <https://opentrons.com/ot-app/>.

## Physical Specifications

All specifications are for the module as shipped: with latches in the closed position and without labware or adapters.

- **Dimensions:** 152 mm L x 90 mm W x 82 mm H
- **Weight:** 1.34 kg
- **Composition:** CNC aluminum and polycarbonate plastic

## Power Specifications

An external AC/DC power unit provides power to the Heater-Shaker. It connects to mains AC power with an IEC power cable and sends DC power to the module through a mini-DIN 4-pin power connector. The power specifications for this device are shown below:

- **Input:** 100–240 VAC, 50/60 Hz, 4.0 A
- **Output:** 36 VDC, 6.1 A, 219.6 W

!!!warning
    _Do not_ replace the power supply cable unless at the direction of Opentrons Support.

The following table lists power consumption values measured at the wall outlet. Typical power consumption is when the module maintains temperatures and shake speeds within the normal range. Maximum power consumption is when the module simultaneously heats at full power and shakes at maximum speed.

<table>
  <thead>
    <tr>
      <th>Operating Condition</th>
      <th>Power Consumption</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Idle</td>
      <td>3 W</td>
    </tr>
    <tr>
      <td>Normal</td>
      <td>
        <ul>
          <li>Shaking: 4-11 W</li>
          <li>Heating: 10-30 W</li>
          <li>Heating and Shaking: 10-40 W</li>
        </ul>
      </td>
    </tr>
    <tr>
      <td>Maximum</td>
      <td>125-130 W</td>
    </tr>
  </tbody>
</table>

## Shaking Profile

<table>
  <tbody>
    <tr>
      <th>Orbital Diameter</th>
      <td>2.0 mm</td>
    </tr>
    <tr>
      <th>Orbital Direction</th>
      <td>Clockwise</td>
    </tr>
    <tr>
      <th>Speed Range</th>
      <td>200–3000 rpm</td>
    </tr>
    <tr>
      <th>Speed Accuracy</th>
      <td>&plusmn;25 rpm</td>
    </tr>
  </tbody>
</table>

!!!note
    Some labware may recommend a lower rpm.

## Temperature Profile

table>
  <tbody>
    <tr>
      <th>Temperature Range</th>
      <td>37-95&deg;C</td>
    </tr>
    <tr>
      <th>Temperature Accuracy</th>
      <td>&plusmn;0.5&deg;C at 55&deg;C</td>
    </tr>
    <tr>
      <th>Temperature Uniformity</th>
      <td>&plusmn;0.5&deg;C at 55&deg;C</td>
    </tr>
    <tr>
      <th>Ramp Rate</th>
      <td>10&deg;C/min</td>
    </tr>
  </tbody>
</table>

## LED Status Light

The Heater-Shaker has an LED status light that can display three colors: amber, red, and white. Understanding these status indications is important for safely handling the module. The possible module conditions indicated by the light are listed below.

<table>
  <thead>
    <tr>
      <th>LED Color</th>
      <th>Module Status</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><span class="status-dot red"></span>Red</td>
      <td>Heating</td>
    </tr>
    <tr>
      <td>Solid red</td>
      <td>A red light indicates a hot temperature state.
        <ul>
          <li>Solid red: Hot to the touch (>49 °C).</li>
          <li>Pulsing red: Heating</li>
        </ul>
      </td>
    </tr>
    <tr>
      <td><span class="status-dot" white></span>White</td>
      <td>A solid white light indicates the module is:
        <ul>
          <li>Powered on and idle (not actively heating or cooling).</li>
          <li>Deactivated and not hot to the touch (<49 °C).</li>
        </ul>
      </td>
    </tr>
    <tr>
      <td><span class="status-dot" yellow></span> Amber</td>
      <td>
        <ul>
          <li>Solid amber indicates an error.</li>
          <li>Pulsing red and amber (alternating) indicates an error _and_ the module is hot to the touch (>49 °C)</li>
        <ul>
    </tr>
      <td>LED off</td>
      <td>Powered off</td>
    </tr>
  </tbody>
</table>
