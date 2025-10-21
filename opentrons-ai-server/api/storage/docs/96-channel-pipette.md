# Comprehensive Reference Guide for Opentrons Flex 96-Channel Pipette Protocols

## Complete List of 96-Channel Compatible Labware

The Opentrons Flex 96-channel pipette has been validated with a specific set of labware
that maintains the required 9mm well spacing.
This compatibility list is essential for protocol development:

### Reservoirs

- **Single-well reservoirs** (Recommended for 96-channel):

  - `nest_1_reservoir_195ml` - 195mL capacity, ideal for reagent distribution
  - `nest_1_reservoir_290ml` - 290mL for large volume applications
  - `agilent_1_reservoir_290ml` - Alternative large volume option
  - `axygen_1_reservoir_90ml` - Smaller volume single reservoir

- **Multi-well reservoirs** (For 8-channel compatibility):
  - `nest_12_reservoir_15ml` - 12 wells × 15mL each
  - `usascientific_12_reservoir_22ml` - 12 wells × 22mL each

### Standard 96-Well Plates

- `corning_96_wellplate_360ul_flat` - Most commonly used, 360µL capacity
- `nest_96_wellplate_200ul_flat` - 200µL flat-bottom option
- `nest_96_wellplate_2ml_deep` - 2mL deep wells for samples
- `thermoscientificnunc_96_wellplate_1300ul` - 1.3mL medium-depth option
- `thermoscientificnunc_96_wellplate_2000ul` - 2mL alternative brand
- `usascientific_96_wellplate_2.4ml_deep` - Maximum 2.4mL capacity

### PCR Plates

- `biorad_96_wellplate_200ul_pcr` - Standard PCR plate
- `nest_96_wellplate_100ul_pcr_full_skirt` - Full skirt for thermal cycling
- `opentrons_96_wellplate_200ul_pcr_full_skirt` - Opentrons-branded option

### 384-Well Plates

- `appliedbiosystemsmicroamp_384_wellplate_40ul` - 40µL per well
- `biorad_384_wellplate_50ul` - 50µL per well
- `corning_384_wellplate_112ul_flat` - 112µL flat-bottom

### Aluminum Blocks and Adapters

- `opentrons_96_aluminumblock_biorad_wellplate_200ul`
- `opentrons_96_aluminumblock_generic_pcr_strip_200ul`
- `opentrons_96_aluminumblock_nest_wellplate_100ul`
- `opentrons_96_deep_well_adapter_nest_wellplate_2ml_deep`
- `opentrons_96_flat_bottom_adapter_nest_wellplate_200ul_flat`
- `opentrons_96_pcr_adapter_nest_wellplate_100ul_pcr_full_skirt`
- `opentrons_universal_flat_adapter_corning_384_wellplate_112ul_flat`

### Tip Racks

- **Flex-specific tips** (Recommended):
  - `opentrons_flex_96_tiprack_50ul` / `opentrons_flex_96_filtertiprack_50ul`
  - `opentrons_flex_96_tiprack_200ul` / `opentrons_flex_96_filtertiprack_200ul`
  - `opentrons_flex_96_tiprack_1000ul` / `opentrons_flex_96_filtertiprack_1000ul`

## Understanding the 96-channel pipette's unique constraints and capabilities

The Opentrons Flex 96-channel pipette represents a paradigm shift in high-throughput
liquid handling, but it comes with specific design considerations that fundamentally
shape protocol development. Unlike traditional single or 8-channel pipettes,
the 96-channel pipette occupies both pipette mounts and is optimized exclusively
for flat-bottom plates that conform to ANSI/SLAS standards.

The most critical limitation is **tube inaccessibility**. The 96-channel pipette's
physical architecture prevents it from accessing individual tubes, microcentrifuge tubes,
or any labware that doesn't maintain the standard 9mm spacing of 96-well plates.
This constraint requires protocols to be reimagined around plate-based workflows.

### What the 96-channel pipette CANNOT access:

- 1.5mL or 2mL microcentrifuge tubes
- 15mL or 50mL conical tubes
- Individual PCR tubes
- Strip tubes (even 8-tube strips)
- Any custom labware with non-standard spacing

### Solutions for tube-based workflows:

```python
# Instead of tube racks:
tube_rack = protocol.load_labware("opentrons_24_tuberack_eppendorf_1.5ml", "D1")  # NOT COMPATIBLE!

# Use deep well plates:
sample_plate = protocol.load_labware("nest_96_wellplate_2ml_deep", "D1")  # 2mL per well
# Pre-aliquot samples from tubes into wells before protocol start
```

This limitation fundamentally changes protocol design, requiring all reagents and samples to
be pre-aliquoted into plate format before automation begins.

## Reservoir strategy transformation from 8-channel to 96-channel workflows

The transition from 12-well reservoirs to single-well reservoirs represents a fundamental
shift in liquid handling strategy. This change is driven by the 96-channel pipette's
simultaneous access pattern.

### Traditional 8-channel approach

```python
# 8-channel: 12-well reservoir allows parallel column access
reservoir_12well = protocol.load_labware("nest_12_reservoir_15ml", "D1")
# Each well contains reagent for one column (15mL × 12 = 180mL total)
for i, column in enumerate(plate.columns()):
    p8.aspirate(100, reservoir_12well.wells()[i])
    p8.dispense(100, column[0])
```

### 96-channel optimized approach

```python
# 96-channel: Single reservoir for entire plate
reservoir_1well = protocol.load_labware("nest_1_reservoir_195ml", "D1")
# One well contains all reagent (195mL total)
p96.aspirate(100, reservoir_1well["A1"])  # All 96 tips access same well
p96.dispense(100, plate["A1"])  # Dispense to all 96 wells simultaneously
```

### Key conversion considerations:

1. **Volume planning**: Single reservoirs require 10-20% excess volume for dead volume
2. **Well geometry**: 1-well reservoirs have different liquid height changes
3. **Mixing requirements**: Larger volumes may need pre-mixing
4. **Reagent stability**: Consider evaporation in large open reservoirs

### Hybrid approach for complex protocols

When protocols require both 8-channel and 96-channel operations:

```python
# Use deep well plate as 96-well reservoir
reagent_plate = protocol.load_labware("nest_96_wellplate_2ml_deep", "D1")
# Pre-fill with reagents for 96-channel access
# Each well can contain different reagent if needed
```

## Optimized labware combinations for 96-channel workflows

The most effective labware combinations leverage the pipette's strengths while working around its limitations:

**Core labware trinity**:

- **Source/destination plates**: Corning 96-well plates (360µL) or NEST 96-well plates for standard operations
- **Reagent reservoirs**: NEST 1-well reservoirs (195mL) for bulk reagent dispensing
- **PCR plates**: Opentrons Tough PCR plates with full skirts for thermal cycling integration

**Tip rack configuration** requires special attention. The 96-channel pipette mandates the use of
**96-Channel Tip Rack Adapters** for full tip pickup, with four adapters included per pipette purchase.
These adapters ensure proper alignment but must be removed for partial tip pickup operations:

```python
# Full tip pickup configuration
tips_full = protocol.load_labware(
    "opentrons_flex_96_tiprack_1000ul", "C3",
    adapter="opentrons_flex_96_tiprack_adapter"
)

# Partial tip pickup configuration (no adapter)
tips_partial = protocol.load_labware(
    "opentrons_flex_96_tiprack_1000ul", "C1"
)
```

