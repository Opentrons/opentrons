---
title: "Opentrons OT-2: Heater-Shaker"
description: "Heater-Shaker Module: on-deck heating and orbital shaking (37–95 °C, 200–3000 rpm)."
---

![Heater-Shaker image](../images/heater-shaker-module.png)

## Heater-Shaker features

The [Opentrons Heater-Shaker Module](https://opentrons.com/products/heater-shaker-module?sku=991-00115-FL-UN) provides on-deck heating and orbital shaking. The Heater-Shaker can heat samples to 95 °C and shake them at speeds ranging from 200 to 3000 rpm. It is compatible with the Opentrons Flex and OT-2 liquid handling robots and selected flat, deep-well, and 96-well plates. The Heater-Shaker can also be used alongside other Opentrons modules.

!!! info "Additional Documentation"
    For complete instructions on module installation and use, see the [Heater-Shaker Instruction Manual](../../heater-shaker/index.md).

### Heating and shaking

The Heater-Shaker provides the following heating profile:

- Temperature range: 37–95 °C
- Temperature accuracy: ±0.5 °C at 55 °C
- Temperature uniformity: ±0.5 °C at 55 °C
- Ramp rate: 10 °C/min

The module can shake samples from 200 to 3000 rpm, with the following shaking profile:

- Orbital diameter: 2.0 mm
- Orbital direction: Clockwise
- Speed range: 200–3000 rpm
- Speed accuracy: ±25 rpm

The module has a powered labware latch for securing plates to the module prior to shaking.

### Thermal adapters { #thermal-adapters-ot2 }

A compatible thermal adapter is required for adding labware to the Heater-Shaker. Currently available Thermal Adapters include:

<div class="parts-list" markdown>

<figure markdown>
![Universal flat adapter](../images/heater-shaker-adapter-universal.png)
<figcaption>Universal Flat Adapter</figcaption>
</figure>

<figure markdown>
![PCR adapter](../images/heater-shaker-adapter-pcr.png)
<figcaption>PCR Adapter</figcaption>
</figure>

<figure markdown>
![Deep well adapter](../images/heater-shaker-adapter-deep-well.png)
<figcaption>Deep Well Adapter</figcaption>
</figure>

<figure markdown>
![96 well flat bottom adapter](../images/heater-shaker-adapter-flat-bottom.png)
<figcaption>96 Flat Bottom Adapter</figcaption>
</figure>

</div>

You can purchase adapters directly from Opentrons:

- [Universal Flat Adapter](https://opentrons.com/products/universal-flat-adapter)
- [PCR Adapter](https://opentrons.com/products/pcr-adapter)
- [Deep Well Adapter](https://opentrons.com/products/deep-well-adapter)
- [96 Flat Bottom Adapter](https://opentrons.com/products/96-flat-bottom-adapter/)

### Software control

The Heater-Shaker is fully programmable in [Protocol Designer](../../protocol-designer/index.md) and the [Python Protocol API](../../python-api/index.md). The Python API additionally allows for other protocol steps to be performed in parallel while the Heater-Shaker is active. See [Heater-Shaker Module section](../../python-api/modules/heater-shaker.md) in the API documentation for details on adding parallel steps to your protocols.

Outside of protocols, the Opentrons OT-2 App can display the current status of the Heater-Shaker and can directly control the heater, shaker, and labware latch.

## Heater-Shaker specifications

<table>
  <thead>
    <tr>
      <th>Specification</th>
      <th>Details</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Dimensions</strong></td>
      <td>152 × 90 × 82 mm (L/W/H)</td>
    </tr>
    <tr>
      <td><strong>Weight</strong></td>
      <td>1.34 kg</td>
    </tr>
    <tr>
      <td><strong>Module power input</strong></td>
      <td>36 VDC, 6.1 A</td>
    </tr>
    <tr>
      <td><strong>Power adapter input</strong></td>
      <td>100–240 VAC, 50/60 Hz</td>
    </tr>
    <tr>
      <td><strong>Mains supply voltage fluctuation</strong></td>
      <td>±10%</td>
    </tr>
    <tr>
      <td><strong>Overvoltage</strong></td>
      <td>Category II</td>
    </tr>
    <tr>
      <td><strong>Power consumption</strong></td>
      <td>
        Idle: 3 W<br />Typical:
        <ul>
          <li>Shaking: 4–11 W</li>
          <li>Heating: 10–30 W</li>
          <li>Heating and shaking: 10–40 W</li>
        </ul>
        Maximum: 125–130 W
      </td>
    </tr>
    <tr>
      <td><strong>Environmental conditions</strong></td>
      <td>Indoor use only</td>
    </tr>
    <tr>
      <td><strong>Ambient temperature</strong></td>
      <td>20–25 °C</td>
    </tr>
    <tr>
      <td><strong>Relative humidity</strong></td>
      <td>Up to 80%, non-condensing</td>
    </tr>
    <tr>
      <td><strong>Altitude</strong></td>
      <td>Up to 2,000 m above sea level</td>
    </tr>
    <tr>
      <td><strong>Pollution degree</strong></td>
      <td>2</td>
    </tr>
  </tbody>
</table>