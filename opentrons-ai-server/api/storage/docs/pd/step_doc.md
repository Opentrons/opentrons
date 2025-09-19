# Protocol Designer Documentation for OT-2 and Flex (LLM-friendly)

**Schema Version: 8**

This document outlines the JSON structure used by Opentrons Protocol Designer. For a successful import, a protocol file must adhere to a minimal structure. Key top-level fields include:

- `"metadata"`: Contains protocol metadata like name and description.
- `"robot"`: Defines the robot model (`"OT-2 Standard"` or `"OT-3 Standard"`) and `deckId`.
- `"designerApplication"`: Contains Protocol Designer specific data, including its version and the core `data` object.
  - `data`: Holds `savedStepForms` (including `__INITIAL_DECK_SETUP_STEP__`), `orderedStepIds`, and definitions for `pipettes`, `modules`, `labware`, etc.

## Overall structure

```json
{
  "metadata": {
    "protocolName": "",
    "description": ""
  },
  "designerApplication": {
    "data": {
      "pipetteTiprackAssignments": {},
      "ingredients": {},
      "ingredLocations": {},
      "savedStepForms": {
        "__INITIAL_DECK_SETUP_STEP__": {
          "labwareLocationUpdate": {},
          "pipetteLocationUpdate": {},
          "moduleLocationUpdate": {},
          "trashBinLocationUpdate": {},
          "wasteChuteLocationUpdate": {},
          "stagingAreaLocationUpdate": {},
          "gripperLocationUpdate": {}
        },
        "step-n": {}
      },
      "orderedStepIds": ["step-n"],
      "pipettes": {},
      "modules": {},
      "labware": {}
    }
  },
  "robot": {}
}
```

### Common Features (Both OT-2 and Flex)

#### Add a robot type

```json
"robot": {
  "model": "", // "OT-3 Standard" or "OT-2 Standard"
  "deckId": "" // "ot3_standard" or "ot2_standard"
},
```

#### Add a pipette

Define a pipette:

```json
"pipettes": {
  "pipette_left": {
    "pipetteName": "" // pipette API name e.g., "p1000_single_flex"
  }
}
```

Define mount:

```json
"pipetteLocationUpdate": {"pipette_left": ""} // "left" or "right", e.g., "pipette_left": "left"
```

Define tiprack assignment:

```json
"pipetteTiprackAssignments": {
  "pipette_left": [
    "opentrons/opentrons_flex_96_filtertiprack_50ul/1"
  ]
}
```

Note that pipette ID `pipette_left` must be consistent across different fields:
"pipettes", "pipetteLocationUpdate", "pipetteTiprackAssignments" and where it is used.

#### Add modules (Common)

- Define module:

```json
"modules": {
  "module-1": { // id must be consistent across JSON
    "model": "" // API model name e.g., "heaterShakerModuleV1"
  }
}
```

- Assign a slot:

```json
"moduleLocationUpdate": {
  "module-1": "D1" // Must be string value from "A1, A2, A3, B1, B2, B3, C1, C2, C3, D1, D2, D3" for Flex, or "1-11" for OT-2
}
```

#### Add labware

- Define labware:

```json
"labware": {
  "labware-1": { // ID must be consistent across JSON e.g., labware-1
    "displayName": "Opentrons Flex 96 Filter Tip Rack 50 µL",
    "labwareDefURI": "opentrons/opentrons_flex_96_filtertiprack_50ul/1"
  }
}
```

- Assign a slot:

```json
"labwareLocationUpdate": {
  "labware-1": "C2" // Must be string value from "A1, A2, A3, B1, B2, B3, C1, C2, C3, D1, D2, D3" for Flex, or "1-11" for OT-2
}
```

#### Add liquid

Define liquid by filling out these fields:

```json
"ingredients": {
  "0": {   // ID-Identifier for liquid - starting from "0"
    "displayName": "", // Display name e.g., "water"
    "description": "", // Description e.g., "samples for mixing"
    "displayColor": "", // Color e.g., #50d5ffff
    "liquidGroupId": "" // The same as ID e.g., "0"
  }
}
```

#### Common step types (both OT-2 and Flex)

- 'thermocycler'
- 'temperature'
- 'heaterShaker'
- 'mix'
- 'moveLabware'
- 'pause'
- 'moveLiquid'

### Flex-Specific Features

#### Add a gripper (Flex only)

With

```json
"gripperLocationUpdate": {"gripper-1": "mounted"}
```

Without gripper:

```json
"gripperLocationUpdate": {}
```

#### Add fixtures (Flex only)

Three types of fixtures; at least one of them must exist on the deck:

1. If `Trash Bin` is selected:

```json
"trashBinLocationUpdate": {"trashbin-1": "cutoutA3"} # Note that `"trashbin-1"` is ID thus must be consistent accross JSON
```

else:

```json
"trashBinLocationUpdate": {},
```

2. If `Waste Chute` is selected:

```json
"wasteChuteLocationUpdate": {"wastechute-1": "cutoutD3"} # Note that `"wastechute-1"` is ID thus must be consistent accross JSON
```

else:

```json
"wasteChuteLocationUpdate": {}
```

3. If `Staging Area` is selected:

```json
"stagingAreaLocationUpdate": {"stagingarea-1": "cutoutB3"} # Note that `"stagingarea-1"` is ID thus must be consistent accross JSON
```

else:

```json
"stagingAreaLocationUpdate": {}
```

#### Flex-only step types

- 'absorbanceReader'

### OT-2-Specific Features

#### OT-2-only step types

- 'magnet'

### Module Compatibility

#### OT-2-only modules

- Magnetic Module GEN2

#### Flex-only modules

- Absorbance Plate Reader
- Magnetic Block GEN1

#### Modules compatible with both robots

- Heater-Shaker Module GEN1
- Thermocycler Module GEN2
- Temperature Module GEN2

### Special Notes

1. Module Placement Restrictions:

   - Thermocycler module (GEN2):
     - Must be placed in slot B1
     - Automatically occupies slots A1 and B1
   - Temperature module (GEN2):
     - Can be placed in any available slot
   - Heater-Shaker module (GEN1):
     - Can be placed in any available slot

2. Consistent Identifiers:

   - Pipette IDs: Use format like "pipette_left", "pipette_right"
   - Module IDs: Use format like "tc-1", "t-1", "hs-1", where tc is for Thermocycler, t for Temperature, hs for Heater-Shaker. Absorbance Plate Reader modul for "apr-1"
   - Labware IDs: Use format like "labware-1", "labware-2"
   - Liquid IDs: Use sequential numbers starting from "0"

3. Identifier Consistency:

   - **Pipette Identifiers** must be consistent across:

     - `designerApplication.data.pipetteTiprackAssignments`
     - `savedStepForms.__INITIAL_DECK_SETUP_STEP__.pipetteLocationUpdate`
     - `data.pipettes`

   - **Labware Identifiers** must be consistent across:

     - `savedStepForms.__INITIAL_DECK_SETUP_STEP__.labwareLocationUpdate`
     - `data.labware`

   - **Module Identifiers** must be consistent across:
     - `savedStepForms.__INITIAL_DECK_SETUP_STEP__.moduleLocationUpdate` (e.g., "hs-1")
     - `data.modules`

## Case 1: Basic Pipette and Tiprack Setup

### Input

```text
Metadata:
- ProtocolName: Basic protocol with no action
- Description: Protocol with a pipette and tips and a tiprack. No steps.

Robot:
- Flex

Pipette Mount:
- Left Mount: p50_multi_flex

Gripper:
- Yes

Fixtures:
- Trash bin

Labware:
- opentrons_flex_96_filtertiprack_50ul in slot C2
```

### Output

```json
{
  "metadata": {
    "protocolName": "Basic protocol with no action",
    "description": "Protocol with a pipette and tips and a tiprack. No steps."
  },
  "designerApplication": {
    "data": {
      "pipetteTiprackAssignments": {
        "pipette_left": ["opentrons/opentrons_flex_96_filtertiprack_50ul/1"]
      },
      "ingredients": {},
      "ingredLocations": {},
      "savedStepForms": {
        "__INITIAL_DECK_SETUP_STEP__": {
          "labwareLocationUpdate": {
            "labware-1": "C2"
          },
          "pipetteLocationUpdate": {
            "pipette_left": "left"
          },
          "moduleLocationUpdate": {},
          "trashBinLocationUpdate": {
            "trashbin-1": "cutoutA3"
          },
          "wasteChuteLocationUpdate": {},
          "stagingAreaLocationUpdate": {},
          "gripperLocationUpdate": {
            "gripper-1": "mounted"
          }
        }
      },
      "orderedStepIds": [],
      "pipettes": {
        "pipette_left": {
          "pipetteName": "p50_single_flex"
        }
      },
      "modules": {},
      "labware": {
        "labware-1": {
          "displayName": "Opentrons Flex 96 Filter Tip Rack 50 µL",
          "labwareDefURI": "opentrons/opentrons_flex_96_filtertiprack_50ul/1"
        }
      }
    }
  },
  "robot": {
    "model": "OT-3 Standard",
    "deckId": "ot3_standard"
  }
}
```

## Case 2: Load Heater-Shaker Module

### Input

```text
Metadata:
- ProtocolName: Heater shaker load
- Description: Load heater shaker to the deck. No steps or commands.

Robot:
- Flex

Pipette Mount:
- Left Mount: p50_multi_flex

Gripper:
- Yes

Module:
- heaterShakerModuleV1 in slot D1

Fixtures:
- Trash bin

Labware:
- opentrons_flex_96_filtertiprack_50ul in slot C2

```

### Output

```json
{
  "metadata": {
    "protocolName": " Heater shaker load",
    "description": "Load heater shaker to the deck. No steps or commands.."
  },
  "designerApplication": {
    "data": {
      "pipetteTiprackAssignments": {
        "pipette_left": ["opentrons/opentrons_flex_96_filtertiprack_50ul/1"]
      },
      "ingredients": {},
      "ingredLocations": {},
      "savedStepForms": {
        "__INITIAL_DECK_SETUP_STEP__": {
          "labwareLocationUpdate": {
            "labware-1": "C2"
          },
          "moduleLocationUpdate": {
            "hs-1": "D1"
          },
          "pipetteLocationUpdate": {
            "pipette_left": "left"
          },
          "trashBinLocationUpdate": {
            "trashbin-1": "cutoutA3"
          },
          "wasteChuteLocationUpdate": {},
          "stagingAreaLocationUpdate": {},
          "gripperLocationUpdate": {
            "gripper-1": "mounted"
          }
        }
      },
      "orderedStepIds": [],
      "pipettes": {
        "pipette_left": {
          "pipetteName": "p50_single_flex"
        }
      },
      "modules": {
        "hs-1": {
          "model": "heaterShakerModuleV1"
        }
      },
      "labware": {
        "labware-1": {
          "displayName": "Opentrons Flex 96 Filter Tip Rack 50 µL",
          "labwareDefURI": "opentrons/opentrons_flex_96_filtertiprack_50ul/1"
        }
      }
    }
  },
  "robot": {
    "model": "OT-3 Standard",
    "deckId": "ot3_standard"
  }
}
```

## Case 3: Load thermocycler module

### Input

```text
Metadata:
- ProtocolName: Load thermocycler module
- Description: Load thermocycler module to the deck. No steps or commands.

Robot:
- Flex

Pipette mount:
- Left: p50_single_flex

Gripper
- mounted

Module:
- thermocyclerModuleV2 in slot B1

Fixtures:
- Trash bin

Labware:
- opentrons_flex_96_filtertiprack_50ul in slot C2
```

### Output

```json
{
  "metadata": {
    "protocolName": "Load thermocycler module",
    "description": "Load thermocycler module to the deck. No steps or commands."
  },
  "designerApplication": {
    "data": {
      "pipetteTiprackAssignments": {
        "pipette_left": ["opentrons/opentrons_flex_96_filtertiprack_50ul/1"]
      },
      "ingredients": {},
      "ingredLocations": {},
      "savedStepForms": {
        "__INITIAL_DECK_SETUP_STEP__": {
          "labwareLocationUpdate": {
            "labware-1": "C2"
          },
          "moduleLocationUpdate": {
            "tc-1": "B1"
          },
          "pipetteLocationUpdate": {
            "pipette_left": "left"
          },
          "trashBinLocationUpdate": {
            "trashbin-1": "cutoutA3"
          },
          "wasteChuteLocationUpdate": {},
          "stagingAreaLocationUpdate": {},
          "gripperLocationUpdate": {
            "gripper-1": "mounted"
          }
        }
      },
      "orderedStepIds": [],
      "pipettes": {
        "pipette_left": {
          "pipetteName": "p50_single_flex"
        }
      },
      "modules": {
        "tc-1": {
          "model": "thermocyclerModuleV2"
        }
      },
      "labware": {
        "labware-1": {
          "displayName": "Opentrons Flex 96 Filter Tip Rack 50 µL",
          "labwareDefURI": "opentrons/opentrons_flex_96_filtertiprack_50ul/1"
        }
      }
    }
  },
  "robot": {
    "model": "OT-3 Standard",
    "deckId": "ot3_standard"
  }
}
```

## Case 4: Load Temperature module

### Input

```text
Metadata:
- ProtocolName: Load temperature module
- Description: Load temperature module to the deck. No steps or commands.

Robot:
- Flex

Pipette mount:
- right: p50_single_flex

Gripper:
- No need

Module:
- temperatureModuleV2 in slot C1

Fixtures:
- Waste chute

Labware:
- opentrons_flex_96_filtertiprack_50ul in slot C2
```

### Output

```json
{
  "metadata": {
    "protocolName": "Load temperature module",
    "description": "Load temperature module to the deck. No steps or commands."
  },
  "designerApplication": {
    "data": {
      "pipetteTiprackAssignments": {
        "pipette_left": ["opentrons/opentrons_flex_96_filtertiprack_50ul/1"]
      },
      "ingredients": {},
      "ingredLocations": {},
      "savedStepForms": {
        "__INITIAL_DECK_SETUP_STEP__": {
          "labwareLocationUpdate": {
            "labware-1": "C2"
          },
          "moduleLocationUpdate": {
            "t-1": "D1"
          },
          "pipetteLocationUpdate": {
            "pipette_left": "left"
          },
          "trashBinLocationUpdate": {
            "trashbin-1": "cutoutA3"
          },
          "wasteChuteLocationUpdate": {},
          "stagingAreaLocationUpdate": {},
          "gripperLocationUpdate": {
            "gripper-1": "mounted"
          },
          "stepType": "manualIntervention",
          "id": "__INITIAL_DECK_SETUP_STEP__"
        }
      },
      "orderedStepIds": [],
      "pipettes": {
        "pipette_left": {
          "pipetteName": "p50_single_flex"
        }
      },
      "modules": {
        "t-1": {
          "model": "temperatureModuleV2"
        }
      },
      "labware": {
        "labware-1": {
          "displayName": "Opentrons Flex 96 Filter Tip Rack 50 µL",
          "labwareDefURI": "opentrons/opentrons_flex_96_filtertiprack_50ul/1"
        }
      }
    }
  },
  "robot": {
    "model": "OT-3 Standard",
    "deckId": "ot3_standard"
  }
}
```

## Case 5: Load two pipettes

### Input

```text
Metadata:
- ProtocolName: Load two pipettes: left and right mounts
- Description: Load two pipettes to the left and right mounts. No steps and commands.

Robot:
- Flex

Pipette Mount:
- Left mount: p50_single_flex
- Right mount: p1000_multi_flex

Gripper:
- Yes

Fixtures:
- Trashbin

Labware:
- opentrons_flex_96_tiprack_50ul in slot C2
- opentrons_flex_96_filtertiprack_1000ul in slot B2
```

### output

```json
{
  "metadata": {
    "protocolName": "Load two pipettes: left and right mounts",
    "description": "Load two pipettes to the left and right mounts. No steps."
  },
  "designerApplication": {
    "data": {
      "pipetteTiprackAssignments": {
        "pipette_left": ["opentrons/opentrons_flex_96_filtertiprack_50ul/1"],
        "pipette_right": ["opentrons/opentrons_flex_96_filtertiprack_1000ul/1"]
      },
      "ingredients": {},
      "ingredLocations": {},
      "savedStepForms": {
        "__INITIAL_DECK_SETUP_STEP__": {
          "labwareLocationUpdate": {
            "labware-1": "C2",
            "labware-2": "D2"
          },
          "moduleLocationUpdate": {},
          "pipetteLocationUpdate": {
            "pipette_left": "left",
            "pipette_right": "right"
          },
          "trashBinLocationUpdate": {
            "trashbin-1": "cutoutA3"
          },
          "wasteChuteLocationUpdate": {},
          "stagingAreaLocationUpdate": {},
          "gripperLocationUpdate": {
            "gripper-1": "mounted"
          },
          "stepType": "manualIntervention",
          "id": "__INITIAL_DECK_SETUP_STEP__"
        }
      },
      "orderedStepIds": [],
      "pipettes": {
        "pipette_left": {
          "pipetteName": "p50_single_flex"
        },
        "pipette_right": {
          "pipetteName": "p1000_multi_flex"
        }
      },
      "modules": {},
      "labware": {
        "labware-1": {
          "displayName": "Opentrons Flex 96 Filter Tip Rack 50 µL",
          "labwareDefURI": "opentrons/opentrons_flex_96_filtertiprack_50ul/1"
        },
        "labware-2": {
          "displayName": "Opentrons Flex 96 Filter Tip Rack 1000 µL",
          "labwareDefURI": "opentrons/opentrons_flex_96_filtertiprack_1000ul/1"
        }
      }
    }
  },
  "robot": {
    "model": "OT-3 Standard",
    "deckId": "ot3_standard"
  }
}
```

## Case 6: Define liquid

### Input

```text
Metadata:
- ProtocolName: Basic protocol with liquid
- Description: protocol with a pipette and tips and a tiprack. No steps.

Robot:
- Flex

Pipette Mount:
- Left: p50_single_flex

Gripper: No

Module: No

Fixture
- Trash bin

Labware:
- opentrons_flex_96_tiprack_50ul

Liquid
- Define water, color is blue
```

### Output

```json
{
  "metadata": {
    "protocolName": "Basic protocol with liquid",
    "description": "Defining liquid. Water with a blue color."
  },
  "designerApplication": {
    "data": {
      "pipetteTiprackAssignments": {
        "pipette_left": ["opentrons/opentrons_flex_96_tiprack_50ul/1"]
      },
      "ingredients": {
        "0": {
          "displayName": "water",
          "description": "blue water sample",
          "displayColor": "#50d5ffff",
          "liquidGroupId": "0"
        }
      },
      "ingredLocations": {},
      "savedStepForms": {
        "__INITIAL_DECK_SETUP_STEP__": {
          "labwareLocationUpdate": {
            "labware-1": "C2"
          },
          "pipetteLocationUpdate": {
            "pipette_left": "left"
          },
          "moduleLocationUpdate": {},
          "trashBinLocationUpdate": {
            "trashbin-1": "cutoutA3"
          },
          "wasteChuteLocationUpdate": {},
          "stagingAreaLocationUpdate": {},
          "gripperLocationUpdate": {}
        }
      },
      "orderedStepIds": [],
      "pipettes": {
        "pipette_left": {
          "pipetteName": "p50_single_flex"
        }
      },
      "modules": {},
      "labware": {
        "labware-1": {
          "displayName": "Opentrons Flex 96 Tip Rack 50 µL",
          "labwareDefURI": "opentrons/opentrons_flex_96_tiprack_50ul/1"
        }
      }
    }
  },
  "robot": {
    "model": "OT-3 Standard",
    "deckId": "ot3_standard"
  }
}
```

## Case 7: Add liquid

### Input

```text
Robot:
- Flex

Pipette Mount:
- Left: p1000_single_flex

Gripper
- No

Fixture:
- Trashbin

Labware:
- opentrons_flex_96_filtertiprack_1000ul in slot D1
- nest_12_reservoir_15ml in slot B1

Liquid
- Add 13333 of water to A1 of the reservoir
```

### Output

```json
{
  "metadata": {
    "protocolName": "Basic protocol with liquid",
    "description": "Add 13333ul of water to A1 of the reservoir."
  },
  "designerApplication": {
    "data": {
      "pipetteTiprackAssignments": {
        "pipette_left": ["opentrons/opentrons_flex_96_filtertiprack_1000ul/1"]
      },
      "ingredients": {
        "0": {
          "displayName": "water",
          "description": "blue water sample",
          "displayColor": "#50d5ffff",
          "liquidGroupId": "0"
        }
      },
      "ingredLocations": {
        "labware-1": {
          "A1": {
            "0": {
              "volume": 13333
            }
          }
        }
      },
      "savedStepForms": {
        "__INITIAL_DECK_SETUP_STEP__": {
          "labwareLocationUpdate": {
            "labware-1": "B1",
            "labware-2": "D1"
          },
          "moduleLocationUpdate": {},
          "pipetteLocationUpdate": {
            "pipette_left": "left"
          },
          "trashBinLocationUpdate": {
            "trashbin-1": "cutoutA3"
          },
          "wasteChuteLocationUpdate": {},
          "stagingAreaLocationUpdate": {},
          "gripperLocationUpdate": {}
        }
      },
      "orderedStepIds": [],
      "pipettes": {
        "pipette_left": {
          "pipetteName": "p1000_single_flex"
        }
      },
      "modules": {},
      "labware": {
        "labware-1": {
          "displayName": "NEST 12 Well Reservoir 15 mL",
          "labwareDefURI": "opentrons/nest_12_reservoir_15ml/1"
        },
        "labware-2": {
          "displayName": "Opentrons Flex 96 Filter Tip Rack 1000 µL",
          "labwareDefURI": "opentrons/opentrons_flex_96_filtertiprack_1000ul/1"
        }
      }
    }
  },
  "robot": {
    "model": "OT-3 Standard",
    "deckId": "ot3_standard"
  }
}
```

## Case 8: Heater-shaker module with well plate (Flex only)

### Input

```text
Metadata:
- ProtocolName: Heater-shaker module with well plate
- Description: Load heater-shaker module with well plate

Robot:
- Flex

Pipette Mount:
- Left Mount: p1000_96

Gripper: No

Module:
- heaterShakerModuleV1 in D1

Fixtures
- Trashbin

Labware:
- opentrons_flex_96_tiprack_adapter in C2
- opentrons_flex_96_filtertiprack_200ul on opentrons_flex_96_tiprack_adapter
- opentrons_universal_flat_adapter on the heater-shaker
- corning_96_wellplate_360ul_flat on opentrons_universal_flat_adapter
```

**Specific Note**
Placing labware on heater shaker module requires adapter. The list of adapters and their corresponding compatible labware is as follows:

<Adapters>

- Opentrons 96 Deep Well Heater-Shaker Adapter

  - NEST 96 Deep Well Plate 2mL

- Opentrons 96 Flat Bottom Heater-Shaker Adapter

  - NEST 96 Well Plate 200 uL Flat

- Opentrons 96 PCR Heater-Shaker Adapter

  - Armadillo 96 Well Plate 200 uL PCR Full Skirt
  - Bio-Rad 96 Well Plate 200 uL PCR
  - NEST 96 Well Plate 100 uL PCR Full Skirt
  - Opentrons Tough 96 Well Plate 200 uL PCR Full Skirt

- Opentrons Universal Flat Heater-Shaker Adapter
  - Corning 384 Well Plate 112 uL Flat
  - Corning 96 Well Plate 360 uL Flat

</Adapters>

### Output

```json
{
  "metadata": {
    "protocolName": "Heater-shaker module with well plate",
    "description": "Load heater-shaker module with well plate"
  },
  "designerApplication": {
    "data": {
      "pipetteTiprackAssignments": {
        "pipette_left": ["opentrons/opentrons_flex_96_filtertiprack_1000ul/1"]
      },
      "ingredients": {},
      "ingredLocations": {},
      "savedStepForms": {
        "__INITIAL_DECK_SETUP_STEP__": {
          "labwareLocationUpdate": {
            "labware-1": "C2",
            "labware-2": "labware-1",
            "labware-3": "hs-1",
            "labware-4": "labware-3"
          },
          "pipetteLocationUpdate": {
            "pipette_left": "left"
          },
          "moduleLocationUpdate": {
            "hs-1": "D1"
          },
          "trashBinLocationUpdate": {
            "trash-1": "cutoutA3"
          },
          "wasteChuteLocationUpdate": {},
          "stagingAreaLocationUpdate": {},
          "gripperLocationUpdate": {}
        }
      },
      "orderedStepIds": [],
      "pipettes": {
        "pipette_left": {
          "pipetteName": "p1000_96"
        }
      },
      "modules": {
        "hs-1": {
          "model": "heaterShakerModuleV1"
        }
      },
      "labware": {
        "labware-1": {
          "displayName": "Opentrons Flex 96 Tip Rack Adapter",
          "labwareDefURI": "opentrons/opentrons_flex_96_tiprack_adapter/1"
        },
        "labware-2": {
          "displayName": "Opentrons Flex 96 Filter Tip Rack 1000 µL",
          "labwareDefURI": "opentrons/opentrons_flex_96_filtertiprack_1000ul/1"
        },
        "labware-3": {
          "displayName": "Opentrons Universal Flat Heater-Shaker Adapter",
          "labwareDefURI": "opentrons/opentrons_universal_flat_adapter/1"
        },
        "labware-4": {
          "displayName": "Corning 96 Well Plate 360 µL Flat",
          "labwareDefURI": "opentrons/corning_96_wellplate_360ul_flat/2"
        }
      }
    }
  },
  "robot": {
    "model": "OT-3 Standard",
    "deckId": "ot3_standard"
  }
}
```

