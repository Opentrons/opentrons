# Liquid Class Definitions

A *liquid class definition* specifies nearly all transfer behavior a Flex pipette will perform during a [`InstrumentContext.transfer_with_liquid_class`][opentrons.protocol_api.InstrumentContext.transfer_with_liquid_class], [`InstrumentContext.distribute_with_liquid_class`][opentrons.protocol_api.InstrumentContext.distribute_with_liquid_class], or [`InstrumentContext.consolidate_with_liquid_class`][opentrons.protocol_api.InstrumentContext.consolidate_with_liquid_class]. Properties, like aspirate flow rate, submerge speed, or dispense position, are required in every liquid class definition.

This section details specific changes to transfer behavior for each Opentrons-verified liquid class. The transfer steps are listed in the order the robot performs them. Advanced settings like mix, pre-wet tip, touch tip, and blowout are automatically disabled in Opentrons-verified liquid class definitions.

> [!note]
> You can customize a liquid class definition for your workflow, either by customizing individual properties of an Opentrons-verified liquid class definition or by creating your own definition from scratch.
>
> For more information, see [Customizing Liquid Classes](customizing-liquid-classes.md).

To use the tables below, select your liquid class: [Aqueous](#aqueous), [Viscous](#viscous), or [Volatile](#volatile). Then, click different tabs to view your pipette and tip combination.

In a liquid class transfer, flow rates and air gap or push out volumes vary based on the pipette and tip combination used in your protocol. Let's say you use a Flex P1000 1-channel pipette and Flex 200 µL tips to aspirate a volatile liquid. The transfer volume specifies the flow rate:

- 7 µL/sec to aspirate 5 µL
- 50 µL/sec to aspirate 50 µL
- 200 µL/sec to aspirate 200 µL

When your aspirate volume falls in between, like 100 µL, a linear interpolation automatically determines the flow rate.
