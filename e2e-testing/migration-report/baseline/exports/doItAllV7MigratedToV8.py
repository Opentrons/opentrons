from opentrons import protocol_api

metadata = {
    "protocolName": "Flex protocol do it all",
    "created": "2023-07-14T15:01:30.165Z",
    "internalAppBuildDate": "Tue, 16 Dec 2025 16:02:03 GMT",
    "lastModified": "2026-01-26T18:53:37.129Z",
    "protocolDesigner": "8.7.1",
    "source": "Protocol Designer",
}

requirements = {"robotType": "Flex", "apiLevel": "2.27"}


def run(protocol: protocol_api.ProtocolContext) -> None:
    # Load Modules:
    magnetic_block_1 = protocol.load_module("magneticBlockV1", "D2")
    heater_shaker_module_1 = protocol.load_module("heaterShakerModuleV1", "D1")
    temperature_module_1 = protocol.load_module("temperatureModuleV2", "D3")
    thermocycler_module_1 = protocol.load_module("thermocyclerModuleV2", "B1")

    # Load Adapters:
    adapter_1 = heater_shaker_module_1.load_adapter(
        "opentrons_96_flat_bottom_adapter",
        namespace="opentrons",
        version=1,
    )

    # Load Labware:
    tip_rack_1 = protocol.load_labware(
        "opentrons_flex_96_filtertiprack_50ul",
        location="C1",
        namespace="opentrons",
        version=1,
    )
    well_plate_1 = thermocycler_module_1.load_labware(
        "nest_96_wellplate_100ul_pcr_full_skirt",
        namespace="opentrons",
        version=5,
    )
    aluminum_block_1 = temperature_module_1.load_labware(
        "opentrons_24_aluminumblock_nest_1.5ml_snapcap",
        namespace="opentrons",
        version=3,
    )
    well_plate_2 = adapter_1.load_labware(
        "nest_96_wellplate_200ul_flat",
        namespace="opentrons",
        version=5,
    )

    # Load Pipettes:
    pipette_left = protocol.load_instrument("flex_1channel_1000", "left")
    pipette_right = protocol.load_instrument("flex_8channel_50", "right")

    # Load Trash Bins:
    trash_bin_1 = protocol.load_trash_bin("A3")

    # Define Liquids:
    liquid_1 = protocol.define_liquid(
        "Water",
        display_color="#b925ff",
    )
    liquid_2 = protocol.define_liquid(
        "Samples",
        display_color="#ffd600",
    )

    # Load Liquids:
    well_plate_1.load_liquid(
        wells=["A1", "B1", "C1", "D1", "E1", "F1", "G1", "H1"],
        liquid=liquid_1,
        volume=100,
    )
    aluminum_block_1.load_liquid(
        wells=["A1"],
        liquid=liquid_2,
        volume=1000,
    )

    # PROTOCOL STEPS

    # Step 1: temperature
    temperature_module_1.start_set_temperature(4)

    # Step 2: heater-shaker
    heater_shaker_module_1.close_labware_latch()
    heater_shaker_module_1.set_target_temperature(40)

    # Step 3: pause
    heater_shaker_module_1.wait_for_temperature()

    # Step 4: thermocycler
    thermocycler_module_1.close_lid()
    thermocycler_module_1.set_lid_temperature(40)
    thermocycler_module_1.execute_profile(
        [
            {"temperature": 4, "hold_time_seconds": 60},
            {"temperature": 10, "hold_time_seconds": 120},
        ],
        1,
        block_max_volume=10,
    )
    thermocycler_module_1.deactivate_block()
    thermocycler_module_1.deactivate_lid()

    # Step 5: thermocycler
    thermocycler_module_1.open_lid()

    # Step 6: transfer
    pipette_left.transfer_with_liquid_class(
        volume=100,
        source=[
            aluminum_block_1["A1"],
            aluminum_block_1["A1"],
            aluminum_block_1["A1"],
            aluminum_block_1["A1"],
            aluminum_block_1["A1"],
            aluminum_block_1["A1"],
            aluminum_block_1["A1"],
            aluminum_block_1["A1"],
        ],
        dest=[
            well_plate_1["A1"],
            well_plate_1["B1"],
            well_plate_1["C1"],
            well_plate_1["D1"],
            well_plate_1["E1"],
            well_plate_1["F1"],
            well_plate_1["G1"],
            well_plate_1["H1"],
        ],
        new_tip="always",
        trash_location=trash_bin_1,
        keep_last_tip=True,
        tip_racks=[tip_rack_1],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_6",
            properties={
                "flex_1channel_1000": {
                    "opentrons/opentrons_flex_96_filtertiprack_50ul/1": {
                        "aspirate": {
                            "aspirate_position": {
                                "offset": {"x": 0, "y": 0, "z": 1},
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
                                "speed": 100,
                                "touch_tip": {"enabled": False},
                            },
                        },
                        "dispense": {
                            "dispense_position": {
                                "offset": {"x": 0, "y": 0, "z": 1},
                                "position_reference": "well-bottom",
                            },
                            "flow_rate_by_volume": [(0, 478)],
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
                                "speed": 100,
                                "touch_tip": {"enabled": False},
                                "blowout": {"enabled": False},
                            },
                            "correction_by_volume": [(0, 0)],
                            "push_out_by_volume": [(0, 7)],
                            "mix": {"enabled": False},
                        },
                    }
                }
            },
        ),
    )
    pipette_left.drop_tip()

    # Step 7: mix
    pipette_right.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette_right.pick_up_tip(location=tip_rack_1)
    pipette_right.configure_for_volume(10)
    pipette_right.prepare_to_aspirate()
    pipette_right.mix(
        repetitions=2,
        volume=10,
        location=well_plate_1["A1"].bottom(z=0.5),
        aspirate_flow_rate=35,
        dispense_flow_rate=50,
        final_push_out=2,
    )
    pipette_right.drop_tip()

    # Step 8: move labware
    protocol.move_labware(well_plate_1, "B2", use_gripper=True)

    # Step 9: pause
    protocol.delay(seconds=60)

    # Step 10: move labware
    protocol.move_labware(well_plate_1, "C3", use_gripper=True)

    # Step 11: heater-shaker
    heater_shaker_module_1.close_labware_latch()
    heater_shaker_module_1.deactivate_heater()
    heater_shaker_module_1.set_and_wait_for_shake_speed(500)

    # Step 12: heater-shaker
    heater_shaker_module_1.deactivate_heater()
    heater_shaker_module_1.deactivate_shaker()
    heater_shaker_module_1.open_labware_latch()

    # Step 13: move labware
    protocol.move_labware(aluminum_block_1, protocol_api.OFF_DECK)

    # Step 14: temperature
    temperature_module_1.deactivate()

    # Step 15: move labware
    protocol.move_labware(well_plate_2, "C2")

    # Step 16: transfer
    pipette_left.consolidate_with_liquid_class(
        volume=5,
        source=[
            well_plate_2["A1"],
            well_plate_2["B1"],
            well_plate_2["C1"],
            well_plate_2["D1"],
            well_plate_2["E1"],
            well_plate_2["A2"],
            well_plate_2["B2"],
            well_plate_2["C2"],
            well_plate_2["D2"],
            well_plate_2["E2"],
            well_plate_2["A3"],
            well_plate_2["B3"],
            well_plate_2["C3"],
            well_plate_2["D3"],
            well_plate_2["E3"],
            well_plate_2["A4"],
            well_plate_2["B4"],
            well_plate_2["C4"],
            well_plate_2["D4"],
            well_plate_2["E4"],
            well_plate_2["A5"],
            well_plate_2["B5"],
            well_plate_2["C5"],
            well_plate_2["D5"],
            well_plate_2["E5"],
        ],
        dest=[well_plate_2["A3"]],
        new_tip="once",
        trash_location=trash_bin_1,
        keep_last_tip=True,
        tip_racks=[tip_rack_1],
        liquid_class=protocol.define_liquid_class(
            name="consolidate_step_16",
            properties={
                "flex_1channel_1000": {
                    "opentrons/opentrons_flex_96_filtertiprack_50ul/1": {
                        "aspirate": {
                            "aspirate_position": {
                                "offset": {"x": 0, "y": 0, "z": 1},
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
                                "speed": 100,
                                "touch_tip": {"enabled": False},
                            },
                        },
                        "dispense": {
                            "dispense_position": {
                                "offset": {"x": 0, "y": 0, "z": 1},
                                "position_reference": "well-bottom",
                            },
                            "flow_rate_by_volume": [(0, 478)],
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
                                "speed": 100,
                                "touch_tip": {"enabled": False},
                                "blowout": {"enabled": False},
                            },
                            "correction_by_volume": [(0, 0)],
                            "push_out_by_volume": [(0, 7)],
                            "mix": {"enabled": False},
                        },
                    }
                }
            },
        ),
    )
    pipette_left.drop_tip()


