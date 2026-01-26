import json

from opentrons import protocol_api

metadata = {
    "protocolName": "OT_2_S_871_custom_labware_partial_tip_transfer_consolidate_distribute_",
    "created": "2020-08-21T19:00:54.614Z",
    "internalAppBuildDate": "Tue, 16 Dec 2025 16:02:03 GMT",
    "lastModified": "2026-01-26T18:54:25.354Z",
    "protocolDesigner": "8.7.1",
    "source": "Protocol Designer",
}

requirements = {"robotType": "OT-2", "apiLevel": "2.27"}


def run(protocol: protocol_api.ProtocolContext) -> None:
    # Load Labware:
    tip_rack_1 = protocol.load_labware(
        "opentrons_96_tiprack_300ul",
        location="5",
        label="Opentrons OT-2 96 Tip Rack 300 µL (1)",
        namespace="opentrons",
        version=1,
    )
    reservoir_1 = protocol.load_labware(
        "nest_12_reservoir_15ml",
        location="3",
        namespace="opentrons",
        version=3,
    )
    well_plate_1 = protocol.load_labware(
        "eppendorf_96_wellplate_500ul",
        location="4",
        namespace="opentrons",
        version=1,
    )
    well_plate_2 = protocol.load_labware(
        "eppendorf_96_wellplate_500ul",
        location="2",
        label="Eppendorf 96 Well Plate 500 µL (1)",
        namespace="opentrons",
        version=1,
    )
    well_plate_3 = protocol.load_labware_from_definition(
        CUSTOM_LABWARE["custom_beta/greinerbioone_96_wellplate_392ul/1"],
        location="1",
    )
    tip_rack_2 = protocol.load_labware(
        "opentrons_96_tiprack_300ul",
        location="6",
        label="Opentrons OT-2 96 Tip Rack 300 µL (2)",
        namespace="opentrons",
        version=1,
    )

    # Load Pipettes:
    pipette_right = protocol.load_instrument("p300_multi_gen2", "right")

    # Define Liquids:
    liquid_1 = protocol.define_liquid(
        "Beep",
        description="CB",
        display_color="#b925ff",
    )
    liquid_2 = protocol.define_liquid(
        "Boop",
        display_color="#ffd600",
    )
    liquid_3 = protocol.define_liquid(
        "Bop",
        display_color="#9dffd8",
    )
    liquid_4 = protocol.define_liquid(
        "orange",
        display_color="#ff9900",
    )

    # Load Liquids:
    reservoir_1.load_liquid(
        wells=["A1"],
        liquid=liquid_1,
        volume=6000,
    )
    reservoir_1.load_liquid(
        wells=["A2"],
        liquid=liquid_2,
        volume=7500,
    )
    well_plate_1.load_liquid(
        wells=["A1", "B1", "C1", "D1", "E1", "F1", "G1", "H1"],
        liquid=liquid_4,
        volume=250,
    )

    # PROTOCOL STEPS

    # Step 1: transfer
    pipette_right.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette_right.transfer_with_liquid_class(
        volume=99,
        source=[well_plate_1["A1"], well_plate_1["A1"]],
        dest=[well_plate_2["A1"], well_plate_2["A2"]],
        new_tip="once",
        trash_location=protocol.fixed_trash,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_1, tip_rack_2],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_1",
            properties={
                "p300_multi_gen2": {
                    "opentrons/opentrons_96_tiprack_300ul/1": {
                        "aspirate": {
                            "aspirate_position": {
                                "offset": {"x": 0, "y": 0, "z": 1},
                                "position_reference": "well-bottom",
                            },
                            "flow_rate_by_volume": [(0, 50)],
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
                            "flow_rate_by_volume": [(0, 50)],
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
                                    "z_offset": -14,
                                    "mm_from_edge": 1.5,
                                    "speed": 400,
                                },
                                "blowout": {"enabled": True, "location": "destination", "flow_rate": 10},
                            },
                            "correction_by_volume": [(0, 0)],
                            "push_out_by_volume": [(0, 0)],
                            "mix": {"enabled": False},
                        },
                    }
                }
            },
        ),
    )
    pipette_right.drop_tip()

    # Step 2: transfer
    pipette_right.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette_right.distribute_with_liquid_class(
        volume=94,
        source=[reservoir_1["A1"]],
        dest=[
            well_plate_2["A3"],
            well_plate_2["A4"],
            well_plate_2["A5"],
            well_plate_2["A6"],
            well_plate_2["A7"],
            well_plate_2["A8"],
        ],
        new_tip="once",
        trash_location=protocol.fixed_trash,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_1, tip_rack_2],
        liquid_class=protocol.define_liquid_class(
            name="distribute_step_2",
            properties={
                "p300_multi_gen2": {
                    "opentrons/opentrons_96_tiprack_300ul/1": {
                        "aspirate": {
                            "aspirate_position": {
                                "offset": {"x": 0, "y": 0, "z": 1},
                                "position_reference": "well-bottom",
                            },
                            "flow_rate_by_volume": [(0, 50)],
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
                            "flow_rate_by_volume": [(0, 50)],
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
                                "blowout": {"enabled": True, "location": "source", "flow_rate": 10},
                            },
                            "correction_by_volume": [(0, 0)],
                            "push_out_by_volume": [(0, 0)],
                            "mix": {"enabled": False},
                        },
                        "multi_dispense": {
                            "dispense_position": {
                                "offset": {"x": 0, "y": 0, "z": 1},
                                "position_reference": "well-bottom",
                            },
                            "flow_rate_by_volume": [(0, 50)],
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
                                "blowout": {"enabled": True, "location": "source", "flow_rate": 10},
                            },
                            "correction_by_volume": [(0, 0)],
                            "conditioning_by_volume": [(0, 0)],
                            "disposal_by_volume": [(0, 20)],
                        },
                    }
                }
            },
        ),
        tips=[tip_rack_2["A1"]],
    )
    pipette_right.drop_tip()

    # Step 3: transfer
    pipette_right.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette_right.transfer_with_liquid_class(
        volume=100,
        source=[
            reservoir_1["A1"],
            reservoir_1["A1"],
            reservoir_1["A1"],
            reservoir_1["A1"],
            reservoir_1["A1"],
            reservoir_1["A1"],
            reservoir_1["A1"],
            reservoir_1["A1"],
        ],
        dest=[
            well_plate_2["A1"],
            well_plate_2["A2"],
            well_plate_2["A3"],
            well_plate_2["A4"],
            well_plate_2["A5"],
            well_plate_2["A6"],
            well_plate_2["A7"],
            well_plate_2["A8"],
        ],
        new_tip="once",
        trash_location=protocol.fixed_trash,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_1, tip_rack_2],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_3",
            properties={
                "p300_multi_gen2": {
                    "opentrons/opentrons_96_tiprack_300ul/1": {
                        "aspirate": {
                            "aspirate_position": {
                                "offset": {"x": 0, "y": 0, "z": 1},
                                "position_reference": "well-bottom",
                            },
                            "flow_rate_by_volume": [(0, 50)],
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
                            "flow_rate_by_volume": [(0, 50)],
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
                                "blowout": {"enabled": True, "location": "destination", "flow_rate": 10},
                            },
                            "correction_by_volume": [(0, 0)],
                            "push_out_by_volume": [(0, 0)],
                            "mix": {"enabled": False},
                        },
                    }
                }
            },
        ),
    )
    pipette_right.drop_tip()

    # Step 4: pause
    protocol.pause(
        "Cover DeepWell plates with sealing mat and shake at RT and 1000 rpm for 30 min in the dark. Then, place them back on positions 5 and 6 and resume protocol!"
    )

    # Step 5: transfer
    pipette_right.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette_right.transfer_with_liquid_class(
        volume=175,
        source=[
            well_plate_2["A1"],
            well_plate_2["A2"],
            well_plate_2["A3"],
            well_plate_2["A4"],
            well_plate_2["A5"],
            well_plate_2["A6"],
            well_plate_2["A7"],
            well_plate_2["A8"],
        ],
        dest=[
            well_plate_3["A1"],
            well_plate_3["A2"],
            well_plate_3["A3"],
            well_plate_3["A4"],
            well_plate_3["A5"],
            well_plate_3["A6"],
            well_plate_3["A7"],
            well_plate_3["A8"],
        ],
        new_tip="always",
        trash_location=protocol.fixed_trash,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_1, tip_rack_2],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_5",
            properties={
                "p300_multi_gen2": {
                    "opentrons/opentrons_96_tiprack_300ul/1": {
                        "aspirate": {
                            "aspirate_position": {
                                "offset": {"x": 0, "y": 0, "z": 1},
                                "position_reference": "well-bottom",
                            },
                            "flow_rate_by_volume": [(0, 50)],
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
                                "offset": {"x": 0, "y": 0, "z": 8},
                                "position_reference": "well-bottom",
                            },
                            "flow_rate_by_volume": [(0, 94)],
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
                                    "z_offset": -2.9,
                                    "mm_from_edge": 0.5,
                                    "speed": 400,
                                },
                                "blowout": {"enabled": True, "location": "destination", "flow_rate": 10},
                            },
                            "correction_by_volume": [(0, 0)],
                            "push_out_by_volume": [(0, 0)],
                            "mix": {"enabled": False},
                        },
                    }
                }
            },
        ),
    )
    pipette_right.drop_tip()

    # Step 6: transfer
    pipette_right.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette_right.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette_right.transfer_with_liquid_class(
        volume=175,
        source=[
            well_plate_2["A1"],
            well_plate_2["A2"],
            well_plate_2["A3"],
            well_plate_2["A4"],
            well_plate_2["A5"],
            well_plate_2["A6"],
            well_plate_2["A7"],
            well_plate_2["A8"],
        ],
        dest=[
            well_plate_3["A1"],
            well_plate_3["A2"],
            well_plate_3["A3"],
            well_plate_3["A4"],
            well_plate_3["A5"],
            well_plate_3["A6"],
            well_plate_3["A7"],
            well_plate_3["A8"],
        ],
        new_tip="always",
        trash_location=protocol.fixed_trash,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_1, tip_rack_2],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_6",
            properties={
                "p300_multi_gen2": {
                    "opentrons/opentrons_96_tiprack_300ul/1": {
                        "aspirate": {
                            "aspirate_position": {
                                "offset": {"x": 0, "y": 0, "z": 1},
                                "position_reference": "well-bottom",
                            },
                            "flow_rate_by_volume": [(0, 50)],
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
                                "offset": {"x": 0, "y": 0, "z": 8},
                                "position_reference": "well-bottom",
                            },
                            "flow_rate_by_volume": [(0, 94)],
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
                                    "z_offset": -2.9,
                                    "mm_from_edge": 0.5,
                                    "speed": 400,
                                },
                                "blowout": {"enabled": True, "location": "destination", "flow_rate": 10},
                            },
                            "correction_by_volume": [(0, 0)],
                            "push_out_by_volume": [(0, 0)],
                            "mix": {"enabled": False},
                        },
                    }
                }
            },
        ),
    )
    pipette_right.drop_tip()

    # Step 7: transfer
    pipette_right.configure_nozzle_layout(
        protocol_api.SINGLE,
        start="H1",
    )
    pipette_right.transfer_with_liquid_class(
        volume=10,
        source=[well_plate_1["A1"]],
        dest=[well_plate_1["A7"]],
        new_tip="always",
        trash_location=protocol.fixed_trash,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_1, tip_rack_2],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_7",
            properties={
                "p300_multi_gen2": {
                    "opentrons/opentrons_96_tiprack_300ul/1": {
                        "aspirate": {
                            "aspirate_position": {
                                "offset": {"x": 0, "y": 0, "z": 1},
                                "position_reference": "well-bottom",
                            },
                            "flow_rate_by_volume": [(0, 94)],
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
                                "touch_tip": {
                                    "enabled": True,
                                    "z_offset": -1,
                                    "mm_from_edge": 0,
                                    "speed": 60,
                                },
                            },
                        },
                        "dispense": {
                            "dispense_position": {
                                "offset": {"x": 0, "y": 0, "z": 1},
                                "position_reference": "well-bottom",
                            },
                            "flow_rate_by_volume": [(0, 94)],
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
                    }
                }
            },
        ),
        tips=[tip_rack_2["A8"]],
    )
    pipette_right.drop_tip()

    # Step 8: transfer
    pipette_right.configure_nozzle_layout(
        protocol_api.SINGLE,
        start="H1",
    )
    pipette_right.transfer_with_liquid_class(
        volume=10,
        source=[
            well_plate_3["A3"],
            well_plate_3["A4"],
            well_plate_3["A5"],
            well_plate_3["A6"],
            well_plate_3["A7"],
            well_plate_3["A8"],
        ],
        dest=[
            well_plate_1["A12"],
            well_plate_1["A12"],
            well_plate_1["A12"],
            well_plate_1["A12"],
            well_plate_1["A12"],
            well_plate_1["A12"],
        ],
        new_tip="always",
        trash_location=protocol.fixed_trash,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_1, tip_rack_2],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_8",
            properties={
                "p300_multi_gen2": {
                    "opentrons/opentrons_96_tiprack_300ul/1": {
                        "aspirate": {
                            "aspirate_position": {
                                "offset": {"x": 0, "y": 0, "z": 1},
                                "position_reference": "well-bottom",
                            },
                            "flow_rate_by_volume": [(0, 94)],
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
                            "flow_rate_by_volume": [(0, 94)],
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
                    }
                }
            },
        ),
    )
    pipette_right.drop_tip()


