# Protocol Designer Documentation for OT-2 and Flex (LLM-friendly)

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
  "liquids": {},
  "robot": {},
  "commands": []
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
    "pipetteName": "" // pipette API name e.g., "p50_multi_flex"
  }
}
```

Define mount:

```json
"pipetteLocationUpdate": {"pipette_left": ""} // "left" or "right"
```

Define tiprack assignment:

```json
"pipetteTiprackAssignments": {
  "pipette_left": [
    "opentrons/opentrons_flex_96_filtertiprack_50ul/1"
  ]
}
```

Load pipette:

```json
"commands": [
  {
    "commandType": "loadPipette",
    "params": {
      "pipetteName": "",   // Must use exact API names from Protocol Designer docs
      "mount": "",         // Must be either "left" or "right"
      "pipetteId": ""      // Must be consistent across JSON
    }
  }
]
```

Note that pipette ID `pipette_left` must be consistent across different fields:
"pipettes", "pipetteLocationUpdate", and "commands".

#### Add modules (Common)

- Define module:

```json
"modules": {
  "module-1": {
    "model": "" // API model name e.g., "heaterShakerModuleV1"
  }
}
```

- Assign a slot:

```json
"moduleLocationUpdate": {
  "module-1": "D1"
}
```

- Load module:

```json
{
  "commandType": "loadModule",
  "params": {
    "model": "", // Must use exact module model API name e.g., "heaterShakerModuleV1"
    "moduleId": "module-1", // Must be consistent across JSON
    "location": {
      "slotName": "" // Must be string value from "A1, A2, A3, B1, B2, B3, C1, C2, C3, D1, D2, D3" for Flex, or "1-11" for OT-2
    }
  }
}
```

#### Add labware

- Define labware:

```json
"labware": {
  "labware-1": {
    "displayName": "Opentrons Flex 96 Filter Tip Rack 50 µL",
    "labwareDefURI": "opentrons/opentrons_flex_96_filtertiprack_50ul/1"
  }
}
```

- Assign a slot:

```json
"labwareLocationUpdate": {
  "labware-1": "C2"
}
```

- Load labware:

```json
"commands": [
  {
    "commandType": "loadLabware",
    "params": {
      "displayName": "",            // Human-readable labware name
      "labwareId": "labware-1",     // Must be consistent across JSON e.g., labware-1
      "loadName": "",               // Must use exact API names from Protocol Designer docs
      "namespace": "opentrons",     // Provider must always be opentrons
      "version": 1,                 // Version number
      "location": {
        "slotName": "C2"            // For Flex: Must be string value one of D1, D2, D3, C1, C2, C3, B1, B2, B3, A1, A2, A3
                                    // For OT-2: Value options are: 1-11
      }
    }
  }
]
```

#### Add liquid

Define liquid by filling out these fields:

```json
"ingredients": {
  "0": {   // Identifier for liquid - starting from "0"
    "displayName": "", // Display name e.g., "water"
    "description": "", // Description e.g., "samples for mixing"
    "displayColor": "", // Color e.g., #50d5ffff
    "liquidGroupId": "" // The same as ID e.g., "0"
  }
}
```

```json
"liquids": {
  "0": {
    "displayName": "", // Display name e.g., "water"
    "description": "", // Description e.g., "samples for mixing"
    "displayColor": "", // Color e.g., #50d5ffff
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

```json
"gripperLocationUpdate": {"gripper-1": "mounted"}
```

or if no gripper:

```json
"gripperLocationUpdate": {}
```

#### Add fixtures (Flex only)

Three types of fixtures; at least one of them must exist on the deck:

1. If `Trash Bin` is selected:

```json
"trashBinLocationUpdate": {"trashbin-1": "cutoutA3"}
```

else:

```json
"trashBinLocationUpdate": {},
```

2. If `Waste Chute` is selected:

```json
"wasteChuteLocationUpdate": {"wastechute-1": "cutoutD3"}
```

else:

```json
"wasteChuteLocationUpdate": {}
```

3. If `Staging Area` is selected:

```json
"stagingAreaLocationUpdate": {"stagingarea-1": "cutoutB3"}
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

3. Command Order:

   1. Load Pipettes
   2. Load Modules (if any)
   3. Load Labware

4. Identifier Consistency:

   - **Pipette Identifiers** must be consistent across:

     - `designerApplication.data.pipetteTiprackAssignments`
     - `savedStepForms.__INITIAL_DECK_SETUP_STEP__.pipetteLocationUpdate`
     - `data.pipettes`
     - `commands[].params.pipetteId`

   - **Labware Identifiers** must be consistent across:

     - `savedStepForms.__INITIAL_DECK_SETUP_STEP__.labwareLocationUpdate`
     - `data.labware`
     - `commands[].params.labwareId`

   - **Module Identifiers** must be consistent across:
     - `savedStepForms.__INITIAL_DECK_SETUP_STEP__.moduleLocationUpdate` (e.g., "hs-1")
     - `data.modules`
     - `commands[].params.moduleId`

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
  },
  "commands": [
    {
      "commandType": "loadPipette",
      "params": {
        "pipetteName": "p50_multi_flex",
        "mount": "left",
        "pipetteId": "pipette_left"
      }
    },
    {
      "commandType": "loadLabware",
      "params": {
        "displayName": "Opentrons Flex 96 Filter Tip Rack 50 µL",
        "labwareId": "labware-1",
        "loadName": "opentrons_flex_96_filtertiprack_50ul",
        "namespace": "opentrons",
        "version": 1,
        "location": {
          "slotName": "C2"
        }
      }
    }
  ]
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
    "protocolName": "Heater shaker load",
    "description": "Load heater shaker to the deck. No steps or commands."
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
          "gripperLocationUpdate": {
            "gripper-1": "mounted"
          }
        }
      },
      "orderedStepIds": [],
      "pipettes": {
        "pipette_left": {
          "pipetteName": "p50_multi_flex"
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
  },
  "commands": [
    {
      "commandType": "loadPipette",
      "params": {
        "pipetteName": "p50_multi_flex",
        "mount": "left",
        "pipetteId": "pipette_left"
      }
    },
    {
      "commandType": "loadModule",
      "params": {
        "model": "heaterShakerModuleV1",
        "location": {
          "slotName": "D1"
        },
        "moduleId": "hs-1"
      }
    },
    {
      "commandType": "loadLabware",
      "params": {
        "displayName": "Opentrons Flex 96 Filter Tip Rack 50 µL",
        "labwareId": "labware-1",
        "loadName": "opentrons_flex_96_filtertiprack_50ul",
        "namespace": "opentrons",
        "version": 1,
        "location": {
          "slotName": "C2"
        }
      }
    }
  ]
}
```

### Key Differences from Template

1. **Metadata Section**

   - Filled `protocolName` and `description` with heater-shaker specific information

2. **designerApplication.data Section**

   - **pipetteTiprackAssignments**: Added mapping for single pipette to tiprack
     ```json
     "pipette_left": ["opentrons/opentrons_96_tiprack_300ul/1"]
     ```
   - **savedStepForms**:
     - Added labware location: `"labware-1": "5"`
     - Added pipette location: `"pipette_left": "left"`
     - Added module location: `"hs-1": "1"`
     - Removed template `step-n` object
   - **orderedStepIds**: Remains empty array (no steps)

3. **robot Section**

   - Added specific model and deckId for OT-2
     ```json
     "model": "OT-2 Standard",
     "deckId": "ot2_standard"
     ```

4. **commands Section**

   - Added three specific commands in order:
     1. loadPipette command for P300 Single-Channel
     2. loadModule command for heater-shaker
     3. loadLabware command for tiprack
   - Each command uses consistent identifiers:
     - Pipette: "pipette_left"
     - Module: "hs-1"
     - Labware: "labware-1"

## Case 3: Load thermocycler module

### Input

```text
Metadata:
- ProtocolName: Load thermocycler module
- Description: Load thermocycler module to the deck. No steps or commands.

Robot:
- Flex

Pipette mount:
- Left: p50_multi_flex

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
        }
      },
      "orderedStepIds": [],
      "pipettes": {
        "pipette_left": {
          "pipetteName": "p50_multi_flex"
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
  },
  "commands": [
    {
      "commandType": "loadPipette",
      "params": {
        "pipetteName": "p50_multi_flex",
        "mount": "left",
        "pipetteId": "pipette_left"
      }
    },
    {
      "commandType": "loadModule",
      "params": {
        "model": "thermocyclerModuleV2",
        "location": {
          "slotName": "B1"
        },
        "moduleId": "tc-1"
      }
    },
    {
      "commandType": "loadLabware",
      "params": {
        "displayName": "Opentrons Flex 96 Filter Tip Rack 50 µL",
        "labwareId": "labware-1",
        "loadName": "opentrons_flex_96_filtertiprack_50ul",
        "namespace": "opentrons",
        "version": 1,
        "location": {
          "slotName": "C2"
        }
      }
    }
  ]
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
- right: p1000_single_flex

Gripper:
- No need

Module:
- temperatureModuleV2 in slot C1

Fixtures:
- Waste chute

Labware:
- opentrons_flex_96_filtertiprack_1000ul in slot C2
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
        "pipette_right": ["opentrons/opentrons_flex_96_filtertiprack_1000ul/1"]
      },
      "ingredients": {},
      "ingredLocations": {},
      "savedStepForms": {
        "__INITIAL_DECK_SETUP_STEP__": {
          "labwareLocationUpdate": {
            "labware-1": "C2"
          },
          "pipetteLocationUpdate": {
            "pipette_right": "right"
          },
          "moduleLocationUpdate": {
            "t-1": "C1"
          },
          "trashBinLocationUpdate": {},
          "wasteChuteLocationUpdate": {
            "wastechute-1": "cutoutD3"
          },
          "stagingAreaLocationUpdate": {},
          "gripperLocationUpdate": {}
        }
      },
      "orderedStepIds": [],
      "pipettes": {
        "pipette_right": {
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
  },
  "commands": [
    {
      "commandType": "loadPipette",
      "params": {
        "pipetteName": "p1000_single_flex",
        "mount": "right",
        "pipetteId": "pipette_right"
      }
    },
    {
      "commandType": "loadModule",
      "params": {
        "model": "temperatureModuleV2",
        "location": {
          "slotName": "C1"
        },
        "moduleId": "t-1"
      }
    },
    {
      "commandType": "loadLabware",
      "params": {
        "displayName": "Opentrons Flex 96 Filter Tip Rack 1000 µL",
        "labwareId": "labware-1",
        "loadName": "opentrons_flex_96_filtertiprack_1000ul",
        "namespace": "opentrons",
        "version": 1,
        "location": {
          "slotName": "C2"
        }
      }
    }
  ]
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
- opentrons_flex_96_filtertiprack_200ul in slot B2
```

### output

```json
{
  "metadata": {
    "protocolName": "Load two pipettes: left and right mounts",
    "description": "Load two pipettes to the left and right mounts. No steps and commands."
  },
  "designerApplication": {
    "data": {
      "pipetteTiprackAssignments": {
        "pipette_left": ["opentrons/opentrons_flex_96_tiprack_50ul/1"],
        "pipette_right": ["opentrons/opentrons_flex_96_filtertiprack_200ul/1"]
      },
      "ingredients": {},
      "ingredLocations": {},
      "savedStepForms": {
        "__INITIAL_DECK_SETUP_STEP__": {
          "labwareLocationUpdate": {
            "labware-1": "C2",
            "labware-2": "B2"
          },
          "pipetteLocationUpdate": {
            "pipette_left": "left",
            "pipette_right": "right"
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
        },
        "pipette_right": {
          "pipetteName": "p1000_multi_flex"
        }
      },
      "modules": {},
      "labware": {
        "labware-1": {
          "displayName": "Opentrons Flex 96 Tip Rack 50 µL",
          "labwareDefURI": "opentrons/opentrons_flex_96_tiprack_50ul/1"
        },
        "labware-2": {
          "displayName": "Opentrons Flex 96 Filter Tip Rack 200 µL",
          "labwareDefURI": "opentrons/opentrons_flex_96_filtertiprack_200ul/1"
        }
      }
    }
  },
  "robot": {
    "model": "OT-3 Standard",
    "deckId": "ot3_standard"
  },
  "commands": [
    {
      "commandType": "loadPipette",
      "params": {
        "pipetteName": "p50_single_flex",
        "mount": "left",
        "pipetteId": "pipette_left"
      }
    },
    {
      "commandType": "loadPipette",
      "params": {
        "pipetteName": "p1000_multi_flex",
        "mount": "right",
        "pipetteId": "pipette_right"
      }
    },
    {
      "commandType": "loadLabware",
      "params": {
        "displayName": "Opentrons Flex 96 Tip Rack 50 µL",
        "labwareId": "labware-1",
        "loadName": "opentrons_flex_96_tiprack_50ul",
        "namespace": "opentrons",
        "version": 1,
        "location": {
          "slotName": "C2"
        }
      }
    },
    {
      "commandType": "loadLabware",
      "params": {
        "displayName": "Opentrons Flex 96 Filter Tip Rack 200 µL",
        "labwareId": "labware-2",
        "loadName": "opentrons_flex_96_filtertiprack_200ul",
        "namespace": "opentrons",
        "version": 1,
        "location": {
          "slotName": "B2"
        }
      }
    }
  ]
}
```

## Case 6: Define liquid

### Input

```text
Metadata:
- ProtocolName: Basic protocol
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
    "protocolName": "Basic protocol",
    "description": "protocol with a pipette and tips and a tiprack. No steps."
  },
  "designerApplication": {
    "data": {
      "pipetteTiprackAssignments": {
        "pipette_left": ["opentrons/opentrons_flex_96_tiprack_50ul/1"]
      },
      "ingredients": {
        "0": {
          "displayName": "water",
          "description": "blue",
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
  },

  "liquids": {
    "0": {
      "displayName": "water",
      "description": "blue",
      "displayColor": "#50d5ffff"
    }
  },
  "commands": [
    {
      "commandType": "loadPipette",
      "params": {
        "pipetteName": "p50_single_flex",
        "mount": "left",
        "pipetteId": "pipette_left"
      }
    },
    {
      "commandType": "loadLabware",
      "params": {
        "displayName": "Opentrons Flex 96 Tip Rack 50 µL",
        "labwareId": "labware-1",
        "loadName": "opentrons_flex_96_tiprack_50ul",
        "namespace": "opentrons",
        "version": 1,
        "location": {
          "slotName": "C2"
        }
      }
    }
  ]
}
```

### Key Differences from Template

1. **Metadata Section**

   - Filled `protocolName` and `description` with basic protocol information

2. **designerApplication.data Section**

   - **pipetteTiprackAssignments**: Added mapping for multi-channel pipette to tiprack
     ```json
     "pipette-left": ["opentrons/opentrons_96_tiprack_300ul/1"]
     ```
   - **ingredients**: Added liquid definition for water
     ```json
     "0": {
       "name": "water",
       "displayColor": "#50d5ffff",
       "liquidClass": null,
       "description": "water",
       "serialize": false,
       "liquidGroupId": "0"
     }
     ```
   - **ingredLocations**: Remains empty object (no specific location assigned)
   - **savedStepForms**:
     - Added labware location: `"labware-1": "2"`
     - Added pipette location: `"pipette-left": "left"`
     - Included stepType and id fields
     - Removed template `step-n` object
   - **orderedStepIds**: Remains empty array (no steps)

3. **robot Section**

   - Added specific model and deckId for OT-2
     ```json
     "model": "OT-2 Standard",
     "deckId": "ot2_standard"
     ```

4. **commands Section**

   - Added two specific commands in order:
     1. loadPipette command for P300 Multi-Channel
     2. loadLabware command for tiprack
   - Each command uses consistent identifiers:
     - Pipette: "pipette-left"
     - Labware: "labware-1"

5. **Special Considerations**

   - Liquid definitions are stored in the ingredients object with unique identifiers
   - Each liquid has associated properties including color, description, and group ID
   - Liquid locations can be specified in ingredLocations when needed
   - Default blue color (#50d5ffff) assigned to water

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
- opentrons_flex_96_tiprack_200ul in slot C2
- nest_12_reservoir_15ml in slot B1

Liquid
- Add 13333 of water to A1 of the reservoir
```

### Output

```json
{
  "metadata": {
    "protocolName": "Add liquid",
    "description": "Add 13333ul of water to A1 of the reservoir"
  },
  "designerApplication": {
    "data": {
      "pipetteTiprackAssignments": {
        "pipette_left": ["opentrons/opentrons_flex_96_tiprack_200ul/1"]
      },
      "ingredients": {
        "0": {
          "displayName": "water",
          "description": "for mixing",
          "displayColor": "#50d5ffff",
          "liquidGroupId": "0"
        }
      },
      "ingredLocations": {
        "labware-2": {
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
            "labware-1": "C2",
            "labware-2": "B1"
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
          "pipetteName": "p1000_single_flex"
        }
      },
      "modules": {},
      "labware": {
        "labware-1": {
          "displayName": "Opentrons Flex 96 Tip Rack 200 µL",
          "labwareDefURI": "opentrons/opentrons_flex_96_tiprack_200ul/1"
        },
        "labware-2": {
          "displayName": "NEST 12 Well Reservoir 15 mL",
          "labwareDefURI": "opentrons/nest_12_reservoir_15ml/2"
        }
      }
    }
  },
  "robot": {
    "model": "OT-3 Standard",
    "deckId": "ot3_standard"
  },
  "liquids": {
    "0": {
      "displayName": "water",
      "description": "for mixing",
      "displayColor": "#50d5ffff"
    }
  },
  "commands": [
    {
      "commandType": "loadPipette",
      "params": {
        "pipetteName": "p1000_single_flex",
        "mount": "left",
        "pipetteId": "pipette_left"
      }
    },
    {
      "commandType": "loadLabware",
      "params": {
        "displayName": "Opentrons Flex 96 Tip Rack 200 µL",
        "labwareId": "labware-1",
        "loadName": "opentrons_flex_96_tiprack_200ul",
        "namespace": "opentrons",
        "version": 1,
        "location": {
          "slotName": "C2"
        }
      }
    },
    {
      "commandType": "loadLabware",
      "params": {
        "displayName": "NEST 12 Well Reservoir 15 mL",
        "labwareId": "labware-2",
        "loadName": "nest_12_reservoir_15ml",
        "namespace": "opentrons",
        "version": 2,
        "location": {
          "slotName": "B1"
        }
      }
    }
  ]
}
```

### Key Differences between Case 7 and Case 6

1. **Additional Labware**

   - Case 7 adds a NEST 12 Well Reservoir
   - Second labware appears in `labwareLocationUpdate` and `commands`

   ```json
   "labwareLocationUpdate": {
     "labware-2": "2",  // Tiprack
     "labware-1": "5"   // Reservoir (new)
   }
   ```

2. **ingredLocations Structure**

   - Case 6: Empty object `"ingredLocations": {}`
   - Case 7: Specifies liquid volume and location

   ```json
   "ingredLocations": {
     "labware-1": {
       "A1": {
         "0": {
           "volume": 10000
         }
       }
     }
   }
   ```

3. **commands Section**

   - Case 6: Two commands (loadPipette, loadLabware)
   - Case 7: Three commands:

     1. loadPipette command (unchanged)
     2. loadLabware for tiprack (unchanged)
     3. New loadLabware command for reservoir:

     ```json
     {
       "commandType": "loadLabware",
       "params": {
         "displayName": "NEST 12 Well Reservoir 15 mL",
         "labwareId": "labware-1",
         "loadName": "nest_12_reservoir_15ml",
         "namespace": "opentrons",
         "version": 1,
         "location": {
           "slotName": "5"
         }
       }
     }
     ```

4. **Labware Identifiers**

   - Case 7 introduces more complex labware identification:
     - Reservoir: "labware-1"
     - Tiprack: "labware-2"
   - These IDs must be consistent across:
     - `savedStepForms.labwareLocationUpdate`
     - `ingredLocations`
     - `commands[].params.labwareId`

5. **Special Considerations for Liquid Handling**

   - Case 7 demonstrates:
     - Well specification (A1)
     - Volume specification (10000 µL)
     - Liquid-labware association
     - Consistent liquid ID usage ("0" for water)

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
- heaterShakerModuleV1

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
    `</Adapters>`

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
        "pipette_left": ["opentrons/opentrons_flex_96_filtertiprack_200ul/1"]
      },
      "ingredients": {},
      "ingredLocations": {},
      "savedStepForms": {
        "__INITIAL_DECK_SETUP_STEP__": {
          "labwareLocationUpdate": {
            "labwareLocationUpdate": {
              "labware-1": "C2", // Tiprack adapter placed in slot C2
              "labware-2": "labware-1", // Tiprack placed on tiprack adapter (labware-1)
              "labware-3": "hs-1", // Universal flat adapter placed on heater-shaker module
              "labware-4": "labware-3" // Well plate placed on universal flat adapter (labware-3)
            }
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
          "displayName": "Opentrons Flex 96 Filter Tip Rack 200 µL",
          "labwareDefURI": "opentrons/opentrons_flex_96_filtertiprack_200ul/1"
        },
        "labware-3": {
          "displayName": "Opentrons Universal Flat Heater-Shaker Adapter",
          "labwareDefURI": "opentrons/opentrons_universal_flat_adapter/1"
        },
        "labware-4": {
          "displayName": "Corning 96 Well Plate 360 µL Flat",
          "labwareDefURI": "opentrons/corning_96_wellplate_360ul_flat/3"
        }
      }
    }
  },
  "robot": {
    "model": "OT-3 Standard",
    "deckId": "ot3_standard"
  },
  "liquids": {},
  "commands": [
    {
      "commandType": "loadPipette",
      "params": {
        "pipetteName": "p1000_96",
        "mount": "left",
        "pipetteId": "pipette_left"
      }
    },
    {
      "commandType": "loadModule",
      "params": {
        "model": "heaterShakerModuleV1",
        "location": {
          "slotName": "D1"
        },
        "moduleId": "hs-1"
      }
    },
    {
      "commandType": "loadLabware",
      "params": {
        "displayName": "Opentrons Flex 96 Tip Rack Adapter",
        "labwareId": "labware-1",
        "loadName": "opentrons_flex_96_tiprack_adapter",
        "namespace": "opentrons",
        "version": 1,
        "location": {
          "slotName": "C2"
        }
      }
    },
    {
      "commandType": "loadLabware",
      "params": {
        "displayName": "Opentrons Universal Flat Heater-Shaker Adapter",
        "labwareId": "labware-3",
        "loadName": "opentrons_universal_flat_adapter",
        "namespace": "opentrons",
        "version": 1,
        "location": {
          "moduleId": "hs-1"
        }
      }
    },
    {
      "commandType": "loadLabware",
      "params": {
        "displayName": "Opentrons Flex 96 Filter Tip Rack 200 µL",
        "labwareId": "labware-2",
        "loadName": "opentrons_flex_96_filtertiprack_200ul",
        "namespace": "opentrons",
        "version": 1,
        "location": {
          "labwareId": "labware-1"
        }
      }
    },
    {
      "commandType": "loadLabware",
      "params": {
        "displayName": "Corning 96 Well Plate 360 µL Flat",
        "labwareId": "labware-4",
        "loadName": "corning_96_wellplate_360ul_flat",
        "namespace": "opentrons",
        "version": 3,
        "location": {
          "labwareId": "labware-3"
        }
      }
    }
  ]
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
    "description": "Thermocycler with plate"
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
            "lw-filter-tiprack": "C2",
            "lw-wellplate": "tc-1"
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
        "lw-filter-tiprack": {
          "displayName": "Opentrons Flex 96 Filter Tip Rack 50 µL",
          "labwareDefURI": "opentrons/opentrons_flex_96_filtertiprack_50ul/1"
        },
        "lw-wellplate": {
          "displayName": "Opentrons Tough 96 Well Plate 200 µL PCR Full Skirt",
          "labwareDefURI": "opentrons/opentrons_96_wellplate_200ul_pcr_full_skirt/3"
        }
      }
    }
  },
  "robot": {
    "model": "OT-3 Standard",
    "deckId": "ot3_standard"
  },
  "commands": [
    {
      "commandType": "loadPipette",
      "params": {
        "pipetteName": "p1000_single_flex",
        "mount": "left",
        "pipetteId": "pipette_left"
      }
    },
    {
      "commandType": "loadModule",
      "params": {
        "model": "thermocyclerModuleV2",
        "location": {
          "slotName": "B1"
        },
        "moduleId": "tc-1"
      }
    },
    {
      "commandType": "loadLabware",
      "params": {
        "displayName": "Opentrons Flex 96 Filter Tip Rack 50 µL",
        "labwareId": "lw-filter-tiprack",
        "loadName": "opentrons_flex_96_filtertiprack_50ul",
        "namespace": "opentrons",
        "version": 1,
        "location": {
          "slotName": "C2"
        }
      }
    },
    {
      "commandType": "loadLabware",
      "params": {
        "displayName": "Opentrons Tough 96 Well Plate 200 µL PCR Full Skirt",
        "labwareId": "lw-wellplate",
        "loadName": "opentrons_96_wellplate_200ul_pcr_full_skirt",
        "namespace": "opentrons",
        "version": 3,
        "location": {
          "moduleId": "tc-1"
        }
      }
    }
  ]
}
```

### Key Differences from the Template

1. **Metadata Section**

   - Filled `protocolName` and `description` with thermocycler-specific information

2. **designerApplication.data Section**

   - **pipetteTiprackAssignments**: Added mapping for single-channel pipette

     ```json
     "pipette-left": ["opentrons/opentrons_96_tiprack_300ul/1"]
     ```

   - **savedStepForms**: Special labware location structure:

     ```json
     "labwareLocationUpdate": {
       "labware-1": "2",              // Tiprack in slot 2
       "labware-2": "module-tc-1"     // Well plate on thermocycler
     }
     ```

     - Added module location: `"module-tc-1": "7"`
     - Added pipette location: `"pipette-left": "left"`

3. **commands Section**

   - Added four specific commands in order:
     1. loadPipette command for P300 Single-Channel
     2. loadModule command for thermocycler
     3. loadLabware command for tiprack
     4. loadLabware command for PCR plate

4. **Special Features**

   - **Module-Based Labware Location**: PCR plate references module directly
     ```json
     "location": {
       "moduleId": "module-tc-1"
     }
     ```
   - **No Adapter Required**: Unlike heater-shaker, thermocycler doesn't need an adapter
   - **Slot Restrictions**: Thermocycler must be in slot 7

5. **Key Dependencies**

   - Direct Module → Well Plate relationship (no adapter needed)
   - Consistent module ID usage (`module-tc-1`)
   - Labware compatibility with thermocycler
   - Proper slot allocation considering thermocycler's space requirements (slots 7, 8, 10, 11)

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
- Temperature module C1
- Temperature module B1

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
    "description": "Temperature with plate"
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
            "tiprack-1": "C2",
            "aluminum-block-nest-2ml": "t-1",
            "adapter_temp_mod_deep_well": "t-2",
            "well_plate_nest_96_2ml": "adapter_temp_mod_deep_well"
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
        "tiprack-1": {
          "displayName": "Opentrons Flex 96 Tip Rack 1000 µL",
          "labwareDefURI": "opentrons/opentrons_flex_96_tiprack_1000ul/1"
        },
        "aluminum-block-nest-2ml": {
          "displayName": "Opentrons 24 Well Aluminum Block with NEST 2 mL Snapcap",
          "labwareDefURI": "opentrons/opentrons_24_aluminumblock_nest_2ml_snapcap/2"
        },
        "adapter_temp_mod_deep_well": {
          "displayName": "Opentrons 96 Deep Well Temperature Module Adapter",
          "labwareDefURI": "opentrons/opentrons_96_deep_well_temp_mod_adapter/1"
        },
        "well_plate_nest_96_2ml": {
          "displayName": "NEST 96 Deep Well Plate 2mL",
          "labwareDefURI": "opentrons/nest_96_wellplate_2ml_deep/3"
        }
      }
    }
  },
  "robot": {
    "model": "OT-3 Standard",
    "deckId": "ot3_standard"
  },
  "commands": [
    {
      "commandType": "loadPipette",
      "params": {
        "pipetteName": "p1000_multi_flex",
        "mount": "left",
        "pipetteId": "pipette_left"
      }
    },
    {
      "commandType": "loadModule",
      "params": {
        "model": "temperatureModuleV2",
        "location": {
          "slotName": "C1"
        },
        "moduleId": "t-1"
      }
    },
    {
      "commandType": "loadModule",
      "params": {
        "model": "temperatureModuleV2",
        "location": {
          "slotName": "B1"
        },
        "moduleId": "t-2"
      }
    },
    {
      "commandType": "loadLabware",
      "params": {
        "displayName": "Opentrons 96 Deep Well Temperature Module Adapter",
        "labwareId": "adapter_temp_mod_deep_well",
        "loadName": "opentrons_96_deep_well_temp_mod_adapter",
        "namespace": "opentrons",
        "version": 1,
        "location": {
          "moduleId": "t-2"
        }
      }
    },
    {
      "commandType": "loadLabware",
      "params": {
        "displayName": "Opentrons Flex 96 Tip Rack 1000 µL",
        "labwareId": "tiprack-1",
        "loadName": "opentrons_flex_96_tiprack_1000ul",
        "namespace": "opentrons",
        "version": 1,
        "location": {
          "slotName": "C2"
        }
      }
    },
    {
      "commandType": "loadLabware",
      "params": {
        "displayName": "Opentrons 24 Well Aluminum Block with NEST 2 mL Snapcap",
        "labwareId": "aluminum-block-nest-2ml",
        "loadName": "opentrons_24_aluminumblock_nest_2ml_snapcap",
        "namespace": "opentrons",
        "version": 2,
        "location": {
          "moduleId": "t-1"
        }
      }
    },
    {
      "commandType": "loadLabware",
      "params": {
        "displayName": "NEST 96 Deep Well Plate 2mL",
        "labwareId": "well_plate_nest_96_2ml",
        "loadName": "nest_96_wellplate_2ml_deep",
        "namespace": "opentrons",
        "version": 3,
        "location": {
          "labwareId": "adapter_temp_mod_deep_well"
        }
      }
    }
  ]
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
      "pipetteTiprackAssignments": {
        "pipette_left": ["opentrons/opentrons_flex_96_filtertiprack_50ul/1"]
      },
      "ingredients": {},
      "ingredLocations": {},
      "savedStepForms": {
        "__INITIAL_DECK_SETUP_STEP__": {
          "labwareLocationUpdate": {
            "lw-filter-tip-rack": "C2"
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
        "lw-filter-tip-rack": {
          "displayName": "Opentrons Flex 96 Filter Tip Rack 50 µL",
          "labwareDefURI": "opentrons/opentrons_flex_96_filtertiprack_50ul/1"
        }
      }
    }
  },
  "robot": {
    "model": "OT-3 Standard",
    "deckId": "ot3_standard"
  },
  "commands": [
    {
      "commandType": "loadPipette",
      "params": {
        "pipetteName": "p50_single_flex",
        "mount": "left",
        "pipetteId": "pipette_left"
      }
    },
    {
      "commandType": "loadModule",
      "params": {
        "model": "absorbanceReaderV1",
        "location": {
          "slotName": "B3"
        },
        "moduleId": "apr-1"
      }
    },
    {
      "commandType": "loadLabware",
      "params": {
        "displayName": "Opentrons Flex 96 Filter Tip Rack 50 µL",
        "labwareId": "lw-filter-tip-rack",
        "loadName": "opentrons_flex_96_filtertiprack_50ul",
        "namespace": "opentrons",
        "version": 1,
        "location": {
          "slotName": "C2"
        }
      }
    }
  ]
}
```

## Case 12: Load Magnetic Block Module (Flex only)

### Input

```text
Metadata:
  - protocolName: Load Magnetic Block module
  - description": Load Magnetic Block module

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
    "description": "Load Magnetic Block module"
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
            "lw-tiprack-1": "D1",
            "lw-wellplate-1": "magnetic-block-1"
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
        "lw-tiprack-1": {
          "displayName": "Opentrons Flex 96 Tip Rack 50 µL",
          "labwareDefURI": "opentrons/opentrons_flex_96_tiprack_50ul/1"
        },
        "lw-wellplate-1": {
          "displayName": "NEST 96 Well Plate 100 µL PCR Full Skirt",
          "labwareDefURI": "opentrons/nest_96_wellplate_100ul_pcr_full_skirt/3"
        }
      }
    }
  },
  "robot": {
    "model": "OT-3 Standard",
    "deckId": "ot3_standard"
  },
  "commands": [
    {
      "commandType": "loadPipette",
      "params": {
        "pipetteName": "p1000_multi_flex",
        "mount": "left",
        "pipetteId": "pipette_left"
      }
    },
    {
      "commandType": "loadModule",
      "params": {
        "model": "magneticBlockV1",
        "location": {
          "slotName": "D2"
        },
        "moduleId": "magnetic-block-1"
      }
    },
    {
      "commandType": "loadLabware",
      "params": {
        "displayName": "Opentrons Flex 96 Tip Rack 50 µL",
        "labwareId": "lw-tiprack-1",
        "loadName": "opentrons_flex_96_tiprack_50ul",
        "namespace": "opentrons",
        "version": 1,
        "location": {
          "slotName": "D1"
        }
      }
    },
    {
      "commandType": "loadLabware",
      "params": {
        "displayName": "NEST 96 Well Plate 100 µL PCR Full Skirt",
        "labwareId": "lw-wellplate-1",
        "loadName": "nest_96_wellplate_100ul_pcr_full_skirt",
        "namespace": "opentrons",
        "version": 3,
        "location": {
          "moduleId": "magnetic-block-1"
        }
      }
    }
  ]
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
            "lw-tiprack-1": "2"
          },
          "pipetteLocationUpdate": {
            "pipette_left": "left"
          },
          "moduleLocationUpdate": {
            "mm-1": "1"
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
        "mm-1": {
          "model": "magneticModuleV2"
        }
      },
      "labware": {
        "lw-tiprack-1": {
          "displayName": "Opentrons OT-2 96 Tip Rack 300 µL",
          "labwareDefURI": "opentrons/opentrons_96_tiprack_300ul/1"
        }
      }
    }
  },
  "robot": {
    "model": "OT-2 Standard",
    "deckId": "ot2_standard"
  },
  "commands": [
    {
      "commandType": "loadPipette",
      "params": {
        "pipetteName": "p300_multi_gen2",
        "mount": "left",
        "pipetteId": "pipette_left"
      }
    },
    {
      "commandType": "loadModule",
      "params": {
        "model": "magneticModuleV2",
        "location": {
          "slotName": "1"
        },
        "moduleId": "mm-1"
      }
    },
    {
      "commandType": "loadLabware",
      "params": {
        "displayName": "Opentrons OT-2 96 Tip Rack 300 µL",
        "labwareId": "lw-tiprack-1",
        "loadName": "opentrons_96_tiprack_300ul",
        "namespace": "opentrons",
        "version": 1,
        "location": {
          "slotName": "2"
        }
      }
    }
  ]
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

  // MODULE CONTROL
  "moduleId": "string", // Required - ID of the heater-shaker module

  // TEMPERATURE CONTROL
  "setHeaterShakerTemperature": boolean, // Whether to set temperature
  "targetHeaterShakerTemperature": "number-as-string" | null, // Temperature in °C (37-95°C)

  // SHAKE CONTROL
  "setShake": boolean, // Whether to shake
  "targetSpeed": "number-as-string" | null, // RPM for shaking (200-3000 RPM)

  // TIMER
  "heaterShakerSetTimer": boolean | null, // Whether to use a timer
  "heaterShakerTimer": "string" | null, // Time in seconds or minutes format

  // LATCH CONTROL
  "latchOpen": boolean // Whether the latch should be open (can't be open while shaking)
}
```

Additonal notes:

- Temperature range: 37-95°C
- Speed range: 200-3000 RPM
- The latch cannot be open while shaking
- Timer can be set to control duration of shaking/heating

### Input

```text
- ProtocolName: Heater-Shaker
- Description: Close the latch of Heater-Shaker module