## Advanced tip management strategies

Tip consumption represents a major consideration in 96-channel protocols.
A single full pickup uses 96 tips, making tip management critical for workflow efficiency.
The pipette supports **variable tip pickup** through the Python API, enabling
three distinct strategies:

**1. Full 96-tip operations** maximize throughput for plate replication:

```python
pipette.configure_nozzle_layout(style=ALL, tip_racks=[tips_full])
pipette.pick_up_tip()  # Picks up all 96 tips
```

**2. Column-wise operations** (8 tips) balance efficiency with flexibility:

```python
pipette.configure_nozzle_layout(
    style=COLUMN,
    start="A12",  # Rightmost column to avoid deck edge limitations
    tip_racks=[tips_partial]
)
```

**3. Single-tip operations** enable precision work:

```python
pipette.configure_nozzle_layout(
    style=SINGLE,
    start="H12",  # Corner position with pressure sensor
    tip_racks=[tips_partial]
)
```

The most efficient protocols minimize configuration changes, grouping similar operations together.
Staging areas (slots A1-A4) can store additional tip racks, with the Gripper automatically
replenishing tips during long runs.

## Module integration patterns

The 96-channel pipette works seamlessly with Flex modules, but integration
patterns differ from traditional approaches:

**Magnetic Block integration** leverages the Gripper for efficiency:

```python
# Traditional approach: pipette liquid to magnetic module
# 96-channel approach: move entire plate
protocol.move_labware(
    labware=sample_plate,
    new_location=magnetic_block,
    use_gripper=True
)
# No engagement needed - magnets always active
protocol.delay(minutes=5)  # Bead settling
```

**Thermocycler integration** enables walk-away PCR:

```python
tc_mod = protocol.load_module("thermocyclerModuleV2")
# Gripper loads plate after reagent addition
protocol.move_labware(pcr_plate, tc_mod, use_gripper=True)
tc_mod.close_lid()
tc_mod.execute_profile(steps=[...])
```

**Heater-Shaker patterns** support sample processing:

```python
hs_mod = protocol.load_module("heaterShakerModuleV1", "D1")
hs_mod.set_and_wait_for_temperature(37)
# 96-channel dispenses reagents before shaking
hs_mod.set_and_wait_for_shake_speed(rpm=1000)
```

## Unique optimization techniques

Several techniques have emerged specifically for 96-channel workflows:

**Early pooling strategy** for NGS workflows reduces tip consumption by barcoding samples early,
enabling pooled processing through subsequent steps. This can reduce tip usage
by 75% in multi-step protocols.

**Reagent pre-positioning** places all reagents in accessible positions before starting,
as the 96-channel pipette cannot dynamically access tubes during runs.
Protocols must be designed with all reagents in plates or reservoirs from the start.

**Air gap optimization** for volatile reagents:

```python
pipette.aspirate(100, reagent_reservoir["A1"])
pipette.air_gap(10)  # Prevents dripping during transport
pipette.dispense(110, destination_plate["A1"])  # Includes air gap volume
```

**Parallel plate processing** uses deck space efficiently:

```python
# Process 4 plates simultaneously with column operations
for plate in plates:
    pipette.pick_up_tip()
    pipette.aspirate(50, reagent_reservoir["A1"])
    pipette.dispense(50, plate["A1"])
    pipette.drop_tip()
```

## Error handling and edge case management

The 96-channel pipette includes sophisticated error detection through pressure
sensors in channels A1 and H12.
However, error handling requires different strategies than single-channel pipettes:

**Pressure-based liquid detection**:

```python
# Only works with A1 or H12 in single-tip mode
pipette.configure_nozzle_layout(style=SINGLE, start="H12")
if pipette.detect_liquid_presence(well):
    pipette.aspirate(volume, well)
else:
    protocol.pause("Check liquid levels")
```

**Collision avoidance** becomes critical with partial configurations.
The API prevents unsafe moves, but deck layout must consider:

- Row A inaccessibility when using partial column with front nozzles
- Column 11-12 inaccessibility when using leftmost column configuration
- Height restrictions when using partial configurations

**Common partial pickup error:**

```text
PartialTipMovementNotAllowedError: Error 2004 MOTION_PLANNING_FAILURE
Requested motion with the A1 nozzle partial configuration is outside of robot bounds
```

Solution: Use "A12" instead of "A1" for COLUMN mode:

```python
# CORRECT - Avoids collision
pipette.configure_nozzle_layout(style=COLUMN, start="A12", tip_racks=[tips_partial])

# INCORRECT - Causes error
pipette.configure_nozzle_layout(style=COLUMN, start="A1", tip_racks=[tips_partial])
```

**Recovery strategies** differ from standard pipettes. Error recovery cannot perform partial
tip pickup, so protocols should include checkpoints before configuration changes:

```python
protocol.pause("Ensure partial tip racks are correctly positioned")
pipette.configure_nozzle_layout(style=COLUMN, start="A12", tip_racks=[tips_partial])
```

## Flow rate optimization for liquid classes

Flow rate control with 96-channel pipettes requires special consideration.
While the API supports flow rate adjustment, some users report the 96-channel pipette
may not respond to these settings as expected:

```python
# Theoretical optimization (verify effectiveness)
pipette.flow_rate.aspirate = 500   # µL/s for viscous liquids
pipette.flow_rate.dispense = 1000  # µL/s standard dispensing

# Alternative: use rate parameter in commands
pipette.aspirate(100, source, rate=0.5)  # 50% of default rate
```

**Viscous liquid handling** requires multiple adjustments:

- Reduced aspiration rates (50% of default)
- Extended pre-wet cycles for tip conditioning
- Post-dispense delays for complete dispensing
- Touch-tip operations to remove hanging drops

**Volatile liquid handling** benefits from:

- Increased aspiration speed to minimize evaporation
- Larger air gaps (15-20µL)
- Immediate dispensing after aspiration
- Cooled reagent reservoirs when possible

## Production-ready protocol structure

A robust 96-channel protocol incorporates all these elements while using
validated compatible labware:

