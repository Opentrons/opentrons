from opentrons import protocol_api

metadata = {
    "created": "2025-10-07T21:33:15.538Z",
    "internalAppBuildDate": "Wed, 10 Dec 2025 20:21:11 GMT",
    "lastModified": "2025-12-11T19:04:16.481Z",
    "protocolDesigner": "8.7.0-alpha.4",
    "source": "Protocol Designer",
}

requirements = {"robotType": "Flex", "apiLevel": "2.27"}


def run(protocol: protocol_api.ProtocolContext) -> None:
    # Load Modules:
    thermocycler_module_1 = protocol.load_module("thermocyclerModuleV2", "B1")
    heater_shaker_module_1 = protocol.load_module("heaterShakerModuleV1", "C1")  # noqa: F841
    temperature_module_1 = protocol.load_module("temperatureModuleV2", "D1")

    # Load Adapters:
    aluminum_block_1 = temperature_module_1.load_adapter(
        "opentrons_96_well_aluminum_block",
        namespace="opentrons",
        version=1,
    )

    # Load Lid Stacks:
    lid_stack_B2 = protocol.load_lid_stack(  # noqa: F841
        load_name="opentrons_tough_universal_lid",
        location="B2",
        quantity=2,
    )
    lid_stack_A2 = protocol.load_lid_stack(  # noqa: F841
        load_name="corning_96_wellplate_360ul_lid",
        location="A2",
        quantity=1,
    )
    lid_stack_A3 = protocol.load_lid_stack(  # noqa: F841
        load_name="opentrons_tough_pcr_auto_sealing_lid",
        location="A3",
        quantity=1,
    )
    lid_stack_B3 = protocol.load_lid_stack(  # noqa: F841
        load_name="ibidi_96_square_well_plate_300ul_lid",
        location="B3",
        quantity=1,
    )
    lid_stack_C3 = protocol.load_lid_stack(  # noqa: F841
        load_name="black_96_well_microtiter_plate_lid",
        location="C3",
        quantity=3,
    )

    # Load Labware:
    tip_rack_1 = protocol.load_labware(  # noqa: F841
        "opentrons_flex_96_filtertiprack_1000ul",
        location="C2",
        namespace="opentrons",
        version=1,
    )
    well_plate_1 = thermocycler_module_1.load_labware(  # noqa: F841
        "opentrons_96_wellplate_200ul_pcr_full_skirt",
        namespace="opentrons",
        version=4,
    )
    well_plate_2 = aluminum_block_1.load_labware(  # noqa: F841
        "opentrons_96_wellplate_200ul_pcr_full_skirt",
        namespace="opentrons",
        version=4,
    )
    reservoir_1 = protocol.load_labware(  # noqa: F841
        "opentrons_tough_12_reservoir_22ml",
        location="D2",
        namespace="opentrons",
        version=1,
    )

    # Load Pipettes:
    pipette_left = protocol.load_instrument("flex_1channel_1000", "left")  # noqa: F841

    # Load Waste Chute:
    waste_chute = protocol.load_waste_chute()  # noqa: F841

    # PROTOCOL STEPS

    # Step 1: thermocycler
    thermocycler_module_1.open_lid()


