from opentrons import protocol_api

metadata = {
    "protocolName": "96_channel_9_0_1_regressions_setup",
    "created": "2026-05-22T21:15:40.987Z",
    "internalAppBuildDate": "Tue, 28 Jul 2026 16:19:38 GMT",
    "lastModified": "2026-07-29T17:05:06.880Z",
    "protocolDesigner": "9.0.1-alpha.0",
    "source": "Protocol Designer",
    "description": "PD 9.0.1 regressions: NEST 8 + Flex 20 uL filter/unfiltered tipracks with stacker (p200_96)",
}

requirements = {"robotType": "Flex", "apiLevel": "2.29"}


def run(protocol: protocol_api.ProtocolContext) -> None:
    # Load Modules:
    flex_stacker_module_1 = protocol.load_module("flexStackerModuleV1", "A4")
    magnetic_block_1 = protocol.load_module("magneticBlockV1", "C1")

    # Load Labware:
    well_plate_1 = protocol.load_labware(  # noqa: F841
        "appliedbiosystemsmicroamp_384_wellplate_40ul",
        location="A2",
        namespace="opentrons",
        version=3,
    )
    well_plate_2 = magnetic_block_1.load_labware(  # noqa: F841
        "nest_96_wellplate_2ml_deep",
        namespace="opentrons",
        version=5,
    )
    reservoir_8 = protocol.load_labware(  # noqa: F841
        "nest_8_reservoir_22ml",
        location="C2",
        namespace="opentrons",
        version=2,
    )
    tip_rack_filter_20_deck = protocol.load_labware(  # noqa: F841
        "opentrons_flex_96_filtertiprack_20ul",
        location="B2",
        namespace="opentrons",
        version=1,
    )
    tip_rack_20 = protocol.load_labware(  # noqa: F841
        "opentrons_flex_96_tiprack_20ul",
        location="B3",
        namespace="opentrons",
        version=1,
    )
    tip_rack_filter_20_stack = protocol.load_labware(
        "opentrons_flex_96_filtertiprack_20ul",
        location=protocol_api.OFF_DECK,
        label="Opentrons Flex 96 Filter Tip Rack 20 µL (1)",
        namespace="opentrons",
        version=1,
    )

    # Load Pipettes:
    pipette = protocol.load_instrument("flex_96channel_200")  # noqa: F841

    # Load Waste Chute:
    waste_chute = protocol.load_waste_chute()  # noqa: F841

    # Set Stored Labware:
    flex_stacker_module_1.set_stored_labware_items(
        labware=[tip_rack_filter_20_stack],
    )

    # PROTOCOL STEPS