```python
from opentrons import protocol_api
from opentrons.protocol_api import COLUMN, ALL, SINGLE

metadata = {
    "created": "2025-05-27T13:44:17.325Z",
    "lastModified": "2025-05-27T13:44:30.167Z",
    "source": "OpentronsAI",
}

requirements = {"robotType": "Flex", "apiLevel": "2.22"}

def run(protocol: protocol_api.ProtocolContext):
    # Load modules first for proper deck space management
    mag_block = protocol.load_module("magneticBlockV1", "C1")

    # Define tip racks by usage type (from compatible list)
    tips_partial = [protocol.load_labware("opentrons_flex_96_tiprack_200ul", slot)
                    for slot in ["D1", "D2"]]  # No adapters for partial pickup
    tips_full = [protocol.load_labware("opentrons_flex_96_tiprack_1000ul", slot,
                                      adapter="opentrons_flex_96_tiprack_adapter")
                 for slot in ["C2", "C3"]]  # Adapters required for full pickup

    # Load validated labware from compatible list
    sample_plate = protocol.load_labware(
        "nest_96_wellplate_2ml_deep",  # From compatible list
        "B1",
        "Sample Plate"
    )

    reagent_reservoir = protocol.load_labware(
        "nest_1_reservoir_195ml",  # Single-well for 96-channel
        "A1",
        "Reagent Reservoir"
    )

    pcr_plate = protocol.load_labware(
        "nest_96_wellplate_100ul_pcr_full_skirt",  # Full skirt for thermal cycling
        "B2",
        "PCR Plate"
    )

    # Load pipette
    p96 = protocol.load_instrument("flex_96channel_1000")

    # Load Trash Bins:
    trash_bin_1 = protocol.load_trash_bin("A3")

    # Phase 1: Full plate operations
    p96.configure_nozzle_layout(style=ALL, tip_racks=tips_full)
    p96.pick_up_tip()
    # Transfer from deep well samples to PCR plate
    p96.aspirate(50, sample_plate["A1"])
    p96.air_gap(10)
    p96.dispense(60, pcr_plate["A1"])
    p96.drop_tip()

    # Phase 2: Column operations for reagent addition
    # CRITICAL: Use "A12" not "A1" to avoid motion planning errors!
    p96.configure_nozzle_layout(style=COLUMN, start="A12", tip_racks=tips_partial)
    # Add reagent from single reservoir to all columns
    for i in range(12):
        p96.pick_up_tip()
        p96.aspirate(25, reagent_reservoir["A1"])
        p96.dispense(25, pcr_plate.columns()[i][0])
        p96.drop_tip()

    # Error handling checkpoint
    protocol.pause("Verify all labware before magnetic separation")

    # Phase 3: Magnetic separation with gripper
    protocol.move_labware(sample_plate, mag_block, use_gripper=True)
```

### Only 96-channel pipette available:

`flex_96channel_1000`
When loading the 96-channel pipette, you don't need to specify a mount (occupies both mounts):

```
pipette = protocol.load_instrument("flex_96channel_1000")
```

### Different modes of 96-channel pipette:

1. Partial Tip Pickup (8-channel mode)

- p1000.configure_nozzle_layout(style=COLUMN, start="A12", tip_racks=[tips_reagent])

2. Full 96-Tip Pickup

- p1000.configure_nozzle_layout(style=ALL, tip_racks=[tips])

When you load a 96-channel pipette WITHOUT calling configure_nozzle_layout(),
it automatically defaults to FULL 96-tip pickup mode (ALL).

### return_tip vs drop_tip

- return_tip() is a method that places the tip back to its original location in the tip rack,
  rather than throwing it away.
- drop_tip() discards the tip into the trash.
- reset_tipracks() tells the robot: "Start counting from the beginning of the tip rack again"
  Without it:

  - First use: Tips A1-H12
  - Second use: Robot thinks "I already used A1-H12, they're not available"
  - Error: "No tips available!"

  With reset_tipracks():

  - First use: Tips A1-H12
  - reset_tipracks() → "Forget what I used, start fresh"
  - Second use: Tips A1-H12 again
  - No error

## 8-Channel vs 96 chaneel-pipette protocol

### 8-CHANNEL VERSION

```python
from opentrons import protocol_api

requirements = {"robotType": "Flex", "apiLevel": "2.22"}

def run(protocol: protocol_api.ProtocolContext):
    """Add 100µL reagent to all 96 wells using 8-channel pipette"""

    # Load labware
    plate = protocol.load_labware('corning_96_wellplate_360ul_flat', '1')
    reagent_reservoir = protocol.load_labware('nest_12_reservoir_15ml', '2')
    tip_rack = protocol.load_labware('opentrons_flex_96_tiprack_200ul', '3')

    # Load 8-channel pipette
    p8 = protocol.load_instrument(
        'flex_8channel_1000',
        mount='left',
        tip_racks=[tip_rack]
    )

    # Load Trash Bins:
    trash_bin_1 = protocol.load_trash_bin("A3")

    # Add reagent column by column (12 operations for full plate)
    for col_idx in range(12):
        # Pick up 8 tips
        p8.pick_up_tip()

        # Aspirate from reservoir (using different wells for each column)
        p8.aspirate(100, reagent_reservoir.wells()[col_idx])

        # Dispense to one column (8 wells)
        p8.dispense(100, plate.columns()[col_idx][0])

        # Drop tips
        p8.drop_tip()
```

### 96-CHANNEL VERSION

```python
from opentrons import protocol_api

requirements = {"robotType": "Flex", "apiLevel": "2.22"}

def run(protocol: protocol_api.ProtocolContext):
    """Add 100µL reagent to all 96 wells using 96-channel pipette"""

    # Load labware
    plate = protocol.load_labware('corning_96_wellplate_360ul_flat', '1')
    reagent_reservoir = protocol.load_labware('nest_1_reservoir_195ml', '2')
    tip_rack = protocol.load_labware(
        'opentrons_flex_96_tiprack_200ul',
        '3',
        adapter='opentrons_flex_96_tiprack_adapter'  # Required for 96-channel
    )

    # Load 96-channel pipette
    p96 = protocol.load_instrument(
        'flex_96channel_1000',
        tip_racks=[tip_rack]
    )
    # Load Trash Bins:
    trash_bin_1 = protocol.load_trash_bin("A3")

    # Add reagent to entire plate in one operation
    # Pick up 96 tips
    p96.pick_up_tip()

    # Aspirate from reservoir (all tips from same well)
    p96.aspirate(100, reagent_reservoir['A1'])

    # Dispense to entire plate (96 wells at once)
    p96.dispense(100, plate['A1'])

    # Drop tips
    p96.drop_tip()
```

### ALTERNATIVE: 96-channel using COLUMN mode

```python
from opentrons import protocol_api
from opentrons.protocol_api import COLUMN

requirements = {"robotType": "Flex", "apiLevel": "2.22"}

def run(protocol: protocol_api.ProtocolContext):
    """Add 100µL reagent using 96-channel in column mode (8 tips at a time)"""

    # Load labware
    plate = protocol.load_labware('corning_96_wellplate_360ul_flat', '1')
    reagent_reservoir = protocol.load_labware('nest_12_reservoir_15ml', '2')
    tip_rack = protocol.load_labware(
        'opentrons_flex_96_tiprack_200ul',
        '3'
        # NO adapter for partial pickup
    )

    # Load 96-channel pipette
    p96 = protocol.load_instrument('flex_96channel_1000')

    # Load Trash Bins:
    trash_bin_1 = protocol.load_trash_bin("A3")

    # Configure for column pickup (8 tips)
    p96.configure_nozzle_layout(
        style=COLUMN,
        start="A12",
        tip_racks=[tip_rack]
    )

    # Add reagent column by column (same as 8-channel approach)
    for col_idx in range(12):
        # Pick up 8 tips
        p96.pick_up_tip()

        # Aspirate from reservoir
        p96.aspirate(100, reagent_reservoir.wells()[col_idx])

        # Dispense to one column
        p96.dispense(100, plate.columns()[col_idx][0])

        # Drop tips
        p96.drop_tip()
```

## ALL Commands Found in Opentrons Flex Protocols

### Pipette Commands

### Configuration Commands

- `configure_nozzle_layout()` - Configure partial tip pickup
  - Parameters used: `style` (COLUMN, SINGLE, ROW, ALL), `start`, `tip_racks`

