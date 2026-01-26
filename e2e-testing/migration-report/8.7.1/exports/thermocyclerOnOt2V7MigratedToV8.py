from opentrons import protocol_api

metadata = {
    "protocolName": "ThermocyclerOnOt2",
    "author": "Hopia",
    "description": "testing a thermocycler on OT-2",
    "created": "2024-11-11T20:24:24.582Z",
    "internalAppBuildDate": "Tue, 16 Dec 2025 16:02:03 GMT",
    "lastModified": "2026-01-26T18:53:44.762Z",
    "protocolDesigner": "8.7.1",
    "source": "Protocol Designer",
}

requirements = {"robotType": "OT-2", "apiLevel": "2.27"}


def run(protocol: protocol_api.ProtocolContext) -> None:
    # Load Modules:
    thermocycler_module_1 = protocol.load_module("thermocyclerModuleV1", "7")

    # Load Labware:
    well_plate_1 = thermocycler_module_1.load_labware(
        "nest_96_wellplate_100ul_pcr_full_skirt",
        namespace="opentrons",
        version=5,
    )

    # Load Pipettes:
    pipette_left = protocol.load_instrument("p20_single_gen2", "left")

    # Define Liquids:
    liquid_1 = protocol.define_liquid(
        "123",
        display_color="#b925ff",
    )

    # Load Liquids:
    well_plate_1.load_liquid(
        wells=["A1", "B1", "C1", "D1", "E1", "F1", "G1", "H1"],
        liquid=liquid_1,
        volume=55,
    )

    # PROTOCOL STEPS

    # Step 1: thermocycler
    thermocycler_module_1.close_lid()
    thermocycler_module_1.set_lid_temperature(50)

    # Step 2: thermocycler
    thermocycler_module_1.set_lid_temperature(40)
    thermocycler_module_1.execute_profile(
        [
            {"temperature": 50, "hold_time_seconds": 71},
            {"temperature": 34, "hold_time_seconds": 170},
            {"temperature": 87, "hold_time_seconds": 2640},
            {"temperature": 34, "hold_time_seconds": 170},
            {"temperature": 87, "hold_time_seconds": 2640},
            {"temperature": 34, "hold_time_seconds": 170},
            {"temperature": 87, "hold_time_seconds": 2640},
        ],
        1,
        block_max_volume=50,
    )
    thermocycler_module_1.deactivate_block()
    thermocycler_module_1.deactivate_lid()


