---
title: 'Python API: Using Liquid Classes'
---

## Using liquid classes

You'll use a [liquid class definition](definitions.md) in your protocol to optimize transfer behavior based on liquid properties, along with your chosen Flex pipettes and tips.

This section covers selecting a liquid class and using the [`transfer_with_liquid_class()`][opentrons.protocol_api.InstrumentContext.transfer_with_liquid_class] method. For more details, including using the [`distribute_with_liquid_class()`][opentrons.protocol_api.InstrumentContext.distribute_with_liquid_class] and [`consolidate_with_liquid_class()`][opentrons.protocol_api.InstrumentContext.consolidate_with_liquid_class] methods, see [Complex Commands](complex-commands/index.md).

Start by defining the tips, trash, pipette, and labware used in your transfers. Then, use [`ProtocolContext.get_liquid_class()`][opentrons.protocol_api.ProtocolContext.get_liquid_class] to select an Opentrons-verified liquid class and save its results to a variable. `get_liquid_class()` takes into account the pipette and tip racks in your protocol and only loads the relevant portion of the liquid class definition.

```python
from opentrons import protocol_api

requirements = {"robotType": "Flex", "apiLevel": "{{ apiLevel }}"}

# define tips, trash, and pipette
def run(protocol: protocol_api.ProtocolContext):
    tiprack = protocol.load_labware(
        load_name="opentrons_flex_96_tiprack_50ul", location="D3"
    )
    trash = protocol.load_trash_bin(location="A3")
    pipette = protocol.load_instrument(
        instrument_name="flex_1channel_50",
        mount="left",
        tip_racks=[tiprack],
    )

    # load source and destination labware
    reservoir = protocol.load_labware(
       load_name="nest_12_reservoir_15ml", location="C3"
    )
    plate = protocol.load_labware(
        load_name="nest_96_wellplate_200ul_flat", location="C2"
    )

    # select liquid class to use in your protocol
    viscous_liquid = protocol.get_liquid_class(name="glycerol_50")
```

_New in version 2.24_

Next, use the [`InstrumentContext.transfer_with_liquid_class()`][opentrons.protocol_api.InstrumentContext.transfer_with_liquid_class] method to transfer an aqueous, volatile, or viscous liquid defined in a Flex protocol. This method requires the stored set of properties defined earlier, `viscous_liquid`, instead of the `glycerol_50` load name. It accepts additional arguments that let you specify your liquid, volume, source and destination wells, tip handling preferences, and trash location.

Opentrons-verified liquid class definitions are based on Flex pipette and tip combinations. The API will raise an error if you try to perform a liquid class transfer with an OT-2 pipette and tips.

In the example below, a Flex 1-channel pipette will transfer 50 µL of your `viscous_liquid` from well A1 of the reservoir to well A1 of the destination plate. A new tip is used for each well transfer, and each tip is dropped in the trash bin loaded in slot A3.

```python
# transfer with the viscous liquid class
pipette.transfer_with_liquid_class(
   liquid_class=viscous_liquid,
   volume=50,
   source=reservoir["A1"],
   dest=plate["A1"],
   new_tip="always",
   trash_location=trash,
)
```

_New in version 2.24_

Here, the `glycerol_50` viscous liquid class definition accounts for all other transfer behavior, like flow rate, whether or not to add an air gap or delay, and submerge and retract speeds. For each aspirate, the pipette:

- Moves to 2 mm above the top of the source well at 4 mm/sec.
- Submerges to 2 mm above the bottom of the source well at 4mm/sec.
- Aspirates 50 µL at 50 µL/sec with a volume correction.
- Delays for 1 second.
- Retracts to 2 mm above the top of the well at 4 mm/sec.

And for each dispense, the pipette:

- Moves to 2 mm above the top of the destination well at 4 mm/sec.
- Submerges to 2 mm above the top of the destination well at 4 mm/sec.
- Dispenses 50 µL at 25 µL/sec with a volume correction.
- Pushes out a volume of air equivalent to 3.9 µL
- Delays for 0.5 second.
- Retracts to 2 mm above the top of the well at 4 mm/sec.

In many cases, the liquid class definition represents fine-tuned changes optimized for each liquid class. If you instead used the same pipette to transfer 50 µL of the volatile `liquid_2`, transfer behavior would include:

- Submerging into and retracting from the volatile `liquid_2` at 100 mm/sec.
- Adding larger air gaps after aspirating _and_ dispensing to prevent dripping onto the deck.
- Aspirating and dispensing at 30 µL/sec with a larger correction by volume.
- Pushing out a larger volume of air to ensure all liquid leaves the tip.

Not all transfer behavior is easily visible. See [Liquid Class Definitions](definitions.md) for a full list of changes based on liquid class, pipette, and tip combination. For more detail on individual transfer settings, see [Liquid Control](building-block-commands/liquids.md).