### Flow Rate Settings

- `pip.flow_rate.aspirate` - Set aspiration flow rate
- `pip.flow_rate.dispense` - Set dispense flow rate
- `pip.flow_rate.blow_out` - Set blow out flow rate
- `pip.default_speed` - Set/get default movement speed

### Basic Liquid Handling

- `aspirate()` - Aspirate liquid
- `dispense()` - Dispense liquid
- `mix()` - Mix by aspirating and dispensing
- `blow_out()` - Blow out remaining liquid
- `touch_tip()` - Touch tip to well sides
- `air_gap()` - Create air gap
- `transfer()` - Combined aspirate/dispense
- `distribute()` - One source to multiple destinations
- `move_to()` - Move pipette to location
- `pip.current_volume` - Get current volume in pipette

### Tip Management

- `pick_up_tip()` - Pick up tips
- `drop_tip()` - Drop tips into trash
- `return_tip()` - Return tips to tiprack
- `reset_tipracks()` - Reset tip tracking

### Well/Location Methods

- `well.top()` - Top of well with optional offset
- `well.bottom()` - Bottom of well with optional offset
- `location.move()` - Move relative with types.Point
- `plate.wells()` - Get all wells
- `plate.rows()` - Get rows of wells
- `plate.columns()` - Get columns of wells

### Module Commands

### Heater-Shaker Module

- `h_s.set_and_wait_for_shake_speed()` - Set shake speed
- `h_s.set_and_wait_for_temperature()` - Set temperature
- `h_s.deactivate_shaker()` - Stop shaking
- `h_s.open_labware_latch()` - Open latch
- `h_s.close_labware_latch()` - Close latch
- `h_s.set_target_temperature()` - Set target temp

### Temperature Module

- `temp.set_temperature()` - Set temperature
- `temp.load_adapter()` - Load adapter

### Thermocycler Module

- No actual thermocycler commands used in provided protocols (only loaded)

### Magnetic Module

- `magblock.load_labware()` - Load labware on magnetic block

### Protocol Context Commands

- `ctx.pause()` - Pause with message
- `ctx.delay()` - Delay with seconds/minutes
- `ctx.comment()` - Add comment to run log
- `ctx.set_rail_lights()` - Control rail lights
- `ctx.home()` - Home the robot

### Loading Commands

- `ctx.load_labware()` - Load labware
- `ctx.load_module()` - Load hardware module
- `ctx.load_adapter()` - Load adapter
- `ctx.load_instrument()` - Load pipette
- `ctx.load_trash_bin()` - Load trash bin
- `ctx.load_waste_chute()` - Load waste chute
- `ctx.move_labware()` - Move labware with use_gripper parameter

### Liquid Definition

- `ctx.define_liquid()` - Define liquid properties
- `well.load_liquid()` - Load liquid into wells

### Parameter Commands (RTP)

- `add_parameters()` - Function to add parameters
- `parameters.add_int()` - Add integer parameter
- `parameters.add_bool()` - Add boolean parameter
- `parameters.add_str()` - Add string parameter
- `parameters.add_csv_file()` - Add CSV file parameter

### Custom Functions Found in Protocols

- `resuspend_pellet()` - Custom mixing for pellets
- `bead_mix()` - Custom mixing for beads
- `remove_supernatant()` - Remove supernatant
- `mixing()` - General mixing function
- `lysis()` - Lysis procedure
- `bind()` - Binding procedure
- `wash()` - Wash procedure
- `elute()` - Elution procedure
- `dnase()` - DNase treatment
- `stop_reaction()` - Stop reaction
- `move_plate()` - Custom plate movement
- `get_values()` - Get protocol parameters
- `add_liquid()` - Custom liquid loading
- `pickup()` - Custom tip pickup
- `drop()` - Custom tip drop

### Data Handling

- `parse_as_csv()` - Parse CSV data
- `json.loads()` - Parse JSON data
- `zip()` - Python zip function
- `np.arange()` - NumPy arange

### Constants and Imports Used

- `protocol_api.OFF_DECK` - Off deck constant
- `types.Point()` - Create coordinate point
- `COLUMN, ALL, SINGLE, ROW` - Nozzle configuration constants
- `metadata` - Protocol metadata dictionary
- `requirements` - Protocol requirements dictionary

### Properties Actually Accessed

- `ctx.params` - Access runtime parameters
- `pip.tip_racks` - Assign tip racks
- `.wells()[0]` - Access first well
- `.rows()[0]` - Access first row
- `.columns()` - Access columns

## Real examples of protocol from Protocol library

### OD-600 Normalization using 96-channel pipette

https://library.opentrons.com/p/od-normalization-with-96-ch-pipette

```python
from opentrons import protocol_api
from opentrons.protocol_api import COLUMN, ALL, SINGLE, ROW
import numpy as np


metadata = {
    'protocolName': 'OD-600 Normalization using 96-channel pipette',
    'author': 'Anurag Kanase <anurag.kanase@opentrons.com>',
    'description': "OD-600 Normalization Protocol using Custom CSV File.\nThe protocol normalizes Culture plate OD taken at 600nm.\n Note: With 96-ch pipette, the tips cannot be returned to the tiprack."
}

requirements = {"robotType": "Flex", "apiLevel": "2.20"}

def add_parameters(parameters):

    parameters.add_csv_file(
    variable_name="csv_data",
    display_name="Normalization CSV",
    description="Please use the template CSV from the plate reader "
)

    parameters.add_bool(
        variable_name="dry_run",
        display_name="Dry Run",
        description="This is held for later use. Does not affect the protocol.",
        default=True
    )

    parameters.add_int(
        variable_name="waste_type",
        display_name="Waste Type",
        description="Where to dispose of the waste.",
        default=1,
        choices=[
            {"display_name": "Waste Chute", "value": 1},
            {"display_name": "Trash bin", "value": 2},
        ]
    )
def run(protocol: protocol_api.ProtocolContext):
    dry_run = protocol.params.dry_run
    waste_type = protocol.params.waste_type

    def drop():
        if dry_run:
            pip.drop_tip()
        else:
            pip.drop_tip()

    content_csv = protocol.params.csv_data

    csv_data = content_csv.parse_as_csv()
    source_wells, dest_wells, dil_volumes, dna_volumes = zip(*csv_data)

    tc = protocol.load_module("thermocyclerModuleV2")
    temp_mod = protocol.load_module("temperature module gen2", 'C1')
    hs = protocol.load_module(module_name="heaterShakerModuleV1", location="D1")
    culture_plate = temp_mod.load_labware("corning_96_wellplate_360ul_flat", label="Culture Plate")
    tiprack = protocol.load_labware("opentrons_flex_96_tiprack_200ul", location="A2", label="Tiprack 1")
    tiprack2 = protocol.load_labware("opentrons_flex_96_tiprack_200ul", location="A4", label="Tiprack 2")


    normalization_plate = protocol.load_labware("corning_96_wellplate_360ul_flat",location="B2", label="Normalization Plate")
    reservoir = protocol.load_labware("nest_1_reservoir_195ml", location="B3", label="Diluent Reservoir")

    if waste_type == 2:
        trash = protocol.load_trash_bin("A3")
    else:
        trash = protocol.load_waste_chute()

    pip = protocol.load_instrument("flex_96channel_1000")

    pip.configure_nozzle_layout(
        style=SINGLE,
        start="A1"
    )
    global tips
    tips = tiprack.wells()[::-1]
    def pickup():
        global tips
        if tips == []:
            protocol.comment("----- Switching to Tiprack 2 -----")
            protocol.move_labware(tiprack, "D4", use_gripper=True)
            protocol.move_labware(tiprack2, "A2", use_gripper=True)
            tips = tiprack2.wells()[::-1]
            pip.pick_up_tip(tips.pop(0))
        else:
            pip.pick_up_tip(tips.pop(0))


    def add_liquid(name, color, well, volume):
        liquid = protocol.define_liquid(name = name, description = "generic", display_color = color)
        well.load_liquid(liquid=liquid, volume=volume)
        return liquid , well

    for well in source_wells[1:]:
        add_liquid("DNA sample", "#f08000", culture_plate[well], 200)

    add_liquid("Diluent", "#008000", reservoir.wells()[0], 10000)

    if dil_volumes[1] is not '':
        protocol.comment("Transferring Diluent to Normalization Plate")

        pickup()
        for vol, dest_well in zip(dil_volumes[1:], dest_wells[1:]):
            pip.transfer(float(vol), reservoir.wells()[0], normalization_plate[dest_well], new_tip="never")
        drop()

    if dna_volumes[1] is not '':
        protocol.comment("Transferring DNA to Normalization Plate")
        for vol, source_well, dest_well in zip(dna_volumes[1:], source_wells[1:], dest_wells[1:]):
            pickup()
            pip.transfer(float(vol), culture_plate[source_well], normalization_plate[dest_well], new_tip="never")
            drop()
```

