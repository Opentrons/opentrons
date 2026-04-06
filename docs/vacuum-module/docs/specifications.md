---
title: "Vacuum Module: Product Specifications"
---

![Labeled parts placeholder](images/labeled-parts-placeholder.png)

## Included parts

<font color="red">PARTS IMAGES PLACEHOLDERS</font>

<div class="parts-list" markdown>

<figure markdown>
![Waste collection jar](images/waste-jar-line.png "Waste collection jar")
<figcaption>(1) GL60 collection jar</figcaption>
</figure>

<figure markdown>
![Vacuum pump unit](images/vacuum-pump.png "Vacuum pump")
<figcaption>(1) Vacuum pump</figcaption>
</figure>

<figure markdown>
![Vacuum hoses](images/hoses5.png "6 mm and 9.5 mm waste and vacuum tubes")
<figcaption>(1) 6 mm and 9.5 mm vacuum hoses</figcaption>
</figure>

<figure markdown>
![Waste collection carboy](images/deck-caddy.png "Deck caddy")
<figcaption>(1) Deck caddy</figcaption>
</figure>

<figure markdown>
![Bag of screws](images/deck-plate-screw.svg "Deck slot screws")
<figcaption>( ) M4x10 Deck slot screws</figcaption>
</figure>

<figure markdown>
![USB type A cable](images/usb-a-cable.png "USB A cable")
<figcaption>(1) USB A cable</figcaption>
</figure>

<figure markdown>
![Power cable](images/iec-plugs.png "Region-specific power cable")
<figcaption>(1) Region specific power cable</figcaption>
</figure>

</div>

## Physical specifications

| Header | Header |
|----|----|
| Vacuum module | L W H (include handle), weight |
| Maximum pump rate | L/min  |
| Measurement range (absolute) | 0 <emdash> xxx mbar |
| Resolution | x.x mbar |
| Tubing | Diameter, length, composition |
| Relative humidity | xx% at C |
| Temperature | |
| Humidity | |
| Altitude | Sea level to xxxx meters |

## Power supply

The Vacuum Module requires the following power inputs, which are met by its internal power supply.

<table>
  <thead>
    <tr>
      <th>Specification</th>
      <th>Details</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Manufacturer and model</strong></td>
        <td>
          <ul>
            <li>Mean Well</li>
            <li>LOP-200-24</li>
            <li>Low-profile, open-frame internal power supply</li>
          </ul>
        </td>
    </tr>
    <tr>
      <td><strong>Input Power</strong></td>
      <td>
        <ul>
          <li>80—264 VAC</li>
          <li>47—63 Hz</li>
          <li>1 A at 230 VAC or 2.5 A at 115 VAC</li>
        </ul>
      </td>
    </tr>
    <tr>
      <td><strong>Output Power</strong></td>
      <td>
        <ul>
          <li>24 VDC</li>
          <li>2.7 A to 25 A (varies by model and cooling method)</li>
          <li>140 W (maximum, with convection cooling)</li>
        </ul>
      </td>
    </tr>
    <tr>
      <td><strong>Over-voltage</strong></td>
      <td>
        <ul>
          <li>Category III (OVC III)</li>
          <li>Protection Type: Shutdown output voltage; requires re-powering to recover</li>
        </ul>
      </td>
    </tr>
    <tr>
      <td><strong>Mains Fluctuation</strong></td>
      <td>
        <ul>
          <li>Line Regulation: ±0.5%</li>
          <li>Voltage Tolerance: ±1.0% to ±3.0%</li>
        </ul>
      </td>
    </tr>
    <tr>
      <td><strong>Typical and Peak Consumption</strong></td>
      <td>
        <ul>
          <li>No-load Power Consumption: < 0.5 W </li>
          <li>Peak Load: 150% of rated power for up to 3 seconds</li>
        </ul>
      </td>
    </tr>
  </tbody>
</table>

## LED Status Lights

Status lights on the vacuum pump unit provide at-a-glance information about its operations. The colors and illumination patterns listed below indicate the different operating states.

<table>
    <tr>
        <th>LED color</th>
        <th>Module status</th>
    </tr>
<tr>
    <td>
        <div class="status-dot-container"> <!-- prevent line breaks in col 1 -->
            <span class="status-dot white"></span> White
        </div>
    </td>
    <td>A white light indicates a neutral operation state. For example:
      <ul>
        <li>Solid white: idle.</li>
        <li>Pulsing white: busy (e.g., starting, updating, or canceling an operation).</li>
            </ul>
      </td>
</tr>
    <tr>
        <td><span class="status-dot green"></span> Green</td>
        <td>A solid green light indicates a protocol is running.</td>
    </tr>
    <tr>
        <td><span class="status-dot blue"></span> Blue</td>
        <td>A pulsing blue light indicates the module requires attention.</td>
    </tr>
    <tr>
        <td><span class="status-dot red"></span> Red</td>
        <td>A pulsing red light indicates an error condition.</td>
    </tr>
</table>