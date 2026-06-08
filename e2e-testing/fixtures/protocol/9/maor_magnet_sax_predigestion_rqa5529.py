import json
from opentrons import protocol_api, types

metadata = {
    "protocolName": "Maor_MagNet_SAX_96Sample_PreDigestion",
    "author": "Maor_Foster_Lab",
    "created": "2026-05-26T23:55:49.343Z",
    "internalAppBuildDate": "Thu, 04 Jun 2026 21:14:50 GMT",
    "lastModified": "2026-06-08T14:50:54.223Z",
    "protocolDesigner": "9.0.0-alpha.2",
    "source": "Protocol Designer",
}

requirements = {"robotType": "Flex", "apiLevel": "2.29"}

def run(protocol: protocol_api.ProtocolContext) -> None:
    # Load Modules:
    temperature_module_1 = protocol.load_module("temperatureModuleV2", "A1")
    temperature_module_2 = protocol.load_module("temperatureModuleV2", "B1")
    heater_shaker_module_1 = protocol.load_module("heaterShakerModuleV1", "C1")
    magnetic_block_1 = protocol.load_module("magneticBlockV1", "D1")
    absorbance_reader_1 = protocol.load_module("absorbanceReaderV1", "A3")

    # Load Adapters:
    adapter_1 = protocol.load_adapter(
        "opentrons_flex_96_tiprack_adapter",
        location="A2",
        namespace="opentrons",
        version=1,
    )

    # Load Labware:
    tip_rack_1 = protocol.load_labware(
        "opentrons_flex_96_filtertiprack_1000ul",
        location="D4",
        namespace="opentrons",
        version=1,
    )
    reservoir_1 = temperature_module_1.load_labware_from_definition(
        CUSTOM_LABWARE["custom_beta/opentrons_12_reservoir_22000ul/1"],
    )
    well_plate_1 = temperature_module_2.load_labware_from_definition(
        CUSTOM_LABWARE["custom_beta/griener_96_wellplate_323ul/1"],
    )
    tip_rack_2 = adapter_1.load_labware(
        "opentrons_flex_96_filtertiprack_1000ul",
        label="Opentrons Flex 96 Tip Rack Adapter (1)",
        namespace="opentrons",
        version=1,
    )
    tip_rack_3 = protocol.load_labware(
        "opentrons_flex_96_filtertiprack_1000ul",
        location="D2",
        label="Opentrons Flex 96 Tip Rack Adapter (2)",
        namespace="opentrons",
        version=1,
    )
    well_plate_2 = protocol.load_labware_from_definition(
        CUSTOM_LABWARE["custom_beta/griener_96_wellplate_323ul/1"],
        location="C3",
    )
    well_plate_3 = protocol.load_labware_from_definition(
        CUSTOM_LABWARE["custom_beta/griener_96_wellplate_323ul/1"],
        location="C2",
        label="Maor_Greiner 96 Well Plate 323 µL (1)",
    )
    tip_rack_4 = protocol.load_labware(
        "opentrons_flex_96_filtertiprack_50ul",
        location="B4",
        namespace="opentrons",
        version=1,
    )
    reservoir_2 = protocol.load_labware(
        "opentrons_tough_1_reservoir_300ml",
        location="B3",
        namespace="opentrons",
        version=2,
    )
    tip_rack_5 = protocol.load_labware(
        "opentrons_flex_96_filtertiprack_1000ul",
        location="C4",
        label="Opentrons Flex 96 Filter Tip Rack 1000 µL (1)",
        namespace="opentrons",
        version=1,
    )
    reservoir_3 = protocol.load_labware_from_definition(
        CUSTOM_LABWARE["custom_beta/opentrons_12_reservoir_22000ul/1"],
        location=protocol_api.OFF_DECK,
    )
    tip_rack_6 = protocol.load_labware(
        "opentrons_flex_96_filtertiprack_1000ul",
        location="B2",
        label="Opentrons Flex 96 Filter Tip Rack 1000 µL (2)",
        namespace="opentrons",
        version=1,
    )

    # Load Pipettes:
    pipette = protocol.load_instrument("flex_96channel_1000")

    # Load Waste Chute:
    waste_chute = protocol.load_waste_chute()

    # Define Liquids:
    liquid_1 = protocol.define_liquid(
        "Lysis_Reduction_Mix",
        display_color="#b925ff",
    )
    liquid_2 = protocol.define_liquid(
        "Equilibration_Wash_Buffer",
        display_color="#ffd600",
    )
    liquid_3 = protocol.define_liquid(
        "EV_Binding_Buffer",
        display_color="#9dffd8",
    )
    liquid_4 = protocol.define_liquid(
        "Acetonitrile",
        display_color="#ff9900",
    )
    liquid_5 = protocol.define_liquid(
        "Buffer_With_Enzyme",
        display_color="#50d5ff",
    )
    liquid_6 = protocol.define_liquid(
        "Raw_Plasma",
        display_color="#ff80f5",
    )
    liquid_7 = protocol.define_liquid(
        "SAX",
        display_color="#7eff42",
    )
    liquid_8 = protocol.define_liquid(
        "IAA",
        display_color="#ff4f4f",
    )

    # Load Liquids:
    well_plate_3.load_liquid(
        wells=[
            "A1", "B1", "C1", "D1", "E1", "F1", "G1", "H1"
        ],
        liquid=liquid_7,
        volume=275,
    )
    well_plate_3.load_liquid(
        wells=[
            "A2", "B2", "C2", "D2", "E2", "F2", "G2", "H2"
        ],
        liquid=liquid_8,
        volume=150,
    )
    reservoir_1.load_liquid(
        wells=["A1"],
        liquid=liquid_1,
        volume=20000,
    )
    reservoir_1.load_liquid(
        wells=["A2", "A3", "A4", "A5", "A6", "A7"],
        liquid=liquid_2,
        volume=20000,
    )
    reservoir_1.load_liquid(
        wells=["A8", "A9", "A10", "A11"],
        liquid=liquid_4,
        volume=20000,
    )
    reservoir_1.load_liquid(
        wells=["A12"],
        liquid=liquid_3,
        volume=20000,
    )
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
        liquid=liquid_6,
        volume=50,
    )
    reservoir_3.load_liquid(
        wells=["A1"],
        liquid=liquid_5,
        volume=20000,
    )

    # Load Liquid Classes:
    glycerol_50_base_class = protocol.get_liquid_class("glycerol_50")
    water_base_class = protocol.get_liquid_class("water")
    ethanol_80_base_class = protocol.get_liquid_class("ethanol_80")

    # PROTOCOL STEPS

    # Step 1: temperature
    temperature_module_1.start_set_temperature(4)

    # Step 2: temperature
    temperature_module_2.start_set_temperature(4)

    # Step 3: transfer
    pipette.configure_nozzle_layout(
        protocol_api.COLUMN,
        start="A12",
    )
    pipette.transfer_with_liquid_class(
        volume=12.5,
        source=[well_plate_3["A1"], well_plate_3["A1"], well_plate_3["A1"], well_plate_3["A1"], well_plate_3["A1"], well_plate_3["A1"], well_plate_3["A1"], well_plate_3["A1"], well_plate_3["A1"], well_plate_3["A1"], well_plate_3["A1"], well_plate_3["A1"]],
        dest=[well_plate_2["A1"], well_plate_2["A2"], well_plate_2["A3"], well_plate_2["A4"], well_plate_2["A5"], well_plate_2["A6"], well_plate_2["A7"], well_plate_2["A8"], well_plate_2["A9"], well_plate_2["A10"], well_plate_2["A11"], well_plate_2["A12"]],
        new_tip="once",
        trash_location=waste_chute,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_3, tip_rack_6, tip_rack_1, tip_rack_5],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_3",
            base_liquid_class=glycerol_50_base_class,
            properties={"flex_96channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 12.5)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0), (10, -0.2), (100, -0.1), (1000, 12)],
                    "delay": {"enabled": True, "duration": 0.7},
                    "mix": {"enabled": True, "repetitions": 3, "volume": 100},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 10,
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
                    "flow_rate_by_volume": [(0, 212)],
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
                        "blowout": {
                            "enabled": True,
                            "location": "destination",
                            "flow_rate": 224,
                            "blowout_position": {
                                "offset": {"x": 0, "y": 0, "z": 1},
                                "position_reference": "well-top",
                            },
                        },
                    },
                    "correction_by_volume": [(0, 0), (10, -0.2), (100, -0.1), (1000, 12)],
                    "push_out_by_volume": [(0, 35)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
        tips=[tip_rack_3["A1"]],
    )
    pipette.drop_tip(waste_chute)

    # Step 4: transfer
    pipette.configure_nozzle_layout(
        protocol_api.COLUMN,
        start="A12",
    )
    pipette.transfer_with_liquid_class(
        volume=200,
        source=[reservoir_1["A3"], reservoir_1["A3"], reservoir_1["A3"], reservoir_1["A3"], reservoir_1["A3"], reservoir_1["A3"], reservoir_1["A3"], reservoir_1["A3"], reservoir_1["A3"], reservoir_1["A3"], reservoir_1["A3"], reservoir_1["A3"]],
        dest=[well_plate_2["A1"], well_plate_2["A2"], well_plate_2["A3"], well_plate_2["A4"], well_plate_2["A5"], well_plate_2["A6"], well_plate_2["A7"], well_plate_2["A8"], well_plate_2["A9"], well_plate_2["A10"], well_plate_2["A11"], well_plate_2["A12"]],
        new_tip="once",
        return_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_3, tip_rack_6, tip_rack_1, tip_rack_5],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_4",
            base_liquid_class=water_base_class,
            properties={"flex_96channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 15},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 200)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": True, "duration": 0.5},
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
                        "air_gap_by_volume": [(0, 10)],
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
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 200)],
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
                        "air_gap_by_volume": [(0, 10)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 35,
                        "touch_tip": {"enabled": False},
                        "blowout": {
                            "enabled": True,
                            "location": "destination",
                            "flow_rate": 200,
                            "blowout_position": {
                                "offset": {"x": 0, "y": 0, "z": 1},
                                "position_reference": "well-top",
                            },
                        },
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 20)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
        tips=[tip_rack_3["A2"]],
    )

    # Step 5: Heater-Shaker
    heater_shaker_module_1.deactivate_heater()
    heater_shaker_module_1.open_labware_latch()

    # Step 6: move
    protocol.move_labware(well_plate_2, heater_shaker_module_1, use_gripper=True)

    # Step 7: Heater-Shaker
    heater_shaker_module_1.close_labware_latch()
    heater_shaker_module_1.deactivate_heater()
    heater_shaker_module_1.set_and_wait_for_shake_speed(800)
    protocol.delay(seconds=30)
    heater_shaker_module_1.deactivate_shaker()
    heater_shaker_module_1.deactivate_heater()

    # Step 8: Heater-Shaker
    heater_shaker_module_1.deactivate_heater()
    heater_shaker_module_1.open_labware_latch()

    # Step 9: move
    protocol.move_labware(well_plate_2, magnetic_block_1, use_gripper=True)

    # Step 10: move
    protocol.move_labware(tip_rack_6, "C3", use_gripper=True)

    # Step 11: transfer
    pipette.configure_nozzle_layout(
        protocol_api.COLUMN,
        start="A12",
    )
    pipette.transfer_with_liquid_class(
        volume=212.5,
        source=[well_plate_2["A1"], well_plate_2["A2"], well_plate_2["A3"], well_plate_2["A4"], well_plate_2["A5"], well_plate_2["A6"], well_plate_2["A7"], well_plate_2["A8"], well_plate_2["A9"], well_plate_2["A10"], well_plate_2["A11"], well_plate_2["A12"]],
        dest=[reservoir_2["A1"], reservoir_2["A1"], reservoir_2["A1"], reservoir_2["A1"], reservoir_2["A1"], reservoir_2["A1"], reservoir_2["A1"], reservoir_2["A1"], reservoir_2["A1"], reservoir_2["A1"], reservoir_2["A1"], reservoir_2["A1"]],
        new_tip="once",
        trash_location=waste_chute,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_3, tip_rack_6, tip_rack_1, tip_rack_5],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_11",
            base_liquid_class=water_base_class,
            properties={"flex_96channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 0.9},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 200)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": True, "duration": 0.5},
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
                        "air_gap_by_volume": [(0, 10)],
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
                    "flow_rate_by_volume": [(0, 200)],
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
                        "air_gap_by_volume": [(0, 10)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 35,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": False},
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 20)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
        tips=[tip_rack_3["A2"]],
    )
    pipette.drop_tip(waste_chute)

    # Step 12: move
    protocol.move_labware(well_plate_2, heater_shaker_module_1, use_gripper=True)

    # Step 13: Heater-Shaker
    heater_shaker_module_1.close_labware_latch()
    heater_shaker_module_1.deactivate_heater()

    # Step 14: transfer
    pipette.configure_nozzle_layout(
        protocol_api.COLUMN,
        start="A12",
    )
    pipette.transfer_with_liquid_class(
        volume=200,
        source=[reservoir_1["A4"], reservoir_1["A4"], reservoir_1["A4"], reservoir_1["A4"], reservoir_1["A4"], reservoir_1["A4"], reservoir_1["A4"], reservoir_1["A4"], reservoir_1["A4"], reservoir_1["A4"], reservoir_1["A4"], reservoir_1["A4"]],
        dest=[well_plate_2["A1"], well_plate_2["A2"], well_plate_2["A3"], well_plate_2["A4"], well_plate_2["A5"], well_plate_2["A6"], well_plate_2["A7"], well_plate_2["A8"], well_plate_2["A9"], well_plate_2["A10"], well_plate_2["A11"], well_plate_2["A12"]],
        new_tip="once",
        return_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_3, tip_rack_6, tip_rack_1, tip_rack_5],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_14",
            base_liquid_class=water_base_class,
            properties={"flex_96channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 15},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 200)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": True, "duration": 0.5},
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
                        "air_gap_by_volume": [(0, 10)],
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
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 200)],
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
                        "air_gap_by_volume": [(0, 10)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 35,
                        "touch_tip": {"enabled": False},
                        "blowout": {
                            "enabled": True,
                            "location": "destination",
                            "flow_rate": 200,
                            "blowout_position": {
                                "offset": {"x": 0, "y": 0, "z": 1},
                                "position_reference": "well-top",
                            },
                        },
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 20)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
        tips=[tip_rack_3["A3"]],
    )

    # Step 15: Heater-Shaker
    heater_shaker_module_1.close_labware_latch()
    heater_shaker_module_1.deactivate_heater()
    heater_shaker_module_1.set_and_wait_for_shake_speed(800)
    protocol.delay(seconds=30)
    heater_shaker_module_1.deactivate_shaker()
    heater_shaker_module_1.deactivate_heater()

    # Step 16: Heater-Shaker
    heater_shaker_module_1.deactivate_heater()
    heater_shaker_module_1.open_labware_latch()

    # Step 17: move
    protocol.move_labware(well_plate_2, magnetic_block_1, use_gripper=True)

    # Step 18: transfer
    pipette.configure_nozzle_layout(
        protocol_api.COLUMN,
        start="A12",
    )
    pipette.transfer_with_liquid_class(
        volume=200,
        source=[well_plate_2["A1"], well_plate_2["A2"], well_plate_2["A3"], well_plate_2["A4"], well_plate_2["A5"], well_plate_2["A6"], well_plate_2["A7"], well_plate_2["A8"], well_plate_2["A9"], well_plate_2["A10"], well_plate_2["A11"], well_plate_2["A12"]],
        dest=[reservoir_2["A1"], reservoir_2["A1"], reservoir_2["A1"], reservoir_2["A1"], reservoir_2["A1"], reservoir_2["A1"], reservoir_2["A1"], reservoir_2["A1"], reservoir_2["A1"], reservoir_2["A1"], reservoir_2["A1"], reservoir_2["A1"]],
        new_tip="once",
        trash_location=waste_chute,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_3, tip_rack_6, tip_rack_1, tip_rack_5],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_18",
            base_liquid_class=water_base_class,
            properties={"flex_96channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 0.9},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 200)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": True, "duration": 0.5},
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
                        "air_gap_by_volume": [(0, 10)],
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
                    "flow_rate_by_volume": [(0, 200)],
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
                        "air_gap_by_volume": [(0, 10)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 35,
                        "touch_tip": {"enabled": False},
                        "blowout": {
                            "enabled": True,
                            "location": "destination",
                            "flow_rate": 200,
                            "blowout_position": {
                                "offset": {"x": 0, "y": 0, "z": 1},
                                "position_reference": "well-top",
                            },
                        },
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 20)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
        tips=[tip_rack_3["A3"]],
    )
    pipette.drop_tip(waste_chute)

    # Step 19: move
    protocol.move_labware(well_plate_2, heater_shaker_module_1, use_gripper=True)

    # Step 20: Heater-Shaker
    heater_shaker_module_1.close_labware_latch()
    heater_shaker_module_1.deactivate_heater()

    # Step 21: transfer
    pipette.configure_nozzle_layout(
        protocol_api.COLUMN,
        start="A12",
    )
    pipette.transfer_with_liquid_class(
        volume=200,
        source=[reservoir_1["A2"], reservoir_1["A2"], reservoir_1["A2"], reservoir_1["A2"], reservoir_1["A2"], reservoir_1["A2"], reservoir_1["A2"], reservoir_1["A2"], reservoir_1["A2"], reservoir_1["A2"], reservoir_1["A2"], reservoir_1["A2"]],
        dest=[well_plate_2["A1"], well_plate_2["A2"], well_plate_2["A3"], well_plate_2["A4"], well_plate_2["A5"], well_plate_2["A6"], well_plate_2["A7"], well_plate_2["A8"], well_plate_2["A9"], well_plate_2["A10"], well_plate_2["A11"], well_plate_2["A12"]],
        new_tip="once",
        return_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_3, tip_rack_6, tip_rack_1, tip_rack_5],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_21",
            base_liquid_class=water_base_class,
            properties={"flex_96channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 15},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 200)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": True, "duration": 0.5},
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
                        "air_gap_by_volume": [(0, 10)],
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
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 200)],
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
                        "air_gap_by_volume": [(0, 10)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 35,
                        "touch_tip": {"enabled": False},
                        "blowout": {
                            "enabled": True,
                            "location": "destination",
                            "flow_rate": 200,
                            "blowout_position": {
                                "offset": {"x": 0, "y": 0, "z": 1},
                                "position_reference": "well-top",
                            },
                        },
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 20)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
        tips=[tip_rack_3["A4"]],
    )

    # Step 22: Heater-Shaker
    heater_shaker_module_1.close_labware_latch()
    heater_shaker_module_1.deactivate_heater()
    heater_shaker_module_1.set_and_wait_for_shake_speed(800)
    protocol.delay(seconds=30)
    heater_shaker_module_1.deactivate_shaker()
    heater_shaker_module_1.deactivate_heater()

    # Step 23: Heater-Shaker
    heater_shaker_module_1.deactivate_heater()
    heater_shaker_module_1.open_labware_latch()

    # Step 24: move
    protocol.move_labware(well_plate_2, magnetic_block_1, use_gripper=True)

    # Step 25: move
    protocol.move_labware(tip_rack_4, "B2", use_gripper=True)

    # Step 26: move
    protocol.move_labware(tip_rack_6, "B4", use_gripper=True)

    # Step 27: move
    protocol.move_labware(tip_rack_4, "C3", use_gripper=True)

    # Step 28: transfer
    pipette.configure_nozzle_layout(
        protocol_api.COLUMN,
        start="A12",
    )
    pipette.transfer_with_liquid_class(
        volume=200,
        source=[well_plate_2["A1"], well_plate_2["A2"], well_plate_2["A3"], well_plate_2["A4"], well_plate_2["A5"], well_plate_2["A6"], well_plate_2["A7"], well_plate_2["A8"], well_plate_2["A9"], well_plate_2["A10"], well_plate_2["A11"], well_plate_2["A12"]],
        dest=[reservoir_2["A1"], reservoir_2["A1"], reservoir_2["A1"], reservoir_2["A1"], reservoir_2["A1"], reservoir_2["A1"], reservoir_2["A1"], reservoir_2["A1"], reservoir_2["A1"], reservoir_2["A1"], reservoir_2["A1"], reservoir_2["A1"]],
        new_tip="once",
        trash_location=waste_chute,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_3, tip_rack_1, tip_rack_5, tip_rack_6],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_28",
            base_liquid_class=water_base_class,
            properties={"flex_96channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 0.9},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 200)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": True, "duration": 0.5},
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
                        "air_gap_by_volume": [(0, 10)],
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
                    "flow_rate_by_volume": [(0, 200)],
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
                        "air_gap_by_volume": [(0, 10)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 35,
                        "touch_tip": {"enabled": False},
                        "blowout": {
                            "enabled": True,
                            "location": "destination",
                            "flow_rate": 200,
                            "blowout_position": {
                                "offset": {"x": 0, "y": 0, "z": 1},
                                "position_reference": "well-top",
                            },
                        },
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 20)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
        tips=[tip_rack_3["A4"]],
    )
    pipette.drop_tip(waste_chute)

    # Step 29: transfer
    pipette.configure_nozzle_layout(
        protocol_api.COLUMN,
        start="A12",
    )
    pipette.transfer_with_liquid_class(
        volume=50,
        source=[reservoir_1["A12"], reservoir_1["A12"], reservoir_1["A12"], reservoir_1["A12"], reservoir_1["A12"], reservoir_1["A12"], reservoir_1["A12"], reservoir_1["A12"], reservoir_1["A12"], reservoir_1["A12"], reservoir_1["A12"], reservoir_1["A12"]],
        dest=[well_plate_1["A1"], well_plate_1["A2"], well_plate_1["A3"], well_plate_1["A4"], well_plate_1["A5"], well_plate_1["A6"], well_plate_1["A7"], well_plate_1["A8"], well_plate_1["A9"], well_plate_1["A10"], well_plate_1["A11"], well_plate_1["A12"]],
        new_tip="once",
        trash_location=waste_chute,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_4],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_29",
            base_liquid_class=water_base_class,
            properties={"flex_96channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_50ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 5},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 200)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": True, "duration": 0.5},
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
                        "air_gap_by_volume": [(0, 0)],
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
                        "offset": {"x": 0, "y": 0, "z": 9},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 200)],
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
                        "air_gap_by_volume": [(0, 1)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 35,
                        "touch_tip": {"enabled": False},
                        "blowout": {
                            "enabled": True,
                            "location": "destination",
                            "flow_rate": 200,
                            "blowout_position": {
                                "offset": {"x": 0, "y": 0, "z": 1},
                                "position_reference": "well-top",
                            },
                        },
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 20)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
    )
    pipette.drop_tip(waste_chute)

    # Step 30: move
    protocol.move_labware(well_plate_1, heater_shaker_module_1, use_gripper=True)

    # Step 31: Heater-Shaker
    heater_shaker_module_1.close_labware_latch()
    heater_shaker_module_1.deactivate_heater()
    heater_shaker_module_1.set_and_wait_for_shake_speed(800)
    protocol.delay(seconds=30)
    heater_shaker_module_1.deactivate_shaker()
    heater_shaker_module_1.deactivate_heater()

    # Step 32: Heater-Shaker
    heater_shaker_module_1.deactivate_heater()
    heater_shaker_module_1.open_labware_latch()

    # Step 33: move
    protocol.move_labware(well_plate_1, temperature_module_2, use_gripper=True)

    # Step 34: move
    protocol.move_labware(well_plate_2, heater_shaker_module_1, use_gripper=True)

    # Step 35: Heater-Shaker
    heater_shaker_module_1.close_labware_latch()
    heater_shaker_module_1.deactivate_heater()

    # Step 36: transfer
    pipette.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette.transfer_with_liquid_class(
        volume=100,
        source=[well_plate_1["A1"]],
        dest=[well_plate_2["A1"]],
        new_tip="always",
        return_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_2],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_36",
            base_liquid_class=water_base_class,
            properties={"flex_96channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 0.9},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 200)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": True, "duration": 0.5},
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
                        "air_gap_by_volume": [(0, 10)],
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
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 200)],
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
                        "air_gap_by_volume": [(0, 10)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 35,
                        "touch_tip": {"enabled": False},
                        "blowout": {
                            "enabled": True,
                            "location": "destination",
                            "flow_rate": 200,
                            "blowout_position": {
                                "offset": {"x": 0, "y": 0, "z": 1},
                                "position_reference": "well-top",
                            },
                        },
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 20)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
    )

    # Step 37: move
    protocol.move_labware(well_plate_1, waste_chute, use_gripper=True)

    # Step 38: Heater-Shaker
    heater_shaker_module_1.close_labware_latch()
    heater_shaker_module_1.deactivate_heater()
    heater_shaker_module_1.set_and_wait_for_shake_speed(800)
    protocol.delay(seconds=1800)
    heater_shaker_module_1.deactivate_shaker()
    heater_shaker_module_1.deactivate_heater()

    # Step 39: Heater-Shaker
    heater_shaker_module_1.deactivate_heater()
    heater_shaker_module_1.open_labware_latch()

    # Step 40: move
    protocol.move_labware(well_plate_2, magnetic_block_1, use_gripper=True)

    # Step 41: move
    protocol.move_labware(tip_rack_6, "B2", use_gripper=True)

    # Step 42: move
    protocol.move_labware(tip_rack_4, "B4", use_gripper=True)

    # Step 43: transfer
    pipette.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette.transfer_with_liquid_class(
        volume=100,
        source=[well_plate_2["A1"]],
        dest=[reservoir_2["A1"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_2],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_43",
            base_liquid_class=water_base_class,
            properties={"flex_96channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 0.9},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 200)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": True, "duration": 0.5},
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
                        "air_gap_by_volume": [(0, 10)],
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
                    "flow_rate_by_volume": [(0, 200)],
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
                        "air_gap_by_volume": [(0, 10)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 35,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": False},
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 20)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
        tips=[tip_rack_2["A1"]],
    )
    pipette.drop_tip(waste_chute)

    # Step 44: transfer
    pipette.configure_nozzle_layout(
        protocol_api.COLUMN,
        start="A12",
    )
    pipette.transfer_with_liquid_class(
        volume=200,
        source=[reservoir_1["A5"], reservoir_1["A5"], reservoir_1["A5"], reservoir_1["A5"], reservoir_1["A5"], reservoir_1["A5"], reservoir_1["A5"], reservoir_1["A5"], reservoir_1["A5"], reservoir_1["A5"], reservoir_1["A5"], reservoir_1["A5"]],
        dest=[well_plate_2["A1"], well_plate_2["A2"], well_plate_2["A3"], well_plate_2["A4"], well_plate_2["A5"], well_plate_2["A6"], well_plate_2["A7"], well_plate_2["A8"], well_plate_2["A9"], well_plate_2["A10"], well_plate_2["A11"], well_plate_2["A12"]],
        new_tip="once",
        return_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_3, tip_rack_6, tip_rack_1, tip_rack_5],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_44",
            base_liquid_class=water_base_class,
            properties={"flex_96channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 15},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 200)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": True, "duration": 0.5},
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
                        "air_gap_by_volume": [(0, 10)],
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
                        "offset": {"x": 0, "y": 0, "z": 9},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 200)],
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
                        "air_gap_by_volume": [(0, 10)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 35,
                        "touch_tip": {"enabled": False},
                        "blowout": {
                            "enabled": True,
                            "location": "destination",
                            "flow_rate": 200,
                            "blowout_position": {
                                "offset": {"x": 0, "y": 0, "z": 1},
                                "position_reference": "well-top",
                            },
                        },
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 20)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
    )

    # Step 45: move
    protocol.move_labware(well_plate_2, heater_shaker_module_1, use_gripper=True)

    # Step 46: Heater-Shaker
    heater_shaker_module_1.close_labware_latch()
    heater_shaker_module_1.deactivate_heater()
    heater_shaker_module_1.set_and_wait_for_shake_speed(800)
    protocol.delay(seconds=300)
    heater_shaker_module_1.deactivate_shaker()
    heater_shaker_module_1.deactivate_heater()

    # Step 47: Heater-Shaker
    heater_shaker_module_1.deactivate_heater()
    heater_shaker_module_1.open_labware_latch()

    # Step 48: move
    protocol.move_labware(well_plate_2, magnetic_block_1, use_gripper=True)

    # Step 49: move
    protocol.move_labware(tip_rack_2, "C3", use_gripper=True)

    # Step 50: move
    protocol.move_labware(tip_rack_5, adapter_1, use_gripper=True)

    # Step 51: move
    protocol.move_labware(tip_rack_2, "C4", use_gripper=True)

    # Step 52: transfer
    pipette.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette.transfer_with_liquid_class(
        volume=200,
        source=[well_plate_2["A1"]],
        dest=[reservoir_2["A1"]],
        new_tip="always",
        return_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_5],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_52",
            base_liquid_class=water_base_class,
            properties={"flex_96channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 0.9},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 200)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": True, "duration": 0.5},
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
                        "air_gap_by_volume": [(0, 10)],
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
                    "flow_rate_by_volume": [(0, 200)],
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
                        "air_gap_by_volume": [(0, 10)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 35,
                        "touch_tip": {"enabled": False},
                        "blowout": {
                            "enabled": True,
                            "location": "destination",
                            "flow_rate": 200,
                            "blowout_position": {
                                "offset": {"x": 0, "y": 0, "z": 1},
                                "position_reference": "well-top",
                            },
                        },
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 20)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
    )

    # Step 53: transfer
    pipette.configure_nozzle_layout(
        protocol_api.COLUMN,
        start="A12",
    )
    pipette.transfer_with_liquid_class(
        volume=200,
        source=[reservoir_1["A6"], reservoir_1["A6"], reservoir_1["A6"], reservoir_1["A6"], reservoir_1["A6"], reservoir_1["A6"], reservoir_1["A6"], reservoir_1["A6"], reservoir_1["A6"], reservoir_1["A6"], reservoir_1["A6"], reservoir_1["A6"]],
        dest=[well_plate_2["A1"], well_plate_2["A2"], well_plate_2["A3"], well_plate_2["A4"], well_plate_2["A5"], well_plate_2["A6"], well_plate_2["A7"], well_plate_2["A8"], well_plate_2["A9"], well_plate_2["A10"], well_plate_2["A11"], well_plate_2["A12"]],
        new_tip="once",
        return_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_3, tip_rack_6, tip_rack_1, tip_rack_2],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_53",
            base_liquid_class=water_base_class,
            properties={"flex_96channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 15},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 200)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": True, "duration": 0.5},
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
                        "air_gap_by_volume": [(0, 10)],
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
                        "offset": {"x": 0, "y": 0, "z": 9},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 200)],
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
                        "air_gap_by_volume": [(0, 10)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 35,
                        "touch_tip": {"enabled": False},
                        "blowout": {
                            "enabled": True,
                            "location": "destination",
                            "flow_rate": 200,
                            "blowout_position": {
                                "offset": {"x": 0, "y": 0, "z": 1},
                                "position_reference": "well-top",
                            },
                        },
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 20)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
        tips=[tip_rack_3["A5"]],
    )

    # Step 54: move
    protocol.move_labware(well_plate_2, heater_shaker_module_1, use_gripper=True)

    # Step 55: Heater-Shaker
    heater_shaker_module_1.close_labware_latch()
    heater_shaker_module_1.deactivate_heater()
    heater_shaker_module_1.set_and_wait_for_shake_speed(800)
    protocol.delay(seconds=300)
    heater_shaker_module_1.deactivate_shaker()
    heater_shaker_module_1.deactivate_heater()

    # Step 56: Heater-Shaker
    heater_shaker_module_1.deactivate_heater()
    heater_shaker_module_1.open_labware_latch()

    # Step 57: move
    protocol.move_labware(well_plate_2, magnetic_block_1, use_gripper=True)

    # Step 58: transfer
    pipette.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette.transfer_with_liquid_class(
        volume=200,
        source=[well_plate_2["A1"]],
        dest=[reservoir_2["A1"]],
        new_tip="always",
        return_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_5],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_58",
            base_liquid_class=water_base_class,
            properties={"flex_96channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 0.9},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 200)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": True, "duration": 0.5},
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
                        "air_gap_by_volume": [(0, 10)],
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
                    "flow_rate_by_volume": [(0, 200)],
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
                        "air_gap_by_volume": [(0, 10)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 35,
                        "touch_tip": {"enabled": False},
                        "blowout": {
                            "enabled": True,
                            "location": "destination",
                            "flow_rate": 200,
                            "blowout_position": {
                                "offset": {"x": 0, "y": 0, "z": 1},
                                "position_reference": "well-top",
                            },
                        },
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 20)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
        tips=[tip_rack_5["A1"]],
    )

    # Step 59: transfer
    pipette.configure_nozzle_layout(
        protocol_api.COLUMN,
        start="A12",
    )
    pipette.transfer_with_liquid_class(
        volume=200,
        source=[reservoir_1["A7"], reservoir_1["A7"], reservoir_1["A7"], reservoir_1["A7"], reservoir_1["A7"], reservoir_1["A7"], reservoir_1["A7"], reservoir_1["A7"], reservoir_1["A7"], reservoir_1["A7"], reservoir_1["A7"], reservoir_1["A7"]],
        dest=[well_plate_2["A1"], well_plate_2["A2"], well_plate_2["A3"], well_plate_2["A4"], well_plate_2["A5"], well_plate_2["A6"], well_plate_2["A7"], well_plate_2["A8"], well_plate_2["A9"], well_plate_2["A10"], well_plate_2["A11"], well_plate_2["A12"]],
        new_tip="once",
        trash_location=waste_chute,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_3, tip_rack_6, tip_rack_1, tip_rack_2],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_59",
            base_liquid_class=water_base_class,
            properties={"flex_96channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 15},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 200)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": True, "duration": 0.5},
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
                        "air_gap_by_volume": [(0, 10)],
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
                        "offset": {"x": 0, "y": 0, "z": 9},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 200)],
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
                        "air_gap_by_volume": [(0, 10)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 35,
                        "touch_tip": {"enabled": False},
                        "blowout": {
                            "enabled": True,
                            "location": "destination",
                            "flow_rate": 200,
                            "blowout_position": {
                                "offset": {"x": 0, "y": 0, "z": 1},
                                "position_reference": "well-top",
                            },
                        },
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 20)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
        tips=[tip_rack_3["A5"]],
    )
    pipette.drop_tip(waste_chute)

    # Step 60: move
    protocol.move_labware(well_plate_2, heater_shaker_module_1, use_gripper=True)

    # Step 61: Heater-Shaker
    heater_shaker_module_1.close_labware_latch()
    heater_shaker_module_1.deactivate_heater()
    heater_shaker_module_1.set_and_wait_for_shake_speed(800)
    protocol.delay(seconds=300)
    heater_shaker_module_1.deactivate_shaker()
    heater_shaker_module_1.deactivate_heater()

    # Step 62: Heater-Shaker
    heater_shaker_module_1.deactivate_heater()
    heater_shaker_module_1.open_labware_latch()

    # Step 63: move
    protocol.move_labware(well_plate_2, magnetic_block_1, use_gripper=True)

    # Step 64: transfer
    pipette.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette.transfer_with_liquid_class(
        volume=200,
        source=[well_plate_2["A1"]],
        dest=[reservoir_2["A1"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_5],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_64",
            base_liquid_class=water_base_class,
            properties={"flex_96channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 0.9},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 200)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": True, "duration": 0.5},
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
                        "air_gap_by_volume": [(0, 10)],
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
                    "flow_rate_by_volume": [(0, 200)],
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
                        "air_gap_by_volume": [(0, 10)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 35,
                        "touch_tip": {"enabled": False},
                        "blowout": {
                            "enabled": True,
                            "location": "destination",
                            "flow_rate": 200,
                            "blowout_position": {
                                "offset": {"x": 0, "y": 0, "z": 1},
                                "position_reference": "well-top",
                            },
                        },
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 20)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
        tips=[tip_rack_5["A1"]],
    )
    pipette.drop_tip(waste_chute)

    # Step 65: move
    protocol.move_labware(tip_rack_4, "C3", use_gripper=True)

    # Step 66: transfer
    pipette.configure_nozzle_layout(
        protocol_api.COLUMN,
        start="A12",
    )
    pipette.transfer_with_liquid_class(
        volume=50,
        source=[reservoir_1["A1"], reservoir_1["A1"], reservoir_1["A1"], reservoir_1["A1"], reservoir_1["A1"], reservoir_1["A1"], reservoir_1["A1"], reservoir_1["A1"], reservoir_1["A1"], reservoir_1["A1"], reservoir_1["A1"], reservoir_1["A1"]],
        dest=[well_plate_2["A1"], well_plate_2["A2"], well_plate_2["A3"], well_plate_2["A4"], well_plate_2["A5"], well_plate_2["A6"], well_plate_2["A7"], well_plate_2["A8"], well_plate_2["A9"], well_plate_2["A10"], well_plate_2["A11"], well_plate_2["A12"]],
        new_tip="once",
        trash_location=waste_chute,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_4],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_66",
            base_liquid_class=water_base_class,
            properties={"flex_96channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_50ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 15},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 200)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": True, "duration": 0.5},
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
                        "air_gap_by_volume": [(0, 0)],
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
                        "offset": {"x": 0, "y": 0, "z": 9},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 200)],
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
                        "air_gap_by_volume": [(0, 1)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 35,
                        "touch_tip": {"enabled": False},
                        "blowout": {
                            "enabled": True,
                            "location": "destination",
                            "flow_rate": 200,
                            "blowout_position": {
                                "offset": {"x": 0, "y": 0, "z": 1},
                                "position_reference": "well-top",
                            },
                        },
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 20)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
    )
    pipette.drop_tip(waste_chute)

    # Step 67: move
    protocol.move_labware(well_plate_2, heater_shaker_module_1, use_gripper=True)

    # Step 68: Heater-Shaker
    heater_shaker_module_1.close_labware_latch()
    heater_shaker_module_1.set_target_temperature(37)
    heater_shaker_module_1.set_and_wait_for_shake_speed(800)
    heater_shaker_module_1.wait_for_temperature()
    protocol.delay(seconds=3600)
    heater_shaker_module_1.deactivate_shaker()
    heater_shaker_module_1.deactivate_heater()

    # Step 69: transfer
    pipette.configure_nozzle_layout(
        protocol_api.COLUMN,
        start="A12",
    )
    pipette.transfer_with_liquid_class(
        volume=3,
        source=[well_plate_3["A2"], well_plate_3["A2"], well_plate_3["A2"], well_plate_3["A2"], well_plate_3["A2"], well_plate_3["A2"], well_plate_3["A2"], well_plate_3["A2"], well_plate_3["A2"], well_plate_3["A2"], well_plate_3["A2"], well_plate_3["A2"]],
        dest=[well_plate_2["A1"], well_plate_2["A2"], well_plate_2["A3"], well_plate_2["A4"], well_plate_2["A5"], well_plate_2["A6"], well_plate_2["A7"], well_plate_2["A8"], well_plate_2["A9"], well_plate_2["A10"], well_plate_2["A11"], well_plate_2["A12"]],
        new_tip="once",
        trash_location=waste_chute,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_4],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_69",
            base_liquid_class=water_base_class,
            properties={"flex_96channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_50ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 173)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": True, "duration": 0.5},
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
                        "air_gap_by_volume": [(0, 1)],
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
                        "offset": {"x": 0, "y": 0, "z": 9},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 173)],
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
                        "air_gap_by_volume": [(0, 1)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 35,
                        "touch_tip": {"enabled": False},
                        "blowout": {
                            "enabled": True,
                            "location": "destination",
                            "flow_rate": 200,
                            "blowout_position": {
                                "offset": {"x": 0, "y": 0, "z": 1},
                                "position_reference": "well-top",
                            },
                        },
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 20)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
    )
    pipette.drop_tip(waste_chute)

    # Step 70: Heater-Shaker
    heater_shaker_module_1.close_labware_latch()
    heater_shaker_module_1.deactivate_heater()
    heater_shaker_module_1.set_and_wait_for_shake_speed(800)
    protocol.delay(seconds=1800)
    heater_shaker_module_1.deactivate_shaker()
    heater_shaker_module_1.deactivate_heater()

    # Step 71: transfer
    pipette.configure_nozzle_layout(
        protocol_api.COLUMN,
        start="A12",
    )
    pipette.transfer_with_liquid_class(
        volume=150,
        source=[reservoir_1["A8"], reservoir_1["A8"], reservoir_1["A8"], reservoir_1["A8"], reservoir_1["A8"], reservoir_1["A8"], reservoir_1["A8"], reservoir_1["A8"], reservoir_1["A8"], reservoir_1["A8"], reservoir_1["A8"], reservoir_1["A8"]],
        dest=[well_plate_2["A1"], well_plate_2["A2"], well_plate_2["A3"], well_plate_2["A4"], well_plate_2["A5"], well_plate_2["A6"], well_plate_2["A7"], well_plate_2["A8"], well_plate_2["A9"], well_plate_2["A10"], well_plate_2["A11"], well_plate_2["A12"]],
        new_tip="once",
        return_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_3, tip_rack_6, tip_rack_1, tip_rack_2],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_71",
            base_liquid_class=ethanol_80_base_class,
            properties={"flex_96channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 15},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 150)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0), (10, -0.4), (100, -2.6), (1000, -32.2)],
                    "delay": {"enabled": True, "duration": 0.2},
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
                        "air_gap_by_volume": [(0, 12)],
                        "delay": {"enabled": True, "duration": 0.5},
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
                        "offset": {"x": 0, "y": 0, "z": 9},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 200)],
                    "delay": {"enabled": True, "duration": 1},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 35,
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
                        "speed": 35,
                        "touch_tip": {"enabled": False},
                        "blowout": {
                            "enabled": True,
                            "location": "destination",
                            "flow_rate": 200,
                            "blowout_position": {
                                "offset": {"x": 0, "y": 0, "z": 1},
                                "position_reference": "well-top",
                            },
                        },
                    },
                    "correction_by_volume": [(0, 0), (10, -0.4), (100, -2.6), (1000, -32.2)],
                    "push_out_by_volume": [(0, 0)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
    )

    # Step 72: move
    protocol.move_labware(tip_rack_5, "B4", use_gripper=True)

    # Step 73: move
    protocol.move_labware(tip_rack_1, adapter_1, use_gripper=True)

    # Step 74: mix
    pipette.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette.pick_up_tip(location=tip_rack_1)
    pipette.mix(
        repetitions=5,
        volume=203,
        location=well_plate_2["A1"].bottom(z=1),
        aspirate_flow_rate=200,
        dispense_flow_rate=200,
        final_push_out=20,
    )
    pipette.flow_rate.blow_out = 200
    pipette.blow_out(well_plate_2["A1"].top())
    pipette.drop_tip(location=tip_rack_1["A1"])

    # Step 75: Heater-Shaker
    heater_shaker_module_1.deactivate_heater()
    protocol.delay(seconds=600)
    heater_shaker_module_1.deactivate_shaker()
    heater_shaker_module_1.deactivate_heater()
    heater_shaker_module_1.open_labware_latch()

    # Step 76: move
    protocol.move_labware(well_plate_2, magnetic_block_1, use_gripper=True)

    # Step 77: move
    protocol.move_labware(tip_rack_4, "D4", use_gripper=True)

    # Step 78: move
    protocol.move_labware(reservoir_3, temperature_module_2)

    # Step 79: transfer
    pipette.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette.transfer_with_liquid_class(
        volume=203,
        source=[well_plate_2["A1"]],
        dest=[reservoir_2["A1"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_1],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_79",
            base_liquid_class=ethanol_80_base_class,
            properties={"flex_96channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 0.9},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 200)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0), (10, -0.4), (100, -2.6), (1000, -32.2)],
                    "delay": {"enabled": True, "duration": 0.2},
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
                        "air_gap_by_volume": [(0, 11.7)],
                        "delay": {"enabled": True, "duration": 0.5},
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
                    "flow_rate_by_volume": [(0, 200)],
                    "delay": {"enabled": True, "duration": 1},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 35,
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
                        "speed": 35,
                        "touch_tip": {"enabled": False},
                        "blowout": {
                            "enabled": True,
                            "location": "destination",
                            "flow_rate": 200,
                            "blowout_position": {
                                "offset": {"x": 0, "y": 0, "z": 1},
                                "position_reference": "well-top",
                            },
                        },
                    },
                    "correction_by_volume": [(0, 0), (10, -0.4), (100, -2.6), (1000, -32.2)],
                    "push_out_by_volume": [(0, 0)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
        tips=[tip_rack_1["A1"]],
    )
    pipette.drop_tip(waste_chute)

    # Step 80: move
    protocol.move_labware(tip_rack_1, "C3", use_gripper=True)

    # Step 81: move
    protocol.move_labware(tip_rack_6, adapter_1, use_gripper=True)

    # Step 82: transfer
    pipette.configure_nozzle_layout(
        protocol_api.COLUMN,
        start="A12",
    )
    pipette.transfer_with_liquid_class(
        volume=200,
        source=[reservoir_1["A9"], reservoir_1["A9"], reservoir_1["A9"], reservoir_1["A9"], reservoir_1["A9"], reservoir_1["A9"], reservoir_1["A9"], reservoir_1["A9"], reservoir_1["A9"], reservoir_1["A9"], reservoir_1["A9"], reservoir_1["A9"]],
        dest=[well_plate_2["A1"], well_plate_2["A2"], well_plate_2["A3"], well_plate_2["A4"], well_plate_2["A5"], well_plate_2["A6"], well_plate_2["A7"], well_plate_2["A8"], well_plate_2["A9"], well_plate_2["A10"], well_plate_2["A11"], well_plate_2["A12"]],
        new_tip="once",
        return_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_1, tip_rack_3, tip_rack_5, tip_rack_2],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_82",
            base_liquid_class=ethanol_80_base_class,
            properties={"flex_96channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 15},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 200)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0), (10, -0.4), (100, -2.6), (1000, -32.2)],
                    "delay": {"enabled": True, "duration": 0.2},
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
                        "air_gap_by_volume": [(0, 11.8)],
                        "delay": {"enabled": True, "duration": 0.5},
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
                        "offset": {"x": 0, "y": 0, "z": 9},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 200)],
                    "delay": {"enabled": True, "duration": 1},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 35,
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
                        "speed": 35,
                        "touch_tip": {"enabled": False},
                        "blowout": {
                            "enabled": True,
                            "location": "destination",
                            "flow_rate": 200,
                            "blowout_position": {
                                "offset": {"x": 0, "y": 0, "z": 1},
                                "position_reference": "well-top",
                            },
                        },
                    },
                    "correction_by_volume": [(0, 0), (10, -0.4), (100, -2.6), (1000, -32.2)],
                    "push_out_by_volume": [(0, 0)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
        tips=[tip_rack_3["A6"]],
    )

    # Step 83: pause
    protocol.delay(seconds=15, msg="15 second wait")

    # Step 84: transfer
    pipette.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette.transfer_with_liquid_class(
        volume=200,
        source=[well_plate_2["A1"]],
        dest=[reservoir_2["A1"]],
        new_tip="always",
        return_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_6],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_84",
            base_liquid_class=ethanol_80_base_class,
            properties={"flex_96channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 0.9},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 200)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0), (10, -0.4), (100, -2.6), (1000, -32.2)],
                    "delay": {"enabled": True, "duration": 0.2},
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
                        "air_gap_by_volume": [(0, 11.8)],
                        "delay": {"enabled": True, "duration": 0.5},
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
                    "flow_rate_by_volume": [(0, 200)],
                    "delay": {"enabled": True, "duration": 1},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 35,
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
                        "speed": 35,
                        "touch_tip": {"enabled": False},
                        "blowout": {
                            "enabled": True,
                            "location": "destination",
                            "flow_rate": 200,
                            "blowout_position": {
                                "offset": {"x": 0, "y": 0, "z": 1},
                                "position_reference": "well-top",
                            },
                        },
                    },
                    "correction_by_volume": [(0, 0), (10, -0.4), (100, -2.6), (1000, -32.2)],
                    "push_out_by_volume": [(0, 0)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
    )

    # Step 85: transfer
    pipette.configure_nozzle_layout(
        protocol_api.COLUMN,
        start="A12",
    )
    pipette.transfer_with_liquid_class(
        volume=200,
        source=[reservoir_1["A10"], reservoir_1["A10"], reservoir_1["A10"], reservoir_1["A10"], reservoir_1["A10"], reservoir_1["A10"], reservoir_1["A10"], reservoir_1["A10"], reservoir_1["A10"], reservoir_1["A10"], reservoir_1["A10"], reservoir_1["A10"]],
        dest=[well_plate_2["A1"], well_plate_2["A2"], well_plate_2["A3"], well_plate_2["A4"], well_plate_2["A5"], well_plate_2["A6"], well_plate_2["A7"], well_plate_2["A8"], well_plate_2["A9"], well_plate_2["A10"], well_plate_2["A11"], well_plate_2["A12"]],
        new_tip="once",
        return_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_1, tip_rack_3, tip_rack_5, tip_rack_2],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_85",
            base_liquid_class=ethanol_80_base_class,
            properties={"flex_96channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 15},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 200)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0), (10, -0.4), (100, -2.6), (1000, -32.2)],
                    "delay": {"enabled": True, "duration": 0.2},
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
                        "air_gap_by_volume": [(0, 11.8)],
                        "delay": {"enabled": True, "duration": 0.5},
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
                        "offset": {"x": 0, "y": 0, "z": 9},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 200)],
                    "delay": {"enabled": True, "duration": 1},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 35,
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
                        "speed": 35,
                        "touch_tip": {"enabled": False},
                        "blowout": {
                            "enabled": True,
                            "location": "destination",
                            "flow_rate": 200,
                            "blowout_position": {
                                "offset": {"x": 0, "y": 0, "z": 1},
                                "position_reference": "well-top",
                            },
                        },
                    },
                    "correction_by_volume": [(0, 0), (10, -0.4), (100, -2.6), (1000, -32.2)],
                    "push_out_by_volume": [(0, 0)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
        tips=[tip_rack_3["A6"]],
    )

    # Step 86: pause
    protocol.delay(seconds=15, msg="15 second wait")

    # Step 87: transfer
    pipette.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette.transfer_with_liquid_class(
        volume=200,
        source=[well_plate_2["A1"]],
        dest=[reservoir_2["A1"]],
        new_tip="always",
        return_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_6],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_87",
            base_liquid_class=ethanol_80_base_class,
            properties={"flex_96channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 0.9},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 200)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0), (10, -0.4), (100, -2.6), (1000, -32.2)],
                    "delay": {"enabled": True, "duration": 0.2},
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
                        "air_gap_by_volume": [(0, 11.8)],
                        "delay": {"enabled": True, "duration": 0.5},
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
                    "flow_rate_by_volume": [(0, 200)],
                    "delay": {"enabled": True, "duration": 1},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 35,
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
                        "speed": 35,
                        "touch_tip": {"enabled": False},
                        "blowout": {
                            "enabled": True,
                            "location": "destination",
                            "flow_rate": 200,
                            "blowout_position": {
                                "offset": {"x": 0, "y": 0, "z": 1},
                                "position_reference": "well-top",
                            },
                        },
                    },
                    "correction_by_volume": [(0, 0), (10, -0.4), (100, -2.6), (1000, -32.2)],
                    "push_out_by_volume": [(0, 0)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
        tips=[tip_rack_6["A1"]],
    )

    # Step 88: transfer
    pipette.configure_nozzle_layout(
        protocol_api.COLUMN,
        start="A12",
    )
    pipette.transfer_with_liquid_class(
        volume=200,
        source=[reservoir_1["A11"], reservoir_1["A11"], reservoir_1["A11"], reservoir_1["A11"], reservoir_1["A11"], reservoir_1["A11"], reservoir_1["A11"], reservoir_1["A11"], reservoir_1["A11"], reservoir_1["A11"], reservoir_1["A11"], reservoir_1["A11"]],
        dest=[well_plate_2["A1"], well_plate_2["A2"], well_plate_2["A3"], well_plate_2["A4"], well_plate_2["A5"], well_plate_2["A6"], well_plate_2["A7"], well_plate_2["A8"], well_plate_2["A9"], well_plate_2["A10"], well_plate_2["A11"], well_plate_2["A12"]],
        new_tip="once",
        trash_location=waste_chute,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_1, tip_rack_3, tip_rack_5, tip_rack_2],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_88",
            base_liquid_class=ethanol_80_base_class,
            properties={"flex_96channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 15},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 200)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0), (10, -0.4), (100, -2.6), (1000, -32.2)],
                    "delay": {"enabled": True, "duration": 0.2},
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
                        "air_gap_by_volume": [(0, 11.8)],
                        "delay": {"enabled": True, "duration": 0.5},
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
                        "offset": {"x": 0, "y": 0, "z": 9},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 200)],
                    "delay": {"enabled": True, "duration": 1},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 35,
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
                        "speed": 35,
                        "touch_tip": {"enabled": False},
                        "blowout": {
                            "enabled": True,
                            "location": "destination",
                            "flow_rate": 200,
                            "blowout_position": {
                                "offset": {"x": 0, "y": 0, "z": 1},
                                "position_reference": "well-top",
                            },
                        },
                    },
                    "correction_by_volume": [(0, 0), (10, -0.4), (100, -2.6), (1000, -32.2)],
                    "push_out_by_volume": [(0, 0)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
        tips=[tip_rack_3["A6"]],
    )
    pipette.drop_tip(waste_chute)

    # Step 89: pause
    protocol.delay(seconds=15, msg="15 second wait")

    # Step 90: transfer
    pipette.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette.transfer_with_liquid_class(
        volume=200,
        source=[well_plate_2["A1"]],
        dest=[reservoir_2["A1"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_6],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_90",
            base_liquid_class=ethanol_80_base_class,
            properties={"flex_96channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 0.9},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 200)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0), (10, -0.4), (100, -2.6), (1000, -32.2)],
                    "delay": {"enabled": True, "duration": 0.2},
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
                        "air_gap_by_volume": [(0, 11.8)],
                        "delay": {"enabled": True, "duration": 0.5},
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
                    "flow_rate_by_volume": [(0, 200)],
                    "delay": {"enabled": True, "duration": 1},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 35,
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
                        "speed": 35,
                        "touch_tip": {"enabled": False},
                        "blowout": {
                            "enabled": True,
                            "location": "destination",
                            "flow_rate": 200,
                            "blowout_position": {
                                "offset": {"x": 0, "y": 0, "z": 1},
                                "position_reference": "well-top",
                            },
                        },
                    },
                    "correction_by_volume": [(0, 0), (10, -0.4), (100, -2.6), (1000, -32.2)],
                    "push_out_by_volume": [(0, 0)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
        tips=[tip_rack_6["A1"]],
    )
    pipette.drop_tip(waste_chute)

    # Step 91: move
    protocol.move_labware(reservoir_3, "B2", use_gripper=True)

    # Step 92: move
    protocol.move_labware(well_plate_2, temperature_module_2, use_gripper=True)

    # Step 93: transfer
    pipette.configure_nozzle_layout(
        protocol_api.COLUMN,
        start="A12",
    )
    pipette.transfer_with_liquid_class(
        volume=200,
        source=[reservoir_3["A1"], reservoir_3["A1"], reservoir_3["A1"], reservoir_3["A1"], reservoir_3["A1"], reservoir_3["A1"], reservoir_3["A1"], reservoir_3["A1"], reservoir_3["A1"], reservoir_3["A1"], reservoir_3["A1"], reservoir_3["A1"]],
        dest=[well_plate_2["A1"], well_plate_2["A2"], well_plate_2["A3"], well_plate_2["A4"], well_plate_2["A5"], well_plate_2["A6"], well_plate_2["A7"], well_plate_2["A8"], well_plate_2["A9"], well_plate_2["A10"], well_plate_2["A11"], well_plate_2["A12"]],
        new_tip="once",
        trash_location=waste_chute,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_1, tip_rack_3, tip_rack_5, tip_rack_2],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_93",
            base_liquid_class=water_base_class,
            properties={"flex_96channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 15},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 200)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": True, "duration": 0.5},
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
                        "air_gap_by_volume": [(0, 10)],
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
                        "offset": {"x": 0, "y": 0, "z": 9},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 200)],
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
                        "air_gap_by_volume": [(0, 10)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 35,
                        "touch_tip": {"enabled": False},
                        "blowout": {
                            "enabled": True,
                            "location": "destination",
                            "flow_rate": 200,
                            "blowout_position": {
                                "offset": {"x": 0, "y": 0, "z": 1},
                                "position_reference": "well-top",
                            },
                        },
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 20)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
    )
    pipette.drop_tip(waste_chute)

    # Step 94: pause
    protocol.pause("Digestion time! Move sample plate to thermomixer")

    # Step 95: temperature
    temperature_module_1.deactivate()

    # Step 96: temperature
    temperature_module_2.deactivate()

