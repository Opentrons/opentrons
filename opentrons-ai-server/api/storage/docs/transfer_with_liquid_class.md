## Differences between `transfer` and `transfer_with_liquid_class`

**Key Parameter Differences:**

**1. Liquid Class Parameter**  
 - `transfer_with_liquid_class` requires a `liquid_class` parameter that defines optimized transfer behavior  
 - `transfer` does not have this parameter and uses default behavior

**2. Source/Destination Requirements**  
- `transfer_with_liquid_class`: Sources and destinations must be **equal in length** (1:1 pairing)  
- `transfer`: Can handle different numbers of sources and destinations (the larger group must be evenly divisible by the smaller group)

**3. Trash Handling**  
- `transfer_with_liquid_class` uses `trash_location` parameter to specify where to drop tips. It serves the same purpose as `my_pipette.trash_container` in `transfer().  
- `transfer` uses `trash` parameter (True/False) to control tip disposal. The `transfer(trash)` parameter is somewhat analogous to `transfer_with_liquid_class(return_tip)`

**4. Tip Management**  
- `transfer_with_liquid_class` has an additional `keep_last_tip` parameter to control whether the last tip is dropped  
- `transfer` only has the standard `new_tip` parameter

**5. Behavior Control**  
- `transfer` has many manual parameters like:  
  - `mix_before`, `mix_after` (tuples for mixing behavior)  
  - `touch_tip` (Boolean)  
  - `air_gap` (volume in µL)  
  - `blow_out`, `blowout_location`  
  - `disposal_volume`

- `transfer_with_liquid_class` automatically handles these behaviors through the liquid class definition - you don't manually specify mixing, air gaps, touch tip, etc.

**6. API Version Requirement**  
- `transfer_with_liquid_class` requires API version 2.24 or later and only works on **Flex** robots  
- `transfer works` on both OT-2 and Flex robots with earlier API versions

**Example Comparison:**

**transfer**

```python
pipette.transfer(
    volume=100,
    source=plate["A1"],
    dest=plate["B1"],
    mix_after=(3, 50),
    touch_tip=True,
    air_gap=10,
    blow_out=True,
    blowout_location="destination well",
    new_tip="always"
)
```

**Liquid class transfer**

```py
water_class = protocol.get_liquid_class("water")
pipette.transfer_with_liquid_class(
    liquid_class=water_liquid,
    volume=100,
    source=plate["A1"],
    dest=plate["B1"],
    new_tip="always",
    trash_location=trash
)
```

The liquid class version automatically applies optimized mixing, touch tip, air gap, and blow out behavior based on the liquid properties, while the traditional transfer requires manual specification of each parameter.



## Liquid Classes examples

### Notes for 1-to-1, 1-to-many and many-to-1 transfers   
- Sources and destinations should be of the same length in order to perform a transfer with `transfer_with_liquid_class`. 
- To transfer liquid from one source to many destinations, use `distribute_with_liquid_class`. 
- To transfer liquid to one destination from many sources, use `consolidate_with_liquid_class`.
  
### Example 1
A protocol with custom properties

<example-one>

```python


from opentrons import protocol_api

metadata = {
    "source": "Liquid Classes example",
}

requirements = {"robotType": "Flex", "apiLevel": "2.24"}

def run(protocol: protocol_api.ProtocolContext) -> None:
    # Load Labware:
    tip_rack_1 = protocol.load_labware(
        "opentrons_flex_96_filtertiprack_1000ul",
        location="C2",
        namespace="opentrons",
        version=1,
    )
    reservoir_1 = protocol.load_labware(
        "nest_12_reservoir_15ml",
        location="B1",
        namespace="opentrons",
        version=2,
    )
    well_plate_1 = protocol.load_labware(
        "nest_96_wellplate_2ml_deep",
        location="D1",
        namespace="opentrons",
        version=3,
    )

    # Load Pipettes:
    pipette_left = protocol.load_instrument(
        "flex_1channel_1000", "left", tip_racks=[tip_rack_1],
    )

    # Load Trash Bins:
    trash_bin_1 = protocol.load_trash_bin("A3")

    # PROTOCOL STEPS
    custom_liquid_class_properties = {
        "flex_1channel_1000": {
            "opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 1},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 716)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "mix": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 100,
                        "start_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                    },
                    "retract": {
                        "air_gap_by_volume": [(0, 0)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 50,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 1},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 716)],
                    "delay": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 100,
                        "start_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                    },
                    "retract": {
                        "air_gap_by_volume": [(0, 0)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 50,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": False},
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 20)],
                    "mix": {"enabled": False},
                },
            }
        }
    }
    # Step 1:
    pipette_left.transfer_with_liquid_class(
        volume=200,
        source=[reservoir_1["A1"], reservoir_1["A1"], reservoir_1["A1"], reservoir_1["A1"], reservoir_1["A1"], reservoir_1["A1"], reservoir_1["A1"], reservoir_1["A1"]],
        dest=[well_plate_1["A1"], well_plate_1["B1"], well_plate_1["C1"], well_plate_1["D1"], well_plate_1["E1"], well_plate_1["F1"], well_plate_1["G1"], well_plate_1["H1"]],
        new_tip="always",
        trash_location=trash_bin_1,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_1",
            properties=custom_liquid_class_properties,
        ),
    )
    pipette_left.drop_tip()
```
</example-one>



### Example 2: A protocol with aqueous liquid class (water) and custom properties

<example-two>

```python
...
# Load Liquid Classes:
water_base_class = protocol.get_liquid_class("water")
custom_liquid_class_properties  = ...
pipette_left.transfer_with_liquid_class(
    volume=200,
    source=...,
    dest=...,
    new_tip="always",
    trash_location=trash_bin_1,
    keep_last_tip=True,
    liquid_class=protocol.define_liquid_class(
        name="transfer_step_1",
        base_liquid_class=water_base_class,
        properties=custom_liquid_class_properties,
    ),
)
pipette_left.drop_tip()

...
```

</example-two>
