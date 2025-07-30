---
title: "Heater-Shaker Module: Safety Information and Regulatory Compliance"
---

# Safety Information and Regulatory Compliance

Opentrons recommends that you follow the safe use specifications listed in this section and throughout this manual.

## Environmental Conditions

The Heater-Shaker should only be used indoors on a sturdy, dry, flat horizontal surface. It must be installed in a low-vibration environment with stable ambient conditions. Keep the Heater-Shaker away from direct sunlight or HVAC systems that may cause significant temperature or humidity changes.

Opentrons has validated the Heater-Shaker’s performance in the conditions recommended for system operation. Operating the unit in these conditions helps provide optimal results. The following table lists and defines the environmental operating conditions for recommended use, acceptable for system operation, and for storage of your Heater-Shaker.

<table>
  <thead>
    <tr>
      <th>Environmental Conditions</th>
      <th>Recommended</th>
      <th>Acceptable</th>
      <th>Storage and Transportation</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Ambient Temperatures</td>
      <td>20-24&deg;C</td>
      <td>20-25&deg;C</td>
      <td>-10 to +60&deg;C</td>
    </tr>
    <tr>
      <td>Relative Humidity</td>
      <td>40-60%, non-condensing</td>
      <td>80%</td>
      <td>10-85%, non-condensing (below 30&deg;C)</td>
    </tr>
    <tr>
      <td>Altitude</td>
      <td>Up to 2000 m above sea level</td>
      <td>Up to 2000 m above sea level</td>
      <td>Up to 2000 m above sea level</td>
    </tr>
    <tr>
      <td>Pollution Degree</td>
      <td>2</td>
      <td>2</td>
      <td>2</td>
    </tr>
  </tbody>
</table>

The following table lists and defines use and storage standards for the Heater-Shaker.

| Operating Conditions | Description |
|----|----|
| Recommended | Opentrons has validated the Heater-Shaker’s performance in the conditions recommended for system operation. Operating the Heater-Shaker in these conditions means you can expect the module to meet performance specifications for the module. |
| Acceptable | These conditions are acceptable for system operation. The Heater-Shaker is safe to use in these conditions, but the module may not meet performance specifications. |
| Storage | Storage and transportation conditions only apply when the device is completely disconnected from power and other equipment. |

## Instrument Safety Warnings

Warning symbols posted on the Heater-Shaker or listed here refer directly to the safe use of the instrument. Refer to the previous table for symbol definitions.

<table>
  <thead>
    <tr>
      <th>Symbol</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><img src="../images/hot-surface-warning.svg" alt="Hot surface warning symbol"></td>
      <td><strong>CAUTION: Hot surface.</strong><br>
        The Heater-Shaker generates enough heat to cause serious burns. Wear safety goggles or other eye protection at all times during operation. Always ensure the module returns to idle temperature before removing samples or the module. Always allow maximum clearance to avoid accidental burns.
      </td>
    </tr>
    <tr>
      <td><img src="../images/pinch-point-warning.svg" alt="Pinch point warning symbol"></td>
      <td><strong>CAUTION: Pinch point.</strong><br>
        The labware latch on the Heater-Shaker presents a pinch point hazard. Keep hands and fingers away from the module while the latch opens and closes.
      </td>
    </tr>
  </tbody>
</table>

## Temperature Safety

!!!warning
    Never touch the module when its status light is red.

During normal operation, the top plate, labware adapters, and labware on top of the Heater-Shaker can reach temperatures of up to 95 °C. Touching these surfaces while they are hot poses the risk of burns.

To reduce the risk of burns, always check the color of the status light before touching the module. If the status light is red, the module may be hot to the touch. Do not touch the module if it is hot. Use the Opentrons App to deactivate the heater and allow the module to cool until the LED status light is solid white. If you must handle a module that is powered off, and you are unsure whether it is hot to the touch:

- If you can do so _without touching any other part of the module_, press the power button to activate the module and check the color of the status light.

- If you cannot safely press the power button, allow the module to cool for at least 10 minutes before touching it.

### Powering Down

When powering down the Heater-Shaker, ensure that it is idle (not shaking) and not hot to the touch. If the module’s status light is solid white, it is safe to handle. If the status light is red, the module is hot. Allow the Heater-Shaker to cool until the status light is white before powering it down. Turning off the power while the status light is red prevents other users from determining whether the module is hot to the touch. See the <font color="red">LED Status Light section LINK TK</font> for more information about these visual status indicators.

Press the power button above the USB connector to turn off the module. You can unplug the power adapter once the module is powered down.

## Standards Compliance

The Heater-Shaker has been tested and found to be in compliance with all applicable requirements of the following safety and electromagnetic standards.

### Safety

- IEC/EN 61010-1 Safety­ Requirements­ for­ Electrical­ Equipment for­ Measurement,­ Control­, and Laboratory Use
- IEC ­ 61010-2-010­ Requirement ­for­ Heating
- IEC 61010-2-051: 2018­ Particular Requirements For Laboratory Equipment for Mixing and Stirring

### Electromagnetic Compatibility

- FCC part 15 subpart B class A
- IEC/EN 61326-1 EMC Testing of Laboratory Equipment

### Hazardous Substances

RoHS compliant

### FCC Warnings and Notes

**Warning:** Changes or modifications to this unit not expressly approved by Opentrons Labworks Inc. could void the user’s authority to operate the equipment.

**Note:** This equipment has been tested and found to comply with the limits for a Class A digital device, pursuant to part 15 of the FCC rules. These limits are designed to provide reasonable protection against harmful interference when the equipment is operated in a commercial environment. This equipment generates, uses, and can radiate radio frequency energy and, if not installed and used in accordance with the instruction manual, may cause harmful interference to radio communications. Operation of this equipment in a residential area is likely to cause harmful interference in which case the user will be required to correct the interference at their own expense.

**Note regarding FCC compliance:** Although this instrument has been tested and found to comply with Part 15, Subpart B of the FCC Rules for a Class A digital device, please note that this compliance is voluntary, for the instrument qualifies as an “exempted device” under 47 CFR 15.103(c), in regard to the cited FCC regulations in effect at the time of manufacture.

### CISPR 11 Class A

**Caution:** This equipment is not intended for use in residential environments and may not provide adequate protection to radio reception in such environments.
