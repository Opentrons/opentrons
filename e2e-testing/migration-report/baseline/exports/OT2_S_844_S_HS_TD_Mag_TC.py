import json
from opentrons import protocol_api, types

metadata = {
    "protocolName": "OT-2 Smoke test ",
    "created": "2025-04-28T17:22:32.903Z",
    "internalAppBuildDate": "Fri, 23 Jan 2026 20:05:49 GMT",
    "lastModified": "2026-01-26T19:57:38.417Z",
    "protocolDesigner": "8.8.0-alpha.7",
    "source": "Protocol Designer",
}

requirements = {"robotType": "OT-2", "apiLevel": "2.27"}

def run(protocol: protocol_api.ProtocolContext) -> None:
    # Load Modules:
    thermocycler_module_1 = protocol.load_module("thermocyclerModuleV2", "7")
    magnetic_module_1 = protocol.load_module("magneticModuleV2", "9")
    heater_shaker_module_1 = protocol.load_module("heaterShakerModuleV1", "1")
    temperature_module_1 = protocol.load_module("temperatureModuleV2", "3")

    # Load Adapters:
    adapter_1 = heater_shaker_module_1.load_adapter(
        "opentrons_96_deep_well_adapter",
        namespace="opentrons",
        version=1,
    )
    adapter_2 = temperature_module_1.load_adapter(
        "opentrons_96_deep_well_temp_mod_adapter",
        namespace="opentrons",
        version=1,
    )

    # Load Labware:
    well_plate_1 = thermocycler_module_1.load_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt",
        namespace="opentrons",
        version=4,
    )
    well_plate_2 = magnetic_module_1.load_labware(
        "nest_96_wellplate_2ml_deep",
        label="NEST 96 Deep Well Plate 2mL",
        namespace="opentrons",
        version=5,
    )
    well_plate_3 = adapter_1.load_labware(
        "nest_96_wellplate_2ml_deep",
        label="NEST 96 Deep Well Plate 2mL",
        namespace="opentrons",
        version=5,
    )
    tip_rack_1 = protocol.load_labware(
        "opentrons_96_filtertiprack_200ul",
        location="5",
        namespace="opentrons",
        version=1,
    )

    # Load Pipettes:
    pipette_left = protocol.load_instrument("p300_multi_gen2", "left")

    # Define Liquids:
    liquid_1 = protocol.define_liquid(
        "H20",
        display_color="#b925ff",
    )
    liquid_2 = protocol.define_liquid(
        "Yellow",
        display_color="#ffd600",
    )

    # Load Liquids:
    well_plate_2.load_liquid(
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
        volume=1500,
    )
    well_plate_3.load_liquid(
        wells=[
            "B1", "C1", "D1", "E1", "F1", "G1", "H1", "B2",
            "C2", "D2", "E2", "F2", "G2", "H2", "B3", "C3",
            "D3", "E3", "F3", "G3", "H3", "B4", "C4", "D4",
            "E4", "F4", "G4", "H4", "B5", "C5", "D5", "E5",
            "F5", "G5", "H5", "B6", "C6", "D6", "E6", "F6",
            "G6", "H6", "B7", "C7", "D7", "E7", "F7", "G7",
            "H7", "B8", "C8", "D8", "E8", "F8", "G8", "H8",
            "B9", "C9", "D9", "E9", "F9", "G9", "H9", "B10",
            "C10", "D10", "E10", "F10", "G10", "H10", "B11", "C11",
            "D11", "E11", "F11", "G11", "H11", "B12", "C12", "D12",
            "E12", "F12", "G12", "H12", "A1", "A2", "A3", "A4",
            "A5", "A6", "A7", "A8", "A9", "A10", "A11", "A12"
        ],
        liquid=liquid_2,
        volume=1500,
    )

    # PROTOCOL STEPS

    # Step 1: thermocycler
    thermocycler_module_1.close_lid()
    thermocycler_module_1.set_lid_temperature(110)
    thermocycler_module_1.execute_profile(
        [
            {"temperature": 30, "hold_time_seconds": 1},
            {"temperature": 80, "hold_time_seconds": 1},
        ],
        3,
        block_max_volume=0,
    )
    thermocycler_module_1.open_lid()
    thermocycler_module_1.deactivate_block()
    thermocycler_module_1.deactivate_lid()

    # Step 2: magnet
    magnetic_module_1.engage(height_from_base=6.8)

    # Step 3: temperature
    temperature_module_1.deactivate()

    # Step 4: heater-shaker
    heater_shaker_module_1.close_labware_latch()
    heater_shaker_module_1.set_target_temperature(44)
    heater_shaker_module_1.set_and_wait_for_shake_speed(400)
    heater_shaker_module_1.wait_for_temperature()
    protocol.delay(seconds=4)
    heater_shaker_module_1.deactivate_shaker()
    heater_shaker_module_1.deactivate_heater()

    # Step 5: heater-shaker
    heater_shaker_module_1.deactivate_heater()
    heater_shaker_module_1.open_labware_latch()

    # Step 6: move
    protocol.move_labware(well_plate_3, adapter_2)

    # Step 7: temperature
    temperature_module_1.start_set_temperature(40)

    # Step 8: pause
    temperature_module_1.await_temperature(40)

    # Step 9: transfer
    pipette_left.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette_left.distribute_with_liquid_class(
        volume=30,
        source=[well_plate_3["A12"]],
        dest=[well_plate_1["A1"], well_plate_1["A2"], well_plate_1["A3"], well_plate_1["A4"], well_plate_1["A5"], well_plate_1["A6"], well_plate_1["A7"], well_plate_1["A8"], well_plate_1["A9"], well_plate_1["A10"], well_plate_1["A11"], well_plate_1["A12"]],
        new_tip="once",
        trash_location=protocol.fixed_trash,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_1],
        liquid_class=protocol.define_liquid_class(
            name="distribute_step_9",
            properties={"p300_multi_gen2": {"opentrons/opentrons_96_filtertiprack_200ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 1},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 94)],
                    "pre_wet": True,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": True, "duration": 1},
                    "mix": {"enabled": True, "repetitions": 3, "volume": 200},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
                        "start_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                    },
                    "retract": {
                        "air_gap_by_volume": [(0, 50)],
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
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 1},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 94)],
                    "delay": {"enabled": True, "duration": 1},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
                        "start_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                    },
                    "retract": {
                        "air_gap_by_volume": [(0, 30)],
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
                        "blowout": {"enabled": True, "location": "source", "flow_rate": 94},
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
                    "flow_rate_by_volume": [(0, 94)],
                    "delay": {"enabled": True, "duration": 1},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
                        "start_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                    },
                    "retract": {
                        "air_gap_by_volume": [(0, 30)],
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
                        "blowout": {"enabled": True, "location": "source", "flow_rate": 94},
                    },
                    "correction_by_volume": [(0, 0)],
                    "conditioning_by_volume": [(0, 0)],
                    "disposal_by_volume": [(0, 20)],
                },
            }}},
        ),
    )
    pipette_left.drop_tip()

