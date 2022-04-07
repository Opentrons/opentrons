"""Tools for temporary protocol files."""
import tempfile
from typing import IO
from typing_extensions import Literal


def protocol_json(protocol_name: str) -> str:
    """JSON protocol file contents as a string."""
    return f"""{{
  "metadata": {{
    "protocolName": "{protocol_name}",
    "author": "engineering@opentrons.com",
    "description": "simple",
    "created": 1649420374644,
    "lastModified": 1649420582289,
    "category": null,
    "subcategory": null,
    "tags": []
  }},
  "designerApplication": {{
    "name": "opentrons/protocol-designer",
    "version": "5.2.6",
    "data": {{
      "_internalAppBuildDate": "Mon, 26 Apr 2021 18:42:28 GMT",
      "defaultValues": {{
        "aspirate_mmFromBottom": 1,
        "dispense_mmFromBottom": 0.5,
        "touchTip_mmFromTop": -1,
        "blowout_mmFromTop": 0
      }},
      "pipetteTiprackAssignments": {{
        "26ab72d0-b736-11ec-af91-71cebb8cc013": "opentrons/opentrons_96_filtertiprack_10ul/1"
      }},
      "dismissedWarnings": {{ "form": {{}}, "timeline": {{}} }},
      "ingredients": {{
        "0": {{
          "name": "water",
          "description": null,
          "serialize": false,
          "liquidGroupId": "0"
        }}
      }},
      "ingredLocations": {{
        "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1": {{
          "A1": {{ "0": {{ "volume": 10000 }} }}
        }}
      }},
      "savedStepForms": {{
        "__INITIAL_DECK_SETUP_STEP__": {{
          "stepType": "manualIntervention",
          "id": "__INITIAL_DECK_SETUP_STEP__",
          "labwareLocationUpdate": {{
            "trashId": "12",
            "26ac3620-b736-11ec-af91-71cebb8cc013:opentrons/opentrons_96_filtertiprack_10ul/1": "1",
            "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1": "5",
            "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1": "2"
          }},
          "pipetteLocationUpdate": {{
            "26ab72d0-b736-11ec-af91-71cebb8cc013": "left"
          }},
          "moduleLocationUpdate": {{}}
        }},
        "903a0040-b736-11ec-af91-71cebb8cc013": {{
          "id": "903a0040-b736-11ec-af91-71cebb8cc013",
          "stepType": "moveLiquid",
          "stepName": "transfer",
          "stepDetails": "",
          "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
          "volume": "10",
          "changeTip": "once",
          "path": "single",
          "aspirate_wells_grouped": false,
          "aspirate_flowRate": null,
          "aspirate_labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
          "aspirate_wells": ["A1"],
          "aspirate_wellOrder_first": "t2b",
          "aspirate_wellOrder_second": "l2r",
          "aspirate_mix_checkbox": false,
          "aspirate_mix_times": null,
          "aspirate_mix_volume": null,
          "aspirate_mmFromBottom": null,
          "aspirate_touchTip_checkbox": false,
          "aspirate_touchTip_mmFromBottom": null,
          "dispense_flowRate": null,
          "dispense_labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
          "dispense_wells": [
            "A1",
            "B1",
            "C1",
            "D1",
            "E1",
            "F1",
            "G1",
            "H1",
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
            "H11",
            "A12",
            "B12",
            "C12",
            "D12",
            "E12",
            "F12",
            "G12",
            "H12"
          ],
          "dispense_wellOrder_first": "t2b",
          "dispense_wellOrder_second": "l2r",
          "dispense_mix_checkbox": false,
          "dispense_mix_times": null,
          "dispense_mix_volume": null,
          "dispense_mmFromBottom": null,
          "dispense_touchTip_checkbox": false,
          "dispense_touchTip_mmFromBottom": null,
          "disposalVolume_checkbox": true,
          "disposalVolume_volume": "1",
          "blowout_checkbox": false,
          "blowout_location": "trashId",
          "preWetTip": false,
          "aspirate_airGap_checkbox": false,
          "aspirate_airGap_volume": "1",
          "aspirate_delay_checkbox": false,
          "aspirate_delay_mmFromBottom": null,
          "aspirate_delay_seconds": "1",
          "dispense_airGap_checkbox": false,
          "dispense_airGap_volume": "1",
          "dispense_delay_checkbox": false,
          "dispense_delay_seconds": "1",
          "dispense_delay_mmFromBottom": null
        }}
      }},
      "orderedStepIds": ["903a0040-b736-11ec-af91-71cebb8cc013"]
    }}
  }},
  "robot": {{ "model": "OT-2 Standard" }},
  "pipettes": {{
    "26ab72d0-b736-11ec-af91-71cebb8cc013": {{
      "mount": "left",
      "name": "p20_single_gen2"
    }}
  }},
  "labware": {{
    "trashId": {{
      "slot": "12",
      "displayName": "Trash",
      "definitionId": "opentrons/opentrons_1_trash_1100ml_fixed/1"
    }},
    "26ac3620-b736-11ec-af91-71cebb8cc013:opentrons/opentrons_96_filtertiprack_10ul/1": {{
      "slot": "1",
      "displayName": "Opentrons 96 Filter Tip Rack 10 µL",
      "definitionId": "opentrons/opentrons_96_filtertiprack_10ul/1"
    }},
    "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1": {{
      "slot": "5",
      "displayName": "NEST 1 Well Reservoir 195 mL",
      "definitionId": "opentrons/nest_1_reservoir_195ml/1"
    }},
    "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1": {{
      "slot": "2",
      "displayName": "Bio-Rad 96 Well Plate 200 µL PCR",
      "definitionId": "opentrons/biorad_96_wellplate_200ul_pcr/1"
    }}
  }},
  "labwareDefinitions": {{
    "opentrons/opentrons_96_filtertiprack_10ul/1": {{
      "ordering": [
        ["A1", "B1", "C1", "D1", "E1", "F1", "G1", "H1"],
        ["A2", "B2", "C2", "D2", "E2", "F2", "G2", "H2"],
        ["A3", "B3", "C3", "D3", "E3", "F3", "G3", "H3"],
        ["A4", "B4", "C4", "D4", "E4", "F4", "G4", "H4"],
        ["A5", "B5", "C5", "D5", "E5", "F5", "G5", "H5"],
        ["A6", "B6", "C6", "D6", "E6", "F6", "G6", "H6"],
        ["A7", "B7", "C7", "D7", "E7", "F7", "G7", "H7"],
        ["A8", "B8", "C8", "D8", "E8", "F8", "G8", "H8"],
        ["A9", "B9", "C9", "D9", "E9", "F9", "G9", "H9"],
        ["A10", "B10", "C10", "D10", "E10", "F10", "G10", "H10"],
        ["A11", "B11", "C11", "D11", "E11", "F11", "G11", "H11"],
        ["A12", "B12", "C12", "D12", "E12", "F12", "G12", "H12"]
      ],
      "brand": {{ "brand": "Opentrons", "brandId": [], "links": [] }},
      "metadata": {{
        "displayName": "Opentrons 96 Filter Tip Rack 10 µL",
        "displayCategory": "tipRack",
        "displayVolumeUnits": "µL",
        "tags": []
      }},
      "dimensions": {{
        "xDimension": 127.76,
        "yDimension": 85.48,
        "zDimension": 64.69
      }},
      "wells": {{
        "A1": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 14.36,
          "y": 74.26,
          "z": 25.49
        }},
        "B1": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 14.36,
          "y": 65.26,
          "z": 25.49
        }},
        "C1": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 14.36,
          "y": 56.26,
          "z": 25.49
        }},
        "D1": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 14.36,
          "y": 47.26,
          "z": 25.49
        }},
        "E1": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 14.36,
          "y": 38.26,
          "z": 25.49
        }},
        "F1": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 14.36,
          "y": 29.26,
          "z": 25.49
        }},
        "G1": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 14.36,
          "y": 20.26,
          "z": 25.49
        }},
        "H1": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 14.36,
          "y": 11.26,
          "z": 25.49
        }},
        "A2": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 23.36,
          "y": 74.26,
          "z": 25.49
        }},
        "B2": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 23.36,
          "y": 65.26,
          "z": 25.49
        }},
        "C2": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 23.36,
          "y": 56.26,
          "z": 25.49
        }},
        "D2": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 23.36,
          "y": 47.26,
          "z": 25.49
        }},
        "E2": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 23.36,
          "y": 38.26,
          "z": 25.49
        }},
        "F2": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 23.36,
          "y": 29.26,
          "z": 25.49
        }},
        "G2": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 23.36,
          "y": 20.26,
          "z": 25.49
        }},
        "H2": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 23.36,
          "y": 11.26,
          "z": 25.49
        }},
        "A3": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 32.36,
          "y": 74.26,
          "z": 25.49
        }},
        "B3": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 32.36,
          "y": 65.26,
          "z": 25.49
        }},
        "C3": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 32.36,
          "y": 56.26,
          "z": 25.49
        }},
        "D3": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 32.36,
          "y": 47.26,
          "z": 25.49
        }},
        "E3": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 32.36,
          "y": 38.26,
          "z": 25.49
        }},
        "F3": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 32.36,
          "y": 29.26,
          "z": 25.49
        }},
        "G3": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 32.36,
          "y": 20.26,
          "z": 25.49
        }},
        "H3": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 32.36,
          "y": 11.26,
          "z": 25.49
        }},
        "A4": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 41.36,
          "y": 74.26,
          "z": 25.49
        }},
        "B4": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 41.36,
          "y": 65.26,
          "z": 25.49
        }},
        "C4": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 41.36,
          "y": 56.26,
          "z": 25.49
        }},
        "D4": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 41.36,
          "y": 47.26,
          "z": 25.49
        }},
        "E4": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 41.36,
          "y": 38.26,
          "z": 25.49
        }},
        "F4": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 41.36,
          "y": 29.26,
          "z": 25.49
        }},
        "G4": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 41.36,
          "y": 20.26,
          "z": 25.49
        }},
        "H4": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 41.36,
          "y": 11.26,
          "z": 25.49
        }},
        "A5": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 50.36,
          "y": 74.26,
          "z": 25.49
        }},
        "B5": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 50.36,
          "y": 65.26,
          "z": 25.49
        }},
        "C5": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 50.36,
          "y": 56.26,
          "z": 25.49
        }},
        "D5": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 50.36,
          "y": 47.26,
          "z": 25.49
        }},
        "E5": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 50.36,
          "y": 38.26,
          "z": 25.49
        }},
        "F5": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 50.36,
          "y": 29.26,
          "z": 25.49
        }},
        "G5": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 50.36,
          "y": 20.26,
          "z": 25.49
        }},
        "H5": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 50.36,
          "y": 11.26,
          "z": 25.49
        }},
        "A6": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 59.36,
          "y": 74.26,
          "z": 25.49
        }},
        "B6": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 59.36,
          "y": 65.26,
          "z": 25.49
        }},
        "C6": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 59.36,
          "y": 56.26,
          "z": 25.49
        }},
        "D6": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 59.36,
          "y": 47.26,
          "z": 25.49
        }},
        "E6": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 59.36,
          "y": 38.26,
          "z": 25.49
        }},
        "F6": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 59.36,
          "y": 29.26,
          "z": 25.49
        }},
        "G6": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 59.36,
          "y": 20.26,
          "z": 25.49
        }},
        "H6": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 59.36,
          "y": 11.26,
          "z": 25.49
        }},
        "A7": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 68.36,
          "y": 74.26,
          "z": 25.49
        }},
        "B7": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 68.36,
          "y": 65.26,
          "z": 25.49
        }},
        "C7": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 68.36,
          "y": 56.26,
          "z": 25.49
        }},
        "D7": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 68.36,
          "y": 47.26,
          "z": 25.49
        }},
        "E7": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 68.36,
          "y": 38.26,
          "z": 25.49
        }},
        "F7": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 68.36,
          "y": 29.26,
          "z": 25.49
        }},
        "G7": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 68.36,
          "y": 20.26,
          "z": 25.49
        }},
        "H7": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 68.36,
          "y": 11.26,
          "z": 25.49
        }},
        "A8": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 77.36,
          "y": 74.26,
          "z": 25.49
        }},
        "B8": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 77.36,
          "y": 65.26,
          "z": 25.49
        }},
        "C8": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 77.36,
          "y": 56.26,
          "z": 25.49
        }},
        "D8": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 77.36,
          "y": 47.26,
          "z": 25.49
        }},
        "E8": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 77.36,
          "y": 38.26,
          "z": 25.49
        }},
        "F8": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 77.36,
          "y": 29.26,
          "z": 25.49
        }},
        "G8": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 77.36,
          "y": 20.26,
          "z": 25.49
        }},
        "H8": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 77.36,
          "y": 11.26,
          "z": 25.49
        }},
        "A9": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 86.36,
          "y": 74.26,
          "z": 25.49
        }},
        "B9": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 86.36,
          "y": 65.26,
          "z": 25.49
        }},
        "C9": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 86.36,
          "y": 56.26,
          "z": 25.49
        }},
        "D9": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 86.36,
          "y": 47.26,
          "z": 25.49
        }},
        "E9": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 86.36,
          "y": 38.26,
          "z": 25.49
        }},
        "F9": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 86.36,
          "y": 29.26,
          "z": 25.49
        }},
        "G9": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 86.36,
          "y": 20.26,
          "z": 25.49
        }},
        "H9": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 86.36,
          "y": 11.26,
          "z": 25.49
        }},
        "A10": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 95.36,
          "y": 74.26,
          "z": 25.49
        }},
        "B10": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 95.36,
          "y": 65.26,
          "z": 25.49
        }},
        "C10": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 95.36,
          "y": 56.26,
          "z": 25.49
        }},
        "D10": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 95.36,
          "y": 47.26,
          "z": 25.49
        }},
        "E10": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 95.36,
          "y": 38.26,
          "z": 25.49
        }},
        "F10": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 95.36,
          "y": 29.26,
          "z": 25.49
        }},
        "G10": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 95.36,
          "y": 20.26,
          "z": 25.49
        }},
        "H10": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 95.36,
          "y": 11.26,
          "z": 25.49
        }},
        "A11": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 104.36,
          "y": 74.26,
          "z": 25.49
        }},
        "B11": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 104.36,
          "y": 65.26,
          "z": 25.49
        }},
        "C11": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 104.36,
          "y": 56.26,
          "z": 25.49
        }},
        "D11": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 104.36,
          "y": 47.26,
          "z": 25.49
        }},
        "E11": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 104.36,
          "y": 38.26,
          "z": 25.49
        }},
        "F11": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 104.36,
          "y": 29.26,
          "z": 25.49
        }},
        "G11": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 104.36,
          "y": 20.26,
          "z": 25.49
        }},
        "H11": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 104.36,
          "y": 11.26,
          "z": 25.49
        }},
        "A12": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 113.36,
          "y": 74.26,
          "z": 25.49
        }},
        "B12": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 113.36,
          "y": 65.26,
          "z": 25.49
        }},
        "C12": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 113.36,
          "y": 56.26,
          "z": 25.49
        }},
        "D12": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 113.36,
          "y": 47.26,
          "z": 25.49
        }},
        "E12": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 113.36,
          "y": 38.26,
          "z": 25.49
        }},
        "F12": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 113.36,
          "y": 29.26,
          "z": 25.49
        }},
        "G12": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 113.36,
          "y": 20.26,
          "z": 25.49
        }},
        "H12": {{
          "depth": 39.2,
          "shape": "circular",
          "diameter": 3.27,
          "totalLiquidVolume": 10,
          "x": 113.36,
          "y": 11.26,
          "z": 25.49
        }}
      }},
      "groups": [
        {{
          "metadata": {{}},
          "wells": [
            "A1",
            "B1",
            "C1",
            "D1",
            "E1",
            "F1",
            "G1",
            "H1",
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
            "H11",
            "A12",
            "B12",
            "C12",
            "D12",
            "E12",
            "F12",
            "G12",
            "H12"
          ]
        }}
      ],
      "parameters": {{
        "format": "96Standard",
        "isTiprack": true,
        "tipLength": 39.2,
        "tipOverlap": 3.29,
        "isMagneticModuleCompatible": false,
        "loadName": "opentrons_96_filtertiprack_10ul"
      }},
      "namespace": "opentrons",
      "version": 1,
      "schemaVersion": 2,
      "cornerOffsetFromSlot": {{ "x": 0, "y": 0, "z": 0 }}
    }},
    "opentrons/opentrons_1_trash_1100ml_fixed/1": {{
      "ordering": [["A1"]],
      "metadata": {{
        "displayCategory": "trash",
        "displayVolumeUnits": "mL",
        "displayName": "Opentrons Fixed Trash",
        "tags": []
      }},
      "schemaVersion": 2,
      "version": 1,
      "namespace": "opentrons",
      "dimensions": {{
        "xDimension": 172.86,
        "yDimension": 165.86,
        "zDimension": 82
      }},
      "parameters": {{
        "format": "trash",
        "isTiprack": false,
        "loadName": "opentrons_1_trash_1100ml_fixed",
        "isMagneticModuleCompatible": false,
        "quirks": [
          "fixedTrash",
          "centerMultichannelOnWells",
          "touchTipDisabled"
        ]
      }},
      "wells": {{
        "A1": {{
          "shape": "rectangular",
          "yDimension": 165.67,
          "xDimension": 107.11,
          "totalLiquidVolume": 1100000,
          "depth": 0,
          "x": 82.84,
          "y": 80,
          "z": 82
        }}
      }},
      "brand": {{ "brand": "Opentrons" }},
      "groups": [{{ "wells": ["A1"], "metadata": {{}} }}],
      "cornerOffsetFromSlot": {{ "x": 0, "y": 0, "z": 0 }}
    }},
    "opentrons/nest_1_reservoir_195ml/1": {{
      "ordering": [["A1"]],
      "brand": {{
        "brand": "NEST",
        "brandId": ["360103"],
        "links": ["http://www.cell-nest.com/page94?_l=en&product_id=102"]
      }},
      "metadata": {{
        "displayName": "NEST 1 Well Reservoir 195 mL",
        "displayCategory": "reservoir",
        "displayVolumeUnits": "mL",
        "tags": []
      }},
      "dimensions": {{
        "xDimension": 127.76,
        "yDimension": 85.48,
        "zDimension": 31.4
      }},
      "wells": {{
        "A1": {{
          "depth": 25,
          "shape": "rectangular",
          "xDimension": 106.8,
          "yDimension": 71.2,
          "totalLiquidVolume": 195000,
          "x": 63.88,
          "y": 42.74,
          "z": 4.55
        }}
      }},
      "groups": [{{ "metadata": {{ "wellBottomShape": "v" }}, "wells": ["A1"] }}],
      "parameters": {{
        "format": "trough",
        "isTiprack": false,
        "isMagneticModuleCompatible": false,
        "quirks": ["centerMultichannelOnWells", "touchTipDisabled"],
        "loadName": "nest_1_reservoir_195ml"
      }},
      "namespace": "opentrons",
      "version": 1,
      "schemaVersion": 2,
      "cornerOffsetFromSlot": {{ "x": 0, "y": 0, "z": 0 }}
    }},
    "opentrons/biorad_96_wellplate_200ul_pcr/1": {{
      "ordering": [
        ["A1", "B1", "C1", "D1", "E1", "F1", "G1", "H1"],
        ["A2", "B2", "C2", "D2", "E2", "F2", "G2", "H2"],
        ["A3", "B3", "C3", "D3", "E3", "F3", "G3", "H3"],
        ["A4", "B4", "C4", "D4", "E4", "F4", "G4", "H4"],
        ["A5", "B5", "C5", "D5", "E5", "F5", "G5", "H5"],
        ["A6", "B6", "C6", "D6", "E6", "F6", "G6", "H6"],
        ["A7", "B7", "C7", "D7", "E7", "F7", "G7", "H7"],
        ["A8", "B8", "C8", "D8", "E8", "F8", "G8", "H8"],
        ["A9", "B9", "C9", "D9", "E9", "F9", "G9", "H9"],
        ["A10", "B10", "C10", "D10", "E10", "F10", "G10", "H10"],
        ["A11", "B11", "C11", "D11", "E11", "F11", "G11", "H11"],
        ["A12", "B12", "C12", "D12", "E12", "F12", "G12", "H12"]
      ],
      "schemaVersion": 2,
      "version": 1,
      "namespace": "opentrons",
      "metadata": {{
        "displayName": "Bio-Rad 96 Well Plate 200 µL PCR",
        "displayCategory": "wellPlate",
        "displayVolumeUnits": "µL",
        "tags": []
      }},
      "dimensions": {{
        "yDimension": 85.48,
        "xDimension": 127.76,
        "zDimension": 16.06
      }},
      "parameters": {{
        "format": "96Standard",
        "isTiprack": false,
        "loadName": "biorad_96_wellplate_200ul_pcr",
        "isMagneticModuleCompatible": true,
        "magneticModuleEngageHeight": 18
      }},
      "wells": {{
        "H1": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 14.38,
          "y": 11.24,
          "z": 1.25
        }},
        "G1": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 14.38,
          "y": 20.24,
          "z": 1.25
        }},
        "F1": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 14.38,
          "y": 29.24,
          "z": 1.25
        }},
        "E1": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 14.38,
          "y": 38.24,
          "z": 1.25
        }},
        "D1": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 14.38,
          "y": 47.24,
          "z": 1.25
        }},
        "C1": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 14.38,
          "y": 56.24,
          "z": 1.25
        }},
        "B1": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 14.38,
          "y": 65.24,
          "z": 1.25
        }},
        "A1": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 14.38,
          "y": 74.24,
          "z": 1.25
        }},
        "H2": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 23.38,
          "y": 11.24,
          "z": 1.25
        }},
        "G2": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 23.38,
          "y": 20.24,
          "z": 1.25
        }},
        "F2": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 23.38,
          "y": 29.24,
          "z": 1.25
        }},
        "E2": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 23.38,
          "y": 38.24,
          "z": 1.25
        }},
        "D2": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 23.38,
          "y": 47.24,
          "z": 1.25
        }},
        "C2": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 23.38,
          "y": 56.24,
          "z": 1.25
        }},
        "B2": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 23.38,
          "y": 65.24,
          "z": 1.25
        }},
        "A2": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 23.38,
          "y": 74.24,
          "z": 1.25
        }},
        "H3": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 32.38,
          "y": 11.24,
          "z": 1.25
        }},
        "G3": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 32.38,
          "y": 20.24,
          "z": 1.25
        }},
        "F3": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 32.38,
          "y": 29.24,
          "z": 1.25
        }},
        "E3": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 32.38,
          "y": 38.24,
          "z": 1.25
        }},
        "D3": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 32.38,
          "y": 47.24,
          "z": 1.25
        }},
        "C3": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 32.38,
          "y": 56.24,
          "z": 1.25
        }},
        "B3": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 32.38,
          "y": 65.24,
          "z": 1.25
        }},
        "A3": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 32.38,
          "y": 74.24,
          "z": 1.25
        }},
        "H4": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 41.38,
          "y": 11.24,
          "z": 1.25
        }},
        "G4": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 41.38,
          "y": 20.24,
          "z": 1.25
        }},
        "F4": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 41.38,
          "y": 29.24,
          "z": 1.25
        }},
        "E4": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 41.38,
          "y": 38.24,
          "z": 1.25
        }},
        "D4": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 41.38,
          "y": 47.24,
          "z": 1.25
        }},
        "C4": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 41.38,
          "y": 56.24,
          "z": 1.25
        }},
        "B4": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 41.38,
          "y": 65.24,
          "z": 1.25
        }},
        "A4": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 41.38,
          "y": 74.24,
          "z": 1.25
        }},
        "H5": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 50.38,
          "y": 11.24,
          "z": 1.25
        }},
        "G5": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 50.38,
          "y": 20.24,
          "z": 1.25
        }},
        "F5": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 50.38,
          "y": 29.24,
          "z": 1.25
        }},
        "E5": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 50.38,
          "y": 38.24,
          "z": 1.25
        }},
        "D5": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 50.38,
          "y": 47.24,
          "z": 1.25
        }},
        "C5": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 50.38,
          "y": 56.24,
          "z": 1.25
        }},
        "B5": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 50.38,
          "y": 65.24,
          "z": 1.25
        }},
        "A5": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 50.38,
          "y": 74.24,
          "z": 1.25
        }},
        "H6": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 59.38,
          "y": 11.24,
          "z": 1.25
        }},
        "G6": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 59.38,
          "y": 20.24,
          "z": 1.25
        }},
        "F6": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 59.38,
          "y": 29.24,
          "z": 1.25
        }},
        "E6": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 59.38,
          "y": 38.24,
          "z": 1.25
        }},
        "D6": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 59.38,
          "y": 47.24,
          "z": 1.25
        }},
        "C6": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 59.38,
          "y": 56.24,
          "z": 1.25
        }},
        "B6": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 59.38,
          "y": 65.24,
          "z": 1.25
        }},
        "A6": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 59.38,
          "y": 74.24,
          "z": 1.25
        }},
        "H7": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 68.38,
          "y": 11.24,
          "z": 1.25
        }},
        "G7": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 68.38,
          "y": 20.24,
          "z": 1.25
        }},
        "F7": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 68.38,
          "y": 29.24,
          "z": 1.25
        }},
        "E7": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 68.38,
          "y": 38.24,
          "z": 1.25
        }},
        "D7": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 68.38,
          "y": 47.24,
          "z": 1.25
        }},
        "C7": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 68.38,
          "y": 56.24,
          "z": 1.25
        }},
        "B7": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 68.38,
          "y": 65.24,
          "z": 1.25
        }},
        "A7": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 68.38,
          "y": 74.24,
          "z": 1.25
        }},
        "H8": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 77.38,
          "y": 11.24,
          "z": 1.25
        }},
        "G8": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 77.38,
          "y": 20.24,
          "z": 1.25
        }},
        "F8": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 77.38,
          "y": 29.24,
          "z": 1.25
        }},
        "E8": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 77.38,
          "y": 38.24,
          "z": 1.25
        }},
        "D8": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 77.38,
          "y": 47.24,
          "z": 1.25
        }},
        "C8": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 77.38,
          "y": 56.24,
          "z": 1.25
        }},
        "B8": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 77.38,
          "y": 65.24,
          "z": 1.25
        }},
        "A8": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 77.38,
          "y": 74.24,
          "z": 1.25
        }},
        "H9": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 86.38,
          "y": 11.24,
          "z": 1.25
        }},
        "G9": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 86.38,
          "y": 20.24,
          "z": 1.25
        }},
        "F9": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 86.38,
          "y": 29.24,
          "z": 1.25
        }},
        "E9": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 86.38,
          "y": 38.24,
          "z": 1.25
        }},
        "D9": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 86.38,
          "y": 47.24,
          "z": 1.25
        }},
        "C9": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 86.38,
          "y": 56.24,
          "z": 1.25
        }},
        "B9": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 86.38,
          "y": 65.24,
          "z": 1.25
        }},
        "A9": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 86.38,
          "y": 74.24,
          "z": 1.25
        }},
        "H10": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 95.38,
          "y": 11.24,
          "z": 1.25
        }},
        "G10": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 95.38,
          "y": 20.24,
          "z": 1.25
        }},
        "F10": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 95.38,
          "y": 29.24,
          "z": 1.25
        }},
        "E10": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 95.38,
          "y": 38.24,
          "z": 1.25
        }},
        "D10": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 95.38,
          "y": 47.24,
          "z": 1.25
        }},
        "C10": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 95.38,
          "y": 56.24,
          "z": 1.25
        }},
        "B10": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 95.38,
          "y": 65.24,
          "z": 1.25
        }},
        "A10": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 95.38,
          "y": 74.24,
          "z": 1.25
        }},
        "H11": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 104.38,
          "y": 11.24,
          "z": 1.25
        }},
        "G11": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 104.38,
          "y": 20.24,
          "z": 1.25
        }},
        "F11": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 104.38,
          "y": 29.24,
          "z": 1.25
        }},
        "E11": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 104.38,
          "y": 38.24,
          "z": 1.25
        }},
        "D11": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 104.38,
          "y": 47.24,
          "z": 1.25
        }},
        "C11": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 104.38,
          "y": 56.24,
          "z": 1.25
        }},
        "B11": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 104.38,
          "y": 65.24,
          "z": 1.25
        }},
        "A11": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 104.38,
          "y": 74.24,
          "z": 1.25
        }},
        "H12": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 113.38,
          "y": 11.24,
          "z": 1.25
        }},
        "G12": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 113.38,
          "y": 20.24,
          "z": 1.25
        }},
        "F12": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 113.38,
          "y": 29.24,
          "z": 1.25
        }},
        "E12": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 113.38,
          "y": 38.24,
          "z": 1.25
        }},
        "D12": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 113.38,
          "y": 47.24,
          "z": 1.25
        }},
        "C12": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 113.38,
          "y": 56.24,
          "z": 1.25
        }},
        "B12": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 113.38,
          "y": 65.24,
          "z": 1.25
        }},
        "A12": {{
          "depth": 14.81,
          "shape": "circular",
          "diameter": 5.46,
          "totalLiquidVolume": 200,
          "x": 113.38,
          "y": 74.24,
          "z": 1.25
        }}
      }},
      "brand": {{
        "brand": "Bio-Rad",
        "brandId": ["hsp9601"],
        "links": [
          "http://www.bio-rad.com/en-us/sku/hsp9601-hard-shell-96-well-pcr-plates-low-profile-thin-wall-skirted-white-clear?ID=hsp9601"
        ]
      }},
      "groups": [
        {{
          "wells": [
            "A1",
            "B1",
            "C1",
            "D1",
            "E1",
            "F1",
            "G1",
            "H1",
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
            "H11",
            "A12",
            "B12",
            "C12",
            "D12",
            "E12",
            "F12",
            "G12",
            "H12"
          ],
          "metadata": {{ "wellBottomShape": "v" }}
        }}
      ],
      "cornerOffsetFromSlot": {{ "x": 0, "y": 0, "z": 0 }}
    }}
  }},
  "schemaVersion": 3,
  "commands": [
    {{
      "command": "pickUpTip",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "labware": "26ac3620-b736-11ec-af91-71cebb8cc013:opentrons/opentrons_96_filtertiprack_10ul/1",
        "well": "A1"
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "A1",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "B1",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "C1",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "D1",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "E1",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "F1",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "G1",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "H1",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "A2",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "B2",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "C2",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "D2",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "E2",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "F2",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "G2",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "H2",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "A3",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "B3",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "C3",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "D3",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "E3",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "F3",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "G3",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "H3",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "A4",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "B4",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "C4",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "D4",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "E4",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "F4",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "G4",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "H4",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "A5",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "B5",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "C5",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "D5",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "E5",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "F5",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "G5",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "H5",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "A6",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "B6",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "C6",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "D6",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "E6",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "F6",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "G6",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "H6",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "A7",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "B7",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "C7",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "D7",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "E7",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "F7",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "G7",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "H7",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "A8",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "B8",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "C8",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "D8",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "E8",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "F8",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "G8",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "H8",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "A9",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "B9",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "C9",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "D9",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "E9",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "F9",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "G9",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "H9",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "A10",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "B10",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "C10",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "D10",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "E10",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "F10",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "G10",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "H10",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "A11",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "B11",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "C11",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "D11",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "E11",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "F11",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "G11",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "H11",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "A12",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "B12",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "C12",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "D12",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "E12",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "F12",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "G12",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "aspirate",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "5453ae50-b736-11ec-af91-71cebb8cc013:opentrons/nest_1_reservoir_195ml/1",
        "well": "A1",
        "offsetFromBottomMm": 1,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dispense",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "volume": 10,
        "labware": "7131aa40-b736-11ec-af91-71cebb8cc013:opentrons/biorad_96_wellplate_200ul_pcr/1",
        "well": "H12",
        "offsetFromBottomMm": 0.5,
        "flowRate": 3.78
      }}
    }},
    {{
      "command": "dropTip",
      "params": {{
        "pipette": "26ab72d0-b736-11ec-af91-71cebb8cc013",
        "labware": "trashId",
        "well": "A1"
      }}
    }}
  ]
}}
"""


def protocol_python(protocol_name: str) -> str:
    """Python protocol file contents as a string."""
    return f'''from opentrons import protocol_api

metadata = {{
    "protocolName": "{protocol_name}",
    "author": "Opentrons <protocols@opentrons.com>",
    "source": "Protocol Library",
    "apiLevel": "2.12",
}}


def run(ctx: protocol_api.ProtocolContext) -> None:
    """This method is run by the protocol engine."""

    ctx.comment("A single comment.")
'''


def create_temp_protocol(
    protocol_extension: Literal[".py", ".json"], protocol_contents: str
) -> IO[bytes]:
    """Create an temporary protocol file."""
    file = tempfile.NamedTemporaryFile(suffix=protocol_extension)
    file_contents = protocol_contents
    file.write(str.encode(file_contents))
    file.seek(0)
    return file


def get_json_protocol(protocol_name: str) -> IO[bytes]:
    """A NamedTemporaryFile valid json protocol."""
    return create_temp_protocol(".json", protocol_json(protocol_name))


def get_py_protocol(protocol_name: str) -> IO[bytes]:
    """A NamedTemporaryFile valid json protocol."""
    return create_temp_protocol(".py", protocol_python(protocol_name))
