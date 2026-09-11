import json
from opentrons import protocol_api, types

metadata = {
    "protocolName": "96_channel_setup",
    "created": "2026-05-22T21:15:40.987Z",
    "internalAppBuildDate": "Thu, 04 Jun 2026 21:14:50 GMT",
    "lastModified": "2026-06-05T20:58:58.265Z",
    "protocolDesigner": "9.0.0-alpha.2",
    "source": "Protocol Designer",
}

requirements = {"robotType": "Flex", "apiLevel": "2.29"}

def run(protocol: protocol_api.ProtocolContext) -> None:
    # Load Modules:
    flex_stacker_module_1 = protocol.load_module("flexStackerModuleV1", "A4")
    magnetic_block_1 = protocol.load_module("magneticBlockV1", "C1")

    # Load Adapters:
    adapter_1 = protocol.load_adapter(
        "opentrons_flex_96_tiprack_adapter",
        location="D2",
        namespace="opentrons",
        version=1,
    )

    # Load Labware:
    tip_rack_1 = protocol.load_labware(
        "opentrons_flex_96_filtertiprack_1000ul",
        location="B3",
        namespace="opentrons",
        version=1,
    )
    tip_rack_2 = adapter_1.load_labware(
        "opentrons_flex_96_filtertiprack_200ul",
        namespace="opentrons",
        version=1,
    )
    well_plate_1 = protocol.load_labware(
        "appliedbiosystemsmicroamp_384_wellplate_40ul",
        location="A2",
        namespace="opentrons",
        version=3,
    )
    well_plate_2 = magnetic_block_1.load_labware(
        "nest_96_wellplate_2ml_deep",
        namespace="opentrons",
        version=5,
    )
    tip_rack_3 = protocol.load_labware(
        "opentrons_flex_96_filtertiprack_200ul",
        location=protocol_api.OFF_DECK,
        label="Opentrons Flex 96 Filter Tip Rack 200 µL (1)",
        namespace="opentrons",
        version=1,
    )
    tip_rack_4 = protocol.load_labware(
        "opentrons_flex_96_filtertiprack_200ul",
        location=protocol_api.OFF_DECK,
        label="Opentrons Flex 96 Filter Tip Rack 200 µL (2)",
        namespace="opentrons",
        version=1,
    )
    tip_rack_5 = protocol.load_labware(
        "opentrons_flex_96_filtertiprack_200ul",
        location=protocol_api.OFF_DECK,
        label="Opentrons Flex 96 Filter Tip Rack 200 µL (3)",
        namespace="opentrons",
        version=1,
    )
    tip_rack_6 = protocol.load_labware(
        "opentrons_flex_96_filtertiprack_200ul",
        location=protocol_api.OFF_DECK,
        label="Opentrons Flex 96 Filter Tip Rack 200 µL (4)",
        namespace="opentrons",
        version=1,
    )

    # Load Pipettes:
    pipette = protocol.load_instrument("flex_96channel_1000")

    # Load Waste Chute:
    waste_chute = protocol.load_waste_chute()

    # Set Stored Labware:
    flex_stacker_module_1.set_stored_labware_items(
        labware=[
            tip_rack_3, tip_rack_4, tip_rack_5, tip_rack_6
        ],
    )

    # PROTOCOL STEPS