**Note about adapter references:**
When placing labware on adapters, or adapters on modules, Protocol Designer uses a chain of reference IDs. Each labware refers to its "parent" location, which can be:

- A deck slot (like "C2")
- A module ID (like "hs-1")
- Another labware ID (like "labware-1")

This creates a chain of dependencies that defines the exact location of each item on the deck. For example, in this case:

1. The tiprack adapter (labware-1) is placed in slot C2
2. The tiprack (labware-2) is placed on the tiprack adapter (labware-1)
3. The flat adapter (labware-3) is placed on the heater-shaker module (hs-1)
4. The well plate (labware-4) is placed on the flat adapter (labware-3)

## Case 9: Thermocycler with plate

### Input

```text
Metadata:
- ProtocolName: Thermocycler with plate
- Description: Thermocycler with plate. No steps or commands.

Robot:
- Flex

Pipette mount:
- Left mount: p1000_single_flex

Gripper not mounted

Module:
- Thermocycler

Fixture
- Trashbin

Labware:
- opentrons_flex_96_filtertiprack_50ul in slot C2
- opentrons_96_wellplate_200ul_pcr_full_skirt is on the thermocycler module
```

### Output

```json
{
  "metadata": {
    "protocolName": "Thermocycler with plate",
    "description": "Thermocycler with plate. No steps or commands."
  },
  "designerApplication": {
    "data": {
      "pipetteTiprackAssignments": {
        "pipette_left": ["opentrons/opentrons_flex_96_filtertiprack_50ul/1"]
      },
      "ingredients": {},
      "ingredLocations": {},
      "savedStepForms": {
        "__INITIAL_DECK_SETUP_STEP__": {
          "labwareLocationUpdate": {
            "labware-1": "C2",
            "labware-2": "tc-1"
          },
          "pipetteLocationUpdate": {
            "pipette_left": "left"
          },
          "moduleLocationUpdate": {
            "tc-1": "B1"
          },
          "trashBinLocationUpdate": {
            "trashbin-1": "cutoutA3"
          },
          "wasteChuteLocationUpdate": {},
          "stagingAreaLocationUpdate": {},
          "gripperLocationUpdate": {}
        }
      },
      "orderedStepIds": [],
      "pipettes": {
        "pipette_left": {
          "pipetteName": "p1000_single_flex"
        }
      },
      "modules": {
        "tc-1": {
          "model": "thermocyclerModuleV2"
        }
      },
      "labware": {
        "labware-1": {
          "displayName": "Opentrons Flex 96 Filter Tip Rack 50 µL",
          "labwareDefURI": "opentrons/opentrons_flex_96_filtertiprack_50ul/1"
        },
        "labware-2": {
          "displayName": "Opentrons Tough 96 Well Plate 200 µL PCR Full Skirt",
          "labwareDefURI": "opentrons/opentrons_96_wellplate_200ul_pcr_full_skirt/2"
        }
      }
    }
  },
  "robot": {
    "model": "OT-3 Standard",
    "deckId": "ot3_standard"
  }
}
```

**Note**

- For Flex robot, note that thermocycler is always in slot B1 (covering B1 and A1 slots in practice).
- For OT-2 robot, note that thermocycler is always in slot 7 (covering 7, 8, 10, 11) slots in practice).

## Case 10: Temperature with plate

### Input

```text
Metadata:
- ProtocolName: Temperature with plate
- Description: Temperature with plate. No steps or commands.

Robot:
- Flex

Pipette mount:
- Left mount: p1000_multi_flex

Gripper
- No

Module:
- Temperature module 1 in C1
- Temperature module 2 in B1

Fixture:
- Trashbin

Labware:
- opentrons_flex_96_tiprack_1000ul in C2
- opentrons_24_aluminumblock_nest_2ml_snapcap on temperature module 1
- opentrons_96_deep_well_temp_mod_adapter on tempertue module 2
- nest_96_wellplate_2ml_deep on the opentrons_96_deep_well_temp_mod_adapter
```

**Special Notes**
Placing labware on temperature module requires Aluminum blocks and/or adapters. The list of Aluminum blocks and adapters with their corresponding compatible labware is as follows:

<Aluminum blocks>
- Opentrons 24 Well Aluminum Block with Generic 2 mL Screwcap
- Opentrons 24 Well Aluminum Block with NEST 0.5 mL Screwcap
- Opentrons 24 Well Aluminum Block with NEST 1.5 mL Screwcap
- Opentrons 24 Well Aluminum Block with NEST 1.5 mL Snapcap
- Opentrons 24 Well Aluminum Block with NEST 2 mL Screwcap
- Opentrons 24 Well Aluminum Block with NEST 2 mL Snapcap
- Opentrons 96 Well Aluminum Block with Generic PCR Strip 200 µL
- Opentrons 96 Well Aluminum Block:
  - Adapter compatible labware:
    - Armadillo 96 Well Plate 200 µL PCR Full Skirt
    - Bio-Rad 96 Well Plate 200 µL PCR
    - NEST 96 Well Plate 100 µL PCR Full Skirt
    - Opentrons Tough 96 Well Plate 200 µL PCR Full Skirt
- Opentrons Aluminum Flat Bottom Plate:
  - Adapter compatible labware:
    - Corning 12 Well Plate 6.9 mL Flat
    - Corning 24 Well Plate 3.4 mL Flat
    - Corning 384 Well Plate 112 µL Flat
    - Corning 48 Well Plate 1.6 mL Flat
    - Corning 6 Well Plate 16.8 mL Flat
    - Corning 96 Well Plate 360 µL Flat
    - NEST 96 Well Plate 200 µL Flat
</Aluminum blocks>

<Adapters>
- Opentrons 96 Deep Well Temperature Module Adapter
  - Adapter compatible labware:
    - NEST 96 Deep Well Plate 2mL
</Adapters>

### Output

```json
{
  "metadata": {
    "protocolName": "Temperature with plate",
    "description": "Temperature with plate. No steps or commands."
  },
  "designerApplication": {
    "data": {
      "pipetteTiprackAssignments": {
        "pipette_left": ["opentrons/opentrons_flex_96_tiprack_1000ul/1"]
      },
      "ingredients": {},
      "ingredLocations": {},
      "savedStepForms": {
        "__INITIAL_DECK_SETUP_STEP__": {
          "labwareLocationUpdate": {
            "labware-1": "C2",
            "labware-2": "t-1",
            "labware-3": "t-2",
            "labware-4": "labware-3"
          },
          "pipetteLocationUpdate": {
            "pipette_left": "left"
          },
          "moduleLocationUpdate": {
            "t-1": "C1",
            "t-2": "B1"
          },
          "trashBinLocationUpdate": {
            "trashbin-1": "cutoutA3"
          },
          "wasteChuteLocationUpdate": {},
          "stagingAreaLocationUpdate": {},
          "gripperLocationUpdate": {}
        }
      },
      "orderedStepIds": [],
      "pipettes": {
        "pipette_left": {
          "pipetteName": "p1000_multi_flex"
        }
      },
      "modules": {
        "t-1": {
          "model": "temperatureModuleV2"
        },
        "t-2": {
          "model": "temperatureModuleV2"
        }
      },
      "labware": {
        "labware-1": {
          "displayName": "Opentrons Flex 96 Tip Rack 1000 µL",
          "labwareDefURI": "opentrons/opentrons_flex_96_tiprack_1000ul/1"
        },
        "labware-2": {
          "displayName": "Opentrons 24 Well Aluminum Block with NEST 2 mL Snapcap",
          "labwareDefURI": "opentrons/opentrons_24_aluminumblock_nest_2ml_snapcap/1"
        },
        "labware-3": {
          "displayName": "Opentrons 96 Deep Well Temperature Module Adapter",
          "labwareDefURI": "opentrons/opentrons_96_deep_well_temp_mod_adapter/1"
        },
        "labware-4": {
          "displayName": "NEST 96 Deep Well Plate 2mL",
          "labwareDefURI": "opentrons/nest_96_wellplate_2ml_deep/2"
        }
      }
    }
  },
  "robot": {
    "model": "OT-3 Standard",
    "deckId": "ot3_standard"
  }
}
```

## Case 11: Load Absorbance Plate Reader module (Flex only)

### Input

```text
Metadata:
- protocol name: Load absorbance plate reader
- description: Load absorbance plate reader

Robot:
- Flex

Pipette mount:
- left: p50_single_flex

Gripper:
- mounted

Module:
- absorbanceReaderV1

Fixture:
- Trashbin

Labware:
- opentrons_flex_96_filtertiprack_50ul in C2
```

### Output

```json
{
  "metadata": {
    "protocolName": "Load absorbance plate reader",
    "description": "Load absorbance plate reader"
  },
  "designerApplication": {
    "data": {
      "_internalAppBuildDate": "Mon, 05 May 2025 20:38:07 GMT",
      "pipetteTiprackAssignments": {
        "pipette_left": ["opentrons/opentrons_flex_96_filtertiprack_50ul/1"]
      },
      "ingredients": {},
      "ingredLocations": {},
      "savedStepForms": {
        "__INITIAL_DECK_SETUP_STEP__": {
          "labwareLocationUpdate": {
            "labware-1": "C2"
          },
          "pipetteLocationUpdate": {
            "pipette_left": "left"
          },
          "moduleLocationUpdate": {
            "apr-1": "B3"
          },
          "trashBinLocationUpdate": {
            "trashbin-1": "cutoutA3"
          },
          "wasteChuteLocationUpdate": {},
          "stagingAreaLocationUpdate": {},
          "gripperLocationUpdate": {
            "gripper-1": "mounted"
          }
        }
      },
      "orderedStepIds": [],
      "pipettes": {
        "pipette_left": {
          "pipetteName": "p50_single_flex"
        }
      },
      "modules": {
        "apr-1": {
          "model": "absorbanceReaderV1"
        }
      },
      "labware": {
        "labware-1": {
          "displayName": "Opentrons Flex 96 Filter Tip Rack 50 µL",
          "labwareDefURI": "opentrons/opentrons_flex_96_filtertiprack_50ul/1"
        }
      }
    }
  },
  "robot": {
    "model": "OT-3 Standard",
    "deckId": "ot3_standard"
  }
}
```

## Case 12: Load `Magnetic Block` Module (Flex only)

### Input

```text
Metadata:
  - protocolName: Load Magnetic Block module
  - description": Load Magnetic Block module and plate

Robot: Flex

Pipette mount:
- Left: p1000_multi_flex

Gripper: No

Module:
- magneticBlockV1

Fixture:
- Trashbin

Labware:
- opentrons_flex_96_tiprack_50ul in D1
- nest_96_wellplate_100ul_pcr_full_skirt on magnetic block
```

**Special notes**
This Magnetic Block allows the following plates

- NEST 96 Well Plate 100 µL PCR Full Skirt
- NEST 96 Deep Well Plate 2mL
- Opentrons Tough 96 Well Plate 200 µL PCR Full Skirt

### Output

```json
{
  "metadata": {
    "protocolName": "Load Magnetic Block module",
    "description": "Load Magnetic Block module and plate"
  },
  "designerApplication": {
    "data": {
      "pipetteTiprackAssignments": {
        "pipette_left": ["opentrons/opentrons_flex_96_tiprack_50ul/1"]
      },
      "ingredients": {},
      "ingredLocations": {},
      "savedStepForms": {
        "__INITIAL_DECK_SETUP_STEP__": {
          "labwareLocationUpdate": {
            "labware-1": "D1",
            "labware-2": "magnetic-block-1"
          },
          "pipetteLocationUpdate": {
            "pipette_left": "left"
          },
          "moduleLocationUpdate": {
            "magnetic-block-1": "D2"
          },
          "trashBinLocationUpdate": {
            "trashbin-1": "cutoutA3"
          },
          "wasteChuteLocationUpdate": {},
          "stagingAreaLocationUpdate": {},
          "gripperLocationUpdate": {}
        }
      },
      "orderedStepIds": [],
      "pipettes": {
        "pipette_left": {
          "pipetteName": "p1000_multi_flex"
        }
      },
      "modules": {
        "magnetic-block-1": {
          "model": "magneticBlockV1"
        }
      },
      "labware": {
        "labware-1": {
          "displayName": "Opentrons Flex 96 Tip Rack 50 µL",
          "labwareDefURI": "opentrons/opentrons_flex_96_tiprack_50ul/1"
        },
        "labware-2": {
          "displayName": "NEST 96 Well Plate 100 µL PCR Full Skirt",
          "labwareDefURI": "opentrons/nest_96_wellplate_100ul_pcr_full_skirt/2"
        }
      }
    }
  },
  "robot": {
    "model": "OT-3 Standard",
    "deckId": "ot3_standard"
  }
}
```

## Case 13: Load Magnetic Module module (OT-2 only)

### Input

```text
Metadata:
  - protocolName: Load Magnetic Module
  - description": Load Magnetic Module

Robot: OT-2

Pipette mount:
- Left: p300_multi_gen2

Module:
- magneticModuleV2


Labware:
- opentrons_96_tiprack_300ul
```

### Output

```json
{
  "metadata": {
    "protocolName": "Load Magnetic Module",
    "description": "Load Magnetic Module"
  },
  "designerApplication": {
    "data": {
      "pipetteTiprackAssignments": {
        "pipette_left": ["opentrons/opentrons_96_tiprack_300ul/1"]
      },
      "ingredients": {},
      "ingredLocations": {},
      "savedStepForms": {
        "__INITIAL_DECK_SETUP_STEP__": {
          "labwareLocationUpdate": {
            "labware-1": "2"
          },
          "pipetteLocationUpdate": {
            "pipette_left": "left"
          },
          "moduleLocationUpdate": {
            "magentic-module-1": "1"
          },
          "trashBinLocationUpdate": {
            "trashbin-1": "cutout12"
          },
          "wasteChuteLocationUpdate": {},
          "stagingAreaLocationUpdate": {},
          "gripperLocationUpdate": {}
        }
      },
      "orderedStepIds": [],
      "pipettes": {
        "pipette_left": {
          "pipetteName": "p300_multi_gen2"
        }
      },
      "modules": {
        "magentic-module-1": {
          "model": "magneticModuleV2"
        }
      },
      "labware": {
        "labware-1": {
          "displayName": "Opentrons OT-2 96 Tip Rack 300 µL",
          "labwareDefURI": "opentrons/opentrons_96_tiprack_300ul/1"
        }
      }
    }
  },
  "robot": {
    "model": "OT-2 Standard",
    "deckId": "ot2_standard"
  }
}
```

## Case 14: Steptype: Heater-Shaker, close heater-shaker latch

heaterShaker has the following fields:

```json
{
  "id": "string", // Required - unique ID for this step
  "stepType": "heaterShaker", // Required
  "stepName": "string", // Optional - display name for this step
  "stepDetails": "string", // Optional - description/notes
  // TIMER
  "heaterShakerSetTimer": boolean | null, // Whether to use a timer
  "heaterShakerTimer": "string" | null, // Time in seconds or minutes format
  // LATCH CONTROL
  "latchOpen": boolean // Whether the latch should be open (can't be open while shaking)
  // MODULE CONTROL
  "moduleId": "string", // Required - ID of the heater-shaker module, e.g., hs-1
  // SHAKE CONTROL
  "setHeaterShakerTemperature": boolean, // Whether to set temperature
  "setShake": boolean, // Whether to shake
  // TEMPERATURE CONTROL
  "targetHeaterShakerTemperature": "number-as-string" | null, // Temperature in °C (20-95°C)
  "targetSpeed": "number-as-string" | null, // RPM for shaking (200-3000 RPM)
}
```

Additonal notes:

- Temperature range: 20-95°C
- Speed range: 200-3000 RPM
- The latch cannot be open while shaking
- Timer can be set to control duration of shaking/heating

### Input

```text
- ProtocolName: Heater-Shaker module
- Description: Close the latch of Heater-Shaker module

Robot:
- Flex

Module:
- heaterShakerModuleV1

Pipette Mount:
- Left mount: Flex 1-Channel 50 µL (p50_single_flex)

Steps:
1. Close Heater-Shaker latch.
```

### Output

```json
{
  "metadata": {
    "protocolName": "Heater-Shaker module",
    "description": "Close the latch of Heater-Shaker module"
  },
  "designerApplication": {
    "data": {
      "pipetteTiprackAssignments": {
        "pipette_left": ["opentrons/opentrons_flex_96_filtertiprack_50ul/1"]
      },
      "ingredients": {},
      "ingredLocations": {},
      "savedStepForms": {
        "__INITIAL_DECK_SETUP_STEP__": {
          "labwareLocationUpdate": {
            "labware-1": "C2"
          },
          "pipetteLocationUpdate": {
            "pipette_left": "left"
          },
          "moduleLocationUpdate": {
            "hs-1": "D1"
          },
          "trashBinLocationUpdate": {
            "trashbin-1": "cutoutA3"
          },
          "wasteChuteLocationUpdate": {},
          "stagingAreaLocationUpdate": {},
          "gripperLocationUpdate": {}
        },
        "step-1": {
          "id": "step-1",
          "stepType": "heaterShaker",
          "stepName": "heater-shaker",
          "stepDetails": "",
          "heaterShakerSetTimer": null,
          "heaterShakerTimer": null,
          "latchOpen": false,
          "moduleId": "hs-1",
          "setHeaterShakerTemperature": null,
          "setShake": null,
          "targetHeaterShakerTemperature": null,
          "targetSpeed": null
        }
      },
      "orderedStepIds": ["step-1"],
      "pipettes": {
        "pipette_left": {
          "pipetteName": "p50_single_flex"
        }
      },
      "modules": {
        "hs-1": {
          "model": "heaterShakerModuleV1"
        }
      },
      "labware": {
        "labware-1": {
          "displayName": "Opentrons Flex 96 Filter Tip Rack 50 µL",
          "labwareDefURI": "opentrons/opentrons_flex_96_filtertiprack_50ul/1"
        }
      }
    }
  },
  "robot": {
    "model": "OT-3 Standard",
    "deckId": "ot3_standard"
  }
}
```

Example, lets shake for 2 mins and speed of 500rpm:

```json
"step-1": {
  "id": "step-1",
  "stepType": "heaterShaker",
  "stepName": "heater-shaker",
  "stepDetails": "",
  "heaterShakerSetTimer": true,
  "heaterShakerTimer": "02:00",
  "latchOpen": false,
  "moduleId": "hs-1",
  "setHeaterShakerTemperature": null,
  "setShake": true,
  "targetHeaterShakerTemperature": null,
  "targetSpeed": "500"
}
```

## Case 15: Steptype: Temperature step

temperature has the following step:

```json
{
  "id": "string", // Required - unique ID for this step
  "stepType": "temperature", // Required
  "stepName": "string", // Optional - display name for this step
  "stepDetails": "string", // Optional - description/notes

  // MODULE CONTROL
  "moduleId": "string", // Required - ID of the temperature module to control
  "setTemperature": "true" | "false", // Required - whether to change temperature
  "targetTemperature": "number-as-string" | null // Required if setTemperature is "true" - temperature in °C (4-95°C)
}
```

Additonal notes:

- Temperature range: 4-95°C
- Setting temperature to `null` or `false` will deactivate the module

### Input

```text
Metadata:
- ProtocolName: Load temperature step
- Description: Add a temperature step, by default it is deactivated

Robot:
- Flex

Module:
- Temperature module

Labware:
- tip rack

Pipette mount:
- Left mount: multi-channel

Steps:
1. Add temperature step
```

### Output

```json
{
  "metadata": {
    "protocolName": "Load temperature step",
    "description": "Add a temperature step, by default it is deactivated"
  },
  "designerApplication": {
    "data": {
      "pipetteTiprackAssignments": {
        "pipette_left": ["opentrons/opentrons_flex_96_tiprack_50ul/1"]
      },
      "ingredients": {},
      "ingredLocations": {},
      "savedStepForms": {
        "__INITIAL_DECK_SETUP_STEP__": {
          "labwareLocationUpdate": {
            "labware-1": "C2"
          },
          "pipetteLocationUpdate": {
            "pipette_left": "left"
          },
          "moduleLocationUpdate": {
            "t-1": "C1"
          },
          "trashBinLocationUpdate": {
            "trashbin-1": "cutoutA3"
          },
          "wasteChuteLocationUpdate": {},
          "stagingAreaLocationUpdate": {},
          "gripperLocationUpdate": {}
        },
        "step-1": {
          "id": "step-1",
          "stepType": "temperature",
          "stepName": "temperature",
          "stepDetails": "",
          "moduleId": "t-1",
          "setTemperature": null,
          "targetTemperature": null
        }
      },
      "orderedStepIds": ["step-1"],
      "pipettes": {
        "pipette_left": {
          "pipetteName": "p50_multi_flex"
        }
      },
      "modules": {
        "t-1": {
          "model": "temperatureModuleV2"
        }
      },
      "labware": {
        "labware-1": {
          "displayName": "Opentrons Flex 96 Tip Rack 50 µL",
          "labwareDefURI": "opentrons/opentrons_flex_96_tiprack_50ul/1"
        }
      }
    }
  },
  "robot": {
    "model": "OT-3 Standard",
    "deckId": "ot3_standard"
  }
}
```

Using different parameters
Input:

```text
Robot
- Flex

Steps:
1. Add temperature step: set temperature 50C
2. Deactivate temperature
```

Output (other parts are cut for brevity):

```json
"step-1": {
  "moduleId": "t-1",
  "setTemperature": "true",
  "targetTemperature": "50",
  "id": "step-1",
  "stepType": "temperature",
  "stepName": "temperature",
  "stepDetails": "Set temperature to 50C"
},
"step-2": {
  "moduleId": "t-1",
  "setTemperature": "false",
  "targetTemperature": null,
  "id": "step-2",
  "stepType": "temperature",
  "stepName": "temperature",
  "stepDetails": "Deactivate temperature"
}
```

## Case 16: Steptype: Thermocycler step

thermocycler step has the following parameters:

```json
{
  "id": "string", // Required - unique ID for this step
  "stepType": "thermocycler", // Required
  "stepName": "string", // Optional - display name for this step
  "stepDetails": "string", // Optional - description/notes

  // Required - determines the type of thermocycler step
  "thermocyclerFormType": "thermocyclerState" | "thermocyclerProfile",

  // MODULE ID - Required
  "moduleId": "string", // ID of the thermocycler module to control

  // For thermocyclerState type:
  "blockIsActive": boolean, // Whether the block temperature control is active
  "blockTargetTemp": number | null, // Temperature for the block in °C (4-99°C)
  "lidIsActive": boolean, // Whether the lid temperature control is active
  "lidTargetTemp": number | null, // Temperature for the lid in °C (37-110°C)
  "lidOpen": boolean, // Whether the lid should be open

  // For thermocyclerProfile type:
  "blockIsActiveHold": boolean, // Whether block temperature should be active after profile
  "blockTargetTempHold": number | null, // Temperature to hold block at after profile (4-99°C)
  "lidIsActiveHold": boolean, // Whether lid temperature should be active after profile
  "lidTargetTempHold": number | null, // Temperature to hold lid at after profile (37-110°C)
  "lidOpenHold": boolean, // Whether lid should be open after profile
  "profileTargetLidTemp": number, // Temperature for lid during profile run (37-110°C)
  "profileVolume": number, // Sample volume in µL (0-100µL)

  // Profile items for thermocyclerProfile type:
  "orderedProfileItems": ["string-id1", "string-id2"], // Array of profile item IDs in sequence
  "profileItemsById": {
    "string-id1": {
      // For a single temperature step:
      "type": "profileStep",
      "id": "string-id1",
      "title": "string", // Name of this step
      "temperature": "number-as-string", // Temperature in °C (4-99°C)
      "durationMinutes": "string", // Minutes to hold (e.g. "2")
      "durationSeconds": "string" // Seconds to hold (e.g. "30")
    },
    "string-id2": {
      // For a cycling group (repeated steps):
      "type": "profileCycle",
      "id": "string-id2",
      "repetitions": "string", // Number of times to repeat the cycle (e.g. "30")
      "steps": [
        {
          "type": "profileStep",
          "id": "unique-id-3",
          "title": "string",
          "temperature": "number-as-string", // Temperature in °C (4-99°C)
          "durationMinutes": "string",
          "durationSeconds": "string"
        }
        // Additional steps in the cycle...
      ]
    }
  }
}
```

Additonal notes:

- Temperature ranges: Block: 4-99°C, Lid: 37-110°C
- The profile can include both individual steps and cycles with multiple repeating steps
- Sample volume cannot exceed 100µL

### Input

```text
Metadata:
- ProtocolName: PCR
- Description: PCR

Robot:
- Flex

Modules:
- Thermocycler module

Labware:
- Opentrons Tough 96 Well Plate 200 uL PCR Full Skirt, placed on thermocycler
- Tip rack

Pipette mount:
- Left mount: single channel

Steps:
1. Add thermocycler step with the following params:
  - Set block temperature to 8C.
  - Set lid temperature to 90C.
  - Open the lid.
```

### Output

