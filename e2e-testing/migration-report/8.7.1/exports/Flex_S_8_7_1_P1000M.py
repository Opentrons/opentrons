import json
from opentrons import protocol_api, types

metadata = {
    "protocolName": "P1000MTransferMulti",
    "created": "2025-05-28T21:27:06.797Z",
    "internalAppBuildDate": "Tue, 16 Dec 2025 16:02:03 GMT",
    "lastModified": "2026-01-26T19:59:07.081Z",
    "protocolDesigner": "8.7.1",
    "source": "Protocol Designer",
}

requirements = {"robotType": "Flex", "apiLevel": "2.27"}

def run(protocol: protocol_api.ProtocolContext) -> None:
    # Load Labware:
    tip_rack_1 = protocol.load_labware(
        "opentrons_flex_96_filtertiprack_1000ul",
        location="C2",
        namespace="opentrons",
        version=1,
    )
    tip_rack_2 = protocol.load_labware(
        "opentrons_flex_96_filtertiprack_200ul",
        location="B2",
        namespace="opentrons",
        version=1,
    )
    tip_rack_3 = protocol.load_labware(
        "opentrons_flex_96_filtertiprack_50ul",
        location="A2",
        namespace="opentrons",
        version=1,
    )
    well_plate_1 = protocol.load_labware(
        "thermoscientificnunc_96_wellplate_1300ul",
        location="C1",
        namespace="opentrons",
        version=3,
    )
    well_plate_2 = protocol.load_labware(
        "thermoscientificnunc_96_wellplate_2000ul",
        location="C3",
        namespace="opentrons",
        version=3,
    )
    well_plate_3 = protocol.load_labware(
        "usascientific_96_wellplate_2.4ml_deep",
        location="D1",
        namespace="opentrons",
        version=4,
    )
    well_plate_4 = protocol.load_labware(
        "nest_96_wellplate_2ml_deep",
        location="D2",
        label="NEST 96 Deep Well Plate 2mL",
        namespace="opentrons",
        version=5,
    )
    tip_rack_4 = protocol.load_labware(
        "opentrons_flex_96_filtertiprack_50ul",
        location="A3",
        label="Opentrons Flex 96 Filter Tip Rack 50 µL (1)",
        namespace="opentrons",
        version=1,
    )
    tip_rack_5 = protocol.load_labware(
        "opentrons_flex_96_filtertiprack_200ul",
        location="B1",
        label="Opentrons Flex 96 Filter Tip Rack 200 µL (1)",
        namespace="opentrons",
        version=1,
    )
    tip_rack_6 = protocol.load_labware(
        "opentrons_flex_96_filtertiprack_1000ul",
        location="B3",
        label="Opentrons Flex 96 Filter Tip Rack 1000 µL (1)",
        namespace="opentrons",
        version=1,
    )
    tip_rack_7 = protocol.load_labware(
        "opentrons_flex_96_filtertiprack_1000ul",
        location=protocol_api.OFF_DECK,
        label="Opentrons Flex 96 Filter Tip Rack 1000 µL (3)",
        namespace="opentrons",
        version=1,
    )
    tip_rack_8 = protocol.load_labware(
        "opentrons_flex_96_filtertiprack_200ul",
        location=protocol_api.OFF_DECK,
        label="Opentrons Flex 96 Filter Tip Rack 200 µL (2)",
        namespace="opentrons",
        version=1,
    )
    tip_rack_9 = protocol.load_labware(
        "opentrons_flex_96_filtertiprack_50ul",
        location=protocol_api.OFF_DECK,
        label="Opentrons Flex 96 Filter Tip Rack 50 µL (2)",
        namespace="opentrons",
        version=1,
    )
    tip_rack_10 = protocol.load_labware(
        "opentrons_flex_96_filtertiprack_1000ul",
        location="A1",
        label="Opentrons Flex 96 Filter Tip Rack 1000 µL (4)",
        namespace="opentrons",
        version=1,
    )

    # Load Pipettes:
    pipette_left = protocol.load_instrument("flex_8channel_1000", "left")
    pipette_right = protocol.load_instrument("flex_1channel_50", "right")

    # Load Waste Chute:
    waste_chute = protocol.load_waste_chute()

    # Define Liquids:
    liquid_1 = protocol.define_liquid(
        "Source_1",
        display_color="#b925ff",
    )
    liquid_2 = protocol.define_liquid(
        "Source_2",
        display_color="#ffd600",
    )

    # Load Liquids:
    well_plate_1.load_liquid(
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
        liquid=liquid_1,
        volume=1200,
    )
    well_plate_2.load_liquid(
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
        volume=1900,
    )

    # Load Liquid Classes:
    water_base_class = protocol.get_liquid_class("water")
    glycerol_50_base_class = protocol.get_liquid_class("glycerol_50")
    ethanol_80_base_class = protocol.get_liquid_class("ethanol_80")

    # PROTOCOL STEPS

    # Step 1: transfer
    pipette_left.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette_left.transfer_with_liquid_class(
        volume=7,
        source=[well_plate_2["A1"]],
        dest=[well_plate_3["A1"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_1, tip_rack_6, tip_rack_10],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_1",
            properties={"flex_8channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
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
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 2: transfer
    pipette_left.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette_left.transfer_with_liquid_class(
        volume=14,
        source=[well_plate_2["A2"]],
        dest=[well_plate_3["A2"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_1, tip_rack_6, tip_rack_10],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_2",
            properties={"flex_8channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
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
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 3: transfer
    pipette_left.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette_left.transfer_with_liquid_class(
        volume=48,
        source=[well_plate_2["A3"]],
        dest=[well_plate_3["A3"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_1, tip_rack_6, tip_rack_10],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_3",
            properties={"flex_8channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
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
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 4: transfer
    pipette_left.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette_left.transfer_with_liquid_class(
        volume=8,
        source=[well_plate_2["A4"]],
        dest=[well_plate_3["A4"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_1, tip_rack_6, tip_rack_10],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_4",
            properties={"flex_8channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
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
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 5: transfer
    pipette_left.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette_left.transfer_with_liquid_class(
        volume=44,
        source=[well_plate_2["A5"]],
        dest=[well_plate_3["A5"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_1, tip_rack_6, tip_rack_10],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_5",
            properties={"flex_8channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
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
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 6: transfer
    pipette_left.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette_left.transfer_with_liquid_class(
        volume=199,
        source=[well_plate_2["A6"]],
        dest=[well_plate_3["A6"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_1, tip_rack_6, tip_rack_10],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_6",
            properties={"flex_8channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
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
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 7: transfer
    pipette_left.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette_left.transfer_with_liquid_class(
        volume=11,
        source=[well_plate_2["A7"]],
        dest=[well_plate_3["A7"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_1, tip_rack_6, tip_rack_10],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_7",
            properties={"flex_8channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
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
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 8: transfer
    pipette_left.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette_left.transfer_with_liquid_class(
        volume=101,
        source=[well_plate_2["A8"]],
        dest=[well_plate_3["A8"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_1, tip_rack_6, tip_rack_10],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_8",
            properties={"flex_8channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
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
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 9: transfer
    pipette_left.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette_left.transfer_with_liquid_class(
        volume=999,
        source=[well_plate_2["A9"]],
        dest=[well_plate_3["A9"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_1, tip_rack_6, tip_rack_10],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_9",
            properties={"flex_8channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
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
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 10: transfer
    pipette_left.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette_left.transfer_with_liquid_class(
        volume=7,
        source=[well_plate_2["A10"]],
        dest=[well_plate_3["A10"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_1, tip_rack_6, tip_rack_10],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_10",
            base_liquid_class=water_base_class,
            properties={"flex_8channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 716)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": True, "duration": 0.5},
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
                        "air_gap_by_volume": [(0, 10)],
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
                        "offset": {"x": 0, "y": 0, "z": 2},
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
                        "air_gap_by_volume": [(0, 10)],
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
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 11: transfer
    pipette_left.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette_left.transfer_with_liquid_class(
        volume=14,
        source=[well_plate_2["A11"]],
        dest=[well_plate_3["A11"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_1, tip_rack_6, tip_rack_10],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_11",
            base_liquid_class=water_base_class,
            properties={"flex_8channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 716)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": True, "duration": 0.5},
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
                        "air_gap_by_volume": [(0, 10)],
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
                        "offset": {"x": 0, "y": 0, "z": 2},
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
                        "air_gap_by_volume": [(0, 10)],
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
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 12: transfer
    pipette_left.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette_left.transfer_with_liquid_class(
        volume=48,
        source=[well_plate_2["A12"]],
        dest=[well_plate_3["A12"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_1, tip_rack_6, tip_rack_10],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_12",
            base_liquid_class=water_base_class,
            properties={"flex_8channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 716)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": True, "duration": 0.5},
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
                        "air_gap_by_volume": [(0, 10)],
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
                        "offset": {"x": 0, "y": 0, "z": 2},
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
                        "air_gap_by_volume": [(0, 10)],
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
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 13: transfer
    pipette_left.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette_left.transfer_with_liquid_class(
        volume=8,
        source=[well_plate_1["A1"]],
        dest=[well_plate_4["A1"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_1, tip_rack_6, tip_rack_10],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_13",
            base_liquid_class=water_base_class,
            properties={"flex_8channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 716)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": True, "duration": 0.5},
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
                        "air_gap_by_volume": [(0, 10)],
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
                        "offset": {"x": 0, "y": 0, "z": 2},
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
                        "air_gap_by_volume": [(0, 10)],
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
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 14: transfer
    pipette_left.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette_left.transfer_with_liquid_class(
        volume=44,
        source=[well_plate_1["A2"]],
        dest=[well_plate_4["A2"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_1, tip_rack_6, tip_rack_10],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_14",
            base_liquid_class=water_base_class,
            properties={"flex_8channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 716)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": True, "duration": 0.5},
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
                        "air_gap_by_volume": [(0, 10)],
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
                        "offset": {"x": 0, "y": 0, "z": 2},
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
                        "air_gap_by_volume": [(0, 10)],
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
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 15: transfer
    pipette_left.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette_left.transfer_with_liquid_class(
        volume=199,
        source=[well_plate_1["A3"]],
        dest=[well_plate_4["A3"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_1, tip_rack_6, tip_rack_10],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_15",
            base_liquid_class=water_base_class,
            properties={"flex_8channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 716)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": True, "duration": 0.5},
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
                        "air_gap_by_volume": [(0, 10)],
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
                        "offset": {"x": 0, "y": 0, "z": 2},
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
                        "air_gap_by_volume": [(0, 10)],
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
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 16: transfer
    pipette_left.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette_left.transfer_with_liquid_class(
        volume=11,
        source=[well_plate_1["A4"]],
        dest=[well_plate_4["A4"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_1, tip_rack_6, tip_rack_10],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_16",
            base_liquid_class=water_base_class,
            properties={"flex_8channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 716)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": True, "duration": 0.5},
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
                        "air_gap_by_volume": [(0, 10)],
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
                        "offset": {"x": 0, "y": 0, "z": 2},
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
                        "air_gap_by_volume": [(0, 10)],
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
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 17: transfer
    pipette_left.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette_left.transfer_with_liquid_class(
        volume=101,
        source=[well_plate_1["A5"]],
        dest=[well_plate_4["A5"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_1, tip_rack_6, tip_rack_10],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_17",
            base_liquid_class=water_base_class,
            properties={"flex_8channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 716)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": True, "duration": 0.5},
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
                        "air_gap_by_volume": [(0, 10)],
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
                        "offset": {"x": 0, "y": 0, "z": 2},
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
                        "air_gap_by_volume": [(0, 10)],
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
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 18: transfer
    pipette_left.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette_left.transfer_with_liquid_class(
        volume=999,
        source=[well_plate_1["A6"]],
        dest=[well_plate_4["A6"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_1, tip_rack_6, tip_rack_10],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_18",
            base_liquid_class=water_base_class,
            properties={"flex_8channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 716)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": True, "duration": 0.5},
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
                        "air_gap_by_volume": [(0, 1)],
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
                        "offset": {"x": 0, "y": 0, "z": 2},
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
                        "air_gap_by_volume": [(0, 10)],
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
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 19: transfer
    pipette_left.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette_left.transfer_with_liquid_class(
        volume=7,
        source=[well_plate_1["A7"]],
        dest=[well_plate_4["A7"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_1, tip_rack_6, tip_rack_10],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_19",
            base_liquid_class=glycerol_50_base_class,
            properties={"flex_8channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 10)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0), (10, -0.2), (100, -0.1), (1000, 12)],
                    "delay": {"enabled": True, "duration": 0.7},
                    "mix": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 4,
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
                        "speed": 4,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 250)],
                    "delay": {"enabled": True, "duration": 0.5},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 4,
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
                        "speed": 4,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": False},
                    },
                    "correction_by_volume": [(0, 0), (10, -0.2), (100, -0.1), (1000, 12)],
                    "push_out_by_volume": [(0, 35)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 20: transfer
    pipette_left.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette_left.transfer_with_liquid_class(
        volume=14,
        source=[well_plate_1["A8"]],
        dest=[well_plate_4["A8"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_1, tip_rack_6, tip_rack_10],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_20",
            base_liquid_class=glycerol_50_base_class,
            properties={"flex_8channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 14)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0), (10, -0.2), (100, -0.1), (1000, 12)],
                    "delay": {"enabled": True, "duration": 0.7},
                    "mix": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 4,
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
                        "speed": 4,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 250)],
                    "delay": {"enabled": True, "duration": 0.5},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 4,
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
                        "speed": 4,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": False},
                    },
                    "correction_by_volume": [(0, 0), (10, -0.2), (100, -0.1), (1000, 12)],
                    "push_out_by_volume": [(0, 35)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 21: transfer
    pipette_left.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette_left.transfer_with_liquid_class(
        volume=48,
        source=[well_plate_1["A9"]],
        dest=[well_plate_4["A9"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_1, tip_rack_6, tip_rack_10],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_21",
            base_liquid_class=glycerol_50_base_class,
            properties={"flex_8channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 48)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0), (10, -0.2), (100, -0.1), (1000, 12)],
                    "delay": {"enabled": True, "duration": 0.7},
                    "mix": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 4,
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
                        "speed": 4,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 250)],
                    "delay": {"enabled": True, "duration": 0.5},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 4,
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
                        "speed": 4,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": False},
                    },
                    "correction_by_volume": [(0, 0), (10, -0.2), (100, -0.1), (1000, 12)],
                    "push_out_by_volume": [(0, 35)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 22: transfer
    pipette_left.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette_left.transfer_with_liquid_class(
        volume=8,
        source=[well_plate_1["A10"]],
        dest=[well_plate_4["A10"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_1, tip_rack_6, tip_rack_10],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_22",
            base_liquid_class=glycerol_50_base_class,
            properties={"flex_8channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 10)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0), (10, -0.2), (100, -0.1), (1000, 12)],
                    "delay": {"enabled": True, "duration": 0.7},
                    "mix": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 4,
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
                        "speed": 4,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 250)],
                    "delay": {"enabled": True, "duration": 0.5},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 4,
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
                        "speed": 4,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": False},
                    },
                    "correction_by_volume": [(0, 0), (10, -0.2), (100, -0.1), (1000, 12)],
                    "push_out_by_volume": [(0, 35)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 23: transfer
    pipette_left.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette_left.transfer_with_liquid_class(
        volume=44,
        source=[well_plate_1["A11"]],
        dest=[well_plate_4["A11"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_1, tip_rack_6, tip_rack_10],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_23",
            base_liquid_class=glycerol_50_base_class,
            properties={"flex_8channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 44)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0), (10, -0.2), (100, -0.1), (1000, 12)],
                    "delay": {"enabled": True, "duration": 0.7},
                    "mix": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 4,
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
                        "speed": 4,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 250)],
                    "delay": {"enabled": True, "duration": 0.5},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 4,
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
                        "speed": 4,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": False},
                    },
                    "correction_by_volume": [(0, 0), (10, -0.2), (100, -0.1), (1000, 12)],
                    "push_out_by_volume": [(0, 35)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 24: transfer
    pipette_left.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette_left.transfer_with_liquid_class(
        volume=199,
        source=[well_plate_1["A12"]],
        dest=[well_plate_4["A12"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_1, tip_rack_6, tip_rack_10],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_24",
            base_liquid_class=glycerol_50_base_class,
            properties={"flex_8channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 177)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0), (10, -0.2), (100, -0.1), (1000, 12)],
                    "delay": {"enabled": True, "duration": 0.7},
                    "mix": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 4,
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
                        "speed": 4,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 250)],
                    "delay": {"enabled": True, "duration": 0.5},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 4,
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
                        "speed": 4,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": False},
                    },
                    "correction_by_volume": [(0, 0), (10, -0.2), (100, -0.1), (1000, 12)],
                    "push_out_by_volume": [(0, 35)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 25: transfer
    pipette_left.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette_left.transfer_with_liquid_class(
        volume=11,
        source=[well_plate_2["A1"]],
        dest=[well_plate_3["A1"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_1, tip_rack_6, tip_rack_10],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_25",
            base_liquid_class=glycerol_50_base_class,
            properties={"flex_8channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 11)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0), (10, -0.2), (100, -0.1), (1000, 12)],
                    "delay": {"enabled": True, "duration": 0.7},
                    "mix": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 4,
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
                        "speed": 4,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 250)],
                    "delay": {"enabled": True, "duration": 0.5},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 4,
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
                        "speed": 4,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": False},
                    },
                    "correction_by_volume": [(0, 0), (10, -0.2), (100, -0.1), (1000, 12)],
                    "push_out_by_volume": [(0, 35)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 26: transfer
    pipette_left.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette_left.transfer_with_liquid_class(
        volume=101,
        source=[well_plate_2["A2"]],
        dest=[well_plate_3["A2"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_1, tip_rack_6, tip_rack_10],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_26",
            base_liquid_class=glycerol_50_base_class,
            properties={"flex_8channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 100.7)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0), (10, -0.2), (100, -0.1), (1000, 12)],
                    "delay": {"enabled": True, "duration": 0.7},
                    "mix": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 4,
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
                        "speed": 4,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 250)],
                    "delay": {"enabled": True, "duration": 0.5},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 4,
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
                        "speed": 4,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": False},
                    },
                    "correction_by_volume": [(0, 0), (10, -0.2), (100, -0.1), (1000, 12)],
                    "push_out_by_volume": [(0, 35)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 27: transfer
    pipette_left.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette_left.transfer_with_liquid_class(
        volume=999,
        source=[well_plate_2["A3"]],
        dest=[well_plate_3["A3"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_1, tip_rack_6, tip_rack_10],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_27",
            base_liquid_class=glycerol_50_base_class,
            properties={"flex_8channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 799.2)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0), (10, -0.2), (100, -0.1), (1000, 12)],
                    "delay": {"enabled": True, "duration": 0.7},
                    "mix": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 4,
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
                        "speed": 4,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 250)],
                    "delay": {"enabled": True, "duration": 0.5},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 4,
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
                        "speed": 4,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": False},
                    },
                    "correction_by_volume": [(0, 0), (10, -0.2), (100, -0.1), (1000, 12)],
                    "push_out_by_volume": [(0, 35)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 28: transfer
    pipette_left.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette_left.transfer_with_liquid_class(
        volume=7,
        source=[well_plate_2["A4"]],
        dest=[well_plate_3["A4"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_1, tip_rack_6, tip_rack_10],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_28",
            base_liquid_class=ethanol_80_base_class,
            properties={"flex_8channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 10)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0), (10, -0.9), (100, -2.6), (1000, -32.2)],
                    "delay": {"enabled": True, "duration": 0.2},
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
                        "air_gap_by_volume": [(0, 12)],
                        "delay": {"enabled": True, "duration": 0.5},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 100,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 300)],
                    "delay": {"enabled": True, "duration": 1},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 100,
                        "start_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                    },
                    "retract": {
                        "air_gap_by_volume": [(0, 12)],
                        "delay": {"enabled": True, "duration": 0.5},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 100,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": False},
                    },
                    "correction_by_volume": [(0, 0), (10, -0.9), (100, -2.6), (1000, -32.2)],
                    "push_out_by_volume": [(0, 0)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 29: transfer
    pipette_left.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette_left.transfer_with_liquid_class(
        volume=14,
        source=[well_plate_2["A5"]],
        dest=[well_plate_3["A5"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_1, tip_rack_6, tip_rack_10],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_29",
            base_liquid_class=ethanol_80_base_class,
            properties={"flex_8channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 14)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0), (10, -0.9), (100, -2.6), (1000, -32.2)],
                    "delay": {"enabled": True, "duration": 0.2},
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
                        "air_gap_by_volume": [(0, 12)],
                        "delay": {"enabled": True, "duration": 0.5},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 100,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 300)],
                    "delay": {"enabled": True, "duration": 1},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 100,
                        "start_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                    },
                    "retract": {
                        "air_gap_by_volume": [(0, 12)],
                        "delay": {"enabled": True, "duration": 0.5},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 100,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": False},
                    },
                    "correction_by_volume": [(0, 0), (10, -0.9), (100, -2.6), (1000, -32.2)],
                    "push_out_by_volume": [(0, 0)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 30: transfer
    pipette_left.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette_left.transfer_with_liquid_class(
        volume=48,
        source=[well_plate_2["A6"]],
        dest=[well_plate_3["A6"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_1, tip_rack_6, tip_rack_10],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_30",
            base_liquid_class=ethanol_80_base_class,
            properties={"flex_8channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 48)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0), (10, -0.9), (100, -2.6), (1000, -32.2)],
                    "delay": {"enabled": True, "duration": 0.2},
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
                        "air_gap_by_volume": [(0, 12)],
                        "delay": {"enabled": True, "duration": 0.5},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 100,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 300)],
                    "delay": {"enabled": True, "duration": 1},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 100,
                        "start_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                    },
                    "retract": {
                        "air_gap_by_volume": [(0, 12)],
                        "delay": {"enabled": True, "duration": 0.5},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 100,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": False},
                    },
                    "correction_by_volume": [(0, 0), (10, -0.9), (100, -2.6), (1000, -32.2)],
                    "push_out_by_volume": [(0, 0)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 31: transfer
    pipette_left.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette_left.transfer_with_liquid_class(
        volume=8,
        source=[well_plate_2["A7"]],
        dest=[well_plate_3["A7"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_1, tip_rack_6, tip_rack_10],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_31",
            base_liquid_class=ethanol_80_base_class,
            properties={"flex_8channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 10)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0), (10, -0.9), (100, -2.6), (1000, -32.2)],
                    "delay": {"enabled": True, "duration": 0.2},
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
                        "air_gap_by_volume": [(0, 12)],
                        "delay": {"enabled": True, "duration": 0.5},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 100,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 300)],
                    "delay": {"enabled": True, "duration": 1},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 100,
                        "start_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                    },
                    "retract": {
                        "air_gap_by_volume": [(0, 12)],
                        "delay": {"enabled": True, "duration": 0.5},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 100,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": False},
                    },
                    "correction_by_volume": [(0, 0), (10, -0.9), (100, -2.6), (1000, -32.2)],
                    "push_out_by_volume": [(0, 0)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 32: transfer
    pipette_left.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette_left.transfer_with_liquid_class(
        volume=44,
        source=[well_plate_2["A8"]],
        dest=[well_plate_3["A8"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_1, tip_rack_6, tip_rack_10],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_32",
            base_liquid_class=ethanol_80_base_class,
            properties={"flex_8channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 44)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0), (10, -0.9), (100, -2.6), (1000, -32.2)],
                    "delay": {"enabled": True, "duration": 0.2},
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
                        "air_gap_by_volume": [(0, 12)],
                        "delay": {"enabled": True, "duration": 0.5},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 100,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 300)],
                    "delay": {"enabled": True, "duration": 1},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 100,
                        "start_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                    },
                    "retract": {
                        "air_gap_by_volume": [(0, 12)],
                        "delay": {"enabled": True, "duration": 0.5},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 100,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": False},
                    },
                    "correction_by_volume": [(0, 0), (10, -0.9), (100, -2.6), (1000, -32.2)],
                    "push_out_by_volume": [(0, 0)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 33: transfer
    pipette_left.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette_left.transfer_with_liquid_class(
        volume=199,
        source=[well_plate_2["A9"]],
        dest=[well_plate_3["A9"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_1, tip_rack_6, tip_rack_10],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_33",
            base_liquid_class=ethanol_80_base_class,
            properties={"flex_8channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 199)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0), (10, -0.9), (100, -2.6), (1000, -32.2)],
                    "delay": {"enabled": True, "duration": 0.2},
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
                        "air_gap_by_volume": [(0, 11.8)],
                        "delay": {"enabled": True, "duration": 0.5},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 100,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 300)],
                    "delay": {"enabled": True, "duration": 1},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 100,
                        "start_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                    },
                    "retract": {
                        "air_gap_by_volume": [(0, 12)],
                        "delay": {"enabled": True, "duration": 0.5},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 100,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": False},
                    },
                    "correction_by_volume": [(0, 0), (10, -0.9), (100, -2.6), (1000, -32.2)],
                    "push_out_by_volume": [(0, 0)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 34: transfer
    pipette_left.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette_left.transfer_with_liquid_class(
        volume=11,
        source=[well_plate_2["A10"]],
        dest=[well_plate_3["A10"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_1, tip_rack_6, tip_rack_10],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_34",
            base_liquid_class=ethanol_80_base_class,
            properties={"flex_8channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 11)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0), (10, -0.9), (100, -2.6), (1000, -32.2)],
                    "delay": {"enabled": True, "duration": 0.2},
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
                        "air_gap_by_volume": [(0, 12)],
                        "delay": {"enabled": True, "duration": 0.5},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 100,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 300)],
                    "delay": {"enabled": True, "duration": 1},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 100,
                        "start_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                    },
                    "retract": {
                        "air_gap_by_volume": [(0, 12)],
                        "delay": {"enabled": True, "duration": 0.5},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 100,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": False},
                    },
                    "correction_by_volume": [(0, 0), (10, -0.9), (100, -2.6), (1000, -32.2)],
                    "push_out_by_volume": [(0, 0)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 35: transfer
    pipette_left.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette_left.transfer_with_liquid_class(
        volume=101,
        source=[well_plate_2["A11"]],
        dest=[well_plate_3["A11"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_1, tip_rack_6, tip_rack_10],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_35",
            base_liquid_class=ethanol_80_base_class,
            properties={"flex_8channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 101)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0), (10, -0.9), (100, -2.6), (1000, -32.2)],
                    "delay": {"enabled": True, "duration": 0.2},
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
                        "air_gap_by_volume": [(0, 12)],
                        "delay": {"enabled": True, "duration": 0.5},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 100,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 300)],
                    "delay": {"enabled": True, "duration": 1},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 100,
                        "start_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                    },
                    "retract": {
                        "air_gap_by_volume": [(0, 12)],
                        "delay": {"enabled": True, "duration": 0.5},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 100,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": False},
                    },
                    "correction_by_volume": [(0, 0), (10, -0.9), (100, -2.6), (1000, -32.2)],
                    "push_out_by_volume": [(0, 0)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 36: transfer
    pipette_left.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette_left.transfer_with_liquid_class(
        volume=999,
        source=[well_plate_2["A12"]],
        dest=[well_plate_3["A12"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_1, tip_rack_6, tip_rack_10],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_36",
            base_liquid_class=ethanol_80_base_class,
            properties={"flex_8channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 200)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0), (10, -0.9), (100, -2.6), (1000, -32.2)],
                    "delay": {"enabled": True, "duration": 0.2},
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
                        "delay": {"enabled": True, "duration": 0.5},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 100,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 300)],
                    "delay": {"enabled": True, "duration": 1},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 100,
                        "start_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                    },
                    "retract": {
                        "air_gap_by_volume": [(0, 12)],
                        "delay": {"enabled": True, "duration": 0.5},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 100,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": False},
                    },
                    "correction_by_volume": [(0, 0), (10, -0.9), (100, -2.6), (1000, -32.2)],
                    "push_out_by_volume": [(0, 0)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 37: transfer
    pipette_right.transfer_with_liquid_class(
        volume=30,
        source=[well_plate_1["A1"], well_plate_1["B1"], well_plate_1["C1"], well_plate_1["D1"], well_plate_1["E1"], well_plate_1["F1"], well_plate_1["G1"], well_plate_1["H1"], well_plate_1["A2"], well_plate_1["B2"], well_plate_1["C2"], well_plate_1["D2"], well_plate_1["E2"], well_plate_1["F2"], well_plate_1["G2"], well_plate_1["H2"], well_plate_1["A3"], well_plate_1["B3"], well_plate_1["C3"], well_plate_1["D3"], well_plate_1["E3"], well_plate_1["F3"], well_plate_1["G3"], well_plate_1["H3"], well_plate_1["A4"], well_plate_1["B4"], well_plate_1["C4"], well_plate_1["D4"], well_plate_1["E4"], well_plate_1["F4"], well_plate_1["G4"], well_plate_1["H4"], well_plate_1["A5"], well_plate_1["B5"], well_plate_1["C5"], well_plate_1["D5"], well_plate_1["E5"], well_plate_1["F5"], well_plate_1["G5"], well_plate_1["H5"], well_plate_1["A6"], well_plate_1["B6"], well_plate_1["C6"], well_plate_1["D6"], well_plate_1["E6"], well_plate_1["F6"], well_plate_1["G6"], well_plate_1["H6"], well_plate_1["A7"], well_plate_1["B7"], well_plate_1["C7"], well_plate_1["D7"], well_plate_1["E7"], well_plate_1["F7"], well_plate_1["G7"], well_plate_1["H7"], well_plate_1["A8"], well_plate_1["B8"], well_plate_1["C8"], well_plate_1["D8"], well_plate_1["E8"], well_plate_1["F8"], well_plate_1["G8"], well_plate_1["H8"], well_plate_1["A9"], well_plate_1["B9"], well_plate_1["C9"], well_plate_1["D9"], well_plate_1["E9"], well_plate_1["F9"], well_plate_1["G9"], well_plate_1["H9"], well_plate_1["A10"], well_plate_1["B10"], well_plate_1["C10"], well_plate_1["D10"], well_plate_1["E10"], well_plate_1["F10"], well_plate_1["G10"], well_plate_1["H10"], well_plate_1["A11"], well_plate_1["B11"], well_plate_1["C11"], well_plate_1["D11"], well_plate_1["E11"], well_plate_1["F11"], well_plate_1["G11"], well_plate_1["H11"], well_plate_1["A12"], well_plate_1["B12"], well_plate_1["C12"], well_plate_1["D12"], well_plate_1["E12"], well_plate_1["F12"], well_plate_1["G12"], well_plate_1["H12"]],
        dest=[well_plate_4["A1"], well_plate_4["B1"], well_plate_4["C1"], well_plate_4["D1"], well_plate_4["E1"], well_plate_4["F1"], well_plate_4["G1"], well_plate_4["H1"], well_plate_4["A2"], well_plate_4["B2"], well_plate_4["C2"], well_plate_4["D2"], well_plate_4["E2"], well_plate_4["F2"], well_plate_4["G2"], well_plate_4["H2"], well_plate_4["A3"], well_plate_4["B3"], well_plate_4["C3"], well_plate_4["D3"], well_plate_4["E3"], well_plate_4["F3"], well_plate_4["G3"], well_plate_4["H3"], well_plate_4["A4"], well_plate_4["B4"], well_plate_4["C4"], well_plate_4["D4"], well_plate_4["E4"], well_plate_4["F4"], well_plate_4["G4"], well_plate_4["H4"], well_plate_4["A5"], well_plate_4["B5"], well_plate_4["C5"], well_plate_4["D5"], well_plate_4["E5"], well_plate_4["F5"], well_plate_4["G5"], well_plate_4["H5"], well_plate_4["A6"], well_plate_4["B6"], well_plate_4["C6"], well_plate_4["D6"], well_plate_4["E6"], well_plate_4["F6"], well_plate_4["G6"], well_plate_4["H6"], well_plate_4["A7"], well_plate_4["B7"], well_plate_4["C7"], well_plate_4["D7"], well_plate_4["E7"], well_plate_4["F7"], well_plate_4["G7"], well_plate_4["H7"], well_plate_4["A8"], well_plate_4["B8"], well_plate_4["C8"], well_plate_4["D8"], well_plate_4["E8"], well_plate_4["F8"], well_plate_4["G8"], well_plate_4["H8"], well_plate_4["A9"], well_plate_4["B9"], well_plate_4["C9"], well_plate_4["D9"], well_plate_4["E9"], well_plate_4["F9"], well_plate_4["G9"], well_plate_4["H9"], well_plate_4["A10"], well_plate_4["B10"], well_plate_4["C10"], well_plate_4["D10"], well_plate_4["E10"], well_plate_4["F10"], well_plate_4["G10"], well_plate_4["H10"], well_plate_4["A11"], well_plate_4["B11"], well_plate_4["C11"], well_plate_4["D11"], well_plate_4["E11"], well_plate_4["F11"], well_plate_4["G11"], well_plate_4["H11"], well_plate_4["A12"], well_plate_4["B12"], well_plate_4["C12"], well_plate_4["D12"], well_plate_4["E12"], well_plate_4["F12"], well_plate_4["G12"], well_plate_4["H12"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        tip_racks=[tip_rack_3, tip_rack_4],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_37",
            base_liquid_class=ethanol_80_base_class,
            properties={"flex_1channel_50": {"opentrons/opentrons_flex_96_filtertiprack_50ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 20)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0), (1, -0.7), (10, -0.2), (50, -0.5)],
                    "delay": {"enabled": True, "duration": 0.2},
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
                        "air_gap_by_volume": [(0, 5)],
                        "delay": {"enabled": True, "duration": 0.5},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 100,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 7)],
                    "delay": {"enabled": True, "duration": 0.2},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 100,
                        "start_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                    },
                    "retract": {
                        "air_gap_by_volume": [(0, 5)],
                        "delay": {"enabled": True, "duration": 0.5},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 100,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": True, "location": "destination", "flow_rate": 7},
                    },
                    "correction_by_volume": [(0, 0), (1, -0.7), (10, -0.2), (50, -0.5)],
                    "push_out_by_volume": [(0, 0)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
    )
    pipette_right.drop_tip(waste_chute)

DESIGNER_APPLICATION = """{"robot":{"model":"OT-3 Standard"},"designerApplication":{"name":"opentrons/protocol-designer","version":"8.7.0","data":{"pipetteTiprackAssignments":{"88360a6e-7a23-4d95-ad2d-14418627f746":["opentrons/opentrons_flex_96_filtertiprack_1000ul/1","opentrons/opentrons_flex_96_filtertiprack_200ul/1","opentrons/opentrons_flex_96_filtertiprack_50ul/1"],"da71b095-eaf0-48e9-8787-c62dd32d3921":["opentrons/opentrons_flex_96_filtertiprack_50ul/1"]},"dismissedWarnings":{"form":[],"timeline":["TIPRACK_IN_WASTE_CHUTE_HAS_TIPS"]},"ingredients":{"0":{"displayName":"Source_1","description":null,"displayColor":"#b925ff","liquidGroupId":"0","liquidClass":null},"1":{"displayName":"Source_2","description":null,"displayColor":"#ffd600","liquidGroupId":"1","liquidClass":null}},"ingredLocations":{"663098b8-8aff-44d9-814c-73efa91ee976:opentrons/thermoscientificnunc_96_wellplate_1300ul/3":{"A1":{"0":{"volume":1200}},"B1":{"0":{"volume":1200}},"C1":{"0":{"volume":1200}},"D1":{"0":{"volume":1200}},"E1":{"0":{"volume":1200}},"F1":{"0":{"volume":1200}},"G1":{"0":{"volume":1200}},"H1":{"0":{"volume":1200}},"A2":{"0":{"volume":1200}},"B2":{"0":{"volume":1200}},"C2":{"0":{"volume":1200}},"D2":{"0":{"volume":1200}},"E2":{"0":{"volume":1200}},"F2":{"0":{"volume":1200}},"G2":{"0":{"volume":1200}},"H2":{"0":{"volume":1200}},"A3":{"0":{"volume":1200}},"B3":{"0":{"volume":1200}},"C3":{"0":{"volume":1200}},"D3":{"0":{"volume":1200}},"E3":{"0":{"volume":1200}},"F3":{"0":{"volume":1200}},"G3":{"0":{"volume":1200}},"H3":{"0":{"volume":1200}},"A4":{"0":{"volume":1200}},"B4":{"0":{"volume":1200}},"C4":{"0":{"volume":1200}},"D4":{"0":{"volume":1200}},"E4":{"0":{"volume":1200}},"F4":{"0":{"volume":1200}},"G4":{"0":{"volume":1200}},"H4":{"0":{"volume":1200}},"A5":{"0":{"volume":1200}},"B5":{"0":{"volume":1200}},"C5":{"0":{"volume":1200}},"D5":{"0":{"volume":1200}},"E5":{"0":{"volume":1200}},"F5":{"0":{"volume":1200}},"G5":{"0":{"volume":1200}},"H5":{"0":{"volume":1200}},"A6":{"0":{"volume":1200}},"B6":{"0":{"volume":1200}},"C6":{"0":{"volume":1200}},"D6":{"0":{"volume":1200}},"E6":{"0":{"volume":1200}},"F6":{"0":{"volume":1200}},"G6":{"0":{"volume":1200}},"H6":{"0":{"volume":1200}},"A7":{"0":{"volume":1200}},"B7":{"0":{"volume":1200}},"C7":{"0":{"volume":1200}},"D7":{"0":{"volume":1200}},"E7":{"0":{"volume":1200}},"F7":{"0":{"volume":1200}},"G7":{"0":{"volume":1200}},"H7":{"0":{"volume":1200}},"A8":{"0":{"volume":1200}},"B8":{"0":{"volume":1200}},"C8":{"0":{"volume":1200}},"D8":{"0":{"volume":1200}},"E8":{"0":{"volume":1200}},"F8":{"0":{"volume":1200}},"G8":{"0":{"volume":1200}},"H8":{"0":{"volume":1200}},"A9":{"0":{"volume":1200}},"B9":{"0":{"volume":1200}},"C9":{"0":{"volume":1200}},"D9":{"0":{"volume":1200}},"E9":{"0":{"volume":1200}},"F9":{"0":{"volume":1200}},"G9":{"0":{"volume":1200}},"H9":{"0":{"volume":1200}},"A10":{"0":{"volume":1200}},"B10":{"0":{"volume":1200}},"C10":{"0":{"volume":1200}},"D10":{"0":{"volume":1200}},"E10":{"0":{"volume":1200}},"F10":{"0":{"volume":1200}},"G10":{"0":{"volume":1200}},"H10":{"0":{"volume":1200}},"A11":{"0":{"volume":1200}},"B11":{"0":{"volume":1200}},"C11":{"0":{"volume":1200}},"D11":{"0":{"volume":1200}},"E11":{"0":{"volume":1200}},"F11":{"0":{"volume":1200}},"G11":{"0":{"volume":1200}},"H11":{"0":{"volume":1200}},"A12":{"0":{"volume":1200}},"B12":{"0":{"volume":1200}},"C12":{"0":{"volume":1200}},"D12":{"0":{"volume":1200}},"E12":{"0":{"volume":1200}},"F12":{"0":{"volume":1200}},"G12":{"0":{"volume":1200}},"H12":{"0":{"volume":1200}}},"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/3":{"A1":{"1":{"volume":1900}},"B1":{"1":{"volume":1900}},"C1":{"1":{"volume":1900}},"D1":{"1":{"volume":1900}},"E1":{"1":{"volume":1900}},"F1":{"1":{"volume":1900}},"G1":{"1":{"volume":1900}},"H1":{"1":{"volume":1900}},"A2":{"1":{"volume":1900}},"B2":{"1":{"volume":1900}},"C2":{"1":{"volume":1900}},"D2":{"1":{"volume":1900}},"E2":{"1":{"volume":1900}},"F2":{"1":{"volume":1900}},"G2":{"1":{"volume":1900}},"H2":{"1":{"volume":1900}},"A3":{"1":{"volume":1900}},"B3":{"1":{"volume":1900}},"C3":{"1":{"volume":1900}},"D3":{"1":{"volume":1900}},"E3":{"1":{"volume":1900}},"F3":{"1":{"volume":1900}},"G3":{"1":{"volume":1900}},"H3":{"1":{"volume":1900}},"A4":{"1":{"volume":1900}},"B4":{"1":{"volume":1900}},"C4":{"1":{"volume":1900}},"D4":{"1":{"volume":1900}},"E4":{"1":{"volume":1900}},"F4":{"1":{"volume":1900}},"G4":{"1":{"volume":1900}},"H4":{"1":{"volume":1900}},"A5":{"1":{"volume":1900}},"B5":{"1":{"volume":1900}},"C5":{"1":{"volume":1900}},"D5":{"1":{"volume":1900}},"E5":{"1":{"volume":1900}},"F5":{"1":{"volume":1900}},"G5":{"1":{"volume":1900}},"H5":{"1":{"volume":1900}},"A6":{"1":{"volume":1900}},"B6":{"1":{"volume":1900}},"C6":{"1":{"volume":1900}},"D6":{"1":{"volume":1900}},"E6":{"1":{"volume":1900}},"F6":{"1":{"volume":1900}},"G6":{"1":{"volume":1900}},"H6":{"1":{"volume":1900}},"A7":{"1":{"volume":1900}},"B7":{"1":{"volume":1900}},"C7":{"1":{"volume":1900}},"D7":{"1":{"volume":1900}},"E7":{"1":{"volume":1900}},"F7":{"1":{"volume":1900}},"G7":{"1":{"volume":1900}},"H7":{"1":{"volume":1900}},"A8":{"1":{"volume":1900}},"B8":{"1":{"volume":1900}},"C8":{"1":{"volume":1900}},"D8":{"1":{"volume":1900}},"E8":{"1":{"volume":1900}},"F8":{"1":{"volume":1900}},"G8":{"1":{"volume":1900}},"H8":{"1":{"volume":1900}},"A9":{"1":{"volume":1900}},"B9":{"1":{"volume":1900}},"C9":{"1":{"volume":1900}},"D9":{"1":{"volume":1900}},"E9":{"1":{"volume":1900}},"F9":{"1":{"volume":1900}},"G9":{"1":{"volume":1900}},"H9":{"1":{"volume":1900}},"A10":{"1":{"volume":1900}},"B10":{"1":{"volume":1900}},"C10":{"1":{"volume":1900}},"D10":{"1":{"volume":1900}},"E10":{"1":{"volume":1900}},"F10":{"1":{"volume":1900}},"G10":{"1":{"volume":1900}},"H10":{"1":{"volume":1900}},"A11":{"1":{"volume":1900}},"B11":{"1":{"volume":1900}},"C11":{"1":{"volume":1900}},"D11":{"1":{"volume":1900}},"E11":{"1":{"volume":1900}},"F11":{"1":{"volume":1900}},"G11":{"1":{"volume":1900}},"H11":{"1":{"volume":1900}},"A12":{"1":{"volume":1900}},"B12":{"1":{"volume":1900}},"C12":{"1":{"volume":1900}},"D12":{"1":{"volume":1900}},"E12":{"1":{"volume":1900}},"F12":{"1":{"volume":1900}},"G12":{"1":{"volume":1900}},"H12":{"1":{"volume":1900}}},"2f64824e-060d-4e3b-a41d-e5539e27a92b:opentrons/opentrons_flex_96_filtertiprack_50ul/1":{},"ed3f593b-60f8-44d3-a0fc-9dd1334935fc:opentrons/opentrons_flex_96_filtertiprack_200ul/1":{},"173a4ba3-2e17-4709-b45a-4cdcd050c92e:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":{}},"savedStepForms":{"__INITIAL_DECK_SETUP_STEP__":{"labwareLocationUpdate":{"7a21d246-17da-4616-ae98-f94dff1d2132:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":"C2","780d7327-daa0-483a-9a58-49d1f1599430:opentrons/opentrons_flex_96_filtertiprack_200ul/1":"B2","7b798f9b-c3ff-45d1-a811-be2933d93a90:opentrons/opentrons_flex_96_filtertiprack_50ul/1":"A2","663098b8-8aff-44d9-814c-73efa91ee976:opentrons/thermoscientificnunc_96_wellplate_1300ul/3":"C1","1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/3":"C3","860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/4":"D1","b59a0fb8-cb94-4941-886e-d7c089b0db89:opentrons/nest_96_wellplate_2ml_deep/5":"D2","2f64824e-060d-4e3b-a41d-e5539e27a92b:opentrons/opentrons_flex_96_filtertiprack_50ul/1":"A3","ed3f593b-60f8-44d3-a0fc-9dd1334935fc:opentrons/opentrons_flex_96_filtertiprack_200ul/1":"B1","173a4ba3-2e17-4709-b45a-4cdcd050c92e:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":"B3","dc40302d-4a68-44d6-ae59-3806991a7f9d:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":"offDeck","f4dae565-97d6-4756-9b42-23fc488ae6df:opentrons/opentrons_flex_96_filtertiprack_200ul/1":"offDeck","6eabfdf6-22bb-4893-97f9-1b3948bc073e:opentrons/opentrons_flex_96_filtertiprack_50ul/1":"offDeck","5db4f6c0-3532-4efd-acbd-98ff29e3df68:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":"A1"},"moduleLocationUpdate":{},"pipetteLocationUpdate":{"88360a6e-7a23-4d95-ad2d-14418627f746":"left","da71b095-eaf0-48e9-8787-c62dd32d3921":"right"},"trashBinLocationUpdate":{},"wasteChuteLocationUpdate":{"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute":"cutoutD3"},"stagingAreaLocationUpdate":{},"gripperLocationUpdate":{"1767d496-b404-411c-8062-c7566a3fa5d9:gripper":"mounted"},"stepType":"manualIntervention","id":"__INITIAL_DECK_SETUP_STEP__"},"628883b4-5d17-46cd-972c-cc07f8939106":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"","aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":"716","aspirate_labware":"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/3","aspirate_mix_checkbox":false,"aspirate_mix_times":"","aspirate_mix_volume":"","aspirate_mmFromBottom":1,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"50","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"716","blowout_location":null,"changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":false,"dispense_airGap_volume":"","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":"716","dispense_labware":"860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/4","dispense_mix_checkbox":false,"dispense_mix_times":"","dispense_mix_volume":"","dispense_mmFromBottom":1,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"50","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"none","nozzles":"ALL","path":"single","pipette":"88360a6e-7a23-4d95-ad2d-14418627f746","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"7","id":"628883b4-5d17-46cd-972c-cc07f8939106","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"35db2f71-ffbd-4cf5-9c78-75942db7d8b9":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"","aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":"716","aspirate_labware":"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/3","aspirate_mix_checkbox":false,"aspirate_mix_times":"","aspirate_mix_volume":"","aspirate_mmFromBottom":1,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"50","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A2"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"716","blowout_location":null,"changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":false,"dispense_airGap_volume":"","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":"716","dispense_labware":"860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/4","dispense_mix_checkbox":false,"dispense_mix_times":"","dispense_mix_volume":"","dispense_mmFromBottom":1,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"50","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A2"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"none","nozzles":"ALL","path":"single","pipette":"88360a6e-7a23-4d95-ad2d-14418627f746","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"14","id":"35db2f71-ffbd-4cf5-9c78-75942db7d8b9","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"265d021d-f0f1-4d92-8e05-6627e4eb977c":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"","aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":"716","aspirate_labware":"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/3","aspirate_mix_checkbox":false,"aspirate_mix_times":"","aspirate_mix_volume":"","aspirate_mmFromBottom":1,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"50","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A3"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"716","blowout_location":null,"changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":false,"dispense_airGap_volume":"","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":"716","dispense_labware":"860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/4","dispense_mix_checkbox":false,"dispense_mix_times":"","dispense_mix_volume":"","dispense_mmFromBottom":1,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"50","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A3"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"none","nozzles":"ALL","path":"single","pipette":"88360a6e-7a23-4d95-ad2d-14418627f746","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"48","id":"265d021d-f0f1-4d92-8e05-6627e4eb977c","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"31ec2941-43ec-43f0-b595-dab057e12589":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"","aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":"716","aspirate_labware":"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/3","aspirate_mix_checkbox":false,"aspirate_mix_times":"","aspirate_mix_volume":"","aspirate_mmFromBottom":1,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"50","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A4"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"716","blowout_location":null,"changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":false,"dispense_airGap_volume":"","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":"716","dispense_labware":"860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/4","dispense_mix_checkbox":false,"dispense_mix_times":"","dispense_mix_volume":"","dispense_mmFromBottom":1,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"50","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A4"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"none","nozzles":"ALL","path":"single","pipette":"88360a6e-7a23-4d95-ad2d-14418627f746","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"8","id":"31ec2941-43ec-43f0-b595-dab057e12589","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"bb1a282f-3dc9-460e-a811-a928a6b45b6c":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"","aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":"716","aspirate_labware":"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/3","aspirate_mix_checkbox":false,"aspirate_mix_times":"","aspirate_mix_volume":"","aspirate_mmFromBottom":1,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"50","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A5"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"716","blowout_location":null,"changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":false,"dispense_airGap_volume":"","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":"716","dispense_labware":"860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/4","dispense_mix_checkbox":false,"dispense_mix_times":"","dispense_mix_volume":"","dispense_mmFromBottom":1,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"50","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A5"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"none","nozzles":"ALL","path":"single","pipette":"88360a6e-7a23-4d95-ad2d-14418627f746","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"44","id":"bb1a282f-3dc9-460e-a811-a928a6b45b6c","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"bffdaf12-0a47-4064-bc61-51b3e8091639":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"","aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":"716","aspirate_labware":"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/3","aspirate_mix_checkbox":false,"aspirate_mix_times":"","aspirate_mix_volume":"","aspirate_mmFromBottom":1,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"50","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A6"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"716","blowout_location":null,"changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":false,"dispense_airGap_volume":"","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":"716","dispense_labware":"860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/4","dispense_mix_checkbox":false,"dispense_mix_times":"","dispense_mix_volume":"","dispense_mmFromBottom":1,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"50","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A6"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"none","nozzles":"ALL","path":"single","pipette":"88360a6e-7a23-4d95-ad2d-14418627f746","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"199","id":"bffdaf12-0a47-4064-bc61-51b3e8091639","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"0dd81222-380c-4702-85a0-a99ae80af5a3":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"","aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":"716","aspirate_labware":"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/3","aspirate_mix_checkbox":false,"aspirate_mix_times":"","aspirate_mix_volume":"","aspirate_mmFromBottom":1,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"50","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A7"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"716","blowout_location":null,"changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":false,"dispense_airGap_volume":"","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":"716","dispense_labware":"860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/4","dispense_mix_checkbox":false,"dispense_mix_times":"","dispense_mix_volume":"","dispense_mmFromBottom":1,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"50","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A7"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"none","nozzles":"ALL","path":"single","pipette":"88360a6e-7a23-4d95-ad2d-14418627f746","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"11","id":"0dd81222-380c-4702-85a0-a99ae80af5a3","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"6874597f-52e6-42fa-9858-fe093c97b639":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"","aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":"716","aspirate_labware":"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/3","aspirate_mix_checkbox":false,"aspirate_mix_times":"","aspirate_mix_volume":"","aspirate_mmFromBottom":1,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"50","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A8"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"716","blowout_location":null,"changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":false,"dispense_airGap_volume":"","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":"716","dispense_labware":"860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/4","dispense_mix_checkbox":false,"dispense_mix_times":"","dispense_mix_volume":"","dispense_mmFromBottom":1,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"50","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A8"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"none","nozzles":"ALL","path":"single","pipette":"88360a6e-7a23-4d95-ad2d-14418627f746","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"101","id":"6874597f-52e6-42fa-9858-fe093c97b639","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"c833ea2b-54e6-4b49-8144-1924c5471859":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"","aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":"716","aspirate_labware":"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/3","aspirate_mix_checkbox":false,"aspirate_mix_times":"","aspirate_mix_volume":"","aspirate_mmFromBottom":1,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"50","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A9"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"716","blowout_location":null,"changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":false,"dispense_airGap_volume":"","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":"716","dispense_labware":"860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/4","dispense_mix_checkbox":false,"dispense_mix_times":"","dispense_mix_volume":"","dispense_mmFromBottom":1,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"50","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A9"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"none","nozzles":"ALL","path":"single","pipette":"88360a6e-7a23-4d95-ad2d-14418627f746","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"999","id":"c833ea2b-54e6-4b49-8144-1924c5471859","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"232d84e6-d998-4d6b-af2a-98e47ac56507":{"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"10","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.5","aspirate_flowRate":"716","aspirate_labware":"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/3","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"50","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A10"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"716","blowout_location":"dest_well","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"10","dispense_delay_checkbox":false,"dispense_delay_seconds":"0","dispense_flowRate":"716","dispense_labware":"860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/4","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"50","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A10"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"water","nozzles":"ALL","path":"single","pipette":"88360a6e-7a23-4d95-ad2d-14418627f746","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"7","id":"232d84e6-d998-4d6b-af2a-98e47ac56507","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"e777d97c-cb95-43d0-9bd9-e33a5cf7acb3":{"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"10","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.5","aspirate_flowRate":"716","aspirate_labware":"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/3","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"50","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A11"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"716","blowout_location":"dest_well","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"10","dispense_delay_checkbox":false,"dispense_delay_seconds":"0","dispense_flowRate":"716","dispense_labware":"860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/4","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"50","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A11"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"water","nozzles":"ALL","path":"single","pipette":"88360a6e-7a23-4d95-ad2d-14418627f746","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"14","id":"e777d97c-cb95-43d0-9bd9-e33a5cf7acb3","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"ec515705-c7c1-4140-a67a-3a07f8d58d9e":{"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"10","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.5","aspirate_flowRate":"716","aspirate_labware":"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/3","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"50","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A12"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"716","blowout_location":"dest_well","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"10","dispense_delay_checkbox":false,"dispense_delay_seconds":"0","dispense_flowRate":"716","dispense_labware":"860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/4","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"50","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A12"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"water","nozzles":"ALL","path":"single","pipette":"88360a6e-7a23-4d95-ad2d-14418627f746","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"48","id":"ec515705-c7c1-4140-a67a-3a07f8d58d9e","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"6aa9db56-ad23-4629-9548-a08d7866d6df":{"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"10","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.5","aspirate_flowRate":"716","aspirate_labware":"663098b8-8aff-44d9-814c-73efa91ee976:opentrons/thermoscientificnunc_96_wellplate_1300ul/3","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"50","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"716","blowout_location":"dest_well","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"10","dispense_delay_checkbox":false,"dispense_delay_seconds":"0","dispense_flowRate":"716","dispense_labware":"b59a0fb8-cb94-4941-886e-d7c089b0db89:opentrons/nest_96_wellplate_2ml_deep/5","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"50","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"water","nozzles":"ALL","path":"single","pipette":"88360a6e-7a23-4d95-ad2d-14418627f746","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"8","id":"6aa9db56-ad23-4629-9548-a08d7866d6df","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"71507651-69a2-46e3-8280-8ffa21253159":{"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"10","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.5","aspirate_flowRate":"716","aspirate_labware":"663098b8-8aff-44d9-814c-73efa91ee976:opentrons/thermoscientificnunc_96_wellplate_1300ul/3","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"50","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A2"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"716","blowout_location":"dest_well","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"10","dispense_delay_checkbox":false,"dispense_delay_seconds":"0","dispense_flowRate":"716","dispense_labware":"b59a0fb8-cb94-4941-886e-d7c089b0db89:opentrons/nest_96_wellplate_2ml_deep/5","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"50","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A2"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"water","nozzles":"ALL","path":"single","pipette":"88360a6e-7a23-4d95-ad2d-14418627f746","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"44","id":"71507651-69a2-46e3-8280-8ffa21253159","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"6c47fbe5-35a3-41b9-915a-3a702fc22ced":{"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"10","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.5","aspirate_flowRate":"716","aspirate_labware":"663098b8-8aff-44d9-814c-73efa91ee976:opentrons/thermoscientificnunc_96_wellplate_1300ul/3","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"50","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A3"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"716","blowout_location":"dest_well","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"10","dispense_delay_checkbox":false,"dispense_delay_seconds":"0","dispense_flowRate":"716","dispense_labware":"b59a0fb8-cb94-4941-886e-d7c089b0db89:opentrons/nest_96_wellplate_2ml_deep/5","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"50","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A3"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"water","nozzles":"ALL","path":"single","pipette":"88360a6e-7a23-4d95-ad2d-14418627f746","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"199","id":"6c47fbe5-35a3-41b9-915a-3a702fc22ced","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"ec5e151e-383d-4853-b371-821bbc11ac06":{"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"10","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.5","aspirate_flowRate":"716","aspirate_labware":"663098b8-8aff-44d9-814c-73efa91ee976:opentrons/thermoscientificnunc_96_wellplate_1300ul/3","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"50","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A4"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"716","blowout_location":"dest_well","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"10","dispense_delay_checkbox":false,"dispense_delay_seconds":"0","dispense_flowRate":"716","dispense_labware":"b59a0fb8-cb94-4941-886e-d7c089b0db89:opentrons/nest_96_wellplate_2ml_deep/5","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"50","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A4"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"water","nozzles":"ALL","path":"single","pipette":"88360a6e-7a23-4d95-ad2d-14418627f746","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"11","id":"ec5e151e-383d-4853-b371-821bbc11ac06","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"8c31ee4e-e31c-47eb-b761-afbfd3c57a1e":{"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"10","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.5","aspirate_flowRate":"716","aspirate_labware":"663098b8-8aff-44d9-814c-73efa91ee976:opentrons/thermoscientificnunc_96_wellplate_1300ul/3","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"50","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A5"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"716","blowout_location":"dest_well","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"10","dispense_delay_checkbox":false,"dispense_delay_seconds":"0","dispense_flowRate":"716","dispense_labware":"b59a0fb8-cb94-4941-886e-d7c089b0db89:opentrons/nest_96_wellplate_2ml_deep/5","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"50","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A5"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"water","nozzles":"ALL","path":"single","pipette":"88360a6e-7a23-4d95-ad2d-14418627f746","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"101","id":"8c31ee4e-e31c-47eb-b761-afbfd3c57a1e","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"042d79c8-2928-424d-94e6-d367de2685a4":{"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"1","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.5","aspirate_flowRate":"716","aspirate_labware":"663098b8-8aff-44d9-814c-73efa91ee976:opentrons/thermoscientificnunc_96_wellplate_1300ul/3","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"50","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A6"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"716","blowout_location":"dest_well","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"10","dispense_delay_checkbox":false,"dispense_delay_seconds":"0","dispense_flowRate":"716","dispense_labware":"b59a0fb8-cb94-4941-886e-d7c089b0db89:opentrons/nest_96_wellplate_2ml_deep/5","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"50","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A6"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"water","nozzles":"ALL","path":"single","pipette":"88360a6e-7a23-4d95-ad2d-14418627f746","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"999","id":"042d79c8-2928-424d-94e6-d367de2685a4","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"b8ee8a27-2098-4894-9006-ba158d6d9492":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.7","aspirate_flowRate":"10","aspirate_labware":"663098b8-8aff-44d9-814c-73efa91ee976:opentrons/thermoscientificnunc_96_wellplate_1300ul/3","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"4","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"4","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A7"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"250","blowout_location":"dest_well","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":false,"dispense_airGap_volume":"","dispense_delay_checkbox":true,"dispense_delay_seconds":"0.5","dispense_flowRate":"250","dispense_labware":"b59a0fb8-cb94-4941-886e-d7c089b0db89:opentrons/nest_96_wellplate_2ml_deep/5","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"4","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"4","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A7"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"glycerol_50","nozzles":"ALL","path":"single","pipette":"88360a6e-7a23-4d95-ad2d-14418627f746","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"35","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"7","id":"b8ee8a27-2098-4894-9006-ba158d6d9492","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"4364e854-e450-4ec1-9894-908d10266863":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.7","aspirate_flowRate":"14","aspirate_labware":"663098b8-8aff-44d9-814c-73efa91ee976:opentrons/thermoscientificnunc_96_wellplate_1300ul/3","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"4","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"4","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A8"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"250","blowout_location":"dest_well","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":false,"dispense_airGap_volume":"","dispense_delay_checkbox":true,"dispense_delay_seconds":"0.5","dispense_flowRate":"250","dispense_labware":"b59a0fb8-cb94-4941-886e-d7c089b0db89:opentrons/nest_96_wellplate_2ml_deep/5","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"4","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"4","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A8"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"glycerol_50","nozzles":"ALL","path":"single","pipette":"88360a6e-7a23-4d95-ad2d-14418627f746","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"35","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"14","id":"4364e854-e450-4ec1-9894-908d10266863","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"0868a729-39fc-4a2b-92d2-9211e7d678b2":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.7","aspirate_flowRate":"48","aspirate_labware":"663098b8-8aff-44d9-814c-73efa91ee976:opentrons/thermoscientificnunc_96_wellplate_1300ul/3","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"4","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"4","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A9"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"250","blowout_location":"dest_well","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":false,"dispense_airGap_volume":"","dispense_delay_checkbox":true,"dispense_delay_seconds":"0.5","dispense_flowRate":"250","dispense_labware":"b59a0fb8-cb94-4941-886e-d7c089b0db89:opentrons/nest_96_wellplate_2ml_deep/5","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"4","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"4","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A9"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"glycerol_50","nozzles":"ALL","path":"single","pipette":"88360a6e-7a23-4d95-ad2d-14418627f746","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"35","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"48","id":"0868a729-39fc-4a2b-92d2-9211e7d678b2","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"bafd442a-ca1c-43d2-9a92-bd66f2d40ade":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.7","aspirate_flowRate":"10","aspirate_labware":"663098b8-8aff-44d9-814c-73efa91ee976:opentrons/thermoscientificnunc_96_wellplate_1300ul/3","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"4","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"4","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A10"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"250","blowout_location":"dest_well","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":false,"dispense_airGap_volume":"","dispense_delay_checkbox":true,"dispense_delay_seconds":"0.5","dispense_flowRate":"250","dispense_labware":"b59a0fb8-cb94-4941-886e-d7c089b0db89:opentrons/nest_96_wellplate_2ml_deep/5","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"4","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"4","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A10"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"glycerol_50","nozzles":"ALL","path":"single","pipette":"88360a6e-7a23-4d95-ad2d-14418627f746","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"35","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"8","id":"bafd442a-ca1c-43d2-9a92-bd66f2d40ade","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"d65f60e6-ab94-427e-a24b-7d77e27c9857":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.7","aspirate_flowRate":"44","aspirate_labware":"663098b8-8aff-44d9-814c-73efa91ee976:opentrons/thermoscientificnunc_96_wellplate_1300ul/3","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"4","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"4","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A11"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"250","blowout_location":"dest_well","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":false,"dispense_airGap_volume":"","dispense_delay_checkbox":true,"dispense_delay_seconds":"0.5","dispense_flowRate":"250","dispense_labware":"b59a0fb8-cb94-4941-886e-d7c089b0db89:opentrons/nest_96_wellplate_2ml_deep/5","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"4","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"4","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A11"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"glycerol_50","nozzles":"ALL","path":"single","pipette":"88360a6e-7a23-4d95-ad2d-14418627f746","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"35","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"44","id":"d65f60e6-ab94-427e-a24b-7d77e27c9857","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"35b6215b-55c5-492a-89e1-14d1259aa2cb":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.7","aspirate_flowRate":"177","aspirate_labware":"663098b8-8aff-44d9-814c-73efa91ee976:opentrons/thermoscientificnunc_96_wellplate_1300ul/3","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"4","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"4","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A12"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"250","blowout_location":"dest_well","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":false,"dispense_airGap_volume":"","dispense_delay_checkbox":true,"dispense_delay_seconds":"0.5","dispense_flowRate":"250","dispense_labware":"b59a0fb8-cb94-4941-886e-d7c089b0db89:opentrons/nest_96_wellplate_2ml_deep/5","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"4","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"4","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A12"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"glycerol_50","nozzles":"ALL","path":"single","pipette":"88360a6e-7a23-4d95-ad2d-14418627f746","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"35","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"199","id":"35b6215b-55c5-492a-89e1-14d1259aa2cb","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"0078197d-984c-4675-82b9-fb998e445542":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.7","aspirate_flowRate":"11","aspirate_labware":"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/3","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"4","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"4","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"250","blowout_location":"dest_well","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":false,"dispense_airGap_volume":"","dispense_delay_checkbox":true,"dispense_delay_seconds":"0.5","dispense_flowRate":"250","dispense_labware":"860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/4","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"4","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"4","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"glycerol_50","nozzles":"ALL","path":"single","pipette":"88360a6e-7a23-4d95-ad2d-14418627f746","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"35","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"11","id":"0078197d-984c-4675-82b9-fb998e445542","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"80d09a62-ae58-4883-bcbb-351f474f73b1":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.7","aspirate_flowRate":"100.7","aspirate_labware":"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/3","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"4","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"4","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A2"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"250","blowout_location":"dest_well","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":false,"dispense_airGap_volume":"","dispense_delay_checkbox":true,"dispense_delay_seconds":"0.5","dispense_flowRate":"250","dispense_labware":"860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/4","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"4","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"4","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A2"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"glycerol_50","nozzles":"ALL","path":"single","pipette":"88360a6e-7a23-4d95-ad2d-14418627f746","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"35","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"101","id":"80d09a62-ae58-4883-bcbb-351f474f73b1","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"51f162f1-1fd1-45db-999b-c9b85368a9fd":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.7","aspirate_flowRate":"799.2","aspirate_labware":"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/3","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"4","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"4","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A3"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"250","blowout_location":"dest_well","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":false,"dispense_airGap_volume":"","dispense_delay_checkbox":true,"dispense_delay_seconds":"0.5","dispense_flowRate":"250","dispense_labware":"860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/4","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"4","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"4","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A3"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"glycerol_50","nozzles":"ALL","path":"single","pipette":"88360a6e-7a23-4d95-ad2d-14418627f746","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"35","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"999","id":"51f162f1-1fd1-45db-999b-c9b85368a9fd","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"163dbf00-a6d2-4db4-aff9-812b3e6b6c3e":{"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"12","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.2","aspirate_flowRate":"10","aspirate_labware":"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/3","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0.5","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"100","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A4"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"300","blowout_location":"dest_well","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"12","dispense_delay_checkbox":true,"dispense_delay_seconds":"1","dispense_flowRate":"300","dispense_labware":"860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/4","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0.5","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"100","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A4"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"ethanol_80","nozzles":"ALL","path":"single","pipette":"88360a6e-7a23-4d95-ad2d-14418627f746","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":"","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"7","id":"163dbf00-a6d2-4db4-aff9-812b3e6b6c3e","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"445eccc6-97c1-4c10-a850-49fc7518c5a8":{"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"12","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.2","aspirate_flowRate":"14","aspirate_labware":"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/3","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0.5","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"100","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A5"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"300","blowout_location":"dest_well","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"12","dispense_delay_checkbox":true,"dispense_delay_seconds":"1","dispense_flowRate":"300","dispense_labware":"860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/4","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0.5","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"100","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A5"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"ethanol_80","nozzles":"ALL","path":"single","pipette":"88360a6e-7a23-4d95-ad2d-14418627f746","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":"","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"14","id":"445eccc6-97c1-4c10-a850-49fc7518c5a8","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"056e2183-1ff1-4c24-9789-d9113eecf21f":{"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"12","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.2","aspirate_flowRate":"48","aspirate_labware":"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/3","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0.5","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"100","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A6"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"300","blowout_location":"dest_well","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"12","dispense_delay_checkbox":true,"dispense_delay_seconds":"1","dispense_flowRate":"300","dispense_labware":"860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/4","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0.5","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"100","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A6"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"ethanol_80","nozzles":"ALL","path":"single","pipette":"88360a6e-7a23-4d95-ad2d-14418627f746","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":"","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"48","id":"056e2183-1ff1-4c24-9789-d9113eecf21f","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"84eb65f4-0195-4747-b627-3d15f663a5fc":{"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"12","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.2","aspirate_flowRate":"10","aspirate_labware":"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/3","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0.5","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"100","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A7"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"300","blowout_location":"dest_well","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"12","dispense_delay_checkbox":true,"dispense_delay_seconds":"1","dispense_flowRate":"300","dispense_labware":"860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/4","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0.5","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"100","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A7"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"ethanol_80","nozzles":"ALL","path":"single","pipette":"88360a6e-7a23-4d95-ad2d-14418627f746","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":"","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"8","id":"84eb65f4-0195-4747-b627-3d15f663a5fc","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"097fa902-02a5-472a-88e1-1ba9deb55e6f":{"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"12","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.2","aspirate_flowRate":"44","aspirate_labware":"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/3","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0.5","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"100","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A8"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"300","blowout_location":"dest_well","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"12","dispense_delay_checkbox":true,"dispense_delay_seconds":"1","dispense_flowRate":"300","dispense_labware":"860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/4","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0.5","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"100","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A8"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"ethanol_80","nozzles":"ALL","path":"single","pipette":"88360a6e-7a23-4d95-ad2d-14418627f746","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":"","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"44","id":"097fa902-02a5-472a-88e1-1ba9deb55e6f","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"6daff2e9-5ef7-46c5-a285-e6c7228b00ac":{"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"11.8","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.2","aspirate_flowRate":"199","aspirate_labware":"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/3","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0.5","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"100","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A9"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"300","blowout_location":"dest_well","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"12","dispense_delay_checkbox":true,"dispense_delay_seconds":"1","dispense_flowRate":"300","dispense_labware":"860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/4","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0.5","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"100","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A9"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"ethanol_80","nozzles":"ALL","path":"single","pipette":"88360a6e-7a23-4d95-ad2d-14418627f746","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":"","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"199","id":"6daff2e9-5ef7-46c5-a285-e6c7228b00ac","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"a0003e03-7e8a-4920-af6d-5d510b4a80e2":{"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"12","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.2","aspirate_flowRate":"11","aspirate_labware":"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/3","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0.5","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"100","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A10"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"300","blowout_location":"dest_well","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"12","dispense_delay_checkbox":true,"dispense_delay_seconds":"1","dispense_flowRate":"300","dispense_labware":"860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/4","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0.5","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"100","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A10"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"ethanol_80","nozzles":"ALL","path":"single","pipette":"88360a6e-7a23-4d95-ad2d-14418627f746","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":"","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"11","id":"a0003e03-7e8a-4920-af6d-5d510b4a80e2","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"4247ba96-749e-4d77-95d8-2f832fbdf33c":{"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"12","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.2","aspirate_flowRate":"101","aspirate_labware":"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/3","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0.5","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"100","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A11"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"300","blowout_location":"dest_well","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"12","dispense_delay_checkbox":true,"dispense_delay_seconds":"1","dispense_flowRate":"300","dispense_labware":"860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/4","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0.5","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"100","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A11"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"ethanol_80","nozzles":"ALL","path":"single","pipette":"88360a6e-7a23-4d95-ad2d-14418627f746","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":"","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"101","id":"4247ba96-749e-4d77-95d8-2f832fbdf33c","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"fab1798b-d8d7-4f11-a998-653af652f59d":{"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"0.0","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.2","aspirate_flowRate":"200","aspirate_labware":"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/3","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0.5","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"100","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A12"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"300","blowout_location":"dest_well","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"12","dispense_delay_checkbox":true,"dispense_delay_seconds":"1","dispense_flowRate":"300","dispense_labware":"860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/4","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0.5","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"100","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A12"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"ethanol_80","nozzles":"ALL","path":"single","pipette":"88360a6e-7a23-4d95-ad2d-14418627f746","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":"","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"999","id":"fab1798b-d8d7-4f11-a998-653af652f59d","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"c9ac7bbb-d7dd-440f-8072-c848a1c8a8a6":{"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"5","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.2","aspirate_flowRate":"20","aspirate_labware":"663098b8-8aff-44d9-814c-73efa91ee976:opentrons/thermoscientificnunc_96_wellplate_1300ul/3","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0.5","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"100","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1","B1","C1","D1","E1","F1","G1","H1","A2","B2","C2","D2","E2","F2","G2","H2","A3","B3","C3","D3","E3","F3","G3","H3","A4","B4","C4","D4","E4","F4","G4","H4","A5","B5","C5","D5","E5","F5","G5","H5","A6","B6","C6","D6","E6","F6","G6","H6","A7","B7","C7","D7","E7","F7","G7","H7","A8","B8","C8","D8","E8","F8","G8","H8","A9","B9","C9","D9","E9","F9","G9","H9","A10","B10","C10","D10","E10","F10","G10","H10","A11","B11","C11","D11","E11","F11","G11","H11","A12","B12","C12","D12","E12","F12","G12","H12"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":true,"blowout_flowRate":"7","blowout_location":"dest_well","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"5","dispense_delay_checkbox":true,"dispense_delay_seconds":"0.2","dispense_flowRate":"7","dispense_labware":"b59a0fb8-cb94-4941-886e-d7c089b0db89:opentrons/nest_96_wellplate_2ml_deep/5","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0.5","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"100","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1","B1","C1","D1","E1","F1","G1","H1","A2","B2","C2","D2","E2","F2","G2","H2","A3","B3","C3","D3","E3","F3","G3","H3","A4","B4","C4","D4","E4","F4","G4","H4","A5","B5","C5","D5","E5","F5","G5","H5","A6","B6","C6","D6","E6","F6","G6","H6","A7","B7","C7","D7","E7","F7","G7","H7","A8","B8","C8","D8","E8","F8","G8","H8","A9","B9","C9","D9","E9","F9","G9","H9","A10","B10","C10","D10","E10","F10","G10","H10","A11","B11","C11","D11","E11","F11","G11","H11","A12","B12","C12","D12","E12","F12","G12","H12"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"ethanol_80","nozzles":"SINGLE","path":"single","pipette":"da71b095-eaf0-48e9-8787-c62dd32d3921","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":"","tipRack":"opentrons/opentrons_flex_96_filtertiprack_50ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"30","id":"c9ac7bbb-d7dd-440f-8072-c848a1c8a8a6","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"c21d61e4-57d5-463a-bb98-796c12963479":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"","aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":"31.3","aspirate_labware":"b59a0fb8-cb94-4941-886e-d7c089b0db89:opentrons/nest_96_wellplate_2ml_deep/5","aspirate_mix_checkbox":false,"aspirate_mix_times":null,"aspirate_mix_volume":null,"aspirate_mmFromBottom":1,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"50","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A5","B5","C5","D5","E5","F5","G5","H5","A6","B6","C6","D6","E6","F6","G6","H6","A7","B7","C7","D7","E7","F7","G7","H7","A8","B8","C8","D8","E8","F8","G8","H8","A9","B9","C9","D9","E9","F9","G9","H9","A10","B10","C10","D10","E10","F10","G10","H10","A11","B11","C11","D11","E11","F11","G11","H11","A12","B12","C12","D12","E12","F12","G12","H12"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"50","blowout_location":null,"changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":false,"dispense_airGap_volume":"","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":"50","dispense_labware":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:undefined","dispense_mix_checkbox":false,"dispense_mix_times":"","dispense_mix_volume":"","dispense_mmFromBottom":1,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"50","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":[],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"none","nozzles":"SINGLE","path":"multiAspirate","pipette":"da71b095-eaf0-48e9-8787-c62dd32d3921","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"7","tipRack":"opentrons/opentrons_flex_96_filtertiprack_50ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"4","id":"c21d61e4-57d5-463a-bb98-796c12963479","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0}},"orderedStepIds":["628883b4-5d17-46cd-972c-cc07f8939106","35db2f71-ffbd-4cf5-9c78-75942db7d8b9","265d021d-f0f1-4d92-8e05-6627e4eb977c","31ec2941-43ec-43f0-b595-dab057e12589","bb1a282f-3dc9-460e-a811-a928a6b45b6c","bffdaf12-0a47-4064-bc61-51b3e8091639","0dd81222-380c-4702-85a0-a99ae80af5a3","6874597f-52e6-42fa-9858-fe093c97b639","c833ea2b-54e6-4b49-8144-1924c5471859","232d84e6-d998-4d6b-af2a-98e47ac56507","e777d97c-cb95-43d0-9bd9-e33a5cf7acb3","ec515705-c7c1-4140-a67a-3a07f8d58d9e","6aa9db56-ad23-4629-9548-a08d7866d6df","71507651-69a2-46e3-8280-8ffa21253159","6c47fbe5-35a3-41b9-915a-3a702fc22ced","ec5e151e-383d-4853-b371-821bbc11ac06","8c31ee4e-e31c-47eb-b761-afbfd3c57a1e","042d79c8-2928-424d-94e6-d367de2685a4","b8ee8a27-2098-4894-9006-ba158d6d9492","4364e854-e450-4ec1-9894-908d10266863","0868a729-39fc-4a2b-92d2-9211e7d678b2","bafd442a-ca1c-43d2-9a92-bd66f2d40ade","d65f60e6-ab94-427e-a24b-7d77e27c9857","35b6215b-55c5-492a-89e1-14d1259aa2cb","0078197d-984c-4675-82b9-fb998e445542","80d09a62-ae58-4883-bcbb-351f474f73b1","51f162f1-1fd1-45db-999b-c9b85368a9fd","163dbf00-a6d2-4db4-aff9-812b3e6b6c3e","445eccc6-97c1-4c10-a850-49fc7518c5a8","056e2183-1ff1-4c24-9789-d9113eecf21f","84eb65f4-0195-4747-b627-3d15f663a5fc","097fa902-02a5-472a-88e1-1ba9deb55e6f","6daff2e9-5ef7-46c5-a285-e6c7228b00ac","a0003e03-7e8a-4920-af6d-5d510b4a80e2","4247ba96-749e-4d77-95d8-2f832fbdf33c","fab1798b-d8d7-4f11-a998-653af652f59d","c9ac7bbb-d7dd-440f-8072-c848a1c8a8a6","c21d61e4-57d5-463a-bb98-796c12963479"],"pipettes":{"88360a6e-7a23-4d95-ad2d-14418627f746":{"pipetteName":"p1000_multi_flex"},"da71b095-eaf0-48e9-8787-c62dd32d3921":{"pipetteName":"p50_single_flex"}},"modules":{},"labware":{"7a21d246-17da-4616-ae98-f94dff1d2132:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 1000 µL","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1"},"780d7327-daa0-483a-9a58-49d1f1599430:opentrons/opentrons_flex_96_filtertiprack_200ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 200 µL","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_200ul/1"},"7b798f9b-c3ff-45d1-a811-be2933d93a90:opentrons/opentrons_flex_96_filtertiprack_50ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 50 µL","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_50ul/1"},"663098b8-8aff-44d9-814c-73efa91ee976:opentrons/thermoscientificnunc_96_wellplate_1300ul/3":{"displayName":"Thermo Scientific Nunc 96 Well Plate 1300 µL","labwareDefURI":"opentrons/thermoscientificnunc_96_wellplate_1300ul/3"},"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/3":{"displayName":"Thermo Scientific Nunc 96 Well Plate 2000 µL","labwareDefURI":"opentrons/thermoscientificnunc_96_wellplate_2000ul/3"},"860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/4":{"displayName":"USA Scientific 96 Deep Well Plate 2.4 mL","labwareDefURI":"opentrons/usascientific_96_wellplate_2.4ml_deep/4"},"b59a0fb8-cb94-4941-886e-d7c089b0db89:opentrons/nest_96_wellplate_2ml_deep/5":{"displayName":"NEST 96 Deep Well Plate 2mL","labwareDefURI":"opentrons/nest_96_wellplate_2ml_deep/5"},"2f64824e-060d-4e3b-a41d-e5539e27a92b:opentrons/opentrons_flex_96_filtertiprack_50ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 50 µL (1)","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_50ul/1"},"ed3f593b-60f8-44d3-a0fc-9dd1334935fc:opentrons/opentrons_flex_96_filtertiprack_200ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 200 µL (1)","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_200ul/1"},"173a4ba3-2e17-4709-b45a-4cdcd050c92e:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 1000 µL (1)","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1"},"dc40302d-4a68-44d6-ae59-3806991a7f9d:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 1000 µL (3)","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1"},"f4dae565-97d6-4756-9b42-23fc488ae6df:opentrons/opentrons_flex_96_filtertiprack_200ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 200 µL (2)","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_200ul/1"},"6eabfdf6-22bb-4893-97f9-1b3948bc073e:opentrons/opentrons_flex_96_filtertiprack_50ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 50 µL (2)","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_50ul/1"},"5db4f6c0-3532-4efd-acbd-98ff29e3df68:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 1000 µL (4)","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1"}}}},"metadata":{"protocolName":"P1000MTransferMulti","author":"","description":"","created":1748467626797,"lastModified":1769457547081,"source":"Protocol Designer","category":null,"subcategory":null,"tags":[]}}"""
