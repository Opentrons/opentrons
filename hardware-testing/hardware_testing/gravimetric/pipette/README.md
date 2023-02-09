# pipette

Classes and methods for running pipetting sequences, and controlling the execution of different pipetting techniques.

## timestamp

Manages the recording, saving, and loading of timestamps generated during a protocol run by a pipette.

These timestamps signify noteworthy moments during a protocol run, for example:

- When the pipette started aspirating
- When the pipette finished aspirating
- When the pipette was moving over the labware
- When the scale settling time began

The intention is that these timestamps could then be combined with timestamps from the [scale recording](../measure/README.md), to align mass recordings to the appropriate pipetting action or test process.

## liquid_class

- `LiquidSettingsRunner`
- `PipetteLiquidClass`

```python
from hardware_testing import data
from hardware_testing.labware.layout import LayoutLabware, DEFAULT_SLOTS_GRAV
from hardware_testing.liquid.defaults import DEFAULT_LIQUID_CLASS_OT2_P300_SINGLE
from hardware_testing.liquid.height import LiquidTracker
from hardware_testing.opentrons_api import helpers
from hardware_testing.pipette.liquid_class import PipetteLiquidClass

# setup, load labware, and create liquid-height tracker
run_id, start_time = data.create_run_id_and_start_time()
ctx = helpers.get_api_context("2.13")
layout = LayoutLabware(ctx=ctx, slots=DEFAULT_SLOTS_GRAV, tip_volume=300)
layout.load()
tracker = LiquidTracker()
tracker.initialize_from_deck(ctx)
tracker.set_start_volume(layout.vial["A1"], 300)

# create an instance of the liquid-class pipette
liq_pip = PipetteLiquidClass(
    ctx=ctx,
    model="p300_single_gen2",
    mount="left",
    tip_racks=[layout.tiprack],
    test_name="my-example-test",
    run_id=run_id,
    start_time=start_time,
)

# assign the liquid class
liq_pip.set_liquid_class(DEFAULT_LIQUID_CLASS_OT2_P300_SINGLE)

# run the protocol sequence
# passing in our liquid-height tracker
liq_pip.record_timestamp_enable()                               # enable timestamps
liq_pip.pipette.pick_up_tip()                                   # pick-up-tip
liq_pip.create_empty_timestamp(tag="transfer-100-ul")           # create new timestamp
liq_pip.aspirate(100, layout.vial["A1"], liquid_level=tracker)  # aspirate
liq_pip.dispense(100, layout.vial["A1"], liquid_level=tracker)  # dispense
liq_pip.save_latest_timestamp()                                 # save timestamp to disk
liq_pip.pipette.drop_tip()                                      # drop-tip
```