DESIGNER_APPLICATION = """{"robot":{"model":"OT-3 Standard"},"designerApplication":{"name":"opentrons/protocol-designer","version":"9.0.1","data":{"pipetteTiprackAssignments":{"3dcd11e1-baf5-4680-994b-c2969eece003":["opentrons/opentrons_flex_96_filtertiprack_20ul/1","opentrons/opentrons_flex_96_tiprack_20ul/1"]},"dismissedWarnings":{"form":[],"timeline":[]},"ingredients":{},"ingredLocations":{},"savedStepForms":{"__INITIAL_DECK_SETUP_STEP__":{"stepType":"manualIntervention","id":"__INITIAL_DECK_SETUP_STEP__","labwareLocationUpdate":{"caeb3403-bc36-43f0-ab97-6bc13d35fe83:opentrons/appliedbiosystemsmicroamp_384_wellplate_40ul/3":"A2","5ca8fee7-192e-4deb-a93f-6685a7c799b3:opentrons/nest_96_wellplate_2ml_deep/5":"50f97f25-b7f6-4f62-aa30-9eedd11e44f4:magneticBlockType","981c2c1a-388e-4989-aa0a-357cf4bcb7ee:opentrons/opentrons_flex_96_filtertiprack_20ul/1":"4d05b912-3662-45eb-9a8f-04e9ebeb1bf1:flexStackerModuleType","ca091b2b-2d97-4a3a-817d-81fdec654400:opentrons/opentrons_flex_96_filtertiprack_20ul/1":"B2","2e5b9474-7cb9-4363-809f-256301947e2f:opentrons/opentrons_flex_96_tiprack_20ul/1":"B3","70f2193b-88c2-41cc-8a26-4e52b82a21b0:opentrons/nest_8_reservoir_22ml/2":"C2"},"pipetteLocationUpdate":{"3dcd11e1-baf5-4680-994b-c2969eece003":"left"},"moduleLocationUpdate":{"4d05b912-3662-45eb-9a8f-04e9ebeb1bf1:flexStackerModuleType":"A4","50f97f25-b7f6-4f62-aa30-9eedd11e44f4:magneticBlockType":"C1"},"moduleStateUpdate":{"4d05b912-3662-45eb-9a8f-04e9ebeb1bf1:flexStackerModuleType":{"type":"flexStackerModuleType","storedLabwareDetails":{"primaryLabwareURI":"opentrons/opentrons_flex_96_filtertiprack_20ul/1","adapterLabwareURI":null,"lidLabwareURI":null},"labwareInHopper":[{"primaryLabwareId":"981c2c1a-388e-4989-aa0a-357cf4bcb7ee:opentrons/opentrons_flex_96_filtertiprack_20ul/1","adapterLabwareId":null,"lidLabwareId":null}],"labwareOnShuttle":null,"setStoredLabwareCount":1,"fillCount":1}},"trashBinLocationUpdate":{},"wasteChuteLocationUpdate":{"15048e77-7fe1-4046-bcc3-4f5b58799c4d:wasteChute":"cutoutD3"},"stagingAreaLocationUpdate":{},"gripperLocationUpdate":{"ce89732c-8140-4115-aa2f-4945e96f5e35:gripper":"mounted"}}},"orderedStepIds":[],"pipettes":{"3dcd11e1-baf5-4680-994b-c2969eece003":{"pipetteName":"p200_96"}},"modules":{"4d05b912-3662-45eb-9a8f-04e9ebeb1bf1:flexStackerModuleType":{"model":"flexStackerModuleV1"},"50f97f25-b7f6-4f62-aa30-9eedd11e44f4:magneticBlockType":{"model":"magneticBlockV1"}},"labware":{"caeb3403-bc36-43f0-ab97-6bc13d35fe83:opentrons/appliedbiosystemsmicroamp_384_wellplate_40ul/3":{"displayName":"Applied Biosystems MicroAmp 384 Well Plate 40 µL","labwareDefURI":"opentrons/appliedbiosystemsmicroamp_384_wellplate_40ul/3"},"5ca8fee7-192e-4deb-a93f-6685a7c799b3:opentrons/nest_96_wellplate_2ml_deep/5":{"displayName":"NEST 96 Deep Well Plate 2 mL","labwareDefURI":"opentrons/nest_96_wellplate_2ml_deep/5"},"981c2c1a-388e-4989-aa0a-357cf4bcb7ee:opentrons/opentrons_flex_96_filtertiprack_20ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 20 µL (1)","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_20ul/1"},"ca091b2b-2d97-4a3a-817d-81fdec654400:opentrons/opentrons_flex_96_filtertiprack_20ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 20 µL","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_20ul/1"},"2e5b9474-7cb9-4363-809f-256301947e2f:opentrons/opentrons_flex_96_tiprack_20ul/1":{"displayName":"Opentrons Flex 96 Tip Rack 20 µL","labwareDefURI":"opentrons/opentrons_flex_96_tiprack_20ul/1"},"70f2193b-88c2-41cc-8a26-4e52b82a21b0:opentrons/nest_8_reservoir_22ml/2":{"displayName":"NEST 8 Well Reservoir 22 mL","labwareDefURI":"opentrons/nest_8_reservoir_22ml/2"}}}},"metadata":{"protocolName":"96_channel_9_0_1_regressions_setup","author":"","description":"PD 9.0.1 regressions: NEST 8 + Flex 20 uL filter/unfiltered tipracks with stacker (p200_96)","source":"Protocol Designer","created":1779484540987,"lastModified":1785344706880}}"""
