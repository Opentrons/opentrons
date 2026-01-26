import json
from opentrons import protocol_api, types

metadata = {
    "protocolName": "New advanced settings",
    "created": "2024-05-01T12:14:55.341Z",
    "internalAppBuildDate": "Tue, 16 Dec 2025 16:02:03 GMT",
    "lastModified": "2026-01-26T19:58:32.450Z",
    "protocolDesigner": "8.7.1",
    "source": "Protocol Designer",
}

requirements = {"robotType": "Flex", "apiLevel": "2.27"}

def run(protocol: protocol_api.ProtocolContext) -> None:
    # Load Modules:
    temperature_module_1 = protocol.load_module("temperatureModuleV2", "D3")
    temperature_module_2 = protocol.load_module("temperatureModuleV2", "C3")

    # Load Adapters:
    aluminum_block_1 = temperature_module_1.load_adapter(
        "opentrons_96_well_aluminum_block",
        namespace="opentrons",
        version=1,
    )

    # Load Labware:
    tip_rack_1 = protocol.load_labware(
        "opentrons_flex_96_tiprack_50ul",
        location="C2",
        namespace="opentrons",
        version=1,
    )
    aluminum_block_2 = temperature_module_2.load_labware(
        "opentrons_24_aluminumblock_nest_1.5ml_screwcap",
        namespace="opentrons",
        version=3,
    )
    well_plate_1 = aluminum_block_1.load_labware(
        "nest_96_wellplate_100ul_pcr_full_skirt",
        namespace="opentrons",
        version=5,
    )

    # Load Pipettes:
    pipette_left = protocol.load_instrument("flex_1channel_50", "left")

    # Load Trash Bins:
    trash_bin_1 = protocol.load_trash_bin("A3")

    # PROTOCOL STEPS

    # Step 1: transfer
    pipette_left.transfer_with_liquid_class(
        volume=10,
        source=[well_plate_1["C1"]],
        dest=[aluminum_block_2["B3"]],
        new_tip="always",
        trash_location=trash_bin_1,
        keep_last_tip=True,
        tip_racks=[tip_rack_1],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_1",
            properties={"flex_1channel_50": {"opentrons/opentrons_flex_96_tiprack_50ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 2, "y": -2, "z": 29},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 35)],
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
                    "flow_rate_by_volume": [(0, 51)],
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
                        "blowout": {"enabled": True, "location": "source", "flow_rate": 20},
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 2)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
    )
    pipette_left.drop_tip()

    # Step 2: temperature
    temperature_module_1.start_set_temperature(40)

    # Step 3: pause
    temperature_module_1.await_temperature(40)

    # Step 4: temperature
    temperature_module_2.start_set_temperature(4)

    # Step 5: pause
    temperature_module_2.await_temperature(4)

    # Step 6: temperature
    temperature_module_1.deactivate()

    # Step 7: temperature
    temperature_module_2.deactivate()

DESIGNER_APPLICATION = """{"robot":{"model":"OT-3 Standard"},"designerApplication":{"name":"opentrons/protocol-designer","version":"8.7.0","data":{"pipetteTiprackAssignments":{"21087f15-4c03-4587-8a2b-1ba0b5a501a0":["opentrons/opentrons_flex_96_tiprack_50ul/1"]},"dismissedWarnings":{"form":[],"timeline":[]},"ingredients":{},"ingredLocations":{},"savedStepForms":{"__INITIAL_DECK_SETUP_STEP__":{"labwareLocationUpdate":{"0d39213c-49c2-4170-bf19-4c09e1b72aca:opentrons/opentrons_flex_96_tiprack_50ul/1":"C2","c3c4e3fd-069f-4f3d-9b70-016a20f36de7:opentrons/opentrons_24_aluminumblock_nest_1.5ml_screwcap/3":"b9c56153-9026-42d1-8113-949e15254571:temperatureModuleType","32b596f6-79bb-4ad8-a34a-c44620fdb68f:opentrons/opentrons_96_well_aluminum_block/1":"d6966555-6c0e-45e0-8056-428d7c486401:temperatureModuleType","c0093e5f-3f7d-4cbf-aa17-d88394108501:opentrons/nest_96_wellplate_100ul_pcr_full_skirt/5":"32b596f6-79bb-4ad8-a34a-c44620fdb68f:opentrons/opentrons_96_well_aluminum_block/1"},"moduleLocationUpdate":{"d6966555-6c0e-45e0-8056-428d7c486401:temperatureModuleType":"D3","b9c56153-9026-42d1-8113-949e15254571:temperatureModuleType":"C3"},"pipetteLocationUpdate":{"21087f15-4c03-4587-8a2b-1ba0b5a501a0":"left"},"trashBinLocationUpdate":{"20ab923c-1290-402e-8476-bba30991f24e:trashBin":"cutoutA3"},"wasteChuteLocationUpdate":{},"stagingAreaLocationUpdate":{},"gripperLocationUpdate":{},"stepType":"manualIntervention","id":"__INITIAL_DECK_SETUP_STEP__"},"292e8b18-f59e-4c63-b0f3-e242bf50094b":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"1","aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":35,"aspirate_labware":"c0093e5f-3f7d-4cbf-aa17-d88394108501:opentrons/nest_96_wellplate_100ul_pcr_full_skirt/5","aspirate_mix_checkbox":false,"aspirate_mix_times":null,"aspirate_mix_volume":null,"aspirate_mmFromBottom":29,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":100,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":100,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":300,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["C1"],"aspirate_x_position":2,"aspirate_y_position":-2,"blowout_checkbox":true,"blowout_flowRate":20,"blowout_location":"source_well","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":"1","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":51,"dispense_labware":"c3c4e3fd-069f-4f3d-9b70-016a20f36de7:opentrons/opentrons_24_aluminumblock_nest_1.5ml_screwcap/3","dispense_mix_checkbox":false,"dispense_mix_times":null,"dispense_mix_volume":null,"dispense_mmFromBottom":1,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":100,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":100,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":300,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["B3"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":true,"disposalVolume_volume":"1","dropTip_location":"20ab923c-1290-402e-8476-bba30991f24e:trashBin","liquidClassesSupported":false,"liquidClass":"none","nozzles":"SINGLE","path":"single","pipette":"21087f15-4c03-4587-8a2b-1ba0b5a501a0","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":2,"tipRack":"opentrons/opentrons_flex_96_tiprack_50ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"10","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","dispense_touchTip_mmfromTop":null,"id":"292e8b18-f59e-4c63-b0f3-e242bf50094b"},"960c2d3b-9cf9-49b0-ab4c-af4113f6671a":{"moduleId":"d6966555-6c0e-45e0-8056-428d7c486401:temperatureModuleType","setTemperature":"true","targetTemperature":"40","id":"960c2d3b-9cf9-49b0-ab4c-af4113f6671a","stepType":"temperature","stepName":"temperature","stepDetails":""},"5055c5a3-92b7-41e5-935d-e8150e9f4f1c":{"moduleId":"d6966555-6c0e-45e0-8056-428d7c486401:temperatureModuleType","pauseAction":"untilTemperature","pauseMessage":"","pauseTemperature":"40","pauseTime":null,"id":"5055c5a3-92b7-41e5-935d-e8150e9f4f1c","stepType":"pause","stepName":"pause","stepDetails":""},"68a83fc0-726b-4df4-9a14-c43802aa9d0f":{"moduleId":"b9c56153-9026-42d1-8113-949e15254571:temperatureModuleType","setTemperature":"true","targetTemperature":"4","id":"68a83fc0-726b-4df4-9a14-c43802aa9d0f","stepType":"temperature","stepName":"temperature","stepDetails":""},"c72b4af9-7488-4109-8221-15a5433f4fd8":{"moduleId":"b9c56153-9026-42d1-8113-949e15254571:temperatureModuleType","pauseAction":"untilTemperature","pauseMessage":"","pauseTemperature":"4","pauseTime":null,"id":"c72b4af9-7488-4109-8221-15a5433f4fd8","stepType":"pause","stepName":"pause","stepDetails":""},"ffb0d1ff-8146-409c-9248-2065a3b27c4d":{"moduleId":"d6966555-6c0e-45e0-8056-428d7c486401:temperatureModuleType","setTemperature":"false","targetTemperature":null,"id":"ffb0d1ff-8146-409c-9248-2065a3b27c4d","stepType":"temperature","stepName":"temperature","stepDetails":""},"eab2ec89-6d11-4246-ae91-d451cb3a5b1d":{"moduleId":"b9c56153-9026-42d1-8113-949e15254571:temperatureModuleType","setTemperature":"false","targetTemperature":null,"id":"eab2ec89-6d11-4246-ae91-d451cb3a5b1d","stepType":"temperature","stepName":"temperature","stepDetails":""}},"orderedStepIds":["292e8b18-f59e-4c63-b0f3-e242bf50094b","960c2d3b-9cf9-49b0-ab4c-af4113f6671a","5055c5a3-92b7-41e5-935d-e8150e9f4f1c","68a83fc0-726b-4df4-9a14-c43802aa9d0f","c72b4af9-7488-4109-8221-15a5433f4fd8","ffb0d1ff-8146-409c-9248-2065a3b27c4d","eab2ec89-6d11-4246-ae91-d451cb3a5b1d"],"pipettes":{"21087f15-4c03-4587-8a2b-1ba0b5a501a0":{"pipetteName":"p50_single_flex"}},"modules":{"d6966555-6c0e-45e0-8056-428d7c486401:temperatureModuleType":{"model":"temperatureModuleV2"},"b9c56153-9026-42d1-8113-949e15254571:temperatureModuleType":{"model":"temperatureModuleV2"}},"labware":{"32b596f6-79bb-4ad8-a34a-c44620fdb68f:opentrons/opentrons_96_well_aluminum_block/1":{"displayName":"Opentrons 96 Well Aluminum Block","labwareDefURI":"opentrons/opentrons_96_well_aluminum_block/1"},"0d39213c-49c2-4170-bf19-4c09e1b72aca:opentrons/opentrons_flex_96_tiprack_50ul/1":{"displayName":"Opentrons Flex 96 Tip Rack 50 µL","labwareDefURI":"opentrons/opentrons_flex_96_tiprack_50ul/1"},"c3c4e3fd-069f-4f3d-9b70-016a20f36de7:opentrons/opentrons_24_aluminumblock_nest_1.5ml_screwcap/3":{"displayName":"Opentrons 24 Well Aluminum Block with NEST 1.5 mL Screwcap","labwareDefURI":"opentrons/opentrons_24_aluminumblock_nest_1.5ml_screwcap/3"},"c0093e5f-3f7d-4cbf-aa17-d88394108501:opentrons/nest_96_wellplate_100ul_pcr_full_skirt/5":{"displayName":"NEST 96 Well Plate 100 µL PCR Full Skirt","labwareDefURI":"opentrons/nest_96_wellplate_100ul_pcr_full_skirt/5"}}}},"metadata":{"protocolName":"New advanced settings","author":"","description":"","created":1714565695341,"lastModified":1769457512450,"source":"Protocol Designer","category":null,"subcategory":null,"tags":[]}}"""