DESIGNER_APPLICATION = """{"robot":{"model":"OT-3 Standard"},"designerApplication":{"name":"opentrons/protocol-designer","version":"8.7.0","data":{"pipetteTiprackAssignments":{"0af6e6aa-5ef2-43ea-bc2d-8bdd5c2707c0":["opentrons/opentrons_flex_96_filtertiprack_1000ul/1"]},"dismissedWarnings":{"form":[],"timeline":[]},"ingredients":{},"ingredLocations":{},"savedStepForms":{"__INITIAL_DECK_SETUP_STEP__":{"stepType":"manualIntervention","id":"__INITIAL_DECK_SETUP_STEP__","labwareLocationUpdate":{"d18630da-6641-4f14-b579-fbe2f2b6cda7:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":"C2","03419658-0140-4b6f-8dcb-a043b2762361:opentrons/opentrons_tough_universal_lid/2":"B2","eba6237a-ca68-4c8b-a91f-1c1f0cd9559f:opentrons/opentrons_tough_universal_lid/2":"03419658-0140-4b6f-8dcb-a043b2762361:opentrons/opentrons_tough_universal_lid/2","05c61e29-92ce-4f38-aecd-92780ed26702:opentrons/corning_96_wellplate_360ul_lid/1":"A2","4e5e7955-db4a-48e8-af18-5da6089af7ac:opentrons/opentrons_tough_pcr_auto_sealing_lid/2":"A3","8b586026-ce7d-48b6-9325-16dafd1da6e1:opentrons/opentrons_96_wellplate_200ul_pcr_full_skirt/4":"25bbe30c-4158-43a7-9e4e-f24e454dd881:thermocyclerModuleType","201494ef-a588-4fd1-b7d6-81498103475e:opentrons/ibidi_96_square_well_plate_300ul_lid/1":"B3","524eccfe-5df6-42f2-aa01-43349489a681:opentrons/black_96_well_microtiter_plate_lid/1":"C3","bcedb3fa-bc20-432d-961e-7d546aebf8b9:opentrons/black_96_well_microtiter_plate_lid/1":"524eccfe-5df6-42f2-aa01-43349489a681:opentrons/black_96_well_microtiter_plate_lid/1","66dde74e-dfe5-492b-bb25-7159574adc0d:opentrons/black_96_well_microtiter_plate_lid/1":"bcedb3fa-bc20-432d-961e-7d546aebf8b9:opentrons/black_96_well_microtiter_plate_lid/1","3efe6509-3633-46a0-a220-be4253e31152:opentrons/opentrons_96_well_aluminum_block/1":"bfbaaf15-eb1b-4cf4-8d63-ba9026efa137:temperatureModuleType","6dd4a3e0-c72b-4d1b-a7e1-f06d9e091874:opentrons/opentrons_96_wellplate_200ul_pcr_full_skirt/4":"3efe6509-3633-46a0-a220-be4253e31152:opentrons/opentrons_96_well_aluminum_block/1","d9fb1ee0-701f-4bb7-8521-5d39d469c565:opentrons/opentrons_tough_12_reservoir_22ml/1":"D2"},"pipetteLocationUpdate":{"0af6e6aa-5ef2-43ea-bc2d-8bdd5c2707c0":"left"},"moduleLocationUpdate":{"25bbe30c-4158-43a7-9e4e-f24e454dd881:thermocyclerModuleType":"B1","38588a89-69a7-4aaa-9012-e342804e3bfb:heaterShakerModuleType":"C1","bfbaaf15-eb1b-4cf4-8d63-ba9026efa137:temperatureModuleType":"D1"},"trashBinLocationUpdate":{},"wasteChuteLocationUpdate":{"9917c332-1745-47d4-b5c8-0e290035c0f0:wasteChute":"cutoutD3"},"stagingAreaLocationUpdate":{},"gripperLocationUpdate":{"557663d2-22e1-4cf6-bc1e-be55b59fdedc:gripper":"mounted"}},"8275329d-43b6-40ee-bbed-e84d87d799ee":{"blockIsActive":false,"blockIsActiveHold":false,"blockTargetTemp":null,"blockTargetTempHold":null,"lidIsActive":false,"lidIsActiveHold":false,"lidOpen":true,"lidOpenHold":null,"lidTargetTemp":"","lidTargetTempHold":null,"moduleId":"25bbe30c-4158-43a7-9e4e-f24e454dd881:thermocyclerModuleType","orderedProfileItems":[],"profileItemsById":{},"profileTargetLidTemp":null,"profileVolume":null,"thermocyclerFormType":"thermocyclerState","id":"8275329d-43b6-40ee-bbed-e84d87d799ee","stepType":"thermocycler","stepName":"thermocycler","stepDetails":"","stepNumber":0}},"orderedStepIds":["8275329d-43b6-40ee-bbed-e84d87d799ee"],"pipettes":{"0af6e6aa-5ef2-43ea-bc2d-8bdd5c2707c0":{"pipetteName":"p1000_single_flex"}},"modules":{"25bbe30c-4158-43a7-9e4e-f24e454dd881:thermocyclerModuleType":{"model":"thermocyclerModuleV2"},"38588a89-69a7-4aaa-9012-e342804e3bfb:heaterShakerModuleType":{"model":"heaterShakerModuleV1"},"bfbaaf15-eb1b-4cf4-8d63-ba9026efa137:temperatureModuleType":{"model":"temperatureModuleV2"}},"labware":{"d18630da-6641-4f14-b579-fbe2f2b6cda7:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 1000 µL","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1"},"03419658-0140-4b6f-8dcb-a043b2762361:opentrons/opentrons_tough_universal_lid/2":{"displayName":"Opentrons Tough Universal Lid","labwareDefURI":"opentrons/opentrons_tough_universal_lid/2"},"eba6237a-ca68-4c8b-a91f-1c1f0cd9559f:opentrons/opentrons_tough_universal_lid/2":{"displayName":"Opentrons Tough Universal Lid","labwareDefURI":"opentrons/opentrons_tough_universal_lid/2"},"05c61e29-92ce-4f38-aecd-92780ed26702:opentrons/corning_96_wellplate_360ul_lid/1":{"displayName":"Corning 96 Wellplate 360ul Lid","labwareDefURI":"opentrons/corning_96_wellplate_360ul_lid/1"},"4e5e7955-db4a-48e8-af18-5da6089af7ac:opentrons/opentrons_tough_pcr_auto_sealing_lid/2":{"displayName":"Opentrons Tough PCR Auto-Sealing Lid","labwareDefURI":"opentrons/opentrons_tough_pcr_auto_sealing_lid/2"},"8b586026-ce7d-48b6-9325-16dafd1da6e1:opentrons/opentrons_96_wellplate_200ul_pcr_full_skirt/4":{"displayName":"Opentrons Tough 96 Well Plate 200 µL PCR Full Skirt","labwareDefURI":"opentrons/opentrons_96_wellplate_200ul_pcr_full_skirt/4"},"201494ef-a588-4fd1-b7d6-81498103475e:opentrons/ibidi_96_square_well_plate_300ul_lid/1":{"displayName":"ibidi 96 Square Well Flat Bottom Plate 300 µL Lid","labwareDefURI":"opentrons/ibidi_96_square_well_plate_300ul_lid/1"},"524eccfe-5df6-42f2-aa01-43349489a681:opentrons/black_96_well_microtiter_plate_lid/1":{"displayName":"Black 96-well Microtiter Plate Lid","labwareDefURI":"opentrons/black_96_well_microtiter_plate_lid/1"},"bcedb3fa-bc20-432d-961e-7d546aebf8b9:opentrons/black_96_well_microtiter_plate_lid/1":{"displayName":"Black 96-well Microtiter Plate Lid","labwareDefURI":"opentrons/black_96_well_microtiter_plate_lid/1"},"66dde74e-dfe5-492b-bb25-7159574adc0d:opentrons/black_96_well_microtiter_plate_lid/1":{"displayName":"Black 96-well Microtiter Plate Lid","labwareDefURI":"opentrons/black_96_well_microtiter_plate_lid/1"},"3efe6509-3633-46a0-a220-be4253e31152:opentrons/opentrons_96_well_aluminum_block/1":{"displayName":"Opentrons 96 Well Aluminum Block","labwareDefURI":"opentrons/opentrons_96_well_aluminum_block/1"},"6dd4a3e0-c72b-4d1b-a7e1-f06d9e091874:opentrons/opentrons_96_wellplate_200ul_pcr_full_skirt/4":{"displayName":"Opentrons Tough 96 Well Plate 200 µL PCR Full Skirt","labwareDefURI":"opentrons/opentrons_96_wellplate_200ul_pcr_full_skirt/4"},"d9fb1ee0-701f-4bb7-8521-5d39d469c565:opentrons/opentrons_tough_12_reservoir_22ml/1":{"displayName":"Opentrons Tough 22mL 12 Well Reservoir","labwareDefURI":"opentrons/opentrons_tough_12_reservoir_22ml/1"}}}},"metadata":{"protocolName":"","author":"","description":"","source":"Protocol Designer","created":1759872795538,"lastModified":1765479856481}}"""  # noqa: E501