Robot:
- Flex

Module:
- Heater-Shaker Module GEN1 in slot 1

Pipette Mount:
- Left mount: single channel pipette

Steps:
1. Close Heater-Shaker labware latch
```

### Output

```json
{
  "metadata": {
    "protocolName": "heaterShaker step",
    "description": "stepType: heaterShaker"
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
            "lw-tiprack-1": "C2"
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
        "lw-tiprack-1": {
          "displayName": "Opentrons Flex 96 Filter Tip Rack 50 µL",
          "labwareDefURI": "opentrons/opentrons_flex_96_filtertiprack_50ul/1"
        }
      }
    }
  },
  "robot": {
    "model": "OT-3 Standard",
    "deckId": "ot3_standard"
  },
  "commands": [
    {
      "commandType": "loadPipette",
      "params": {
        "pipetteName": "p50_single_flex",
        "mount": "left",
        "pipetteId": "pipette_left"
      }
    },
    {
      "commandType": "loadModule",
      "params": {
        "model": "heaterShakerModuleV1",
        "location": {
          "slotName": "D1"
        },
        "moduleId": "hs-1"
      }
    },
    {
      "commandType": "loadLabware",
      "params": {
        "displayName": "Opentrons Flex 96 Filter Tip Rack 50 µL",
        "labwareId": "lw-tiprack-1",
        "loadName": "opentrons_flex_96_filtertiprack_50ul",
        "namespace": "opentrons",
        "version": 1,
        "location": {
          "slotName": "C2"
        }
      }
    }
  ]
}
```

Example, lets shake for 2 mins and speed of 500tpm:

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
- Setting temperature to null or setting setTemperature to "false" will deactivate the module

### Input

```text
Metadata:
- ProtocolName: Load temperature step
- Description: Add a temerature step, by default it is deactivate

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
    "protocolName": "temperature",
    "description": "Steptype: temperature"
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
            "lw-tiprack-1": "C2"
          },
          "pipetteLocationUpdate": {
            "pipette_left": "left"
          },
          "moduleLocationUpdate": {
            "t-1": "C1"
          },
          "trashBinLocationUpdate": {
            "934601e3-b53d-480d-985b-199293ecf08e:trashBin": "cutoutA3"
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
          "pipetteName": "p50_single_flex"
        }
      },
      "modules": {
        "t-1": {
          "model": "temperatureModuleV2"
        }
      },
      "labware": {
        "lw-tiprack-1": {
          "displayName": "Opentrons Flex 96 Tip Rack 50 µL",
          "labwareDefURI": "opentrons/opentrons_flex_96_tiprack_50ul/1"
        }
      }
    }
  },
  "robot": {
    "model": "OT-3 Standard",
    "deckId": "ot3_standard"
  },
  "commands": [
    {
      "commandType": "loadPipette",
      "params": {
        "pipetteName": "p50_single_flex",
        "mount": "left",
        "pipetteId": "pipette_left"
      }
    },
    {
      "commandType": "loadModule",
      "params": {
        "model": "temperatureModuleV2",
        "location": {
          "slotName": "C1"
        },
        "moduleId": "t-1"
      }
    },
    {
      "commandType": "loadLabware",
      "params": {
        "displayName": "Opentrons Flex 96 Tip Rack 50 µL",
        "labwareId": "lw-tiprack-1",
        "loadName": "opentrons_flex_96_tiprack_50ul",
        "namespace": "opentrons",
        "version": 1,
        "location": {
          "slotName": "C2"
        }
      }
    }
  ]
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
    "protocolName": "thermocycler",
    "description": "Steptype: thermocycler"
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
          "stepType": "manualIntervention",
          "id": "__INITIAL_DECK_SETUP_STEP__",
          "labwareLocationUpdate": {
            "lw-tip-rack-1": "C2"
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
        "lw-tip-rack-1": {
          "displayName": "Opentrons Flex 96 Filter Tip Rack 1000 µL",
          "labwareDefURI": "opentrons/opentrons_flex_96_filtertiprack_1000ul/1"
        }
      }
    }
  },
  "robot": {
    "model": "OT-3 Standard",
    "deckId": "ot3_standard"
  },
  "commands": [
    {
      "commandType": "loadPipette",
      "params": {
        "pipetteName": "p1000_single_flex",
        "mount": "left",
        "pipetteId": "pipette_left"
      }
    },
    {
      "commandType": "loadModule",
      "params": {
        "model": "thermocyclerModuleV2",
        "location": {
          "slotName": "B1"
        },
        "moduleId": "tc-1"
      }
    },
    {
      "commandType": "loadLabware",
      "params": {
        "displayName": "Opentrons Flex 96 Filter Tip Rack 1000 µL",
        "labwareId": "lw-tip-rack-1",
        "loadName": "opentrons_flex_96_filtertiprack_1000ul",
        "namespace": "opentrons",
        "version": 1,
        "location": {
          "slotName": "C2"
        }
      }
    }
  ]
}
```

Thermocycler step with profile settings, for example

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

Ste would be something like below:

```json
{
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
      "9fd6374e-4136-42bf-8a27-336762d162bd",
      "4ad7046d-a676-46a1-90bb-215457b9e712",
      "7635bad9-026b-4c97-8b66-2f46bf29cc66"
    ],
    "profileItemsById": {
      "9fd6374e-4136-42bf-8a27-336762d162bd": {
        "id": "9fd6374e-4136-42bf-8a27-336762d162bd",
        "title": "",
        "steps": [
          {
            "durationMinutes": "00",
            "durationSeconds": "57",
            "id": "0899cc82-cffb-478f-9d31-987e6231385a",
            "temperature": "72",
            "title": "1",
            "type": "profileStep"
          }
        ],
        "type": "profileCycle",
        "repetitions": "1"
      },
      "4ad7046d-a676-46a1-90bb-215457b9e712": {
        "id": "4ad7046d-a676-46a1-90bb-215457b9e712",
        "title": "",
        "steps": [
          {
            "durationMinutes": "00",
            "durationSeconds": "09",
            "id": "3743db8e-f9f3-4e0d-b36f-e38e16ef3e68",
            "temperature": "75",
            "title": "1",
            "type": "profileStep"
          },
          {
            "durationMinutes": "00",
            "durationSeconds": "10",
            "id": "b5f62f15-cbfa-45fa-89a5-4fd13ee79b80",
            "temperature": "84",
            "title": "2",
            "type": "profileStep"
          },
          {
            "durationMinutes": "00",
            "durationSeconds": "43",
            "id": "9affb062-345c-4e1c-bfc3-707d200d8f5b",
            "temperature": "65",
            "title": "3",
            "type": "profileStep"
          }
        ],
        "type": "profileCycle",
        "repetitions": "12"
      },
      "7635bad9-026b-4c97-8b66-2f46bf29cc66": {
        "id": "7635bad9-026b-4c97-8b66-2f46bf29cc66",
        "title": "",
        "steps": [
          {
            "durationMinutes": "03",
            "durationSeconds": "00",
            "id": "874908cc-4e88-4450-8ca1-c722a0fe9cb8",
            "temperature": "62",
            "title": "1",
            "type": "profileStep"
          }
        ],
        "type": "profileCycle",
        "repetitions": "1"
      }
    },
    "profileTargetLidTemp": "91",
    "profileVolume": "25",
    "thermocyclerFormType": "thermocyclerProfile"
  }
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
  "referenceWavelengthActive": true, // Boolean to enable/disable reference wavelength

  // Fields for absorbanceReaderRead:
  "fileName": null, // Optional file name where results will be saved

  // Fields for absorbanceReaderLid:
  "lidOpen": null // true for opening the lid, false for closing the lid
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

