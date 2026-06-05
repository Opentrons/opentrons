import json
from opentrons import protocol_api, types

metadata = {
    "protocolName": "Post tagmentation fixed file",
    "author": "JAG/CIDR",
    "description": "Stop Tagmentation process, wash DNA bound to beads, and add Amplification Master Mix and indexes",
    "created": "2025-03-11T14:04:46.917Z",
    "internalAppBuildDate": "Wed, 04 Mar 2026 17:13:57 GMT",
    "lastModified": "2026-03-11T15:33:06.947Z",
    "protocolDesigner": "8.9.0",
    "source": "Protocol Designer",
}

requirements = {"robotType": "Flex", "apiLevel": "2.27"}

def run(protocol: protocol_api.ProtocolContext) -> None:
    # Load Adapters:
    adapter_1 = protocol.load_adapter(
        "opentrons_flex_96_tiprack_adapter",
        location="C3",
        namespace="opentrons",
        version=1,
    )

    # Load Labware:
    tip_rack_1 = adapter_1.load_labware(
        "opentrons_flex_96_filtertiprack_200ul",
        namespace="opentrons",
        version=1,
    )
    reservoir_1 = protocol.load_labware(
        "axygen_1_reservoir_90ml",
        location="C2",
        label="TWB Reservoir 90mL",
        namespace="opentrons",
        version=3,
    )
    well_plate_1 = protocol.load_labware(
        "thermoscientificnunc_96_wellplate_1300ul",
        location="B2",
        label="Waste Plate - NUNC",
        namespace="opentrons",
        version=3,
    )
    well_plate_2 = protocol.load_labware_from_definition(
        CUSTOM_LABWARE["custom_beta/axygen_pcr_96_well_black_mag_base/1"],
        location="D2",
        label="-LP1 plate in black mag base",
    )
    well_plate_3 = protocol.load_labware_from_definition(
        CUSTOM_LABWARE["custom_beta/eppendorf_96_wellplate_150aul/1"],
        location="B1",
        label="Illumina Indexes",
    )
    well_plate_4 = protocol.load_labware_from_definition(
        CUSTOM_LABWARE["custom_beta/thermofisher_96_wellplate_700ul/1"],
        location="C1",
        label="Reagent plate",
    )
    well_plate_5 = protocol.load_labware_from_definition(
        CUSTOM_LABWARE["custom_beta/axygen_pcr_96_well_brown_base/1"],
        location="D1",
        label="-LP1 plate in a brown base",
    )
    tip_rack_2 = protocol.load_labware(
        "opentrons_flex_96_filtertiprack_200ul",
        location="A1",
        label="Opentrons Flex 96 Filter Tip Rack 200 µL (1)",
        namespace="opentrons",
        version=1,
    )
    tip_rack_3 = protocol.load_labware(
        "opentrons_flex_96_filtertiprack_200ul",
        location="A2",
        label="Opentrons Flex 96 Filter Tip Rack 200 µL (2)",
        namespace="opentrons",
        version=1,
    )
    tip_rack_4 = protocol.load_labware(
        "opentrons_flex_96_filtertiprack_200ul",
        location="A3",
        label="Opentrons Flex 96 Filter Tip Rack 200 µL (3)",
        namespace="opentrons",
        version=1,
    )
    tip_rack_5 = protocol.load_labware(
        "opentrons_flex_96_filtertiprack_200ul",
        location="B3",
        label="Opentrons Flex 96 Filter Tip Rack 200 µL (4)",
        namespace="opentrons",
        version=1,
    )
    tip_rack_6 = protocol.load_labware(
        "opentrons_flex_96_filtertiprack_200ul",
        location="A4",
        label="Opentrons Flex 96 Filter Tip Rack 200 µL (5)",
        namespace="opentrons",
        version=1,
    )
    tip_rack_7 = protocol.load_labware(
        "opentrons_flex_96_filtertiprack_200ul",
        location="B4",
        label="Opentrons Flex 96 Filter Tip Rack 200 µL (6)",
        namespace="opentrons",
        version=1,
    )
    tip_rack_8 = protocol.load_labware(
        "opentrons_flex_96_filtertiprack_200ul",
        location="C4",
        label="Opentrons Flex 96 Filter Tip Rack 200 µL (7)",
        namespace="opentrons",
        version=1,
    )
    tip_rack_9 = protocol.load_labware(
        "opentrons_flex_96_filtertiprack_200ul",
        location=protocol_api.OFF_DECK,
        label="Opentrons Flex 96 Filter Tip Rack 200 µL (8)",
        namespace="opentrons",
        version=1,
    )
    tip_rack_10 = protocol.load_labware(
        "opentrons_flex_96_filtertiprack_200ul",
        location=protocol_api.OFF_DECK,
        label="Opentrons Flex 96 Filter Tip Rack 200 µL (9)",
        namespace="opentrons",
        version=1,
    )

    # Load Pipettes:
    pipette = protocol.load_instrument("flex_96channel_1000")

    # Load Waste Chute:
    waste_chute = protocol.load_waste_chute()

    # Define Liquids:
    liquid_1 = protocol.define_liquid(
        "TWB",
        display_color="#9af4d0ff",
    )
    liquid_2 = protocol.define_liquid(
        "Illumina indexes",
        display_color="#ba27adff",
    )
    liquid_3 = protocol.define_liquid(
        "ST2 Buffer",
        display_color="#ffd600ff",
    )
    liquid_4 = protocol.define_liquid(
        "AMPMM",
        display_color="#630b8cff",
    )
    liquid_5 = protocol.define_liquid(
        "Tag Bead DNA",
        description="LP1 plate from previous phase with Tagmentation buffer, beads, and DNA",
        display_color="#f7af42ff",
    )

    # Load Liquids:
    reservoir_1.load_liquid(
        wells=["A1"],
        liquid=liquid_1,
        volume=70000,
    )
    well_plate_3.load_liquid(
        wells=[
            "A1", "B1", "C1", "D1", "E1", "F1", "G1", "H1",
            "A2", "B2", "C2", "D2", "E2", "F2", "G2", "H2",
            "A3", "B3", "C3", "D3", "E3", "F3", "G3", "H3",
            "A4", "B4", "C4", "D4", "E4", "F4", "G4", "H4",
            "A5", "B5", "C5", "D5", "E5", "F5", "G5", "H5",
            "A6", "B6", "C6", "D6", "E6", "F6", "G6", "H6",
            "A7", "B7", "C7", "D7", "E7", "F7", "G7", "H7",
            "A8", "B8", "C8", "D8", "E8", "F8", "G8", "H8",
            "A9", "B9", "C9", "D9", "E9", "F9", "G9", "H9",
            "A10", "B10", "C10", "D10", "E10", "F10", "G10", "H10",
            "A11", "B11", "C11", "D11", "E11", "F11", "G11", "H11",
            "A12", "B12", "C12", "D12", "E12", "F12", "G12", "H12"
        ],
        liquid=liquid_2,
        volume=20,
    )
    well_plate_4.load_liquid(
        wells=[
            "A2", "B2", "C2", "D2", "E2", "F2", "G2", "H2"
        ],
        liquid=liquid_3,
        volume=152,
    )
    well_plate_4.load_liquid(
        wells=[
            "A3", "B3", "C3", "D3", "E3", "F3", "G3", "H3"
        ],
        liquid=liquid_4,
        volume=518,
    )
    well_plate_5.load_liquid(
        wells=[
            "A1", "B1", "C1", "D1", "E1", "F1", "G1", "H1",
            "A2", "B2", "C2", "D2", "E2", "F2", "G2", "H2",
            "A3", "B3", "C3", "D3", "E3", "F3", "G3", "H3",
            "A4", "B4", "C4", "D4", "E4", "F4", "G4", "H4",
            "A5", "B5", "C5", "D5", "E5", "F5", "G5", "H5",
            "A6", "B6", "C6", "D6", "E6", "F6", "G6", "H6",
            "A7", "B7", "C7", "D7", "E7", "F7", "G7", "H7",
            "A8", "B8", "C8", "D8", "E8", "F8", "G8", "H8",
            "A9", "B9", "C9", "D9", "E9", "F9", "G9", "H9",
            "A10", "B10", "C10", "D10", "E10", "F10", "G10", "H10",
            "A11", "B11", "C11", "D11", "E11", "F11", "G11", "H11",
            "A12", "B12", "C12", "D12", "E12", "F12", "G12", "H12"
        ],
        liquid=liquid_5,
        volume=50,
    )

    # PROTOCOL STEPS

    # Step 1: Add ST2
    pipette.configure_nozzle_layout(
        protocol_api.COLUMN,
        start="A12",
    )
    pipette.transfer_with_liquid_class(
        volume=10.2,
        source=[well_plate_4["A2"], well_plate_4["A2"], well_plate_4["A2"], well_plate_4["A2"], well_plate_4["A2"], well_plate_4["A2"], well_plate_4["A2"], well_plate_4["A2"], well_plate_4["A2"], well_plate_4["A2"], well_plate_4["A2"], well_plate_4["A2"]],
        dest=[well_plate_5["A1"], well_plate_5["A2"], well_plate_5["A3"], well_plate_5["A4"], well_plate_5["A5"], well_plate_5["A6"], well_plate_5["A7"], well_plate_5["A8"], well_plate_5["A9"], well_plate_5["A10"], well_plate_5["A11"], well_plate_5["A12"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_2, tip_rack_3, tip_rack_4, tip_rack_5, tip_rack_8, tip_rack_6, tip_rack_7],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_1",
            properties={"flex_96channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_200ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 1.4},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 20)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "mix": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 35,
                        "start_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                    },
                    "retract": {
                        "air_gap_by_volume": [(0, 5)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 35,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 3.5},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 20)],
                    "delay": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 35,
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
                        "speed": 35,
                        "touch_tip": {
                            "enabled": True,
                            "z_offset": -1,
                            "mm_from_edge": 0,
                            "speed": 5,
                        },
                        "blowout": {"enabled": True, "location": "destination", "flow_rate": 15},
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 5)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
    )
    pipette.drop_tip(waste_chute)

    # Step 2: Seal, vortex, and spin LP1 plate
    protocol.pause("Seal - LP1 plate, vortex, and quick spin (600rpm x no time). Place back on deck at position D1.")

    # Step 3: 5 min ST2 incubation
    protocol.delay(seconds=300, msg="Incubate - LP1 plate off magnet for 5 minutes.")

    # Step 4: Move -LP1 to magnet
    protocol.pause("Move -LP1 plate to the black magnet at D2.")

    # Step 5: 2 min on magnet
    protocol.delay(seconds=120, msg="Incubate -LP1 plate on black magnet for 2 minutes.")

    # Step 6: Remove Super to Waste
    pipette.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette.transfer_with_liquid_class(
        volume=62,
        source=[well_plate_2["A1"]],
        dest=[well_plate_1["A1"]],
        new_tip="once",
        trash_location=waste_chute,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_1],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_6",
            properties={"flex_96channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_200ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 1.5},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 20)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "mix": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 35,
                        "start_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                    },
                    "retract": {
                        "air_gap_by_volume": [(0, 5)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 35,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 10},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 80)],
                    "delay": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 35,
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
                        "speed": 35,
                        "touch_tip": {
                            "enabled": True,
                            "z_offset": -1,
                            "mm_from_edge": 0,
                            "speed": 5,
                        },
                        "blowout": {"enabled": True, "location": "destination", "flow_rate": 80},
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 5)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
    )
    pipette.drop_tip(waste_chute)

    # Step 7: Move EMPTY tip box
    protocol.move_labware(tip_rack_1, "D4", use_gripper=True)

    # Step 8: Move tip box
    protocol.move_labware(tip_rack_3, adapter_1, use_gripper=True)

    # Step 9: Move -LP1 to Brown Base
    protocol.pause("Move -LP1 plate to brown base at D1.")

    # Step 10: TWB to -LP1 - Wash 1
    pipette.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette.transfer_with_liquid_class(
        volume=102,
        source=[reservoir_1["A1"]],
        dest=[well_plate_5["A1"]],
        new_tip="once",
        trash_location=waste_chute,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_3],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_10",
            properties={"flex_96channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_200ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 1.2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 20)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "mix": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 35,
                        "start_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                    },
                    "retract": {
                        "air_gap_by_volume": [(0, 5)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 35,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 6},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 50)],
                    "delay": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 35,
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
                        "speed": 35,
                        "touch_tip": {
                            "enabled": True,
                            "z_offset": -1,
                            "mm_from_edge": 0,
                            "speed": 5,
                        },
                        "blowout": {"enabled": True, "location": "destination", "flow_rate": 20},
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 5)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
    )
    pipette.drop_tip(waste_chute)

    # Step 11: Seal, Vortex, Spin, and Move -LP1 to Magnet
    protocol.pause("Seal, vortex, and quick spin (600rpm x no time). \nThen put the  -LP1 plate onto the black magnet at D2.")

    # Step 12: Move EMPTY tip box
    protocol.move_labware(tip_rack_3, "A2", use_gripper=True)

    # Step 13: Move tip box
    protocol.move_labware(tip_rack_4, adapter_1, use_gripper=True)

    # Step 14: 2 min on magnet
    protocol.delay(seconds=120, msg="Incubate -LP1 plate on black magnet for 2 minutes.")

    # Step 15: Remove TWB from -LP1 - Wash 1
    pipette.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette.transfer_with_liquid_class(
        volume=103,
        source=[well_plate_2["A1"]],
        dest=[well_plate_1["A1"]],
        new_tip="once",
        trash_location=waste_chute,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_4],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_15",
            properties={"flex_96channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_200ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 1.5},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 20)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "mix": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 35,
                        "start_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                    },
                    "retract": {
                        "air_gap_by_volume": [(0, 5)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 35,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 20},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 80)],
                    "delay": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 35,
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
                        "speed": 35,
                        "touch_tip": {
                            "enabled": True,
                            "z_offset": -1,
                            "mm_from_edge": 0,
                            "speed": 5,
                        },
                        "blowout": {"enabled": True, "location": "destination", "flow_rate": 80},
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 5)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
    )
    pipette.drop_tip(waste_chute)

    # Step 16: Move -LP1 to Brown Base
    protocol.pause("Move -LP1 plate to brown base at D1.")

    # Step 17: Move EMPTY tip box
    protocol.move_labware(tip_rack_4, "A3", use_gripper=True)

    # Step 18: Move tip box
    protocol.move_labware(tip_rack_6, adapter_1, use_gripper=True)

    # Step 19: TWB to -LP1 - Wash 2
    pipette.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette.transfer_with_liquid_class(
        volume=102,
        source=[reservoir_1["A1"]],
        dest=[well_plate_5["A1"]],
        new_tip="once",
        trash_location=waste_chute,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_6],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_19",
            properties={"flex_96channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_200ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 1.2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 20)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "mix": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 35,
                        "start_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                    },
                    "retract": {
                        "air_gap_by_volume": [(0, 5)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 35,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 6},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 50)],
                    "delay": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 35,
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
                        "speed": 35,
                        "touch_tip": {
                            "enabled": True,
                            "z_offset": -1,
                            "mm_from_edge": 0,
                            "speed": 5,
                        },
                        "blowout": {"enabled": True, "location": "destination", "flow_rate": 20},
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 5)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
    )
    pipette.drop_tip(waste_chute)

    # Step 20: Seal, Vortex, Spin, and Move -LP1 to Magnet
    protocol.pause("Seal, Vortex, and quick spin (600rpm x no time). \nThen place the -LP1 plate onto the black magnet at D2.")

    # Step 21: Move EMPTY tip box
    protocol.move_labware(tip_rack_6, "A4", use_gripper=True)

    # Step 22: Move Tip box
    protocol.move_labware(tip_rack_7, adapter_1, use_gripper=True)

    # Step 23: 2 min on magnet
    protocol.delay(seconds=120, msg="Incubate -LP1 plate on black magnet for 2 minutes.")

    # Step 24: Remove TWB from -LP1 - Wash 2
    pipette.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette.transfer_with_liquid_class(
        volume=103,
        source=[well_plate_2["A1"]],
        dest=[well_plate_1["A1"]],
        new_tip="once",
        trash_location=waste_chute,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_7],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_24",
            properties={"flex_96channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_200ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 1.5},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 20)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "mix": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 35,
                        "start_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                    },
                    "retract": {
                        "air_gap_by_volume": [(0, 5)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 35,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 20},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 80)],
                    "delay": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 35,
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
                        "speed": 35,
                        "touch_tip": {
                            "enabled": True,
                            "z_offset": -1,
                            "mm_from_edge": 0,
                            "speed": 5,
                        },
                        "blowout": {"enabled": True, "location": "destination", "flow_rate": 80},
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 5)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
    )
    pipette.drop_tip(waste_chute)

    # Step 25: Move -LP1 to Brown Base
    protocol.pause("Move -LP1 plate to brown base at D1.")

    # Step 26: Move EMPTY tip box
    protocol.move_labware(tip_rack_7, "B4", use_gripper=True)

    # Step 27: Move tip box
    protocol.move_labware(tip_rack_8, adapter_1, use_gripper=True)

    # Step 28: TWB to -LP1 - Wash 3
    pipette.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette.transfer_with_liquid_class(
        volume=102,
        source=[reservoir_1["A1"]],
        dest=[well_plate_5["A1"]],
        new_tip="once",
        trash_location=waste_chute,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_8],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_28",
            properties={"flex_96channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_200ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 1.2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 20)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "mix": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 35,
                        "start_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                    },
                    "retract": {
                        "air_gap_by_volume": [(0, 5)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 35,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 6},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 50)],
                    "delay": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 35,
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
                        "speed": 35,
                        "touch_tip": {
                            "enabled": True,
                            "z_offset": -1,
                            "mm_from_edge": 0,
                            "speed": 5,
                        },
                        "blowout": {"enabled": True, "location": "destination", "flow_rate": 20},
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 5)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
    )
    pipette.drop_tip(waste_chute)

    # Step 29: Seal, Vortex, Spin, and Move -LP1 to Magnet
    protocol.pause("Seal, vortex, and quick spin (600rpm x no time).\nThen place -LP1 plate onto the black magnet at D2.")

    # Step 30: Remove EMPTY tip box from C3
    protocol.move_labware(tip_rack_8, protocol_api.OFF_DECK)

    # Step 31: Remove EMPTY tip box from A1
    protocol.move_labware(tip_rack_2, protocol_api.OFF_DECK)

    # Step 32: Add NEW tip box to A1
    protocol.move_labware(tip_rack_9, "A1")

    # Step 33: Add NEW tip box to adapter at C3
    protocol.move_labware(tip_rack_10, adapter_1)

    # Step 34: 2 min on magnet
    protocol.delay(seconds=120, msg="Incubate -LP1 plate on black magnet for 2 minutes.")

    # Step 35: Remove TWB from -LP1 - Wash 3
    pipette.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette.transfer_with_liquid_class(
        volume=103,
        source=[well_plate_2["A1"]],
        dest=[well_plate_1["A1"]],
        new_tip="once",
        trash_location=waste_chute,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_10],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_35",
            properties={"flex_96channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_200ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 1.5},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 20)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "mix": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 35,
                        "start_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                    },
                    "retract": {
                        "air_gap_by_volume": [(0, 5)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 35,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 20},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 80)],
                    "delay": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 35,
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
                        "speed": 35,
                        "touch_tip": {
                            "enabled": True,
                            "z_offset": -1,
                            "mm_from_edge": 0,
                            "speed": 5,
                        },
                        "blowout": {"enabled": True, "location": "destination", "flow_rate": 80},
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 5)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
    )
    pipette.drop_tip(waste_chute)

    # Step 36: Move -LP1 to Brown Base
    protocol.pause("Move -LP1 plate to brown base at D1.")

    # Step 37: Add AMPMM to -LP1
    pipette.configure_nozzle_layout(
        protocol_api.COLUMN,
        start="A12",
    )
    pipette.transfer_with_liquid_class(
        volume=41,
        source=[well_plate_4["A3"], well_plate_4["A3"], well_plate_4["A3"], well_plate_4["A3"], well_plate_4["A3"], well_plate_4["A3"], well_plate_4["A3"], well_plate_4["A3"], well_plate_4["A3"], well_plate_4["A3"], well_plate_4["A3"], well_plate_4["A3"]],
        dest=[well_plate_5["A1"], well_plate_5["A2"], well_plate_5["A3"], well_plate_5["A4"], well_plate_5["A5"], well_plate_5["A6"], well_plate_5["A7"], well_plate_5["A8"], well_plate_5["A9"], well_plate_5["A10"], well_plate_5["A11"], well_plate_5["A12"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_3, tip_rack_4, tip_rack_5, tip_rack_9, tip_rack_1, tip_rack_6, tip_rack_7],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_37",
            properties={"flex_96channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_200ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 1.4},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 15)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "mix": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 35,
                        "start_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                    },
                    "retract": {
                        "air_gap_by_volume": [(0, 5)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 35,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 5},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 25)],
                    "delay": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 35,
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
                        "speed": 35,
                        "touch_tip": {
                            "enabled": True,
                            "z_offset": -1,
                            "mm_from_edge": 0,
                            "speed": 5,
                        },
                        "blowout": {"enabled": True, "location": "destination", "flow_rate": 25},
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 5)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
    )
    pipette.drop_tip(waste_chute)

    # Step 38: Move EMPTY tip box
    protocol.move_labware(tip_rack_10, "C4", use_gripper=True)

    # Step 39: Move tip box
    protocol.move_labware(tip_rack_9, adapter_1, use_gripper=True)

    # Step 40: Indexed Adapters to -LP1
    pipette.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette.transfer_with_liquid_class(
        volume=16,
        source=[well_plate_3["A1"]],
        dest=[well_plate_5["A1"]],
        new_tip="once",
        trash_location=waste_chute,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_9],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_40",
            properties={"flex_96channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_200ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 1.1},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 5)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "mix": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 35,
                        "start_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                    },
                    "retract": {
                        "air_gap_by_volume": [(0, 5)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 35,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 3.5},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 5)],
                    "delay": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 35,
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
                        "speed": 35,
                        "touch_tip": {
                            "enabled": True,
                            "z_offset": -1,
                            "mm_from_edge": 0,
                            "speed": 5,
                        },
                        "blowout": {"enabled": True, "location": "destination", "flow_rate": 5},
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 5)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
    )
    pipette.drop_tip(waste_chute)