CUSTOM_LABWARE = json.loads(
    """{"custom_beta/greinerbioone_96_wellplate_392ul/1":{"ordering":[["A1","B1","C1","D1","E1","F1","G1","H1"],["A2","B2","C2","D2","E2","F2","G2","H2"],["A3","B3","C3","D3","E3","F3","G3","H3"],["A4","B4","C4","D4","E4","F4","G4","H4"],["A5","B5","C5","D5","E5","F5","G5","H5"],["A6","B6","C6","D6","E6","F6","G6","H6"],["A7","B7","C7","D7","E7","F7","G7","H7"],["A8","B8","C8","D8","E8","F8","G8","H8"],["A9","B9","C9","D9","E9","F9","G9","H9"],["A10","B10","C10","D10","E10","F10","G10","H10"],["A11","B11","C11","D11","E11","F11","G11","H11"],["A12","B12","C12","D12","E12","F12","G12","H12"]],"brand":{"brand":"Greiner Bio-One","brandId":["655077"]},"metadata":{"displayName":"Greiner Bio-One 96 Well Plate 392 µL","displayCategory":"wellPlate","displayVolumeUnits":"µL","tags":[]},"dimensions":{"xDimension":127.76,"yDimension":85.48,"zDimension":14.4},"wells":{"A1":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":14.38,"y":74.24,"z":3.5},"B1":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":14.38,"y":65.24,"z":3.5},"C1":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":14.38,"y":56.24,"z":3.5},"D1":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":14.38,"y":47.24,"z":3.5},"E1":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":14.38,"y":38.24,"z":3.5},"F1":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":14.38,"y":29.24,"z":3.5},"G1":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":14.38,"y":20.24,"z":3.5},"H1":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":14.38,"y":11.24,"z":3.5},"A2":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":23.38,"y":74.24,"z":3.5},"B2":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":23.38,"y":65.24,"z":3.5},"C2":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":23.38,"y":56.24,"z":3.5},"D2":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":23.38,"y":47.24,"z":3.5},"E2":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":23.38,"y":38.24,"z":3.5},"F2":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":23.38,"y":29.24,"z":3.5},"G2":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":23.38,"y":20.24,"z":3.5},"H2":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":23.38,"y":11.24,"z":3.5},"A3":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":32.38,"y":74.24,"z":3.5},"B3":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":32.38,"y":65.24,"z":3.5},"C3":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":32.38,"y":56.24,"z":3.5},"D3":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":32.38,"y":47.24,"z":3.5},"E3":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":32.38,"y":38.24,"z":3.5},"F3":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":32.38,"y":29.24,"z":3.5},"G3":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":32.38,"y":20.24,"z":3.5},"H3":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":32.38,"y":11.24,"z":3.5},"A4":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":41.38,"y":74.24,"z":3.5},"B4":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":41.38,"y":65.24,"z":3.5},"C4":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":41.38,"y":56.24,"z":3.5},"D4":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":41.38,"y":47.24,"z":3.5},"E4":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":41.38,"y":38.24,"z":3.5},"F4":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":41.38,"y":29.24,"z":3.5},"G4":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":41.38,"y":20.24,"z":3.5},"H4":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":41.38,"y":11.24,"z":3.5},"A5":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":50.38,"y":74.24,"z":3.5},"B5":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":50.38,"y":65.24,"z":3.5},"C5":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":50.38,"y":56.24,"z":3.5},"D5":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":50.38,"y":47.24,"z":3.5},"E5":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":50.38,"y":38.24,"z":3.5},"F5":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":50.38,"y":29.24,"z":3.5},"G5":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":50.38,"y":20.24,"z":3.5},"H5":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":50.38,"y":11.24,"z":3.5},"A6":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":59.38,"y":74.24,"z":3.5},"B6":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":59.38,"y":65.24,"z":3.5},"C6":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":59.38,"y":56.24,"z":3.5},"D6":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":59.38,"y":47.24,"z":3.5},"E6":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":59.38,"y":38.24,"z":3.5},"F6":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":59.38,"y":29.24,"z":3.5},"G6":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":59.38,"y":20.24,"z":3.5},"H6":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":59.38,"y":11.24,"z":3.5},"A7":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":68.38,"y":74.24,"z":3.5},"B7":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":68.38,"y":65.24,"z":3.5},"C7":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":68.38,"y":56.24,"z":3.5},"D7":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":68.38,"y":47.24,"z":3.5},"E7":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":68.38,"y":38.24,"z":3.5},"F7":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":68.38,"y":29.24,"z":3.5},"G7":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":68.38,"y":20.24,"z":3.5},"H7":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":68.38,"y":11.24,"z":3.5},"A8":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":77.38,"y":74.24,"z":3.5},"B8":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":77.38,"y":65.24,"z":3.5},"C8":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":77.38,"y":56.24,"z":3.5},"D8":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":77.38,"y":47.24,"z":3.5},"E8":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":77.38,"y":38.24,"z":3.5},"F8":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":77.38,"y":29.24,"z":3.5},"G8":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":77.38,"y":20.24,"z":3.5},"H8":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":77.38,"y":11.24,"z":3.5},"A9":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":86.38,"y":74.24,"z":3.5},"B9":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":86.38,"y":65.24,"z":3.5},"C9":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":86.38,"y":56.24,"z":3.5},"D9":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":86.38,"y":47.24,"z":3.5},"E9":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":86.38,"y":38.24,"z":3.5},"F9":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":86.38,"y":29.24,"z":3.5},"G9":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":86.38,"y":20.24,"z":3.5},"H9":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":86.38,"y":11.24,"z":3.5},"A10":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":95.38,"y":74.24,"z":3.5},"B10":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":95.38,"y":65.24,"z":3.5},"C10":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":95.38,"y":56.24,"z":3.5},"D10":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":95.38,"y":47.24,"z":3.5},"E10":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":95.38,"y":38.24,"z":3.5},"F10":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":95.38,"y":29.24,"z":3.5},"G10":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":95.38,"y":20.24,"z":3.5},"H10":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":95.38,"y":11.24,"z":3.5},"A11":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":104.38,"y":74.24,"z":3.5},"B11":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":104.38,"y":65.24,"z":3.5},"C11":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":104.38,"y":56.24,"z":3.5},"D11":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":104.38,"y":47.24,"z":3.5},"E11":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":104.38,"y":38.24,"z":3.5},"F11":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":104.38,"y":29.24,"z":3.5},"G11":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":104.38,"y":20.24,"z":3.5},"H11":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":104.38,"y":11.24,"z":3.5},"A12":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":113.38,"y":74.24,"z":3.5},"B12":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":113.38,"y":65.24,"z":3.5},"C12":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":113.38,"y":56.24,"z":3.5},"D12":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":113.38,"y":47.24,"z":3.5},"E12":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":113.38,"y":38.24,"z":3.5},"F12":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":113.38,"y":29.24,"z":3.5},"G12":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":113.38,"y":20.24,"z":3.5},"H12":{"depth":10.9,"totalLiquidVolume":392,"shape":"circular","diameter":6.58,"x":113.38,"y":11.24,"z":3.5}},"groups":[{"metadata":{"wellBottomShape":"flat"},"wells":["A1","B1","C1","D1","E1","F1","G1","H1","A2","B2","C2","D2","E2","F2","G2","H2","A3","B3","C3","D3","E3","F3","G3","H3","A4","B4","C4","D4","E4","F4","G4","H4","A5","B5","C5","D5","E5","F5","G5","H5","A6","B6","C6","D6","E6","F6","G6","H6","A7","B7","C7","D7","E7","F7","G7","H7","A8","B8","C8","D8","E8","F8","G8","H8","A9","B9","C9","D9","E9","F9","G9","H9","A10","B10","C10","D10","E10","F10","G10","H10","A11","B11","C11","D11","E11","F11","G11","H11","A12","B12","C12","D12","E12","F12","G12","H12"]}],"parameters":{"format":"irregular","quirks":[],"isTiprack":false,"isMagneticModuleCompatible":false,"loadName":"greinerbioone_96_wellplate_392ul"},"namespace":"custom_beta","version":1,"schemaVersion":2,"cornerOffsetFromSlot":{"x":0,"y":0,"z":0}}}"""
)