```json
{
  "metadata": {
    "protocolName": "PCR",
    "description": "PCR"
  },
  "designerApplication": {
    "data": {
      "pipetteTiprackAssignments": {
        "pipette_left": ["opentrons/opentrons_flex_96_filtertiprack_200ul/1"]
      },
      "ingredients": {},
      "ingredLocations": {},
      "savedStepForms": {
        "__INITIAL_DECK_SETUP_STEP__": {
          "labwareLocationUpdate": {
            "labware-1": "C2",
            "labware-2": "tc-1"
          },
          "pipetteLocationUpdate": {
            "pipette_left": "left"
          },
          "moduleLocationUpdate": {
            "tc-1": "B1"
          },
          "trashBinLocationUpdate": {
            "trashbin-1": "cutoutA3"
          },
          "wasteChuteLocationUpdate": {},
          "stagingAreaLocationUpdate": {},
          "gripperLocationUpdate": {}
        },
        "step-1": {
          "id": "step-1",
          "stepType": "thermocycler",
          "stepName": "thermocycler",
          "stepDetails": "",
          "blockIsActive": true,
          "blockIsActiveHold": false,
          "blockTargetTemp": "8",
          "blockTargetTempHold": null,
          "lidIsActive": true,
          "lidIsActiveHold": false,
          "lidOpen": true,
          "lidOpenHold": null,
          "lidTargetTemp": "90",
          "lidTargetTempHold": null,
          "moduleId": "tc-1",
          "orderedProfileItems": [],
          "profileItemsById": {},
          "profileTargetLidTemp": null,
          "profileVolume": null,
          "thermocyclerFormType": "thermocyclerState"
        }
      },
      "orderedStepIds": ["step-1"],
      "pipettes": {
        "pipette_left": {
          "pipetteName": "p1000_single_flex"
        }
      },
      "modules": {
        "tc-1": {
          "model": "thermocyclerModuleV2"
        }
      },
      "labware": {
        "labware-1": {
          "displayName": "Opentrons Flex 96 Filter Tip Rack 200 µL",
          "labwareDefURI": "opentrons/opentrons_flex_96_filtertiprack_200ul/1"
        },
        "labware-2": {
          "displayName": "Opentrons Tough 96 Well Plate 200 µL PCR Full Skirt",
          "labwareDefURI": "opentrons/opentrons_96_wellplate_200ul_pcr_full_skirt/2"
        }
      }
    }
  },
  "robot": {
    "model": "OT-3 Standard",
    "deckId": "ot3_standard"
  }
}
```

For example, Thermocycler step with profile settings:

```text
Robot
- Flex

Steps:
1. Thermocycler step:
   - Close thermocycler lid and run the following profile:
     1) 72C for 57 seconds for 1 cycle, block max volume is 25ul.
     2) 75C for 9 seconds, 84C for 10 seconds, 65C for 43 seconds for 12 cycles, block max volume is 25ul.
     3) 62 C for 180 seconds for 1 cycle, block max volume is 25ul.
   - Hold block temperature at 4C and open lid.
```

Step would be something like below:

```json
"step-1": {
  "id": "step-1",
  "stepType": "thermocycler",
  "stepName": "thermocycler",
  "stepDetails": "",
  "blockIsActive": false,
  "blockIsActiveHold": true,
  "blockTargetTemp": null,
  "blockTargetTempHold": "4",
  "lidIsActive": false,
  "lidIsActiveHold": false,
  "lidOpen": false,
  "lidOpenHold": true,
  "lidTargetTemp": null,
  "lidTargetTempHold": null,
  "moduleId": "tc-1",
  "orderedProfileItems": [
    "cycle-1",
    "cycle-2",
    "cycle-3"
  ],
  "profileItemsById": {
    "cycle-1": {
      "id": "cycle-1",
      "title": "",
      "steps": [
        {
          "durationMinutes": "00",
          "durationSeconds": "57",
          "id": "ca370c2f-649d-49ab-a59a-401882b33393",
          "temperature": "72",
          "title": "1",
          "type": "profileStep"
        }
      ],
      "type": "profileCycle",
      "repetitions": "1"
    },
    "cycle-2": {
      "id": "cycle-2",
      "title": "",
      "steps": [
        {
          "durationMinutes": "00",
          "durationSeconds": "09",
          "id": "8dc7d7a6-e4c7-4836-866d-f819ed7e3949",
          "temperature": "75",
          "title": "1",
          "type": "profileStep"
        },
        {
          "durationMinutes": "00",
          "durationSeconds": "10",
          "id": "7e9d4a97-434d-4be5-ac9a-c98da3983544",
          "temperature": "84",
          "title": "2",
          "type": "profileStep"
        },
        {
          "durationMinutes": "00",
          "durationSeconds": "43",
          "id": "6466314f-d552-48a1-a241-00f59cc201c2",
          "temperature": "65",
          "title": "3",
          "type": "profileStep"
        }
      ],
      "type": "profileCycle",
      "repetitions": "12"
    },
    "cycle-3": {
      "id": "cycle-3",
      "title": "",
      "steps": [
        {
          "durationMinutes": "03",
          "durationSeconds": "00",
          "id": "21311fe3-c59a-4920-bac3-7c6ca5ae23b9",
          "temperature": "62",
          "title": "1",
          "type": "profileStep"
        }
      ],
      "type": "profileCycle",
      "repetitions": "1"
    }
  },
  "profileTargetLidTemp": "90",
  "profileVolume": "25",
  "thermocyclerFormType": "thermocyclerProfile"
}
```

## Case 17: Steptype: absorbanceReader

Absorbance Plate Reader has the following parameters:

```json
{
  // Required fields
  "id": "unique-uuid-string", // Auto-generated UUID
  "stepType": "absorbanceReader", // Fixed value
  "stepName": "absorbance plate reader", // User-defined name
  "stepDetails": "", // Optional description/notes

  // Form type - determines what type of absorbance reader step this is
  "absorbanceReaderFormType": "absorbanceReaderInitialize", // Options: "absorbanceReaderInitialize", "absorbanceReaderRead", "absorbanceReaderLid"

  // Fields for absorbanceReaderInitialize:
  "mode": "single", // Options: "single" or "multi"
  "moduleId": "module-id-string", // ID of the absorbance reader module
  "wavelengths": ["450"], // Array of wavelength values
  // Common supported wavelengths: 450 (blue), 562 (green), 600 (orange), 650 (red)
  // Range: 350-1000 nm
  // For "single" mode: must contain exactly 1 wavelength
  // For "multi" mode: can contain 1-6 wavelengths

  "referenceWavelength": "562", // Optional, only used in "single" mode
  "referenceWavelengthActive": false, // Boolean to enable/disable reference wavelength

  // Fields for absorbanceReaderRead:
  "fileName": null, // Optional file name where results will be saved

  // Fields for absorbanceReaderLid:
  "lidOpen": null // true for opening the lid, false for closing the lid
}
```

Note that for absorbance plate reader, gripper is always ussed.

with `mode='single'`

```json
{
  "metadata": {
    "protocolName": "absorbanceReader",
    "description": "absorbance plate reader"
  },
  "designerApplication": {
    "data": {
      "pipetteTiprackAssignments": {
        "pipette_left": ["opentrons/opentrons_flex_96_filtertiprack_50ul/1"]
      },
      "ingredients": {},
      "ingredLocations": {},
      "savedStepForms": {
        "__INITIAL_DECK_SETUP_STEP__": {
          "labwareLocationUpdate": {
            "labware-1": "C2"
          },
          "pipetteLocationUpdate": {
            "pipette_left": "left"
          },
          "moduleLocationUpdate": {
            "apr-1": "B3"
          },
          "trashBinLocationUpdate": {
            "trashbin-1": "cutoutA3"
          },
          "wasteChuteLocationUpdate": {},
          "stagingAreaLocationUpdate": {},
          "gripperLocationUpdate": {
            "gripper-1": "mounted"
          }
        },
        "step-1": {
          "id": "step-1",
          "stepType": "absorbanceReader",
          "stepName": "absorbance plate reader",
          "stepDetails": "",
          "absorbanceReaderFormType": "absorbanceReaderInitialize",
          "fileName": null,
          "lidOpen": null,
          "mode": "single",
          "moduleId": "apr-1",
          "referenceWavelength": null,
          "referenceWavelengthActive": false,
          "wavelengths": ["450"]
        }
      },
      "orderedStepIds": ["step-1"],
      "pipettes": {
        "pipette_left": {
          "pipetteName": "p50_multi_flex"
        }
      },
      "modules": {
        "apr-1": {
          "model": "absorbanceReaderV1"
        }
      },
      "labware": {
        "labware-1": {
          "displayName": "Opentrons Flex 96 Filter Tip Rack 50 µL",
          "labwareDefURI": "opentrons/opentrons_flex_96_filtertiprack_50ul/1"
        }
      }
    }
  },
  "robot": {
    "model": "OT-3 Standard",
    "deckId": "ot3_standard"
  }
}
```

with `mode="multi"`

```json
{
  "id": "09fe8cd1-fff4-4c04-bc11-5cd318cba830",
  "stepType": "absorbanceReader",
  "stepName": "absorbance plate reader",
  "stepDetails": "",
  "absorbanceReaderFormType": "absorbanceReaderInitialize",
  "fileName": null,
  "lidOpen": null,
  "mode": "multi",
  "moduleId": "apr-1",
  "referenceWavelength": "562",
  "referenceWavelengthActive": true,
  "wavelengths": ["450", "562", "600"]
}
```

## Case 18: Steptype: mix step

`mix` step accepts the following parameters:

```json
{
  "id": "string", // Required - unique ID for this step
  "stepType": "mix", // Required
  "stepName": "string", // Optional - display name for this step
  "stepDetails": "string", // Optional - description/notes

  // LABWARE & PIPETTE SELECTION
  "labware": "LabwareEntity", // Required - the labware containing wells to mix in
  "pipette": "PipetteEntity", // Required - the pipette to use for mixing
  "tipRack": "string", // Required - ID of the tip rack to use
  "nozzles": "NozzleConfigurationStyle" | null, // Optional - setting for 96-channel pipette configuration

  // WELLS SELECTION & ORDER
  "wells": ["A1", "B1", ...], // Required - wells to mix in
  "mix_wellOrder_first": "t2b" | "b2t" | "l2r" | "r2l", // Required - primary well traversal direction
  "mix_wellOrder_second": "t2b" | "b2t" | "l2r" | "r2l", // Required - secondary well traversal direction

  // MIXING PARAMETERS
  "volume": number, // Required - volume to aspirate and dispense during each mix (must not exceed pipette/tip capacity)
  "times": number | null, // Optional - number of times to mix (1-999)

  // TIP HANDLING
  "changeTip": "always" | "once" | "never" | "perSource" | "perDest", // Required - when to use a new tip
  "dropTip_location": "string", // Required - location to drop the tip (often "trashId")

  // POSITIONING
  "mix_mmFromBottom": number | null, // Optional - distance from well bottom in mm (default: 0.5)
  "mix_x_position": number | null, // Optional - x position offset
  "mix_y_position": number | null, // Optional - y position offset

  // TOUCH TIP
  "mix_touchTip_checkbox": boolean, // Whether to touch tip after mixing
  "mix_touchTip_mmFromBottom": number | null, // Optional - distance from well bottom in mm for touch tip

  // FLOW RATES
  "aspirate_flowRate": number | null, // Optional - flow rate for aspiration in µL/sec
  "dispense_flowRate": number | null, // Optional - flow rate for dispensing in µL/sec

  // DELAYS
  "aspirate_delay_checkbox": boolean, // Whether to add delay after aspiration
  "aspirate_delay_seconds": number | null, // Optional - seconds to delay after aspiration
  "dispense_delay_checkbox": boolean, // Whether to add delay after dispensing
  "dispense_delay_seconds": number | null, // Optional - seconds to delay after dispensing

  // BLOWOUT
  "blowout_checkbox": boolean, // Whether to perform blowout
  "blowout_location": string | null, // Optional - location for blowout
  "blowout_flowRate": number | null, // Optional - flow rate for blowout in µL/sec
  "blowout_z_offset": number | null // Optional - z offset for blowout
}
```

Additional notes:

1. The mix step performs repeated aspiration and dispensing in the selected wells to mix their contents
2. `well_order` options:
   - `t2b`: Top to bottom (A1, B1, C1...)
   - `b2t`: Bottom to top (H1, G1, F1...)
   - `l2r`: Left to right (A1, A2, A3...)
   - `r2l`: Right to left (A12, A11, A10...)
3. The `volume` value must not exceed the capacity of the selected pipette or tip
4. The `times` value ranges from 1-999 and determines how many cycles of aspiration and dispensing occur
5. Tips are handled according to the `changeTip` setting, with several options:
   - `always`: New tip for each well
   - `once`: Single tip for the entire step
   - `never`: Reuse tip from previous step
   - `perSource`/`perDest`: Change tips based on source/destination patterns
6. Mixing can be enhanced with touch tip, which touches the tip to the sides of the well after mixing
7. Flow rates can be customized for aspiration and dispensing
8. Optional delays can be added after aspiration or dispensing for certain liquids that benefit from settling time
9. Blowout is an optional step to expel any remaining liquid after the final dispense

### Input

```text
Metadata:
- ProtocolName: `mix` step example
- Description: This protocol shows an example of mix step.

Robot:
- Flex

Pipette Mount:
- Left Mount: Flex 1-Channel 1000 µL

Labware:
- corning_96_wellplate_360ul_flat
- opentrons_flex_96_filtertiprack_1000ul

Steps:
1. Mix 30uL five times in the first five wells from the first column of the well plate.
```

### Output

```json
{
  "metadata": {
    "protocolName": "Step mix example",
    "description": "This protocol shows an example of mix step."
  },
  "designerApplication": {
    "data": {
      "pipetteTiprackAssignments": {
        "pipette_left": ["opentrons/opentrons_flex_96_filtertiprack_1000ul/1"]
      },
      "ingredients": {},
      "ingredLocations": {},
      "savedStepForms": {
        "__INITIAL_DECK_SETUP_STEP__": {
          "labwareLocationUpdate": {
            "labware-1": "B1",
            "labware-2": "C2"
          },
          "pipetteLocationUpdate": {
            "pipette_left": "left"
          },
          "moduleLocationUpdate": {},
          "trashBinLocationUpdate": {
            "trashbin-1": "cutoutA3"
          },
          "wasteChuteLocationUpdate": {},
          "stagingAreaLocationUpdate": {},
          "gripperLocationUpdate": {}
        },
        "step-1": {
          "id": "step-1",
          "stepType": "mix",
          "stepName": "mix",
          "stepDetails": "",
          "aspirate_delay_checkbox": false,
          "aspirate_delay_seconds": "1",
          "aspirate_flowRate": "716",
          "blowout_checkbox": false,
          "blowout_flowRate": null,
          "blowout_location": null,
          "blowout_z_offset": 0,
          "changeTip": "always",
          "dispense_delay_checkbox": false,
          "dispense_delay_seconds": "1",
          "dispense_flowRate": "716",
          "dropTip_location": "trashbin-1",
          "labware": "labware-1",
          "mix_mmFromBottom": 1,
          "mix_touchTip_checkbox": false,
          "mix_touchTip_mmFromBottom": null,
          "mix_wellOrder_first": "t2b",
          "mix_wellOrder_second": "l2r",
          "mix_x_position": 0,
          "mix_y_position": 0,
          "nozzles": null,
          "pipette": "pipette_left",
          "times": "5",
          "tipRack": "opentrons/opentrons_flex_96_filtertiprack_1000ul/1",
          "volume": "30",
          "wells": ["A1", "B1", "C1", "D1", "E1"]
        }
      },
      "orderedStepIds": ["step-1"],
      "pipettes": {
        "pipette_left": {
          "pipetteName": "p1000_single_flex"
        }
      },
      "modules": {},
      "labware": {
        "labware-1": {
          "displayName": "Corning 96 Well Plate 360 µL Flat",
          "labwareDefURI": "opentrons/corning_96_wellplate_360ul_flat/2"
        },
        "labware-2": {
          "displayName": "Opentrons Flex 96 Filter Tip Rack 1000 µL",
          "labwareDefURI": "opentrons/opentrons_flex_96_filtertiprack_1000ul/1"
        }
      }
    }
  },
  "robot": {
    "model": "OT-3 Standard",
    "deckId": "ot3_standard"
  }
}
```

### Remarks

For `changeTip`, `always` is the default.

## Case 19: Steptype: moveLabware (move)

`moveLabware` step takes the following parameters:

```json
{
  "id": "string", // Required - unique ID for this step
  "stepType": "moveLabware", // Required
  "stepName": "string", // Optional - display name for this step
  "stepDetails": "string", // Optional - description/notes

  // LABWARE SELECTION
  "labware": "LabwareEntity", // Required - the labware to be moved

  // MOVEMENT STRATEGY
  "useGripper": boolean, // Whether to use the gripper to move the labware (Flex robot only)
  // If false, protocol will pause for manual movement

  // DESTINATION LOCATION
  "newLocation": "string" // eg., 'D1'
}
```

Additional notes:

1. Movement strategies:
   - `useGripper: true` - Uses the Flex robot's gripper to automatically move the labware (only available on Flex)
   - `useGripper: false` - Protocol pauses for manual movement by the user
2. When using the gripper on the Flex platform, only specific labware types are fully supported:
   - Full-skirt PCR plates
   - NEST well plates
   - Opentrons Flex 96 Tip Racks
3. When moving labware manually, any standard or custom labware can be moved
4. No need to add a separate pause command - when `useGripper` is false, the protocol automatically pauses at this step

Note that you cannot move labware to the trashbin.

### Input

```text
Robot:
- Flex

Labware:
- opentrons_flex_96_filtertiprack_50ul in C2

Pipette Mount:
- Left: p1000_single_flex

Steps:
1. Move the tip rack to slot A1
```

### Output

```json
{
  "metadata": {
    "protocolName": "move step example",
    "description": "move step example"
  },
  "designerApplication": {
    "data": {
      "pipetteTiprackAssignments": {
        "pipette_left": ["opentrons/opentrons_flex_96_filtertiprack_50ul/1"]
      },
      "ingredients": {},
      "ingredLocations": {},
      "savedStepForms": {
        "__INITIAL_DECK_SETUP_STEP__": {
          "labwareLocationUpdate": {
            "labware-1": "C2"
          },
          "pipetteLocationUpdate": {
            "pipette_left": "left"
          },
          "moduleLocationUpdate": {},
          "trashBinLocationUpdate": {
            "trashbin-1": "cutoutA3"
          },
          "wasteChuteLocationUpdate": {},
          "stagingAreaLocationUpdate": {},
          "gripperLocationUpdate": {
            "gripper-1": "mounted"
          }
        },
        "step-1": {
          "id": "step-1",
          "stepType": "moveLabware",
          "stepName": "move",
          "stepDetails": "",
          "labware": "labware-1",
          "newLocation": "A1",
          "useGripper": true
        }
      },
      "orderedStepIds": ["step-1"],
      "pipettes": {
        "pipette_left": {
          "pipetteName": "p50_multi_flex"
        }
      },
      "modules": {},
      "labware": {
        "labware-1": {
          "displayName": "Opentrons Flex 96 Filter Tip Rack 50 µL",
          "labwareDefURI": "opentrons/opentrons_flex_96_filtertiprack_50ul/1"
        }
      }
    }
  },
  "robot": {
    "model": "OT-3 Standard",
    "deckId": "ot3_standard"
  }
}
```

## Case 20: Steptype: pause

`pause` step accepts the following parameters:

```json
{
  "id": "string", // Required - unique ID for this step
  "stepType": "pause", // Required
  "stepName": "string", // Optional - display name for this step
  "stepDetails": "string", // Optional - description/notes

  // PAUSE ACTION TYPE - Required
  "pauseAction": "untilResume" | "untilTime" | "untilTemperature",

  // PAUSE MESSAGE - Optional
  "pauseMessage": "string", // Message to show during pause

  // FOR TIME-BASED PAUSE (when pauseAction is "untilTime")
  "pauseTime": "string", // Format should be: "HH:MM:SS"
  // Examples: "00:01:30" (1 min 30 sec) or "01:30" (1 min 30 sec)

  // FOR TEMPERATURE-BASED PAUSE (when pauseAction is "untilTemperature")
  "moduleId": "string", // Required - ID of the temperature/thermocycler/heater-shaker module
  "pauseTemperature": "string" // Required - target temperature to wait for
}
```

Additional notes for pause step:

1. **Pause until told to resume (`untilResume`)**

   - Pauses protocol execution until the user manually resumes the protocol
   - Only requires an optional `pauseMessage` field
   - The protocol will stay paused until the user clicks the resume button in the Opentrons App or on the robot's touchscreen

2. **Delay for an amount of time (`untilTime`)**

   - Pauses protocol execution for a specified duration
   - Requires a `pauseTime` field in the format "HH:MM:SS"
   - The protocol will automatically resume after the specified time has elapsed
   - The time must be greater than 0 seconds total

3. **Pause until temperature reached (`untilTemperature`)**

   - Pauses protocol execution until a temperature module reaches a target temperature
   - Requires a `moduleId` field referencing a temperature module, thermocycler, or heater-shaker
   - Requires a `pauseTemperature` field with the target temperature
   - The protocol will automatically resume once the specified module reaches the target temperature
   - Temperature must be within the valid range for the selected module:
     - Temperature module: 4-95°C
     - Thermocycler block: 4-99°C
     - Heater-shaker: 37-95°C

The pause step is often used in protocols to:

- Allow users to perform manual interventions
- Wait for reactions to complete
- Allow temperature modules to reach target temperatures before proceeding
- Create a checkpoint where a user can verify protocol state before continuing

### Input

```text
Robot:
- Flex

Labware:
- opentrons_flex_96_filtertiprack_1000ul i

Pipette Mount:
- Left mount: p1000_multi_flex

Steps:
1. Pause 21 seconds
```

### Output

```json
{
  "metadata": {
    "protocolName": "pause step",
    "description": "steptype: pause"
  },
  "designerApplication": {
    "data": {
      "pipetteTiprackAssignments": {
        "pipette_left": ["opentrons/opentrons_flex_96_filtertiprack_1000ul/1"]
      },
      "ingredients": {},
      "ingredLocations": {},
      "savedStepForms": {
        "__INITIAL_DECK_SETUP_STEP__": {
          "labwareLocationUpdate": {
            "labware-1": "C2"
          },
          "pipetteLocationUpdate": {
            "pipette_left": "left"
          },
          "moduleLocationUpdate": {},
          "trashBinLocationUpdate": {
            "trashbin-1": "cutoutA3"
          },
          "wasteChuteLocationUpdate": {},
          "stagingAreaLocationUpdate": {},
          "gripperLocationUpdate": {}
        },
        "step-1": {
          "id": "step-1",
          "stepType": "pause",
          "stepName": "pause",
          "stepDetails": "",
          "moduleId": null,
          "pauseAction": "untilTime",
          "pauseMessage": "",
          "pauseTemperature": null,
          "pauseTime": "00:00:21"
        }
      },
      "orderedStepIds": ["step-1"],
      "pipettes": {
        "pipette_left": {
          "pipetteName": "p1000_multi_flex"
        }
      },
      "modules": {},
      "labware": {
        "labware-1": {
          "displayName": "Opentrons Flex 96 Filter Tip Rack 1000 µL",
          "labwareDefURI": "opentrons/opentrons_flex_96_filtertiprack_1000ul/1"
        }
      }
    }
  },
  "robot": {
    "model": "OT-3 Standard",
    "deckId": "ot3_standard"
  }
}
```

## Case 21: Steptype: moveLiquid (transfer)

`moveLiquid` step accepts the following parameters:

