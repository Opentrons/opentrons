import json
from opentrons import protocol_api, types

metadata = {
    "protocolName": "flex_S_871_Lids",
    "created": "2025-10-07T21:33:15.538Z",
    "internalAppBuildDate": "Fri, 23 Jan 2026 20:05:49 GMT",
    "lastModified": "2026-01-26T19:57:34.533Z",
    "protocolDesigner": "8.8.0-alpha.7",
    "source": "Protocol Designer",
}

requirements = {"robotType": "Flex", "apiLevel": "2.27"}

def run(protocol: protocol_api.ProtocolContext) -> None:
    # Load Modules:
    thermocycler_module_1 = protocol.load_module("thermocyclerModuleV2", "B1")
    heater_shaker_module_1 = protocol.load_module("heaterShakerModuleV1", "C1")
    temperature_module_1 = protocol.load_module("temperatureModuleV2", "D1")

    # Load Lid Stacks:
    lid_stack_B2 = protocol.load_lid_stack(
        load_name="opentrons_tough_universal_lid",
        location="B2",
        quantity=2,
    )
    lid_stack_A2 = protocol.load_lid_stack(
        load_name="corning_96_wellplate_360ul_lid",
        location="A2",
        quantity=1,
    )
    lid_stack_B3 = protocol.load_lid_stack(
        load_name="opentrons_tough_pcr_auto_sealing_lid",
        location="B3",
        quantity=2,
    )
    lid_stack_A3 = protocol.load_lid_stack(
        load_name="ibidi_96_square_well_plate_300ul_lid",
        location="A3",
        quantity=2,
    )
    lid_stack_C2 = protocol.load_lid_stack(
        load_name="black_96_well_microtiter_plate_lid",
        location="C2",
        quantity=1,
    )

    # Load Labware:
    well_plate_1 = thermocycler_module_1.load_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt",
        namespace="opentrons",
        version=4,
    )
    tip_rack_1 = protocol.load_labware(
        "opentrons_flex_96_filtertiprack_1000ul",
        location="C3",
        namespace="opentrons",
        version=1,
        lid="opentrons_flex_tiprack_lid",
        lid_namespace="opentrons",
        lid_version=1,
    )

    # Load Pipettes:
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
        volume=123,
    )

    # PROTOCOL STEPS

    # Step 1: thermocycler
    thermocycler_module_1.open_lid()

    # Step 2: move
    protocol.move_lid("B2", waste_chute, use_gripper=True)

    # Step 3: move
    protocol.move_lid("B3", well_plate_1, use_gripper=True)

    # Step 4: move
    protocol.move_lid(well_plate_1, protocol_api.OFF_DECK)

    # Step 5: move
    protocol.move_lid("B3", lid_7, use_gripper=True)

    # Step 6: move
    protocol.move_lid("A3", waste_chute, use_gripper=True)

    # Step 7: move
    protocol.move_lid("A3", waste_chute, use_gripper=True)

    # Step 8: move
    protocol.move_lid(tip_rack_1, waste_chute, use_gripper=True)