DESIGNER_APPLICATION = """{"robot":{"model":"OT-2 Standard"},"designerApplication":{"name":"opentrons/protocol-designer","version":"8.7.0","data":{"pipetteTiprackAssignments":{"733ba018-3550-476c-9fa3-0b5259d1a1d6":["opentrons/opentrons_96_tiprack_20ul/1"]},"dismissedWarnings":{"form":[],"timeline":[]},"ingredients":{"0":{"displayName":"123","description":null,"displayColor":"#b925ff","liquidGroupId":"0","liquidClass":null}},"ingredLocations":{"ac928a51-a248-4304-be43-e9cb19c34fa9:opentrons/nest_96_wellplate_100ul_pcr_full_skirt/5":{"A1":{"0":{"volume":55}},"B1":{"0":{"volume":55}},"C1":{"0":{"volume":55}},"D1":{"0":{"volume":55}},"E1":{"0":{"volume":55}},"F1":{"0":{"volume":55}},"G1":{"0":{"volume":55}},"H1":{"0":{"volume":55}}}},"savedStepForms":{"__INITIAL_DECK_SETUP_STEP__":{"labwareLocationUpdate":{"ac928a51-a248-4304-be43-e9cb19c34fa9:opentrons/nest_96_wellplate_100ul_pcr_full_skirt/5":"82858229-5c25-46cc-87d4-35ab318c18ce:thermocyclerModuleType"},"moduleLocationUpdate":{"82858229-5c25-46cc-87d4-35ab318c18ce:thermocyclerModuleType":"7"},"pipetteLocationUpdate":{"733ba018-3550-476c-9fa3-0b5259d1a1d6":"left"},"trashBinLocationUpdate":{"18e8bb45-ce97-4883-8668-77429245bd00:trashBin":"cutout12"},"wasteChuteLocationUpdate":{},"stagingAreaLocationUpdate":{},"gripperLocationUpdate":{},"stepType":"manualIntervention","id":"__INITIAL_DECK_SETUP_STEP__"},"f07a86fc-8373-427b-b159-89ec8d20b9a6":{"blockIsActive":false,"blockIsActiveHold":false,"blockTargetTemp":null,"blockTargetTempHold":null,"lidIsActive":true,"lidIsActiveHold":false,"lidOpen":false,"lidOpenHold":null,"lidTargetTemp":"50","lidTargetTempHold":null,"moduleId":"82858229-5c25-46cc-87d4-35ab318c18ce:thermocyclerModuleType","orderedProfileItems":[],"profileItemsById":{},"profileTargetLidTemp":null,"profileVolume":null,"thermocyclerFormType":"thermocyclerState","id":"f07a86fc-8373-427b-b159-89ec8d20b9a6","stepType":"thermocycler","stepName":"thermocycler","stepDetails":""},"72b79c80-00e4-48ce-b42a-35b0ba17664c":{"blockIsActive":false,"blockIsActiveHold":false,"blockTargetTemp":null,"blockTargetTempHold":null,"lidIsActive":true,"lidIsActiveHold":false,"lidOpen":false,"lidOpenHold":null,"lidTargetTemp":50,"lidTargetTempHold":null,"moduleId":"82858229-5c25-46cc-87d4-35ab318c18ce:thermocyclerModuleType","orderedProfileItems":["fabf5f85-4295-451c-aeba-e80a7c3ecb8b","29a0f854-b15e-436b-a66d-08384ec4ce7a"],"profileItemsById":{"fabf5f85-4295-451c-aeba-e80a7c3ecb8b":{"type":"profileStep","id":"fabf5f85-4295-451c-aeba-e80a7c3ecb8b","title":"step 1","temperature":"50","durationMinutes":"1","durationSeconds":"11"},"29a0f854-b15e-436b-a66d-08384ec4ce7a":{"id":"29a0f854-b15e-436b-a66d-08384ec4ce7a","type":"profileCycle","repetitions":"3","steps":[{"type":"profileStep","id":"d8210aa3-50ad-4acd-abbb-010ec3f70235","title":"denaturization","temperature":"34","durationMinutes":"2","durationSeconds":"50"},{"type":"profileStep","id":"0df3f511-4f23-450d-8bc1-17449e8a5845","title":"tagmentation","temperature":"87","durationMinutes":"44","durationSeconds":"0"}]}},"profileTargetLidTemp":"40","profileVolume":"50","thermocyclerFormType":"thermocyclerProfile","id":"72b79c80-00e4-48ce-b42a-35b0ba17664c","stepType":"thermocycler","stepName":"thermocycler","stepDetails":""}},"orderedStepIds":["f07a86fc-8373-427b-b159-89ec8d20b9a6","72b79c80-00e4-48ce-b42a-35b0ba17664c"],"pipettes":{"733ba018-3550-476c-9fa3-0b5259d1a1d6":{"pipetteName":"p20_single_gen2"}},"modules":{"82858229-5c25-46cc-87d4-35ab318c18ce:thermocyclerModuleType":{"model":"thermocyclerModuleV1"}},"labware":{"ac928a51-a248-4304-be43-e9cb19c34fa9:opentrons/nest_96_wellplate_100ul_pcr_full_skirt/5":{"displayName":"NEST 96 Well Plate 100 µL PCR Full Skirt","labwareDefURI":"opentrons/nest_96_wellplate_100ul_pcr_full_skirt/5"}}}},"metadata":{"protocolName":"ThermocyclerOnOt2","author":"Hopia","description":"testing a thermocycler on OT-2","created":1731356664582,"lastModified":1769453624762,"source":"Protocol Designer","category":null,"subcategory":null,"tags":[]}}"""
