---
title: "Opentrons Flex: Vacuum Module"
description: "Vacuum Module on Flex: vacuum-based sample purification."
---


![Vacuum Module cover image](../../vacuum/images/vacuum-module-cover.png)

!!! info "Additional Documentation"
    For detailed specifications, parts, installation and use, see the [Opentrons Vacuum Module GEN1 Instruction Manual](../../vacuum/index.md).

The Opentrons Vacuum Module is an automated vacuum filtration system designed for the Opentrons Flex. The module ships with all components required to run automated workflows that support protein and peptide sample cleanup, vacuum-based solid phase or nucleic acid extraction, and automated waste handling. You can control the Vacuum Module via the Opentrons App, the Flex touchscreen, Protocol Designer, or the Opentrons Python API (v2.31 or higher).

## Module features

### Components

The Vacuum Module includes an on-deck adapter and manifold base, modular spacers and collars for different filter plate geometries, an off-deck control box housing the vacuum pump and electronics, a 2-liter glass waste carboy with a protective stabilization cradle, and all necessary hoses and fittings.

### Labware

The Vacuum Module accepts ANSI/SLAS-compliant vacuum filtration labware. For best performance, Opentrons recommends using tested and verified filter plates. See the [Opentrons Labware Library](https://labware.opentrons.com/) for a complete list of supported filter plates.

!!! note "Gripper compatibility"
    The Flex Gripper can pick up and move vacuum collars and filter plates. However, the gripper cannot pick up the spacers included with the module. Spacers must be placed on and removed from the manifold base by hand.

### Deck location

The Vacuum Module uses a specialized deck adapter to hold the vacuum base, spacers, and collars. The adapter can only be installed in slots A3–A4.

* **Slot A3:** Houses the recessed vacuum manifold base and connects to the waste collection carboy.
* **Slot A4:** Known as "the dock," this is a staging area for collars and filter plates when they are not seated on the manifold base.

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
      <td>The control box houses the vacuum pump, pressure sensors, power supply and electronics.
        <ul>
            <li>Dimensions: 227 mm L x 200 mm W x 278 H (≈ 9" L x 8" W x 11" H)</li>
            <li>Weight: 10 kg (22 lbs)</li>
            <li>Pump type: piston</li>
            <li>Vacuum range: 0 mbar to -800 mbar (gauge pressure)</li>
        </ul>
      </td>
    </tr>
    <tr>
      <td><strong>Vacuum hoses</strong></td>
      <td>The module includes two vacuum hoses with factory-installed quick connect-disconnect fittings.
        <ul>
            <li>6 mm (&frac14;"), 2 m length</li>
            <li>9.5 mm (⅜"), 2 m length</li>
        </ul>
      </td>
    </tr>
    <tr>
      <td><strong>Power supply</strong></td>
      <td>The module is powered by an internal power supply.
        <ul>
            <li>Input power: 100–240 VAC, 50–60 Hz</li>
            <li>Output power: 24 VDC, 5.9 A, 140 W</li>
            <li>Fuse: T 8 A, 250 V</li>
        </ul>
      </td>
    </tr>
    <tr>
      <td><strong>Carboy</strong></td>
      <td>2 L borosilicate glass with a GL80 (blue) cap. The cap includes a built-in mechanical backflow preventer and is ported for quick connect-disconnect hose fittings.</td>
    </tr>
  </tbody>
</table>