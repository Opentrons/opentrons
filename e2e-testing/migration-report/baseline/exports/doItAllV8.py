import json
from opentrons import protocol_api, types

metadata = {
    "protocolName": "doItAllV8",
    "created": "2023-12-04T03:05:07.408Z",
    "internalAppBuildDate": "Tue, 16 Dec 2025 16:02:03 GMT",
    "lastModified": "2026-01-26T19:58:29.283Z",
    "protocolDesigner": "8.7.1",
    "source": "Protocol Designer",
}

requirements = {"robotType": "Flex", "apiLevel": "2.27"}

def run(protocol: protocol_api.ProtocolContext) -> None:
    # Load Modules:
    heater_shaker_module_1 = protocol.load_module("heaterShakerModuleV1", "D1")
    thermocycler_module_1 = protocol.load_module("thermocyclerModuleV2", "B1")

    # Load Adapters:
    adapter_1 = heater_shaker_module_1.load_adapter(
        "opentrons_96_pcr_adapter",
        namespace="opentrons",
        version=1,
    )

    # Load Labware:
    tip_rack_1 = protocol.load_labware(
        "opentrons_flex_96_tiprack_1000ul",
        location="C2",
        namespace="opentrons",
        version=1,
    )
    well_plate_1 = thermocycler_module_1.load_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt",
        namespace="opentrons",
        version=4,
    )
    reservoir_1 = protocol.load_labware(
        "axygen_1_reservoir_90ml",
        location="A4",
        namespace="opentrons",
        version=3,
    )

    # Load Pipettes:
    pipette_left = protocol.load_instrument("flex_1channel_1000", "left")

    # Load Waste Chute:
    waste_chute = protocol.load_waste_chute()

    # Define Liquids:
    liquid_1 = protocol.define_liquid(
        "h20",
        display_color="#b925ff",
    )
    liquid_2 = protocol.define_liquid(
        "sample",
        display_color="#ffd600",
    )

    # Load Liquids:
    reservoir_1.load_liquid(
        wells=["A1"],
        liquid=liquid_1,
        volume=10000,
    )
    well_plate_1.load_liquid(
        wells=[
            "A1", "B1", "C1", "D1", "E1", "F1", "G1", "H1"
        ],
        liquid=liquid_2,
        volume=100,
    )

    # PROTOCOL STEPS

    # Step 1: thermocycler
    thermocycler_module_1.open_lid()

    # Step 2: move labware
    protocol.move_labware(reservoir_1, "C1", use_gripper=True)

    # Step 3: transfer
    pipette_left.transfer_with_liquid_class(
        volume=100,
        source=[reservoir_1["A1"], reservoir_1["A1"], reservoir_1["A1"], reservoir_1["A1"], reservoir_1["A1"], reservoir_1["A1"], reservoir_1["A1"], reservoir_1["A1"]],
        dest=[well_plate_1["A1"], well_plate_1["B1"], well_plate_1["C1"], well_plate_1["D1"], well_plate_1["E1"], well_plate_1["F1"], well_plate_1["G1"], well_plate_1["H1"]],
        new_tip="always",
        trash_location=waste_chute,
        keep_last_tip=True,
        tip_racks=[tip_rack_1],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_3",
            properties={"flex_1channel_1000": {"opentrons/opentrons_flex_96_tiprack_1000ul/1": {
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
                        "speed": 100,
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
                        "speed": 100,
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

    # Step 4: thermocycler
    thermocycler_module_1.close_lid()
    thermocycler_module_1.set_block_temperature(40)

    # Step 5: pause
    protocol.delay(seconds=60)

    # Step 6: thermocycler
    thermocycler_module_1.open_lid()
    thermocycler_module_1.deactivate_block()

    # Step 7: heater-shaker
    heater_shaker_module_1.deactivate_heater()
    heater_shaker_module_1.open_labware_latch()

    # Step 8: move labware
    protocol.move_labware(well_plate_1, adapter_1, use_gripper=True)

    # Step 9: heater-shaker
    heater_shaker_module_1.close_labware_latch()
    heater_shaker_module_1.deactivate_heater()
    heater_shaker_module_1.set_and_wait_for_shake_speed(200)
    protocol.delay(seconds=60)
    heater_shaker_module_1.deactivate_shaker()
    heater_shaker_module_1.deactivate_heater()

    # Step 10: heater-shaker
    heater_shaker_module_1.deactivate_heater()
    heater_shaker_module_1.open_labware_latch()

    # Step 11: move labware
    protocol.move_labware(well_plate_1, "B4", use_gripper=True)

    # Step 12: move labware
    protocol.move_labware(tip_rack_1, waste_chute, use_gripper=True)

DESIGNER_APPLICATION = """{"robot":{"model":"OT-3 Standard"},"designerApplication":{"name":"opentrons/protocol-designer","version":"8.7.0","data":{"pipetteTiprackAssignments":{"9fcd50d9-92b2-45ac-acf1-e2cf773feffc":["opentrons/opentrons_flex_96_tiprack_1000ul/1"]},"dismissedWarnings":{"form":[],"timeline":[]},"ingredients":{"0":{"displayName":"h20","description":null,"displayColor":"#b925ff","liquidGroupId":"0","liquidClass":null},"1":{"displayName":"sample","description":null,"displayColor":"#ffd600","liquidGroupId":"1","liquidClass":null}},"ingredLocations":{"8bacda22-9e05-45e8-bef4-cc04414a204f:opentrons/axygen_1_reservoir_90ml/3":{"A1":{"0":{"volume":10000}}},"54370838-4fca-4a14-b88a-7840e4903649:opentrons/opentrons_96_wellplate_200ul_pcr_full_skirt/4":{"A1":{"1":{"volume":100}},"B1":{"1":{"volume":100}},"C1":{"1":{"volume":100}},"D1":{"1":{"volume":100}},"E1":{"1":{"volume":100}},"F1":{"1":{"volume":100}},"G1":{"1":{"volume":100}},"H1":{"1":{"volume":100}}}},"savedStepForms":{"__INITIAL_DECK_SETUP_STEP__":{"labwareLocationUpdate":{"f2d371ea-5146-4c89-8200-9c056a7f321a:opentrons/opentrons_flex_96_tiprack_1000ul/1":"C2","54370838-4fca-4a14-b88a-7840e4903649:opentrons/opentrons_96_wellplate_200ul_pcr_full_skirt/4":"fd6da9f1-d63b-414b-929e-c646b64790e9:thermocyclerModuleType","7c4d59fa-0e50-442f-adce-9e4b0c7f0b88:opentrons/opentrons_96_pcr_adapter/1":"23347241-80bb-4a7e-9c91-5d9727a9e483:heaterShakerModuleType","8bacda22-9e05-45e8-bef4-cc04414a204f:opentrons/axygen_1_reservoir_90ml/3":"A4"},"moduleLocationUpdate":{"23347241-80bb-4a7e-9c91-5d9727a9e483:heaterShakerModuleType":"D1","fd6da9f1-d63b-414b-929e-c646b64790e9:thermocyclerModuleType":"B1"},"pipetteLocationUpdate":{"9fcd50d9-92b2-45ac-acf1-e2cf773feffc":"left"},"trashBinLocationUpdate":{},"wasteChuteLocationUpdate":{"9d61f642-8f9b-467d-b2f7-b67fb162fd26:wasteChute":"cutoutD3"},"stagingAreaLocationUpdate":{"f2213242-0dd4-416c-9994-38432d85e5e2:stagingArea":"cutoutB3","db5516ce-eb6a-47b7-8d5e-d983836679ef:stagingArea":"cutoutA3"},"gripperLocationUpdate":{"13816147-787e-46f1-b950-a925eddfd65f:gripper":"mounted"},"stepType":"manualIntervention","id":"__INITIAL_DECK_SETUP_STEP__"},"dcec0c89-338b-453b-a79b-c081830ff138":{"blockIsActive":false,"blockIsActiveHold":false,"blockTargetTemp":null,"blockTargetTempHold":null,"lidIsActive":false,"lidIsActiveHold":false,"lidOpen":true,"lidOpenHold":null,"lidTargetTemp":null,"lidTargetTempHold":null,"moduleId":"fd6da9f1-d63b-414b-929e-c646b64790e9:thermocyclerModuleType","orderedProfileItems":[],"profileItemsById":{},"profileTargetLidTemp":null,"profileVolume":null,"thermocyclerFormType":"thermocyclerState","id":"dcec0c89-338b-453b-a79b-c081830ff138","stepType":"thermocycler","stepName":"thermocycler","stepDetails":""},"e6904828-c44c-4c25-8144-1b7921b5f8dc":{"labware":"8bacda22-9e05-45e8-bef4-cc04414a204f:opentrons/axygen_1_reservoir_90ml/3","newLocation":"C1","useGripper":true,"id":"e6904828-c44c-4c25-8144-1b7921b5f8dc","stepType":"moveLabware","stepName":"move labware","stepDetails":""},"d2f74144-a7bf-4ba2-aaab-30d70b2b62c7":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"5","aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":null,"aspirate_labware":"8bacda22-9e05-45e8-bef4-cc04414a204f:opentrons/axygen_1_reservoir_90ml/3","aspirate_mix_checkbox":false,"aspirate_mix_times":null,"aspirate_mix_volume":null,"aspirate_mmFromBottom":null,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":null,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":100,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":null,"aspirate_submerge_speed":100,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":300,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":716,"blowout_location":null,"changeTip":"always","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":"5","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":null,"dispense_labware":"54370838-4fca-4a14-b88a-7840e4903649:opentrons/opentrons_96_wellplate_200ul_pcr_full_skirt/4","dispense_mix_checkbox":false,"dispense_mix_times":null,"dispense_mix_volume":null,"dispense_mmFromBottom":null,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":null,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":100,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":null,"dispense_submerge_speed":100,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":300,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1","B1","C1","D1","E1","F1","G1","H1"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":true,"disposalVolume_volume":"5","dropTip_location":"9d61f642-8f9b-467d-b2f7-b67fb162fd26:wasteChute","liquidClassesSupported":false,"liquidClass":"none","nozzles":"SINGLE","path":"single","pipette":"9fcd50d9-92b2-45ac-acf1-e2cf773feffc","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":20,"tipRack":"opentrons/opentrons_flex_96_tiprack_1000ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"100","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","dispense_touchTip_mmfromTop":null,"id":"d2f74144-a7bf-4ba2-aaab-30d70b2b62c7"},"240a2c96-3db8-4679-bdac-049306b7b9c4":{"blockIsActive":true,"blockIsActiveHold":false,"blockTargetTemp":"40","blockTargetTempHold":null,"lidIsActive":false,"lidIsActiveHold":false,"lidOpen":false,"lidOpenHold":null,"lidTargetTemp":null,"lidTargetTempHold":null,"moduleId":"fd6da9f1-d63b-414b-929e-c646b64790e9:thermocyclerModuleType","orderedProfileItems":[],"profileItemsById":{},"profileTargetLidTemp":null,"profileVolume":null,"thermocyclerFormType":"thermocyclerState","id":"240a2c96-3db8-4679-bdac-049306b7b9c4","stepType":"thermocycler","stepName":"thermocycler","stepDetails":""},"bfa5b548-f9eb-4a80-95d5-26e41cc2c69e":{"moduleId":"23347241-80bb-4a7e-9c91-5d9727a9e483:heaterShakerModuleType","pauseAction":"untilTime","pauseMessage":"","pauseTemperature":null,"pauseTime":"0:1:0","id":"bfa5b548-f9eb-4a80-95d5-26e41cc2c69e","stepType":"pause","stepName":"pause","stepDetails":""},"bc3245e5-b22e-492a-9937-03aed3a07710":{"blockIsActive":false,"blockIsActiveHold":false,"blockTargetTemp":null,"blockTargetTempHold":null,"lidIsActive":false,"lidIsActiveHold":false,"lidOpen":true,"lidOpenHold":null,"lidTargetTemp":null,"lidTargetTempHold":null,"moduleId":"fd6da9f1-d63b-414b-929e-c646b64790e9:thermocyclerModuleType","orderedProfileItems":[],"profileItemsById":{},"profileTargetLidTemp":null,"profileVolume":null,"thermocyclerFormType":"thermocyclerState","id":"bc3245e5-b22e-492a-9937-03aed3a07710","stepType":"thermocycler","stepName":"thermocycler","stepDetails":""},"8782dcc1-8960-4d13-9b29-e8837228ba56":{"labware":"54370838-4fca-4a14-b88a-7840e4903649:opentrons/opentrons_96_wellplate_200ul_pcr_full_skirt/4","newLocation":"7c4d59fa-0e50-442f-adce-9e4b0c7f0b88:opentrons/opentrons_96_pcr_adapter/1","useGripper":true,"id":"8782dcc1-8960-4d13-9b29-e8837228ba56","stepType":"moveLabware","stepName":"move labware","stepDetails":""},"b5dc46b1-52ac-4b61-9318-778fb437d1ef":{"heaterShakerSetTimer":null,"heaterShakerTimer":null,"latchOpen":true,"moduleId":"23347241-80bb-4a7e-9c91-5d9727a9e483:heaterShakerModuleType","setHeaterShakerTemperature":null,"setShake":null,"targetHeaterShakerTemperature":null,"targetSpeed":null,"id":"b5dc46b1-52ac-4b61-9318-778fb437d1ef","stepType":"heaterShaker","stepName":"heater-shaker","stepDetails":""},"8622d8f8-acbc-48ff-86f8-0476d1de0e02":{"heaterShakerSetTimer":true,"heaterShakerTimer":"0:1:0","latchOpen":false,"moduleId":"23347241-80bb-4a7e-9c91-5d9727a9e483:heaterShakerModuleType","setHeaterShakerTemperature":false,"setShake":true,"targetHeaterShakerTemperature":null,"targetSpeed":"200","id":"8622d8f8-acbc-48ff-86f8-0476d1de0e02","stepType":"heaterShaker","stepName":"heater-shaker","stepDetails":""},"07dd4472-3ea4-475c-8fd3-18819519b401":{"labware":"54370838-4fca-4a14-b88a-7840e4903649:opentrons/opentrons_96_wellplate_200ul_pcr_full_skirt/4","newLocation":"B4","useGripper":true,"id":"07dd4472-3ea4-475c-8fd3-18819519b401","stepType":"moveLabware","stepName":"move labware","stepDetails":""},"2b8f84e2-b079-41e8-a66e-ff8d9c5dfe1d":{"heaterShakerSetTimer":null,"heaterShakerTimer":null,"latchOpen":true,"moduleId":"23347241-80bb-4a7e-9c91-5d9727a9e483:heaterShakerModuleType","setHeaterShakerTemperature":null,"setShake":null,"targetHeaterShakerTemperature":null,"targetSpeed":null,"id":"2b8f84e2-b079-41e8-a66e-ff8d9c5dfe1d","stepType":"heaterShaker","stepName":"heater-shaker","stepDetails":""},"ed84f11e-db82-4039-9e04-e619b03af42f":{"labware":"f2d371ea-5146-4c89-8200-9c056a7f321a:opentrons/opentrons_flex_96_tiprack_1000ul/1","newLocation":"cutoutD3","useGripper":true,"id":"ed84f11e-db82-4039-9e04-e619b03af42f","stepType":"moveLabware","stepName":"move labware","stepDetails":""}},"orderedStepIds":["dcec0c89-338b-453b-a79b-c081830ff138","e6904828-c44c-4c25-8144-1b7921b5f8dc","d2f74144-a7bf-4ba2-aaab-30d70b2b62c7","240a2c96-3db8-4679-bdac-049306b7b9c4","bfa5b548-f9eb-4a80-95d5-26e41cc2c69e","bc3245e5-b22e-492a-9937-03aed3a07710","b5dc46b1-52ac-4b61-9318-778fb437d1ef","8782dcc1-8960-4d13-9b29-e8837228ba56","8622d8f8-acbc-48ff-86f8-0476d1de0e02","2b8f84e2-b079-41e8-a66e-ff8d9c5dfe1d","07dd4472-3ea4-475c-8fd3-18819519b401","ed84f11e-db82-4039-9e04-e619b03af42f"],"pipettes":{"9fcd50d9-92b2-45ac-acf1-e2cf773feffc":{"pipetteName":"p1000_single_flex"}},"modules":{"23347241-80bb-4a7e-9c91-5d9727a9e483:heaterShakerModuleType":{"model":"heaterShakerModuleV1"},"fd6da9f1-d63b-414b-929e-c646b64790e9:thermocyclerModuleType":{"model":"thermocyclerModuleV2"}},"labware":{"7c4d59fa-0e50-442f-adce-9e4b0c7f0b88:opentrons/opentrons_96_pcr_adapter/1":{"displayName":"Opentrons 96 PCR Heater-Shaker Adapter","labwareDefURI":"opentrons/opentrons_96_pcr_adapter/1"},"f2d371ea-5146-4c89-8200-9c056a7f321a:opentrons/opentrons_flex_96_tiprack_1000ul/1":{"displayName":"Opentrons Flex 96 Tip Rack 1000 µL","labwareDefURI":"opentrons/opentrons_flex_96_tiprack_1000ul/1"},"54370838-4fca-4a14-b88a-7840e4903649:opentrons/opentrons_96_wellplate_200ul_pcr_full_skirt/4":{"displayName":"Opentrons Tough 96 Well Plate 200 µL PCR Full Skirt","labwareDefURI":"opentrons/opentrons_96_wellplate_200ul_pcr_full_skirt/4"},"8bacda22-9e05-45e8-bef4-cc04414a204f:opentrons/axygen_1_reservoir_90ml/3":{"displayName":"Axygen 1 Well Reservoir 90 mL","labwareDefURI":"opentrons/axygen_1_reservoir_90ml/3"}}}},"metadata":{"protocolName":"doItAllV8","author":"","description":"","created":1701659107408,"lastModified":1769457509283,"source":"Protocol Designer","category":null,"subcategory":null,"tags":[]}}"""
