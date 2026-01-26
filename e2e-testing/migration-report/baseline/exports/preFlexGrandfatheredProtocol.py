import json
from opentrons import protocol_api, types

metadata = {
    "protocolName": "QA test protocol",
    "created": "2019-01-14T14:38:05.921Z",
    "internalAppBuildDate": "Fri, 23 Jan 2026 20:05:49 GMT",
    "lastModified": "2026-01-26T19:56:38.086Z",
    "protocolDesigner": "8.8.0-alpha.7",
    "source": "Protocol Designer",
}

requirements = {"robotType": "OT-2", "apiLevel": "2.27"}

def run(protocol: protocol_api.ProtocolContext) -> None:
    # Load Labware:
    tip_rack_1 = protocol.load_labware(
        "opentrons_96_tiprack_10ul",
        location="1",
        label="Tiprack 10 Ul (1)",
        namespace="opentrons",
        version=1,
    )
    reservoir_1 = protocol.load_labware(
        "usascientific_12_reservoir_22ml",
        location="7",
        label="Trough 12 Row (1)",
        namespace="opentrons",
        version=4,
    )
    well_plate_1 = protocol.load_labware(
        "corning_96_wellplate_360ul_flat",
        location="8",
        label="96 Flat (1)",
        namespace="opentrons",
        version=5,
    )
    tip_rack_2 = protocol.load_labware(
        "opentrons_96_tiprack_10ul",
        location="2",
        label="Tiprack 10 Ul (2)",
        namespace="opentrons",
        version=1,
    )

    # Load Pipettes:
    pipette_left = protocol.load_instrument("p10_single", "left")
    pipette_right = protocol.load_instrument("p10_multi", "right")

    # Define Liquids:
    liquid_1 = protocol.define_liquid(
        "Liquid",
        display_color="#b925ff",
    )

    # Load Liquids:
    reservoir_1.load_liquid(
        wells=["A1"],
        liquid=liquid_1,
        volume=12000,
    )
    reservoir_1.load_liquid(
        wells=["A2", "A3"],
        liquid=liquid_1,
        volume=1200,
    )

    # PROTOCOL STEPS

    # Step 1: Basic Transfer
    pipette_left.transfer_with_liquid_class(
        volume=10,
        source=[reservoir_1["A1"]],
        dest=[well_plate_1["A1"]],
        new_tip="always",
        trash_location=protocol.fixed_trash,
        keep_last_tip=True,
        tip_racks=[tip_rack_1, tip_rack_2],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_1",
            properties={"p10_single": {"opentrons/opentrons_96_tiprack_10ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 1},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 5)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "mix": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
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
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 1},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 10)],
                    "delay": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
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
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": False},
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 0)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
    )

    # Step 2: Basic Transfer
    pipette_right.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette_right.transfer_with_liquid_class(
        volume=10,
        source=[reservoir_1["A1"]],
        dest=[well_plate_1["A1"]],
        new_tip="always",
        trash_location=protocol.fixed_trash,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_1, tip_rack_2],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_2",
            properties={"p10_multi": {"opentrons/opentrons_96_tiprack_10ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 1},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 5)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "mix": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
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
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 1},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 10)],
                    "delay": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
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
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": False},
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 0)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
    )

    # Step 3: T misc. settings
    # Pre-wet, touch tip, mix, blow out, new tip never
    pipette_left.transfer_with_liquid_class(
        volume=10,
        source=[reservoir_1["A1"]],
        dest=[well_plate_1["B1"]],
        new_tip="never",
        trash_location=protocol.fixed_trash,
        keep_last_tip=True,
        tip_racks=[tip_rack_1, tip_rack_2],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_3",
            properties={"p10_single": {"opentrons/opentrons_96_tiprack_10ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 1},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 5)],
                    "pre_wet": True,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "mix": {"enabled": True, "repetitions": 3, "volume": 3},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
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
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 1},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 10)],
                    "delay": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
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
                        "speed": 125,
                        "touch_tip": {
                            "enabled": True,
                            "z_offset": -1,
                            "mm_from_edge": 0,
                            "speed": 400,
                        },
                        "blowout": {"enabled": True, "location": "trash", "flow_rate": 31},
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 0)],
                    "mix": {"enabled": True, "repetitions": 3, "volume": 5},
                },
            }}},
        ),
    )

    # Step 5: T height & speed
    # Asp should be half way to top and slow. Touch tip half way to top. Disp should be at the top and slow
    pipette_left.transfer_with_liquid_class(
        volume=10,
        source=[reservoir_1["A1"]],
        dest=[well_plate_1["C1"]],
        new_tip="never",
        trash_location=protocol.fixed_trash,
        keep_last_tip=True,
        tip_racks=[tip_rack_1, tip_rack_2],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_5",
            properties={"p10_single": {"opentrons/opentrons_96_tiprack_10ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 18},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 10)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "mix": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
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
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 10},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 2)],
                    "delay": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
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
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": False},
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 0)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
    )
    pipette_left.drop_tip()

    # Step 6: T height & speed
    # Asp should be half way to top and slow, Disp should be at the top and slow
    pipette_right.transfer_with_liquid_class(
        volume=10,
        source=[reservoir_1["A1"]],
        dest=[well_plate_1["A1"]],
        new_tip="never",
        trash_location=protocol.fixed_trash,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_1, tip_rack_2],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_6",
            properties={"p10_multi": {"opentrons/opentrons_96_tiprack_10ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 18},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 5)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "mix": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
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
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 10},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 10)],
                    "delay": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
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
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": False},
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 0)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
    )
    pipette_right.drop_tip()

    # Step 7: T change tip always
    # Change tip always
    pipette_left.transfer_with_liquid_class(
        volume=10,
        source=[reservoir_1["A1"], reservoir_1["A2"], reservoir_1["A3"]],
        dest=[well_plate_1["D1"], well_plate_1["E1"], well_plate_1["F1"]],
        new_tip="always",
        trash_location=protocol.fixed_trash,
        keep_last_tip=True,
        tip_racks=[tip_rack_1, tip_rack_2],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_7",
            properties={"p10_single": {"opentrons/opentrons_96_tiprack_10ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 1},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 5)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "mix": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
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
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 1},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 10)],
                    "delay": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
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
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": False},
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 0)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
    )
    pipette_left.drop_tip()

    # Step 8: T change tip always
    # Change tip always
    pipette_right.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette_right.transfer_with_liquid_class(
        volume=10,
        source=[reservoir_1["A1"], reservoir_1["A2"], reservoir_1["A3"]],
        dest=[well_plate_1["A1"], well_plate_1["A2"], well_plate_1["A3"]],
        new_tip="always",
        trash_location=protocol.fixed_trash,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_1, tip_rack_2],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_8",
            properties={"p10_multi": {"opentrons/opentrons_96_tiprack_10ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 1},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 5)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "mix": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
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
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 1},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 10)],
                    "delay": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
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
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": False},
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 0)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
    )
    pipette_right.drop_tip()

    # Step 9: T change tip once
    # Change tip once
    pipette_left.transfer_with_liquid_class(
        volume=10,
        source=[reservoir_1["A1"], reservoir_1["A2"], reservoir_1["A3"]],
        dest=[well_plate_1["G1"], well_plate_1["H1"], well_plate_1["A2"]],
        new_tip="once",
        trash_location=protocol.fixed_trash,
        keep_last_tip=True,
        tip_racks=[tip_rack_1, tip_rack_2],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_9",
            properties={"p10_single": {"opentrons/opentrons_96_tiprack_10ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 1},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 5)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "mix": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
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
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 1},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 10)],
                    "delay": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
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
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": False},
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 0)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
    )

    # Step 10: T change tip once
    # Change tip once
    pipette_right.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette_right.transfer_with_liquid_class(
        volume=10,
        source=[reservoir_1["A1"], reservoir_1["A2"], reservoir_1["A3"]],
        dest=[well_plate_1["A1"], well_plate_1["A2"], well_plate_1["A3"]],
        new_tip="once",
        trash_location=protocol.fixed_trash,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_1, tip_rack_2],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_10",
            properties={"p10_multi": {"opentrons/opentrons_96_tiprack_10ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 1},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 5)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "mix": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
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
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 1},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 10)],
                    "delay": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
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
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": False},
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 0)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
    )

    # Step 11: Basic Distribute
    pipette_left.transfer_with_liquid_class(
        volume=5,
        source=[reservoir_1["A1"], reservoir_1["A1"]],
        dest=[well_plate_1["A4"], well_plate_1["B4"]],
        new_tip="never",
        trash_location=protocol.fixed_trash,
        keep_last_tip=True,
        tip_racks=[tip_rack_1, tip_rack_2],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_11",
            properties={"p10_single": {"opentrons/opentrons_96_tiprack_10ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 1},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 5)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "mix": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
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
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 1},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 10)],
                    "delay": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
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
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": False},
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 0)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
    )

    # Step 12: Basic Distribute
    pipette_right.transfer_with_liquid_class(
        volume=5,
        source=[reservoir_1["A1"], reservoir_1["A1"]],
        dest=[well_plate_1["A3"], well_plate_1["A4"]],
        new_tip="never",
        trash_location=protocol.fixed_trash,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_1, tip_rack_2],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_12",
            properties={"p10_multi": {"opentrons/opentrons_96_tiprack_10ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 1},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 5)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "mix": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
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
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 1},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 10)],
                    "delay": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
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
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": False},
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 0)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
    )

    # Step 15: D Height & Speed
    # Asp at halfway height slow. Touch tip at halfway height. Disp at halfway height fast. 
    pipette_left.transfer_with_liquid_class(
        volume=10,
        source=[reservoir_1["A1"], reservoir_1["A1"]],
        dest=[well_plate_1["C5"], well_plate_1["D5"]],
        new_tip="never",
        trash_location=protocol.fixed_trash,
        keep_last_tip=True,
        tip_racks=[tip_rack_1, tip_rack_2],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_15",
            properties={"p10_single": {"opentrons/opentrons_96_tiprack_10ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 20},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 5)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "mix": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
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
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 10},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 10)],
                    "delay": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
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
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": False},
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 0)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
    )
    pipette_left.drop_tip()

    # Step 16: D Height & Speed
    # Asp at halfway height slow. Touch tip at halfway height. Disp at halfway height fast. 
    pipette_right.transfer_with_liquid_class(
        volume=10,
        source=[reservoir_1["A1"], reservoir_1["A1"]],
        dest=[well_plate_1["A3"], well_plate_1["A4"]],
        new_tip="never",
        trash_location=protocol.fixed_trash,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_1, tip_rack_2],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_16",
            properties={"p10_multi": {"opentrons/opentrons_96_tiprack_10ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 20},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 5)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "mix": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
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
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 10},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 10)],
                    "delay": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
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
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": False},
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 0)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
    )
    pipette_right.drop_tip()

    # Step 17: D change tip always, disp vol sour
    # Change tip always, disposal volume in source
    pipette_left.transfer_with_liquid_class(
        volume=10,
        source=[reservoir_1["A1"], reservoir_1["A1"]],
        dest=[well_plate_1["E4"], well_plate_1["F4"]],
        new_tip="always",
        trash_location=protocol.fixed_trash,
        keep_last_tip=True,
        tip_racks=[tip_rack_1, tip_rack_2],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_17",
            properties={"p10_single": {"opentrons/opentrons_96_tiprack_10ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 1},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 5)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "mix": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
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
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 1},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 10)],
                    "delay": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
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
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": False},
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 0)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
    )
    pipette_left.drop_tip()

    # Step 18: D change tip always, disp vol sour
    # Change tip always, disposal volume in source
    pipette_right.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette_right.transfer_with_liquid_class(
        volume=10,
        source=[reservoir_1["A1"], reservoir_1["A1"]],
        dest=[well_plate_1["A5"], well_plate_1["A6"]],
        new_tip="always",
        trash_location=protocol.fixed_trash,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_1, tip_rack_2],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_18",
            properties={"p10_multi": {"opentrons/opentrons_96_tiprack_10ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 1},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 5)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "mix": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
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
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 1},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 10)],
                    "delay": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
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
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": False},
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 0)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
    )
    pipette_right.drop_tip()

    # Step 19: D change tip once
    pipette_left.transfer_with_liquid_class(
        volume=5,
        source=[reservoir_1["A1"], reservoir_1["A1"]],
        dest=[well_plate_1["E4"], well_plate_1["F4"]],
        new_tip="once",
        trash_location=protocol.fixed_trash,
        keep_last_tip=True,
        tip_racks=[tip_rack_1, tip_rack_2],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_19",
            properties={"p10_single": {"opentrons/opentrons_96_tiprack_10ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 1},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 5)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "mix": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
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
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 1},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 10)],
                    "delay": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
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
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": False},
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 0)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
    )

    # Step 20: D change tip once
    pipette_right.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette_right.transfer_with_liquid_class(
        volume=5,
        source=[reservoir_1["A1"], reservoir_1["A1"]],
        dest=[well_plate_1["A7"], well_plate_1["A8"]],
        new_tip="once",
        trash_location=protocol.fixed_trash,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_1, tip_rack_2],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_20",
            properties={"p10_multi": {"opentrons/opentrons_96_tiprack_10ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 1},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 5)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "mix": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
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
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 1},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 10)],
                    "delay": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
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
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": False},
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 0)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
    )

    # Step 21: Basic consolidate
    pipette_left.consolidate_with_liquid_class(
        volume=5,
        source=[reservoir_1["A1"], reservoir_1["A2"]],
        dest=[well_plate_1["A9"]],
        new_tip="never",
        trash_location=protocol.fixed_trash,
        keep_last_tip=True,
        tip_racks=[tip_rack_1, tip_rack_2],
        liquid_class=protocol.define_liquid_class(
            name="consolidate_step_21",
            properties={"p10_single": {"opentrons/opentrons_96_tiprack_10ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 1},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 5)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "mix": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
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
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 1},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 10)],
                    "delay": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
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
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": False},
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 0)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
    )

    # Step 22: Basic consolidate
    pipette_right.consolidate_with_liquid_class(
        volume=5,
        source=[reservoir_1["A1"], reservoir_1["A2"]],
        dest=[well_plate_1["A8"]],
        new_tip="never",
        trash_location=protocol.fixed_trash,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_1, tip_rack_2],
        liquid_class=protocol.define_liquid_class(
            name="consolidate_step_22",
            properties={"p10_multi": {"opentrons/opentrons_96_tiprack_10ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 1},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 5)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "mix": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
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
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 1},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 10)],
                    "delay": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
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
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": False},
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 0)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
    )

    # Step 23: C Misc settings
    # Pre wet, touch tip, mix, change tip never, blow out trash
    pipette_left.consolidate_with_liquid_class(
        volume=5,
        source=[reservoir_1["A1"], reservoir_1["A2"]],
        dest=[well_plate_1["A9"]],
        new_tip="never",
        trash_location=protocol.fixed_trash,
        keep_last_tip=True,
        tip_racks=[tip_rack_1, tip_rack_2],
        liquid_class=protocol.define_liquid_class(
            name="consolidate_step_23",
            properties={"p10_single": {"opentrons/opentrons_96_tiprack_10ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 1},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 5)],
                    "pre_wet": True,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "mix": {"enabled": True, "repetitions": 3, "volume": 3},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
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
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 1},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 10)],
                    "delay": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
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
                        "speed": 125,
                        "touch_tip": {
                            "enabled": True,
                            "z_offset": -1,
                            "mm_from_edge": 0,
                            "speed": 400,
                        },
                        "blowout": {"enabled": True, "location": "trash", "flow_rate": 31},
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 0)],
                    "mix": {"enabled": True, "repetitions": 2, "volume": 2},
                },
            }}},
        ),
    )

    # Step 25: C Height & Speed
    # Asp at half height, slow. touch tip at half height. Disp fast. Blow out dest.  
    pipette_left.consolidate_with_liquid_class(
        volume=5,
        source=[reservoir_1["A1"], reservoir_1["A2"]],
        dest=[well_plate_1["A9"]],
        new_tip="never",
        trash_location=protocol.fixed_trash,
        keep_last_tip=True,
        tip_racks=[tip_rack_1, tip_rack_2],
        liquid_class=protocol.define_liquid_class(
            name="consolidate_step_25",
            properties={"p10_single": {"opentrons/opentrons_96_tiprack_10ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 1},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 10)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "mix": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
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
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 10},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 5)],
                    "delay": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
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
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": True, "location": "destination", "flow_rate": 31},
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 0)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
    )
    pipette_left.drop_tip()

    # Step 26: C Height & Speed
    # Asp at half height, slow. touch tip at half height. Disp fast. Blow out dest.  
    pipette_right.consolidate_with_liquid_class(
        volume=5,
        source=[reservoir_1["A1"], reservoir_1["A2"]],
        dest=[well_plate_1["A8"]],
        new_tip="never",
        trash_location=protocol.fixed_trash,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_1, tip_rack_2],
        liquid_class=protocol.define_liquid_class(
            name="consolidate_step_26",
            properties={"p10_multi": {"opentrons/opentrons_96_tiprack_10ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 1},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 5)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "mix": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
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
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 10},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 10)],
                    "delay": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
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
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": True, "location": "destination", "flow_rate": 31},
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 0)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
    )
    pipette_right.drop_tip()

    # Step 27: C change tip always
    # change tip always
    pipette_left.transfer_with_liquid_class(
        volume=10,
        source=[reservoir_1["A1"], reservoir_1["A2"]],
        dest=[well_plate_1["A9"], well_plate_1["A9"]],
        new_tip="always",
        trash_location=protocol.fixed_trash,
        keep_last_tip=True,
        tip_racks=[tip_rack_1, tip_rack_2],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_27",
            properties={"p10_single": {"opentrons/opentrons_96_tiprack_10ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 1},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 5)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "mix": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
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
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 1},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 10)],
                    "delay": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
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
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": False},
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 0)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
    )
    pipette_left.drop_tip()

    # Step 28: C change tip always
    # change tip always
    pipette_right.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette_right.transfer_with_liquid_class(
        volume=10,
        source=[reservoir_1["A1"], reservoir_1["A2"]],
        dest=[well_plate_1["A8"], well_plate_1["A8"]],
        new_tip="always",
        trash_location=protocol.fixed_trash,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_1, tip_rack_2],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_28",
            properties={"p10_multi": {"opentrons/opentrons_96_tiprack_10ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 1},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 5)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "mix": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
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
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 1},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 10)],
                    "delay": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
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
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": False},
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 0)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
    )
    pipette_right.drop_tip()

    # Step 29: C change tip once
    # change tip once
    pipette_left.transfer_with_liquid_class(
        volume=10,
        source=[reservoir_1["A1"], reservoir_1["A2"]],
        dest=[well_plate_1["A9"], well_plate_1["A9"]],
        new_tip="once",
        trash_location=protocol.fixed_trash,
        keep_last_tip=True,
        tip_racks=[tip_rack_1, tip_rack_2],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_29",
            properties={"p10_single": {"opentrons/opentrons_96_tiprack_10ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 1},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 5)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "mix": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
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
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 1},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 10)],
                    "delay": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
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
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": False},
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 0)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
    )

    # Step 30: C change tip once
    # change tip once
    pipette_right.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette_right.transfer_with_liquid_class(
        volume=10,
        source=[reservoir_1["A1"], reservoir_1["A2"]],
        dest=[well_plate_1["A8"], well_plate_1["A8"]],
        new_tip="once",
        trash_location=protocol.fixed_trash,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_1, tip_rack_2],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_30",
            properties={"p10_multi": {"opentrons/opentrons_96_tiprack_10ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 1},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 5)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "mix": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
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
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 1},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 10)],
                    "delay": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
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
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": False},
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 0)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
    )

    # Step 31: Basic Mix
    pipette_left.mix(
        repetitions=4,
        volume=4,
        location=well_plate_1["A9"].bottom(z=1),
        aspirate_flow_rate=5,
        dispense_flow_rate=10,
        final_push_out=0,
    )

    # Step 32: M misc settings
    # Blow out, touch tip
    pipette_left.mix(
        repetitions=4,
        volume=4,
        location=well_plate_1["A9"].bottom(z=1),
        aspirate_flow_rate=5,
        dispense_flow_rate=10,
        final_push_out=0,
    )
    pipette_left.touch_tip(well_plate_1["A9"], v_offset=-1)
    pipette_left.flow_rate.blow_out = 31
    pipette_left.blow_out(protocol.fixed_trash)

    # Step 33: M misc settings
    # Blow out, touch tip
    pipette_right.mix(
        repetitions=4,
        volume=4,
        location=well_plate_1["A8"].bottom(z=1),
        aspirate_flow_rate=5,
        dispense_flow_rate=10,
        final_push_out=0,
    )
    pipette_right.touch_tip(well_plate_1["A8"], v_offset=-1)
    pipette_right.flow_rate.blow_out = 31
    pipette_right.blow_out(protocol.fixed_trash)

    # Step 34: M Height & Speed
    # Asp at half height, slow. Touch tip half height. Disp fast. Blow out destination wells. 
    pipette_left.mix(
        repetitions=4,
        volume=4,
        location=well_plate_1["A9"].bottom(z=5),
        aspirate_flow_rate=10,
        dispense_flow_rate=5,
        final_push_out=0,
    )
    pipette_left.flow_rate.blow_out = 31
    pipette_left.blow_out(well_plate_1["A9"].top())
    pipette_left.touch_tip(well_plate_1["A9"], v_offset=-5.4)
    pipette_left.drop_tip()

    # Step 35: M Height & Speed
    # Asp at half height, slow. Touch tip half height. Disp fast. Blow out destination wells. 
    pipette_right.mix(
        repetitions=4,
        volume=4,
        location=well_plate_1["A8"].bottom(z=5),
        aspirate_flow_rate=5,
        dispense_flow_rate=10,
        final_push_out=0,
    )
    pipette_right.flow_rate.blow_out = 31
    pipette_right.blow_out(well_plate_1["A8"].top())
    pipette_right.touch_tip(well_plate_1["A8"], v_offset=-5.4)
    pipette_right.drop_tip()

    # Step 36: M Change tip always
    pipette_left.pick_up_tip(location=tip_rack_1)
    pipette_left.mix(
        repetitions=2,
        volume=2,
        location=well_plate_1["A7"].bottom(z=1),
        aspirate_flow_rate=5,
        dispense_flow_rate=10,
        final_push_out=0,
    )
    pipette_left.drop_tip()
    pipette_left.pick_up_tip(location=tip_rack_1)
    pipette_left.mix(
        repetitions=2,
        volume=2,
        location=well_plate_1["A8"].bottom(z=1),
        aspirate_flow_rate=5,
        dispense_flow_rate=10,
        final_push_out=0,
    )
    pipette_left.drop_tip()
    pipette_left.pick_up_tip(location=tip_rack_1)
    pipette_left.mix(
        repetitions=2,
        volume=2,
        location=well_plate_1["A9"].bottom(z=1),
        aspirate_flow_rate=5,
        dispense_flow_rate=10,
        final_push_out=0,
    )
    pipette_left.drop_tip()

    # Step 37: M Change tip always
    pipette_right.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette_right.pick_up_tip(location=tip_rack_2)
    pipette_right.mix(
        repetitions=2,
        volume=2,
        location=well_plate_1["A6"].bottom(z=1),
        aspirate_flow_rate=5,
        dispense_flow_rate=10,
        final_push_out=0,
    )
    pipette_right.drop_tip()
    pipette_right.pick_up_tip(location=tip_rack_2)
    pipette_right.mix(
        repetitions=2,
        volume=2,
        location=well_plate_1["A7"].bottom(z=1),
        aspirate_flow_rate=5,
        dispense_flow_rate=10,
        final_push_out=0,
    )
    pipette_right.drop_tip()
    pipette_right.pick_up_tip(location=tip_rack_2)
    pipette_right.mix(
        repetitions=2,
        volume=2,
        location=well_plate_1["A8"].bottom(z=1),
        aspirate_flow_rate=5,
        dispense_flow_rate=10,
        final_push_out=0,
    )
    pipette_right.drop_tip()

    # Step 38: M Change tip once
    pipette_left.pick_up_tip(location=tip_rack_1)
    pipette_left.mix(
        repetitions=2,
        volume=2,
        location=well_plate_1["A7"].bottom(z=1),
        aspirate_flow_rate=5,
        dispense_flow_rate=10,
        final_push_out=0,
    )
    pipette_left.mix(
        repetitions=2,
        volume=2,
        location=well_plate_1["A8"].bottom(z=1),
        aspirate_flow_rate=5,
        dispense_flow_rate=10,
        final_push_out=0,
    )
    pipette_left.mix(
        repetitions=2,
        volume=2,
        location=well_plate_1["A9"].bottom(z=1),
        aspirate_flow_rate=5,
        dispense_flow_rate=10,
        final_push_out=0,
    )
    pipette_left.drop_tip()

    # Step 39: M Change tip once
    pipette_right.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette_right.pick_up_tip(location=tip_rack_2)
    pipette_right.mix(
        repetitions=2,
        volume=2,
        location=well_plate_1["A6"].bottom(z=1),
        aspirate_flow_rate=5,
        dispense_flow_rate=10,
        final_push_out=0,
    )
    pipette_right.mix(
        repetitions=2,
        volume=2,
        location=well_plate_1["A7"].bottom(z=1),
        aspirate_flow_rate=5,
        dispense_flow_rate=10,
        final_push_out=0,
    )
    pipette_right.mix(
        repetitions=2,
        volume=2,
        location=well_plate_1["A8"].bottom(z=1),
        aspirate_flow_rate=5,
        dispense_flow_rate=10,
        final_push_out=0,
    )
    pipette_right.drop_tip()

    # Step 41: Pause
    protocol.pause("OK HOPEFULLY YOU ARE DONE")