DESIGNER_APPLICATION = """{"robot":{"model":"OT-3 Standard"},"designerApplication":{"name":"opentrons/protocol-designer","version":"9.0.0","data":{"pipetteTiprackAssignments":{"5ca0d60f-5a45-4147-9828-baff1e4e475e":["opentrons/opentrons_flex_96_filtertiprack_1000ul/1","opentrons/opentrons_flex_96_filtertiprack_200ul/1"]},"dismissedWarnings":{"form":[],"timeline":[]},"ingredients":{},"ingredLocations":{},"savedStepForms":{"__INITIAL_DECK_SETUP_STEP__":{"stepType":"manualIntervention","id":"__INITIAL_DECK_SETUP_STEP__","labwareLocationUpdate":{"c79bf387-4a21-4442-add8-1e7ab6fe1d7b:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":"B3","bf6a3142-e720-421f-85e3-1fe7927f157b:opentrons/opentrons_flex_96_filtertiprack_200ul/1":"52807739-bbb4-43ce-9bfa-a84053f494ab:opentrons/opentrons_flex_96_tiprack_adapter/1","caeb3403-bc36-43f0-ab97-6bc13d35fe83:opentrons/appliedbiosystemsmicroamp_384_wellplate_40ul/3":"A2","52807739-bbb4-43ce-9bfa-a84053f494ab:opentrons/opentrons_flex_96_tiprack_adapter/1":"D2","5ca8fee7-192e-4deb-a93f-6685a7c799b3:opentrons/nest_96_wellplate_2ml_deep/5":"50f97f25-b7f6-4f62-aa30-9eedd11e44f4:magneticBlockType","5022338c-f5a3-49cf-9546-cdc2b72cd825:opentrons/opentrons_flex_96_filtertiprack_200ul/1":"4d05b912-3662-45eb-9a8f-04e9ebeb1bf1:flexStackerModuleType","dac0f38f-720c-4b98-a55a-1b757fc86cf4:opentrons/opentrons_flex_96_filtertiprack_200ul/1":"4d05b912-3662-45eb-9a8f-04e9ebeb1bf1:flexStackerModuleType","6f7c9583-3dfa-4348-861b-61b54fd36585:opentrons/opentrons_flex_96_filtertiprack_200ul/1":"4d05b912-3662-45eb-9a8f-04e9ebeb1bf1:flexStackerModuleType","f8d6e3dc-eed8-4cca-ba85-744df5e42aa7:opentrons/opentrons_flex_96_filtertiprack_200ul/1":"4d05b912-3662-45eb-9a8f-04e9ebeb1bf1:flexStackerModuleType"},"pipetteLocationUpdate":{"5ca0d60f-5a45-4147-9828-baff1e4e475e":"left"},"moduleLocationUpdate":{"4d05b912-3662-45eb-9a8f-04e9ebeb1bf1:flexStackerModuleType":"A4","50f97f25-b7f6-4f62-aa30-9eedd11e44f4:magneticBlockType":"C1"},"moduleStateUpdate":{"4d05b912-3662-45eb-9a8f-04e9ebeb1bf1:flexStackerModuleType":{"type":"flexStackerModuleType","storedLabwareDetails":{"primaryLabwareURI":"opentrons/opentrons_flex_96_filtertiprack_200ul/1","adapterLabwareURI":null,"lidLabwareURI":null},"labwareInHopper":[{"primaryLabwareId":"5022338c-f5a3-49cf-9546-cdc2b72cd825:opentrons/opentrons_flex_96_filtertiprack_200ul/1","adapterLabwareId":null,"lidLabwareId":null},{"primaryLabwareId":"dac0f38f-720c-4b98-a55a-1b757fc86cf4:opentrons/opentrons_flex_96_filtertiprack_200ul/1","adapterLabwareId":null,"lidLabwareId":null},{"primaryLabwareId":"6f7c9583-3dfa-4348-861b-61b54fd36585:opentrons/opentrons_flex_96_filtertiprack_200ul/1","adapterLabwareId":null,"lidLabwareId":null},{"primaryLabwareId":"f8d6e3dc-eed8-4cca-ba85-744df5e42aa7:opentrons/opentrons_flex_96_filtertiprack_200ul/1","adapterLabwareId":null,"lidLabwareId":null}],"labwareOnShuttle":null,"setStoredLabwareCount":1,"fillCount":1}},"trashBinLocationUpdate":{},"wasteChuteLocationUpdate":{"15048e77-7fe1-4046-bcc3-4f5b58799c4d:wasteChute":"cutoutD3"},"stagingAreaLocationUpdate":{},"gripperLocationUpdate":{"ce89732c-8140-4115-aa2f-4945e96f5e35:gripper":"mounted"}}},"orderedStepIds":[],"pipettes":{"5ca0d60f-5a45-4147-9828-baff1e4e475e":{"pipetteName":"p1000_96"}},"modules":{"4d05b912-3662-45eb-9a8f-04e9ebeb1bf1:flexStackerModuleType":{"model":"flexStackerModuleV1"},"50f97f25-b7f6-4f62-aa30-9eedd11e44f4:magneticBlockType":{"model":"magneticBlockV1"}},"labware":{"c79bf387-4a21-4442-add8-1e7ab6fe1d7b:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 1000 µL","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1"},"bf6a3142-e720-421f-85e3-1fe7927f157b:opentrons/opentrons_flex_96_filtertiprack_200ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 200 µL","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_200ul/1"},"caeb3403-bc36-43f0-ab97-6bc13d35fe83:opentrons/appliedbiosystemsmicroamp_384_wellplate_40ul/3":{"displayName":"Applied Biosystems MicroAmp 384 Well Plate 40 µL","labwareDefURI":"opentrons/appliedbiosystemsmicroamp_384_wellplate_40ul/3"},"52807739-bbb4-43ce-9bfa-a84053f494ab:opentrons/opentrons_flex_96_tiprack_adapter/1":{"displayName":"Opentrons Flex 96 Tip Rack Adapter","labwareDefURI":"opentrons/opentrons_flex_96_tiprack_adapter/1"},"5ca8fee7-192e-4deb-a93f-6685a7c799b3:opentrons/nest_96_wellplate_2ml_deep/5":{"displayName":"NEST 96 Deep Well Plate 2 mL","labwareDefURI":"opentrons/nest_96_wellplate_2ml_deep/5"},"5022338c-f5a3-49cf-9546-cdc2b72cd825:opentrons/opentrons_flex_96_filtertiprack_200ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 200 µL (1)","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_200ul/1"},"dac0f38f-720c-4b98-a55a-1b757fc86cf4:opentrons/opentrons_flex_96_filtertiprack_200ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 200 µL (2)","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_200ul/1"},"6f7c9583-3dfa-4348-861b-61b54fd36585:opentrons/opentrons_flex_96_filtertiprack_200ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 200 µL (3)","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_200ul/1"},"f8d6e3dc-eed8-4cca-ba85-744df5e42aa7:opentrons/opentrons_flex_96_filtertiprack_200ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 200 µL (4)","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_200ul/1"}}}},"metadata":{"protocolName":"96_channel_setup","author":"","description":"","source":"Protocol Designer","created":1779484540987,"lastModified":1780693138265}}"""