```json
{
  // GENERAL STEP INFORMATION
  "id": "string", // Required - Unique ID for this step. (System-generated, not directly set by user in UI form)
  "stepType": "moveLiquid", // Required - Type of the step. (Fixed for this form) UI: it is named "Transfer"
  "stepName": "string", // Optional - Display name for this step. UI: "Name" input field.
  "stepDetails": "string", // Optional - Description/notes for this step. UI: "Notes" text area.

  // PATH, PIPETTE, AND NOZZLE CONFIGURATION
  "path": "single" | "multiAspirate" | "multiDispense", // Required - Defines the aspiration/dispensing pattern. UI: "Path" or "Transfer Type" radio buttons/dropdown (e.g., "Single", "Consolidate (Multi-Aspirate)", "Distribute (Multi-Dispense)").
  "pipette": "PipetteEntity_ID", // Required - ID of the pipette to use. e.g., "pipette_left", "pipette_right"
  "tipRack": "string", // Required - ID or URI of the tip rack to use. UI: "Tip Rack" dropdown, often filtered by selected pipette. (e.g., "opentrons/opentrons_flex_96_tiprack_200ul/1")
  "nozzles": "NozzleConfigurationStyle" | null, // Optional - Setting for 96-channel pipette configuration. UI: "Nozzles" / "Active Nozzles" selection (e.g., "ALL" for full block, "COLUMN_1" for first column, or a specific pattern string like "A1_B1_C1"). Default is null if not a 96-channel or if full configuration is used.

  // VOLUME
  "volume": "number", // Required - Volume to transfer per operation (µL). Must not exceed pipette/tip capacity. UI: "Volume" number input.

  // SOURCE (ASPIRATE) PARAMETERS
  "aspirate_labware": "LabwareEntity_ID", // Required - ID of the labware to aspirate from - e.g., "labware-1". UI: "Source Labware" dropdown.
  "aspirate_wells": ["string"], // Required - Array of well names to aspirate from. UI: Well selection component (visual or list-based) for source labware. (e.g., ["A1", "B1"])
  "aspirate_wells_grouped": "boolean" | null, // Optional (becomes relevant for multi-channel pipettes) - If true, selected wells are treated as a group (e.g., a column for an 8-channel). If false or null, wells might be iterated individually by a single channel of a multi-channel pipette. UI: This might be implicit in the well selection mode or a specific checkbox like "Process wells as groups" or "Use all channels for selection".
  "aspirate_wellOrder_first": "t2b" | "b2t" | "l2r" | "r2l", // Required - Primary well traversal direction for aspiration. UI: "Well Order (Aspirate)" > "Primary Axis" dropdown.
  "aspirate_wellOrder_second": "t2b" | "b2t" | "l2r" | "r2l", // Required - Secondary well traversal direction for aspiration. UI: "Well Order (Aspirate)" > "Secondary Axis" dropdown.
  "aspirate_mmFromBottom": "number" | null, // Optional - Distance from well bottom for aspiration (mm). UI: "Aspirate Height" input field. (Default: e.g., 1 mm)
  "aspirate_x_position": "number" | null, // Optional - X-offset from the center of the well for aspiration (mm). UI: Advanced Settings > "X-Offset (Aspirate)" input. (Default: 0)
  "aspirate_y_position": "number" | null, // Optional - Y-offset from the center of the well for aspiration (mm). UI: Advanced Settings > "Y-Offset (Aspirate)" input. (Default: 0)

  "preWetTip": "boolean" | null, // Optional - Whether to pre-wet the tip before the first aspiration. UI: "Pre-wet tip" checkbox. (Default: false)

  "aspirate_mix_checkbox": "boolean", // Required - Whether to mix in the source well(s) before aspiration. UI: "Mix before aspirating" checkbox. (Default: false)
  "aspirate_mix_times": "number" | null, // Optional - Number of mix repetitions if aspirate_mix_checkbox is true. UI: "Repetitions" input under "Mix before aspirating". (e.g., 1-10)
  "aspirate_mix_volume": "number" | null, // Optional - Volume for each mix cycle if aspirate_mix_checkbox is true (µL). UI: "Mix Volume" input under "Mix before aspirating".

  "aspirate_airGap_checkbox": "boolean", // Required - Whether to aspirate an air gap after the liquid. UI: "Air Gap (Aspirate)" checkbox. (Default: false)
  "aspirate_airGap_volume": "number" | null, // Optional - Volume of the air gap if aspirate_airGap_checkbox is true (µL). UI: "Volume" input under "Air Gap (Aspirate)".

  "aspirate_touchTip_checkbox": "boolean", // Required - Whether to perform a touch tip after aspiration. UI: "Touch Tip (Aspirate)" checkbox. (Default: false)
  "aspirate_touchTip_mmFromBottom": "number" | null, // Optional - Distance from well bottom for touch tip if aspirate_touchTip_checkbox is true (mm). UI: "Height" input under "Touch Tip (Aspirate)".

  "aspirate_flowRate": "number" | null, // Optional - Flow rate for aspiration in µL/sec. UI: "Aspirate Flow Rate" input (often under "Advanced Settings"). (Default: pipette's default)

  "aspirate_delay_checkbox": "boolean", // Required - Whether to add a delay after aspiration. UI: "Delay (Aspirate)" checkbox. (Default: false)
  "aspirate_delay_seconds": "number" | null, // Optional - Duration of delay in seconds if aspirate_delay_checkbox is true. UI: "Time" input under "Delay (Aspirate)". (e.g., 0-60)
  "aspirate_delay_mmFromBottom": "number" | null, // Optional - Tip height from well bottom during delay, if aspirate_delay_checkbox is true (mm). UI: "Tip Height During Delay" input under "Delay (Aspirate)".

  // DESTINATION (DISPENSE) PARAMETERS
  "dispense_labware": "LabwareEntity_ID", // Required - ID of the labware or equipment (e.g., waste chute) to dispense into. UI: "Destination Labware" dropdown. (e.g., "labware-2", "labware-1")
  "dispense_wells": ["string"], // Required - Array of well names to dispense into. UI: Well selection component for destination labware. (e.g., ["H1", "G1"])
  "dispense_wellOrder_first": "t2b" | "b2t" | "l2r" | "r2l", // Required - Primary well traversal direction for dispensing. UI: "Well Order (Dispense)" > "Primary Axis" dropdown.
  "dispense_wellOrder_second": "t2b" | "b2t" | "l2r" | "r2l", // Required - Secondary well traversal direction for dispensing. UI: "Well Order (Dispense)" > "Secondary Axis" dropdown.
  "dispense_mmFromBottom": "number" | null, // Optional - Distance from well bottom for dispensing (mm). UI: "Dispense Height" input field. (Default: e.g., 1 mm or 0.5mm)
  "dispense_x_position": "number" | null, // Optional - X-offset from the center of the well for dispensing (mm). UI: Advanced Settings > "X-Offset (Dispense)" input. (Default: 0)
  "dispense_y_position": "number" | null, // Optional - Y-offset from the center of the well for dispensing (mm). UI: Advanced Settings > "Y-Offset (Dispense)" input. (Default: 0)

  "dispense_mix_checkbox": "boolean", // Required - Whether to mix in the destination well(s) after dispensing. UI: "Mix after dispensing" checkbox. (Default: false)
  "dispense_mix_times": "number" | null, // Optional - Number of mix repetitions if dispense_mix_checkbox is true. UI: "Repetitions" input under "Mix after dispensing". (e.g., 1-10)
  "dispense_mix_volume": "number" | null, // Optional - Volume for each mix cycle if dispense_mix_checkbox is true (µL). UI: "Mix Volume" input under "Mix after dispensing".

  "dispense_airGap_checkbox": "boolean", // Required - Whether to dispense the previously aspirated air gap. UI: "Dispense Air Gap" checkbox (often linked to aspirate air gap setting). (Default: false)
  "dispense_airGap_volume": "number" | null, // Optional - Volume of air gap to dispense (µL). Typically matches aspirate_airGap_volume. UI: Often read-only or linked if aspirate air gap is used.

  "dispense_touchTip_checkbox": "boolean", // Required - Whether to perform a touch tip after dispensing. UI: "Touch Tip (Dispense)" checkbox. (Default: false)
  "dispense_touchTip_mmFromBottom": "number" | null, // Optional - Distance from well bottom for touch tip if dispense_touchTip_checkbox is true (mm). UI: "Height" input under "Touch Tip (Dispense)".

  "dispense_flowRate": "number" | null, // Optional - Flow rate for dispensing in µL/sec. UI: "Dispense Flow Rate" input (often under "Advanced Settings"). (Default: pipette's default)

  "dispense_delay_checkbox": "boolean", // Required - Whether to add a delay after dispensing. UI: "Delay (Dispense)" checkbox. (Default: false)
  "dispense_delay_seconds": "number" | null, // Optional - Duration of delay in seconds if dispense_delay_checkbox is true. UI: "Time" input under "Delay (Dispense)". (e.g., 0-60)
  "dispense_delay_mmFromBottom": "number" | null, // Optional - Tip height from well bottom during delay, if dispense_delay_checkbox is true (mm). UI: "Tip Height During Delay" input under "Delay (Dispense)".

  // TIP HANDLING
  "changeTip": "always" | "once" | "never" | "perSource" | "perDest", // Required - When to use a new tip. UI: "Change Tip" dropdown.
  "dropTip_location": "string", // Required - ID of the location to drop the tip (e.g., "trashBinId", specific waste chute ID). UI: "Drop Tip In" dropdown.

  // BLOWOUT & DISPOSAL VOLUME (Primarily for ensuring full dispense or for multi-dispense accuracy)
  "blowout_checkbox": "boolean", // Required - Whether to perform a blowout after the final dispense in a series. UI: "Blow out" checkbox. (Default: false)
  "blowout_location": "string" | null, // Optional - ID of the labware/location for blowout if blowout_checkbox is true (e.g., "sourceWellId", "destWellId", "trashBinId"). UI: "Blow out into" dropdown.
  "blowout_flowRate": "number" | null, // Optional - Flow rate for blowout in µL/sec if blowout_checkbox is true. UI: "Flow Rate" input under "Blow out".
  "blowout_z_offset": "number" | null, // Optional - Z-offset from the top of the labware for blowout, if blowout_checkbox is true (mm). UI: "Z-Offset" input under "Blow out". (Default: 0)

  "disposalVolume_checkbox": "boolean", // Required - Whether to aspirate an additional volume for disposal (useful in 'multiDispense' path). UI: "Disposal Volume" checkbox (often shown in 'multiDispense' path). (Default: false)
  "disposalVolume_volume": "number" | null // Optional - Volume to aspirate for disposal if disposalVolume_checkbox is true (µL). UI: "Volume" input under "Disposal Volume".
}
```

<Essential Note>

The following parameters behave differently depending on single channel pipette or multi-chunnel pipette.

1. Single channel pipette: they can accept individual wells like 'A1','B3', 'F4'
   Eg.,

```json
"aspirate_wells" = [ "B1", "A1", "H1"]
"dispense_wells" = [ "C1", "D1", "A1"]
```

2. Multi-channel pipette: they only accept Row A's wells eg., A1, A2, and so on. For example, to refer to all wells in the first
   column we only say "A1". Robot automatically figures out the remainig wells since all wells if multi-channel works at the same time.
   Eg.,

```json
"aspirate_wells" = [ "A1", "A2", "A3"]
"dispense_wells" = [ "A1", "A2", "A3"]
```

</Essential Note>

Additional Notes on Fields and UI Mapping:

- LabwareEntity_ID, PipetteEntity_ID: These are string identifiers (e.g., "pipette_left", "pipette_right", "labware-1"). The UI presents human-readable names in dropdowns, which map to these IDs.
- NozzleConfigurationStyle: For 96-channel pipettes. Can be predefined strings like "COLUMN_1", "ALL", or a custom pattern. The UI usually provides a visual selection tool or specific named options.
- Well Order (_\_wellOrder_first, _\_wellOrder_second):
  - t2b: Top to bottom
  - b2t: Bottom to top
  - l2r: Left to right
  - r2l: Right to left
    UI typically has dropdowns for "Primary Direction" and "Secondary Direction".
- changeTip Options:
  - always: New tip for each transfer (or each well in a multi-well selection if not grouped).
  - once: Single tip for the entire step.
  - never: Reuse tip from previous step.
  - perSource: (For multi-dispense) New tip for each new source labware/well.
  - perDest: (For multi-aspirate) New tip for each new destination labware/well.
- Flow Rates (aspirate_flowRate, dispense_flowRate, blowout_flowRate): Usually expressed in µL/second. The UI might offer default values based on the pipette and allow customization, sometimes as a percentage of the pipette's maximum flow rate or as an absolute value. These are often in an "Advanced Settings" panel.
- Positional Offsets (_\_mmFromBottom, _\_x_position, \*\_y_position, blowout_z_offset): Provide fine control over tip placement. mmFromBottom is relative to the well bottom. x_position and y_position are relative to the well center. blowout_z_offset is often relative to the labware top or well top. Defaults are usually sensible (e.g., 1mm from bottom, center of well).
- Boolean Checkboxes (\*\_checkbox): These fields (true/false) typically toggle the visibility/applicability of related optional fields in the UI. For instance, if aspirate_mix_checkbox is false, then aspirate_mix_times and aspirate_mix_volume are irrelevant and likely hidden or disabled.
- Defaults: Many optional fields have default behaviors or values if not specified (e.g., a default height from bottom, default flow rates). The UI often pre-fills these.
- Ranges and Constraints:
  - volume, aspirate_mix_volume, aspirate_airGap_volume, disposalVolume_volume must be positive and within pipette/tip operational limits.
  - mix_times are typically small integers (e.g., 1-20).
  - delay_seconds are non-negative.
  - Positional offsets have practical limits based on labware geometry.

This step type is applicable for both robots, so all fields must be present. For example, the field `"dropTip_location": "trashbin-1"` must be included, where "dropTip_location" is the field name and "trashbin-1" must be consistent with the value used in `trashBinLocationUpdate['trashbin-1']`.

### Input

```text
Metadata:
- ProtocolName: moveLiquid step
- Description: moveLiquid step example

Robot: Configuration:
- Flex

Labware:
- nest_12_reservoir_15ml in slot C1
- nest_96_wellplate_100ul_pcr_full_skirt in D1
- Opentrons Flex 96 Tip Rack 1000 µL in slot C2

Pipette mount:
- Left mount: Flex 1-Channel 1000 µL

Steps:
1. Using the single-channel pipette, transfer 20 uL from well A1 of the reservoir to wells of the first column of the well plate. Use a new tip for each transfer.
```

### output

```json
{
  "metadata": {
    "protocolName": "moveLiquid step",
    "description": "moveLiquid step example"
  },
  "designerApplication": {
    "data": {
      "pipetteTiprackAssignments": {
        "pipette_left": ["opentrons/opentrons_flex_96_tiprack_1000ul/1"]
      },
      "ingredients": {},
      "ingredLocations": {},
      "savedStepForms": {
        "__INITIAL_DECK_SETUP_STEP__": {
          "labwareLocationUpdate": {
            "labware-1": "C2",
            "labware-2": "C1",
            "labware-3": "D1"
          },
          "pipetteLocationUpdate": {
            "pipette_left": "left"
          },
          "moduleLocationUpdate": {},
          "trashBinLocationUpdate": {
            "trashbin-1": "cutoutA3"
          },
          "wasteChuteLocationUpdate": {},
          "stagingAreaLocationUpdate": {},
          "gripperLocationUpdate": {}
        },
        "step-1": {
          "id": "step-1",
          "stepType": "moveLiquid",
          "stepName": "transfer",
          "stepDetails": "",
          "aspirate_airGap_checkbox": false,
          "aspirate_airGap_volume": null,
          "aspirate_delay_checkbox": false,
          "aspirate_delay_mmFromBottom": null,
          "aspirate_delay_seconds": "1",
          "aspirate_flowRate": "716",
          "aspirate_labware": "labware-2",
          "aspirate_mix_checkbox": false,
          "aspirate_mix_times": null,
          "aspirate_mix_volume": null,
          "aspirate_mmFromBottom": null,
          "aspirate_touchTip_checkbox": false,
          "aspirate_touchTip_mmFromBottom": null,
          "aspirate_wellOrder_first": "t2b",
          "aspirate_wellOrder_second": "l2r",
          "aspirate_wells_grouped": false,
          "aspirate_wells": ["A1"],
          "aspirate_x_position": 0,
          "aspirate_y_position": 0,
          "blowout_checkbox": false,
          "blowout_flowRate": null,
          "blowout_location": null,
          "blowout_z_offset": 0,
          "changeTip": "always",
          "dispense_airGap_checkbox": false,
          "dispense_airGap_volume": null,
          "dispense_delay_checkbox": false,
          "dispense_delay_mmFromBottom": null,
          "dispense_delay_seconds": "1",
          "dispense_flowRate": "716",
          "dispense_labware": "labware-3",
          "dispense_mix_checkbox": false,
          "dispense_mix_times": null,
          "dispense_mix_volume": null,
          "dispense_mmFromBottom": null,
          "dispense_touchTip_checkbox": false,
          "dispense_touchTip_mmFromBottom": null,
          "dispense_wellOrder_first": "t2b",
          "dispense_wellOrder_second": "l2r",
          "dispense_wells": ["A1", "B1", "C1", "D1", "E1", "F1", "G1", "H1"],
          "dispense_x_position": 0,
          "dispense_y_position": 0,
          "disposalVolume_checkbox": true,
          "disposalVolume_volume": null,
          "dropTip_location": "trashbin-1",
          "nozzles": null,
          "path": "single",
          "pipette": "pipette_left",
          "preWetTip": false,
          "tipRack": "opentrons/opentrons_flex_96_tiprack_1000ul/1",
          "volume": "20"
        }
      },
      "orderedStepIds": ["step-1"],
      "pipettes": {
        "pipette_left": {
          "pipetteName": "p1000_single_flex"
        }
      },
      "modules": {},
      "labware": {
        "labware-1": {
          "displayName": "Opentrons Flex 96 Tip Rack 1000 µL",
          "labwareDefURI": "opentrons/opentrons_flex_96_tiprack_1000ul/1"
        },
        "labware-2": {
          "displayName": "NEST 12 Well Reservoir 15 mL",
          "labwareDefURI": "opentrons/nest_12_reservoir_15ml/1"
        },
        "labware-3": {
          "displayName": "NEST 96 Well Plate 100 µL PCR Full Skirt",
          "labwareDefURI": "opentrons/nest_96_wellplate_100ul_pcr_full_skirt/2"
        }
      }
    }
  },
  "robot": {
    "model": "OT-3 Standard",
    "deckId": "ot3_standard"
  }
}
```

### Remarks on essential parameters

`changeTip` options:

- "always": "Before every aspirate" (Always aspirate with a fresh tip). `always` is the default.
- "never": "Never" (Use same tip as the previous step)
- "once": "Once at the start of step" (Get one new tip to use for the whole step)
- "perDest": "Per destination well" (Get a new tip when dispensing into a new destination well. Keep tip for repeat dispenses into the same destination well)
- "perSource": "Per source well" (Get a new tip when aspirating from a new source well. Keep tip for repeat aspirations from the same source well)

`path` options:

- "single"
- "multiAspirate" (this is used for consolidate transfers)
- "multiDispense" (this is used for distribute transfers)

`blowout_location` options:

- "dest_well"
- "source_well"
- "4743347b-e522-437e-b0c7-8494c1f7715c:trashBin"

If user sets "blowout_location" to "Trash Bin" then its value is set to
"trashbin-1"

If user chooses "Trash bin" for drop tip location:
"dropTip_location": "trashbin-1"

## Case 22: moveLiquid (Transfer) step with a multi-channel pipette

Depending on a single or multi-channel, a well selection behaves differently.

- For a single-channel it works in terms of individual wells. An user can choose wells.
- For multi channel pipette, PD only works with column-wise. That is, you can select an individual column not a row.

### Input

```text
Robot:
- Flex

Steps:
1. Using the multi-channel pipette, transfer 20 uL from well A1 of the reservoir to the first column of the well plate.
```

### Output

```json
{
  "metadata": {
    "protocolName": "moveLiquid step",
    "description": "moveLiquid step example"
  },
  "designerApplication": {
    "data": {
      "_internalAppBuildDate": "Mon, 05 May 2025 20:38:07 GMT",
      "pipetteTiprackAssignments": {
        "pipette_left": ["opentrons/opentrons_flex_96_tiprack_200ul/1"]
      },
      "ingredients": {},
      "ingredLocations": {},
      "savedStepForms": {
        "__INITIAL_DECK_SETUP_STEP__": {
          "labwareLocationUpdate": {
            "labware-1": "C1",
            "labware-2": "D1",
            "labware-3": "D2"
          },
          "pipetteLocationUpdate": {
            "pipette_left": "left"
          },
          "moduleLocationUpdate": {},
          "trashBinLocationUpdate": {
            "trashbin-1": "cutoutA3"
          },
          "wasteChuteLocationUpdate": {},
          "stagingAreaLocationUpdate": {},
          "gripperLocationUpdate": {}
        },
        "step-1": {
          "id": "step-1",
          "stepType": "moveLiquid",
          "stepName": "transfer",
          "stepDetails": "",
          "aspirate_airGap_checkbox": false,
          "aspirate_airGap_volume": null,
          "aspirate_delay_checkbox": false,
          "aspirate_delay_mmFromBottom": null,
          "aspirate_delay_seconds": "1",
          "aspirate_flowRate": "716",
          "aspirate_labware": "labware-1",
          "aspirate_mix_checkbox": false,
          "aspirate_mix_times": null,
          "aspirate_mix_volume": null,
          "aspirate_mmFromBottom": null,
          "aspirate_touchTip_checkbox": false,
          "aspirate_touchTip_mmFromBottom": null,
          "aspirate_wellOrder_first": "t2b",
          "aspirate_wellOrder_second": "l2r",
          "aspirate_wells_grouped": false,
          "aspirate_wells": ["A1"],
          "aspirate_x_position": 0,
          "aspirate_y_position": 0,
          "blowout_checkbox": false,
          "blowout_flowRate": null,
          "blowout_location": null,
          "blowout_z_offset": 0,
          "changeTip": "always",
          "dispense_airGap_checkbox": false,
          "dispense_airGap_volume": null,
          "dispense_delay_checkbox": false,
          "dispense_delay_mmFromBottom": null,
          "dispense_delay_seconds": "1",
          "dispense_flowRate": null,
          "dispense_labware": "labware-2",
          "dispense_mix_checkbox": false,
          "dispense_mix_times": null,
          "dispense_mix_volume": null,
          "dispense_mmFromBottom": null,
          "dispense_touchTip_checkbox": false,
          "dispense_touchTip_mmFromBottom": null,
          "dispense_wellOrder_first": "t2b",
          "dispense_wellOrder_second": "l2r",
          "dispense_wells": ["A1"],
          "dispense_x_position": 0,
          "dispense_y_position": 0,
          "disposalVolume_checkbox": true,
          "disposalVolume_volume": null,
          "dropTip_location": "trashbin-1",
          "nozzles": null,
          "path": "single",
          "pipette": "pipette_left",
          "preWetTip": false,
          "tipRack": "opentrons/opentrons_flex_96_tiprack_200ul/1",
          "volume": "20"
        }
      },
      "orderedStepIds": ["step-1"],
      "pipettes": {
        "pipette_left": {
          "pipetteName": "p1000_multi_flex"
        }
      },
      "modules": {},
      "labware": {
        "labware-1": {
          "displayName": "NEST 12 Well Reservoir 15 mL",
          "labwareDefURI": "opentrons/nest_12_reservoir_15ml/1"
        },
        "labware-2": {
          "displayName": "NEST 96 Well Plate 100 µL PCR Full Skirt",
          "labwareDefURI": "opentrons/nest_96_wellplate_100ul_pcr_full_skirt/2"
        },
        "labware-3": {
          "displayName": "Opentrons Flex 96 Tip Rack 200 µL",
          "labwareDefURI": "opentrons/opentrons_flex_96_tiprack_200ul/1"
        }
      }
    }
  },
  "robot": {
    "model": "OT-3 Standard",
    "deckId": "ot3_standard"
  }
}
```

## Case 23: Temperature and pause steps together

### Input

```text
Robot
- Flex

Steps:
1. Set temperatue module to 7C
2. Set a pause step such that temperature is reached
```

### Output

```json
{
  "metadata": {
    "protocolName": "Temperature and pause steps together",
    "description": "Temperature and pause steps together"
  },
  "designerApplication": {
    "data": {
      "pipetteTiprackAssignments": {
        "pipette_left": ["opentrons/opentrons_flex_96_filtertiprack_1000ul/1"]
      },
      "ingredients": {},
      "ingredLocations": {},
      "savedStepForms": {
        "__INITIAL_DECK_SETUP_STEP__": {
          "labwareLocationUpdate": {
            "labware-1": "C2"
          },
          "pipetteLocationUpdate": {
            "pipette_left": "left"
          },
          "moduleLocationUpdate": {
            "t-1": "C1"
          },
          "trashBinLocationUpdate": {
            "trashbin-1": "cutoutA3"
          },
          "wasteChuteLocationUpdate": {},
          "stagingAreaLocationUpdate": {},
          "gripperLocationUpdate": {}
        },
        "step-1": {
          "id": "step-1",
          "stepType": "temperature",
          "stepName": "temperature",
          "stepDetails": "",
          "moduleId": "t-1",
          "setTemperature": "true",
          "targetTemperature": "7"
        },
        "step-2": {
          "id": "step-2",
          "stepType": "pause",
          "stepName": "pause",
          "stepDetails": "",
          "moduleId": "t-1",
          "pauseAction": "untilTemperature",
          "pauseMessage": "Wait until temperature is reached",
          "pauseTemperature": "7",
          "pauseTime": null
        }
      },
      "orderedStepIds": ["step-1", "step-2"],
      "pipettes": {
        "pipette_left": {
          "pipetteName": "p1000_single_flex"
        }
      },
      "modules": {
        "t-1": {
          "model": "temperatureModuleV2"
        }
      },
      "labware": {
        "labware-1": {
          "displayName": "Opentrons Flex 96 Filter Tip Rack 1000 µL",
          "labwareDefURI": "opentrons/opentrons_flex_96_filtertiprack_1000ul/1"
        }
      }
    }
  },
  "robot": {
    "model": "OT-3 Standard",
    "deckId": "ot3_standard"
  }
}
```

### Remarks

- It is recommended that after temperature step, one needs to use `pause` step.
- Temperature module's default: deactivated.

## Examples for OT-2 and Flex

1. <Example1-for-OT2-with-all-modules>
   All OT-2 modules involved

