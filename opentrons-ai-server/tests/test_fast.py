import pytest
from api.handler.fast import parse_tagged_content

input_text_from_user = """
<THINKING>
Let me analyze the user's prompt and extract the necessary information to create a
Protocol Designer protocol for Opentrons Flex robot.

1. Metadata:
   - Protocol Name: "Basic aliquoting"
   - Description: "test"

2. Robot type:
   - Opentrons Flex

3. Pipette mounts:
   - Left mount: flex_8channel_1000 (which corresponds to p1000_multi_flex)

4. Gripper:
   - Not specified, so I'll assume no gripper is needed

5. Modules:
   - None specified

6. Fixtures:
   - Trash bin

7. Labware:
   - opentrons_flex_96_filtertiprack_1000ul x 1
   - nest_96_wellplate_200ul_flat x 1
   - nest_12_reservoir_15ml x 1

8. Steps:
   - Transfer 10μL from reservoir to well plate

9. Liquid definitions:
   - None needed as specified

Since the user didn't specify the exact locations for the labware,
I'll need to assign appropriate deck slots based on the deck layout guidelines in the documentation.
For Flex, I'll follow these guidelines:

- Tip racks: Slots A2, B2, C2, D2 (to avoid modules in columns 1 and 3)
- Well plates: Slots D1, D2, or D3 (recommended)
- Reservoirs: Slots C1, C2, or C3 (recommended)

I'll place:
- Tip rack in slot C2
- Well plate in slot D1
- Reservoir in slot C1

For the transfer step, I need to create a moveLiquid step with the following parameters:
- Source: reservoir (nest_12_reservoir_15ml)
- Destination: well plate (nest_96_wellplate_200ul_flat)
- Volume: 10μL
- Pipette: p1000_multi_flex (left mount)
- Path: single (since it's a simple transfer)
- Change tip: always (default)

Since the user is using a multi-channel pipette, I need to be careful about
well selection. For multi-channel pipettes, we only specify wells in row A (like A1, A2)
and the robot automatically handles all 8 wells in that column.

The user didn't specify which wells to transfer from/to, so I'll assume:
- Source: A1 of the reservoir
- Destination: A1 of the well plate (which means the entire first column)

Now I'll create the JSON protocol based on this information.
</THINKING>

<PD_JSON>
{
  "metadata": {
    "protocolName": "Basic aliquoting",
    "description": "test"
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
            "labware-2": "D1",
            "labware-3": "C1"
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
          "tipRack": "opentrons/opentrons_flex_96_filtertiprack_1000ul/1",
          "volume": "10"
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
        },
        "labware-2": {
          "displayName": "NEST 96 Well Plate 200 µL Flat",
          "labwareDefURI": "opentrons/nest_96_wellplate_200ul_flat/2"
        },
        "labware-3": {
          "displayName": "NEST 12 Well Reservoir 15 mL",
          "labwareDefURI": "opentrons/nest_12_reservoir_15ml/1"
        }
      }
    }
  },
  "robot": {
    "model": "OT-3 Standard",
    "deckId": "ot3_standard"
  }
}
</PD_JSON>

<COMMENTS>
I've created a Protocol Designer protocol for the Opentrons Flex robot that performs a basic aliquoting task. The protocol includes:

1. A p1000 multi-channel pipette mounted on the left
2. Labware placed in recommended positions:
   - Tip rack in slot C2
   - Well plate in slot D1
   - Reservoir in slot C1
3. A trash bin fixture in the standard A3 position
4. A single transfer step that moves 10μL from well A1 of the reservoir to well A1 of the plate

Since you're using a multi-channel pipette, this will transfer liquid from well A1 of the
 reservoir to the entire first column (A1-H1) of the well plate in a single operation.

If you need to transfer to different columns or use different source wells, you can modify
the protocol accordingly.
</COMMENTS>
"""