DESIGNER_APPLICATION = """{"robot":{"model":"OT-2 Standard"},"designerApplication":{"name":"opentrons/protocol-designer","version":"8.8.0","data":{"pipetteTiprackAssignments":{"1bfbf8a5-d02e-4ed8-b5f7-25721ae91d33":["opentrons/opentrons_96_filtertiprack_200ul/1"]},"dismissedWarnings":{"form":[],"timeline":[]},"ingredients":{"0":{"displayName":"H20","description":null,"displayColor":"#b925ff","liquidGroupId":"0","liquidClass":null},"1":{"displayName":"Yellow","description":null,"displayColor":"#ffd600","liquidGroupId":"1","liquidClass":null}},"ingredLocations":{"6b04a4eb-71ba-4394-9477-f58711a84294:opentrons/nest_96_wellplate_2ml_deep/5":{"A1":{"0":{"volume":1500}},"B1":{"0":{"volume":1500}},"C1":{"0":{"volume":1500}},"D1":{"0":{"volume":1500}},"E1":{"0":{"volume":1500}},"F1":{"0":{"volume":1500}},"G1":{"0":{"volume":1500}},"H1":{"0":{"volume":1500}},"A2":{"0":{"volume":1500}},"B2":{"0":{"volume":1500}},"C2":{"0":{"volume":1500}},"D2":{"0":{"volume":1500}},"E2":{"0":{"volume":1500}},"F2":{"0":{"volume":1500}},"G2":{"0":{"volume":1500}},"H2":{"0":{"volume":1500}},"A3":{"0":{"volume":1500}},"B3":{"0":{"volume":1500}},"C3":{"0":{"volume":1500}},"D3":{"0":{"volume":1500}},"E3":{"0":{"volume":1500}},"F3":{"0":{"volume":1500}},"G3":{"0":{"volume":1500}},"H3":{"0":{"volume":1500}},"A4":{"0":{"volume":1500}},"B4":{"0":{"volume":1500}},"C4":{"0":{"volume":1500}},"D4":{"0":{"volume":1500}},"E4":{"0":{"volume":1500}},"F4":{"0":{"volume":1500}},"G4":{"0":{"volume":1500}},"H4":{"0":{"volume":1500}},"A5":{"0":{"volume":1500}},"B5":{"0":{"volume":1500}},"C5":{"0":{"volume":1500}},"D5":{"0":{"volume":1500}},"E5":{"0":{"volume":1500}},"F5":{"0":{"volume":1500}},"G5":{"0":{"volume":1500}},"H5":{"0":{"volume":1500}},"A6":{"0":{"volume":1500}},"B6":{"0":{"volume":1500}},"C6":{"0":{"volume":1500}},"D6":{"0":{"volume":1500}},"E6":{"0":{"volume":1500}},"F6":{"0":{"volume":1500}},"G6":{"0":{"volume":1500}},"H6":{"0":{"volume":1500}},"A7":{"0":{"volume":1500}},"B7":{"0":{"volume":1500}},"C7":{"0":{"volume":1500}},"D7":{"0":{"volume":1500}},"E7":{"0":{"volume":1500}},"F7":{"0":{"volume":1500}},"G7":{"0":{"volume":1500}},"H7":{"0":{"volume":1500}},"A8":{"0":{"volume":1500}},"B8":{"0":{"volume":1500}},"C8":{"0":{"volume":1500}},"D8":{"0":{"volume":1500}},"E8":{"0":{"volume":1500}},"F8":{"0":{"volume":1500}},"G8":{"0":{"volume":1500}},"H8":{"0":{"volume":1500}},"A9":{"0":{"volume":1500}},"B9":{"0":{"volume":1500}},"C9":{"0":{"volume":1500}},"D9":{"0":{"volume":1500}},"E9":{"0":{"volume":1500}},"F9":{"0":{"volume":1500}},"G9":{"0":{"volume":1500}},"H9":{"0":{"volume":1500}},"A10":{"0":{"volume":1500}},"B10":{"0":{"volume":1500}},"C10":{"0":{"volume":1500}},"D10":{"0":{"volume":1500}},"E10":{"0":{"volume":1500}},"F10":{"0":{"volume":1500}},"G10":{"0":{"volume":1500}},"H10":{"0":{"volume":1500}},"A11":{"0":{"volume":1500}},"B11":{"0":{"volume":1500}},"C11":{"0":{"volume":1500}},"D11":{"0":{"volume":1500}},"E11":{"0":{"volume":1500}},"F11":{"0":{"volume":1500}},"G11":{"0":{"volume":1500}},"H11":{"0":{"volume":1500}},"A12":{"0":{"volume":1500}},"B12":{"0":{"volume":1500}},"C12":{"0":{"volume":1500}},"D12":{"0":{"volume":1500}},"E12":{"0":{"volume":1500}},"F12":{"0":{"volume":1500}},"G12":{"0":{"volume":1500}},"H12":{"0":{"volume":1500}}},"4bc461b9-198e-47e2-badb-3d0941d65200:opentrons/nest_96_wellplate_2ml_deep/5":{"B1":{"1":{"volume":1500}},"C1":{"1":{"volume":1500}},"D1":{"1":{"volume":1500}},"E1":{"1":{"volume":1500}},"F1":{"1":{"volume":1500}},"G1":{"1":{"volume":1500}},"H1":{"1":{"volume":1500}},"B2":{"1":{"volume":1500}},"C2":{"1":{"volume":1500}},"D2":{"1":{"volume":1500}},"E2":{"1":{"volume":1500}},"F2":{"1":{"volume":1500}},"G2":{"1":{"volume":1500}},"H2":{"1":{"volume":1500}},"B3":{"1":{"volume":1500}},"C3":{"1":{"volume":1500}},"D3":{"1":{"volume":1500}},"E3":{"1":{"volume":1500}},"F3":{"1":{"volume":1500}},"G3":{"1":{"volume":1500}},"H3":{"1":{"volume":1500}},"B4":{"1":{"volume":1500}},"C4":{"1":{"volume":1500}},"D4":{"1":{"volume":1500}},"E4":{"1":{"volume":1500}},"F4":{"1":{"volume":1500}},"G4":{"1":{"volume":1500}},"H4":{"1":{"volume":1500}},"B5":{"1":{"volume":1500}},"C5":{"1":{"volume":1500}},"D5":{"1":{"volume":1500}},"E5":{"1":{"volume":1500}},"F5":{"1":{"volume":1500}},"G5":{"1":{"volume":1500}},"H5":{"1":{"volume":1500}},"B6":{"1":{"volume":1500}},"C6":{"1":{"volume":1500}},"D6":{"1":{"volume":1500}},"E6":{"1":{"volume":1500}},"F6":{"1":{"volume":1500}},"G6":{"1":{"volume":1500}},"H6":{"1":{"volume":1500}},"B7":{"1":{"volume":1500}},"C7":{"1":{"volume":1500}},"D7":{"1":{"volume":1500}},"E7":{"1":{"volume":1500}},"F7":{"1":{"volume":1500}},"G7":{"1":{"volume":1500}},"H7":{"1":{"volume":1500}},"B8":{"1":{"volume":1500}},"C8":{"1":{"volume":1500}},"D8":{"1":{"volume":1500}},"E8":{"1":{"volume":1500}},"F8":{"1":{"volume":1500}},"G8":{"1":{"volume":1500}},"H8":{"1":{"volume":1500}},"B9":{"1":{"volume":1500}},"C9":{"1":{"volume":1500}},"D9":{"1":{"volume":1500}},"E9":{"1":{"volume":1500}},"F9":{"1":{"volume":1500}},"G9":{"1":{"volume":1500}},"H9":{"1":{"volume":1500}},"B10":{"1":{"volume":1500}},"C10":{"1":{"volume":1500}},"D10":{"1":{"volume":1500}},"E10":{"1":{"volume":1500}},"F10":{"1":{"volume":1500}},"G10":{"1":{"volume":1500}},"H10":{"1":{"volume":1500}},"B11":{"1":{"volume":1500}},"C11":{"1":{"volume":1500}},"D11":{"1":{"volume":1500}},"E11":{"1":{"volume":1500}},"F11":{"1":{"volume":1500}},"G11":{"1":{"volume":1500}},"H11":{"1":{"volume":1500}},"B12":{"1":{"volume":1500}},"C12":{"1":{"volume":1500}},"D12":{"1":{"volume":1500}},"E12":{"1":{"volume":1500}},"F12":{"1":{"volume":1500}},"G12":{"1":{"volume":1500}},"H12":{"1":{"volume":1500}},"A1":{"1":{"volume":1500}},"A2":{"1":{"volume":1500}},"A3":{"1":{"volume":1500}},"A4":{"1":{"volume":1500}},"A5":{"1":{"volume":1500}},"A6":{"1":{"volume":1500}},"A7":{"1":{"volume":1500}},"A8":{"1":{"volume":1500}},"A9":{"1":{"volume":1500}},"A10":{"1":{"volume":1500}},"A11":{"1":{"volume":1500}},"A12":{"1":{"volume":1500}}}},"savedStepForms":{"__INITIAL_DECK_SETUP_STEP__":{"stepType":"manualIntervention","id":"__INITIAL_DECK_SETUP_STEP__","labwareLocationUpdate":{"d210dc40-e424-489e-8cab-d062c3fd7584:opentrons/opentrons_96_wellplate_200ul_pcr_full_skirt/4":"3df67b9c-093f-4c3e-81d4-979689cbd5e7:thermocyclerModuleType","6b04a4eb-71ba-4394-9477-f58711a84294:opentrons/nest_96_wellplate_2ml_deep/5":"acae23d1-4f05-466e-b9a7-695868603f1f:magneticModuleType","742dccdc-4085-4ccd-9dfc-9f7a6a69c5e8:opentrons/opentrons_96_deep_well_adapter/1":"066c348a-f38f-4da9-a031-fb98f666f9a0:heaterShakerModuleType","4bc461b9-198e-47e2-badb-3d0941d65200:opentrons/nest_96_wellplate_2ml_deep/5":"742dccdc-4085-4ccd-9dfc-9f7a6a69c5e8:opentrons/opentrons_96_deep_well_adapter/1","bc085c56-83c1-4e08-ad41-db483e88ed78:opentrons/opentrons_96_deep_well_temp_mod_adapter/1":"e76a18d0-05e8-43f8-8799-777c0155fcfb:temperatureModuleType","d5db47f2-b730-4912-9fdb-32c5c07d9e9b:opentrons/opentrons_96_filtertiprack_200ul/1":"5"},"pipetteLocationUpdate":{"1bfbf8a5-d02e-4ed8-b5f7-25721ae91d33":"left"},"moduleLocationUpdate":{"3df67b9c-093f-4c3e-81d4-979689cbd5e7:thermocyclerModuleType":"7","acae23d1-4f05-466e-b9a7-695868603f1f:magneticModuleType":"9","066c348a-f38f-4da9-a031-fb98f666f9a0:heaterShakerModuleType":"1","e76a18d0-05e8-43f8-8799-777c0155fcfb:temperatureModuleType":"3"},"trashBinLocationUpdate":{"efa2f3d2-82cd-41a9-97e6-bb0be3aa524e:trashBin":"cutout12"},"wasteChuteLocationUpdate":{},"stagingAreaLocationUpdate":{},"gripperLocationUpdate":{},"moduleStateUpdate":{}},"2690117a-75cf-4307-8519-3151827f1ff3":{"blockIsActive":false,"blockIsActiveHold":false,"blockTargetTemp":null,"blockTargetTempHold":null,"lidIsActive":false,"lidIsActiveHold":false,"lidOpen":false,"lidOpenHold":true,"lidTargetTemp":null,"lidTargetTempHold":null,"moduleId":"3df67b9c-093f-4c3e-81d4-979689cbd5e7:thermocyclerModuleType","orderedProfileItems":["6a1c19b4-5780-4a2a-a10f-118daeeb1577"],"profileItemsById":{"6a1c19b4-5780-4a2a-a10f-118daeeb1577":{"id":"6a1c19b4-5780-4a2a-a10f-118daeeb1577","title":"","steps":[{"durationMinutes":"00","durationSeconds":"01","id":"c1997431-3eed-430e-a5ab-f25b3e5d91c3","temperature":"30","title":"Potato ","type":"profileStep"},{"durationMinutes":"00","durationSeconds":"01","id":"493f4f8e-fc6c-4222-bd84-99c4bb27d0a1","temperature":"80","title":"French fry","type":"profileStep"}],"type":"profileCycle","repetitions":"3"}},"profileTargetLidTemp":"110","profileVolume":"0","thermocyclerFormType":"thermocyclerProfile","id":"2690117a-75cf-4307-8519-3151827f1ff3","stepType":"thermocycler","stepName":"thermocycler","stepDetails":""},"933dda4c-6075-48a1-a9f9-7b43288ae7af":{"engageHeight":"6.8","magnetAction":"engage","moduleId":"acae23d1-4f05-466e-b9a7-695868603f1f:magneticModuleType","id":"933dda4c-6075-48a1-a9f9-7b43288ae7af","stepType":"magnet","stepName":"magnet","stepDetails":""},"53dc7891-1b07-456d-8e3b-829e7e3b0939":{"moduleId":"e76a18d0-05e8-43f8-8799-777c0155fcfb:temperatureModuleType","setTemperature":"false","targetTemperature":null,"id":"53dc7891-1b07-456d-8e3b-829e7e3b0939","stepType":"temperature","stepName":"temperature","stepDetails":""},"2539eb2c-5cf1-4398-aefa-16a0f44cc7ad":{"heaterShakerSetTimer":true,"heaterShakerTimer":"0:0:4","latchOpen":false,"moduleId":"066c348a-f38f-4da9-a031-fb98f666f9a0:heaterShakerModuleType","setHeaterShakerTemperature":true,"setShake":true,"targetHeaterShakerTemperature":"44","targetSpeed":"400","id":"2539eb2c-5cf1-4398-aefa-16a0f44cc7ad","stepType":"heaterShaker","stepName":"heater-shaker","stepDetails":""},"a7640f64-d3da-492e-aaed-41fc2291e3b2":{"heaterShakerSetTimer":null,"heaterShakerTimer":null,"latchOpen":true,"moduleId":"066c348a-f38f-4da9-a031-fb98f666f9a0:heaterShakerModuleType","setHeaterShakerTemperature":null,"setShake":null,"targetHeaterShakerTemperature":null,"targetSpeed":null,"id":"a7640f64-d3da-492e-aaed-41fc2291e3b2","stepType":"heaterShaker","stepName":"heater-shaker","stepDetails":""},"f0f11000-bad4-4f01-bb5d-bc5f4f9a84b5":{"labware":"4bc461b9-198e-47e2-badb-3d0941d65200:opentrons/nest_96_wellplate_2ml_deep/5","newLocation":"bc085c56-83c1-4e08-ad41-db483e88ed78:opentrons/opentrons_96_deep_well_temp_mod_adapter/1","useGripper":false,"id":"f0f11000-bad4-4f01-bb5d-bc5f4f9a84b5","stepType":"moveLabware","stepName":"move","stepDetails":""},"8cef4450-523f-48f1-b08f-a325ff7501da":{"moduleId":"e76a18d0-05e8-43f8-8799-777c0155fcfb:temperatureModuleType","setTemperature":"true","targetTemperature":"40","id":"8cef4450-523f-48f1-b08f-a325ff7501da","stepType":"temperature","stepName":"temperature","stepDetails":""},"39325c64-08c1-4503-94f8-a33d88df1267":{"moduleId":"e76a18d0-05e8-43f8-8799-777c0155fcfb:temperatureModuleType","pauseAction":"untilTemperature","pauseMessage":"","pauseTemperature":"40","pauseTime":null,"id":"39325c64-08c1-4503-94f8-a33d88df1267","stepType":"pause","stepName":"pause","stepDetails":""},"f7e8130d-7681-4cf0-abc6-57fa824990ff":{"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"50","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"1","aspirate_flowRate":94,"aspirate_labware":"4bc461b9-198e-47e2-badb-3d0941d65200:opentrons/nest_96_wellplate_2ml_deep/5","aspirate_mix_checkbox":true,"aspirate_mix_times":"3","aspirate_mix_volume":"200","aspirate_mmFromBottom":1,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":125,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":125,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":true,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":400,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A12"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":94,"blowout_location":"source_well","changeTip":"once","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":true,"dispense_airGap_volume":"30","dispense_delay_checkbox":true,"dispense_delay_seconds":"1","dispense_flowRate":94,"dispense_labware":"d210dc40-e424-489e-8cab-d062c3fd7584:opentrons/opentrons_96_wellplate_200ul_pcr_full_skirt/4","dispense_mix_checkbox":false,"dispense_mix_times":null,"dispense_mix_volume":null,"dispense_mmFromBottom":1,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":125,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":125,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":true,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":400,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1","A2","A3","A4","A5","A6","A7","A8","A9","A10","A11","A12"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":true,"disposalVolume_volume":"20","dropTip_location":"efa2f3d2-82cd-41a9-97e6-bb0be3aa524e:trashBin","liquidClassesSupported":false,"liquidClass":"none","nozzles":"ALL","path":"multiDispense","pipette":"1bfbf8a5-d02e-4ed8-b5f7-25721ae91d33","preWetTip":true,"pushOut_checkbox":false,"pushOut_volume":0,"tipRack":"opentrons/opentrons_96_filtertiprack_200ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"30","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","id":"f7e8130d-7681-4cf0-abc6-57fa824990ff","dispense_touchTip_mmfromTop":null}},"orderedStepIds":["2690117a-75cf-4307-8519-3151827f1ff3","933dda4c-6075-48a1-a9f9-7b43288ae7af","53dc7891-1b07-456d-8e3b-829e7e3b0939","2539eb2c-5cf1-4398-aefa-16a0f44cc7ad","a7640f64-d3da-492e-aaed-41fc2291e3b2","f0f11000-bad4-4f01-bb5d-bc5f4f9a84b5","8cef4450-523f-48f1-b08f-a325ff7501da","39325c64-08c1-4503-94f8-a33d88df1267","f7e8130d-7681-4cf0-abc6-57fa824990ff"],"pipettes":{"1bfbf8a5-d02e-4ed8-b5f7-25721ae91d33":{"pipetteName":"p300_multi_gen2"}},"modules":{"3df67b9c-093f-4c3e-81d4-979689cbd5e7:thermocyclerModuleType":{"model":"thermocyclerModuleV2"},"acae23d1-4f05-466e-b9a7-695868603f1f:magneticModuleType":{"model":"magneticModuleV2"},"066c348a-f38f-4da9-a031-fb98f666f9a0:heaterShakerModuleType":{"model":"heaterShakerModuleV1"},"e76a18d0-05e8-43f8-8799-777c0155fcfb:temperatureModuleType":{"model":"temperatureModuleV2"}},"labware":{"d210dc40-e424-489e-8cab-d062c3fd7584:opentrons/opentrons_96_wellplate_200ul_pcr_full_skirt/4":{"displayName":"Opentrons Tough 96 Well Plate 200 µL PCR Full Skirt","labwareDefURI":"opentrons/opentrons_96_wellplate_200ul_pcr_full_skirt/4"},"6b04a4eb-71ba-4394-9477-f58711a84294:opentrons/nest_96_wellplate_2ml_deep/5":{"displayName":"NEST 96 Deep Well Plate 2mL","labwareDefURI":"opentrons/nest_96_wellplate_2ml_deep/5"},"742dccdc-4085-4ccd-9dfc-9f7a6a69c5e8:opentrons/opentrons_96_deep_well_adapter/1":{"displayName":"Opentrons 96 Deep Well Heater-Shaker Adapter","labwareDefURI":"opentrons/opentrons_96_deep_well_adapter/1"},"4bc461b9-198e-47e2-badb-3d0941d65200:opentrons/nest_96_wellplate_2ml_deep/5":{"displayName":"NEST 96 Deep Well Plate 2mL","labwareDefURI":"opentrons/nest_96_wellplate_2ml_deep/5"},"bc085c56-83c1-4e08-ad41-db483e88ed78:opentrons/opentrons_96_deep_well_temp_mod_adapter/1":{"displayName":"Opentrons 96 Deep Well Temperature Module Adapter","labwareDefURI":"opentrons/opentrons_96_deep_well_temp_mod_adapter/1"},"d5db47f2-b730-4912-9fdb-32c5c07d9e9b:opentrons/opentrons_96_filtertiprack_200ul/1":{"displayName":"Opentrons OT-2 96 Filter Tip Rack 200 µL","labwareDefURI":"opentrons/opentrons_96_filtertiprack_200ul/1"}}}},"metadata":{"protocolName":"OT-2 Smoke test ","author":"","description":"","created":1745860952903,"lastModified":1769457458417,"category":null,"subcategory":null,"tags":[],"source":"Protocol Designer"}}"""
