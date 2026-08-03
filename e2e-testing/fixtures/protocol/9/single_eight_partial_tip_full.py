import json
from opentrons import protocol_api, types

metadata = {
    "protocolName": "single_eight_partial_tip_test",
    "created": "2026-05-22T20:17:01.862Z",
    "internalAppBuildDate": "Tue, 05 May 2026 15:37:27 GMT",
    "lastModified": "2026-05-22T20:25:17.372Z",
    "protocolDesigner": "8.10.1",
    "source": "Protocol Designer",
}

requirements = {"robotType": "Flex", "apiLevel": "2.28"}

def run(protocol: protocol_api.ProtocolContext) -> None:
    # Load Modules:
    thermocycler_module_1 = protocol.load_module("thermocyclerModuleV2", "B1")
    flex_stacker_module_1 = protocol.load_module("flexStackerModuleV1", "A4")
    temperature_module_1 = protocol.load_module("temperatureModuleV2", "C1")
    heater_shaker_module_1 = protocol.load_module("heaterShakerModuleV1", "D1")

    # Load Adapters:
    adapter_1 = heater_shaker_module_1.load_adapter(
        "opentrons_universal_flat_adapter_type_b",
        namespace="opentrons",
        version=1,
    )

    # Load Labware:
    tip_rack_1 = protocol.load_labware(
        "opentrons_flex_96_filtertiprack_20ul",
        location="C3",
        namespace="opentrons",
        version=1,
    )
    tip_rack_2 = protocol.load_labware(
        "opentrons_flex_96_filtertiprack_1000ul",
        location="B2",
        namespace="opentrons",
        version=1,
    )
    well_plate_1 = protocol.load_labware(
        "corning_384_wellplate_112ul_flat",
        location="A3",
        namespace="opentrons",
        version=5,
    )
    aluminum_block_1 = temperature_module_1.load_labware(
        "opentrons_24_aluminumblock_generic_2ml_screwcap",
        namespace="opentrons",
        version=3,
    )
    well_plate_2 = adapter_1.load_labware(
        "thermofisher_nunc_maxisorp_lockwell_elisa",
        namespace="opentrons",
        version=1,
    )
    well_plate_3 = thermocycler_module_1.load_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt",
        namespace="opentrons",
        version=4,
    )

    # Load Pipettes:
    pipette_left = protocol.load_instrument("flex_1channel_50", "left")
    pipette_right = protocol.load_instrument("flex_8channel_1000", "right")

    # Load Waste Chute:
    waste_chute = protocol.load_waste_chute()

    # Define Liquids:
    liquid_1 = protocol.define_liquid(
        "f",
        display_color="#b925ff",
    )

    # Load Liquids:
    aluminum_block_1.load_liquid(
        wells=[
            "A1", "B1", "C1", "D1", "A2", "B2", "C2", "D2",
            "A3", "B3", "C3", "D3", "A4", "B4", "C4", "D4",
            "A5", "B5", "C5", "D5", "A6", "B6", "C6", "D6"
        ],
        liquid=liquid_1,
        volume=12,
    )

    # PROTOCOL STEPS

    # Step 1: thermocycler
    thermocycler_module_1.open_lid()

    # Step 2: Heater-Shaker
    heater_shaker_module_1.close_labware_latch()
    heater_shaker_module_1.deactivate_heater()

