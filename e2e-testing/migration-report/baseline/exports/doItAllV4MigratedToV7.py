from opentrons import protocol_api

metadata = {
    "protocolName": "Do it all v4",
    "author": "Fixture",
    "description": "Test all v4 commands",
    "created": "2020-04-03T16:20:33.548Z",
    "internalAppBuildDate": "Tue, 16 Dec 2025 16:02:03 GMT",
    "lastModified": "2026-01-26T18:53:28.030Z",
    "protocolDesigner": "8.7.1",
    "source": "Protocol Designer",
}

requirements = {"robotType": "OT-2", "apiLevel": "2.27"}


def run(protocol: protocol_api.ProtocolContext) -> None:
    # Load Modules:
    magnetic_module_1 = protocol.load_module("magneticModuleV2", "1")
    temperature_module_1 = protocol.load_module("temperatureModuleV2", "3")

    # Load Labware:
    tip_rack_1 = protocol.load_labware(
        "opentrons_96_tiprack_300ul",
        location="2",
        label="Opentrons 96 Tip Rack 300 µL",
        namespace="opentrons",
        version=1,
    )
    well_plate_1 = magnetic_module_1.load_labware(
        "nest_96_wellplate_100ul_pcr_full_skirt",
        namespace="opentrons",
        version=5,
    )
    aluminum_block_1 = temperature_module_1.load_labware(
        "opentrons_24_aluminumblock_generic_2ml_screwcap",
        namespace="opentrons",
        version=3,
    )

    # Load Pipettes:
    pipette_left = protocol.load_instrument("p300_single_gen2", "left")

    # Define Liquids:
    liquid_1 = protocol.define_liquid(
        "Water",
        display_color="#b925ff",
    )

    # Load Liquids:
    well_plate_1.load_liquid(
        wells=["A1", "B1", "C1", "D1", "E1", "F1", "G1", "H1", "A2", "B2", "C2", "D2", "E2", "F2", "G2", "H2"],
        liquid=liquid_1,
        volume=100,
    )

    # PROTOCOL STEPS

    # Step 1: magnet
    magnetic_module_1.engage(height_from_base=6)

    # Step 2: temperature
    temperature_module_1.start_set_temperature(25)

    # Step 3: pause
    protocol.delay(seconds=62)

    # Step 4: transfer
    pipette_left.transfer_with_liquid_class(
        volume=30,
        source=[well_plate_1["A1"], well_plate_1["B1"]],
        dest=[aluminum_block_1["A1"], aluminum_block_1["A1"]],
        new_tip="always",
        trash_location=protocol.fixed_trash,
        keep_last_tip=True,
        tip_racks=[tip_rack_1],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_4",
            properties={
                "p300_single_gen2": {
                    "opentrons/opentrons_96_tiprack_300ul/1": {
                        "aspirate": {
                            "aspirate_position": {
                                "offset": {"x": 0, "y": 0, "z": 1},
                                "position_reference": "well-bottom",
                            },
                            "flow_rate_by_volume": [(0, 46.43)],
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
                                "offset": {"x": 0, "y": 0, "z": 0.5},
                                "position_reference": "well-bottom",
                            },
                            "flow_rate_by_volume": [(0, 46.43)],
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
    pipette_left.drop_tip()

    # Step 5: pause
    temperature_module_1.await_temperature(25)

    # Step 6: magnet
    magnetic_module_1.disengage()

    # Step 7: pause
    protocol.pause("Wait until user intervention")

    # Step 8: temperature
    temperature_module_1.deactivate()


DESIGNER_APPLICATION = """{"robot":{"model":"OT-2 Standard"},"designerApplication":{"name":"opentrons/protocol-designer","version":"8.7.0","data":{"pipetteTiprackAssignments":{"0b3f2210-75c7-11ea-b42f-4b64e50f43e5":["opentrons/opentrons_96_tiprack_300ul/1"]},"dismissedWarnings":{"form":[],"timeline":[]},"ingredients":{"0":{"displayName":"Water","description":null,"liquidGroupId":"0","displayColor":"#b925ff","liquidClass":null}},"ingredLocations":{"1e610d40-75c7-11ea-b42f-4b64e50f43e5:opentrons/nest_96_wellplate_100ul_pcr_full_skirt/5":{"A1":{"0":{"volume":100}},"B1":{"0":{"volume":100}},"C1":{"0":{"volume":100}},"D1":{"0":{"volume":100}},"E1":{"0":{"volume":100}},"F1":{"0":{"volume":100}},"G1":{"0":{"volume":100}},"H1":{"0":{"volume":100}},"A2":{"0":{"volume":100}},"B2":{"0":{"volume":100}},"C2":{"0":{"volume":100}},"D2":{"0":{"volume":100}},"E2":{"0":{"volume":100}},"F2":{"0":{"volume":100}},"G2":{"0":{"volume":100}},"H2":{"0":{"volume":100}}}},"savedStepForms":{"__INITIAL_DECK_SETUP_STEP__":{"labwareLocationUpdate":{"0b44c760-75c7-11ea-b42f-4b64e50f43e5:opentrons/opentrons_96_tiprack_300ul/1":"2","1e610d40-75c7-11ea-b42f-4b64e50f43e5:opentrons/nest_96_wellplate_100ul_pcr_full_skirt/5":"0b419310-75c7-11ea-b42f-4b64e50f43e5:magneticModuleType","21ed8f60-75c7-11ea-b42f-4b64e50f43e5:opentrons/opentrons_24_aluminumblock_generic_2ml_screwcap/3":"0b4319b0-75c7-11ea-b42f-4b64e50f43e5:temperatureModuleType"},"pipetteLocationUpdate":{"0b3f2210-75c7-11ea-b42f-4b64e50f43e5":"left"},"moduleLocationUpdate":{"0b419310-75c7-11ea-b42f-4b64e50f43e5:magneticModuleType":"1","0b4319b0-75c7-11ea-b42f-4b64e50f43e5:temperatureModuleType":"3"},"stepType":"manualIntervention","id":"__INITIAL_DECK_SETUP_STEP__","stagingAreaLocationUpdate":{},"gripperLocationUpdate":{},"wasteChuteLocationUpdate":{},"trashBinLocationUpdate":{"8a641f95-773f-4cc9-852d-e7d498b1586d:trashBin":"cutout12"}},"2e48b500-75c7-11ea-b42f-4b64e50f43e5":{"engageHeight":"6","magnetAction":"engage","moduleId":"0b419310-75c7-11ea-b42f-4b64e50f43e5:magneticModuleType","id":"2e48b500-75c7-11ea-b42f-4b64e50f43e5","stepType":"magnet","stepName":"magnet","stepDetails":""},"3153f930-75c7-11ea-b42f-4b64e50f43e5":{"moduleId":"0b4319b0-75c7-11ea-b42f-4b64e50f43e5:temperatureModuleType","setTemperature":"true","targetTemperature":"25","id":"3153f930-75c7-11ea-b42f-4b64e50f43e5","stepType":"temperature","stepName":"temperature","stepDetails":""},"364a4480-75c7-11ea-b42f-4b64e50f43e5":{"moduleId":"0b4319b0-75c7-11ea-b42f-4b64e50f43e5:temperatureModuleType","pauseAction":"untilTemperature","pauseMessage":"","pauseTemperature":"25","pauseTime":null,"id":"364a4480-75c7-11ea-b42f-4b64e50f43e5","stepType":"pause","stepName":"pause","stepDetails":""},"3961e4c0-75c7-11ea-b42f-4b64e50f43e5":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":null,"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":46.43,"aspirate_labware":"1e610d40-75c7-11ea-b42f-4b64e50f43e5:opentrons/nest_96_wellplate_100ul_pcr_full_skirt/5","aspirate_mix_checkbox":false,"aspirate_mix_times":null,"aspirate_mix_volume":null,"aspirate_mmFromBottom":1,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":125,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":125,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":400,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1","B1"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":46.43,"blowout_location":"8a641f95-773f-4cc9-852d-e7d498b1586d:trashBin","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":null,"dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":46.43,"dispense_labware":"21ed8f60-75c7-11ea-b42f-4b64e50f43e5:opentrons/opentrons_24_aluminumblock_generic_2ml_screwcap/3","dispense_mix_checkbox":false,"dispense_mix_times":null,"dispense_mix_volume":null,"dispense_mmFromBottom":0.5,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":125,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":125,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":400,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":true,"disposalVolume_volume":"20","dropTip_location":"8a641f95-773f-4cc9-852d-e7d498b1586d:trashBin","liquidClassesSupported":false,"liquidClass":"none","nozzles":"SINGLE","path":"single","pipette":"0b3f2210-75c7-11ea-b42f-4b64e50f43e5","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":0,"tipRack":"opentrons/opentrons_96_tiprack_300ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"30","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","id":"3961e4c0-75c7-11ea-b42f-4b64e50f43e5","dispense_touchTip_mmfromTop":null},"4f4057e0-75c7-11ea-b42f-4b64e50f43e5":{"engageHeight":"6","magnetAction":"disengage","moduleId":"0b419310-75c7-11ea-b42f-4b64e50f43e5:magneticModuleType","id":"4f4057e0-75c7-11ea-b42f-4b64e50f43e5","stepType":"magnet","stepName":"magnet","stepDetails":""},"54dc3200-75c7-11ea-b42f-4b64e50f43e5":{"moduleId":"0b4319b0-75c7-11ea-b42f-4b64e50f43e5:temperatureModuleType","pauseAction":"untilResume","pauseMessage":"Wait until user intervention","pauseTemperature":null,"pauseTime":null,"id":"54dc3200-75c7-11ea-b42f-4b64e50f43e5","stepType":"pause","stepName":"pause","stepDetails":""},"5db07ad0-75c7-11ea-b42f-4b64e50f43e5":{"moduleId":"0b4319b0-75c7-11ea-b42f-4b64e50f43e5:temperatureModuleType","pauseAction":"untilTime","pauseMessage":"","pauseTemperature":null,"pauseTime":"00:01:02","id":"5db07ad0-75c7-11ea-b42f-4b64e50f43e5","stepType":"pause","stepName":"pause","stepDetails":""},"80c00130-75c7-11ea-b42f-4b64e50f43e5":{"moduleId":"0b4319b0-75c7-11ea-b42f-4b64e50f43e5:temperatureModuleType","setTemperature":"false","targetTemperature":null,"id":"80c00130-75c7-11ea-b42f-4b64e50f43e5","stepType":"temperature","stepName":"temperature","stepDetails":""}},"orderedStepIds":["2e48b500-75c7-11ea-b42f-4b64e50f43e5","3153f930-75c7-11ea-b42f-4b64e50f43e5","5db07ad0-75c7-11ea-b42f-4b64e50f43e5","3961e4c0-75c7-11ea-b42f-4b64e50f43e5","364a4480-75c7-11ea-b42f-4b64e50f43e5","4f4057e0-75c7-11ea-b42f-4b64e50f43e5","54dc3200-75c7-11ea-b42f-4b64e50f43e5","80c00130-75c7-11ea-b42f-4b64e50f43e5"],"pipettes":{"0b3f2210-75c7-11ea-b42f-4b64e50f43e5":{"pipetteName":"p300_single_gen2"}},"modules":{"0b419310-75c7-11ea-b42f-4b64e50f43e5:magneticModuleType":{"model":"magneticModuleV2"},"0b4319b0-75c7-11ea-b42f-4b64e50f43e5:temperatureModuleType":{"model":"temperatureModuleV2"}},"labware":{"0b44c760-75c7-11ea-b42f-4b64e50f43e5:opentrons/opentrons_96_tiprack_300ul/1":{"displayName":"Opentrons 96 Tip Rack 300 µL","labwareDefURI":"opentrons/opentrons_96_tiprack_300ul/1"},"1e610d40-75c7-11ea-b42f-4b64e50f43e5:opentrons/nest_96_wellplate_100ul_pcr_full_skirt/5":{"displayName":"NEST 96 Well Plate 100 µL PCR Full Skirt","labwareDefURI":"opentrons/nest_96_wellplate_100ul_pcr_full_skirt/5"},"21ed8f60-75c7-11ea-b42f-4b64e50f43e5:opentrons/opentrons_24_aluminumblock_generic_2ml_screwcap/3":{"displayName":"Opentrons 24 Well Aluminum Block with Generic 2 mL Screwcap","labwareDefURI":"opentrons/opentrons_24_aluminumblock_generic_2ml_screwcap/3"}}}},"metadata":{"protocolName":"Do it all v4","author":"Fixture","description":"Test all v4 commands","created":1585930833548,"lastModified":1769453608030,"category":null,"subcategory":null,"tags":[],"source":"Protocol Designer"}}"""