mix step acceptes the following parameters:

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
  "pickUpTip_location": "string" | null, // Optional - location to pick up tips
  "pickUpTip_wellNames": ["A1", ...] | null, // Optional - specific wells to pick up tips from
  "dropTip_wellNames": ["A1", ...] | null, // Optional - specific wells to drop tips in

  // POSITIONING
  "mix_mmFromBottom": number | null, // Optional - distance from well bottom in mm (default: 0.5)
  "mix_x_position": number | null, // Optional - x position offset
  "mix_y_position": number | null, // Optional - y position offset

  // TOUCH TIP
  "mix_touchTip_checkbox": boolean, // Whether to touch tip after mixing
  "mix_touchTip_mmFromTop": number | null, // Optional - distance from well top in mm for touch tip

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

Additonal notes:

Let me search for details about the mix step type:

Search files...
Let me look for more details about the mix step:

Search files...
Let me search for additional information on the mix step limitations and configurations:

Search files...
Now let me look for ChangeTipOptions and WellOrderOptions:

Search files...
Now let me look for more details about the ChangeTipOptions and WellOrderOption:

Search files...
Let me also look for specific details about flow rates:

Search files...
Based on all the gathered information, I'll create a comprehensive specification for the mix step type:

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
  "pickUpTip_location": "string" | null, // Optional - location to pick up tips
  "pickUpTip_wellNames": ["A1", ...] | null, // Optional - specific wells to pick up tips from
  "dropTip_wellNames": ["A1", ...] | null, // Optional - specific wells to drop tips in

  // POSITIONING
  "mix_mmFromBottom": number | null, // Optional - distance from well bottom in mm (default: 0.5)
  "mix_x_position": number | null, // Optional - x position offset
  "mix_y_position": number | null, // Optional - y position offset

  // TOUCH TIP
  "mix_touchTip_checkbox": boolean, // Whether to touch tip after mixing
  "mix_touchTip_mmFromTop": number | null, // Optional - distance from well top in mm for touch tip

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
- ProtocolName: Step mix example
- Description: This protocol shows an example of mix step.

