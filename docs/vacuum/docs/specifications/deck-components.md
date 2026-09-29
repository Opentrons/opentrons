---
title: "Vacuum Module: Deck Components"
description: "Overview of Vacuum Module base, collars, and spacers."
---

Module deck components consist of a vacuum base, interchangeable collars, internal spacers, and well plate support grids. The vacuum base forms the foundation of this on-deck hardware stack. Collars and spacers rest sequentially on the base to control labware stacking heights between well plates and help ensure an airtight seal. At the top of the stack, a wide or narrow aperture metal grid provides extra support for a filter plate when placed under vacuum.

## Vacuum base

The vacuum base sits directly on its own deck plate. It is the foundation for the module's hardware stack, supporting all internal spacers, collars, and well plates.

<figure markdown>
  ![Vacuum base](../images/vacuum-module-base.svg){ width="90%" }
  <figcaption>Vacuum base with quick-connect manifold</figcaption>
</figure>

When connected to the waste carboy, negative pressure from the vacuum pump draws liquid down cleanly through the module assembly. The vacuum base collects this fluid, routing it into an internal collection plate or out to the external carboy via the attached 6 mm hose.

## Collars

Collars sit directly on the vacuum base. They support filter plates used during vacuum extraction protocols. Each collar features an integrated gasket that forms an airtight vacuum seal with the well plate, while a secondary gasket on the vacuum base seals it to the collar. The short and tall collars are fully compatible with the Flex Gripper.

The Vacuum Module includes two collars to match different labware profiles:

* **Short Collar (42 mm):** Optimized for filter plates that typically have working volume ranges between 50 μL and 250 μL.
* **Tall Collar (72 mm):** Optimized for deep-well filter plates that typically have working volumes up to 1.8 mL.

Both collars accommodate standard ANSI/SLAS compliant filter plates.

<figure class="side-by-side" markdown>
![Illustration of short collar, 42 mm](../images/collar-short.svg)
![Illustration of tall collar, 72 mm](../images/collar-tall.svg)
<figcaption>Short collar (42 mm) and tall collar (72 mm)</figcaption>
</figure>

## Support grids

Support grids hold filter plates on top of the short or tall collars. These grids are made of metal and provide a rigid foundation that supports filter plates when placed under strong vacuum pressure.

The Vacuum Module includes two support grids with perforations that match different well plate profiles:

- **Wide grid:** Features large apertures to support 96-well filter plates.
- **Narrow grid:** Features small apertures to support 384-well filter plates.

<figure class="side-by-side" markdown>
![Wide support grid](../images/support-grid-96-wells.svg)
![Narrow support grid](../images/support-grid-384-wells.svg)
<figcaption>Wide and narrow support grids</figcaption>
</figure>

## Spacers

Spacers (or shims) sit directly on the vacuum manifold base. These pieces raise the collection plate closer to the filter plate above it. Minimizing the gap between plates ensures fluid droplets fall cleanly into receiving wells.

!!! note
    Spacers are not gripper-compatible. You must manually stack them on the vacuum base and each other.

### Available heights

Each Vacuum Module comes with three flat shim spacers (3.2 mm, 5.2 mm, and 7.25 mm) and a tall 12.8 mm spacer. The tall spacer features locating clips that hold a standard ANSI/SLAS 96-well filter plate.

<div class="parts-list" markdown>

<figure markdown>
![3.2 mm spacer](../images/spacer-3mm.svg)
<figcaption>3.2 mm spacer</figcaption>
</figure>

<figure markdown>
![5.2 mm spacer](../images/spacer-5mm.svg)
<figcaption>5.2 mm spacer</figcaption>
</figure>

</div>

<div class="parts-list" markdown>

<figure markdown>
![7.25 mm spacer](../images/spacer-7mm.svg)
<figcaption>7.25 mm spacer</figcaption>
</figure>

<figure markdown>
![12.8 mm spacer](../images/spacer-12mm.svg)
<figcaption>12.8 mm spacer</figcaption>
</figure>

</div>

### Display and load names

Special definition files set the spacer display names that appear in Opentrons software and on the Flex touchscreen. These files also include API `loadName` strings for each spacer.

<!--- Including 2 items in 1 column to avoid line breaks --->

| Spacer height | Display and API load name |
| :--- | :--- |
| **3.2 mm** | Opentrons Vacuum Manifold Spacer 3.2 mm<br>`opentrons_vacuum_manifold_spacer_3.2mm` |
| **5.2 mm** | Opentrons Vacuum Manifold Spacer 5.2 mm<br>`opentrons_vacuum_manifold_spacer_5.2mm` |
| **7.25 mm** | Opentrons Vacuum Manifold Spacer 7.25 mm<br>`opentrons_vacuum_manifold_spacer_7.25mm` |
| **12.8 mm** | Opentrons Vacuum Manifold Spacer 12.8 mm<br>`opentrons_vacuum_manifold_spacer_12.8mm` |

### Stacking rules

All of the spacers are compatible with the vacuum base, but some spacer combinations are invalid. The following table defines the rules for stacking spacers properly.

<table>
  <thead>
    <tr>
      <th>Rule</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Maximum stack height</strong></td>
      <td>A stack may contain up to three spacers total.</strong></td>
    </tr>
    <tr>
      <td><strong>No duplicate spacers</strong></td>
      <td>Use only one spacer of each height per stack.</td>
    </tr>
    <tr>
      <td><strong>Stack sequence</strong></td>
      <td>Flat spacers (3.2 mm, 5.2 mm, and 7.25 mm) may stack directly on the vacuum base or atop one another in any order.</td>
    </tr>
    <tr>
      <td><strong>12 mm spacer</strong></td>
      <td>
        <ul>
          <li>When used, the 12.8 mm spacer must always sit at the very top of a spacer stack.</li>
          <li>Do not stack flat spacers (3.2 mm, 5.2 mm, and 7.25 mm) on top of the 12.8 mm spacer.</td>
    </tr>
  </tbody>
</table>
