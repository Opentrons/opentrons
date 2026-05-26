import json
from opentrons import protocol_api, types

metadata = {
    "protocolName": "96_channel_setup",
    "created": "2026-05-22T21:15:40.987Z",
    "internalAppBuildDate": "Tue, 05 May 2026 15:37:27 GMT",
    "lastModified": "2026-05-22T21:17:28.828Z",
    "protocolDesigner": "8.10.1",
    "source": "Protocol Designer",
}

requirements = {"robotType": "Flex", "apiLevel": "2.28"}

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

    # Load Pipettes:
    pipette = protocol.load_instrument("flex_96channel_1000")

    # Load Waste Chute:
    waste_chute = protocol.load_waste_chute()

    # PROTOCOL STEPS



DESIGNER_APPLICATION = """{"robot":{"model":"OT-3 Standard"},"designerApplication":{"name":"opentrons/protocol-designer","version":"8.10.0","data":{"pipetteTiprackAssignments":{"5ca0d60f-5a45-4147-9828-baff1e4e475e":["opentrons/opentrons_flex_96_filtertiprack_1000ul/1","opentrons/opentrons_flex_96_filtertiprack_200ul/1"]},"dismissedWarnings":{"form":[],"timeline":[]},"ingredients":{},"ingredLocations":{},"savedStepForms":{"__INITIAL_DECK_SETUP_STEP__":{"stepType":"manualIntervention","id":"__INITIAL_DECK_SETUP_STEP__","labwareLocationUpdate":{"c79bf387-4a21-4442-add8-1e7ab6fe1d7b:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":"B3","bf6a3142-e720-421f-85e3-1fe7927f157b:opentrons/opentrons_flex_96_filtertiprack_200ul/1":"52807739-bbb4-43ce-9bfa-a84053f494ab:opentrons/opentrons_flex_96_tiprack_adapter/1","caeb3403-bc36-43f0-ab97-6bc13d35fe83:opentrons/appliedbiosystemsmicroamp_384_wellplate_40ul/3":"A2","52807739-bbb4-43ce-9bfa-a84053f494ab:opentrons/opentrons_flex_96_tiprack_adapter/1":"D2","5ca8fee7-192e-4deb-a93f-6685a7c799b3:opentrons/nest_96_wellplate_2ml_deep/5":"50f97f25-b7f6-4f62-aa30-9eedd11e44f4:magneticBlockType"},"pipetteLocationUpdate":{"5ca0d60f-5a45-4147-9828-baff1e4e475e":"left"},"moduleLocationUpdate":{"4d05b912-3662-45eb-9a8f-04e9ebeb1bf1:flexStackerModuleType":"A4","50f97f25-b7f6-4f62-aa30-9eedd11e44f4:magneticBlockType":"C1"},"moduleStateUpdate":{},"trashBinLocationUpdate":{},"wasteChuteLocationUpdate":{"15048e77-7fe1-4046-bcc3-4f5b58799c4d:wasteChute":"cutoutD3"},"stagingAreaLocationUpdate":{},"gripperLocationUpdate":{"ce89732c-8140-4115-aa2f-4945e96f5e35:gripper":"mounted"}}},"orderedStepIds":[],"pipettes":{"5ca0d60f-5a45-4147-9828-baff1e4e475e":{"pipetteName":"p1000_96"}},"modules":{"4d05b912-3662-45eb-9a8f-04e9ebeb1bf1:flexStackerModuleType":{"model":"flexStackerModuleV1"},"50f97f25-b7f6-4f62-aa30-9eedd11e44f4:magneticBlockType":{"model":"magneticBlockV1"}},"labware":{"c79bf387-4a21-4442-add8-1e7ab6fe1d7b:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 1000 µL","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1"},"bf6a3142-e720-421f-85e3-1fe7927f157b:opentrons/opentrons_flex_96_filtertiprack_200ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 200 µL","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_200ul/1"},"caeb3403-bc36-43f0-ab97-6bc13d35fe83:opentrons/appliedbiosystemsmicroamp_384_wellplate_40ul/3":{"displayName":"Applied Biosystems MicroAmp 384 Well Plate 40 µL","labwareDefURI":"opentrons/appliedbiosystemsmicroamp_384_wellplate_40ul/3"},"52807739-bbb4-43ce-9bfa-a84053f494ab:opentrons/opentrons_flex_96_tiprack_adapter/1":{"displayName":"Opentrons Flex 96 Tip Rack Adapter","labwareDefURI":"opentrons/opentrons_flex_96_tiprack_adapter/1"},"5ca8fee7-192e-4deb-a93f-6685a7c799b3:opentrons/nest_96_wellplate_2ml_deep/5":{"displayName":"NEST 96 Deep Well Plate 2 mL","labwareDefURI":"opentrons/nest_96_wellplate_2ml_deep/5"}}}},"metadata":{"protocolName":"96_channel_setup","author":"","description":"","source":"Protocol Designer","created":1779484540987,"lastModified":1779484648828}}"""
