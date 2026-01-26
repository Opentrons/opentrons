from opentrons import protocol_api

metadata = {
    "protocolName": "Regression test protocol Flex ",
    "created": "2025-12-09T19:52:08.134Z",
    "internalAppBuildDate": "Tue, 16 Dec 2025 16:02:03 GMT",
    "lastModified": "2026-01-26T18:54:01.646Z",
    "protocolDesigner": "8.7.1",
    "source": "Protocol Designer",
}

requirements = {"robotType": "Flex", "apiLevel": "2.27"}


def run(protocol: protocol_api.ProtocolContext) -> None:
    # Load Modules:
    thermocycler_module_1 = protocol.load_module("thermocyclerModuleV2", "B1")
    temperature_module_1 = protocol.load_module("temperatureModuleV2", "C1")
    heater_shaker_module_1 = protocol.load_module("heaterShakerModuleV1", "D1")
    magnetic_block_1 = protocol.load_module("magneticBlockV1", "C2")

    # Load Adapters:
    adapter_1 = protocol.load_adapter(
        "opentrons_flex_deck_riser",
        location="B4",
        namespace="opentrons",
        version=1,
    )
    adapter_2 = temperature_module_1.load_adapter(
        "opentrons_96_deep_well_temp_mod_adapter",
        namespace="opentrons",
        version=1,
    )
    adapter_3 = heater_shaker_module_1.load_adapter(
        "opentrons_96_deep_well_adapter",
        namespace="opentrons",
        version=1,
    )

    # Load Lid Stacks:
    lid_stack_adapter_1 = protocol.load_lid_stack(
        load_name="opentrons_tough_pcr_auto_sealing_lid",
        location=adapter_1,
        quantity=2,
    )

    # Load Labware:
    tip_rack_1 = protocol.load_labware(
        "opentrons_flex_96_filtertiprack_1000ul",
        location="D2",
        namespace="opentrons",
        version=1,
    )
    tip_rack_2 = protocol.load_labware(
        "opentrons_flex_96_filtertiprack_200ul",
        location="B2",
        namespace="opentrons",
        version=1,
    )
    well_plate_1 = magnetic_block_1.load_labware(
        "nest_96_wellplate_2ml_deep",
        namespace="opentrons",
        version=5,
    )
    tip_rack_3 = protocol.load_labware(
        "opentrons_flex_96_filtertiprack_1000ul",
        location="B3",
        label="Opentrons Flex 96 Filter Tip Rack 1000 µL (1)",
        namespace="opentrons",
        version=1,
    )
    tip_rack_4 = protocol.load_labware(
        "opentrons_flex_96_filtertiprack_200ul",
        location="A2",
        label="Opentrons Flex 96 Filter Tip Rack 200 µL (1)",
        namespace="opentrons",
        version=1,
    )
    tip_rack_5 = protocol.load_labware(
        "opentrons_flex_96_tiprack_50ul",
        location="A3",
        namespace="opentrons",
        version=1,
    )
    well_plate_2 = protocol.load_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt",
        location="C4",
        namespace="opentrons",
        version=4,
    )

    # Load Pipettes:
    pipette_right = protocol.load_instrument("flex_8channel_1000", "right")
    pipette_left = protocol.load_instrument("flex_1channel_1000", "left")

    # Load Waste Chute:
    waste_chute = protocol.load_waste_chute()

    # Define Liquids:
    liquid_1 = protocol.define_liquid(
        "f",
        display_color="#b925ff",
    )

    # Load Liquids:
    well_plate_1.load_liquid(
        wells=[
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
            "H12",
        ],
        liquid=liquid_1,
        volume=1900,
    )
    well_plate_2.load_liquid(
        wells=[
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
            "H12",
        ],
        liquid=liquid_1,
        volume=22,
    )

    # Load Liquid Classes:
    ethanol_80_base_class = protocol.get_liquid_class("ethanol_80")
    glycerol_50_base_class = protocol.get_liquid_class("glycerol_50")

    # PROTOCOL STEPS

    # Step 1: move
    protocol.move_labware(well_plate_1, adapter_2, use_gripper=True)

    # Step 2: Heater-Shaker
    heater_shaker_module_1.deactivate_heater()
    heater_shaker_module_1.open_labware_latch()

    # Step 3: temperature
    temperature_module_1.start_set_temperature(45)

    # Step 4: pause
    temperature_module_1.await_temperature(45)

    # Step 5: move
    protocol.move_labware(well_plate_1, adapter_3, use_gripper=True)

    # Step 6: thermocycler
    thermocycler_module_1.close_lid()
    thermocycler_module_1.set_lid_temperature(110)
    thermocycler_module_1.execute_profile(
        [
            {"temperature": 33, "hold_time_seconds": 720},
            {"temperature": 90, "hold_time_seconds": 60},
        ],
        4,
        block_max_volume=40,
    )
    thermocycler_module_1.deactivate_block()
    thermocycler_module_1.deactivate_lid()

    # Step 7: thermocycler
    thermocycler_module_1.open_lid()

    # Step 8: Heater-Shaker
    heater_shaker_module_1.close_labware_latch()
    heater_shaker_module_1.deactivate_heater()

    # Step 9: move
    protocol.move_labware(well_plate_2, thermocycler_module_1, use_gripper=True)

    # Step 10: transfer
    pipette_left.transfer_with_liquid_class(
        volume=10,
        source=[well_plate_1["A12"]],
        dest=[well_plate_2["A1"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        tip_racks=[tip_rack_5],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_10",
            base_liquid_class=ethanol_80_base_class,
            properties={
                "flex_1channel_1000": {
                    "opentrons/opentrons_flex_96_tiprack_50ul/1": {
                        "aspirate": {
                            "aspirate_position": {
                                "offset": {"x": 0, "y": 0, "z": 2},
                                "position_reference": "well-bottom",
                            },
                            "flow_rate_by_volume": [(0, 10)],
                            "pre_wet": False,
                            "correction_by_volume": [(0, 0), (5, -0.75), (10, -0.7), (50, -1.3)],
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
                            "flow_rate_by_volume": [(0, 100)],
                            "delay": {"enabled": True, "duration": 2},
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
                            "correction_by_volume": [(0, 0), (5, -0.75), (10, -0.7), (50, -1.3)],
                            "push_out_by_volume": [(0, 0)],
                            "mix": {"enabled": False},
                        },
                    }
                }
            },
        ),
    )
    pipette_left.drop_tip(waste_chute)

    # Step 11: Heater-Shaker
    heater_shaker_module_1.deactivate_heater()
    heater_shaker_module_1.open_labware_latch()

    # Step 12: move
    protocol.move_labware(well_plate_1, adapter_2, use_gripper=True)

    # Step 13: Heater-Shaker
    heater_shaker_module_1.close_labware_latch()
    heater_shaker_module_1.deactivate_heater()

    # Step 14: transfer
    pipette_right.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette_right.transfer_with_liquid_class(
        volume=100,
        source=[well_plate_1["A12"]],
        dest=[well_plate_2["A12"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_1, tip_rack_3],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_14",
            base_liquid_class=glycerol_50_base_class,
            properties={
                "flex_8channel_1000": {
                    "opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                        "aspirate": {
                            "aspirate_position": {
                                "offset": {"x": 0, "y": 0, "z": 2},
                                "position_reference": "well-bottom",
                            },
                            "flow_rate_by_volume": [(0, 100)],
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
                    }
                }
            },
        ),
    )
    pipette_right.drop_tip(waste_chute)

    # Step 15: move
    protocol.move_lid("B4", well_plate_2, use_gripper=True)