DESIGNER_APPLICATION = """{"robot":{"model":"OT-3 Standard"},"designerApplication":{"name":"opentrons/protocol-designer","version":"8.10.0","data":{"pipetteTiprackAssignments":{"5677ca62-3b96-4eaf-bbd5-badd25b6dde5":["opentrons/opentrons_flex_96_filtertiprack_20ul/1"],"ba4f015c-f81b-4b15-ae3d-78b555902700":["opentrons/opentrons_flex_96_filtertiprack_1000ul/1"]},"dismissedWarnings":{"form":[],"timeline":[]},"ingredients":{"0":{"displayName":"f","displayColor":"#b925ff","liquidClass":"water","description":null,"liquidGroupId":"0"}},"ingredLocations":{"6818d423-e410-42c9-aafa-738a0964cf7a:opentrons/opentrons_24_aluminumblock_generic_2ml_screwcap/3":{"A1":{"0":{"volume":12}},"B1":{"0":{"volume":12}},"C1":{"0":{"volume":12}},"D1":{"0":{"volume":12}},"A2":{"0":{"volume":12}},"B2":{"0":{"volume":12}},"C2":{"0":{"volume":12}},"D2":{"0":{"volume":12}},"A3":{"0":{"volume":12}},"B3":{"0":{"volume":12}},"C3":{"0":{"volume":12}},"D3":{"0":{"volume":12}},"A4":{"0":{"volume":12}},"B4":{"0":{"volume":12}},"C4":{"0":{"volume":12}},"D4":{"0":{"volume":12}},"A5":{"0":{"volume":12}},"B5":{"0":{"volume":12}},"C5":{"0":{"volume":12}},"D5":{"0":{"volume":12}},"A6":{"0":{"volume":12}},"B6":{"0":{"volume":12}},"C6":{"0":{"volume":12}},"D6":{"0":{"volume":12}}}},"savedStepForms":{"__INITIAL_DECK_SETUP_STEP__":{"stepType":"manualIntervention","id":"__INITIAL_DECK_SETUP_STEP__","labwareLocationUpdate":{"39c3fc1f-18d5-44b5-b93e-e66086848117:opentrons/opentrons_flex_96_filtertiprack_20ul/1":"C3","7792dcbe-557e-4172-98b4-d6c478316cd4:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":"B2","64ef0bc1-355c-4218-aba5-e38e7f302857:opentrons/corning_384_wellplate_112ul_flat/5":"A3","6818d423-e410-42c9-aafa-738a0964cf7a:opentrons/opentrons_24_aluminumblock_generic_2ml_screwcap/3":"a6c022dd-076d-4e31-93c9-b6aec2353059:temperatureModuleType","b1c1aee7-bb48-4ec2-9dbc-abb71eebba3e:opentrons/opentrons_universal_flat_adapter_type_b/1":"52de89e7-b77b-44fc-bfd6-c2254c4fd733:heaterShakerModuleType","f71cdbb6-50f1-4003-81c9-8561c680a8da:opentrons/thermofisher_nunc_maxisorp_lockwell_elisa/1":"b1c1aee7-bb48-4ec2-9dbc-abb71eebba3e:opentrons/opentrons_universal_flat_adapter_type_b/1","77990549-c44a-4f5e-a3b3-ef5da0873e18:opentrons/opentrons_96_wellplate_200ul_pcr_full_skirt/4":"574a1f40-4512-42f1-a493-458c12abb818:thermocyclerModuleType"},"pipetteLocationUpdate":{"5677ca62-3b96-4eaf-bbd5-badd25b6dde5":"left","ba4f015c-f81b-4b15-ae3d-78b555902700":"right"},"moduleLocationUpdate":{"574a1f40-4512-42f1-a493-458c12abb818:thermocyclerModuleType":"B1","eb7905b0-692b-4d5a-9b8b-9ba3948bf715:flexStackerModuleType":"A4","a6c022dd-076d-4e31-93c9-b6aec2353059:temperatureModuleType":"C1","52de89e7-b77b-44fc-bfd6-c2254c4fd733:heaterShakerModuleType":"D1"},"moduleStateUpdate":{},"trashBinLocationUpdate":{},"wasteChuteLocationUpdate":{"2541ae7f-73bd-4d56-bdf1-15d749b4eb5e:wasteChute":"cutoutD3"},"stagingAreaLocationUpdate":{},"gripperLocationUpdate":{"cc4e61e2-b2df-44c8-856a-dfa118b0d805:gripper":"mounted"}},"b6c88739-1a10-4c82-ad26-90581b0c21cf":{"id":"b6c88739-1a10-4c82-ad26-90581b0c21cf","stepType":"thermocycler","stepName":"thermocycler","stepDetails":"","stepNumber":0,"blockIsActive":false,"blockTargetTemp":null,"lidIsActive":false,"lidOpen":true,"lidTargetTemp":null,"moduleId":"574a1f40-4512-42f1-a493-458c12abb818:thermocyclerModuleType","orderedProfileItems":[],"profileItemsById":{},"profileTargetLidTemp":null,"profileVolume":null,"thermocyclerFormType":"thermocyclerState"},"328ddea6-bca3-4e29-b936-c6bfd5b16d7a":{"id":"328ddea6-bca3-4e29-b936-c6bfd5b16d7a","stepType":"heaterShaker","stepName":"Heater-Shaker","stepDetails":"","stepNumber":0,"heaterShakerSetTimer":null,"heaterShakerTimer":null,"latchOpen":false,"moduleId":"52de89e7-b77b-44fc-bfd6-c2254c4fd733:heaterShakerModuleType","setHeaterShakerTemperature":null,"setShake":null,"targetHeaterShakerTemperature":null,"targetSpeed":null}},"orderedStepIds":["b6c88739-1a10-4c82-ad26-90581b0c21cf","328ddea6-bca3-4e29-b936-c6bfd5b16d7a"],"pipettes":{"5677ca62-3b96-4eaf-bbd5-badd25b6dde5":{"pipetteName":"p50_single_flex"},"ba4f015c-f81b-4b15-ae3d-78b555902700":{"pipetteName":"p1000_multi_flex"}},"modules":{"574a1f40-4512-42f1-a493-458c12abb818:thermocyclerModuleType":{"model":"thermocyclerModuleV2"},"eb7905b0-692b-4d5a-9b8b-9ba3948bf715:flexStackerModuleType":{"model":"flexStackerModuleV1"},"a6c022dd-076d-4e31-93c9-b6aec2353059:temperatureModuleType":{"model":"temperatureModuleV2"},"52de89e7-b77b-44fc-bfd6-c2254c4fd733:heaterShakerModuleType":{"model":"heaterShakerModuleV1"}},"labware":{"39c3fc1f-18d5-44b5-b93e-e66086848117:opentrons/opentrons_flex_96_filtertiprack_20ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 20 µL","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_20ul/1"},"7792dcbe-557e-4172-98b4-d6c478316cd4:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 1000 µL","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1"},"64ef0bc1-355c-4218-aba5-e38e7f302857:opentrons/corning_384_wellplate_112ul_flat/5":{"displayName":"Corning 384 Well Plate 112 µL Flat","labwareDefURI":"opentrons/corning_384_wellplate_112ul_flat/5"},"6818d423-e410-42c9-aafa-738a0964cf7a:opentrons/opentrons_24_aluminumblock_generic_2ml_screwcap/3":{"displayName":"Opentrons 24 Well Aluminum Block with Generic 2 mL Screwcap","labwareDefURI":"opentrons/opentrons_24_aluminumblock_generic_2ml_screwcap/3"},"b1c1aee7-bb48-4ec2-9dbc-abb71eebba3e:opentrons/opentrons_universal_flat_adapter_type_b/1":{"displayName":"Opentrons Universal Flat Heater-Shaker Adapter Type B","labwareDefURI":"opentrons/opentrons_universal_flat_adapter_type_b/1"},"f71cdbb6-50f1-4003-81c9-8561c680a8da:opentrons/thermofisher_nunc_maxisorp_lockwell_elisa/1":{"displayName":"ThermoFisher Nunc MaxiSorp Lockwell ELISA","labwareDefURI":"opentrons/thermofisher_nunc_maxisorp_lockwell_elisa/1"},"77990549-c44a-4f5e-a3b3-ef5da0873e18:opentrons/opentrons_96_wellplate_200ul_pcr_full_skirt/4":{"displayName":"Opentrons Tough 96 Well Plate 200 µL PCR Full Skirt","labwareDefURI":"opentrons/opentrons_96_wellplate_200ul_pcr_full_skirt/4"}}}},"metadata":{"protocolName":"single_eight_partial_tip_test","author":"","description":"","source":"Protocol Designer","created":1779481021862,"lastModified":1779481517372}}"""