DESIGNER_APPLICATION = """{"robot":{"model":"OT-3 Standard"},"designerApplication":{"name":"opentrons/protocol-designer","version":"8.8.0","data":{"pipetteTiprackAssignments":{"0af6e6aa-5ef2-43ea-bc2d-8bdd5c2707c0":["opentrons/opentrons_flex_96_filtertiprack_1000ul/1"]},"dismissedWarnings":{"form":[],"timeline":[]},"ingredients":{"0":{"displayName":"f","displayColor":"#b925ff","description":null,"liquidGroupId":"0"}},"ingredLocations":{"8b586026-ce7d-48b6-9325-16dafd1da6e1:opentrons/opentrons_96_wellplate_200ul_pcr_full_skirt/4":{"A1":{"0":{"volume":123}},"B1":{"0":{"volume":123}},"C1":{"0":{"volume":123}},"D1":{"0":{"volume":123}},"E1":{"0":{"volume":123}},"F1":{"0":{"volume":123}},"G1":{"0":{"volume":123}},"H1":{"0":{"volume":123}},"A2":{"0":{"volume":123}},"B2":{"0":{"volume":123}},"C2":{"0":{"volume":123}},"D2":{"0":{"volume":123}},"E2":{"0":{"volume":123}},"F2":{"0":{"volume":123}},"G2":{"0":{"volume":123}},"H2":{"0":{"volume":123}},"A3":{"0":{"volume":123}},"B3":{"0":{"volume":123}},"C3":{"0":{"volume":123}},"D3":{"0":{"volume":123}},"E3":{"0":{"volume":123}},"F3":{"0":{"volume":123}},"G3":{"0":{"volume":123}},"H3":{"0":{"volume":123}},"A4":{"0":{"volume":123}},"B4":{"0":{"volume":123}},"C4":{"0":{"volume":123}},"D4":{"0":{"volume":123}},"E4":{"0":{"volume":123}},"F4":{"0":{"volume":123}},"G4":{"0":{"volume":123}},"H4":{"0":{"volume":123}},"A5":{"0":{"volume":123}},"B5":{"0":{"volume":123}},"C5":{"0":{"volume":123}},"D5":{"0":{"volume":123}},"E5":{"0":{"volume":123}},"F5":{"0":{"volume":123}},"G5":{"0":{"volume":123}},"H5":{"0":{"volume":123}},"A6":{"0":{"volume":123}},"B6":{"0":{"volume":123}},"C6":{"0":{"volume":123}},"D6":{"0":{"volume":123}},"E6":{"0":{"volume":123}},"F6":{"0":{"volume":123}},"G6":{"0":{"volume":123}},"H6":{"0":{"volume":123}},"A7":{"0":{"volume":123}},"B7":{"0":{"volume":123}},"C7":{"0":{"volume":123}},"D7":{"0":{"volume":123}},"E7":{"0":{"volume":123}},"F7":{"0":{"volume":123}},"G7":{"0":{"volume":123}},"H7":{"0":{"volume":123}},"A8":{"0":{"volume":123}},"B8":{"0":{"volume":123}},"C8":{"0":{"volume":123}},"D8":{"0":{"volume":123}},"E8":{"0":{"volume":123}},"F8":{"0":{"volume":123}},"G8":{"0":{"volume":123}},"H8":{"0":{"volume":123}},"A9":{"0":{"volume":123}},"B9":{"0":{"volume":123}},"C9":{"0":{"volume":123}},"D9":{"0":{"volume":123}},"E9":{"0":{"volume":123}},"F9":{"0":{"volume":123}},"G9":{"0":{"volume":123}},"H9":{"0":{"volume":123}},"A10":{"0":{"volume":123}},"B10":{"0":{"volume":123}},"C10":{"0":{"volume":123}},"D10":{"0":{"volume":123}},"E10":{"0":{"volume":123}},"F10":{"0":{"volume":123}},"G10":{"0":{"volume":123}},"H10":{"0":{"volume":123}},"A11":{"0":{"volume":123}},"B11":{"0":{"volume":123}},"C11":{"0":{"volume":123}},"D11":{"0":{"volume":123}},"E11":{"0":{"volume":123}},"F11":{"0":{"volume":123}},"G11":{"0":{"volume":123}},"H11":{"0":{"volume":123}},"A12":{"0":{"volume":123}},"B12":{"0":{"volume":123}},"C12":{"0":{"volume":123}},"D12":{"0":{"volume":123}},"E12":{"0":{"volume":123}},"F12":{"0":{"volume":123}},"G12":{"0":{"volume":123}},"H12":{"0":{"volume":123}}}},"savedStepForms":{"__INITIAL_DECK_SETUP_STEP__":{"stepType":"manualIntervention","id":"__INITIAL_DECK_SETUP_STEP__","labwareLocationUpdate":{"03419658-0140-4b6f-8dcb-a043b2762361:opentrons/opentrons_tough_universal_lid/2":"B2","eba6237a-ca68-4c8b-a91f-1c1f0cd9559f:opentrons/opentrons_tough_universal_lid/2":"03419658-0140-4b6f-8dcb-a043b2762361:opentrons/opentrons_tough_universal_lid/2","05c61e29-92ce-4f38-aecd-92780ed26702:opentrons/corning_96_wellplate_360ul_lid/1":"A2","4e5e7955-db4a-48e8-af18-5da6089af7ac:opentrons/opentrons_tough_pcr_auto_sealing_lid/2":"B3","8b586026-ce7d-48b6-9325-16dafd1da6e1:opentrons/opentrons_96_wellplate_200ul_pcr_full_skirt/4":"25bbe30c-4158-43a7-9e4e-f24e454dd881:thermocyclerModuleType","201494ef-a588-4fd1-b7d6-81498103475e:opentrons/ibidi_96_square_well_plate_300ul_lid/1":"A3","524eccfe-5df6-42f2-aa01-43349489a681:opentrons/black_96_well_microtiter_plate_lid/1":"C2","cf4052c6-33ea-4881-bf45-9df4a5790c73:opentrons/opentrons_tough_pcr_auto_sealing_lid/2":"4e5e7955-db4a-48e8-af18-5da6089af7ac:opentrons/opentrons_tough_pcr_auto_sealing_lid/2","00e6dcf3-fafe-4044-8aff-f0b45b15b5fd:opentrons/ibidi_96_square_well_plate_300ul_lid/1":"201494ef-a588-4fd1-b7d6-81498103475e:opentrons/ibidi_96_square_well_plate_300ul_lid/1","c917d151-c454-4e57-9487-7a0e02cdfa7d:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":"C3","7b6a78f1-f297-461d-91a1-81dcb489347e:opentrons/opentrons_flex_tiprack_lid/1":"c917d151-c454-4e57-9487-7a0e02cdfa7d:opentrons/opentrons_flex_96_filtertiprack_1000ul/1"},"pipetteLocationUpdate":{"0af6e6aa-5ef2-43ea-bc2d-8bdd5c2707c0":"left"},"moduleLocationUpdate":{"25bbe30c-4158-43a7-9e4e-f24e454dd881:thermocyclerModuleType":"B1","38588a89-69a7-4aaa-9012-e342804e3bfb:heaterShakerModuleType":"C1","bfbaaf15-eb1b-4cf4-8d63-ba9026efa137:temperatureModuleType":"D1"},"trashBinLocationUpdate":{},"wasteChuteLocationUpdate":{"9917c332-1745-47d4-b5c8-0e290035c0f0:wasteChute":"cutoutD3"},"stagingAreaLocationUpdate":{},"gripperLocationUpdate":{"557663d2-22e1-4cf6-bc1e-be55b59fdedc:gripper":"mounted"},"moduleStateUpdate":{}},"8275329d-43b6-40ee-bbed-e84d87d799ee":{"blockIsActive":false,"blockIsActiveHold":false,"blockTargetTemp":null,"blockTargetTempHold":null,"lidIsActive":false,"lidIsActiveHold":false,"lidOpen":true,"lidOpenHold":null,"lidTargetTemp":"","lidTargetTempHold":null,"moduleId":"25bbe30c-4158-43a7-9e4e-f24e454dd881:thermocyclerModuleType","orderedProfileItems":[],"profileItemsById":{},"profileTargetLidTemp":null,"profileVolume":null,"thermocyclerFormType":"thermocyclerState","id":"8275329d-43b6-40ee-bbed-e84d87d799ee","stepType":"thermocycler","stepName":"thermocycler","stepDetails":"","stepNumber":0},"4b8ddc6f-2beb-43ee-954c-1920e7094895":{"labware":"eba6237a-ca68-4c8b-a91f-1c1f0cd9559f:opentrons/opentrons_tough_universal_lid/2","newLocation":"cutoutD3","useGripper":true,"id":"4b8ddc6f-2beb-43ee-954c-1920e7094895","stepType":"moveLabware","stepName":"move","stepDetails":"","stepNumber":0},"79e41998-5811-4afb-a9fa-bd3be7a1d2b2":{"labware":"cf4052c6-33ea-4881-bf45-9df4a5790c73:opentrons/opentrons_tough_pcr_auto_sealing_lid/2","newLocation":"8b586026-ce7d-48b6-9325-16dafd1da6e1:opentrons/opentrons_96_wellplate_200ul_pcr_full_skirt/4","useGripper":true,"id":"79e41998-5811-4afb-a9fa-bd3be7a1d2b2","stepType":"moveLabware","stepName":"move","stepDetails":"","stepNumber":0},"687f902f-bd3b-4ee6-8b5c-9bfc54f841cc":{"labware":"cf4052c6-33ea-4881-bf45-9df4a5790c73:opentrons/opentrons_tough_pcr_auto_sealing_lid/2","newLocation":"offDeck","useGripper":false,"id":"687f902f-bd3b-4ee6-8b5c-9bfc54f841cc","stepType":"moveLabware","stepName":"move","stepDetails":"","stepNumber":0},"b50f0e2b-99ad-4c8a-835e-ce46564daf35":{"labware":"4e5e7955-db4a-48e8-af18-5da6089af7ac:opentrons/opentrons_tough_pcr_auto_sealing_lid/2","newLocation":"cf4052c6-33ea-4881-bf45-9df4a5790c73:opentrons/opentrons_tough_pcr_auto_sealing_lid/2","useGripper":true,"id":"b50f0e2b-99ad-4c8a-835e-ce46564daf35","stepType":"moveLabware","stepName":"move","stepDetails":"","stepNumber":0},"65be5782-309d-49bf-afbd-145608900b3a":{"labware":"00e6dcf3-fafe-4044-8aff-f0b45b15b5fd:opentrons/ibidi_96_square_well_plate_300ul_lid/1","newLocation":"cutoutD3","useGripper":true,"id":"65be5782-309d-49bf-afbd-145608900b3a","stepType":"moveLabware","stepName":"move","stepDetails":"","stepNumber":0},"b41ad7c1-5e29-4b30-8226-4f6ba320879b":{"labware":"201494ef-a588-4fd1-b7d6-81498103475e:opentrons/ibidi_96_square_well_plate_300ul_lid/1","newLocation":"cutoutD3","useGripper":true,"id":"b41ad7c1-5e29-4b30-8226-4f6ba320879b","stepType":"moveLabware","stepName":"move","stepDetails":"","stepNumber":0},"82dabf89-f4f0-4d99-9675-0eb476b5d9ff":{"labware":"7b6a78f1-f297-461d-91a1-81dcb489347e:opentrons/opentrons_flex_tiprack_lid/1","newLocation":"cutoutD3","useGripper":true,"id":"82dabf89-f4f0-4d99-9675-0eb476b5d9ff","stepType":"moveLabware","stepName":"move","stepDetails":"","stepNumber":0}},"orderedStepIds":["8275329d-43b6-40ee-bbed-e84d87d799ee","4b8ddc6f-2beb-43ee-954c-1920e7094895","79e41998-5811-4afb-a9fa-bd3be7a1d2b2","687f902f-bd3b-4ee6-8b5c-9bfc54f841cc","b50f0e2b-99ad-4c8a-835e-ce46564daf35","65be5782-309d-49bf-afbd-145608900b3a","b41ad7c1-5e29-4b30-8226-4f6ba320879b","82dabf89-f4f0-4d99-9675-0eb476b5d9ff"],"pipettes":{"0af6e6aa-5ef2-43ea-bc2d-8bdd5c2707c0":{"pipetteName":"p1000_single_flex"}},"modules":{"25bbe30c-4158-43a7-9e4e-f24e454dd881:thermocyclerModuleType":{"model":"thermocyclerModuleV2"},"38588a89-69a7-4aaa-9012-e342804e3bfb:heaterShakerModuleType":{"model":"heaterShakerModuleV1"},"bfbaaf15-eb1b-4cf4-8d63-ba9026efa137:temperatureModuleType":{"model":"temperatureModuleV2"}},"labware":{"03419658-0140-4b6f-8dcb-a043b2762361:opentrons/opentrons_tough_universal_lid/2":{"displayName":"Opentrons Tough Universal Lid","labwareDefURI":"opentrons/opentrons_tough_universal_lid/2"},"eba6237a-ca68-4c8b-a91f-1c1f0cd9559f:opentrons/opentrons_tough_universal_lid/2":{"displayName":"Opentrons Tough Universal Lid","labwareDefURI":"opentrons/opentrons_tough_universal_lid/2"},"05c61e29-92ce-4f38-aecd-92780ed26702:opentrons/corning_96_wellplate_360ul_lid/1":{"displayName":"Corning 96 Wellplate 360ul Lid","labwareDefURI":"opentrons/corning_96_wellplate_360ul_lid/1"},"4e5e7955-db4a-48e8-af18-5da6089af7ac:opentrons/opentrons_tough_pcr_auto_sealing_lid/2":{"displayName":"Opentrons Tough PCR Auto-Sealing Lid","labwareDefURI":"opentrons/opentrons_tough_pcr_auto_sealing_lid/2"},"8b586026-ce7d-48b6-9325-16dafd1da6e1:opentrons/opentrons_96_wellplate_200ul_pcr_full_skirt/4":{"displayName":"Opentrons Tough 96 Well Plate 200 µL PCR Full Skirt","labwareDefURI":"opentrons/opentrons_96_wellplate_200ul_pcr_full_skirt/4"},"201494ef-a588-4fd1-b7d6-81498103475e:opentrons/ibidi_96_square_well_plate_300ul_lid/1":{"displayName":"ibidi 96 Square Well Flat Bottom Plate 300 µL Lid","labwareDefURI":"opentrons/ibidi_96_square_well_plate_300ul_lid/1"},"524eccfe-5df6-42f2-aa01-43349489a681:opentrons/black_96_well_microtiter_plate_lid/1":{"displayName":"Black 96-well Microtiter Plate Lid","labwareDefURI":"opentrons/black_96_well_microtiter_plate_lid/1"},"cf4052c6-33ea-4881-bf45-9df4a5790c73:opentrons/opentrons_tough_pcr_auto_sealing_lid/2":{"displayName":"Opentrons Tough PCR Auto-Sealing Lid","labwareDefURI":"opentrons/opentrons_tough_pcr_auto_sealing_lid/2"},"00e6dcf3-fafe-4044-8aff-f0b45b15b5fd:opentrons/ibidi_96_square_well_plate_300ul_lid/1":{"displayName":"ibidi 96 Square Well Flat Bottom Plate 300 µL Lid","labwareDefURI":"opentrons/ibidi_96_square_well_plate_300ul_lid/1"},"c917d151-c454-4e57-9487-7a0e02cdfa7d:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 1000 µL","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1"},"7b6a78f1-f297-461d-91a1-81dcb489347e:opentrons/opentrons_flex_tiprack_lid/1":{"displayName":"Opentrons Flex Tip Rack Lid","labwareDefURI":"opentrons/opentrons_flex_tiprack_lid/1"}}}},"metadata":{"protocolName":"flex_S_871_Lids","author":"","description":"","source":"Protocol Designer","created":1759872795538,"lastModified":1769457454533}}"""