CUSTOM_LABWARE = json.loads("""{"custom_beta/axygen_pcr_96_well_black_mag_base/1":{"ordering":[["A1","B1","C1","D1","E1","F1","G1","H1"],["A2","B2","C2","D2","E2","F2","G2","H2"],["A3","B3","C3","D3","E3","F3","G3","H3"],["A4","B4","C4","D4","E4","F4","G4","H4"],["A5","B5","C5","D5","E5","F5","G5","H5"],["A6","B6","C6","D6","E6","F6","G6","H6"],["A7","B7","C7","D7","E7","F7","G7","H7"],["A8","B8","C8","D8","E8","F8","G8","H8"],["A9","B9","C9","D9","E9","F9","G9","H9"],["A10","B10","C10","D10","E10","F10","G10","H10"],["A11","B11","C11","D11","E11","F11","G11","H11"],["A12","B12","C12","D12","E12","F12","G12","H12"]],"brand":{"brand":"Axygen","brandId":[]},"metadata":{"displayName":"Axygen PCR plate in a black mag base","displayCategory":"wellPlate","displayVolumeUnits":"µL","tags":[]},"dimensions":{"xDimension":127.76,"yDimension":85.48,"zDimension":31.3},"wells":{"A1":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":14.38,"y":74.24,"z":11.1},"B1":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":14.38,"y":65.24,"z":11.1},"C1":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":14.38,"y":56.24,"z":11.1},"D1":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":14.38,"y":47.24,"z":11.1},"E1":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":14.38,"y":38.24,"z":11.1},"F1":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":14.38,"y":29.24,"z":11.1},"G1":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":14.38,"y":20.24,"z":11.1},"H1":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":14.38,"y":11.24,"z":11.1},"A2":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":23.38,"y":74.24,"z":11.1},"B2":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":23.38,"y":65.24,"z":11.1},"C2":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":23.38,"y":56.24,"z":11.1},"D2":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":23.38,"y":47.24,"z":11.1},"E2":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":23.38,"y":38.24,"z":11.1},"F2":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":23.38,"y":29.24,"z":11.1},"G2":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":23.38,"y":20.24,"z":11.1},"H2":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":23.38,"y":11.24,"z":11.1},"A3":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":32.38,"y":74.24,"z":11.1},"B3":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":32.38,"y":65.24,"z":11.1},"C3":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":32.38,"y":56.24,"z":11.1},"D3":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":32.38,"y":47.24,"z":11.1},"E3":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":32.38,"y":38.24,"z":11.1},"F3":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":32.38,"y":29.24,"z":11.1},"G3":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":32.38,"y":20.24,"z":11.1},"H3":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":32.38,"y":11.24,"z":11.1},"A4":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":41.38,"y":74.24,"z":11.1},"B4":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":41.38,"y":65.24,"z":11.1},"C4":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":41.38,"y":56.24,"z":11.1},"D4":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":41.38,"y":47.24,"z":11.1},"E4":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":41.38,"y":38.24,"z":11.1},"F4":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":41.38,"y":29.24,"z":11.1},"G4":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":41.38,"y":20.24,"z":11.1},"H4":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":41.38,"y":11.24,"z":11.1},"A5":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":50.38,"y":74.24,"z":11.1},"B5":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":50.38,"y":65.24,"z":11.1},"C5":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":50.38,"y":56.24,"z":11.1},"D5":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":50.38,"y":47.24,"z":11.1},"E5":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":50.38,"y":38.24,"z":11.1},"F5":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":50.38,"y":29.24,"z":11.1},"G5":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":50.38,"y":20.24,"z":11.1},"H5":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":50.38,"y":11.24,"z":11.1},"A6":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":59.38,"y":74.24,"z":11.1},"B6":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":59.38,"y":65.24,"z":11.1},"C6":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":59.38,"y":56.24,"z":11.1},"D6":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":59.38,"y":47.24,"z":11.1},"E6":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":59.38,"y":38.24,"z":11.1},"F6":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":59.38,"y":29.24,"z":11.1},"G6":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":59.38,"y":20.24,"z":11.1},"H6":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":59.38,"y":11.24,"z":11.1},"A7":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":68.38,"y":74.24,"z":11.1},"B7":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":68.38,"y":65.24,"z":11.1},"C7":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":68.38,"y":56.24,"z":11.1},"D7":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":68.38,"y":47.24,"z":11.1},"E7":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":68.38,"y":38.24,"z":11.1},"F7":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":68.38,"y":29.24,"z":11.1},"G7":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":68.38,"y":20.24,"z":11.1},"H7":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":68.38,"y":11.24,"z":11.1},"A8":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":77.38,"y":74.24,"z":11.1},"B8":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":77.38,"y":65.24,"z":11.1},"C8":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":77.38,"y":56.24,"z":11.1},"D8":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":77.38,"y":47.24,"z":11.1},"E8":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":77.38,"y":38.24,"z":11.1},"F8":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":77.38,"y":29.24,"z":11.1},"G8":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":77.38,"y":20.24,"z":11.1},"H8":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":77.38,"y":11.24,"z":11.1},"A9":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":86.38,"y":74.24,"z":11.1},"B9":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":86.38,"y":65.24,"z":11.1},"C9":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":86.38,"y":56.24,"z":11.1},"D9":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":86.38,"y":47.24,"z":11.1},"E9":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":86.38,"y":38.24,"z":11.1},"F9":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":86.38,"y":29.24,"z":11.1},"G9":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":86.38,"y":20.24,"z":11.1},"H9":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":86.38,"y":11.24,"z":11.1},"A10":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":95.38,"y":74.24,"z":11.1},"B10":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":95.38,"y":65.24,"z":11.1},"C10":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":95.38,"y":56.24,"z":11.1},"D10":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":95.38,"y":47.24,"z":11.1},"E10":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":95.38,"y":38.24,"z":11.1},"F10":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":95.38,"y":29.24,"z":11.1},"G10":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":95.38,"y":20.24,"z":11.1},"H10":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":95.38,"y":11.24,"z":11.1},"A11":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":104.38,"y":74.24,"z":11.1},"B11":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":104.38,"y":65.24,"z":11.1},"C11":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":104.38,"y":56.24,"z":11.1},"D11":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":104.38,"y":47.24,"z":11.1},"E11":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":104.38,"y":38.24,"z":11.1},"F11":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":104.38,"y":29.24,"z":11.1},"G11":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":104.38,"y":20.24,"z":11.1},"H11":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":104.38,"y":11.24,"z":11.1},"A12":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":113.38,"y":74.24,"z":11.1},"B12":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":113.38,"y":65.24,"z":11.1},"C12":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":113.38,"y":56.24,"z":11.1},"D12":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":113.38,"y":47.24,"z":11.1},"E12":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":113.38,"y":38.24,"z":11.1},"F12":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":113.38,"y":29.24,"z":11.1},"G12":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":113.38,"y":20.24,"z":11.1},"H12":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":113.38,"y":11.24,"z":11.1}},"groups":[{"metadata":{"wellBottomShape":"v"},"wells":["A1","B1","C1","D1","E1","F1","G1","H1","A2","B2","C2","D2","E2","F2","G2","H2","A3","B3","C3","D3","E3","F3","G3","H3","A4","B4","C4","D4","E4","F4","G4","H4","A5","B5","C5","D5","E5","F5","G5","H5","A6","B6","C6","D6","E6","F6","G6","H6","A7","B7","C7","D7","E7","F7","G7","H7","A8","B8","C8","D8","E8","F8","G8","H8","A9","B9","C9","D9","E9","F9","G9","H9","A10","B10","C10","D10","E10","F10","G10","H10","A11","B11","C11","D11","E11","F11","G11","H11","A12","B12","C12","D12","E12","F12","G12","H12"]}],"parameters":{"format":"irregular","quirks":[],"isTiprack":false,"isMagneticModuleCompatible":false,"loadName":"axygen_pcr_96_well_black_mag_base"},"namespace":"custom_beta","version":1,"schemaVersion":2,"cornerOffsetFromSlot":{"x":0,"y":0,"z":0}},"custom_beta/eppendorf_96_wellplate_150aul/1":{"ordering":[["A1","B1","C1","D1","E1","F1","G1","H1"],["A2","B2","C2","D2","E2","F2","G2","H2"],["A3","B3","C3","D3","E3","F3","G3","H3"],["A4","B4","C4","D4","E4","F4","G4","H4"],["A5","B5","C5","D5","E5","F5","G5","H5"],["A6","B6","C6","D6","E6","F6","G6","H6"],["A7","B7","C7","D7","E7","F7","G7","H7"],["A8","B8","C8","D8","E8","F8","G8","H8"],["A9","B9","C9","D9","E9","F9","G9","H9"],["A10","B10","C10","D10","E10","F10","G10","H10"],["A11","B11","C11","D11","E11","F11","G11","H11"],["A12","B12","C12","D12","E12","F12","G12","H12"]],"brand":{"brand":"eppendorf","brandId":[]},"metadata":{"displayName":"Eppendorf 96 Well Plate 150 µL","displayCategory":"wellPlate","displayVolumeUnits":"µL","tags":[]},"dimensions":{"xDimension":127.76,"yDimension":85.48,"zDimension":15.3},"wells":{"A1":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":14.38,"y":74.63,"z":0.7},"B1":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":14.38,"y":65.63,"z":0.7},"C1":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":14.38,"y":56.63,"z":0.7},"D1":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":14.38,"y":47.63,"z":0.7},"E1":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":14.38,"y":38.63,"z":0.7},"F1":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":14.38,"y":29.63,"z":0.7},"G1":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":14.38,"y":20.63,"z":0.7},"H1":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":14.38,"y":11.63,"z":0.7},"A2":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":23.38,"y":74.63,"z":0.7},"B2":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":23.38,"y":65.63,"z":0.7},"C2":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":23.38,"y":56.63,"z":0.7},"D2":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":23.38,"y":47.63,"z":0.7},"E2":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":23.38,"y":38.63,"z":0.7},"F2":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":23.38,"y":29.63,"z":0.7},"G2":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":23.38,"y":20.63,"z":0.7},"H2":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":23.38,"y":11.63,"z":0.7},"A3":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":32.38,"y":74.63,"z":0.7},"B3":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":32.38,"y":65.63,"z":0.7},"C3":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":32.38,"y":56.63,"z":0.7},"D3":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":32.38,"y":47.63,"z":0.7},"E3":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":32.38,"y":38.63,"z":0.7},"F3":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":32.38,"y":29.63,"z":0.7},"G3":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":32.38,"y":20.63,"z":0.7},"H3":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":32.38,"y":11.63,"z":0.7},"A4":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":41.38,"y":74.63,"z":0.7},"B4":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":41.38,"y":65.63,"z":0.7},"C4":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":41.38,"y":56.63,"z":0.7},"D4":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":41.38,"y":47.63,"z":0.7},"E4":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":41.38,"y":38.63,"z":0.7},"F4":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":41.38,"y":29.63,"z":0.7},"G4":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":41.38,"y":20.63,"z":0.7},"H4":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":41.38,"y":11.63,"z":0.7},"A5":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":50.38,"y":74.63,"z":0.7},"B5":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":50.38,"y":65.63,"z":0.7},"C5":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":50.38,"y":56.63,"z":0.7},"D5":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":50.38,"y":47.63,"z":0.7},"E5":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":50.38,"y":38.63,"z":0.7},"F5":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":50.38,"y":29.63,"z":0.7},"G5":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":50.38,"y":20.63,"z":0.7},"H5":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":50.38,"y":11.63,"z":0.7},"A6":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":59.38,"y":74.63,"z":0.7},"B6":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":59.38,"y":65.63,"z":0.7},"C6":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":59.38,"y":56.63,"z":0.7},"D6":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":59.38,"y":47.63,"z":0.7},"E6":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":59.38,"y":38.63,"z":0.7},"F6":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":59.38,"y":29.63,"z":0.7},"G6":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":59.38,"y":20.63,"z":0.7},"H6":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":59.38,"y":11.63,"z":0.7},"A7":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":68.38,"y":74.63,"z":0.7},"B7":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":68.38,"y":65.63,"z":0.7},"C7":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":68.38,"y":56.63,"z":0.7},"D7":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":68.38,"y":47.63,"z":0.7},"E7":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":68.38,"y":38.63,"z":0.7},"F7":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":68.38,"y":29.63,"z":0.7},"G7":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":68.38,"y":20.63,"z":0.7},"H7":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":68.38,"y":11.63,"z":0.7},"A8":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":77.38,"y":74.63,"z":0.7},"B8":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":77.38,"y":65.63,"z":0.7},"C8":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":77.38,"y":56.63,"z":0.7},"D8":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":77.38,"y":47.63,"z":0.7},"E8":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":77.38,"y":38.63,"z":0.7},"F8":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":77.38,"y":29.63,"z":0.7},"G8":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":77.38,"y":20.63,"z":0.7},"H8":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":77.38,"y":11.63,"z":0.7},"A9":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":86.38,"y":74.63,"z":0.7},"B9":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":86.38,"y":65.63,"z":0.7},"C9":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":86.38,"y":56.63,"z":0.7},"D9":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":86.38,"y":47.63,"z":0.7},"E9":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":86.38,"y":38.63,"z":0.7},"F9":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":86.38,"y":29.63,"z":0.7},"G9":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":86.38,"y":20.63,"z":0.7},"H9":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":86.38,"y":11.63,"z":0.7},"A10":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":95.38,"y":74.63,"z":0.7},"B10":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":95.38,"y":65.63,"z":0.7},"C10":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":95.38,"y":56.63,"z":0.7},"D10":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":95.38,"y":47.63,"z":0.7},"E10":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":95.38,"y":38.63,"z":0.7},"F10":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":95.38,"y":29.63,"z":0.7},"G10":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":95.38,"y":20.63,"z":0.7},"H10":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":95.38,"y":11.63,"z":0.7},"A11":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":104.38,"y":74.63,"z":0.7},"B11":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":104.38,"y":65.63,"z":0.7},"C11":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":104.38,"y":56.63,"z":0.7},"D11":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":104.38,"y":47.63,"z":0.7},"E11":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":104.38,"y":38.63,"z":0.7},"F11":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":104.38,"y":29.63,"z":0.7},"G11":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":104.38,"y":20.63,"z":0.7},"H11":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":104.38,"y":11.63,"z":0.7},"A12":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":113.38,"y":74.63,"z":0.7},"B12":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":113.38,"y":65.63,"z":0.7},"C12":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":113.38,"y":56.63,"z":0.7},"D12":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":113.38,"y":47.63,"z":0.7},"E12":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":113.38,"y":38.63,"z":0.7},"F12":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":113.38,"y":29.63,"z":0.7},"G12":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":113.38,"y":20.63,"z":0.7},"H12":{"depth":14.6,"totalLiquidVolume":150,"shape":"circular","diameter":5.5,"x":113.38,"y":11.63,"z":0.7}},"groups":[{"metadata":{"wellBottomShape":"v"},"wells":["A1","B1","C1","D1","E1","F1","G1","H1","A2","B2","C2","D2","E2","F2","G2","H2","A3","B3","C3","D3","E3","F3","G3","H3","A4","B4","C4","D4","E4","F4","G4","H4","A5","B5","C5","D5","E5","F5","G5","H5","A6","B6","C6","D6","E6","F6","G6","H6","A7","B7","C7","D7","E7","F7","G7","H7","A8","B8","C8","D8","E8","F8","G8","H8","A9","B9","C9","D9","E9","F9","G9","H9","A10","B10","C10","D10","E10","F10","G10","H10","A11","B11","C11","D11","E11","F11","G11","H11","A12","B12","C12","D12","E12","F12","G12","H12"]}],"parameters":{"format":"irregular","quirks":[],"isTiprack":false,"isMagneticModuleCompatible":false,"loadName":"eppendorf_96_wellplate_150aul"},"namespace":"custom_beta","version":1,"schemaVersion":2,"cornerOffsetFromSlot":{"x":0,"y":0,"z":0}},"custom_beta/thermofisher_96_wellplate_700ul/1":{"brand":{"brand":"ThermoFisher","brandId":["AB0765"]},"wells":{"A1":{"x":14.38,"y":74.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"A2":{"x":23.38,"y":74.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"A3":{"x":32.38,"y":74.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"A4":{"x":41.38,"y":74.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"A5":{"x":50.38,"y":74.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"A6":{"x":59.38,"y":74.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"A7":{"x":68.38,"y":74.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"A8":{"x":77.38,"y":74.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"A9":{"x":86.38,"y":74.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"B1":{"x":14.38,"y":65.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"B2":{"x":23.38,"y":65.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"B3":{"x":32.38,"y":65.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"B4":{"x":41.38,"y":65.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"B5":{"x":50.38,"y":65.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"B6":{"x":59.38,"y":65.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"B7":{"x":68.38,"y":65.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"B8":{"x":77.38,"y":65.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"B9":{"x":86.38,"y":65.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"C1":{"x":14.38,"y":56.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"C2":{"x":23.38,"y":56.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"C3":{"x":32.38,"y":56.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"C4":{"x":41.38,"y":56.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"C5":{"x":50.38,"y":56.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"C6":{"x":59.38,"y":56.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"C7":{"x":68.38,"y":56.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"C8":{"x":77.38,"y":56.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"C9":{"x":86.38,"y":56.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"D1":{"x":14.38,"y":47.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"D2":{"x":23.38,"y":47.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"D3":{"x":32.38,"y":47.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"D4":{"x":41.38,"y":47.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"D5":{"x":50.38,"y":47.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"D6":{"x":59.38,"y":47.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"D7":{"x":68.38,"y":47.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"D8":{"x":77.38,"y":47.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"D9":{"x":86.38,"y":47.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"E1":{"x":14.38,"y":38.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"E2":{"x":23.38,"y":38.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"E3":{"x":32.38,"y":38.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"E4":{"x":41.38,"y":38.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"E5":{"x":50.38,"y":38.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"E6":{"x":59.38,"y":38.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"E7":{"x":68.38,"y":38.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"E8":{"x":77.38,"y":38.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"E9":{"x":86.38,"y":38.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"F1":{"x":14.38,"y":29.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"F2":{"x":23.38,"y":29.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"F3":{"x":32.38,"y":29.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"F4":{"x":41.38,"y":29.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"F5":{"x":50.38,"y":29.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"F6":{"x":59.38,"y":29.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"F7":{"x":68.38,"y":29.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"F8":{"x":77.38,"y":29.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"F9":{"x":86.38,"y":29.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"G1":{"x":14.38,"y":20.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"G2":{"x":23.38,"y":20.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"G3":{"x":32.38,"y":20.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"G4":{"x":41.38,"y":20.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"G5":{"x":50.38,"y":20.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"G6":{"x":59.38,"y":20.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"G7":{"x":68.38,"y":20.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"G8":{"x":77.38,"y":20.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"G9":{"x":86.38,"y":20.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"H1":{"x":14.38,"y":11.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"H2":{"x":23.38,"y":11.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"H3":{"x":32.38,"y":11.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"H4":{"x":41.38,"y":11.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"H5":{"x":50.38,"y":11.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"H6":{"x":59.38,"y":11.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"H7":{"x":68.38,"y":11.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"H8":{"x":77.38,"y":11.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"H9":{"x":86.38,"y":11.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"A10":{"x":95.38,"y":74.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"A11":{"x":104.38,"y":74.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"A12":{"x":113.38,"y":74.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"B10":{"x":95.38,"y":65.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"B11":{"x":104.38,"y":65.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"B12":{"x":113.38,"y":65.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"C10":{"x":95.38,"y":56.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"C11":{"x":104.38,"y":56.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"C12":{"x":113.38,"y":56.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"D10":{"x":95.38,"y":47.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"D11":{"x":104.38,"y":47.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"D12":{"x":113.38,"y":47.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"E10":{"x":95.38,"y":38.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"E11":{"x":104.38,"y":38.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"E12":{"x":113.38,"y":38.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"F10":{"x":95.38,"y":29.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"F11":{"x":104.38,"y":29.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"F12":{"x":113.38,"y":29.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"G10":{"x":95.38,"y":20.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"G11":{"x":104.38,"y":20.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"G12":{"x":113.38,"y":20.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"H10":{"x":95.38,"y":11.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"H11":{"x":104.38,"y":11.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700},"H12":{"x":113.38,"y":11.24,"z":4.2,"depth":26.8,"shape":"circular","diameter":6.5,"totalLiquidVolume":700}},"groups":[{"wells":["A1","B1","C1","D1","E1","F1","G1","H1","A2","B2","C2","D2","E2","F2","G2","H2","A3","B3","C3","D3","E3","F3","G3","H3","A4","B4","C4","D4","E4","F4","G4","H4","A5","B5","C5","D5","E5","F5","G5","H5","A6","B6","C6","D6","E6","F6","G6","H6","A7","B7","C7","D7","E7","F7","G7","H7","A8","B8","C8","D8","E8","F8","G8","H8","A9","B9","C9","D9","E9","F9","G9","H9","A10","B10","C10","D10","E10","F10","G10","H10","A11","B11","C11","D11","E11","F11","G11","H11","A12","B12","C12","D12","E12","F12","G12","H12"],"metadata":{"wellBottomShape":"v"}}],"version":1,"metadata":{"tags":[],"displayName":"ThermoFisher MIDI 96 well Plate V-bottom 800uL","displayCategory":"wellPlate","displayVolumeUnits":"µL"},"ordering":[["A1","B1","C1","D1","E1","F1","G1","H1"],["A2","B2","C2","D2","E2","F2","G2","H2"],["A3","B3","C3","D3","E3","F3","G3","H3"],["A4","B4","C4","D4","E4","F4","G4","H4"],["A5","B5","C5","D5","E5","F5","G5","H5"],["A6","B6","C6","D6","E6","F6","G6","H6"],["A7","B7","C7","D7","E7","F7","G7","H7"],["A8","B8","C8","D8","E8","F8","G8","H8"],["A9","B9","C9","D9","E9","F9","G9","H9"],["A10","B10","C10","D10","E10","F10","G10","H10"],["A11","B11","C11","D11","E11","F11","G11","H11"],["A12","B12","C12","D12","E12","F12","G12","H12"]],"namespace":"custom_beta","dimensions":{"xDimension":127.76,"yDimension":85.48,"zDimension":31},"parameters":{"format":"irregular","quirks":[],"loadName":"thermofisher_96_wellplate_700ul","isTiprack":false,"isMagneticModuleCompatible":false},"schemaVersion":2,"cornerOffsetFromSlot":{"x":0,"y":0,"z":0}},"custom_beta/axygen_pcr_96_well_brown_base/1":{"ordering":[["A1","B1","C1","D1","E1","F1","G1","H1"],["A2","B2","C2","D2","E2","F2","G2","H2"],["A3","B3","C3","D3","E3","F3","G3","H3"],["A4","B4","C4","D4","E4","F4","G4","H4"],["A5","B5","C5","D5","E5","F5","G5","H5"],["A6","B6","C6","D6","E6","F6","G6","H6"],["A7","B7","C7","D7","E7","F7","G7","H7"],["A8","B8","C8","D8","E8","F8","G8","H8"],["A9","B9","C9","D9","E9","F9","G9","H9"],["A10","B10","C10","D10","E10","F10","G10","H10"],["A11","B11","C11","D11","E11","F11","G11","H11"],["A12","B12","C12","D12","E12","F12","G12","H12"]],"brand":{"brand":"Axygen","brandId":[]},"metadata":{"displayName":"Axygen PCR plate in a brown base","displayCategory":"wellPlate","displayVolumeUnits":"µL","tags":[]},"dimensions":{"xDimension":127.76,"yDimension":85.48,"zDimension":24.3},"wells":{"A1":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":14.18,"y":74.83,"z":4.1},"B1":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":14.18,"y":65.83,"z":4.1},"C1":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":14.18,"y":56.83,"z":4.1},"D1":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":14.18,"y":47.83,"z":4.1},"E1":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":14.18,"y":38.83,"z":4.1},"F1":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":14.18,"y":29.83,"z":4.1},"G1":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":14.18,"y":20.83,"z":4.1},"H1":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":14.18,"y":11.83,"z":4.1},"A2":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":23.18,"y":74.83,"z":4.1},"B2":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":23.18,"y":65.83,"z":4.1},"C2":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":23.18,"y":56.83,"z":4.1},"D2":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":23.18,"y":47.83,"z":4.1},"E2":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":23.18,"y":38.83,"z":4.1},"F2":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":23.18,"y":29.83,"z":4.1},"G2":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":23.18,"y":20.83,"z":4.1},"H2":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":23.18,"y":11.83,"z":4.1},"A3":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":32.18,"y":74.83,"z":4.1},"B3":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":32.18,"y":65.83,"z":4.1},"C3":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":32.18,"y":56.83,"z":4.1},"D3":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":32.18,"y":47.83,"z":4.1},"E3":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":32.18,"y":38.83,"z":4.1},"F3":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":32.18,"y":29.83,"z":4.1},"G3":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":32.18,"y":20.83,"z":4.1},"H3":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":32.18,"y":11.83,"z":4.1},"A4":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":41.18,"y":74.83,"z":4.1},"B4":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":41.18,"y":65.83,"z":4.1},"C4":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":41.18,"y":56.83,"z":4.1},"D4":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":41.18,"y":47.83,"z":4.1},"E4":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":41.18,"y":38.83,"z":4.1},"F4":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":41.18,"y":29.83,"z":4.1},"G4":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":41.18,"y":20.83,"z":4.1},"H4":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":41.18,"y":11.83,"z":4.1},"A5":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":50.18,"y":74.83,"z":4.1},"B5":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":50.18,"y":65.83,"z":4.1},"C5":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":50.18,"y":56.83,"z":4.1},"D5":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":50.18,"y":47.83,"z":4.1},"E5":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":50.18,"y":38.83,"z":4.1},"F5":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":50.18,"y":29.83,"z":4.1},"G5":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":50.18,"y":20.83,"z":4.1},"H5":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":50.18,"y":11.83,"z":4.1},"A6":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":59.18,"y":74.83,"z":4.1},"B6":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":59.18,"y":65.83,"z":4.1},"C6":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":59.18,"y":56.83,"z":4.1},"D6":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":59.18,"y":47.83,"z":4.1},"E6":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":59.18,"y":38.83,"z":4.1},"F6":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":59.18,"y":29.83,"z":4.1},"G6":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":59.18,"y":20.83,"z":4.1},"H6":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":59.18,"y":11.83,"z":4.1},"A7":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":68.18,"y":74.83,"z":4.1},"B7":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":68.18,"y":65.83,"z":4.1},"C7":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":68.18,"y":56.83,"z":4.1},"D7":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":68.18,"y":47.83,"z":4.1},"E7":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":68.18,"y":38.83,"z":4.1},"F7":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":68.18,"y":29.83,"z":4.1},"G7":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":68.18,"y":20.83,"z":4.1},"H7":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":68.18,"y":11.83,"z":4.1},"A8":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":77.18,"y":74.83,"z":4.1},"B8":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":77.18,"y":65.83,"z":4.1},"C8":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":77.18,"y":56.83,"z":4.1},"D8":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":77.18,"y":47.83,"z":4.1},"E8":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":77.18,"y":38.83,"z":4.1},"F8":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":77.18,"y":29.83,"z":4.1},"G8":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":77.18,"y":20.83,"z":4.1},"H8":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":77.18,"y":11.83,"z":4.1},"A9":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":86.18,"y":74.83,"z":4.1},"B9":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":86.18,"y":65.83,"z":4.1},"C9":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":86.18,"y":56.83,"z":4.1},"D9":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":86.18,"y":47.83,"z":4.1},"E9":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":86.18,"y":38.83,"z":4.1},"F9":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":86.18,"y":29.83,"z":4.1},"G9":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":86.18,"y":20.83,"z":4.1},"H9":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":86.18,"y":11.83,"z":4.1},"A10":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":95.18,"y":74.83,"z":4.1},"B10":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":95.18,"y":65.83,"z":4.1},"C10":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":95.18,"y":56.83,"z":4.1},"D10":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":95.18,"y":47.83,"z":4.1},"E10":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":95.18,"y":38.83,"z":4.1},"F10":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":95.18,"y":29.83,"z":4.1},"G10":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":95.18,"y":20.83,"z":4.1},"H10":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":95.18,"y":11.83,"z":4.1},"A11":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":104.18,"y":74.83,"z":4.1},"B11":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":104.18,"y":65.83,"z":4.1},"C11":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":104.18,"y":56.83,"z":4.1},"D11":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":104.18,"y":47.83,"z":4.1},"E11":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":104.18,"y":38.83,"z":4.1},"F11":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":104.18,"y":29.83,"z":4.1},"G11":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":104.18,"y":20.83,"z":4.1},"H11":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":104.18,"y":11.83,"z":4.1},"A12":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":113.18,"y":74.83,"z":4.1},"B12":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":113.18,"y":65.83,"z":4.1},"C12":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":113.18,"y":56.83,"z":4.1},"D12":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":113.18,"y":47.83,"z":4.1},"E12":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":113.18,"y":38.83,"z":4.1},"F12":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":113.18,"y":29.83,"z":4.1},"G12":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":113.18,"y":20.83,"z":4.1},"H12":{"depth":20.2,"totalLiquidVolume":200,"shape":"circular","diameter":5.4,"x":113.18,"y":11.83,"z":4.1}},"groups":[{"metadata":{"wellBottomShape":"v"},"wells":["A1","B1","C1","D1","E1","F1","G1","H1","A2","B2","C2","D2","E2","F2","G2","H2","A3","B3","C3","D3","E3","F3","G3","H3","A4","B4","C4","D4","E4","F4","G4","H4","A5","B5","C5","D5","E5","F5","G5","H5","A6","B6","C6","D6","E6","F6","G6","H6","A7","B7","C7","D7","E7","F7","G7","H7","A8","B8","C8","D8","E8","F8","G8","H8","A9","B9","C9","D9","E9","F9","G9","H9","A10","B10","C10","D10","E10","F10","G10","H10","A11","B11","C11","D11","E11","F11","G11","H11","A12","B12","C12","D12","E12","F12","G12","H12"]}],"parameters":{"format":"irregular","quirks":[],"isTiprack":false,"isMagneticModuleCompatible":false,"loadName":"axygen_pcr_96_well_brown_base"},"namespace":"custom_beta","version":1,"schemaVersion":2,"cornerOffsetFromSlot":{"x":0,"y":0,"z":0}}}""")