### Staining and Blocking Protocol

https://library.opentrons.com/p/staining

```python
# flake8: noqa
from opentrons import protocol_api
import math
from opentrons.protocol_api import COLUMN, ALL

metadata = {
    'ctx.Name': 'Stamping Protocol',
    'author': 'Rami Farawi <ndiehl@opentrons.com',
}
requirements = {
    'robotType': 'Flex',
    'apiLevel': '2.19'
}

def add_parameters(parameters):

    parameters.add_bool(
    variable_name="real_mode",
    display_name="Real Mode",
    description="When on real incubation times",
    default=True
)

def run(ctx: protocol_api.ProtocolContext):

    real_mode = ctx.params.real_mode

    # DECK LABWARE
    reservoir_one = [ctx.load_labware('nest_1_reservoir_290ml', slot) for slot in ['D1', 'D2']]
    pbs = reservoir_one[0]['A1']
    # primary_antibody = reservoir_one[1]['A1']
    waste = reservoir_one[1]['A1']

    reservoir_12 = ctx.load_labware('nest_12_reservoir_15ml', 'C1')
    nds = reservoir_12['A1']
    primary_antibody = reservoir_12['A2']

    trash = ctx.load_waste_chute()

    plate_96 = ctx.load_labware('cellvis_96_wellplate_200ul', 'C2')


    tiprack_adapters = [ctx.load_adapter('opentrons_flex_96_tiprack_adapter', slot) for slot in ['B3']]
    tiprack200 = [tiprack_adapters[0].load_labware('opentrons_flex_96_tiprack_200ul')]
    tiprack1000 = ctx.load_labware('opentrons_flex_96_tiprack_1000ul', 'B1')

    # LOAD PIPETTES
    p = ctx.load_instrument("flex_96channel_1000")



    def pick_up(tiprack):
        if tiprack == 'full':


            p.configure_nozzle_layout(
                style=ALL,
                tip_racks=tiprack200
            )

            p.reset_tipracks()
            p.pick_up_tip()

        else:

            p.configure_nozzle_layout(
                style=COLUMN,
                start="A1",
                tip_racks=[tiprack1000]
            )
            p.pick_up_tip()

    cell_well = plate_96['A1']


    # add pbs
    pick_up('full')
    for _ in range(3):
        p.aspirate(100, pbs)
        p.dispense(100, cell_well)
        p.aspirate(100, cell_well)
        p.dispense(100, waste)
    p.return_tip()

    # add nds
    pick_up('partial')
    p.distribute(100, nds, [col for col in plate_96.rows()[0]], new_tip='never')
    p.drop_tip()

    ctx.delay(minutes=30 if real_mode else 1)

    # pick off nds
    pick_up('full')
    p.aspirate(100, cell_well)
    p.dispense(100, waste)
    p.return_tip()

    # add primary antibody
    pick_up('partial')
    p.distribute(80, primary_antibody, [col for col in plate_96.rows()[0]], new_tip='never')
    p.drop_tip()

    ctx.delay(minutes=90 if real_mode else 1)

    pick_up('full')
    for i in range(3):
        p.aspirate(100, pbs)
        p.dispense(100, cell_well)
        p.aspirate(180 if i == 0 else 100, cell_well)
        p.dispense(180 if i == 0 else 100, waste)
    p.return_tip()

    # loading liquids

    # Assigning Liquid and colors - this is for the opentrons app display
    pbs_liq = ctx.define_liquid(
    name="PBS",
    description="PBS",
    display_color="#7EFF42",
    )
    secondary_antibody_liq = ctx.define_liquid(
    name="Secondary Antibody",
    description="Secondary Antibody",
    display_color="#50D5FF",
    )
    primary_antibody_liq = ctx.define_liquid(
    name="Primary Antibody",
    description="Primary Antibody",
    display_color="#B925FF",
    )
    cells = ctx.define_liquid(
    name="Cells",
    description="Cells",
    display_color="#B925FF",
    )


    primary_antibody.load_liquid(liquid=primary_antibody_liq, volume=10000)
    nds.load_liquid(liquid=secondary_antibody_liq, volume=10000)
    pbs.load_liquid(liquid=pbs_liq, volume=10000)

    for well in plate_96.wells():
        well.load_liquid(liquid=cells, volume=100)



```

### Verified - Zymo Magbead Quick-RNA- Mammalian Cells

https://library.opentrons.com/p/Zymo_Quick-RNA_Flex_96-Cells