Robot:
- Flex

Pipette Mount:
- Left Mount: Flex 1-Channel 1000 µL

Labware:
- corning_96_wellplate_360ul_flat
- opentrons_flex_96_filtertiprack_50ul

Steps:
1. Mix 30uL five times in the first five wells from the first column of the well plate.
```

### Output

```json
{
  "metadata": {
    "protocolName": "mix",
    "description": "Steptype: mix"
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
            "lw-tiprack-1": "C2",
            "lw-wellplate-1": "C1"
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
          "aspirate_flowRate": "478",
          "blowout_checkbox": false,
          "blowout_flowRate": null,
          "blowout_location": null,
          "blowout_z_offset": 0,
          "changeTip": "always",
          "dispense_delay_checkbox": false,
          "dispense_delay_seconds": "1",
          "dispense_flowRate": null,
          "dropTip_location": "trashbin-1",
          "labware": "lw-wellplate-1",
          "liquidClassesSupported": true,
          "mix_mmFromBottom": 1,
          "mix_touchTip_checkbox": false,
          "mix_touchTip_mmFromTop": null,
          "mix_wellOrder_first": "t2b",
          "mix_wellOrder_second": "l2r",
          "mix_x_position": 0,
          "mix_y_position": 0,
          "nozzles": null,
          "pipette": "pipette_left",
          "times": "5",
          "tipRack": "opentrons/opentrons_flex_96_filtertiprack_50ul/1",
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
        "lw-tiprack-1": {
          "displayName": "Opentrons Flex 96 Filter Tip Rack 50 µL",
          "labwareDefURI": "opentrons/opentrons_flex_96_filtertiprack_50ul/1"
        },
        "lw-wellplate-1": {
          "displayName": "Corning 96 Well Plate 360 µL Flat",
          "labwareDefURI": "opentrons/corning_96_wellplate_360ul_flat/3"
        }
      }
    }
  },
  "robot": {
    "model": "OT-3 Standard",
    "deckId": "ot3_standard"
  },
  "commands": [
    {
      "commandType": "loadPipette",
      "params": {
        "pipetteName": "p1000_single_flex",
        "mount": "left",
        "pipetteId": "pipette_left"
      }
    },
    {
      "commandType": "loadLabware",
      "params": {
        "displayName": "Opentrons Flex 96 Filter Tip Rack 50 µL",
        "labwareId": "lw-tiprack-1",
        "loadName": "opentrons_flex_96_filtertiprack_50ul",
        "namespace": "opentrons",
        "version": 1,
        "location": {
          "slotName": "C2"
        }
      }
    },
    {
      "commandType": "loadLabware",
      "params": {
        "displayName": "Corning 96 Well Plate 360 µL Flat",
        "labwareId": "lw-wellplate-1",
        "loadName": "corning_96_wellplate_360ul_flat",
        "namespace": "opentrons",
        "version": 3,
        "location": {
          "slotName": "C1"
        }
      }
    }
  ]
}
```

### Remarks

For `changeTip`, `always` is the default.

## Case 19: Steptype: moveLabware (move)

moveLabware step takes the following parameters:

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
- Opentrons Flex 96 Tip Rack 1000 uL in C2

Pipette Mount:
- Left: p1000_single_flex

Steps:
1. Move the tip rack to slot A1
```