DESIGNER_APPLICATION = """{"robot":{"model":"OT-3 Standard"},"designerApplication":{"name":"opentrons/protocol-designer","version":"8.7.0","data":{"pipetteTiprackAssignments":{"f8e5629c-0b07-4feb-b7e9-24ce4ad61c01":["opentrons/opentrons_flex_96_filtertiprack_1000ul/1","opentrons/opentrons_flex_96_filtertiprack_200ul/1","opentrons/opentrons_flex_96_filtertiprack_50ul/1"],"03572d14-1a00-4bc4-9ff9-acd007621786":["opentrons/opentrons_flex_96_tiprack_50ul/1"]},"dismissedWarnings":{"form":["OVER_MAX_WELL_VOLUME"],"timeline":[]},"ingredients":{"0":{"displayName":"f","displayColor":"#b925ff","description":null,"liquidGroupId":"0"}},"ingredLocations":{"5a4d6899-5211-4d68-ad3e-e0a5eaf623d9:opentrons/nest_96_wellplate_2ml_deep/5":{"A1":{"0":{"volume":1900}},"B1":{"0":{"volume":1900}},"C1":{"0":{"volume":1900}},"D1":{"0":{"volume":1900}},"E1":{"0":{"volume":1900}},"F1":{"0":{"volume":1900}},"G1":{"0":{"volume":1900}},"H1":{"0":{"volume":1900}},"A2":{"0":{"volume":1900}},"B2":{"0":{"volume":1900}},"C2":{"0":{"volume":1900}},"D2":{"0":{"volume":1900}},"E2":{"0":{"volume":1900}},"F2":{"0":{"volume":1900}},"G2":{"0":{"volume":1900}},"H2":{"0":{"volume":1900}},"A3":{"0":{"volume":1900}},"B3":{"0":{"volume":1900}},"C3":{"0":{"volume":1900}},"D3":{"0":{"volume":1900}},"E3":{"0":{"volume":1900}},"F3":{"0":{"volume":1900}},"G3":{"0":{"volume":1900}},"H3":{"0":{"volume":1900}},"A4":{"0":{"volume":1900}},"B4":{"0":{"volume":1900}},"C4":{"0":{"volume":1900}},"D4":{"0":{"volume":1900}},"E4":{"0":{"volume":1900}},"F4":{"0":{"volume":1900}},"G4":{"0":{"volume":1900}},"H4":{"0":{"volume":1900}},"A5":{"0":{"volume":1900}},"B5":{"0":{"volume":1900}},"C5":{"0":{"volume":1900}},"D5":{"0":{"volume":1900}},"E5":{"0":{"volume":1900}},"F5":{"0":{"volume":1900}},"G5":{"0":{"volume":1900}},"H5":{"0":{"volume":1900}},"A6":{"0":{"volume":1900}},"B6":{"0":{"volume":1900}},"C6":{"0":{"volume":1900}},"D6":{"0":{"volume":1900}},"E6":{"0":{"volume":1900}},"F6":{"0":{"volume":1900}},"G6":{"0":{"volume":1900}},"H6":{"0":{"volume":1900}},"A7":{"0":{"volume":1900}},"B7":{"0":{"volume":1900}},"C7":{"0":{"volume":1900}},"D7":{"0":{"volume":1900}},"E7":{"0":{"volume":1900}},"F7":{"0":{"volume":1900}},"G7":{"0":{"volume":1900}},"H7":{"0":{"volume":1900}},"A8":{"0":{"volume":1900}},"B8":{"0":{"volume":1900}},"C8":{"0":{"volume":1900}},"D8":{"0":{"volume":1900}},"E8":{"0":{"volume":1900}},"F8":{"0":{"volume":1900}},"G8":{"0":{"volume":1900}},"H8":{"0":{"volume":1900}},"A9":{"0":{"volume":1900}},"B9":{"0":{"volume":1900}},"C9":{"0":{"volume":1900}},"D9":{"0":{"volume":1900}},"E9":{"0":{"volume":1900}},"F9":{"0":{"volume":1900}},"G9":{"0":{"volume":1900}},"H9":{"0":{"volume":1900}},"A10":{"0":{"volume":1900}},"B10":{"0":{"volume":1900}},"C10":{"0":{"volume":1900}},"D10":{"0":{"volume":1900}},"E10":{"0":{"volume":1900}},"F10":{"0":{"volume":1900}},"G10":{"0":{"volume":1900}},"H10":{"0":{"volume":1900}},"A11":{"0":{"volume":1900}},"B11":{"0":{"volume":1900}},"C11":{"0":{"volume":1900}},"D11":{"0":{"volume":1900}},"E11":{"0":{"volume":1900}},"F11":{"0":{"volume":1900}},"G11":{"0":{"volume":1900}},"H11":{"0":{"volume":1900}},"A12":{"0":{"volume":1900}},"B12":{"0":{"volume":1900}},"C12":{"0":{"volume":1900}},"D12":{"0":{"volume":1900}},"E12":{"0":{"volume":1900}},"F12":{"0":{"volume":1900}},"G12":{"0":{"volume":1900}},"H12":{"0":{"volume":1900}}},"76392c54-19a2-43da-aa8a-696a051c1358:opentrons/opentrons_96_wellplate_200ul_pcr_full_skirt/4":{"A1":{"0":{"volume":22}},"B1":{"0":{"volume":22}},"C1":{"0":{"volume":22}},"D1":{"0":{"volume":22}},"E1":{"0":{"volume":22}},"F1":{"0":{"volume":22}},"G1":{"0":{"volume":22}},"H1":{"0":{"volume":22}},"A2":{"0":{"volume":22}},"B2":{"0":{"volume":22}},"C2":{"0":{"volume":22}},"D2":{"0":{"volume":22}},"E2":{"0":{"volume":22}},"F2":{"0":{"volume":22}},"G2":{"0":{"volume":22}},"H2":{"0":{"volume":22}},"A3":{"0":{"volume":22}},"B3":{"0":{"volume":22}},"C3":{"0":{"volume":22}},"D3":{"0":{"volume":22}},"E3":{"0":{"volume":22}},"F3":{"0":{"volume":22}},"G3":{"0":{"volume":22}},"H3":{"0":{"volume":22}},"A4":{"0":{"volume":22}},"B4":{"0":{"volume":22}},"C4":{"0":{"volume":22}},"D4":{"0":{"volume":22}},"E4":{"0":{"volume":22}},"F4":{"0":{"volume":22}},"G4":{"0":{"volume":22}},"H4":{"0":{"volume":22}},"A5":{"0":{"volume":22}},"B5":{"0":{"volume":22}},"C5":{"0":{"volume":22}},"D5":{"0":{"volume":22}},"E5":{"0":{"volume":22}},"F5":{"0":{"volume":22}},"G5":{"0":{"volume":22}},"H5":{"0":{"volume":22}},"A6":{"0":{"volume":22}},"B6":{"0":{"volume":22}},"C6":{"0":{"volume":22}},"D6":{"0":{"volume":22}},"E6":{"0":{"volume":22}},"F6":{"0":{"volume":22}},"G6":{"0":{"volume":22}},"H6":{"0":{"volume":22}},"A7":{"0":{"volume":22}},"B7":{"0":{"volume":22}},"C7":{"0":{"volume":22}},"D7":{"0":{"volume":22}},"E7":{"0":{"volume":22}},"F7":{"0":{"volume":22}},"G7":{"0":{"volume":22}},"H7":{"0":{"volume":22}},"A8":{"0":{"volume":22}},"B8":{"0":{"volume":22}},"C8":{"0":{"volume":22}},"D8":{"0":{"volume":22}},"E8":{"0":{"volume":22}},"F8":{"0":{"volume":22}},"G8":{"0":{"volume":22}},"H8":{"0":{"volume":22}},"A9":{"0":{"volume":22}},"B9":{"0":{"volume":22}},"C9":{"0":{"volume":22}},"D9":{"0":{"volume":22}},"E9":{"0":{"volume":22}},"F9":{"0":{"volume":22}},"G9":{"0":{"volume":22}},"H9":{"0":{"volume":22}},"A10":{"0":{"volume":22}},"B10":{"0":{"volume":22}},"C10":{"0":{"volume":22}},"D10":{"0":{"volume":22}},"E10":{"0":{"volume":22}},"F10":{"0":{"volume":22}},"G10":{"0":{"volume":22}},"H10":{"0":{"volume":22}},"A11":{"0":{"volume":22}},"B11":{"0":{"volume":22}},"C11":{"0":{"volume":22}},"D11":{"0":{"volume":22}},"E11":{"0":{"volume":22}},"F11":{"0":{"volume":22}},"G11":{"0":{"volume":22}},"H11":{"0":{"volume":22}},"A12":{"0":{"volume":22}},"B12":{"0":{"volume":22}},"C12":{"0":{"volume":22}},"D12":{"0":{"volume":22}},"E12":{"0":{"volume":22}},"F12":{"0":{"volume":22}},"G12":{"0":{"volume":22}},"H12":{"0":{"volume":22}}}},"savedStepForms":{"__INITIAL_DECK_SETUP_STEP__":{"stepType":"manualIntervention","id":"__INITIAL_DECK_SETUP_STEP__","labwareLocationUpdate":{"b970205e-b549-48bb-9744-152ca19b8b20:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":"D2","c8d942c7-e439-4337-b1c3-3a4c0e7c37e9:opentrons/opentrons_flex_96_filtertiprack_200ul/1":"B2","5a4d6899-5211-4d68-ad3e-e0a5eaf623d9:opentrons/nest_96_wellplate_2ml_deep/5":"b2f63124-f196-4be8-89cb-67dc03195f8d:magneticBlockType","394806a8-d4d5-4f43-bda4-7ca17966607e:opentrons/opentrons_flex_deck_riser/1":"B4","bf7fe872-818e-46db-97a2-df587a47450c:opentrons/opentrons_tough_pcr_auto_sealing_lid/2":"394806a8-d4d5-4f43-bda4-7ca17966607e:opentrons/opentrons_flex_deck_riser/1","76561401-818a-460e-a9da-6ed50c680f42:opentrons/opentrons_tough_pcr_auto_sealing_lid/2":"bf7fe872-818e-46db-97a2-df587a47450c:opentrons/opentrons_tough_pcr_auto_sealing_lid/2","2253ac88-9f2e-4d76-ac3f-6be582d8aa82:opentrons/opentrons_96_deep_well_temp_mod_adapter/1":"d1189fc8-b095-4ac0-a0c0-966b804b5187:temperatureModuleType","fa7f1253-3ac3-45ab-b8f3-8450352378d8:opentrons/opentrons_96_deep_well_adapter/1":"03500833-d9ee-4bda-a18e-e675428ce841:heaterShakerModuleType","7a09ecdd-59d0-48ad-bbdc-80e801dcad1d:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":"B3","fe720bdc-80bb-4977-8c25-dc73200e09cd:opentrons/opentrons_flex_96_filtertiprack_200ul/1":"A2","82951435-4ee4-4fd1-bf61-af174369056a:opentrons/opentrons_flex_96_tiprack_50ul/1":"A3","76392c54-19a2-43da-aa8a-696a051c1358:opentrons/opentrons_96_wellplate_200ul_pcr_full_skirt/4":"C4"},"pipetteLocationUpdate":{"f8e5629c-0b07-4feb-b7e9-24ce4ad61c01":"right","03572d14-1a00-4bc4-9ff9-acd007621786":"left"},"moduleLocationUpdate":{"94bddaf7-ae5f-4542-9bba-65aaae3333bd:thermocyclerModuleType":"B1","d1189fc8-b095-4ac0-a0c0-966b804b5187:temperatureModuleType":"C1","03500833-d9ee-4bda-a18e-e675428ce841:heaterShakerModuleType":"D1","b2f63124-f196-4be8-89cb-67dc03195f8d:magneticBlockType":"C2"},"trashBinLocationUpdate":{},"wasteChuteLocationUpdate":{"d264f441-b1d5-4236-8f03-cac879ee28ab:wasteChute":"cutoutD3"},"stagingAreaLocationUpdate":{"e8c4fbfb-b477-4b3a-aa15-ec369aaf595e:stagingArea":"cutoutC3","817997b2-c898-4656-9f5f-921fdabe0de5:stagingArea":"cutoutB3"},"gripperLocationUpdate":{"f73f1dc5-32b0-4241-aa48-edee956182d1:gripper":"mounted"}},"131a8035-2432-4cdf-a9f7-97367e8c2dd6":{"labware":"5a4d6899-5211-4d68-ad3e-e0a5eaf623d9:opentrons/nest_96_wellplate_2ml_deep/5","newLocation":"2253ac88-9f2e-4d76-ac3f-6be582d8aa82:opentrons/opentrons_96_deep_well_temp_mod_adapter/1","useGripper":true,"id":"131a8035-2432-4cdf-a9f7-97367e8c2dd6","stepType":"moveLabware","stepName":"move","stepDetails":"","stepNumber":0},"e673032f-0a9d-4765-a32c-69d2025960cf":{"heaterShakerSetTimer":null,"heaterShakerTimer":null,"latchOpen":true,"moduleId":"03500833-d9ee-4bda-a18e-e675428ce841:heaterShakerModuleType","setHeaterShakerTemperature":null,"setShake":null,"targetHeaterShakerTemperature":null,"targetSpeed":null,"id":"e673032f-0a9d-4765-a32c-69d2025960cf","stepType":"heaterShaker","stepName":"Heater-Shaker","stepDetails":"","stepNumber":0},"a8fb2e98-aae6-4dfe-9867-ccd8871ab322":{"moduleId":"d1189fc8-b095-4ac0-a0c0-966b804b5187:temperatureModuleType","setTemperature":"true","targetTemperature":"45","id":"a8fb2e98-aae6-4dfe-9867-ccd8871ab322","stepType":"temperature","stepName":"temperature","stepDetails":"","stepNumber":0},"8782cd85-b3b5-40d9-b7b6-2b0ff006b2dd":{"moduleId":"d1189fc8-b095-4ac0-a0c0-966b804b5187:temperatureModuleType","pauseAction":"untilTemperature","pauseMessage":"","pauseTemperature":"45","pauseTime":null,"id":"8782cd85-b3b5-40d9-b7b6-2b0ff006b2dd","stepType":"pause","stepName":"pause","stepDetails":"","stepNumber":0},"5db36f78-f6ca-424f-bf9d-e8daacb5c61d":{"labware":"5a4d6899-5211-4d68-ad3e-e0a5eaf623d9:opentrons/nest_96_wellplate_2ml_deep/5","newLocation":"fa7f1253-3ac3-45ab-b8f3-8450352378d8:opentrons/opentrons_96_deep_well_adapter/1","useGripper":true,"id":"5db36f78-f6ca-424f-bf9d-e8daacb5c61d","stepType":"moveLabware","stepName":"move","stepDetails":"","stepNumber":0},"75d4e658-d2e5-4bed-9bda-b5d69578e00e":{"blockIsActive":false,"blockIsActiveHold":false,"blockTargetTemp":null,"blockTargetTempHold":null,"lidIsActive":false,"lidIsActiveHold":false,"lidOpen":false,"lidOpenHold":null,"lidTargetTemp":null,"lidTargetTempHold":null,"moduleId":"94bddaf7-ae5f-4542-9bba-65aaae3333bd:thermocyclerModuleType","orderedProfileItems":["134b3d9b-8dde-496c-9c57-9b92d957f0a6"],"profileItemsById":{"134b3d9b-8dde-496c-9c57-9b92d957f0a6":{"id":"134b3d9b-8dde-496c-9c57-9b92d957f0a6","title":"","steps":[{"durationMinutes":"12","durationSeconds":"00","id":"15ea4fa8-5eb4-49d3-8ff1-2f33852406c7","temperature":"33","title":"f","type":"profileStep"},{"durationMinutes":"1","durationSeconds":"00","id":"c317ae3e-be91-4f54-bb11-7751d324611d","temperature":"90","title":"ff","type":"profileStep"}],"type":"profileCycle","repetitions":"4"}},"profileTargetLidTemp":"110","profileVolume":"40","thermocyclerFormType":"thermocyclerProfile","id":"75d4e658-d2e5-4bed-9bda-b5d69578e00e","stepType":"thermocycler","stepName":"thermocycler","stepDetails":"","stepNumber":0},"57165ec4-b4e6-4b03-8245-f2543ec48f8a":{"blockIsActive":false,"blockIsActiveHold":false,"blockTargetTemp":null,"blockTargetTempHold":null,"lidIsActive":false,"lidIsActiveHold":false,"lidOpen":true,"lidOpenHold":null,"lidTargetTemp":"","lidTargetTempHold":null,"moduleId":"94bddaf7-ae5f-4542-9bba-65aaae3333bd:thermocyclerModuleType","orderedProfileItems":[],"profileItemsById":{},"profileTargetLidTemp":null,"profileVolume":null,"thermocyclerFormType":"thermocyclerState","id":"57165ec4-b4e6-4b03-8245-f2543ec48f8a","stepType":"thermocycler","stepName":"thermocycler","stepDetails":"","stepNumber":0},"c98f5d22-b52a-4b85-a384-cd5fbbe88445":{"heaterShakerSetTimer":null,"heaterShakerTimer":null,"latchOpen":false,"moduleId":"03500833-d9ee-4bda-a18e-e675428ce841:heaterShakerModuleType","setHeaterShakerTemperature":null,"setShake":null,"targetHeaterShakerTemperature":null,"targetSpeed":null,"id":"c98f5d22-b52a-4b85-a384-cd5fbbe88445","stepType":"heaterShaker","stepName":"Heater-Shaker","stepDetails":"","stepNumber":0},"1c203918-a7d5-4979-a816-c770a731b926":{"labware":"76392c54-19a2-43da-aa8a-696a051c1358:opentrons/opentrons_96_wellplate_200ul_pcr_full_skirt/4","newLocation":"94bddaf7-ae5f-4542-9bba-65aaae3333bd:thermocyclerModuleType","useGripper":true,"id":"1c203918-a7d5-4979-a816-c770a731b926","stepType":"moveLabware","stepName":"move","stepDetails":"","stepNumber":0},"c088ff20-778c-42ef-9771-4b2ea59ae1b2":{"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"5","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.2","aspirate_flowRate":"10","aspirate_labware":"5a4d6899-5211-4d68-ad3e-e0a5eaf623d9:opentrons/nest_96_wellplate_2ml_deep/5","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0.5","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"100","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"100","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A12"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"100","blowout_location":"dest_well","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"5","dispense_delay_checkbox":true,"dispense_delay_seconds":"2","dispense_flowRate":"100","dispense_labware":"76392c54-19a2-43da-aa8a-696a051c1358:opentrons/opentrons_96_wellplate_200ul_pcr_full_skirt/4","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0.5","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"100","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"100","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"d264f441-b1d5-4236-8f03-cac879ee28ab:wasteChute","liquidClassesSupported":true,"liquidClass":"ethanol_80","nozzles":null,"path":"single","pipette":"03572d14-1a00-4bc4-9ff9-acd007621786","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":"","tipRack":"opentrons/opentrons_flex_96_tiprack_50ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"10","id":"c088ff20-778c-42ef-9771-4b2ea59ae1b2","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"2edc3a16-42cd-4758-8e13-0eb0769eeb6f":{"labware":"5a4d6899-5211-4d68-ad3e-e0a5eaf623d9:opentrons/nest_96_wellplate_2ml_deep/5","newLocation":"2253ac88-9f2e-4d76-ac3f-6be582d8aa82:opentrons/opentrons_96_deep_well_temp_mod_adapter/1","useGripper":true,"id":"2edc3a16-42cd-4758-8e13-0eb0769eeb6f","stepType":"moveLabware","stepName":"move","stepDetails":"","stepNumber":0},"6cdedaea-55c3-4d94-8f7b-8c5cf6e64690":{"heaterShakerSetTimer":null,"heaterShakerTimer":null,"latchOpen":true,"moduleId":"03500833-d9ee-4bda-a18e-e675428ce841:heaterShakerModuleType","setHeaterShakerTemperature":null,"setShake":null,"targetHeaterShakerTemperature":null,"targetSpeed":null,"id":"6cdedaea-55c3-4d94-8f7b-8c5cf6e64690","stepType":"heaterShaker","stepName":"Heater-Shaker","stepDetails":"","stepNumber":0},"3479949f-f459-4fa9-b9e1-6ef696e8e792":{"heaterShakerSetTimer":null,"heaterShakerTimer":null,"latchOpen":false,"moduleId":"03500833-d9ee-4bda-a18e-e675428ce841:heaterShakerModuleType","setHeaterShakerTemperature":null,"setShake":null,"targetHeaterShakerTemperature":null,"targetSpeed":null,"id":"3479949f-f459-4fa9-b9e1-6ef696e8e792","stepType":"heaterShaker","stepName":"Heater-Shaker","stepDetails":"","stepNumber":0},"705b8f2b-53a2-4a91-8ab9-7f6845811013":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.7","aspirate_flowRate":"100","aspirate_labware":"5a4d6899-5211-4d68-ad3e-e0a5eaf623d9:opentrons/nest_96_wellplate_2ml_deep/5","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"4","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"4","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A12"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"250","blowout_location":"dest_well","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":false,"dispense_airGap_volume":"","dispense_delay_checkbox":true,"dispense_delay_seconds":"0.5","dispense_flowRate":"250","dispense_labware":"76392c54-19a2-43da-aa8a-696a051c1358:opentrons/opentrons_96_wellplate_200ul_pcr_full_skirt/4","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"4","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"4","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A12"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"d264f441-b1d5-4236-8f03-cac879ee28ab:wasteChute","liquidClassesSupported":true,"liquidClass":"glycerol_50","nozzles":"ALL","path":"single","pipette":"f8e5629c-0b07-4feb-b7e9-24ce4ad61c01","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"35","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"100","id":"705b8f2b-53a2-4a91-8ab9-7f6845811013","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"5ec213a2-ec32-4568-9550-277b0e0de3c8":{"labware":"76561401-818a-460e-a9da-6ed50c680f42:opentrons/opentrons_tough_pcr_auto_sealing_lid/2","newLocation":"76392c54-19a2-43da-aa8a-696a051c1358:opentrons/opentrons_96_wellplate_200ul_pcr_full_skirt/4","useGripper":true,"id":"5ec213a2-ec32-4568-9550-277b0e0de3c8","stepType":"moveLabware","stepName":"move","stepDetails":"","stepNumber":0}},"orderedStepIds":["131a8035-2432-4cdf-a9f7-97367e8c2dd6","e673032f-0a9d-4765-a32c-69d2025960cf","a8fb2e98-aae6-4dfe-9867-ccd8871ab322","8782cd85-b3b5-40d9-b7b6-2b0ff006b2dd","5db36f78-f6ca-424f-bf9d-e8daacb5c61d","75d4e658-d2e5-4bed-9bda-b5d69578e00e","57165ec4-b4e6-4b03-8245-f2543ec48f8a","c98f5d22-b52a-4b85-a384-cd5fbbe88445","1c203918-a7d5-4979-a816-c770a731b926","c088ff20-778c-42ef-9771-4b2ea59ae1b2","6cdedaea-55c3-4d94-8f7b-8c5cf6e64690","2edc3a16-42cd-4758-8e13-0eb0769eeb6f","3479949f-f459-4fa9-b9e1-6ef696e8e792","705b8f2b-53a2-4a91-8ab9-7f6845811013","5ec213a2-ec32-4568-9550-277b0e0de3c8"],"pipettes":{"f8e5629c-0b07-4feb-b7e9-24ce4ad61c01":{"pipetteName":"p1000_multi_flex"},"03572d14-1a00-4bc4-9ff9-acd007621786":{"pipetteName":"p1000_single_flex"}},"modules":{"94bddaf7-ae5f-4542-9bba-65aaae3333bd:thermocyclerModuleType":{"model":"thermocyclerModuleV2"},"d1189fc8-b095-4ac0-a0c0-966b804b5187:temperatureModuleType":{"model":"temperatureModuleV2"},"03500833-d9ee-4bda-a18e-e675428ce841:heaterShakerModuleType":{"model":"heaterShakerModuleV1"},"b2f63124-f196-4be8-89cb-67dc03195f8d:magneticBlockType":{"model":"magneticBlockV1"}},"labware":{"b970205e-b549-48bb-9744-152ca19b8b20:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 1000 µL","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1"},"c8d942c7-e439-4337-b1c3-3a4c0e7c37e9:opentrons/opentrons_flex_96_filtertiprack_200ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 200 µL","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_200ul/1"},"5a4d6899-5211-4d68-ad3e-e0a5eaf623d9:opentrons/nest_96_wellplate_2ml_deep/5":{"displayName":"NEST 96 Deep Well Plate 2 mL","labwareDefURI":"opentrons/nest_96_wellplate_2ml_deep/5"},"394806a8-d4d5-4f43-bda4-7ca17966607e:opentrons/opentrons_flex_deck_riser/1":{"displayName":"Opentrons Flex Deck Riser","labwareDefURI":"opentrons/opentrons_flex_deck_riser/1"},"bf7fe872-818e-46db-97a2-df587a47450c:opentrons/opentrons_tough_pcr_auto_sealing_lid/2":{"displayName":"Opentrons Tough PCR Auto-Sealing Lid","labwareDefURI":"opentrons/opentrons_tough_pcr_auto_sealing_lid/2"},"76561401-818a-460e-a9da-6ed50c680f42:opentrons/opentrons_tough_pcr_auto_sealing_lid/2":{"displayName":"Opentrons Tough PCR Auto-Sealing Lid","labwareDefURI":"opentrons/opentrons_tough_pcr_auto_sealing_lid/2"},"2253ac88-9f2e-4d76-ac3f-6be582d8aa82:opentrons/opentrons_96_deep_well_temp_mod_adapter/1":{"displayName":"Opentrons 96 Deep Well Temperature Module Adapter","labwareDefURI":"opentrons/opentrons_96_deep_well_temp_mod_adapter/1"},"fa7f1253-3ac3-45ab-b8f3-8450352378d8:opentrons/opentrons_96_deep_well_adapter/1":{"displayName":"Opentrons 96 Deep Well Heater-Shaker Adapter","labwareDefURI":"opentrons/opentrons_96_deep_well_adapter/1"},"7a09ecdd-59d0-48ad-bbdc-80e801dcad1d:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 1000 µL (1)","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1"},"fe720bdc-80bb-4977-8c25-dc73200e09cd:opentrons/opentrons_flex_96_filtertiprack_200ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 200 µL (1)","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_200ul/1"},"82951435-4ee4-4fd1-bf61-af174369056a:opentrons/opentrons_flex_96_tiprack_50ul/1":{"displayName":"Opentrons Flex 96 Tip Rack 50 µL","labwareDefURI":"opentrons/opentrons_flex_96_tiprack_50ul/1"},"76392c54-19a2-43da-aa8a-696a051c1358:opentrons/opentrons_96_wellplate_200ul_pcr_full_skirt/4":{"displayName":"Opentrons Tough 96 Well Plate 200 µL PCR Full Skirt","labwareDefURI":"opentrons/opentrons_96_wellplate_200ul_pcr_full_skirt/4"}}}},"metadata":{"protocolName":"Regression test protocol Flex ","author":"","description":"","source":"Protocol Designer","created":1765309928134,"lastModified":1769453641646}}"""
