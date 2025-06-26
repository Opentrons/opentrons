import json
from opentrons import protocol_api, types

metadata = {
    "protocolName": "P1000STransferSingle",
    "author": "QA",
    "created": "2025-05-28T21:27:06.797Z",
    "lastModified": "2025-06-25T15:14:30.360Z",
    "protocolDesigner": "8.5.0-alpha.0",
    "source": "Protocol Designer",
}

requirements = {"robotType": "Flex", "apiLevel": "2.24"}

def run(protocol: protocol_api.ProtocolContext) -> None:
    # Load Labware:
    tip_rack_1 = protocol.load_labware(
        "opentrons_flex_96_filtertiprack_1000ul",
        location="C2",
        namespace="opentrons",
    )
    tip_rack_2 = protocol.load_labware(
        "opentrons_flex_96_filtertiprack_200ul",
        location="B2",
        namespace="opentrons",
    )
    tip_rack_3 = protocol.load_labware(
        "opentrons_flex_96_filtertiprack_50ul",
        location="A2",
        namespace="opentrons",
    )
    well_plate_1 = protocol.load_labware(
        "thermoscientificnunc_96_wellplate_1300ul",
        location="C1",
        namespace="opentrons",
    )
    well_plate_2 = protocol.load_labware(
        "thermoscientificnunc_96_wellplate_2000ul",
        location="C3",
        namespace="opentrons",
    )
    well_plate_3 = protocol.load_labware(
        "usascientific_96_wellplate_2.4ml_deep",
        location="D1",
        namespace="opentrons",
    )
    well_plate_4 = protocol.load_labware(
        "nest_96_wellplate_2ml_deep",
        location="D2",
        namespace="opentrons",
    )
    tip_rack_4 = protocol.load_labware(
        "opentrons_flex_96_filtertiprack_50ul",
        location="A3",
        label="Opentrons Flex 96 Filter Tip Rack 50 µL (1)",
        namespace="opentrons",
    )
    tip_rack_5 = protocol.load_labware(
        "opentrons_flex_96_filtertiprack_200ul",
        location="B1",
        label="Opentrons Flex 96 Filter Tip Rack 200 µL (1)",
        namespace="opentrons",
    )
    tip_rack_6 = protocol.load_labware(
        "opentrons_flex_96_filtertiprack_1000ul",
        location="B3",
        label="Opentrons Flex 96 Filter Tip Rack 1000 µL (1)",
        namespace="opentrons",
    )
    tip_rack_7 = protocol.load_labware(
        "opentrons_flex_96_filtertiprack_1000ul",
        location=protocol_api.OFF_DECK,
        label="Opentrons Flex 96 Filter Tip Rack 1000 µL (2)",
        namespace="opentrons",
    )
    tip_rack_8 = protocol.load_labware(
        "opentrons_flex_96_filtertiprack_200ul",
        location=protocol_api.OFF_DECK,
        label="Opentrons Flex 96 Filter Tip Rack 200 µL (2)",
        namespace="opentrons",
    )
    tip_rack_9 = protocol.load_labware(
        "opentrons_flex_96_filtertiprack_50ul",
        location=protocol_api.OFF_DECK,
        label="Opentrons Flex 96 Filter Tip Rack 50 µL (2)",
        namespace="opentrons",
    )

    # Load Pipettes:
    pipette_left = protocol.load_instrument("flex_1channel_1000", "left", tip_racks=[tip_rack_3, tip_rack_4, tip_rack_9, tip_rack_2, tip_rack_5, tip_rack_8, tip_rack_1, tip_rack_6, tip_rack_7])

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
    well_plate_1["A1"].load_liquid(liquid_1, 1200)
    well_plate_1["B1"].load_liquid(liquid_1, 1200)
    well_plate_1["C1"].load_liquid(liquid_1, 1200)
    well_plate_1["D1"].load_liquid(liquid_1, 1200)
    well_plate_1["E1"].load_liquid(liquid_1, 1200)
    well_plate_1["F1"].load_liquid(liquid_1, 1200)
    well_plate_1["G1"].load_liquid(liquid_1, 1200)
    well_plate_1["H1"].load_liquid(liquid_1, 1200)
    well_plate_1["A2"].load_liquid(liquid_1, 1200)
    well_plate_1["B2"].load_liquid(liquid_1, 1200)
    well_plate_1["C2"].load_liquid(liquid_1, 1200)
    well_plate_1["D2"].load_liquid(liquid_1, 1200)
    well_plate_1["E2"].load_liquid(liquid_1, 1200)
    well_plate_1["F2"].load_liquid(liquid_1, 1200)
    well_plate_1["G2"].load_liquid(liquid_1, 1200)
    well_plate_1["H2"].load_liquid(liquid_1, 1200)
    well_plate_1["A3"].load_liquid(liquid_1, 1200)
    well_plate_1["B3"].load_liquid(liquid_1, 1200)
    well_plate_1["C3"].load_liquid(liquid_1, 1200)
    well_plate_1["D3"].load_liquid(liquid_1, 1200)
    well_plate_1["E3"].load_liquid(liquid_1, 1200)
    well_plate_1["F3"].load_liquid(liquid_1, 1200)
    well_plate_1["G3"].load_liquid(liquid_1, 1200)
    well_plate_1["H3"].load_liquid(liquid_1, 1200)
    well_plate_1["A4"].load_liquid(liquid_1, 1200)
    well_plate_1["B4"].load_liquid(liquid_1, 1200)
    well_plate_1["C4"].load_liquid(liquid_1, 1200)
    well_plate_1["D4"].load_liquid(liquid_1, 1200)
    well_plate_1["E4"].load_liquid(liquid_1, 1200)
    well_plate_1["F4"].load_liquid(liquid_1, 1200)
    well_plate_1["G4"].load_liquid(liquid_1, 1200)
    well_plate_1["H4"].load_liquid(liquid_1, 1200)
    well_plate_1["A5"].load_liquid(liquid_1, 1200)
    well_plate_1["B5"].load_liquid(liquid_1, 1200)
    well_plate_1["C5"].load_liquid(liquid_1, 1200)
    well_plate_1["D5"].load_liquid(liquid_1, 1200)
    well_plate_1["E5"].load_liquid(liquid_1, 1200)
    well_plate_1["F5"].load_liquid(liquid_1, 1200)
    well_plate_1["G5"].load_liquid(liquid_1, 1200)
    well_plate_1["H5"].load_liquid(liquid_1, 1200)
    well_plate_1["A6"].load_liquid(liquid_1, 1200)
    well_plate_1["B6"].load_liquid(liquid_1, 1200)
    well_plate_1["C6"].load_liquid(liquid_1, 1200)
    well_plate_1["D6"].load_liquid(liquid_1, 1200)
    well_plate_1["E6"].load_liquid(liquid_1, 1200)
    well_plate_1["F6"].load_liquid(liquid_1, 1200)
    well_plate_1["G6"].load_liquid(liquid_1, 1200)
    well_plate_1["H6"].load_liquid(liquid_1, 1200)
    well_plate_1["A7"].load_liquid(liquid_1, 1200)
    well_plate_1["B7"].load_liquid(liquid_1, 1200)
    well_plate_1["C7"].load_liquid(liquid_1, 1200)
    well_plate_1["D7"].load_liquid(liquid_1, 1200)
    well_plate_1["E7"].load_liquid(liquid_1, 1200)
    well_plate_1["F7"].load_liquid(liquid_1, 1200)
    well_plate_1["G7"].load_liquid(liquid_1, 1200)
    well_plate_1["H7"].load_liquid(liquid_1, 1200)
    well_plate_1["A8"].load_liquid(liquid_1, 1200)
    well_plate_1["B8"].load_liquid(liquid_1, 1200)
    well_plate_1["C8"].load_liquid(liquid_1, 1200)
    well_plate_1["D8"].load_liquid(liquid_1, 1200)
    well_plate_1["E8"].load_liquid(liquid_1, 1200)
    well_plate_1["F8"].load_liquid(liquid_1, 1200)
    well_plate_1["G8"].load_liquid(liquid_1, 1200)
    well_plate_1["H8"].load_liquid(liquid_1, 1200)
    well_plate_1["A9"].load_liquid(liquid_1, 1200)
    well_plate_1["B9"].load_liquid(liquid_1, 1200)
    well_plate_1["C9"].load_liquid(liquid_1, 1200)
    well_plate_1["D9"].load_liquid(liquid_1, 1200)
    well_plate_1["E9"].load_liquid(liquid_1, 1200)
    well_plate_1["F9"].load_liquid(liquid_1, 1200)
    well_plate_1["G9"].load_liquid(liquid_1, 1200)
    well_plate_1["H9"].load_liquid(liquid_1, 1200)
    well_plate_1["A10"].load_liquid(liquid_1, 1200)
    well_plate_1["B10"].load_liquid(liquid_1, 1200)
    well_plate_1["C10"].load_liquid(liquid_1, 1200)
    well_plate_1["D10"].load_liquid(liquid_1, 1200)
    well_plate_1["E10"].load_liquid(liquid_1, 1200)
    well_plate_1["F10"].load_liquid(liquid_1, 1200)
    well_plate_1["G10"].load_liquid(liquid_1, 1200)
    well_plate_1["H10"].load_liquid(liquid_1, 1200)
    well_plate_1["A11"].load_liquid(liquid_1, 1200)
    well_plate_1["B11"].load_liquid(liquid_1, 1200)
    well_plate_1["C11"].load_liquid(liquid_1, 1200)
    well_plate_1["D11"].load_liquid(liquid_1, 1200)
    well_plate_1["E11"].load_liquid(liquid_1, 1200)
    well_plate_1["F11"].load_liquid(liquid_1, 1200)
    well_plate_1["G11"].load_liquid(liquid_1, 1200)
    well_plate_1["H11"].load_liquid(liquid_1, 1200)
    well_plate_1["A12"].load_liquid(liquid_1, 1200)
    well_plate_1["B12"].load_liquid(liquid_1, 1200)
    well_plate_1["C12"].load_liquid(liquid_1, 1200)
    well_plate_1["D12"].load_liquid(liquid_1, 1200)
    well_plate_1["E12"].load_liquid(liquid_1, 1200)
    well_plate_1["F12"].load_liquid(liquid_1, 1200)
    well_plate_1["G12"].load_liquid(liquid_1, 1200)
    well_plate_1["H12"].load_liquid(liquid_1, 1200)
    well_plate_2["A1"].load_liquid(liquid_2, 1900)
    well_plate_2["B1"].load_liquid(liquid_2, 1900)
    well_plate_2["C1"].load_liquid(liquid_2, 1900)
    well_plate_2["D1"].load_liquid(liquid_2, 1900)
    well_plate_2["E1"].load_liquid(liquid_2, 1900)
    well_plate_2["F1"].load_liquid(liquid_2, 1900)
    well_plate_2["G1"].load_liquid(liquid_2, 1900)
    well_plate_2["H1"].load_liquid(liquid_2, 1900)
    well_plate_2["A2"].load_liquid(liquid_2, 1900)
    well_plate_2["B2"].load_liquid(liquid_2, 1900)
    well_plate_2["C2"].load_liquid(liquid_2, 1900)
    well_plate_2["D2"].load_liquid(liquid_2, 1900)
    well_plate_2["E2"].load_liquid(liquid_2, 1900)
    well_plate_2["F2"].load_liquid(liquid_2, 1900)
    well_plate_2["G2"].load_liquid(liquid_2, 1900)
    well_plate_2["H2"].load_liquid(liquid_2, 1900)
    well_plate_2["A3"].load_liquid(liquid_2, 1900)
    well_plate_2["B3"].load_liquid(liquid_2, 1900)
    well_plate_2["C3"].load_liquid(liquid_2, 1900)
    well_plate_2["D3"].load_liquid(liquid_2, 1900)
    well_plate_2["E3"].load_liquid(liquid_2, 1900)
    well_plate_2["F3"].load_liquid(liquid_2, 1900)
    well_plate_2["G3"].load_liquid(liquid_2, 1900)
    well_plate_2["H3"].load_liquid(liquid_2, 1900)
    well_plate_2["A4"].load_liquid(liquid_2, 1900)
    well_plate_2["B4"].load_liquid(liquid_2, 1900)
    well_plate_2["C4"].load_liquid(liquid_2, 1900)
    well_plate_2["D4"].load_liquid(liquid_2, 1900)
    well_plate_2["E4"].load_liquid(liquid_2, 1900)
    well_plate_2["F4"].load_liquid(liquid_2, 1900)
    well_plate_2["G4"].load_liquid(liquid_2, 1900)
    well_plate_2["H4"].load_liquid(liquid_2, 1900)
    well_plate_2["A5"].load_liquid(liquid_2, 1900)
    well_plate_2["B5"].load_liquid(liquid_2, 1900)
    well_plate_2["C5"].load_liquid(liquid_2, 1900)
    well_plate_2["D5"].load_liquid(liquid_2, 1900)
    well_plate_2["E5"].load_liquid(liquid_2, 1900)
    well_plate_2["F5"].load_liquid(liquid_2, 1900)
    well_plate_2["G5"].load_liquid(liquid_2, 1900)
    well_plate_2["H5"].load_liquid(liquid_2, 1900)
    well_plate_2["A6"].load_liquid(liquid_2, 1900)
    well_plate_2["B6"].load_liquid(liquid_2, 1900)
    well_plate_2["C6"].load_liquid(liquid_2, 1900)
    well_plate_2["D6"].load_liquid(liquid_2, 1900)
    well_plate_2["E6"].load_liquid(liquid_2, 1900)
    well_plate_2["F6"].load_liquid(liquid_2, 1900)
    well_plate_2["G6"].load_liquid(liquid_2, 1900)
    well_plate_2["H6"].load_liquid(liquid_2, 1900)
    well_plate_2["A7"].load_liquid(liquid_2, 1900)
    well_plate_2["B7"].load_liquid(liquid_2, 1900)
    well_plate_2["C7"].load_liquid(liquid_2, 1900)
    well_plate_2["D7"].load_liquid(liquid_2, 1900)
    well_plate_2["E7"].load_liquid(liquid_2, 1900)
    well_plate_2["F7"].load_liquid(liquid_2, 1900)
    well_plate_2["G7"].load_liquid(liquid_2, 1900)
    well_plate_2["H7"].load_liquid(liquid_2, 1900)
    well_plate_2["A8"].load_liquid(liquid_2, 1900)
    well_plate_2["B8"].load_liquid(liquid_2, 1900)
    well_plate_2["C8"].load_liquid(liquid_2, 1900)
    well_plate_2["D8"].load_liquid(liquid_2, 1900)
    well_plate_2["E8"].load_liquid(liquid_2, 1900)
    well_plate_2["F8"].load_liquid(liquid_2, 1900)
    well_plate_2["G8"].load_liquid(liquid_2, 1900)
    well_plate_2["H8"].load_liquid(liquid_2, 1900)
    well_plate_2["A9"].load_liquid(liquid_2, 1900)
    well_plate_2["B9"].load_liquid(liquid_2, 1900)
    well_plate_2["C9"].load_liquid(liquid_2, 1900)
    well_plate_2["D9"].load_liquid(liquid_2, 1900)
    well_plate_2["E9"].load_liquid(liquid_2, 1900)
    well_plate_2["F9"].load_liquid(liquid_2, 1900)
    well_plate_2["G9"].load_liquid(liquid_2, 1900)
    well_plate_2["H9"].load_liquid(liquid_2, 1900)
    well_plate_2["A10"].load_liquid(liquid_2, 1900)
    well_plate_2["B10"].load_liquid(liquid_2, 1900)
    well_plate_2["C10"].load_liquid(liquid_2, 1900)
    well_plate_2["D10"].load_liquid(liquid_2, 1900)
    well_plate_2["E10"].load_liquid(liquid_2, 1900)
    well_plate_2["F10"].load_liquid(liquid_2, 1900)
    well_plate_2["G10"].load_liquid(liquid_2, 1900)
    well_plate_2["H10"].load_liquid(liquid_2, 1900)
    well_plate_2["A11"].load_liquid(liquid_2, 1900)
    well_plate_2["B11"].load_liquid(liquid_2, 1900)
    well_plate_2["C11"].load_liquid(liquid_2, 1900)
    well_plate_2["D11"].load_liquid(liquid_2, 1900)
    well_plate_2["E11"].load_liquid(liquid_2, 1900)
    well_plate_2["F11"].load_liquid(liquid_2, 1900)
    well_plate_2["G11"].load_liquid(liquid_2, 1900)
    well_plate_2["H11"].load_liquid(liquid_2, 1900)
    well_plate_2["A12"].load_liquid(liquid_2, 1900)
    well_plate_2["B12"].load_liquid(liquid_2, 1900)
    well_plate_2["C12"].load_liquid(liquid_2, 1900)
    well_plate_2["D12"].load_liquid(liquid_2, 1900)
    well_plate_2["E12"].load_liquid(liquid_2, 1900)
    well_plate_2["F12"].load_liquid(liquid_2, 1900)
    well_plate_2["G12"].load_liquid(liquid_2, 1900)
    well_plate_2["H12"].load_liquid(liquid_2, 1900)

    # Load Liquid Classes:
    water_v1 = protocol.get_liquid_class("water")
    glycerol_50_v1 = protocol.get_liquid_class("glycerol_50")
    ethanol_80_v1 = protocol.get_liquid_class("ethanol_80")

    # PROTOCOL STEPS

    # Step 1:
    pipette_left.transfer_with_liquid_class(
        volume=6,
        source=[well_plate_2["A1"]],
        dest=[well_plate_3["A1"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_1",
            properties={"flex_1channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_50ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 350)],
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
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "push_out_by_volume": [(0, 20)],
                    "flow_rate_by_volume": [(0, 350)],
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
                        "blowout": {"enabled": False},
                    },
                },
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 2:
    pipette_left.transfer_with_liquid_class(
        volume=22.1,
        source=[well_plate_1["A2"]],
        dest=[well_plate_4["A2"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_2",
            properties={"flex_1channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_50ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 478)],
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
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "push_out_by_volume": [(0, 20)],
                    "flow_rate_by_volume": [(0, 478)],
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
                        "blowout": {"enabled": False},
                    },
                },
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 3:
    pipette_left.transfer_with_liquid_class(
        volume=48,
        source=[well_plate_2["A3"]],
        dest=[well_plate_3["A3"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_3",
            properties={"flex_1channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_50ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 478)],
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
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "push_out_by_volume": [(0, 20)],
                    "flow_rate_by_volume": [(0, 478)],
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
                        "blowout": {"enabled": False},
                    },
                },
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 4:
    pipette_left.transfer_with_liquid_class(
        volume=5,
        source=[well_plate_1["A4"]],
        dest=[well_plate_4["A4"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_4",
            properties={"flex_1channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_50ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 318)],
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
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "push_out_by_volume": [(0, 20)],
                    "flow_rate_by_volume": [(0, 318)],
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
                        "blowout": {"enabled": False},
                    },
                },
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 5:
    pipette_left.transfer_with_liquid_class(
        volume=48,
        source=[well_plate_2["A5"]],
        dest=[well_plate_3["A5"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_5",
            properties={"flex_1channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_50ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 478)],
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
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "push_out_by_volume": [(0, 20)],
                    "flow_rate_by_volume": [(0, 478)],
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
                        "blowout": {"enabled": False},
                    },
                },
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 6:
    pipette_left.transfer_with_liquid_class(
        volume=197,
        source=[well_plate_1["A6"]],
        dest=[well_plate_4["A6"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_6",
            properties={"flex_1channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_50ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 478)],
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
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "push_out_by_volume": [(0, 20)],
                    "flow_rate_by_volume": [(0, 478)],
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
                        "blowout": {"enabled": False},
                    },
                },
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 7:
    pipette_left.transfer_with_liquid_class(
        volume=12,
        source=[well_plate_2["A7"]],
        dest=[well_plate_3["A7"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_7",
            properties={"flex_1channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_50ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 478)],
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
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "push_out_by_volume": [(0, 20)],
                    "flow_rate_by_volume": [(0, 478)],
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
                        "blowout": {"enabled": False},
                    },
                },
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 8:
    pipette_left.transfer_with_liquid_class(
        volume=111,
        source=[well_plate_1["A8"]],
        dest=[well_plate_4["A8"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_8",
            properties={"flex_1channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_50ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 478)],
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
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "push_out_by_volume": [(0, 20)],
                    "flow_rate_by_volume": [(0, 478)],
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
                        "blowout": {"enabled": False},
                    },
                },
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 9:
    pipette_left.transfer_with_liquid_class(
        volume=944,
        source=[well_plate_2["A9"]],
        dest=[well_plate_3["A9"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_9",
            properties={"flex_1channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_50ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 478)],
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
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "push_out_by_volume": [(0, 20)],
                    "flow_rate_by_volume": [(0, 478)],
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
                        "blowout": {"enabled": False},
                    },
                },
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 10:
    pipette_left.transfer_with_liquid_class(
        volume=6,
        source=[well_plate_1["A10"]],
        dest=[well_plate_4["A10"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_10",
            base_liquid_class=water_v1,
            properties={"flex_1channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_50ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 350)],
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
                    "push_out_by_volume": [(0, 20)],
                    "flow_rate_by_volume": [(0, 350)],
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
                        "air_gap_by_volume": [(0, 1)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 50,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": False},
                    },
                },
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 11:
    pipette_left.transfer_with_liquid_class(
        volume=22.1,
        source=[well_plate_2["A11"]],
        dest=[well_plate_3["A11"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_11",
            base_liquid_class=water_v1,
            properties={"flex_1channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_50ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 478)],
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
                    "push_out_by_volume": [(0, 20)],
                    "flow_rate_by_volume": [(0, 478)],
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
                        "air_gap_by_volume": [(0, 1)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 50,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": False},
                    },
                },
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 12:
    pipette_left.transfer_with_liquid_class(
        volume=48,
        source=[well_plate_1["A12"]],
        dest=[well_plate_4["A12"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_12",
            base_liquid_class=water_v1,
            properties={"flex_1channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_50ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 478)],
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
                    "push_out_by_volume": [(0, 20)],
                    "flow_rate_by_volume": [(0, 478)],
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
                        "air_gap_by_volume": [(0, 1)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 50,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": False},
                    },
                },
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 13:
    pipette_left.transfer_with_liquid_class(
        volume=5,
        source=[well_plate_2["B1"]],
        dest=[well_plate_3["B1"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_13",
            base_liquid_class=water_v1,
            properties={"flex_1channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_50ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 318)],
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
                    "push_out_by_volume": [(0, 20)],
                    "flow_rate_by_volume": [(0, 318)],
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
                        "air_gap_by_volume": [(0, 1)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 50,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": False},
                    },
                },
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 14:
    pipette_left.transfer_with_liquid_class(
        volume=48,
        source=[well_plate_1["B2"]],
        dest=[well_plate_4["B2"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_14",
            base_liquid_class=water_v1,
            properties={"flex_1channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_50ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 478)],
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
                    "push_out_by_volume": [(0, 20)],
                    "flow_rate_by_volume": [(0, 478)],
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
                        "air_gap_by_volume": [(0, 1)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 50,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": False},
                    },
                },
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 15:
    pipette_left.transfer_with_liquid_class(
        volume=197,
        source=[well_plate_2["B3"]],
        dest=[well_plate_3["B3"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_15",
            base_liquid_class=water_v1,
            properties={"flex_1channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_50ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 478)],
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
                        "air_gap_by_volume": [(0, 0.7)],
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
                    "push_out_by_volume": [(0, 20)],
                    "flow_rate_by_volume": [(0, 478)],
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
                        "air_gap_by_volume": [(0, 1)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 50,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": False},
                    },
                },
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 16:
    pipette_left.transfer_with_liquid_class(
        volume=12,
        source=[well_plate_1["B4"]],
        dest=[well_plate_4["B4"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_16",
            base_liquid_class=water_v1,
            properties={"flex_1channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_50ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 478)],
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
                    "push_out_by_volume": [(0, 20)],
                    "flow_rate_by_volume": [(0, 478)],
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
                        "air_gap_by_volume": [(0, 1)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 50,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": False},
                    },
                },
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 17:
    pipette_left.transfer_with_liquid_class(
        volume=111,
        source=[well_plate_2["B5"]],
        dest=[well_plate_3["B5"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_17",
            base_liquid_class=water_v1,
            properties={"flex_1channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_50ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 478)],
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
                    "push_out_by_volume": [(0, 20)],
                    "flow_rate_by_volume": [(0, 478)],
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
                        "air_gap_by_volume": [(0, 1)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 50,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": False},
                    },
                },
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 18:
    pipette_left.transfer_with_liquid_class(
        volume=944,
        source=[well_plate_1["B6"]],
        dest=[well_plate_4["B6"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_18",
            base_liquid_class=water_v1,
            properties={"flex_1channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_50ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 478)],
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
                        "air_gap_by_volume": [(0, 0.3)],
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
                    "push_out_by_volume": [(0, 20)],
                    "flow_rate_by_volume": [(0, 478)],
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
                        "air_gap_by_volume": [(0, 1)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 50,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": False},
                    },
                },
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 19:
    pipette_left.transfer_with_liquid_class(
        volume=6,
        source=[well_plate_2["B7"]],
        dest=[well_plate_3["B7"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_19",
            base_liquid_class=glycerol_50_v1,
            properties={"flex_1channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_50ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 8.6)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, -0.18000000000000005)],
                    "delay": {"enabled": True, "duration": 2},
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
                    "push_out_by_volume": [(0, 28)],
                    "flow_rate_by_volume": [(0, 50)],
                    "correction_by_volume": [(0, -0.18000000000000005)],
                    "delay": {"enabled": True, "duration": 1},
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
                        "blowout": {"enabled": False},
                    },
                },
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 20:
    pipette_left.transfer_with_liquid_class(
        volume=22.1,
        source=[well_plate_1["B8"]],
        dest=[well_plate_4["B8"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_20",
            base_liquid_class=glycerol_50_v1,
            properties={"flex_1channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_50ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 19)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0.13025000000000003)],
                    "delay": {"enabled": True, "duration": 2},
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
                    "push_out_by_volume": [(0, 20)],
                    "flow_rate_by_volume": [(0, 50)],
                    "correction_by_volume": [(0, 0.13025000000000003)],
                    "delay": {"enabled": True, "duration": 1},
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
                        "blowout": {"enabled": False},
                    },
                },
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 21:
    pipette_left.transfer_with_liquid_class(
        volume=48,
        source=[well_plate_2["B9"]],
        dest=[well_plate_3["B9"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_21",
            base_liquid_class=glycerol_50_v1,
            properties={"flex_1channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_50ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 38.5)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0.195)],
                    "delay": {"enabled": True, "duration": 2},
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
                    "push_out_by_volume": [(0, 20)],
                    "flow_rate_by_volume": [(0, 50)],
                    "correction_by_volume": [(0, 0.195)],
                    "delay": {"enabled": True, "duration": 1},
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
                        "blowout": {"enabled": False},
                    },
                },
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 22:
    pipette_left.transfer_with_liquid_class(
        volume=5,
        source=[well_plate_1["B10"]],
        dest=[well_plate_4["B10"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_22",
            base_liquid_class=glycerol_50_v1,
            properties={"flex_1channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_50ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 8.3)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, -0.25)],
                    "delay": {"enabled": True, "duration": 2},
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
                    "push_out_by_volume": [(0, 30)],
                    "flow_rate_by_volume": [(0, 50)],
                    "correction_by_volume": [(0, -0.25)],
                    "delay": {"enabled": True, "duration": 1},
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
                        "blowout": {"enabled": False},
                    },
                },
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 23:
    pipette_left.transfer_with_liquid_class(
        volume=48,
        source=[well_plate_2["B11"]],
        dest=[well_plate_3["B11"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_23",
            base_liquid_class=glycerol_50_v1,
            properties={"flex_1channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_50ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 38.5)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0.195)],
                    "delay": {"enabled": True, "duration": 2},
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
                    "push_out_by_volume": [(0, 20)],
                    "flow_rate_by_volume": [(0, 50)],
                    "correction_by_volume": [(0, 0.195)],
                    "delay": {"enabled": True, "duration": 1},
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
                        "blowout": {"enabled": False},
                    },
                },
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 24:
    pipette_left.transfer_with_liquid_class(
        volume=197,
        source=[well_plate_1["B12"]],
        dest=[well_plate_4["B12"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_24",
            base_liquid_class=glycerol_50_v1,
            properties={"flex_1channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_50ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 39.4)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0.198125)],
                    "delay": {"enabled": True, "duration": 2},
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
                    "push_out_by_volume": [(0, 20)],
                    "flow_rate_by_volume": [(0, 50)],
                    "correction_by_volume": [(0, 0.198125)],
                    "delay": {"enabled": True, "duration": 1},
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
                        "blowout": {"enabled": False},
                    },
                },
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 25:
    pipette_left.transfer_with_liquid_class(
        volume=12,
        source=[well_plate_2["C1"]],
        dest=[well_plate_3["C1"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_25",
            base_liquid_class=glycerol_50_v1,
            properties={"flex_1channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_50ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 11.5)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0.10500000000000001)],
                    "delay": {"enabled": True, "duration": 2},
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
                    "push_out_by_volume": [(0, 20)],
                    "flow_rate_by_volume": [(0, 50)],
                    "correction_by_volume": [(0, 0.10500000000000001)],
                    "delay": {"enabled": True, "duration": 1},
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
                        "blowout": {"enabled": False},
                    },
                },
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 26:
    pipette_left.transfer_with_liquid_class(
        volume=111,
        source=[well_plate_1["C2"]],
        dest=[well_plate_4["C2"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_26",
            base_liquid_class=glycerol_50_v1,
            properties={"flex_1channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_50ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 30.2)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0.1675)],
                    "delay": {"enabled": True, "duration": 2},
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
                    "push_out_by_volume": [(0, 20)],
                    "flow_rate_by_volume": [(0, 50)],
                    "correction_by_volume": [(0, 0.1675)],
                    "delay": {"enabled": True, "duration": 1},
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
                        "blowout": {"enabled": False},
                    },
                },
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 27:
    pipette_left.transfer_with_liquid_class(
        volume=944,
        source=[well_plate_2["C3"]],
        dest=[well_plate_3["C3"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_27",
            base_liquid_class=glycerol_50_v1,
            properties={"flex_1channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_50ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 39.7)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0.19921052631578948)],
                    "delay": {"enabled": True, "duration": 2},
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
                    "push_out_by_volume": [(0, 20)],
                    "flow_rate_by_volume": [(0, 50)],
                    "correction_by_volume": [(0, 0.19921052631578948)],
                    "delay": {"enabled": True, "duration": 1},
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
                        "blowout": {"enabled": False},
                    },
                },
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 28:
    pipette_left.transfer_with_liquid_class(
        volume=6,
        source=[well_plate_1["C4"]],
        dest=[well_plate_4["C4"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_28",
            base_liquid_class=ethanol_80_v1,
            properties={"flex_1channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_50ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 8.6)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, -0.74)],
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
                    "push_out_by_volume": [(0, 0)],
                    "flow_rate_by_volume": [(0, 40)],
                    "correction_by_volume": [(0, -0.74)],
                    "delay": {"enabled": True, "duration": 2},
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
                        "blowout": {"enabled": False},
                    },
                },
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 29:
    pipette_left.transfer_with_liquid_class(
        volume=22.1,
        source=[well_plate_2["C5"]],
        dest=[well_plate_3["C5"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_29",
            base_liquid_class=ethanol_80_v1,
            properties={"flex_1channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_50ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 16)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, -0.8815)],
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
                    "push_out_by_volume": [(0, 0)],
                    "flow_rate_by_volume": [(0, 40)],
                    "correction_by_volume": [(0, -0.8815)],
                    "delay": {"enabled": True, "duration": 2},
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
                        "blowout": {"enabled": False},
                    },
                },
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 30:
    pipette_left.transfer_with_liquid_class(
        volume=48,
        source=[well_plate_1["C6"]],
        dest=[well_plate_4["C6"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_30",
            base_liquid_class=ethanol_80_v1,
            properties={"flex_1channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_50ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 29)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, -1.27)],
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
                        "air_gap_by_volume": [(0, 2)],
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
                    "push_out_by_volume": [(0, 0)],
                    "flow_rate_by_volume": [(0, 40)],
                    "correction_by_volume": [(0, -1.27)],
                    "delay": {"enabled": True, "duration": 2},
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
                        "blowout": {"enabled": False},
                    },
                },
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 31:
    pipette_left.transfer_with_liquid_class(
        volume=5,
        source=[well_plate_2["C7"]],
        dest=[well_plate_3["C7"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_31",
            base_liquid_class=ethanol_80_v1,
            properties={"flex_1channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_50ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 8.3)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, -0.75)],
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
                    "push_out_by_volume": [(0, 0)],
                    "flow_rate_by_volume": [(0, 40)],
                    "correction_by_volume": [(0, -0.75)],
                    "delay": {"enabled": True, "duration": 2},
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
                        "blowout": {"enabled": False},
                    },
                },
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 32:
    pipette_left.transfer_with_liquid_class(
        volume=48,
        source=[well_plate_1["C8"]],
        dest=[well_plate_4["C8"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_32",
            base_liquid_class=ethanol_80_v1,
            properties={"flex_1channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_50ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 29)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, -1.27)],
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
                        "air_gap_by_volume": [(0, 2)],
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
                    "push_out_by_volume": [(0, 0)],
                    "flow_rate_by_volume": [(0, 40)],
                    "correction_by_volume": [(0, -1.27)],
                    "delay": {"enabled": True, "duration": 2},
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
                        "blowout": {"enabled": False},
                    },
                },
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 33:
    pipette_left.transfer_with_liquid_class(
        volume=197,
        source=[well_plate_2["C9"]],
        dest=[well_plate_3["C9"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_33",
            base_liquid_class=ethanol_80_v1,
            properties={"flex_1channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_50ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 29.6)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, -1.28875)],
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
                        "air_gap_by_volume": [(0, 0.7)],
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
                    "push_out_by_volume": [(0, 0)],
                    "flow_rate_by_volume": [(0, 40)],
                    "correction_by_volume": [(0, -1.28875)],
                    "delay": {"enabled": True, "duration": 2},
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
                        "blowout": {"enabled": False},
                    },
                },
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 34:
    pipette_left.transfer_with_liquid_class(
        volume=12,
        source=[well_plate_1["C10"]],
        dest=[well_plate_4["C10"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_34",
            base_liquid_class=ethanol_80_v1,
            properties={"flex_1channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_50ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 11)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, -0.73)],
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
                    "push_out_by_volume": [(0, 0)],
                    "flow_rate_by_volume": [(0, 40)],
                    "correction_by_volume": [(0, -0.73)],
                    "delay": {"enabled": True, "duration": 2},
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
                        "blowout": {"enabled": False},
                    },
                },
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 35:
    pipette_left.transfer_with_liquid_class(
        volume=111,
        source=[well_plate_2["C11"]],
        dest=[well_plate_3["C11"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_35",
            base_liquid_class=ethanol_80_v1,
            properties={"flex_1channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_50ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 23.5)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, -1.105)],
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
                    "push_out_by_volume": [(0, 0)],
                    "flow_rate_by_volume": [(0, 40)],
                    "correction_by_volume": [(0, -1.105)],
                    "delay": {"enabled": True, "duration": 2},
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
                        "blowout": {"enabled": False},
                    },
                },
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 36:
    pipette_left.transfer_with_liquid_class(
        volume=944,
        source=[well_plate_1["C12"]],
        dest=[well_plate_4["C12"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_36",
            base_liquid_class=ethanol_80_v1,
            properties={"flex_1channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_50ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 29.8)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, -1.295263157894737)],
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
                        "air_gap_by_volume": [(0, 0.3)],
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
                    "push_out_by_volume": [(0, 0)],
                    "flow_rate_by_volume": [(0, 40)],
                    "correction_by_volume": [(0, -1.295263157894737)],
                    "delay": {"enabled": True, "duration": 2},
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
                        "blowout": {"enabled": False},
                    },
                },
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

DESIGNER_APPLICATION = """{"robot":{"model":"OT-3 Standard"},"designerApplication":{"name":"opentrons/protocol-designer","version":"8.5.0","data":{"pipetteTiprackAssignments":{"61853486-6910-4d82-9193-0b99bc1ac2c3":["opentrons/opentrons_flex_96_filtertiprack_50ul/1","opentrons/opentrons_flex_96_filtertiprack_200ul/1","opentrons/opentrons_flex_96_filtertiprack_1000ul/1"]},"dismissedWarnings":{"form":[],"timeline":[]},"ingredients":{"0":{"displayName":"Source_1","description":null,"displayColor":"#b925ff","liquidGroupId":"0","liquidClass":null},"1":{"displayName":"Source_2","description":null,"displayColor":"#ffd600","liquidGroupId":"1","liquidClass":null}},"ingredLocations":{"663098b8-8aff-44d9-814c-73efa91ee976:opentrons/thermoscientificnunc_96_wellplate_1300ul/2":{"A1":{"0":{"volume":1200}},"B1":{"0":{"volume":1200}},"C1":{"0":{"volume":1200}},"D1":{"0":{"volume":1200}},"E1":{"0":{"volume":1200}},"F1":{"0":{"volume":1200}},"G1":{"0":{"volume":1200}},"H1":{"0":{"volume":1200}},"A2":{"0":{"volume":1200}},"B2":{"0":{"volume":1200}},"C2":{"0":{"volume":1200}},"D2":{"0":{"volume":1200}},"E2":{"0":{"volume":1200}},"F2":{"0":{"volume":1200}},"G2":{"0":{"volume":1200}},"H2":{"0":{"volume":1200}},"A3":{"0":{"volume":1200}},"B3":{"0":{"volume":1200}},"C3":{"0":{"volume":1200}},"D3":{"0":{"volume":1200}},"E3":{"0":{"volume":1200}},"F3":{"0":{"volume":1200}},"G3":{"0":{"volume":1200}},"H3":{"0":{"volume":1200}},"A4":{"0":{"volume":1200}},"B4":{"0":{"volume":1200}},"C4":{"0":{"volume":1200}},"D4":{"0":{"volume":1200}},"E4":{"0":{"volume":1200}},"F4":{"0":{"volume":1200}},"G4":{"0":{"volume":1200}},"H4":{"0":{"volume":1200}},"A5":{"0":{"volume":1200}},"B5":{"0":{"volume":1200}},"C5":{"0":{"volume":1200}},"D5":{"0":{"volume":1200}},"E5":{"0":{"volume":1200}},"F5":{"0":{"volume":1200}},"G5":{"0":{"volume":1200}},"H5":{"0":{"volume":1200}},"A6":{"0":{"volume":1200}},"B6":{"0":{"volume":1200}},"C6":{"0":{"volume":1200}},"D6":{"0":{"volume":1200}},"E6":{"0":{"volume":1200}},"F6":{"0":{"volume":1200}},"G6":{"0":{"volume":1200}},"H6":{"0":{"volume":1200}},"A7":{"0":{"volume":1200}},"B7":{"0":{"volume":1200}},"C7":{"0":{"volume":1200}},"D7":{"0":{"volume":1200}},"E7":{"0":{"volume":1200}},"F7":{"0":{"volume":1200}},"G7":{"0":{"volume":1200}},"H7":{"0":{"volume":1200}},"A8":{"0":{"volume":1200}},"B8":{"0":{"volume":1200}},"C8":{"0":{"volume":1200}},"D8":{"0":{"volume":1200}},"E8":{"0":{"volume":1200}},"F8":{"0":{"volume":1200}},"G8":{"0":{"volume":1200}},"H8":{"0":{"volume":1200}},"A9":{"0":{"volume":1200}},"B9":{"0":{"volume":1200}},"C9":{"0":{"volume":1200}},"D9":{"0":{"volume":1200}},"E9":{"0":{"volume":1200}},"F9":{"0":{"volume":1200}},"G9":{"0":{"volume":1200}},"H9":{"0":{"volume":1200}},"A10":{"0":{"volume":1200}},"B10":{"0":{"volume":1200}},"C10":{"0":{"volume":1200}},"D10":{"0":{"volume":1200}},"E10":{"0":{"volume":1200}},"F10":{"0":{"volume":1200}},"G10":{"0":{"volume":1200}},"H10":{"0":{"volume":1200}},"A11":{"0":{"volume":1200}},"B11":{"0":{"volume":1200}},"C11":{"0":{"volume":1200}},"D11":{"0":{"volume":1200}},"E11":{"0":{"volume":1200}},"F11":{"0":{"volume":1200}},"G11":{"0":{"volume":1200}},"H11":{"0":{"volume":1200}},"A12":{"0":{"volume":1200}},"B12":{"0":{"volume":1200}},"C12":{"0":{"volume":1200}},"D12":{"0":{"volume":1200}},"E12":{"0":{"volume":1200}},"F12":{"0":{"volume":1200}},"G12":{"0":{"volume":1200}},"H12":{"0":{"volume":1200}}},"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/2":{"A1":{"1":{"volume":1900}},"B1":{"1":{"volume":1900}},"C1":{"1":{"volume":1900}},"D1":{"1":{"volume":1900}},"E1":{"1":{"volume":1900}},"F1":{"1":{"volume":1900}},"G1":{"1":{"volume":1900}},"H1":{"1":{"volume":1900}},"A2":{"1":{"volume":1900}},"B2":{"1":{"volume":1900}},"C2":{"1":{"volume":1900}},"D2":{"1":{"volume":1900}},"E2":{"1":{"volume":1900}},"F2":{"1":{"volume":1900}},"G2":{"1":{"volume":1900}},"H2":{"1":{"volume":1900}},"A3":{"1":{"volume":1900}},"B3":{"1":{"volume":1900}},"C3":{"1":{"volume":1900}},"D3":{"1":{"volume":1900}},"E3":{"1":{"volume":1900}},"F3":{"1":{"volume":1900}},"G3":{"1":{"volume":1900}},"H3":{"1":{"volume":1900}},"A4":{"1":{"volume":1900}},"B4":{"1":{"volume":1900}},"C4":{"1":{"volume":1900}},"D4":{"1":{"volume":1900}},"E4":{"1":{"volume":1900}},"F4":{"1":{"volume":1900}},"G4":{"1":{"volume":1900}},"H4":{"1":{"volume":1900}},"A5":{"1":{"volume":1900}},"B5":{"1":{"volume":1900}},"C5":{"1":{"volume":1900}},"D5":{"1":{"volume":1900}},"E5":{"1":{"volume":1900}},"F5":{"1":{"volume":1900}},"G5":{"1":{"volume":1900}},"H5":{"1":{"volume":1900}},"A6":{"1":{"volume":1900}},"B6":{"1":{"volume":1900}},"C6":{"1":{"volume":1900}},"D6":{"1":{"volume":1900}},"E6":{"1":{"volume":1900}},"F6":{"1":{"volume":1900}},"G6":{"1":{"volume":1900}},"H6":{"1":{"volume":1900}},"A7":{"1":{"volume":1900}},"B7":{"1":{"volume":1900}},"C7":{"1":{"volume":1900}},"D7":{"1":{"volume":1900}},"E7":{"1":{"volume":1900}},"F7":{"1":{"volume":1900}},"G7":{"1":{"volume":1900}},"H7":{"1":{"volume":1900}},"A8":{"1":{"volume":1900}},"B8":{"1":{"volume":1900}},"C8":{"1":{"volume":1900}},"D8":{"1":{"volume":1900}},"E8":{"1":{"volume":1900}},"F8":{"1":{"volume":1900}},"G8":{"1":{"volume":1900}},"H8":{"1":{"volume":1900}},"A9":{"1":{"volume":1900}},"B9":{"1":{"volume":1900}},"C9":{"1":{"volume":1900}},"D9":{"1":{"volume":1900}},"E9":{"1":{"volume":1900}},"F9":{"1":{"volume":1900}},"G9":{"1":{"volume":1900}},"H9":{"1":{"volume":1900}},"A10":{"1":{"volume":1900}},"B10":{"1":{"volume":1900}},"C10":{"1":{"volume":1900}},"D10":{"1":{"volume":1900}},"E10":{"1":{"volume":1900}},"F10":{"1":{"volume":1900}},"G10":{"1":{"volume":1900}},"H10":{"1":{"volume":1900}},"A11":{"1":{"volume":1900}},"B11":{"1":{"volume":1900}},"C11":{"1":{"volume":1900}},"D11":{"1":{"volume":1900}},"E11":{"1":{"volume":1900}},"F11":{"1":{"volume":1900}},"G11":{"1":{"volume":1900}},"H11":{"1":{"volume":1900}},"A12":{"1":{"volume":1900}},"B12":{"1":{"volume":1900}},"C12":{"1":{"volume":1900}},"D12":{"1":{"volume":1900}},"E12":{"1":{"volume":1900}},"F12":{"1":{"volume":1900}},"G12":{"1":{"volume":1900}},"H12":{"1":{"volume":1900}}},"a3ec9992-9b00-4451-a077-578ef21b975c:opentrons/opentrons_flex_96_filtertiprack_50ul/1":{},"45987d82-d88e-425e-befd-8114611744f6:opentrons/opentrons_flex_96_filtertiprack_200ul/1":{},"58cf7241-6587-4c42-9df4-e9f3cb5a6c89:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":{}},"savedStepForms":{"__INITIAL_DECK_SETUP_STEP__":{"labwareLocationUpdate":{"7a21d246-17da-4616-ae98-f94dff1d2132:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":"C2","780d7327-daa0-483a-9a58-49d1f1599430:opentrons/opentrons_flex_96_filtertiprack_200ul/1":"B2","7b798f9b-c3ff-45d1-a811-be2933d93a90:opentrons/opentrons_flex_96_filtertiprack_50ul/1":"A2","663098b8-8aff-44d9-814c-73efa91ee976:opentrons/thermoscientificnunc_96_wellplate_1300ul/2":"C1","1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/2":"C3","860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/2":"D1","b59a0fb8-cb94-4941-886e-d7c089b0db89:opentrons/nest_96_wellplate_2ml_deep/3":"D2","a3ec9992-9b00-4451-a077-578ef21b975c:opentrons/opentrons_flex_96_filtertiprack_50ul/1":"A3","45987d82-d88e-425e-befd-8114611744f6:opentrons/opentrons_flex_96_filtertiprack_200ul/1":"B1","58cf7241-6587-4c42-9df4-e9f3cb5a6c89:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":"B3","2b51e1b5-af62-4d51-96f6-e53f5ac55c20:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":"offDeck","3da54e81-41a7-40bb-ae7a-21c46b932b73:opentrons/opentrons_flex_96_filtertiprack_200ul/1":"offDeck","d6d34253-6094-432e-bb99-7279bc1b67a7:opentrons/opentrons_flex_96_filtertiprack_50ul/1":"offDeck"},"moduleLocationUpdate":{},"pipetteLocationUpdate":{"61853486-6910-4d82-9193-0b99bc1ac2c3":"left"},"trashBinLocationUpdate":{},"wasteChuteLocationUpdate":{"b01e5418-14ca-4846-b141-e33813d60829:wasteChute":"cutoutD3"},"stagingAreaLocationUpdate":{},"gripperLocationUpdate":{"b4db7cd0-6375-4476-a37a-f3aefc8f30fc:gripper":"mounted"},"stepType":"manualIntervention","id":"__INITIAL_DECK_SETUP_STEP__"},"9d1c1133-e824-432d-bfbd-f37602c84d18":{"id":"9d1c1133-e824-432d-bfbd-f37602c84d18","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"","aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":"350","aspirate_labware":"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"","aspirate_mix_volume":"","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"50","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"null","blowout_location":null,"changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":false,"dispense_airGap_volume":"","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":"350","dispense_labware":"860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/2","dispense_mix_checkbox":false,"dispense_mix_times":"","dispense_mix_volume":"","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"50","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"b01e5418-14ca-4846-b141-e33813d60829:wasteChute","liquidClassesSupported":true,"liquidClass":"none","nozzles":null,"path":"single","pipette":"61853486-6910-4d82-9193-0b99bc1ac2c3","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_50ul/1","volume":"6"},"f2cc1d7d-3f9a-4af6-9ebd-8f35a7b68800":{"id":"f2cc1d7d-3f9a-4af6-9ebd-8f35a7b68800","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"","aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":"478","aspirate_labware":"663098b8-8aff-44d9-814c-73efa91ee976:opentrons/thermoscientificnunc_96_wellplate_1300ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"","aspirate_mix_volume":"","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"50","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A2"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"null","blowout_location":null,"changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":false,"dispense_airGap_volume":"","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":"478","dispense_labware":"b59a0fb8-cb94-4941-886e-d7c089b0db89:opentrons/nest_96_wellplate_2ml_deep/3","dispense_mix_checkbox":false,"dispense_mix_times":"","dispense_mix_volume":"","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"50","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A2"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"b01e5418-14ca-4846-b141-e33813d60829:wasteChute","liquidClassesSupported":true,"liquidClass":"none","nozzles":null,"path":"single","pipette":"61853486-6910-4d82-9193-0b99bc1ac2c3","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_50ul/1","volume":"22.1"},"2c2278cb-8d67-4a24-9735-92ad3dc7ce51":{"id":"2c2278cb-8d67-4a24-9735-92ad3dc7ce51","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"","aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":"478","aspirate_labware":"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"","aspirate_mix_volume":"","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"50","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A3"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"null","blowout_location":null,"changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":false,"dispense_airGap_volume":"","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":"478","dispense_labware":"860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/2","dispense_mix_checkbox":false,"dispense_mix_times":"","dispense_mix_volume":"","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"50","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A3"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"b01e5418-14ca-4846-b141-e33813d60829:wasteChute","liquidClassesSupported":true,"liquidClass":"none","nozzles":null,"path":"single","pipette":"61853486-6910-4d82-9193-0b99bc1ac2c3","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_50ul/1","volume":"48"},"75a036b6-889e-401d-95dd-62b1a9155d4d":{"id":"75a036b6-889e-401d-95dd-62b1a9155d4d","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"","aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":"318","aspirate_labware":"663098b8-8aff-44d9-814c-73efa91ee976:opentrons/thermoscientificnunc_96_wellplate_1300ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"","aspirate_mix_volume":"","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"50","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A4"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"null","blowout_location":null,"changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":false,"dispense_airGap_volume":"","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":"318","dispense_labware":"b59a0fb8-cb94-4941-886e-d7c089b0db89:opentrons/nest_96_wellplate_2ml_deep/3","dispense_mix_checkbox":false,"dispense_mix_times":"","dispense_mix_volume":"","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"50","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A4"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"b01e5418-14ca-4846-b141-e33813d60829:wasteChute","liquidClassesSupported":true,"liquidClass":"none","nozzles":null,"path":"single","pipette":"61853486-6910-4d82-9193-0b99bc1ac2c3","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_50ul/1","volume":"5"},"b523a509-3036-47e6-a6e6-667d9886bad6":{"id":"b523a509-3036-47e6-a6e6-667d9886bad6","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"","aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":"478","aspirate_labware":"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"","aspirate_mix_volume":"","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"50","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A5"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"null","blowout_location":null,"changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":false,"dispense_airGap_volume":"","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":"478","dispense_labware":"860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/2","dispense_mix_checkbox":false,"dispense_mix_times":"","dispense_mix_volume":"","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"50","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A5"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"b01e5418-14ca-4846-b141-e33813d60829:wasteChute","liquidClassesSupported":true,"liquidClass":"none","nozzles":null,"path":"single","pipette":"61853486-6910-4d82-9193-0b99bc1ac2c3","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_50ul/1","volume":"48"},"e23044ee-0bf3-4fe4-951a-1ae516ae2d08":{"id":"e23044ee-0bf3-4fe4-951a-1ae516ae2d08","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"","aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":"478","aspirate_labware":"663098b8-8aff-44d9-814c-73efa91ee976:opentrons/thermoscientificnunc_96_wellplate_1300ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"","aspirate_mix_volume":"","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"50","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A6"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"null","blowout_location":null,"changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":false,"dispense_airGap_volume":"","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":"478","dispense_labware":"b59a0fb8-cb94-4941-886e-d7c089b0db89:opentrons/nest_96_wellplate_2ml_deep/3","dispense_mix_checkbox":false,"dispense_mix_times":"","dispense_mix_volume":"","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"50","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A6"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"b01e5418-14ca-4846-b141-e33813d60829:wasteChute","liquidClassesSupported":true,"liquidClass":"none","nozzles":null,"path":"single","pipette":"61853486-6910-4d82-9193-0b99bc1ac2c3","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_50ul/1","volume":"197"},"b32820ab-e2f8-4949-911e-06379636b9b3":{"id":"b32820ab-e2f8-4949-911e-06379636b9b3","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"","aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":"478","aspirate_labware":"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"","aspirate_mix_volume":"","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"50","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A7"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"null","blowout_location":null,"changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":false,"dispense_airGap_volume":"","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":"478","dispense_labware":"860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/2","dispense_mix_checkbox":false,"dispense_mix_times":"","dispense_mix_volume":"","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"50","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A7"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"b01e5418-14ca-4846-b141-e33813d60829:wasteChute","liquidClassesSupported":true,"liquidClass":"none","nozzles":null,"path":"single","pipette":"61853486-6910-4d82-9193-0b99bc1ac2c3","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_50ul/1","volume":"12"},"015df2d5-fd13-4510-b311-9cd7541d1168":{"id":"015df2d5-fd13-4510-b311-9cd7541d1168","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"","aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":"478","aspirate_labware":"663098b8-8aff-44d9-814c-73efa91ee976:opentrons/thermoscientificnunc_96_wellplate_1300ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"","aspirate_mix_volume":"","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"50","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A8"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"null","blowout_location":null,"changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":false,"dispense_airGap_volume":"","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":"478","dispense_labware":"b59a0fb8-cb94-4941-886e-d7c089b0db89:opentrons/nest_96_wellplate_2ml_deep/3","dispense_mix_checkbox":false,"dispense_mix_times":"","dispense_mix_volume":"","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"50","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A8"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"b01e5418-14ca-4846-b141-e33813d60829:wasteChute","liquidClassesSupported":true,"liquidClass":"none","nozzles":null,"path":"single","pipette":"61853486-6910-4d82-9193-0b99bc1ac2c3","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_50ul/1","volume":"111"},"9d8e8348-f9f3-4e7c-b6d5-c19e8bbd9951":{"id":"9d8e8348-f9f3-4e7c-b6d5-c19e8bbd9951","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"","aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":"478","aspirate_labware":"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"","aspirate_mix_volume":"","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"50","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A9"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"null","blowout_location":null,"changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":false,"dispense_airGap_volume":"","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":"478","dispense_labware":"860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/2","dispense_mix_checkbox":false,"dispense_mix_times":"","dispense_mix_volume":"","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"50","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A9"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"b01e5418-14ca-4846-b141-e33813d60829:wasteChute","liquidClassesSupported":true,"liquidClass":"none","nozzles":null,"path":"single","pipette":"61853486-6910-4d82-9193-0b99bc1ac2c3","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_50ul/1","volume":"944"},"1efe9ed2-082a-4b96-b1ab-5efb28448191":{"id":"1efe9ed2-082a-4b96-b1ab-5efb28448191","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"1","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.5","aspirate_flowRate":"350","aspirate_labware":"663098b8-8aff-44d9-814c-73efa91ee976:opentrons/thermoscientificnunc_96_wellplate_1300ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"50","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A10"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"478","blowout_location":"destination","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"1","dispense_delay_checkbox":false,"dispense_delay_seconds":"0","dispense_flowRate":"350","dispense_labware":"b59a0fb8-cb94-4941-886e-d7c089b0db89:opentrons/nest_96_wellplate_2ml_deep/3","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"50","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A10"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"b01e5418-14ca-4846-b141-e33813d60829:wasteChute","liquidClassesSupported":true,"liquidClass":"waterV1","nozzles":null,"path":"single","pipette":"61853486-6910-4d82-9193-0b99bc1ac2c3","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_50ul/1","volume":"6"},"5eaeb79c-d3c2-4181-86b0-45efd2934c0d":{"id":"5eaeb79c-d3c2-4181-86b0-45efd2934c0d","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"1","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.5","aspirate_flowRate":"478","aspirate_labware":"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"50","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A11"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"478","blowout_location":"destination","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"1","dispense_delay_checkbox":false,"dispense_delay_seconds":"0","dispense_flowRate":"478","dispense_labware":"860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/2","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"50","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A11"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"b01e5418-14ca-4846-b141-e33813d60829:wasteChute","liquidClassesSupported":true,"liquidClass":"waterV1","nozzles":null,"path":"single","pipette":"61853486-6910-4d82-9193-0b99bc1ac2c3","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_50ul/1","volume":"22.1"},"e4c63179-afeb-4a4a-a2d5-cfa9ec59be02":{"id":"e4c63179-afeb-4a4a-a2d5-cfa9ec59be02","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"1","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.5","aspirate_flowRate":"478","aspirate_labware":"663098b8-8aff-44d9-814c-73efa91ee976:opentrons/thermoscientificnunc_96_wellplate_1300ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"50","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A12"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"478","blowout_location":"destination","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"1","dispense_delay_checkbox":false,"dispense_delay_seconds":"0","dispense_flowRate":"478","dispense_labware":"b59a0fb8-cb94-4941-886e-d7c089b0db89:opentrons/nest_96_wellplate_2ml_deep/3","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"50","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A12"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"b01e5418-14ca-4846-b141-e33813d60829:wasteChute","liquidClassesSupported":true,"liquidClass":"waterV1","nozzles":null,"path":"single","pipette":"61853486-6910-4d82-9193-0b99bc1ac2c3","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_50ul/1","volume":"48"},"83c1ef81-09eb-4761-a1f9-01017bbec17b":{"id":"83c1ef81-09eb-4761-a1f9-01017bbec17b","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"1","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.5","aspirate_flowRate":"318","aspirate_labware":"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"50","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["B1"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"478","blowout_location":"destination","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"1","dispense_delay_checkbox":false,"dispense_delay_seconds":"0","dispense_flowRate":"318","dispense_labware":"860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/2","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"50","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["B1"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"b01e5418-14ca-4846-b141-e33813d60829:wasteChute","liquidClassesSupported":true,"liquidClass":"waterV1","nozzles":null,"path":"single","pipette":"61853486-6910-4d82-9193-0b99bc1ac2c3","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_50ul/1","volume":"5"},"892f57ac-d455-4e25-8dcf-f6416855d578":{"id":"892f57ac-d455-4e25-8dcf-f6416855d578","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"1","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.5","aspirate_flowRate":"478","aspirate_labware":"663098b8-8aff-44d9-814c-73efa91ee976:opentrons/thermoscientificnunc_96_wellplate_1300ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"50","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["B2"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"478","blowout_location":"destination","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"1","dispense_delay_checkbox":false,"dispense_delay_seconds":"0","dispense_flowRate":"478","dispense_labware":"b59a0fb8-cb94-4941-886e-d7c089b0db89:opentrons/nest_96_wellplate_2ml_deep/3","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"50","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["B2"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"b01e5418-14ca-4846-b141-e33813d60829:wasteChute","liquidClassesSupported":true,"liquidClass":"waterV1","nozzles":null,"path":"single","pipette":"61853486-6910-4d82-9193-0b99bc1ac2c3","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_50ul/1","volume":"48"},"aa96d316-918e-4a4a-8a9c-aee730b1b585":{"id":"aa96d316-918e-4a4a-8a9c-aee730b1b585","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"0.7","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.5","aspirate_flowRate":"478","aspirate_labware":"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"50","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["B3"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"478","blowout_location":"destination","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"1","dispense_delay_checkbox":false,"dispense_delay_seconds":"0","dispense_flowRate":"478","dispense_labware":"860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/2","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"50","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["B3"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"b01e5418-14ca-4846-b141-e33813d60829:wasteChute","liquidClassesSupported":true,"liquidClass":"waterV1","nozzles":null,"path":"single","pipette":"61853486-6910-4d82-9193-0b99bc1ac2c3","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_50ul/1","volume":"197"},"f8ec709d-11b6-4a6e-bc85-9c10bc2fb16f":{"id":"f8ec709d-11b6-4a6e-bc85-9c10bc2fb16f","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"1","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.5","aspirate_flowRate":"478","aspirate_labware":"663098b8-8aff-44d9-814c-73efa91ee976:opentrons/thermoscientificnunc_96_wellplate_1300ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"50","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["B4"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"478","blowout_location":"destination","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"1","dispense_delay_checkbox":false,"dispense_delay_seconds":"0","dispense_flowRate":"478","dispense_labware":"b59a0fb8-cb94-4941-886e-d7c089b0db89:opentrons/nest_96_wellplate_2ml_deep/3","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"50","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["B4"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"b01e5418-14ca-4846-b141-e33813d60829:wasteChute","liquidClassesSupported":true,"liquidClass":"waterV1","nozzles":null,"path":"single","pipette":"61853486-6910-4d82-9193-0b99bc1ac2c3","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_50ul/1","volume":"12"},"a03ab18a-7dc0-44a3-90a4-e9f604e7c4cd":{"id":"a03ab18a-7dc0-44a3-90a4-e9f604e7c4cd","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"1","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.5","aspirate_flowRate":"478","aspirate_labware":"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"50","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["B5"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"478","blowout_location":"destination","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"1","dispense_delay_checkbox":false,"dispense_delay_seconds":"0","dispense_flowRate":"478","dispense_labware":"860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/2","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"50","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["B5"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"b01e5418-14ca-4846-b141-e33813d60829:wasteChute","liquidClassesSupported":true,"liquidClass":"waterV1","nozzles":null,"path":"single","pipette":"61853486-6910-4d82-9193-0b99bc1ac2c3","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_50ul/1","volume":"111"},"a2201ebb-865d-498e-b6b6-e7b4c17ad871":{"id":"a2201ebb-865d-498e-b6b6-e7b4c17ad871","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"0.3","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.5","aspirate_flowRate":"478","aspirate_labware":"663098b8-8aff-44d9-814c-73efa91ee976:opentrons/thermoscientificnunc_96_wellplate_1300ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"50","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["B6"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"478","blowout_location":"destination","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"1","dispense_delay_checkbox":false,"dispense_delay_seconds":"0","dispense_flowRate":"478","dispense_labware":"b59a0fb8-cb94-4941-886e-d7c089b0db89:opentrons/nest_96_wellplate_2ml_deep/3","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"50","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["B6"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"b01e5418-14ca-4846-b141-e33813d60829:wasteChute","liquidClassesSupported":true,"liquidClass":"waterV1","nozzles":null,"path":"single","pipette":"61853486-6910-4d82-9193-0b99bc1ac2c3","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_50ul/1","volume":"944"},"a6126fd9-cebb-443e-a79d-ae1745ec33a2":{"id":"a6126fd9-cebb-443e-a79d-ae1745ec33a2","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"2","aspirate_flowRate":"8.6","aspirate_labware":"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"4","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"4","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["B7"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"50","blowout_location":"destination","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":false,"dispense_airGap_volume":"","dispense_delay_checkbox":true,"dispense_delay_seconds":"1","dispense_flowRate":"50","dispense_labware":"860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/2","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"4","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"4","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["B7"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"b01e5418-14ca-4846-b141-e33813d60829:wasteChute","liquidClassesSupported":true,"liquidClass":"glycerol50V1","nozzles":null,"path":"single","pipette":"61853486-6910-4d82-9193-0b99bc1ac2c3","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"28","tipRack":"opentrons/opentrons_flex_96_filtertiprack_50ul/1","volume":"6"},"e51d631e-26e1-469b-8162-188578026141":{"id":"e51d631e-26e1-469b-8162-188578026141","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"2","aspirate_flowRate":"19.0","aspirate_labware":"663098b8-8aff-44d9-814c-73efa91ee976:opentrons/thermoscientificnunc_96_wellplate_1300ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"4","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"4","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["B8"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"50","blowout_location":"destination","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":false,"dispense_airGap_volume":"","dispense_delay_checkbox":true,"dispense_delay_seconds":"1","dispense_flowRate":"50","dispense_labware":"b59a0fb8-cb94-4941-886e-d7c089b0db89:opentrons/nest_96_wellplate_2ml_deep/3","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"4","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"4","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["B8"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"b01e5418-14ca-4846-b141-e33813d60829:wasteChute","liquidClassesSupported":true,"liquidClass":"glycerol50V1","nozzles":null,"path":"single","pipette":"61853486-6910-4d82-9193-0b99bc1ac2c3","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_50ul/1","volume":"22.1"},"f56f6b19-9501-4b42-824d-a11d18429b8f":{"id":"f56f6b19-9501-4b42-824d-a11d18429b8f","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"2","aspirate_flowRate":"38.5","aspirate_labware":"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"4","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"4","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["B9"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"50","blowout_location":"destination","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":false,"dispense_airGap_volume":"","dispense_delay_checkbox":true,"dispense_delay_seconds":"1","dispense_flowRate":"50","dispense_labware":"860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/2","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"4","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"4","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["B9"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"b01e5418-14ca-4846-b141-e33813d60829:wasteChute","liquidClassesSupported":true,"liquidClass":"glycerol50V1","nozzles":null,"path":"single","pipette":"61853486-6910-4d82-9193-0b99bc1ac2c3","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_50ul/1","volume":"48"},"a58c47c1-2fae-4d40-a551-e5004ada9b06":{"id":"a58c47c1-2fae-4d40-a551-e5004ada9b06","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"2","aspirate_flowRate":"8.3","aspirate_labware":"663098b8-8aff-44d9-814c-73efa91ee976:opentrons/thermoscientificnunc_96_wellplate_1300ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"4","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"4","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["B10"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"50","blowout_location":"destination","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":false,"dispense_airGap_volume":"","dispense_delay_checkbox":true,"dispense_delay_seconds":"1","dispense_flowRate":"50","dispense_labware":"b59a0fb8-cb94-4941-886e-d7c089b0db89:opentrons/nest_96_wellplate_2ml_deep/3","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"4","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"4","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["B10"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"b01e5418-14ca-4846-b141-e33813d60829:wasteChute","liquidClassesSupported":true,"liquidClass":"glycerol50V1","nozzles":null,"path":"single","pipette":"61853486-6910-4d82-9193-0b99bc1ac2c3","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"30","tipRack":"opentrons/opentrons_flex_96_filtertiprack_50ul/1","volume":"5"},"72e94984-b923-471f-8a27-18cb688cbaab":{"id":"72e94984-b923-471f-8a27-18cb688cbaab","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"2","aspirate_flowRate":"38.5","aspirate_labware":"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"4","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"4","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["B11"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"50","blowout_location":"destination","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":false,"dispense_airGap_volume":"","dispense_delay_checkbox":true,"dispense_delay_seconds":"1","dispense_flowRate":"50","dispense_labware":"860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/2","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"4","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"4","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["B11"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"b01e5418-14ca-4846-b141-e33813d60829:wasteChute","liquidClassesSupported":true,"liquidClass":"glycerol50V1","nozzles":null,"path":"single","pipette":"61853486-6910-4d82-9193-0b99bc1ac2c3","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_50ul/1","volume":"48"},"c4e1ea22-a0b2-4520-aa0f-a10907b08ea4":{"id":"c4e1ea22-a0b2-4520-aa0f-a10907b08ea4","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"2","aspirate_flowRate":"39.4","aspirate_labware":"663098b8-8aff-44d9-814c-73efa91ee976:opentrons/thermoscientificnunc_96_wellplate_1300ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"4","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"4","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["B12"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"50","blowout_location":"destination","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":false,"dispense_airGap_volume":"","dispense_delay_checkbox":true,"dispense_delay_seconds":"1","dispense_flowRate":"50","dispense_labware":"b59a0fb8-cb94-4941-886e-d7c089b0db89:opentrons/nest_96_wellplate_2ml_deep/3","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"4","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"4","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["B12"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"b01e5418-14ca-4846-b141-e33813d60829:wasteChute","liquidClassesSupported":true,"liquidClass":"glycerol50V1","nozzles":null,"path":"single","pipette":"61853486-6910-4d82-9193-0b99bc1ac2c3","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_50ul/1","volume":"197"},"23bbe351-b8d0-4e4e-b07f-c11f858287ee":{"id":"23bbe351-b8d0-4e4e-b07f-c11f858287ee","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"2","aspirate_flowRate":"11.5","aspirate_labware":"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"4","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"4","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["C1"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"50","blowout_location":"destination","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":false,"dispense_airGap_volume":"","dispense_delay_checkbox":true,"dispense_delay_seconds":"1","dispense_flowRate":"50","dispense_labware":"860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/2","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"4","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"4","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["C1"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"b01e5418-14ca-4846-b141-e33813d60829:wasteChute","liquidClassesSupported":true,"liquidClass":"glycerol50V1","nozzles":null,"path":"single","pipette":"61853486-6910-4d82-9193-0b99bc1ac2c3","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_50ul/1","volume":"12"},"88cf4b1e-f5a7-45ab-894b-75e05721a6dc":{"id":"88cf4b1e-f5a7-45ab-894b-75e05721a6dc","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"2","aspirate_flowRate":"30.2","aspirate_labware":"663098b8-8aff-44d9-814c-73efa91ee976:opentrons/thermoscientificnunc_96_wellplate_1300ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"4","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"4","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["C2"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"50","blowout_location":"destination","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":false,"dispense_airGap_volume":"","dispense_delay_checkbox":true,"dispense_delay_seconds":"1","dispense_flowRate":"50","dispense_labware":"b59a0fb8-cb94-4941-886e-d7c089b0db89:opentrons/nest_96_wellplate_2ml_deep/3","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"4","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"4","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["C2"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"b01e5418-14ca-4846-b141-e33813d60829:wasteChute","liquidClassesSupported":true,"liquidClass":"glycerol50V1","nozzles":null,"path":"single","pipette":"61853486-6910-4d82-9193-0b99bc1ac2c3","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_50ul/1","volume":"111"},"4415233b-d53e-417c-b14c-d47bc3bcc487":{"id":"4415233b-d53e-417c-b14c-d47bc3bcc487","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"2","aspirate_flowRate":"39.7","aspirate_labware":"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"4","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"4","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["C3"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"50","blowout_location":"destination","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":false,"dispense_airGap_volume":"","dispense_delay_checkbox":true,"dispense_delay_seconds":"1","dispense_flowRate":"50","dispense_labware":"860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/2","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"4","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"4","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["C3"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"b01e5418-14ca-4846-b141-e33813d60829:wasteChute","liquidClassesSupported":true,"liquidClass":"glycerol50V1","nozzles":null,"path":"single","pipette":"61853486-6910-4d82-9193-0b99bc1ac2c3","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_50ul/1","volume":"944"},"26c727c8-8dbf-4301-846e-0fcc7b191250":{"id":"26c727c8-8dbf-4301-846e-0fcc7b191250","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"5","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.2","aspirate_flowRate":"8.6","aspirate_labware":"663098b8-8aff-44d9-814c-73efa91ee976:opentrons/thermoscientificnunc_96_wellplate_1300ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0.5","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"100","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["C4"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"125","blowout_location":"destination","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"5","dispense_delay_checkbox":true,"dispense_delay_seconds":"2","dispense_flowRate":"40","dispense_labware":"b59a0fb8-cb94-4941-886e-d7c089b0db89:opentrons/nest_96_wellplate_2ml_deep/3","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0.5","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"100","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["C4"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"b01e5418-14ca-4846-b141-e33813d60829:wasteChute","liquidClassesSupported":true,"liquidClass":"ethanol80V1","nozzles":null,"path":"single","pipette":"61853486-6910-4d82-9193-0b99bc1ac2c3","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":"","tipRack":"opentrons/opentrons_flex_96_filtertiprack_50ul/1","volume":"6"},"57d156bc-7763-4f93-a44c-10f5e9603179":{"id":"57d156bc-7763-4f93-a44c-10f5e9603179","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"5","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.2","aspirate_flowRate":"16.0","aspirate_labware":"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0.5","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"100","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["C5"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"125","blowout_location":"destination","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"5","dispense_delay_checkbox":true,"dispense_delay_seconds":"2","dispense_flowRate":"40","dispense_labware":"860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/2","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0.5","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"100","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["C5"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"b01e5418-14ca-4846-b141-e33813d60829:wasteChute","liquidClassesSupported":true,"liquidClass":"ethanol80V1","nozzles":null,"path":"single","pipette":"61853486-6910-4d82-9193-0b99bc1ac2c3","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":"","tipRack":"opentrons/opentrons_flex_96_filtertiprack_50ul/1","volume":"22.1"},"2065e957-c34a-4082-9962-4000af44d731":{"id":"2065e957-c34a-4082-9962-4000af44d731","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"2","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.2","aspirate_flowRate":"29","aspirate_labware":"663098b8-8aff-44d9-814c-73efa91ee976:opentrons/thermoscientificnunc_96_wellplate_1300ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0.5","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"100","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["C6"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"125","blowout_location":"destination","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"5","dispense_delay_checkbox":true,"dispense_delay_seconds":"2","dispense_flowRate":"40","dispense_labware":"b59a0fb8-cb94-4941-886e-d7c089b0db89:opentrons/nest_96_wellplate_2ml_deep/3","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0.5","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"100","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["C6"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"b01e5418-14ca-4846-b141-e33813d60829:wasteChute","liquidClassesSupported":true,"liquidClass":"ethanol80V1","nozzles":null,"path":"single","pipette":"61853486-6910-4d82-9193-0b99bc1ac2c3","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":"","tipRack":"opentrons/opentrons_flex_96_filtertiprack_50ul/1","volume":"48"},"1c57e510-cc8b-4399-adb8-8c543b077054":{"id":"1c57e510-cc8b-4399-adb8-8c543b077054","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"5","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.2","aspirate_flowRate":"8.3","aspirate_labware":"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0.5","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"100","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["C7"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"125","blowout_location":"destination","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"5","dispense_delay_checkbox":true,"dispense_delay_seconds":"2","dispense_flowRate":"40","dispense_labware":"860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/2","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0.5","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"100","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["C7"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"b01e5418-14ca-4846-b141-e33813d60829:wasteChute","liquidClassesSupported":true,"liquidClass":"ethanol80V1","nozzles":null,"path":"single","pipette":"61853486-6910-4d82-9193-0b99bc1ac2c3","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":"","tipRack":"opentrons/opentrons_flex_96_filtertiprack_50ul/1","volume":"5"},"b3f7103d-f2b7-4700-a415-19c44afeff94":{"id":"b3f7103d-f2b7-4700-a415-19c44afeff94","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"2","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.2","aspirate_flowRate":"29","aspirate_labware":"663098b8-8aff-44d9-814c-73efa91ee976:opentrons/thermoscientificnunc_96_wellplate_1300ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0.5","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"100","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["C8"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"125","blowout_location":"destination","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"5","dispense_delay_checkbox":true,"dispense_delay_seconds":"2","dispense_flowRate":"40","dispense_labware":"b59a0fb8-cb94-4941-886e-d7c089b0db89:opentrons/nest_96_wellplate_2ml_deep/3","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0.5","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"100","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["C8"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"b01e5418-14ca-4846-b141-e33813d60829:wasteChute","liquidClassesSupported":true,"liquidClass":"ethanol80V1","nozzles":null,"path":"single","pipette":"61853486-6910-4d82-9193-0b99bc1ac2c3","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":"","tipRack":"opentrons/opentrons_flex_96_filtertiprack_50ul/1","volume":"48"},"885c1729-1bdf-4db2-8e8d-ce10ab592140":{"id":"885c1729-1bdf-4db2-8e8d-ce10ab592140","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"0.7","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.2","aspirate_flowRate":"29.6","aspirate_labware":"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0.5","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"100","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["C9"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"125","blowout_location":"destination","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"5","dispense_delay_checkbox":true,"dispense_delay_seconds":"2","dispense_flowRate":"40","dispense_labware":"860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/2","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0.5","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"100","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["C9"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"b01e5418-14ca-4846-b141-e33813d60829:wasteChute","liquidClassesSupported":true,"liquidClass":"ethanol80V1","nozzles":null,"path":"single","pipette":"61853486-6910-4d82-9193-0b99bc1ac2c3","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":"","tipRack":"opentrons/opentrons_flex_96_filtertiprack_50ul/1","volume":"197"},"e50a6bbd-7bd2-44ac-9718-d2ca5e59ee73":{"id":"e50a6bbd-7bd2-44ac-9718-d2ca5e59ee73","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"5","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.2","aspirate_flowRate":"11","aspirate_labware":"663098b8-8aff-44d9-814c-73efa91ee976:opentrons/thermoscientificnunc_96_wellplate_1300ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0.5","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"100","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["C10"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"125","blowout_location":"destination","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"5","dispense_delay_checkbox":true,"dispense_delay_seconds":"2","dispense_flowRate":"40","dispense_labware":"b59a0fb8-cb94-4941-886e-d7c089b0db89:opentrons/nest_96_wellplate_2ml_deep/3","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0.5","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"100","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["C10"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"b01e5418-14ca-4846-b141-e33813d60829:wasteChute","liquidClassesSupported":true,"liquidClass":"ethanol80V1","nozzles":null,"path":"single","pipette":"61853486-6910-4d82-9193-0b99bc1ac2c3","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":"","tipRack":"opentrons/opentrons_flex_96_filtertiprack_50ul/1","volume":"12"},"65e23df2-a2bb-4bc0-81d9-a0706db33cfd":{"id":"65e23df2-a2bb-4bc0-81d9-a0706db33cfd","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"5","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.2","aspirate_flowRate":"23.5","aspirate_labware":"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0.5","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"100","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["C11"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"125","blowout_location":"destination","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"5","dispense_delay_checkbox":true,"dispense_delay_seconds":"2","dispense_flowRate":"40","dispense_labware":"860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/2","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0.5","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"100","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["C11"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"b01e5418-14ca-4846-b141-e33813d60829:wasteChute","liquidClassesSupported":true,"liquidClass":"ethanol80V1","nozzles":null,"path":"single","pipette":"61853486-6910-4d82-9193-0b99bc1ac2c3","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":"","tipRack":"opentrons/opentrons_flex_96_filtertiprack_50ul/1","volume":"111"},"17973916-d2a7-4cbd-bfbd-6b6256a66892":{"id":"17973916-d2a7-4cbd-bfbd-6b6256a66892","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"0.3","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.2","aspirate_flowRate":"29.8","aspirate_labware":"663098b8-8aff-44d9-814c-73efa91ee976:opentrons/thermoscientificnunc_96_wellplate_1300ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0.5","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"100","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["C12"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"125","blowout_location":"destination","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"5","dispense_delay_checkbox":true,"dispense_delay_seconds":"2","dispense_flowRate":"40","dispense_labware":"b59a0fb8-cb94-4941-886e-d7c089b0db89:opentrons/nest_96_wellplate_2ml_deep/3","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0.5","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"100","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["C12"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"b01e5418-14ca-4846-b141-e33813d60829:wasteChute","liquidClassesSupported":true,"liquidClass":"ethanol80V1","nozzles":null,"path":"single","pipette":"61853486-6910-4d82-9193-0b99bc1ac2c3","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":"","tipRack":"opentrons/opentrons_flex_96_filtertiprack_50ul/1","volume":"944"}},"orderedStepIds":["9d1c1133-e824-432d-bfbd-f37602c84d18","f2cc1d7d-3f9a-4af6-9ebd-8f35a7b68800","2c2278cb-8d67-4a24-9735-92ad3dc7ce51","75a036b6-889e-401d-95dd-62b1a9155d4d","b523a509-3036-47e6-a6e6-667d9886bad6","e23044ee-0bf3-4fe4-951a-1ae516ae2d08","b32820ab-e2f8-4949-911e-06379636b9b3","015df2d5-fd13-4510-b311-9cd7541d1168","9d8e8348-f9f3-4e7c-b6d5-c19e8bbd9951","1efe9ed2-082a-4b96-b1ab-5efb28448191","5eaeb79c-d3c2-4181-86b0-45efd2934c0d","e4c63179-afeb-4a4a-a2d5-cfa9ec59be02","83c1ef81-09eb-4761-a1f9-01017bbec17b","892f57ac-d455-4e25-8dcf-f6416855d578","aa96d316-918e-4a4a-8a9c-aee730b1b585","f8ec709d-11b6-4a6e-bc85-9c10bc2fb16f","a03ab18a-7dc0-44a3-90a4-e9f604e7c4cd","a2201ebb-865d-498e-b6b6-e7b4c17ad871","a6126fd9-cebb-443e-a79d-ae1745ec33a2","e51d631e-26e1-469b-8162-188578026141","f56f6b19-9501-4b42-824d-a11d18429b8f","a58c47c1-2fae-4d40-a551-e5004ada9b06","72e94984-b923-471f-8a27-18cb688cbaab","c4e1ea22-a0b2-4520-aa0f-a10907b08ea4","23bbe351-b8d0-4e4e-b07f-c11f858287ee","88cf4b1e-f5a7-45ab-894b-75e05721a6dc","4415233b-d53e-417c-b14c-d47bc3bcc487","26c727c8-8dbf-4301-846e-0fcc7b191250","57d156bc-7763-4f93-a44c-10f5e9603179","2065e957-c34a-4082-9962-4000af44d731","1c57e510-cc8b-4399-adb8-8c543b077054","b3f7103d-f2b7-4700-a415-19c44afeff94","885c1729-1bdf-4db2-8e8d-ce10ab592140","e50a6bbd-7bd2-44ac-9718-d2ca5e59ee73","65e23df2-a2bb-4bc0-81d9-a0706db33cfd","17973916-d2a7-4cbd-bfbd-6b6256a66892"],"pipettes":{"61853486-6910-4d82-9193-0b99bc1ac2c3":{"pipetteName":"p1000_single_flex"}},"modules":{},"labware":{"7a21d246-17da-4616-ae98-f94dff1d2132:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 1000 µL","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1"},"780d7327-daa0-483a-9a58-49d1f1599430:opentrons/opentrons_flex_96_filtertiprack_200ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 200 µL","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_200ul/1"},"7b798f9b-c3ff-45d1-a811-be2933d93a90:opentrons/opentrons_flex_96_filtertiprack_50ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 50 µL","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_50ul/1"},"663098b8-8aff-44d9-814c-73efa91ee976:opentrons/thermoscientificnunc_96_wellplate_1300ul/2":{"displayName":"Thermo Scientific Nunc 96 Well Plate 1300 µL","labwareDefURI":"opentrons/thermoscientificnunc_96_wellplate_1300ul/2"},"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/2":{"displayName":"Thermo Scientific Nunc 96 Well Plate 2000 µL","labwareDefURI":"opentrons/thermoscientificnunc_96_wellplate_2000ul/2"},"860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/2":{"displayName":"USA Scientific 96 Deep Well Plate 2.4 mL","labwareDefURI":"opentrons/usascientific_96_wellplate_2.4ml_deep/2"},"b59a0fb8-cb94-4941-886e-d7c089b0db89:opentrons/nest_96_wellplate_2ml_deep/3":{"displayName":"NEST 96 Deep Well Plate 2mL","labwareDefURI":"opentrons/nest_96_wellplate_2ml_deep/3"},"a3ec9992-9b00-4451-a077-578ef21b975c:opentrons/opentrons_flex_96_filtertiprack_50ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 50 µL (1)","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_50ul/1"},"45987d82-d88e-425e-befd-8114611744f6:opentrons/opentrons_flex_96_filtertiprack_200ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 200 µL (1)","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_200ul/1"},"58cf7241-6587-4c42-9df4-e9f3cb5a6c89:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 1000 µL (1)","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1"},"2b51e1b5-af62-4d51-96f6-e53f5ac55c20:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 1000 µL (2)","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1"},"3da54e81-41a7-40bb-ae7a-21c46b932b73:opentrons/opentrons_flex_96_filtertiprack_200ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 200 µL (2)","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_200ul/1"},"d6d34253-6094-432e-bb99-7279bc1b67a7:opentrons/opentrons_flex_96_filtertiprack_50ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 50 µL (2)","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_50ul/1"}}}},"metadata":{"protocolName":"P1000STransferSingle","author":"QA","description":"","created":1748467626797,"lastModified":1750864470360,"source":"Protocol Designer","category":null,"subcategory":null,"tags":[]}}"""