### Output

```json
{
  "metadata": {
    "protocolName": "move",
    "description": "stepype: movelabware"
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
            "lw-tip-rack-1": "C2"
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
          "labware": "lw-tip-rack-1",
          "newLocation": "A1",
          "useGripper": true
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
        "lw-tip-rack-1": {
          "displayName": "Opentrons Flex 96 Tip Rack 1000 µL",
          "labwareDefURI": "opentrons/opentrons_flex_96_tiprack_1000ul/1"
        }
      }
    }
  },
  "robot": {
    "model": "OT-3 Standard",
    "deckId": "ot3_standard"
  },
  "commands": [
    {
      "commandType": "loadPipette",
      "params": {
        "pipetteName": "p1000_single_flex",
        "mount": "left",
        "pipetteId": "pipette_left"
      }
    },
    {
      "commandType": "loadLabware",
      "params": {
        "displayName": "Opentrons Flex 96 Tip Rack 1000 µL",
        "labwareId": "lw-tip-rack-1",
        "loadName": "opentrons_flex_96_tiprack_1000ul",
        "namespace": "opentrons",
        "version": 1,
        "location": {
          "slotName": "C2"
        }
      }
    }
  ]
}
```

## Case 20: Steptype: pause

pause step accepts the following parameters:

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
  "pauseTime": "string", // Format: "HH:MM:SS" or "MM:SS"
  // Examples: "00:01:30" (1 min 30 sec) or "01:30" (1 min 30 sec)

  // FOR TEMPERATURE-BASED PAUSE (when pauseAction is "untilTemperature")
  "moduleId": "string", // Required - ID of the temperature/thermocycler/heater-shaker module
  "pauseTemperature": "string" // Required - target temperature to wait for
}
```

Search files...
Let me search for more details about the pause step constants:

Search files...
Let me search specifically for pause time format:

Search files...
Let me search for more info about PAUSE constants:

Search files...
Let me try one more specific search to find all PAUSE constants:

Search files...
Based on all the gathered information, I'll now create a comprehensive specification for the pause step type:

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
  "pauseTime": "string", // Format: "HH:MM:SS" not ("MM:SS")
  // Example: "00:01:30" (1 min 30 sec)

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
    "protocolName": "pause",
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
            "lw-tip-rack-1": "C2"
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
          "pauseMessage": "wait 21s please",
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
        "lw-tip-rack-1": {
          "displayName": "Opentrons Flex 96 Filter Tip Rack 1000 µL",
          "labwareDefURI": "opentrons/opentrons_flex_96_filtertiprack_1000ul/1"
        }
      }
    }
  },
  "robot": {
    "model": "OT-3 Standard",
    "deckId": "ot3_standard"
  },
  "commands": [
    {
      "commandType": "loadPipette",
      "params": {
        "pipetteName": "p1000_multi_flex",
        "mount": "left",
        "pipetteId": "pipette_left"
      }
    },
    {
      "commandType": "loadLabware",
      "params": {
        "displayName": "Opentrons Flex 96 Filter Tip Rack 1000 µL",
        "labwareId": "lw-tip-rack-1",
        "loadName": "opentrons_flex_96_filtertiprack_1000ul",
        "namespace": "opentrons",
        "version": 1,
        "location": {
          "slotName": "C2"
        }
      }
    }
  ]
}
```

