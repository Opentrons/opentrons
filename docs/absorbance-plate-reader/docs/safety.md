---
title: "Plate Reader: Safety Information"
description: "Safe use, environmental conditions, and compliance for the plate reader."
---

Opentrons recommends that you follow the specifications listed in this section and throughout this manual. Always follow the [installation instructions](installation.md) to ensure proper and safe operation.

## Hardware Requirements

The Absorbance Plate Reader is designed for use with the Flex liquid handling robot. It cannot be used with an OT-2 robot or as standalone equipment.

The Absorbance Plate Reader requires an installed Flex Gripper. Only the gripper can move the module's illumination unit (lid). Opentrons software does not support manual lid movement or plate reader protocols without a gripper.

!!! warning
    Always use the gripper to move the illumination unit on or off the detection unit. Do not move the illumination unit by hand during setup or protocol execution. Moving the illumination unit manually can damage the electronic pins that connect these components.

## Environmental Conditions

The Absorbance Plate Reader should only be used indoors in an environment with stable ambient conditions. The following table lists and defines the environmental operating conditions for recommended use, transportation, and storage of your plate reader.

!!!note
    The module should not be powered on or used in settings that fall outside of the recommended operating conditions.

| Environmental Conditions | Recommended | Transportation | Storage |
|:-------------------------|:------------|:---------------|:--------|
| Ambient Temperatures     | +5 to +40 °C | -10 to 50 °C    | +5 to +40 °C |
| Relative Humidity        | Up to 70%   | Up to 70%      | Up to 70% |

The following table lists and defines standards for recommended use, transportation, and storage.

| Operating Conditions | Description |
|:---------------------|:------------|
| Recommended | Opentrons has validated the performance of the Absorbance Plate Reader in the conditions recommended for system operation. Operating the module in these conditions provides optimal results.|
| Transportation and storage | Storage and transportation conditions only apply when the device is completely disconnected from power and other equipment. |

## Instrument Safety Warnings

<table>
  <thead>
    <tr>
      <th>Symbol</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><img src="../images/yellow-caution.svg" alt="Caution symbol"></td>
      <td>
        <strong>CAUTIONS:</strong>
        <ul>
          <li>Protect the module from moisture, heat, and dust during long-term storage.</li>
          <li>Avoid operating or letting the module sit in direct sunlight.</li>
          <li>Don't store well plates filled with reagents in the module. Evaporating gases could damage it.</li>
          <li>Check for and remove well plates from the module before transport or storage. This helps avoid spillage and contamination.</li>
        </ul>
      </td>
    </tr>
  </tbody>
</table>