```json
{
  "metadata": {
    "protocolName": "All Modules OT-2",
    "description": "in JSON"
  },
  "designerApplication": {
    "data": {
      "pipette_left": ["opentrons/opentrons_96_tiprack_300ul/1"]
    },
    "dismissedWarnings": {
      "form": [],
      "timeline": []
    },
    "ingredients": {},
    "ingredLocations": {},
    "savedStepForms": {
      "__INITIAL_DECK_SETUP_STEP__": {
        "labwareLocationUpdate": {
          "labware-1": "5"
        },
        "moduleLocationUpdate": {
          "hs-1": "1",
          "magnetic-module-1": "9",
          "t-1": "3",
          "tc-1": "7"
        },
        "pipetteLocationUpdate": {
          "pipette_left": "left"
        },
        "trashBinLocationUpdate": {
          "trashbin-1": "cutout12"
        },
        "wasteChuteLocationUpdate": {},
        "stagingAreaLocationUpdate": {},
        "gripperLocationUpdate": {}
      },
      "step-1": {
        "heaterShakerSetTimer": true,
        "heaterShakerTimer": "10:10",
        "latchOpen": false,
        "moduleId": "hs-1",
        "setHeaterShakerTemperature": true,
        "setShake": true,
        "targetHeaterShakerTemperature": "40",
        "targetSpeed": "500",
        "id": "step-1",
        "stepType": "heaterShaker",
        "stepName": "heater-shaker",
        "stepDetails": ""
      },
      "step-2": {
        "heaterShakerSetTimer": null,
        "heaterShakerTimer": null,
        "latchOpen": false,
        "moduleId": "hs-1",
        "setHeaterShakerTemperature": null,
        "setShake": null,
        "targetHeaterShakerTemperature": null,
        "targetSpeed": null,
        "id": "step-2",
        "stepType": "heaterShaker",
        "stepName": "heater-shaker",
        "stepDetails": ""
      },
      "step-3": {
        "engageHeight": "10",
        "magnetAction": "engage",
        "moduleId": "magnetic-module-1",
        "id": "step-3",
        "stepType": "magnet",
        "stepName": "magnet",
        "stepDetails": ""
      },
      "step-5": {
        "engageHeight": "10",
        "magnetAction": "disengage",
        "moduleId": "magnetic-module-1",
        "id": "step-5",
        "stepType": "magnet",
        "stepName": "magnet",
        "stepDetails": ""
      },
      "step-4": {
        "moduleId": null,
        "pauseAction": "untilTime",
        "pauseMessage": "",
        "pauseTemperature": null,
        "pauseTime": "00:01:00",
        "id": "step-4",
        "stepType": "pause",
        "stepName": "pause",
        "stepDetails": ""
      },
      "step-6": {
        "moduleId": "t-1",
        "setTemperature": "true",
        "targetTemperature": "20",
        "id": "step-6",
        "stepType": "temperature",
        "stepName": "temperature",
        "stepDetails": ""
      },
      "step-7": {
        "moduleId": "t-1",
        "pauseAction": "untilTemperature",
        "pauseMessage": "",
        "pauseTemperature": "20",
        "pauseTime": null,
        "id": "step-7",
        "stepType": "pause",
        "stepName": "pause",
        "stepDetails": ""
      },
      "step-8": {
        "moduleId": "t-1",
        "setTemperature": null,
        "targetTemperature": null,
        "id": "step-8",
        "stepType": "temperature",
        "stepName": "temperature",
        "stepDetails": ""
      },
      "step-9": {
        "blockIsActive": false,
        "blockIsActiveHold": false,
        "blockTargetTemp": null,
        "blockTargetTempHold": null,
        "lidIsActive": false,
        "lidIsActiveHold": false,
        "lidOpen": false,
        "lidOpenHold": null,
        "lidTargetTemp": null,
        "lidTargetTempHold": null,
        "moduleId": "tc-1",
        "orderedProfileItems": [],
        "profileItemsById": {},
        "profileTargetLidTemp": null,
        "profileVolume": null,
        "thermocyclerFormType": "thermocyclerState",
        "id": "step-9",
        "stepType": "thermocycler",
        "stepName": "thermocycler",
        "stepDetails": ""
      },
      "step-10": {
        "blockIsActive": false,
        "blockIsActiveHold": true,
        "blockTargetTemp": null,
        "blockTargetTempHold": "4",
        "lidIsActive": false,
        "lidIsActiveHold": false,
        "lidOpen": false,
        "lidOpenHold": null,
        "lidTargetTemp": null,
        "lidTargetTempHold": null,
        "moduleId": "tc-1",
        "orderedProfileItems": ["cycle-1"],
        "profileItemsById": {
          "cycle-1": {
            "id": "cycle-1",
            "title": "",
            "steps": [
              {
                "durationMinutes": "00",
                "durationSeconds": "30",
                "id": "50e4b4c7-5f28-4dba-a5be-96868753e782",
                "temperature": "60",
                "title": "tagmentation",
                "type": "profileStep"
              },
              {
                "durationMinutes": "55",
                "durationSeconds": "00",
                "id": "4b509fb5-938a-40a9-aacd-e30f497698fc",
                "temperature": "80",
                "title": "hold",
                "type": "profileStep"
              }
            ],
            "type": "profileCycle",
            "repetitions": "5"
          }
        },
        "profileTargetLidTemp": "40",
        "profileVolume": "10",
        "thermocyclerFormType": "thermocyclerProfile",
        "id": "step-10",
        "stepType": "thermocycler",
        "stepName": "thermocycler",
        "stepDetails": ""
      }
    },
    "orderedStepIds": [
      "step-1",
      "step-2",
      "step-3",
      "step-4",
      "step-5",
      "step-6",
      "step-7",
      "step-8",
      "step-9",
      "step-10"
    ],
    "pipettes": {
      "pipette_left": {
        "pipetteName": "p300_single"
      }
    },
    "modules": {
      "hs-1": {
        "model": "heaterShakerModuleV1"
      },
      "magnetic-module-1": {
        "model": "magneticModuleV2"
      },
      "t-1": {
        "model": "temperatureModuleV2"
      },
      "tc-1": {
        "model": "thermocyclerModuleV2"
      }
    },
    "labware": {
      "labware-1": {
        "displayName": "Opentrons OT-2 96 Tip Rack 300 µL",
        "labwareDefURI": "opentrons/opentrons_96_tiprack_300ul/1"
      }
    }
  },
  "robot": {
    "model": "OT-2 Standard",
    "deckId": "ot2_standard"
  }
}
```

</Example1-for-OT2-with-all-modules>

2. <Example2-for-Flex-with-all-modules>
   All Flex modules involved

```json
{
  "metadata": {
    "protocolName": "AllModuleFlex",
    "description": "AllModuleFlex"
  },
  "designerApplication": {
    "data": {
      "pipetteTiprackAssignments": {
        "pipette_left": ["opentrons/opentrons_flex_96_filtertiprack_50ul/1"]
      },
      "ingredients": {},
      "ingredLocations": {},
      "savedStepForms": {
        "__INITIAL_DECK_SETUP_STEP__": {
          "labwareLocationUpdate": {
            "labware-1": "D3",
            "labware-2": "C3"
          },
          "moduleLocationUpdate": {
            "apr-1": "B3",
            "hs-1": "D1",
            "t-1": "C1",
            "magnetic-block-1": "D2",
            "tc-1": "B1"
          },
          "pipetteLocationUpdate": {
            "pipette_left": "left"
          },
          "trashBinLocationUpdate": {
            "trashbin-1": "cutoutA3"
          },
          "wasteChuteLocationUpdate": {},
          "stagingAreaLocationUpdate": {},
          "gripperLocationUpdate": {
            "gripper-1": "mounted"
          }
        },
        "step-1": {
          "heaterShakerSetTimer": true,
          "heaterShakerTimer": "00:30",
          "latchOpen": false,
          "moduleId": "hs-1",
          "setHeaterShakerTemperature": true,
          "setShake": true,
          "targetHeaterShakerTemperature": "50",
          "targetSpeed": "500",
          "id": "step-1",
          "stepType": "heaterShaker",
          "stepName": "heater-shaker",
          "stepDetails": ""
        },
        "step-2": {
          "heaterShakerSetTimer": null,
          "heaterShakerTimer": null,
          "latchOpen": false,
          "moduleId": "hs-1",
          "setHeaterShakerTemperature": null,
          "setShake": null,
          "targetHeaterShakerTemperature": null,
          "targetSpeed": null,
          "id": "step-2",
          "stepType": "heaterShaker",
          "stepName": "heater-shaker",
          "stepDetails": ""
        },
        "step-3": {
          "moduleId": "t-1",
          "setTemperature": "true",
          "targetTemperature": "30",
          "id": "step-3",
          "stepType": "temperature",
          "stepName": "temperature",
          "stepDetails": ""
        },
        "step-4": {
          "moduleId": "t-1",
          "pauseAction": "untilTemperature",
          "pauseMessage": "",
          "pauseTemperature": "30",
          "pauseTime": null,
          "id": "step-4",
          "stepType": "pause",
          "stepName": "pause",
          "stepDetails": ""
        },
        "step-5": {
          "moduleId": "t-1",
          "setTemperature": null,
          "targetTemperature": null,
          "id": "step-5",
          "stepType": "temperature",
          "stepName": "temperature",
          "stepDetails": ""
        },
        "step-6": {
          "blockIsActive": false,
          "blockIsActiveHold": false,
          "blockTargetTemp": null,
          "blockTargetTempHold": null,
          "lidIsActive": false,
          "lidIsActiveHold": false,
          "lidOpen": null,
          "lidOpenHold": null,
          "lidTargetTemp": null,
          "lidTargetTempHold": null,
          "moduleId": "tc-1",
          "orderedProfileItems": [],
          "profileItemsById": {},
          "profileTargetLidTemp": null,
          "profileVolume": null,
          "thermocyclerFormType": "thermocyclerState",
          "id": "step-6",
          "stepType": "thermocycler",
          "stepName": "thermocycler",
          "stepDetails": ""
        },
        "step-7": {
          "blockIsActive": false,
          "blockIsActiveHold": true,
          "blockTargetTemp": null,
          "blockTargetTempHold": "4",
          "lidIsActive": false,
          "lidIsActiveHold": false,
          "lidOpen": false,
          "lidOpenHold": null,
          "lidTargetTemp": null,
          "lidTargetTempHold": null,
          "moduleId": "tc-1",
          "orderedProfileItems": ["cycle-1"],
          "profileItemsById": {
            "cycle-1": {
              "id": "cycle-1",
              "title": "",
              "steps": [
                {
                  "durationMinutes": "00",
                  "durationSeconds": "30",
                  "id": "82e8eeb7-0c78-4fb2-bf97-d5d998499bcd",
                  "temperature": "50",
                  "title": "tagmentation",
                  "type": "profileStep"
                },
                {
                  "durationMinutes": "55",
                  "durationSeconds": "00",
                  "id": "2ba997e3-d300-490f-ac3d-2a737ee22306",
                  "temperature": "80",
                  "title": "holding",
                  "type": "profileStep"
                }
              ],
              "type": "profileCycle",
              "repetitions": "5"
            }
          },
          "profileTargetLidTemp": "40",
          "profileVolume": "10",
          "thermocyclerFormType": "thermocyclerProfile",
          "id": "step-7",
          "stepType": "thermocycler",
          "stepName": "thermocycler",
          "stepDetails": ""
        },
        "step-8": {
          "absorbanceReaderFormType": "absorbanceReaderInitialize",
          "fileName": null,
          "lidOpen": null,
          "mode": "single",
          "moduleId": "apr-1",
          "referenceWavelength": null,
          "referenceWavelengthActive": false,
          "wavelengths": ["450"],
          "id": "step-8",
          "stepType": "absorbanceReader",
          "stepName": "absorbance plate reader",
          "stepDetails": ""
        },
        "step-10": {
          "labware": "labware-2",
          "newLocation": "apr-1",
          "useGripper": true,
          "id": "step-10",
          "stepType": "moveLabware",
          "stepName": "move",
          "stepDetails": ""
        },
        "step-9": {
          "absorbanceReaderFormType": "absorbanceReaderLid",
          "fileName": null,
          "lidOpen": true,
          "mode": "single",
          "moduleId": "apr-1",
          "referenceWavelength": null,
          "referenceWavelengthActive": false,
          "wavelengths": ["450"],
          "id": "step-9",
          "stepType": "absorbanceReader",
          "stepName": "absorbance plate reader",
          "stepDetails": ""
        },
        "step-11": {
          "absorbanceReaderFormType": "absorbanceReaderRead",
          "fileName": "plate_reader_results",
          "lidOpen": null,
          "mode": "single",
          "moduleId": "apr-1",
          "referenceWavelength": null,
          "referenceWavelengthActive": false,
          "wavelengths": ["450"],
          "id": "step-11",
          "stepType": "absorbanceReader",
          "stepName": "absorbance plate reader",
          "stepDetails": ""
        }
      },
      "orderedStepIds": [
        "step-1",
        "step-2",
        "step-3",
        "step-4",
        "step-5",
        "step-6",
        "step-7",
        "step-8",
        "step-9",
        "step-10",
        "step-11"
      ],
      "pipettes": {
        "pipette_left": {
          "pipetteName": "p50_single_flex"
        }
      },
      "modules": {
        "apr-1": {
          "model": "absorbanceReaderV1"
        },
        "hs-1": {
          "model": "heaterShakerModuleV1"
        },
        "t-1": {
          "model": "temperatureModuleV2"
        },
        "magnetic-block-1": {
          "model": "magneticBlockV1"
        },
        "tc-1": {
          "model": "thermocyclerModuleV2"
        }
      },
      "labware": {
        "labware-1": {
          "displayName": "Opentrons Flex 96 Filter Tip Rack 50 µL",
          "labwareDefURI": "opentrons/opentrons_flex_96_filtertiprack_50ul/1"
        },
        "labware-2": {
          "displayName": "Corning 96 Well Plate 360 µL Flat",
          "labwareDefURI": "opentrons/corning_96_wellplate_360ul_flat/2"
        }
      }
    }
  },
  "robot": {
    "model": "OT-3 Standard",
    "deckId": "ot3_standard"
  }
}
```

</Example2-for-Flex-with-all-modules>

3. <Example-serial-dilution>

Input:

```text
Robot:
- Flex

Pipette:
- Left mount: p1000 single channel Flex pipette

Labware:
- Tiprack-1: Opentrons Flex 96 Filter Tip Rack 1000 μL (Slot D1)
- Tiprack-2: Opentrons Flex 96 Filter Tip Rack 1000 μL (Slot C1)
- Plate: NEST 96 Well Plate 200 μL Flat (Slot D3)
- Reservoir: NEST 12 Well Reservoir 15 mL (Slot D2)


Liquids:
- Diluent liquid (green, 12 mL in reservoir well A1)
- Sample liquid (red, 150 μL in each well of column 1 of the plate)

Steps:
1. Distribute 100 μL of diluent from reservoir well A1 to all wells in columns 2-11 of the plate (with 10 μL air gap during aspiration and 5 μL disposal volume)

2. Perform serial dilutions for Row A:
 - Transfer 50 μL from A1 to A2, mix 5× with 75 μL
 - Transfer 50 μL from A2 to A3, mix 5× with 75 μL
 - Continue this pattern through A10 to A11
 - Use 10 μL air gap during aspiration
 - Change tip once for the entire row

3-9. Repeat the same serial dilution pattern for Rows B through H (one row at a time)

10. Add 100 μL blank (diluent) to the last column (column 12) of the plate
```

Output protocol:

```json
{
  "metadata": {
    "protocolName": "Serial Dilution",
    "description": ""
  },
  "designerApplication": {
    "data": {
      "pipetteTiprackAssignments": {
        "pipette_left": ["opentrons/opentrons_flex_96_filtertiprack_1000ul/1"]
      },
      "ingredients": {
        "0": {
          "displayName": "Diluent liquid",
          "description": null,
          "displayColor": "#33ff33ff",
          "liquidGroupId": "0",
          "liquidClass": null
        },
        "1": {
          "displayName": "Sample liquid",
          "description": null,
          "displayColor": "#ff0000ff",
          "liquidGroupId": "1",
          "liquidClass": null
        }
      },
      "ingredLocations": {
        "labware-4": {},
        "labware-1": {
          "A1": {
            "0": {
              "volume": 12000
            }
          }
        },
        "labware-2": {
          "A1": {
            "1": {
              "volume": 150
            }
          },
          "B1": {
            "1": {
              "volume": 150
            }
          },
          "C1": {
            "1": {
              "volume": 150
            }
          },
          "D1": {
            "1": {
              "volume": 150
            }
          },
          "E1": {
            "1": {
              "volume": 150
            }
          },
          "F1": {
            "1": {
              "volume": 150
            }
          },
          "G1": {
            "1": {
              "volume": 150
            }
          },
          "H1": {
            "1": {
              "volume": 150
            }
          }
        }
      },
      "savedStepForms": {
        "__INITIAL_DECK_SETUP_STEP__": {
          "labwareLocationUpdate": {
            "labware-1": "D2",
            "labware-2": "D3",
            "labware-3": "D1",
            "labware-4": "C1"
          },
          "moduleLocationUpdate": {},
          "pipetteLocationUpdate": {
            "pipette_left": "left"
          },
          "trashBinLocationUpdate": {
            "trashbin-1": "cutoutA3"
          },
          "wasteChuteLocationUpdate": {},
          "stagingAreaLocationUpdate": {},
          "gripperLocationUpdate": {}
        },
        "step-1": {
          "aspirate_airGap_checkbox": true,
          "aspirate_airGap_volume": "10",
          "aspirate_delay_checkbox": false,
          "aspirate_delay_mmFromBottom": null,
          "aspirate_delay_seconds": "1",
          "aspirate_flowRate": "716",
          "aspirate_labware": "labware-1",
          "aspirate_mix_checkbox": false,
          "aspirate_mix_times": null,
          "aspirate_mix_volume": null,
          "aspirate_mmFromBottom": null,
          "aspirate_touchTip_checkbox": false,
          "aspirate_touchTip_mmFromBottom": null,
          "aspirate_wellOrder_first": "t2b",
          "aspirate_wellOrder_second": "l2r",
          "aspirate_wells_grouped": false,
          "aspirate_wells": ["A1"],
          "aspirate_x_position": 0,
          "aspirate_y_position": 0,
          "blowout_checkbox": false,
          "blowout_flowRate": null,
          "blowout_location": null,
          "blowout_z_offset": 0,
          "changeTip": "once",
          "dispense_airGap_checkbox": false,
          "dispense_airGap_volume": null,
          "dispense_delay_checkbox": false,
          "dispense_delay_mmFromBottom": null,
          "dispense_delay_seconds": "1",
          "dispense_flowRate": null,
          "dispense_labware": "labware-2",
          "dispense_mix_checkbox": false,
          "dispense_mix_times": null,
          "dispense_mix_volume": null,
          "dispense_mmFromBottom": null,
          "dispense_touchTip_checkbox": false,
          "dispense_touchTip_mmFromBottom": null,
          "dispense_wellOrder_first": "t2b",
          "dispense_wellOrder_second": "l2r",
          "dispense_wells": [
            "A2",
            "B2",
            "C2",
            "D2",
            "E2",
            "F2",
            "G2",
            "H2",
            "A3",
            "B3",
            "C3",
            "D3",
            "E3",
            "F3",
            "G3",
            "H3",
            "A4",
            "B4",
            "C4",
            "D4",
            "E4",
            "F4",
            "G4",
            "H4",
            "A5",
            "B5",
            "C5",
            "D5",
            "E5",
            "F5",
            "G5",
            "H5",
            "A6",
            "B6",
            "C6",
            "D6",
            "E6",
            "F6",
            "G6",
            "H6",
            "A7",
            "B7",
            "C7",
            "D7",
            "E7",
            "F7",
            "G7",
            "H7",
            "A8",
            "B8",
            "C8",
            "D8",
            "E8",
            "F8",
            "G8",
            "H8",
            "A9",
            "B9",
            "C9",
            "D9",
            "E9",
            "F9",
            "G9",
            "H9",
            "A10",
            "B10",
            "C10",
            "D10",
            "E10",
            "F10",
            "G10",
            "H10",
            "A11",
            "B11",
            "C11",
            "D11",
            "E11",
            "F11",
            "G11",
            "H11"
          ],
          "dispense_x_position": 0,
          "dispense_y_position": 0,
          "disposalVolume_checkbox": true,
          "disposalVolume_volume": "5",
          "dropTip_location": "trashbin-1",
          "nozzles": null,
          "path": "multiDispense",
          "pipette": "pipette_left",
          "preWetTip": false,
          "tipRack": "opentrons/opentrons_flex_96_filtertiprack_1000ul/1",
          "volume": "100",
          "id": "step-1",
          "stepType": "moveLiquid",
          "stepName": "Distribute diluent to dilution plate",
          "stepDetails": ""
        },
        "step-2": {
          "aspirate_airGap_checkbox": true,
          "aspirate_airGap_volume": "10",
          "aspirate_delay_checkbox": false,
          "aspirate_delay_mmFromBottom": null,
          "aspirate_delay_seconds": "1",
          "aspirate_flowRate": "716",
          "aspirate_labware": "labware-2",
          "aspirate_mix_checkbox": false,
          "aspirate_mix_times": null,
          "aspirate_mix_volume": null,
          "aspirate_mmFromBottom": null,
          "aspirate_touchTip_checkbox": false,
          "aspirate_touchTip_mmFromBottom": null,
          "aspirate_wellOrder_first": "t2b",
          "aspirate_wellOrder_second": "l2r",
          "aspirate_wells_grouped": false,
          "aspirate_wells": [
            "A1",
            "A2",
            "A3",
            "A4",
            "A5",
            "A6",
            "A7",
            "A8",
            "A9",
            "A10"
          ],
          "aspirate_x_position": 0,
          "aspirate_y_position": 0,
          "blowout_checkbox": false,
          "blowout_flowRate": null,
          "blowout_location": null,
          "blowout_z_offset": 0,
          "changeTip": "once",
          "dispense_airGap_checkbox": false,
          "dispense_airGap_volume": null,
          "dispense_delay_checkbox": false,
          "dispense_delay_mmFromBottom": null,
          "dispense_delay_seconds": "1",
          "dispense_flowRate": "716",
          "dispense_labware": "labware-2",
          "dispense_mix_checkbox": true,
          "dispense_mix_times": "5",
          "dispense_mix_volume": "75",
          "dispense_mmFromBottom": null,
          "dispense_touchTip_checkbox": false,
          "dispense_touchTip_mmFromBottom": null,
          "dispense_wellOrder_first": "t2b",
          "dispense_wellOrder_second": "l2r",
          "dispense_wells": [
            "A2",
            "A3",
            "A4",
            "A5",
            "A6",
            "A7",
            "A8",
            "A9",
            "A10",
            "A11"
          ],
          "dispense_x_position": 0,
          "dispense_y_position": 0,
          "disposalVolume_checkbox": true,
          "disposalVolume_volume": null,
          "dropTip_location": "trashbin-1",
          "nozzles": null,
          "path": "single",
          "pipette": "pipette_left",
          "preWetTip": false,
          "tipRack": "opentrons/opentrons_flex_96_filtertiprack_1000ul/1",
          "volume": "50",
          "id": "step-2",
          "stepType": "moveLiquid",
          "stepName": "Serial Dilutions: Row 1",
          "stepDetails": ""
        },
        "step-3": {
          "aspirate_airGap_checkbox": true,
          "aspirate_airGap_volume": "10",
          "aspirate_delay_checkbox": false,
          "aspirate_delay_mmFromBottom": null,
          "aspirate_delay_seconds": "1",
          "aspirate_flowRate": "716",
          "aspirate_labware": "labware-2",
          "aspirate_mix_checkbox": false,
          "aspirate_mix_times": null,
          "aspirate_mix_volume": null,
          "aspirate_mmFromBottom": null,
          "aspirate_touchTip_checkbox": false,
          "aspirate_touchTip_mmFromBottom": null,
          "aspirate_wellOrder_first": "t2b",
          "aspirate_wellOrder_second": "l2r",
          "aspirate_wells_grouped": false,
          "aspirate_wells": [
            "B1",
            "B2",
            "B3",
            "B4",
            "B5",
            "B6",
            "B7",
            "B8",
            "B9",
            "B10"
          ],
          "aspirate_x_position": 0,
          "aspirate_y_position": 0,
          "blowout_checkbox": false,
          "blowout_flowRate": null,
          "blowout_location": null,
          "blowout_z_offset": 0,
          "changeTip": "once",
          "dispense_airGap_checkbox": false,
          "dispense_airGap_volume": null,
          "dispense_delay_checkbox": false,
          "dispense_delay_mmFromBottom": null,
          "dispense_delay_seconds": "1",
          "dispense_flowRate": "716",
          "dispense_labware": "labware-2",
          "dispense_mix_checkbox": true,
          "dispense_mix_times": "5",
          "dispense_mix_volume": "75",
          "dispense_mmFromBottom": null,
          "dispense_touchTip_checkbox": false,
          "dispense_touchTip_mmFromBottom": null,
          "dispense_wellOrder_first": "t2b",
          "dispense_wellOrder_second": "l2r",
          "dispense_wells": [
            "B2",
            "B3",
            "B4",
            "B5",
            "B6",
            "B7",
            "B8",
            "B9",
            "B10",
            "B11"
          ],
          "dispense_x_position": 0,
          "dispense_y_position": 0,
          "disposalVolume_checkbox": true,
          "disposalVolume_volume": null,
          "dropTip_location": "trashbin-1",
          "nozzles": null,
          "path": "single",
          "pipette": "pipette_left",
          "preWetTip": false,
          "tipRack": "opentrons/opentrons_flex_96_filtertiprack_1000ul/1",
          "volume": "50",
          "id": "step-3",
          "stepType": "moveLiquid",
          "stepName": "Serial dilutions: Row 2",
          "stepDetails": ""
        },
        "step-4": {
          "aspirate_airGap_checkbox": true,
          "aspirate_airGap_volume": "10",
          "aspirate_delay_checkbox": false,
          "aspirate_delay_mmFromBottom": null,
          "aspirate_delay_seconds": "1",
          "aspirate_flowRate": "716",
          "aspirate_labware": "labware-2",
          "aspirate_mix_checkbox": false,
          "aspirate_mix_times": null,
          "aspirate_mix_volume": null,
          "aspirate_mmFromBottom": null,
          "aspirate_touchTip_checkbox": false,
          "aspirate_touchTip_mmFromBottom": null,
          "aspirate_wellOrder_first": "t2b",
          "aspirate_wellOrder_second": "l2r",
          "aspirate_wells_grouped": false,
          "aspirate_wells": [
            "C1",
            "C2",
            "C3",
            "C4",
            "C5",
            "C6",
            "C7",
            "C8",
            "C9",
            "C10"
          ],
          "aspirate_x_position": 0,
          "aspirate_y_position": 0,
          "blowout_checkbox": false,
          "blowout_flowRate": null,
          "blowout_location": null,
          "blowout_z_offset": 0,
          "changeTip": "once",
          "dispense_airGap_checkbox": false,
          "dispense_airGap_volume": null,
          "dispense_delay_checkbox": false,
          "dispense_delay_mmFromBottom": null,
          "dispense_delay_seconds": "1",
          "dispense_flowRate": "716",
          "dispense_labware": "labware-2",
          "dispense_mix_checkbox": true,
          "dispense_mix_times": "5",
          "dispense_mix_volume": "75",
          "dispense_mmFromBottom": null,
          "dispense_touchTip_checkbox": false,
          "dispense_touchTip_mmFromBottom": null,
          "dispense_wellOrder_first": "t2b",
          "dispense_wellOrder_second": "l2r",
          "dispense_wells": [
            "C2",
            "C3",
            "C4",
            "C5",
            "C6",
            "C7",
            "C8",
            "C9",
            "C10",
            "C11"
          ],
          "dispense_x_position": 0,
          "dispense_y_position": 0,
          "disposalVolume_checkbox": true,
          "disposalVolume_volume": null,
          "dropTip_location": "trashbin-1",
          "nozzles": null,
          "path": "single",
          "pipette": "pipette_left",
          "preWetTip": false,
          "tipRack": "opentrons/opentrons_flex_96_filtertiprack_1000ul/1",
          "volume": "50",
          "id": "step-4",
          "stepType": "moveLiquid",
          "stepName": "Serial dilutions: Row 3",
          "stepDetails": ""
        },
        "step-5": {
          "aspirate_airGap_checkbox": true,
          "aspirate_airGap_volume": "10",
          "aspirate_delay_checkbox": false,
          "aspirate_delay_mmFromBottom": null,
          "aspirate_delay_seconds": "1",
          "aspirate_flowRate": "716",
          "aspirate_labware": "labware-2",
          "aspirate_mix_checkbox": false,
          "aspirate_mix_times": null,
          "aspirate_mix_volume": null,
          "aspirate_mmFromBottom": null,
          "aspirate_touchTip_checkbox": false,
          "aspirate_touchTip_mmFromBottom": null,
          "aspirate_wellOrder_first": "t2b",
          "aspirate_wellOrder_second": "l2r",
          "aspirate_wells_grouped": false,
          "aspirate_wells": [
            "D1",
            "D2",
            "D3",
            "D4",
            "D5",
            "D6",
            "D7",
            "D8",
            "D9",
            "D10"
          ],
          "aspirate_x_position": 0,
          "aspirate_y_position": 0,
          "blowout_checkbox": false,
          "blowout_flowRate": null,
          "blowout_location": null,
          "blowout_z_offset": 0,
          "changeTip": "once",
          "dispense_airGap_checkbox": false,
          "dispense_airGap_volume": null,
          "dispense_delay_checkbox": false,
          "dispense_delay_mmFromBottom": null,
          "dispense_delay_seconds": "1",
          "dispense_flowRate": "716",
          "dispense_labware": "labware-2",
          "dispense_mix_checkbox": true,
          "dispense_mix_times": "5",
          "dispense_mix_volume": "75",
          "dispense_mmFromBottom": null,
          "dispense_touchTip_checkbox": false,
          "dispense_touchTip_mmFromBottom": null,
          "dispense_wellOrder_first": "t2b",
          "dispense_wellOrder_second": "l2r",
          "dispense_wells": [
            "D2",
            "D3",
            "D4",
            "D5",
            "D6",
            "D7",
            "D8",
            "D9",
            "D10",
            "D11"
          ],
          "dispense_x_position": 0,
          "dispense_y_position": 0,
          "disposalVolume_checkbox": true,
          "disposalVolume_volume": null,
          "dropTip_location": "trashbin-1",
          "nozzles": null,
          "path": "single",
          "pipette": "pipette_left",
          "preWetTip": false,
          "tipRack": "opentrons/opentrons_flex_96_filtertiprack_1000ul/1",
          "volume": "50",
          "id": "step-5",
          "stepType": "moveLiquid",
          "stepName": "Serial dilutions: Row 4",
          "stepDetails": ""
        },
        "step-6": {
          "aspirate_airGap_checkbox": true,
          "aspirate_airGap_volume": "10",
          "aspirate_delay_checkbox": false,
          "aspirate_delay_mmFromBottom": null,
          "aspirate_delay_seconds": "1",
          "aspirate_flowRate": "716",
          "aspirate_labware": "labware-2",
          "aspirate_mix_checkbox": false,
          "aspirate_mix_times": null,
          "aspirate_mix_volume": null,
          "aspirate_mmFromBottom": null,
          "aspirate_touchTip_checkbox": false,
          "aspirate_touchTip_mmFromBottom": null,
          "aspirate_wellOrder_first": "t2b",
          "aspirate_wellOrder_second": "l2r",
          "aspirate_wells_grouped": false,
          "aspirate_wells": [
            "E1",
            "E2",
            "E3",
            "E4",
            "E5",
            "E6",
            "E7",
            "E8",
            "E9",
            "E10"
          ],
          "aspirate_x_position": 0,
          "aspirate_y_position": 0,
          "blowout_checkbox": false,
          "blowout_flowRate": null,
          "blowout_location": null,
          "blowout_z_offset": 0,
          "changeTip": "once",
          "dispense_airGap_checkbox": false,
          "dispense_airGap_volume": null,
          "dispense_delay_checkbox": false,
          "dispense_delay_mmFromBottom": null,
          "dispense_delay_seconds": "1",
          "dispense_flowRate": "716",
          "dispense_labware": "labware-2",
          "dispense_mix_checkbox": true,
          "dispense_mix_times": "5",
          "dispense_mix_volume": "75",
          "dispense_mmFromBottom": null,
          "dispense_touchTip_checkbox": false,
          "dispense_touchTip_mmFromBottom": null,
          "dispense_wellOrder_first": "t2b",
          "dispense_wellOrder_second": "l2r",
          "dispense_wells": [
            "E2",
            "E3",
            "E4",
            "E5",
            "E6",
            "E7",
            "E8",
            "E9",
            "E10",
            "E11"
          ],
          "dispense_x_position": 0,
          "dispense_y_position": 0,
          "disposalVolume_checkbox": true,
          "disposalVolume_volume": null,
          "dropTip_location": "trashbin-1",
          "nozzles": null,
          "path": "single",
          "pipette": "pipette_left",
          "preWetTip": false,
          "tipRack": "opentrons/opentrons_flex_96_filtertiprack_1000ul/1",
          "volume": "50",
          "id": "step-6",
          "stepType": "moveLiquid",
          "stepName": "Serial dilutions: Row 5",
          "stepDetails": ""
        },
        "step-7": {
          "aspirate_airGap_checkbox": true,
          "aspirate_airGap_volume": "10",
          "aspirate_delay_checkbox": false,
          "aspirate_delay_mmFromBottom": null,
          "aspirate_delay_seconds": "1",
          "aspirate_flowRate": "716",
          "aspirate_labware": "labware-2",
          "aspirate_mix_checkbox": false,
          "aspirate_mix_times": null,
          "aspirate_mix_volume": null,
          "aspirate_mmFromBottom": null,
          "aspirate_touchTip_checkbox": false,
          "aspirate_touchTip_mmFromBottom": null,
          "aspirate_wellOrder_first": "t2b",
          "aspirate_wellOrder_second": "l2r",
          "aspirate_wells_grouped": false,
          "aspirate_wells": [
            "F1",
            "F2",
            "F3",
            "F4",
            "F5",
            "F6",
            "F7",
            "F8",
            "F9",
            "F10"
          ],
          "aspirate_x_position": 0,
          "aspirate_y_position": 0,
          "blowout_checkbox": false,
          "blowout_flowRate": null,
          "blowout_location": null,
          "blowout_z_offset": 0,
          "changeTip": "once",
          "dispense_airGap_checkbox": false,
          "dispense_airGap_volume": null,
          "dispense_delay_checkbox": false,
          "dispense_delay_mmFromBottom": null,
          "dispense_delay_seconds": "1",
          "dispense_flowRate": "716",
          "dispense_labware": "labware-2",
          "dispense_mix_checkbox": true,
          "dispense_mix_times": "5",
          "dispense_mix_volume": "75",
          "dispense_mmFromBottom": null,
          "dispense_touchTip_checkbox": false,
          "dispense_touchTip_mmFromBottom": null,
          "dispense_wellOrder_first": "t2b",
          "dispense_wellOrder_second": "l2r",
          "dispense_wells": [
            "F2",
            "F3",
            "F4",
            "F5",
            "F6",
            "F7",
            "F8",
            "F9",
            "F10",
            "F11"
          ],
          "dispense_x_position": 0,
          "dispense_y_position": 0,
          "disposalVolume_checkbox": true,
          "disposalVolume_volume": null,
          "dropTip_location": "trashbin-1",
          "nozzles": null,
          "path": "single",
          "pipette": "pipette_left",
          "preWetTip": false,
          "tipRack": "opentrons/opentrons_flex_96_filtertiprack_1000ul/1",
          "volume": "50",
          "id": "step-7",
          "stepType": "moveLiquid",
          "stepName": "Serial dilutions: Row 6",
          "stepDetails": ""
        },
        "step-8": {
          "aspirate_airGap_checkbox": true,
          "aspirate_airGap_volume": "10",
          "aspirate_delay_checkbox": false,
          "aspirate_delay_mmFromBottom": null,
          "aspirate_delay_seconds": "1",
          "aspirate_flowRate": "716",
          "aspirate_labware": "labware-2",
          "aspirate_mix_checkbox": false,
          "aspirate_mix_times": null,
          "aspirate_mix_volume": null,
          "aspirate_mmFromBottom": null,
          "aspirate_touchTip_checkbox": false,
          "aspirate_touchTip_mmFromBottom": null,
          "aspirate_wellOrder_first": "t2b",
          "aspirate_wellOrder_second": "l2r",
          "aspirate_wells_grouped": false,
          "aspirate_wells": [
            "G1",
            "G2",
            "G3",
            "G4",
            "G5",
            "G6",
            "G7",
            "G8",
            "G9",
            "G10"
          ],
          "aspirate_x_position": 0,
          "aspirate_y_position": 0,
          "blowout_checkbox": false,
          "blowout_flowRate": null,
          "blowout_location": null,
          "blowout_z_offset": 0,
          "changeTip": "once",
          "dispense_airGap_checkbox": false,
          "dispense_airGap_volume": null,
          "dispense_delay_checkbox": false,
          "dispense_delay_mmFromBottom": null,
          "dispense_delay_seconds": "1",
          "dispense_flowRate": "716",
          "dispense_labware": "labware-2",
          "dispense_mix_checkbox": true,
          "dispense_mix_times": "5",
          "dispense_mix_volume": "75",
          "dispense_mmFromBottom": null,
          "dispense_touchTip_checkbox": false,
          "dispense_touchTip_mmFromBottom": null,
          "dispense_wellOrder_first": "t2b",
          "dispense_wellOrder_second": "l2r",
          "dispense_wells": [
            "G2",
            "G3",
            "G4",
            "G5",
            "G6",
            "G7",
            "G8",
            "G9",
            "G10",
            "G11"
          ],
          "dispense_x_position": 0,
          "dispense_y_position": 0,
          "disposalVolume_checkbox": true,
          "disposalVolume_volume": null,
          "dropTip_location": "trashbin-1",
          "nozzles": null,
          "path": "single",
          "pipette": "pipette_left",
          "preWetTip": false,
          "tipRack": "opentrons/opentrons_flex_96_filtertiprack_1000ul/1",
          "volume": "50",
          "id": "step-8",
          "stepType": "moveLiquid",
          "stepName": "Serial dilutions: Row 7",
          "stepDetails": ""
        },
        "step-9": {
          "aspirate_airGap_checkbox": true,
          "aspirate_airGap_volume": "10",
          "aspirate_delay_checkbox": false,
          "aspirate_delay_mmFromBottom": null,
          "aspirate_delay_seconds": "1",
          "aspirate_flowRate": "716",
          "aspirate_labware": "labware-2",
          "aspirate_mix_checkbox": false,
          "aspirate_mix_times": null,
          "aspirate_mix_volume": null,
          "aspirate_mmFromBottom": null,
          "aspirate_touchTip_checkbox": false,
          "aspirate_touchTip_mmFromBottom": null,
          "aspirate_wellOrder_first": "t2b",
          "aspirate_wellOrder_second": "l2r",
          "aspirate_wells_grouped": false,
          "aspirate_wells": [
            "H1",
            "H2",
            "H3",
            "H4",
            "H5",
            "H6",
            "H7",
            "H8",
            "H9",
            "H10"
          ],
          "aspirate_x_position": 0,
          "aspirate_y_position": 0,
          "blowout_checkbox": false,
          "blowout_flowRate": null,
          "blowout_location": null,
          "blowout_z_offset": 0,
          "changeTip": "once",
          "dispense_airGap_checkbox": false,
          "dispense_airGap_volume": null,
          "dispense_delay_checkbox": false,
          "dispense_delay_mmFromBottom": null,
          "dispense_delay_seconds": "1",
          "dispense_flowRate": "716",
          "dispense_labware": "labware-2",
          "dispense_mix_checkbox": true,
          "dispense_mix_times": "5",
          "dispense_mix_volume": "75",
          "dispense_mmFromBottom": null,
          "dispense_touchTip_checkbox": false,
          "dispense_touchTip_mmFromBottom": null,
          "dispense_wellOrder_first": "t2b",
          "dispense_wellOrder_second": "l2r",
          "dispense_wells": [
            "H2",
            "H3",
            "H4",
            "H5",
            "H6",
            "H7",
            "H8",
            "H9",
            "H10",
            "H11"
          ],
          "dispense_x_position": 0,
          "dispense_y_position": 0,
          "disposalVolume_checkbox": true,
          "disposalVolume_volume": null,
          "dropTip_location": "trashbin-1",
          "nozzles": null,
          "path": "single",
          "pipette": "pipette_left",
          "preWetTip": false,
          "tipRack": "opentrons/opentrons_flex_96_filtertiprack_1000ul/1",
          "volume": "50",
          "id": "step-9",
          "stepType": "moveLiquid",
          "stepName": "Serial dilutions: Row 8",
          "stepDetails": ""
        },
        "step-10": {
          "aspirate_airGap_checkbox": true,
          "aspirate_airGap_volume": "10",
          "aspirate_delay_checkbox": false,
          "aspirate_delay_mmFromBottom": null,
          "aspirate_delay_seconds": "1",
          "aspirate_flowRate": "716",
          "aspirate_labware": "labware-1",
          "aspirate_mix_checkbox": false,
          "aspirate_mix_times": null,
          "aspirate_mix_volume": null,
          "aspirate_mmFromBottom": null,
          "aspirate_touchTip_checkbox": false,
          "aspirate_touchTip_mmFromBottom": null,
          "aspirate_wellOrder_first": "t2b",
          "aspirate_wellOrder_second": "l2r",
          "aspirate_wells_grouped": false,
          "aspirate_wells": ["A1"],
          "aspirate_x_position": 0,
          "aspirate_y_position": 0,
          "blowout_checkbox": false,
          "blowout_flowRate": null,
          "blowout_location": null,
          "blowout_z_offset": 0,
          "changeTip": "once",
          "dispense_airGap_checkbox": false,
          "dispense_airGap_volume": null,
          "dispense_delay_checkbox": false,
          "dispense_delay_mmFromBottom": null,
          "dispense_delay_seconds": "1",
          "dispense_flowRate": null,
          "dispense_labware": "labware-2",
          "dispense_mix_checkbox": false,
          "dispense_mix_times": null,
          "dispense_mix_volume": null,
          "dispense_mmFromBottom": null,
          "dispense_touchTip_checkbox": false,
          "dispense_touchTip_mmFromBottom": null,
          "dispense_wellOrder_first": "t2b",
          "dispense_wellOrder_second": "l2r",
          "dispense_wells": [
            "A12",
            "B12",
            "C12",
            "D12",
            "E12",
            "F12",
            "G12",
            "H12"
          ],
          "dispense_x_position": 0,
          "dispense_y_position": 0,
          "disposalVolume_checkbox": true,
          "disposalVolume_volume": "5",
          "dropTip_location": "trashbin-1",
          "nozzles": null,
          "path": "multiDispense",
          "pipette": "pipette_left",
          "preWetTip": false,
          "tipRack": "opentrons/opentrons_flex_96_filtertiprack_1000ul/1",
          "volume": "100",
          "id": "step-10",
          "stepType": "moveLiquid",
          "stepName": "Add blank to last column",
          "stepDetails": ""
        }
      },
      "orderedStepIds": [
        "step-1",
        "step-2",
        "step-3",
        "step-4",
        "step-5",
        "step-6",
        "step-7",
        "step-8",
        "step-9",
        "step-10"
      ],
      "pipettes": {
        "pipette_left": {
          "pipetteName": "p1000_single_flex"
        }
      },
      "modules": {},
      "labware": {
        "labware-1": {
          "displayName": "NEST 12 Well Reservoir 15 mL",
          "labwareDefURI": "opentrons/nest_12_reservoir_15ml/1"
        },
        "labware-2": {
          "displayName": "NEST 96 Well Plate 200 µL Flat",
          "labwareDefURI": "opentrons/nest_96_wellplate_200ul_flat/2"
        },
        "labware-3": {
          "displayName": "Opentrons Flex 96 Filter Tip Rack 1000 µL",
          "labwareDefURI": "opentrons/opentrons_flex_96_filtertiprack_1000ul/1"
        },
        "labware-4": {
          "displayName": "Opentrons Flex 96 Filter Tip Rack 1000 µL (1)",
          "labwareDefURI": "opentrons/opentrons_flex_96_filtertiprack_1000ul/1"
        }
      }
    }
  },
  "robot": {
    "model": "OT-3 Standard",
    "deckId": "ot3_standard"
  }
}
```

</Example-serial-dilution>

4. <Example-serial-dilution-with-multi-channel>

Input

```text
Robot
- Flex

Pipette
- Left mount: p1000 multi-channel flex

Labware
- Tiprack-1: Opentrons Flex 96 Filter Tip Rack 1000 uL
- Tiprack-2: Opentrons Flex 96 Filter Tip Rack 1000 uL
- Plate: NEST 96 Well Plate 200 uL Flat
- Reservoir: NEST 12 Well Reservoir 15 mL

Liquids
- Reservoir well A1: Diluent liquid with green, 15 mL
- Well plate: Sample liquid with red, 200 uL in each well of column 1

Steps
1. Distribute 10 uL of diluent from reservoir column A1 to columns 2-11 of the plate
 - with 10 uL air gap during aspiration and 5 uL disposal volume
 - change tip before every aspirate
2. Transfer serially along Row A:
 - Transfer 50 uL from A1 to A2
 - Transfer 50 uL from A2 to A3
 - Continue this pattern through A10 to A11
 - Use 10 uL air gap during aspiration
 - Change tip only once at the start of the step
3. Add 100 uL diluent to column A12 of the plate
```

Output