## Case 21: Steptype: moveLiquid (transfer)

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
1. Using the single-channel pipette, transfer 20 uL from well A1 of the reservoir to wells of the first column of the well plate.
Use a new tip for each transfer.
```

### output

```json
{
  "metadata": {
    "protocolName": "moveLiquid-single-channel transfer ",
    "description": "transfer with single channel pipette"
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
            "lw-tiprack": "C2",
            "lw-nest-reservoir": "C1",
            "lw-wellplate": "D1"
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
          "aspirate_labware": "lw-nest-reservoir",
          "aspirate_mix_checkbox": false,
          "aspirate_mix_times": null,
          "aspirate_mix_volume": null,
          "aspirate_mmFromBottom": null,
          "aspirate_position_reference": null,
          "aspirate_retract_delay_seconds": null,
          "aspirate_retract_mmFromBottom": null,
          "aspirate_retract_speed": null,
          "aspirate_retract_x_position": 0,
          "aspirate_retract_y_position": 0,
          "aspirate_retract_position_reference": null,
          "aspirate_submerge_delay_seconds": null,
          "aspirate_submerge_speed": null,
          "aspirate_submerge_mmFromBottom": null,
          "aspirate_submerge_x_position": 0,
          "aspirate_submerge_y_position": 0,
          "aspirate_submerge_position_reference": null,
          "aspirate_touchTip_checkbox": false,
          "aspirate_touchTip_mmFromTop": null,
          "aspirate_touchTip_speed": null,
          "aspirate_touchTip_mmFromEdge": null,
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
          "dispense_labware": "lw-wellplate",
          "dispense_mix_checkbox": false,
          "dispense_mix_times": null,
          "dispense_mix_volume": null,
          "dispense_mmFromBottom": null,
          "dispense_position_reference": null,
          "dispense_retract_delay_seconds": null,
          "dispense_retract_mmFromBottom": null,
          "dispense_retract_speed": null,
          "dispense_retract_x_position": 0,
          "dispense_retract_y_position": 0,
          "dispense_retract_position_reference": null,
          "dispense_submerge_delay_seconds": null,
          "dispense_submerge_speed": null,
          "dispense_submerge_mmFromBottom": null,
          "dispense_submerge_x_position": 0,
          "dispense_submerge_y_position": 0,
          "dispense_submerge_position_reference": null,
          "dispense_touchTip_checkbox": false,
          "dispense_touchTip_mmFromTop": null,
          "dispense_touchTip_speed": null,
          "dispense_touchTip_mmFromEdge": null,
          "dispense_wellOrder_first": "t2b",
          "dispense_wellOrder_second": "l2r",
          "dispense_wells": ["A1", "B1", "C1", "D1", "E1", "F1", "G1", "H1"],
          "dispense_x_position": 0,
          "dispense_y_position": 0,
          "disposalVolume_checkbox": true,
          "disposalVolume_volume": null,
          "dropTip_location": "trashbin-1",
          "liquidClassesSupported": true,
          "liquidClass": null,
          "nozzles": null,
          "path": "single",
          "pipette": "pipette_left",
          "preWetTip": false,
          "pushOut_checkbox": null,
          "pushOut_volume": null,
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
        "lw-tiprack": {
          "displayName": "Opentrons Flex 96 Tip Rack 1000 µL",
          "labwareDefURI": "opentrons/opentrons_flex_96_tiprack_1000ul/1"
        },
        "lw-nest-reservoir": {
          "displayName": "NEST 12 Well Reservoir 15 mL",
          "labwareDefURI": "opentrons/nest_12_reservoir_15ml/2"
        },
        "lw-wellplate": {
          "displayName": "NEST 96 Well Plate 100 µL PCR Full Skirt",
          "labwareDefURI": "opentrons/nest_96_wellplate_100ul_pcr_full_skirt/3"
        }
      }
    }
  },
  "robot": {
    "model": "OT-3 Standard",
    "deckId": "ot3_standard"
  },
  "commands": [
    {
      "commandType": "loadPipette",
      "params": {
        "pipetteName": "p1000_single_flex",
        "mount": "left",
        "pipetteId": "pipette_left"
      }
    },
    {
      "commandType": "loadLabware",
      "params": {
        "displayName": "Opentrons Flex 96 Tip Rack 1000 µL",
        "labwareId": "lw-tiprack",
        "loadName": "opentrons_flex_96_tiprack_1000ul",
        "namespace": "opentrons",
        "version": 1,
        "location": {
          "slotName": "C2"
        }
      }
    },
    {
      "commandType": "loadLabware",
      "params": {
        "displayName": "NEST 12 Well Reservoir 15 mL",
        "labwareId": "lw-nest-reservoir",
        "loadName": "nest_12_reservoir_15ml",
        "namespace": "opentrons",
        "version": 2,
        "location": {
          "slotName": "C1"
        }
      }
    },
    {
      "commandType": "loadLabware",
      "params": {
        "displayName": "NEST 96 Well Plate 100 µL PCR Full Skirt",
        "labwareId": "lw-wellplate",
        "loadName": "nest_96_wellplate_100ul_pcr_full_skirt",
        "namespace": "opentrons",
        "version": 3,
        "location": {
          "slotName": "D1"
        }
      }
    }
  ]
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
"4743347b-e522-437e-b0c7-8494c1f7715c:trashBin"

