import json
from opentrons import protocol_api, types

metadata = {
    "protocolName": "Liquid_Class_96_Channel_Test",
    "description": "This test protocol should cover:\n1. 1:1 Return tip  1000uL \n2. 1:2 Use 1000 \n3. 2:1 Use 200uL \n4. Partial tip 1:1, 1:2, 2:1 \n5. ",
    "created": "2025-12-22T17:54:47.698Z",
    "internalAppBuildDate": "Tue, 16 Dec 2025 16:02:03 GMT",
    "lastModified": "2026-01-05T19:44:38.879Z",
    "protocolDesigner": "8.7.1",
    "source": "Protocol Designer",
}

requirements = {"robotType": "Flex", "apiLevel": "2.27"}

def run(protocol: protocol_api.ProtocolContext) -> None:
    # Load Adapters:
    adapter_1 = protocol.load_adapter(
        "opentrons_flex_96_tiprack_adapter",
        location="D1",
        namespace="opentrons",
        version=1,
    )
    adapter_2 = protocol.load_adapter(
        "opentrons_flex_96_tiprack_adapter",
        location="D2",
        namespace="opentrons",
        version=1,
    )

    # Load Labware:
    tip_rack_1 = protocol.load_labware(
        "opentrons_flex_96_filtertiprack_1000ul",
        location="B3",
        label="Opentrons Flex 96 Filter Tip Rack 1000 µL (1)",
        namespace="opentrons",
        version=1,
    )
    tip_rack_2 = adapter_1.load_labware(
        "opentrons_flex_96_filtertiprack_1000ul",
        label="Opentrons Flex 96 Filter Tip Rack 1000 µL (2)",
        namespace="opentrons",
        version=1,
    )
    tip_rack_3 = adapter_2.load_labware(
        "opentrons_flex_96_tiprack_200ul",
        namespace="opentrons",
        version=1,
    )
    reservoir_1 = protocol.load_labware(
        "opentrons_tough_1_reservoir_300ml",
        location="A1",
        namespace="opentrons",
        version=1,
    )
    well_plate_1 = protocol.load_labware(
        "greiner_384_wellplate_240ul",
        location="C1",
        namespace="opentrons",
        version=1,
    )

    # Load Pipettes:
    pipette = protocol.load_instrument("flex_96channel_1000")

    # Load Waste Chute:
    waste_chute = protocol.load_waste_chute()

    # Define Liquids:
    liquid_1 = protocol.define_liquid(
        "Big Liquid",
        display_color="#ff4f4fff",
    )

    # Load Liquids:
    reservoir_1.load_liquid(
        wells=["A1"],
        liquid=liquid_1,
        volume=123123,
    )

    # PROTOCOL STEPS



DESIGNER_APPLICATION = """{"robot":{"model":"OT-3 Standard"},"designerApplication":{"name":"opentrons/protocol-designer","version":"8.7.0","data":{"pipetteTiprackAssignments":{"529370cd-a145-4747-a03c-b9c3bd051859":["opentrons/opentrons_flex_96_filtertiprack_1000ul/1","opentrons/opentrons_flex_96_tiprack_200ul/1"]},"dismissedWarnings":{"form":[],"timeline":[]},"ingredients":{"0":{"displayName":"Big Liquid","displayColor":"#ff4f4fff","description":null,"liquidGroupId":"0"}},"ingredLocations":{"6f4cc7f5-dfeb-4ff0-b572-984f265a4787:opentrons/opentrons_tough_1_reservoir_300ml/1":{"A1":{"0":{"volume":123123}}}},"savedStepForms":{"__INITIAL_DECK_SETUP_STEP__":{"stepType":"manualIntervention","id":"__INITIAL_DECK_SETUP_STEP__","labwareLocationUpdate":{"88e88167-abb1-4106-bf05-947ea50e9dcf:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":"B3","430b0c4c-c83f-4af2-b017-7ac4c6abcf79:opentrons/opentrons_flex_96_tiprack_adapter/1":"D1","aa261db2-7699-4719-92dd-658254460998:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":"430b0c4c-c83f-4af2-b017-7ac4c6abcf79:opentrons/opentrons_flex_96_tiprack_adapter/1","e7af3dc4-0466-4f8a-882f-d5cc19129ecd:opentrons/opentrons_flex_96_tiprack_adapter/1":"D2","2e6f6ce6-a1cd-4842-9a20-f6cb93bf37c1:opentrons/opentrons_flex_96_tiprack_200ul/1":"e7af3dc4-0466-4f8a-882f-d5cc19129ecd:opentrons/opentrons_flex_96_tiprack_adapter/1","6f4cc7f5-dfeb-4ff0-b572-984f265a4787:opentrons/opentrons_tough_1_reservoir_300ml/1":"A1","5502b5ab-b7ee-4fa1-9963-56decb487425:opentrons/greiner_384_wellplate_240ul/1":"C1"},"pipetteLocationUpdate":{"529370cd-a145-4747-a03c-b9c3bd051859":"left"},"moduleLocationUpdate":{},"moduleStateUpdate":{},"trashBinLocationUpdate":{},"wasteChuteLocationUpdate":{"f76b2bef-8749-45d2-83e0-b98147a392ef:wasteChute":"cutoutD3"},"stagingAreaLocationUpdate":{},"gripperLocationUpdate":{"a4c8f6dd-3889-47db-8977-ddad29968779:gripper":"mounted"}}},"orderedStepIds":[],"pipettes":{"529370cd-a145-4747-a03c-b9c3bd051859":{"pipetteName":"p1000_96"}},"modules":{},"labware":{"88e88167-abb1-4106-bf05-947ea50e9dcf:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 1000 µL (1)","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1"},"430b0c4c-c83f-4af2-b017-7ac4c6abcf79:opentrons/opentrons_flex_96_tiprack_adapter/1":{"displayName":"Opentrons Flex 96 Tip Rack Adapter","labwareDefURI":"opentrons/opentrons_flex_96_tiprack_adapter/1"},"aa261db2-7699-4719-92dd-658254460998:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 1000 µL (2)","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1"},"e7af3dc4-0466-4f8a-882f-d5cc19129ecd:opentrons/opentrons_flex_96_tiprack_adapter/1":{"displayName":"Opentrons Flex 96 Tip Rack Adapter","labwareDefURI":"opentrons/opentrons_flex_96_tiprack_adapter/1"},"2e6f6ce6-a1cd-4842-9a20-f6cb93bf37c1:opentrons/opentrons_flex_96_tiprack_200ul/1":{"displayName":"Opentrons Flex 96 Tip Rack 200 µL","labwareDefURI":"opentrons/opentrons_flex_96_tiprack_200ul/1"},"6f4cc7f5-dfeb-4ff0-b572-984f265a4787:opentrons/opentrons_tough_1_reservoir_300ml/1":{"displayName":"Opentrons Tough 300 mL 1 Well Reservoir","labwareDefURI":"opentrons/opentrons_tough_1_reservoir_300ml/1"},"5502b5ab-b7ee-4fa1-9963-56decb487425:opentrons/greiner_384_wellplate_240ul/1":{"displayName":"Greiner 384 Well Plate 240 µL","labwareDefURI":"opentrons/greiner_384_wellplate_240ul/1"}}}},"metadata":{"protocolName":"Liquid_Class_96_Channel_Test","author":"","description":"This test protocol should cover:\n1. 1:1 Return tip  1000uL \n2. 1:2 Use 1000 \n3. 2:1 Use 200uL \n4. Partial tip 1:1, 1:2, 2:1 \n5. ","source":"Protocol Designer","created":1766426087698,"lastModified":1767642278879}}"""