```python
def get_values(*names):
            import json
            _all_values = json.loads("""{"trash_chute":false,"USE_GRIPPER":true,"dry_run":false,"temp_mod":true,"heater_shaker":true,"tip_mixing":false,"sample_vol":300,"wash_vol":400,"stop_vol":500,"lysis_vol":200,"bind_vol":400,"dnase_vol":50,"elution_vol":110,"protocol_filename":"Zymo_Quick-RNA_Cells-Flex_96_Channel"}""")
            return [_all_values[n] for n in names]


from opentrons.types import Point
from opentrons import protocol_api
import json
import math
from opentrons import types
import numpy as np

metadata = {
    'author': 'Zach Galluzzo <zachary.galluzzo@opentrons.com>'
}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.16",
}


whichwash = 1

def run(ctx):
    """
    Here is where you can change the locations of your labware and modules
    (note that this is the recommended configuration)
    """
    USE_GRIPPER     = True
    trash_chute     = False
    dry_run         = True
    temp_mod        = True
    heater_shaker   = True
    tip_mixing      = False #this will only be activated if heater_shaker is False

    sample_vol      = 300
    lysis_vol       = 200
    bind_vol        = 400
    wash_vol        = 400
    stop_vol        = 500
    dnase_vol       = 50
    elution_vol     = 110

    try:
        [trash_chute,USE_GRIPPER, dry_run,temp_mod,heater_shaker,tip_mixing,wash_vol,sample_vol,bind_vol,lysis_vol,stop_vol,dnase_vol,elution_vol] = get_values(  # noqa: F821
        'trash_chute','USE_GRIPPER','dry_run','temp_mod','heater_shaker','tip_mixing','wash_vol','sample_vol','bind_vol','lysis_vol','stop_vol','dnase_vol','elution_vol')

    except (NameError):
        pass

    #Just to be safe
    if heater_shaker:
        tip_mixing      = False

    # Protocol Parameters
    deepwell_type       = "nest_96_wellplate_2ml_deep"
    if not dry_run:
        settling_time   = 3
    else:
        settling_time   = 0.25
    bead_vol            = 30
    binding_buffer_vol  = bind_vol + bead_vol # Beads+Binding
    starting_vol        = sample_vol + lysis_vol #sample volume (300 in shield) + lysis volume

    #Load trash
    if trash_chute:
        trash = ctx.load_waste_chute()
    else:
        trash = ctx.load_trash_bin("D3")

    if heater_shaker:
        h_s             = ctx.load_module('heaterShakerModuleV1','D1')
        h_s_adapter     = h_s.load_adapter('opentrons_96_deep_well_adapter')
        sample_plate    = h_s_adapter.load_labware(deepwell_type,'Sample Plate')
        h_s.close_labware_latch()
    else:
        sample_plate    = ctx.load_labware(deepwell_type,'D1','Sample Plate')

    samples_m           = sample_plate.wells()[0]

    magblock            = ctx.load_module('magneticBlockV1','C1')

    if temp_mod:
        tempdeck        = ctx.load_module('Temperature Module Gen2','A3')
        tempblock       = tempdeck.load_adapter('opentrons_96_well_aluminum_block')
        #Keep elution warm during protocol
        elutionplate    = tempblock.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt','Elution Plate')
    else:
        elutionplate    = ctx.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt','A3','Elution Plate')

    #'#008000','#A52A2A','#00FFFF','#0000FF','#800080','#ADD8E6','#FF0000','#FFFF00','#FF00FF','#00008B','#7FFFD4','#FFC0CB','#FFA500','#00FF00','#C0C0C0'

    #Defining Liquid Reservoirs and Assigning Colors/ Locations
    samples         = ctx.define_liquid(name='Samples',description='Sample Volume in Shield',display_color='#00FF00')
    for well in sample_plate.wells():
        well.load_liquid(liquid=samples,volume=sample_vol)

    lysis_reservoir = ctx.load_labware(deepwell_type,'D2','Lysis Reservoir') #deleted after use- replaced (by gripper) with wash2 res
    lysis_res       = lysis_reservoir.wells()[0] #deleted after use- replaced (by gripper) with wash2 res
    lysis_buffer    = ctx.define_liquid(name='Lysis Buffer',description='Lysis Buffer',display_color='#008000')
    for well in lysis_reservoir.wells():
        well.load_liquid(liquid=lysis_buffer,volume=lysis_vol + 100)

    bind_reservoir  = ctx.load_labware(deepwell_type,'C3','Bind Reservoir')
    bind_res        = bind_reservoir.wells()[0]
    bind_buffer     = ctx.define_liquid(name='Binding Buffer',description='Binding Buffer',display_color='#A52A2A')
    for well in bind_reservoir.wells():
        well.load_liquid(liquid=bind_buffer,volume=bind_vol + 93)
    bead_buffer     = ctx.define_liquid(name='Beads',description='Magnetic Beads',display_color='#A52A2A')
    for well in bind_reservoir.wells():
        well.load_liquid(liquid=bead_buffer,volume=bead_vol + 7)

    wash1_reservoir = ctx.load_labware(deepwell_type,'C2','Wash 1 Reservoir')
    wash1           = wash1_reservoir.wells()[0]
    wash1_buffer    = ctx.define_liquid(name='Wash 1 Buffer',description='Wash 1 Buffer',display_color='#00FFFF')
    for well in wash1_reservoir.wells():
        well.load_liquid(liquid=wash1_buffer,volume=wash_vol + 100)

    wash2_reservoir = magblock.load_labware(deepwell_type,'Wash 2 Reservoir') #loaded on magplate- move to lysis location after lysis is used
    wash2           = wash2_reservoir.wells()[0] #loaded on magplate- move to lysis location after lysis is used
    wash2_buffer    = ctx.define_liquid(name='Wash 2 Buffer',description='Wash 2 Buffer',display_color='#0000FF')
    for well in wash2_reservoir.wells():
        well.load_liquid(liquid=wash2_buffer,volume=wash_vol + 100)

    wash3_reservoir = wash4_reservoir = wash5_reservoir = wash6_reservoir = ctx.load_labware(deepwell_type,'B1','Wash 3-6 Reservoir')
    wash3 = wash4 = wash5 = wash6 = wash3_reservoir.wells()[0]
    wash3_buffer    = ctx.define_liquid(name='Wash 3-6 Buffers',description='Wash 3-6 Buffers (EtOH)',display_color='#800080')
    for well in wash3_reservoir.wells():
        well.load_liquid(liquid=wash3_buffer,volume=(4*wash_vol) + 100)

    dnase_reservoir = ctx.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt','B3','DNAse Reservoir')
    dnase_res       = dnase_reservoir.wells()[0]
    dnase_buffer    = ctx.define_liquid(name='DNAseI Buffer',description='DNAseI Buffer',display_color='#ADD8E6')
    for well in dnase_reservoir.wells():
        well.load_liquid(liquid=dnase_buffer,volume=dnase_vol + 3)

    stop_reservoir  = ctx.load_labware(deepwell_type,'B2','Stop Reservoir')
    stop_res        = stop_reservoir.wells()[0]
    stop_buffer     = ctx.define_liquid(name='Stop Buffer',description='Stop Buffer',display_color='#FF0000')
    for well in stop_reservoir.wells():
        well.load_liquid(liquid=stop_buffer,volume=stop_vol+100)

    elution_res     = elutionplate.wells()[0]
    elution_buffer  = ctx.define_liquid(name='Elution Buffer',description='Elution Buffer',display_color='#FFFF00')
    for well in elutionplate.wells():
        well.load_liquid(liquid=elution_buffer,volume=elution_vol)


    # Load tips
    tips    = ctx.load_labware('opentrons_flex_96_tiprack_1000ul', 'A1',adapter='opentrons_flex_96_tiprack_adapter').wells()[0]
    tips1   = ctx.load_labware('opentrons_flex_96_tiprack_1000ul', 'A2',adapter='opentrons_flex_96_tiprack_adapter').wells()[0]

    # load instruments
    pip     = ctx.load_instrument('flex_96channel_1000', mount='left')

    pip.flow_rate.aspirate = 50
    pip.flow_rate.dispense = 150
    pip.flow_rate.blow_out = 300

    def blink():
        for i in range(3):
            ctx.set_rail_lights(True)
            ctx.delay(minutes=0.01666667)
            ctx.set_rail_lights(False)
            ctx.delay(minutes=0.01666667)

    def remove_supernatant(vol,waste):
        pip.pick_up_tip(tips)v
        if vol > 1000:
            x = 2
        else:
            x = 1
        transfer_vol = vol/x
        for i in range(x):
            pip.aspirate(transfer_vol,samples_m.bottom(0.25))
            pip.dispense(transfer_vol,waste.top(-2))
        pip.return_tip()

        #Transfer plate from magnet to H/S
        if heater_shaker:
            h_s.open_labware_latch()
        ctx.move_labware(
            sample_plate,
            h_s_adapter if heater_shaker else 'D1',
            use_gripper=USE_GRIPPER
        )
        if heater_shaker:
            h_s.close_labware_latch()

    def resuspend_pellet(vol,plate,reps=3):
        pip.flow_rate.aspirate = 150
        pip.flow_rate.dispense = 200

        loc1 = plate.bottom().move(types.Point(x=1,y=0,z=1))
        loc2 = plate.bottom().move(types.Point(x=0.75,y=0.75,z=1))
        loc3 = plate.bottom().move(types.Point(x=0,y=1,z=1))
        loc4 = plate.bottom().move(types.Point(x=-0.75,y=0.75,z=1))
        loc5 = plate.bottom().move(types.Point(x=-1,y=0,z=1))
        loc6 = plate.bottom().move(types.Point(x=-0.75,y=0-0.75,z=1))
        loc7 = plate.bottom().move(types.Point(x=0,y=-1,z=1))
        loc8 = plate.bottom().move(types.Point(x=0.75,y=-0.75,z=1))

        if vol>1000:
            vol = 1000

        mixvol = vol*.9

        for _ in range(reps):
            pip.aspirate(mixvol,loc1)
            pip.dispense(mixvol,loc1)
            pip.aspirate(mixvol,loc2)
            pip.dispense(mixvol,loc2)
            pip.aspirate(mixvol,loc3)
            pip.dispense(mixvol,loc3)
            pip.aspirate(mixvol,loc4)
            pip.dispense(mixvol,loc4)
            pip.aspirate(mixvol,loc5)
            pip.dispense(mixvol,loc5)
            pip.aspirate(mixvol,loc6)
            pip.dispense(mixvol,loc6)
            pip.aspirate(mixvol,loc7)
            pip.dispense(mixvol,loc7)
            pip.aspirate(mixvol,loc8)
            pip.dispense(mixvol,loc8)
            if _ == reps-1:
                pip.flow_rate.aspirate = 50
                pip.flow_rate.dispense = 30
                pip.aspirate(mixvol,loc8)
                pip.dispense(mixvol,loc8)

        pip.flow_rate.aspirate = 50
        pip.flow_rate.dispense = 150


    def bead_mix(vol,plate,reps=5):
        pip.flow_rate.aspirate = 150
        pip.flow_rate.dispense = 200

        loc1 = plate.bottom().move(types.Point(x=0,y=0,z=1))
        loc2 = plate.bottom().move(types.Point(x=0,y=0,z=8))
        loc3 = plate.bottom().move(types.Point(x=0,y=0,z=16))
        loc4 = plate.bottom().move(types.Point(x=0,y=0,z=24))

        if vol>1000:
            vol = 1000

        mixvol = vol*.9

        for _ in range(reps):
            pip.aspirate(mixvol,loc1)
            pip.dispense(mixvol,loc1)
            pip.aspirate(mixvol,loc1)
            pip.dispense(mixvol,loc2)
            pip.aspirate(mixvol,loc1)
            pip.dispense(mixvol,loc3)
            pip.aspirate(mixvol,loc1)
            pip.dispense(mixvol,loc4)
            if _ == reps-1:
                pip.flow_rate.aspirate = 50
                pip.flow_rate.dispense = 30
                pip.aspirate(mixvol,loc1)
                pip.dispense(mixvol,loc1)

        pip.flow_rate.aspirate = 50
        pip.flow_rate.dispense = 150

    def lysis(vol, source):
        pip.pick_up_tip(tips)
        pip.aspirate(vol,source)
        pip.dispense(vol,samples_m)
        resuspend_pellet(350,samples_m,reps=4 if not dry_run else 1)
        if not tip_mixing:
            pip.return_tip()

        if heater_shaker:
            h_s.set_and_wait_for_shake_speed(rpm=2000)
        if not heater_shaker and tip_mixing:
            bead_mix(vol,samples_m,reps=5)
            pip.return_tip()
        if not heater_shaker and not tip_mixing:
            if not dry_run:
                ctx.pause(msg='Place on shaker at 2000 rpm for 1 minute.')

        #Delete Lysis reservoir from deck
        ctx.move_labware(
            lysis_reservoir,
            "C4" if USE_GRIPPER else protocol_api.OFF_DECK, #put in staging area (off deck)
            use_gripper=USE_GRIPPER
        )

        #Transfer wash2 res from magnet to deck slot
        ctx.move_labware(
            wash2_reservoir,
            "D2",
            use_gripper=USE_GRIPPER
        )
        if heater_shaker:
            ctx.delay(minutes=1 if not dry_run else 0.25,msg='Please wait 1 minute while the lysis buffer mixes with the sample.')
            h_s.deactivate_shaker()

    def bind(vol,source):
        """
        `bind` will perform magnetic bead binding on each sample in the
        deepwell plate. Each channel of binding beads will be mixed before
        transfer, and the samples will be mixed with the binding beads after
        the transfer. The magnetic deck activates after the addition to all
        samples, and the supernatant is removed after bead bining.
        :param vol (float): The amount of volume to aspirate from the elution
                            buffer source and dispense to each well containing
                            beads.
        :param park (boolean): Whether to save sample-corresponding tips
                               between adding elution buffer and transferring
                               supernatant to the final clean elutions PCR
                               plate.
        """
        pip.pick_up_tip(tips)
        #Mix in reservoir
        bead_mix(vol,source,reps=3 if not dry_run else 1)
        #Transfer from reservoir
        pip.aspirate(vol,source)
        pip.dispense(vol,samples_m)
        #Mix in plate
        bead_mix(1000,samples_m,reps=4 if not dry_run else 1)
        if not tip_mixing:
            pip.return_tip()

        if heater_shaker:
            h_s.set_and_wait_for_shake_speed(rpm=1800)
            ctx.delay(minutes=20 if not dry_run else 0.25,msg='Please wait 20 minutes while the sample binds with the beads.')
            h_s.deactivate_shaker()
        if not heater_shaker and tip_mixing:
            for x in range(3):
                bead_mix(binding_buffer_vol,samples_m,reps=10)
                ctx.delay(minutes=2)
            pip.return_tip()
        if not heater_shaker and not tip_mixing:
            if not dry_run:
                ctx.pause(msg='Place on shaker at 1800 rpm for 20 minutes.')

        if heater_shaker:
            h_s.open_labware_latch()
        #Transfer plate to magnet
        ctx.move_labware(
            sample_plate,
            magblock,
            use_gripper=USE_GRIPPER
        )
        if heater_shaker:
            h_s.close_labware_latch()

        for bindi in np.arange(settling_time+2,0,-0.5): # Settling time delay with countdown timer
            ctx.delay(minutes=0.5, msg='There are ' + str(bindi) + ' minutes left in the incubation.')

        # remove initial supernatant
        remove_supernatant(vol+starting_vol,bind_res)

    def wash(vol, source):

        global whichwash # Defines which wash the protocol is on to log on the app

        if source == wash1:
            waste_res = bind_res
            h = 1
        if source == wash2:
            waste_res = bind_res
            h = 1
        if source == wash3:
            waste_res = wash2
            h = 30
        if source == wash4:
            waste_res = wash2
            h = 20
        if source == wash5:
            waste_res = wash2
            h = 10
        if source == wash6:
            waste_res = wash2
            h = 1

        pip.pick_up_tip(tips)
        pip.aspirate(vol,source.bottom(h))
        pip.dispense(vol,samples_m.top(-2))
        #resuspend_pellet(vol,samples_m,reps=5 if not dry_run else 1)
        if not tip_mixing:
            pip.return_tip()

        if heater_shaker:
            h_s.set_and_wait_for_shake_speed(2000)
            ctx.delay(minutes=5 if not dry_run else 0.25,msg='Please allow 5 minutes for wash to mix on heater-shaker.')
            h_s.deactivate_shaker()
        if not heater_shaker and tip_mixing:
            bead_mix(vol,samples_m,reps=12)
            pip.return_tip()
        if not heater_shaker and not tip_mixing:
            if not dry_run:
                ctx.pause(msg='Place on shaker for 5 minutes at 2000 rpm.')

        if heater_shaker:
            h_s.open_labware_latch()
        #Transfer plate to magnet
        ctx.move_labware(
            sample_plate,
            magblock,
            use_gripper=USE_GRIPPER
        )
        if heater_shaker:
            h_s.close_labware_latch()

        for washi in np.arange(settling_time,0,-0.5): # settling time timer for washes
            ctx.delay(minutes=0.5, msg='There are ' + str(washi) + ' minutes left in wash ' + str(whichwash) + ' incubation.')

        remove_supernatant(vol,waste_res)

        whichwash += 1

    def dnase(vol, source):
        pip.pick_up_tip(tips)
        pip.flow_rate.aspirate = 10
        pip.aspirate(vol,source.bottom(0.5))
        ctx.delay(seconds=1)
        pip.dispense(vol,samples_m)
        if heater_shaker and not dry_run:
            h_s.set_target_temperature(65)
        resuspend_pellet(vol,samples_m,reps=8 if not dry_run else 1)
        if not tip_mixing:
            pip.return_tip()

        if heater_shaker:
            h_s.set_and_wait_for_shake_speed(rpm=2000)
            # minutes should equal 10 minus time it takes to reach 65
            ctx.delay(minutes=9 if not dry_run else 0.25,msg='Please wait 10 minutes while the dnase incubates.')
            h_s.deactivate_shaker()
        if not heater_shaker and tip_mixing:
            for x in range(2):
                bead_mix(vol,samples_m,reps=10)
                ctx.delay(minutes=1)
            pip.return_tip()
        if not heater_shaker and not tip_mixing:
            if not dry_run:
                ctx.pause(msg='Place on shaker for 10 minutes at 2000 rpm.')

    def stop_reaction(vol, source):

        pip.pick_up_tip(tips)
        pip.aspirate(vol,source)
        pip.dispense(vol,samples_m)
        #resuspend_pellet(vol,samples_m,reps=2 if not dry_run else 1)
        if not tip_mixing:
            pip.return_tip()

        if heater_shaker:
            h_s.set_and_wait_for_shake_speed(rpm=1800)
            ctx.delay(minutes=10 if not dry_run else 0.1,msg='Please wait 10 minutes while the stop solution inactivates the dnase.')
            h_s.deactivate_shaker()
        if not heater_shaker and tip_mixing:
            for x in range(2):
                bead_mix(vol,samples_m,reps=10)
                ctx.delay(minutes=1)
            pip.return_tip()
        if not heater_shaker and not tip_mixing:
            if not dry_run:
                ctx.pause(msg='Place on shaker for 10 minutes at 1800 rpm.')

        if heater_shaker:
            h_s.open_labware_latch()
        #Transfer plate to magnet
        ctx.move_labware(
            sample_plate,
            magblock,
            use_gripper=USE_GRIPPER
        )
        if heater_shaker:
            h_s.close_labware_latch()

        for stop in np.arange(settling_time+1,0,-0.5):
            ctx.delay(minutes=0.5,msg='There are ' + str(stop) + ' minutes left in this incubation.')

        remove_supernatant(vol+50,wash1)

    def elute(vol,source):
        pip.pick_up_tip(tips1)
        #Transfer
        pip.aspirate(vol,source)
        pip.dispense(vol,samples_m)
        #Mix
        resuspend_pellet(vol,samples_m,reps=3 if not dry_run else 1)
        if not tip_mixing:
            pip.return_tip()

        #Elution Incubation
        if heater_shaker:
            h_s.set_and_wait_for_shake_speed(rpm=2000)
            if not dry_run and temp_mod:
                tempdeck.set_temperature(4)
            ctx.delay(minutes=3 if not dry_run else 0.25,msg='Please wait 5 minutes while the sample elutes from the beads.')
            h_s.deactivate_shaker()
        if not heater_shaker and tip_mixing:
            bead_mix(vol,samples_m,reps=9)
            pip.return_tip()
            if not dry_run and temp_mod:
                tempdeck.set_temperature(4)
        if not heater_shaker and not tip_mixing:
            if not dry_run:
                ctx.pause(msg='Place on shaker for 5 minutes at 2000 rpm.')

        if heater_shaker:
            h_s.open_labware_latch()
        #Transfer plate to magnet
        ctx.move_labware(
            sample_plate,
            magblock,
            use_gripper=USE_GRIPPER
        )
        if heater_shaker:
            h_s.close_labware_latch()

        for elutei in np.arange(settling_time+2,0,-0.5):
            ctx.delay(minutes=0.5, msg='Incubating on MagDeck for ' + str(elutei) + ' more minutes.')

        pip.flow_rate.aspirate = 10

        pip.pick_up_tip(tips1)
        pip.aspirate(vol,samples_m)
        pip.dispense(vol,source)
        pip.return_tip()

    """
    Here is where you can call the methods defined above to fit your specific
    protocol. The normal sequence is:
    """
    #Start Protocol
    lysis(lysis_vol, lysis_res)
    bind(binding_buffer_vol,bind_res)
    wash(wash_vol, wash1)
    if not dry_run:
        wash(wash_vol, wash2)
        wash(wash_vol, wash3)
    # dnase1 treatment
    dnase(dnase_vol, dnase_res)
    stop_reaction(stop_vol, stop_res)
    # Resume washes
    if not dry_run:
        wash(wash_vol, wash4)
        wash(wash_vol, wash5)
        wash(wash_vol, wash6)
        if temp_mod:
            tempdeck.set_temperature(55)
        drybeads = 9 # Number of minutes you want to dry for
    else:
        drybeads = 0.5
    for beaddry in np.arange(drybeads,0,-0.5):
        ctx.delay(minutes=0.5, msg='There are ' + str(beaddry) + ' minutes left in the drying step.')
    elute(elution_vol,elution_res)
```