If user chooses "Trash bin" for drop tip location:
"dropTip_location": "4743347b-e522-437e-b0c7-8494c1f7715c:trashBin"

## Case 22: Transfer (moveLiquid) step with a multi-channel pipette

Depending on a single or multi-channel, a well selection behaves differently.

- For a single-channel it works in terms of individuals wells, user can choose wells.
- For multi channel pipette, PD only works with column-wise. That is, you can select an individual column not a row.

### Input

```text
Robot: Configuration:
- Flex

Steps:
1. Using the multi-channel pipette, transfer 20 uL from well A1 of the reservoir to the first column of the well plate.
```

### Output

```json
{
  "metadata": {
    "protocolName": "multi-channel",
    "description": "multi-channel"
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
            "lw-tiprack-1": "C2",
            "lw-reservoir-1": "C1",
            "lw-wellpalte-1": "D1"
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
          "aspirate_labware": "lw-reservoir-1",
          "aspirate_mix_checkbox": false,
          "aspirate_mix_times": null,
          "aspirate_mix_volume": null,
          "aspirate_mmFromBottom": null,
          "aspirate_position_reference": null,
          "aspirate_retract_delay_seconds": null,
          "aspirate_retract_mmFromBottom": null,
          "aspirate_retract_speed": null,
          "aspirate_retract_x_position": 0,
          "aspirate_retract_y_position": 0,
          "aspirate_retract_position_reference": null,
          "aspirate_submerge_delay_seconds": null,
          "aspirate_submerge_speed": null,
          "aspirate_submerge_mmFromBottom": null,
          "aspirate_submerge_x_position": 0,
          "aspirate_submerge_y_position": 0,
          "aspirate_submerge_position_reference": null,
          "aspirate_touchTip_checkbox": false,
          "aspirate_touchTip_mmFromTop": null,
          "aspirate_touchTip_speed": null,
          "aspirate_touchTip_mmFromEdge": null,
          "aspirate_wellOrder_first": "t2b",
          "aspirate_wellOrder_second": "l2r",
          "aspirate_wells_grouped": false,
          "aspirate_wells": ["A3"],
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
          "dispense_labware": "lw-wellpalte-1",
          "dispense_mix_checkbox": false,
          "dispense_mix_times": null,
          "dispense_mix_volume": null,
          "dispense_mmFromBottom": null,
          "dispense_position_reference": null,
          "dispense_retract_delay_seconds": null,
          "dispense_retract_mmFromBottom": null,
          "dispense_retract_speed": null,
          "dispense_retract_x_position": 0,
          "dispense_retract_y_position": 0,
          "dispense_retract_position_reference": null,
          "dispense_submerge_delay_seconds": null,
          "dispense_submerge_speed": null,
          "dispense_submerge_mmFromBottom": null,
          "dispense_submerge_x_position": 0,
          "dispense_submerge_y_position": 0,
          "dispense_submerge_position_reference": null,
          "dispense_touchTip_checkbox": false,
          "dispense_touchTip_mmFromTop": null,
          "dispense_touchTip_speed": null,
          "dispense_touchTip_mmFromEdge": null,
          "dispense_wellOrder_first": "t2b",
          "dispense_wellOrder_second": "l2r",
          "dispense_wells": ["A1"],
          "dispense_x_position": 0,
          "dispense_y_position": 0,
          "disposalVolume_checkbox": true,
          "disposalVolume_volume": null,
          "dropTip_location": "trashbin-1",
          "liquidClassesSupported": true,
          "liquidClass": null,
          "nozzles": "ALL",
          "path": "single",
          "pipette": "pipette_left",
          "preWetTip": false,
          "pushOut_checkbox": null,
          "pushOut_volume": null,
          "tipRack": "opentrons/opentrons_flex_96_filtertiprack_200ul/1",
          "volume": "54"
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
        "lw-tiprack-1": {
          "displayName": "Opentrons Flex 96 Filter Tip Rack 200 µL",
          "labwareDefURI": "opentrons/opentrons_flex_96_filtertiprack_200ul/1"
        },
        "lw-reservoir-1": {
          "displayName": "USA Scientific 12 Well Reservoir 22 mL",
          "labwareDefURI": "opentrons/usascientific_12_reservoir_22ml/2"
        },
        "lw-wellpalte-1": {
          "displayName": "NEST 96 Well Plate 100 µL PCR Full Skirt",
          "labwareDefURI": "opentrons/nest_96_wellplate_100ul_pcr_full_skirt/3"
        }
      }
    }
  },
  "robot": {
    "model": "OT-3 Standard",
    "deckId": "ot3_standard"
  },
  "commands": [
    {
      "commandType": "loadPipette",
      "params": {
        "pipetteName": "p1000_multi_flex",
        "mount": "left",
        "pipetteId": "pipette_left"
      }
    },
    {
      "commandType": "loadLabware",
      "params": {
        "displayName": "Opentrons Flex 96 Filter Tip Rack 200 µL",
        "labwareId": "lw-tiprack-1",
        "loadName": "opentrons_flex_96_filtertiprack_200ul",
        "namespace": "opentrons",
        "version": 1,
        "location": {
          "slotName": "C2"
        }
      }
    },
    {
      "commandType": "loadLabware",
      "params": {
        "displayName": "USA Scientific 12 Well Reservoir 22 mL",
        "labwareId": "lw-reservoir-1",
        "loadName": "usascientific_12_reservoir_22ml",
        "namespace": "opentrons",
        "version": 2,
        "location": {
          "slotName": "C1"
        }
      }
    },
    {
      "commandType": "loadLabware",
      "params": {
        "displayName": "NEST 96 Well Plate 100 µL PCR Full Skirt",
        "labwareId": "lw-wellpalte-1",
        "loadName": "nest_96_wellplate_100ul_pcr_full_skirt",
        "namespace": "opentrons",
        "version": 3,
        "location": {
          "slotName": "D1"
        }
      }
    }
  ]
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

Note that remaining parts are removed for brevity

```json
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
  "pauseMessage": "wait please",
  "pauseTemperature": "7",
  "pauseTime": null
}
```

### Remarks

- It is recommended that after temperature step, one needs to use `pause` step.
- When we initiate the temperature module, be default it is deactivated.

## Examples for OT-2 and Flex

<Example1-for-OT2-with-all-modules>
All OT-2 modules involved

```json
{
  "metadata": {
    "protocolName": "All Modules OT-2",
    "description": "in JSON"
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
            "lw-tiprack--1": "5"
          },
          "pipetteLocationUpdate": {
            "pipette_left": "left"
          },
          "moduleLocationUpdate": {
            "hs-1": "1",
            "mm-1": "9",
            "t-1": "3",
            "tc-1": "7"
          },
          "trashBinLocationUpdate": {
            "trashbin-1": "cutout12"
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
          "heaterShakerSetTimer": true,
          "heaterShakerTimer": "10:10",
          "latchOpen": false,
          "moduleId": "hs-1",
          "setHeaterShakerTemperature": true,
          "setShake": true,
          "targetHeaterShakerTemperature": "40",
          "targetSpeed": "500"
        },
        "step-2": {
          "id": "step-2",
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
        },
        "step-3": {
          "id": "step-3",
          "stepType": "magnet",
          "stepName": "magnet",
          "stepDetails": "",
          "engageHeight": "10",
          "magnetAction": "engage",
          "moduleId": "mm-1"
        },
        "step-5": {
          "id": "step-5",
          "stepType": "magnet",
          "stepName": "magnet",
          "stepDetails": "",
          "engageHeight": "10",
          "magnetAction": "disengage",
          "moduleId": "mm-1"
        },
        "step-4": {
          "id": "step-4",
          "stepType": "pause",
          "stepName": "pause",
          "stepDetails": "",
          "moduleId": null,
          "pauseAction": "untilTime",
          "pauseMessage": "",
          "pauseTemperature": null,
          "pauseTime": "00:01:00"
        },
        "step-6": {
          "id": "step-6",
          "stepType": "temperature",
          "stepName": "temperature",
          "stepDetails": "",
          "moduleId": "t-1",
          "setTemperature": "true",
          "targetTemperature": "20"
        },
        "step-7": {
          "id": "step-7",
          "stepType": "pause",
          "stepName": "pause",
          "stepDetails": "",
          "moduleId": "t-1",
          "pauseAction": "untilTemperature",
          "pauseMessage": "",
          "pauseTemperature": "20",
          "pauseTime": null
        },
        "step-8": {
          "id": "step-8",
          "stepType": "temperature",
          "stepName": "temperature",
          "stepDetails": "",
          "moduleId": "t-1",
          "setTemperature": null,
          "targetTemperature": null
        },
        "step-9": {
          "id": "step-9",
          "stepType": "thermocycler",
          "stepName": "thermocycler",
          "stepDetails": "",
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
          "thermocyclerFormType": "thermocyclerState"
        },
        "step-10": {
          "id": "step-10",
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
          "lidOpenHold": null,
          "lidTargetTemp": null,
          "lidTargetTempHold": null,
          "moduleId": "tc-1",
          "orderedProfileItems": ["ae049fa3-37f2-4764-8a42-ff56c3c22916"],
          "profileItemsById": {
            "ae049fa3-37f2-4764-8a42-ff56c3c22916": {
              "id": "ae049fa3-37f2-4764-8a42-ff56c3c22916",
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
          "thermocyclerFormType": "thermocyclerProfile"
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
        "mm-1": {
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
        "lw-tiprack--1": {
          "displayName": "Opentrons OT-2 96 Tip Rack 300 µL",
          "labwareDefURI": "opentrons/opentrons_96_tiprack_300ul/1"
        }
      }
    }
  },
  "commands": [
    {
      "commandType": "loadPipette",
      "params": {
        "pipetteName": "p300_single",
        "mount": "left",
        "pipetteId": "pipette_left"
      }
    },
    {
      "commandType": "loadModule",
      "params": {
        "model": "heaterShakerModuleV1",
        "location": {
          "slotName": "1"
        },
        "moduleId": "hs-1"
      }
    },
    {
      "commandType": "loadModule",
      "params": {
        "model": "magneticModuleV2",
        "location": {
          "slotName": "9"
        },
        "moduleId": "mm-1"
      }
    },
    {
      "commandType": "loadModule",
      "params": {
        "model": "temperatureModuleV2",
        "location": {
          "slotName": "3"
        },
        "moduleId": "t-1"
      }
    },
    {
      "commandType": "loadModule",
      "params": {
        "model": "thermocyclerModuleV2",
        "location": {
          "slotName": "7"
        },
        "moduleId": "tc-1"
      }
    },
    {
      "commandType": "loadLabware",
      "params": {
        "displayName": "Opentrons OT-2 96 Tip Rack 300 µL",
        "labwareId": "lw-tiprack--1",
        "loadName": "opentrons_96_tiprack_300ul",
        "namespace": "opentrons",
        "version": 1,
        "location": {
          "slotName": "5"
        }
      }
    }
  ]
}
```

</Example1-for-OT2-with-all-modules>

<Example2-for-Flex-with-all-modules>
All Flex modules involved

```json
{
  "metadata": {
    "protocolName": "AllModuleFlex",
    "description": ""
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
            "lw-tiprack-1": "D3",
            "lw-wellplate-1": "C3"
          },
          "pipetteLocationUpdate": {
            "pipette_left": "left"
          },
          "moduleLocationUpdate": {
            "arp-1": "B3",
            "hs-1": "D1",
            "t-1": "C1",
            "mb-1": "D2",
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
          "stepType": "heaterShaker",
          "stepName": "heater-shaker",
          "stepDetails": "",
          "heaterShakerSetTimer": true,
          "heaterShakerTimer": "00:30",
          "latchOpen": false,
          "moduleId": "hs-1",
          "setHeaterShakerTemperature": true,
          "setShake": true,
          "targetHeaterShakerTemperature": "50",
          "targetSpeed": "500"
        },
        "step-2": {
          "id": "step-2",
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
        },
        "step-3": {
          "id": "step-3",
          "stepType": "temperature",
          "stepName": "temperature",
          "stepDetails": "",
          "moduleId": "t-1",
          "setTemperature": "true",
          "targetTemperature": "30"
        },
        "step-4": {
          "id": "step-4",
          "stepType": "pause",
          "stepName": "pause",
          "stepDetails": "",
          "moduleId": "t-1",
          "pauseAction": "untilTemperature",
          "pauseMessage": "",
          "pauseTemperature": "30",
          "pauseTime": null
        },
        "step-5": {
          "id": "step-5",
          "stepType": "temperature",
          "stepName": "temperature",
          "stepDetails": "",
          "moduleId": "t-1",
          "setTemperature": null,
          "targetTemperature": null
        },
        "step-6": {
          "id": "step-6",
          "stepType": "thermocycler",
          "stepName": "thermocycler",
          "stepDetails": "",
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
          "thermocyclerFormType": "thermocyclerState"
        },
        "step-7": {
          "id": "step-7",
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
          "lidOpenHold": null,
          "lidTargetTemp": null,
          "lidTargetTempHold": null,
          "moduleId": "tc-1",
          "orderedProfileItems": ["316e8ede-372a-46f5-aa66-4c16b6cb019b"],
          "profileItemsById": {
            "316e8ede-372a-46f5-aa66-4c16b6cb019b": {
              "id": "316e8ede-372a-46f5-aa66-4c16b6cb019b",
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
          "thermocyclerFormType": "thermocyclerProfile"
        },
        "step-8": {
          "id": "step-8",
          "stepType": "absorbanceReader",
          "stepName": "absorbance plate reader",
          "stepDetails": "",
          "absorbanceReaderFormType": "absorbanceReaderInitialize",
          "fileName": null,
          "lidOpen": null,
          "mode": "single",
          "moduleId": "arp-1",
          "referenceWavelength": null,
          "referenceWavelengthActive": false,
          "wavelengths": ["450"]
        },
        "step-10": {
          "id": "step-10",
          "stepType": "moveLabware",
          "stepName": "move",
          "stepDetails": "",
          "labware": "lw-wellplate-1",
          "newLocation": "arp-1",
          "useGripper": true
        },
        "step-9": {
          "id": "step-9",
          "stepType": "absorbanceReader",
          "stepName": "absorbance plate reader",
          "stepDetails": "",
          "absorbanceReaderFormType": "absorbanceReaderLid",
          "fileName": null,
          "lidOpen": true,
          "mode": "single",
          "moduleId": "arp-1",
          "referenceWavelength": null,
          "referenceWavelengthActive": false,
          "wavelengths": ["450"]
        },
        "step-11": {
          "id": "step-11",
          "stepType": "absorbanceReader",
          "stepName": "absorbance plate reader",
          "stepDetails": "",
          "absorbanceReaderFormType": "absorbanceReaderRead",
          "fileName": "plate_reader_results",
          "lidOpen": null,
          "mode": "single",
          "moduleId": "arp-1",
          "referenceWavelength": null,
          "referenceWavelengthActive": false,
          "wavelengths": ["450"]
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
        "arp-1": {
          "model": "absorbanceReaderV1"
        },
        "hs-1": {
          "model": "heaterShakerModuleV1"
        },
        "t-1": {
          "model": "temperatureModuleV2"
        },
        "mb-1": {
          "model": "magneticBlockV1"
        },
        "tc-1": {
          "model": "thermocyclerModuleV2"
        }
      },
      "labware": {
        "lw-tiprack-1": {
          "displayName": "Opentrons Flex 96 Filter Tip Rack 50 µL",
          "labwareDefURI": "opentrons/opentrons_flex_96_filtertiprack_50ul/1"
        },
        "lw-wellplate-1": {
          "displayName": "Corning 96 Well Plate 360 µL Flat",
          "labwareDefURI": "opentrons/corning_96_wellplate_360ul_flat/2"
        }
      }
    }
  },
  "commands": [
    {
      "commandType": "loadPipette",
      "params": {
        "pipetteName": "p50_single_flex",
        "mount": "left",
        "pipetteId": "pipette_left"
      }
    },
    {
      "commandType": "loadModule",
      "params": {
        "model": "absorbanceReaderV1",
        "location": {
          "slotName": "B3"
        },
        "moduleId": "arp-1"
      }
    },
    {
      "commandType": "loadModule",
      "params": {
        "model": "heaterShakerModuleV1",
        "location": {
          "slotName": "D1"
        },
        "moduleId": "hs-1"
      }
    },
    {
      "commandType": "loadModule",
      "params": {
        "model": "temperatureModuleV2",
        "location": {
          "slotName": "C1"
        },
        "moduleId": "t-1"
      }
    },
    {
      "commandType": "loadModule",
      "params": {
        "model": "magneticBlockV1",
        "location": {
          "slotName": "D2"
        },
        "moduleId": "mb-1"
      }
    },
    {
      "commandType": "loadModule",
      "params": {
        "model": "thermocyclerModuleV2",
        "location": {
          "slotName": "B1"
        },
        "moduleId": "tc-1"
      }
    },
    {
      "commandType": "loadLabware",
      "params": {
        "displayName": "Opentrons Flex 96 Filter Tip Rack 50 µL",
        "labwareId": "lw-tiprack-1",
        "loadName": "opentrons_flex_96_filtertiprack_50ul",
        "namespace": "opentrons",
        "version": 1,
        "location": {
          "slotName": "D3"
        }
      }
    },
    {
      "commandType": "loadLabware",
      "params": {
        "displayName": "Corning 96 Well Plate 360 µL Flat",
        "labwareId": "lw-wellplate-1",
        "loadName": "corning_96_wellplate_360ul_flat",
        "namespace": "opentrons",
        "version": 2,
        "location": {
          "slotName": "C3"
        }
      }
    }
  ]
}
```

</Example2-for-Flex-with-all-modules>