```json
{
  "metadata": {
    "protocolName": "multi-channel serial dilution",
    "description": "multi-channel serial dilution - 8 channel"
  },
  "designerApplication": {
    "data": {
      "pipetteTiprackAssignments": {
        "pipette_left": ["opentrons/opentrons_flex_96_filtertiprack_1000ul/1"]
      },
      "ingredients": {
        "0": {
          "displayName": "Diluent liquid",
          "description": null,
          "displayColor": "#7eff42ff",
          "liquidGroupId": "0"
        },
        "1": {
          "displayName": "Sample liquid",
          "description": null,
          "displayColor": "#ff4f4fff",
          "liquidGroupId": "1"
        }
      },
      "ingredLocations": {
        "labware-4": {
          "A1": {
            "0": {
              "volume": 15000
            }
          }
        },
        "labware-3": {
          "A1": {
            "1": {
              "volume": 200
            }
          },
          "B1": {
            "1": {
              "volume": 200
            }
          },
          "C1": {
            "1": {
              "volume": 200
            }
          },
          "D1": {
            "1": {
              "volume": 200
            }
          },
          "E1": {
            "1": {
              "volume": 200
            }
          },
          "F1": {
            "1": {
              "volume": 200
            }
          },
          "G1": {
            "1": {
              "volume": 200
            }
          },
          "H1": {
            "1": {
              "volume": 200
            }
          }
        }
      },
      "savedStepForms": {
        "__INITIAL_DECK_SETUP_STEP__": {
          "labwareLocationUpdate": {
            "labware-1": "C2",
            "labware-2": "B2",
            "labware-3": "C1",
            "labware-4": "D1"
          },
          "pipetteLocationUpdate": {
            "pipette_left": "left"
          },
          "moduleLocationUpdate": {},
          "trashBinLocationUpdate": {
            "trashbin-1": "cutoutA3"
          },
          "wasteChuteLocationUpdate": {},
          "stagingAreaLocationUpdate": {},
          "gripperLocationUpdate": {}
        },
        "step-1": {
          "id": "step-1",
          "stepType": "moveLiquid",
          "stepName": "transfer",
          "stepDetails": "",
          "aspirate_airGap_checkbox": true,
          "aspirate_airGap_volume": "10",
          "aspirate_delay_checkbox": false,
          "aspirate_delay_mmFromBottom": null,
          "aspirate_delay_seconds": "1",
          "aspirate_flowRate": "716",
          "aspirate_labware": "labware-4",
          "aspirate_mix_checkbox": false,
          "aspirate_mix_times": null,
          "aspirate_mix_volume": null,
          "aspirate_mmFromBottom": null,
          "aspirate_touchTip_checkbox": false,
          "aspirate_touchTip_mmFromBottom": null,
          "aspirate_wellOrder_first": "t2b",
          "aspirate_wellOrder_second": "l2r",
          "aspirate_wells_grouped": false,
          "aspirate_wells": ["A1"],
          "aspirate_x_position": 0,
          "aspirate_y_position": 0,
          "blowout_checkbox": false,
          "blowout_flowRate": 716,
          "blowout_location": "trashbin-1",
          "blowout_z_offset": 0,
          "changeTip": "always",
          "dispense_airGap_checkbox": false,
          "dispense_airGap_volume": null,
          "dispense_delay_checkbox": false,
          "dispense_delay_mmFromBottom": null,
          "dispense_delay_seconds": "1",
          "dispense_flowRate": "716",
          "dispense_labware": "labware-3",
          "dispense_mix_checkbox": false,
          "dispense_mix_times": null,
          "dispense_mix_volume": null,
          "dispense_mmFromBottom": null,
          "dispense_touchTip_checkbox": false,
          "dispense_touchTip_mmFromBottom": null,
          "dispense_wellOrder_first": "t2b",
          "dispense_wellOrder_second": "l2r",
          "dispense_wells": [
            "A2",
            "A3",
            "A4",
            "A5",
            "A6",
            "A7",
            "A8",
            "A9",
            "A10",
            "A11"
          ],
          "dispense_x_position": 0,
          "dispense_y_position": 0,
          "disposalVolume_checkbox": true,
          "disposalVolume_volume": "5",
          "dropTip_location": "trashbin-1",
          "nozzles": null,
          "path": "multiDispense",
          "pipette": "pipette_left",
          "preWetTip": false,
          "tipRack": "opentrons/opentrons_flex_96_filtertiprack_1000ul/1",
          "volume": "10"
        },
        "step-2": {
          "id": "step-2",
          "stepType": "moveLiquid",
          "stepName": "transfer",
          "stepDetails": "",
          "aspirate_airGap_checkbox": true,
          "aspirate_airGap_volume": "10",
          "aspirate_delay_checkbox": false,
          "aspirate_delay_mmFromBottom": null,
          "aspirate_delay_seconds": "1",
          "aspirate_flowRate": "716",
          "aspirate_labware": "labware-3",
          "aspirate_mix_checkbox": false,
          "aspirate_mix_times": null,
          "aspirate_mix_volume": null,
          "aspirate_mmFromBottom": null,
          "aspirate_touchTip_checkbox": false,
          "aspirate_touchTip_mmFromBottom": null,
          "aspirate_wellOrder_first": "t2b",
          "aspirate_wellOrder_second": "l2r",
          "aspirate_wells_grouped": false,
          "aspirate_wells": [
            "A1",
            "A2",
            "A3",
            "A4",
            "A5",
            "A6",
            "A7",
            "A8",
            "A9",
            "A10"
          ],
          "aspirate_x_position": 0,
          "aspirate_y_position": 0,
          "blowout_checkbox": false,
          "blowout_flowRate": null,
          "blowout_location": null,
          "blowout_z_offset": 0,
          "changeTip": "once",
          "dispense_airGap_checkbox": false,
          "dispense_airGap_volume": null,
          "dispense_delay_checkbox": false,
          "dispense_delay_mmFromBottom": null,
          "dispense_delay_seconds": "1",
          "dispense_flowRate": null,
          "dispense_labware": "labware-3",
          "dispense_mix_checkbox": false,
          "dispense_mix_times": null,
          "dispense_mix_volume": null,
          "dispense_mmFromBottom": null,
          "dispense_touchTip_checkbox": false,
          "dispense_touchTip_mmFromBottom": null,
          "dispense_wellOrder_first": "t2b",
          "dispense_wellOrder_second": "l2r",
          "dispense_wells": [
            "A2",
            "A3",
            "A4",
            "A5",
            "A6",
            "A7",
            "A8",
            "A9",
            "A10",
            "A11"
          ],
          "dispense_x_position": 0,
          "dispense_y_position": 0,
          "disposalVolume_checkbox": true,
          "disposalVolume_volume": null,
          "dropTip_location": "trashbin-1",
          "nozzles": null,
          "path": "single",
          "pipette": "pipette_left",
          "preWetTip": false,
          "tipRack": "opentrons/opentrons_flex_96_filtertiprack_1000ul/1",
          "volume": "50"
        },
        "step-3": {
          "id": "step-3",
          "stepType": "moveLiquid",
          "stepName": "transfer",
          "stepDetails": "",
          "aspirate_airGap_checkbox": false,
          "aspirate_airGap_volume": null,
          "aspirate_delay_checkbox": false,
          "aspirate_delay_mmFromBottom": null,
          "aspirate_delay_seconds": "1",
          "aspirate_flowRate": "716",
          "aspirate_labware": "labware-4",
          "aspirate_mix_checkbox": false,
          "aspirate_mix_times": null,
          "aspirate_mix_volume": null,
          "aspirate_mmFromBottom": null,
          "aspirate_touchTip_checkbox": false,
          "aspirate_touchTip_mmFromBottom": null,
          "aspirate_wellOrder_first": "t2b",
          "aspirate_wellOrder_second": "l2r",
          "aspirate_wells_grouped": false,
          "aspirate_wells": ["A1"],
          "aspirate_x_position": 0,
          "aspirate_y_position": 0,
          "blowout_checkbox": false,
          "blowout_flowRate": null,
          "blowout_location": null,
          "blowout_z_offset": 0,
          "changeTip": "always",
          "dispense_airGap_checkbox": false,
          "dispense_airGap_volume": null,
          "dispense_delay_checkbox": false,
          "dispense_delay_mmFromBottom": null,
          "dispense_delay_seconds": "1",
          "dispense_flowRate": null,
          "dispense_labware": "labware-3",
          "dispense_mix_checkbox": false,
          "dispense_mix_times": null,
          "dispense_mix_volume": null,
          "dispense_mmFromBottom": null,
          "dispense_touchTip_checkbox": false,
          "dispense_touchTip_mmFromBottom": null,
          "dispense_wellOrder_first": "t2b",
          "dispense_wellOrder_second": "l2r",
          "dispense_wells": ["A12"],
          "dispense_x_position": 0,
          "dispense_y_position": 0,
          "disposalVolume_checkbox": true,
          "disposalVolume_volume": null,
          "dropTip_location": "trashbin-1",
          "nozzles": null,
          "path": "single",
          "pipette": "pipette_left",
          "preWetTip": false,
          "tipRack": "opentrons/opentrons_flex_96_filtertiprack_1000ul/1",
          "volume": "100"
        }
      },
      "orderedStepIds": ["step-1", "step-2", "step-3"],
      "pipettes": {
        "pipette_left": {
          "pipetteName": "p1000_multi_flex"
        }
      },
      "modules": {},
      "labware": {
        "labware-1": {
          "displayName": "Opentrons Flex 96 Filter Tip Rack 1000 µL",
          "labwareDefURI": "opentrons/opentrons_flex_96_filtertiprack_1000ul/1"
        },
        "labware-2": {
          "displayName": "Opentrons Flex 96 Filter Tip Rack 1000 µL (1)",
          "labwareDefURI": "opentrons/opentrons_flex_96_filtertiprack_1000ul/1"
        },
        "labware-3": {
          "displayName": "NEST 96 Well Plate 200 µL Flat",
          "labwareDefURI": "opentrons/nest_96_wellplate_200ul_flat/2"
        },
        "labware-4": {
          "displayName": "NEST 12 Well Reservoir 15 mL",
          "labwareDefURI": "opentrons/nest_12_reservoir_15ml/1"
        }
      }
    }
  }
}
```

</Example-serial-dilution-with-multi-channel>

5. <Example-PCR>

Input:

```text
Robot:
- Flex

Pipette mount:
- Left: Flex 8-Channel 1000 uL Pipette
- Right: Flex 8-channel 50 ul pipette

Modules:
- Thermocycler module
- Sample temperature module with Opentrons 96 Well Aluminum Block adapter
- Mastermix temperature module with Opentrons 96 Well Aluminum Block adapter

Labware:
- Source sample: Opentrons Tough 96 Well Plate 200 uL PCR Full Skirt placed on the sample temperature module
- Source mastermix: Opentrons Tough 96 Well Plate 200 uL PCR Full Skirt placed on the mastermix temperature module
- Destination: Opentrons Tough 96 Well Plate 200 uL PCR Full Skirt placed on thermocycler
- Opentrons Flex 96 Filter Tip Rack 1000 uL (left pipette)
- Opentrons Flex 96 Filter Tip Rack 50 uL (right pipette)

Liquids:
- Source sample: Add 200ul to each well of the first 9 columns
- Source mastermix: Add 200ul to each well of the first 9 columns

Steps:
1. Thermocycler:
  - Set the block temperature to 6 degree C.
  - Set the lid temperature to 55 degree C.
  - Open the lid.
2. Set the sample temperature module to 37 degree C.
3. Pause until temperature reached.
4. Set the mastermix temperature module to 10 C
5. Pause the protocol until temperature reached
6. Use right pipette to transfer 15 uL  of mastermix from source plate to destination plate. Wells are first 9 columns. Use the same tip for all transfers.
7. Use left pipette to transfer 10 ul of sample from the source to destination plate. Wells are first 9 columns. Mix the sample and mastermix of
25 ul total volume 9 times. Blow out to destination well. Use a new tip for each transfer.
```

Output:

```json
{
  "metadata": {
    "protocolName": "PCR-4-7-steps",
    "description": "PCR-4 with seven steps"
  },
  "designerApplication": {
    "data": {
      "pipetteTiprackAssignments": {
        "pipette_left": ["opentrons/opentrons_flex_96_filtertiprack_1000ul/1"],
        "pipette_right": ["opentrons/opentrons_flex_96_filtertiprack_50ul/1"]
      },
      "ingredients": {
        "0": {
          "displayName": "sample",
          "description": "sample liquid",
          "displayColor": "#b925ff",
          "liquidGroupId": "0"
        },
        "1": {
          "displayName": "mastermix liquid",
          "description": "mastermix liquid",
          "displayColor": "#ffd600",
          "liquidGroupId": "1"
        }
      },
      "ingredLocations": {
        "labware-4": {
          "A1": {
            "1": {
              "volume": 200
            }
          },
          "B1": {
            "1": {
              "volume": 200
            }
          },
          "C1": {
            "1": {
              "volume": 200
            }
          },
          "D1": {
            "1": {
              "volume": 200
            }
          },
          "E1": {
            "1": {
              "volume": 200
            }
          },
          "F1": {
            "1": {
              "volume": 200
            }
          },
          "G1": {
            "1": {
              "volume": 200
            }
          },
          "H1": {
            "1": {
              "volume": 200
            }
          },
          "A2": {
            "1": {
              "volume": 200
            }
          },
          "B2": {
            "1": {
              "volume": 200
            }
          },
          "C2": {
            "1": {
              "volume": 200
            }
          },
          "D2": {
            "1": {
              "volume": 200
            }
          },
          "E2": {
            "1": {
              "volume": 200
            }
          },
          "F2": {
            "1": {
              "volume": 200
            }
          },
          "G2": {
            "1": {
              "volume": 200
            }
          },
          "H2": {
            "1": {
              "volume": 200
            }
          },
          "A3": {
            "1": {
              "volume": 200
            }
          },
          "B3": {
            "1": {
              "volume": 200
            }
          },
          "C3": {
            "1": {
              "volume": 200
            }
          },
          "D3": {
            "1": {
              "volume": 200
            }
          },
          "E3": {
            "1": {
              "volume": 200
            }
          },
          "F3": {
            "1": {
              "volume": 200
            }
          },
          "G3": {
            "1": {
              "volume": 200
            }
          },
          "H3": {
            "1": {
              "volume": 200
            }
          },
          "A4": {
            "1": {
              "volume": 200
            }
          },
          "B4": {
            "1": {
              "volume": 200
            }
          },
          "C4": {
            "1": {
              "volume": 200
            }
          },
          "D4": {
            "1": {
              "volume": 200
            }
          },
          "E4": {
            "1": {
              "volume": 200
            }
          },
          "F4": {
            "1": {
              "volume": 200
            }
          },
          "G4": {
            "1": {
              "volume": 200
            }
          },
          "H4": {
            "1": {
              "volume": 200
            }
          },
          "A5": {
            "1": {
              "volume": 200
            }
          },
          "B5": {
            "1": {
              "volume": 200
            }
          },
          "C5": {
            "1": {
              "volume": 200
            }
          },
          "D5": {
            "1": {
              "volume": 200
            }
          },
          "E5": {
            "1": {
              "volume": 200
            }
          },
          "F5": {
            "1": {
              "volume": 200
            }
          },
          "G5": {
            "1": {
              "volume": 200
            }
          },
          "H5": {
            "1": {
              "volume": 200
            }
          },
          "A6": {
            "1": {
              "volume": 200
            }
          },
          "B6": {
            "1": {
              "volume": 200
            }
          },
          "C6": {
            "1": {
              "volume": 200
            }
          },
          "D6": {
            "1": {
              "volume": 200
            }
          },
          "E6": {
            "1": {
              "volume": 200
            }
          },
          "F6": {
            "1": {
              "volume": 200
            }
          },
          "G6": {
            "1": {
              "volume": 200
            }
          },
          "H6": {
            "1": {
              "volume": 200
            }
          },
          "A7": {
            "1": {
              "volume": 200
            }
          },
          "B7": {
            "1": {
              "volume": 200
            }
          },
          "C7": {
            "1": {
              "volume": 200
            }
          },
          "D7": {
            "1": {
              "volume": 200
            }
          },
          "E7": {
            "1": {
              "volume": 200
            }
          },
          "F7": {
            "1": {
              "volume": 200
            }
          },
          "G7": {
            "1": {
              "volume": 200
            }
          },
          "H7": {
            "1": {
              "volume": 200
            }
          },
          "A8": {
            "1": {
              "volume": 200
            }
          },
          "B8": {
            "1": {
              "volume": 200
            }
          },
          "C8": {
            "1": {
              "volume": 200
            }
          },
          "D8": {
            "1": {
              "volume": 200
            }
          },
          "E8": {
            "1": {
              "volume": 200
            }
          },
          "F8": {
            "1": {
              "volume": 200
            }
          },
          "G8": {
            "1": {
              "volume": 200
            }
          },
          "H8": {
            "1": {
              "volume": 200
            }
          },
          "A9": {
            "1": {
              "volume": 200
            }
          },
          "B9": {
            "1": {
              "volume": 200
            }
          },
          "C9": {
            "1": {
              "volume": 200
            }
          },
          "D9": {
            "1": {
              "volume": 200
            }
          },
          "E9": {
            "1": {
              "volume": 200
            }
          },
          "F9": {
            "1": {
              "volume": 200
            }
          },
          "G9": {
            "1": {
              "volume": 200
            }
          },
          "H9": {
            "1": {
              "volume": 200
            }
          }
        },
        "labware-6": {
          "A1": {
            "0": {
              "volume": 200
            }
          },
          "B1": {
            "0": {
              "volume": 200
            }
          },
          "C1": {
            "0": {
              "volume": 200
            }
          },
          "D1": {
            "0": {
              "volume": 200
            }
          },
          "E1": {
            "0": {
              "volume": 200
            }
          },
          "F1": {
            "0": {
              "volume": 200
            }
          },
          "G1": {
            "0": {
              "volume": 200
            }
          },
          "H1": {
            "0": {
              "volume": 200
            }
          },
          "A2": {
            "0": {
              "volume": 200
            }
          },
          "B2": {
            "0": {
              "volume": 200
            }
          },
          "C2": {
            "0": {
              "volume": 200
            }
          },
          "D2": {
            "0": {
              "volume": 200
            }
          },
          "E2": {
            "0": {
              "volume": 200
            }
          },
          "F2": {
            "0": {
              "volume": 200
            }
          },
          "G2": {
            "0": {
              "volume": 200
            }
          },
          "H2": {
            "0": {
              "volume": 200
            }
          },
          "A3": {
            "0": {
              "volume": 200
            }
          },
          "B3": {
            "0": {
              "volume": 200
            }
          },
          "C3": {
            "0": {
              "volume": 200
            }
          },
          "D3": {
            "0": {
              "volume": 200
            }
          },
          "E3": {
            "0": {
              "volume": 200
            }
          },
          "F3": {
            "0": {
              "volume": 200
            }
          },
          "G3": {
            "0": {
              "volume": 200
            }
          },
          "H3": {
            "0": {
              "volume": 200
            }
          },
          "A4": {
            "0": {
              "volume": 200
            }
          },
          "B4": {
            "0": {
              "volume": 200
            }
          },
          "C4": {
            "0": {
              "volume": 200
            }
          },
          "D4": {
            "0": {
              "volume": 200
            }
          },
          "E4": {
            "0": {
              "volume": 200
            }
          },
          "F4": {
            "0": {
              "volume": 200
            }
          },
          "G4": {
            "0": {
              "volume": 200
            }
          },
          "H4": {
            "0": {
              "volume": 200
            }
          },
          "A5": {
            "0": {
              "volume": 200
            }
          },
          "B5": {
            "0": {
              "volume": 200
            }
          },
          "C5": {
            "0": {
              "volume": 200
            }
          },
          "D5": {
            "0": {
              "volume": 200
            }
          },
          "E5": {
            "0": {
              "volume": 200
            }
          },
          "F5": {
            "0": {
              "volume": 200
            }
          },
          "G5": {
            "0": {
              "volume": 200
            }
          },
          "H5": {
            "0": {
              "volume": 200
            }
          },
          "A6": {
            "0": {
              "volume": 200
            }
          },
          "B6": {
            "0": {
              "volume": 200
            }
          },
          "C6": {
            "0": {
              "volume": 200
            }
          },
          "D6": {
            "0": {
              "volume": 200
            }
          },
          "E6": {
            "0": {
              "volume": 200
            }
          },
          "F6": {
            "0": {
              "volume": 200
            }
          },
          "G6": {
            "0": {
              "volume": 200
            }
          },
          "H6": {
            "0": {
              "volume": 200
            }
          },
          "A7": {
            "0": {
              "volume": 200
            }
          },
          "B7": {
            "0": {
              "volume": 200
            }
          },
          "C7": {
            "0": {
              "volume": 200
            }
          },
          "D7": {
            "0": {
              "volume": 200
            }
          },
          "E7": {
            "0": {
              "volume": 200
            }
          },
          "F7": {
            "0": {
              "volume": 200
            }
          },
          "G7": {
            "0": {
              "volume": 200
            }
          },
          "H7": {
            "0": {
              "volume": 200
            }
          },
          "A8": {
            "0": {
              "volume": 200
            }
          },
          "B8": {
            "0": {
              "volume": 200
            }
          },
          "C8": {
            "0": {
              "volume": 200
            }
          },
          "D8": {
            "0": {
              "volume": 200
            }
          },
          "E8": {
            "0": {
              "volume": 200
            }
          },
          "F8": {
            "0": {
              "volume": 200
            }
          },
          "G8": {
            "0": {
              "volume": 200
            }
          },
          "H8": {
            "0": {
              "volume": 200
            }
          },
          "A9": {
            "0": {
              "volume": 200
            }
          },
          "B9": {
            "0": {
              "volume": 200
            }
          },
          "C9": {
            "0": {
              "volume": 200
            }
          },
          "D9": {
            "0": {
              "volume": 200
            }
          },
          "E9": {
            "0": {
              "volume": 200
            }
          },
          "F9": {
            "0": {
              "volume": 200
            }
          },
          "G9": {
            "0": {
              "volume": 200
            }
          },
          "H9": {
            "0": {
              "volume": 200
            }
          }
        }
      },
      "savedStepForms": {
        "__INITIAL_DECK_SETUP_STEP__": {
          "stepType": "manualIntervention",
          "id": "__INITIAL_DECK_SETUP_STEP__",
          "labwareLocationUpdate": {
            "labware-1": "C2",
            "labware-2": "B2",
            "labware-3": "t-1",
            "labware-4": "labware-3",
            "labware-5": "t-2",
            "labware-6": "labware-5",
            "labware-7": "t-3"
          },
          "pipetteLocationUpdate": {
            "pipette_left": "left",
            "pipette_right": "right"
          },
          "moduleLocationUpdate": {
            "t-1": "C1",
            "t-2": "D1",
            "t-3": "B1"
          },
          "trashBinLocationUpdate": {
            "trashbin-1": "cutoutA3"
          },
          "wasteChuteLocationUpdate": {},
          "stagingAreaLocationUpdate": {},
          "gripperLocationUpdate": {}
        },
        "step-1": {
          "id": "step-1",
          "stepType": "thermocycler",
          "stepName": "thermocycler",
          "stepDetails": "",
          "blockIsActive": true,
          "blockIsActiveHold": false,
          "blockTargetTemp": "6",
          "blockTargetTempHold": null,
          "lidIsActive": true,
          "lidIsActiveHold": false,
          "lidOpen": true,
          "lidOpenHold": null,
          "lidTargetTemp": "55",
          "lidTargetTempHold": null,
          "moduleId": "t-3",
          "orderedProfileItems": [],
          "profileItemsById": {},
          "profileTargetLidTemp": null,
          "profileVolume": null,
          "thermocyclerFormType": "thermocyclerState"
        },
        "step-2": {
          "id": "step-2",
          "stepType": "temperature",
          "stepName": "temperature",
          "stepDetails": "",
          "moduleId": "t-1",
          "setTemperature": "true",
          "targetTemperature": "37"
        },
        "step-3": {
          "id": "step-3",
          "stepType": "pause",
          "stepName": "pause",
          "stepDetails": "",
          "moduleId": "t-1",
          "pauseAction": "untilTemperature",
          "pauseMessage": "",
          "pauseTemperature": "37",
          "pauseTime": null
        },
        "step-4": {
          "id": "step-4",
          "stepType": "temperature",
          "stepName": "temperature",
          "stepDetails": "",
          "moduleId": "t-2",
          "setTemperature": "true",
          "targetTemperature": "10"
        },
        "step-5": {
          "id": "step-5",
          "stepType": "pause",
          "stepName": "pause",
          "stepDetails": "",
          "moduleId": "t-2",
          "pauseAction": "untilTemperature",
          "pauseMessage": "",
          "pauseTemperature": "10",
          "pauseTime": null
        },
        "step-6": {
          "id": "step-6",
          "stepType": "moveLiquid",
          "stepName": "transfer",
          "stepDetails": "",
          "aspirate_airGap_checkbox": false,
          "aspirate_airGap_volume": null,
          "aspirate_delay_checkbox": false,
          "aspirate_delay_mmFromBottom": null,
          "aspirate_delay_seconds": "1",
          "aspirate_flowRate": "35",
          "aspirate_labware": "labware-4",
          "aspirate_mix_checkbox": false,
          "aspirate_mix_times": null,
          "aspirate_mix_volume": null,
          "aspirate_mmFromBottom": null,
          "aspirate_touchTip_checkbox": false,
          "aspirate_touchTip_mmFromBottom": null,
          "aspirate_wellOrder_first": "t2b",
          "aspirate_wellOrder_second": "l2r",
          "aspirate_wells_grouped": false,
          "aspirate_wells": [
            "A1",
            "A2",
            "A3",
            "A4",
            "A5",
            "A6",
            "A7",
            "A8",
            "A9"
          ],
          "aspirate_x_position": 0,
          "aspirate_y_position": 0,
          "blowout_checkbox": false,
          "blowout_flowRate": null,
          "blowout_location": null,
          "blowout_z_offset": 0,
          "changeTip": "once",
          "dispense_airGap_checkbox": false,
          "dispense_airGap_volume": null,
          "dispense_delay_checkbox": false,
          "dispense_delay_mmFromBottom": null,
          "dispense_delay_seconds": "1",
          "dispense_flowRate": null,
          "dispense_labware": "labware-7",
          "dispense_mix_checkbox": false,
          "dispense_mix_times": null,
          "dispense_mix_volume": null,
          "dispense_mmFromBottom": null,
          "dispense_touchTip_checkbox": false,
          "dispense_touchTip_mmFromBottom": null,
          "dispense_wellOrder_first": "t2b",
          "dispense_wellOrder_second": "l2r",
          "dispense_wells": [
            "A1",
            "A2",
            "A3",
            "A4",
            "A5",
            "A6",
            "A7",
            "A8",
            "A9"
          ],
          "dispense_x_position": 0,
          "dispense_y_position": 0,
          "disposalVolume_checkbox": true,
          "disposalVolume_volume": null,
          "dropTip_location": "trashbin-1",
          "nozzles": null,
          "path": "single",
          "pipette": "pipette_right",
          "preWetTip": false,
          "tipRack": "opentrons/opentrons_flex_96_filtertiprack_50ul/1",
          "volume": "15"
        },
        "step-7": {
          "id": "step-7",
          "stepType": "moveLiquid",
          "stepName": "transfer",
          "stepDetails": "",
          "aspirate_airGap_checkbox": false,
          "aspirate_airGap_volume": null,
          "aspirate_delay_checkbox": false,
          "aspirate_delay_mmFromBottom": null,
          "aspirate_delay_seconds": "1",
          "aspirate_flowRate": "716",
          "aspirate_labware": "labware-6",
          "aspirate_mix_checkbox": false,
          "aspirate_mix_times": null,
          "aspirate_mix_volume": null,
          "aspirate_mmFromBottom": null,
          "aspirate_touchTip_checkbox": false,
          "aspirate_touchTip_mmFromBottom": null,
          "aspirate_wellOrder_first": "t2b",
          "aspirate_wellOrder_second": "l2r",
          "aspirate_wells_grouped": false,
          "aspirate_wells": [
            "A1",
            "A2",
            "A3",
            "A4",
            "A5",
            "A6",
            "A7",
            "A8",
            "A9"
          ],
          "aspirate_x_position": 0,
          "aspirate_y_position": 0,
          "blowout_checkbox": true,
          "blowout_flowRate": 716,
          "blowout_location": "dest_well",
          "blowout_z_offset": 0,
          "changeTip": "always",
          "dispense_airGap_checkbox": false,
          "dispense_airGap_volume": null,
          "dispense_delay_checkbox": false,
          "dispense_delay_mmFromBottom": null,
          "dispense_delay_seconds": "1",
          "dispense_flowRate": "716",
          "dispense_labware": "labware-7",
          "dispense_mix_checkbox": true,
          "dispense_mix_times": "9",
          "dispense_mix_volume": "25",
          "dispense_mmFromBottom": null,
          "dispense_touchTip_checkbox": false,
          "dispense_touchTip_mmFromBottom": null,
          "dispense_wellOrder_first": "t2b",
          "dispense_wellOrder_second": "l2r",
          "dispense_wells": [
            "A1",
            "A2",
            "A3",
            "A4",
            "A5",
            "A6",
            "A7",
            "A8",
            "A9"
          ],
          "dispense_x_position": 0,
          "dispense_y_position": 0,
          "disposalVolume_checkbox": true,
          "disposalVolume_volume": null,
          "dropTip_location": "trashbin-1",
          "nozzles": null,
          "path": "single",
          "pipette": "pipette_left",
          "preWetTip": false,
          "tipRack": "opentrons/opentrons_flex_96_filtertiprack_1000ul/1",
          "volume": "10"
        }
      },
      "orderedStepIds": [
        "step-1",
        "step-2",
        "step-3",
        "step-4",
        "step-5",
        "step-6",
        "step-7"
      ],
      "pipettes": {
        "pipette_left": {
          "pipetteName": "p1000_multi_flex"
        },
        "pipette_right": {
          "pipetteName": "p50_multi_flex"
        }
      },
      "modules": {
        "t-1": {
          "model": "temperatureModuleV2"
        },
        "t-2": {
          "model": "temperatureModuleV2"
        },
        "t-3": {
          "model": "thermocyclerModuleV2"
        }
      },
      "labware": {
        "labware-1": {
          "displayName": "Opentrons Flex 96 Filter Tip Rack 1000 µL",
          "labwareDefURI": "opentrons/opentrons_flex_96_filtertiprack_1000ul/1"
        },
        "labware-2": {
          "displayName": "Opentrons Flex 96 Filter Tip Rack 50 µL",
          "labwareDefURI": "opentrons/opentrons_flex_96_filtertiprack_50ul/1"
        },
        "labware-3": {
          "displayName": "Opentrons 96 Well Aluminum Block",
          "labwareDefURI": "opentrons/opentrons_96_well_aluminum_block/1"
        },
        "labware-4": {
          "displayName": "Opentrons Tough 96 Well Plate 200 µL PCR Full Skirt",
          "labwareDefURI": "opentrons/opentrons_96_wellplate_200ul_pcr_full_skirt/2"
        },
        "labware-5": {
          "displayName": "Opentrons 96 Well Aluminum Block",
          "labwareDefURI": "opentrons/opentrons_96_well_aluminum_block/1"
        },
        "labware-6": {
          "displayName": "Opentrons Tough 96 Well Plate 200 µL PCR Full Skirt",
          "labwareDefURI": "opentrons/opentrons_96_wellplate_200ul_pcr_full_skirt/2"
        },
        "labware-7": {
          "displayName": "Opentrons Tough 96 Well Plate 200 µL PCR Full Skirt",
          "labwareDefURI": "opentrons/opentrons_96_wellplate_200ul_pcr_full_skirt/2"
        }
      }
    }
  },
  "robot": {
    "model": "OT-3 Standard",
    "deckId": "ot3_standard"
  }
}
```

