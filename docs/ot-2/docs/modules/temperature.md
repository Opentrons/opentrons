---
title: "Opentrons OT-2: Temperature Module"
description: "Temperature Module features, thermal blocks, and temperature range (4–95 °C)."
---

![Temperature Module](../images/temperature-module.png)

## Temperature Module features

The [Opentrons Temperature Module](https://opentrons.com/products/temperature-module-gen2?sku=991-00350-0) is a hot and cold plate module. It can reach and maintain temperatures ranging from 4 °C to 95 °C. The Temperature Module is often used in protocols that require heating, cooling, rapid temperature changes, or for long duration storage of samples and reagents at a specific, constant temperature. The module is compatible with various thermal block adapters and the Opentrons Flex and OT-2 liquid handling robots.

!!! note "Additional Documentation"
    For complete instructions on module installation and use, see the [Temperature Module Instruction Manual](../../temperature-module/index.md).

### Heating and cooling

The Temperature Module is designed to achieve and maintain a target temperature on the top plate surface, within its performance specifications. The thermal block, labware, and sample volumes will affect the temperature of the sample, relative to the temperature of the top plate surface. Opentrons recommends testing the temperature within the sample to determine if additional adjustments are needed to meet the requirements of your application. If you have additional questions, please contact Opentrons Support.

Additionally, Opentrons has tested the Temperature Module’s temperature profile with both the 24-well and 96-well thermal blocks. The module can generally reach its minimum temperature in 12 to 18 minutes, depending on the block and contents. The module can reach a hot temperature (65 °C) in six minutes. For more details, see the [Temperature Module White Paper](https://insights.opentrons.com/hubfs/Products/Modules/Temperature%20Module%20White%20Paper.pdf).

### Thermal blocks

The Temperature Module uses aluminum thermal blocks to hold labware at temperature. The module comes with a 24-well block, a 96-well PCR block, and a flat bottom block. The blocks hold 1.5 mL and 2.0 mL tubes, 96-well PCR plates, PCR strips, deep well plates, and flat bottom plates. You can also buy these aluminum blocks from the [Modules section](https://opentrons.com/products/categories/modules) of the Opentrons website.

### Software control

The Temperature Module is fully programmable in [Protocol Designer](../../protocol-designer/index.md) and the [Python Protocol API](../../python-api/index.md).

Outside of protocols, the Opentrons OT-2 App can display the current status of the Temperature Module and can directly control the temperature of the surface plate.

## Temperature Module specifications

<table>
  <thead>
    <tr>
      <th><strong>Specification</strong></th>
      <th><strong>Details</strong></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Dimensions</strong></td>
      <td>194 × 90 × 84 mm (L/W/H)</td>
    </tr>
    <tr>
      <td><strong>Weight</strong></td>
      <td>1.5 kg</td>
    </tr>
    <tr>
      <td><strong>Module power input</strong></td>
      <td>36 VDC, 6.1 A (219.6 W max)</td>
    </tr>
    <tr>
      <td><strong>Power adapter input</strong></td>
      <td>100–240 VAC, 50/60 Hz, 4.0 A</td>
    </tr>
    <tr>
      <td><strong>Environmental conditions</strong></td>
      <td>Indoor use only</td>
    </tr>
    <tr>
      <td><strong>Ambient temperature</strong></td>
      <td>&lt;22 °C (recommended for optimal cooling)</td>
    </tr>
    <tr>
      <td><strong>Relative humidity</strong></td>
      <td>Up to 60%, non-condensing</td>
    </tr>
    <tr>
      <td><strong>Altitude</strong></td>
      <td>Up to 2000 m above sea level</td>
    </tr>
    <tr>
      <td><strong>Pollution degree</strong></td>
      <td>2</td>
    </tr>
  </tbody>
</table>