import json
from opentrons import protocol_api, types

metadata = {
    "protocolName": "Flex_S_870_Transfer_Partial_Single_HS_TS_TD",
    "created": "2026-01-09T19:18:09.898Z",
    "internalAppBuildDate": "Tue, 16 Dec 2025 16:02:03 GMT",
    "lastModified": "2026-01-26T19:58:59.949Z",
    "protocolDesigner": "8.7.1",
    "source": "Protocol Designer",
}

requirements = {"robotType": "Flex", "apiLevel": "2.27"}

def run(protocol: protocol_api.ProtocolContext) -> None:
    # Load Modules:
    thermocycler_module_1 = protocol.load_module("thermocyclerModuleV2", "B1")
    temperature_module_1 = protocol.load_module("temperatureModuleV2", "C1")
    heater_shaker_module_1 = protocol.load_module("heaterShakerModuleV1", "D1")

    # Load Adapters:
    adapter_1 = protocol.load_adapter(
        "opentrons_flex_96_tiprack_adapter",
        location="A2",
        namespace="opentrons",
        version=1,
    )
    adapter_2 = temperature_module_1.load_adapter(
        "opentrons_96_deep_well_temp_mod_adapter",
        namespace="opentrons",
        version=1,
    )
    adapter_3 = heater_shaker_module_1.load_adapter(
        "opentrons_96_pcr_adapter",
        namespace="opentrons",
        version=1,
    )

    # Load Lid Stacks:
    lid_stack_offDeck = protocol.load_lid_stack(
        load_name="opentrons_tough_universal_lid",
        location="offDeck",
        quantity=1,
    )

    # Load Labware:
    tip_rack_1 = protocol.load_labware(
        "opentrons_flex_96_filtertiprack_1000ul",
        location="D3",
        namespace="opentrons",
        version=1,
    )
    tip_rack_2 = adapter_1.load_labware(
        "opentrons_flex_96_filtertiprack_50ul",
        namespace="opentrons",
        version=1,
    )
    well_plate_1 = adapter_2.load_labware(
        "nest_96_wellplate_2ml_deep",
        namespace="opentrons",
        version=5,
    )
    well_plate_2 = adapter_3.load_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt",
        namespace="opentrons",
        version=4,
    )
    well_plate_3 = protocol.load_labware(
        "corning_384_wellplate_112ul_flat",
        location="B3",
        namespace="opentrons",
        version=5,
    )

    # Load Pipettes:
    pipette = protocol.load_instrument("flex_96channel_1000")

    # Load Trash Bins:
    trash_bin_1 = protocol.load_trash_bin("A3")

    # Define Liquids:
    liquid_1 = protocol.define_liquid(
        "ff",
        display_color="#b925ff",
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
        volume=1999,
    )

    # Load Liquid Classes:
    ethanol_80_base_class = protocol.get_liquid_class("ethanol_80")
    water_base_class = protocol.get_liquid_class("water")

    # PROTOCOL STEPS

    # Step 1: Heater-Shaker
    heater_shaker_module_1.close_labware_latch()
    heater_shaker_module_1.deactivate_heater()

    # Step 2: transfer
    pipette.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette.transfer_with_liquid_class(
        volume=1.5,
        source=[well_plate_1["A1"]],
        dest=[well_plate_2["A1"]],
        new_tip="always",
        return_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_2],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_2",
            properties={"flex_96channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_50ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 1},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 138)],
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
                        "offset": {"x": 0, "y": 0, "z": 1},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 138)],
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
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": True, "location": "trash", "flow_rate": 200},
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 20)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
        tips=[tip_rack_2["A1"]],
    )

    # Step 3: transfer
    pipette.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette.distribute_with_liquid_class(
        volume=20,
        source=[well_plate_1["A1"]],
        dest=[well_plate_3["A1"], well_plate_3["A2"]],
        new_tip="once",
        return_tip=True,
        trash_location=trash_bin_1,
        group_wells=False,
        tip_racks=[tip_rack_2],
        liquid_class=protocol.define_liquid_class(
            name="distribute_step_3",
            base_liquid_class=ethanol_80_base_class,
            properties={"flex_96channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_50ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 30)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0), (5, -0.35), (10, 0.1), (50, -1.3)],
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
                        "air_gap_by_volume": [(0, 0)],
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
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 100)],
                    "delay": {"enabled": True, "duration": 2},
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
                        "delay": {"enabled": True, "duration": 0.5},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 35,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": True, "location": "trash", "flow_rate": 100},
                    },
                    "correction_by_volume": [(0, 0), (5, -0.35), (10, 0.1), (50, -1.3)],
                    "push_out_by_volume": [(0, 0)],
                    "mix": {"enabled": False},
                },
                "multi_dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 100)],
                    "delay": {"enabled": True, "duration": 2},
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
                        "delay": {"enabled": True, "duration": 0.5},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 35,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": True, "location": "trash", "flow_rate": 100},
                    },
                    "correction_by_volume": [(0, 0), (5, -0.35), (10, 0.1), (50, -1.3)],
                    "conditioning_by_volume": [(0, 5)],
                    "disposal_by_volume": [(0, 5)],
                },
            }}},
        ),
        tips=[tip_rack_2["A1"]],
    )

    # Step 4: Heater-Shaker
    heater_shaker_module_1.close_labware_latch()
    heater_shaker_module_1.set_target_temperature(30)
    heater_shaker_module_1.set_and_wait_for_shake_speed(2000)
    heater_shaker_module_1.wait_for_temperature()
    protocol.delay(seconds=70)
    heater_shaker_module_1.deactivate_shaker()
    heater_shaker_module_1.deactivate_heater()

    # Step 5: Heater-Shaker
    heater_shaker_module_1.deactivate_heater()
    heater_shaker_module_1.open_labware_latch()

    # Step 6: temperature
    temperature_module_1.start_set_temperature(40)

    # Step 7: pause
    temperature_module_1.await_temperature(40)

    # Step 8: thermocycler
    thermocycler_module_1.open_lid()
    thermocycler_module_1.set_block_temperature(30)
    thermocycler_module_1.set_lid_temperature(100)

    # Step 9: move
    protocol.move_labware(well_plate_2, thermocycler_module_1, use_gripper=True)

    # Step 10: thermocycler
    thermocycler_module_1.close_lid()
    thermocycler_module_1.set_lid_temperature(110)
    thermocycler_module_1.execute_profile(
        [
            {"temperature": 10, "hold_time_seconds": 10},
            {"temperature": 40, "hold_time_seconds": 60},
            {"temperature": 90, "hold_time_seconds": 60},
            {"temperature": 10, "hold_time_seconds": 10},
            {"temperature": 40, "hold_time_seconds": 60},
            {"temperature": 90, "hold_time_seconds": 60},
            {"temperature": 10, "hold_time_seconds": 10},
            {"temperature": 40, "hold_time_seconds": 60},
            {"temperature": 90, "hold_time_seconds": 60},
            {"temperature": 10, "hold_time_seconds": 1},
            {"temperature": 90, "hold_time_seconds": 60},
            {"temperature": 10, "hold_time_seconds": 1},
            {"temperature": 90, "hold_time_seconds": 60},
            {"temperature": 10, "hold_time_seconds": 1},
            {"temperature": 90, "hold_time_seconds": 60},
            {"temperature": 10, "hold_time_seconds": 1},
            {"temperature": 90, "hold_time_seconds": 60},
            {"temperature": 10, "hold_time_seconds": 1},
            {"temperature": 90, "hold_time_seconds": 60},
            {"temperature": 10, "hold_time_seconds": 1},
            {"temperature": 90, "hold_time_seconds": 60},
            {"temperature": 10, "hold_time_seconds": 1},
            {"temperature": 90, "hold_time_seconds": 60},
            {"temperature": 10, "hold_time_seconds": 1},
            {"temperature": 90, "hold_time_seconds": 60},
            {"temperature": 10, "hold_time_seconds": 1},
            {"temperature": 90, "hold_time_seconds": 60},
            {"temperature": 10, "hold_time_seconds": 1},
            {"temperature": 90, "hold_time_seconds": 60},
        ],
        1,
        block_max_volume=100,
    )
    thermocycler_module_1.open_lid()
    thermocycler_module_1.set_block_temperature(30)
    thermocycler_module_1.set_lid_temperature(100)

    # Step 11: transfer
    pipette.configure_nozzle_layout(
        protocol_api.SINGLE,
        start="H12",
    )
    pipette.consolidate_with_liquid_class(
        volume=7,
        source=[well_plate_3["O21"], well_plate_3["O22"], well_plate_3["O23"]],
        dest=[well_plate_3["P24"]],
        new_tip="always",
        trash_location=trash_bin_1,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_1],
        liquid_class=protocol.define_liquid_class(
            name="consolidate_step_11",
            base_liquid_class=water_base_class,
            properties={"flex_96channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 198)],
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
                        "offset": {"x": 0, "y": 0, "z": 1},
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
    )
    pipette.drop_tip()

    # Step 12: move
    protocol.move_labware(well_plate_1, protocol_api.OFF_DECK)

    # Step 13: move
    protocol.move_labware(well_plate_1, "C2")

    # Step 14: move
    protocol.move_lid("offDeck", well_plate_2)

DESIGNER_APPLICATION = """{"robot":{"model":"OT-3 Standard"},"designerApplication":{"name":"opentrons/protocol-designer","version":"8.7.0","data":{"pipetteTiprackAssignments":{"fbaf8e49-dd83-4ec2-8bee-c8406c30e6c8":["opentrons/opentrons_flex_96_filtertiprack_1000ul/1","opentrons/opentrons_flex_96_filtertiprack_200ul/1","opentrons/opentrons_flex_96_filtertiprack_50ul/1"]},"dismissedWarnings":{"form":[],"timeline":[]},"ingredients":{"0":{"displayName":"ff","displayColor":"#b925ff","liquidClass":"water","description":null,"liquidGroupId":"0"}},"ingredLocations":{"23737457-1a80-4e74-a2c7-de3796d32dcb:opentrons/nest_96_wellplate_2ml_deep/5":{"A1":{"0":{"volume":1999}},"B1":{"0":{"volume":1999}},"C1":{"0":{"volume":1999}},"D1":{"0":{"volume":1999}},"E1":{"0":{"volume":1999}},"F1":{"0":{"volume":1999}},"G1":{"0":{"volume":1999}},"H1":{"0":{"volume":1999}},"A2":{"0":{"volume":1999}},"B2":{"0":{"volume":1999}},"C2":{"0":{"volume":1999}},"D2":{"0":{"volume":1999}},"E2":{"0":{"volume":1999}},"F2":{"0":{"volume":1999}},"G2":{"0":{"volume":1999}},"H2":{"0":{"volume":1999}},"A3":{"0":{"volume":1999}},"B3":{"0":{"volume":1999}},"C3":{"0":{"volume":1999}},"D3":{"0":{"volume":1999}},"E3":{"0":{"volume":1999}},"F3":{"0":{"volume":1999}},"G3":{"0":{"volume":1999}},"H3":{"0":{"volume":1999}},"A4":{"0":{"volume":1999}},"B4":{"0":{"volume":1999}},"C4":{"0":{"volume":1999}},"D4":{"0":{"volume":1999}},"E4":{"0":{"volume":1999}},"F4":{"0":{"volume":1999}},"G4":{"0":{"volume":1999}},"H4":{"0":{"volume":1999}},"A5":{"0":{"volume":1999}},"B5":{"0":{"volume":1999}},"C5":{"0":{"volume":1999}},"D5":{"0":{"volume":1999}},"E5":{"0":{"volume":1999}},"F5":{"0":{"volume":1999}},"G5":{"0":{"volume":1999}},"H5":{"0":{"volume":1999}},"A6":{"0":{"volume":1999}},"B6":{"0":{"volume":1999}},"C6":{"0":{"volume":1999}},"D6":{"0":{"volume":1999}},"E6":{"0":{"volume":1999}},"F6":{"0":{"volume":1999}},"G6":{"0":{"volume":1999}},"H6":{"0":{"volume":1999}},"A7":{"0":{"volume":1999}},"B7":{"0":{"volume":1999}},"C7":{"0":{"volume":1999}},"D7":{"0":{"volume":1999}},"E7":{"0":{"volume":1999}},"F7":{"0":{"volume":1999}},"G7":{"0":{"volume":1999}},"H7":{"0":{"volume":1999}},"A8":{"0":{"volume":1999}},"B8":{"0":{"volume":1999}},"C8":{"0":{"volume":1999}},"D8":{"0":{"volume":1999}},"E8":{"0":{"volume":1999}},"F8":{"0":{"volume":1999}},"G8":{"0":{"volume":1999}},"H8":{"0":{"volume":1999}},"A9":{"0":{"volume":1999}},"B9":{"0":{"volume":1999}},"C9":{"0":{"volume":1999}},"D9":{"0":{"volume":1999}},"E9":{"0":{"volume":1999}},"F9":{"0":{"volume":1999}},"G9":{"0":{"volume":1999}},"H9":{"0":{"volume":1999}},"A10":{"0":{"volume":1999}},"B10":{"0":{"volume":1999}},"C10":{"0":{"volume":1999}},"D10":{"0":{"volume":1999}},"E10":{"0":{"volume":1999}},"F10":{"0":{"volume":1999}},"G10":{"0":{"volume":1999}},"H10":{"0":{"volume":1999}},"A11":{"0":{"volume":1999}},"B11":{"0":{"volume":1999}},"C11":{"0":{"volume":1999}},"D11":{"0":{"volume":1999}},"E11":{"0":{"volume":1999}},"F11":{"0":{"volume":1999}},"G11":{"0":{"volume":1999}},"H11":{"0":{"volume":1999}},"A12":{"0":{"volume":1999}},"B12":{"0":{"volume":1999}},"C12":{"0":{"volume":1999}},"D12":{"0":{"volume":1999}},"E12":{"0":{"volume":1999}},"F12":{"0":{"volume":1999}},"G12":{"0":{"volume":1999}},"H12":{"0":{"volume":1999}}}},"savedStepForms":{"__INITIAL_DECK_SETUP_STEP__":{"stepType":"manualIntervention","id":"__INITIAL_DECK_SETUP_STEP__","labwareLocationUpdate":{"517468da-a490-442b-bddb-868a90438d46:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":"D3","296fa6c3-9767-43d6-b900-b2eb6293759b:opentrons/opentrons_flex_96_tiprack_adapter/1":"A2","d8277743-c880-4211-b7fb-62f4a1ba4a91:opentrons/opentrons_flex_96_filtertiprack_50ul/1":"296fa6c3-9767-43d6-b900-b2eb6293759b:opentrons/opentrons_flex_96_tiprack_adapter/1","616321a2-b170-4a9b-a0b9-066a2c05f574:opentrons/opentrons_96_deep_well_temp_mod_adapter/1":"8db16c08-652e-449f-8337-0ad73011401a:temperatureModuleType","23737457-1a80-4e74-a2c7-de3796d32dcb:opentrons/nest_96_wellplate_2ml_deep/5":"616321a2-b170-4a9b-a0b9-066a2c05f574:opentrons/opentrons_96_deep_well_temp_mod_adapter/1","2d73bc18-241c-44d4-9a46-fc5f135d507e:opentrons/opentrons_96_pcr_adapter/1":"9053f57d-8ea9-4c5e-a509-c129a71e723a:heaterShakerModuleType","dc67ab13-631d-411a-8bfb-ab9bf6a1fff4:opentrons/opentrons_96_wellplate_200ul_pcr_full_skirt/4":"2d73bc18-241c-44d4-9a46-fc5f135d507e:opentrons/opentrons_96_pcr_adapter/1","fc857e6a-978a-4bfc-8d7e-f67c452d3450:opentrons/corning_384_wellplate_112ul_flat/5":"B3","332a2221-8073-42d2-84c4-5eb986751143:opentrons/opentrons_tough_universal_lid/2":"offDeck"},"pipetteLocationUpdate":{"fbaf8e49-dd83-4ec2-8bee-c8406c30e6c8":"left"},"moduleLocationUpdate":{"f561bcea-e15e-4fbe-b9b5-fbdddf3b93ba:thermocyclerModuleType":"B1","8db16c08-652e-449f-8337-0ad73011401a:temperatureModuleType":"C1","9053f57d-8ea9-4c5e-a509-c129a71e723a:heaterShakerModuleType":"D1"},"trashBinLocationUpdate":{"b8e6d0b1-7d29-458e-ab22-d43d132921dd:trashBin":"cutoutA3"},"wasteChuteLocationUpdate":{},"stagingAreaLocationUpdate":{},"gripperLocationUpdate":{"9fff5563-b278-4aa8-9fc3-a90f2539dc93:gripper":"mounted"}},"1bda3e9f-1b99-4d01-aaa0-4cebe460965a":{"heaterShakerSetTimer":null,"heaterShakerTimer":null,"latchOpen":false,"moduleId":"9053f57d-8ea9-4c5e-a509-c129a71e723a:heaterShakerModuleType","setHeaterShakerTemperature":null,"setShake":null,"targetHeaterShakerTemperature":null,"targetSpeed":null,"id":"1bda3e9f-1b99-4d01-aaa0-4cebe460965a","stepType":"heaterShaker","stepName":"Heater-Shaker","stepDetails":"","stepNumber":0,"dropTip_location":"b8e6d0b1-7d29-458e-ab22-d43d132921dd:trashBin"},"6794176f-89fe-4127-915f-acf11efc3d94":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"","aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":"138","aspirate_labware":"23737457-1a80-4e74-a2c7-de3796d32dcb:opentrons/nest_96_wellplate_2ml_deep/5","aspirate_mix_checkbox":false,"aspirate_mix_times":"","aspirate_mix_volume":"","aspirate_mmFromBottom":1,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"35","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"35","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":true,"blowout_flowRate":"200","blowout_location":"b647a4f8-77bd-4533-8b64-8816a52d9164:wasteChute","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":false,"dispense_airGap_volume":"","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":"138","dispense_labware":"dc67ab13-631d-411a-8bfb-ab9bf6a1fff4:opentrons/opentrons_96_wellplate_200ul_pcr_full_skirt/4","dispense_mix_checkbox":false,"dispense_mix_times":"","dispense_mix_volume":"","dispense_mmFromBottom":1,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"35","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"35","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"opentrons/opentrons_flex_96_filtertiprack_50ul/1","liquidClassesSupported":true,"liquidClass":"none","nozzles":"ALL","path":"single","pipette":"fbaf8e49-dd83-4ec2-8bee-c8406c30e6c8","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_50ul/1","tip_tracking":"manual","tiprack_selected":"d8277743-c880-4211-b7fb-62f4a1ba4a91:opentrons/opentrons_flex_96_filtertiprack_50ul/1","tips_selected":[["A1","B1","C1","D1","E1","F1","G1","H1","A2","B2","C2","D2","E2","F2","G2","H2","A3","B3","C3","D3","E3","F3","G3","H3","A4","B4","C4","D4","E4","F4","G4","H4","A5","B5","C5","D5","E5","F5","G5","H5","A6","B6","C6","D6","E6","F6","G6","H6","A7","B7","C7","D7","E7","F7","G7","H7","A8","B8","C8","D8","E8","F8","G8","H8","A9","B9","C9","D9","E9","F9","G9","H9","A10","B10","C10","D10","E10","F10","G10","H10","A11","B11","C11","D11","E11","F11","G11","H11","A12","B12","C12","D12","E12","F12","G12","H12"]],"volume":"1.5","id":"6794176f-89fe-4127-915f-acf11efc3d94","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"491a53c8-e997-4a39-9188-8dc5d1dcb75f":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.2","aspirate_flowRate":"30","aspirate_labware":"23737457-1a80-4e74-a2c7-de3796d32dcb:opentrons/nest_96_wellplate_2ml_deep/5","aspirate_mix_checkbox":false,"aspirate_mix_times":"1","aspirate_mix_volume":"50","aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0.5","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"35","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"35","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"100","blowout_location":"b8e6d0b1-7d29-458e-ab22-d43d132921dd:trashBin","changeTip":"once","conditioning_checkbox":true,"conditioning_volume":"5","dispense_airGap_checkbox":true,"dispense_airGap_volume":"5","dispense_delay_checkbox":true,"dispense_delay_seconds":"2","dispense_flowRate":"100","dispense_labware":"fc857e6a-978a-4bfc-8d7e-f67c452d3450:opentrons/corning_384_wellplate_112ul_flat/5","dispense_mix_checkbox":false,"dispense_mix_times":null,"dispense_mix_volume":null,"dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0.5","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"35","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"35","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":-1,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1","A2"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":true,"disposalVolume_volume":"5","dropTip_location":"opentrons/opentrons_flex_96_filtertiprack_50ul/1","liquidClassesSupported":true,"liquidClass":"ethanol_80","nozzles":"ALL","path":"multiDispense","pipette":"fbaf8e49-dd83-4ec2-8bee-c8406c30e6c8","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":"","tipRack":"opentrons/opentrons_flex_96_filtertiprack_50ul/1","tip_tracking":"manual","tiprack_selected":"d8277743-c880-4211-b7fb-62f4a1ba4a91:opentrons/opentrons_flex_96_filtertiprack_50ul/1","tips_selected":[["A1","B1","C1","D1","E1","F1","G1","H1","A2","B2","C2","D2","E2","F2","G2","H2","A3","B3","C3","D3","E3","F3","G3","H3","A4","B4","C4","D4","E4","F4","G4","H4","A5","B5","C5","D5","E5","F5","G5","H5","A6","B6","C6","D6","E6","F6","G6","H6","A7","B7","C7","D7","E7","F7","G7","H7","A8","B8","C8","D8","E8","F8","G8","H8","A9","B9","C9","D9","E9","F9","G9","H9","A10","B10","C10","D10","E10","F10","G10","H10","A11","B11","C11","D11","E11","F11","G11","H11","A12","B12","C12","D12","E12","F12","G12","H12"]],"volume":"20","id":"491a53c8-e997-4a39-9188-8dc5d1dcb75f","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"cd208426-b4ec-4029-9297-bd03af4b56c9":{"heaterShakerSetTimer":true,"heaterShakerTimer":"00:1:10","latchOpen":false,"moduleId":"9053f57d-8ea9-4c5e-a509-c129a71e723a:heaterShakerModuleType","setHeaterShakerTemperature":true,"setShake":true,"targetHeaterShakerTemperature":"30","targetSpeed":"2000","id":"cd208426-b4ec-4029-9297-bd03af4b56c9","stepType":"heaterShaker","stepName":"Heater-Shaker","stepDetails":"","stepNumber":0},"4796d82d-0f7f-4147-98c9-c3bc20c2d512":{"heaterShakerSetTimer":null,"heaterShakerTimer":null,"latchOpen":true,"moduleId":"9053f57d-8ea9-4c5e-a509-c129a71e723a:heaterShakerModuleType","setHeaterShakerTemperature":null,"setShake":null,"targetHeaterShakerTemperature":null,"targetSpeed":null,"id":"4796d82d-0f7f-4147-98c9-c3bc20c2d512","stepType":"heaterShaker","stepName":"Heater-Shaker","stepDetails":"","stepNumber":0},"38bcacf0-ff55-4b8e-a526-b15ce4ddf6f6":{"moduleId":"8db16c08-652e-449f-8337-0ad73011401a:temperatureModuleType","setTemperature":"true","targetTemperature":"40","id":"38bcacf0-ff55-4b8e-a526-b15ce4ddf6f6","stepType":"temperature","stepName":"temperature","stepDetails":"","stepNumber":0},"467887c5-4d4b-4803-b655-1203b20e16b2":{"moduleId":"8db16c08-652e-449f-8337-0ad73011401a:temperatureModuleType","pauseAction":"untilTemperature","pauseMessage":"","pauseTemperature":"40","pauseTime":null,"id":"467887c5-4d4b-4803-b655-1203b20e16b2","stepType":"pause","stepName":"pause","stepDetails":"","stepNumber":0},"ff65186c-6e0e-490b-8165-a4641b52ddce":{"blockIsActive":false,"blockIsActiveHold":true,"blockTargetTemp":null,"blockTargetTempHold":"30","lidIsActive":false,"lidIsActiveHold":true,"lidOpen":false,"lidOpenHold":true,"lidTargetTemp":null,"lidTargetTempHold":"100","moduleId":"f561bcea-e15e-4fbe-b9b5-fbdddf3b93ba:thermocyclerModuleType","orderedProfileItems":["603bded9-0ceb-412a-a453-16c464043f74","3f71ec02-38e5-404f-84c8-5f19726e39da"],"profileItemsById":{"603bded9-0ceb-412a-a453-16c464043f74":{"id":"603bded9-0ceb-412a-a453-16c464043f74","title":"","steps":[{"durationMinutes":"00","durationSeconds":"10","id":"e3eb2af5-d64b-40ff-8f33-ad9cf1e17c54","temperature":"10","title":"ff","type":"profileStep"},{"durationMinutes":"1","durationSeconds":"00","id":"e4d5248e-e29b-40aa-ba8d-21db72fa33dc","temperature":"40","title":"f","type":"profileStep"},{"durationMinutes":"1","durationSeconds":"00","id":"6e58ca30-da1d-4f2b-bfca-2c3012496675","temperature":"90","title":"ff","type":"profileStep"}],"type":"profileCycle","repetitions":"3"},"3f71ec02-38e5-404f-84c8-5f19726e39da":{"id":"3f71ec02-38e5-404f-84c8-5f19726e39da","title":"","steps":[{"durationMinutes":"0","durationSeconds":"01","id":"edcb4c90-e79b-4029-87c6-8ba3cbb915b1","temperature":"10","title":"beep","type":"profileStep"},{"durationMinutes":"1","durationSeconds":"00","id":"a51119da-fc35-400c-8e93-fd3c7a88a1c5","temperature":"90","title":"Boops","type":"profileStep"}],"type":"profileCycle","repetitions":"10"}},"profileTargetLidTemp":"110","profileVolume":"100","thermocyclerFormType":"thermocyclerProfile","id":"ff65186c-6e0e-490b-8165-a4641b52ddce","stepType":"thermocycler","stepName":"thermocycler","stepDetails":"","stepNumber":0},"79e1fd57-fd1e-4664-b116-ebf30a0b58d7":{"blockIsActive":true,"blockIsActiveHold":false,"blockTargetTemp":30,"blockTargetTempHold":null,"lidIsActive":true,"lidIsActiveHold":false,"lidOpen":true,"lidOpenHold":null,"lidTargetTemp":100,"lidTargetTempHold":null,"moduleId":"f561bcea-e15e-4fbe-b9b5-fbdddf3b93ba:thermocyclerModuleType","orderedProfileItems":[],"profileItemsById":{},"profileTargetLidTemp":null,"profileVolume":null,"thermocyclerFormType":"thermocyclerState","id":"79e1fd57-fd1e-4664-b116-ebf30a0b58d7","stepType":"thermocycler","stepName":"thermocycler","stepDetails":"","stepNumber":0},"5fe64ab2-b98c-44be-a43d-c9cea9e03004":{"labware":"dc67ab13-631d-411a-8bfb-ab9bf6a1fff4:opentrons/opentrons_96_wellplate_200ul_pcr_full_skirt/4","newLocation":"f561bcea-e15e-4fbe-b9b5-fbdddf3b93ba:thermocyclerModuleType","useGripper":true,"id":"5fe64ab2-b98c-44be-a43d-c9cea9e03004","stepType":"moveLabware","stepName":"move","stepDetails":"","stepNumber":0},"0b40edcf-4876-492a-8376-0fa3aa561b71":{"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"10","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"0.5","aspirate_flowRate":"198","aspirate_labware":"fc857e6a-978a-4bfc-8d7e-f67c452d3450:opentrons/corning_384_wellplate_112ul_flat/5","aspirate_mix_checkbox":false,"aspirate_mix_times":null,"aspirate_mix_volume":null,"aspirate_mmFromBottom":2,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":"0","aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":"35","aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":"0","aspirate_submerge_speed":"35","aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":0,"aspirate_submerge_y_position":0,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":-1,"aspirate_touchTip_speed":"30","aspirate_touchTip_mmFromEdge":"0.5","aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["O21","O22","O23"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":"200","blowout_location":"dest_well","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":"","dispense_airGap_checkbox":true,"dispense_airGap_volume":"10","dispense_delay_checkbox":false,"dispense_delay_seconds":"0","dispense_flowRate":"200","dispense_labware":"fc857e6a-978a-4bfc-8d7e-f67c452d3450:opentrons/corning_384_wellplate_112ul_flat/5","dispense_mix_checkbox":false,"dispense_mix_times":"1","dispense_mix_volume":"50","dispense_mmFromBottom":null,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":"0","dispense_retract_mmFromBottom":2,"dispense_retract_speed":"35","dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":"0","dispense_submerge_speed":"35","dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":0,"dispense_submerge_y_position":0,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":"30","dispense_touchTip_mmFromEdge":"0.5","dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["P24"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":"","dropTip_location":"b8e6d0b1-7d29-458e-ab22-d43d132921dd:trashBin","liquidClassesSupported":true,"liquidClass":"water","nozzles":"SINGLE","path":"multiAspirate","pipette":"fbaf8e49-dd83-4ec2-8bee-c8406c30e6c8","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":"20","tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"7","id":"0b40edcf-4876-492a-8376-0fa3aa561b71","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","stepNumber":0},"c13fcee6-e85a-4419-b645-7afb393b9944":{"labware":"23737457-1a80-4e74-a2c7-de3796d32dcb:opentrons/nest_96_wellplate_2ml_deep/5","newLocation":"offDeck","useGripper":false,"id":"c13fcee6-e85a-4419-b645-7afb393b9944","stepType":"moveLabware","stepName":"move","stepDetails":"","stepNumber":0},"12016576-d593-4101-9106-0db5c2e7164c":{"labware":"23737457-1a80-4e74-a2c7-de3796d32dcb:opentrons/nest_96_wellplate_2ml_deep/5","newLocation":"C2","useGripper":false,"id":"12016576-d593-4101-9106-0db5c2e7164c","stepType":"moveLabware","stepName":"move","stepDetails":"","stepNumber":0},"1d42d330-81d8-4c48-903d-a09bf19a0eaf":{"labware":"332a2221-8073-42d2-84c4-5eb986751143:opentrons/opentrons_tough_universal_lid/2","newLocation":"dc67ab13-631d-411a-8bfb-ab9bf6a1fff4:opentrons/opentrons_96_wellplate_200ul_pcr_full_skirt/4","useGripper":false,"id":"1d42d330-81d8-4c48-903d-a09bf19a0eaf","stepType":"moveLabware","stepName":"move","stepDetails":"","stepNumber":0}},"orderedStepIds":["1bda3e9f-1b99-4d01-aaa0-4cebe460965a","6794176f-89fe-4127-915f-acf11efc3d94","491a53c8-e997-4a39-9188-8dc5d1dcb75f","cd208426-b4ec-4029-9297-bd03af4b56c9","4796d82d-0f7f-4147-98c9-c3bc20c2d512","38bcacf0-ff55-4b8e-a526-b15ce4ddf6f6","467887c5-4d4b-4803-b655-1203b20e16b2","79e1fd57-fd1e-4664-b116-ebf30a0b58d7","5fe64ab2-b98c-44be-a43d-c9cea9e03004","ff65186c-6e0e-490b-8165-a4641b52ddce","0b40edcf-4876-492a-8376-0fa3aa561b71","c13fcee6-e85a-4419-b645-7afb393b9944","12016576-d593-4101-9106-0db5c2e7164c","1d42d330-81d8-4c48-903d-a09bf19a0eaf"],"pipettes":{"fbaf8e49-dd83-4ec2-8bee-c8406c30e6c8":{"pipetteName":"p1000_96"}},"modules":{"f561bcea-e15e-4fbe-b9b5-fbdddf3b93ba:thermocyclerModuleType":{"model":"thermocyclerModuleV2"},"8db16c08-652e-449f-8337-0ad73011401a:temperatureModuleType":{"model":"temperatureModuleV2"},"9053f57d-8ea9-4c5e-a509-c129a71e723a:heaterShakerModuleType":{"model":"heaterShakerModuleV1"}},"labware":{"517468da-a490-442b-bddb-868a90438d46:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 1000 µL","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1"},"296fa6c3-9767-43d6-b900-b2eb6293759b:opentrons/opentrons_flex_96_tiprack_adapter/1":{"displayName":"Opentrons Flex 96 Tip Rack Adapter","labwareDefURI":"opentrons/opentrons_flex_96_tiprack_adapter/1"},"d8277743-c880-4211-b7fb-62f4a1ba4a91:opentrons/opentrons_flex_96_filtertiprack_50ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 50 µL","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_50ul/1"},"616321a2-b170-4a9b-a0b9-066a2c05f574:opentrons/opentrons_96_deep_well_temp_mod_adapter/1":{"displayName":"Opentrons 96 Deep Well Temperature Module Adapter","labwareDefURI":"opentrons/opentrons_96_deep_well_temp_mod_adapter/1"},"23737457-1a80-4e74-a2c7-de3796d32dcb:opentrons/nest_96_wellplate_2ml_deep/5":{"displayName":"NEST 96 Deep Well Plate 2 mL","labwareDefURI":"opentrons/nest_96_wellplate_2ml_deep/5"},"2d73bc18-241c-44d4-9a46-fc5f135d507e:opentrons/opentrons_96_pcr_adapter/1":{"displayName":"Opentrons 96 PCR Heater-Shaker Adapter","labwareDefURI":"opentrons/opentrons_96_pcr_adapter/1"},"dc67ab13-631d-411a-8bfb-ab9bf6a1fff4:opentrons/opentrons_96_wellplate_200ul_pcr_full_skirt/4":{"displayName":"Opentrons Tough 96 Well Plate 200 µL PCR Full Skirt","labwareDefURI":"opentrons/opentrons_96_wellplate_200ul_pcr_full_skirt/4"},"fc857e6a-978a-4bfc-8d7e-f67c452d3450:opentrons/corning_384_wellplate_112ul_flat/5":{"displayName":"Corning 384 Well Plate 112 µL Flat","labwareDefURI":"opentrons/corning_384_wellplate_112ul_flat/5"},"332a2221-8073-42d2-84c4-5eb986751143:opentrons/opentrons_tough_universal_lid/2":{"displayName":"Opentrons Tough Universal Lid","labwareDefURI":"opentrons/opentrons_tough_universal_lid/2"}}}},"metadata":{"protocolName":"Flex_S_870_Transfer_Partial_Single_HS_TS_TD","author":"","description":"","source":"Protocol Designer","created":1767986289898,"lastModified":1769457539949}}"""