DESIGNER_APPLICATION = """{"robot":{"model":"OT-3 Standard"},"designerApplication":{"name":"opentrons/protocol-designer","version":"8.7.0","data":{"pipetteTiprackAssignments":{"2e7c6344-58ab-465c-b542-489883cb63fe":["opentrons/opentrons_flex_96_filtertiprack_50ul/1"],"6d1e53c3-2db3-451b-ad60-3fe13781a193":["opentrons/opentrons_flex_96_filtertiprack_50ul/1"]},"dismissedWarnings":{"form":["BELOW_PIPETTE_MINIMUM_VOLUME"],"timeline":["ASPIRATE_FROM_PRISTINE_WELL","ASPIRATE_MORE_THAN_WELL_CONTENTS"]},"ingredients":{"0":{"displayName":"Water","description":null,"displayColor":"#b925ff","liquidGroupId":"0","liquidClass":null},"1":{"displayName":"Samples","description":null,"displayColor":"#ffd600","liquidGroupId":"1","liquidClass":null}},"ingredLocations":{"fcba73e7-b88e-438e-963e-f8b9a5de0983:opentrons/nest_96_wellplate_100ul_pcr_full_skirt/5":{"A1":{"0":{"volume":100}},"B1":{"0":{"volume":100}},"C1":{"0":{"volume":100}},"D1":{"0":{"volume":100}},"E1":{"0":{"volume":100}},"F1":{"0":{"volume":100}},"G1":{"0":{"volume":100}},"H1":{"0":{"volume":100}}},"a793a135-06aa-4ed6-a1d3-c176c7810afa:opentrons/opentrons_24_aluminumblock_nest_1.5ml_snapcap/3":{"A1":{"1":{"volume":1000}}}},"savedStepForms":{"__INITIAL_DECK_SETUP_STEP__":{"labwareLocationUpdate":{"23ed35de-5bfd-4bb0-8f54-da99a2804ed9:opentrons/opentrons_flex_96_filtertiprack_50ul/1":"C1","fcba73e7-b88e-438e-963e-f8b9a5de0983:opentrons/nest_96_wellplate_100ul_pcr_full_skirt/5":"627b7a27-5bb7-46de-a530-67af45652e3b:thermocyclerModuleType","a793a135-06aa-4ed6-a1d3-c176c7810afa:opentrons/opentrons_24_aluminumblock_nest_1.5ml_snapcap/3":"ef44ad7f-0fd9-46d6-8bc0-c70785644cc8:temperatureModuleType","d95bb3be-b453-457c-a947-bd03dc8e56b9:opentrons/opentrons_96_flat_bottom_adapter/1":"c19dffa3-cb34-4702-bcf6-dcea786257d1:heaterShakerModuleType","239ceac8-23ec-4900-810a-70aeef880273:opentrons/nest_96_wellplate_200ul_flat/5":"d95bb3be-b453-457c-a947-bd03dc8e56b9:opentrons/opentrons_96_flat_bottom_adapter/1"},"moduleLocationUpdate":{"1be16305-74e7-4bdb-9737-61ec726d2b44:magneticBlockType":"D2","c19dffa3-cb34-4702-bcf6-dcea786257d1:heaterShakerModuleType":"D1","ef44ad7f-0fd9-46d6-8bc0-c70785644cc8:temperatureModuleType":"D3","627b7a27-5bb7-46de-a530-67af45652e3b:thermocyclerModuleType":"B1"},"pipetteLocationUpdate":{"2e7c6344-58ab-465c-b542-489883cb63fe":"left","6d1e53c3-2db3-451b-ad60-3fe13781a193":"right"},"trashBinLocationUpdate":{"d5c2faa5-d6e1-4762-85e5-07b47dd6e96e:trashBin":"cutoutA3"},"wasteChuteLocationUpdate":{},"stagingAreaLocationUpdate":{},"gripperLocationUpdate":{"20d44c68-d53e-43c9-b5c6-868c460b0d8d:gripper":"mounted"},"stepType":"manualIntervention","id":"__INITIAL_DECK_SETUP_STEP__"},"236ab92a-24e3-42d8-bad5-cd4cdae9a4c4":{"blockIsActive":false,"blockIsActiveHold":false,"blockTargetTemp":null,"blockTargetTempHold":null,"lidIsActive":false,"lidIsActiveHold":false,"lidOpen":false,"lidOpenHold":null,"lidTargetTemp":null,"lidTargetTempHold":null,"moduleId":"627b7a27-5bb7-46de-a530-67af45652e3b:thermocyclerModuleType","orderedProfileItems":["40e2cf7d-112f-4ded-9375-0e225cc776eb","f4aa883f-41e6-42fb-875f-d4adf02fd2c5"],"profileItemsById":{"40e2cf7d-112f-4ded-9375-0e225cc776eb":{"type":"profileStep","id":"40e2cf7d-112f-4ded-9375-0e225cc776eb","title":"tagmentation","temperature":"4","durationMinutes":"1","durationSeconds":""},"f4aa883f-41e6-42fb-875f-d4adf02fd2c5":{"type":"profileStep","id":"f4aa883f-41e6-42fb-875f-d4adf02fd2c5","title":"hold","temperature":"10","durationMinutes":"2","durationSeconds":""}},"profileTargetLidTemp":"40","profileVolume":"10","thermocyclerFormType":"thermocyclerProfile","id":"236ab92a-24e3-42d8-bad5-cd4cdae9a4c4","stepType":"thermocycler","stepName":"thermocycler","stepDetails":""},"2d5ee9a5-c405-4dbc-a57e-2603d709c03d":{"blockIsActive":false,"blockIsActiveHold":false,"blockTargetTemp":null,"blockTargetTempHold":null,"lidIsActive":false,"lidIsActiveHold":false,"lidOpen":true,"lidOpenHold":null,"lidTargetTemp":null,"lidTargetTempHold":null,"moduleId":"627b7a27-5bb7-46de-a530-67af45652e3b:thermocyclerModuleType","orderedProfileItems":[],"profileItemsById":{},"profileTargetLidTemp":null,"profileVolume":null,"thermocyclerFormType":"thermocyclerState","id":"2d5ee9a5-c405-4dbc-a57e-2603d709c03d","stepType":"thermocycler","stepName":"thermocycler","stepDetails":""},"f9a294f1-f42b-4cae-893a-592405349d56":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"0","aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":478,"aspirate_labware":"a793a135-06aa-4ed6-a1d3-c176c7810afa:opentrons/opentrons_24_aluminumblock_nest_1.5ml_snapcap/3","aspirate_mix_checkbox":false,"aspirate_mix_times":null,"aspirate_mix_volume":null,"aspirate_mmFromBottom":1,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":100,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":100,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":300,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":478,"blowout_location":"d5c2faa5-d6e1-4762-85e5-07b47dd6e96e:trashBin","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":"50","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":478,"dispense_labware":"fcba73e7-b88e-438e-963e-f8b9a5de0983:opentrons/nest_96_wellplate_100ul_pcr_full_skirt/5","dispense_mix_checkbox":false,"dispense_mix_times":null,"dispense_mix_volume":null,"dispense_mmFromBottom":1,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":100,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":100,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":300,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1","B1","C1","D1","E1","F1","G1","H1"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":true,"disposalVolume_volume":"100","dropTip_location":"d5c2faa5-d6e1-4762-85e5-07b47dd6e96e:trashBin","liquidClassesSupported":false,"liquidClass":"none","nozzles":"SINGLE","path":"single","pipette":"2e7c6344-58ab-465c-b542-489883cb63fe","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":7,"tipRack":"opentrons/opentrons_flex_96_filtertiprack_50ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"100","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","id":"f9a294f1-f42b-4cae-893a-592405349d56","dispense_touchTip_mmfromTop":null},"5fdb9a12-fab4-42fd-886f-40af107b15d6":{"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":35,"blowout_checkbox":false,"blowout_flowRate":55,"blowout_location":"d5c2faa5-d6e1-4762-85e5-07b47dd6e96e:trashBin","blowout_z_offset":0,"changeTip":"always","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":50,"dropTip_location":"d5c2faa5-d6e1-4762-85e5-07b47dd6e96e:trashBin","labware":"fcba73e7-b88e-438e-963e-f8b9a5de0983:opentrons/nest_96_wellplate_100ul_pcr_full_skirt/5","liquidClassesSupported":false,"liquidClass":"none","mix_mmFromBottom":0.5,"mix_touchTip_checkbox":false,"mix_touchTip_mmFromTop":null,"mix_wellOrder_first":"t2b","mix_wellOrder_second":"l2r","mix_position_reference":"well-bottom","mix_x_position":0,"mix_y_position":0,"nozzles":"ALL","pipette":"6d1e53c3-2db3-451b-ad60-3fe13781a193","pushOut_checkbox":true,"pushOut_volume":2,"times":"2","tipRack":"opentrons/opentrons_flex_96_filtertiprack_50ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"10","wells":["A1"],"stepType":"mix","stepName":"mix","stepDetails":"","id":"5fdb9a12-fab4-42fd-886f-40af107b15d6"},"3901f6f9-cecd-4d2a-8d85-40d85f9f8b4f":{"labware":"fcba73e7-b88e-438e-963e-f8b9a5de0983:opentrons/nest_96_wellplate_100ul_pcr_full_skirt/5","newLocation":"B2","useGripper":true,"id":"3901f6f9-cecd-4d2a-8d85-40d85f9f8b4f","stepType":"moveLabware","stepName":"move labware","stepDetails":""},"e3989707-210d-457f-a9bb-a85b3ef9b59c":{"moduleId":"c19dffa3-cb34-4702-bcf6-dcea786257d1:heaterShakerModuleType","pauseAction":"untilTime","pauseMessage":"","pauseTemperature":null,"pauseTime":"00:01:00","id":"e3989707-210d-457f-a9bb-a85b3ef9b59c","stepType":"pause","stepName":"pause","stepDetails":""},"4196ef26-eb2a-4642-83f4-cb5c1f6bdea0":{"labware":"fcba73e7-b88e-438e-963e-f8b9a5de0983:opentrons/nest_96_wellplate_100ul_pcr_full_skirt/5","newLocation":"C3","useGripper":true,"id":"4196ef26-eb2a-4642-83f4-cb5c1f6bdea0","stepType":"moveLabware","stepName":"move labware","stepDetails":""},"558d7d58-3280-4373-8e79-26c4242a0c91":{"heaterShakerSetTimer":null,"heaterShakerTimer":null,"latchOpen":false,"moduleId":"c19dffa3-cb34-4702-bcf6-dcea786257d1:heaterShakerModuleType","setHeaterShakerTemperature":null,"setShake":true,"targetHeaterShakerTemperature":null,"targetSpeed":"500","id":"558d7d58-3280-4373-8e79-26c4242a0c91","stepType":"heaterShaker","stepName":"heater-shaker","stepDetails":""},"c83b4aaa-1baf-448e-9d76-3c6325874b0f":{"heaterShakerSetTimer":null,"heaterShakerTimer":null,"latchOpen":true,"moduleId":"c19dffa3-cb34-4702-bcf6-dcea786257d1:heaterShakerModuleType","setHeaterShakerTemperature":null,"setShake":null,"targetHeaterShakerTemperature":null,"targetSpeed":null,"id":"c83b4aaa-1baf-448e-9d76-3c6325874b0f","stepType":"heaterShaker","stepName":"heater-shaker","stepDetails":""},"7747287c-abea-4855-843e-d61b272124b2":{"labware":"a793a135-06aa-4ed6-a1d3-c176c7810afa:opentrons/opentrons_24_aluminumblock_nest_1.5ml_snapcap/3","newLocation":"offDeck","useGripper":false,"id":"7747287c-abea-4855-843e-d61b272124b2","stepType":"moveLabware","stepName":"move labware","stepDetails":""},"d6db5e5d-98cf-4f19-abbb-2f1406a389c7":{"moduleId":"ef44ad7f-0fd9-46d6-8bc0-c70785644cc8:temperatureModuleType","setTemperature":"true","targetTemperature":"4","id":"d6db5e5d-98cf-4f19-abbb-2f1406a389c7","stepType":"temperature","stepName":"temperature","stepDetails":""},"8b105da1-63d9-49f1-b370-5c74e01aa188":{"moduleId":"c19dffa3-cb34-4702-bcf6-dcea786257d1:heaterShakerModuleType","pauseAction":"untilTemperature","pauseMessage":"","pauseTemperature":"4","pauseTime":null,"id":"8b105da1-63d9-49f1-b370-5c74e01aa188","stepType":"pause","stepName":"pause","stepDetails":""},"dcc6a6c7-2db8-417b-a1aa-3927abccfadd":{"moduleId":"ef44ad7f-0fd9-46d6-8bc0-c70785644cc8:temperatureModuleType","setTemperature":"false","targetTemperature":null,"id":"dcc6a6c7-2db8-417b-a1aa-3927abccfadd","stepType":"temperature","stepName":"temperature","stepDetails":""},"2f862881-7ce3-4d20-b0ef-53c8244f6ef3":{"labware":"239ceac8-23ec-4900-810a-70aeef880273:opentrons/nest_96_wellplate_200ul_flat/5","newLocation":"C2","useGripper":false,"id":"2f862881-7ce3-4d20-b0ef-53c8244f6ef3","stepType":"moveLabware","stepName":"move labware","stepDetails":""},"a47ddb5f-5469-461c-ad7f-6307c5fe0a69":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"0","aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":478,"aspirate_labware":"239ceac8-23ec-4900-810a-70aeef880273:opentrons/nest_96_wellplate_200ul_flat/5","aspirate_mix_checkbox":false,"aspirate_mix_times":null,"aspirate_mix_volume":null,"aspirate_mmFromBottom":1,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":100,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":100,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":300,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1","B1","C1","D1","E1","A2","B2","C2","D2","E2","A3","B3","C3","D3","E3","A4","B4","C4","D4","E4","A5","B5","C5","D5","E5"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":478,"blowout_location":"d5c2faa5-d6e1-4762-85e5-07b47dd6e96e:trashBin","changeTip":"once","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":"50","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":478,"dispense_labware":"239ceac8-23ec-4900-810a-70aeef880273:opentrons/nest_96_wellplate_200ul_flat/5","dispense_mix_checkbox":false,"dispense_mix_times":null,"dispense_mix_volume":null,"dispense_mmFromBottom":1,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":100,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":100,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":300,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A3"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":true,"disposalVolume_volume":"100","dropTip_location":"d5c2faa5-d6e1-4762-85e5-07b47dd6e96e:trashBin","liquidClassesSupported":false,"liquidClass":"none","nozzles":"SINGLE","path":"multiAspirate","pipette":"2e7c6344-58ab-465c-b542-489883cb63fe","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":7,"tipRack":"opentrons/opentrons_flex_96_filtertiprack_50ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"5","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","id":"a47ddb5f-5469-461c-ad7f-6307c5fe0a69","dispense_touchTip_mmfromTop":null},"eb7e45cb-aa84-4321-a7a5-799d9474ddda":{"heaterShakerSetTimer":null,"heaterShakerTimer":null,"latchOpen":false,"moduleId":"c19dffa3-cb34-4702-bcf6-dcea786257d1:heaterShakerModuleType","setHeaterShakerTemperature":true,"setShake":null,"targetHeaterShakerTemperature":"40","targetSpeed":null,"id":"eb7e45cb-aa84-4321-a7a5-799d9474ddda","stepType":"heaterShaker","stepName":"heater-shaker","stepDetails":""}},"orderedStepIds":["d6db5e5d-98cf-4f19-abbb-2f1406a389c7","eb7e45cb-aa84-4321-a7a5-799d9474ddda","8b105da1-63d9-49f1-b370-5c74e01aa188","236ab92a-24e3-42d8-bad5-cd4cdae9a4c4","2d5ee9a5-c405-4dbc-a57e-2603d709c03d","f9a294f1-f42b-4cae-893a-592405349d56","5fdb9a12-fab4-42fd-886f-40af107b15d6","3901f6f9-cecd-4d2a-8d85-40d85f9f8b4f","e3989707-210d-457f-a9bb-a85b3ef9b59c","4196ef26-eb2a-4642-83f4-cb5c1f6bdea0","558d7d58-3280-4373-8e79-26c4242a0c91","c83b4aaa-1baf-448e-9d76-3c6325874b0f","7747287c-abea-4855-843e-d61b272124b2","dcc6a6c7-2db8-417b-a1aa-3927abccfadd","2f862881-7ce3-4d20-b0ef-53c8244f6ef3","a47ddb5f-5469-461c-ad7f-6307c5fe0a69"],"pipettes":{"2e7c6344-58ab-465c-b542-489883cb63fe":{"pipetteName":"p1000_single_flex"},"6d1e53c3-2db3-451b-ad60-3fe13781a193":{"pipetteName":"p50_multi_flex"}},"modules":{"1be16305-74e7-4bdb-9737-61ec726d2b44:magneticBlockType":{"model":"magneticBlockV1"},"c19dffa3-cb34-4702-bcf6-dcea786257d1:heaterShakerModuleType":{"model":"heaterShakerModuleV1"},"ef44ad7f-0fd9-46d6-8bc0-c70785644cc8:temperatureModuleType":{"model":"temperatureModuleV2"},"627b7a27-5bb7-46de-a530-67af45652e3b:thermocyclerModuleType":{"model":"thermocyclerModuleV2"}},"labware":{"d95bb3be-b453-457c-a947-bd03dc8e56b9:opentrons/opentrons_96_flat_bottom_adapter/1":{"displayName":"Opentrons 96 Flat Bottom Heater-Shaker Adapter","labwareDefURI":"opentrons/opentrons_96_flat_bottom_adapter/1"},"23ed35de-5bfd-4bb0-8f54-da99a2804ed9:opentrons/opentrons_flex_96_filtertiprack_50ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 50 µL","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_50ul/1"},"fcba73e7-b88e-438e-963e-f8b9a5de0983:opentrons/nest_96_wellplate_100ul_pcr_full_skirt/5":{"displayName":"NEST 96 Well Plate 100 µL PCR Full Skirt","labwareDefURI":"opentrons/nest_96_wellplate_100ul_pcr_full_skirt/5"},"a793a135-06aa-4ed6-a1d3-c176c7810afa:opentrons/opentrons_24_aluminumblock_nest_1.5ml_snapcap/3":{"displayName":"Opentrons 24 Well Aluminum Block with NEST 1.5 mL Snapcap","labwareDefURI":"opentrons/opentrons_24_aluminumblock_nest_1.5ml_snapcap/3"},"239ceac8-23ec-4900-810a-70aeef880273:opentrons/nest_96_wellplate_200ul_flat/5":{"displayName":"NEST 96 Well Plate 200 µL Flat","labwareDefURI":"opentrons/nest_96_wellplate_200ul_flat/5"}}}},"metadata":{"protocolName":"Flex protocol do it all","author":"","description":"","created":1689346890165,"lastModified":1769453617129,"source":"Protocol Designer","category":null,"subcategory":null,"tags":[]}}"""
