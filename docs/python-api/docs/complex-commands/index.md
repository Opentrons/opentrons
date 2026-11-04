---
title: "Python API: Complex Commands"
description: "High-level transfer, distribute, and consolidate commands."
---

Complex liquid handling commands combine multiple [building block commands](../building-block-commands/index.md) into a single method call. These commands make it easier to handle larger groups of wells and repeat actions without having to write your own control flow code. They integrate tip-handling behavior and can pick up, use, and drop multiple tips depending on how you want to handle your liquids.

[`InstrumentContext`][opentrons.protocol_api.InstrumentContext] has six complex liquid handling commands, each optimized for a different liquid handling scenario:

<table>
    <tr>
        <th>Legacy</th>
        <td>
            <ul>
                <li><a href="../reference/instruments/#opentrons.protocol_api.InstrumentContext.transfer"><code>transfer()</code></a></li>
                <li><a href="../reference/instruments/#opentrons.protocol_api.InstrumentContext.distribute"><code>distribute()</code></a></li>
                <li><a href="../reference/instruments/#opentrons.protocol_api.InstrumentContext.consolidate"><code>consolidate()</code></a></li>
            </ul>
        </td>
    </tr>
    <tr>
        <th>Liquid Class</th>
        <td>
            <ul>
                <li><a href="../reference/instruments/#opentrons.protocol_api.InstrumentContext.transfer_with_liquid_class"><code>transfer_with_liquid_class()</code></a></li>
                <li><a href="../reference/instruments/#opentrons.protocol_api.InstrumentContext.distribute_with_liquid_class"><code>distribute_with_liquid_class()</code></a></li>
                <li><a href="../reference/instruments/#opentrons.protocol_api.InstrumentContext.consolidate_with_liquid_class"><code>consolidate_with_liquid_class()</code></a></li>
            </ul>
        </td>
    </tr>
</table>

The legacy complex commands can optionally perform other actions, like adding air gaps, knocking droplets off the tip, mixing, and blowing out excess liquid from the tip. In a liquid class command, these and other transfer behaviors are determined by the *liquid class definition* to account for liquid properties like viscosity. For more information, see [Liquid Classes](../liquid-classes/index.md).

Pages in this section of the documentation cover:

- [Sources and Destinations](sources-destinations.md): Which wells complex commands aspirate from and dispense to.
- [Order of Operations](order-operations.md): The order of basic commands that are part of a complex command.
- [Complex Liquid Handling Parameters](parameters.md): Additional keyword arguments that affect complex command behavior.

Code samples throughout these pages assume that you've loaded the pipettes and labware from the [basic protocol template][protocol-template].
