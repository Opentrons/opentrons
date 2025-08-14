# Complex Commands

Complex liquid handling commands combine multiple [building block commands](atomic-commands.md) into a single method call. These commands make it easier to handle larger groups of wells and repeat actions without having to write your own control flow code. They integrate tip-handling behavior and can pick up, use, and drop multiple tips depending on how you want to handle your liquids.

There are six complex liquid handling commands, each optimized for a different liquid handling scenario:

| Legacy |  | Liquid Class |  |
|--------|--|--------------|--|
| [`InstrumentContext.transfer`][opentrons.protocol_api.InstrumentContext.transfer] |  | [`InstrumentContext.transfer_with_liquid_class`][opentrons.protocol_api.InstrumentContext.transfer_with_liquid_class] |  |
| [`InstrumentContext.distribute`][opentrons.protocol_api.InstrumentContext.distribute] |  | [`InstrumentContext.distribute_with_liquid_class`][opentrons.protocol_api.InstrumentContext.distribute_with_liquid_class] |  |
| [`InstrumentContext.consolidate`][opentrons.protocol_api.InstrumentContext.consolidate] |  | [`InstrumentContext.consolidate_with_liquid_class`][opentrons.protocol_api.InstrumentContext.consolidate_with_liquid_class] |  |

The legacy complex commands can optionally perform other actions, like adding air gaps, knocking droplets off the tip, mixing, and blowing out excess liquid from the tip. In a liquid class command, these and other transfer behaviors are determined by the *liquid class definition* to account for liquid properties like viscosity. For more information, see [Liquid Classes](liquid-classes.md).

Pages in this section of the documentation cover:

- [Sources and Destinations](complex-commands/sources-destinations.md): Which wells complex commands aspirate from and dispense to.
- [Order of Operations](complex-commands/order-operations.md): The order of basic commands that are part of a complex command.
- [Parameters](complex-commands/parameters.md): Additional keyword arguments that affect complex command behavior.

Code samples throughout these pages assume that you've loaded the pipettes and labware from the [basic protocol template](protocol-template.md).