CUSTOM_LABWARE = json.loads("""{"custom_beta/opentrons_12_reservoir_22000ul/1":{"ordering":[["A1"],["A2"],["A3"],["A4"],["A5"],["A6"],["A7"],["A8"],["A9"],["A10"],["A11"],["A12"]],"brand":{"brand":"Opentrons","brandId":["999-00260"]},"metadata":{"displayName":"Maor_Opentrons Tough 22mL 12 Well Reservoir","displayCategory":"reservoir","displayVolumeUnits":"µL","tags":[]},"dimensions":{"xDimension":127.76,"yDimension":85.48,"zDimension":45.3},"wells":{"A1":{"depth":42.3,"totalLiquidVolume":22000,"shape":"rectangular","xDimension":8.2,"yDimension":70.7,"x":14.38,"y":42.74,"z":3},"A2":{"depth":42.3,"totalLiquidVolume":22000,"shape":"rectangular","xDimension":8.2,"yDimension":70.7,"x":23.38,"y":42.74,"z":3},"A3":{"depth":42.3,"totalLiquidVolume":22000,"shape":"rectangular","xDimension":8.2,"yDimension":70.7,"x":32.38,"y":42.74,"z":3},"A4":{"depth":42.3,"totalLiquidVolume":22000,"shape":"rectangular","xDimension":8.2,"yDimension":70.7,"x":41.38,"y":42.74,"z":3},"A5":{"depth":42.3,"totalLiquidVolume":22000,"shape":"rectangular","xDimension":8.2,"yDimension":70.7,"x":50.38,"y":42.74,"z":3},"A6":{"depth":42.3,"totalLiquidVolume":22000,"shape":"rectangular","xDimension":8.2,"yDimension":70.7,"x":59.38,"y":42.74,"z":3},"A7":{"depth":42.3,"totalLiquidVolume":22000,"shape":"rectangular","xDimension":8.2,"yDimension":70.7,"x":68.38,"y":42.74,"z":3},"A8":{"depth":42.3,"totalLiquidVolume":22000,"shape":"rectangular","xDimension":8.2,"yDimension":70.7,"x":77.38,"y":42.74,"z":3},"A9":{"depth":42.3,"totalLiquidVolume":22000,"shape":"rectangular","xDimension":8.2,"yDimension":70.7,"x":86.38,"y":42.74,"z":3},"A10":{"depth":42.3,"totalLiquidVolume":22000,"shape":"rectangular","xDimension":8.2,"yDimension":70.7,"x":95.38,"y":42.74,"z":3},"A11":{"depth":42.3,"totalLiquidVolume":22000,"shape":"rectangular","xDimension":8.2,"yDimension":70.7,"x":104.38,"y":42.74,"z":3},"A12":{"depth":42.3,"totalLiquidVolume":22000,"shape":"rectangular","xDimension":8.2,"yDimension":70.7,"x":113.38,"y":42.74,"z":3}},"groups":[{"metadata":{"wellBottomShape":"v"},"wells":["A1","A2","A3","A4","A5","A6","A7","A8","A9","A10","A11","A12"]}],"parameters":{"format":"irregular","quirks":["centerMultichannelOnWells","touchTipDisabled"],"isTiprack":false,"isMagneticModuleCompatible":false,"loadName":"opentrons_12_reservoir_22000ul"},"namespace":"custom_beta","version":1,"schemaVersion":2,"cornerOffsetFromSlot":{"x":0,"y":0,"z":0}},"custom_beta/griener_96_wellplate_323ul/1":{"ordering":[["A1","B1","C1","D1","E1","F1","G1","H1"],["A2","B2","C2","D2","E2","F2","G2","H2"],["A3","B3","C3","D3","E3","F3","G3","H3"],["A4","B4","C4","D4","E4","F4","G4","H4"],["A5","B5","C5","D5","E5","F5","G5","H5"],["A6","B6","C6","D6","E6","F6","G6","H6"],["A7","B7","C7","D7","E7","F7","G7","H7"],["A8","B8","C8","D8","E8","F8","G8","H8"],["A9","B9","C9","D9","E9","F9","G9","H9"],["A10","B10","C10","D10","E10","F10","G10","H10"],["A11","B11","C11","D11","E11","F11","G11","H11"],["A12","B12","C12","D12","E12","F12","G12","H12"]],"brand":{"brand":"Griener","brandId":["650101","650160","650161","650162","650173","650180","650185"]},"metadata":{"displayName":"Maor_Greiner 96 Well Plate 323 µL","displayCategory":"wellPlate","displayVolumeUnits":"µL","tags":[]},"dimensions":{"xDimension":127.76,"yDimension":85.48,"zDimension":14.2},"wells":{"A1":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":14.29,"y":74.3,"z":3.9},"B1":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":14.29,"y":65.3,"z":3.9},"C1":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":14.29,"y":56.3,"z":3.9},"D1":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":14.29,"y":47.3,"z":3.9},"E1":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":14.29,"y":38.3,"z":3.9},"F1":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":14.29,"y":29.3,"z":3.9},"G1":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":14.29,"y":20.3,"z":3.9},"H1":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":14.29,"y":11.3,"z":3.9},"A2":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":23.29,"y":74.3,"z":3.9},"B2":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":23.29,"y":65.3,"z":3.9},"C2":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":23.29,"y":56.3,"z":3.9},"D2":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":23.29,"y":47.3,"z":3.9},"E2":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":23.29,"y":38.3,"z":3.9},"F2":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":23.29,"y":29.3,"z":3.9},"G2":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":23.29,"y":20.3,"z":3.9},"H2":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":23.29,"y":11.3,"z":3.9},"A3":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":32.29,"y":74.3,"z":3.9},"B3":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":32.29,"y":65.3,"z":3.9},"C3":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":32.29,"y":56.3,"z":3.9},"D3":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":32.29,"y":47.3,"z":3.9},"E3":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":32.29,"y":38.3,"z":3.9},"F3":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":32.29,"y":29.3,"z":3.9},"G3":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":32.29,"y":20.3,"z":3.9},"H3":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":32.29,"y":11.3,"z":3.9},"A4":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":41.29,"y":74.3,"z":3.9},"B4":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":41.29,"y":65.3,"z":3.9},"C4":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":41.29,"y":56.3,"z":3.9},"D4":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":41.29,"y":47.3,"z":3.9},"E4":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":41.29,"y":38.3,"z":3.9},"F4":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":41.29,"y":29.3,"z":3.9},"G4":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":41.29,"y":20.3,"z":3.9},"H4":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":41.29,"y":11.3,"z":3.9},"A5":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":50.29,"y":74.3,"z":3.9},"B5":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":50.29,"y":65.3,"z":3.9},"C5":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":50.29,"y":56.3,"z":3.9},"D5":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":50.29,"y":47.3,"z":3.9},"E5":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":50.29,"y":38.3,"z":3.9},"F5":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":50.29,"y":29.3,"z":3.9},"G5":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":50.29,"y":20.3,"z":3.9},"H5":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":50.29,"y":11.3,"z":3.9},"A6":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":59.29,"y":74.3,"z":3.9},"B6":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":59.29,"y":65.3,"z":3.9},"C6":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":59.29,"y":56.3,"z":3.9},"D6":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":59.29,"y":47.3,"z":3.9},"E6":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":59.29,"y":38.3,"z":3.9},"F6":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":59.29,"y":29.3,"z":3.9},"G6":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":59.29,"y":20.3,"z":3.9},"H6":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":59.29,"y":11.3,"z":3.9},"A7":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":68.29,"y":74.3,"z":3.9},"B7":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":68.29,"y":65.3,"z":3.9},"C7":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":68.29,"y":56.3,"z":3.9},"D7":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":68.29,"y":47.3,"z":3.9},"E7":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":68.29,"y":38.3,"z":3.9},"F7":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":68.29,"y":29.3,"z":3.9},"G7":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":68.29,"y":20.3,"z":3.9},"H7":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":68.29,"y":11.3,"z":3.9},"A8":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":77.29,"y":74.3,"z":3.9},"B8":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":77.29,"y":65.3,"z":3.9},"C8":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":77.29,"y":56.3,"z":3.9},"D8":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":77.29,"y":47.3,"z":3.9},"E8":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":77.29,"y":38.3,"z":3.9},"F8":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":77.29,"y":29.3,"z":3.9},"G8":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":77.29,"y":20.3,"z":3.9},"H8":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":77.29,"y":11.3,"z":3.9},"A9":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":86.29,"y":74.3,"z":3.9},"B9":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":86.29,"y":65.3,"z":3.9},"C9":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":86.29,"y":56.3,"z":3.9},"D9":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":86.29,"y":47.3,"z":3.9},"E9":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":86.29,"y":38.3,"z":3.9},"F9":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":86.29,"y":29.3,"z":3.9},"G9":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":86.29,"y":20.3,"z":3.9},"H9":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":86.29,"y":11.3,"z":3.9},"A10":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":95.29,"y":74.3,"z":3.9},"B10":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":95.29,"y":65.3,"z":3.9},"C10":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":95.29,"y":56.3,"z":3.9},"D10":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":95.29,"y":47.3,"z":3.9},"E10":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":95.29,"y":38.3,"z":3.9},"F10":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":95.29,"y":29.3,"z":3.9},"G10":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":95.29,"y":20.3,"z":3.9},"H10":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":95.29,"y":11.3,"z":3.9},"A11":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":104.29,"y":74.3,"z":3.9},"B11":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":104.29,"y":65.3,"z":3.9},"C11":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":104.29,"y":56.3,"z":3.9},"D11":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":104.29,"y":47.3,"z":3.9},"E11":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":104.29,"y":38.3,"z":3.9},"F11":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":104.29,"y":29.3,"z":3.9},"G11":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":104.29,"y":20.3,"z":3.9},"H11":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":104.29,"y":11.3,"z":3.9},"A12":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":113.29,"y":74.3,"z":3.9},"B12":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":113.29,"y":65.3,"z":3.9},"C12":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":113.29,"y":56.3,"z":3.9},"D12":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":113.29,"y":47.3,"z":3.9},"E12":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":113.29,"y":38.3,"z":3.9},"F12":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":113.29,"y":29.3,"z":3.9},"G12":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":113.29,"y":20.3,"z":3.9},"H12":{"depth":10.3,"totalLiquidVolume":323,"shape":"circular","diameter":6.99,"x":113.29,"y":11.3,"z":3.9}},"groups":[{"metadata":{"wellBottomShape":"u"},"wells":["A1","B1","C1","D1","E1","F1","G1","H1","A2","B2","C2","D2","E2","F2","G2","H2","A3","B3","C3","D3","E3","F3","G3","H3","A4","B4","C4","D4","E4","F4","G4","H4","A5","B5","C5","D5","E5","F5","G5","H5","A6","B6","C6","D6","E6","F6","G6","H6","A7","B7","C7","D7","E7","F7","G7","H7","A8","B8","C8","D8","E8","F8","G8","H8","A9","B9","C9","D9","E9","F9","G9","H9","A10","B10","C10","D10","E10","F10","G10","H10","A11","B11","C11","D11","E11","F11","G11","H11","A12","B12","C12","D12","E12","F12","G12","H12"]}],"parameters":{"format":"irregular","quirks":[],"isTiprack":false,"isMagneticModuleCompatible":false,"loadName":"griener_96_wellplate_323ul"},"namespace":"custom_beta","version":1,"schemaVersion":2,"cornerOffsetFromSlot":{"x":0,"y":0,"z":0}}}""")

