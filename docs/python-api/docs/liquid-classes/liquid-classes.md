---
title: 'Python API: Liquid Class Properties'
---

Opentrons-verified liquid classes are based on the properties of common liquids: water, ethanol, and glycerol.

| Opentrons-verified liquid class | Description              | Load name {width="25%"} |
| ------------------------------- | ------------------------ | ----------------------- |
| Aqueous                         | Based on deionized water | `water`                 |
| Volatile                        | Based on 80% ethanol     | `ethanol_80`            |
| Viscous                         | Based on 50% glycerol    | `glycerol_50`           |

Use Opentrons-verified liquid classes in your transfers to automatically apply optimized behavior. For example, choosing the `glycerol_50` liquid class changes properties, like flow rate, to accurately transfer viscous liquid.

Other propreties like submerge speed, touch tip, and air gap can help prevent splashing or dripping of a volatile liquid, or reduce air bubbles forming in a viscous liquid. 

Each Opentrons-verified liquid class is defined by a set of these properties:

<table>
    <thead>
        <tr>
            <th>Property</th>
            <th>Description</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>
                <img src="../lc_icons/submerge_position.png">
                <p><strong>Submerge position</strong></p>
            </td>
            <td>The pipette begins at this position above the liquid.</td>
        </tr>
        <tr>
            <td>
                <img src="../lc_icons/submerge_speed.png">
                <p><strong>Submerge speed</strong></p>
            </td>
            <td>The pipette submerges into the liquid at this speed.</td>
        </tr>
        <tr>
            <td>
                <img src="../lc_icons/delay_after_submerge.png">
                <p><strong>Delay after submerging</strong></p>
            </td>
            <td>
                <p>The pipette delays a specified amount of time:</p>
                <ul>
                    <li>before submerging into or retracting from liquid.</li>
                    <li>before or after an aspirate or dispense.</li>
                    <li>after a push out.</li>
                </ul>
            </td>
        </tr>
        <tr>
            <td>
                <img src="../lc_icons/mix.png">
                <p><strong>Mix liquid</strong></p>
            </td>
            <td>The pipette mixes liquid inside the well before an aspirate or after a dispense.</td>
        </tr>
        <tr>
            <td>
                <img src="../lc_icons/prewet_tip.png">
                <p><strong>Pre-wet tip</strong></p>
            </td>
            <td>The pipette pre-wets the attached tip before aspirating liquid.</td>
        </tr>
        <tr>
            <td>
                <img src="../lc_icons/flow_rate_aspirate.png">
                <p><strong>Aspirate flow rate</strong></p>
            </td>
            <td>
                <ul>
                    <li>The pipette aspirates liquid at this speed.</li>
                    <li>Varies by volume.</li>
                </ul>
            </td>
        </tr>
        <tr>
            <td>
                <img src="../lc_icons/flow_rate_dispense.png">
                <p><strong>Dispense flow rate</strong></p>
            </td>
            <td>
                <ul>
                    <li>The pipette dispenses liquid at this speed.</li>
                    <li>Varies by volume.</li>
                </ul>
            </td>
        </tr>
        <tr>
            <td>
                <img src="../lc_icons/retract_position.png">
                <p><strong>Retract position</strong></p>
            </td>
            <td>The pipette retracts from the liquid and moves to this position.</td>
        </tr>
        <tr>
            <td>
                <img src="../lc_icons/retract_speed.png">
                <p><strong>Retract speed</strong></p>
            </td>
            <td>The pipette retracts from the liquid at the specified speed.</td>
        </tr>
        <tr>
            <td>
                <img src="../lc_icons/push_out.png">
                <p><strong>Push out</strong></p>
            </td>
            <td>
                <ul>
                    <li>The pipette dispenses a small amount of air to ensure all liquid leaves the tip.</li>
                    <li>Varies by volume.</li>
                </ul>
            </td>
        </tr>
        <tr>
            <td>
                <img src="../lc_icons/touch_tip.png">
                <p><strong>Touch tip</strong></p>
            </td>
            <td>The pipette touches the attached tip to the sides of a well to remove droplets.</td>
        </tr>
        <tr>
            <td>
                <img src="../lc_icons/air_gap.png">
                <p><strong>Air gap</strong></p>
            </td>
            <td>
                <ul>
                    <li>The pipette aspirates a small amount of air after an aspirate or dispense.</li>
                    <li>Varies by volume.</li>
                </ul>
            </td>
        </tr>
        <tr>
            <td>
                <img src="../lc_icons/blow_out.png">
                <p><strong>Blow out</strong></p>
            </td>
            <td>The pipette dispenses a larger amount of air to ensure all liquid leaves the tip.</td>
        </tr>
    </tbody>
</table>

A [liquid class definition](definitions.md) specifies values for each property. When your Flex protocol includes a liquid class, these property values automatically define transfer behavior. For example, if you use the [`transfer_with_liquid_class()`][opentrons.protocol_api.InstrumentContext.transfer_with_liquid_class] command to transfer a viscous liquid, the pipette submerges into the liquid and aspirates more slowly to prevent air bubbles from forming.

Read more about [using liquid classes](using-liquid-classes.md) in the next section.