</Example-PCR>

6. <Example-thermocycler-move-falcon-tubes>

Input

```text
Application:
- Basic aliquoting

Description:
- transfer

Pipette mount(s):
- flex_1channel_1000 is mounted on the left
- with the Flex Gripper

Modules:
- thermocyclerModuleV2 with opentrons_96_wellplate_200ul_pcr_full_skirt

Fixtures:
- Trash bin

Labware:
- opentrons_flex_96_filtertiprack_1000ul x 1
- opentrons_15_tuberack_falcon_15ml_conical x 4
- opentrons_96_wellplate_200ul_pcr_full_skirt x 1

Liquids:
- Liquid 1: Add 200 ul for each well of falcon tubes. Serialized from 1 to 60.

Steps
1. Using a new tip for each transfer, transfer 100ul of sample from up to 60 individual 15ml falcon tubes in a rack into a PCR plate. Add the samples column wise so A1 then B2 etc. Number each sample incrementally from 1 to 60

2. Thermocycler: open the lid

3. Using the gripper move the plate from the deck into the thermocycler

4. Thermocycler: close the lid

5. Set the Thermocycler block temperature to 99 C. Set the temperature of the lid to 105 C. Incubate the samples in the Thermocycler for 30 minutes then reduce the block and lid temperature to 5 C and 37C respectively

6. Hold for 5 minutes

7. Open the lid of the thermocycler

8. Using the gripper move the PCR plate to a space on the deck
```

Output

```json
{
  "metadata": {
    "protocolName": "Transfer",
    "description": "Moving 100ul of sample from 15ml falcon tubes into pcr plate, seal and digest"
  },
  "designerApplication": {
    "data": {
      "pipetteTiprackAssignments": {
        "pipette_left": ["opentrons/opentrons_flex_96_filtertiprack_1000ul/1"]
      },
      "ingredients": {
        "0": {
          "displayName": "sample",
          "description": null,
          "displayColor": "#50d5ffff",
          "liquidGroupId": "0"
        }
      },
      "ingredLocations": {
        "labware-4": {
          "A1": {
            "0": {
              "volume": 200
            }
          },
          "B1": {
            "0": {
              "volume": 200
            }
          },
          "C1": {
            "0": {
              "volume": 200
            }
          },
          "A2": {
            "0": {
              "volume": 200
            }
          },
          "B2": {
            "0": {
              "volume": 200
            }
          },
          "C2": {
            "0": {
              "volume": 200
            }
          },
          "A3": {
            "0": {
              "volume": 200
            }
          },
          "B3": {
            "0": {
              "volume": 200
            }
          },
          "C3": {
            "0": {
              "volume": 200
            }
          },
          "A4": {
            "0": {
              "volume": 200
            }
          },
          "B4": {
            "0": {
              "volume": 200
            }
          },
          "C4": {
            "0": {
              "volume": 200
            }
          },
          "A5": {
            "0": {
              "volume": 200
            }
          },
          "B5": {
            "0": {
              "volume": 200
            }
          },
          "C5": {
            "0": {
              "volume": 200
            }
          }
        },
        "labware-5": {
          "A1": {
            "0": {
              "volume": 200
            }
          },
          "B1": {
            "0": {
              "volume": 200
            }
          },
          "C1": {
            "0": {
              "volume": 200
            }
          },
          "A2": {
            "0": {
              "volume": 200
            }
          },
          "B2": {
            "0": {
              "volume": 200
            }
          },
          "C2": {
            "0": {
              "volume": 200
            }
          },
          "A3": {
            "0": {
              "volume": 200
            }
          },
          "B3": {
            "0": {
              "volume": 200
            }
          },
          "C3": {
            "0": {
              "volume": 200
            }
          },
          "A4": {
            "0": {
              "volume": 200
            }
          },
          "B4": {
            "0": {
              "volume": 200
            }
          },
          "C4": {
            "0": {
              "volume": 200
            }
          },
          "A5": {
            "0": {
              "volume": 200
            }
          },
          "B5": {
            "0": {
              "volume": 200
            }
          },
          "C5": {
            "0": {
              "volume": 200
            }
          }
        },
        "labware-6": {
          "A1": {
            "0": {
              "volume": 200
            }
          },
          "B1": {
            "0": {
              "volume": 200
            }
          },
          "C1": {
            "0": {
              "volume": 200
            }
          },
          "A2": {
            "0": {
              "volume": 200
            }
          },
          "B2": {
            "0": {
              "volume": 200
            }
          },
          "C2": {
            "0": {
              "volume": 200
            }
          },
          "A3": {
            "0": {
              "volume": 200
            }
          },
          "B3": {
            "0": {
              "volume": 200
            }
          },
          "C3": {
            "0": {
              "volume": 200
            }
          },
          "A4": {
            "0": {
              "volume": 200
            }
          },
          "B4": {
            "0": {
              "volume": 200
            }
          },
          "C4": {
            "0": {
              "volume": 200
            }
          },
          "A5": {
            "0": {
              "volume": 200
            }
          },
          "B5": {
            "0": {
              "volume": 200
            }
          },
          "C5": {
            "0": {
              "volume": 200
            }
          }
        },
        "labware-3": {
          "A1": {
            "0": {
              "volume": 200
            }
          },
          "B1": {
            "0": {
              "volume": 200
            }
          },
          "C1": {
            "0": {
              "volume": 200
            }
          },
          "A2": {
            "0": {
              "volume": 200
            }
          },
          "B2": {
            "0": {
              "volume": 200
            }
          },
          "C2": {
            "0": {
              "volume": 200
            }
          },
          "A3": {
            "0": {
              "volume": 200
            }
          },
          "B3": {
            "0": {
              "volume": 200
            }
          },
          "C3": {
            "0": {
              "volume": 200
            }
          },
          "A4": {
            "0": {
              "volume": 200
            }
          },
          "B4": {
            "0": {
              "volume": 200
            }
          },
          "C4": {
            "0": {
              "volume": 200
            }
          },
          "A5": {
            "0": {
              "volume": 200
            }
          },
          "B5": {
            "0": {
              "volume": 200
            }
          },
          "C5": {
            "0": {
              "volume": 200
            }
          }
        }
      },
      "savedStepForms": {
        "__INITIAL_DECK_SETUP_STEP__": {
          "labwareLocationUpdate": {
            "labware-1": "C1",
            "labware-2": "D1",
            "labware-3": "C2",
            "labware-4": "D2",
            "labware-5": "D3",
            "labware-6": "C3"
          },
          "pipetteLocationUpdate": {
            "pipette_left": "left"
          },
          "moduleLocationUpdate": {
            "tc-1": "B1"
          },
          "trashBinLocationUpdate": {
            "trashbin-1": "cutoutA3"
          },
          "wasteChuteLocationUpdate": {},
          "stagingAreaLocationUpdate": {},
          "gripperLocationUpdate": {
            "gripper-1": "mounted"
          }
        },
        "step-1": {
          "id": "step-1",
          "stepType": "moveLiquid",
          "stepName": "transfer",
          "stepDetails": "",
          "aspirate_airGap_checkbox": false,
          "aspirate_airGap_volume": null,
          "aspirate_delay_checkbox": false,
          "aspirate_delay_mmFromBottom": null,
          "aspirate_delay_seconds": "1",
          "aspirate_flowRate": "716",
          "aspirate_labware": "labware-4",
          "aspirate_mix_checkbox": false,
          "aspirate_mix_times": null,
          "aspirate_mix_volume": null,
          "aspirate_mmFromBottom": 1,
          "aspirate_touchTip_checkbox": false,
          "aspirate_touchTip_mmFromBottom": null,
          "aspirate_wellOrder_first": "t2b",
          "aspirate_wellOrder_second": "l2r",
          "aspirate_wells_grouped": false,
          "aspirate_wells": [
            "A1",
            "B1",
            "C1",
            "A2",
            "B2",
            "C2",
            "A3",
            "B3",
            "C3",
            "A4",
            "B4",
            "C4",
            "A5",
            "B5",
            "C5"
          ],
          "aspirate_x_position": 0,
          "aspirate_y_position": 0,
          "blowout_checkbox": false,
          "blowout_flowRate": null,
          "blowout_location": null,
          "blowout_z_offset": 0,
          "changeTip": "always",
          "dispense_airGap_checkbox": false,
          "dispense_airGap_volume": null,
          "dispense_delay_checkbox": false,
          "dispense_delay_mmFromBottom": null,
          "dispense_delay_seconds": "1",
          "dispense_flowRate": null,
          "dispense_labware": "labware-2",
          "dispense_mix_checkbox": false,
          "dispense_mix_times": null,
          "dispense_mix_volume": null,
          "dispense_mmFromBottom": null,
          "dispense_touchTip_checkbox": false,
          "dispense_touchTip_mmFromBottom": null,
          "dispense_wellOrder_first": "t2b",
          "dispense_wellOrder_second": "l2r",
          "dispense_wells": [
            "A1",
            "B1",
            "A2",
            "B2",
            "A3",
            "B3",
            "A4",
            "A5",
            "A6",
            "A7",
            "A8",
            "A9",
            "A10",
            "A11",
            "A12"
          ],
          "dispense_x_position": 0,
          "dispense_y_position": 0,
          "disposalVolume_checkbox": true,
          "disposalVolume_volume": null,
          "dropTip_location": "trashbin-1",
          "nozzles": null,
          "path": "single",
          "pipette": "pipette_left",
          "preWetTip": false,
          "tipRack": "opentrons/opentrons_flex_96_filtertiprack_1000ul/1",
          "volume": "100"
        },
        "step-2": {
          "id": "step-2",
          "stepType": "moveLiquid",
          "stepName": "transfer",
          "stepDetails": "",
          "aspirate_airGap_checkbox": false,
          "aspirate_airGap_volume": null,
          "aspirate_delay_checkbox": false,
          "aspirate_delay_mmFromBottom": null,
          "aspirate_delay_seconds": "1",
          "aspirate_flowRate": "716",
          "aspirate_labware": "labware-5",
          "aspirate_mix_checkbox": false,
          "aspirate_mix_times": null,
          "aspirate_mix_volume": null,
          "aspirate_mmFromBottom": 1,
          "aspirate_touchTip_checkbox": false,
          "aspirate_touchTip_mmFromBottom": null,
          "aspirate_wellOrder_first": "t2b",
          "aspirate_wellOrder_second": "l2r",
          "aspirate_wells_grouped": false,
          "aspirate_wells": [
            "A1",
            "B1",
            "C1",
            "A2",
            "B2",
            "C2",
            "A3",
            "B3",
            "C3",
            "A4",
            "B4",
            "C4",
            "A5",
            "B5",
            "C5"
          ],
          "aspirate_x_position": 0,
          "aspirate_y_position": 0,
          "blowout_checkbox": false,
          "blowout_flowRate": null,
          "blowout_location": null,
          "blowout_z_offset": 0,
          "changeTip": "always",
          "dispense_airGap_checkbox": false,
          "dispense_airGap_volume": null,
          "dispense_delay_checkbox": false,
          "dispense_delay_mmFromBottom": null,
          "dispense_delay_seconds": "1",
          "dispense_flowRate": null,
          "dispense_labware": "labware-2",
          "dispense_mix_checkbox": false,
          "dispense_mix_times": null,
          "dispense_mix_volume": null,
          "dispense_mmFromBottom": null,
          "dispense_touchTip_checkbox": false,
          "dispense_touchTip_mmFromBottom": null,
          "dispense_wellOrder_first": "t2b",
          "dispense_wellOrder_second": "l2r",
          "dispense_wells": [
            "C1",
            "C2",
            "C3",
            "B4",
            "C4",
            "B5",
            "C5",
            "B6",
            "C6",
            "B7",
            "B8",
            "B9",
            "B10",
            "B11",
            "B12"
          ],
          "dispense_x_position": 0,
          "dispense_y_position": 0,
          "disposalVolume_checkbox": true,
          "disposalVolume_volume": null,
          "dropTip_location": "trashbin-1",
          "nozzles": null,
          "path": "single",
          "pipette": "pipette_left",
          "preWetTip": false,
          "tipRack": "opentrons/opentrons_flex_96_filtertiprack_1000ul/1",
          "volume": "100"
        },
        "step-3": {
          "id": "step-3",
          "stepType": "moveLiquid",
          "stepName": "transfer",
          "stepDetails": "",
          "aspirate_airGap_checkbox": false,
          "aspirate_airGap_volume": null,
          "aspirate_delay_checkbox": false,
          "aspirate_delay_mmFromBottom": null,
          "aspirate_delay_seconds": "1",
          "aspirate_flowRate": "716",
          "aspirate_labware": "labware-6",
          "aspirate_mix_checkbox": false,
          "aspirate_mix_times": null,
          "aspirate_mix_volume": null,
          "aspirate_mmFromBottom": 1,
          "aspirate_touchTip_checkbox": false,
          "aspirate_touchTip_mmFromBottom": null,
          "aspirate_wellOrder_first": "t2b",
          "aspirate_wellOrder_second": "l2r",
          "aspirate_wells_grouped": false,
          "aspirate_wells": [
            "A1",
            "B1",
            "C1",
            "A2",
            "B2",
            "C2",
            "A3",
            "B3",
            "C3",
            "A4",
            "B4",
            "C4",
            "A5",
            "B5",
            "C5"
          ],
          "aspirate_x_position": 0,
          "aspirate_y_position": 0,
          "blowout_checkbox": false,
          "blowout_flowRate": null,
          "blowout_location": null,
          "blowout_z_offset": 0,
          "changeTip": "always",
          "dispense_airGap_checkbox": false,
          "dispense_airGap_volume": null,
          "dispense_delay_checkbox": false,
          "dispense_delay_mmFromBottom": null,
          "dispense_delay_seconds": "1",
          "dispense_flowRate": null,
          "dispense_labware": "labware-2",
          "dispense_mix_checkbox": false,
          "dispense_mix_times": null,
          "dispense_mix_volume": null,
          "dispense_mmFromBottom": null,
          "dispense_touchTip_checkbox": false,
          "dispense_touchTip_mmFromBottom": null,
          "dispense_wellOrder_first": "t2b",
          "dispense_wellOrder_second": "l2r",
          "dispense_wells": [
            "D1",
            "D2",
            "D3",
            "D4",
            "D5",
            "D6",
            "C7",
            "D7",
            "C8",
            "D8",
            "C9",
            "D9",
            "C10",
            "C11",
            "C12"
          ],
          "dispense_x_position": 0,
          "dispense_y_position": 0,
          "disposalVolume_checkbox": true,
          "disposalVolume_volume": null,
          "dropTip_location": "trashbin-1",
          "nozzles": null,
          "path": "single",
          "pipette": "pipette_left",
          "preWetTip": false,
          "tipRack": "opentrons/opentrons_flex_96_filtertiprack_1000ul/1",
          "volume": "100"
        },
        "step-4": {
          "id": "step-4",
          "stepType": "moveLiquid",
          "stepName": "transfer",
          "stepDetails": "",
          "aspirate_airGap_checkbox": false,
          "aspirate_airGap_volume": null,
          "aspirate_delay_checkbox": false,
          "aspirate_delay_mmFromBottom": null,
          "aspirate_delay_seconds": "1",
          "aspirate_flowRate": "716",
          "aspirate_labware": "labware-3",
          "aspirate_mix_checkbox": false,
          "aspirate_mix_times": null,
          "aspirate_mix_volume": null,
          "aspirate_mmFromBottom": 1,
          "aspirate_touchTip_checkbox": false,
          "aspirate_touchTip_mmFromBottom": null,
          "aspirate_wellOrder_first": "t2b",
          "aspirate_wellOrder_second": "l2r",
          "aspirate_wells_grouped": false,
          "aspirate_wells": [
            "A1",
            "B1",
            "C1",
            "A2",
            "B2",
            "C2",
            "A3",
            "B3",
            "C3",
            "A4",
            "B4",
            "C4",
            "A5",
            "B5",
            "C5"
          ],
          "aspirate_x_position": 0,
          "aspirate_y_position": 0,
          "blowout_checkbox": false,
          "blowout_flowRate": null,
          "blowout_location": null,
          "blowout_z_offset": 0,
          "changeTip": "always",
          "dispense_airGap_checkbox": false,
          "dispense_airGap_volume": null,
          "dispense_delay_checkbox": false,
          "dispense_delay_mmFromBottom": null,
          "dispense_delay_seconds": "1",
          "dispense_flowRate": null,
          "dispense_labware": "labware-2",
          "dispense_mix_checkbox": false,
          "dispense_mix_times": null,
          "dispense_mix_volume": null,
          "dispense_mmFromBottom": null,
          "dispense_touchTip_checkbox": false,
          "dispense_touchTip_mmFromBottom": null,
          "dispense_wellOrder_first": "t2b",
          "dispense_wellOrder_second": "l2r",
          "dispense_wells": [
            "E1",
            "E2",
            "E3",
            "E4",
            "E5",
            "E6",
            "E7",
            "E8",
            "E9",
            "D10",
            "E10",
            "D11",
            "E11",
            "D12",
            "E12"
          ],
          "dispense_x_position": 0,
          "dispense_y_position": 0,
          "disposalVolume_checkbox": true,
          "disposalVolume_volume": null,
          "dropTip_location": "trashbin-1",
          "nozzles": null,
          "path": "single",
          "pipette": "pipette_left",
          "preWetTip": false,
          "tipRack": "opentrons/opentrons_flex_96_filtertiprack_1000ul/1",
          "volume": "100"
        },
        "step-5": {
          "id": "step-5",
          "stepType": "thermocycler",
          "stepName": "thermocycler",
          "stepDetails": "",
          "blockIsActive": false,
          "blockIsActiveHold": false,
          "blockTargetTemp": null,
          "blockTargetTempHold": null,
          "lidIsActive": false,
          "lidIsActiveHold": false,
          "lidOpen": true,
          "lidOpenHold": null,
          "lidTargetTemp": null,
          "lidTargetTempHold": null,
          "moduleId": "tc-1",
          "orderedProfileItems": [],
          "profileItemsById": {},
          "profileTargetLidTemp": null,
          "profileVolume": null,
          "thermocyclerFormType": "thermocyclerState"
        },
        "step-6": {
          "id": "step-6",
          "stepType": "moveLabware",
          "stepName": "move",
          "stepDetails": "",
          "labware": "labware-2",
          "newLocation": "tc-1",
          "useGripper": true
        },
        "step-7": {
          "id": "step-7",
          "stepType": "thermocycler",
          "stepName": "thermocycler",
          "stepDetails": "",
          "blockIsActive": false,
          "blockIsActiveHold": false,
          "blockTargetTemp": "",
          "blockTargetTempHold": null,
          "lidIsActive": false,
          "lidIsActiveHold": false,
          "lidOpen": false,
          "lidOpenHold": null,
          "lidTargetTemp": "",
          "lidTargetTempHold": null,
          "moduleId": "tc-1",
          "orderedProfileItems": [],
          "profileItemsById": {},
          "profileTargetLidTemp": null,
          "profileVolume": null,
          "thermocyclerFormType": "thermocyclerState"
        },
        "step-8": {
          "id": "step-8",
          "stepType": "thermocycler",
          "stepName": "thermocycler",
          "stepDetails": "",
          "blockIsActive": false,
          "blockIsActiveHold": true,
          "blockTargetTemp": null,
          "blockTargetTempHold": "5",
          "lidIsActive": false,
          "lidIsActiveHold": true,
          "lidOpen": false,
          "lidOpenHold": null,
          "lidTargetTemp": null,
          "lidTargetTempHold": "37",
          "moduleId": "tc-1",
          "orderedProfileItems": ["ba55d5bf-6f64-43c0-a0f6-52f312c021e6"],
          "profileItemsById": {
            "ba55d5bf-6f64-43c0-a0f6-52f312c021e6": {
              "durationMinutes": "30",
              "durationSeconds": "00",
              "id": "ba55d5bf-6f64-43c0-a0f6-52f312c021e6",
              "temperature": "99",
              "title": "1",
              "type": "profileStep"
            }
          },
          "profileTargetLidTemp": "105",
          "profileVolume": "100",
          "thermocyclerFormType": "thermocyclerProfile"
        },
        "step-9": {
          "id": "step-9",
          "stepType": "pause",
          "stepName": "pause",
          "stepDetails": "",
          "moduleId": null,
          "pauseAction": "untilTime",
          "pauseMessage": "wait for 5 minutes",
          "pauseTemperature": null,
          "pauseTime": "00:05:00"
        },
        "step-10": {
          "id": "step-10",
          "stepType": "thermocycler",
          "stepName": "thermocycler",
          "stepDetails": "",
          "blockIsActive": false,
          "blockIsActiveHold": false,
          "blockTargetTemp": "",
          "blockTargetTempHold": null,
          "lidIsActive": false,
          "lidIsActiveHold": false,
          "lidOpen": true,
          "lidOpenHold": null,
          "lidTargetTemp": "",
          "lidTargetTempHold": null,
          "moduleId": "tc-1",
          "orderedProfileItems": [],
          "profileItemsById": {},
          "profileTargetLidTemp": null,
          "profileVolume": null,
          "thermocyclerFormType": "thermocyclerState"
        },
        "step-11": {
          "id": "step-11",
          "stepType": "moveLabware",
          "stepName": "move",
          "stepDetails": "",
          "labware": "labware-2",
          "newLocation": "D1",
          "useGripper": true
        }
      },
      "orderedStepIds": [
        "step-1",
        "step-2",
        "step-3",
        "step-4",
        "step-5",
        "step-6",
        "step-7",
        "step-8",
        "step-9",
        "step-10",
        "step-11"
      ],
      "pipettes": {
        "pipette_left": {
          "pipetteName": "p1000_single_flex"
        }
      },
      "modules": {
        "tc-1": {
          "model": "thermocyclerModuleV2"
        }
      },
      "labware": {
        "labware-1": {
          "displayName": "Opentrons Flex 96 Filter Tip Rack 1000 µL",
          "labwareDefURI": "opentrons/opentrons_flex_96_filtertiprack_1000ul/1"
        },
        "labware-2": {
          "displayName": "Opentrons Tough 96 Well Plate 200 µL PCR Full Skirt",
          "labwareDefURI": "opentrons/opentrons_96_wellplate_200ul_pcr_full_skirt/2"
        },
        "labware-3": {
          "displayName": "Opentrons 15 Tube Rack with Falcon 15 mL Conical",
          "labwareDefURI": "opentrons/opentrons_15_tuberack_falcon_15ml_conical/1"
        },
        "labware-4": {
          "displayName": "Opentrons 15 Tube Rack with Falcon 15 mL Conical (1)",
          "labwareDefURI": "opentrons/opentrons_15_tuberack_falcon_15ml_conical/1"
        },
        "labware-5": {
          "displayName": "Opentrons 15 Tube Rack with Falcon 15 mL Conical (2)",
          "labwareDefURI": "opentrons/opentrons_15_tuberack_falcon_15ml_conical/1"
        },
        "labware-6": {
          "displayName": "Opentrons 15 Tube Rack with Falcon 15 mL Conical (3)",
          "labwareDefURI": "opentrons/opentrons_15_tuberack_falcon_15ml_conical/1"
        }
      }
    }
  },
  "robot": {
    "model": "OT-3 Standard",
    "deckId": "ot3_standard"
  },
  "labwareDefinitions": {}
}
```

</Example-thermocycler-move-falcon-tubes>
