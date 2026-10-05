---
title: "Opentrons Flex: Vacuum Module"
description: "Vacuum Module on Flex: vacuum-based sample purification."
---


![Vacuum Module cover image](../../vacuum/images/vacuum-module-cover.png)

!!! info "Additional Documentation"
    For complete instructions on installation and use, see the [Vacuum Module Instruction Manual](../../vacuum/index.md).

The Opentrons Vacuum Module is an automated vacuum filtration system designed for the Opentrons Flex. The module ships will all components required to run automated workflows that support protein and peptide sample cleanup, vacuum-based solid phase or nucleic acid extraction, and automated waste handling. You can control the Vacuum Module via the Opentrons App, the Flex touchscreen, Protocol Designer, or the Opentrons Python API (v2.31 or higher). The module is also fully compatible with the Flex Gripper.

## Module features

### Components

The Vacuum Module includes an on-deck adapter and manifold, modular spacers and collars for different filter plate geometries, an off-deck control box housing the vacuum pump and electronics, a 2-liter glass carboy, carboy holder, along with all the hoses and adapters required to run automated vacuum protocols.

### Labware

While the Vacuum Module accepts ANSI/SLAS compliant vacuum filtration labware, for best performance Opentrons recommends you use it with tested and verified filter plates. See the [Opentrons Labware Library](https://labware.opentrons.com/) for a complete list of supported filter plates.

### Deck location

The Vacuum Module uses a special deck slot adapter to hold the vacuum base, spacers, and collars. The adapter can only be installed in slots A3–A4.

## Specifications

The following table is a summary for the major module components. For more information and detailed compliance specifications, see the [Safety and Compliance](../../vacuum/compliance.md) and [Product Specifications](../../vacuum/specifications/index.md) sections in the Vacuum Module Instruction Manual.

<table>
  <thead>
    <tr>
      <th>Specification</th>
      <th>Details</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Control box</strong></td>
      <td>The control box houses the pump and module electronics.
        <ul>
            <li>Dimensions: 225 mm L x 200 mm W x 278 H (≈ 9" L x 8" W x 11" H)</li>
            <li>Weight: 10 kg (22 lbs)</li>
            <li>Pump type: piston</li>
            <li>Flow rate: 50.1 L/min (gas)</li>
            <li>Vacuum range: 0 mbar to -800 mbar (gague pressure)</li>
        </ul>
        <p>Note: values reflect the pump manufacturer's hardware ratings. Actual flow rates and vacuum ranges may be limited by Opentrons software.</p></td>
    </tr>
    <tr>
      <td><strong>Vacuum hoses</strong></td>
      <td>The module ships with two vacuum hoses. Quick connect/disconnect fittings are installed at the factory.
        <ul>
            <li>6 mm (&frac14;"), 2 m length</li>
            <li>9.5 mm (⅜"), 2 m length</li>
        </ul></td>
    </tr>
    <tr>
      <td><strong>Power supply</strong></td>
      <td>The module is powered by an internal power supply.
        <ul>
            <li>Input power: 100–240 VAC, 50–60 Hz</li>
            <li>Output power: 24 VDC, 5.9 A, 140 W</li>
        </ul>
      </td>
    </tr>
    <tr>
      <td><strong>Carboy</strong></td>
      <td>2 liter borosilicate glass with a GL80 (blue) cap, ported and threaded for quick connect/disconnect hose fittings.</td>
    </tr>
  </tbody>
</table>