DESIGNER_APPLICATION = """{"robot":{"model":"OT-2 Standard"},"designerApplication":{"name":"opentrons/protocol-designer","version":"8.7.0","data":{"pipetteTiprackAssignments":{"28cce37a-bfca-44e2-b052-ac662943ec75":["opentrons/opentrons_96_tiprack_300ul/1"]},"dismissedWarnings":{"form":["BELOW_MIN_DISPOSAL_VOLUME","BELOW_PIPETTE_MINIMUM_VOLUME"],"timeline":["ASPIRATE_FROM_PRISTINE_WELL","ASPIRATE_MORE_THAN_WELL_CONTENTS"]},"ingredients":{"0":{"displayName":"Beep","description":"CB","displayColor":"#b925ff","liquidGroupId":"0"},"1":{"displayName":"Boop","description":null,"displayColor":"#ffd600","liquidGroupId":"1"},"2":{"displayName":"Bop","description":null,"displayColor":"#9dffd8","liquidGroupId":"2"},"3":{"displayName":"orange","description":null,"displayColor":"#ff9900","liquidGroupId":"3"}},"ingredLocations":{"03f52028-daed-455f-9061-6465e334baaf:opentrons/nest_12_reservoir_15ml/3":{"A1":{"0":{"volume":6000}},"A2":{"1":{"volume":7500}}},"bb1fc381-2258-48ad-a142-9bc52dd1f3f8:opentrons/eppendorf_96_wellplate_500ul/1":{},"b236366b-64eb-4930-aaf6-6680d58cf0a2:opentrons/eppendorf_96_wellplate_500ul/1":{"A1":{"3":{"volume":250}},"B1":{"3":{"volume":250}},"C1":{"3":{"volume":250}},"D1":{"3":{"volume":250}},"E1":{"3":{"volume":250}},"F1":{"3":{"volume":250}},"G1":{"3":{"volume":250}},"H1":{"3":{"volume":250}}},"5c45fbce-50a0-4b53-9a04-0161db32b5a8:opentrons/opentrons_96_tiprack_300ul/1":{}},"savedStepForms":{"__INITIAL_DECK_SETUP_STEP__":{"labwareLocationUpdate":{"cc8ecb3b-ed7e-4917-a96d-b445a3c014f1:opentrons/opentrons_96_tiprack_300ul/1":"5","03f52028-daed-455f-9061-6465e334baaf:opentrons/nest_12_reservoir_15ml/3":"3","b236366b-64eb-4930-aaf6-6680d58cf0a2:opentrons/eppendorf_96_wellplate_500ul/1":"4","bb1fc381-2258-48ad-a142-9bc52dd1f3f8:opentrons/eppendorf_96_wellplate_500ul/1":"2","cdc2332d-ab6f-4d5e-82d2-34f968ec4116:custom_beta/greinerbioone_96_wellplate_392ul/1":"1","5c45fbce-50a0-4b53-9a04-0161db32b5a8:opentrons/opentrons_96_tiprack_300ul/1":"6"},"moduleLocationUpdate":{},"pipetteLocationUpdate":{"28cce37a-bfca-44e2-b052-ac662943ec75":"right"},"trashBinLocationUpdate":{"5f6ba68f-ed82-4383-975b-51649784b0a4:trashBin":"cutout12"},"wasteChuteLocationUpdate":{},"stagingAreaLocationUpdate":{},"gripperLocationUpdate":{},"stepType":"manualIntervention","id":"__INITIAL_DECK_SETUP_STEP__","moduleStateUpdate":{}},"ef2fee28-ec90-4065-9cdd-59ddd03babfc":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"","aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":"50","aspirate_labware":"b236366b-64eb-4930-aaf6-6680d58cf0a2:opentrons/eppendorf_96_wellplate_500ul/1","aspirate_mix_checkbox":false,"aspirate_mix_times":"","aspirate_mix_volume":null,"aspirate_mmFromBottom":null,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"125","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"125","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":60,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":true,"blowout_flowRate":"10","blowout_location":"dest_well","changeTip":"once","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":"","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":"50","dispense_labware":"bb1fc381-2258-48ad-a142-9bc52dd1f3f8:opentrons/eppendorf_96_wellplate_500ul/1","dispense_mix_checkbox":false,"dispense_mix_times":"","dispense_mix_volume":null,"dispense_mmFromBottom":10,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"125","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"125","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":true,"dispense_touchTip_mmFromTop":-14,"dispense_touchTip_speed":"400","dispense_touchTip_mmFromEdge":"1.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1","A2"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":true,"disposalVolume_volume":null,"dropTip_location":"5f6ba68f-ed82-4383-975b-51649784b0a4:trashBin","liquidClassesSupported":true,"liquidClass":"none","nozzles":"ALL","path":"single","pipette":"28cce37a-bfca-44e2-b052-ac662943ec75","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":"0","tipRack":"opentrons/opentrons_96_tiprack_300ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"99","id":"ef2fee28-ec90-4065-9cdd-59ddd03babfc","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"a0595803-84ff-4e1e-aa0f-231837d9d9c1":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"","aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":"50","aspirate_labware":"03f52028-daed-455f-9061-6465e334baaf:opentrons/nest_12_reservoir_15ml/3","aspirate_mix_checkbox":false,"aspirate_mix_times":"","aspirate_mix_volume":null,"aspirate_mmFromBottom":null,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"125","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"125","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":60,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"10","blowout_location":"source_well","changeTip":"once","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":"","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":"50","dispense_labware":"bb1fc381-2258-48ad-a142-9bc52dd1f3f8:opentrons/eppendorf_96_wellplate_500ul/1","dispense_mix_checkbox":false,"dispense_mix_times":null,"dispense_mix_volume":null,"dispense_mmFromBottom":null,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"125","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"125","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":"400","dispense_touchTip_mmFromEdge":"1.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A3","A4","A5","A6","A7","A8"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":true,"disposalVolume_volume":"20","dropTip_location":"5f6ba68f-ed82-4383-975b-51649784b0a4:trashBin","liquidClassesSupported":true,"liquidClass":"none","nozzles":"ALL","path":"multiDispense","pipette":"28cce37a-bfca-44e2-b052-ac662943ec75","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":"0","tipRack":"opentrons/opentrons_96_tiprack_300ul/1","tip_tracking":"manual","tiprack_selected":"5c45fbce-50a0-4b53-9a04-0161db32b5a8:opentrons/opentrons_96_tiprack_300ul/1","tips_selected":[["A1","B1","C1","D1","E1","F1","G1","H1"]],"volume":"94","id":"a0595803-84ff-4e1e-aa0f-231837d9d9c1","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"843f63e4-1460-4d34-a534-7a9e08e3f62a":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"","aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":"50","aspirate_labware":"03f52028-daed-455f-9061-6465e334baaf:opentrons/nest_12_reservoir_15ml/3","aspirate_mix_checkbox":false,"aspirate_mix_times":"","aspirate_mix_volume":null,"aspirate_mmFromBottom":null,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"125","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"125","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":60,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":true,"blowout_flowRate":"10","blowout_location":"dest_well","changeTip":"once","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":"","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":"50","dispense_labware":"bb1fc381-2258-48ad-a142-9bc52dd1f3f8:opentrons/eppendorf_96_wellplate_500ul/1","dispense_mix_checkbox":false,"dispense_mix_times":"","dispense_mix_volume":null,"dispense_mmFromBottom":null,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"125","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"125","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":"400","dispense_touchTip_mmFromEdge":"1.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1","A2","A3","A4","A5","A6","A7","A8"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":true,"disposalVolume_volume":null,"dropTip_location":"5f6ba68f-ed82-4383-975b-51649784b0a4:trashBin","liquidClassesSupported":true,"liquidClass":"none","nozzles":"ALL","path":"single","pipette":"28cce37a-bfca-44e2-b052-ac662943ec75","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":"0","tipRack":"opentrons/opentrons_96_tiprack_300ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"100","id":"843f63e4-1460-4d34-a534-7a9e08e3f62a","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"eadd87e6-402b-42a6-9db8-2dc8773ec42c":{"moduleId":null,"pauseAction":"untilResume","pauseMessage":"Cover DeepWell plates with sealing mat and shake at RT and 1000 rpm for 30 min in the dark. Then, place them back on positions 5 and 6 and resume protocol!","pauseTemperature":null,"pauseTime":null,"id":"eadd87e6-402b-42a6-9db8-2dc8773ec42c","stepType":"pause","stepName":"pause","stepDetails":"","stepNumber":0},"59e429b1-d76f-43b7-8d7b-73bcba19b444":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"","aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":"50","aspirate_labware":"bb1fc381-2258-48ad-a142-9bc52dd1f3f8:opentrons/eppendorf_96_wellplate_500ul/1","aspirate_mix_checkbox":false,"aspirate_mix_times":"","aspirate_mix_volume":null,"aspirate_mmFromBottom":null,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"125","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"125","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":60,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1","A2","A3","A4","A5","A6","A7","A8"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":true,"blowout_flowRate":"10","blowout_location":"dest_well","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":"","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":"94","dispense_labware":"cdc2332d-ab6f-4d5e-82d2-34f968ec4116:custom_beta/greinerbioone_96_wellplate_392ul/1","dispense_mix_checkbox":false,"dispense_mix_times":"","dispense_mix_volume":null,"dispense_mmFromBottom":8,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"125","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"125","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":true,"dispense_touchTip_mmFromTop":-2.9,"dispense_touchTip_speed":"400","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1","A2","A3","A4","A5","A6","A7","A8"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":true,"disposalVolume_volume":null,"dropTip_location":"5f6ba68f-ed82-4383-975b-51649784b0a4:trashBin","liquidClassesSupported":true,"liquidClass":"none","nozzles":"ALL","path":"single","pipette":"28cce37a-bfca-44e2-b052-ac662943ec75","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":"0","tipRack":"opentrons/opentrons_96_tiprack_300ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"175","id":"59e429b1-d76f-43b7-8d7b-73bcba19b444","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"77e0ee2d-8279-44ee-af55-d9a6c4477786":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"","aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":"50","aspirate_labware":"bb1fc381-2258-48ad-a142-9bc52dd1f3f8:opentrons/eppendorf_96_wellplate_500ul/1","aspirate_mix_checkbox":false,"aspirate_mix_times":"","aspirate_mix_volume":null,"aspirate_mmFromBottom":null,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"125","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"125","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":60,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1","A2","A3","A4","A5","A6","A7","A8"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":true,"blowout_flowRate":"10","blowout_location":"dest_well","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":"","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":"94","dispense_labware":"cdc2332d-ab6f-4d5e-82d2-34f968ec4116:custom_beta/greinerbioone_96_wellplate_392ul/1","dispense_mix_checkbox":false,"dispense_mix_times":"","dispense_mix_volume":null,"dispense_mmFromBottom":8,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"125","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"125","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":true,"dispense_touchTip_mmFromTop":-2.9,"dispense_touchTip_speed":"400","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1","A2","A3","A4","A5","A6","A7","A8"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":true,"disposalVolume_volume":null,"dropTip_location":"5f6ba68f-ed82-4383-975b-51649784b0a4:trashBin","liquidClassesSupported":true,"liquidClass":"none","nozzles":"ALL","path":"single","pipette":"28cce37a-bfca-44e2-b052-ac662943ec75","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":"0","tipRack":"opentrons/opentrons_96_tiprack_300ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"175","id":"77e0ee2d-8279-44ee-af55-d9a6c4477786","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"8f510af5-2004-474f-91e6-363dae4336d8":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"","aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":"94","aspirate_labware":"b236366b-64eb-4930-aaf6-6680d58cf0a2:opentrons/eppendorf_96_wellplate_500ul/1","aspirate_mix_checkbox":false,"aspirate_mix_times":"","aspirate_mix_volume":null,"aspirate_mmFromBottom":null,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"125","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"125","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":true,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":60,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"94","blowout_location":null,"changeTip":"always","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":"","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":"94","dispense_labware":"b236366b-64eb-4930-aaf6-6680d58cf0a2:opentrons/eppendorf_96_wellplate_500ul/1","dispense_mix_checkbox":false,"dispense_mix_times":"","dispense_mix_volume":null,"dispense_mmFromBottom":null,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"125","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"125","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":60,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A7"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":true,"disposalVolume_volume":null,"dropTip_location":"5f6ba68f-ed82-4383-975b-51649784b0a4:trashBin","liquidClassesSupported":true,"liquidClass":"none","nozzles":"SINGLE","path":"single","pipette":"28cce37a-bfca-44e2-b052-ac662943ec75","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":"0","tipRack":"opentrons/opentrons_96_tiprack_300ul/1","tip_tracking":"manual","tiprack_selected":"5c45fbce-50a0-4b53-9a04-0161db32b5a8:opentrons/opentrons_96_tiprack_300ul/1","tips_selected":[["A8"]],"volume":"10","id":"8f510af5-2004-474f-91e6-363dae4336d8","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"8dc0b3a8-9b46-4cf2-99de-0cf4f08be317":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"","aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":"94","aspirate_labware":"cdc2332d-ab6f-4d5e-82d2-34f968ec4116:custom_beta/greinerbioone_96_wellplate_392ul/1","aspirate_mix_checkbox":false,"aspirate_mix_times":"","aspirate_mix_volume":null,"aspirate_mmFromBottom":null,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"125","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"125","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":60,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A3","A4","A5","A6","A7","A8"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"94","blowout_location":null,"changeTip":"always","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":"","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":"94","dispense_labware":"b236366b-64eb-4930-aaf6-6680d58cf0a2:opentrons/eppendorf_96_wellplate_500ul/1","dispense_mix_checkbox":false,"dispense_mix_times":"","dispense_mix_volume":null,"dispense_mmFromBottom":null,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"125","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"125","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":60,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A12"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":true,"disposalVolume_volume":null,"dropTip_location":"5f6ba68f-ed82-4383-975b-51649784b0a4:trashBin","liquidClassesSupported":true,"liquidClass":"none","nozzles":"SINGLE","path":"single","pipette":"28cce37a-bfca-44e2-b052-ac662943ec75","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":"0","tipRack":"opentrons/opentrons_96_tiprack_300ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"10","id":"8dc0b3a8-9b46-4cf2-99de-0cf4f08be317","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0}},"orderedStepIds":["ef2fee28-ec90-4065-9cdd-59ddd03babfc","a0595803-84ff-4e1e-aa0f-231837d9d9c1","843f63e4-1460-4d34-a534-7a9e08e3f62a","eadd87e6-402b-42a6-9db8-2dc8773ec42c","59e429b1-d76f-43b7-8d7b-73bcba19b444","77e0ee2d-8279-44ee-af55-d9a6c4477786","8f510af5-2004-474f-91e6-363dae4336d8","8dc0b3a8-9b46-4cf2-99de-0cf4f08be317"],"pipettes":{"28cce37a-bfca-44e2-b052-ac662943ec75":{"pipetteName":"p300_multi_gen2"}},"modules":{},"labware":{"cc8ecb3b-ed7e-4917-a96d-b445a3c014f1:opentrons/opentrons_96_tiprack_300ul/1":{"displayName":"Opentrons OT-2 96 Tip Rack 300 µL (1)","labwareDefURI":"opentrons/opentrons_96_tiprack_300ul/1"},"03f52028-daed-455f-9061-6465e334baaf:opentrons/nest_12_reservoir_15ml/3":{"displayName":"NEST 12 Well Reservoir 15 mL","labwareDefURI":"opentrons/nest_12_reservoir_15ml/3"},"b236366b-64eb-4930-aaf6-6680d58cf0a2:opentrons/eppendorf_96_wellplate_500ul/1":{"displayName":"Eppendorf 96 Well Plate 500 µL","labwareDefURI":"opentrons/eppendorf_96_wellplate_500ul/1"},"bb1fc381-2258-48ad-a142-9bc52dd1f3f8:opentrons/eppendorf_96_wellplate_500ul/1":{"displayName":"Eppendorf 96 Well Plate 500 µL (1)","labwareDefURI":"opentrons/eppendorf_96_wellplate_500ul/1"},"cdc2332d-ab6f-4d5e-82d2-34f968ec4116:custom_beta/greinerbioone_96_wellplate_392ul/1":{"displayName":"Greiner Bio-One 96 Well Plate 392 µL","labwareDefURI":"custom_beta/greinerbioone_96_wellplate_392ul/1"},"5c45fbce-50a0-4b53-9a04-0161db32b5a8:opentrons/opentrons_96_tiprack_300ul/1":{"displayName":"Opentrons OT-2 96 Tip Rack 300 µL (2)","labwareDefURI":"opentrons/opentrons_96_tiprack_300ul/1"}}}},"metadata":{"protocolName":"OT_2_S_871_custom_labware_partial_tip_transfer_consolidate_distribute_","author":"","description":"","created":1598036454614,"lastModified":1769453665354,"category":null,"subcategory":null,"tags":[],"source":"Protocol Designer"}}"""
