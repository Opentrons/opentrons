---
title: "Temperature Module: Safety and Compliance"
description: "Power requirements, environmental conditions, and regulatory compliance."
---

Opentrons recommends that you follow the safe use specifications listed in this section and throughout this manual.

## Power Supply Unit

The Temperature Module has the following power requirements, which are met by its external power supply unit (PSU). The following table describes some specifications for this device.

!!! warning
    Do not replace the power supply cable unless at the direction of Opentrons Support.

<table>
  <thead>
    <tr>
      <th>Specification</th>
      <th>PSU Details</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Manufacturer and model</strong></td>
      <td>The module is powered by a <a href="https://www.meanwell.com/index.aspx">Mean Well</a> GST220A36-R7B external PSU.</td>
    </tr>
    <tr>
      <td><strong>Compliance</strong></td>
      <td>
        <ul>
          <li>Energy efficiency Level VI</li>
          <li>Standards: USA EISA 2007/DoE, Canada NRCan, Australia and New Zealand MEPS, Korea K-MEPS, EU ErP, and Code of Conduct (CoC) Version 5</li>
          <li>Certifications: UL62368-1, TUV EN62368-1, BSMI CNS15598-1, CCC GB4943.1, PSE J62368-1, and AS/NZS 62368.1</li>
        </ul>
      </td>
    </tr>
    <tr>
      <td><strong>Input Power</strong></td>
      <td>
        <ul>
          <li>85–264 VAC</li>
          <li>85–264 VAC</li>
          <li>47–63 Hz</li>
          <li>2 A at 230 VAC or 4 A at 115 VAC</li>
        </ul>
      </td>
    </tr>
    <tr>
      <td><strong>Output Power</strong></td>
      <td>
        <ul>
          <li>36 VDC</li>
          <li>Up to 6.1 A</li>
          <li>219.6 W maximum rated power</li>
        </ul>
      </td>
    </tr>
    <tr>
      <td><strong>Over-voltage</strong></td>
      <td>
        <ul>
          <li>105–135% rated output voltage</li>
          <li>Protection Type: Hiccup mode; recovers automatically after fault condition is removed</li>
        </ul>
      </td>
    </tr>
    <tr>
      <td><strong>Mains Fluctuation</strong></td>
      <td>
        <ul>
          <li>Line Regulation: ±1.0%</li>
          <li>Voltage Tolerance: ±2.0%</li>
        </ul>
      </td>
    </tr>
    <tr>
      <td><strong>No-load</strong></td>
      <td>&lt; 0.15 W</td>
    </tr>
  </tbody>
</table>


## Environmental Conditions

The Temperature Module should only be used indoors on a sturdy, dry, flat horizontal surface. It must be installed in a low-vibration environment with stable ambient conditions. Keep the Temperature Module away from direct sunlight or HVAC systems that may cause significant temperature or humidity changes.

Opentrons has validated the Temperature Module’s performance in the conditions recommended for system operation. Operating the unit in these conditions helps provide optimal results. The Temperature Module is safe to use in conditions outside of the recommended ranges, but results may vary. The following table lists and defines the environmental operating conditions for recommended use and storage of your Temperature Module.

| Environmental Conditions | Recommended | Acceptable  | Storage and Transportation |
|----|----|----|----|
| Ambient Temperatures | 20–22 °C (for optimal cooling) | 20–25 °C | -10 to +60 °C |
| Relative Humidity | Up to 60%, non-condensing | 80% maximum | 10–85%, non-condensing (below 30 °C) |
| Altitude | Up to 2000 m above sea level | Up to 2000 m above sea level | Up to 2000 m above sea level |

!!!note "Note: Low Temperature Condensation"
    You may see condensation on the module’s cold surfaces upon reaching temperatures lower than ambient. The exact temperature at which condensation occurs depends on the atmospheric temperature and relative humidity in your lab. You can calculate this temperature by consulting any standard dew point index or condensation table.

## Instrument Safety Warnings

Warning symbols posted on the Opentrons Temperature Module refer directly to the safe use of the instrument.

<table>
    <thead>
        <tr>
            <th>Symbol</th>
            <th>Description</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><img src="../images/hot-warning-label.svg"></td>
            <td><strong>CAUTION: Hot surface.</strong><br>
                The Opentrons Temperature Module generates enough heat to cause serious burns. Wear safety goggles or other eye protection at all times during operation. Always ensure the sample block returns to idle temperature before removing samples. Always allow maximum clearance to avoid accidental burns.
            </td>
        </tr>
    </tbody>
</table>

## Standards Compliance

The Temperature Module has been tested and found to be in compliance with all applicable requirements of the following safety and electromagnetic standards.

### Safety

- IEC/UL/CSA 61010-1 Safety Requirements for Electrical Equipment for Measurement, Control, and Laboratory Use–Part 1: General Requirements
- IEC/UL/CSA 61010-2-010 Particular Requirements for Laboratory Equipment for the Heating of Materials

### Electromagnetic Compatibility

- EN/BSI 61326-1 Electrical Equipment for Measurement, Control and Laboratory Use –EMC Requirements–Part 1: General Requirements
- EN 55011 Industrial, Scientific and Medical Equipment–Radio Frequency Disturbance Characteristics–Limits and Methods of Measurement
- FCC 47CFR Part 15 Subpart B Class A: Unintentional Radiators
- IC ICES–003 Spectrum Management and Telecommunications Interference Causing Equipment Standard–Information Technology Equipment (Including Digital Apparatus)

### FCC Warnings and Notes

**Warning:** Changes or modifications to this unit not expressly approved by Opentrons could void the user's authority to operate the equipment. This device complies with part 15 of the FCC Rules. Operation is subject to the following two conditions:

- This device may not cause harmful interference.
- This device must accept any interference received, including interference that may cause undesired operation.

**Note:** This equipment has been tested and found to comply with the limits for a Class A digital device, pursuant to part 15 of the FCC rules. These limits are designed to provide a reasonable protection against harmful interference when the equipment is operated in a commercial environment. This equipment generates, uses, and can radiate radio frequency energy and, if not installed and used in accordance with the instruction manual, may cause harmful interference to radio communications. Operation of this equipment in a residential area is likely to cause harmful interference in which case the user will be required to correct the interference at their own expense.

### Canada ISED

Canada ICES-003(A)/NMB-003(A)
This product meets the applicable Innovation, Science and Economic Development Canada technical specifications.

Le présent produit est conforme aux spécifications techniques applicables d’Innovation, Sciences et Développement économique Canada.

### CISPR 11 Class A

**Caution:** This equipment is not intended for use in residential environments and may not provide adequate protection to radio reception in such environments.

### WEEE Policy

<img src="../images/WEEE.svg" style="float: right;" width="10%">
Opentrons is dedicated to adhering to the EU Directive on Waste Electrical and Electronic Equipment (WEEE – 2012/19/EU). Our goal is to ensure that our products are properly disposed of or recycled once they reach the end of their useful life.

Opentrons products that fall under the WEEE directive are labeled with the <img src="../images/WEEE.svg" style="height: 1.75em; vertical-align: middle;"> symbol, signifying that they should not be thrown away with regular household waste but must be collected and handled separately.

If you or your business have Opentrons products that are at end of life or need to be discarded for a separate purpose, contact Opentrons for proper disposal and recycling.