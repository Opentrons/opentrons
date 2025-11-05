---
title: "Python API: Complex Commands"
---

Complex liquid handling commands combine multiple [building block commands](building-block-commands.md) into a single method call. These commands make it easier to handle larger groups of wells and repeat actions without having to write your own control flow code. They integrate tip-handling behavior and can pick up, use, and drop multiple tips depending on how you want to handle your liquids.

<table>
    <tr>
        <th>Legacy</th>
        <td>
            <ul>
                <li><a href="../api-reference/instruments/#opentrons.protocol_api.InstrumentContext.transfer"><code>InstrumentContext.transfer</code></a></li>
                <li><a href="../api-reference/instruments/#opentrons.protocol_api.InstrumentContext.distribute"><code>InstrumentContext.distribute</code></a></li>
                <li><a href="../api-reference/instruments/#opentrons.protocol_api.InstrumentContext.consolidate"><code>InstrumentContext.consolidate</code></a></li>
            </ul>
        </td>
    </tr>
    <tr>
        <th>Liquid Class</th>
        <td>
            <ul>
                <li><a href="../api-reference/instruments/#opentrons.protocol_api.InstrumentContext.transfer_with_liquid_class"><code>InstrumentContext.transfer_with_liquid_class</code></a></li>
                <li><a href="../api-reference/instruments/#opentrons.protocol_api.InstrumentContext.distribute_with_liquid_class"><code>InstrumentContext.distribute_with_liquid_class</code></a></li>
                <li><a href="../api-reference/instruments/#opentrons.protocol_api.InstrumentContext.consolidate_with_liquid_class"><code>InstrumentContext.consolidate_with_liquid_class</code></a></li>
            </ul>
        </td>
    </tr>
</table>

The legacy complex commands can optionally perform other actions, like adding air gaps, knocking droplets off the tip, mixing, and blowing out excess liquid from the tip. In a liquid class command, these and other transfer behaviors are determined by the *liquid class definition* to account for liquid properties like viscosity. For more information, see [Liquid Classes](../liquid-classes.md).

Pages in this section of the documentation cover:

- [Sources and Destinations](sources-destinations.md): Which wells complex commands aspirate from and dispense to.
- [Order of Operations](order-operations.md): The order of basic commands that are part of a complex command.
- [Parameters](parameters.md): Additional keyword arguments that affect complex command behavior.

Code samples throughout these pages assume that you've loaded the pipettes and labware from the [basic protocol template][protocol-template].