DESIGNER_APPLICATION = """{"robot":{"model":"OT-3 Standard"},"designerApplication":{"name":"opentrons/protocol-designer","version":"8.8.0","data":{"pipetteTiprackAssignments":{"a25670d6-a221-4d25-a49a-9737f3ee3d3b":["opentrons/opentrons_flex_96_filtertiprack_200ul/1"]},"dismissedWarnings":{"form":[],"timeline":["ASPIRATE_FROM_PRISTINE_WELL"]},"ingredients":{"0":{"displayName":"TWB","description":null,"displayColor":"#9af4d0ff","liquidGroupId":"0","liquidClass":null},"1":{"displayName":"Illumina indexes","description":null,"displayColor":"#ba27adff","liquidGroupId":"1","liquidClass":null},"2":{"displayName":"ST2 Buffer","description":null,"displayColor":"#ffd600ff","liquidGroupId":"2","liquidClass":null},"3":{"displayName":"AMPMM","description":null,"displayColor":"#630b8cff","liquidGroupId":"3","liquidClass":null},"4":{"displayName":"Tag Bead DNA","description":"LP1 plate from previous phase with Tagmentation buffer, beads, and DNA","displayColor":"#f7af42ff","liquidGroupId":"4","liquidClass":null}},"ingredLocations":{"8b10a60a-bb04-401b-970e-7d00e4dc663d:opentrons/axygen_1_reservoir_90ml/3":{"A1":{"0":{"volume":70000}}},"b92dde37-18c7-4129-a8a9-ca5b6980a9d5:custom_beta/eppendorf_96_wellplate_150aul/1":{"A1":{"1":{"volume":20}},"B1":{"1":{"volume":20}},"C1":{"1":{"volume":20}},"D1":{"1":{"volume":20}},"E1":{"1":{"volume":20}},"F1":{"1":{"volume":20}},"G1":{"1":{"volume":20}},"H1":{"1":{"volume":20}},"A2":{"1":{"volume":20}},"B2":{"1":{"volume":20}},"C2":{"1":{"volume":20}},"D2":{"1":{"volume":20}},"E2":{"1":{"volume":20}},"F2":{"1":{"volume":20}},"G2":{"1":{"volume":20}},"H2":{"1":{"volume":20}},"A3":{"1":{"volume":20}},"B3":{"1":{"volume":20}},"C3":{"1":{"volume":20}},"D3":{"1":{"volume":20}},"E3":{"1":{"volume":20}},"F3":{"1":{"volume":20}},"G3":{"1":{"volume":20}},"H3":{"1":{"volume":20}},"A4":{"1":{"volume":20}},"B4":{"1":{"volume":20}},"C4":{"1":{"volume":20}},"D4":{"1":{"volume":20}},"E4":{"1":{"volume":20}},"F4":{"1":{"volume":20}},"G4":{"1":{"volume":20}},"H4":{"1":{"volume":20}},"A5":{"1":{"volume":20}},"B5":{"1":{"volume":20}},"C5":{"1":{"volume":20}},"D5":{"1":{"volume":20}},"E5":{"1":{"volume":20}},"F5":{"1":{"volume":20}},"G5":{"1":{"volume":20}},"H5":{"1":{"volume":20}},"A6":{"1":{"volume":20}},"B6":{"1":{"volume":20}},"C6":{"1":{"volume":20}},"D6":{"1":{"volume":20}},"E6":{"1":{"volume":20}},"F6":{"1":{"volume":20}},"G6":{"1":{"volume":20}},"H6":{"1":{"volume":20}},"A7":{"1":{"volume":20}},"B7":{"1":{"volume":20}},"C7":{"1":{"volume":20}},"D7":{"1":{"volume":20}},"E7":{"1":{"volume":20}},"F7":{"1":{"volume":20}},"G7":{"1":{"volume":20}},"H7":{"1":{"volume":20}},"A8":{"1":{"volume":20}},"B8":{"1":{"volume":20}},"C8":{"1":{"volume":20}},"D8":{"1":{"volume":20}},"E8":{"1":{"volume":20}},"F8":{"1":{"volume":20}},"G8":{"1":{"volume":20}},"H8":{"1":{"volume":20}},"A9":{"1":{"volume":20}},"B9":{"1":{"volume":20}},"C9":{"1":{"volume":20}},"D9":{"1":{"volume":20}},"E9":{"1":{"volume":20}},"F9":{"1":{"volume":20}},"G9":{"1":{"volume":20}},"H9":{"1":{"volume":20}},"A10":{"1":{"volume":20}},"B10":{"1":{"volume":20}},"C10":{"1":{"volume":20}},"D10":{"1":{"volume":20}},"E10":{"1":{"volume":20}},"F10":{"1":{"volume":20}},"G10":{"1":{"volume":20}},"H10":{"1":{"volume":20}},"A11":{"1":{"volume":20}},"B11":{"1":{"volume":20}},"C11":{"1":{"volume":20}},"D11":{"1":{"volume":20}},"E11":{"1":{"volume":20}},"F11":{"1":{"volume":20}},"G11":{"1":{"volume":20}},"H11":{"1":{"volume":20}},"A12":{"1":{"volume":20}},"B12":{"1":{"volume":20}},"C12":{"1":{"volume":20}},"D12":{"1":{"volume":20}},"E12":{"1":{"volume":20}},"F12":{"1":{"volume":20}},"G12":{"1":{"volume":20}},"H12":{"1":{"volume":20}}},"e77e958f-b18c-46f6-8ce9-b6ad52073b59:custom_beta/thermofisher_96_wellplate_700ul/1":{"A2":{"2":{"volume":152}},"B2":{"2":{"volume":152}},"C2":{"2":{"volume":152}},"D2":{"2":{"volume":152}},"E2":{"2":{"volume":152}},"F2":{"2":{"volume":152}},"G2":{"2":{"volume":152}},"H2":{"2":{"volume":152}},"A3":{"3":{"volume":518}},"B3":{"3":{"volume":518}},"C3":{"3":{"volume":518}},"D3":{"3":{"volume":518}},"E3":{"3":{"volume":518}},"F3":{"3":{"volume":518}},"G3":{"3":{"volume":518}},"H3":{"3":{"volume":518}}},"5e2d5979-72fd-46f2-aa41-e25e38ec626a:custom_beta/axygen_pcr_96_well_brown_base/1":{"A1":{"4":{"volume":50}},"B1":{"4":{"volume":50}},"C1":{"4":{"volume":50}},"D1":{"4":{"volume":50}},"E1":{"4":{"volume":50}},"F1":{"4":{"volume":50}},"G1":{"4":{"volume":50}},"H1":{"4":{"volume":50}},"A2":{"4":{"volume":50}},"B2":{"4":{"volume":50}},"C2":{"4":{"volume":50}},"D2":{"4":{"volume":50}},"E2":{"4":{"volume":50}},"F2":{"4":{"volume":50}},"G2":{"4":{"volume":50}},"H2":{"4":{"volume":50}},"A3":{"4":{"volume":50}},"B3":{"4":{"volume":50}},"C3":{"4":{"volume":50}},"D3":{"4":{"volume":50}},"E3":{"4":{"volume":50}},"F3":{"4":{"volume":50}},"G3":{"4":{"volume":50}},"H3":{"4":{"volume":50}},"A4":{"4":{"volume":50}},"B4":{"4":{"volume":50}},"C4":{"4":{"volume":50}},"D4":{"4":{"volume":50}},"E4":{"4":{"volume":50}},"F4":{"4":{"volume":50}},"G4":{"4":{"volume":50}},"H4":{"4":{"volume":50}},"A5":{"4":{"volume":50}},"B5":{"4":{"volume":50}},"C5":{"4":{"volume":50}},"D5":{"4":{"volume":50}},"E5":{"4":{"volume":50}},"F5":{"4":{"volume":50}},"G5":{"4":{"volume":50}},"H5":{"4":{"volume":50}},"A6":{"4":{"volume":50}},"B6":{"4":{"volume":50}},"C6":{"4":{"volume":50}},"D6":{"4":{"volume":50}},"E6":{"4":{"volume":50}},"F6":{"4":{"volume":50}},"G6":{"4":{"volume":50}},"H6":{"4":{"volume":50}},"A7":{"4":{"volume":50}},"B7":{"4":{"volume":50}},"C7":{"4":{"volume":50}},"D7":{"4":{"volume":50}},"E7":{"4":{"volume":50}},"F7":{"4":{"volume":50}},"G7":{"4":{"volume":50}},"H7":{"4":{"volume":50}},"A8":{"4":{"volume":50}},"B8":{"4":{"volume":50}},"C8":{"4":{"volume":50}},"D8":{"4":{"volume":50}},"E8":{"4":{"volume":50}},"F8":{"4":{"volume":50}},"G8":{"4":{"volume":50}},"H8":{"4":{"volume":50}},"A9":{"4":{"volume":50}},"B9":{"4":{"volume":50}},"C9":{"4":{"volume":50}},"D9":{"4":{"volume":50}},"E9":{"4":{"volume":50}},"F9":{"4":{"volume":50}},"G9":{"4":{"volume":50}},"H9":{"4":{"volume":50}},"A10":{"4":{"volume":50}},"B10":{"4":{"volume":50}},"C10":{"4":{"volume":50}},"D10":{"4":{"volume":50}},"E10":{"4":{"volume":50}},"F10":{"4":{"volume":50}},"G10":{"4":{"volume":50}},"H10":{"4":{"volume":50}},"A11":{"4":{"volume":50}},"B11":{"4":{"volume":50}},"C11":{"4":{"volume":50}},"D11":{"4":{"volume":50}},"E11":{"4":{"volume":50}},"F11":{"4":{"volume":50}},"G11":{"4":{"volume":50}},"H11":{"4":{"volume":50}},"A12":{"4":{"volume":50}},"B12":{"4":{"volume":50}},"C12":{"4":{"volume":50}},"D12":{"4":{"volume":50}},"E12":{"4":{"volume":50}},"F12":{"4":{"volume":50}},"G12":{"4":{"volume":50}},"H12":{"4":{"volume":50}}}},"savedStepForms":{"__INITIAL_DECK_SETUP_STEP__":{"labwareLocationUpdate":{"11809461-56c9-4543-8ef4-f6e71bf9eb12:opentrons/opentrons_flex_96_tiprack_adapter/1":"C3","54edd2a3-22b2-4a90-8948-bbbdadbea190:opentrons/opentrons_flex_96_filtertiprack_200ul/1":"11809461-56c9-4543-8ef4-f6e71bf9eb12:opentrons/opentrons_flex_96_tiprack_adapter/1","8b10a60a-bb04-401b-970e-7d00e4dc663d:opentrons/axygen_1_reservoir_90ml/3":"C2","7a950d8c-b2a7-4677-bda6-f58150540659:opentrons/thermoscientificnunc_96_wellplate_1300ul/3":"B2","d14b6f14-579f-4fbe-88ec-45beb28ff302:custom_beta/axygen_pcr_96_well_black_mag_base/1":"D2","b92dde37-18c7-4129-a8a9-ca5b6980a9d5:custom_beta/eppendorf_96_wellplate_150aul/1":"B1","e77e958f-b18c-46f6-8ce9-b6ad52073b59:custom_beta/thermofisher_96_wellplate_700ul/1":"C1","5e2d5979-72fd-46f2-aa41-e25e38ec626a:custom_beta/axygen_pcr_96_well_brown_base/1":"D1","d2b117ab-7adf-4578-9c19-367a5c54ca7a:opentrons/opentrons_flex_96_filtertiprack_200ul/1":"A1","cd278c17-5b7c-4596-9941-11db21b5cdd9:opentrons/opentrons_flex_96_filtertiprack_200ul/1":"A2","4738005a-f939-4cfc-adcb-1f36da913934:opentrons/opentrons_flex_96_filtertiprack_200ul/1":"A3","eb0518a9-5ea6-4942-bc33-fc03d471c192:opentrons/opentrons_flex_96_filtertiprack_200ul/1":"B3","c34781ed-dc45-48f0-8164-fe71576e5ddc:opentrons/opentrons_flex_96_filtertiprack_200ul/1":"A4","fd79e986-72ca-47e4-8497-b3083d704a6b:opentrons/opentrons_flex_96_filtertiprack_200ul/1":"B4","01942d65-5bf5-4d41-8c95-c0a32bbdbad3:opentrons/opentrons_flex_96_filtertiprack_200ul/1":"C4","3dbc3437-43e6-4154-b366-b5f4ea139fb1:opentrons/opentrons_flex_96_filtertiprack_200ul/1":"offDeck","fff005c1-dc51-456d-b5dd-abf4e2289bac:opentrons/opentrons_flex_96_filtertiprack_200ul/1":"offDeck"},"moduleLocationUpdate":{},"pipetteLocationUpdate":{"a25670d6-a221-4d25-a49a-9737f3ee3d3b":"left"},"trashBinLocationUpdate":{},"wasteChuteLocationUpdate":{"740b3cf9-32f5-4e09-af5b-fa24d307694b:wasteChute":"cutoutD3"},"stagingAreaLocationUpdate":{"91f3511f-e359-449f-8654-2308deef9deb:stagingArea":"cutoutD3","4dcb7847-134c-4a79-ab2c-d1c395b3ba08:stagingArea":"cutoutA3","c1fe9451-925a-4b92-8745-565b18abf519:stagingArea":"cutoutB3","c4824563-ddf5-4826-99c4-6a43631f5010:stagingArea":"cutoutC3"},"gripperLocationUpdate":{"c30de135-d666-4848-bf31-a737ec99b966:gripper":"mounted"},"stepType":"manualIntervention","id":"__INITIAL_DECK_SETUP_STEP__","moduleStateUpdate":{}},"ffe7012b-ab71-4d74-97e0-2c5ba5bfd37d":{"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"5","aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":20,"aspirate_labware":"e77e958f-b18c-46f6-8ce9-b6ad52073b59:custom_beta/thermofisher_96_wellplate_700ul/1","aspirate_mix_checkbox":false,"aspirate_mix_times":null,"aspirate_mix_volume":null,"aspirate_mmFromBottom":1.4,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":35,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":35,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":300,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A2"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":true,"blowout_flowRate":15,"blowout_location":"dest_well","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":null,"dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":20,"dispense_labware":"5e2d5979-72fd-46f2-aa41-e25e38ec626a:custom_beta/axygen_pcr_96_well_brown_base/1","dispense_mix_checkbox":false,"dispense_mix_times":null,"dispense_mix_volume":null,"dispense_mmFromBottom":3.5,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":35,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":35,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":true,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"5","dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1","A2","A3","A4","A5","A6","A7","A8","A9","A10","A11","A12"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":true,"disposalVolume_volume":null,"dropTip_location":"740b3cf9-32f5-4e09-af5b-fa24d307694b:wasteChute","liquidClassesSupported":false,"liquidClass":"none","nozzles":"COLUMN","path":"single","pipette":"a25670d6-a221-4d25-a49a-9737f3ee3d3b","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":5,"tipRack":"opentrons/opentrons_flex_96_filtertiprack_200ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"10.2","stepType":"moveLiquid","stepName":"Add ST2","stepDetails":"","id":"ffe7012b-ab71-4d74-97e0-2c5ba5bfd37d","dispense_touchTip_mmfromTop":-6.2},"40cbf917-9cf0-4c99-9682-ea4ce40ae1c7":{"moduleId":null,"pauseAction":"untilResume","pauseMessage":"Seal - LP1 plate, vortex, and quick spin (600rpm x no time). Place back on deck at position D1.","pauseTemperature":null,"pauseTime":null,"id":"40cbf917-9cf0-4c99-9682-ea4ce40ae1c7","stepType":"pause","stepName":"Seal, vortex, and spin LP1 plate","stepDetails":""},"81069895-4875-4a9e-b872-7f7e302ff870":{"moduleId":null,"pauseAction":"untilTime","pauseMessage":"Incubate - LP1 plate off magnet for 5 minutes.","pauseTemperature":null,"pauseTime":"00:05:00","id":"81069895-4875-4a9e-b872-7f7e302ff870","stepType":"pause","stepName":"5 min ST2 incubation","stepDetails":""},"e9c471f3-515d-479b-aaf2-370f9af767f6":{"moduleId":null,"pauseAction":"untilResume","pauseMessage":"Move -LP1 plate to the black magnet at D2.","pauseTemperature":null,"pauseTime":null,"id":"e9c471f3-515d-479b-aaf2-370f9af767f6","stepType":"pause","stepName":"Move -LP1 to magnet","stepDetails":""},"96176707-768f-4a29-9b73-937bfddc9456":{"moduleId":null,"pauseAction":"untilTime","pauseMessage":"Incubate -LP1 plate on black magnet for 2 minutes.","pauseTemperature":null,"pauseTime":"00:02:00","id":"96176707-768f-4a29-9b73-937bfddc9456","stepType":"pause","stepName":"2 min on magnet","stepDetails":""},"83aa14a2-fdb7-4cbc-8e4b-1edb885bf7c5":{"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"5","aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":20,"aspirate_labware":"d14b6f14-579f-4fbe-88ec-45beb28ff302:custom_beta/axygen_pcr_96_well_black_mag_base/1","aspirate_mix_checkbox":false,"aspirate_mix_times":null,"aspirate_mix_volume":null,"aspirate_mmFromBottom":1.5,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":35,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":35,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":300,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":true,"blowout_flowRate":80,"blowout_location":"dest_well","changeTip":"once","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":null,"dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":80,"dispense_labware":"7a950d8c-b2a7-4677-bda6-f58150540659:opentrons/thermoscientificnunc_96_wellplate_1300ul/3","dispense_mix_checkbox":false,"dispense_mix_times":null,"dispense_mix_volume":null,"dispense_mmFromBottom":10,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":35,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":35,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":true,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"5","dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":true,"disposalVolume_volume":null,"dropTip_location":"740b3cf9-32f5-4e09-af5b-fa24d307694b:wasteChute","liquidClassesSupported":false,"liquidClass":"none","nozzles":"ALL","path":"single","pipette":"a25670d6-a221-4d25-a49a-9737f3ee3d3b","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":5,"tipRack":"opentrons/opentrons_flex_96_filtertiprack_200ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"62","stepType":"moveLiquid","stepName":"Remove Super to Waste","stepDetails":"","id":"83aa14a2-fdb7-4cbc-8e4b-1edb885bf7c5","dispense_touchTip_mmfromTop":-9.2},"72feba8a-338e-4b81-998f-1bd958827c37":{"labware":"54edd2a3-22b2-4a90-8948-bbbdadbea190:opentrons/opentrons_flex_96_filtertiprack_200ul/1","newLocation":"D4","useGripper":true,"id":"72feba8a-338e-4b81-998f-1bd958827c37","stepType":"moveLabware","stepName":"Move EMPTY tip box","stepDetails":""},"beeaf92a-7c72-4ef1-b13e-5254a2b4d8dd":{"labware":"cd278c17-5b7c-4596-9941-11db21b5cdd9:opentrons/opentrons_flex_96_filtertiprack_200ul/1","newLocation":"11809461-56c9-4543-8ef4-f6e71bf9eb12:opentrons/opentrons_flex_96_tiprack_adapter/1","useGripper":true,"id":"beeaf92a-7c72-4ef1-b13e-5254a2b4d8dd","stepType":"moveLabware","stepName":"Move tip box","stepDetails":""},"a0ae7e9f-a3d0-4a46-99e4-80e5e94e79ea":{"moduleId":null,"pauseAction":"untilResume","pauseMessage":"Move -LP1 plate to brown base at D1.","pauseTemperature":null,"pauseTime":null,"id":"a0ae7e9f-a3d0-4a46-99e4-80e5e94e79ea","stepType":"pause","stepName":"Move -LP1 to Brown Base","stepDetails":""},"9e666680-b3f7-4122-9b68-736f6dacdf9f":{"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"5","aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":20,"aspirate_labware":"8b10a60a-bb04-401b-970e-7d00e4dc663d:opentrons/axygen_1_reservoir_90ml/3","aspirate_mix_checkbox":false,"aspirate_mix_times":null,"aspirate_mix_volume":null,"aspirate_mmFromBottom":1.2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":35,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":35,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":300,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":true,"blowout_flowRate":20,"blowout_location":"dest_well","changeTip":"once","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":null,"dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":50,"dispense_labware":"5e2d5979-72fd-46f2-aa41-e25e38ec626a:custom_beta/axygen_pcr_96_well_brown_base/1","dispense_mix_checkbox":false,"dispense_mix_times":null,"dispense_mix_volume":null,"dispense_mmFromBottom":6,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":35,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":35,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":true,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"5","dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":true,"disposalVolume_volume":null,"dropTip_location":"740b3cf9-32f5-4e09-af5b-fa24d307694b:wasteChute","liquidClassesSupported":false,"liquidClass":"none","nozzles":"ALL","path":"single","pipette":"a25670d6-a221-4d25-a49a-9737f3ee3d3b","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":5,"tipRack":"opentrons/opentrons_flex_96_filtertiprack_200ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"102","stepType":"moveLiquid","stepName":"TWB to -LP1 - Wash 1","stepDetails":"","id":"9e666680-b3f7-4122-9b68-736f6dacdf9f","dispense_touchTip_mmfromTop":-6.2},"fd88807a-102e-44b7-9486-0d8327cf7c41":{"moduleId":null,"pauseAction":"untilResume","pauseMessage":"Seal, vortex, and quick spin (600rpm x no time). \nThen put the  -LP1 plate onto the black magnet at D2.","pauseTemperature":null,"pauseTime":null,"id":"fd88807a-102e-44b7-9486-0d8327cf7c41","stepType":"pause","stepName":"Seal, Vortex, Spin, and Move -LP1 to Magnet","stepDetails":""},"59edefec-2c79-42f3-bf14-30ce7cce7da5":{"labware":"cd278c17-5b7c-4596-9941-11db21b5cdd9:opentrons/opentrons_flex_96_filtertiprack_200ul/1","newLocation":"A2","useGripper":true,"id":"59edefec-2c79-42f3-bf14-30ce7cce7da5","stepType":"moveLabware","stepName":"Move EMPTY tip box","stepDetails":""},"639f92ff-c275-4dae-8a63-63d4b80b820a":{"labware":"4738005a-f939-4cfc-adcb-1f36da913934:opentrons/opentrons_flex_96_filtertiprack_200ul/1","newLocation":"11809461-56c9-4543-8ef4-f6e71bf9eb12:opentrons/opentrons_flex_96_tiprack_adapter/1","useGripper":true,"id":"639f92ff-c275-4dae-8a63-63d4b80b820a","stepType":"moveLabware","stepName":"Move tip box","stepDetails":""},"a53d5678-1ba2-43e2-8bd1-d64e9dd11120":{"moduleId":null,"pauseAction":"untilTime","pauseMessage":"Incubate -LP1 plate on black magnet for 2 minutes.","pauseTemperature":null,"pauseTime":"00:02:00","id":"a53d5678-1ba2-43e2-8bd1-d64e9dd11120","stepType":"pause","stepName":"2 min on magnet","stepDetails":""},"173c692b-d4ae-4f5c-b79d-2835f4e137a8":{"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"5","aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":20,"aspirate_labware":"d14b6f14-579f-4fbe-88ec-45beb28ff302:custom_beta/axygen_pcr_96_well_black_mag_base/1","aspirate_mix_checkbox":false,"aspirate_mix_times":null,"aspirate_mix_volume":null,"aspirate_mmFromBottom":1.5,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":35,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":35,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":300,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":true,"blowout_flowRate":80,"blowout_location":"dest_well","changeTip":"once","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":null,"dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":80,"dispense_labware":"7a950d8c-b2a7-4677-bda6-f58150540659:opentrons/thermoscientificnunc_96_wellplate_1300ul/3","dispense_mix_checkbox":false,"dispense_mix_times":null,"dispense_mix_volume":null,"dispense_mmFromBottom":20,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":35,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":35,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":true,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"5","dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":true,"disposalVolume_volume":null,"dropTip_location":"740b3cf9-32f5-4e09-af5b-fa24d307694b:wasteChute","liquidClassesSupported":false,"liquidClass":"none","nozzles":"ALL","path":"single","pipette":"a25670d6-a221-4d25-a49a-9737f3ee3d3b","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":5,"tipRack":"opentrons/opentrons_flex_96_filtertiprack_200ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"103","stepType":"moveLiquid","stepName":"Remove TWB from -LP1 - Wash 1","stepDetails":"","id":"173c692b-d4ae-4f5c-b79d-2835f4e137a8","dispense_touchTip_mmfromTop":-9.2},"aab77387-4c19-46c1-8b2e-693a9e852b14":{"moduleId":null,"pauseAction":"untilResume","pauseMessage":"Move -LP1 plate to brown base at D1.","pauseTemperature":null,"pauseTime":null,"id":"aab77387-4c19-46c1-8b2e-693a9e852b14","stepType":"pause","stepName":"Move -LP1 to Brown Base","stepDetails":""},"7450b53a-0da2-4374-922e-1a2f69352253":{"labware":"4738005a-f939-4cfc-adcb-1f36da913934:opentrons/opentrons_flex_96_filtertiprack_200ul/1","newLocation":"A3","useGripper":true,"id":"7450b53a-0da2-4374-922e-1a2f69352253","stepType":"moveLabware","stepName":"Move EMPTY tip box","stepDetails":""},"278468ce-d08f-4d27-adc7-cadf0e616fab":{"labware":"c34781ed-dc45-48f0-8164-fe71576e5ddc:opentrons/opentrons_flex_96_filtertiprack_200ul/1","newLocation":"11809461-56c9-4543-8ef4-f6e71bf9eb12:opentrons/opentrons_flex_96_tiprack_adapter/1","useGripper":true,"id":"278468ce-d08f-4d27-adc7-cadf0e616fab","stepType":"moveLabware","stepName":"Move tip box","stepDetails":""},"4898e860-b46c-4146-86b3-3633d73bbb18":{"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"5","aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":20,"aspirate_labware":"8b10a60a-bb04-401b-970e-7d00e4dc663d:opentrons/axygen_1_reservoir_90ml/3","aspirate_mix_checkbox":false,"aspirate_mix_times":null,"aspirate_mix_volume":null,"aspirate_mmFromBottom":1.2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":35,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":35,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":300,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":true,"blowout_flowRate":20,"blowout_location":"dest_well","changeTip":"once","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":null,"dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":50,"dispense_labware":"5e2d5979-72fd-46f2-aa41-e25e38ec626a:custom_beta/axygen_pcr_96_well_brown_base/1","dispense_mix_checkbox":false,"dispense_mix_times":null,"dispense_mix_volume":null,"dispense_mmFromBottom":6,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":35,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":35,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":true,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"5","dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":true,"disposalVolume_volume":null,"dropTip_location":"740b3cf9-32f5-4e09-af5b-fa24d307694b:wasteChute","liquidClassesSupported":false,"liquidClass":"none","nozzles":"ALL","path":"single","pipette":"a25670d6-a221-4d25-a49a-9737f3ee3d3b","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":5,"tipRack":"opentrons/opentrons_flex_96_filtertiprack_200ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"102","stepType":"moveLiquid","stepName":"TWB to -LP1 - Wash 2","stepDetails":"","id":"4898e860-b46c-4146-86b3-3633d73bbb18","dispense_touchTip_mmfromTop":-6.2},"120afecd-6f00-4880-bb9d-add96719ef48":{"moduleId":null,"pauseAction":"untilResume","pauseMessage":"Seal, Vortex, and quick spin (600rpm x no time). \nThen place the -LP1 plate onto the black magnet at D2.","pauseTemperature":null,"pauseTime":null,"id":"120afecd-6f00-4880-bb9d-add96719ef48","stepType":"pause","stepName":"Seal, Vortex, Spin, and Move -LP1 to Magnet","stepDetails":""},"3bee14e6-e20b-4eff-8939-c8b575ce4ac7":{"labware":"c34781ed-dc45-48f0-8164-fe71576e5ddc:opentrons/opentrons_flex_96_filtertiprack_200ul/1","newLocation":"A4","useGripper":true,"id":"3bee14e6-e20b-4eff-8939-c8b575ce4ac7","stepType":"moveLabware","stepName":"Move EMPTY tip box","stepDetails":""},"922a99bd-77ed-4526-96d3-a6b20b6bc3e8":{"labware":"fd79e986-72ca-47e4-8497-b3083d704a6b:opentrons/opentrons_flex_96_filtertiprack_200ul/1","newLocation":"11809461-56c9-4543-8ef4-f6e71bf9eb12:opentrons/opentrons_flex_96_tiprack_adapter/1","useGripper":true,"id":"922a99bd-77ed-4526-96d3-a6b20b6bc3e8","stepType":"moveLabware","stepName":"Move Tip box","stepDetails":""},"56b714ce-4b9d-4cd9-ad9c-7847d180fbbe":{"moduleId":null,"pauseAction":"untilTime","pauseMessage":"Incubate -LP1 plate on black magnet for 2 minutes.","pauseTemperature":null,"pauseTime":"00:02:00","id":"56b714ce-4b9d-4cd9-ad9c-7847d180fbbe","stepType":"pause","stepName":"2 min on magnet","stepDetails":""},"3b582d8a-3b9d-4388-98fa-30dcf07af312":{"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"5","aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":20,"aspirate_labware":"d14b6f14-579f-4fbe-88ec-45beb28ff302:custom_beta/axygen_pcr_96_well_black_mag_base/1","aspirate_mix_checkbox":false,"aspirate_mix_times":null,"aspirate_mix_volume":null,"aspirate_mmFromBottom":1.5,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":35,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":35,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":300,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":true,"blowout_flowRate":80,"blowout_location":"dest_well","changeTip":"once","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":null,"dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":80,"dispense_labware":"7a950d8c-b2a7-4677-bda6-f58150540659:opentrons/thermoscientificnunc_96_wellplate_1300ul/3","dispense_mix_checkbox":false,"dispense_mix_times":null,"dispense_mix_volume":null,"dispense_mmFromBottom":20,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":35,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":35,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":true,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"5","dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":true,"disposalVolume_volume":null,"dropTip_location":"740b3cf9-32f5-4e09-af5b-fa24d307694b:wasteChute","liquidClassesSupported":false,"liquidClass":"none","nozzles":"ALL","path":"single","pipette":"a25670d6-a221-4d25-a49a-9737f3ee3d3b","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":5,"tipRack":"opentrons/opentrons_flex_96_filtertiprack_200ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"103","stepType":"moveLiquid","stepName":"Remove TWB from -LP1 - Wash 2","stepDetails":"","id":"3b582d8a-3b9d-4388-98fa-30dcf07af312","dispense_touchTip_mmfromTop":-9.2},"f61c1bbc-f451-444e-8c6c-209662035eab":{"moduleId":null,"pauseAction":"untilResume","pauseMessage":"Move -LP1 plate to brown base at D1.","pauseTemperature":null,"pauseTime":null,"id":"f61c1bbc-f451-444e-8c6c-209662035eab","stepType":"pause","stepName":"Move -LP1 to Brown Base","stepDetails":""},"415e6a2d-8aa7-400a-a28c-c8940b7df12d":{"labware":"fd79e986-72ca-47e4-8497-b3083d704a6b:opentrons/opentrons_flex_96_filtertiprack_200ul/1","newLocation":"B4","useGripper":true,"id":"415e6a2d-8aa7-400a-a28c-c8940b7df12d","stepType":"moveLabware","stepName":"Move EMPTY tip box","stepDetails":""},"ca9e2950-fa70-40be-933e-29f409a2b501":{"labware":"01942d65-5bf5-4d41-8c95-c0a32bbdbad3:opentrons/opentrons_flex_96_filtertiprack_200ul/1","newLocation":"11809461-56c9-4543-8ef4-f6e71bf9eb12:opentrons/opentrons_flex_96_tiprack_adapter/1","useGripper":true,"id":"ca9e2950-fa70-40be-933e-29f409a2b501","stepType":"moveLabware","stepName":"Move tip box","stepDetails":""},"bd315aa2-1c19-4fc2-a5cd-435c452d9760":{"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"5","aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":20,"aspirate_labware":"8b10a60a-bb04-401b-970e-7d00e4dc663d:opentrons/axygen_1_reservoir_90ml/3","aspirate_mix_checkbox":false,"aspirate_mix_times":null,"aspirate_mix_volume":null,"aspirate_mmFromBottom":1.2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":35,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":35,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":300,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":true,"blowout_flowRate":20,"blowout_location":"dest_well","changeTip":"once","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":null,"dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":50,"dispense_labware":"5e2d5979-72fd-46f2-aa41-e25e38ec626a:custom_beta/axygen_pcr_96_well_brown_base/1","dispense_mix_checkbox":false,"dispense_mix_times":null,"dispense_mix_volume":null,"dispense_mmFromBottom":6,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":35,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":35,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":true,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"5","dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":true,"disposalVolume_volume":null,"dropTip_location":"740b3cf9-32f5-4e09-af5b-fa24d307694b:wasteChute","liquidClassesSupported":false,"liquidClass":"none","nozzles":"ALL","path":"single","pipette":"a25670d6-a221-4d25-a49a-9737f3ee3d3b","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":5,"tipRack":"opentrons/opentrons_flex_96_filtertiprack_200ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"102","stepType":"moveLiquid","stepName":"TWB to -LP1 - Wash 3","stepDetails":"","id":"bd315aa2-1c19-4fc2-a5cd-435c452d9760","dispense_touchTip_mmfromTop":-6.2},"09e92ccd-c86d-4196-89d0-3f853226f3a6":{"moduleId":null,"pauseAction":"untilResume","pauseMessage":"Seal, vortex, and quick spin (600rpm x no time).\nThen place -LP1 plate onto the black magnet at D2.","pauseTemperature":null,"pauseTime":null,"id":"09e92ccd-c86d-4196-89d0-3f853226f3a6","stepType":"pause","stepName":"Seal, Vortex, Spin, and Move -LP1 to Magnet","stepDetails":""},"1f972d94-27bf-4c6a-9ef5-e8f5de76ad56":{"labware":"01942d65-5bf5-4d41-8c95-c0a32bbdbad3:opentrons/opentrons_flex_96_filtertiprack_200ul/1","newLocation":"offDeck","useGripper":false,"id":"1f972d94-27bf-4c6a-9ef5-e8f5de76ad56","stepType":"moveLabware","stepName":"Remove EMPTY tip box from C3","stepDetails":""},"a0ad28b3-69de-4662-9857-50021b889bf7":{"labware":"d2b117ab-7adf-4578-9c19-367a5c54ca7a:opentrons/opentrons_flex_96_filtertiprack_200ul/1","newLocation":"offDeck","useGripper":false,"id":"a0ad28b3-69de-4662-9857-50021b889bf7","stepType":"moveLabware","stepName":"Remove EMPTY tip box from A1","stepDetails":""},"675edbed-9dec-4096-8ddf-06743b19235c":{"labware":"3dbc3437-43e6-4154-b366-b5f4ea139fb1:opentrons/opentrons_flex_96_filtertiprack_200ul/1","newLocation":"A1","useGripper":false,"id":"675edbed-9dec-4096-8ddf-06743b19235c","stepType":"moveLabware","stepName":"Add NEW tip box to A1","stepDetails":""},"3d549e0c-6ae6-4261-84dc-597e838886df":{"labware":"fff005c1-dc51-456d-b5dd-abf4e2289bac:opentrons/opentrons_flex_96_filtertiprack_200ul/1","newLocation":"11809461-56c9-4543-8ef4-f6e71bf9eb12:opentrons/opentrons_flex_96_tiprack_adapter/1","useGripper":false,"id":"3d549e0c-6ae6-4261-84dc-597e838886df","stepType":"moveLabware","stepName":"Add NEW tip box to adapter at C3","stepDetails":""},"4d1f27c6-7db7-461d-94f6-a8a458bf61f3":{"moduleId":null,"pauseAction":"untilTime","pauseMessage":"Incubate -LP1 plate on black magnet for 2 minutes.","pauseTemperature":null,"pauseTime":"00:02:00","id":"4d1f27c6-7db7-461d-94f6-a8a458bf61f3","stepType":"pause","stepName":"2 min on magnet","stepDetails":""},"6a472f05-b8cb-47b9-9b64-857a73723a1d":{"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"5","aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":20,"aspirate_labware":"d14b6f14-579f-4fbe-88ec-45beb28ff302:custom_beta/axygen_pcr_96_well_black_mag_base/1","aspirate_mix_checkbox":false,"aspirate_mix_times":null,"aspirate_mix_volume":null,"aspirate_mmFromBottom":1.5,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":35,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":35,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":300,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":true,"blowout_flowRate":80,"blowout_location":"dest_well","changeTip":"once","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":null,"dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":80,"dispense_labware":"7a950d8c-b2a7-4677-bda6-f58150540659:opentrons/thermoscientificnunc_96_wellplate_1300ul/3","dispense_mix_checkbox":false,"dispense_mix_times":null,"dispense_mix_volume":null,"dispense_mmFromBottom":20,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":35,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":35,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":true,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"5","dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":true,"disposalVolume_volume":null,"dropTip_location":"740b3cf9-32f5-4e09-af5b-fa24d307694b:wasteChute","liquidClassesSupported":false,"liquidClass":"none","nozzles":"ALL","path":"single","pipette":"a25670d6-a221-4d25-a49a-9737f3ee3d3b","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":5,"tipRack":"opentrons/opentrons_flex_96_filtertiprack_200ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"103","stepType":"moveLiquid","stepName":"Remove TWB from -LP1 - Wash 3","stepDetails":"","id":"6a472f05-b8cb-47b9-9b64-857a73723a1d","dispense_touchTip_mmfromTop":-9.2},"0bd89520-4538-475e-be42-e1c66cde67b6":{"moduleId":null,"pauseAction":"untilResume","pauseMessage":"Move -LP1 plate to brown base at D1.","pauseTemperature":null,"pauseTime":null,"id":"0bd89520-4538-475e-be42-e1c66cde67b6","stepType":"pause","stepName":"Move -LP1 to Brown Base","stepDetails":""},"c7c4230a-8a05-47b9-aaf9-c06b5cc33cb6":{"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"5","aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":15,"aspirate_labware":"e77e958f-b18c-46f6-8ce9-b6ad52073b59:custom_beta/thermofisher_96_wellplate_700ul/1","aspirate_mix_checkbox":false,"aspirate_mix_times":null,"aspirate_mix_volume":null,"aspirate_mmFromBottom":1.4,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":35,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":35,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":300,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A3"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":true,"blowout_flowRate":25,"blowout_location":"dest_well","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":null,"dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":25,"dispense_labware":"5e2d5979-72fd-46f2-aa41-e25e38ec626a:custom_beta/axygen_pcr_96_well_brown_base/1","dispense_mix_checkbox":false,"dispense_mix_times":null,"dispense_mix_volume":null,"dispense_mmFromBottom":5,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":35,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":35,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":true,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"5","dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1","A2","A3","A4","A5","A6","A7","A8","A9","A10","A11","A12"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":true,"disposalVolume_volume":null,"dropTip_location":"740b3cf9-32f5-4e09-af5b-fa24d307694b:wasteChute","liquidClassesSupported":false,"liquidClass":"none","nozzles":"COLUMN","path":"single","pipette":"a25670d6-a221-4d25-a49a-9737f3ee3d3b","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":5,"tipRack":"opentrons/opentrons_flex_96_filtertiprack_200ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"41","stepType":"moveLiquid","stepName":"Add AMPMM to -LP1","stepDetails":"","id":"c7c4230a-8a05-47b9-aaf9-c06b5cc33cb6","dispense_touchTip_mmfromTop":-6.2},"c7efc9fa-97e2-48ea-984d-7dbae6f40ebc":{"labware":"fff005c1-dc51-456d-b5dd-abf4e2289bac:opentrons/opentrons_flex_96_filtertiprack_200ul/1","newLocation":"C4","useGripper":true,"id":"c7efc9fa-97e2-48ea-984d-7dbae6f40ebc","stepType":"moveLabware","stepName":"Move EMPTY tip box","stepDetails":""},"346f9c15-87a7-4669-8b44-0a0095122749":{"labware":"3dbc3437-43e6-4154-b366-b5f4ea139fb1:opentrons/opentrons_flex_96_filtertiprack_200ul/1","newLocation":"11809461-56c9-4543-8ef4-f6e71bf9eb12:opentrons/opentrons_flex_96_tiprack_adapter/1","useGripper":true,"id":"346f9c15-87a7-4669-8b44-0a0095122749","stepType":"moveLabware","stepName":"Move tip box","stepDetails":""},"5aafa775-1963-46ef-a852-7b469b87aa72":{"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"5","aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":5,"aspirate_labware":"b92dde37-18c7-4129-a8a9-ca5b6980a9d5:custom_beta/eppendorf_96_wellplate_150aul/1","aspirate_mix_checkbox":false,"aspirate_mix_times":null,"aspirate_mix_volume":null,"aspirate_mmFromBottom":1.1,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":35,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":35,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":300,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":true,"blowout_flowRate":5,"blowout_location":"dest_well","changeTip":"once","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":null,"dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":5,"dispense_labware":"5e2d5979-72fd-46f2-aa41-e25e38ec626a:custom_beta/axygen_pcr_96_well_brown_base/1","dispense_mix_checkbox":false,"dispense_mix_times":null,"dispense_mix_volume":null,"dispense_mmFromBottom":3.5,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":35,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":35,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":true,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"5","dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":true,"disposalVolume_volume":null,"dropTip_location":"740b3cf9-32f5-4e09-af5b-fa24d307694b:wasteChute","liquidClassesSupported":false,"liquidClass":"none","nozzles":"ALL","path":"single","pipette":"a25670d6-a221-4d25-a49a-9737f3ee3d3b","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":5,"tipRack":"opentrons/opentrons_flex_96_filtertiprack_200ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"16","stepType":"moveLiquid","stepName":"Indexed Adapters to -LP1","stepDetails":"","id":"5aafa775-1963-46ef-a852-7b469b87aa72","dispense_touchTip_mmfromTop":-6.2}},"orderedStepIds":["ffe7012b-ab71-4d74-97e0-2c5ba5bfd37d","40cbf917-9cf0-4c99-9682-ea4ce40ae1c7","81069895-4875-4a9e-b872-7f7e302ff870","e9c471f3-515d-479b-aaf2-370f9af767f6","96176707-768f-4a29-9b73-937bfddc9456","83aa14a2-fdb7-4cbc-8e4b-1edb885bf7c5","72feba8a-338e-4b81-998f-1bd958827c37","beeaf92a-7c72-4ef1-b13e-5254a2b4d8dd","a0ae7e9f-a3d0-4a46-99e4-80e5e94e79ea","9e666680-b3f7-4122-9b68-736f6dacdf9f","fd88807a-102e-44b7-9486-0d8327cf7c41","59edefec-2c79-42f3-bf14-30ce7cce7da5","639f92ff-c275-4dae-8a63-63d4b80b820a","a53d5678-1ba2-43e2-8bd1-d64e9dd11120","173c692b-d4ae-4f5c-b79d-2835f4e137a8","aab77387-4c19-46c1-8b2e-693a9e852b14","7450b53a-0da2-4374-922e-1a2f69352253","278468ce-d08f-4d27-adc7-cadf0e616fab","4898e860-b46c-4146-86b3-3633d73bbb18","120afecd-6f00-4880-bb9d-add96719ef48","3bee14e6-e20b-4eff-8939-c8b575ce4ac7","922a99bd-77ed-4526-96d3-a6b20b6bc3e8","56b714ce-4b9d-4cd9-ad9c-7847d180fbbe","3b582d8a-3b9d-4388-98fa-30dcf07af312","f61c1bbc-f451-444e-8c6c-209662035eab","415e6a2d-8aa7-400a-a28c-c8940b7df12d","ca9e2950-fa70-40be-933e-29f409a2b501","bd315aa2-1c19-4fc2-a5cd-435c452d9760","09e92ccd-c86d-4196-89d0-3f853226f3a6","1f972d94-27bf-4c6a-9ef5-e8f5de76ad56","a0ad28b3-69de-4662-9857-50021b889bf7","675edbed-9dec-4096-8ddf-06743b19235c","3d549e0c-6ae6-4261-84dc-597e838886df","4d1f27c6-7db7-461d-94f6-a8a458bf61f3","6a472f05-b8cb-47b9-9b64-857a73723a1d","0bd89520-4538-475e-be42-e1c66cde67b6","c7c4230a-8a05-47b9-aaf9-c06b5cc33cb6","c7efc9fa-97e2-48ea-984d-7dbae6f40ebc","346f9c15-87a7-4669-8b44-0a0095122749","5aafa775-1963-46ef-a852-7b469b87aa72"],"pipettes":{"a25670d6-a221-4d25-a49a-9737f3ee3d3b":{"pipetteName":"p1000_96"}},"modules":{},"labware":{"11809461-56c9-4543-8ef4-f6e71bf9eb12:opentrons/opentrons_flex_96_tiprack_adapter/1":{"displayName":"Opentrons Flex 96 Tip Rack Adapter","labwareDefURI":"opentrons/opentrons_flex_96_tiprack_adapter/1"},"54edd2a3-22b2-4a90-8948-bbbdadbea190:opentrons/opentrons_flex_96_filtertiprack_200ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 200 µL","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_200ul/1"},"8b10a60a-bb04-401b-970e-7d00e4dc663d:opentrons/axygen_1_reservoir_90ml/3":{"displayName":"TWB Reservoir 90mL","labwareDefURI":"opentrons/axygen_1_reservoir_90ml/3"},"7a950d8c-b2a7-4677-bda6-f58150540659:opentrons/thermoscientificnunc_96_wellplate_1300ul/3":{"displayName":"Waste Plate - NUNC","labwareDefURI":"opentrons/thermoscientificnunc_96_wellplate_1300ul/3"},"d14b6f14-579f-4fbe-88ec-45beb28ff302:custom_beta/axygen_pcr_96_well_black_mag_base/1":{"displayName":"-LP1 plate in black mag base","labwareDefURI":"custom_beta/axygen_pcr_96_well_black_mag_base/1"},"b92dde37-18c7-4129-a8a9-ca5b6980a9d5:custom_beta/eppendorf_96_wellplate_150aul/1":{"displayName":"Illumina Indexes","labwareDefURI":"custom_beta/eppendorf_96_wellplate_150aul/1"},"e77e958f-b18c-46f6-8ce9-b6ad52073b59:custom_beta/thermofisher_96_wellplate_700ul/1":{"displayName":"Reagent plate","labwareDefURI":"custom_beta/thermofisher_96_wellplate_700ul/1"},"5e2d5979-72fd-46f2-aa41-e25e38ec626a:custom_beta/axygen_pcr_96_well_brown_base/1":{"displayName":"-LP1 plate in a brown base","labwareDefURI":"custom_beta/axygen_pcr_96_well_brown_base/1"},"d2b117ab-7adf-4578-9c19-367a5c54ca7a:opentrons/opentrons_flex_96_filtertiprack_200ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 200 µL (1)","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_200ul/1"},"cd278c17-5b7c-4596-9941-11db21b5cdd9:opentrons/opentrons_flex_96_filtertiprack_200ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 200 µL (2)","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_200ul/1"},"4738005a-f939-4cfc-adcb-1f36da913934:opentrons/opentrons_flex_96_filtertiprack_200ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 200 µL (3)","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_200ul/1"},"eb0518a9-5ea6-4942-bc33-fc03d471c192:opentrons/opentrons_flex_96_filtertiprack_200ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 200 µL (4)","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_200ul/1"},"c34781ed-dc45-48f0-8164-fe71576e5ddc:opentrons/opentrons_flex_96_filtertiprack_200ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 200 µL (5)","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_200ul/1"},"fd79e986-72ca-47e4-8497-b3083d704a6b:opentrons/opentrons_flex_96_filtertiprack_200ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 200 µL (6)","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_200ul/1"},"01942d65-5bf5-4d41-8c95-c0a32bbdbad3:opentrons/opentrons_flex_96_filtertiprack_200ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 200 µL (7)","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_200ul/1"},"3dbc3437-43e6-4154-b366-b5f4ea139fb1:opentrons/opentrons_flex_96_filtertiprack_200ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 200 µL (8)","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_200ul/1"},"fff005c1-dc51-456d-b5dd-abf4e2289bac:opentrons/opentrons_flex_96_filtertiprack_200ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 200 µL (9)","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_200ul/1"}}}},"metadata":{"protocolName":"Post tagmentation fixed file","author":"JAG/CIDR","description":"Stop Tagmentation process, wash DNA bound to beads, and add Amplification Master Mix and indexes","created":1741701886917,"lastModified":1773243186947,"category":null,"subcategory":null,"tags":[],"source":"Protocol Designer"}}"""