expected_thinking_content = """Let me analyze the user's prompt and extract the necessary
information to create a Protocol Designer protocol for Opentrons Flex robot.

1. Metadata:
   - Protocol Name: "Basic aliquoting"
   - Description: "test"

2. Robot type:
   - Opentrons Flex

3. Pipette mounts:
   - Left mount: flex_8channel_1000 (which corresponds to p1000_multi_flex)

4. Gripper:
   - Not specified, so I'll assume no gripper is needed

5. Modules:
   - None specified

6. Fixtures:
   - Trash bin

7. Labware:
   - opentrons_flex_96_filtertiprack_1000ul x 1
   - nest_96_wellplate_200ul_flat x 1
   - nest_12_reservoir_15ml x 1

8. Steps:
   - Transfer 10μL from reservoir to well plate

9. Liquid definitions:
   - None needed as specified

Since the user didn't specify the exact locations for the labware, I'll need to assign
appropriate deck slots based on the deck layout guidelines in the documentation.
For Flex, I'll follow these guidelines:

- Tip racks: Slots A2, B2, C2, D2 (to avoid modules in columns 1 and 3)
- Well plates: Slots D1, D2, or D3 (recommended)
- Reservoirs: Slots C1, C2, or C3 (recommended)

I'll place:
- Tip rack in slot C2
- Well plate in slot D1
- Reservoir in slot C1

For the transfer step, I need to create a moveLiquid step with the following parameters:
- Source: reservoir (nest_12_reservoir_15ml)
- Destination: well plate (nest_96_wellplate_200ul_flat)
- Volume: 10μL
- Pipette: p1000_multi_flex (left mount)
- Path: single (since it's a simple transfer)
- Change tip: always (default)

Since the user is using a multi-channel pipette, I need to be careful about well selection.
For multi-channel pipettes, we only specify wells in row A (like A1, A2) and the robot
automatically handles all 8 wells in that column.

The user didn't specify which wells to transfer from/to, so I'll assume:
- Source: A1 of the reservoir
- Destination: A1 of the well plate (which means the entire first column)

Now I'll create the JSON protocol based on this information."""

expected_pd_json_content = """{
  "metadata": {
    "protocolName": "Basic aliquoting",
    "description": "test"
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
            "labware-2": "D1",
            "labware-3": "C1"
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
          "tipRack": "opentrons/opentrons_flex_96_filtertiprack_1000ul/1",
          "volume": "10"
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
        },
        "labware-2": {
          "displayName": "NEST 96 Well Plate 200 µL Flat",
          "labwareDefURI": "opentrons/nest_96_wellplate_200ul_flat/2"
        },
        "labware-3": {
          "displayName": "NEST 12 Well Reservoir 15 mL",
          "labwareDefURI": "opentrons/nest_12_reservoir_15ml/1"
        }
      }
    }
  },
  "robot": {
    "model": "OT-3 Standard",
    "deckId": "ot3_standard"
  }
}"""

expected_comments_content = """I've created a Protocol Designer protocol for the Opentrons
Flex robot that performs a basic aliquoting task. The protocol includes:

1. A p1000 multi-channel pipette mounted on the left
2. Labware placed in recommended positions:
   - Tip rack in slot C2
   - Well plate in slot D1
   - Reservoir in slot C1
3. A trash bin fixture in the standard A3 position
4. A single transfer step that moves 10μL from well A1 of the reservoir to well A1 of the plate

Since you're using a multi-channel pipette, this will transfer liquid from well A1 of the
 reservoir to the entire first column (A1-H1) of the well plate in a single operation.

If you need to transfer to different columns or use different source wells, you can modify
the protocol accordingly."""


@pytest.mark.unit
@pytest.mark.parametrize(
    "input_text, expected_thinking, expected_pd_json, expected_comments",
    [
        # Test case with all tags present
        (
            input_text_from_user,
            expected_thinking_content,
            expected_pd_json_content,
            expected_comments_content,
        ),
        # Test case with THINKING tag missing
        (
            "<PD_JSON>pd_json_data</PD_JSON><COMMENTS>comments_data</COMMENTS>",
            None,
            "pd_json_data",
            "comments_data",
        ),
        # Test case with PD_JSON tag missing
        (
            "<THINKING>thinking_data</THINKING><COMMENTS>comments_data</COMMENTS>",
            "thinking_data",
            None,
            "comments_data",
        ),
        # Test case with COMMENTS tag missing
        (
            "<THINKING>thinking_data</THINKING><PD_JSON>pd_json_data</PD_JSON>",
            "thinking_data",
            "pd_json_data",
            None,
        ),
        # Test case with all tags missing
        (
            "Some random text without any tags.",
            None,
            None,
            None,
        ),
        # Test case with empty tags
        (
            "<THINKING></THINKING><PD_JSON></PD_JSON><COMMENTS></COMMENTS>",
            None,
            None,
            None,
        ),
        # Test case with tags and surrounding text
        (
            "Prefix <THINKING>thinking_data</THINKING> Infix <PD_JSON>pd_json_data</PD_JSON> Suffix <COMMENTS>comments_data</COMMENTS> End",
            "thinking_data",
            "pd_json_data",
            "comments_data",
        ),
        # Test case with only THINKING tag
        ("<THINKING>only thinking</THINKING>", "only thinking", None, None),
        # Test case with only PD_JSON tag
        ("<PD_JSON>only pd_json</PD_JSON>", None, "only pd_json", None),
        # Test case with only COMMENTS tag
        ("<COMMENTS>only comments</COMMENTS>", None, None, "only comments"),
    ],
)
def test_parse_tagged_content(
    input_text: str,
    expected_thinking: str | None,
    expected_pd_json: str | None,
    expected_comments: str | None,
) -> None:
    thinking, pd_json, comments = parse_tagged_content(input_text)
    assert thinking == expected_thinking
    assert pd_json == expected_pd_json
    assert comments == expected_comments