DESIGNER_APPLICATION = """{"robot":{"model":"OT-3 Standard"},"designerApplication":{"name":"opentrons/protocol-designer","version":"9.0.0","data":{"pipetteTiprackAssignments":{"54dfc5ab-0714-4ef4-827a-8f5a8d02ead0":["opentrons/opentrons_flex_96_filtertiprack_1000ul/1","opentrons/opentrons_flex_96_filtertiprack_200ul/1","opentrons/opentrons_flex_96_filtertiprack_50ul/1"]},"dismissedWarnings":{"form":[],"timeline":[]},"ingredients":{"0":{"displayName":"Lysis_Reduction_Mix","displayColor":"#b925ff","liquidClass":"water","description":null,"liquidGroupId":"0"},"1":{"displayName":"Equilibration_Wash_Buffer","displayColor":"#ffd600","liquidClass":"water","description":null,"liquidGroupId":"1"},"2":{"displayName":"EV_Binding_Buffer","displayColor":"#9dffd8","liquidClass":"water","description":null,"liquidGroupId":"2"},"3":{"displayName":"Acetonitrile","displayColor":"#ff9900","liquidClass":"ethanol_80","description":null,"liquidGroupId":"3"},"4":{"displayName":"Buffer_With_Enzyme","displayColor":"#50d5ff","liquidClass":"water","description":null,"liquidGroupId":"4"},"5":{"displayName":"Raw_Plasma","displayColor":"#ff80f5","liquidClass":"water","description":null,"liquidGroupId":"5"},"6":{"displayName":"SAX","displayColor":"#7eff42","liquidClass":"glycerol_50","description":null,"liquidGroupId":"6"},"7":{"displayName":"IAA","displayColor":"#ff4f4f","liquidClass":"water","description":null,"liquidGroupId":"7"}},"ingredLocations":{"c118bd53-2d7f-4cad-ba97-a4439cc10dfa:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":{},"b21cecc2-730c-4a55-a5f8-32934f6f8977:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":{},"006405e9-bb2b-4129-a292-3b5aeb43ca0a:custom_beta/griener_96_wellplate_323ul/1":{"A1":{"6":{"volume":275}},"B1":{"6":{"volume":275}},"C1":{"6":{"volume":275}},"D1":{"6":{"volume":275}},"E1":{"6":{"volume":275}},"F1":{"6":{"volume":275}},"G1":{"6":{"volume":275}},"H1":{"6":{"volume":275}},"A2":{"7":{"volume":150}},"B2":{"7":{"volume":150}},"C2":{"7":{"volume":150}},"D2":{"7":{"volume":150}},"E2":{"7":{"volume":150}},"F2":{"7":{"volume":150}},"G2":{"7":{"volume":150}},"H2":{"7":{"volume":150}}},"7c3ca9cb-6ad4-4f57-91f4-e5472cf8e4f7:custom_beta/opentrons_12_reservoir_22000ul/1":{"A1":{"0":{"volume":20000}},"A2":{"1":{"volume":20000}},"A3":{"1":{"volume":20000}},"A4":{"1":{"volume":20000}},"A5":{"1":{"volume":20000}},"A6":{"1":{"volume":20000}},"A7":{"1":{"volume":20000}},"A8":{"3":{"volume":20000}},"A9":{"3":{"volume":20000}},"A10":{"3":{"volume":20000}},"A12":{"2":{"volume":20000}},"A11":{"3":{"volume":20000}}},"89d476d5-dea5-4874-ae0e-05d6e79be1a0:custom_beta/griener_96_wellplate_323ul/1":{"A1":{"5":{"volume":50}},"B1":{"5":{"volume":50}},"C1":{"5":{"volume":50}},"D1":{"5":{"volume":50}},"E1":{"5":{"volume":50}},"F1":{"5":{"volume":50}},"G1":{"5":{"volume":50}},"H1":{"5":{"volume":50}},"A2":{"5":{"volume":50}},"B2":{"5":{"volume":50}},"C2":{"5":{"volume":50}},"D2":{"5":{"volume":50}},"E2":{"5":{"volume":50}},"F2":{"5":{"volume":50}},"G2":{"5":{"volume":50}},"H2":{"5":{"volume":50}},"A3":{"5":{"volume":50}},"B3":{"5":{"volume":50}},"C3":{"5":{"volume":50}},"D3":{"5":{"volume":50}},"E3":{"5":{"volume":50}},"F3":{"5":{"volume":50}},"G3":{"5":{"volume":50}},"H3":{"5":{"volume":50}},"A4":{"5":{"volume":50}},"B4":{"5":{"volume":50}},"C4":{"5":{"volume":50}},"D4":{"5":{"volume":50}},"E4":{"5":{"volume":50}},"F4":{"5":{"volume":50}},"G4":{"5":{"volume":50}},"H4":{"5":{"volume":50}},"A5":{"5":{"volume":50}},"B5":{"5":{"volume":50}},"C5":{"5":{"volume":50}},"D5":{"5":{"volume":50}},"E5":{"5":{"volume":50}},"F5":{"5":{"volume":50}},"G5":{"5":{"volume":50}},"H5":{"5":{"volume":50}},"A6":{"5":{"volume":50}},"B6":{"5":{"volume":50}},"C6":{"5":{"volume":50}},"D6":{"5":{"volume":50}},"E6":{"5":{"volume":50}},"F6":{"5":{"volume":50}},"G6":{"5":{"volume":50}},"H6":{"5":{"volume":50}},"A7":{"5":{"volume":50}},"B7":{"5":{"volume":50}},"C7":{"5":{"volume":50}},"D7":{"5":{"volume":50}},"E7":{"5":{"volume":50}},"F7":{"5":{"volume":50}},"G7":{"5":{"volume":50}},"H7":{"5":{"volume":50}},"A8":{"5":{"volume":50}},"B8":{"5":{"volume":50}},"C8":{"5":{"volume":50}},"D8":{"5":{"volume":50}},"E8":{"5":{"volume":50}},"F8":{"5":{"volume":50}},"G8":{"5":{"volume":50}},"H8":{"5":{"volume":50}},"A9":{"5":{"volume":50}},"B9":{"5":{"volume":50}},"C9":{"5":{"volume":50}},"D9":{"5":{"volume":50}},"E9":{"5":{"volume":50}},"F9":{"5":{"volume":50}},"G9":{"5":{"volume":50}},"H9":{"5":{"volume":50}},"A10":{"5":{"volume":50}},"B10":{"5":{"volume":50}},"C10":{"5":{"volume":50}},"D10":{"5":{"volume":50}},"E10":{"5":{"volume":50}},"F10":{"5":{"volume":50}},"G10":{"5":{"volume":50}},"H10":{"5":{"volume":50}},"A11":{"5":{"volume":50}},"B11":{"5":{"volume":50}},"C11":{"5":{"volume":50}},"D11":{"5":{"volume":50}},"E11":{"5":{"volume":50}},"F11":{"5":{"volume":50}},"G11":{"5":{"volume":50}},"H11":{"5":{"volume":50}},"A12":{"5":{"volume":50}},"B12":{"5":{"volume":50}},"C12":{"5":{"volume":50}},"D12":{"5":{"volume":50}},"E12":{"5":{"volume":50}},"F12":{"5":{"volume":50}},"G12":{"5":{"volume":50}},"H12":{"5":{"volume":50}}},"b34dbda1-1eac-4ccc-a174-aad10933b865:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":{},"ee0626c4-7821-44ee-ab19-d0b1a20f6ca3:custom_beta/opentrons_12_reservoir_22000ul/1":{"A1":{"4":{"volume":20000}}}},"savedStepForms":{"__INITIAL_DECK_SETUP_STEP__":{"stepType":"manualIntervention","id":"__INITIAL_DECK_SETUP_STEP__","labwareLocationUpdate":{"793e81a3-dbe5-4e2a-a095-de4f0c6bc576:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":"D4","7c3ca9cb-6ad4-4f57-91f4-e5472cf8e4f7:custom_beta/opentrons_12_reservoir_22000ul/1":"d8637f78-b373-4b75-8d34-1a693d56a5cf:temperatureModuleType","89d476d5-dea5-4874-ae0e-05d6e79be1a0:custom_beta/griener_96_wellplate_323ul/1":"235c38ab-980f-4dd4-9b7c-356252f12de0:temperatureModuleType","c118bd53-2d7f-4cad-ba97-a4439cc10dfa:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":"8edc63ec-21b1-4849-9631-54f190ce23b9:opentrons/opentrons_flex_96_tiprack_adapter/1","b21cecc2-730c-4a55-a5f8-32934f6f8977:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":"D2","9ebbf00f-fd8e-454e-8ac3-cf76d35605f8:custom_beta/griener_96_wellplate_323ul/1":"C3","006405e9-bb2b-4129-a292-3b5aeb43ca0a:custom_beta/griener_96_wellplate_323ul/1":"C2","f7be247b-734a-4ac7-964c-8fded865c1e2:opentrons/opentrons_flex_96_filtertiprack_50ul/1":"B4","b5ac2328-185e-4540-946e-ee1360699ed0:opentrons/opentrons_tough_1_reservoir_300ml/2":"B3","8edc63ec-21b1-4849-9631-54f190ce23b9:opentrons/opentrons_flex_96_tiprack_adapter/1":"A2","b34dbda1-1eac-4ccc-a174-aad10933b865:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":"C4","ee0626c4-7821-44ee-ab19-d0b1a20f6ca3:custom_beta/opentrons_12_reservoir_22000ul/1":"offDeck","d6df4b61-9500-449d-8143-e490f348004e:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":"B2"},"pipetteLocationUpdate":{"54dfc5ab-0714-4ef4-827a-8f5a8d02ead0":"left"},"moduleLocationUpdate":{"d8637f78-b373-4b75-8d34-1a693d56a5cf:temperatureModuleType":"A1","235c38ab-980f-4dd4-9b7c-356252f12de0:temperatureModuleType":"B1","0270f202-f775-4b10-a1ef-f0a279ef8f59:heaterShakerModuleType":"C1","db14dff2-9433-4bd2-82b0-b8b8b023bb82:magneticBlockType":"D1","f90b907a-ef45-433f-8b8b-395258e33421:absorbanceReaderType":"A3"},"moduleStateUpdate":{},"trashBinLocationUpdate":{},"wasteChuteLocationUpdate":{"ddde4cd9-ae9b-4482-9802-5aeb58192574:wasteChute":"cutoutD3"},"stagingAreaLocationUpdate":{"45aca5d9-0b3a-4209-bd85-1b98a4381408:stagingArea":"cutoutB3","ba93afca-cd8b-4a82-8373-a6722c61ae0d:stagingArea":"cutoutC3","55c2edbb-6cd9-4c6b-9c00-dbaa869237bb:stagingArea":"cutoutD3"},"gripperLocationUpdate":{"b6c12910-874c-455a-bc25-9b6ef5c2abf3:gripper":"mounted"}},"2374efce-cc61-4195-a4cd-f4f53949a4a4":{"moduleId":"d8637f78-b373-4b75-8d34-1a693d56a5cf:temperatureModuleType","setTemperature":"true","targetTemperature":"4","id":"2374efce-cc61-4195-a4cd-f4f53949a4a4","stepType":"temperature","stepName":"temperature","stepDetails":"","stepNumber":0},"fcb41fc4-cb8d-411b-b243-0df2983dfdae":{"moduleId":"235c38ab-980f-4dd4-9b7c-356252f12de0:temperatureModuleType","setTemperature":"true","targetTemperature":"4","id":"fcb41fc4-cb8d-411b-b243-0df2983dfdae","stepType":"temperature","stepName":"temperature","stepDetails":"","stepNumber":0},"7766549b-17c7-46d5-85ea-d6310f555477":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.7","aspirate_flowRate":"12.5","aspirate_labware":"006405e9-bb2b-4129-a292-3b5aeb43ca0a:custom_beta/griener_96_wellplate_323ul/1","aspirate_mix_checkbox":true,"aspirate_mix_times":"3","aspirate_mix_volume":"100","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"4","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"10","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":true,"blowout_flowRate":"224","blowout_location":"dest_well","blowout_mmFromBottom":null,"blowout_x_position":null,"blowout_y_position":null,"blowout_position_reference":"well-top","changeTip":"once","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":false,"dispense_airGap_volume":"","dispense_delay_checkbox":true,"dispense_delay_seconds":"0.5","dispense_flowRate":"212","dispense_labware":"9ebbf00f-fd8e-454e-8ac3-cf76d35605f8:custom_beta/griener_96_wellplate_323ul/1","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"4","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"4","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1","A2","A3","A4","A5","A6","A7","A8","A9","A10","A11","A12"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"ddde4cd9-ae9b-4482-9802-5aeb58192574:wasteChute","liquidClassesSupported":true,"liquidClass":"glycerol_50","nozzles":"COLUMN","path":"single","pipette":"54dfc5ab-0714-4ef4-827a-8f5a8d02ead0","preWetTip":false,"primaryNozzle":"A12","pushOut_checkbox":true,"pushOut_volume":"35","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tip_tracking":"manual","tiprack_selected":"b21cecc2-730c-4a55-a5f8-32934f6f8977:opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tips_selected":[["A1","B1","C1","D1","E1","F1","G1","H1"]],"volume":"12.5","id":"7766549b-17c7-46d5-85ea-d6310f555477","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"2417e683-dedc-475b-8a2b-2d4f32169d2a":{"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"10","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.5","aspirate_flowRate":"200","aspirate_labware":"7c3ca9cb-6ad4-4f57-91f4-e5472cf8e4f7:custom_beta/opentrons_12_reservoir_22000ul/1","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":15,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"35","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"35","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A3"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":true,"blowout_flowRate":"200","blowout_location":"dest_well","blowout_mmFromBottom":null,"blowout_x_position":null,"blowout_y_position":null,"blowout_position_reference":"well-top","changeTip":"once","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"10","dispense_delay_checkbox":false,"dispense_delay_seconds":"0","dispense_flowRate":"200","dispense_labware":"9ebbf00f-fd8e-454e-8ac3-cf76d35605f8:custom_beta/griener_96_wellplate_323ul/1","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"35","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"35","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1","A2","A3","A4","A5","A6","A7","A8","A9","A10","A11","A12"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","liquidClassesSupported":true,"liquidClass":"water","nozzles":"COLUMN","path":"single","pipette":"54dfc5ab-0714-4ef4-827a-8f5a8d02ead0","preWetTip":false,"primaryNozzle":"A12","pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tip_tracking":"manual","tiprack_selected":"b21cecc2-730c-4a55-a5f8-32934f6f8977:opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tips_selected":[["A2","B2","C2","D2","E2","F2","G2","H2"]],"volume":"200","id":"2417e683-dedc-475b-8a2b-2d4f32169d2a","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"0fc3b327-eb44-4d16-9d1a-63e6f3fbcadc":{"heaterShakerSetTimer":null,"heaterShakerTimer":null,"latchOpen":true,"moduleId":"0270f202-f775-4b10-a1ef-f0a279ef8f59:heaterShakerModuleType","setHeaterShakerTemperature":null,"setShake":null,"targetHeaterShakerTemperature":null,"targetSpeed":null,"id":"0fc3b327-eb44-4d16-9d1a-63e6f3fbcadc","stepType":"heaterShaker","stepName":"Heater-Shaker","stepDetails":"","stepNumber":0},"8be4856a-0906-4233-bf6d-f0cda78df9ba":{"labware":"9ebbf00f-fd8e-454e-8ac3-cf76d35605f8:custom_beta/griener_96_wellplate_323ul/1","newLocation":"0270f202-f775-4b10-a1ef-f0a279ef8f59:heaterShakerModuleType","useGripper":true,"id":"8be4856a-0906-4233-bf6d-f0cda78df9ba","stepType":"moveLabware","stepName":"move","stepDetails":"","stepNumber":0},"4fa04b3f-664d-4d31-be1a-db839e90f765":{"heaterShakerSetTimer":true,"heaterShakerTimer":"00:00:30","latchOpen":false,"moduleId":"0270f202-f775-4b10-a1ef-f0a279ef8f59:heaterShakerModuleType","setHeaterShakerTemperature":null,"setShake":true,"targetHeaterShakerTemperature":null,"targetSpeed":"800","id":"4fa04b3f-664d-4d31-be1a-db839e90f765","stepType":"heaterShaker","stepName":"Heater-Shaker","stepDetails":"","stepNumber":0},"4ef11d5d-6e9f-4116-8c52-134c27a74588":{"heaterShakerSetTimer":null,"heaterShakerTimer":null,"latchOpen":true,"moduleId":"0270f202-f775-4b10-a1ef-f0a279ef8f59:heaterShakerModuleType","setHeaterShakerTemperature":null,"setShake":null,"targetHeaterShakerTemperature":null,"targetSpeed":null,"id":"4ef11d5d-6e9f-4116-8c52-134c27a74588","stepType":"heaterShaker","stepName":"Heater-Shaker","stepDetails":"","stepNumber":0},"f88697d1-220c-48bb-a58b-d5aeb91a37d3":{"labware":"9ebbf00f-fd8e-454e-8ac3-cf76d35605f8:custom_beta/griener_96_wellplate_323ul/1","newLocation":"db14dff2-9433-4bd2-82b0-b8b8b023bb82:magneticBlockType","useGripper":true,"id":"f88697d1-220c-48bb-a58b-d5aeb91a37d3","stepType":"moveLabware","stepName":"move","stepDetails":"","stepNumber":0},"7f278a14-4494-4260-8dd7-1176b5a6e470":{"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"10","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.5","aspirate_flowRate":"200","aspirate_labware":"9ebbf00f-fd8e-454e-8ac3-cf76d35605f8:custom_beta/griener_96_wellplate_323ul/1","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":0.9,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"35","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"35","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1","A2","A3","A4","A5","A6","A7","A8","A9","A10","A11","A12"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"200","blowout_location":"dest_well","blowout_mmFromBottom":null,"blowout_x_position":null,"blowout_y_position":null,"blowout_position_reference":"well-top","changeTip":"once","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"10","dispense_delay_checkbox":false,"dispense_delay_seconds":"0","dispense_flowRate":"200","dispense_labware":"b5ac2328-185e-4540-946e-ee1360699ed0:opentrons/opentrons_tough_1_reservoir_300ml/2","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":20,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"35","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"35","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"ddde4cd9-ae9b-4482-9802-5aeb58192574:wasteChute","liquidClassesSupported":true,"liquidClass":"water","nozzles":"COLUMN","path":"single","pipette":"54dfc5ab-0714-4ef4-827a-8f5a8d02ead0","preWetTip":false,"primaryNozzle":"A12","pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tip_tracking":"manual","tiprack_selected":"b21cecc2-730c-4a55-a5f8-32934f6f8977:opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tips_selected":[["A2","B2","C2","D2","E2","F2","G2","H2"]],"volume":"212.5","id":"7f278a14-4494-4260-8dd7-1176b5a6e470","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"a2993808-758a-4278-9b39-1cab7d0eec7e":{"labware":"9ebbf00f-fd8e-454e-8ac3-cf76d35605f8:custom_beta/griener_96_wellplate_323ul/1","newLocation":"0270f202-f775-4b10-a1ef-f0a279ef8f59:heaterShakerModuleType","useGripper":true,"id":"a2993808-758a-4278-9b39-1cab7d0eec7e","stepType":"moveLabware","stepName":"move","stepDetails":"","stepNumber":0},"4c8428da-da49-40fc-bab1-f8c9e3034949":{"heaterShakerSetTimer":null,"heaterShakerTimer":null,"latchOpen":false,"moduleId":"0270f202-f775-4b10-a1ef-f0a279ef8f59:heaterShakerModuleType","setHeaterShakerTemperature":null,"setShake":null,"targetHeaterShakerTemperature":null,"targetSpeed":null,"id":"4c8428da-da49-40fc-bab1-f8c9e3034949","stepType":"heaterShaker","stepName":"Heater-Shaker","stepDetails":"","stepNumber":0},"0ca856ae-1e8a-497f-8e2d-bf7aabed5abf":{"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"10","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.5","aspirate_flowRate":"200","aspirate_labware":"7c3ca9cb-6ad4-4f57-91f4-e5472cf8e4f7:custom_beta/opentrons_12_reservoir_22000ul/1","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":15,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"35","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"35","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A4"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":true,"blowout_flowRate":"200","blowout_location":"dest_well","blowout_mmFromBottom":null,"blowout_x_position":null,"blowout_y_position":null,"blowout_position_reference":"well-top","changeTip":"once","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"10","dispense_delay_checkbox":false,"dispense_delay_seconds":"0","dispense_flowRate":"200","dispense_labware":"9ebbf00f-fd8e-454e-8ac3-cf76d35605f8:custom_beta/griener_96_wellplate_323ul/1","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"35","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"35","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1","A2","A3","A4","A5","A6","A7","A8","A9","A10","A11","A12"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","liquidClassesSupported":true,"liquidClass":"water","nozzles":"COLUMN","path":"single","pipette":"54dfc5ab-0714-4ef4-827a-8f5a8d02ead0","preWetTip":false,"primaryNozzle":"A12","pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tip_tracking":"manual","tiprack_selected":"b21cecc2-730c-4a55-a5f8-32934f6f8977:opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tips_selected":[["A3","B3","C3","D3","E3","F3","G3","H3"]],"volume":"200","id":"0ca856ae-1e8a-497f-8e2d-bf7aabed5abf","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"5a6bcf20-df5c-4e47-8447-7f449fd5d7c9":{"heaterShakerSetTimer":true,"heaterShakerTimer":"00:00:30","latchOpen":false,"moduleId":"0270f202-f775-4b10-a1ef-f0a279ef8f59:heaterShakerModuleType","setHeaterShakerTemperature":null,"setShake":true,"targetHeaterShakerTemperature":null,"targetSpeed":"800","id":"5a6bcf20-df5c-4e47-8447-7f449fd5d7c9","stepType":"heaterShaker","stepName":"Heater-Shaker","stepDetails":"","stepNumber":0},"aa22e02e-4aef-4e18-9aaf-b1a8148ee8d6":{"heaterShakerSetTimer":null,"heaterShakerTimer":null,"latchOpen":true,"moduleId":"0270f202-f775-4b10-a1ef-f0a279ef8f59:heaterShakerModuleType","setHeaterShakerTemperature":null,"setShake":null,"targetHeaterShakerTemperature":null,"targetSpeed":null,"id":"aa22e02e-4aef-4e18-9aaf-b1a8148ee8d6","stepType":"heaterShaker","stepName":"Heater-Shaker","stepDetails":"","stepNumber":0},"f5712e90-4956-4ac2-bb68-875f87f87b35":{"labware":"9ebbf00f-fd8e-454e-8ac3-cf76d35605f8:custom_beta/griener_96_wellplate_323ul/1","newLocation":"db14dff2-9433-4bd2-82b0-b8b8b023bb82:magneticBlockType","useGripper":true,"id":"f5712e90-4956-4ac2-bb68-875f87f87b35","stepType":"moveLabware","stepName":"move","stepDetails":"","stepNumber":0},"a0d283ba-c31e-4f59-9ed2-0b7a16178bf3":{"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"10","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.5","aspirate_flowRate":"200","aspirate_labware":"9ebbf00f-fd8e-454e-8ac3-cf76d35605f8:custom_beta/griener_96_wellplate_323ul/1","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":0.9,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"35","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"35","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1","A2","A3","A4","A5","A6","A7","A8","A9","A10","A11","A12"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":true,"blowout_flowRate":"200","blowout_location":"dest_well","blowout_mmFromBottom":null,"blowout_x_position":null,"blowout_y_position":null,"blowout_position_reference":"well-top","changeTip":"once","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"10","dispense_delay_checkbox":false,"dispense_delay_seconds":"0","dispense_flowRate":"200","dispense_labware":"b5ac2328-185e-4540-946e-ee1360699ed0:opentrons/opentrons_tough_1_reservoir_300ml/2","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":20,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"35","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"35","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"ddde4cd9-ae9b-4482-9802-5aeb58192574:wasteChute","liquidClassesSupported":true,"liquidClass":"water","nozzles":"COLUMN","path":"single","pipette":"54dfc5ab-0714-4ef4-827a-8f5a8d02ead0","preWetTip":false,"primaryNozzle":"A12","pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tip_tracking":"manual","tiprack_selected":"b21cecc2-730c-4a55-a5f8-32934f6f8977:opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tips_selected":[["A3","B3","C3","D3","E3","F3","G3","H3"]],"volume":"200","id":"a0d283ba-c31e-4f59-9ed2-0b7a16178bf3","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"84b47428-9b57-41f3-ae07-4e2b439c38fa":{"labware":"9ebbf00f-fd8e-454e-8ac3-cf76d35605f8:custom_beta/griener_96_wellplate_323ul/1","newLocation":"0270f202-f775-4b10-a1ef-f0a279ef8f59:heaterShakerModuleType","useGripper":true,"id":"84b47428-9b57-41f3-ae07-4e2b439c38fa","stepType":"moveLabware","stepName":"move","stepDetails":"","stepNumber":0},"cc676d05-9d92-4f9b-82ae-db49a9155b7f":{"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"10","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.5","aspirate_flowRate":"200","aspirate_labware":"7c3ca9cb-6ad4-4f57-91f4-e5472cf8e4f7:custom_beta/opentrons_12_reservoir_22000ul/1","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":15,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"35","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"35","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A2"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":true,"blowout_flowRate":"200","blowout_location":"dest_well","blowout_mmFromBottom":null,"blowout_x_position":null,"blowout_y_position":null,"blowout_position_reference":"well-top","changeTip":"once","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"10","dispense_delay_checkbox":false,"dispense_delay_seconds":"0","dispense_flowRate":"200","dispense_labware":"9ebbf00f-fd8e-454e-8ac3-cf76d35605f8:custom_beta/griener_96_wellplate_323ul/1","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"35","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"35","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1","A2","A3","A4","A5","A6","A7","A8","A9","A10","A11","A12"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","liquidClassesSupported":true,"liquidClass":"water","nozzles":"COLUMN","path":"single","pipette":"54dfc5ab-0714-4ef4-827a-8f5a8d02ead0","preWetTip":false,"primaryNozzle":"A12","pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tip_tracking":"manual","tiprack_selected":"b21cecc2-730c-4a55-a5f8-32934f6f8977:opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tips_selected":[["A4","B4","C4","D4","E4","F4","G4","H4"]],"volume":"200","id":"cc676d05-9d92-4f9b-82ae-db49a9155b7f","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"621f6565-5d72-4670-a7f9-8e51160f1816":{"heaterShakerSetTimer":null,"heaterShakerTimer":null,"latchOpen":false,"moduleId":"0270f202-f775-4b10-a1ef-f0a279ef8f59:heaterShakerModuleType","setHeaterShakerTemperature":null,"setShake":null,"targetHeaterShakerTemperature":null,"targetSpeed":null,"id":"621f6565-5d72-4670-a7f9-8e51160f1816","stepType":"heaterShaker","stepName":"Heater-Shaker","stepDetails":"","stepNumber":0},"7666c005-d97a-4f07-b4cb-ab2e5270cf8a":{"heaterShakerSetTimer":true,"heaterShakerTimer":"00:00:30","latchOpen":false,"moduleId":"0270f202-f775-4b10-a1ef-f0a279ef8f59:heaterShakerModuleType","setHeaterShakerTemperature":null,"setShake":true,"targetHeaterShakerTemperature":null,"targetSpeed":"800","id":"7666c005-d97a-4f07-b4cb-ab2e5270cf8a","stepType":"heaterShaker","stepName":"Heater-Shaker","stepDetails":"","stepNumber":0},"a593f1fd-0215-44d5-99a3-7717e232b4c7":{"heaterShakerSetTimer":null,"heaterShakerTimer":null,"latchOpen":true,"moduleId":"0270f202-f775-4b10-a1ef-f0a279ef8f59:heaterShakerModuleType","setHeaterShakerTemperature":null,"setShake":null,"targetHeaterShakerTemperature":null,"targetSpeed":null,"id":"a593f1fd-0215-44d5-99a3-7717e232b4c7","stepType":"heaterShaker","stepName":"Heater-Shaker","stepDetails":"","stepNumber":0},"1105da13-9182-4917-87c6-a6be6b2528ed":{"labware":"9ebbf00f-fd8e-454e-8ac3-cf76d35605f8:custom_beta/griener_96_wellplate_323ul/1","newLocation":"db14dff2-9433-4bd2-82b0-b8b8b023bb82:magneticBlockType","useGripper":true,"id":"1105da13-9182-4917-87c6-a6be6b2528ed","stepType":"moveLabware","stepName":"move","stepDetails":"","stepNumber":0},"526039a7-9783-4c9b-a63c-d1e22d7d3fb1":{"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"10","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.5","aspirate_flowRate":"200","aspirate_labware":"9ebbf00f-fd8e-454e-8ac3-cf76d35605f8:custom_beta/griener_96_wellplate_323ul/1","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":0.9,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"35","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"35","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1","A2","A3","A4","A5","A6","A7","A8","A9","A10","A11","A12"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":true,"blowout_flowRate":"200","blowout_location":"dest_well","blowout_mmFromBottom":null,"blowout_x_position":null,"blowout_y_position":null,"blowout_position_reference":"well-top","changeTip":"once","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"10","dispense_delay_checkbox":false,"dispense_delay_seconds":"0","dispense_flowRate":"200","dispense_labware":"b5ac2328-185e-4540-946e-ee1360699ed0:opentrons/opentrons_tough_1_reservoir_300ml/2","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":20,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"35","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"35","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"ddde4cd9-ae9b-4482-9802-5aeb58192574:wasteChute","liquidClassesSupported":true,"liquidClass":"water","nozzles":"COLUMN","path":"single","pipette":"54dfc5ab-0714-4ef4-827a-8f5a8d02ead0","preWetTip":false,"primaryNozzle":"A12","pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tip_tracking":"manual","tiprack_selected":"b21cecc2-730c-4a55-a5f8-32934f6f8977:opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tips_selected":[["A4","B4","C4","D4","E4","F4","G4","H4"]],"volume":"200","id":"526039a7-9783-4c9b-a63c-d1e22d7d3fb1","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"637e6c26-01a7-419b-b1a2-0603b600d731":{"labware":"f7be247b-734a-4ac7-964c-8fded865c1e2:opentrons/opentrons_flex_96_filtertiprack_50ul/1","newLocation":"B2","useGripper":true,"id":"637e6c26-01a7-419b-b1a2-0603b600d731","stepType":"moveLabware","stepName":"move","stepDetails":"","stepNumber":0},"16a5c689-430e-4d75-a4e2-5f684174176e":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.5","aspirate_flowRate":"200","aspirate_labware":"7c3ca9cb-6ad4-4f57-91f4-e5472cf8e4f7:custom_beta/opentrons_12_reservoir_22000ul/1","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":5,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"35","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"35","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A12"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":true,"blowout_flowRate":"200","blowout_location":"dest_well","blowout_mmFromBottom":null,"blowout_x_position":null,"blowout_y_position":null,"blowout_position_reference":"well-top","changeTip":"once","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"1","dispense_delay_checkbox":false,"dispense_delay_seconds":"0","dispense_flowRate":"200","dispense_labware":"89d476d5-dea5-4874-ae0e-05d6e79be1a0:custom_beta/griener_96_wellplate_323ul/1","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":9,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"35","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"35","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1","A2","A3","A4","A5","A6","A7","A8","A9","A10","A11","A12"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"ddde4cd9-ae9b-4482-9802-5aeb58192574:wasteChute","liquidClassesSupported":true,"liquidClass":"water","nozzles":"COLUMN","path":"single","pipette":"54dfc5ab-0714-4ef4-827a-8f5a8d02ead0","preWetTip":false,"primaryNozzle":"A12","pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_50ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"50","id":"16a5c689-430e-4d75-a4e2-5f684174176e","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"9ffe96ae-1549-4737-9e87-1831c4724a08":{"labware":"89d476d5-dea5-4874-ae0e-05d6e79be1a0:custom_beta/griener_96_wellplate_323ul/1","newLocation":"0270f202-f775-4b10-a1ef-f0a279ef8f59:heaterShakerModuleType","useGripper":true,"id":"9ffe96ae-1549-4737-9e87-1831c4724a08","stepType":"moveLabware","stepName":"move","stepDetails":"","stepNumber":0},"64e8dac8-e9f3-4654-aa77-31e8bcac138f":{"heaterShakerSetTimer":true,"heaterShakerTimer":"00:00:30","latchOpen":false,"moduleId":"0270f202-f775-4b10-a1ef-f0a279ef8f59:heaterShakerModuleType","setHeaterShakerTemperature":null,"setShake":true,"targetHeaterShakerTemperature":null,"targetSpeed":"800","id":"64e8dac8-e9f3-4654-aa77-31e8bcac138f","stepType":"heaterShaker","stepName":"Heater-Shaker","stepDetails":"","stepNumber":0},"fe9ea6d0-a053-491e-aefa-c0c3de6e4594":{"heaterShakerSetTimer":null,"heaterShakerTimer":null,"latchOpen":true,"moduleId":"0270f202-f775-4b10-a1ef-f0a279ef8f59:heaterShakerModuleType","setHeaterShakerTemperature":null,"setShake":null,"targetHeaterShakerTemperature":null,"targetSpeed":null,"id":"fe9ea6d0-a053-491e-aefa-c0c3de6e4594","stepType":"heaterShaker","stepName":"Heater-Shaker","stepDetails":"","stepNumber":0},"20fba358-ef56-4422-aca3-99af5a0417dc":{"labware":"89d476d5-dea5-4874-ae0e-05d6e79be1a0:custom_beta/griener_96_wellplate_323ul/1","newLocation":"235c38ab-980f-4dd4-9b7c-356252f12de0:temperatureModuleType","useGripper":true,"id":"20fba358-ef56-4422-aca3-99af5a0417dc","stepType":"moveLabware","stepName":"move","stepDetails":"","stepNumber":0},"c6084065-1eba-4a21-8ca6-40a15270bc8a":{"labware":"9ebbf00f-fd8e-454e-8ac3-cf76d35605f8:custom_beta/griener_96_wellplate_323ul/1","newLocation":"0270f202-f775-4b10-a1ef-f0a279ef8f59:heaterShakerModuleType","useGripper":true,"id":"c6084065-1eba-4a21-8ca6-40a15270bc8a","stepType":"moveLabware","stepName":"move","stepDetails":"","stepNumber":0},"ec638eea-e1a9-4e47-9b88-d4b971ce987a":{"heaterShakerSetTimer":null,"heaterShakerTimer":null,"latchOpen":false,"moduleId":"0270f202-f775-4b10-a1ef-f0a279ef8f59:heaterShakerModuleType","setHeaterShakerTemperature":null,"setShake":null,"targetHeaterShakerTemperature":null,"targetSpeed":null,"id":"ec638eea-e1a9-4e47-9b88-d4b971ce987a","stepType":"heaterShaker","stepName":"Heater-Shaker","stepDetails":"","stepNumber":0},"9bd26f59-6914-45cc-8241-2807492770ca":{"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"10","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.5","aspirate_flowRate":"200","aspirate_labware":"89d476d5-dea5-4874-ae0e-05d6e79be1a0:custom_beta/griener_96_wellplate_323ul/1","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":0.9,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"35","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"35","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":true,"blowout_flowRate":"200","blowout_location":"dest_well","blowout_mmFromBottom":null,"blowout_x_position":null,"blowout_y_position":null,"blowout_position_reference":"well-top","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"10","dispense_delay_checkbox":false,"dispense_delay_seconds":"0","dispense_flowRate":"200","dispense_labware":"9ebbf00f-fd8e-454e-8ac3-cf76d35605f8:custom_beta/griener_96_wellplate_323ul/1","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"35","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"35","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","liquidClassesSupported":true,"liquidClass":"water","nozzles":"ALL","path":"single","pipette":"54dfc5ab-0714-4ef4-827a-8f5a8d02ead0","preWetTip":false,"primaryNozzle":"A1","pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"100","id":"9bd26f59-6914-45cc-8241-2807492770ca","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"82774031-227e-4ab9-8461-ef25e0ba0722":{"labware":"89d476d5-dea5-4874-ae0e-05d6e79be1a0:custom_beta/griener_96_wellplate_323ul/1","newLocation":"cutoutD3","useGripper":true,"id":"82774031-227e-4ab9-8461-ef25e0ba0722","stepType":"moveLabware","stepName":"move","stepDetails":"","stepNumber":0},"5b353b8a-1e7a-4d13-8d6b-5aa4ac08c428":{"heaterShakerSetTimer":true,"heaterShakerTimer":"00:30:00","latchOpen":false,"moduleId":"0270f202-f775-4b10-a1ef-f0a279ef8f59:heaterShakerModuleType","setHeaterShakerTemperature":null,"setShake":true,"targetHeaterShakerTemperature":null,"targetSpeed":"800","id":"5b353b8a-1e7a-4d13-8d6b-5aa4ac08c428","stepType":"heaterShaker","stepName":"Heater-Shaker","stepDetails":"","stepNumber":0},"3d574f11-fcd9-4ca6-a1b3-3d67dfffc260":{"heaterShakerSetTimer":null,"heaterShakerTimer":null,"latchOpen":true,"moduleId":"0270f202-f775-4b10-a1ef-f0a279ef8f59:heaterShakerModuleType","setHeaterShakerTemperature":null,"setShake":null,"targetHeaterShakerTemperature":null,"targetSpeed":null,"id":"3d574f11-fcd9-4ca6-a1b3-3d67dfffc260","stepType":"heaterShaker","stepName":"Heater-Shaker","stepDetails":"","stepNumber":0},"6d81c99b-1fe4-4485-891d-03155e4c6a52":{"labware":"9ebbf00f-fd8e-454e-8ac3-cf76d35605f8:custom_beta/griener_96_wellplate_323ul/1","newLocation":"db14dff2-9433-4bd2-82b0-b8b8b023bb82:magneticBlockType","useGripper":true,"id":"6d81c99b-1fe4-4485-891d-03155e4c6a52","stepType":"moveLabware","stepName":"move","stepDetails":"","stepNumber":0},"0f72278b-eb0d-4809-bf3f-a7fe8e93963d":{"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"10","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.5","aspirate_flowRate":"200","aspirate_labware":"9ebbf00f-fd8e-454e-8ac3-cf76d35605f8:custom_beta/griener_96_wellplate_323ul/1","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":0.9,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"35","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"35","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"200","blowout_location":"dest_well","blowout_mmFromBottom":null,"blowout_x_position":null,"blowout_y_position":null,"blowout_position_reference":"well-top","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"10","dispense_delay_checkbox":false,"dispense_delay_seconds":"0","dispense_flowRate":"200","dispense_labware":"b5ac2328-185e-4540-946e-ee1360699ed0:opentrons/opentrons_tough_1_reservoir_300ml/2","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":20,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"35","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"35","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"ddde4cd9-ae9b-4482-9802-5aeb58192574:wasteChute","liquidClassesSupported":true,"liquidClass":"water","nozzles":"ALL","path":"single","pipette":"54dfc5ab-0714-4ef4-827a-8f5a8d02ead0","preWetTip":false,"primaryNozzle":"A1","pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tip_tracking":"manual","tiprack_selected":"c118bd53-2d7f-4cad-ba97-a4439cc10dfa:opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tips_selected":[["A1","B1","C1","D1","E1","F1","G1","H1","A2","B2","C2","D2","E2","F2","G2","H2","A3","B3","C3","D3","E3","F3","G3","H3","A4","B4","C4","D4","E4","F4","G4","H4","A5","B5","C5","D5","E5","F5","G5","H5","A6","B6","C6","D6","E6","F6","G6","H6","A7","B7","C7","D7","E7","F7","G7","H7","A8","B8","C8","D8","E8","F8","G8","H8","A9","B9","C9","D9","E9","F9","G9","H9","A10","B10","C10","D10","E10","F10","G10","H10","A11","B11","C11","D11","E11","F11","G11","H11","A12","B12","C12","D12","E12","F12","G12","H12"]],"volume":"100","id":"0f72278b-eb0d-4809-bf3f-a7fe8e93963d","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"6ed39900-0cc4-4aaa-be3a-516c95819270":{"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"10","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.5","aspirate_flowRate":"200","aspirate_labware":"7c3ca9cb-6ad4-4f57-91f4-e5472cf8e4f7:custom_beta/opentrons_12_reservoir_22000ul/1","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":15,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"35","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"35","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A5"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":true,"blowout_flowRate":"200","blowout_location":"dest_well","blowout_mmFromBottom":null,"blowout_x_position":null,"blowout_y_position":null,"blowout_position_reference":"well-top","changeTip":"once","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"10","dispense_delay_checkbox":false,"dispense_delay_seconds":"0","dispense_flowRate":"200","dispense_labware":"9ebbf00f-fd8e-454e-8ac3-cf76d35605f8:custom_beta/griener_96_wellplate_323ul/1","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":9,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"35","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"35","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1","A2","A3","A4","A5","A6","A7","A8","A9","A10","A11","A12"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","liquidClassesSupported":true,"liquidClass":"water","nozzles":"COLUMN","path":"single","pipette":"54dfc5ab-0714-4ef4-827a-8f5a8d02ead0","preWetTip":false,"primaryNozzle":"A12","pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"200","id":"6ed39900-0cc4-4aaa-be3a-516c95819270","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"bf12c4c0-c9ab-44f7-a9e5-1e3317fb2a49":{"labware":"9ebbf00f-fd8e-454e-8ac3-cf76d35605f8:custom_beta/griener_96_wellplate_323ul/1","newLocation":"0270f202-f775-4b10-a1ef-f0a279ef8f59:heaterShakerModuleType","useGripper":true,"id":"bf12c4c0-c9ab-44f7-a9e5-1e3317fb2a49","stepType":"moveLabware","stepName":"move","stepDetails":"","stepNumber":0},"4377b039-db8c-4f73-899c-bb2b90a11257":{"heaterShakerSetTimer":true,"heaterShakerTimer":"00:05:00","latchOpen":false,"moduleId":"0270f202-f775-4b10-a1ef-f0a279ef8f59:heaterShakerModuleType","setHeaterShakerTemperature":null,"setShake":true,"targetHeaterShakerTemperature":null,"targetSpeed":"800","id":"4377b039-db8c-4f73-899c-bb2b90a11257","stepType":"heaterShaker","stepName":"Heater-Shaker","stepDetails":"","stepNumber":0},"a79da221-dbba-407f-9101-03ef2868a97f":{"heaterShakerSetTimer":null,"heaterShakerTimer":null,"latchOpen":true,"moduleId":"0270f202-f775-4b10-a1ef-f0a279ef8f59:heaterShakerModuleType","setHeaterShakerTemperature":null,"setShake":null,"targetHeaterShakerTemperature":null,"targetSpeed":null,"id":"a79da221-dbba-407f-9101-03ef2868a97f","stepType":"heaterShaker","stepName":"Heater-Shaker","stepDetails":"","stepNumber":0},"4155cce2-65dc-45c1-b799-7fd69c9dc4a6":{"labware":"9ebbf00f-fd8e-454e-8ac3-cf76d35605f8:custom_beta/griener_96_wellplate_323ul/1","newLocation":"db14dff2-9433-4bd2-82b0-b8b8b023bb82:magneticBlockType","useGripper":true,"id":"4155cce2-65dc-45c1-b799-7fd69c9dc4a6","stepType":"moveLabware","stepName":"move","stepDetails":"","stepNumber":0},"ee4b3176-aa0d-4dab-911f-3bdf12f635ae":{"labware":"c118bd53-2d7f-4cad-ba97-a4439cc10dfa:opentrons/opentrons_flex_96_filtertiprack_1000ul/1","newLocation":"C3","useGripper":true,"id":"ee4b3176-aa0d-4dab-911f-3bdf12f635ae","stepType":"moveLabware","stepName":"move","stepDetails":"","stepNumber":0},"35bc4e64-c76c-425d-b3ea-8c13293af313":{"labware":"c118bd53-2d7f-4cad-ba97-a4439cc10dfa:opentrons/opentrons_flex_96_filtertiprack_1000ul/1","newLocation":"C4","useGripper":true,"id":"35bc4e64-c76c-425d-b3ea-8c13293af313","stepType":"moveLabware","stepName":"move","stepDetails":"","stepNumber":0},"97d0357a-5830-494b-a5aa-ff8279bc69af":{"labware":"b34dbda1-1eac-4ccc-a174-aad10933b865:opentrons/opentrons_flex_96_filtertiprack_1000ul/1","newLocation":"8edc63ec-21b1-4849-9631-54f190ce23b9:opentrons/opentrons_flex_96_tiprack_adapter/1","useGripper":true,"id":"97d0357a-5830-494b-a5aa-ff8279bc69af","stepType":"moveLabware","stepName":"move","stepDetails":"","stepNumber":0},"47d6d8ac-8ea4-4c07-b972-88fabf98562a":{"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"10","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.5","aspirate_flowRate":"200","aspirate_labware":"9ebbf00f-fd8e-454e-8ac3-cf76d35605f8:custom_beta/griener_96_wellplate_323ul/1","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":0.9,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"35","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"35","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":true,"blowout_flowRate":"200","blowout_location":"dest_well","blowout_mmFromBottom":null,"blowout_x_position":null,"blowout_y_position":null,"blowout_position_reference":"well-top","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"10","dispense_delay_checkbox":false,"dispense_delay_seconds":"0","dispense_flowRate":"200","dispense_labware":"b5ac2328-185e-4540-946e-ee1360699ed0:opentrons/opentrons_tough_1_reservoir_300ml/2","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":20,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"35","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"35","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","liquidClassesSupported":true,"liquidClass":"water","nozzles":"ALL","path":"single","pipette":"54dfc5ab-0714-4ef4-827a-8f5a8d02ead0","preWetTip":false,"primaryNozzle":"A1","pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"200","id":"47d6d8ac-8ea4-4c07-b972-88fabf98562a","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"0e263160-1154-49e5-91c8-9a78523953bc":{"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"10","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.5","aspirate_flowRate":"200","aspirate_labware":"7c3ca9cb-6ad4-4f57-91f4-e5472cf8e4f7:custom_beta/opentrons_12_reservoir_22000ul/1","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":15,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"35","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"35","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A6"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":true,"blowout_flowRate":"200","blowout_location":"dest_well","blowout_mmFromBottom":null,"blowout_x_position":null,"blowout_y_position":null,"blowout_position_reference":"well-top","changeTip":"once","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"10","dispense_delay_checkbox":false,"dispense_delay_seconds":"0","dispense_flowRate":"200","dispense_labware":"9ebbf00f-fd8e-454e-8ac3-cf76d35605f8:custom_beta/griener_96_wellplate_323ul/1","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":9,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"35","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"35","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1","A2","A3","A4","A5","A6","A7","A8","A9","A10","A11","A12"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","liquidClassesSupported":true,"liquidClass":"water","nozzles":"COLUMN","path":"single","pipette":"54dfc5ab-0714-4ef4-827a-8f5a8d02ead0","preWetTip":false,"primaryNozzle":"A12","pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tip_tracking":"manual","tiprack_selected":"b21cecc2-730c-4a55-a5f8-32934f6f8977:opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tips_selected":[["A5","B5","C5","D5","E5","F5","G5","H5"]],"volume":"200","id":"0e263160-1154-49e5-91c8-9a78523953bc","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"eb2d2f48-d335-4a12-ae65-c2fa5f44a969":{"labware":"9ebbf00f-fd8e-454e-8ac3-cf76d35605f8:custom_beta/griener_96_wellplate_323ul/1","newLocation":"0270f202-f775-4b10-a1ef-f0a279ef8f59:heaterShakerModuleType","useGripper":true,"id":"eb2d2f48-d335-4a12-ae65-c2fa5f44a969","stepType":"moveLabware","stepName":"move","stepDetails":"","stepNumber":0},"f2f8d8a1-c94a-4820-9993-f83e7e7e84d5":{"heaterShakerSetTimer":true,"heaterShakerTimer":"00:05:00","latchOpen":false,"moduleId":"0270f202-f775-4b10-a1ef-f0a279ef8f59:heaterShakerModuleType","setHeaterShakerTemperature":null,"setShake":true,"targetHeaterShakerTemperature":null,"targetSpeed":"800","id":"f2f8d8a1-c94a-4820-9993-f83e7e7e84d5","stepType":"heaterShaker","stepName":"Heater-Shaker","stepDetails":"","stepNumber":0},"a61380c6-d894-4d23-b301-c5e5abc78fff":{"heaterShakerSetTimer":null,"heaterShakerTimer":null,"latchOpen":true,"moduleId":"0270f202-f775-4b10-a1ef-f0a279ef8f59:heaterShakerModuleType","setHeaterShakerTemperature":null,"setShake":null,"targetHeaterShakerTemperature":null,"targetSpeed":null,"id":"a61380c6-d894-4d23-b301-c5e5abc78fff","stepType":"heaterShaker","stepName":"Heater-Shaker","stepDetails":"","stepNumber":0},"a3a55326-ef28-41c0-9d3c-9c6054667b86":{"labware":"9ebbf00f-fd8e-454e-8ac3-cf76d35605f8:custom_beta/griener_96_wellplate_323ul/1","newLocation":"db14dff2-9433-4bd2-82b0-b8b8b023bb82:magneticBlockType","useGripper":true,"id":"a3a55326-ef28-41c0-9d3c-9c6054667b86","stepType":"moveLabware","stepName":"move","stepDetails":"","stepNumber":0},"5f2ac9c5-75be-4471-a106-30b2628e9da4":{"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"10","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.5","aspirate_flowRate":"200","aspirate_labware":"9ebbf00f-fd8e-454e-8ac3-cf76d35605f8:custom_beta/griener_96_wellplate_323ul/1","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":0.9,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"35","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"35","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":true,"blowout_flowRate":"200","blowout_location":"dest_well","blowout_mmFromBottom":null,"blowout_x_position":null,"blowout_y_position":null,"blowout_position_reference":"well-top","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"10","dispense_delay_checkbox":false,"dispense_delay_seconds":"0","dispense_flowRate":"200","dispense_labware":"b5ac2328-185e-4540-946e-ee1360699ed0:opentrons/opentrons_tough_1_reservoir_300ml/2","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":20,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"35","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"35","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","liquidClassesSupported":true,"liquidClass":"water","nozzles":"ALL","path":"single","pipette":"54dfc5ab-0714-4ef4-827a-8f5a8d02ead0","preWetTip":false,"primaryNozzle":"A1","pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tip_tracking":"manual","tiprack_selected":"b34dbda1-1eac-4ccc-a174-aad10933b865:opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tips_selected":[["A1","B1","C1","D1","E1","F1","G1","H1","A2","B2","C2","D2","E2","F2","G2","H2","A3","B3","C3","D3","E3","F3","G3","H3","A4","B4","C4","D4","E4","F4","G4","H4","A5","B5","C5","D5","E5","F5","G5","H5","A6","B6","C6","D6","E6","F6","G6","H6","A7","B7","C7","D7","E7","F7","G7","H7","A8","B8","C8","D8","E8","F8","G8","H8","A9","B9","C9","D9","E9","F9","G9","H9","A10","B10","C10","D10","E10","F10","G10","H10","A11","B11","C11","D11","E11","F11","G11","H11","A12","B12","C12","D12","E12","F12","G12","H12"]],"volume":"200","id":"5f2ac9c5-75be-4471-a106-30b2628e9da4","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"fe38fd0a-0444-4649-be3d-a9a722e9a132":{"labware":"9ebbf00f-fd8e-454e-8ac3-cf76d35605f8:custom_beta/griener_96_wellplate_323ul/1","newLocation":"0270f202-f775-4b10-a1ef-f0a279ef8f59:heaterShakerModuleType","useGripper":true,"id":"fe38fd0a-0444-4649-be3d-a9a722e9a132","stepType":"moveLabware","stepName":"move","stepDetails":"","stepNumber":0},"4891353e-eff7-4300-b298-7da6f6681b27":{"heaterShakerSetTimer":true,"heaterShakerTimer":"00:05:00","latchOpen":false,"moduleId":"0270f202-f775-4b10-a1ef-f0a279ef8f59:heaterShakerModuleType","setHeaterShakerTemperature":null,"setShake":true,"targetHeaterShakerTemperature":null,"targetSpeed":"800","id":"4891353e-eff7-4300-b298-7da6f6681b27","stepType":"heaterShaker","stepName":"Heater-Shaker","stepDetails":"","stepNumber":0},"422b5672-6423-4c80-93d3-76fe7815f656":{"heaterShakerSetTimer":null,"heaterShakerTimer":null,"latchOpen":true,"moduleId":"0270f202-f775-4b10-a1ef-f0a279ef8f59:heaterShakerModuleType","setHeaterShakerTemperature":null,"setShake":null,"targetHeaterShakerTemperature":null,"targetSpeed":null,"id":"422b5672-6423-4c80-93d3-76fe7815f656","stepType":"heaterShaker","stepName":"Heater-Shaker","stepDetails":"","stepNumber":0},"da8da59b-9dce-452d-b1c8-62572f6870a3":{"labware":"9ebbf00f-fd8e-454e-8ac3-cf76d35605f8:custom_beta/griener_96_wellplate_323ul/1","newLocation":"db14dff2-9433-4bd2-82b0-b8b8b023bb82:magneticBlockType","useGripper":true,"id":"da8da59b-9dce-452d-b1c8-62572f6870a3","stepType":"moveLabware","stepName":"move","stepDetails":"","stepNumber":0},"26231f97-1401-4ac0-8696-82a711d89251":{"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"10","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.5","aspirate_flowRate":"200","aspirate_labware":"9ebbf00f-fd8e-454e-8ac3-cf76d35605f8:custom_beta/griener_96_wellplate_323ul/1","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":0.9,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"35","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"35","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":true,"blowout_flowRate":"200","blowout_location":"dest_well","blowout_mmFromBottom":null,"blowout_x_position":null,"blowout_y_position":null,"blowout_position_reference":"well-top","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"10","dispense_delay_checkbox":false,"dispense_delay_seconds":"0","dispense_flowRate":"200","dispense_labware":"b5ac2328-185e-4540-946e-ee1360699ed0:opentrons/opentrons_tough_1_reservoir_300ml/2","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":20,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"35","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"35","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"ddde4cd9-ae9b-4482-9802-5aeb58192574:wasteChute","liquidClassesSupported":true,"liquidClass":"water","nozzles":"ALL","path":"single","pipette":"54dfc5ab-0714-4ef4-827a-8f5a8d02ead0","preWetTip":false,"primaryNozzle":"A1","pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tip_tracking":"manual","tiprack_selected":"b34dbda1-1eac-4ccc-a174-aad10933b865:opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tips_selected":[["A1","B1","C1","D1","E1","F1","G1","H1","A2","B2","C2","D2","E2","F2","G2","H2","A3","B3","C3","D3","E3","F3","G3","H3","A4","B4","C4","D4","E4","F4","G4","H4","A5","B5","C5","D5","E5","F5","G5","H5","A6","B6","C6","D6","E6","F6","G6","H6","A7","B7","C7","D7","E7","F7","G7","H7","A8","B8","C8","D8","E8","F8","G8","H8","A9","B9","C9","D9","E9","F9","G9","H9","A10","B10","C10","D10","E10","F10","G10","H10","A11","B11","C11","D11","E11","F11","G11","H11","A12","B12","C12","D12","E12","F12","G12","H12"]],"volume":"200","id":"26231f97-1401-4ac0-8696-82a711d89251","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"5d9f51a9-5069-4d76-82c8-b0efc0bb8718":{"labware":"f7be247b-734a-4ac7-964c-8fded865c1e2:opentrons/opentrons_flex_96_filtertiprack_50ul/1","newLocation":"C3","useGripper":true,"id":"5d9f51a9-5069-4d76-82c8-b0efc0bb8718","stepType":"moveLabware","stepName":"move","stepDetails":"","stepNumber":0},"ac56773e-9fa6-453f-b3ef-b7bf7a27d26f":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.5","aspirate_flowRate":"200","aspirate_labware":"7c3ca9cb-6ad4-4f57-91f4-e5472cf8e4f7:custom_beta/opentrons_12_reservoir_22000ul/1","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":15,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"35","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"35","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":true,"blowout_flowRate":"200","blowout_location":"dest_well","blowout_mmFromBottom":null,"blowout_x_position":null,"blowout_y_position":null,"blowout_position_reference":"well-top","changeTip":"once","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"1","dispense_delay_checkbox":false,"dispense_delay_seconds":"0","dispense_flowRate":"200","dispense_labware":"9ebbf00f-fd8e-454e-8ac3-cf76d35605f8:custom_beta/griener_96_wellplate_323ul/1","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":9,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"35","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"35","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1","A2","A3","A4","A5","A6","A7","A8","A9","A10","A11","A12"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"ddde4cd9-ae9b-4482-9802-5aeb58192574:wasteChute","liquidClassesSupported":true,"liquidClass":"water","nozzles":"COLUMN","path":"single","pipette":"54dfc5ab-0714-4ef4-827a-8f5a8d02ead0","preWetTip":false,"primaryNozzle":"A12","pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_50ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"50","id":"ac56773e-9fa6-453f-b3ef-b7bf7a27d26f","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"0dcd997f-9460-4a60-8de8-fc0e4d4927d8":{"labware":"9ebbf00f-fd8e-454e-8ac3-cf76d35605f8:custom_beta/griener_96_wellplate_323ul/1","newLocation":"0270f202-f775-4b10-a1ef-f0a279ef8f59:heaterShakerModuleType","useGripper":true,"id":"0dcd997f-9460-4a60-8de8-fc0e4d4927d8","stepType":"moveLabware","stepName":"move","stepDetails":"","stepNumber":0},"0ca44b12-dcb3-4a94-8d6e-1c9be98ac81c":{"heaterShakerSetTimer":true,"heaterShakerTimer":"01:00:00","latchOpen":false,"moduleId":"0270f202-f775-4b10-a1ef-f0a279ef8f59:heaterShakerModuleType","setHeaterShakerTemperature":true,"setShake":true,"targetHeaterShakerTemperature":"37","targetSpeed":"800","id":"0ca44b12-dcb3-4a94-8d6e-1c9be98ac81c","stepType":"heaterShaker","stepName":"Heater-Shaker","stepDetails":"","stepNumber":0},"f08dc111-3da4-463e-9258-72d22a0f8067":{"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"1","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.5","aspirate_flowRate":"173","aspirate_labware":"006405e9-bb2b-4129-a292-3b5aeb43ca0a:custom_beta/griener_96_wellplate_323ul/1","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"35","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"35","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A2"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":true,"blowout_flowRate":"200","blowout_location":"dest_well","blowout_mmFromBottom":null,"blowout_x_position":null,"blowout_y_position":null,"blowout_position_reference":"well-top","changeTip":"once","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"1","dispense_delay_checkbox":false,"dispense_delay_seconds":"0","dispense_flowRate":"173","dispense_labware":"9ebbf00f-fd8e-454e-8ac3-cf76d35605f8:custom_beta/griener_96_wellplate_323ul/1","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":9,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"35","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"35","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1","A2","A3","A4","A5","A6","A7","A8","A9","A10","A11","A12"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"ddde4cd9-ae9b-4482-9802-5aeb58192574:wasteChute","liquidClassesSupported":true,"liquidClass":"water","nozzles":"COLUMN","path":"single","pipette":"54dfc5ab-0714-4ef4-827a-8f5a8d02ead0","preWetTip":false,"primaryNozzle":"A12","pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_50ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"3","id":"f08dc111-3da4-463e-9258-72d22a0f8067","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"6f23a4be-c369-48f8-9539-f7e984ad3702":{"heaterShakerSetTimer":true,"heaterShakerTimer":"00:30:00","latchOpen":false,"moduleId":"0270f202-f775-4b10-a1ef-f0a279ef8f59:heaterShakerModuleType","setHeaterShakerTemperature":null,"setShake":true,"targetHeaterShakerTemperature":null,"targetSpeed":"800","id":"6f23a4be-c369-48f8-9539-f7e984ad3702","stepType":"heaterShaker","stepName":"Heater-Shaker","stepDetails":"","stepNumber":0},"274dd662-1e37-455e-9241-4aa47e70fb43":{"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"12","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.2","aspirate_flowRate":"150","aspirate_labware":"7c3ca9cb-6ad4-4f57-91f4-e5472cf8e4f7:custom_beta/opentrons_12_reservoir_22000ul/1","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":15,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0.5","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"35","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"35","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A8"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":true,"blowout_flowRate":"200","blowout_location":"dest_well","blowout_mmFromBottom":null,"blowout_x_position":null,"blowout_y_position":null,"blowout_position_reference":"well-top","changeTip":"once","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"12","dispense_delay_checkbox":true,"dispense_delay_seconds":"1","dispense_flowRate":"200","dispense_labware":"9ebbf00f-fd8e-454e-8ac3-cf76d35605f8:custom_beta/griener_96_wellplate_323ul/1","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":9,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0.5","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"35","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"35","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1","A2","A3","A4","A5","A6","A7","A8","A9","A10","A11","A12"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","liquidClassesSupported":true,"liquidClass":"ethanol_80","nozzles":"COLUMN","path":"single","pipette":"54dfc5ab-0714-4ef4-827a-8f5a8d02ead0","preWetTip":false,"primaryNozzle":"A12","pushOut_checkbox":false,"pushOut_volume":"","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"150","id":"274dd662-1e37-455e-9241-4aa47e70fb43","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"0a75e730-a4f9-44cb-ada4-22f90e9f1496":{"labware":"b34dbda1-1eac-4ccc-a174-aad10933b865:opentrons/opentrons_flex_96_filtertiprack_1000ul/1","newLocation":"B4","useGripper":true,"id":"0a75e730-a4f9-44cb-ada4-22f90e9f1496","stepType":"moveLabware","stepName":"move","stepDetails":"","stepNumber":0},"a54815b5-dca5-48d2-8ea3-d241c62c53af":{"labware":"793e81a3-dbe5-4e2a-a095-de4f0c6bc576:opentrons/opentrons_flex_96_filtertiprack_1000ul/1","newLocation":"8edc63ec-21b1-4849-9631-54f190ce23b9:opentrons/opentrons_flex_96_tiprack_adapter/1","useGripper":true,"id":"a54815b5-dca5-48d2-8ea3-d241c62c53af","stepType":"moveLabware","stepName":"move","stepDetails":"","stepNumber":0},"c66455ff-e1dd-4bb4-b5b0-5dd9477c5545":{"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":"200","blowout_checkbox":true,"blowout_flowRate":"200","blowout_location":"dest_well","blowout_z_offset":0,"changeTip":"always","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":"200","dropTip_location":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","labware":"9ebbf00f-fd8e-454e-8ac3-cf76d35605f8:custom_beta/griener_96_wellplate_323ul/1","liquidClassesSupported":true,"liquidClass":"none","mix_mmFromBottom":1,"mix_touchTip_checkbox":false,"mix_touchTip_mmFromTop":-1,"mix_wellOrder_first":"t2b","mix_wellOrder_second":"l2r","mix_position_reference":"well-bottom","mix_x_position":0,"mix_y_position":0,"nozzles":"ALL","pipette":"54dfc5ab-0714-4ef4-827a-8f5a8d02ead0","primaryNozzle":"A1","pushOut_checkbox":true,"pushOut_volume":"20","times":"5","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"203","wells":["A1"],"id":"c66455ff-e1dd-4bb4-b5b0-5dd9477c5545","stepType":"mix","stepName":"mix","stepDetails":"","stepNumber":0},"c9ad10a3-96c0-4186-80f9-5b1c05bf5288":{"heaterShakerSetTimer":true,"heaterShakerTimer":"00:10:00","latchOpen":true,"moduleId":"0270f202-f775-4b10-a1ef-f0a279ef8f59:heaterShakerModuleType","setHeaterShakerTemperature":false,"setShake":null,"targetHeaterShakerTemperature":"","targetSpeed":null,"id":"c9ad10a3-96c0-4186-80f9-5b1c05bf5288","stepType":"heaterShaker","stepName":"Heater-Shaker","stepDetails":"","stepNumber":0},"418406cf-0bc9-4818-9cd4-d1be758a631a":{"labware":"9ebbf00f-fd8e-454e-8ac3-cf76d35605f8:custom_beta/griener_96_wellplate_323ul/1","newLocation":"db14dff2-9433-4bd2-82b0-b8b8b023bb82:magneticBlockType","useGripper":true,"id":"418406cf-0bc9-4818-9cd4-d1be758a631a","stepType":"moveLabware","stepName":"move","stepDetails":"","stepNumber":0},"33645143-651f-40b5-ab15-5d937ae8d455":{"labware":"f7be247b-734a-4ac7-964c-8fded865c1e2:opentrons/opentrons_flex_96_filtertiprack_50ul/1","newLocation":"D4","useGripper":true,"id":"33645143-651f-40b5-ab15-5d937ae8d455","stepType":"moveLabware","stepName":"move","stepDetails":"","stepNumber":0},"15a6d778-476d-49fc-882e-acd98624bf97":{"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"11.7","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.2","aspirate_flowRate":"200","aspirate_labware":"9ebbf00f-fd8e-454e-8ac3-cf76d35605f8:custom_beta/griener_96_wellplate_323ul/1","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":0.9,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0.5","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"35","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"35","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":true,"blowout_flowRate":"200","blowout_location":"dest_well","blowout_mmFromBottom":null,"blowout_x_position":null,"blowout_y_position":null,"blowout_position_reference":"well-top","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"12","dispense_delay_checkbox":true,"dispense_delay_seconds":"1","dispense_flowRate":"200","dispense_labware":"b5ac2328-185e-4540-946e-ee1360699ed0:opentrons/opentrons_tough_1_reservoir_300ml/2","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":20,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0.5","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"35","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"35","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"ddde4cd9-ae9b-4482-9802-5aeb58192574:wasteChute","liquidClassesSupported":true,"liquidClass":"ethanol_80","nozzles":"ALL","path":"single","pipette":"54dfc5ab-0714-4ef4-827a-8f5a8d02ead0","preWetTip":false,"primaryNozzle":"A1","pushOut_checkbox":false,"pushOut_volume":"","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tip_tracking":"manual","tiprack_selected":"793e81a3-dbe5-4e2a-a095-de4f0c6bc576:opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tips_selected":[["A1","B1","C1","D1","E1","F1","G1","H1","A2","B2","C2","D2","E2","F2","G2","H2","A3","B3","C3","D3","E3","F3","G3","H3","A4","B4","C4","D4","E4","F4","G4","H4","A5","B5","C5","D5","E5","F5","G5","H5","A6","B6","C6","D6","E6","F6","G6","H6","A7","B7","C7","D7","E7","F7","G7","H7","A8","B8","C8","D8","E8","F8","G8","H8","A9","B9","C9","D9","E9","F9","G9","H9","A10","B10","C10","D10","E10","F10","G10","H10","A11","B11","C11","D11","E11","F11","G11","H11","A12","B12","C12","D12","E12","F12","G12","H12"]],"volume":"203","id":"15a6d778-476d-49fc-882e-acd98624bf97","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"90456935-2d56-4675-95df-5d58376884e3":{"labware":"793e81a3-dbe5-4e2a-a095-de4f0c6bc576:opentrons/opentrons_flex_96_filtertiprack_1000ul/1","newLocation":"C3","useGripper":true,"id":"90456935-2d56-4675-95df-5d58376884e3","stepType":"moveLabware","stepName":"move","stepDetails":"","stepNumber":0},"6c71682b-d511-41b8-83b4-6a3c41efcf01":{"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"11.8","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.2","aspirate_flowRate":"200","aspirate_labware":"7c3ca9cb-6ad4-4f57-91f4-e5472cf8e4f7:custom_beta/opentrons_12_reservoir_22000ul/1","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":15,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0.5","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"35","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"35","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A9"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":true,"blowout_flowRate":"200","blowout_location":"dest_well","blowout_mmFromBottom":null,"blowout_x_position":null,"blowout_y_position":null,"blowout_position_reference":"well-top","changeTip":"once","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"12","dispense_delay_checkbox":true,"dispense_delay_seconds":"1","dispense_flowRate":"200","dispense_labware":"9ebbf00f-fd8e-454e-8ac3-cf76d35605f8:custom_beta/griener_96_wellplate_323ul/1","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":9,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0.5","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"35","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"35","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1","A2","A3","A4","A5","A6","A7","A8","A9","A10","A11","A12"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","liquidClassesSupported":true,"liquidClass":"ethanol_80","nozzles":"COLUMN","path":"single","pipette":"54dfc5ab-0714-4ef4-827a-8f5a8d02ead0","preWetTip":false,"primaryNozzle":"A12","pushOut_checkbox":false,"pushOut_volume":"","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tip_tracking":"manual","tiprack_selected":"b21cecc2-730c-4a55-a5f8-32934f6f8977:opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tips_selected":[["A6","B6","C6","D6","E6","F6","G6","H6"]],"volume":"200","id":"6c71682b-d511-41b8-83b4-6a3c41efcf01","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"126ee002-0f1d-4f07-89d7-f6159e3a9c74":{"moduleId":null,"pauseAction":"untilTime","pauseMessage":"15 second wait","pauseTemperature":null,"pauseTime":"00:00:15","id":"126ee002-0f1d-4f07-89d7-f6159e3a9c74","stepType":"pause","stepName":"pause","stepDetails":"","stepNumber":0},"d14b2fb8-e275-437f-9896-4a781c6578d1":{"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"11.8","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.2","aspirate_flowRate":"200","aspirate_labware":"9ebbf00f-fd8e-454e-8ac3-cf76d35605f8:custom_beta/griener_96_wellplate_323ul/1","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":0.9,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0.5","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"35","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"35","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":true,"blowout_flowRate":"200","blowout_location":"dest_well","blowout_mmFromBottom":null,"blowout_x_position":null,"blowout_y_position":null,"blowout_position_reference":"well-top","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"12","dispense_delay_checkbox":true,"dispense_delay_seconds":"1","dispense_flowRate":"200","dispense_labware":"b5ac2328-185e-4540-946e-ee1360699ed0:opentrons/opentrons_tough_1_reservoir_300ml/2","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":20,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0.5","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"35","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"35","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","liquidClassesSupported":true,"liquidClass":"ethanol_80","nozzles":"ALL","path":"single","pipette":"54dfc5ab-0714-4ef4-827a-8f5a8d02ead0","preWetTip":false,"primaryNozzle":"A1","pushOut_checkbox":false,"pushOut_volume":"","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"200","id":"d14b2fb8-e275-437f-9896-4a781c6578d1","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"0719d7a1-8678-43f4-966a-8c22431cb50a":{"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"11.8","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.2","aspirate_flowRate":"200","aspirate_labware":"7c3ca9cb-6ad4-4f57-91f4-e5472cf8e4f7:custom_beta/opentrons_12_reservoir_22000ul/1","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":15,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0.5","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"35","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"35","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A10"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":true,"blowout_flowRate":"200","blowout_location":"dest_well","blowout_mmFromBottom":null,"blowout_x_position":null,"blowout_y_position":null,"blowout_position_reference":"well-top","changeTip":"once","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"12","dispense_delay_checkbox":true,"dispense_delay_seconds":"1","dispense_flowRate":"200","dispense_labware":"9ebbf00f-fd8e-454e-8ac3-cf76d35605f8:custom_beta/griener_96_wellplate_323ul/1","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":9,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0.5","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"35","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"35","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1","A2","A3","A4","A5","A6","A7","A8","A9","A10","A11","A12"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","liquidClassesSupported":true,"liquidClass":"ethanol_80","nozzles":"COLUMN","path":"single","pipette":"54dfc5ab-0714-4ef4-827a-8f5a8d02ead0","preWetTip":false,"primaryNozzle":"A12","pushOut_checkbox":false,"pushOut_volume":"","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tip_tracking":"manual","tiprack_selected":"b21cecc2-730c-4a55-a5f8-32934f6f8977:opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tips_selected":[["A6","B6","C6","D6","E6","F6","G6","H6"]],"volume":"200","id":"0719d7a1-8678-43f4-966a-8c22431cb50a","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"e3c00ec9-4b08-46f2-80fb-9e5f831d25ec":{"moduleId":null,"pauseAction":"untilTime","pauseMessage":"15 second wait","pauseTemperature":null,"pauseTime":"00:00:15","id":"e3c00ec9-4b08-46f2-80fb-9e5f831d25ec","stepType":"pause","stepName":"pause","stepDetails":"","stepNumber":0},"4bdabd93-daf4-42da-a645-1298717ef5ea":{"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"11.8","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.2","aspirate_flowRate":"200","aspirate_labware":"9ebbf00f-fd8e-454e-8ac3-cf76d35605f8:custom_beta/griener_96_wellplate_323ul/1","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":0.9,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0.5","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"35","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"35","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":true,"blowout_flowRate":"200","blowout_location":"dest_well","blowout_mmFromBottom":null,"blowout_x_position":null,"blowout_y_position":null,"blowout_position_reference":"well-top","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"12","dispense_delay_checkbox":true,"dispense_delay_seconds":"1","dispense_flowRate":"200","dispense_labware":"b5ac2328-185e-4540-946e-ee1360699ed0:opentrons/opentrons_tough_1_reservoir_300ml/2","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":20,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0.5","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"35","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"35","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","liquidClassesSupported":true,"liquidClass":"ethanol_80","nozzles":"ALL","path":"single","pipette":"54dfc5ab-0714-4ef4-827a-8f5a8d02ead0","preWetTip":false,"primaryNozzle":"A1","pushOut_checkbox":false,"pushOut_volume":"","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tip_tracking":"manual","tiprack_selected":"d6df4b61-9500-449d-8143-e490f348004e:opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tips_selected":[["A1","B1","C1","D1","E1","F1","G1","H1","A2","B2","C2","D2","E2","F2","G2","H2","A3","B3","C3","D3","E3","F3","G3","H3","A4","B4","C4","D4","E4","F4","G4","H4","A5","B5","C5","D5","E5","F5","G5","H5","A6","B6","C6","D6","E6","F6","G6","H6","A7","B7","C7","D7","E7","F7","G7","H7","A8","B8","C8","D8","E8","F8","G8","H8","A9","B9","C9","D9","E9","F9","G9","H9","A10","B10","C10","D10","E10","F10","G10","H10","A11","B11","C11","D11","E11","F11","G11","H11","A12","B12","C12","D12","E12","F12","G12","H12"]],"volume":"200","id":"4bdabd93-daf4-42da-a645-1298717ef5ea","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"e47bbd1a-3608-4c71-aa7f-be5f19e5cdfb":{"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"10","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.5","aspirate_flowRate":"200","aspirate_labware":"7c3ca9cb-6ad4-4f57-91f4-e5472cf8e4f7:custom_beta/opentrons_12_reservoir_22000ul/1","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":15,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"35","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"35","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A7"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":true,"blowout_flowRate":"200","blowout_location":"dest_well","blowout_mmFromBottom":null,"blowout_x_position":null,"blowout_y_position":null,"blowout_position_reference":"well-top","changeTip":"once","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"10","dispense_delay_checkbox":false,"dispense_delay_seconds":"0","dispense_flowRate":"200","dispense_labware":"9ebbf00f-fd8e-454e-8ac3-cf76d35605f8:custom_beta/griener_96_wellplate_323ul/1","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":9,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"35","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"35","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1","A2","A3","A4","A5","A6","A7","A8","A9","A10","A11","A12"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"ddde4cd9-ae9b-4482-9802-5aeb58192574:wasteChute","liquidClassesSupported":true,"liquidClass":"water","nozzles":"COLUMN","path":"single","pipette":"54dfc5ab-0714-4ef4-827a-8f5a8d02ead0","preWetTip":false,"primaryNozzle":"A12","pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tip_tracking":"manual","tiprack_selected":"b21cecc2-730c-4a55-a5f8-32934f6f8977:opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tips_selected":[["A5","B5","C5","D5","E5","F5","G5","H5"]],"volume":"200","id":"e47bbd1a-3608-4c71-aa7f-be5f19e5cdfb","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"bd7aac38-1fed-4c9d-a136-529c67325563":{"labware":"ee0626c4-7821-44ee-ab19-d0b1a20f6ca3:custom_beta/opentrons_12_reservoir_22000ul/1","newLocation":"235c38ab-980f-4dd4-9b7c-356252f12de0:temperatureModuleType","useGripper":false,"id":"bd7aac38-1fed-4c9d-a136-529c67325563","stepType":"moveLabware","stepName":"move","stepDetails":"","stepNumber":0},"46bae911-f313-4c24-966f-62d58edf5c61":{"labware":"ee0626c4-7821-44ee-ab19-d0b1a20f6ca3:custom_beta/opentrons_12_reservoir_22000ul/1","newLocation":"B2","useGripper":true,"id":"46bae911-f313-4c24-966f-62d58edf5c61","stepType":"moveLabware","stepName":"move","stepDetails":"","stepNumber":0},"8c125519-9a54-47a8-999a-882cf88e551e":{"moduleId":null,"pauseAction":"untilTime","pauseMessage":"15 second wait","pauseTemperature":null,"pauseTime":"00:00:15","id":"8c125519-9a54-47a8-999a-882cf88e551e","stepType":"pause","stepName":"pause","stepDetails":"","stepNumber":0},"3f8b7171-0392-49a1-a481-2ca6a3e30e7a":{"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"11.8","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.2","aspirate_flowRate":"200","aspirate_labware":"7c3ca9cb-6ad4-4f57-91f4-e5472cf8e4f7:custom_beta/opentrons_12_reservoir_22000ul/1","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":15,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0.5","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"35","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"35","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A11"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":true,"blowout_flowRate":"200","blowout_location":"dest_well","blowout_mmFromBottom":null,"blowout_x_position":null,"blowout_y_position":null,"blowout_position_reference":"well-top","changeTip":"once","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"12","dispense_delay_checkbox":true,"dispense_delay_seconds":"1","dispense_flowRate":"200","dispense_labware":"9ebbf00f-fd8e-454e-8ac3-cf76d35605f8:custom_beta/griener_96_wellplate_323ul/1","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":9,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0.5","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"35","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"35","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1","A2","A3","A4","A5","A6","A7","A8","A9","A10","A11","A12"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"ddde4cd9-ae9b-4482-9802-5aeb58192574:wasteChute","liquidClassesSupported":true,"liquidClass":"ethanol_80","nozzles":"COLUMN","path":"single","pipette":"54dfc5ab-0714-4ef4-827a-8f5a8d02ead0","preWetTip":false,"primaryNozzle":"A12","pushOut_checkbox":false,"pushOut_volume":"","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tip_tracking":"manual","tiprack_selected":"b21cecc2-730c-4a55-a5f8-32934f6f8977:opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tips_selected":[["A6","B6","C6","D6","E6","F6","G6","H6"]],"volume":"200","id":"3f8b7171-0392-49a1-a481-2ca6a3e30e7a","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"2be160cc-24d6-4ddf-8c20-d2d6247f20c9":{"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"11.8","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.2","aspirate_flowRate":"200","aspirate_labware":"9ebbf00f-fd8e-454e-8ac3-cf76d35605f8:custom_beta/griener_96_wellplate_323ul/1","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":0.9,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0.5","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"35","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"35","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":true,"blowout_flowRate":"200","blowout_location":"dest_well","blowout_mmFromBottom":null,"blowout_x_position":null,"blowout_y_position":null,"blowout_position_reference":"well-top","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"12","dispense_delay_checkbox":true,"dispense_delay_seconds":"1","dispense_flowRate":"200","dispense_labware":"b5ac2328-185e-4540-946e-ee1360699ed0:opentrons/opentrons_tough_1_reservoir_300ml/2","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":20,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0.5","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"35","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"35","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"ddde4cd9-ae9b-4482-9802-5aeb58192574:wasteChute","liquidClassesSupported":true,"liquidClass":"ethanol_80","nozzles":"ALL","path":"single","pipette":"54dfc5ab-0714-4ef4-827a-8f5a8d02ead0","preWetTip":false,"primaryNozzle":"A1","pushOut_checkbox":false,"pushOut_volume":"","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tip_tracking":"manual","tiprack_selected":"d6df4b61-9500-449d-8143-e490f348004e:opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tips_selected":[["A1","B1","C1","D1","E1","F1","G1","H1","A2","B2","C2","D2","E2","F2","G2","H2","A3","B3","C3","D3","E3","F3","G3","H3","A4","B4","C4","D4","E4","F4","G4","H4","A5","B5","C5","D5","E5","F5","G5","H5","A6","B6","C6","D6","E6","F6","G6","H6","A7","B7","C7","D7","E7","F7","G7","H7","A8","B8","C8","D8","E8","F8","G8","H8","A9","B9","C9","D9","E9","F9","G9","H9","A10","B10","C10","D10","E10","F10","G10","H10","A11","B11","C11","D11","E11","F11","G11","H11","A12","B12","C12","D12","E12","F12","G12","H12"]],"volume":"200","id":"2be160cc-24d6-4ddf-8c20-d2d6247f20c9","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"7e6fb526-0a8b-43a1-8ccf-be848e86f19f":{"labware":"9ebbf00f-fd8e-454e-8ac3-cf76d35605f8:custom_beta/griener_96_wellplate_323ul/1","newLocation":"235c38ab-980f-4dd4-9b7c-356252f12de0:temperatureModuleType","useGripper":true,"id":"7e6fb526-0a8b-43a1-8ccf-be848e86f19f","stepType":"moveLabware","stepName":"move","stepDetails":"","stepNumber":0},"c00982fb-03d0-4de6-a100-08f6b55a9eb4":{"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"10","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.5","aspirate_flowRate":"200","aspirate_labware":"ee0626c4-7821-44ee-ab19-d0b1a20f6ca3:custom_beta/opentrons_12_reservoir_22000ul/1","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":15,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"35","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"35","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":true,"blowout_flowRate":"200","blowout_location":"dest_well","blowout_mmFromBottom":null,"blowout_x_position":null,"blowout_y_position":null,"blowout_position_reference":"well-top","changeTip":"once","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"10","dispense_delay_checkbox":false,"dispense_delay_seconds":"0","dispense_flowRate":"200","dispense_labware":"9ebbf00f-fd8e-454e-8ac3-cf76d35605f8:custom_beta/griener_96_wellplate_323ul/1","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":9,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"35","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"35","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1","A2","A3","A4","A5","A6","A7","A8","A9","A10","A11","A12"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"ddde4cd9-ae9b-4482-9802-5aeb58192574:wasteChute","liquidClassesSupported":true,"liquidClass":"water","nozzles":"COLUMN","path":"single","pipette":"54dfc5ab-0714-4ef4-827a-8f5a8d02ead0","preWetTip":false,"primaryNozzle":"A12","pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"200","id":"c00982fb-03d0-4de6-a100-08f6b55a9eb4","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"310dd8ab-ee4a-4b09-8be6-05d24b01487c":{"moduleId":null,"pauseAction":"untilResume","pauseMessage":"Digestion time! Move sample plate to thermomixer","pauseTemperature":null,"pauseTime":null,"id":"310dd8ab-ee4a-4b09-8be6-05d24b01487c","stepType":"pause","stepName":"pause","stepDetails":"","stepNumber":0},"d792ba72-c124-4788-a142-84eaa284855e":{"moduleId":"d8637f78-b373-4b75-8d34-1a693d56a5cf:temperatureModuleType","setTemperature":"false","targetTemperature":null,"id":"d792ba72-c124-4788-a142-84eaa284855e","stepType":"temperature","stepName":"temperature","stepDetails":"","stepNumber":0},"8aaaef4b-0729-4974-901d-27afc6acf77a":{"moduleId":"235c38ab-980f-4dd4-9b7c-356252f12de0:temperatureModuleType","setTemperature":null,"targetTemperature":null,"id":"8aaaef4b-0729-4974-901d-27afc6acf77a","stepType":"temperature","stepName":"temperature","stepDetails":"","stepNumber":0},"b6f7780a-4fb3-4e2d-b5d1-e41ae114bb6c":{"labware":"d6df4b61-9500-449d-8143-e490f348004e:opentrons/opentrons_flex_96_filtertiprack_1000ul/1","newLocation":"B4","useGripper":true,"id":"b6f7780a-4fb3-4e2d-b5d1-e41ae114bb6c","stepType":"moveLabware","stepName":"move","stepDetails":"","stepNumber":0},"93ede8d5-997b-4a27-a690-3408b06aa863":{"labware":"d6df4b61-9500-449d-8143-e490f348004e:opentrons/opentrons_flex_96_filtertiprack_1000ul/1","newLocation":"B2","useGripper":true,"id":"93ede8d5-997b-4a27-a690-3408b06aa863","stepType":"moveLabware","stepName":"move","stepDetails":"","stepNumber":0},"6aaa5819-0ae5-4e92-a0f2-ff9fc143f4dd":{"labware":"d6df4b61-9500-449d-8143-e490f348004e:opentrons/opentrons_flex_96_filtertiprack_1000ul/1","newLocation":"C3","useGripper":true,"id":"6aaa5819-0ae5-4e92-a0f2-ff9fc143f4dd","stepType":"moveLabware","stepName":"move","stepDetails":"","stepNumber":0},"444fe878-17bf-48ce-8547-46e321b150b1":{"labware":"f7be247b-734a-4ac7-964c-8fded865c1e2:opentrons/opentrons_flex_96_filtertiprack_50ul/1","newLocation":"C3","useGripper":true,"id":"444fe878-17bf-48ce-8547-46e321b150b1","stepType":"moveLabware","stepName":"move","stepDetails":"","stepNumber":0},"0443c3a1-52d4-4e0c-84c9-520351edac62":{"labware":"f7be247b-734a-4ac7-964c-8fded865c1e2:opentrons/opentrons_flex_96_filtertiprack_50ul/1","newLocation":"B4","useGripper":true,"id":"0443c3a1-52d4-4e0c-84c9-520351edac62","stepType":"moveLabware","stepName":"move","stepDetails":"","stepNumber":0},"83e67ef5-eb7e-45b7-9e67-11718e541201":{"labware":"d6df4b61-9500-449d-8143-e490f348004e:opentrons/opentrons_flex_96_filtertiprack_1000ul/1","newLocation":"8edc63ec-21b1-4849-9631-54f190ce23b9:opentrons/opentrons_flex_96_tiprack_adapter/1","useGripper":true,"id":"83e67ef5-eb7e-45b7-9e67-11718e541201","stepType":"moveLabware","stepName":"move","stepDetails":"","stepNumber":0}},"orderedStepIds":["2374efce-cc61-4195-a4cd-f4f53949a4a4","fcb41fc4-cb8d-411b-b243-0df2983dfdae","7766549b-17c7-46d5-85ea-d6310f555477","2417e683-dedc-475b-8a2b-2d4f32169d2a","0fc3b327-eb44-4d16-9d1a-63e6f3fbcadc","8be4856a-0906-4233-bf6d-f0cda78df9ba","4fa04b3f-664d-4d31-be1a-db839e90f765","4ef11d5d-6e9f-4116-8c52-134c27a74588","f88697d1-220c-48bb-a58b-d5aeb91a37d3","6aaa5819-0ae5-4e92-a0f2-ff9fc143f4dd","7f278a14-4494-4260-8dd7-1176b5a6e470","a2993808-758a-4278-9b39-1cab7d0eec7e","4c8428da-da49-40fc-bab1-f8c9e3034949","0ca856ae-1e8a-497f-8e2d-bf7aabed5abf","5a6bcf20-df5c-4e47-8447-7f449fd5d7c9","aa22e02e-4aef-4e18-9aaf-b1a8148ee8d6","f5712e90-4956-4ac2-bb68-875f87f87b35","a0d283ba-c31e-4f59-9ed2-0b7a16178bf3","84b47428-9b57-41f3-ae07-4e2b439c38fa","621f6565-5d72-4670-a7f9-8e51160f1816","cc676d05-9d92-4f9b-82ae-db49a9155b7f","7666c005-d97a-4f07-b4cb-ab2e5270cf8a","a593f1fd-0215-44d5-99a3-7717e232b4c7","1105da13-9182-4917-87c6-a6be6b2528ed","637e6c26-01a7-419b-b1a2-0603b600d731","b6f7780a-4fb3-4e2d-b5d1-e41ae114bb6c","444fe878-17bf-48ce-8547-46e321b150b1","526039a7-9783-4c9b-a63c-d1e22d7d3fb1","16a5c689-430e-4d75-a4e2-5f684174176e","9ffe96ae-1549-4737-9e87-1831c4724a08","64e8dac8-e9f3-4654-aa77-31e8bcac138f","fe9ea6d0-a053-491e-aefa-c0c3de6e4594","20fba358-ef56-4422-aca3-99af5a0417dc","c6084065-1eba-4a21-8ca6-40a15270bc8a","ec638eea-e1a9-4e47-9b88-d4b971ce987a","9bd26f59-6914-45cc-8241-2807492770ca","82774031-227e-4ab9-8461-ef25e0ba0722","5b353b8a-1e7a-4d13-8d6b-5aa4ac08c428","3d574f11-fcd9-4ca6-a1b3-3d67dfffc260","6d81c99b-1fe4-4485-891d-03155e4c6a52","93ede8d5-997b-4a27-a690-3408b06aa863","0443c3a1-52d4-4e0c-84c9-520351edac62","0f72278b-eb0d-4809-bf3f-a7fe8e93963d","6ed39900-0cc4-4aaa-be3a-516c95819270","bf12c4c0-c9ab-44f7-a9e5-1e3317fb2a49","4377b039-db8c-4f73-899c-bb2b90a11257","a79da221-dbba-407f-9101-03ef2868a97f","4155cce2-65dc-45c1-b799-7fd69c9dc4a6","ee4b3176-aa0d-4dab-911f-3bdf12f635ae","97d0357a-5830-494b-a5aa-ff8279bc69af","35bc4e64-c76c-425d-b3ea-8c13293af313","47d6d8ac-8ea4-4c07-b972-88fabf98562a","0e263160-1154-49e5-91c8-9a78523953bc","eb2d2f48-d335-4a12-ae65-c2fa5f44a969","f2f8d8a1-c94a-4820-9993-f83e7e7e84d5","a61380c6-d894-4d23-b301-c5e5abc78fff","a3a55326-ef28-41c0-9d3c-9c6054667b86","5f2ac9c5-75be-4471-a106-30b2628e9da4","e47bbd1a-3608-4c71-aa7f-be5f19e5cdfb","fe38fd0a-0444-4649-be3d-a9a722e9a132","4891353e-eff7-4300-b298-7da6f6681b27","422b5672-6423-4c80-93d3-76fe7815f656","da8da59b-9dce-452d-b1c8-62572f6870a3","26231f97-1401-4ac0-8696-82a711d89251","5d9f51a9-5069-4d76-82c8-b0efc0bb8718","ac56773e-9fa6-453f-b3ef-b7bf7a27d26f","0dcd997f-9460-4a60-8de8-fc0e4d4927d8","0ca44b12-dcb3-4a94-8d6e-1c9be98ac81c","f08dc111-3da4-463e-9258-72d22a0f8067","6f23a4be-c369-48f8-9539-f7e984ad3702","274dd662-1e37-455e-9241-4aa47e70fb43","0a75e730-a4f9-44cb-ada4-22f90e9f1496","a54815b5-dca5-48d2-8ea3-d241c62c53af","c66455ff-e1dd-4bb4-b5b0-5dd9477c5545","c9ad10a3-96c0-4186-80f9-5b1c05bf5288","418406cf-0bc9-4818-9cd4-d1be758a631a","33645143-651f-40b5-ab15-5d937ae8d455","bd7aac38-1fed-4c9d-a136-529c67325563","15a6d778-476d-49fc-882e-acd98624bf97","90456935-2d56-4675-95df-5d58376884e3","83e67ef5-eb7e-45b7-9e67-11718e541201","6c71682b-d511-41b8-83b4-6a3c41efcf01","126ee002-0f1d-4f07-89d7-f6159e3a9c74","d14b2fb8-e275-437f-9896-4a781c6578d1","0719d7a1-8678-43f4-966a-8c22431cb50a","e3c00ec9-4b08-46f2-80fb-9e5f831d25ec","4bdabd93-daf4-42da-a645-1298717ef5ea","3f8b7171-0392-49a1-a481-2ca6a3e30e7a","8c125519-9a54-47a8-999a-882cf88e551e","2be160cc-24d6-4ddf-8c20-d2d6247f20c9","46bae911-f313-4c24-966f-62d58edf5c61","7e6fb526-0a8b-43a1-8ccf-be848e86f19f","c00982fb-03d0-4de6-a100-08f6b55a9eb4","310dd8ab-ee4a-4b09-8be6-05d24b01487c","d792ba72-c124-4788-a142-84eaa284855e","8aaaef4b-0729-4974-901d-27afc6acf77a"],"pipettes":{"54dfc5ab-0714-4ef4-827a-8f5a8d02ead0":{"pipetteName":"p1000_96"}},"modules":{"d8637f78-b373-4b75-8d34-1a693d56a5cf:temperatureModuleType":{"model":"temperatureModuleV2"},"235c38ab-980f-4dd4-9b7c-356252f12de0:temperatureModuleType":{"model":"temperatureModuleV2"},"0270f202-f775-4b10-a1ef-f0a279ef8f59:heaterShakerModuleType":{"model":"heaterShakerModuleV1"},"db14dff2-9433-4bd2-82b0-b8b8b023bb82:magneticBlockType":{"model":"magneticBlockV1"},"f90b907a-ef45-433f-8b8b-395258e33421:absorbanceReaderType":{"model":"absorbanceReaderV1"}},"labware":{"793e81a3-dbe5-4e2a-a095-de4f0c6bc576:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 1000 µL","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1"},"7c3ca9cb-6ad4-4f57-91f4-e5472cf8e4f7:custom_beta/opentrons_12_reservoir_22000ul/1":{"displayName":"Maor_Opentrons Tough 22mL 12 Well Reservoir","labwareDefURI":"custom_beta/opentrons_12_reservoir_22000ul/1"},"89d476d5-dea5-4874-ae0e-05d6e79be1a0:custom_beta/griener_96_wellplate_323ul/1":{"displayName":"Maor_Greiner 96 Well Plate 323 µL","labwareDefURI":"custom_beta/griener_96_wellplate_323ul/1"},"c118bd53-2d7f-4cad-ba97-a4439cc10dfa:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":{"displayName":"Opentrons Flex 96 Tip Rack Adapter (1)","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1"},"b21cecc2-730c-4a55-a5f8-32934f6f8977:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":{"displayName":"Opentrons Flex 96 Tip Rack Adapter (2)","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1"},"9ebbf00f-fd8e-454e-8ac3-cf76d35605f8:custom_beta/griener_96_wellplate_323ul/1":{"displayName":"Maor_Greiner 96 Well Plate 323 µL","labwareDefURI":"custom_beta/griener_96_wellplate_323ul/1"},"006405e9-bb2b-4129-a292-3b5aeb43ca0a:custom_beta/griener_96_wellplate_323ul/1":{"displayName":"Maor_Greiner 96 Well Plate 323 µL (1)","labwareDefURI":"custom_beta/griener_96_wellplate_323ul/1"},"f7be247b-734a-4ac7-964c-8fded865c1e2:opentrons/opentrons_flex_96_filtertiprack_50ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 50 µL","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_50ul/1"},"b5ac2328-185e-4540-946e-ee1360699ed0:opentrons/opentrons_tough_1_reservoir_300ml/2":{"displayName":"Opentrons Tough 300 mL 1 Well Reservoir","labwareDefURI":"opentrons/opentrons_tough_1_reservoir_300ml/2"},"8edc63ec-21b1-4849-9631-54f190ce23b9:opentrons/opentrons_flex_96_tiprack_adapter/1":{"displayName":"Opentrons Flex 96 Tip Rack Adapter","labwareDefURI":"opentrons/opentrons_flex_96_tiprack_adapter/1"},"b34dbda1-1eac-4ccc-a174-aad10933b865:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 1000 µL (1)","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1"},"ee0626c4-7821-44ee-ab19-d0b1a20f6ca3:custom_beta/opentrons_12_reservoir_22000ul/1":{"displayName":"Maor_Opentrons Tough 22mL 12 Well Reservoir","labwareDefURI":"custom_beta/opentrons_12_reservoir_22000ul/1"},"d6df4b61-9500-449d-8143-e490f348004e:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 1000 µL (2)","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1"}}}},"metadata":{"protocolName":"Maor_MagNet_SAX_96Sample_PreDigestion","author":"Maor_Foster_Lab","description":"","source":"Protocol Designer","created":1779839749343,"lastModified":1780930254223}}"""
