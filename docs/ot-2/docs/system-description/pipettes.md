---
title: "Opentrons OT-2: Pipettes"
---

Opentrons OT-2 pipettes are configurable devices used to move liquids throughout the working area during protocol execution. There are several OT-2 pipettes to choose from, which can handle volumes from 1 µL to 1000 µL in single- or multi-channel (8-channel) configurations:

- P20 Single-Channel (1–20 µL)
- P300 Single-Channel (20–300 µL)
- P1000 Single-Channel (100–1000 µL)
- P20 Multi-Channel (1–20 µL)
- P300 Multi-Channel (20–300 µL)

<font color="red">PLACEHOLDER FOR GEN2 IMAGES ADD AFTER MERGE TO MAIN BRANCH</font>

A single-channel or multi-channel pipette each occupy one mount (left or right) on the carriage.

## Installation

For instructions on installing pipettes, see the [Instrument Installation and Calibration section](../installation/instruments.md).

## Picking up and dropping tips

The pipettes pick up disposable plastic tips by pressing them onto the pipette nozzles, and then aspirate and dispense liquids using the tips. The total force required for pickup increases as more tips are picked up simultaneously.

To discard tips (or return them to their rack), the pipette ejector mechanism pushes the tips off of the nozzles.

## OT-2 pipette specifications

OT-2 pipettes are designed to handle a wide range of liquid volumes and are compatible with multiple tip sizes. To help ensure performance and quality, Opentrons has tested these instruments with different tips and liquid volume combinations.

!!!tip
    For best results, use the smallest capacity tips that meet the needs of your protocol.

!!!note
    You do not have to calibrate the volume that your pipettes dispense before use. You only have to perform positional calibration.

<!-- reminder: fix link after API docs migrate to mkdocs -->
The following tables list the accuracy and precision specifications for OT-2 pipettes. For flow rate information, see [OT-2 Pipette Flow Rates](https://docs.opentrons.com/v2/pipettes/characteristics.html#ot-2-pipette-flow-rates) in the Opentrons API documentation.

### Single-channel pipettes

<table>
  <thead>
    <tr>
      <th>Pipette</th>
      <th>Volume (µL)</th>
      <th>%D</th>
      <th>Systematic Error (µL)</th>
      <th>%CV</th>
      <th>Random Error (µL)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>P20</strong></td>
      <td>1</td>
      <td>±15%</td>
      <td>0.15 µL</td>
      <td>±5%</td>
      <td>0.05 µL</td>
    </tr>
    <tr>
      <td></td>
      <td>10</td>
      <td>±2%</td>
      <td>0.2 µL</td>
      <td>±1%</td>
      <td>0.1 µL</td>
    </tr>
    <tr>
      <td></td>
      <td>20</td>
      <td>±1.5%</td>
      <td>0.3 µL</td>
      <td>±0.8%</td>
      <td>0.16 µL</td>
    </tr>
    <tr>
      <td><strong>P300</strong></td>
      <td>20</td>
      <td>±4%</td>
      <td>0.8 µL</td>
      <td>±2.5%</td>
      <td>0.05 µL</td>
    </tr>
    <tr>
      <td></td>
      <td>150</td>
      <td>±1%</td>
      <td>1.5 µL</td>
      <td>±0.4%</td>
      <td>0.6 µL</td>
    </tr>
    <tr>
      <td></td>
      <td>300</td>
      <td>±0.6%</td>
      <td>1.8 µL</td>
      <td>±0.3%</td>
      <td>0.9 µL</td>
    </tr>
    <tr>
      <td><strong>P1000</strong></td>
      <td>100</td>
      <td>±2%</td>
      <td>2.0 µL</td>
      <td>±1%</td>
      <td>1 µL</td>
    </tr>
    <tr>
      <td></td>
      <td>500</td>
      <td>±1%</td>
      <td>5.0 µL</td>
      <td>±0.2%</td>
      <td>1 µL</td>
    </tr>
    <tr>
      <td></td>
      <td>1000</td>
      <td>±0.7%</td>
      <td>7.0 µL</td>
      <td>±0.15%</td>
      <td>1.5 µL</td>
    </tr>
  </tbody>
</table>

### Multi-channel pipettes

These instruments have 8 channels.

<table>
  <thead>
    <tr>
      <th>Pipette</th>
      <th>Volume (µL)</th>
      <th>%D</th>
      <th>Systematic Error (µL)</th>
      <th>%CV</th>
      <th>Random Error (µL)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>P20</strong></td>
      <td>1</td>
      <td>±20%</td>
      <td>0.2 µL</td>
      <td>±10%</td>
      <td>0.1 µL</td>
    </tr>
    <tr>
      <td></td>
      <td>10</td>
      <td>±3%</td>
      <td>0.3 µL</td>
      <td>±2%</td>
      <td>0.2 µL</td>
    </tr>
    <tr>
      <td></td>
      <td>20</td>
      <td>±2.2%</td>
      <td>0.44 µL</td>
      <td>±1.5%</td>
      <td>0.3 µL</td>
    </tr>
    <tr>
      <td><strong>P300</strong></td>
      <td>20</td>
      <td>±10%</td>
      <td>2.0 µL</td>
      <td>±4%</td>
      <td>0.8 µL</td>
    </tr>
    <tr>
      <td></td>
      <td>150</td>
      <td>±2.5%</td>
      <td>3.75 µL</td>
      <td>±0.8%</td>
      <td>1.2 µL</td>
    </tr>
    <tr>
      <td></td>
      <td>300</td>
      <td>±1.5%</td>
      <td>4.5 µL</td>
      <td>±0.5%</td>
      <td>1.5 µL</td>
    </tr>
  </tbody>
</table>