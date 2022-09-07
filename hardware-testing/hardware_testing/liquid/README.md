# liquid

Helper methods and classes for managing the liquids in a test protocol.

## height

The class `LiquidTracker` can be used to keep track of all liquid volumes (and their heights) across a deck.

```python
from hardware_testing.opentrons_api import helpers
from hardware_testing.liquid.height import LiquidTracker

# create a context, and load some labware
ctx = helpers.get_api_context("2.13")
trough = ctx.load_labware(load_name="nest_12_reservoir_15ml", location="5")
plate = ctx.load_labware(load_name="corning_96_wellplate_360ul_flat", location="2")

# initialize a liquid tracker
tracker = LiquidTracker()
tracker.initialize_from_deck(ctx)

# set the starting volume of dye in the trough
print(tracker.get_volume(trough["A1"]))        # 0 uL
print(tracker.get_liquid_height(trough["A1"])) # 0 mm
tracker.set_start_volume(trough["A1"], 10000)
print(tracker.get_volume(trough["A1"]))        # 10000 uL
print(tracker.get_liquid_height(trough["A1"])) # ~17.1 mm

# aspirate some dye, and update the trough's volume
print(tracker.get_liquid_height(trough["A1"], after_aspirate=300))  # ~16.6 mm
tracker.update_well_volume(trough["A1"], after_aspirate=300)
print(tracker.get_volume(trough["A1"]))                             # 9700 uL
print(tracker.get_liquid_height(trough["A1"]))                      # ~16.6 mm

# dispense dye, and update the plate's volume
print(tracker.get_liquid_height(trough["A1"]))                      # 0 mm
print(tracker.get_liquid_height(trough["A1"], after_dispense=300))  # ~8.1 mm
tracker.update_well_volume(plate["A1"], after_dispense=300)
print(tracker.get_volume(plate["A1"]))                              # 300 uL
print(tracker.get_liquid_height(plate["A1"]))                       # ~8.1 mm
```

## liquid_class

Some simple definitions for liquid class parameters. These parameters are simply a way to organizing pipetting configurations, with variables that define:

 - volumes
 - speeds
 - delay times
 - distances/depths
 - etc.

The parameter defaults defined here are used by `hardware_testing.execute` and `hardware_testing.pipette` to run the correct pipetting techiniques for a given liquid+pipette combination under test.
