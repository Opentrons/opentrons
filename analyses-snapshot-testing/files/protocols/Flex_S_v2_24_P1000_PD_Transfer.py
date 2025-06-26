import json
from opentrons import protocol_api, types

metadata = {
    "protocolName": "P1000MTransferMulti",
    "created": "2025-05-28T21:27:06.797Z",
    "lastModified": "2025-06-24T21:04:16.756Z",
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
        label="Opentrons Flex 96 Filter Tip Rack 1000 µL (3)",
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
    tip_rack_10 = protocol.load_labware(
        "opentrons_flex_96_filtertiprack_1000ul",
        location="A1",
        label="Opentrons Flex 96 Filter Tip Rack 1000 µL (4)",
        namespace="opentrons",
    )

    # Load Pipettes:
    pipette_left = protocol.load_instrument("flex_8channel_1000", "left", tip_racks=[tip_rack_1, tip_rack_6, tip_rack_7, tip_rack_10, tip_rack_2, tip_rack_5, tip_rack_8, tip_rack_3, tip_rack_4, tip_rack_9])

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
    pipette_left.configure_nozzle_layout(
        protocol_api.ALL,
        tip_racks=[tip_rack_1],
    )
    pipette_left.transfer_with_liquid_class(
        volume=7,
        source=[well_plate_2["A1"]],
        dest=[well_plate_3["A1"]],
        new_tip="always",
        trash_location=waste_chute,
        group_wells=False,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_1",
            properties={"flex_8channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
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
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "push_out_by_volume": [(0, 20)],
                    "flow_rate_by_volume": [(0, 716)],
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
        volume=14,
        source=[well_plate_2["A2"]],
        dest=[well_plate_3["A2"]],
        new_tip="always",
        trash_location=waste_chute,
        group_wells=False,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_2",
            properties={"flex_8channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
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
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "push_out_by_volume": [(0, 20)],
                    "flow_rate_by_volume": [(0, 716)],
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
        group_wells=False,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_3",
            properties={"flex_8channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
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
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "push_out_by_volume": [(0, 20)],
                    "flow_rate_by_volume": [(0, 716)],
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
        volume=8,
        source=[well_plate_2["A4"]],
        dest=[well_plate_3["A4"]],
        new_tip="always",
        trash_location=waste_chute,
        group_wells=False,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_4",
            properties={"flex_8channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
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
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "push_out_by_volume": [(0, 20)],
                    "flow_rate_by_volume": [(0, 716)],
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
        volume=44,
        source=[well_plate_2["A5"]],
        dest=[well_plate_3["A5"]],
        new_tip="always",
        trash_location=waste_chute,
        group_wells=False,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_5",
            properties={"flex_8channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
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
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "push_out_by_volume": [(0, 20)],
                    "flow_rate_by_volume": [(0, 716)],
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
        volume=199,
        source=[well_plate_2["A6"]],
        dest=[well_plate_3["A6"]],
        new_tip="always",
        trash_location=waste_chute,
        group_wells=False,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_6",
            properties={"flex_8channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
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
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "push_out_by_volume": [(0, 20)],
                    "flow_rate_by_volume": [(0, 716)],
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
        volume=11,
        source=[well_plate_2["A7"]],
        dest=[well_plate_3["A7"]],
        new_tip="always",
        trash_location=waste_chute,
        group_wells=False,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_7",
            properties={"flex_8channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
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
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "push_out_by_volume": [(0, 20)],
                    "flow_rate_by_volume": [(0, 716)],
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
        volume=101,
        source=[well_plate_2["A8"]],
        dest=[well_plate_3["A8"]],
        new_tip="always",
        trash_location=waste_chute,
        group_wells=False,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_8",
            properties={"flex_8channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
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
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "push_out_by_volume": [(0, 20)],
                    "flow_rate_by_volume": [(0, 716)],
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
        volume=999,
        source=[well_plate_2["A9"]],
        dest=[well_plate_3["A9"]],
        new_tip="always",
        trash_location=waste_chute,
        group_wells=False,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_9",
            properties={"flex_8channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
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
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "push_out_by_volume": [(0, 20)],
                    "flow_rate_by_volume": [(0, 716)],
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
        volume=7,
        source=[well_plate_2["A10"]],
        dest=[well_plate_3["A10"]],
        new_tip="always",
        trash_location=waste_chute,
        group_wells=False,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_10",
            base_liquid_class=water_v1,
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
                    "push_out_by_volume": [(0, 20)],
                    "flow_rate_by_volume": [(0, 716)],
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
                },
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 11:
    pipette_left.transfer_with_liquid_class(
        volume=14,
        source=[well_plate_2["A11"]],
        dest=[well_plate_3["A11"]],
        new_tip="always",
        trash_location=waste_chute,
        group_wells=False,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_11",
            base_liquid_class=water_v1,
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
                    "push_out_by_volume": [(0, 20)],
                    "flow_rate_by_volume": [(0, 716)],
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
                },
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 12:
    pipette_left.transfer_with_liquid_class(
        volume=48,
        source=[well_plate_2["A12"]],
        dest=[well_plate_3["A12"]],
        new_tip="always",
        trash_location=waste_chute,
        group_wells=False,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_12",
            base_liquid_class=water_v1,
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
                    "push_out_by_volume": [(0, 20)],
                    "flow_rate_by_volume": [(0, 716)],
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
                },
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 13:
    pipette_left.transfer_with_liquid_class(
        volume=8,
        source=[well_plate_1["A1"]],
        dest=[well_plate_4["A1"]],
        new_tip="always",
        trash_location=waste_chute,
        group_wells=False,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_13",
            base_liquid_class=water_v1,
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
                    "push_out_by_volume": [(0, 20)],
                    "flow_rate_by_volume": [(0, 716)],
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
                },
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 14:
    pipette_left.transfer_with_liquid_class(
        volume=44,
        source=[well_plate_1["A2"]],
        dest=[well_plate_4["A2"]],
        new_tip="always",
        trash_location=waste_chute,
        group_wells=False,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_14",
            base_liquid_class=water_v1,
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
                    "push_out_by_volume": [(0, 20)],
                    "flow_rate_by_volume": [(0, 716)],
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
                },
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 15:
    pipette_left.transfer_with_liquid_class(
        volume=199,
        source=[well_plate_1["A3"]],
        dest=[well_plate_4["A3"]],
        new_tip="always",
        trash_location=waste_chute,
        group_wells=False,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_15",
            base_liquid_class=water_v1,
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
                    "push_out_by_volume": [(0, 20)],
                    "flow_rate_by_volume": [(0, 716)],
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
                },
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 16:
    pipette_left.transfer_with_liquid_class(
        volume=11,
        source=[well_plate_1["A4"]],
        dest=[well_plate_4["A4"]],
        new_tip="always",
        trash_location=waste_chute,
        group_wells=False,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_16",
            base_liquid_class=water_v1,
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
                    "push_out_by_volume": [(0, 20)],
                    "flow_rate_by_volume": [(0, 716)],
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
                },
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 17:
    pipette_left.transfer_with_liquid_class(
        volume=101,
        source=[well_plate_1["A5"]],
        dest=[well_plate_4["A5"]],
        new_tip="always",
        trash_location=waste_chute,
        group_wells=False,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_17",
            base_liquid_class=water_v1,
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
                    "push_out_by_volume": [(0, 20)],
                    "flow_rate_by_volume": [(0, 716)],
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
                },
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 18:
    pipette_left.transfer_with_liquid_class(
        volume=999,
        source=[well_plate_1["A6"]],
        dest=[well_plate_4["A6"]],
        new_tip="always",
        trash_location=waste_chute,
        group_wells=False,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_18",
            base_liquid_class=water_v1,
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
                    "push_out_by_volume": [(0, 20)],
                    "flow_rate_by_volume": [(0, 716)],
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
                },
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 19:
    pipette_left.transfer_with_liquid_class(
        volume=7,
        source=[well_plate_1["A7"]],
        dest=[well_plate_4["A7"]],
        new_tip="always",
        trash_location=waste_chute,
        group_wells=False,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_19",
            base_liquid_class=glycerol_50_v1,
            properties={"flex_8channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 10)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, -0.14)],
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
                    "push_out_by_volume": [(0, 35)],
                    "flow_rate_by_volume": [(0, 250)],
                    "correction_by_volume": [(0, -0.14)],
                    "delay": {"enabled": True, "duration": 0.5},
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
        volume=14,
        source=[well_plate_1["A8"]],
        dest=[well_plate_4["A8"]],
        new_tip="always",
        trash_location=waste_chute,
        group_wells=False,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_20",
            base_liquid_class=glycerol_50_v1,
            properties={"flex_8channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 14)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, -0.19555555555555557)],
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
                    "push_out_by_volume": [(0, 35)],
                    "flow_rate_by_volume": [(0, 250)],
                    "correction_by_volume": [(0, -0.19555555555555557)],
                    "delay": {"enabled": True, "duration": 0.5},
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
        source=[well_plate_1["A9"]],
        dest=[well_plate_4["A9"]],
        new_tip="always",
        trash_location=waste_chute,
        group_wells=False,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_21",
            base_liquid_class=glycerol_50_v1,
            properties={"flex_8channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 48)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, -0.1577777777777778)],
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
                    "push_out_by_volume": [(0, 35)],
                    "flow_rate_by_volume": [(0, 250)],
                    "correction_by_volume": [(0, -0.1577777777777778)],
                    "delay": {"enabled": True, "duration": 0.5},
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
        volume=8,
        source=[well_plate_1["A10"]],
        dest=[well_plate_4["A10"]],
        new_tip="always",
        trash_location=waste_chute,
        group_wells=False,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_22",
            base_liquid_class=glycerol_50_v1,
            properties={"flex_8channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 10)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, -0.16)],
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
                    "push_out_by_volume": [(0, 35)],
                    "flow_rate_by_volume": [(0, 250)],
                    "correction_by_volume": [(0, -0.16)],
                    "delay": {"enabled": True, "duration": 0.5},
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
        volume=44,
        source=[well_plate_1["A11"]],
        dest=[well_plate_4["A11"]],
        new_tip="always",
        trash_location=waste_chute,
        group_wells=False,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_23",
            base_liquid_class=glycerol_50_v1,
            properties={"flex_8channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 44)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, -0.1622222222222222)],
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
                    "push_out_by_volume": [(0, 35)],
                    "flow_rate_by_volume": [(0, 250)],
                    "correction_by_volume": [(0, -0.1622222222222222)],
                    "delay": {"enabled": True, "duration": 0.5},
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
        volume=199,
        source=[well_plate_1["A12"]],
        dest=[well_plate_4["A12"]],
        new_tip="always",
        trash_location=waste_chute,
        group_wells=False,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_24",
            base_liquid_class=glycerol_50_v1,
            properties={"flex_8channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 177)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 1.2309999999999999)],
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
                    "push_out_by_volume": [(0, 35)],
                    "flow_rate_by_volume": [(0, 250)],
                    "correction_by_volume": [(0, 1.2309999999999999)],
                    "delay": {"enabled": True, "duration": 0.5},
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
        volume=11,
        source=[well_plate_2["A1"]],
        dest=[well_plate_3["A1"]],
        new_tip="always",
        trash_location=waste_chute,
        group_wells=False,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_25",
            base_liquid_class=glycerol_50_v1,
            properties={"flex_8channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 11)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, -0.1988888888888889)],
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
                    "push_out_by_volume": [(0, 35)],
                    "flow_rate_by_volume": [(0, 250)],
                    "correction_by_volume": [(0, -0.1988888888888889)],
                    "delay": {"enabled": True, "duration": 0.5},
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
        volume=101,
        source=[well_plate_2["A2"]],
        dest=[well_plate_3["A2"]],
        new_tip="always",
        trash_location=waste_chute,
        group_wells=False,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_26",
            base_liquid_class=glycerol_50_v1,
            properties={"flex_8channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 100.7)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, -0.08655555555555572)],
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
                    "push_out_by_volume": [(0, 35)],
                    "flow_rate_by_volume": [(0, 250)],
                    "correction_by_volume": [(0, -0.08655555555555572)],
                    "delay": {"enabled": True, "duration": 0.5},
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
        volume=999,
        source=[well_plate_2["A3"]],
        dest=[well_plate_3["A3"]],
        new_tip="always",
        trash_location=waste_chute,
        group_wells=False,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_27",
            base_liquid_class=glycerol_50_v1,
            properties={"flex_8channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 799.2)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 11.986555555555556)],
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
                    "push_out_by_volume": [(0, 35)],
                    "flow_rate_by_volume": [(0, 250)],
                    "correction_by_volume": [(0, 11.986555555555556)],
                    "delay": {"enabled": True, "duration": 0.5},
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
        volume=7,
        source=[well_plate_2["A4"]],
        dest=[well_plate_3["A4"]],
        new_tip="always",
        trash_location=waste_chute,
        group_wells=False,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_28",
            base_liquid_class=ethanol_80_v1,
            properties={"flex_8channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 10)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, -0.63)],
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
                    "push_out_by_volume": [(0, 0)],
                    "flow_rate_by_volume": [(0, 40)],
                    "correction_by_volume": [(0, -0.63)],
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
                },
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 29:
    pipette_left.transfer_with_liquid_class(
        volume=14,
        source=[well_plate_2["A5"]],
        dest=[well_plate_3["A5"]],
        new_tip="always",
        trash_location=waste_chute,
        group_wells=False,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_29",
            base_liquid_class=ethanol_80_v1,
            properties={"flex_8channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 14)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, -0.9755555555555555)],
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
                    "push_out_by_volume": [(0, 0)],
                    "flow_rate_by_volume": [(0, 40)],
                    "correction_by_volume": [(0, -0.9755555555555555)],
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
                },
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 30:
    pipette_left.transfer_with_liquid_class(
        volume=48,
        source=[well_plate_2["A6"]],
        dest=[well_plate_3["A6"]],
        new_tip="always",
        trash_location=waste_chute,
        group_wells=False,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_30",
            base_liquid_class=ethanol_80_v1,
            properties={"flex_8channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 48)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, -1.617777777777778)],
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
                    "push_out_by_volume": [(0, 0)],
                    "flow_rate_by_volume": [(0, 40)],
                    "correction_by_volume": [(0, -1.617777777777778)],
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
                },
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 31:
    pipette_left.transfer_with_liquid_class(
        volume=8,
        source=[well_plate_2["A7"]],
        dest=[well_plate_3["A7"]],
        new_tip="always",
        trash_location=waste_chute,
        group_wells=False,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_31",
            base_liquid_class=ethanol_80_v1,
            properties={"flex_8channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 10)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, -0.72)],
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
                    "push_out_by_volume": [(0, 0)],
                    "flow_rate_by_volume": [(0, 40)],
                    "correction_by_volume": [(0, -0.72)],
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
                },
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 32:
    pipette_left.transfer_with_liquid_class(
        volume=44,
        source=[well_plate_2["A8"]],
        dest=[well_plate_3["A8"]],
        new_tip="always",
        trash_location=waste_chute,
        group_wells=False,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_32",
            base_liquid_class=ethanol_80_v1,
            properties={"flex_8channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 44)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, -1.5422222222222222)],
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
                    "push_out_by_volume": [(0, 0)],
                    "flow_rate_by_volume": [(0, 40)],
                    "correction_by_volume": [(0, -1.5422222222222222)],
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
                },
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 33:
    pipette_left.transfer_with_liquid_class(
        volume=199,
        source=[well_plate_2["A9"]],
        dest=[well_plate_3["A9"]],
        new_tip="always",
        trash_location=waste_chute,
        group_wells=False,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_33",
            base_liquid_class=ethanol_80_v1,
            properties={"flex_8channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 199)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, -5.856)],
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
                    "push_out_by_volume": [(0, 0)],
                    "flow_rate_by_volume": [(0, 40)],
                    "correction_by_volume": [(0, -5.856)],
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
                },
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 34:
    pipette_left.transfer_with_liquid_class(
        volume=11,
        source=[well_plate_2["A10"]],
        dest=[well_plate_3["A10"]],
        new_tip="always",
        trash_location=waste_chute,
        group_wells=False,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_34",
            base_liquid_class=ethanol_80_v1,
            properties={"flex_8channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 11)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, -0.9188888888888889)],
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
                    "push_out_by_volume": [(0, 0)],
                    "flow_rate_by_volume": [(0, 40)],
                    "correction_by_volume": [(0, -0.9188888888888889)],
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
                },
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 35:
    pipette_left.transfer_with_liquid_class(
        volume=101,
        source=[well_plate_2["A11"]],
        dest=[well_plate_3["A11"]],
        new_tip="always",
        trash_location=waste_chute,
        group_wells=False,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_35",
            base_liquid_class=ethanol_80_v1,
            properties={"flex_8channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 101)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, -2.632888888888889)],
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
                    "push_out_by_volume": [(0, 0)],
                    "flow_rate_by_volume": [(0, 40)],
                    "correction_by_volume": [(0, -2.632888888888889)],
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
                },
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 36:
    pipette_left.transfer_with_liquid_class(
        volume=999,
        source=[well_plate_2["A12"]],
        dest=[well_plate_3["A12"]],
        new_tip="always",
        trash_location=waste_chute,
        group_wells=False,
        keep_last_tip=True,
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_36",
            base_liquid_class=ethanol_80_v1,
            properties={"flex_8channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 200)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, -32.16711111111111)],
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
                    "push_out_by_volume": [(0, 0)],
                    "flow_rate_by_volume": [(0, 40)],
                    "correction_by_volume": [(0, -32.16711111111111)],
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
                },
            }}},
        ),
    )
    pipette_left.drop_tip(waste_chute)

DESIGNER_APPLICATION = """{"robot":{"model":"OT-3 Standard"},"designerApplication":{"name":"opentrons/protocol-designer","version":"8.5.0","data":{"pipetteTiprackAssignments":{"88360a6e-7a23-4d95-ad2d-14418627f746":["opentrons/opentrons_flex_96_filtertiprack_1000ul/1","opentrons/opentrons_flex_96_filtertiprack_200ul/1","opentrons/opentrons_flex_96_filtertiprack_50ul/1"]},"dismissedWarnings":{"form":[],"timeline":[]},"ingredients":{"0":{"displayName":"Source_1","description":null,"displayColor":"#b925ff","liquidGroupId":"0","liquidClass":null},"1":{"displayName":"Source_2","description":null,"displayColor":"#ffd600","liquidGroupId":"1","liquidClass":null}},"ingredLocations":{"663098b8-8aff-44d9-814c-73efa91ee976:opentrons/thermoscientificnunc_96_wellplate_1300ul/2":{"A1":{"0":{"volume":1200}},"B1":{"0":{"volume":1200}},"C1":{"0":{"volume":1200}},"D1":{"0":{"volume":1200}},"E1":{"0":{"volume":1200}},"F1":{"0":{"volume":1200}},"G1":{"0":{"volume":1200}},"H1":{"0":{"volume":1200}},"A2":{"0":{"volume":1200}},"B2":{"0":{"volume":1200}},"C2":{"0":{"volume":1200}},"D2":{"0":{"volume":1200}},"E2":{"0":{"volume":1200}},"F2":{"0":{"volume":1200}},"G2":{"0":{"volume":1200}},"H2":{"0":{"volume":1200}},"A3":{"0":{"volume":1200}},"B3":{"0":{"volume":1200}},"C3":{"0":{"volume":1200}},"D3":{"0":{"volume":1200}},"E3":{"0":{"volume":1200}},"F3":{"0":{"volume":1200}},"G3":{"0":{"volume":1200}},"H3":{"0":{"volume":1200}},"A4":{"0":{"volume":1200}},"B4":{"0":{"volume":1200}},"C4":{"0":{"volume":1200}},"D4":{"0":{"volume":1200}},"E4":{"0":{"volume":1200}},"F4":{"0":{"volume":1200}},"G4":{"0":{"volume":1200}},"H4":{"0":{"volume":1200}},"A5":{"0":{"volume":1200}},"B5":{"0":{"volume":1200}},"C5":{"0":{"volume":1200}},"D5":{"0":{"volume":1200}},"E5":{"0":{"volume":1200}},"F5":{"0":{"volume":1200}},"G5":{"0":{"volume":1200}},"H5":{"0":{"volume":1200}},"A6":{"0":{"volume":1200}},"B6":{"0":{"volume":1200}},"C6":{"0":{"volume":1200}},"D6":{"0":{"volume":1200}},"E6":{"0":{"volume":1200}},"F6":{"0":{"volume":1200}},"G6":{"0":{"volume":1200}},"H6":{"0":{"volume":1200}},"A7":{"0":{"volume":1200}},"B7":{"0":{"volume":1200}},"C7":{"0":{"volume":1200}},"D7":{"0":{"volume":1200}},"E7":{"0":{"volume":1200}},"F7":{"0":{"volume":1200}},"G7":{"0":{"volume":1200}},"H7":{"0":{"volume":1200}},"A8":{"0":{"volume":1200}},"B8":{"0":{"volume":1200}},"C8":{"0":{"volume":1200}},"D8":{"0":{"volume":1200}},"E8":{"0":{"volume":1200}},"F8":{"0":{"volume":1200}},"G8":{"0":{"volume":1200}},"H8":{"0":{"volume":1200}},"A9":{"0":{"volume":1200}},"B9":{"0":{"volume":1200}},"C9":{"0":{"volume":1200}},"D9":{"0":{"volume":1200}},"E9":{"0":{"volume":1200}},"F9":{"0":{"volume":1200}},"G9":{"0":{"volume":1200}},"H9":{"0":{"volume":1200}},"A10":{"0":{"volume":1200}},"B10":{"0":{"volume":1200}},"C10":{"0":{"volume":1200}},"D10":{"0":{"volume":1200}},"E10":{"0":{"volume":1200}},"F10":{"0":{"volume":1200}},"G10":{"0":{"volume":1200}},"H10":{"0":{"volume":1200}},"A11":{"0":{"volume":1200}},"B11":{"0":{"volume":1200}},"C11":{"0":{"volume":1200}},"D11":{"0":{"volume":1200}},"E11":{"0":{"volume":1200}},"F11":{"0":{"volume":1200}},"G11":{"0":{"volume":1200}},"H11":{"0":{"volume":1200}},"A12":{"0":{"volume":1200}},"B12":{"0":{"volume":1200}},"C12":{"0":{"volume":1200}},"D12":{"0":{"volume":1200}},"E12":{"0":{"volume":1200}},"F12":{"0":{"volume":1200}},"G12":{"0":{"volume":1200}},"H12":{"0":{"volume":1200}}},"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/2":{"A1":{"1":{"volume":1900}},"B1":{"1":{"volume":1900}},"C1":{"1":{"volume":1900}},"D1":{"1":{"volume":1900}},"E1":{"1":{"volume":1900}},"F1":{"1":{"volume":1900}},"G1":{"1":{"volume":1900}},"H1":{"1":{"volume":1900}},"A2":{"1":{"volume":1900}},"B2":{"1":{"volume":1900}},"C2":{"1":{"volume":1900}},"D2":{"1":{"volume":1900}},"E2":{"1":{"volume":1900}},"F2":{"1":{"volume":1900}},"G2":{"1":{"volume":1900}},"H2":{"1":{"volume":1900}},"A3":{"1":{"volume":1900}},"B3":{"1":{"volume":1900}},"C3":{"1":{"volume":1900}},"D3":{"1":{"volume":1900}},"E3":{"1":{"volume":1900}},"F3":{"1":{"volume":1900}},"G3":{"1":{"volume":1900}},"H3":{"1":{"volume":1900}},"A4":{"1":{"volume":1900}},"B4":{"1":{"volume":1900}},"C4":{"1":{"volume":1900}},"D4":{"1":{"volume":1900}},"E4":{"1":{"volume":1900}},"F4":{"1":{"volume":1900}},"G4":{"1":{"volume":1900}},"H4":{"1":{"volume":1900}},"A5":{"1":{"volume":1900}},"B5":{"1":{"volume":1900}},"C5":{"1":{"volume":1900}},"D5":{"1":{"volume":1900}},"E5":{"1":{"volume":1900}},"F5":{"1":{"volume":1900}},"G5":{"1":{"volume":1900}},"H5":{"1":{"volume":1900}},"A6":{"1":{"volume":1900}},"B6":{"1":{"volume":1900}},"C6":{"1":{"volume":1900}},"D6":{"1":{"volume":1900}},"E6":{"1":{"volume":1900}},"F6":{"1":{"volume":1900}},"G6":{"1":{"volume":1900}},"H6":{"1":{"volume":1900}},"A7":{"1":{"volume":1900}},"B7":{"1":{"volume":1900}},"C7":{"1":{"volume":1900}},"D7":{"1":{"volume":1900}},"E7":{"1":{"volume":1900}},"F7":{"1":{"volume":1900}},"G7":{"1":{"volume":1900}},"H7":{"1":{"volume":1900}},"A8":{"1":{"volume":1900}},"B8":{"1":{"volume":1900}},"C8":{"1":{"volume":1900}},"D8":{"1":{"volume":1900}},"E8":{"1":{"volume":1900}},"F8":{"1":{"volume":1900}},"G8":{"1":{"volume":1900}},"H8":{"1":{"volume":1900}},"A9":{"1":{"volume":1900}},"B9":{"1":{"volume":1900}},"C9":{"1":{"volume":1900}},"D9":{"1":{"volume":1900}},"E9":{"1":{"volume":1900}},"F9":{"1":{"volume":1900}},"G9":{"1":{"volume":1900}},"H9":{"1":{"volume":1900}},"A10":{"1":{"volume":1900}},"B10":{"1":{"volume":1900}},"C10":{"1":{"volume":1900}},"D10":{"1":{"volume":1900}},"E10":{"1":{"volume":1900}},"F10":{"1":{"volume":1900}},"G10":{"1":{"volume":1900}},"H10":{"1":{"volume":1900}},"A11":{"1":{"volume":1900}},"B11":{"1":{"volume":1900}},"C11":{"1":{"volume":1900}},"D11":{"1":{"volume":1900}},"E11":{"1":{"volume":1900}},"F11":{"1":{"volume":1900}},"G11":{"1":{"volume":1900}},"H11":{"1":{"volume":1900}},"A12":{"1":{"volume":1900}},"B12":{"1":{"volume":1900}},"C12":{"1":{"volume":1900}},"D12":{"1":{"volume":1900}},"E12":{"1":{"volume":1900}},"F12":{"1":{"volume":1900}},"G12":{"1":{"volume":1900}},"H12":{"1":{"volume":1900}}},"2f64824e-060d-4e3b-a41d-e5539e27a92b:opentrons/opentrons_flex_96_filtertiprack_50ul/1":{},"ed3f593b-60f8-44d3-a0fc-9dd1334935fc:opentrons/opentrons_flex_96_filtertiprack_200ul/1":{},"173a4ba3-2e17-4709-b45a-4cdcd050c92e:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":{}},"savedStepForms":{"__INITIAL_DECK_SETUP_STEP__":{"labwareLocationUpdate":{"7a21d246-17da-4616-ae98-f94dff1d2132:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":"C2","780d7327-daa0-483a-9a58-49d1f1599430:opentrons/opentrons_flex_96_filtertiprack_200ul/1":"B2","7b798f9b-c3ff-45d1-a811-be2933d93a90:opentrons/opentrons_flex_96_filtertiprack_50ul/1":"A2","663098b8-8aff-44d9-814c-73efa91ee976:opentrons/thermoscientificnunc_96_wellplate_1300ul/2":"C1","1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/2":"C3","860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/2":"D1","b59a0fb8-cb94-4941-886e-d7c089b0db89:opentrons/nest_96_wellplate_2ml_deep/3":"D2","2f64824e-060d-4e3b-a41d-e5539e27a92b:opentrons/opentrons_flex_96_filtertiprack_50ul/1":"A3","ed3f593b-60f8-44d3-a0fc-9dd1334935fc:opentrons/opentrons_flex_96_filtertiprack_200ul/1":"B1","173a4ba3-2e17-4709-b45a-4cdcd050c92e:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":"B3","dc40302d-4a68-44d6-ae59-3806991a7f9d:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":"offDeck","f4dae565-97d6-4756-9b42-23fc488ae6df:opentrons/opentrons_flex_96_filtertiprack_200ul/1":"offDeck","6eabfdf6-22bb-4893-97f9-1b3948bc073e:opentrons/opentrons_flex_96_filtertiprack_50ul/1":"offDeck","5db4f6c0-3532-4efd-acbd-98ff29e3df68:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":"A1"},"moduleLocationUpdate":{},"pipetteLocationUpdate":{"88360a6e-7a23-4d95-ad2d-14418627f746":"left"},"trashBinLocationUpdate":{},"wasteChuteLocationUpdate":{"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute":"cutoutD3"},"stagingAreaLocationUpdate":{},"gripperLocationUpdate":{"1767d496-b404-411c-8062-c7566a3fa5d9:gripper":"mounted"},"stepType":"manualIntervention","id":"__INITIAL_DECK_SETUP_STEP__"},"31aa2a67-d59a-4f8c-b33f-256cea5ac1c5":{"id":"31aa2a67-d59a-4f8c-b33f-256cea5ac1c5","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"","aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":"716","aspirate_labware":"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"","aspirate_mix_volume":"","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"50","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"null","blowout_location":null,"changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":false,"dispense_airGap_volume":"","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":"716","dispense_labware":"860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/2","dispense_mix_checkbox":false,"dispense_mix_times":"","dispense_mix_volume":"","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"50","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"none","nozzles":"ALL","path":"single","pipette":"88360a6e-7a23-4d95-ad2d-14418627f746","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","volume":"7"},"ce4a6eea-cda4-42b1-8604-c8d4adb8f486":{"id":"ce4a6eea-cda4-42b1-8604-c8d4adb8f486","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"","aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":"716","aspirate_labware":"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"","aspirate_mix_volume":"","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"50","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A2"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"null","blowout_location":null,"changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":false,"dispense_airGap_volume":"","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":"716","dispense_labware":"860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/2","dispense_mix_checkbox":false,"dispense_mix_times":"","dispense_mix_volume":"","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"50","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A2"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"none","nozzles":"ALL","path":"single","pipette":"88360a6e-7a23-4d95-ad2d-14418627f746","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","volume":"14"},"982d93a1-0e94-4ce7-923b-00ee5a2af184":{"id":"982d93a1-0e94-4ce7-923b-00ee5a2af184","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"","aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":"716","aspirate_labware":"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"","aspirate_mix_volume":"","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"50","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A3"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"null","blowout_location":null,"changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":false,"dispense_airGap_volume":"","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":"716","dispense_labware":"860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/2","dispense_mix_checkbox":false,"dispense_mix_times":"","dispense_mix_volume":"","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"50","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A3"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"none","nozzles":"ALL","path":"single","pipette":"88360a6e-7a23-4d95-ad2d-14418627f746","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","volume":"48"},"d2c17088-1e1a-4e66-ac91-f6f44ba493b3":{"id":"d2c17088-1e1a-4e66-ac91-f6f44ba493b3","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"","aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":"716","aspirate_labware":"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"","aspirate_mix_volume":"","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"50","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A4"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"null","blowout_location":null,"changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":false,"dispense_airGap_volume":"","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":"716","dispense_labware":"860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/2","dispense_mix_checkbox":false,"dispense_mix_times":"","dispense_mix_volume":"","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"50","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A4"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"none","nozzles":"ALL","path":"single","pipette":"88360a6e-7a23-4d95-ad2d-14418627f746","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","volume":"8"},"e3aaa0a1-f85f-422a-b3aa-835c4ac85742":{"id":"e3aaa0a1-f85f-422a-b3aa-835c4ac85742","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"","aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":"716","aspirate_labware":"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"","aspirate_mix_volume":"","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"50","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A5"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"null","blowout_location":null,"changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":false,"dispense_airGap_volume":"","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":"716","dispense_labware":"860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/2","dispense_mix_checkbox":false,"dispense_mix_times":"","dispense_mix_volume":"","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"50","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A5"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"none","nozzles":"ALL","path":"single","pipette":"88360a6e-7a23-4d95-ad2d-14418627f746","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","volume":"44"},"e3c49144-dd28-49c6-bd4d-0d818a377d49":{"id":"e3c49144-dd28-49c6-bd4d-0d818a377d49","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"","aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":"716","aspirate_labware":"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"","aspirate_mix_volume":"","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"50","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A6"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"null","blowout_location":null,"changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":false,"dispense_airGap_volume":"","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":"716","dispense_labware":"860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/2","dispense_mix_checkbox":false,"dispense_mix_times":"","dispense_mix_volume":"","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"50","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A6"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"none","nozzles":"ALL","path":"single","pipette":"88360a6e-7a23-4d95-ad2d-14418627f746","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","volume":"199"},"3141435d-d21e-4e0b-870f-a7f954f6ecfc":{"id":"3141435d-d21e-4e0b-870f-a7f954f6ecfc","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"","aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":"716","aspirate_labware":"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"","aspirate_mix_volume":"","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"50","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A7"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"null","blowout_location":null,"changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":false,"dispense_airGap_volume":"","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":"716","dispense_labware":"860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/2","dispense_mix_checkbox":false,"dispense_mix_times":"","dispense_mix_volume":"","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"50","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A7"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"none","nozzles":"ALL","path":"single","pipette":"88360a6e-7a23-4d95-ad2d-14418627f746","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","volume":"11"},"366fe626-7280-4190-bc5d-ee9b6e424e4d":{"id":"366fe626-7280-4190-bc5d-ee9b6e424e4d","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"","aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":"716","aspirate_labware":"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"","aspirate_mix_volume":"","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"50","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A8"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"null","blowout_location":null,"changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":false,"dispense_airGap_volume":"","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":"716","dispense_labware":"860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/2","dispense_mix_checkbox":false,"dispense_mix_times":"","dispense_mix_volume":"","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"50","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A8"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"none","nozzles":"ALL","path":"single","pipette":"88360a6e-7a23-4d95-ad2d-14418627f746","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","volume":"101"},"20897a17-741c-46ee-8c14-ff125934a528":{"id":"20897a17-741c-46ee-8c14-ff125934a528","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"","aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":"716","aspirate_labware":"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"","aspirate_mix_volume":"","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"50","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A9"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"null","blowout_location":null,"changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":false,"dispense_airGap_volume":"","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":"716","dispense_labware":"860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/2","dispense_mix_checkbox":false,"dispense_mix_times":"","dispense_mix_volume":"","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"50","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A9"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"none","nozzles":"ALL","path":"single","pipette":"88360a6e-7a23-4d95-ad2d-14418627f746","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","volume":"999"},"8d3a37c3-2317-48a8-855e-eddbb04f29a1":{"id":"8d3a37c3-2317-48a8-855e-eddbb04f29a1","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"10","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.5","aspirate_flowRate":"716","aspirate_labware":"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"50","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A10"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"716","blowout_location":"destination","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"10","dispense_delay_checkbox":false,"dispense_delay_seconds":"0","dispense_flowRate":"716","dispense_labware":"860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/2","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"50","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A10"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"waterV1","nozzles":"ALL","path":"single","pipette":"88360a6e-7a23-4d95-ad2d-14418627f746","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","volume":"7"},"d88a2325-8fb7-40ce-81cf-abd7debd148f":{"id":"d88a2325-8fb7-40ce-81cf-abd7debd148f","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"10","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.5","aspirate_flowRate":"716","aspirate_labware":"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"50","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A11"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"716","blowout_location":"destination","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"10","dispense_delay_checkbox":false,"dispense_delay_seconds":"0","dispense_flowRate":"716","dispense_labware":"860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/2","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"50","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A11"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"waterV1","nozzles":"ALL","path":"single","pipette":"88360a6e-7a23-4d95-ad2d-14418627f746","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","volume":"14"},"5c7eb102-e258-4c1c-a161-04d2eaa8712c":{"id":"5c7eb102-e258-4c1c-a161-04d2eaa8712c","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"10","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.5","aspirate_flowRate":"716","aspirate_labware":"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"50","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A12"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"716","blowout_location":"destination","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"10","dispense_delay_checkbox":false,"dispense_delay_seconds":"0","dispense_flowRate":"716","dispense_labware":"860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/2","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"50","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A12"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"waterV1","nozzles":"ALL","path":"single","pipette":"88360a6e-7a23-4d95-ad2d-14418627f746","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","volume":"48"},"c2076896-6187-443b-8b90-5d5819a0ba35":{"id":"c2076896-6187-443b-8b90-5d5819a0ba35","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"10","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.5","aspirate_flowRate":"716","aspirate_labware":"663098b8-8aff-44d9-814c-73efa91ee976:opentrons/thermoscientificnunc_96_wellplate_1300ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"50","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"716","blowout_location":"destination","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"10","dispense_delay_checkbox":false,"dispense_delay_seconds":"0","dispense_flowRate":"716","dispense_labware":"b59a0fb8-cb94-4941-886e-d7c089b0db89:opentrons/nest_96_wellplate_2ml_deep/3","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"50","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"waterV1","nozzles":"ALL","path":"single","pipette":"88360a6e-7a23-4d95-ad2d-14418627f746","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","volume":"8"},"5c999ecc-97ab-40ce-9703-4b094cf3daba":{"id":"5c999ecc-97ab-40ce-9703-4b094cf3daba","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"10","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.5","aspirate_flowRate":"716","aspirate_labware":"663098b8-8aff-44d9-814c-73efa91ee976:opentrons/thermoscientificnunc_96_wellplate_1300ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"50","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A2"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"716","blowout_location":"destination","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"10","dispense_delay_checkbox":false,"dispense_delay_seconds":"0","dispense_flowRate":"716","dispense_labware":"b59a0fb8-cb94-4941-886e-d7c089b0db89:opentrons/nest_96_wellplate_2ml_deep/3","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"50","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A2"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"waterV1","nozzles":"ALL","path":"single","pipette":"88360a6e-7a23-4d95-ad2d-14418627f746","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","volume":"44"},"89a9ed68-3565-4e51-b95e-1341f3b888d0":{"id":"89a9ed68-3565-4e51-b95e-1341f3b888d0","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"10","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.5","aspirate_flowRate":"716","aspirate_labware":"663098b8-8aff-44d9-814c-73efa91ee976:opentrons/thermoscientificnunc_96_wellplate_1300ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"50","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A3"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"716","blowout_location":"destination","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"10","dispense_delay_checkbox":false,"dispense_delay_seconds":"0","dispense_flowRate":"716","dispense_labware":"b59a0fb8-cb94-4941-886e-d7c089b0db89:opentrons/nest_96_wellplate_2ml_deep/3","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"50","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A3"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"waterV1","nozzles":"ALL","path":"single","pipette":"88360a6e-7a23-4d95-ad2d-14418627f746","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","volume":"199"},"b2afa2f1-3750-49aa-86d9-d97b41bde5f7":{"id":"b2afa2f1-3750-49aa-86d9-d97b41bde5f7","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"10","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.5","aspirate_flowRate":"716","aspirate_labware":"663098b8-8aff-44d9-814c-73efa91ee976:opentrons/thermoscientificnunc_96_wellplate_1300ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"50","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A4"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"716","blowout_location":"destination","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"10","dispense_delay_checkbox":false,"dispense_delay_seconds":"0","dispense_flowRate":"716","dispense_labware":"b59a0fb8-cb94-4941-886e-d7c089b0db89:opentrons/nest_96_wellplate_2ml_deep/3","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"50","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A4"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"waterV1","nozzles":"ALL","path":"single","pipette":"88360a6e-7a23-4d95-ad2d-14418627f746","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","volume":"11"},"b70f148f-0fff-4119-96e8-dfe05901193a":{"id":"b70f148f-0fff-4119-96e8-dfe05901193a","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"10","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.5","aspirate_flowRate":"716","aspirate_labware":"663098b8-8aff-44d9-814c-73efa91ee976:opentrons/thermoscientificnunc_96_wellplate_1300ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"50","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A5"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"716","blowout_location":"destination","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"10","dispense_delay_checkbox":false,"dispense_delay_seconds":"0","dispense_flowRate":"716","dispense_labware":"b59a0fb8-cb94-4941-886e-d7c089b0db89:opentrons/nest_96_wellplate_2ml_deep/3","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"50","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A5"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"waterV1","nozzles":"ALL","path":"single","pipette":"88360a6e-7a23-4d95-ad2d-14418627f746","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","volume":"101"},"7fca97d7-716f-4dce-82e8-30dccf18bf8c":{"id":"7fca97d7-716f-4dce-82e8-30dccf18bf8c","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"1","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.5","aspirate_flowRate":"716","aspirate_labware":"663098b8-8aff-44d9-814c-73efa91ee976:opentrons/thermoscientificnunc_96_wellplate_1300ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"50","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A6"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"716","blowout_location":"destination","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"10","dispense_delay_checkbox":false,"dispense_delay_seconds":"0","dispense_flowRate":"716","dispense_labware":"b59a0fb8-cb94-4941-886e-d7c089b0db89:opentrons/nest_96_wellplate_2ml_deep/3","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"50","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A6"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"waterV1","nozzles":"ALL","path":"single","pipette":"88360a6e-7a23-4d95-ad2d-14418627f746","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","volume":"999"},"c2187c69-a9ac-412f-9b36-3656edd4d0ff":{"id":"c2187c69-a9ac-412f-9b36-3656edd4d0ff","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.7","aspirate_flowRate":"10","aspirate_labware":"663098b8-8aff-44d9-814c-73efa91ee976:opentrons/thermoscientificnunc_96_wellplate_1300ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"4","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"4","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A7"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"250","blowout_location":"destination","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":false,"dispense_airGap_volume":"","dispense_delay_checkbox":true,"dispense_delay_seconds":"0.5","dispense_flowRate":"250","dispense_labware":"b59a0fb8-cb94-4941-886e-d7c089b0db89:opentrons/nest_96_wellplate_2ml_deep/3","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"4","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"4","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A7"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"glycerol50V1","nozzles":"ALL","path":"single","pipette":"88360a6e-7a23-4d95-ad2d-14418627f746","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"35","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","volume":"7"},"f0c0632f-cdb0-40b2-a7ce-29742271d91c":{"id":"f0c0632f-cdb0-40b2-a7ce-29742271d91c","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.7","aspirate_flowRate":"14","aspirate_labware":"663098b8-8aff-44d9-814c-73efa91ee976:opentrons/thermoscientificnunc_96_wellplate_1300ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"4","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"4","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A8"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"250","blowout_location":"destination","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":false,"dispense_airGap_volume":"","dispense_delay_checkbox":true,"dispense_delay_seconds":"0.5","dispense_flowRate":"250","dispense_labware":"b59a0fb8-cb94-4941-886e-d7c089b0db89:opentrons/nest_96_wellplate_2ml_deep/3","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"4","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"4","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A8"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"glycerol50V1","nozzles":"ALL","path":"single","pipette":"88360a6e-7a23-4d95-ad2d-14418627f746","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"35","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","volume":"14"},"42c7b4cd-f9a7-415e-9684-9d7da7cefc24":{"id":"42c7b4cd-f9a7-415e-9684-9d7da7cefc24","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.7","aspirate_flowRate":"48","aspirate_labware":"663098b8-8aff-44d9-814c-73efa91ee976:opentrons/thermoscientificnunc_96_wellplate_1300ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"4","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"4","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A9"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"250","blowout_location":"destination","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":false,"dispense_airGap_volume":"","dispense_delay_checkbox":true,"dispense_delay_seconds":"0.5","dispense_flowRate":"250","dispense_labware":"b59a0fb8-cb94-4941-886e-d7c089b0db89:opentrons/nest_96_wellplate_2ml_deep/3","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"4","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"4","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A9"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"glycerol50V1","nozzles":"ALL","path":"single","pipette":"88360a6e-7a23-4d95-ad2d-14418627f746","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"35","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","volume":"48"},"61118bed-62c6-49ad-8387-44eea7bb36c6":{"id":"61118bed-62c6-49ad-8387-44eea7bb36c6","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.7","aspirate_flowRate":"10","aspirate_labware":"663098b8-8aff-44d9-814c-73efa91ee976:opentrons/thermoscientificnunc_96_wellplate_1300ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"4","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"4","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A10"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"250","blowout_location":"destination","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":false,"dispense_airGap_volume":"","dispense_delay_checkbox":true,"dispense_delay_seconds":"0.5","dispense_flowRate":"250","dispense_labware":"b59a0fb8-cb94-4941-886e-d7c089b0db89:opentrons/nest_96_wellplate_2ml_deep/3","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"4","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"4","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A10"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"glycerol50V1","nozzles":"ALL","path":"single","pipette":"88360a6e-7a23-4d95-ad2d-14418627f746","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"35","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","volume":"8"},"1402ac06-611f-4ab2-851d-61eed5667b84":{"id":"1402ac06-611f-4ab2-851d-61eed5667b84","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.7","aspirate_flowRate":"44","aspirate_labware":"663098b8-8aff-44d9-814c-73efa91ee976:opentrons/thermoscientificnunc_96_wellplate_1300ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"4","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"4","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A11"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"250","blowout_location":"destination","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":false,"dispense_airGap_volume":"","dispense_delay_checkbox":true,"dispense_delay_seconds":"0.5","dispense_flowRate":"250","dispense_labware":"b59a0fb8-cb94-4941-886e-d7c089b0db89:opentrons/nest_96_wellplate_2ml_deep/3","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"4","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"4","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A11"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"glycerol50V1","nozzles":"ALL","path":"single","pipette":"88360a6e-7a23-4d95-ad2d-14418627f746","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"35","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","volume":"44"},"0d930b6d-774c-4fe4-a483-1ea59b0392cd":{"id":"0d930b6d-774c-4fe4-a483-1ea59b0392cd","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.7","aspirate_flowRate":"177","aspirate_labware":"663098b8-8aff-44d9-814c-73efa91ee976:opentrons/thermoscientificnunc_96_wellplate_1300ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"4","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"4","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A12"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"250","blowout_location":"destination","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":false,"dispense_airGap_volume":"","dispense_delay_checkbox":true,"dispense_delay_seconds":"0.5","dispense_flowRate":"250","dispense_labware":"b59a0fb8-cb94-4941-886e-d7c089b0db89:opentrons/nest_96_wellplate_2ml_deep/3","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"4","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"4","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A12"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"glycerol50V1","nozzles":"ALL","path":"single","pipette":"88360a6e-7a23-4d95-ad2d-14418627f746","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"35","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","volume":"199"},"7825a4a7-9bf8-45d6-bf75-857de4b17986":{"id":"7825a4a7-9bf8-45d6-bf75-857de4b17986","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.7","aspirate_flowRate":"11","aspirate_labware":"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"4","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"4","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"250","blowout_location":"destination","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":false,"dispense_airGap_volume":"","dispense_delay_checkbox":true,"dispense_delay_seconds":"0.5","dispense_flowRate":"250","dispense_labware":"860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/2","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"4","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"4","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"glycerol50V1","nozzles":"ALL","path":"single","pipette":"88360a6e-7a23-4d95-ad2d-14418627f746","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"35","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","volume":"11"},"952509b5-e8e5-42b1-8570-b61cb703441d":{"id":"952509b5-e8e5-42b1-8570-b61cb703441d","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.7","aspirate_flowRate":"100.7","aspirate_labware":"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"4","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"4","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A2"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"250","blowout_location":"destination","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":false,"dispense_airGap_volume":"","dispense_delay_checkbox":true,"dispense_delay_seconds":"0.5","dispense_flowRate":"250","dispense_labware":"860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/2","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"4","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"4","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A2"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"glycerol50V1","nozzles":"ALL","path":"single","pipette":"88360a6e-7a23-4d95-ad2d-14418627f746","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"35","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","volume":"101"},"cd884b9a-26d3-43f9-aa44-ca57a52c8ef5":{"id":"cd884b9a-26d3-43f9-aa44-ca57a52c8ef5","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.7","aspirate_flowRate":"799.2","aspirate_labware":"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"4","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"4","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A3"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"250","blowout_location":"destination","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":false,"dispense_airGap_volume":"","dispense_delay_checkbox":true,"dispense_delay_seconds":"0.5","dispense_flowRate":"250","dispense_labware":"860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/2","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"4","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"4","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A3"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"glycerol50V1","nozzles":"ALL","path":"single","pipette":"88360a6e-7a23-4d95-ad2d-14418627f746","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"35","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","volume":"999"},"5d67d823-7cc7-44b5-b6d3-e3f6b27e7c40":{"id":"5d67d823-7cc7-44b5-b6d3-e3f6b27e7c40","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"12","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.2","aspirate_flowRate":"10","aspirate_labware":"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0.5","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"100","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A4"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"125","blowout_location":"destination","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"12","dispense_delay_checkbox":true,"dispense_delay_seconds":"2","dispense_flowRate":"40","dispense_labware":"860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/2","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0.5","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"100","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A4"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"ethanol80V1","nozzles":"ALL","path":"single","pipette":"88360a6e-7a23-4d95-ad2d-14418627f746","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":"","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","volume":"7"},"3afa1a9d-56c0-4264-bb8a-e6ea6631f301":{"id":"3afa1a9d-56c0-4264-bb8a-e6ea6631f301","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"12","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.2","aspirate_flowRate":"14","aspirate_labware":"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0.5","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"100","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A5"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"125","blowout_location":"destination","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"12","dispense_delay_checkbox":true,"dispense_delay_seconds":"2","dispense_flowRate":"40","dispense_labware":"860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/2","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0.5","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"100","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A5"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"ethanol80V1","nozzles":"ALL","path":"single","pipette":"88360a6e-7a23-4d95-ad2d-14418627f746","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":"","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","volume":"14"},"21604fc6-1804-48e1-93d8-61861197300d":{"id":"21604fc6-1804-48e1-93d8-61861197300d","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"12","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.2","aspirate_flowRate":"48","aspirate_labware":"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0.5","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"100","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A6"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"125","blowout_location":"destination","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"12","dispense_delay_checkbox":true,"dispense_delay_seconds":"2","dispense_flowRate":"40","dispense_labware":"860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/2","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0.5","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"100","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A6"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"ethanol80V1","nozzles":"ALL","path":"single","pipette":"88360a6e-7a23-4d95-ad2d-14418627f746","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":"","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","volume":"48"},"13a152c6-5455-4e4c-991d-2c92603029d1":{"id":"13a152c6-5455-4e4c-991d-2c92603029d1","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"12","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.2","aspirate_flowRate":"10","aspirate_labware":"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0.5","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"100","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A7"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"125","blowout_location":"destination","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"12","dispense_delay_checkbox":true,"dispense_delay_seconds":"2","dispense_flowRate":"40","dispense_labware":"860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/2","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0.5","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"100","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A7"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"ethanol80V1","nozzles":"ALL","path":"single","pipette":"88360a6e-7a23-4d95-ad2d-14418627f746","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":"","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","volume":"8"},"761b89e4-b1e6-40a6-b25c-883c11d77d8c":{"id":"761b89e4-b1e6-40a6-b25c-883c11d77d8c","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"12","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.2","aspirate_flowRate":"44","aspirate_labware":"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0.5","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"100","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A8"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"125","blowout_location":"destination","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"12","dispense_delay_checkbox":true,"dispense_delay_seconds":"2","dispense_flowRate":"40","dispense_labware":"860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/2","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0.5","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"100","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A8"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"ethanol80V1","nozzles":"ALL","path":"single","pipette":"88360a6e-7a23-4d95-ad2d-14418627f746","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":"","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","volume":"44"},"6c1bd898-c6b2-4baf-ac37-75183dccb4ec":{"id":"6c1bd898-c6b2-4baf-ac37-75183dccb4ec","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"11.8","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.2","aspirate_flowRate":"199","aspirate_labware":"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0.5","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"100","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A9"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"125","blowout_location":"destination","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"12","dispense_delay_checkbox":true,"dispense_delay_seconds":"2","dispense_flowRate":"40","dispense_labware":"860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/2","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0.5","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"100","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A9"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"ethanol80V1","nozzles":"ALL","path":"single","pipette":"88360a6e-7a23-4d95-ad2d-14418627f746","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":"","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","volume":"199"},"a3556e4e-3c97-4b5c-a7df-6d83d2d8268f":{"id":"a3556e4e-3c97-4b5c-a7df-6d83d2d8268f","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"12","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.2","aspirate_flowRate":"11","aspirate_labware":"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0.5","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"100","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A10"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"125","blowout_location":"destination","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"12","dispense_delay_checkbox":true,"dispense_delay_seconds":"2","dispense_flowRate":"40","dispense_labware":"860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/2","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0.5","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"100","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A10"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"ethanol80V1","nozzles":"ALL","path":"single","pipette":"88360a6e-7a23-4d95-ad2d-14418627f746","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":"","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","volume":"11"},"8643da46-68aa-4b3b-9aeb-218cd930fde1":{"id":"8643da46-68aa-4b3b-9aeb-218cd930fde1","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"12","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.2","aspirate_flowRate":"101","aspirate_labware":"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0.5","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"100","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A11"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"125","blowout_location":"destination","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"12","dispense_delay_checkbox":true,"dispense_delay_seconds":"2","dispense_flowRate":"40","dispense_labware":"860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/2","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0.5","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"100","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A11"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"ethanol80V1","nozzles":"ALL","path":"single","pipette":"88360a6e-7a23-4d95-ad2d-14418627f746","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":"","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","volume":"101"},"d6778500-a678-4542-88ed-d201144b95c6":{"id":"d6778500-a678-4542-88ed-d201144b95c6","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0,"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"0.0","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.2","aspirate_flowRate":"200","aspirate_labware":"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/2","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0.5","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"100","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A12"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"125","blowout_location":"destination","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"12","dispense_delay_checkbox":true,"dispense_delay_seconds":"2","dispense_flowRate":"40","dispense_labware":"860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/2","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0.5","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"100","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A12"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"9450b357-1dd4-4e5d-9e72-420c0422c1b7:wasteChute","liquidClassesSupported":true,"liquidClass":"ethanol80V1","nozzles":"ALL","path":"single","pipette":"88360a6e-7a23-4d95-ad2d-14418627f746","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":"","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","volume":"999"}},"orderedStepIds":["31aa2a67-d59a-4f8c-b33f-256cea5ac1c5","ce4a6eea-cda4-42b1-8604-c8d4adb8f486","982d93a1-0e94-4ce7-923b-00ee5a2af184","d2c17088-1e1a-4e66-ac91-f6f44ba493b3","e3aaa0a1-f85f-422a-b3aa-835c4ac85742","e3c49144-dd28-49c6-bd4d-0d818a377d49","3141435d-d21e-4e0b-870f-a7f954f6ecfc","366fe626-7280-4190-bc5d-ee9b6e424e4d","20897a17-741c-46ee-8c14-ff125934a528","8d3a37c3-2317-48a8-855e-eddbb04f29a1","d88a2325-8fb7-40ce-81cf-abd7debd148f","5c7eb102-e258-4c1c-a161-04d2eaa8712c","c2076896-6187-443b-8b90-5d5819a0ba35","5c999ecc-97ab-40ce-9703-4b094cf3daba","89a9ed68-3565-4e51-b95e-1341f3b888d0","b2afa2f1-3750-49aa-86d9-d97b41bde5f7","b70f148f-0fff-4119-96e8-dfe05901193a","7fca97d7-716f-4dce-82e8-30dccf18bf8c","c2187c69-a9ac-412f-9b36-3656edd4d0ff","f0c0632f-cdb0-40b2-a7ce-29742271d91c","42c7b4cd-f9a7-415e-9684-9d7da7cefc24","61118bed-62c6-49ad-8387-44eea7bb36c6","1402ac06-611f-4ab2-851d-61eed5667b84","0d930b6d-774c-4fe4-a483-1ea59b0392cd","7825a4a7-9bf8-45d6-bf75-857de4b17986","952509b5-e8e5-42b1-8570-b61cb703441d","cd884b9a-26d3-43f9-aa44-ca57a52c8ef5","5d67d823-7cc7-44b5-b6d3-e3f6b27e7c40","3afa1a9d-56c0-4264-bb8a-e6ea6631f301","21604fc6-1804-48e1-93d8-61861197300d","13a152c6-5455-4e4c-991d-2c92603029d1","761b89e4-b1e6-40a6-b25c-883c11d77d8c","6c1bd898-c6b2-4baf-ac37-75183dccb4ec","a3556e4e-3c97-4b5c-a7df-6d83d2d8268f","8643da46-68aa-4b3b-9aeb-218cd930fde1","d6778500-a678-4542-88ed-d201144b95c6"],"pipettes":{"88360a6e-7a23-4d95-ad2d-14418627f746":{"pipetteName":"p1000_multi_flex"}},"modules":{},"labware":{"7a21d246-17da-4616-ae98-f94dff1d2132:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 1000 µL","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1"},"780d7327-daa0-483a-9a58-49d1f1599430:opentrons/opentrons_flex_96_filtertiprack_200ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 200 µL","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_200ul/1"},"7b798f9b-c3ff-45d1-a811-be2933d93a90:opentrons/opentrons_flex_96_filtertiprack_50ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 50 µL","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_50ul/1"},"663098b8-8aff-44d9-814c-73efa91ee976:opentrons/thermoscientificnunc_96_wellplate_1300ul/2":{"displayName":"Thermo Scientific Nunc 96 Well Plate 1300 µL","labwareDefURI":"opentrons/thermoscientificnunc_96_wellplate_1300ul/2"},"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/2":{"displayName":"Thermo Scientific Nunc 96 Well Plate 2000 µL","labwareDefURI":"opentrons/thermoscientificnunc_96_wellplate_2000ul/2"},"860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/2":{"displayName":"USA Scientific 96 Deep Well Plate 2.4 mL","labwareDefURI":"opentrons/usascientific_96_wellplate_2.4ml_deep/2"},"b59a0fb8-cb94-4941-886e-d7c089b0db89:opentrons/nest_96_wellplate_2ml_deep/3":{"displayName":"NEST 96 Deep Well Plate 2mL","labwareDefURI":"opentrons/nest_96_wellplate_2ml_deep/3"},"2f64824e-060d-4e3b-a41d-e5539e27a92b:opentrons/opentrons_flex_96_filtertiprack_50ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 50 µL (1)","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_50ul/1"},"ed3f593b-60f8-44d3-a0fc-9dd1334935fc:opentrons/opentrons_flex_96_filtertiprack_200ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 200 µL (1)","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_200ul/1"},"173a4ba3-2e17-4709-b45a-4cdcd050c92e:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 1000 µL (1)","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1"},"dc40302d-4a68-44d6-ae59-3806991a7f9d:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 1000 µL (3)","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1"},"f4dae565-97d6-4756-9b42-23fc488ae6df:opentrons/opentrons_flex_96_filtertiprack_200ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 200 µL (2)","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_200ul/1"},"6eabfdf6-22bb-4893-97f9-1b3948bc073e:opentrons/opentrons_flex_96_filtertiprack_50ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 50 µL (2)","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_50ul/1"},"5db4f6c0-3532-4efd-acbd-98ff29e3df68:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 1000 µL (4)","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1"}}}},"metadata":{"protocolName":"P1000MTransferMulti","author":"","description":"","created":1748467626797,"lastModified":1750799056756,"source":"Protocol Designer","category":null,"subcategory":null,"tags":[]}}"""