DESIGNER_APPLICATION = """{"robot":{"model":"OT-2 Standard"},"designerApplication":{"name":"opentrons/protocol-designer","version":"8.8.0","data":{"pipetteTiprackAssignments":{"01217420-180a-11e9-9608-8bed9be8868f":["opentrons/opentrons_96_tiprack_10ul/1"],"01217421-180a-11e9-9608-8bed9be8868f":["opentrons/opentrons_96_tiprack_10ul/1"]},"dismissedWarnings":{"form":[],"timeline":[]},"ingredients":{"0":{"displayName":"Liquid","description":null,"liquidGroupId":"0","displayColor":"#b925ff","liquidClass":null}},"ingredLocations":{"0bc091e0-180a-11e9-9608-8bed9be8868f:opentrons/usascientific_12_reservoir_22ml/4":{"A1":{"0":{"volume":12000}},"A2":{"0":{"volume":1200}},"A3":{"0":{"volume":1200}}},"cea1c650-1811-11e9-9608-8bed9be8868f:opentrons/opentrons_96_tiprack_10ul/1":{}},"savedStepForms":{"__INITIAL_DECK_SETUP_STEP__":{"stepType":"manualIntervention","id":"__INITIAL_DECK_SETUP_STEP__","labwareLocationUpdate":{"0121e950-180a-11e9-9608-8bed9be8868f:opentrons/opentrons_96_tiprack_10ul/1":"1","0bc091e0-180a-11e9-9608-8bed9be8868f:opentrons/usascientific_12_reservoir_22ml/4":"7","3c1a31c0-180a-11e9-9608-8bed9be8868f:opentrons/corning_96_wellplate_360ul_flat/5":"8","cea1c650-1811-11e9-9608-8bed9be8868f:opentrons/opentrons_96_tiprack_10ul/1":"2"},"pipetteLocationUpdate":{"01217420-180a-11e9-9608-8bed9be8868f":"left","01217421-180a-11e9-9608-8bed9be8868f":"right"},"stagingAreaLocationUpdate":{},"gripperLocationUpdate":{},"wasteChuteLocationUpdate":{},"trashBinLocationUpdate":{"065e3277-9c81-4efb-a046-839022fa53b1:trashBin":"cutout12"},"moduleStateUpdate":{}},"3fcb79f0-180a-11e9-9608-8bed9be8868f":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":null,"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":5,"aspirate_labware":"0bc091e0-180a-11e9-9608-8bed9be8868f:opentrons/usascientific_12_reservoir_22ml/4","aspirate_mix_checkbox":false,"aspirate_mix_times":null,"aspirate_mix_volume":null,"aspirate_mmFromBottom":1,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":125,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":125,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":400,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":31,"blowout_location":"065e3277-9c81-4efb-a046-839022fa53b1:trashBin","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":null,"dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":10,"dispense_labware":"3c1a31c0-180a-11e9-9608-8bed9be8868f:opentrons/corning_96_wellplate_360ul_flat/5","dispense_mix_checkbox":false,"dispense_mix_times":null,"dispense_mix_volume":null,"dispense_mmFromBottom":1,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":125,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":125,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":400,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":null,"dropTip_location":"065e3277-9c81-4efb-a046-839022fa53b1:trashBin","liquidClassesSupported":false,"liquidClass":"none","nozzles":"SINGLE","path":"single","pipette":"01217420-180a-11e9-9608-8bed9be8868f","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":0,"tipRack":"opentrons/opentrons_96_tiprack_10ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"10","stepType":"moveLiquid","stepName":"Basic Transfer","stepDetails":"","id":"3fcb79f0-180a-11e9-9608-8bed9be8868f","dispense_touchTip_mmfromTop":null},"4eab2790-180a-11e9-9608-8bed9be8868f":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":null,"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":5,"aspirate_labware":"0bc091e0-180a-11e9-9608-8bed9be8868f:opentrons/usascientific_12_reservoir_22ml/4","aspirate_mix_checkbox":true,"aspirate_mix_times":"3","aspirate_mix_volume":"3","aspirate_mmFromBottom":1,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":125,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":125,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":400,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":true,"blowout_flowRate":31,"blowout_location":"065e3277-9c81-4efb-a046-839022fa53b1:trashBin","changeTip":"never","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":null,"dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":10,"dispense_labware":"3c1a31c0-180a-11e9-9608-8bed9be8868f:opentrons/corning_96_wellplate_360ul_flat/5","dispense_mix_checkbox":true,"dispense_mix_times":"3","dispense_mix_volume":"5","dispense_mmFromBottom":1,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":125,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":125,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":true,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":400,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["B1"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":null,"dropTip_location":"065e3277-9c81-4efb-a046-839022fa53b1:trashBin","liquidClassesSupported":false,"liquidClass":"none","nozzles":"SINGLE","path":"single","pipette":"01217420-180a-11e9-9608-8bed9be8868f","preWetTip":true,"pushOut_checkbox":false,"pushOut_volume":0,"tipRack":"opentrons/opentrons_96_tiprack_10ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"10","stepType":"moveLiquid","stepName":"T misc. settings","stepDetails":"Pre-wet, touch tip, mix, blow out, new tip never","id":"4eab2790-180a-11e9-9608-8bed9be8868f","dispense_touchTip_mmfromTop":null},"78502a50-180a-11e9-9608-8bed9be8868f":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":null,"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":10,"aspirate_labware":"0bc091e0-180a-11e9-9608-8bed9be8868f:opentrons/usascientific_12_reservoir_22ml/4","aspirate_mix_checkbox":false,"aspirate_mix_times":null,"aspirate_mix_volume":null,"aspirate_mmFromBottom":18,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":125,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":125,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":400,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":31,"blowout_location":"065e3277-9c81-4efb-a046-839022fa53b1:trashBin","changeTip":"never","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":null,"dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":2,"dispense_labware":"3c1a31c0-180a-11e9-9608-8bed9be8868f:opentrons/corning_96_wellplate_360ul_flat/5","dispense_mix_checkbox":false,"dispense_mix_times":null,"dispense_mix_volume":null,"dispense_mmFromBottom":10,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":125,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":125,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":400,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["C1"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":null,"dropTip_location":"065e3277-9c81-4efb-a046-839022fa53b1:trashBin","liquidClassesSupported":false,"liquidClass":"none","nozzles":"SINGLE","path":"single","pipette":"01217420-180a-11e9-9608-8bed9be8868f","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":0,"tipRack":"opentrons/opentrons_96_tiprack_10ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"10","stepType":"moveLiquid","stepName":"T height & speed","stepDetails":"Asp should be half way to top and slow. Touch tip half way to top. Disp should be at the top and slow","id":"78502a50-180a-11e9-9608-8bed9be8868f","dispense_touchTip_mmfromTop":null},"3353af20-180b-11e9-9608-8bed9be8868f":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":null,"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":5,"aspirate_labware":"0bc091e0-180a-11e9-9608-8bed9be8868f:opentrons/usascientific_12_reservoir_22ml/4","aspirate_mix_checkbox":false,"aspirate_mix_times":null,"aspirate_mix_volume":null,"aspirate_mmFromBottom":1,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":125,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":125,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":400,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1","A2","A3"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":31,"blowout_location":"065e3277-9c81-4efb-a046-839022fa53b1:trashBin","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":null,"dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":10,"dispense_labware":"3c1a31c0-180a-11e9-9608-8bed9be8868f:opentrons/corning_96_wellplate_360ul_flat/5","dispense_mix_checkbox":false,"dispense_mix_times":null,"dispense_mix_volume":null,"dispense_mmFromBottom":1,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":125,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":125,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":400,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["D1","E1","F1"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":null,"dropTip_location":"065e3277-9c81-4efb-a046-839022fa53b1:trashBin","liquidClassesSupported":false,"liquidClass":"none","nozzles":"SINGLE","path":"single","pipette":"01217420-180a-11e9-9608-8bed9be8868f","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":0,"tipRack":"opentrons/opentrons_96_tiprack_10ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"10","stepType":"moveLiquid","stepName":"T change tip always","stepDetails":"Change tip always","id":"3353af20-180b-11e9-9608-8bed9be8868f","dispense_touchTip_mmfromTop":null},"5d0f4720-180b-11e9-9608-8bed9be8868f":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":null,"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":5,"aspirate_labware":"0bc091e0-180a-11e9-9608-8bed9be8868f:opentrons/usascientific_12_reservoir_22ml/4","aspirate_mix_checkbox":false,"aspirate_mix_times":null,"aspirate_mix_volume":null,"aspirate_mmFromBottom":1,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":125,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":125,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":400,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1","A2","A3"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":31,"blowout_location":"065e3277-9c81-4efb-a046-839022fa53b1:trashBin","changeTip":"once","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":null,"dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":10,"dispense_labware":"3c1a31c0-180a-11e9-9608-8bed9be8868f:opentrons/corning_96_wellplate_360ul_flat/5","dispense_mix_checkbox":false,"dispense_mix_times":null,"dispense_mix_volume":null,"dispense_mmFromBottom":1,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":125,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":125,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":400,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["G1","H1","A2"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":null,"dropTip_location":"065e3277-9c81-4efb-a046-839022fa53b1:trashBin","liquidClassesSupported":false,"liquidClass":"none","nozzles":"SINGLE","path":"single","pipette":"01217420-180a-11e9-9608-8bed9be8868f","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":0,"tipRack":"opentrons/opentrons_96_tiprack_10ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"10","stepType":"moveLiquid","stepName":"T change tip once","stepDetails":"Change tip once","id":"5d0f4720-180b-11e9-9608-8bed9be8868f","dispense_touchTip_mmfromTop":null},"486cb9f0-180c-11e9-9608-8bed9be8868f":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":null,"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":5,"aspirate_labware":"0bc091e0-180a-11e9-9608-8bed9be8868f:opentrons/usascientific_12_reservoir_22ml/4","aspirate_mix_checkbox":false,"aspirate_mix_times":null,"aspirate_mix_volume":null,"aspirate_mmFromBottom":1,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":125,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":125,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":400,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":31,"blowout_location":"065e3277-9c81-4efb-a046-839022fa53b1:trashBin","changeTip":"never","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":null,"dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":10,"dispense_labware":"3c1a31c0-180a-11e9-9608-8bed9be8868f:opentrons/corning_96_wellplate_360ul_flat/5","dispense_mix_checkbox":false,"dispense_mix_times":null,"dispense_mix_volume":null,"dispense_mmFromBottom":1,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":125,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":125,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":400,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A4","B4"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":true,"disposalVolume_volume":1,"dropTip_location":"065e3277-9c81-4efb-a046-839022fa53b1:trashBin","liquidClassesSupported":false,"liquidClass":"none","nozzles":"SINGLE","path":"single","pipette":"01217420-180a-11e9-9608-8bed9be8868f","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":0,"tipRack":"opentrons/opentrons_96_tiprack_10ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"5","stepType":"moveLiquid","stepName":"Basic Distribute","stepDetails":"","id":"486cb9f0-180c-11e9-9608-8bed9be8868f","dispense_touchTip_mmfromTop":null},"97f2d9a0-180c-11e9-9608-8bed9be8868f":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":null,"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":5,"aspirate_labware":"0bc091e0-180a-11e9-9608-8bed9be8868f:opentrons/usascientific_12_reservoir_22ml/4","aspirate_mix_checkbox":true,"aspirate_mix_times":"3","aspirate_mix_volume":"3","aspirate_mmFromBottom":1,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":125,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":125,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":400,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":31,"blowout_location":"065e3277-9c81-4efb-a046-839022fa53b1:trashBin","changeTip":"never","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":null,"dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":10,"dispense_labware":"3c1a31c0-180a-11e9-9608-8bed9be8868f:opentrons/corning_96_wellplate_360ul_flat/5","dispense_mix_checkbox":true,"dispense_mix_times":"5","dispense_mix_volume":null,"dispense_mmFromBottom":1,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":125,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":125,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":true,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":400,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A5","B5"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":true,"disposalVolume_volume":1,"dropTip_location":"065e3277-9c81-4efb-a046-839022fa53b1:trashBin","liquidClassesSupported":false,"liquidClass":"none","nozzles":"SINGLE","path":"single","pipette":"01217420-180a-11e9-9608-8bed9be8868f","preWetTip":true,"pushOut_checkbox":false,"pushOut_volume":0,"tipRack":"opentrons/opentrons_96_tiprack_10ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"10","stepType":"moveLiquid","stepName":"D misc. settings","stepDetails":"pre-wet, touch tip, mix, NO disposal vol, change tip never. \nShould take 2 aspirates to complete. ","id":"97f2d9a0-180c-11e9-9608-8bed9be8868f","dispense_touchTip_mmfromTop":null},"aa2de740-180c-11e9-9608-8bed9be8868f":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":null,"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":5,"aspirate_labware":"0bc091e0-180a-11e9-9608-8bed9be8868f:opentrons/usascientific_12_reservoir_22ml/4","aspirate_mix_checkbox":false,"aspirate_mix_times":null,"aspirate_mix_volume":null,"aspirate_mmFromBottom":1,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":125,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":125,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":400,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":31,"blowout_location":"065e3277-9c81-4efb-a046-839022fa53b1:trashBin","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":null,"dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":10,"dispense_labware":"3c1a31c0-180a-11e9-9608-8bed9be8868f:opentrons/corning_96_wellplate_360ul_flat/5","dispense_mix_checkbox":false,"dispense_mix_times":null,"dispense_mix_volume":null,"dispense_mmFromBottom":1,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":125,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":125,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":400,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":null,"dropTip_location":"065e3277-9c81-4efb-a046-839022fa53b1:trashBin","liquidClassesSupported":false,"liquidClass":"none","nozzles":"ALL","path":"single","pipette":"01217421-180a-11e9-9608-8bed9be8868f","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":0,"tipRack":"opentrons/opentrons_96_tiprack_10ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"10","stepType":"moveLiquid","stepName":"Basic Transfer","stepDetails":"","id":"aa2de740-180c-11e9-9608-8bed9be8868f","dispense_touchTip_mmfromTop":null},"b4ad20f0-180c-11e9-9608-8bed9be8868f":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":null,"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":5,"aspirate_labware":"0bc091e0-180a-11e9-9608-8bed9be8868f:opentrons/usascientific_12_reservoir_22ml/4","aspirate_mix_checkbox":true,"aspirate_mix_times":"3","aspirate_mix_volume":"3","aspirate_mmFromBottom":1,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":125,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":125,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":400,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":true,"blowout_flowRate":31,"blowout_location":"065e3277-9c81-4efb-a046-839022fa53b1:trashBin","changeTip":"never","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":null,"dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":10,"dispense_labware":"3c1a31c0-180a-11e9-9608-8bed9be8868f:opentrons/corning_96_wellplate_360ul_flat/5","dispense_mix_checkbox":true,"dispense_mix_times":"3","dispense_mix_volume":null,"dispense_mmFromBottom":1,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":125,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":125,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":true,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":400,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":null,"dropTip_location":"065e3277-9c81-4efb-a046-839022fa53b1:trashBin","liquidClassesSupported":false,"liquidClass":"none","nozzles":"ALL","path":"single","pipette":"01217421-180a-11e9-9608-8bed9be8868f","preWetTip":true,"pushOut_checkbox":false,"pushOut_volume":0,"tipRack":"opentrons/opentrons_96_tiprack_10ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"10","stepType":"moveLiquid","stepName":"T Misc. settings","stepDetails":"Pre-wet, touch tip, mix, blow out, new tip never","id":"b4ad20f0-180c-11e9-9608-8bed9be8868f","dispense_touchTip_mmfromTop":null},"c07fdcb0-180c-11e9-9608-8bed9be8868f":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":null,"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":5,"aspirate_labware":"0bc091e0-180a-11e9-9608-8bed9be8868f:opentrons/usascientific_12_reservoir_22ml/4","aspirate_mix_checkbox":false,"aspirate_mix_times":null,"aspirate_mix_volume":null,"aspirate_mmFromBottom":18,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":125,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":125,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":400,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":31,"blowout_location":"065e3277-9c81-4efb-a046-839022fa53b1:trashBin","changeTip":"never","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":null,"dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":10,"dispense_labware":"3c1a31c0-180a-11e9-9608-8bed9be8868f:opentrons/corning_96_wellplate_360ul_flat/5","dispense_mix_checkbox":false,"dispense_mix_times":null,"dispense_mix_volume":null,"dispense_mmFromBottom":10,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":125,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":125,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":400,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":null,"dropTip_location":"065e3277-9c81-4efb-a046-839022fa53b1:trashBin","liquidClassesSupported":false,"liquidClass":"none","nozzles":"ALL","path":"single","pipette":"01217421-180a-11e9-9608-8bed9be8868f","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":0,"tipRack":"opentrons/opentrons_96_tiprack_10ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"10","stepType":"moveLiquid","stepName":"T height & speed","stepDetails":"Asp should be half way to top and slow, Disp should be at the top and slow","id":"c07fdcb0-180c-11e9-9608-8bed9be8868f","dispense_touchTip_mmfromTop":null},"cd20e4f0-180c-11e9-9608-8bed9be8868f":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":null,"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":5,"aspirate_labware":"0bc091e0-180a-11e9-9608-8bed9be8868f:opentrons/usascientific_12_reservoir_22ml/4","aspirate_mix_checkbox":false,"aspirate_mix_times":null,"aspirate_mix_volume":null,"aspirate_mmFromBottom":1,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":125,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":125,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":400,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1","A2","A3"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":31,"blowout_location":"065e3277-9c81-4efb-a046-839022fa53b1:trashBin","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":null,"dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":10,"dispense_labware":"3c1a31c0-180a-11e9-9608-8bed9be8868f:opentrons/corning_96_wellplate_360ul_flat/5","dispense_mix_checkbox":false,"dispense_mix_times":null,"dispense_mix_volume":null,"dispense_mmFromBottom":1,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":125,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":125,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":400,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1","A2","A3"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":null,"dropTip_location":"065e3277-9c81-4efb-a046-839022fa53b1:trashBin","liquidClassesSupported":false,"liquidClass":"none","nozzles":"ALL","path":"single","pipette":"01217421-180a-11e9-9608-8bed9be8868f","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":0,"tipRack":"opentrons/opentrons_96_tiprack_10ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"10","stepType":"moveLiquid","stepName":"T change tip always","stepDetails":"Change tip always","id":"cd20e4f0-180c-11e9-9608-8bed9be8868f","dispense_touchTip_mmfromTop":null},"d8eb8a60-180c-11e9-9608-8bed9be8868f":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":null,"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":5,"aspirate_labware":"0bc091e0-180a-11e9-9608-8bed9be8868f:opentrons/usascientific_12_reservoir_22ml/4","aspirate_mix_checkbox":false,"aspirate_mix_times":null,"aspirate_mix_volume":null,"aspirate_mmFromBottom":1,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":125,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":125,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":400,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1","A2","A3"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":31,"blowout_location":"065e3277-9c81-4efb-a046-839022fa53b1:trashBin","changeTip":"once","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":null,"dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":10,"dispense_labware":"3c1a31c0-180a-11e9-9608-8bed9be8868f:opentrons/corning_96_wellplate_360ul_flat/5","dispense_mix_checkbox":false,"dispense_mix_times":null,"dispense_mix_volume":null,"dispense_mmFromBottom":1,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":125,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":125,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":400,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1","A2","A3"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":null,"dropTip_location":"065e3277-9c81-4efb-a046-839022fa53b1:trashBin","liquidClassesSupported":false,"liquidClass":"none","nozzles":"ALL","path":"single","pipette":"01217421-180a-11e9-9608-8bed9be8868f","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":0,"tipRack":"opentrons/opentrons_96_tiprack_10ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"10","stepType":"moveLiquid","stepName":"T change tip once","stepDetails":"Change tip once","id":"d8eb8a60-180c-11e9-9608-8bed9be8868f","dispense_touchTip_mmfromTop":null},"516f2230-180d-11e9-9608-8bed9be8868f":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":null,"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":5,"aspirate_labware":"0bc091e0-180a-11e9-9608-8bed9be8868f:opentrons/usascientific_12_reservoir_22ml/4","aspirate_mix_checkbox":false,"aspirate_mix_times":null,"aspirate_mix_volume":null,"aspirate_mmFromBottom":20,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":125,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":125,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":400,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":31,"blowout_location":"065e3277-9c81-4efb-a046-839022fa53b1:trashBin","changeTip":"never","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":null,"dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":10,"dispense_labware":"3c1a31c0-180a-11e9-9608-8bed9be8868f:opentrons/corning_96_wellplate_360ul_flat/5","dispense_mix_checkbox":false,"dispense_mix_times":null,"dispense_mix_volume":null,"dispense_mmFromBottom":10,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":125,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":125,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":400,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["C5","D5"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":true,"disposalVolume_volume":1,"dropTip_location":"065e3277-9c81-4efb-a046-839022fa53b1:trashBin","liquidClassesSupported":false,"liquidClass":"none","nozzles":"SINGLE","path":"single","pipette":"01217420-180a-11e9-9608-8bed9be8868f","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":0,"tipRack":"opentrons/opentrons_96_tiprack_10ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"10","stepType":"moveLiquid","stepName":"D Height & Speed","stepDetails":"Asp at halfway height slow. Touch tip at halfway height. Disp at halfway height fast. ","id":"516f2230-180d-11e9-9608-8bed9be8868f","dispense_touchTip_mmfromTop":null},"48f0cc20-180e-11e9-9608-8bed9be8868f":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":null,"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":5,"aspirate_labware":"0bc091e0-180a-11e9-9608-8bed9be8868f:opentrons/usascientific_12_reservoir_22ml/4","aspirate_mix_checkbox":false,"aspirate_mix_times":null,"aspirate_mix_volume":null,"aspirate_mmFromBottom":1,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":125,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":125,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":400,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":31,"blowout_location":"source_well","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":null,"dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":10,"dispense_labware":"3c1a31c0-180a-11e9-9608-8bed9be8868f:opentrons/corning_96_wellplate_360ul_flat/5","dispense_mix_checkbox":false,"dispense_mix_times":null,"dispense_mix_volume":null,"dispense_mmFromBottom":1,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":125,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":125,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":400,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["E4","F4"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":true,"disposalVolume_volume":1,"dropTip_location":"065e3277-9c81-4efb-a046-839022fa53b1:trashBin","liquidClassesSupported":false,"liquidClass":"none","nozzles":"SINGLE","path":"single","pipette":"01217420-180a-11e9-9608-8bed9be8868f","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":0,"tipRack":"opentrons/opentrons_96_tiprack_10ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"10","stepType":"moveLiquid","stepName":"D change tip always, disp vol sour","stepDetails":"Change tip always, disposal volume in source","id":"48f0cc20-180e-11e9-9608-8bed9be8868f","dispense_touchTip_mmfromTop":null},"dd0c4b50-180e-11e9-9608-8bed9be8868f":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":null,"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":5,"aspirate_labware":"0bc091e0-180a-11e9-9608-8bed9be8868f:opentrons/usascientific_12_reservoir_22ml/4","aspirate_mix_checkbox":false,"aspirate_mix_times":null,"aspirate_mix_volume":null,"aspirate_mmFromBottom":1,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":125,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":125,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":400,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":31,"blowout_location":"065e3277-9c81-4efb-a046-839022fa53b1:trashBin","changeTip":"once","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":null,"dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":10,"dispense_labware":"3c1a31c0-180a-11e9-9608-8bed9be8868f:opentrons/corning_96_wellplate_360ul_flat/5","dispense_mix_checkbox":false,"dispense_mix_times":null,"dispense_mix_volume":null,"dispense_mmFromBottom":1,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":125,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":125,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":400,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["E4","F4"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":true,"disposalVolume_volume":1,"dropTip_location":"065e3277-9c81-4efb-a046-839022fa53b1:trashBin","liquidClassesSupported":false,"liquidClass":"none","nozzles":"SINGLE","path":"single","pipette":"01217420-180a-11e9-9608-8bed9be8868f","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":0,"tipRack":"opentrons/opentrons_96_tiprack_10ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"5","stepType":"moveLiquid","stepName":"D change tip once","stepDetails":"","id":"dd0c4b50-180e-11e9-9608-8bed9be8868f","dispense_touchTip_mmfromTop":null},"03e90650-180f-11e9-9608-8bed9be8868f":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":null,"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":5,"aspirate_labware":"0bc091e0-180a-11e9-9608-8bed9be8868f:opentrons/usascientific_12_reservoir_22ml/4","aspirate_mix_checkbox":false,"aspirate_mix_times":null,"aspirate_mix_volume":null,"aspirate_mmFromBottom":1,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":125,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":125,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":400,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":31,"blowout_location":"065e3277-9c81-4efb-a046-839022fa53b1:trashBin","changeTip":"never","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":null,"dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":10,"dispense_labware":"3c1a31c0-180a-11e9-9608-8bed9be8868f:opentrons/corning_96_wellplate_360ul_flat/5","dispense_mix_checkbox":false,"dispense_mix_times":null,"dispense_mix_volume":null,"dispense_mmFromBottom":1,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":125,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":125,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":400,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A3","A4"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":true,"disposalVolume_volume":1,"dropTip_location":"065e3277-9c81-4efb-a046-839022fa53b1:trashBin","liquidClassesSupported":false,"liquidClass":"none","nozzles":"ALL","path":"single","pipette":"01217421-180a-11e9-9608-8bed9be8868f","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":0,"tipRack":"opentrons/opentrons_96_tiprack_10ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"5","stepType":"moveLiquid","stepName":"Basic Distribute","stepDetails":"","id":"03e90650-180f-11e9-9608-8bed9be8868f","dispense_touchTip_mmfromTop":null},"2c3a38e0-180f-11e9-9608-8bed9be8868f":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":null,"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":5,"aspirate_labware":"0bc091e0-180a-11e9-9608-8bed9be8868f:opentrons/usascientific_12_reservoir_22ml/4","aspirate_mix_checkbox":true,"aspirate_mix_times":"3","aspirate_mix_volume":"3","aspirate_mmFromBottom":1,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":125,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":125,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":400,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":31,"blowout_location":"065e3277-9c81-4efb-a046-839022fa53b1:trashBin","changeTip":"never","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":null,"dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":10,"dispense_labware":"3c1a31c0-180a-11e9-9608-8bed9be8868f:opentrons/corning_96_wellplate_360ul_flat/5","dispense_mix_checkbox":true,"dispense_mix_times":"5","dispense_mix_volume":null,"dispense_mmFromBottom":1,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":125,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":125,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":true,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":400,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A3","A4"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":true,"disposalVolume_volume":1,"dropTip_location":"065e3277-9c81-4efb-a046-839022fa53b1:trashBin","liquidClassesSupported":false,"liquidClass":"none","nozzles":"ALL","path":"single","pipette":"01217421-180a-11e9-9608-8bed9be8868f","preWetTip":true,"pushOut_checkbox":false,"pushOut_volume":0,"tipRack":"opentrons/opentrons_96_tiprack_10ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"10","stepType":"moveLiquid","stepName":"D misc. settings","stepDetails":"pre-wet, touch tip, mix, NO disposal vol, change tip never. \nShould take 2 aspirates to complete. ","id":"2c3a38e0-180f-11e9-9608-8bed9be8868f","dispense_touchTip_mmfromTop":null},"3d602d00-180f-11e9-9608-8bed9be8868f":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":null,"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":5,"aspirate_labware":"0bc091e0-180a-11e9-9608-8bed9be8868f:opentrons/usascientific_12_reservoir_22ml/4","aspirate_mix_checkbox":false,"aspirate_mix_times":null,"aspirate_mix_volume":null,"aspirate_mmFromBottom":20,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":125,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":125,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":400,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":31,"blowout_location":"065e3277-9c81-4efb-a046-839022fa53b1:trashBin","changeTip":"never","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":null,"dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":10,"dispense_labware":"3c1a31c0-180a-11e9-9608-8bed9be8868f:opentrons/corning_96_wellplate_360ul_flat/5","dispense_mix_checkbox":false,"dispense_mix_times":null,"dispense_mix_volume":null,"dispense_mmFromBottom":10,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":125,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":125,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":400,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A3","A4"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":true,"disposalVolume_volume":1,"dropTip_location":"065e3277-9c81-4efb-a046-839022fa53b1:trashBin","liquidClassesSupported":false,"liquidClass":"none","nozzles":"ALL","path":"single","pipette":"01217421-180a-11e9-9608-8bed9be8868f","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":0,"tipRack":"opentrons/opentrons_96_tiprack_10ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"10","stepType":"moveLiquid","stepName":"D Height & Speed","stepDetails":"Asp at halfway height slow. Touch tip at halfway height. Disp at halfway height fast. ","id":"3d602d00-180f-11e9-9608-8bed9be8868f","dispense_touchTip_mmfromTop":null},"483771c0-180f-11e9-9608-8bed9be8868f":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":null,"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":5,"aspirate_labware":"0bc091e0-180a-11e9-9608-8bed9be8868f:opentrons/usascientific_12_reservoir_22ml/4","aspirate_mix_checkbox":false,"aspirate_mix_times":null,"aspirate_mix_volume":null,"aspirate_mmFromBottom":1,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":125,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":125,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":400,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":31,"blowout_location":"source_well","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":null,"dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":10,"dispense_labware":"3c1a31c0-180a-11e9-9608-8bed9be8868f:opentrons/corning_96_wellplate_360ul_flat/5","dispense_mix_checkbox":false,"dispense_mix_times":null,"dispense_mix_volume":null,"dispense_mmFromBottom":1,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":125,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":125,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":400,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A5","A6"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":true,"disposalVolume_volume":1,"dropTip_location":"065e3277-9c81-4efb-a046-839022fa53b1:trashBin","liquidClassesSupported":false,"liquidClass":"none","nozzles":"ALL","path":"single","pipette":"01217421-180a-11e9-9608-8bed9be8868f","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":0,"tipRack":"opentrons/opentrons_96_tiprack_10ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"10","stepType":"moveLiquid","stepName":"D change tip always, disp vol sour","stepDetails":"Change tip always, disposal volume in source","id":"483771c0-180f-11e9-9608-8bed9be8868f","dispense_touchTip_mmfromTop":null},"58e92040-180f-11e9-9608-8bed9be8868f":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":null,"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":5,"aspirate_labware":"0bc091e0-180a-11e9-9608-8bed9be8868f:opentrons/usascientific_12_reservoir_22ml/4","aspirate_mix_checkbox":false,"aspirate_mix_times":null,"aspirate_mix_volume":null,"aspirate_mmFromBottom":1,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":125,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":125,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":400,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":31,"blowout_location":"065e3277-9c81-4efb-a046-839022fa53b1:trashBin","changeTip":"once","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":null,"dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":10,"dispense_labware":"3c1a31c0-180a-11e9-9608-8bed9be8868f:opentrons/corning_96_wellplate_360ul_flat/5","dispense_mix_checkbox":false,"dispense_mix_times":null,"dispense_mix_volume":null,"dispense_mmFromBottom":1,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":125,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":125,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":400,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A7","A8"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":true,"disposalVolume_volume":1,"dropTip_location":"065e3277-9c81-4efb-a046-839022fa53b1:trashBin","liquidClassesSupported":false,"liquidClass":"none","nozzles":"ALL","path":"single","pipette":"01217421-180a-11e9-9608-8bed9be8868f","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":0,"tipRack":"opentrons/opentrons_96_tiprack_10ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"5","stepType":"moveLiquid","stepName":"D change tip once","stepDetails":"","id":"58e92040-180f-11e9-9608-8bed9be8868f","dispense_touchTip_mmfromTop":null},"a898c0f0-180f-11e9-9608-8bed9be8868f":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":null,"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":5,"aspirate_labware":"0bc091e0-180a-11e9-9608-8bed9be8868f:opentrons/usascientific_12_reservoir_22ml/4","aspirate_mix_checkbox":false,"aspirate_mix_times":null,"aspirate_mix_volume":null,"aspirate_mmFromBottom":1,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":125,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":125,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":400,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1","A2"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":31,"blowout_location":"065e3277-9c81-4efb-a046-839022fa53b1:trashBin","changeTip":"never","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":null,"dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":10,"dispense_labware":"3c1a31c0-180a-11e9-9608-8bed9be8868f:opentrons/corning_96_wellplate_360ul_flat/5","dispense_mix_checkbox":false,"dispense_mix_times":null,"dispense_mix_volume":null,"dispense_mmFromBottom":1,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":125,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":125,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":400,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A9"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":null,"dropTip_location":"065e3277-9c81-4efb-a046-839022fa53b1:trashBin","liquidClassesSupported":false,"liquidClass":"none","nozzles":"SINGLE","path":"multiAspirate","pipette":"01217420-180a-11e9-9608-8bed9be8868f","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":0,"tipRack":"opentrons/opentrons_96_tiprack_10ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"5","stepType":"moveLiquid","stepName":"Basic consolidate","stepDetails":"","id":"a898c0f0-180f-11e9-9608-8bed9be8868f","dispense_touchTip_mmfromTop":null},"2c3fc1b0-1810-11e9-9608-8bed9be8868f":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":null,"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":5,"aspirate_labware":"0bc091e0-180a-11e9-9608-8bed9be8868f:opentrons/usascientific_12_reservoir_22ml/4","aspirate_mix_checkbox":true,"aspirate_mix_times":"3","aspirate_mix_volume":"3","aspirate_mmFromBottom":1,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":125,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":125,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":400,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1","A2"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":true,"blowout_flowRate":31,"blowout_location":"065e3277-9c81-4efb-a046-839022fa53b1:trashBin","changeTip":"never","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":null,"dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":10,"dispense_labware":"3c1a31c0-180a-11e9-9608-8bed9be8868f:opentrons/corning_96_wellplate_360ul_flat/5","dispense_mix_checkbox":true,"dispense_mix_times":"2","dispense_mix_volume":"2","dispense_mmFromBottom":1,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":125,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":125,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":true,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":400,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A9"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":null,"dropTip_location":"065e3277-9c81-4efb-a046-839022fa53b1:trashBin","liquidClassesSupported":false,"liquidClass":"none","nozzles":"SINGLE","path":"multiAspirate","pipette":"01217420-180a-11e9-9608-8bed9be8868f","preWetTip":true,"pushOut_checkbox":false,"pushOut_volume":0,"tipRack":"opentrons/opentrons_96_tiprack_10ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"5","stepType":"moveLiquid","stepName":"C Misc settings","stepDetails":"Pre wet, touch tip, mix, change tip never, blow out trash","id":"2c3fc1b0-1810-11e9-9608-8bed9be8868f","dispense_touchTip_mmfromTop":null},"6ee38a60-1810-11e9-9608-8bed9be8868f":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":null,"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":10,"aspirate_labware":"0bc091e0-180a-11e9-9608-8bed9be8868f:opentrons/usascientific_12_reservoir_22ml/4","aspirate_mix_checkbox":false,"aspirate_mix_times":"3","aspirate_mix_volume":"3","aspirate_mmFromBottom":1,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":125,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":125,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":400,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1","A2"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":true,"blowout_flowRate":31,"blowout_location":"dest_well","changeTip":"never","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":null,"dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":5,"dispense_labware":"3c1a31c0-180a-11e9-9608-8bed9be8868f:opentrons/corning_96_wellplate_360ul_flat/5","dispense_mix_checkbox":false,"dispense_mix_times":null,"dispense_mix_volume":null,"dispense_mmFromBottom":10,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":125,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":125,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":400,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A9"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":null,"dropTip_location":"065e3277-9c81-4efb-a046-839022fa53b1:trashBin","liquidClassesSupported":false,"liquidClass":"none","nozzles":"SINGLE","path":"multiAspirate","pipette":"01217420-180a-11e9-9608-8bed9be8868f","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":0,"tipRack":"opentrons/opentrons_96_tiprack_10ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"5","stepType":"moveLiquid","stepName":"C Height & Speed","stepDetails":"Asp at half height, slow. touch tip at half height. Disp fast. Blow out dest.  ","id":"6ee38a60-1810-11e9-9608-8bed9be8868f","dispense_touchTip_mmfromTop":null},"a34a4e10-1810-11e9-9608-8bed9be8868f":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":null,"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":5,"aspirate_labware":"0bc091e0-180a-11e9-9608-8bed9be8868f:opentrons/usascientific_12_reservoir_22ml/4","aspirate_mix_checkbox":false,"aspirate_mix_times":null,"aspirate_mix_volume":null,"aspirate_mmFromBottom":1,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":125,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":125,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":400,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1","A2"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":31,"blowout_location":"065e3277-9c81-4efb-a046-839022fa53b1:trashBin","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":null,"dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":10,"dispense_labware":"3c1a31c0-180a-11e9-9608-8bed9be8868f:opentrons/corning_96_wellplate_360ul_flat/5","dispense_mix_checkbox":false,"dispense_mix_times":null,"dispense_mix_volume":null,"dispense_mmFromBottom":1,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":125,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":125,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":400,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A9"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":null,"dropTip_location":"065e3277-9c81-4efb-a046-839022fa53b1:trashBin","liquidClassesSupported":false,"liquidClass":"none","nozzles":"SINGLE","path":"single","pipette":"01217420-180a-11e9-9608-8bed9be8868f","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":0,"tipRack":"opentrons/opentrons_96_tiprack_10ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"10","stepType":"moveLiquid","stepName":"C change tip always","stepDetails":"change tip always","id":"a34a4e10-1810-11e9-9608-8bed9be8868f","dispense_touchTip_mmfromTop":null},"e76881c0-1810-11e9-9608-8bed9be8868f":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":null,"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":5,"aspirate_labware":"0bc091e0-180a-11e9-9608-8bed9be8868f:opentrons/usascientific_12_reservoir_22ml/4","aspirate_mix_checkbox":false,"aspirate_mix_times":null,"aspirate_mix_volume":null,"aspirate_mmFromBottom":1,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":125,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":125,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":400,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1","A2"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":31,"blowout_location":"065e3277-9c81-4efb-a046-839022fa53b1:trashBin","changeTip":"once","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":null,"dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":10,"dispense_labware":"3c1a31c0-180a-11e9-9608-8bed9be8868f:opentrons/corning_96_wellplate_360ul_flat/5","dispense_mix_checkbox":false,"dispense_mix_times":null,"dispense_mix_volume":null,"dispense_mmFromBottom":1,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":125,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":125,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":400,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A9"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":null,"dropTip_location":"065e3277-9c81-4efb-a046-839022fa53b1:trashBin","liquidClassesSupported":false,"liquidClass":"none","nozzles":"SINGLE","path":"single","pipette":"01217420-180a-11e9-9608-8bed9be8868f","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":0,"tipRack":"opentrons/opentrons_96_tiprack_10ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"10","stepType":"moveLiquid","stepName":"C change tip once","stepDetails":"change tip once","id":"e76881c0-1810-11e9-9608-8bed9be8868f","dispense_touchTip_mmfromTop":null},"872636d0-1811-11e9-9608-8bed9be8868f":{"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":5,"blowout_checkbox":false,"blowout_flowRate":31,"blowout_location":"065e3277-9c81-4efb-a046-839022fa53b1:trashBin","blowout_z_offset":0,"changeTip":"never","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":10,"dropTip_location":"065e3277-9c81-4efb-a046-839022fa53b1:trashBin","labware":"3c1a31c0-180a-11e9-9608-8bed9be8868f:opentrons/corning_96_wellplate_360ul_flat/5","liquidClassesSupported":false,"liquidClass":"none","mix_mmFromBottom":null,"mix_touchTip_checkbox":false,"mix_touchTip_mmFromTop":null,"mix_wellOrder_first":"t2b","mix_wellOrder_second":"l2r","mix_position_reference":"well-bottom","mix_x_position":0,"mix_y_position":0,"nozzles":"SINGLE","pipette":"01217420-180a-11e9-9608-8bed9be8868f","pushOut_checkbox":false,"pushOut_volume":0,"times":4,"tipRack":"opentrons/opentrons_96_tiprack_10ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"4","wells":["A9"],"stepType":"mix","stepName":"Basic Mix","stepDetails":"","id":"872636d0-1811-11e9-9608-8bed9be8868f"},"984e26c0-1811-11e9-9608-8bed9be8868f":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":null,"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":5,"aspirate_labware":"0bc091e0-180a-11e9-9608-8bed9be8868f:opentrons/usascientific_12_reservoir_22ml/4","aspirate_mix_checkbox":false,"aspirate_mix_times":null,"aspirate_mix_volume":null,"aspirate_mmFromBottom":1,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":125,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":125,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":400,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1","A2"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":31,"blowout_location":"065e3277-9c81-4efb-a046-839022fa53b1:trashBin","changeTip":"never","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":null,"dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":10,"dispense_labware":"3c1a31c0-180a-11e9-9608-8bed9be8868f:opentrons/corning_96_wellplate_360ul_flat/5","dispense_mix_checkbox":false,"dispense_mix_times":null,"dispense_mix_volume":null,"dispense_mmFromBottom":1,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":125,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":125,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":400,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A8"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":null,"dropTip_location":"065e3277-9c81-4efb-a046-839022fa53b1:trashBin","liquidClassesSupported":false,"liquidClass":"none","nozzles":"ALL","path":"multiAspirate","pipette":"01217421-180a-11e9-9608-8bed9be8868f","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":0,"tipRack":"opentrons/opentrons_96_tiprack_10ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"5","stepType":"moveLiquid","stepName":"Basic consolidate","stepDetails":"","id":"984e26c0-1811-11e9-9608-8bed9be8868f","dispense_touchTip_mmfromTop":null},"a0492690-1811-11e9-9608-8bed9be8868f":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":null,"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":5,"aspirate_labware":"0bc091e0-180a-11e9-9608-8bed9be8868f:opentrons/usascientific_12_reservoir_22ml/4","aspirate_mix_checkbox":true,"aspirate_mix_times":"3","aspirate_mix_volume":"3","aspirate_mmFromBottom":1,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":125,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":125,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":400,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1","A2"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":true,"blowout_flowRate":31,"blowout_location":"065e3277-9c81-4efb-a046-839022fa53b1:trashBin","changeTip":"never","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":null,"dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":10,"dispense_labware":"3c1a31c0-180a-11e9-9608-8bed9be8868f:opentrons/corning_96_wellplate_360ul_flat/5","dispense_mix_checkbox":true,"dispense_mix_times":"2","dispense_mix_volume":null,"dispense_mmFromBottom":1,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":125,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":125,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":true,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":400,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A8"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":null,"dropTip_location":"065e3277-9c81-4efb-a046-839022fa53b1:trashBin","liquidClassesSupported":false,"liquidClass":"none","nozzles":"ALL","path":"multiAspirate","pipette":"01217421-180a-11e9-9608-8bed9be8868f","preWetTip":true,"pushOut_checkbox":false,"pushOut_volume":0,"tipRack":"opentrons/opentrons_96_tiprack_10ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"5","stepType":"moveLiquid","stepName":"C Misc settings","stepDetails":"Pre wet, touch tip, mix, change tip never, blow out trash","id":"a0492690-1811-11e9-9608-8bed9be8868f","dispense_touchTip_mmfromTop":null},"a8f06bf0-1811-11e9-9608-8bed9be8868f":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":null,"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":5,"aspirate_labware":"0bc091e0-180a-11e9-9608-8bed9be8868f:opentrons/usascientific_12_reservoir_22ml/4","aspirate_mix_checkbox":false,"aspirate_mix_times":"3","aspirate_mix_volume":null,"aspirate_mmFromBottom":1,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":125,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":125,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":400,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1","A2"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":true,"blowout_flowRate":31,"blowout_location":"dest_well","changeTip":"never","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":null,"dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":10,"dispense_labware":"3c1a31c0-180a-11e9-9608-8bed9be8868f:opentrons/corning_96_wellplate_360ul_flat/5","dispense_mix_checkbox":false,"dispense_mix_times":null,"dispense_mix_volume":null,"dispense_mmFromBottom":10,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":125,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":125,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":400,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A8"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":null,"dropTip_location":"065e3277-9c81-4efb-a046-839022fa53b1:trashBin","liquidClassesSupported":false,"liquidClass":"none","nozzles":"ALL","path":"multiAspirate","pipette":"01217421-180a-11e9-9608-8bed9be8868f","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":0,"tipRack":"opentrons/opentrons_96_tiprack_10ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"5","stepType":"moveLiquid","stepName":"C Height & Speed","stepDetails":"Asp at half height, slow. touch tip at half height. Disp fast. Blow out dest.  ","id":"a8f06bf0-1811-11e9-9608-8bed9be8868f","dispense_touchTip_mmfromTop":null},"b4a0f9b0-1811-11e9-9608-8bed9be8868f":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":null,"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":5,"aspirate_labware":"0bc091e0-180a-11e9-9608-8bed9be8868f:opentrons/usascientific_12_reservoir_22ml/4","aspirate_mix_checkbox":false,"aspirate_mix_times":null,"aspirate_mix_volume":null,"aspirate_mmFromBottom":1,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":125,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":125,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":400,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1","A2"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":31,"blowout_location":"065e3277-9c81-4efb-a046-839022fa53b1:trashBin","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":null,"dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":10,"dispense_labware":"3c1a31c0-180a-11e9-9608-8bed9be8868f:opentrons/corning_96_wellplate_360ul_flat/5","dispense_mix_checkbox":false,"dispense_mix_times":null,"dispense_mix_volume":null,"dispense_mmFromBottom":1,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":125,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":125,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":400,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A8"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":null,"dropTip_location":"065e3277-9c81-4efb-a046-839022fa53b1:trashBin","liquidClassesSupported":false,"liquidClass":"none","nozzles":"ALL","path":"single","pipette":"01217421-180a-11e9-9608-8bed9be8868f","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":0,"tipRack":"opentrons/opentrons_96_tiprack_10ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"10","stepType":"moveLiquid","stepName":"C change tip always","stepDetails":"change tip always","id":"b4a0f9b0-1811-11e9-9608-8bed9be8868f","dispense_touchTip_mmfromTop":null},"bd837350-1811-11e9-9608-8bed9be8868f":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":null,"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":5,"aspirate_labware":"0bc091e0-180a-11e9-9608-8bed9be8868f:opentrons/usascientific_12_reservoir_22ml/4","aspirate_mix_checkbox":false,"aspirate_mix_times":null,"aspirate_mix_volume":null,"aspirate_mmFromBottom":1,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":125,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":125,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":400,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1","A2"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":31,"blowout_location":"065e3277-9c81-4efb-a046-839022fa53b1:trashBin","changeTip":"once","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":null,"dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":10,"dispense_labware":"3c1a31c0-180a-11e9-9608-8bed9be8868f:opentrons/corning_96_wellplate_360ul_flat/5","dispense_mix_checkbox":false,"dispense_mix_times":null,"dispense_mix_volume":null,"dispense_mmFromBottom":1,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":125,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":125,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":400,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A8"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":null,"dropTip_location":"065e3277-9c81-4efb-a046-839022fa53b1:trashBin","liquidClassesSupported":false,"liquidClass":"none","nozzles":"ALL","path":"single","pipette":"01217421-180a-11e9-9608-8bed9be8868f","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":0,"tipRack":"opentrons/opentrons_96_tiprack_10ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"10","stepType":"moveLiquid","stepName":"C change tip once","stepDetails":"change tip once","id":"bd837350-1811-11e9-9608-8bed9be8868f","dispense_touchTip_mmfromTop":null},"ef9327a0-1811-11e9-9608-8bed9be8868f":{"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":5,"blowout_checkbox":true,"blowout_flowRate":31,"blowout_location":"065e3277-9c81-4efb-a046-839022fa53b1:trashBin","blowout_z_offset":0,"changeTip":"never","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":10,"dropTip_location":"065e3277-9c81-4efb-a046-839022fa53b1:trashBin","labware":"3c1a31c0-180a-11e9-9608-8bed9be8868f:opentrons/corning_96_wellplate_360ul_flat/5","liquidClassesSupported":false,"liquidClass":"none","mix_mmFromBottom":null,"mix_touchTip_checkbox":true,"mix_touchTip_mmFromTop":null,"mix_wellOrder_first":"t2b","mix_wellOrder_second":"l2r","mix_position_reference":"well-bottom","mix_x_position":0,"mix_y_position":0,"nozzles":"SINGLE","pipette":"01217420-180a-11e9-9608-8bed9be8868f","pushOut_checkbox":false,"pushOut_volume":0,"times":4,"tipRack":"opentrons/opentrons_96_tiprack_10ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"4","wells":["A9"],"stepType":"mix","stepName":"M misc settings","stepDetails":"Blow out, touch tip","id":"ef9327a0-1811-11e9-9608-8bed9be8868f"},"07c41640-1812-11e9-9608-8bed9be8868f":{"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":10,"blowout_checkbox":true,"blowout_flowRate":31,"blowout_location":"dest_well","blowout_z_offset":0,"changeTip":"never","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":5,"dropTip_location":"065e3277-9c81-4efb-a046-839022fa53b1:trashBin","labware":"3c1a31c0-180a-11e9-9608-8bed9be8868f:opentrons/corning_96_wellplate_360ul_flat/5","liquidClassesSupported":false,"liquidClass":"none","mix_mmFromBottom":5,"mix_touchTip_checkbox":true,"mix_touchTip_mmFromTop":-5.4,"mix_wellOrder_first":"t2b","mix_wellOrder_second":"l2r","mix_position_reference":"well-bottom","mix_x_position":0,"mix_y_position":0,"nozzles":"SINGLE","pipette":"01217420-180a-11e9-9608-8bed9be8868f","pushOut_checkbox":false,"pushOut_volume":0,"times":4,"tipRack":"opentrons/opentrons_96_tiprack_10ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"4","wells":["A9"],"stepType":"mix","stepName":"M Height & Speed","stepDetails":"Asp at half height, slow. Touch tip half height. Disp fast. Blow out destination wells. ","id":"07c41640-1812-11e9-9608-8bed9be8868f"},"63a2ea90-1812-11e9-9608-8bed9be8868f":{"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":5,"blowout_checkbox":false,"blowout_flowRate":31,"blowout_location":"065e3277-9c81-4efb-a046-839022fa53b1:trashBin","blowout_z_offset":0,"changeTip":"always","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":10,"dropTip_location":"065e3277-9c81-4efb-a046-839022fa53b1:trashBin","labware":"3c1a31c0-180a-11e9-9608-8bed9be8868f:opentrons/corning_96_wellplate_360ul_flat/5","liquidClassesSupported":false,"liquidClass":"none","mix_mmFromBottom":null,"mix_touchTip_checkbox":false,"mix_touchTip_mmFromTop":null,"mix_wellOrder_first":"t2b","mix_wellOrder_second":"l2r","mix_position_reference":"well-bottom","mix_x_position":0,"mix_y_position":0,"nozzles":"SINGLE","pipette":"01217420-180a-11e9-9608-8bed9be8868f","pushOut_checkbox":false,"pushOut_volume":0,"times":2,"tipRack":"opentrons/opentrons_96_tiprack_10ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"2","wells":["A7","A8","A9"],"stepType":"mix","stepName":"M Change tip always","stepDetails":"","id":"63a2ea90-1812-11e9-9608-8bed9be8868f"},"7cd40b20-1812-11e9-9608-8bed9be8868f":{"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":5,"blowout_checkbox":false,"blowout_flowRate":31,"blowout_location":"065e3277-9c81-4efb-a046-839022fa53b1:trashBin","blowout_z_offset":0,"changeTip":"once","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":10,"dropTip_location":"065e3277-9c81-4efb-a046-839022fa53b1:trashBin","labware":"3c1a31c0-180a-11e9-9608-8bed9be8868f:opentrons/corning_96_wellplate_360ul_flat/5","liquidClassesSupported":false,"liquidClass":"none","mix_mmFromBottom":null,"mix_touchTip_checkbox":false,"mix_touchTip_mmFromTop":null,"mix_wellOrder_first":"t2b","mix_wellOrder_second":"l2r","mix_position_reference":"well-bottom","mix_x_position":0,"mix_y_position":0,"nozzles":"SINGLE","pipette":"01217420-180a-11e9-9608-8bed9be8868f","pushOut_checkbox":false,"pushOut_volume":0,"times":2,"tipRack":"opentrons/opentrons_96_tiprack_10ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"2","wells":["A7","A8","A9"],"stepType":"mix","stepName":"M Change tip once","stepDetails":"","id":"7cd40b20-1812-11e9-9608-8bed9be8868f"},"9cafddc0-1812-11e9-9608-8bed9be8868f":{"moduleId":null,"pauseAction":"untilTime","pauseMessage":"","pauseTemperature":null,"pauseTime":"NaN:03","stepName":"Pause for 3s","stepDetails":"","id":"9cafddc0-1812-11e9-9608-8bed9be8868f","stepType":"pause"},"a5ffbf30-1812-11e9-9608-8bed9be8868f":{"moduleId":null,"pauseAction":"untilResume","pauseMessage":"OK HOPEFULLY YOU ARE DONE","pauseTemperature":null,"pauseTime":null,"stepName":"Pause","stepDetails":"","id":"a5ffbf30-1812-11e9-9608-8bed9be8868f","stepType":"pause"},"b301d330-1812-11e9-9608-8bed9be8868f":{"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":5,"blowout_checkbox":true,"blowout_flowRate":31,"blowout_location":"065e3277-9c81-4efb-a046-839022fa53b1:trashBin","blowout_z_offset":0,"changeTip":"never","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":10,"dropTip_location":"065e3277-9c81-4efb-a046-839022fa53b1:trashBin","labware":"3c1a31c0-180a-11e9-9608-8bed9be8868f:opentrons/corning_96_wellplate_360ul_flat/5","liquidClassesSupported":false,"liquidClass":"none","mix_mmFromBottom":null,"mix_touchTip_checkbox":true,"mix_touchTip_mmFromTop":null,"mix_wellOrder_first":"t2b","mix_wellOrder_second":"l2r","mix_position_reference":"well-bottom","mix_x_position":0,"mix_y_position":0,"nozzles":"ALL","pipette":"01217421-180a-11e9-9608-8bed9be8868f","pushOut_checkbox":false,"pushOut_volume":0,"times":4,"tipRack":"opentrons/opentrons_96_tiprack_10ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"4","wells":["A8"],"stepType":"mix","stepName":"M misc settings","stepDetails":"Blow out, touch tip","id":"b301d330-1812-11e9-9608-8bed9be8868f"},"b9afe0a0-1812-11e9-9608-8bed9be8868f":{"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":5,"blowout_checkbox":true,"blowout_flowRate":31,"blowout_location":"dest_well","blowout_z_offset":0,"changeTip":"never","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":10,"dropTip_location":"065e3277-9c81-4efb-a046-839022fa53b1:trashBin","labware":"3c1a31c0-180a-11e9-9608-8bed9be8868f:opentrons/corning_96_wellplate_360ul_flat/5","liquidClassesSupported":false,"liquidClass":"none","mix_mmFromBottom":5,"mix_touchTip_checkbox":true,"mix_touchTip_mmFromTop":-5.4,"mix_wellOrder_first":"t2b","mix_wellOrder_second":"l2r","mix_position_reference":"well-bottom","mix_x_position":0,"mix_y_position":0,"nozzles":"ALL","pipette":"01217421-180a-11e9-9608-8bed9be8868f","pushOut_checkbox":false,"pushOut_volume":0,"times":4,"tipRack":"opentrons/opentrons_96_tiprack_10ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"4","wells":["A8"],"stepType":"mix","stepName":"M Height & Speed","stepDetails":"Asp at half height, slow. Touch tip half height. Disp fast. Blow out destination wells. ","id":"b9afe0a0-1812-11e9-9608-8bed9be8868f"},"c495a450-1812-11e9-9608-8bed9be8868f":{"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":5,"blowout_checkbox":false,"blowout_flowRate":31,"blowout_location":"065e3277-9c81-4efb-a046-839022fa53b1:trashBin","blowout_z_offset":0,"changeTip":"always","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":10,"dropTip_location":"065e3277-9c81-4efb-a046-839022fa53b1:trashBin","labware":"3c1a31c0-180a-11e9-9608-8bed9be8868f:opentrons/corning_96_wellplate_360ul_flat/5","liquidClassesSupported":false,"liquidClass":"none","mix_mmFromBottom":null,"mix_touchTip_checkbox":false,"mix_touchTip_mmFromTop":null,"mix_wellOrder_first":"t2b","mix_wellOrder_second":"l2r","mix_position_reference":"well-bottom","mix_x_position":0,"mix_y_position":0,"nozzles":"ALL","pipette":"01217421-180a-11e9-9608-8bed9be8868f","pushOut_checkbox":false,"pushOut_volume":0,"times":2,"tipRack":"opentrons/opentrons_96_tiprack_10ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"2","wells":["A6","A7","A8"],"stepType":"mix","stepName":"M Change tip always","stepDetails":"","id":"c495a450-1812-11e9-9608-8bed9be8868f"},"d7451ea0-1812-11e9-9608-8bed9be8868f":{"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":5,"blowout_checkbox":false,"blowout_flowRate":31,"blowout_location":"065e3277-9c81-4efb-a046-839022fa53b1:trashBin","blowout_z_offset":0,"changeTip":"once","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":10,"dropTip_location":"065e3277-9c81-4efb-a046-839022fa53b1:trashBin","labware":"3c1a31c0-180a-11e9-9608-8bed9be8868f:opentrons/corning_96_wellplate_360ul_flat/5","liquidClassesSupported":false,"liquidClass":"none","mix_mmFromBottom":null,"mix_touchTip_checkbox":false,"mix_touchTip_mmFromTop":null,"mix_wellOrder_first":"t2b","mix_wellOrder_second":"l2r","mix_position_reference":"well-bottom","mix_x_position":0,"mix_y_position":0,"nozzles":"ALL","pipette":"01217421-180a-11e9-9608-8bed9be8868f","pushOut_checkbox":false,"pushOut_volume":0,"times":2,"tipRack":"opentrons/opentrons_96_tiprack_10ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"2","wells":["A6","A7","A8"],"stepType":"mix","stepName":"M Change tip once","stepDetails":"","id":"d7451ea0-1812-11e9-9608-8bed9be8868f"}},"orderedStepIds":["3fcb79f0-180a-11e9-9608-8bed9be8868f","aa2de740-180c-11e9-9608-8bed9be8868f","4eab2790-180a-11e9-9608-8bed9be8868f","b4ad20f0-180c-11e9-9608-8bed9be8868f","78502a50-180a-11e9-9608-8bed9be8868f","c07fdcb0-180c-11e9-9608-8bed9be8868f","3353af20-180b-11e9-9608-8bed9be8868f","cd20e4f0-180c-11e9-9608-8bed9be8868f","5d0f4720-180b-11e9-9608-8bed9be8868f","d8eb8a60-180c-11e9-9608-8bed9be8868f","486cb9f0-180c-11e9-9608-8bed9be8868f","03e90650-180f-11e9-9608-8bed9be8868f","97f2d9a0-180c-11e9-9608-8bed9be8868f","2c3a38e0-180f-11e9-9608-8bed9be8868f","516f2230-180d-11e9-9608-8bed9be8868f","3d602d00-180f-11e9-9608-8bed9be8868f","48f0cc20-180e-11e9-9608-8bed9be8868f","483771c0-180f-11e9-9608-8bed9be8868f","dd0c4b50-180e-11e9-9608-8bed9be8868f","58e92040-180f-11e9-9608-8bed9be8868f","a898c0f0-180f-11e9-9608-8bed9be8868f","984e26c0-1811-11e9-9608-8bed9be8868f","2c3fc1b0-1810-11e9-9608-8bed9be8868f","a0492690-1811-11e9-9608-8bed9be8868f","6ee38a60-1810-11e9-9608-8bed9be8868f","a8f06bf0-1811-11e9-9608-8bed9be8868f","a34a4e10-1810-11e9-9608-8bed9be8868f","b4a0f9b0-1811-11e9-9608-8bed9be8868f","e76881c0-1810-11e9-9608-8bed9be8868f","bd837350-1811-11e9-9608-8bed9be8868f","872636d0-1811-11e9-9608-8bed9be8868f","ef9327a0-1811-11e9-9608-8bed9be8868f","b301d330-1812-11e9-9608-8bed9be8868f","07c41640-1812-11e9-9608-8bed9be8868f","b9afe0a0-1812-11e9-9608-8bed9be8868f","63a2ea90-1812-11e9-9608-8bed9be8868f","c495a450-1812-11e9-9608-8bed9be8868f","7cd40b20-1812-11e9-9608-8bed9be8868f","d7451ea0-1812-11e9-9608-8bed9be8868f","9cafddc0-1812-11e9-9608-8bed9be8868f","a5ffbf30-1812-11e9-9608-8bed9be8868f"],"pipettes":{"01217420-180a-11e9-9608-8bed9be8868f":{"pipetteName":"p10_single"},"01217421-180a-11e9-9608-8bed9be8868f":{"pipetteName":"p10_multi"}},"modules":{},"labware":{"0121e950-180a-11e9-9608-8bed9be8868f:opentrons/opentrons_96_tiprack_10ul/1":{"displayName":"Tiprack 10 Ul (1)","labwareDefURI":"opentrons/opentrons_96_tiprack_10ul/1"},"0bc091e0-180a-11e9-9608-8bed9be8868f:opentrons/usascientific_12_reservoir_22ml/4":{"displayName":"Trough 12 Row (1)","labwareDefURI":"opentrons/usascientific_12_reservoir_22ml/4"},"3c1a31c0-180a-11e9-9608-8bed9be8868f:opentrons/corning_96_wellplate_360ul_flat/5":{"displayName":"96 Flat (1)","labwareDefURI":"opentrons/corning_96_wellplate_360ul_flat/5"},"cea1c650-1811-11e9-9608-8bed9be8868f:opentrons/opentrons_96_tiprack_10ul/1":{"displayName":"Tiprack 10 Ul (2)","labwareDefURI":"opentrons/opentrons_96_tiprack_10ul/1"}}}},"metadata":{"author":"","description":"","created":1547476685921,"category":null,"subcategory":null,"tags":[],"protocolName":"QA test protocol","lastModified":1769457398086,"source":"Protocol Designer"}}"""
